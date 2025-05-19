import { useState } from 'react';
import type { TrueFalseWidget as TrueFalseWidgetType } from '../../types';

interface TrueFalseWidgetProps {
    widget: TrueFalseWidgetType;
    onComplete?: () => void;
}

export function TrueFalseWidget({ widget, onComplete }: TrueFalseWidgetProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, boolean>>({});
    const [revealed, setRevealed] = useState<Record<number, boolean>>({});
    const [timeLeft, setTimeLeft] = useState(3); // 3-second timer
    const [timerActive, setTimerActive] = useState(false);
    const [completed, setCompleted] = useState(false);

    const currentStatement = widget.statements[currentIndex];
    const totalStatements = widget.statements.length;

    // Handle true/false selection
    const handleSelection = (isTrue: boolean) => {
        // Record the answer
        setAnswers(prev => ({ ...prev, [currentIndex]: isTrue }));

        // Show the explanation
        setRevealed(prev => ({ ...prev, [currentIndex]: true }));

        // Stop the timer
        setTimerActive(false);

        // If we've reached the end, mark as completed
        if (currentIndex === totalStatements - 1) {
            setCompleted(true);
            if (onComplete) {
                onComplete();
            }
        }
    };

    // Move to the next statement
    const handleNext = () => {
        if (currentIndex < totalStatements - 1) {
            setCurrentIndex(currentIndex + 1);
            setTimeLeft(3);
            setTimerActive(true);
        }
    };

    // Reset the widget
    const handleReset = () => {
        setCurrentIndex(0);
        setAnswers({});
        setRevealed({});
        setTimeLeft(3);
        setTimerActive(false);
        setCompleted(false);
    };

    // Start the quiz
    const handleStart = () => {
        setTimerActive(true);
    };

    // Timer effect
    useState(() => {
        let interval: number | null = null;

        if (timerActive && timeLeft > 0) {
            interval = window.setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        // Time's up, handle as skipped
                        setTimerActive(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (interval !== null) {
                clearInterval(interval);
            }
        };
    });

    // Calculate score
    const getScore = () => {
        let correct = 0;
        for (const [index, answer] of Object.entries(answers)) {
            if (answer === widget.statements[Number(index)].isTrue) {
                correct++;
            }
        }
        return `${correct}/${totalStatements}`;
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="text-xs text-gray-500 mb-2">True/False Speed Round</div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
                <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${(currentIndex / totalStatements) * 100}%` }}
                ></div>
            </div>

            {!timerActive && currentIndex === 0 && !completed ? (
                <div className="text-center py-4">
                    <h3 className="text-lg font-medium mb-2">Quick True/False Challenge</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        You have 3 seconds to decide if each statement is true or false.
                    </p>
                    <button
                        onClick={handleStart}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Start Challenge
                    </button>
                </div>
            ) : completed ? (
                <div className="text-center py-4">
                    <h3 className="text-lg font-medium mb-2">Challenge Complete!</h3>
                    <p className="text-sm text-gray-600 mb-2">Your score: {getScore()}</p>
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    >
                        Try Again
                    </button>
                </div>
            ) : (
                <div>
                    {/* Timer */}
                    {timerActive && (
                        <div className="flex justify-center mb-4">
                            <div className={`text-xl font-bold w-10 h-10 flex items-center justify-center rounded-full ${timeLeft > 1 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                                }`}>
                                {timeLeft}
                            </div>
                        </div>
                    )}

                    {/* Current statement */}
                    <div className="mb-4 text-center py-6">
                        <p className="text-xl font-medium">{currentStatement.text}</p>
                    </div>

                    {/* True/False buttons */}
                    <div className="flex justify-center space-x-4 mb-4">
                        <button
                            onClick={() => handleSelection(true)}
                            disabled={revealed[currentIndex]}
                            className={`px-6 py-3 rounded-lg font-medium text-white ${revealed[currentIndex]
                                    ? currentStatement.isTrue
                                        ? 'bg-green-500'
                                        : 'bg-gray-400'
                                    : 'bg-green-600 hover:bg-green-700'
                                }`}
                        >
                            TRUE
                        </button>
                        <button
                            onClick={() => handleSelection(false)}
                            disabled={revealed[currentIndex]}
                            className={`px-6 py-3 rounded-lg font-medium text-white ${revealed[currentIndex]
                                    ? !currentStatement.isTrue
                                        ? 'bg-green-500'
                                        : 'bg-gray-400'
                                    : 'bg-red-600 hover:bg-red-700'
                                }`}
                        >
                            FALSE
                        </button>
                    </div>

                    {/* Explanation when revealed */}
                    {revealed[currentIndex] && (
                        <div className="mb-4">
                            <p className={`p-3 rounded text-sm ${currentStatement.isTrue ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                                }`}>
                                <span className="font-medium">
                                    {currentStatement.isTrue ? 'TRUE: ' : 'FALSE: '}
                                </span>
                                {currentStatement.explanation}
                            </p>
                        </div>
                    )}

                    {/* Next button */}
                    {revealed[currentIndex] && currentIndex < totalStatements - 1 && (
                        <div className="flex justify-center mt-4">
                            <button
                                onClick={handleNext}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Next Statement
                            </button>
                        </div>
                    )}
                </div>
            )}

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
        </div>
    );
}
