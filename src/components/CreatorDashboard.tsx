import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllSeries } from '../lib/storage';
import type { Series } from '../types';

export function CreatorDashboard() {
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

    if (isLoading) {
        return (
            <div className="flex justify-center my-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md my-4">
                {error}
                <button
                    onClick={loadSeries}
                    className="ml-4 text-red-700 hover:text-red-900 underline"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div>            <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold">My Content</h2>                <Link
                to="/creator/capture"
                className="flex items-center py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                New Series
            </Link>
        </div>

            {series.length === 0 ? (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-md text-center">
                    <p className="font-medium mb-2">No series yet</p>
                    <p className="mb-4">Start by creating your first series to capture content and generate flash cards.</p>                    <Link
                        to="/creator/capture"
                        className="inline-flex items-center py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Capture New Content
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">                    {series.map((item) => (<Link
                    key={item.id}
                    to={`/creator/series/${item.id}`}
                    className="block bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                    <div className="relative pt-[56.25%] bg-gray-100 rounded-t-lg overflow-hidden">
                        {item.pages.length > 0 && item.pages[0].imageBlob ? (
                            <img
                                src={URL.createObjectURL(item.pages[0].imageBlob)}
                                alt={`First page of ${item.name}`}
                                className="absolute top-0 left-0 w-full h-full object-cover"
                                onLoad={(e) => {
                                    // Clean up object URL after image is loaded
                                    const img = e.target as HTMLImageElement;
                                    URL.revokeObjectURL(img.src);
                                }}
                            />
                        ) : (
                            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        )}
                    </div>
                    <div className="p-4">
                        <h3 className="font-medium text-lg mb-1 truncate">{item.name}</h3>
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>{item.pages.length} pages</span>
                            <span>{item.flashcards ? `${item.flashcards.length} cards` : ''}</span>
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                            {formatDate(item.createdAt)}
                        </div>
                        <div className="mt-3 flex justify-end">
                            <span className="text-blue-600 text-sm">Manage →</span>
                        </div>
                    </div>
                </Link>
                ))}
                </div>
            )}
        </div>
    );
}
