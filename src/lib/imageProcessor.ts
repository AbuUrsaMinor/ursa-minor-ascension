import type { AzureConfig } from './azure';
import { analyzeImage } from './azure';

interface ProcessingItem {
    id: string;
    imageData: string;
    retries: number;
    config: AzureConfig;
    onComplete: (result: ProcessingResult) => void;
    onError: (error: Error, id: string) => void;
    onStatusChange?: (id: string, status: ProcessingStatus) => void;
    status: ProcessingStatus;
    error?: string;
}

export interface ProcessingResult {
    id: string;
    text: string;
    imageDescriptions: string[];
    meta: Record<string, any>;
}

export type ProcessingStatus = 'queued' | 'processing' | 'complete' | 'error';

class ImageProcessorService {
    private processingQueue: ProcessingItem[] = [];
    private isProcessing = false;
    private maxConcurrent = 2;
    private maxRetries = 3;
    private currentlyProcessing = 0;

    /**
     * Add an image to the processing queue
     * 
     * @param id - Unique identifier for the processing item
     * @param imageData - Base64-encoded image data
     * @param config - Azure configuration
     * @param onComplete - Callback when processing completes successfully
     * @param onError - Callback when processing fails
     * @returns void
     */    public enqueue(
        id: string,
        imageData: string,
        config: AzureConfig,
        onComplete: (result: ProcessingResult) => void,
        onError: (error: Error, id: string) => void,
        onStatusChange?: (id: string, status: ProcessingStatus) => void
    ): void {
        const item: ProcessingItem = {
            id,
            imageData,
            retries: 0,
            config,
            onComplete,
            onError,
            onStatusChange,
            status: 'queued'
        };

        this.processingQueue.push(item);

        if (!this.isProcessing) {
            this.processQueue();
        }
    }

    /**
     * Get the current status of the processing queue
     * 
     * @returns Object with counts of items in each status
     */
    public getStatus(): { queued: number; processing: number; completed: number; error: number; total: number } {
        const counts = {
            queued: 0,
            processing: 0,
            completed: 0,
            error: 0
        };

        for (const item of this.processingQueue) {
            if (item.status === 'queued') counts.queued++;
            if (item.status === 'processing') counts.processing++;
            if (item.status === 'complete') counts.completed++;
            if (item.status === 'error') counts.error++;
        }

        return {
            ...counts,
            total: this.processingQueue.length
        };
    }
    /**
     * Retry processing a specific item
     * 
     * @param id - ID of the item to retry
     * @returns boolean indicating if retry was successful
     */    public retry(id: string): boolean {
        const itemIndex = this.processingQueue.findIndex(item => item.id === id && item.status === 'error');
        if (itemIndex === -1) return false;

        const item = this.processingQueue[itemIndex];
        item.status = 'queued';
        if (item.onStatusChange) {
            item.onStatusChange(item.id, 'queued');
        }
        item.retries = 0; // Reset retry count for manual retries
        item.error = undefined;

        if (!this.isProcessing) {
            this.processQueue();
        }

        return true;
    }

    /**
     * Clear completed items from the queue
     */
    public clearCompleted(): void {
        this.processingQueue = this.processingQueue.filter(item =>
            item.status !== 'complete'
        );
    }

    /**
     * Process the queue of images
     * @private
     */    private async processQueue(): Promise<void> {
        if (this.currentlyProcessing >= this.maxConcurrent) return;

        this.isProcessing = true;

        // Find next item to process
        const nextItemIndex = this.processingQueue.findIndex(item => item.status === 'queued');

        if (nextItemIndex === -1) {
            // No more items to process
            if (this.currentlyProcessing === 0) {
                this.isProcessing = false;
            }
            return;
        } const item = this.processingQueue[nextItemIndex];
        item.status = 'processing';
        if (item.onStatusChange) {
            item.onStatusChange(item.id, 'processing');
        }
        this.currentlyProcessing++;
        try {
            // Process the image
            const result = await analyzeImage(item.imageData, item.config);

            // Extract image descriptions from figures
            const descriptions: string[] = [];
            if (result.metadata && result.metadata.figures) {
                const figures = result.metadata.figures;
                for (const figure of figures) {
                    if (figure.description) {
                        descriptions.push(figure.description);
                    }
                }
            }            // Mark as complete and call callback
            item.status = 'complete';
            if (item.onStatusChange) {
                item.onStatusChange(item.id, 'complete');
            }
            item.onComplete({
                id: item.id,
                text: result.text,
                imageDescriptions: descriptions,
                meta: result.metadata || {}
            });
        } catch (error) {
            console.error('Image processing error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            // Handle error and retry logic
            if (item.retries < this.maxRetries) {                // Retry with exponential backoff
                item.retries++;
                item.status = 'queued';
                if (item.onStatusChange) {
                    item.onStatusChange(item.id, 'queued');
                }
                item.error = `Error: ${errorMessage}. Retry ${item.retries} of ${this.maxRetries}.`;

                // Calculate backoff time
                const backoffTime = Math.pow(2, item.retries) * 1000;

                setTimeout(() => {
                    this.processQueue();
                }, backoffTime);
            } else {
                // Max retries reached
                item.status = 'error';
                item.error = `Failed after ${this.maxRetries} attempts: ${errorMessage}`;
                if (item.onStatusChange) {
                    item.onStatusChange(item.id, 'error');
                }
                if (error instanceof Error) {
                    item.onError(error, item.id);
                } else {
                    item.onError(new Error(errorMessage), item.id);
                }
            }
        } finally {
            this.currentlyProcessing--;

            // Continue processing queue
            this.processQueue();
        }
    }
}

// Export singleton instance
export const imageProcessor = new ImageProcessorService();
