import { useState, useEffect, useRef } from 'react';
import { supersetService, SupersetDashboard } from '../services/SupersetService';
import { embedDashboard } from '@superset-ui/embedded-sdk';
import { 
  BarChart3, 
  Loader2, 
  AlertCircle, 
  ExternalLink,
  RefreshCw,
  Grid3x3,
  Maximize2,
  Minimize2
} from 'lucide-react';

type EmbedMode = 'sdk' | 'iframe';

export default function SupersetDashboards() {
  const [dashboards, setDashboards] = useState<SupersetDashboard[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<SupersetDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [embedding, setEmbedding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [embedMode, setEmbedMode] = useState<EmbedMode>('sdk');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const embedContainerRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<any>(null);

  useEffect(() => {
    loadDashboards();
  }, []);

  useEffect(() => {
    if (selectedDashboard && embedMode === 'sdk') {
      embedDashboardSDK(selectedDashboard.id);
    }
  }, [selectedDashboard, embedMode]);

  const loadDashboards = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await supersetService.getDashboards();
      // Filter to only show published dashboards
      const published = data.filter(d => d.published);
      setDashboards(published);
      
      // Auto-select first dashboard if available
      if (published.length > 0 && !selectedDashboard) {
        setSelectedDashboard(published[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboards');
      console.error('Error loading dashboards:', err);
    } finally {
      setLoading(false);
    }
  };

  const embedDashboardSDK = async (dashboardId: number) => {
    if (!embedContainerRef.current) return;

    try {
      setEmbedding(true);
      setError(null);

      // Clear previous dashboard
      embedContainerRef.current.innerHTML = '';

      // Get guest token
      const guestToken = await supersetService.getGuestToken(dashboardId);

      // Get Superset base URL
      const supersetUrl = import.meta.env.VITE_SUPERSET_URL || 'http://localhost:8088';

      // Embed dashboard using SDK
      const dashboard = await embedDashboard({
        id: String(dashboardId),
        supersetDomain: supersetUrl,
        mountPoint: embedContainerRef.current,
        fetchGuestToken: async () => guestToken,
        dashboardUiConfig: {
          hideTitle: false,
          hideChartControls: false,
          hideTab: false,
          filters: {
            expanded: true,
          },
        },
      });

      dashboardRef.current = dashboard;
    } catch (err: any) {
      setError(err.message || 'Failed to embed dashboard');
      console.error('Error embedding dashboard:', err);
      
      // Fallback to iframe if SDK fails
      if (embedMode === 'sdk') {
        console.log('Falling back to iframe mode');
        setEmbedMode('iframe');
      }
    } finally {
      setEmbedding(false);
    }
  };

  const handleDashboardSelect = (dashboard: SupersetDashboard) => {
    setSelectedDashboard(dashboard);
    setError(null);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      embedContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const openInNewTab = () => {
    if (selectedDashboard) {
      const url = supersetService.getDashboardIframeUrl(selectedDashboard.id);
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading dashboards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <BarChart3 className="w-8 h-8" />
                Superset Dashboards
              </h1>
              <p className="text-gray-400">View and interact with your analytics dashboards</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadDashboards}
                disabled={loading}
                className="p-2 text-gray-400 hover:text-white transition disabled:opacity-50"
                title="Refresh dashboards"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setEmbedMode('sdk')}
                  className={`px-3 py-1.5 text-sm rounded transition ${
                    embedMode === 'sdk'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  SDK
                </button>
                <button
                  onClick={() => setEmbedMode('iframe')}
                  className={`px-3 py-1.5 text-sm rounded transition ${
                    embedMode === 'iframe'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Iframe
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-600 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 font-medium">Error</p>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Dashboard List Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Grid3x3 className="w-5 h-5 text-gray-400" />
                <h2 className="text-xl font-bold text-white">Dashboards</h2>
                <span className="ml-auto text-sm text-gray-400">({dashboards.length})</span>
              </div>

              {dashboards.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No dashboards available</p>
                  <p className="text-sm mt-2">Create dashboards in Superset first</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {dashboards.map((dashboard) => (
                    <button
                      key={dashboard.id}
                      onClick={() => handleDashboardSelect(dashboard)}
                      className={`w-full text-left p-3 rounded-lg transition ${
                        selectedDashboard?.id === dashboard.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <div className="font-medium truncate">{dashboard.dashboard_title}</div>
                      {dashboard.changed_on && (
                        <div className="text-xs mt-1 opacity-75">
                          Updated: {new Date(dashboard.changed_on).toLocaleDateString()}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dashboard Viewer */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              {selectedDashboard ? (
                <>
                  {/* Dashboard Header */}
                  <div className="bg-gray-700 px-6 py-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {selectedDashboard.dashboard_title}
                      </h3>
                      {selectedDashboard.slug && (
                        <p className="text-sm text-gray-400 mt-1">/{selectedDashboard.slug}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={openInNewTab}
                        className="p-2 text-gray-400 hover:text-white transition"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </button>
                      <button
                        onClick={toggleFullscreen}
                        className="p-2 text-gray-400 hover:text-white transition"
                        title="Toggle fullscreen"
                      >
                        {isFullscreen ? (
                          <Minimize2 className="w-5 h-5" />
                        ) : (
                          <Maximize2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Dashboard Container */}
                  <div className="relative" style={{ minHeight: '600px' }}>
                    {embedding && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50 z-10">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                          <p className="text-white text-sm">Loading dashboard...</p>
                        </div>
                      </div>
                    )}

                    {embedMode === 'iframe' ? (
                      <iframe
                        src={supersetService.getDashboardIframeUrl(selectedDashboard.id)}
                        className="w-full border-0"
                        style={{ minHeight: '600px', height: 'calc(100vh - 300px)' }}
                        title={selectedDashboard.dashboard_title}
                        allow="fullscreen"
                      />
                    ) : (
                      <div
                        ref={embedContainerRef}
                        className="w-full"
                        style={{ minHeight: '600px', height: 'calc(100vh - 300px)' }}
                      />
                    )}
                  </div>
                </>
              ) : (
                <div className="p-12 text-center">
                  <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Select a dashboard to view</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
