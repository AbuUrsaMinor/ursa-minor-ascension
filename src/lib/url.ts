// Helper functions for URL management

/**
 * Generates a shareable URL with the connection key embedded as a parameter
 * @param key The raw connection key (will be encoded)
 * @param baseUrl Optional base URL, defaults to current window location
 * @returns Full URL with the key as a parameter
 */
export function generateShareableUrl(key: string, baseUrl?: string): string {
    try {
        // Use the provided base URL or the current window location
        const url = new URL(baseUrl || window.location.href);

        // Clear any existing query parameters
        url.search = '';

        // Add the key as a parameter
        url.searchParams.set('key', key);

        return url.toString();
    } catch (error) {
        console.error("Error generating shareable URL:", error);
        return window.location.href;
    }
}

/**
 * Parse the URL parameters from both query string and hash parameters
 */
export function getUrlParams() {
    // First try regular URL parameters (for direct access)
    const searchParams = new URLSearchParams(window.location.search);

    // For hash router, the format is like #/path?key=value
    let hashParams = new URLSearchParams();
    const hashParts = window.location.hash.split('?');
    if (hashParts.length > 1) {
        hashParams = new URLSearchParams(hashParts[1]);
    }

    return {
        key: searchParams.get('key') || hashParams.get('key') || null
    };
}
