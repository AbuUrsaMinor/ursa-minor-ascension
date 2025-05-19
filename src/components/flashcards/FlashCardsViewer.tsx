// filepath: c:\Users\A550191\git\ursa-minor-ascension\src\components\FlashCardsViewer.tsx
import { useState } from 'react';
import type { FlashCardDifficulty, Series } from '../../types/index';
import { FlashCardItemViewer } from './FlashCardItemViewer';

interface FlashCardsViewerProps {
    series: Series;
}

export function FlashCardsViewer({ series }: FlashCardsViewerProps) {
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [filterDifficulty, setFilterDifficulty] = useState<FlashCardDifficulty | 'all'>('all');
    const [filterPage, setFilterPage] = useState<string | 'all'>('all');

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

    // If we have no flash cards, show a message
    if (!series.flashcards || series.flashcards.length === 0) {
        return (
            <div className="mt-8 p-6 bg-gray-50 rounded-lg text-center text-gray-600">
                <h3 className="text-xl font-semibold mb-4">No Flash Cards Available</h3>
                <p>This series doesn't have any flash cards for studying.</p>
            </div>
        );
    }

    // Render flash cards list with filters
    return (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-green-700">Flash Cards ({series.flashcards.length})</h3>
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
                        <FlashCardItemViewer
                            key={card.id}
                            card={card}
                            series={series}
                            isSelected={selectedCardId === card.id}
                            onClick={() => setSelectedCardId(selectedCardId === card.id ? null : card.id)}
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
