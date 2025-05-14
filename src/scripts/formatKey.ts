// Helper script to format Azure OpenAI API keys
import { encodeConnectionKey } from '../lib/azure';

/**
 * This script creates connection keys for the Ursa Minor Ascension app.
 * 
 * You can run this script with:
 * npx tsx src/scripts/formatKey.ts YOUR_ENDPOINT YOUR_API_KEY
 * 
 * Example:
 * npx tsx src/scripts/formatKey.ts https://example-openai.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview YOUR_API_KEY
 */

function createConnectionString(endpoint: string, key: string): string {
    return `target-uri: ${endpoint}\nkey: ${key}`;
}

// Get endpoint and key from command line arguments
const endpoint = process.argv[2] || "https://example-openai.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview";
const key = process.argv[3] || "YOUR_API_KEY_HERE";

if (process.argv.length < 4 && (endpoint.includes("example") || key.includes("YOUR_API_KEY"))) {
    console.log("Usage: npx tsx src/scripts/formatKey.ts YOUR_ENDPOINT YOUR_API_KEY");
    console.log("\nExample:");
    console.log("npx tsx src/scripts/formatKey.ts https://example-openai.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview your-api-key");
    console.log("\nRunning with example values (replace with your actual values):");
}

const formattedKey = createConnectionString(endpoint, key);
console.log("\n=== Connection String Format (Copy this to paste in the app) ===");
console.log(formattedKey);

// Create URL parameter format
const urlParam = `?key=${encodeURIComponent(formattedKey)}`;
console.log("\n=== URL Parameter Format (Append to app URL for direct access) ===");
console.log(urlParam);

// Legacy format (base64 encoded JSON)
// Extract the base URL from the endpoint
const baseUrl = new URL(endpoint).origin;
const legacyFormat = encodeConnectionKey({
    endpoint: baseUrl,
    apiKey: key
});

console.log("\n=== Legacy Format (base64) ===");
console.log(legacyFormat);

console.log("\n=== Complete Shareable URL (Replace with your app's URL) ===");
console.log(`https://your-app-url.com/${urlParam}`);
