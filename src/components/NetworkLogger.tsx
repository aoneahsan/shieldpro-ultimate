/**
 * Network Request Logger - Tier 4 Premium Feature
 * Real-time monitoring and logging of network requests
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Network,
  ShieldX,
  Clock,
  Download,
  Filter,
  Search,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Globe,
  Lock,
  Unlock,
  Eye,
  EyeOff,
} from 'lucide-react';

interface NetworkRequest {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';
  status: number | null;
  statusText: string;
  responseType: string;
  timestamp: number;
  duration: number;
  size: number;
  blocked: boolean;
  reason?: string;
  domain: string;
  initiator: string;
  category:
    | 'document'
    | 'stylesheet'
    | 'script'
    | 'image'
    | 'font'
    | 'xmlhttprequest'
    | 'fetch'
    | 'other';
  securityState: 'secure' | 'insecure' | 'unknown';
  cached: boolean;
  redirected: boolean;
}

interface NetworkStats {
  totalRequests: number;
  blockedRequests: number;
  allowedRequests: number;
  totalSize: number;
  savedBandwidth: number;
  averageResponseTime: number;
  secureRequests: number;
  insecureRequests: number;
}

interface FilterOptions {
  method: string[];
  status: string[];
  category: string[];
  blocked: 'all' | 'blocked' | 'allowed';
  domain: string;
  search: string;
}

interface NetworkLoggerProps {
  currentTier?: number;
}

export const NetworkLogger: React.FC<NetworkLoggerProps> = () => {
  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  const [stats, setStats] = useState<NetworkStats>({
    totalRequests: 0,
    blockedRequests: 0,
    allowedRequests: 0,
    totalSize: 0,
    savedBandwidth: 0,
    averageResponseTime: 0,
    secureRequests: 0,
    insecureRequests: 0,
  });
  const [filters, setFilters] = useState<FilterOptions>({
    method: [],
    status: [],
    category: [],
    blocked: 'all',
    domain: '',
    search: '',
  });
  const [isRecording, setIsRecording] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<NetworkRequest | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const requestsEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Load existing logs
        const stored = await chrome.storage.local.get(['networkRequests', 'networkStats']);
        if (stored.networkRequests) {
          setRequests(stored.networkRequests.slice(-1000)); // Keep last 1000 requests
        }
        if (stored.networkStats) {
          setStats(stored.networkStats);
        }

        // Start listening for network events if recording
        if (isRecording) {
          startNetworkMonitoring();
        }
      } catch {
        console.error('Failed to initialize network logger:', error);
      }
    };

    initialize();

    return () => {
      // Cleanup listeners when component unmounts
      if (chrome?.webRequest) {
        // Remove listeners
      }
    };
  }, [startNetworkMonitoring]); // Add startNetworkMonitoring as dependency

  useEffect(() => {
    if (isRecording) {
      startNetworkMonitoring();
    }
  }, [isRecording, startNetworkMonitoring]); // Re-run when isRecording or startNetworkMonitoring changes

  useEffect(() => {
    if (autoScroll && requestsEndRef.current) {
      requestsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [requests, autoScroll]);

  const startNetworkMonitoring = useCallback(() => {
    // Listen for messages from background script about network events
    chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
      if (message.type === 'networkRequest') {
        handleNetworkRequest(message.request);
      }
    });

    // Send message to background script to start monitoring
    chrome.runtime.sendMessage({ action: 'startNetworkMonitoring' });
  }, []);

  const stopNetworkMonitoring = () => {
    chrome.runtime.sendMessage({ action: 'stopNetworkMonitoring' });
  };

  const handleNetworkRequest = (request: Omit<NetworkRequest, 'id'>) => {
    const newRequest: NetworkRequest = {
      ...request,
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    setRequests((prev) => {
      const updated = [...prev, newRequest].slice(-1000); // Keep last 1000
      saveRequestsToStorage(updated);
      return updated;
    });

    updateStats(newRequest);
  };

  const updateStats = (request: NetworkRequest) => {
    setStats((prev) => {
      const newStats = {
        totalRequests: prev.totalRequests + 1,
        blockedRequests: prev.blockedRequests + (request.blocked ? 1 : 0),
        allowedRequests: prev.allowedRequests + (request.blocked ? 0 : 1),
        totalSize: prev.totalSize + request.size,
        savedBandwidth: prev.savedBandwidth + (request.blocked ? request.size : 0),
        averageResponseTime:
          (prev.averageResponseTime * prev.totalRequests + request.duration) /
          (prev.totalRequests + 1),
        secureRequests: prev.secureRequests + (request.securityState === 'secure' ? 1 : 0),
        insecureRequests: prev.insecureRequests + (request.securityState === 'insecure' ? 1 : 0),
      };

      chrome.storage.local.set({ networkStats: newStats });
      return newStats;
    });
  };

  const saveRequestsToStorage = async (requests: NetworkRequest[]) => {
    try {
      await chrome.storage.local.set({ networkRequests: requests });
    } catch {
      console.error('Failed to save network requests:', error);
    }
  };

  const toggleRecording = () => {
    const newRecordingState = !isRecording;
    setIsRecording(newRecordingState);

    if (newRecordingState) {
      startNetworkMonitoring();
    } else {
      stopNetworkMonitoring();
    }
  };

  const clearLogs = () => {
    setRequests([]);
    setStats({
      totalRequests: 0,
      blockedRequests: 0,
      allowedRequests: 0,
      totalSize: 0,
      savedBandwidth: 0,
      averageResponseTime: 0,
      secureRequests: 0,
      insecureRequests: 0,
    });
    chrome.storage.local.remove(['networkRequests', 'networkStats']);
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(requests, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `network-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: number | null) => {
    if (status === null) return <XCircle className="w-4 h-4 text-gray-400" />;
    if (status >= 200 && status < 300) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status >= 300 && status < 400) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'document':
        return <Globe className="w-4 h-4 text-blue-500" />;
      case 'stylesheet':
        return <Eye className="w-4 h-4 text-purple-500" />;
      case 'script':
        return <Network className="w-4 h-4 text-yellow-500" />;
      case 'image':
        return <EyeOff className="w-4 h-4 text-green-500" />;
      default:
        return <Network className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSecurityIcon = (state: string) => {
    switch (state) {
      case 'secure':
        return <Lock className="w-4 h-4 text-green-500" />;
      case 'insecure':
        return <Unlock className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const filteredRequests = requests.filter((request) => {
    if (filters.blocked !== 'all') {
      if (filters.blocked === 'blocked' && !request.blocked) return false;
      if (filters.blocked === 'allowed' && request.blocked) return false;
    }

    if (filters.method.length > 0 && !filters.method.includes(request.method)) return false;
    if (filters.category.length > 0 && !filters.category.includes(request.category)) return false;
    if (filters.domain && !request.domain.toLowerCase().includes(filters.domain.toLowerCase()))
      return false;
    if (filters.search && !request.url.toLowerCase().includes(filters.search.toLowerCase()))
      return false;

    return true;
  });

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Network className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Network Request Logger</h2>
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
              TIER 4
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-3 py-2 rounded text-sm ${
                autoScroll ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Auto Scroll
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>

            <button
              onClick={exportLogs}
              className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              <Download className="w-4 h-4" />
              Export
            </button>

            <button
              onClick={clearLogs}
              className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>

            <button
              onClick={toggleRecording}
              className={`flex items-center gap-2 px-4 py-2 rounded font-medium ${
                isRecording
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isRecording ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Stop
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Start
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-gray-600">
          Real-time monitoring of network requests with detailed analytics
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Requests</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalRequests}</p>
            </div>
            <Network className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Blocked</p>
              <p className="text-2xl font-bold text-red-900">{stats.blockedRequests}</p>
            </div>
            <ShieldX className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Data Saved</p>
              <p className="text-2xl font-bold text-green-900">
                {formatSize(stats.savedBandwidth)}
              </p>
            </div>
            <Download className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Avg Response</p>
              <p className="text-2xl font-bold text-purple-900">
                {formatDuration(stats.averageResponseTime)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
              <select
                value={filters.blocked}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    blocked: e.target.value as 'all' | 'blocked' | 'allowed',
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Requests</option>
                <option value="blocked">Blocked Only</option>
                <option value="allowed">Allowed Only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
              <input
                type="text"
                placeholder="Filter by domain"
                value={filters.domain}
                onChange={(e) => setFilters((prev) => ({ ...prev, domain: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search URL</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search in URLs"
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Requests Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Security
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <Network className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No network requests recorded</p>
                    <p className="text-sm">
                      {isRecording
                        ? 'Navigate to a website to see requests'
                        : 'Click Start to begin recording'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr
                    key={request.id}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      request.blocked ? 'bg-red-50' : ''
                    }`}
                    onClick={() => setSelectedRequest(request)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            request.blocked
                              ? 'bg-red-100 text-red-800'
                              : request.status && request.status >= 200 && request.status < 300
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {request.blocked ? 'BLOCKED' : request.status || 'PENDING'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(request.category)}
                        <span className="text-sm font-medium">{request.method}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {request.domain}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{request.url}</p>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatSize(request.size)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDuration(request.duration)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(request.timestamp).toLocaleTimeString()}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getSecurityIcon(request.securityState)}
                        <span className="text-xs capitalize">{request.securityState}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div ref={requestsEndRef} />
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Request Details</h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">URL</label>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">
                  {selectedRequest.url}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Method</label>
                  <p className="text-sm">{selectedRequest.method}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="text-sm">{selectedRequest.status || 'Pending'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Size</label>
                  <p className="text-sm">{formatSize(selectedRequest.size)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Duration</label>
                  <p className="text-sm">{formatDuration(selectedRequest.duration)}</p>
                </div>
              </div>

              {selectedRequest.blocked && selectedRequest.reason && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Block Reason</label>
                  <p className="text-sm text-red-600">{selectedRequest.reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkLogger;
