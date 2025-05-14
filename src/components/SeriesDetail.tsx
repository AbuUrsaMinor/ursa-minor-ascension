import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteSeries, getSeries } from '../lib/storage';
import type { Series } from '../types';

export function SeriesDetail() {
    const { seriesId } = useParams<{ seriesId: string }>();
    const navigate = useNavigate();

    const [series, setSeries] = useState<Series | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);

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

    const handleDelete = useCallback(async () => {
        if (!seriesId) return;

        try {
            await deleteSeries(seriesId);
            navigate('/');
        } catch (err) {
            setError('Failed to delete series');
            console.error('Error deleting series:', err);
        }
    }, [seriesId, navigate]);

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
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !series) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
                <p className="font-medium mb-2">Error</p>
                <p>{error || 'Failed to load series'}</p>
                <button
                    onClick={() => navigate('/')}
                    className="mt-4 py-2 px-4 bg-primary text-white rounded-md"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    const currentPage = series.pages[currentPageIndex];

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold">{series.name}</h2>
                    <p className="text-gray-500">
                        {series.pages.length} {series.pages.length === 1 ? 'page' : 'pages'} •
                        Created on {formatDate(series.createdAt)}
                    </p>
                </div>
                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-600 py-1 px-3 border border-red-200 rounded-md hover:bg-red-50"
                >
                    Delete
                </button>
            </div>

            {/* Page Navigation */}
            <div className="flex justify-center mb-4">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={goToPrevPage}
                        disabled={currentPageIndex === 0}
                        className="py-1 px-3 border border-gray-300 rounded-md disabled:opacity-40"
                    >
                        Previous
                    </button>
                    <span className="text-sm">
                        Page {currentPageIndex + 1} of {series.pages.length}
                    </span>
                    <button
                        onClick={goToNextPage}
                        disabled={currentPageIndex === series.pages.length - 1}
                        className="py-1 px-3 border border-gray-300 rounded-md disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Current Page */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="sm:flex sm:gap-8">
                    {/* Image */}
                    <div className="sm:w-1/2 mb-6 sm:mb-0">
                        <div className="bg-gray-100 rounded-md overflow-hidden">
                            <img
                                src={URL.createObjectURL(currentPage.imageBlob)}
                                alt={`Page ${currentPageIndex + 1}`}
                                className="w-full object-contain"
                                onLoad={(e) => {
                                    // Clean up blob URL to prevent memory leaks
                                    const target = e.target as HTMLImageElement;
                                    setTimeout(() => {
                                        if (target.src.startsWith('blob:')) {
                                            URL.revokeObjectURL(target.src);
                                        }
                                    }, 1000);
                                }}
                            />
                        </div>
                    </div>

                    {/* Text Content */}
                    <div className="sm:w-1/2">
                        <h3 className="text-lg font-medium mb-4">Text Content</h3>
                        <div className="bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto">
                            {currentPage.text || <em>No text content available</em>}
                        </div>

                        {/* Image Descriptions */}
                        {currentPage.imageDescriptions && currentPage.imageDescriptions.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-lg font-medium mb-2">Image Descriptions</h3>
                                <ul className="bg-gray-50 p-4 rounded-md text-sm space-y-2">
                                    {currentPage.imageDescriptions.map((desc, i) => (
                                        <li key={i}>{desc}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Metadata */}
                        {Object.keys(currentPage.meta).length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-lg font-medium mb-2">Metadata</h3>
                                <dl className="bg-gray-50 p-4 rounded-md grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                    {Object.entries(currentPage.meta).map(([key, value]) => (
                                        value != null && key !== 'figures' && (
                                            <div key={key} className="col-span-2 sm:col-span-1">
                                                <dt className="font-medium">{key}:</dt>
                                                <dd>{String(value)}</dd>
                                            </div>
                                        )
                                    ))}
                                </dl>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <button
                    onClick={() => navigate('/')}
                    className="py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    ← Back to Dashboard
                </button>
            </div>

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-medium mb-3">Delete Series?</h3>
                        <p className="mb-6">
                            Are you sure you want to delete "{series.name}"? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="py-2 px-4 border border-gray-300 rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="py-2 px-4 bg-red-600 text-white rounded-md"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
