import { Series, Widget, WidgetGenerationStatus } from '../types';
import { AzureConfig } from './azure';
import { generateWidgets, WidgetGenerationRequest } from './widgetGenerator';

// Messages from the main thread to the worker
type MainToWorkerMessage = {
    type: 'generate';
    series: Series;
    config: AzureConfig;
    request: WidgetGenerationRequest;
} | {
    type: 'cancel';
};

// Messages from the worker to the main thread
type WorkerToMainMessage = {
    type: 'status';
    status: WidgetGenerationStatus;
} | {
    type: 'complete';
    widgets: Widget[];
} | {
    type: 'error';
    error: string;
};

// Worker state
let isGenerating = false;
let controller: AbortController | null = null;

/**
 * Initialize a worker for widget generation
 */
export function initializeWidgetWorker() {
    // Add event listener for messages from main thread
    self.addEventListener('message', async (event: MessageEvent<MainToWorkerMessage>) => {
        const { data } = event;

        if (data.type === 'generate') {
            if (isGenerating) {
                postMessage({
                    type: 'error',
                    error: 'Already generating widgets'
                } as WorkerToMainMessage);
                return;
            }

            isGenerating = true;
            controller = new AbortController();

            try {
                // Start widget generation
                const widgets = await generateWidgets(
                    data.series,
                    data.config,
                    data.request,
                    (status) => {
                        // Forward status updates to main thread
                        postMessage({
                            type: 'status',
                            status
                        } as WorkerToMainMessage);
                    }
                );

                // Send completion message with the widgets
                postMessage({
                    type: 'complete',
                    widgets
                } as WorkerToMainMessage);
            } catch (error) {
                // Handle errors
                postMessage({
                    type: 'error',
                    error: error instanceof Error ? error.message : String(error)
                } as WorkerToMainMessage);
            } finally {
                isGenerating = false;
                controller = null;
            }
        } else if (data.type === 'cancel') {
            // Cancel the generation
            if (controller) {
                controller.abort();
                postMessage({
                    type: 'status',
                    status: {
                        status: 'idle',
                        message: 'Widget generation canceled'
                    }
                } as WorkerToMainMessage);
            }

            isGenerating = false;
            controller = null;
        }
    });
}

// Initialize the worker if we're in a worker context
if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
    initializeWidgetWorker();
}
