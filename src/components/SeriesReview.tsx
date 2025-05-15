import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useAzure } from '../context/AzureContext';
import { useSeriesDraft } from '../context/SeriesDraftContext';
import { imageProcessor } from '../lib/imageProcessor';
import { saveSeries } from '../lib/storage';

export function SeriesReview() {
    const navigate = useNavigate();
    const { draft, updatePage, removePage, setSeriesName, clearDraft } = useSeriesDraft();
    const { endpoint, apiKey } = useAzure();
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<{ name?: string }>({});
    const [editingTextId, setEditingTextId] = useState<string | null>(null);
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
    const [showNameDialog, setShowNameDialog] = useState(false);

    // Check if we have a draft to work with
    if (!draft) {
        // Redirect back to home if there's no draft
        navigate('/');
        return null;
    }

    const handleTextEdit = useCallback((id: string) => {
        setEditingTextId(id);
    }, []);

    const handleSaveText = useCallback((id: string, text: string) => {
        updatePage(id, { text });
        setEditingTextId(null);
    }, [updatePage]);

    const handleDelete = useCallback((id: string) => {
        removePage(id);
    }, [removePage]); const handleRetake = useCallback((id: string) => {
        // Remove the page and redirect back to capture
        removePage(id);
        navigate('/capture');
    }, [removePage, navigate]);

    const handleRetryProcessing = useCallback((pageId: string) => {
        if (!draft || !endpoint || !apiKey) return;

        // Find the page in the draft
        const page = draft.pages.find(p => p.id === pageId);
        if (!page) return;

        // Create base64 from blob
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64data = reader.result?.toString().split(',')[1];
            if (!base64data) return;

            // Update page status to pending
            updatePage(pageId, { status: 'pending', error: undefined });            // Add to processing queue
            imageProcessor.enqueue(
                pageId,
                base64data,
                { endpoint, apiKey },
                (result) => {
                    // On successful processing
                    updatePage(pageId, {
                        text: result.text,
                        imageDescriptions: result.imageDescriptions,
                        meta: result.meta,
                        status: 'complete'
                    });
                },
                (error, id) => {
                    // On error
                    updatePage(id, {
                        error: error.message,
                        status: 'error'
                    });
                },
                // Status change callback to keep UI in sync
                (id, status) => {
                    console.log(`Status update in SeriesReview: ${id} → ${status}`);
                    updatePage(id, { status });
                }
            );
        };
        reader.readAsDataURL(page.imageBlob);
    }, [draft, endpoint, apiKey, updatePage]);

    const handleSaveSeries = useCallback(async () => {
        if (!draft || !draft.name) {
            setErrors({ name: 'Please enter a series name' });
            return;
        }

        setIsSaving(true);

        try {
            // Create the complete series object with ID and creation date
            const fullSeries = {
                id: uuidv4(),
                name: draft.name,
                createdAt: new Date().toISOString(),
                pages: draft.pages
            };

            // Save to IndexedDB
            await saveSeries(fullSeries);

            // Clear the draft
            clearDraft();

            // Navigate to dashboard
            navigate('/');
        } catch (error) {
            console.error('Error saving series:', error);
            // Handle error
        } finally {
            setIsSaving(false);
        }
    }, [draft, clearDraft, navigate]);

    const handleStartSave = useCallback(() => {
        setShowNameDialog(true);
    }, []);

    const handleNameSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;

        if (!name?.trim()) {
            setErrors({ name: 'Please enter a series name' });
            return;
        }

        setSeriesName(name);
        setShowNameDialog(false);
        setErrors({});
        handleSaveSeries();
    }, [setSeriesName, handleSaveSeries]);

    const handleDiscard = useCallback(() => {
        clearDraft();
        navigate('/');
    }, [clearDraft, navigate]);

    return (
        <div className="max-w-4xl mx-auto pb-16">
            <h2 className="text-xl sm:text-2xl font-semibold mb-6">Review Series</h2>

            {draft.pages.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md mb-6">
                    <p>No pages in this series. Please add at least one page.</p>                    <button
                        onClick={() => navigate('/capture')}
                        className="mt-4 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Capture Pages
                    </button>
                </div>
            ) : (
                <>
                    <div className="space-y-8">
                        {draft.pages.map((page, index) => (
                            <div key={page.id} className="bg-white p-4 rounded-lg shadow-md">
                                <div className="sm:flex sm:gap-6">
                                    {/* Image Preview */}                                    <div className="sm:w-1/3 mb-4 sm:mb-0">
                                        <div className="bg-gray-200 rounded-md overflow-hidden relative">                                        {page.status === 'queued' && (
                                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                                <div className="bg-white px-3 py-2 rounded-md">
                                                    <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full mx-auto"></div>
                                                    <p className="text-sm mt-1">Queued</p>
                                                </div>
                                            </div>
                                        )}

                                            {page.status === 'pending' && (
                                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                                    <div className="bg-white px-3 py-2 rounded-md">
                                                        <div className="w-6 h-6 border-2 border-gray-300 rounded-full mx-auto"></div>
                                                        <p className="text-sm mt-1">Pending</p>
                                                    </div>
                                                </div>
                                            )}

                                            {page.status === 'processing' && (
                                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                                    <div className="bg-white px-3 py-2 rounded-md">
                                                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary mx-auto"></div>
                                                        <p className="text-sm mt-1">Processing</p>
                                                    </div>
                                                </div>
                                            )}

                                            {page.status === 'error' && (
                                                <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center">
                                                    <div className="bg-white p-3 rounded-md max-w-[90%]">
                                                        <p className="text-sm text-red-600 mb-2">{page.error || 'Processing failed'}</p>                                                        <button
                                                            onClick={() => handleRetryProcessing(page.id)}
                                                            className="text-sm bg-blue-600 text-white py-1 px-2 rounded-md w-full hover:bg-blue-700"
                                                        >
                                                            Retry Processing
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            <img
                                                src={URL.createObjectURL(page.imageBlob)}
                                                alt={`Page ${index + 1}`}
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
                                        <div className="mt-2 flex justify-between">
                                            <button
                                                onClick={() => handleRetake(page.id)}
                                                className="text-sm text-gray-600 hover:text-primary"
                                            >
                                                Retake
                                            </button>
                                            <button
                                                onClick={() => handleDelete(page.id)}
                                                className="text-sm text-red-600 hover:text-red-700"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>

                                    {/* Text Content */}
                                    <div className="sm:w-2/3">
                                        <div className="mb-2 flex justify-between items-center">
                                            <h3 className="font-medium">Page {index + 1}</h3>
                                            {editingTextId !== page.id && (
                                                <button
                                                    onClick={() => handleTextEdit(page.id)}
                                                    className="text-sm text-blue-600 hover:text-blue-700"
                                                >
                                                    Edit Text
                                                </button>
                                            )}
                                        </div>

                                        {editingTextId === page.id ? (
                                            <div className="mt-2">
                                                <textarea
                                                    className="w-full border border-gray-300 rounded-md p-2 h-48"
                                                    defaultValue={page.text}
                                                />
                                                <div className="mt-2 flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => setEditingTextId(null)}
                                                        className="py-1 px-3 border border-gray-300 rounded"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const textarea = document.querySelector('textarea');
                                                            if (textarea) {
                                                                handleSaveText(page.id, textarea.value);
                                                            }
                                                        }}
                                                        className="py-1 px-3 bg-blue-600 text-white rounded"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 p-3 rounded-md text-sm max-h-48 overflow-y-auto">
                                                {page.text || <em>No text extracted</em>}
                                            </div>
                                        )}

                                        {/* Image Descriptions */}
                                        {page.imageDescriptions && page.imageDescriptions.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="text-sm font-medium mb-1">Image Descriptions:</h4>
                                                <ul className="text-sm text-gray-600">
                                                    {page.imageDescriptions.map((desc, i) => (
                                                        <li key={i} className="mb-1">{desc}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Metadata */}
                                        {Object.keys(page.meta).length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="text-sm font-medium mb-1">Metadata:</h4>
                                                <dl className="text-sm grid grid-cols-2 gap-x-4 gap-y-1">
                                                    {Object.entries(page.meta).map(([key, value]) => (
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
                        ))}
                    </div>

                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
                        <div className="max-w-4xl mx-auto flex justify-between">
                            <button
                                onClick={() => setShowDiscardConfirm(true)}
                                className="py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Discard
                            </button>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => navigate('/capture')}
                                    className="py-2 px-4 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
                                >
                                    Add More Pages
                                </button>
                                <button
                                    onClick={handleStartSave}
                                    disabled={draft.pages.length === 0 || isSaving}
                                    className="py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : 'Save Series'}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Discard Confirmation Dialog */}
            {showDiscardConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-medium mb-3">Discard Series?</h3>
                        <p className="mb-6">Are you sure you want to discard this series? All captured pages will be lost.</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDiscardConfirm(false)}
                                className="py-2 px-4 border border-gray-300 rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDiscard}
                                className="py-2 px-4 bg-red-600 text-white rounded-md"
                            >
                                Discard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Name Dialog */}
            {showNameDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-medium mb-3">Name Your Series</h3>
                        <form onSubmit={handleNameSubmit}>
                            <div className="mb-4">
                                <label htmlFor="name" className="block mb-1 text-sm font-medium">
                                    Series Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    defaultValue={draft.name || ''}
                                    className="w-full border border-gray-300 rounded-md p-2"
                                    autoFocus
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                )}
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowNameDialog(false);
                                        setErrors({});
                                    }}
                                    className="py-2 px-4 border border-gray-300 rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
