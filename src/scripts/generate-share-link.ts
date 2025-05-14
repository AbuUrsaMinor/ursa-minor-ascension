// Helper script to generate shareable URLs with Base64-encoded JSON connection keys
import { encodeConnectionKey } from '../lib/azure';

/**
 * This script creates a shareable URL with an encoded connection key for the Ursa Minor Ascension app.
 * 
 * You can run this script with:
 * npm run share-link -- YOUR_ENDPOINT YOUR_API_KEY [APP_URL]
 * 
 * Example:
 * npm run share-link -- https://example-openai.azure.com your-api-key
 * 
 * If APP_URL is not provided, it will default to the production deployment URL.
 */

// Production deployment URL for the application
const DEFAULT_APP_URL = "https://abuursaminor.github.io/ursa-minor-ascension";

// Get endpoint, key, and optional app URL from command line arguments
const endpoint = process.argv[2];
const apiKey = process.argv[3];
const appUrl = process.argv[4] || DEFAULT_APP_URL;

// Check if required arguments are provided
if (!endpoint || !apiKey) {
    console.log("\nUsage: npm run share-link -- YOUR_ENDPOINT YOUR_API_KEY [APP_URL]");
    console.log("\nExample:");
    console.log(`npm run share-link -- https://example-openai.azure.com your-api-key ${DEFAULT_APP_URL}`);
    console.log("\nParameters:");
    console.log("  YOUR_ENDPOINT  - Your Azure OpenAI API endpoint (e.g., https://example-openai.azure.com)");
    console.log("  YOUR_API_KEY   - Your Azure OpenAI API key");
    console.log("  APP_URL        - (Optional) The URL of your deployed app");
    process.exit(1);
}

try {
    // Create the Base64-encoded JSON connection key
    const encodedKey = encodeConnectionKey({
        endpoint,
        apiKey
    });

    // Base URL with no trailing slash
    const baseUrl = appUrl.replace(/\/$/, '');

    // Create the shareable URL with the key as a parameter
    const shareableUrl = `${baseUrl}/?key=${encodeURIComponent(encodedKey)}`;

    console.log("\n=== Base64-encoded Connection Key ===");
    console.log(encodedKey);

    console.log("\n=== Shareable URL ===");
    console.log(shareableUrl);

    console.log("\nThis URL contains an encoded connection key that will automatically configure");
    console.log("the application when opened. Share it only with trusted individuals.");
} catch (error) {
    console.error("\nError generating shareable URL:", error);
    process.exit(1);
}
