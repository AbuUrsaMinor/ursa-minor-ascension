interface AzureConfig {
    endpoint: string;
    apiKey: string;
}

interface ImageMessage {
    type: "image_url";
    image_url: {
        url: string;
    };
}

interface TextMessage {
    type: "text";
    text: string;
}

type Message = ImageMessage | TextMessage;

export async function analyzeImage(
    imageBase64: string,
    config: AzureConfig
): Promise<{ text: string; metadata: Record<string, any> }> {
    const messages: Message[] = [
        {
            type: "text",
            text: "Please analyze this textbook page and extract: 1) verbatim text, 2) alt-text descriptions for any figures, and 3) metadata (page number, chapter, book title if visible)."
        },
        {
            type: "image_url",
            image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
            }
        }
    ];

    // Construct the API endpoint URL
    // This handles both formats of the endpoint
    // 1. Full URL with deployment name and API version
    // 2. Base URL that needs the deployment path appended
    let apiUrl = config.endpoint;
    if (!apiUrl.includes('/deployments/')) {
        // If it's a base URL, append the deployment path
        apiUrl = `${apiUrl}/openai/deployments/gpt-4/chat/completions?api-version=2024-10-21`;
    }

    console.log("Using API URL:", apiUrl);
    
    const response = await fetch(
        apiUrl,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": config.apiKey,
            },
            body: JSON.stringify({
                messages,
                temperature: 0,
                max_tokens: 16384,
            }),
        }
    ); if (!response.ok) {
        let errorDetail = '';
        let errorMessage = `Azure API error: ${response.status} ${response.statusText}`;

        try {
            const errorJson = await response.json();
            errorDetail = errorJson.error?.message || errorJson.message || '';

            if (errorDetail) {
                errorMessage += `. ${errorDetail}`;
            }

            // Add more specific error messages based on status codes
            if (response.status === 401) {
                errorMessage += '. Please check your API key.';
            } else if (response.status === 403) {
                errorMessage += '. Your API key might not have permission for this operation.';
            } else if (response.status === 429) {
                errorMessage += '. Rate limit exceeded. Please try again later.';
            } else if (response.status >= 500) {
                errorMessage += '. There might be an issue with the Azure service. Please try again later.';
            }
        } catch {
            // Couldn't parse error as JSON
            if (response.status === 401) {
                errorMessage += ' Please check your API key.';
            }
        }

        throw new Error(errorMessage);
    }

    // Handle the case where the API might return a 200 but with an error in the response
    let result;
    try {
        result = await response.json() as any;
    } catch (err) {
        throw new Error('Failed to parse API response');
    }

    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
        throw new Error('Invalid response format from Azure API');
    }

    const content = result.choices[0].message.content;    // Parse the content into text and metadata
    try {
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
        // If metadata extraction fails, return the raw content
        console.warn('Failed to extract metadata:', err);
        return {
            text: content,
            metadata: { rawContent: content }
        };
    }
}

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
