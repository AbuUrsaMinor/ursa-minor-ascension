import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useAzure } from '../context/AzureContext';
import { useSeriesDraft } from '../context/SeriesDraftContext';
import { imageProcessor } from '../lib/imageProcessor';
import { Camera } from './Camera';
import { ProcessingStatus } from './ProcessingStatus';

type CaptureState = 'camera' | 'preview' | 'processing' | 'error';

export function CaptureView() {
    const navigate = useNavigate();
    const [captureState, setCaptureState] = useState<CaptureState>('camera');
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const { draft, initializeDraft, addPage, updatePage } = useSeriesDraft();
    const { endpoint, apiKey } = useAzure();

    // Initialize draft if not already done
    useEffect(() => {
        if (!draft) {
            initializeDraft();
        }
    }, [draft, initializeDraft]);

    const handleCapture = useCallback((imageData: string) => {
        setCurrentImage(imageData);
        setCaptureState('preview');
    }, []);

    const handleRetake = useCallback(() => {
        setCurrentImage(null);
        setCaptureState('camera');
    }, []);

    const handleCameraError = useCallback((error: Error) => {
        setErrorMessage(`Camera error: ${error.message}`);
        setCaptureState('error');
    }, []); const handleUsePhoto = useCallback(() => {
        if (!currentImage || !endpoint || !apiKey) {
            setErrorMessage('Missing image data or Azure configuration');
            setCaptureState('error');
            return;
        }

        // Create a blob from the base64 image immediately
        const byteCharacters = atob(currentImage);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        const imageBlob = new Blob([byteArray], { type: 'image/jpeg' });        // Generate a new page ID
        const pageId = uuidv4();        // Add the page to the draft series with queued status
        const newPageId = addPage({
            imageBlob,
            text: '', // Will be filled when processing completes
            imageDescriptions: [],
            meta: {},
            status: 'queued'
        });

        console.log('Added page with ID:', newPageId, 'Generated ID was:', pageId);

        // Configure Azure
        const azureConfig = { endpoint, apiKey };        // Add to background processing queue
        imageProcessor.enqueue(
            newPageId, // Use the ID returned from addPage instead of the generated pageId
            currentImage,
            azureConfig,
            (result) => {
                // On successful processing
                console.log('Page processed successfully:', result);

                // Update the page with the processed content
                updatePage(newPageId, {
                    text: result.text,
                    imageDescriptions: result.imageDescriptions,
                    meta: result.meta,
                    status: 'complete'
                });
            },
            (error, id) => {
                // On processing error
                console.error('Error processing page:', error);

                // Update page with error status
                updatePage(id, {
                    error: error.message,
                    status: 'error'
                });
            },            // Status change callback to keep UI in sync
            (id, status) => {
                console.log(`Status change for page ${id}: ${status}`);
                updatePage(newPageId, { status });
            }
        );        // Show processing state but stay on the current page
        setCurrentImage(null);
        setCaptureState('camera');

        // Don't automatically navigate to review after the first image is processed
    }, [currentImage, endpoint, apiKey, addPage, updatePage]);

    const handleFinishSeries = useCallback(() => {
        navigate('/review');
    }, [navigate]); return (
        <div className="max-w-2xl mx-auto w-full px-2">
            {/* Removed header to maximize space */}
            <ProcessingStatus />

            {captureState === 'camera' && (
                <div className="w-full">
                    <Camera onCapture={handleCapture} onError={handleCameraError} />
                </div>
            )}

            {captureState === 'preview' && currentImage && (
                <div className="space-y-4">
                    <div className="relative rounded-lg overflow-hidden shadow-lg bg-gray-900 w-full">
                        <img
                            src={`data:image/jpeg;base64,${currentImage}`}
                            alt="Captured"
                            className="w-full object-contain"
                        />
                    </div>

                    <div className="flex space-x-4">                        <button
                        onClick={handleRetake}
                        className="flex-1 py-2 px-4 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                        Retake
                    </button>
                        <button
                            onClick={handleUsePhoto}
                            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Use Photo
                        </button>
                    </div>
                </div>
            )}

            {captureState === 'processing' && (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mb-4"></div>
                    <p>Processing image with Azure GPT-4o...</p>
                </div>
            )}
            {captureState === 'error' && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
                    <p className="font-medium mb-2">Error</p>
                    <p className="mb-4">{errorMessage}</p>
                    <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">
                            <strong>Troubleshooting:</strong>
                        </p>
                        <ul className="text-sm list-disc pl-5 text-gray-600">
                            <li>Check if the connection key is valid</li>
                            <li>Verify the Azure OpenAI service is properly configured</li>
                            <li>Make sure your Azure OpenAI service has the GPT-4 model deployed</li>
                        </ul>
                    </div>
                    <button
                        onClick={() => setCaptureState('camera')}
                        className="py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {draft && draft.pages.length > 0 && captureState !== 'processing' && (
                <div className="mt-8 flex space-x-4">
                    <button
                        onClick={handleFinishSeries}
                        className="flex-1 py-3 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                        Finish Series ({draft.pages.length} {draft.pages.length === 1 ? 'page' : 'pages'})
                    </button>
                </div>
            )}
        </div>
    );
}
