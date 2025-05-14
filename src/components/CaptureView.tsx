import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAzure } from '../context/AzureContext';
import { useSeriesDraft } from '../context/SeriesDraftContext';
import { analyzeImage } from '../lib/azure';
import { Camera } from './Camera';

type CaptureState = 'camera' | 'preview' | 'processing' | 'error';

export function CaptureView() {
    const navigate = useNavigate();
    const [captureState, setCaptureState] = useState<CaptureState>('camera');
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [retryCount, setRetryCount] = useState(0);

    const { draft, initializeDraft, addPage } = useSeriesDraft();
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
    }, []);

    const handleUsePhoto = useCallback(async () => {
        if (!currentImage || !endpoint || !apiKey) {
            setErrorMessage('Missing image data or Azure configuration');
            setCaptureState('error');
            return;
        }

        setCaptureState('processing');

        try {
            const azureConfig = { endpoint, apiKey };

            // Process the image with Azure
            const result = await analyzeImage(currentImage, azureConfig);

            // Create a blob from the base64 image
            const byteCharacters = atob(currentImage);
            const byteNumbers = new Array(byteCharacters.length);

            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            const imageBlob = new Blob([byteArray], { type: 'image/jpeg' });

            // Extract image descriptions from the results
            // This is a simple implementation - you might want to improve parsing
            const descriptions: string[] = [];
            if (result.metadata && result.metadata.figures) {
                for (const figure of result.metadata.figures) {
                    if (figure.description) {
                        descriptions.push(figure.description);
                    }
                }
            }

            // Add the page to the draft series
            addPage({
                imageBlob,
                text: result.text,
                imageDescriptions: descriptions,
                meta: result.metadata || {}
            });

            // Reset state for next capture
            setCurrentImage(null);
            setCaptureState('camera');
            setRetryCount(0);
        } catch (error) {
            console.error('Error processing image:', error);

            // Get a more user-friendly error message
            let errorMsg = 'Failed to process image.';
            if (error instanceof Error) {
                errorMsg = error.message;

                // If it's an Azure API error, make it more user-friendly
                if (errorMsg.includes('Azure API error')) {
                    errorMsg = `Azure API error: Unable to process image. This could be due to an invalid API key or endpoint.`;
                }
            }

            // Implement retry with exponential backoff
            if (retryCount < 3) {
                const backoffTime = Math.pow(2, retryCount) * 1000; // Exponential backoff
                setErrorMessage(`${errorMsg} Retrying in ${backoffTime / 1000} seconds...`);
                setCaptureState('error');

                setTimeout(() => {
                    setRetryCount(prev => prev + 1);
                    handleUsePhoto();
                }, backoffTime);
            } else {
                setErrorMessage(`${errorMsg} Maximum retry attempts reached. Please check your connection key and try again.`);
                setCaptureState('error');
                setRetryCount(0);
            }
        }
    }, [currentImage, endpoint, apiKey, addPage, retryCount]);

    const handleFinishSeries = useCallback(() => {
        navigate('/review');
    }, [navigate]); return (
        <div className="max-w-2xl mx-auto w-full px-2">
            <h2 className="text-xl font-semibold mb-6 text-center">Capture Pages</h2>

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

                    <div className="flex space-x-4">
                        <button
                            onClick={handleRetake}
                            className="flex-1 py-2 px-4 bg-gray-200 rounded-md hover:bg-gray-300"
                        >
                            Retake
                        </button>
                        <button
                            onClick={handleUsePhoto}
                            className="flex-1 py-2 px-4 bg-primary text-white rounded-md hover:bg-primary-dark"
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
