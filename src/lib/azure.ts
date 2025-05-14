import { AzureOpenAI } from "openai";

export interface AzureConfig {
    endpoint: string;
    apiKey: string;
}

/**
 * Analyzes an image using Azure OpenAI GPT-4 Vision
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
        const apiVersion = "2024-10-21";        // Create the Azure OpenAI client
        const client = new AzureOpenAI({
            apiKey: config.apiKey,
            endpoint: config.endpoint,
            deployment,
            apiVersion,
            dangerouslyAllowBrowser: true // Required for browser environments
        });

        console.log("Using Azure OpenAI client with endpoint:", config.endpoint);

        // Call Azure OpenAI service using the SDK
        try {
            const response = await client.chat.completions.create({
                model: deployment,
                messages: [
                    {
                        role: "system",
                        content: "You are a skilled assistant that analyzes images of textbook pages. Extract: 1) verbatim text, 2) alt-text descriptions for any figures, and 3) metadata (page number, chapter, book title if visible)."
                    },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Please analyze this textbook page." },
                            {
                                type: "image_url",
                                image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
                            }
                        ]
                    }
                ],
                temperature: 0,
                max_tokens: 16384,
            });

            // Process the response
            if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
                throw new Error('Invalid response format from Azure OpenAI API');
            }

            const content = response.choices[0].message.content || '';

            if (!content) {
                throw new Error('No content received from Azure OpenAI API');
            }

            // Parse the content into text and metadata
            // Try to extract structured information from the content
            const pageNumberMatch = content.match(/Page (\d+)/i) || content.match(/p\. (\d+)/i);
            const chapterMatch = content.match(/Chapter (\d+|[IVX]+)/i);
            const bookTitleMatch = content.match(/Title: (.*?)(?:\n|$)/i) || content.match(/Book: (.*?)(?:\n|$)/i);

            // Extract figure descriptions
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

            return {
                text: content,
                metadata: {
                    pageNumber: pageNumberMatch ? pageNumberMatch[1] : undefined,
                    chapter: chapterMatch ? chapterMatch[1] : undefined,
                    bookTitle: bookTitleMatch ? bookTitleMatch[1] : undefined,
                    figures: figures.length > 0 ? figures : undefined,
                    rawContent: content
                }
            };
        } catch (err) {
            // Handle SDK-specific errors
            console.error('Azure OpenAI API error:', err);

            let errorMessage = 'Azure OpenAI API error';
            if (err instanceof Error) {
                errorMessage = err.message;
            }

            // Check for common error patterns
            if (typeof errorMessage === 'string') {
                if (errorMessage.includes('401') || errorMessage.includes('authentication')) {
                    errorMessage += '. Please check your API key.';
                } else if (errorMessage.includes('403') || errorMessage.includes('permission')) {
                    errorMessage += '. Your API key might not have permission for this operation.';
                } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
                    errorMessage += '. Rate limit exceeded. Please try again later.';
                } else if (errorMessage.includes('500') || errorMessage.includes('502') ||
                    errorMessage.includes('503') || errorMessage.includes('504')) {
                    errorMessage += '. There might be an issue with the Azure service. Please try again later.';
                }
            }

            throw new Error(errorMessage);
        }
    } catch (err) {
        // If metadata extraction fails, or any other error
        console.warn('Failed to analyze image:', err);
        throw err;
    }
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
