import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { FlashCard } from '../types/index';
import { FlashCardItem } from './FlashCardItem';

// Helper function to resolve StudyPack paths
const resolveStudyPackResourceUrl = (basePath: string, packId: string, resourcePath: string): string => {
    return `${basePath}/${packId}/${resourcePath}`;
};

// Helper function to resolve StudyPack paths with fallbacks
const resolveStudyPackUrl = (packId: string, path: string): string => {
    const basePaths = [
        `.`, // Relative to current path
        ``, // Root path
        `/public` // With public prefix
    ];

    // Return a URL with a cache-busting parameter to avoid browser caching issues
    return `${basePaths[0]}/studypacks/${packId}/${path}?t=${Date.now()}`;
};

interface StudyPackMetadata {
    id: string;
    title: string;
    description: string;
    author: string;
    createdAt: string;
    cardCount: number;
    imageCount: number;
    version: string;
}

interface StudyPackData {
    metadata: StudyPackMetadata;
    cards: FlashCard[];
}

type FlashCardDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Component for viewing a specific StudyPack
 */
export function StudyPackView() {
    const { packId } = useParams<{ packId: string }>();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [studyPack, setStudyPack] = useState<StudyPackData | null>(null);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [filterDifficulty, setFilterDifficulty] = useState<FlashCardDifficulty | 'all'>('all');

    // Load the StudyPack data
    useEffect(() => {
        const loadStudyPack = async () => {
            if (!packId) return;

            try {
                setIsLoading(true);
                setError(null);

                // List of paths to try for getting resources
                const basePaths = [
                    './studypacks', // Relative to current path
                    '/studypacks', // Root path
                    '/public/studypacks' // With public prefix
                ];

                let metadataResponse = null;
                let cardsResponse = null;
                let successfulBasePath = '';

                // Try each path until we get a successful response
                for (const basePath of basePaths) {
                    try {
                        const metadataUrl = `${basePath}/${packId}/metadata.json`;
                        console.log('Trying to fetch metadata from:', metadataUrl); metadataResponse = await fetch(metadataUrl);
                        if (metadataResponse.ok) {
                            console.log('Successfully loaded metadata from:', metadataUrl);
                            console.log('Using successful base path for all StudyPack resources:', basePath);
                            successfulBasePath = basePath;
                            break;
                        }
                    } catch (err) {
                        console.warn(`Failed to fetch from ${basePath}, trying next...`);
                    }
                } if (!metadataResponse?.ok) {
                    console.error('Failed to load StudyPack metadata from any paths. Tried:', basePaths.join(', '));
                    throw new Error(`Failed to load StudyPack: Not Found`);
                }

                const metadata = await metadataResponse.json();                // Now use the successful base path to get the cards
                const cardsUrl = `${successfulBasePath}/${packId}/cards.json`;
                console.log('Fetching cards from:', cardsUrl);
                cardsResponse = await fetch(cardsUrl);

                if (!cardsResponse.ok) {
                    console.error('Failed to load cards with status:', cardsResponse.status, cardsResponse.statusText);
                    throw new Error(`Failed to load flash cards: ${cardsResponse.statusText}`);
                }

                console.log('Successfully loaded cards from:', cardsUrl);

                const cards = await cardsResponse.json();

                setStudyPack({
                    metadata,
                    cards
                });
            } catch (err) {
                console.error('Error loading StudyPack:', err);
                setError('Failed to load the StudyPack. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        loadStudyPack();
    }, [packId]);

    // Filter cards by difficulty
    const filteredCards = studyPack?.cards.filter(card => {
        if (filterDifficulty === 'all') return true;
        return card.difficulty === filterDifficulty;
    }) || [];

    // Format date like "May 14, 2023"
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Handle back button
    const handleBack = () => {
        navigate(-1);
    };

    // If loading
    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-center my-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    // If error
    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                    {error}
                </div>                <button
                    onClick={handleBack}
                    className="py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                    Go Back
                </button>
            </div>
        );
    }

    // If no StudyPack found
    if (!studyPack) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">StudyPack Not Found</h3>
                    <p className="text-gray-600 mb-4">
                        The requested study materials could not be found.
                    </p>                    <button
                        onClick={handleBack}
                        className="py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <button
                onClick={handleBack}
                className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
            >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
            </button>

            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-2">{studyPack.metadata.title}</h2>

                    {studyPack.metadata.author && (
                        <p className="text-gray-600 mb-2">By {studyPack.metadata.author}</p>
                    )}

                    {studyPack.metadata.description && (
                        <p className="text-gray-700 mb-4">{studyPack.metadata.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div>
                            <span className="font-medium">Cards:</span> {studyPack.metadata.cardCount}
                        </div>
                        {studyPack.metadata.imageCount > 0 && (
                            <div>
                                <span className="font-medium">Images:</span> {studyPack.metadata.imageCount}
                            </div>
                        )}
                        <div>
                            <span className="font-medium">Created:</span> {formatDate(studyPack.metadata.createdAt)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4">Flash Cards ({filteredCards.length})</h3>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Filter by Difficulty
                    </label>
                    <select
                        value={filterDifficulty}
                        onChange={(e) => setFilterDifficulty(e.target.value as FlashCardDifficulty | 'all')}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                    >
                        <option value="all">All Levels</option>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredCards.map((card) => (
                        <FlashCardItem
                            key={card.id}
                            card={card}
                            series={{
                                id: studyPack.metadata.id,
                                name: studyPack.metadata.title,
                                createdAt: studyPack.metadata.createdAt,
                                pages: [], // Empty pages for read-only view
                                flashcards: studyPack.cards
                            }} isSelected={selectedCardId === card.id}
                            onClick={() => setSelectedCardId(card.id === selectedCardId ? null : card.id)}
                            onDelete={() => { }} // No-op function for read-only mode
                        />
                    ))}
                </div>

                {filteredCards.length === 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-6 text-center">
                        <p className="text-gray-600">
                            No flash cards found matching your filter criteria.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
