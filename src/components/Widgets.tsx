import { useCallback, useEffect, useState } from 'react';
import { useAzure } from '../context/AzureContext';
import { useDomain } from '../context/DomainContext';
import { cancelWidgetGeneration, startWidgetGeneration, updateSeriesWithWidgets } from '../lib/widgetService';
import type { Series, WidgetGenerationStatus } from '../types/index';
import { StudyPackExportButton } from './StudyPackExportButton';
import { WidgetGenerator } from './WidgetGenerator';
import { WidgetRenderer } from './WidgetRenderer';

interface WidgetsProps {
    series: Series;
    onSeriesUpdate: (series: Series) => void;
    readOnly?: boolean;
}

export function Widgets({ series, onSeriesUpdate, readOnly = false }: WidgetsProps) {
    const { endpoint, apiKey } = useAzure();
    const { domain } = useDomain();
    const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
    const [filterType, setFilterType] = useState<string | 'all'>('all');
    const [filterPage, setFilterPage] = useState<string | 'all'>('all');
    const [showGenerator, setShowGenerator] = useState(false);
    const [generationStatus, setGenerationStatus] = useState<WidgetGenerationStatus>(
        series.widgetStatus || { status: 'idle' }
    );

    // If no explicit readOnly prop is provided, use the domain context
    const isReadOnly = readOnly || domain === 'viewer';

    // Get unique page numbers for filter
    const pageOptions = series.pages
        .filter(page => page.meta.pageNumber !== undefined)
        .map(page => ({
            id: page.id,
            label: `Page ${page.meta.pageNumber}`
        }))
        .reduce((acc, curr) => {
            if (!acc.find(item => item.label === curr.label)) {
                acc.push(curr);
            }
            return acc;
        }, [] as Array<{ id: string; label: string }>);

    // Reset selected widget when filters change
    useEffect(() => {
        setSelectedWidgetId(null);
    }, [filterType, filterPage]);

    // Filter widgets based on current filters
    const filteredWidgets = (series.widgets || []).filter(widget => {
        // Filter by type
        if (filterType !== 'all' && widget.type !== filterType) {
            return false;
        }

        // Filter by page
        if (filterPage !== 'all') {
            return widget.sourcePages.includes(filterPage);
        }

        return true;
    });

    // Unique widget types in this series for filtering
    const widgetTypes = Array.from(
        new Set((series.widgets || []).map(widget => widget.type))
    ).sort();

    // Update generation status
    useEffect(() => {
        if (series.widgetStatus) {
            setGenerationStatus(series.widgetStatus);
        }
    }, [series.widgetStatus]);

    // Handle widget deletion
    const handleDeleteWidget = useCallback(async (widgetId: string) => {
        if (!series.widgets) return;

        const updatedWidgets = series.widgets.filter(w => w.id !== widgetId);
        const updatedSeries = { ...series, widgets: updatedWidgets };

        try {
            await updateSeriesWithWidgets(updatedSeries);
            onSeriesUpdate(updatedSeries);
        } catch (error) {
            console.error('Failed to delete widget:', error);
        }
    }, [series, onSeriesUpdate]);

    // Start generation with configuration
    const handleStartGeneration = useCallback(async (request) => {
        if (!endpoint || !apiKey) {
            console.error('Azure credentials not configured');
            return;
        }

        setShowGenerator(false);

        try {
            await startWidgetGeneration(
                series.id,
                { endpoint, apiKey },
                request,
                (status) => {
                    // Update local status
                    setGenerationStatus(status);

                    // Update series status
                    const updatedSeries = { ...series, widgetStatus: status };
                    onSeriesUpdate(updatedSeries);
                }
            );
        } catch (error) {
            console.error('Failed to start widget generation:', error);
            setGenerationStatus({
                status: 'error',
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }, [series, endpoint, apiKey, onSeriesUpdate]);

    // Cancel ongoing generation
    const handleCancelGeneration = useCallback(() => {
        cancelWidgetGeneration();
        setGenerationStatus({ status: 'idle' });
        const updatedSeries = { ...series, widgetStatus: { status: 'idle' } };
        onSeriesUpdate(updatedSeries);
    }, [series, onSeriesUpdate]);

    // Render status indicator
    const renderStatus = () => {
        switch (generationStatus.status) {
            case 'idle':
                return null;
            case 'estimating':
                return (
                    <div className="text-center py-3 bg-blue-50 rounded-lg mb-4">
                        <div className="flex items-center justify-center mb-1">
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600 mr-2"></div>
                            <span className="text-blue-800">Estimating widgets...</span>
                        </div>
                        {generationStatus.message && (
                            <div className="text-sm text-blue-600">{generationStatus.message}</div>
                        )}
                    </div>
                );
            case 'generating':
                const progress = generationStatus.progress || 0;
                const total = generationStatus.total || 0;
                const percent = total ? Math.round((progress / total) * 100) : 0;

                return (
                    <div className="py-3 bg-blue-50 rounded-lg mb-4">
                        <div className="text-center mb-1">
                            <span className="text-blue-800">
                                Generating widgets ({progress}/{total})
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mx-auto max-w-md mb-2">
                            <div
                                className="bg-blue-600 h-2.5 rounded-full"
                                style={{ width: `${percent}%` }}
                            ></div>
                        </div>
                        {generationStatus.message && (
                            <div className="text-sm text-center text-blue-600">{generationStatus.message}</div>
                        )}
                        <div className="flex justify-center mt-2">
                            <button
                                onClick={handleCancelGeneration}
                                className="px-2 py-1 text-xs bg-white border border-red-300 text-red-700 rounded hover:bg-red-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                );
            case 'complete':
                return (
                    <div className="text-center py-2 bg-green-50 rounded-lg mb-4">
                        <div className="flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-green-800">Generation complete!</span>
                        </div>
                    </div>
                );
            case 'error':
                return (
                    <div className="text-center py-2 bg-red-50 rounded-lg mb-4">
                        <div className="flex items-center justify-center mb-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span className="text-red-800">Error</span>
                        </div>
                        <div className="text-sm text-red-600">{generationStatus.error}</div>
                    </div>
                );
        }
    };

    // Show widget generator UI
    if (showGenerator) {
        return (
            <div className="p-4">
                <WidgetGenerator
                    series={series}
                    onComplete={() => setShowGenerator(false)}
                />
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                <h2 className="text-xl font-semibold mb-2 md:mb-0">Study Widgets</h2>

                <div className="flex flex-wrap gap-2">
                    {!isReadOnly && (
                        <button
                            onClick={() => setShowGenerator(true)}
                            disabled={generationStatus.status === 'generating' || generationStatus.status === 'estimating'}
                            className={`px-3 py-1 rounded text-sm flex items-center ${generationStatus.status === 'generating' || generationStatus.status === 'estimating'
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Generate Widgets
                        </button>
                    )}

                    <StudyPackExportButton
                        series={series}
                        disabled={!series.widgets?.length}
                    />
                </div>
            </div>

            {renderStatus()}

            {/* Filter controls */}
            {series.widgets && series.widgets.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                    >
                        <option value="all">All Types</option>
                        {widgetTypes.map(type => (
                            <option key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </option>
                        ))}
                    </select>

                    {pageOptions.length > 0 && (
                        <select
                            value={filterPage}
                            onChange={(e) => setFilterPage(e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                        >
                            <option value="all">All Pages</option>
                            {pageOptions.map(page => (
                                <option key={page.id} value={page.id}>{page.label}</option>
                            ))}
                        </select>
                    )}
                </div>
            )}

            {/* Widget list */}
            {filteredWidgets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredWidgets.map(widget => (
                        <div key={widget.id}>
                            <WidgetRenderer
                                widget={widget}
                                series={series}
                                onDelete={!isReadOnly ? handleDeleteWidget : undefined}
                                onComplete={() => setSelectedWidgetId(widget.id)}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 border border-dashed rounded-lg">
                    {series.widgets && series.widgets.length > 0 ? (
                        <p className="text-gray-500">No widgets match the current filters.</p>
                    ) : (
                        <div>
                            <p className="text-gray-500 mb-2">No widgets have been generated yet.</p>
                            {!isReadOnly && (
                                <button
                                    onClick={() => setShowGenerator(true)}
                                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                >
                                    Generate Widgets
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
