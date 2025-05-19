import type { Series, Widget, WidgetGenerationStatus } from '../types';
import type { AzureConfig } from './azure';
import { getStoredSeries, saveSeries } from './storage';
import type { WidgetGenerationRequest } from './widgetGenerator';

// Web Worker for widget generation
let widgetWorker: Worker | null = null;

// Current status of widget generation
const defaultWidgetStatus: WidgetGenerationStatus = {
    status: 'idle'
};

// Callback for status updates
let statusCallback: ((status: WidgetGenerationStatus) => void) | null = null;

/**
 * Start generating widgets for a series
 */
export async function startWidgetGeneration(
    seriesId: string,
    config: AzureConfig,
    request: WidgetGenerationRequest,
    onStatusChange: (status: WidgetGenerationStatus) => void
): Promise<void> {
    // Initialize the worker if not already initialized
    if (!widgetWorker) {
        widgetWorker = new Worker(new URL('../workers/widgetWorker.js', import.meta.url), { type: 'module' });

        // Set up message handlers
        widgetWorker.onmessage = handleWorkerMessage;
        widgetWorker.onerror = handleWorkerError;
    }

    // Load the series from storage
    const series = await getStoredSeries(seriesId);
    if (!series) {
        throw new Error(`Series not found: ${seriesId}`);
    }

    // Save the callback
    statusCallback = onStatusChange;

    // Send the generate message to the worker
    widgetWorker.postMessage({
        type: 'generate',
        series,
        config,
        request
    });
}

/**
 * Cancel widget generation
 */
export function cancelWidgetGeneration(): void {
    if (widgetWorker) {
        widgetWorker.postMessage({ type: 'cancel' });
    }
}

/**
 * Handle messages from the worker
 */
async function handleWorkerMessage(event: MessageEvent): Promise<void> {
    const { data } = event;

    if (data.type === 'status') {
        // Forward status updates to the callback
        if (statusCallback) {
            statusCallback(data.status);
        }
    } else if (data.type === 'complete') {
        // Process completed widgets
        if (statusCallback) {
            statusCallback({
                status: 'complete',
                message: `Generated ${data.widgets.length} widgets`
            });
        }

        // Store the widgets in the series
        await storeWidgets(data.widgets);
    } else if (data.type === 'error') {
        // Handle errors
        if (statusCallback) {
            statusCallback({
                status: 'error',
                error: data.error
            });
        }
    }
}

/**
 * Handle worker errors
 */
function handleWorkerError(error: ErrorEvent): void {
    console.error('Widget worker error:', error);

    if (statusCallback) {
        statusCallback({
            status: 'error',
            error: error.message
        });
    }
}

/**
 * Store generated widgets in the series
 */
async function storeWidgets(widgets: Widget[]): Promise<void> {
    if (!widgets.length) return;

    // Group widgets by series
    const widgetsBySeries: Record<string, Widget[]> = {};

    for (const widget of widgets) {
        // Find the series that contains the source pages
        const seriesId = await findSeriesForWidget(widget);
        if (seriesId) {
            if (!widgetsBySeries[seriesId]) {
                widgetsBySeries[seriesId] = [];
            }
            widgetsBySeries[seriesId].push(widget);
        }
    }

    // Update each series
    for (const [seriesId, seriesWidgets] of Object.entries(widgetsBySeries)) {
        const series = await getStoredSeries(seriesId);
        if (series) {
            // Initialize widgets array if it doesn't exist
            if (!series.widgets) {
                series.widgets = [];
            }

            // Add the new widgets
            series.widgets.push(...seriesWidgets);

            // Store the updated series
            await saveSeries(series);
        }
    }
}

/**
 * Find the series that contains the source pages for a widget
 */
async function findSeriesForWidget(widget: Widget): Promise<string | null> {
    if (!widget.sourcePages.length) return null;

    // Get a source page ID
    const pageId = widget.sourcePages[0];

    // Find the series that contains this page
    const allSeries = await getAllSeries();
    for (const series of allSeries) {
        if (series.pages.some(page => page.id === pageId)) {
            return series.id;
        }
    }

    return null;
}

/**
 * Update a series with new widgets
 */
export async function updateSeriesWithWidgets(series: Series): Promise<void> {
    // Simply save the updated series to storage
    await saveSeries(series);
}

/**
 * Get all series from storage
 */
async function getAllSeries(): Promise<Series[]> {
    try {
        // This is a placeholder - implement based on your actual storage mechanism
        // For now, we'll return an empty array which will prevent errors but
        // will not actually find the associated series
        console.warn('getAllSeries function not fully implemented');
        return [];
    } catch (error) {
        console.error('Error loading series:', error);
        return [];
    }
}
