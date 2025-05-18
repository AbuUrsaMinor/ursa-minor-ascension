import { AzureOpenAI } from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export interface AzureConfig {
    endpoint: string;
    apiKey: string;
}

// Define schema for structured output using Zod
const TextbookPageSchema = z.object({
    text: z.string().describe("A verbatim, HTML representation of the page, including captions/descriptions of images"),
    page: z.string().optional().describe("The page number, if available"),
    chapter_name: z.string().optional().describe("The chapter name, if available"),
    title: z.string().optional().describe("The book title, if available"),
    figures: z.array(z.object({
        number: z.string().optional().describe("Figure number if available"),
        description: z.string().describe("Detailed description of the figure content")
    })).optional().describe("Descriptions of any figures on the page"),
    error: z.boolean().optional().describe("Flag to indicate if there was an error extracting text from the image")
});

export type TextbookPageData = z.infer<typeof TextbookPageSchema>;

// Convert Zod schema to JSON Schema for OpenAI structured outputs (legacy approach)
const textbookPageJsonSchema = zodToJsonSchema(TextbookPageSchema, { target: "openApi3" });

/**
 * Extract figure descriptions from content using regex
 */
function extractFigureDescriptions(content: string): Array<{ number: string, description: string }> {
    const figures = [];
    const figureMatches = content.matchAll(/Figure (\d+)(?:[.:])?\s*(.*?)(?:\n\n|\n(?=Figure)|\n$)/gis);

    for (const match of figureMatches) {
        if (match && match[2]) {
            figures.push({
                number: match[1],
                description: match[2].trim()
            });
        }
    }

    return figures;
}

/**
 * Analyzes an image using Azure OpenAI GPT-4 Vision with structured output
 * 
 * @param imageBase64 - Base64 encoded image data
 * @param config - Azure configuration with endpoint and apiKey
 * @returns Analysis with extracted text and metadata
 */
