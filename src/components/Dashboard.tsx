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

    return (
        <div className="pb-20"> {/* Add bottom padding for floating button */}
            <h2 className="text-xl sm:text-2xl font-semibold mb-6">Your Series</h2>

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
                            <div className="p-4">
                                <h3 className="font-semibold text-lg mb-1 truncate">{item.name}</h3>
                                <div className="text-sm text-gray-500 flex justify-between">
                                    <span>{item.pages.length} {item.pages.length === 1 ? 'page' : 'pages'}</span>
                                    <span>{formatDate(item.createdAt)}</span>
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>            {/* Floating "New Series" button - ENLARGED */}
            <Link
                to="/capture"
                className="fixed right-6 bottom-6 sm:right-8 sm:bottom-8 bg-primary text-white rounded-full shadow-xl p-5 sm:p-6 flex items-center justify-center hover:bg-primary-dark focus:outline-none focus:ring-3 focus:ring-primary focus:ring-offset-2 transition-transform hover:scale-105"
                style={{ minWidth: '60px', minHeight: '60px' }}
                aria-label="Create new series"
            >
                <span className="text-3xl">➕</span>
                <span className="ml-3 hidden sm:inline text-lg font-medium">New Series</span>
            </Link>
        </div>
    );
}