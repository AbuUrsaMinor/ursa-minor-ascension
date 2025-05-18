import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllSeries } from '../lib/storage';
import type { Series } from '../types';

export function Dashboard() {
    const [series, setSeries] = useState<Series[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSeries = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const allSeries = await getAllSeries();
            // Sort by newest first
            allSeries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setSeries(allSeries);
        } catch (err) {
            setError('Failed to load your series. Please try again.');
            console.error('Error loading series:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSeries();
    }, [loadSeries]);

    // Format date like "May 14, 2023"
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (<div className="pb-20"> {/* Add bottom padding for floating button */}
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold">Your Series</h2>
            <Link
                to="/studypacks"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                StudyPack Library
            </Link>
        </div>

        {isLoading && (
            <div className="flex justify-center my-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        )}

        {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                <p>{error}</p>
                <button
                    onClick={loadSeries}
                    className="mt-2 text-sm font-medium text-red-700 underline"
                >
                    Try Again
                </button>
            </div>
        )}

        {!isLoading && series.length === 0 && !error && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-8 rounded-md text-center">
                <p className="mb-4">You don't have any series yet.</p>
                <p>Tap the "New Series" button below to get started!</p>
            </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {series.map(item => (
                <div
                    key={item.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                    <Link to={`/series/${item.id}`} className="block">
                        <div className="aspect-[4/3] bg-gray-200 relative">
                            {item.pages.length > 0 && item.pages[0].imageBlob && (
                                <img
                                    src={URL.createObjectURL(item.pages[0].imageBlob)}
                                    alt={`First page of ${item.name}`}
                                    className="w-full h-full object-cover"
                                    onLoad={(e) => {
                                        // Clean up the blob URL after image loads to avoid memory leaks
                                        const target = e.target as HTMLImageElement;
                                        setTimeout(() => {
                                            if (target.src.startsWith('blob:')) {
                                                URL.revokeObjectURL(target.src);
                                            }
                                        }, 1000);
                                    }}
                                />
                            )}
                        </div>
                        <div className="p-4">                                <h3 className="font-semibold text-lg mb-1 truncate">{item.name}</h3>
                            <div className="text-sm text-gray-500">
                                <div className="flex justify-between mb-1">
                                    <span>{item.pages.length} {item.pages.length === 1 ? 'page' : 'pages'}</span>
                                    <span>{formatDate(item.createdAt)}</span>
                                </div>
                                {item.flashcards && item.flashcards.length > 0 && (
                                    <div className="text-primary-600 font-medium">
                                        {item.flashcards.length} flash card{item.flashcards.length !== 1 ? 's' : ''}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Link>
                </div>
            ))}
        </div>            {/* Floating "New Series" button - ENLARGED */}
        <Link
            to="/capture"
            className="fixed right-6 bottom-6 sm:right-8 sm:bottom-8 bg-green-600 text-white rounded-full shadow-xl p-5 sm:p-6 flex items-center justify-center hover:bg-green-700 focus:outline-none focus:ring-3 focus:ring-green-500 focus:ring-offset-2 transition-transform hover:scale-105"
            style={{ minWidth: '60px', minHeight: '60px' }}
            aria-label="Create new series"
        >
            <span className="text-3xl">➕</span>
            <span className="ml-3 hidden sm:inline text-lg font-medium">New Series</span>
        </Link>
    </div>
    );
}