import { useState } from 'react';
import type { FlashCard, Series } from '../types/index';
import './FlashCards.css';

interface FlashCardItemProps {
    card: FlashCard;
    series: Series;
    isSelected: boolean;
    onClick: () => void;
    onDelete: () => void;
}

export function FlashCardItem({ card, series, isSelected, onClick, onDelete }: FlashCardItemProps) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedQuestion, setEditedQuestion] = useState(card.question);
    const [editedAnswer, setEditedAnswer] = useState(card.answer);

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

    // Handle saving edits
    const handleSave = () => {
        // TODO: Implement saving edits
        setIsEditing(false);
    };

    // Render edit form
    if (isEditing) {
        return (
            <div className={`bg-white rounded-lg shadow-md overflow-hidden border-2 ${isSelected ? 'border-primary' : 'border-transparent'}`}>
                <div className="p-4">
                    <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Question
                        </label>
                        <textarea
                            value={editedQuestion}
                            onChange={(e) => setEditedQuestion(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            rows={2}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Answer
                        </label>
                        <textarea
                            value={editedAnswer}
                            onChange={(e) => setEditedAnswer(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            rows={3}
                        />
                    </div>

                    <div className="flex justify-end space-x-2 mt-4">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="py-1 px-3 border border-gray-300 rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="py-1 px-3 bg-primary text-white rounded-md"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Render card
    return (
        <div
            className={`bg-white rounded-lg shadow-md overflow-hidden border-2 ${isSelected ? 'border-primary' : 'border-transparent'}`}
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
                            <div className="flex space-x-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEditing(true);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete();
                                    }}
                                    className="text-gray-400 hover:text-red-600 p-1"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <p className="text-gray-800 font-medium" dangerouslySetInnerHTML={{ __html: card.question }} />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsFlipped(!isFlipped);
                            }}
                            className="mt-4 text-primary text-sm hover:underline"
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
                            <div className="flex space-x-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEditing(true);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete();
                                    }}
                                    className="text-gray-400 hover:text-red-600 p-1"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <p className="text-gray-800" dangerouslySetInnerHTML={{ __html: card.answer }} />

                        {/* Source pages */}
                        <div className="mt-3 flex flex-wrap gap-1">
                            {sourcePages.map((page, idx) => (
                                <span
                                    key={idx}
                                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                                >
                                    Page {page}
                                </span>
                            ))}
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsFlipped(!isFlipped);
                            }}
                            className="mt-4 text-primary text-sm hover:underline"
                        >
                            Show Question
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
