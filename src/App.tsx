import { useEffect, useState } from 'react';
import { HashRouter } from 'react-router-dom';
import { AppRoutes } from './AppRoutes';
import { ConnectionSetup } from './components/ConnectionSetup';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AzureProvider } from './context/AzureContext';
import { SeriesDraftProvider } from './context/SeriesDraftContext';
import { getConnectionKey, isPrivateMode, saveConnectionKey } from './lib/storage';

// This section has been moved to direct inline code in the useEffect hook

// Always use HashRouter for GitHub Pages deployment 
// to ensure basePath is handled correctly
const Router = HashRouter;

function App() {
  // Use null as initial state to clearly distinguish between unchecked and false
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  console.log("App render state:", { hasKey, isPrivate, isLoading });

  useEffect(() => {
    async function init() {
      try {
        const inPrivateMode = await isPrivateMode();
        setIsPrivate(inPrivateMode);

        if (!inPrivateMode) {
          // Check if there's a key parameter in the URL
          const searchParams = new URLSearchParams(window.location.search);
          const hashParts = window.location.hash.split('?');
          const hashParams = hashParts.length > 1 ? new URLSearchParams(hashParts[1]) : new URLSearchParams();
          const keyParam = searchParams.get('key') || hashParams.get('key');
          
          let hasValidKey = false;

          // First check if a valid key was provided in the URL
          if (keyParam) {
            console.log("Key parameter found in URL");
            try {
              // Try to decode the key as Base64 JSON
              const jsonStr = atob(keyParam);
              const config = JSON.parse(jsonStr);
              
              if (config.endpoint && config.apiKey) {
                console.log("URL key is valid, saving to storage");
                await saveConnectionKey(keyParam);
                hasValidKey = true;
              } else {
                throw new Error("Invalid key structure");
              }
            } catch (keyError) {
              console.error("Invalid key format in URL parameter:", keyError);
            }
          }

          // If no valid key in URL, check storage
          if (!hasValidKey) {
            const storedKey = await getConnectionKey();
            console.log("Connection key found in storage:", !!storedKey);
            hasValidKey = !!storedKey;
          }
          
          setHasKey(hasValidKey);
        } else {
          // In private mode, we know there's no key
          setHasKey(false);
        }
      } catch (error) {
        console.error("Error checking for connection key:", error);
        // If there's an error checking for the key, assume there is none
        setHasKey(false);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isPrivate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-yellow-50">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-xl font-bold mb-4">Private Browsing Detected</h1>
          <p className="text-gray-600">
            Ascension requires IndexedDB support, which is not available in private browsing mode.
            Please switch to normal browsing mode to use all features.
          </p>
        </div>
      </div>
    );
  }

  if (hasKey === false) {
    return <ConnectionSetup onSetup={() => setHasKey(true)} />;
  }

  return (
    <ErrorBoundary>
      <AzureProvider>
        <SeriesDraftProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8 flex items-center justify-between">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Ursa Minor Ascension</h1>
                </div>
              </header>
              <main className="container mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
                <div className="max-w-screen-2xl mx-auto">
                  <AppRoutes />
                </div>
              </main>
            </div>
          </Router>
        </SeriesDraftProvider>
      </AzureProvider>
    </ErrorBoundary>
  );
}

export default App
