// filepath: c:\Users\A550191\git\ursa-minor-ascension\src\lib\flashcards\flashcardService.ts
import type { FlashCard, FlashCardGenerationStatus, Series } from '../../types/index';
import type { FlashCardWorkerMessage, FlashCardWorkerResponse } from '../../workers/flashCardWorker'; // Adjusted import path
import type { AzureConfig } from '../azure';
import { saveSeries } from '../storage';
import type { FlashCardRequest } from './flashcardGenerator';

// Map to keep track of active workers
const activeWorkers = new Map<string, Worker>();

/**
 * Starts flash card generation for a series
 */
export async function startFlashCardGeneration(
    series: Series,
    config: AzureConfig,
    request: FlashCardRequest,
    onStatusUpdate: (status: FlashCardGenerationStatus) => void,
    onComplete: (flashcards: FlashCard[]) => void,
    onError: (error: string) => void
): Promise<void> {
    // Cleanup any existing worker for this series
    if (activeWorkers.has(series.id)) {
        const existingWorker = activeWorkers.get(series.id);
        existingWorker?.terminate();
        activeWorkers.delete(series.id);
    }

    try {
        // Create a worker using a string path instead of URL constructor
        // This is more compatible with Vite's development mode
        const worker = new Worker(new URL('../../workers/flashCardWorker.js', import.meta.url), {
            type: 'module'
        });

        console.log('Worker created successfully');

        // Store worker reference
        activeWorkers.set(series.id, worker);

        // Set up message handler
        worker.onmessage = (e: MessageEvent<FlashCardWorkerResponse>) => {
            const response = e.data;
            console.log('Worker response received:', response);

            switch (response.type) {
                case 'status':
                    if (response.status) {
                        console.log('Status update:', response.status);
                        onStatusUpdate(response.status);
                    }
                    break;

                case 'complete':
                    console.log('Generation complete, received cards:', response.flashcards?.length);
                    if (response.flashcards) {
                        onComplete(response.flashcards);
                        // Clean up worker
                        worker.terminate();
                        activeWorkers.delete(series.id);
                    }
                    break;

                case 'error':
                    onError(response.error || 'Unknown error occurred');
                    // Clean up worker
                    worker.terminate();
                    activeWorkers.delete(series.id);
                    break;
            }
        };

        worker.onerror = (error) => {
            console.error('Worker error:', error);
            onError(`Worker error: ${error.message || 'Unknown worker error'}`);
            // Clean up worker
            worker.terminate();
            activeWorkers.delete(series.id);
        };

        // Start generation
        const message: FlashCardWorkerMessage = {
            type: 'generate',
            series,
            config,
            request
        };

        console.log('Sending message to worker:', message.type);
        worker.postMessage(message);
        console.log('Message sent to worker');

    } catch (error) {
        onError(error instanceof Error ? error.message : 'Failed to start flash card generation');
    }
}

/**
 * Estimates the number of flash cards that can be generated for a series
 */
export async function estimateFlashCardCount(
    series: Series,
    config: AzureConfig,
    request: FlashCardRequest
): Promise<number> {
    return new Promise((resolve, reject) => {
        try {
            const worker = new Worker(new URL('../../workers/flashCardWorker.js', import.meta.url), {
                type: 'module'
            });

            worker.onmessage = (e: MessageEvent<FlashCardWorkerResponse>) => {
                if (e.data.type === 'estimate') {
                    resolve(e.data.estimate || 0);
                    worker.terminate();
                } else if (e.data.type === 'error') {
                    reject(new Error(e.data.error || 'Estimation error'));
                    worker.terminate();
                }
            };

            worker.onerror = (error) => {
                reject(new Error(`Worker error: ${error.message || 'Unknown worker error'}`));
                worker.terminate();
            };

            const message: FlashCardWorkerMessage = {
                type: 'estimate',
                series,
                config,
                request
            };
            worker.postMessage(message);
        } catch (error) {
            reject(error instanceof Error ? error : new Error('Failed to estimate flash card count'));
        }
    });
}

/**
 * Updates a series with new flashcards and saves it.
 */
export async function updateSeriesWithFlashCards(series: Series, flashcards: FlashCard[]): Promise<Series> {
    const updatedSeries = {
        ...series,
        flashcards: flashcards,
        updatedAt: new Date().toISOString(),
    };
    await saveSeries(updatedSeries);
    return updatedSeries;
}

/**
 * Cancels flash card generation for a series
 */
export function cancelFlashCardGeneration(seriesId: string): void {
    const worker = activeWorkers.get(seriesId);
    if (worker) {
        worker.terminate();
        activeWorkers.delete(seriesId);
        console.log(`Flash card generation cancelled for series: ${seriesId}`);
    }
}

/**
 * Gets the status of all active flash card generations
 */
export function getActiveGenerations(): string[] {
    return Array.from(activeWorkers.keys());
}
