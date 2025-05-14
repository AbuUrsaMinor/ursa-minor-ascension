#!/usr/bin/env node
/// <reference types="node" />
import { encodeConnectionKey } from '../lib/azure';

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_KEY;

if (!endpoint || !apiKey) {
    console.error('Error: Missing required environment variables.');
    console.error('Please set both AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_KEY environment variables.');
    process.exit(1);
}

try {
    const encodedKey = encodeConnectionKey({ endpoint, apiKey });
    console.log('Encoded connection key:');
    console.log(encodedKey);
} catch (error: unknown) {
    console.error('Error encoding key:', error instanceof Error ? error.message : String(error));
    process.exit(1);
}
