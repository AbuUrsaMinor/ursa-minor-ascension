import { useCallback, useEffect, useState } from 'react';
import { useAzure } from '../context/AzureContext';
import { useDomain } from '../context/DomainContext';
import { cancelFlashCardGeneration, startFlashCardGeneration, updateSeriesWithFlashCards } from '../lib/flashcards/flashcardService';
import { cancelWidgetGeneration, updateSeriesWithWidgets } from '../lib/widgetService';
import type { FlashCard, FlashCardDifficulty, FlashCardGenerationStatus, MemeWidget, Series, WidgetGenerationStatus } from '../types/index';
import { AnkiExportButton } from './AnkiExportButton';
import { FlashCardGenerator } from './flashcards/FlashCardGenerator';
import { StudyPackExportButton } from './StudyPackExportButton';
import { WidgetGenerator } from './WidgetGenerator';
import { WidgetRenderer } from './WidgetRenderer';
import { MemeWidgetCreator } from './widgets/meme/MemeWidgetCreator';

interface WidgetsProps {
    series: Series;
    onSeriesUpdate: (series: Series) => void;
    readOnly?: boolean;
}

export function Widgets({ series, onSeriesUpdate, readOnly = false }: WidgetsProps) {
    const { domain } = useDomain();
    const { endpoint, apiKey } = useAzure();
    const [filterType, setFilterType] = useState<string | 'all'>('all');
    const [filterPage, setFilterPage] = useState<string | 'all'>('all');
    const [filterDifficulty, setFilterDifficulty] = useState<FlashCardDifficulty | 'all'>('all');
    const [showGenerator, setShowGenerator] = useState(false);
    const [showMemeCreator, setShowMemeCreator] = useState(false);
    const [showFlashCardGenerator, setShowFlashCardGenerator] = useState(false);
    const [generationStatus, setGenerationStatus] = useState<WidgetGenerationStatus>(
        series.widgetStatus || { status: 'idle' }
    );    const [flashCardGenerationStatus, setFlashCardGenerationStatus] = useState<FlashCardGenerationStatus>(
        series.flashcardStatus || { status: 'idle' }
    );    // If no explicit readOnly prop is provided, use the domain context
    const isReadOnly = readOnly || domain === 'viewer';

    // Widget creator states
    const [showWidgetCreator, setShowWidgetCreator] = useState(false);
    const [creatorType, setCreatorType] = useState<string | null>(null);

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
        }, [] as Array<{ id: string; label: string }>);    // Filter widgets based on current filters
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
    }, [series.widgetStatus]);    // Handle widget deletion
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
    }, [series, onSeriesUpdate]);    // Cancel ongoing generation
    const handleCancelGeneration = useCallback(() => {
        cancelWidgetGeneration();
        setGenerationStatus({ status: 'idle' as const });
        const updatedSeries = { ...series, widgetStatus: { status: 'idle' as const } };
        onSeriesUpdate(updatedSeries);
    }, [series, onSeriesUpdate]);    // Handle Flash Card generation completion
    const handleFlashCardGenerationComplete = useCallback(async (flashcards: FlashCard[]) => {
        try {
            // Create updated series
            const updatedSeries = await updateSeriesWithFlashCards(series, flashcards);
            
            // Update the UI
            onSeriesUpdate(updatedSeries);
            setFlashCardGenerationStatus({ status: 'complete' });
        } catch (error) {
            console.error('Failed to update series with flash cards:', error);
            setFlashCardGenerationStatus({
                status: 'error',
                error: error instanceof Error ? error.message : 'Failed to save flash cards'
            });
        }
    }, [series, onSeriesUpdate]);

    // Handle Flash Card generation errors
    const handleFlashCardGenerationError = useCallback((error: string) => {
        setFlashCardGenerationStatus({
            status: 'error',
            error
        });
    }, []);

    // Handle starting flash card generation
    const handleStartFlashCardGeneration = useCallback(async (count: number) => {
        if (!endpoint || !apiKey) {
            console.error('Cannot generate flash cards: Azure configuration is missing');
            setFlashCardGenerationStatus({
                status: 'error',
                error: 'Azure configuration is missing. Please configure your Azure OpenAI settings.'
            });
            return;
        }

        try {
            console.log('Starting flash card generation with count:', count);
            setFlashCardGenerationStatus({ status: 'generating', progress: 0, total: 1 });

            // Update UI with generating status
            onSeriesUpdate({
                ...series,
                flashcardStatus: { status: 'generating', progress: 0, total: 1 }
            });

            // Create config object from endpoint and apiKey
            const azureConfig = { endpoint, apiKey };

            // Start generation
            await startFlashCardGeneration(
                series,
                azureConfig,
                { count, difficulty: 'mixed' },
                (status) => {
                    console.log('Flash card generation status update:', status);
                    setFlashCardGenerationStatus(status);
                    // Also update the series object to persist status
                    onSeriesUpdate({
                        ...series,
                        flashcardStatus: status
                    });
                },
                handleFlashCardGenerationComplete,
                handleFlashCardGenerationError
            );
        } catch (error) {
            console.error('Error starting flash card generation:', error);

            setFlashCardGenerationStatus({
                status: 'error',
                error: error instanceof Error ? error.message : 'Failed to start generation'
            });
        }
    }, [endpoint, apiKey, series, onSeriesUpdate, handleFlashCardGenerationComplete, handleFlashCardGenerationError]);

    // Cancel Flash Card generation
    const handleCancelFlashCardGeneration = useCallback(() => {
        cancelFlashCardGeneration(series.id);
        setFlashCardGenerationStatus({ status: 'idle' });
    }, [series.id]);

    // Handle widget created and add to series
    const handleWidgetCreated = useCallback((widget: MemeWidget) => {
        const updatedWidgets = series.widgets ? [...series.widgets, widget] : [widget];
        const updatedSeries = { ...series, widgets: updatedWidgets };

        updateSeriesWithWidgets(updatedSeries)
            .then(() => {
                onSeriesUpdate(updatedSeries);
                setShowWidgetCreator(false);
                setCreatorType(null);
            })
            .catch(error => {
                console.error('Failed to add widget:', error);
            });
    }, [series, onSeriesUpdate]);

    // Handle meme widget created
    const handleMemeWidgetCreated = useCallback((widget: any) => {
        const updatedWidgets = series.widgets ? [...series.widgets, widget] : [widget];
        const updatedSeries = { ...series, widgets: updatedWidgets };

        updateSeriesWithWidgets(updatedSeries)
            .then(() => {
                onSeriesUpdate(updatedSeries);
                setShowMemeCreator(false);
            })
            .catch(error => {
                console.error('Failed to add meme widget:', error);
            });
    }, [series, onSeriesUpdate]);

    // Cancel widget creation
    const handleCancelCreate = useCallback(() => {
        setShowWidgetCreator(false);
        setCreatorType(null);
    }, []);

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
    };    // Show Flash Card generator UI
    if (showFlashCardGenerator) {
        return (
            <div className="p-4">
                <FlashCardGenerator
                    series={series}
                    status={flashCardGenerationStatus}
                    onStartGeneration={handleStartFlashCardGeneration}
                    onCancel={handleCancelFlashCardGeneration}
                />
            </div>
        );
    }

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
    }    // Show widget creator UI
    if (showWidgetCreator && creatorType) {
        if (creatorType === 'meme') {
            return (
                <div className="p-4">
                    <MemeWidgetCreator
                        series={series}
                        onCancel={handleCancelCreate}
                        onWidgetCreated={handleWidgetCreated}
                    />
                </div>
            );
        }
        // Add more widget creators here as they become available

        // Fallback
        return (
            <div className="p-4 text-center">
                <p>Widget creator for "{creatorType}" is not implemented yet.</p>
                <button
                    onClick={handleCancelCreate}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
                >
                    Back to Widgets
                </button>
            </div>
        );
    }

    // Show meme widget creator UI
    if (showMemeCreator) {
        return (
            <div className="p-4">
                <MemeWidgetCreator
                    series={series}
                    onCancel={() => setShowMemeCreator(false)}
                    onWidgetCreated={handleMemeWidgetCreated}
                />
            </div>
        );
    }    // Filter flash cards based on current filters
    const filteredFlashCards = (series.flashcards || []).filter(card => {
        // Only include if we're showing all types or specifically flashcards
        if (filterType !== 'all' && filterType !== 'flashcard') {
            return false;
        }

        // Filter by difficulty
        if (filterDifficulty !== 'all' && card.difficulty !== filterDifficulty) {
            return false;
        }

        // Filter by page
        if (filterPage !== 'all') {
            return card.sourcePages.includes(filterPage);
        }

        return true;
    });

    // Combined filtered widgets and flash cards
    const hasFilteredItems = filteredWidgets.length > 0 || filteredFlashCards.length > 0;

    return (
        <div className="p-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                <h2 className="text-xl font-semibold mb-2 md:mb-0">Study Widgets</h2><div className="flex flex-wrap gap-2">
                    {!isReadOnly && (
                        <>
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

                            {/* Generate Flash Cards button */}
                            <button
                                onClick={() => setShowFlashCardGenerator(true)}
                                disabled={flashCardGenerationStatus.status === 'generating'}
                                className={`px-3 py-1 rounded text-sm flex items-center ${flashCardGenerationStatus.status === 'generating'
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Generate Flash Cards
                            </button>

                            {/* Add Meme Widget button */}
                            <button
                                onClick={() => setShowMemeCreator(true)}
                                className="px-3 py-1 rounded text-sm flex items-center bg-green-600 text-white hover:bg-green-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Create Meme
                            </button>
                        </>
                    )}
                    <StudyPackExportButton
                        series={series}
                        className={!series.widgets?.length ? "opacity-50 cursor-not-allowed" : ""}
                    />
                    {series.flashcards && series.flashcards.length > 0 && (
                        <AnkiExportButton series={series} />
                    )}
                </div>
            </div>            {renderStatus()}

            {/* Render Flash Card generation status */}
            {flashCardGenerationStatus.status !== 'idle' && (
                <div className={`text-center py-2 ${
                    flashCardGenerationStatus.status === 'generating' ? 'bg-blue-50' :
                    flashCardGenerationStatus.status === 'complete' ? 'bg-green-50' :
                    flashCardGenerationStatus.status === 'error' ? 'bg-red-50' : 'bg-gray-50'
                } rounded-lg mb-4`}>
                    {flashCardGenerationStatus.status === 'generating' && (
                        <>
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600 mr-2"></div>
                                <span className="text-blue-800">Generating flash cards...</span>
                            </div>
                            {flashCardGenerationStatus.progress !== undefined && flashCardGenerationStatus.total !== undefined && (
                                <div className="text-sm text-blue-600">
                                    {flashCardGenerationStatus.progress} of {flashCardGenerationStatus.total}
                                </div>
                            )}
                            <div className="flex justify-center mt-2">
                                <button
                                    onClick={handleCancelFlashCardGeneration}
                                    className="px-2 py-1 text-xs bg-white border border-red-300 text-red-700 rounded hover:bg-red-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    )}
                    {flashCardGenerationStatus.status === 'complete' && (
                        <div className="flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-green-800">Flash cards generated successfully!</span>
                        </div>
                    )}
                    {flashCardGenerationStatus.status === 'error' && (
                        <div>
                            <div className="flex items-center justify-center mb-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span className="text-red-800">Error generating flash cards</span>
                            </div>
                            {flashCardGenerationStatus.error && (
                                <div className="text-sm text-red-600">{flashCardGenerationStatus.error}</div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Filter controls */}
            {(series.widgets && series.widgets.length > 0) || (series.flashcards && series.flashcards.length > 0) ? (
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
                        {series.flashcards && series.flashcards.length > 0 && (
                            <option value="flashcard">Flash Card</option>
                        )}
                    </select>

                    {/* Only show difficulty filter when flashcard type is selected */}
                    {filterType === 'flashcard' && (
                        <select
                            value={filterDifficulty}
                            onChange={(e) => setFilterDifficulty(e.target.value as FlashCardDifficulty | 'all')}
                            className="border rounded px-2 py-1 text-sm"
                        >
                            <option value="all">All Difficulties</option>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                    )}

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
            ) : null}            {/* Widget list */}
            {hasFilteredItems ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredWidgets.map(widget => (
                        <div key={widget.id}>
                            <WidgetRenderer
                                widget={widget}
                                series={series}
                                onDelete={!isReadOnly ? handleDeleteWidget : undefined}
                                onComplete={() => { }}
                            />
                        </div>
                    ))}
                    {/* Display flash cards */}
                    {filteredFlashCards.map(card => (
                        <div key={card.id}>
                            <WidgetRenderer
                                widget={{
                                    ...card,
                                    type: 'flashcard'
                                }}
                                series={series}
                                onDelete={!isReadOnly ? 
                                    () => {
                                        // Remove the card
                                        const updatedFlashcards = series.flashcards?.filter(c => c.id !== card.id) || [];
                                        // Update the series
                                        onSeriesUpdate({
                                            ...series,
                                            flashcards: updatedFlashcards
                                        });
                                    } : undefined
                                }
                                onComplete={() => { }}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 border border-dashed rounded-lg">
                    {(series.widgets && series.widgets.length > 0) || (series.flashcards && series.flashcards.length > 0) ? (
                        <p className="text-gray-500">No widgets match the current filters.</p>
                    ) : (<div>
                        <p className="text-gray-500 mb-2">No study materials have been generated yet.</p>
                        {!isReadOnly && (
                            <div className="flex flex-wrap gap-2 justify-center">
                                <button
                                    onClick={() => setShowGenerator(true)}
                                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                >
                                    Generate Widgets
                                </button>
                                <button
                                    onClick={() => setShowFlashCardGenerator(true)}
                                    className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                                >
                                    Generate Flash Cards
                                </button>
                                <button
                                    onClick={() => setShowMemeCreator(true)}
                                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                >
                                    Create Meme
                                </button>
                            </div>
                        )}
                    </div>
                    )}
                </div>
            )}
        </div>
    );
}
