// filepath: c:\Users\A550191\git\ursa-minor-ascension\src\components\widgets\cloze\ClozeWidget.tsx
import { useState } from 'react';
import type { ClozeWidget as ClozeWidgetType } from '../../../types';

interface ClozeWidgetProps {
    widget: ClozeWidgetType;
    onComplete?: () => void;
}

export function ClozeWidget({ widget, onComplete }: ClozeWidgetProps) {
    const [revealed, setRevealed] = useState<Record<number, boolean>>({});
    const [userInputs, setUserInputs] = useState<Record<number, string>>({});
    const [isCompleted, setIsCompleted] = useState(false);

    // Extract blank placeholders from the sentence
    const sentenceParts = widget.sentence.split(/(__+)/);

    // Handle revealing a blank
    const handleReveal = (index: number) => {
        setRevealed(prev => ({ ...prev, [index]: true }));
    };

    // Handle user input for a blank
    const handleInputChange = (index: number, value: string) => {
        setUserInputs(prev => ({ ...prev, [index]: value }));
    };

    // Submit user answers
    const handleSubmit = () => {
        setIsCompleted(true);
        if (onComplete) {
            onComplete();
        }
    };

    // Reset the widget
    const handleReset = () => {
        setRevealed({});
        setUserInputs({});
        setIsCompleted(false);
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="text-xs text-gray-500 mb-2">Cloze Deletion</div>

            {/* Context if available */}
            {widget.context && (
                <div className="mb-3 text-gray-700 text-sm">{widget.context}</div>
            )}

            {/* Sentence with blanks */}
            <div className="mb-4 text-lg">
                {sentenceParts.map((part, index) => {
                    if (part.match(/^__+$/)) {
                        // This is a blank
                        const blankIndex = Math.floor(index / 2);
                        const blank = widget.blanks[blankIndex];

                        return (
                            <span key={index} className="relative inline-block">
                                {revealed[blankIndex] || isCompleted ? (
                                    <span className="px-1 bg-green-100 font-medium rounded">
                                        {blank.text}
                                    </span>
                                ) : (
                                    <input
                                        type="text"
                                        className="w-24 border-b-2 border-blue-400 bg-blue-50 focus:outline-none px-1"
                                        placeholder={blank.hint || "..."}
                                        value={userInputs[blankIndex] || ''}
                                        onChange={(e) => handleInputChange(blankIndex, e.target.value)}
                                        disabled={isCompleted}
                                    />
                                )}
                                {!revealed[blankIndex] && !isCompleted && (
                                    <button
                                        onClick={() => handleReveal(blankIndex)}
                                        className="text-xs text-blue-600 hover:text-blue-800 absolute -bottom-5 left-0"
                                    >
                                        Reveal
                                    </button>
                                )}
                            </span>
                        );
                    }
                    return <span key={index}>{part}</span>;
                })}
            </div>

            {/* Source and concepts */}
            <div className="flex flex-wrap gap-1 text-xs text-gray-500 mt-6 mb-2">
                {widget.concepts.map((concept, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 rounded-full">
                        {concept}
                    </span>
                ))}
            </div>

            {/* Page references */}
            {widget.pageReferences && (
                <div className="text-xs text-gray-500">
                    Source: {widget.pageReferences}
                </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end mt-4 space-x-2">
                {isCompleted ? (
                    <button
                        onClick={handleReset}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                    >
                        Reset
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
                    >
                        Check
                    </button>
                )}
            </div>
        </div>
    );
}
