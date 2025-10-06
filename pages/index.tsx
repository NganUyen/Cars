import Head from 'next/head'
import { useState, useEffect } from 'react'
import '../styles/globals.css'

interface DatabaseStats {
  totalCars: number;
  recentCars: number;
  topMakes: Array<{ _id: string; count: number }>;
  databaseSize: number;
  connectionMethod: string;
  status: string;
  _note?: string;
}

interface SearchResult {
  _id: string;
  Make: string;
  Model: string;
  Year: number;
  Price: string;
  Mileage: string;
  Location: string;
  Description?: string;
}

interface CrawlerStatus {
  isActive: boolean;
  lastRun: string | null;
  totalCrawled: number;
  status: string;
  features: string[];
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [crawlerStatus, setCrawlerStatus] = useState<CrawlerStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchMake, setSearchMake] = useState('');
  const [searchModel, setSearchModel] = useState('');

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load database stats
      const statsRes = await fetch('/api/database/stats');
      const statsData = await statsRes.json();
      setStats(statsData);

      // Load crawler status
      const crawlerRes = await fetch('/api/crawler/status');
      const crawlerData = await crawlerRes.json();
      setCrawlerStatus(crawlerData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchMake) params.set('make', searchMake);
      if (searchModel) params.set('model', searchModel);
      params.set('limit', '20');

      const response = await fetch(`/api/database/search?${params.toString()}`);
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <>
      <Head>
        <title>ADY Car Crawler Dashboard</title>
        <meta name="description" content="AutoTrader car data crawler and analytics platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">🚗 ADY Car Crawler</h1>
                <span className="ml-3 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  Interactive Dashboard
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <div className={`px-3 py-1 rounded-full text-sm ${
                  stats?.connectionMethod === 'vercel-optimized' || stats?.connectionMethod === 'database'
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {stats?.connectionMethod === 'demo' ? '📊 Demo Mode' : '🔗 Database Connected'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {[
                { key: 'overview', label: '📊 Overview', icon: '📊' },
                { key: 'search', label: '🔍 Search Cars', icon: '🔍' },
                { key: 'crawler', label: '🤖 Crawler Status', icon: '🤖' },
                { key: 'analytics', label: '📈 Analytics', icon: '📈' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                        🚗
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500">Total Cars</h3>
                      <p className="text-2xl font-semibold text-gray-900">{formatNumber(stats.totalCars)}</p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                        🆕
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500">Recent Cars</h3>
                      <p className="text-2xl font-semibold text-gray-900">{formatNumber(stats.recentCars)}</p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                        💾
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500">Database Size</h3>
                      <p className="text-2xl font-semibold text-gray-900">{formatBytes(stats.databaseSize)}</p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
                        🔗
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500">Connection</h3>
                      <p className="text-sm font-semibold text-gray-900">{stats.connectionMethod}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Makes */}
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">🏆 Top Car Makes</h3>
                <div className="space-y-4">
                  {stats.topMakes.map((make, index) => (
                    <div key={make._id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                        </span>
                        <span className="font-medium">{make._id}</span>
                      </div>
                      <span className="text-gray-600">{formatNumber(make.count)} cars</span>
                    </div>
                  ))}
                </div>
              </div>

              {stats._note && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="text-blue-400">ℹ️</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">{stats._note}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">🔍 Search Cars</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Make</label>
                    <input
                      type="text"
                      value={searchMake}
                      onChange={(e) => setSearchMake(e.target.value)}
                      placeholder="e.g., BMW, Audi, Toyota"
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                    <input
                      type="text"
                      value={searchModel}
                      onChange={(e) => setSearchModel(e.target.value)}
                      placeholder="e.g., 320i, A4, Corolla"
                      className="input-field w-full"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleSearch}
                      disabled={loading}
                      className="btn-primary w-full"
                    >
                      {loading ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">
                    Found {searchResults.length} cars
                  </h4>
                  {searchResults.map((car) => (
                    <div key={car._id} className="card">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-semibold text-gray-900">
                            {car.Make} {car.Model} ({car.Year})
                          </h5>
                          <p className="text-gray-600">{car.Description}</p>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <span>📍 {car.Location}</span>
                            <span>🛣️ {car.Mileage}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-semibold text-green-600">{car.Price}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Crawler Status Tab */}
          {activeTab === 'crawler' && crawlerStatus && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">🤖 Crawler Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Current Status</h4>
                    <p className={`inline-block px-3 py-1 rounded-full text-sm ${
                      crawlerStatus.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {crawlerStatus.status.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Total Crawled</h4>
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatNumber(crawlerStatus.totalCrawled)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <h4 className="font-medium text-gray-900 mb-4">🚀 Available Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {crawlerStatus.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <span className="text-green-500 mr-2">✅</span>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">📈 Analytics Dashboard</h3>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📊</div>
                  <h4 className="text-xl font-medium text-gray-900 mb-2">Advanced Analytics</h4>
                  <p className="text-gray-600 mb-4">
                    Detailed analytics and insights will be available here including:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
                    <div className="space-y-2">
                      <p className="flex items-center"><span className="mr-2">📈</span> Price trends over time</p>
                      <p className="flex items-center"><span className="mr-2">🏷️</span> Popular car categories</p>
                      <p className="flex items-center"><span className="mr-2">📍</span> Geographic distribution</p>
                    </div>
                    <div className="space-y-2">
                      <p className="flex items-center"><span className="mr-2">⏱️</span> Market activity patterns</p>
                      <p className="flex items-center"><span className="mr-2">💰</span> Price comparison analysis</p>
                      <p className="flex items-center"><span className="mr-2">🔮</span> Prediction models</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <p className="text-gray-500 text-sm">
                ADY Car Crawler - AutoTrader Data Analytics Platform
              </p>
              <p className="text-gray-400 text-sm">
                Deployed on Vercel 🚀
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}