import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDomain } from '../context/DomainContext';
import type { StudyPackMetadata } from './StudyPackLibrary';

export function ViewerDashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [studyPacks, setStudyPacks] = useState<StudyPackMetadata[]>([]);
    const { setDomain } = useDomain();

    // Set viewer domain when this component mounts
    useEffect(() => {
        setDomain('viewer');
    }, [setDomain]);

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

    if (isLoading) {
        return (
            <div className="flex justify-center my-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md my-4">
                {error}
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold">Study Materials</h2>                <Link
                    to="/viewer/studypacks"
                    className="flex items-center py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                    </svg>
                    Browse Study Packs
                </Link>
            </div>

            {studyPacks.length === 0 ? (
                <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md text-center">
                    <p className="font-medium mb-2">No study materials available</p>
                    <p className="mb-4">Check out the pre-made study packs to get started learning.</p>                    <Link
                        to="/viewer/studypacks"
                        className="inline-flex items-center py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Browse Study Packs
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {studyPacks.map((pack) => (
                        <Link
                            key={pack.id}
                            to={`/viewer/studypack/${pack.id}`}
                            className="block bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="p-5">
                                <h3 className="font-medium text-lg mb-1 truncate">{pack.title}</h3>
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>{pack.cardCount} cards</span>
                                    <span>{formatDate(pack.createdAt)}</span>
                                </div>
                                <div className="mt-3 flex justify-end">
                                    <span className="text-green-600 text-sm">Study Now →</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Learning Tips Section */}
            <div className="mt-10">
                <h3 className="text-lg font-semibold mb-4">Learning Tips</h3>
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                    <p className="text-gray-600 mb-4">
                        For the best learning experience:
                    </p>
                    <ul className="list-disc pl-5 text-gray-600 mb-4">
                        <li>Review flashcards regularly for better retention</li>
                        <li>Use the difficulty filters to focus on challenging cards</li>
                        <li>Create a study schedule to maintain consistency</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
