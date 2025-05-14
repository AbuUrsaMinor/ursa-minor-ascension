import { useCallback, useState } from 'react';
import { decodeConnectionKey } from '../lib/azure';
import { saveConnectionKey } from '../lib/storage';

interface ConnectionSetupProps {
    onSetup: () => void;
}

export function ConnectionSetup({ onSetup }: ConnectionSetupProps) {
    const [error, setError] = useState<string>();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(undefined);
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const key = formData.get('key') as string;

        try {
            // Validate the key by trying to decode it
            await decodeConnectionKey(key);

            // If successful, save the key
            await saveConnectionKey(key);
            onSetup();
        } catch (err) {
            setError('Invalid connection key. Please check the format and try again.');
        } finally {
            setIsLoading(false);
        }
    }, [onSetup]); return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 sm:px-6">
            <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg px-6 py-8 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Welcome to Ascension</h1>
                <p className="mb-4 text-gray-600 sm:text-lg">
                    To get started, please enter your connection key. This is required to connect
                    to Azure's GPT-4 Vision API.
                </p>
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
                            placeholder="Paste your Base64-encoded connection key here..."
                        />
                    </div>
                    {error && (
                        <p className="text-red-600 text-sm">{error}</p>
                    )}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full btn-primary disabled:opacity-50"
                    >
                        {isLoading ? 'Validating...' : 'Continue'}
                    </button>
                </form>
            </div>
        </div>
    );
}
