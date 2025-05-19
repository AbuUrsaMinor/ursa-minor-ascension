import type { AzureConfig } from '../lib/azure';
import type { FlashCardRequest } from '../lib/flashcards/flashcardGenerator';
import type { FlashCard, FlashCardGenerationStatus, Series } from '../types/index';

export interface FlashCardWorkerMessage {
    type: 'generate' | 'estimate';
    series: Series;
    config: AzureConfig;
    request?: FlashCardRequest; // Optional for estimate
}

export interface FlashCardWorkerResponse {
    type: 'status' | 'complete' | 'error' | 'estimate';
    status?: FlashCardGenerationStatus;
    flashcards?: FlashCard[];
    error?: string;
    estimatedCount?: number;
}

// This declares the worker module to TypeScript
declare module '*.js' {
    const worker: new () => Worker;
    export default worker;
}
