import { useEffect, useState } from 'react';
import { useAzure } from '../context/AzureContext';
import { WidgetGenerationRequest } from '../lib/widgetGenerator';
import { cancelWidgetGeneration, startWidgetGeneration } from '../lib/widgetService';
import type { Series, WidgetGenerationStatus } from '../types';

interface WidgetGeneratorProps {
    series: Series;
    onComplete: () => void;
}

// Widget type display information
const widgetTypeInfo = {
    flashcard: { label: 'Flashcards', description: 'Classic Q/A cards for active recall' },
    cloze: { label: 'Cloze Deletions', description: 'Fill-in-the-blank sentences' },
    truefalse: { label: 'True/False Speed Round', description: 'Rapid decision statements' },
    matching: { label: 'Matching Pairs', description: 'Connect terms with definitions' },
    sequence: { label: 'Ordered Sequence', description: 'Arrange steps in correct order' },
    timeline: { label: 'Timeline Builder', description: 'Place events on a timeline' },
    meme: { label: 'Memes', description: 'Humorous visual memory aids' },
    joke: { label: 'Jokes/Roasts', description: 'Humorous one-liners about topics' },
    explain: { label: 'Explain Like I\'m...', description: 'Complex ideas in familiar language' },
    riddle: { label: 'Riddles', description: 'Puzzles that reinforce concepts' },
    oddoneout: { label: 'Odd One Out', description: 'Identify the misfit in a group' }
};

// Type for widget counts
type WidgetCounts = Record<string, number>;

// Default widget counts
const defaultWidgetCounts: WidgetCounts = {
    flashcard: 5,
    cloze: 0,
    truefalse: 0,
    matching: 0,
    sequence: 0,
    timeline: 0,
    meme: 0,
    joke: 0,
    explain: 0,
    riddle: 0,
    oddoneout: 0
};

