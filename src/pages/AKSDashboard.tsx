import { useState, useEffect, useRef } from 'react';
import { Maximize2, Minimize2, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { supersetService } from '../services/SupersetService';

const DASHBOARD_ID = 4;
const SUPERSET_DASHBOARD_URL = 'https://superset-edtech-app.azurewebsites.net/superset/dashboard/4/?standalone=true';

export default function AKSDashboard() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const embedContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    embedDashboardSDK();
  }, []);

  const embedDashboardSDK = async () => {
    if (!embedContainerRef.current) return;

    try {
      setLoading(true);
      setError(null);

      // Clear previous dashboard
      embedContainerRef.current.innerHTML = '';

      console.log('🔐 Getting guest token for dashboard...');
      
      // Get guest token from backend
      const guestToken = await supersetService.getGuestToken(DASHBOARD_ID);

      // Get Superset base URL from environment or use the URL from the dashboard link
      const supersetUrl = import.meta.env.VITE_SUPERSET_URL || 'https://superset-edtech-app.azurewebsites.net';

      console.log('📊 Embedding dashboard using iframe...');

      // Note: Guest tokens in Superset are designed for the embedded SDK, not URL parameters
      // Since the embedded SDK endpoint returns 404, we'll use the regular dashboard URL
      // Users will need to log in once, and the session will be maintained
      // Alternative: Configure Superset to enable embedded dashboards feature
      const iframeUrl = `${supersetUrl}/superset/dashboard/${DASHBOARD_ID}/?standalone=true`;
      
      // Create iframe element
      const iframe = document.createElement('iframe');
      iframe.src = iframeUrl;
      iframe.className = 'w-full border-0';
      iframe.style.minHeight = '600px';
      iframe.style.height = 'calc(100vh - 200px)';
      iframe.title = 'INT - AKS Dashboard';
      iframe.allow = 'fullscreen';
      iframe.allowFullscreen = true;
      
      // Handle iframe load
      iframe.onload = () => {
        console.log('✅ Dashboard iframe loaded successfully');
        setLoading(false);
      };
      
      iframe.onerror = () => {
        console.error('❌ Failed to load dashboard iframe');
        setError('Failed to load dashboard. Please check if the dashboard is accessible.');
        setLoading(false);
      };
      
      // Append iframe to container
      embedContainerRef.current.appendChild(iframe);
      
    } catch (err: any) {
      console.error('Error embedding dashboard:', err);
      setError(err.message || 'Failed to embed dashboard');
      setLoading(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      const container = document.getElementById('dashboard-container');
      if (container) {
        container.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const openInNewTab = () => {
    window.open(SUPERSET_DASHBOARD_URL, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                INT - AKS Dashboard
              </h1>
              <p className="text-gray-400">Analytics Dashboard for AKS</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openInNewTab}
                className="px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 transition flex items-center gap-2 rounded-lg font-medium shadow-lg"
                title="Open dashboard in new tab (recommended if login doesn't work in iframe)"
              >
                <ExternalLink className="w-5 h-5" />
                Open Dashboard in New Tab
              </button>
              <button
                onClick={toggleFullscreen}
                className="px-4 py-2 text-gray-400 hover:text-white transition flex items-center gap-2 bg-gray-800 rounded-lg hover:bg-gray-700"
                title="Toggle fullscreen"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-4 h-4" />
                    Exit Fullscreen
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-4 h-4" />
                    Fullscreen
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Container */}
        <div
          id="dashboard-container"
          className="bg-gray-800 rounded-lg shadow-lg overflow-hidden relative"
          style={{ minHeight: '600px', height: 'calc(100vh - 200px)' }}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800/90 z-10">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-white text-lg">Loading dashboard...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800/90 z-10 p-8">
              <div className="text-center max-w-2xl">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-400 text-lg font-medium mb-2">Failed to load dashboard</p>
                <p className="text-red-300 text-sm mb-4">{error}</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={embedDashboardSDK}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Retry
                  </button>
                  <button
                    onClick={openInNewTab}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Open in New Tab
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Show message if iframe loaded but might have login issues */}
          {!loading && !error && (
            <div className="absolute top-4 left-4 right-4 z-10 bg-blue-600/95 text-white px-6 py-4 rounded-lg shadow-xl border border-blue-400">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold mb-1">⚠️ Login may not work in this iframe</p>
                  <p className="text-sm text-blue-100">
                    Due to security restrictions, the login form might not work properly in embedded iframes. 
                    Click the button below to open the dashboard in a new tab for full functionality.
                  </p>
                </div>
                <button
                  onClick={openInNewTab}
                  className="ml-4 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition font-semibold flex items-center gap-2 flex-shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in New Tab
                </button>
              </div>
            </div>
          )}

          <div
            ref={embedContainerRef}
            className="w-full h-full"
            style={{ minHeight: '600px', height: 'calc(100vh - 200px)' }}
          />
        </div>
      </div>
    </div>
  );
}

