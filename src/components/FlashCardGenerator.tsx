import { useCallback, useEffect, useState } from 'react';
import type { FlashCardGenerationStatus, Series } from '../types/index';

const ESTIMATION_TIMEOUT_MS = 10000;
const MIN_CARD_COUNT = 5;
const MAX_CARD_COUNT = 50;
const FALLBACK_ESTIMATION_FACTOR = 4;

interface FlashCardGeneratorProps {
    series: Series;
    status: FlashCardGenerationStatus;
    onStartGeneration: (count: number) => void;
    onCancel: () => void;
}

export function FlashCardGenerator({
    series,
    status,
    onStartGeneration,
    onCancel
}: FlashCardGeneratorProps) {
    const [cardCount, setCardCount] = useState(MIN_CARD_COUNT); // Use MIN_CARD_COUNT
    const [estimatedCount, setEstimatedCount] = useState<number | null>(null);
    const [estimationTimeout, setEstimationTimeout] = useState(false);

    // Reset estimation status when series changes
    useEffect(() => {
        setEstimatedCount(null);
        setEstimationTimeout(false);
    }, [series.id]);

    // Set timeout for estimation to prevent UI from getting stuck
    useEffect(() => {
        let timeoutId: NodeJS.Timeout | null = null;

        if (status.status === 'estimating' && !estimationTimeout && estimatedCount === null) { // Check estimatedCount === null
            timeoutId = setTimeout(() => {
                console.log('Estimation timeout reached');
                setEstimationTimeout(true);
                // Fallback to a reasonable estimate based on page count
                const fallbackEstimate = Math.min(
                    Math.max((series.pages?.length || 0) * FALLBACK_ESTIMATION_FACTOR, MIN_CARD_COUNT),
                    MAX_CARD_COUNT
                );
                setEstimatedCount(fallbackEstimate);
            }, ESTIMATION_TIMEOUT_MS);
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [status.status, estimationTimeout, series.pages?.length, estimatedCount]); // Added estimatedCount to dependencies

    // Update estimated count when status changes
    useEffect(() => {
        if (status.estimatedCount !== undefined && status.estimatedCount !== null) {
            setEstimatedCount(status.estimatedCount);
            // If we get a real estimate, reset the timeout flag
            setEstimationTimeout(false);
        }
    }, [status.estimatedCount]);

    const handleCountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value >= MIN_CARD_COUNT && value <= MAX_CARD_COUNT) {
            setCardCount(value);
        }
    }, []);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        onStartGeneration(cardCount);
    }, [cardCount, onStartGeneration]);

    // Render error state
    if (status.status === 'error') {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                                Flash Card Generation Failed
                            </h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>{status.error || 'An unknown error occurred'}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => onStartGeneration(cardCount)}
                    className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                    Try Again
                </button>
            </div>
        );
    }

    // Render generating state
    if (status.status === 'generating') {
        const progress = status.progress && status.total
            ? Math.round((status.progress / status.total) * 100)
            : 0;

        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Generating Flash Cards</h3>
                <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-green-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                        {status.progress !== undefined && status.total !== undefined
                            ? `${status.progress} of ${status.total} steps complete (${progress}%)`
                            : 'Processing...'}
                    </p>
                </div>
                <button
                    onClick={onCancel}
                    className="py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    Cancel
                </button>
            </div>
        );
    }

    // Render form for generating cards
    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Generate Flash Cards</h3>

            <div className="mb-6">
                <p className="text-gray-600 mb-2">
                    Create flash cards from your series content to help with studying and retention.
                </p>

                {status.status === 'estimating' && !estimationTimeout && estimatedCount === null ? (
                    <div className="flex items-center mt-4 text-gray-600" role="status" aria-live="polite">
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        <p>Estimating optimal number of flash cards...</p>
                    </div>
                ) : estimatedCount !== null ? (
                    <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-3">
                        <p className="text-blue-700">
                            {estimationTimeout
                                ? `Estimation is taking longer than expected. Based on your content, we suggest starting with approximately ${estimatedCount} flash cards.`
                                : `Based on your content, we recommend generating approximately ${estimatedCount} flash cards.`}
                        </p>
                    </div>
                ) : null}
            </div>

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="cardCount" className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Flash Cards
                    </label>
                    <input
                        type="range"
                        id="cardCount"
                        min={MIN_CARD_COUNT}
                        max={MAX_CARD_COUNT}
                        step="1"
                        value={cardCount}
                        onChange={handleCountChange}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{MIN_CARD_COUNT}</span>
                        <span>{cardCount}</span>
                        <span>{MAX_CARD_COUNT}</span>
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 flex justify-center items-center"
                >
                    Generate {cardCount} Flash Cards
                </button>
            </form>
        </div>
    );
}