export function WidgetGenerator({ series, onComplete }: WidgetGeneratorProps) {
    const { config } = useAzure();
    const [widgetCounts, setWidgetCounts] = useState<WidgetCounts>(defaultWidgetCounts);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('mixed');
    const [includeHumor, setIncludeHumor] = useState(false);
    const [style, setStyle] = useState('');
    const [generating, setGenerating] = useState(false);
    const [status, setStatus] = useState<WidgetGenerationStatus>({ status: 'idle' });

    // Count total widgets selected
    const totalWidgets = Object.values(widgetCounts).reduce((sum, count) => sum + count, 0);

    // Maximum limit for total widgets
    const MAX_TOTAL_WIDGETS = 50;

    // Update the widget count for a specific type
    const updateWidgetCount = (type: string, count: number) => {
        // Calculate the current total minus this type
        const currentOthers = totalWidgets - (widgetCounts[type] || 0);

        // Don't allow exceeding the maximum
        const newCount = Math.min(count, MAX_TOTAL_WIDGETS - currentOthers);

        setWidgetCounts({
            ...widgetCounts,
            [type]: newCount
        });
    };

    // Start generating widgets
    const handleGenerate = async () => {
        if (!config || totalWidgets === 0) return;

        // Build the widget configuration
        const request: WidgetGenerationRequest = {
            configuration: {
                widgets: Object.entries(widgetCounts)
                    .filter(([_, count]) => count > 0)
                    .map(([type, count]) => ({ type, count })),
                preferences: {
                    difficulty,
                    includeHumor,
                    style: style || undefined
                }
            },
            maxTotal: MAX_TOTAL_WIDGETS
        };

        try {
            setGenerating(true);

            // Start the widget generation
            await startWidgetGeneration(
                series.id,
                config,
                request,
                (newStatus) => {
                    setStatus(newStatus);

                    // When complete, notify parent component
                    if (newStatus.status === 'complete') {
                        setTimeout(onComplete, 1000);
                    }
                }
            );
        } catch (error) {
            console.error('Error starting widget generation:', error);
            setStatus({
                status: 'error',
                error: error instanceof Error ? error.message : String(error)
            });
            setGenerating(false);
        }
    };

    // Cancel widget generation
    const handleCancel = () => {
        cancelWidgetGeneration();
        setGenerating(false);
        setStatus({ status: 'idle' });
    };

    // Clean up on unmount
    useEffect(() => {
        return () => {
            // Cancel any ongoing generation if component unmounts
            if (generating) {
                cancelWidgetGeneration();
            }
        };
    }, [generating]);

    // Render the status
    const renderStatus = () => {
        switch (status.status) {
            case 'idle':
                return null;
            case 'estimating':
                return (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="flex items-center">
                            <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></span>
                            Estimating number of widgets...
                        </p>
                        {status.message && <p className="text-sm mt-1 text-gray-600">{status.message}</p>}
                    </div>
                );
            case 'generating':
                const progress = status.progress || 0;
                const total = status.total || 1;
                const percent = Math.round((progress / total) * 100);

                return (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="flex items-center">
                            <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></span>
                            Generating widgets... ({progress}/{total})
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${percent}%` }}></div>
                        </div>
                        {status.message && <p className="text-sm mt-1 text-gray-600">{status.message}</p>}

                        {/* Show counts by type if available */}
                        {status.widgetTypeCounts && (
                            <div className="mt-2 text-xs text-gray-600">
                                {Object.entries(status.widgetTypeCounts).map(([type, count]) => (
                                    <span key={type} className="mr-3">
                                        {widgetTypeInfo[type as keyof typeof widgetTypeInfo]?.label || type}: {count}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'complete':
                return (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                        <p className="flex items-center text-green-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Generation complete!
                        </p>
                        {status.message && <p className="text-sm mt-1 text-gray-600">{status.message}</p>}
                    </div>
                );
            case 'error':
                return (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg">
                        <p className="flex items-center text-red-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Error: {status.error}
                        </p>
                    </div>
                );
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Generate Study Widgets</h2>

            {/* Widget selection */}
            <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Select Widget Types</h3>
                <p className="text-sm text-gray-600 mb-3">
                    Choose which types of widgets to generate and how many of each.
                    (Max total: {MAX_TOTAL_WIDGETS})
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(widgetTypeInfo).map(([type, info]) => (
                        <div key={type} className="border rounded-lg p-3 flex flex-col">
                            <div className="flex justify-between items-center mb-1">
                                <label className="font-medium">{info.label}</label>
                                <div className="flex items-center">
                                    <button
                                        className="w-8 h-8 rounded-l bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                                        onClick={() => updateWidgetCount(type, Math.max(0, (widgetCounts[type] || 0) - 1))}
                                        disabled={generating || (widgetCounts[type] || 0) <= 0}
                                    >
                                        -
                                    </button>
                                    <span className="w-8 h-8 flex items-center justify-center bg-gray-100">
                                        {widgetCounts[type] || 0}
                                    </span>
                                    <button
                                        className="w-8 h-8 rounded-r bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                                        onClick={() => updateWidgetCount(type, (widgetCounts[type] || 0) + 1)}
                                        disabled={generating || totalWidgets >= MAX_TOTAL_WIDGETS}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600">{info.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Options */}
            <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Options</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Difficulty selection */}
                    <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1">Difficulty Level</label>
                        <select
                            className="border rounded p-2"
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value as any)}
                            disabled={generating}
                        >
                            <option value="mixed">Mixed (recommended)</option>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>

                    {/* Humor option */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="humor"
                            checked={includeHumor}
                            onChange={(e) => setIncludeHumor(e.target.checked)}
                            disabled={generating}
                            className="mr-2"
                        />
                        <label htmlFor="humor">Include humor where appropriate</label>
                    </div>

                    {/* Style selection */}
                    <div className="flex flex-col md:col-span-2">
                        <label className="text-sm font-medium mb-1">
                            Explanation Style (optional)
                        </label>
                        <div className="flex">
                            <input
                                type="text"
                                placeholder="e.g., '5-year-old', 'skibidi rizz', 'gangsta'"
                                value={style}
                                onChange={(e) => setStyle(e.target.value)}
                                disabled={generating}
                                className="border rounded p-2 flex-grow"
                            />
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                            For 'Explain Like I'm...' widgets, but may influence style of other widgets too
                        </p>
                    </div>
                </div>
            </div>

            {/* Status display */}
            {renderStatus()}

            {/* Buttons */}
            <div className="flex justify-end mt-6 space-x-3">
                {generating && status.status !== 'complete' ? (
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 border border-red-300 text-red-700 rounded hover:bg-red-50"
                    >
                        Cancel
                    </button>
                ) : (
                    <button
                        onClick={onComplete}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                    >
                        Close
                    </button>
                )}

                <button
                    onClick={handleGenerate}
                    disabled={generating || totalWidgets === 0 || !config}
                    className={`px-4 py-2 rounded ${generating || totalWidgets === 0 || !config
                            ? 'bg-blue-300 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                >
                    Generate Widgets
                </button>
            </div>
        </div>
    );
}
