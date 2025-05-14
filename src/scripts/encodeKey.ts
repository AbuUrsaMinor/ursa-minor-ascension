#!/usr/bin/env node
/// <reference types="node" />
import { encodeConnectionKey } from '../lib/azure';

const endpoint = process.argv[2];
const apiKey = process.argv[3];

if (!endpoint || !apiKey) {
    console.error('Usage: npm run encode-key <endpoint> <apiKey>');
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