export async function analyzeImage(
    imageBase64: string,
    config: AzureConfig & { extractedDeployment?: string, extractedApiVersion?: string, baseEndpoint?: string }
): Promise<{ text: string; metadata: Record<string, any> }> {
    try {
        // Extract deployment name and API version from the enhanced config or use defaults
        let deployment = config.extractedDeployment || "gpt-4"; // Use extracted value or default
        let apiVersion = config.extractedApiVersion || "2024-05-01"; // Use extracted value or default
        let baseEndpoint = config.baseEndpoint || config.endpoint; // Use pre-extracted base endpoint if available

        // Only parse the URL if we don't already have the extracted values
        if (!config.extractedDeployment || !config.extractedApiVersion || !config.baseEndpoint) {
            try {
                const url = new URL(config.endpoint);

                // Check if the endpoint URL contains deployment information (if not already extracted)
                if (!config.extractedDeployment) {
                    const pathParts = url.pathname.split('/');
                    const deploymentIndex = pathParts.findIndex(part => part === 'deployments');

                    if (deploymentIndex >= 0 && deploymentIndex + 1 < pathParts.length) {
                        deployment = pathParts[deploymentIndex + 1];
                        console.log("Extracted deployment from URL:", deployment);
                    }
                }

                // Extract API version from query parameters if available (if not already extracted)
                if (!config.extractedApiVersion) {
                    const apiVersionParam = url.searchParams.get('api-version');
                    if (apiVersionParam) {
                        apiVersion = apiVersionParam;
                        console.log("Extracted API version from URL:", apiVersion);
                    }
                }

                // Use the base endpoint (without the path to deployments) if not already available
                if (!config.baseEndpoint) {
                    baseEndpoint = url.origin;
                }
            } catch (urlError) {
                console.warn("Failed to parse endpoint URL for deployment and API version:", urlError);
                // Continue with default values if URL parsing fails
            }
        } else {
            console.log("Using pre-extracted values - Deployment:", deployment, "API Version:", apiVersion);
        }

        // Create the Azure OpenAI client
        const client = new AzureOpenAI({
            apiKey: config.apiKey,
            endpoint: baseEndpoint,
            deployment,
            apiVersion,
            dangerouslyAllowBrowser: true // Required for browser environments
        });

        console.log("Using Azure OpenAI client with endpoint:", config.endpoint);

        try {
            // Use the beta client with zodResponseFormat helper for structured output
            const result = await client.beta.chat.completions.parse({
                model: deployment, // Use deployment variable
                messages: [
                    {
                        role: "system",
                        content: `You are a skilled assistant that analyzes images of textbook pages. 
                        Extract all text content from the page verbatim, and provide any metadata available such as page numbers, 
                        chapter names, and book titles. Also identify and describe all figures, tables, and images on the page.
                        If you cannot extract meaningful text from the image, set the error flag to true.`
                    },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Please analyze this textbook page and provide the information in the structured format." },
                            {
                                type: "image_url",
                                image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
                            }
                        ]
                    }
                ],
                temperature: 0,
                max_tokens: 16384, // Consider reviewing if this high limit is always necessary for typical inputs.
                response_format: zodResponseFormat(TextbookPageSchema, "textbookPage")
            });

            // Process the response
            const message = result.choices[0]?.message;

            if (!message) {
                throw new Error('Invalid response from Azure OpenAI API');
            }

            if (message.parsed) {
                // We have the validated data now with automatic schema validation
                const validatedData = message.parsed;

                // Check if text is empty
                const hasNoText = !validatedData.text || validatedData.text.trim().length === 0;

                // Return the extracted data in the expected format
                return {
                    text: validatedData.text,
                    metadata: {
                        pageNumber: validatedData.page,
                        chapter: validatedData.chapter_name,
                        bookTitle: validatedData.title,
                        figures: validatedData.figures || [],
                        // Include error flag based on either explicit error or empty text
                        error: validatedData.error === true || hasNoText
                    }
                };
            } else if (message.refusal) {
                // Handle refusal cases
                console.warn("The model refused to process the request:", message.refusal);
                throw new Error(`The model refused to process the request: ${message.refusal}`);
            } else {
                // Handle other cases where we didn't get structured data
                console.warn("No parsed data available from the response");

                // Fall back to text parsing if we have content
                if (message.content) {
                    return fallbackTextParsing(message.content);
                }

                throw new Error('No usable content received from Azure OpenAI API');
            }
        } catch (parseErr) {
            // Attempt to use the legacy approach if the beta approach fails
            console.error("Error with beta structured output:", parseErr);
            console.log("Falling back to legacy approach...");

            // Call Azure OpenAI service using the SDK with structured output (legacy approach)
            const response = await client.chat.completions.create({
                model: deployment, // Use deployment variable
                messages: [
                    {
                        role: "system",
                        content: `You are a skilled assistant that analyzes images of textbook pages. 
                        Extract the following information in a structured format following this JSON schema:
                        ${JSON.stringify(textbookPageJsonSchema, null, 2)}
                        
                        Always provide output exactly according to this schema.
                        If you cannot extract meaningful text from the image, set the error flag to true.`
                    },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Please analyze this textbook page and provide the information in the structured format." },
                            {
                                type: "image_url",
                                image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
                            }
                        ]
                    }
                ],
                temperature: 0,
                max_tokens: 16384,
                response_format: { type: "json_object" }
            });

            // Process the response
            if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
                throw new Error('Invalid response format from Azure OpenAI API');
            }

            const content = response.choices[0].message.content || '';

            if (!content) {
                throw new Error('No content received from Azure OpenAI API');
            }

            try {
                // Parse the JSON response
                const parsedData = JSON.parse(content);

                // Validate against the schema
                const validationResult = TextbookPageSchema.safeParse(parsedData);

                if (!validationResult.success) {
                    console.warn("Response didn't match expected schema:", validationResult.error);

                    // Fall back to text parsing method
                    return fallbackTextParsing(content);
                }

                const validatedData = validationResult.data;

                // Check if text is empty
                const hasNoText = !validatedData.text || validatedData.text.trim().length === 0;

                // Return with error flag if appropriate
                return {
                    text: validatedData.text,
                    metadata: {
                        pageNumber: validatedData.page,
                        chapter: validatedData.chapter_name,
                        bookTitle: validatedData.title,
                        figures: validatedData.figures || [],
                        rawContent: content,
                        error: validatedData.error === true || hasNoText
                    }
                };
            } catch (jsonErr) {
                console.error("Error parsing structured output:", jsonErr);
                // Fall back to text parsing method if JSON parsing fails
                return fallbackTextParsing(content);
            }
        }
    } catch (err) {
        // If metadata extraction fails, or any other error
        console.warn('Failed to analyze image:', err);
        throw err;
    }
}

