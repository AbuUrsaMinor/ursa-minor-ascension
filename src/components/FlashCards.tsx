import { useCallback, useEffect, useState } from 'react';
import { useAzure } from '../context/AzureContext';
import { cancelFlashCardGeneration, startFlashCardGeneration, updateSeriesWithFlashCards } from '../lib/flashcardService';
import type { FlashCard, FlashCardDifficulty, FlashCardGenerationStatus, Series } from '../types/index';
import { AnkiExportButton } from './AnkiExportButton';
import { FlashCardGenerator } from './FlashCardGenerator';
import { FlashCardItem } from './FlashCardItem';

interface FlashCardsProps {
    series: Series;
    onSeriesUpdate: (series: Series) => void;
}

export function FlashCards({ series, onSeriesUpdate }: FlashCardsProps) {
    const { endpoint, apiKey } = useAzure();
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [filterDifficulty, setFilterDifficulty] = useState<FlashCardDifficulty | 'all'>('all');
    const [filterPage, setFilterPage] = useState<string | 'all'>('all');
    const [generationStatus, setGenerationStatus] = useState<FlashCardGenerationStatus>(
        series.flashcardStatus || { status: 'idle' }
    );

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

    // Reset selected card when filters change
    useEffect(() => {
        setSelectedCardId(null);
    }, [filterDifficulty, filterPage]);

    // Filter flash cards based on current filters
    const filteredCards = (series.flashcards || []).filter(card => {
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

    // Handle card generation completion
    const handleGenerationComplete = useCallback(async (flashcards: FlashCard[]) => {
        try {
            // Update the series with the new flash cards
            const updatedSeries = await updateSeriesWithFlashCards(
                series.id,
                flashcards,
                { status: 'complete' }
            );

            // Update the UI
            onSeriesUpdate(updatedSeries);
            setGenerationStatus({ status: 'complete' });
        } catch (error) {
            console.error('Failed to update series with flash cards:', error);
            setGenerationStatus({
                status: 'error',
                error: error instanceof Error ? error.message : 'Failed to save flash cards'
            });
        }
    }, [series.id, onSeriesUpdate]);

    // Handle generation errors
    const handleGenerationError = useCallback((error: string) => {
        setGenerationStatus({
            status: 'error',
            error
        });
    }, []);

    // Handle starting flash card generation
    const handleStartGeneration = useCallback(async (count: number) => {
        if (!endpoint || !apiKey) {
            console.error('Cannot generate flash cards: Azure configuration is missing');
            setGenerationStatus({
                status: 'error',
                error: 'Azure configuration is missing. Please configure your Azure OpenAI settings.'
            });
            return;
        }

        try {
            console.log('Starting flash card generation with count:', count);
            setGenerationStatus({ status: 'generating', progress: 0, total: 1 });

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
                    setGenerationStatus(status);
                    // Also update the series object to persist status
                    onSeriesUpdate({
                        ...series,
                        flashcardStatus: status
                    });
                },
                handleGenerationComplete,
                handleGenerationError
            );
        } catch (error) {
            console.error('Error starting flash card generation:', error);

            setGenerationStatus({
                status: 'error',
                error: error instanceof Error ? error.message : 'Failed to start generation'
            });
        }
    }, [endpoint, apiKey, series, onSeriesUpdate, handleGenerationComplete, handleGenerationError]);

    // Handle cancellation
    const handleCancel = useCallback(() => {
        cancelFlashCardGeneration(series.id);
        setGenerationStatus({ status: 'idle' });
    }, [series.id]);    // If we have no flash cards yet, show the generator
    if (!series.flashcards || series.flashcards.length === 0) {
        return (
            <>
                {/* Removed Quick Generate button as per requirements */}
                <FlashCardGenerator
                    series={series}
                    status={generationStatus}
                    onStartGeneration={handleStartGeneration}
                    onCancel={handleCancel}
                />
            </>
        );
    }

    // Render flash cards list with filters
    return (
        <div className="mt-8">            <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Flash Cards ({series.flashcards.length})</h3>
            <div className="flex space-x-2">
                <AnkiExportButton series={series} />
                <button
                    onClick={() => handleStartGeneration(10)}
                    className="py-2 px-4 bg-blue-500 text-white rounded-md"
                >
                    Regenerate Cards
                </button>
            </div>
        </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Difficulty
                    </label>
                    <select
                        value={filterDifficulty}
                        onChange={(e) => setFilterDifficulty(e.target.value as FlashCardDifficulty | 'all')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                        <option value="all">All Difficulties</option>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                </div>

                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Source Page
                    </label>
                    <select
                        value={filterPage}
                        onChange={(e) => setFilterPage(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                        <option value="all">All Pages</option>
                        {pageOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Flash Cards */}
            <div className="space-y-4">
                {filteredCards.length > 0 ? (
                    filteredCards.map((card) => (
                        <FlashCardItem
                            key={card.id}
                            card={card}
                            series={series}
                            isSelected={selectedCardId === card.id}
                            onClick={() => setSelectedCardId(selectedCardId === card.id ? null : card.id)}
                            onDelete={() => {
                                // Remove the card
                                const updatedFlashcards = series.flashcards?.filter(c => c.id !== card.id) || [];

                                // Update the series
                                onSeriesUpdate({
                                    ...series,
                                    flashcards: updatedFlashcards
                                });
                            }}
                        />
                    ))
                ) : (
                    <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
                        No flash cards match the selected filters
                    </div>
                )}
            </div>
        </div>
    );
}