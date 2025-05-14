import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { decodeConnectionKey } from '../lib/azure';
import { getConnectionKey } from '../lib/storage';

interface AzureContextType {
    endpoint: string | null;
    apiKey: string | null;
    isLoading: boolean;
    error: string | null;
}

// Create context with default values
const AzureContext = createContext<AzureContextType>({
    endpoint: null,
    apiKey: null,
    isLoading: true,
    error: null
});

export function AzureProvider({ children }: { children: ReactNode }) {
    const [endpoint, setEndpoint] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initialize Azure credentials from stored connection key
    useEffect(() => {
        async function loadCredentials() {
            try {
                const key = await getConnectionKey();
                if (key) {
                    const config = await decodeConnectionKey(key);
                    setEndpoint(config.endpoint);
                    setApiKey(config.apiKey);
                } else {
                    setError('Connection key not found');
                }
            } catch (err) {
                setError('Failed to decode connection key');
                console.error('Error loading Azure credentials:', err);
            } finally {
                setIsLoading(false);
            }
        }

        loadCredentials();
    }, []);

    return (
        <AzureContext.Provider value={{ endpoint, apiKey, isLoading, error }}>
            {children}
        </AzureContext.Provider>
    );
}

export function useAzure() {
    return useContext(AzureContext);
}
