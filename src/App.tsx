import { useState, useEffect } from 'react';
import { AdInterstitial } from './components/AdInterstitial';
import { LandingPage } from './components/LandingPage';
import { AlertCircle } from 'lucide-react';

interface LinkConfig {
  id: string;
  smartLinkUrl: string;
  destinationUrl: string;
  timerSeconds: number;
  adTitle?: string;
  forceNewTab?: boolean;
}

function App() {
  const [config, setConfig] = useState<LinkConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAd, setShowAd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableIds, setAvailableIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        // Parse ID from URL query parameters or path
        const params = new URLSearchParams(window.location.search);
        let id = params.get('id');

        // If no query param, try path
        if (!id) {
          const path = window.location.pathname.slice(1);
          // Ignore index.html or empty paths
          if (path && path !== 'index.html') {
            id = path;
          }
        }

        // Fetch configuration via the server proxy to handle CORS
        const response = await fetch('/api/config');
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.details || errorData.error || 'Failed to connect to config server');
        }
        
        const result = await response.json();
        let links: Record<string, LinkConfig>;

        if (result.source === 'local') {
           // Fallback to fetching local file directly if server indicates it's local
           const localResponse = await fetch(result.url);
           if (!localResponse.ok) throw new Error('Failed to load local config');
           links = await localResponse.json();
        } else {
           // Use the data proxied by the server
           links = result.data;
        }

        setAvailableIds(Object.keys(links));

        if (!id) {
          // No ID provided, stay on landing page state (config is null, error is null)
          setLoading(false);
          return;
        }

        const linkData = links[id];

        if (linkData) {
          setConfig(linkData);
          setShowAd(true);
        } else {
          setError(`Link configuration not found for ID: ${id}`);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load application configuration.");
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleAdClose = () => {
    if (config?.destinationUrl) {
      // Open destination URL in new tab and close current tab
      window.open(config.destinationUrl, '_blank');
      window.close();
    } else {
      setShowAd(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Error</h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <div className="text-sm text-gray-400 bg-gray-50 p-4 rounded-lg font-mono">
            Valid IDs: {availableIds.join(', ')}
          </div>
        </div>
      </div>
    );
  }

  if (showAd && config) {
    return (
      <AdInterstitial 
        adUrl={config.smartLinkUrl} 
        duration={config.timerSeconds} 
        onClose={handleAdClose}
        title={config.adTitle}
        forceNewTab={config.forceNewTab}
      />
    );
  }

  if (!config) {
    return <LandingPage />;
  }

  return null;
}

export default App;
