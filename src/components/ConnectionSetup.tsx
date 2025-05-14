import { useCallback, useState, useEffect } from 'react';
import { saveConnectionKey } from '../lib/storage';

interface ConnectionSetupProps {
    onSetup: () => void;
}

export function ConnectionSetup({ onSetup }: ConnectionSetupProps) {
    const [error, setError] = useState<string>();
    const [isLoading, setIsLoading] = useState(false);
    const [processingUrlKey, setProcessingUrlKey] = useState(false);
    
    // Check for key in URL parameter
    useEffect(() => {
        async function checkUrlKey() {
            try {
                // First try regular URL parameters (for direct access)
                const searchParams = new URLSearchParams(window.location.search);
                
                // For hash router, the format is like #/path?key=value
                let hashParams = new URLSearchParams();
                const hashParts = window.location.hash.split('?');
                if (hashParts.length > 1) {
                    hashParams = new URLSearchParams(hashParts[1]);
                }
                
                const keyParam = searchParams.get('key') || hashParams.get('key');
                
                if (keyParam) {
                    console.log("ConnectionSetup: Key found in URL");
                    setProcessingUrlKey(true);
                    setIsLoading(true);
                    
                    try {
                        // Try to decode the key as Base64 JSON
                        const jsonStr = atob(keyParam);
                        const config = JSON.parse(jsonStr);
                        
                        if (config.endpoint && config.apiKey) {
                            // Valid Base64 JSON format
                            await saveConnectionKey(keyParam);
                            console.log("ConnectionSetup: Key saved successfully");
                            onSetup();
                        } else {
                            throw new Error("Invalid key structure");
                        }
                    } catch (error) {
                        console.error("Invalid Base64 JSON key format:", error);
                        setError('The URL contains an invalid connection key format. Please use the Base64-encoded JSON format.');
                        setIsLoading(false);
                        setProcessingUrlKey(false);
                    }
                }
            } catch (err) {
                console.error("Error processing URL parameters:", err);
                setIsLoading(false);
                setProcessingUrlKey(false);
            }
        }
        
        checkUrlKey();
    }, [onSetup]);
    
    const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(undefined);
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const key = formData.get('key') as string;
        
        console.log("ConnectionSetup: Submitting key");

        try {
            // Try to decode the key as Base64 JSON
            const jsonStr = atob(key);
            const config = JSON.parse(jsonStr);
            
            if (config.endpoint && config.apiKey) {
                // Valid Base64 JSON format
                await saveConnectionKey(key);
                console.log("ConnectionSetup: Key saved successfully");
                onSetup();
            } else {
                throw new Error("Invalid key structure");
            }
        } catch (err) {
            console.error("ConnectionSetup: Error processing key", err);
            setError('Invalid connection key. Please use a Base64-encoded JSON format.');
        } finally {
            setIsLoading(false);
        }
    }, [onSetup]); 
    
    // Display a loading screen when processing a key from the URL
    if (processingUrlKey && isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="w-full max-w-sm sm:max-w-md px-6 py-8 bg-white rounded-lg shadow-md text-center">
                    <h1 className="text-2xl font-bold mb-6">Setting Up Connection</h1>
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                    <p className="mt-4 text-gray-600">
                        Validating connection key from URL...
                    </p>
                </div>
            </div>
        );
    }
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 sm:px-6">
            <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg px-6 py-8 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Welcome to Ascension</h1>
                <p className="mb-4 text-gray-600 sm:text-lg">
                    To get started, please enter your connection key. This is required to connect
                    to Azure's GPT-4 Vision API.
                </p>
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                        <span className="font-medium">Required format:</span><br/>
                        Base64-encoded JSON with endpoint and apiKey fields
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="key" className="block text-sm font-medium text-gray-700">
                            Connection Key
                        </label>
                        <textarea
                            id="key"
                            name="key"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                            rows={3}
                            placeholder="Paste your Base64-encoded JSON connection key..."
                        />
                    </div>
                    {error && (
                        <p className="text-red-600 text-sm">{error}</p>
                    )}
                    <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn-primary disabled:opacity-50"
                        >
                            {isLoading ? 'Validating...' : 'Continue'}
                        </button>
                    </div>
                    <div className="mt-4 text-sm text-gray-500">
                        <p>How to generate a connection key:</p>
                        <ol className="list-decimal list-inside mt-1 space-y-1">
                            <li>Run the following command in your terminal:</li>
                            <pre className="mt-1 bg-gray-100 p-2 rounded overflow-auto text-xs">
                                npm run share-link -- YOUR_ENDPOINT YOUR_API_KEY
                            </pre>
                            <li>Copy the generated Base64-encoded connection key</li>
                        </ol>                        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-green-800">
                                <span className="font-medium">Pro tip:</span> You can also share the app with your key included:
                                <code className="mt-1 block bg-white p-1 text-xs overflow-x-auto">
                                    https://abuursaminor/ursa-minor-ascension/?key=YOUR_BASE64_JSON_KEY
                                </code>
                                <span className="block mt-1">The share-link command will generate this URL for you.</span>
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
