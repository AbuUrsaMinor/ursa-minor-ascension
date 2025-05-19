import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { WidgetCountSummary } from '../components/StudyPackLibrary';
import { useDomain } from '../context/DomainContext';
import type { FlashCard, FlashCardDifficulty as FlashCardDifficultyType, Widget } from '../types/index';
import { FlashCardItemViewer } from './flashcards/FlashCardItemViewer';

interface StudyPackMetadata {
    id: string;
    title: string;
    description: string;
    author: string;
    createdAt: string;
    cardCount: number; // Kept for backward compatibility
    imageCount: number;
    version: string;
    widgets?: WidgetCountSummary[]; // Information about different types of widgets
}

interface StudyPackData {
    metadata: StudyPackMetadata;
    cards: FlashCard[]; // Kept for backward compatibility
    widgets?: Widget[]; // All widget types including flashcards
    pageReferences?: Array<{
        id: string;
        pageNumber?: number;
        chapter?: string;
        bookTitle?: string;
    }>;
}

type FlashCardDifficulty = FlashCardDifficultyType;

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
    const { setDomain } = useDomain();

    // Set viewer domain when this component mounts
    useEffect(() => {
        setDomain('viewer');
    }, [setDomain]);

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
                } const metadata = await metadataResponse.json();

                // Now use the successful base path to get the cards
                const cardsUrl = `${successfulBasePath}/${packId}/cards.json`;
                console.log('Fetching cards from:', cardsUrl);
                cardsResponse = await fetch(cardsUrl);

                if (!cardsResponse.ok) {
                    console.error('Failed to load cards with status:', cardsResponse.status, cardsResponse.statusText);
                    throw new Error(`Failed to load flash cards: ${cardsResponse.statusText}`);
                }

                console.log('Successfully loaded cards from:', cardsUrl);
                const cards = await cardsResponse.json();

                // Try to fetch widgets if available (new format)
                let widgets = undefined;
                try {
                    const widgetsUrl = `${successfulBasePath}/${packId}/widgets.json`;
                    console.log('Fetching widgets from:', widgetsUrl);
                    const widgetsResponse = await fetch(widgetsUrl);

                    if (widgetsResponse.ok) {
                        console.log('Successfully loaded widgets from:', widgetsUrl);
                        widgets = await widgetsResponse.json();
                    }
                } catch (err) {
                    console.warn('No widgets found, using legacy cards only:', err);
                }

                // Try to fetch page references if available
                let pageReferences = undefined;
                try {
                    const referencesUrl = `${successfulBasePath}/${packId}/page-references.json`;
                    console.log('Fetching page references from:', referencesUrl);
                    const referencesResponse = await fetch(referencesUrl);

                    if (referencesResponse.ok) {
                        console.log('Successfully loaded page references from:', referencesUrl);
                        pageReferences = await referencesResponse.json();
                    }
                } catch (err) {
                    console.warn('No page references found:', err);
                } setStudyPack({
                    metadata,
                    cards,
                    widgets,
                    pageReferences
                });
            } catch (err) {
                console.error('Error loading StudyPack:', err);
                setError('Failed to load the StudyPack. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        loadStudyPack();
    }, [packId]);    // Filter cards by difficulty
    const filteredCards = studyPack?.cards.filter(card => {
        if (filterDifficulty === 'all') return true;
        return card.difficulty === filterDifficulty;
    }) || [];

    // Filter widgets of type 'flashcard' by difficulty
    const filteredWidgets = studyPack?.widgets?.filter(widget => {
        if (widget.type !== 'flashcard') return false; // Only handle flashcard widgets for now
        if (filterDifficulty === 'all') return true;
        return (widget as FlashCard).difficulty === filterDifficulty;
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
                    )}                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div>
                            <span className="font-medium">Cards:</span> {studyPack.metadata.cardCount}
                        </div>
                        {studyPack.metadata.widgets && studyPack.metadata.widgets.length > 0 && (
                            <div className="flex gap-2">
                                <span className="font-medium">Widgets:</span>
                                <div className="flex flex-wrap gap-2">
                                    {studyPack.metadata.widgets.map((widget, idx) => (
                                        <span key={idx} className="bg-gray-100 px-2 py-1 rounded text-xs">
                                            {widget.count} {widget.type}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
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
            </div>            <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4">Flash Cards ({filteredCards.length + filteredWidgets.length})</h3>

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
                    {/* Legacy flashcards */}
                    {filteredCards.map((card) => (
                        <FlashCardItemViewer
                            key={card.id}
                            card={card}
                            series={{
                                id: studyPack.metadata.id,
                                name: studyPack.metadata.title,
                                createdAt: studyPack.metadata.createdAt,
                                pages: [], // Empty pages for read-only view
                                flashcards: studyPack.cards
                            }}
                            isSelected={selectedCardId === card.id}
                            onClick={() => setSelectedCardId(card.id === selectedCardId ? null : card.id)}
                        />
                    ))}

                    {/* Widgets of type flashcard */}
                    {filteredWidgets.map((widget) => (
                        <FlashCardItemViewer
                            key={widget.id}
                            card={widget as FlashCard}
                            series={{
                                id: studyPack.metadata.id,
                                name: studyPack.metadata.title,
                                createdAt: studyPack.metadata.createdAt,
                                pages: [], // Empty pages for read-only view
                                widgets: studyPack.widgets
                            }}
                            isSelected={selectedCardId === widget.id}
                            onClick={() => setSelectedCardId(widget.id === selectedCardId ? null : widget.id)}
                        />
                    ))}
                </div>

                {filteredCards.length + filteredWidgets.length === 0 && (
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
