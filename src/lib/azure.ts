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
    ]; const response = await fetch(
        `${config.endpoint}/openai/deployments/gpt-4/chat/completions?api-version=2024-10-21`,
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
    );

    if (!response.ok) {
        throw new Error(`Azure API error: ${response.status} ${response.statusText}`);
    } const result = await response.json() as any;
    const content = result.choices[0].message.content;

    // Parse the content into text and metadata
    // This is a simple implementation - you might want to add more structure
    return {
        text: content,
        metadata: {} // Add metadata parsing logic
    };
}

export async function decodeConnectionKey(base64Key: string): Promise<AzureConfig> {
    try {
        const jsonStr = atob(base64Key);
        const config = JSON.parse(jsonStr);

        if (!config.endpoint || !config.apiKey) {
            throw new Error("Invalid connection key format");
        }

        return config;
    } catch (error) {
        throw new Error("Failed to decode connection key");
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