/**
 * Fallback method that parses content using regex when structured output fails
 */
function fallbackTextParsing(content: string): { text: string; metadata: Record<string, any> } {
    // Parse the content into text and metadata using regex
    // Consider thorough testing of these regex patterns with diverse inputs
    const pageNumberMatch = content.match(/Page (\d+)/i) || content.match(/p\. (\d+)/i);
    const chapterMatch = content.match(/Chapter (\d+|[IVX]+)/i);
    const bookTitleMatch = content.match(/Title: (.*?)(?:\n|$)/i) || content.match(/Book: (.*?)(?:\n|$)/i);

    // Extract figure descriptions
    const figures = extractFigureDescriptions(content);

    // Check if text is minimal or meaningless
    const hasNoText = !content || content.trim().length < 10;

    return {
        text: content,
        metadata: {
            pageNumber: pageNumberMatch ? pageNumberMatch[1] : undefined,
            chapter: chapterMatch ? chapterMatch[1] : undefined,
            bookTitle: bookTitleMatch ? bookTitleMatch[1] : undefined,
            figures: figures.length > 0 ? figures : undefined,
            rawContent: content,
            error: hasNoText
        }
    };
}

/**
 * Decodes a base64 connection key into an AzureConfig object
 * 
 * @param connectionString - Base64 encoded connection string
 * @returns AzureConfig object with endpoint and apiKey
 */
export async function decodeConnectionKey(connectionString: string): Promise<AzureConfig & { extractedDeployment?: string, extractedApiVersion?: string }> {
    try {
        // Parse the base64-encoded JSON string
        const jsonStr = atob(connectionString);
        const parsedJson = JSON.parse(jsonStr);

        // Define a Zod schema for AzureConfig to validate the parsed JSON
        const AzureConfigValidationSchema = z.object({
            endpoint: z.string().url({ message: "Invalid endpoint URL" }),
            apiKey: z.string().min(1, { message: "API key cannot be empty" })
        });

        const validationResult = AzureConfigValidationSchema.safeParse(parsedJson);

        if (!validationResult.success) {
            console.error("Invalid connection key format:", validationResult.error.flatten().fieldErrors);
            const errorMessages = Object.values(validationResult.error.flatten().fieldErrors).flat().join(', ');
            throw new Error(`Invalid connection key format: ${errorMessages || "Validation failed."}`);
        }

        const config = validationResult.data;
        const enhancedConfig: AzureConfig & {
            extractedDeployment?: string;
            extractedApiVersion?: string;
            baseEndpoint?: string;
        } = { ...config };

        // Try to extract deployment and API version from the endpoint URL
        try {
            const url = new URL(config.endpoint);

            // Check if the endpoint URL contains deployment information
            const pathParts = url.pathname.split('/');
            const deploymentIndex = pathParts.findIndex(part => part === 'deployments');

            if (deploymentIndex >= 0 && deploymentIndex + 1 < pathParts.length) {
                enhancedConfig.extractedDeployment = pathParts[deploymentIndex + 1];
            }

            // Extract API version from query parameters if available
            const apiVersionParam = url.searchParams.get('api-version');
            if (apiVersionParam) {
                enhancedConfig.extractedApiVersion = apiVersionParam;
            }

            // Store the base endpoint (without the path to deployments)
            enhancedConfig.baseEndpoint = url.origin;
        } catch (urlError) {
            console.warn("Failed to parse endpoint URL for deployment and API version:", urlError);
            // Continue without extracted values if URL parsing fails
        }

        console.log("Decoded connection key successfully");
        return enhancedConfig;
    } catch (error) {
        console.error("Failed to decode connection key:", error);
        // Ensure the thrown error is an Error instance
        if (error instanceof Error) {
            throw new Error(`Failed to decode connection key. ${error.message}`);
        }
        throw new Error("Failed to decode connection key. Please check the format.");
    }
}

/**
 * Encodes an AzureConfig object into a base64 connection key
 * 
 * @param config - AzureConfig object with endpoint and apiKey
 * @returns Base64 encoded connection string
 */
export function encodeConnectionKey(config: AzureConfig): string {
    try {
        if (!config.endpoint || !config.apiKey) {
            throw new Error("Missing required configuration");
        }

        const jsonStr = JSON.stringify(config);
        return btoa(jsonStr);
    } catch (error) {
        throw new Error("Failed to encode connection key");
    }
}
