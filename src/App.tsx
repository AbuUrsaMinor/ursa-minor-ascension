import { useEffect, useState } from 'react';
import { ConnectionSetup } from './components/ConnectionSetup';
import { getConnectionKey, isPrivateMode } from './lib/storage';

function App() {
  const [hasKey, setHasKey] = useState<boolean>();
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const inPrivateMode = await isPrivateMode();
        setIsPrivate(inPrivateMode);

        if (!inPrivateMode) {
          const key = await getConnectionKey();
          setHasKey(!!key);
        }
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
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

  if (!hasKey) {
    return <ConnectionSetup onSetup={() => setHasKey(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Ursa Minor Ascension</h1>
        </div>
      </header>
      <main className="container mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
        <div className="max-w-screen-2xl mx-auto">
          {/* Dashboard content will go here */}
        </div>
      </main>
    </div>
  );
}

export default App
