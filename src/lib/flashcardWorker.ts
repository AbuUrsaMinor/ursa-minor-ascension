import type { FlashCard, FlashCardGenerationStatus, Series } from '../types/index';
import type { AzureConfig } from './azure';
import { estimateFlashCardCount, FlashCardRequest, generateFlashCards } from './flashcardGenerator';

export interface FlashCardWorkerMessage {
    type: 'generate' | 'estimate';
    series: Series;
    config: AzureConfig;
    request?: FlashCardRequest;
}

export interface FlashCardWorkerResponse {
    type: 'status' | 'complete' | 'error' | 'estimate';
    status?: FlashCardGenerationStatus;
    flashcards?: FlashCard[];
    error?: string;
    estimatedCount?: number;
}

// This code will run in a web worker context
export function createFlashCardWorker() {
    let status: FlashCardGenerationStatus = {
        status: 'idle'
    };

    // Function to update status and send message to main thread
    function updateStatus(
        newStatus: FlashCardGenerationStatus['status'],
        progress?: number,
        total?: number,
        error?: string
    ) {
        status = {
            status: newStatus,
            progress,
            total,
            error
        };

        self.postMessage({
            type: 'status',
            status
        } as FlashCardWorkerResponse);
    }

    // Handle messages from main thread
    self.addEventListener('message', async (event: MessageEvent<FlashCardWorkerMessage>) => {
        const { type, series, config, request } = event.data;

        try {
            if (type === 'estimate') {
                updateStatus('estimating');

                try {
                    const estimatedCount = await estimateFlashCardCount(series, config);
                    self.postMessage({
                        type: 'estimate',
                        estimatedCount
                    } as FlashCardWorkerResponse);
                } catch (error) {
                    self.postMessage({
                        type: 'error',
                        error: error instanceof Error ? error.message : 'Failed to estimate flash card count'
                    } as FlashCardWorkerResponse);
                }
            } else if (type === 'generate' && request) {
                updateStatus('generating', 0, 1);

                try {
                    const flashcards = await generateFlashCards(
                        series,
                        config,
                        request,
                        (progress, total, message) => {
                            updateStatus('generating', progress, total);
                            console.log(`Flash card generation: ${progress}/${total} - ${message}`);
                        }
                    );

                    // Send complete status
                    self.postMessage({
                        type: 'complete',
                        flashcards
                    } as FlashCardWorkerResponse);

                    // Update final status
                    updateStatus('complete');
                } catch (error) {
                    updateStatus('error', undefined, undefined, error instanceof Error ? error.message : 'Unknown error');

                    self.postMessage({
                        type: 'error',
                        error: error instanceof Error ? error.message : 'Failed to generate flash cards'
                    } as FlashCardWorkerResponse);
                }
            }
        } catch (error) {
            console.error('Error in flash card worker:', error);

            self.postMessage({
                type: 'error',
                error: error instanceof Error ? error.message : 'Unknown error in flash card worker'
            } as FlashCardWorkerResponse);
        }
    });
}

// Export a function to initialize the worker
export function initFlashCardWorker() {
    // Instead of trying to stringify the AzureConfig type, we'll use the Web Worker
    // module approach that's more reliable

    // The worker file is already set up in workers/flashCardWorker.js
    return new URL('../workers/flashCardWorker.js', import.meta.url).href;
}
