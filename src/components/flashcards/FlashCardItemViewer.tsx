// filepath: c:\Users\A550191\git\ursa-minor-ascension\src\components\FlashCardItemViewer.tsx
import { useState } from 'react';
import type { FlashCard, Series } from '../../types/index';
import './FlashCards.css';

interface FlashCardItemViewerProps {
    card: FlashCard;
    series: Series;
    isSelected: boolean;
    onClick: () => void;
}

export function FlashCardItemViewer({ card, series, isSelected, onClick }: FlashCardItemViewerProps) {
    const [isFlipped, setIsFlipped] = useState(false);

    // Map source page IDs to page numbers for display
    const sourcePages = card.sourcePages.map(pageId => {
        const page = series.pages.find(p => p.id === pageId);
        return page?.meta.pageNumber || 'unknown';
    });

    // Get difficulty class
    const getDifficultyClass = () => {
        switch (card.difficulty) {
            case 'easy':
                return 'bg-green-100 text-green-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'hard':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Render card - read-only version
    return (
        <div
            className={`bg-white rounded-lg shadow-md overflow-hidden border-2 ${isSelected ? 'border-green-600' : 'border-transparent'}`}
            onClick={onClick}
        >
            <div className="relative">
                <div
                    className={`transition-all duration-500 ${isFlipped ? 'rotateY-180 opacity-0 h-0 overflow-hidden' : 'rotateY-0 opacity-100'}`}
                >
                    {/* Front Side (Question) */}
                    <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${getDifficultyClass()}`}>
                                {card.difficulty}
                            </span>
                        </div>
                        <p className="text-gray-800 font-medium" dangerouslySetInnerHTML={{ __html: card.question }} />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsFlipped(!isFlipped);
                            }}
                            className="mt-4 text-green-600 text-sm hover:underline"
                        >
                            Show Answer
                        </button>
                    </div>
                </div>

                <div
                    className={`transition-all duration-500 ${!isFlipped ? 'rotateY-180 opacity-0 h-0 overflow-hidden' : 'rotateY-0 opacity-100'}`}
                >
                    {/* Back Side (Answer) */}
                    <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${getDifficultyClass()}`}>
                                {card.difficulty}
                            </span>
                        </div>
                        <p className="text-gray-800" dangerouslySetInnerHTML={{ __html: card.answer }} />
                        {/* Source pages */}
                        <div className="mt-3">
                            {card.pageReferences ? (
                                <p className="text-xs text-gray-600 italic mb-1">{card.pageReferences}</p>
                            ) : (
                                <div className="flex flex-wrap gap-1">
                                    {sourcePages.map((page, idx) => (
                                        <span
                                            key={idx}
                                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                                        >
                                            Page {page}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsFlipped(!isFlipped);
                            }}
                            className="mt-4 text-green-600 text-sm hover:underline"
                        >
                            Show Question
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
