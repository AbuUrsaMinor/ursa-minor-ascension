// This script generates a connection key based on the provided URI and API key
// It prints the key in the format required by the app

const uri = "https://infra-copilot-dev-openai.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview";
const key = "6f63583003ac42f49b17a660f2bcdca0";

// Format as a connection string
const connectionKey = `target-uri: ${uri}\nkey: ${key}`;

console.log("\n=== CONNECTION KEY ===\n");
console.log(connectionKey);
console.log("\n====================\n");

// Generate a shareable link with the key as a URL parameter
const baseUrl = "https://your-app-url.com";
const encodedKey = encodeURIComponent(connectionKey);
const shareableLink = `${baseUrl}/?key=${encodedKey}`;

console.log("Shareable link:");
console.log(shareableLink);
console.log("\nCopy and share this link to provide access to the application with this key.");
