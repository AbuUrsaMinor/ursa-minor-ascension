import { useEffect, useState } from 'react';
import { useSeriesDraft } from '../context/SeriesDraftContext';
import { imageProcessor } from '../lib/imageProcessor';

export function ProcessingStatus() {
    const { draft } = useSeriesDraft();
    const [queueStatus, setQueueStatus] = useState({
        queued: 0,
        processing: 0,
        completed: 0,
        error: 0,
        total: 0
    });

    // Update status every second
    useEffect(() => {
        const intervalId = setInterval(() => {
            setQueueStatus(imageProcessor.getStatus());
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    // If no pages or no processing happening, don't show anything
    if (!draft ||
        (queueStatus.queued === 0 &&
            queueStatus.processing === 0 &&
            queueStatus.error === 0)) {
        return null;
    } return (
        <div className="fixed top-4 right-4 bg-gray-800 text-white p-3 rounded-lg shadow-lg max-w-xs opacity-80">
            <h4 className="font-medium text-sm mb-1">Processing Status</h4>

            <div className="space-y-1 text-xs">
                {queueStatus.processing > 0 && (
                    <div className="flex items-center">
                        <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-blue-400 mr-2"></div>
                        <span>Processing: {queueStatus.processing}</span>
                    </div>
                )}

                {queueStatus.queued > 0 && (
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                        <span>Queued: {queueStatus.queued}</span>
                    </div>
                )}

                {queueStatus.completed > 0 && (
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                        <span>Completed: {queueStatus.completed}</span>
                    </div>
                )}

                {queueStatus.error > 0 && (
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                        <span>Failed: {queueStatus.error}</span>
                    </div>
                )}
            </div>

            {queueStatus.processing > 0 || queueStatus.queued > 0 ? (
                <p className="text-xs mt-2 text-gray-300">
                    Processing images in the background. You can continue capturing more pages.
                </p>
            ) : null}
        </div>
    );
}
