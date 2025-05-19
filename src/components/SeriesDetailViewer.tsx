import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDomain } from '../context/DomainContext';
import { getSeries } from '../lib/storage';
import type { Series } from '../types';
import { FlashCards } from './flashcards/FlashCards';

export function SeriesDetailViewer() {
    const { seriesId } = useParams<{ seriesId: string }>();
    const navigate = useNavigate();
    const { setDomain } = useDomain();

    const [series, setSeries] = useState<Series | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<'content' | 'flashcards'>('flashcards');

    // Set domain to viewer when this component is mounted
    useEffect(() => {
        setDomain('viewer');
    }, [setDomain]);

    // Load series data
    useEffect(() => {
        async function loadSeries() {
            if (!seriesId) {
                setError('No series ID provided');
                setIsLoading(false);
                return;
            }

            try {
                const seriesData = await getSeries(seriesId);
                if (!seriesData) {
                    setError('Series not found');
                } else {
                    setSeries(seriesData);
                }
            } catch (err) {
                setError('Failed to load series');
                console.error('Error loading series:', err);
            } finally {
                setIsLoading(false);
            }
        }

        loadSeries();
    }, [seriesId]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Navigation between pages
    const goToNextPage = useCallback(() => {
        if (!series) return;
        setCurrentPageIndex(prev => Math.min(prev + 1, series.pages.length - 1));
    }, [series]);

    const goToPrevPage = useCallback(() => {
        setCurrentPageIndex(prev => Math.max(prev - 1, 0));
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center my-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (error || !series) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
                <p className="font-medium mb-2">Error</p>
                <p>{error || 'Failed to load series'}</p>
                <button
                    onClick={() => navigate('/viewer/dashboard')}
                    className="mt-4 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                    Back to Library
                </button>
            </div>
        );
    }

    // Series must have flashcards to be viewed in study mode
    if (!series.flashcards || series.flashcards.length === 0) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-md">
                <p className="font-medium mb-2">No Study Content Available</p>
                <p>This series doesn't have any flashcards to study.</p>
                <button
                    onClick={() => navigate('/viewer/dashboard')}
                    className="mt-4 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                    Back to Library
                </button>
            </div>
        );
    }

    const currentPage = series.pages[currentPageIndex];

    return (
        <div>
            {/* Header with series info and back button */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
                <div>
                    <button
                        onClick={() => navigate('/viewer/dashboard')}
                        className="text-gray-600 hover:text-gray-900 mb-2 flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Back to Library
                    </button>
                    <h2 className="text-xl sm:text-2xl font-semibold">{series.name}</h2>
                    <p className="text-gray-500 text-sm">
                        {series.flashcards.length} flashcards • {series.pages.length} pages • Created {formatDate(series.createdAt)}
                    </p>
                </div>
            </div>

            {/* Tab navigation */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('flashcards')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'flashcards'
                            ? 'border-green-600 text-green-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Flash Cards
                    </button>
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'content'
                            ? 'border-green-600 text-green-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Reference Materials
                    </button>
                </nav>
            </div>

            {/* Flashcards tab */}
            {activeTab === 'flashcards' && (
                <FlashCards series={series} onSeriesUpdate={(updatedSeries) => setSeries(updatedSeries)} readOnly={true} />
            )}

            {/* Content tab */}
            {activeTab === 'content' && (
                <div>
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        {/* Image */}
                        <div className="bg-gray-100 p-4 flex justify-center">
                            <img
                                src={URL.createObjectURL(currentPage.imageBlob)}
                                alt={`Page ${currentPageIndex + 1}`}
                                className="max-h-[60vh] rounded-md shadow-sm"
                                onLoad={(e) => {
                                    // Clean up object URL after image is loaded
                                    const img = e.target as HTMLImageElement;
                                    URL.revokeObjectURL(img.src);
                                }}
                            />
                        </div>

                        {/* Content and navigation */}
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <div className="text-sm text-gray-500">
                                    Page {currentPageIndex + 1} of {series.pages.length}
                                    {currentPage.meta.pageNumber ? ` (Page ${currentPage.meta.pageNumber})` : ''}
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={goToPrevPage}
                                        disabled={currentPageIndex === 0}
                                        className={`p-2 rounded-full ${currentPageIndex === 0
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={goToNextPage}
                                        disabled={currentPageIndex === series.pages.length - 1}
                                        className={`p-2 rounded-full ${currentPageIndex === series.pages.length - 1
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
                                {/* Extracted text */}
                                <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">{currentPage.text}</div>

                                {/* Metadata */}
                                {(currentPage.meta.chapter || currentPage.meta.bookTitle) && (
                                    <div className="mt-4 text-sm text-gray-500">
                                        {currentPage.meta.chapter && <div>Chapter: {currentPage.meta.chapter}</div>}
                                        {currentPage.meta.bookTitle && <div>Book: {currentPage.meta.bookTitle}</div>}
                                    </div>
                                )}

                                {/* Image descriptions */}
                                {currentPage.imageDescriptions && currentPage.imageDescriptions.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Image Descriptions:</h4>
                                        <ul className="list-disc pl-5 text-sm text-gray-600">
                                            {currentPage.imageDescriptions.map((desc, idx) => (
                                                <li key={idx}>{desc}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
