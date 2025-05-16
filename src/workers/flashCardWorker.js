// filepath: c:\Users\A550191\git\ursa-minor-ascension\src\workers\flashCardWorker.js
// Import the necessary functions and types
import { estimateFlashCardCount, generateFlashCards } from '../lib/flashcardGenerator';
// Note: We don't need to import AzureConfig as it's already in the message from the main thread

console.log('Flash Card Worker loaded');

// Status object to track progress
let status = {
    status: 'idle'
};

// Function to update status and send message to main thread
function updateStatus(newStatus, progress, total, error) {
    status = {
        status: newStatus,
        progress,
        total,
        error
    };

    self.postMessage({
        type: 'status',
        status
    });
}

// Handle messages from main thread
self.addEventListener('message', async (event) => {
    console.log('Worker received message:', event.data);
    const { type, series, config, request } = event.data;

    try {
        if (type === 'estimate') {
            console.log('Starting flash card estimation');
            updateStatus('estimating');

            // Use a default fallback count
            const fallbackCount = Math.min(Math.max(series.pages.length * 3, 5), 50);

            try {
                // Check for required config
                if (!config || !config.endpoint || !config.apiKey) {
                    throw new Error('Invalid configuration');
                }

                // Use Promise.race to implement a timeout
                const estimationPromise = estimateFlashCardCount(series, config);
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Estimation timed out after 6 seconds')), 6000);
                });

                // Race the estimation against the timeout
                const estimatedCount = await Promise.race([estimationPromise, timeoutPromise]);

                console.log('Estimated count:', estimatedCount);
                self.postMessage({
                    type: 'estimate',
                    estimatedCount
                });
            } catch (error) {
                console.error('Estimation error:', error);
                // Always provide a fallback count
                console.log('Using fallback count:', fallbackCount);

                self.postMessage({
                    type: 'estimate',
                    estimatedCount: fallbackCount
                });
            }
        } else if (type === 'generate' && request) {
            console.log('Starting flash card generation with request:', request);
            updateStatus('generating', 0, 1);

            try {
                console.log('Calling generateFlashCards with series and config:',
                    {
                        seriesId: series.id,
                        pageCount: series.pages.length,
                        configPresent: !!config,
                        request
                    }
                );

                // Generate flash cards
                const flashcards = await generateFlashCards(
                    series,
                    config,
                    request,
                    (progress, total, status) => {
                        console.log(`Generation progress: ${progress}/${total} - ${status}`);
                        updateStatus('generating', progress, total);
                    }
                );

                console.log(`Generation complete: created ${flashcards.length} flash cards`);

                // Send the completed flash cards back to the main thread
                updateStatus('complete');
                self.postMessage({
                    type: 'complete',
                    flashcards
                });
            } catch (error) {
                // Send error back to main thread
                console.error('Flash card generation error:', error);
                updateStatus('error', undefined, undefined, error.message || 'Unknown error');
                self.postMessage({
                    type: 'error',
                    error: error.message || 'Failed to generate flash cards'
                });
            }
        } else {
            throw new Error('Unknown message type or missing required data');
        }
    } catch (error) {
        console.error('Worker error:', error);
        self.postMessage({
            type: 'error',
            error: error.message || 'An unexpected error occurred in the worker'
        });
    }
});
