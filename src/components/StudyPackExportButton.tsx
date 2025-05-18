import { useState } from 'react';
import { downloadStudyPack, exportToStudyPack } from '../lib/studyPackExport';
import type { Series } from '../types/index';
import InfoTooltip from './InfoTooltip';

interface StudyPackExportButtonProps {
    series: Series;
    className?: string;
}

interface ExportFormData {
    title: string;
    description: string;
    author: string;
    includeImages: boolean;
}

/**
 * Button component for exporting a series as a StudyPack for developer integration
 */
export function StudyPackExportButton({ series, className = '' }: StudyPackExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [formData, setFormData] = useState<ExportFormData>({
        title: series.name,
        description: '',
        author: '',
        includeImages: true
    });

    // Handle showing the export form
    const handleShowForm = () => {
        setShowForm(true);
        setError(null);
        setSuccess(null);
    };

    // Handle form field changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle export submission
    const handleExport = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setIsExporting(true);
            setError(null);
            setSuccess(null);

            // Validate
            if (!formData.title.trim()) {
                setError('Title is required');
                setIsExporting(false);
                return;
            }

            // Generate the filename
            const sanitizedName = formData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const filename = `${sanitizedName}.studypack`;

            // Export to StudyPack format
            const blob = await exportToStudyPack(series, {
                title: formData.title,
                description: formData.description,
                author: formData.author,
                includeImages: formData.includeImages
            });

            // Download the file
            downloadStudyPack(blob, filename);

            // Show success message
            setSuccess('StudyPack exported successfully. Send this file to the application developer for integration.');

            // Reset form
            setTimeout(() => {
                setShowForm(false);
            }, 3000);

        } catch (err) {
            console.error('Error exporting StudyPack:', err);
            setError(err instanceof Error ? err.message : 'Failed to export StudyPack');
        } finally {
            setIsExporting(false);
        }
    };

    // No flashcards to export
    if (!series.flashcards || series.flashcards.length === 0) {
        return null;
    }

    return (
        <div className="relative">
            {!showForm ? (
                <button
                    onClick={handleShowForm}
                    className={`py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center ${className}`}
                >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Export for Integration
                    <InfoTooltip
                        className="ml-1"
                        text="Export this series as a StudyPack that can be integrated into the application by the developer."
                    />
                </button>
            ) : (
                <div className="absolute top-0 right-0 z-10 w-80 bg-white rounded-lg shadow-xl p-4 border border-gray-200">
                    <h3 className="text-lg font-semibold mb-3">Export StudyPack</h3>

                    <form onSubmit={handleExport}>
                        <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="title">
                                Title*
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                rows={2}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="author">
                                Author
                            </label>
                            <input
                                type="text"
                                id="author"
                                name="author"
                                value={formData.author}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="flex items-center text-sm font-medium text-gray-700">
                                <input
                                    type="checkbox"
                                    name="includeImages"
                                    checked={formData.includeImages}
                                    onChange={handleChange}
                                    className="mr-2"
                                />
                                Include source images
                            </label>
                        </div>

                        {error && (
                            <div className="mb-3 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="mb-3 text-sm text-green-600">
                                {success}
                            </div>
                        )}

                        <div className="flex space-x-2">
                            <button
                                type="submit"
                                disabled={isExporting}
                                className={`flex-1 py-2 px-3 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm ${isExporting ? 'opacity-75 cursor-not-allowed' : ''}`}
                            >
                                {isExporting ? 'Exporting...' : 'Export'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="flex-1 py-2 px-3 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
