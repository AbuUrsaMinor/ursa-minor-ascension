// filepath: c:\Users\A550191\git\ursa-minor-ascension\src\components\Camera.tsx
import { useCallback, useEffect, useRef, useState } from 'react';

// Extend MediaTrackCapabilities to include torch property
interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
    torch?: boolean;
}

// Extend MediaTrackConstraintSet to include torch property
interface ExtendedMediaTrackConstraints {
    advanced?: { torch?: boolean }[];
}

interface CameraProps {
    onCapture: (imageData: string) => void;
    onError: (error: Error) => void;
}

export function Camera({ onCapture, onError }: CameraProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
    const [flashlightOn, setFlashlightOn] = useState<boolean>(false);

    // Initialize camera stream
    useEffect(() => {
        async function setupCamera() {
            try {
                if (stream) {
                    // Clean up previous stream if facingMode changed
                    stream.getTracks().forEach(track => track.stop());
                }

                // Request camera access
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode,
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    },
                    audio: false
                });

                setStream(mediaStream);
                setCameraPermission('granted');

                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (error) {
                setCameraPermission('denied');
                onError(error instanceof Error ? error : new Error('Failed to access camera'));
            }
        }

        setupCamera();

        // Cleanup function
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [facingMode, onError]);

    // Toggle camera facing mode (front/back)
    const toggleCamera = useCallback(() => {
        setFacingMode(prevMode => (prevMode === 'user' ? 'environment' : 'user'));
    }, []);
    // Toggle flashlight (if available)
    const toggleFlashlight = useCallback(async () => {
        if (!stream) return;

        try {
            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities() as ExtendedMediaTrackCapabilities;

            // Check if torch is supported
            if (!capabilities.torch) {
                console.log('Flashlight not supported on this device');
                return;
            }

            const newFlashlightState = !flashlightOn;
            await track.applyConstraints({
                advanced: [{ torch: newFlashlightState }]
            } as unknown as MediaTrackConstraints);

            setFlashlightOn(newFlashlightState);
        } catch (error) {
            console.error('Error toggling flashlight:', error);
        }
    }, [stream, flashlightOn]);

    // Capture photo
    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0);

        // Convert canvas to base64 image
        try {
            // Remove the data:image/jpeg;base64, prefix from the image data
            const imageData = canvas.toDataURL('image/jpeg', 0.95).split(',')[1];
            onCapture(imageData);
        } catch (error) {
            onError(error instanceof Error ? error : new Error('Failed to capture image'));
        }
    }, [onCapture, onError]); return (
        <div className="camera-container space-y-4 w-full">
            {/* Debug indicator to show component is rendering */}
            <div className="bg-blue-500 text-white p-1 text-xs absolute top-0 right-0 z-50">Camera Active</div>
            <div className="relative rounded-lg overflow-hidden shadow-lg bg-gray-900" style={{ height: '70vh', minHeight: '400px', position: 'relative' }}>
                {/* Video element for camera feed */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                />

                {/* Overlay with camera controls - with improved visibility */}            {/* Camera controls overlay with improved sizing and visibility */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-center items-center space-x-8 py-6 px-4 bg-black bg-opacity-40 z-50">
                    {/* Toggle camera button - ENLARGED */}
                    <button
                        onClick={toggleCamera}
                        className="p-5 bg-blue-600 rounded-full hover:bg-blue-700 shadow-lg border-3 border-white transition-transform hover:scale-105"
                        aria-label="Switch camera"
                        style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                    
                    {/* Capture button - ENLARGED */}
                    <button
                        onClick={capturePhoto}
                        className="p-3 bg-white rounded-full hover:bg-gray-100 shadow-lg transform transition-transform hover:scale-105"
                        aria-label="Take photo"
                        style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}
                    >
                        <div className="h-20 w-20 rounded-full border-4 border-gray-800 flex items-center justify-center">
                            <div className="h-16 w-16 rounded-full bg-red-600"></div>
                        </div>
                    </button>
                    
                    {/* Flashlight button - ENLARGED */}
                    <button
                        onClick={toggleFlashlight}
                        className={`p-5 rounded-full shadow-lg transition-all hover:scale-105 border-3 border-white ${
                            flashlightOn ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-white'
                        }`}
                        aria-label="Toggle flashlight"
                        style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Permission denied message */}
            {cameraPermission === 'denied' && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
                    <p className="font-medium mb-2">Camera Access Denied</p>
                    <p className="mb-4">Please allow camera access to use this feature.</p>
                </div>
            )}

            {/* Hidden canvas for image processing */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}