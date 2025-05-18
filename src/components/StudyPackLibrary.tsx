import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export interface StudyPackMetadata {
    id: string;
    title: string;
    description: string;
    author: string;
    createdAt: string;
    cardCount: number;
    imageCount: number;
    version: string;
}

export interface StudyPackManifest {
    version: string;
    updatedAt: string;
    packs: StudyPackMetadata[];
}

/**
 * Component that displays the available StudyPacks from the manifest
 */
export function StudyPackLibrary() {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [studyPacks, setStudyPacks] = useState<StudyPackMetadata[]>([]);

    // Load the manifest and available StudyPacks
    useEffect(() => {
        const loadStudyPacks = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Import the utility to avoid circular dependencies
                const { loadStudyPackManifest } = await import('../lib/studyPackManifest');

                // Use our utility function that handles different paths and fallbacks
                const manifest = await loadStudyPackManifest();
                console.log('Loaded manifest:', manifest);

                setStudyPacks(manifest.packs || []);
            } catch (err) {
                console.error('Error loading StudyPacks:', err);
                setError('Failed to load available StudyPacks. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        loadStudyPacks();
    }, []);

    // Format date like "May 14, 2023"
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // If loading
    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-center my-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    // If error
    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md my-4">
                    {error}
                </div>
            </div>
        );
    }

    // If no StudyPacks available
    if (studyPacks.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center mb-6">
                    <Link
                        to="/"
                        className="mr-4 text-gray-600 hover:text-gray-900"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <h2 className="text-xl sm:text-2xl font-semibold">StudyPack Library</h2>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center my-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No StudyPacks Available</h3>
                    <p className="text-gray-600">
                        There are no pre-made study materials available yet. Check back later for updates.
                    </p>
                </div>
            </div>
        );
    }

    // Render StudyPacks grid
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center mb-6">
                <Link
                    to="/"
                    className="mr-4 text-gray-600 hover:text-gray-900"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </Link>
                <h2 className="text-xl sm:text-2xl font-semibold">StudyPack Library</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {studyPacks.map((pack) => (
                    <div
                        key={pack.id}
                        className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                    >
                        <div className="p-5">
                            <h3 className="text-lg font-semibold mb-2 truncate">{pack.title}</h3>

                            {pack.author && (
                                <p className="text-sm text-gray-600 mb-2">By {pack.author}</p>
                            )}

                            <p className="text-sm text-gray-700 h-12 overflow-hidden mb-3">
                                {pack.description || 'No description available.'}
                            </p>

                            <div className="flex justify-between text-sm text-gray-500 mb-4">
                                <span>{pack.cardCount} flash cards</span>
                                <span>{formatDate(pack.createdAt)}</span>
                            </div>                            <Link
                                to={`/studypack/${pack.id}`}
                                className="block w-full text-center py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                                View Study Materials
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
