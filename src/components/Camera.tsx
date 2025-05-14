import { useCallback, useEffect, useRef, useState } from 'react';

interface CameraProps {
    onCapture: (imageData: string) => void;
    onError: (error: Error) => void;
}

export function Camera({ onCapture, onError }: CameraProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isStreaming, setIsStreaming] = useState(false);

    useEffect(() => {
        let stream: MediaStream | null = null;

        async function setupCamera() {
            try {
                // Check if mediaDevices is available
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error('Camera access is not supported in this browser. Please try a different browser or device.');
                }

                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    }
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setIsStreaming(true);
                }
            } catch (err) {
                let errorMessage = 'Failed to access camera';

                // More detailed error messages
                if (err instanceof Error) {
                    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                        errorMessage = 'Camera access denied. Please allow camera access in your browser settings.';
                    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                        errorMessage = 'No camera found. Please ensure your device has a camera.';
                    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                        errorMessage = 'Camera is already in use by another application.';
                    } else if (err.name === 'OverconstrainedError') {
                        errorMessage = 'Camera constraints not satisfied. Your device may not support the requested resolution.';
                    } else if (err.message) {
                        errorMessage = err.message;
                    }
                }

                onError(new Error(errorMessage));
            }
        }

        setupCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [onError]);

    const captureImage = useCallback(() => {
        if (!videoRef.current || !isStreaming) return;

        const canvas = document.createElement('canvas');
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            onError(new Error('Failed to get canvas context'));
            return;
        }

        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8); // 80% quality JPEG
        onCapture(imageData.split(',')[1]); // Remove data URL prefix
    }, [isStreaming, onCapture, onError]); return (
        <div className="relative w-full max-w-lg mx-auto p-4">
            <div className="relative rounded-lg overflow-hidden shadow-lg bg-gray-900 w-full">
                {/* Container with responsive padding and max height */}
                <div className="w-full max-h-[80vh] aspect-[4/3] sm:aspect-video lg:aspect-[4/3]">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline // Required for iOS
                        className="w-full h-full object-contain bg-gray-900"
                    />
                </div>
                {isStreaming && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
                        <button
                            onClick={captureImage}
                            className="w-full sm:w-auto sm:min-w-[200px] btn-primary mx-auto block"
                            aria-label="Take photo"
                        >
                            📸 Capture
                        </button>
                    </div>
                )}
            </div>
            <p className="mt-4 text-sm text-gray-600 text-center">
                For best results on desktop, use landscape orientation.
                On mobile devices, portrait mode is recommended.
            </p>
        </div>
    );
}
