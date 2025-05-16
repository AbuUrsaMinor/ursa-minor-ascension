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
    config: AzureConfig
): Promise<{ text: string; metadata: Record<string, any> }> {
    try {
        // Extract deployment name and API version from the endpoint if included
        // If not included, use default values (gpt-4 and 2024-10-21)
        let deployment = "gpt-4";
        const apiVersion = "2024-10-21";

        // Create the Azure OpenAI client
        const client = new AzureOpenAI({
            apiKey: config.apiKey,
            endpoint: config.endpoint,
            deployment,
            apiVersion,
            dangerouslyAllowBrowser: true // Required for browser environments
        });

        console.log("Using Azure OpenAI client with endpoint:", config.endpoint);

        try {
            // Use the beta client with zodResponseFormat helper for structured output
            const result = await client.beta.chat.completions.parse({
                model: deployment,
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
                max_tokens: 16384,
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
                model: deployment,
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
export async function decodeConnectionKey(connectionString: string): Promise<AzureConfig> {
    try {
        // Parse the base64-encoded JSON string
        const jsonStr = atob(connectionString);
        const config = JSON.parse(jsonStr);

        if (!config.endpoint || !config.apiKey) {
            throw new Error("Invalid connection key format: missing endpoint or apiKey");
        }

        console.log("Decoded connection key successfully");
        return config;
    } catch (error) {
        console.error("Failed to decode connection key:", error);
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
