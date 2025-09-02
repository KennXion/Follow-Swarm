import { useState } from 'react';
import { 
  FileText, 
 
  Download,
  RefreshCw,
  Search,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  ChevronRight
} from 'lucide-react';

/**
 * AdminLogs Component
 * 
 * Activity log viewer with advanced filtering, search, and export capabilities.
 * Displays system events, user actions, and application logs with severity levels.
 * Features expandable details, real-time updates, and pagination.
 */
const AdminLogs = () => {
  const [selectedLogType, setSelectedLogType] = useState('all'); // Log source filter
  const [selectedLevel, setSelectedLevel] = useState('all'); // Log severity filter
  const [searchQuery, setSearchQuery] = useState(''); // Search query for log messages
  const [expandedLog, setExpandedLog] = useState<number | null>(null); // Currently expanded log entry

  const logs = [
    {
      id: 1,
      timestamp: '2024-01-15 14:32:18',
      level: 'error',
      source: 'auth.service',
      message: 'Authentication failed for user',
      details: {
        userId: 'usr_abc123',
        email: 'user@example.com',
        reason: 'Invalid credentials',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0...'
      }
    },
    {
      id: 2,
      timestamp: '2024-01-15 14:31:45',
      level: 'warning',
      source: 'rate.limiter',
      message: 'Rate limit approaching for endpoint',
      details: {
        endpoint: '/api/follows',
        current: 95,
        limit: 100,
        window: '1 minute',
        ip: '10.0.0.1'
      }
    },
    {
      id: 3,
      timestamp: '2024-01-15 14:30:22',
      level: 'info',
      source: 'follow.queue',
      message: 'Follow task completed successfully',
      details: {
        taskId: 'task_xyz789',
        userId: 'usr_def456',
        artistId: 'art_ghi789',
        duration: '234ms',
        retries: 0
      }
    },
    {
      id: 4,
      timestamp: '2024-01-15 14:29:10',
      level: 'success',
      source: 'user.registration',
      message: 'New user registered',
      details: {
        userId: 'usr_jkl012',
        email: 'newuser@example.com',
        plan: 'premium',
        referrer: 'organic'
      }
    },
    {
      id: 5,
      timestamp: '2024-01-15 14:28:05',
      level: 'error',
      source: 'database.connection',
      message: 'Connection pool exhausted',
      details: {
        pool: 'main',
        activeConnections: 50,
        maxConnections: 50,
        waitingRequests: 12,
        avgWaitTime: '2.3s'
      }
    },
    {
      id: 6,
      timestamp: '2024-01-15 14:27:30',
      level: 'info',
      source: 'spotify.api',
      message: 'API call successful',
      details: {
        endpoint: '/v1/me/following',
        method: 'PUT',
        statusCode: 204,
        latency: '145ms'
      }
    },
    {
      id: 7,
      timestamp: '2024-01-15 14:26:15',
      level: 'warning',
      source: 'redis.cache',
      message: 'Cache memory usage high',
      details: {
        used: '850MB',
        available: '150MB',
        percentage: 85,
        evictions: 234
      }
    },
    {
      id: 8,
      timestamp: '2024-01-15 14:25:00',
      level: 'success',
      source: 'backup.service',
      message: 'Database backup completed',
      details: {
        size: '2.3GB',
        duration: '5m 23s',
        location: 's3://backups/2024-01-15/',
        type: 'incremental'
      }
    }
  ];

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle className="h-4 w-4 text-red-400" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-400" />;
      default: return <Info className="h-4 w-4 text-blue-400" />;
    }
  };

  const getLevelStyle = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400 bg-red-900/20';
      case 'warning': return 'text-yellow-400 bg-yellow-900/20';
      case 'success': return 'text-green-400 bg-green-900/20';
      default: return 'text-blue-400 bg-blue-900/20';
    }
  };

  const filteredLogs = logs.filter(log => {
    if (selectedLevel !== 'all' && log.level !== selectedLevel) return false;
    if (selectedLogType !== 'all' && !log.source.includes(selectedLogType)) return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <FileText className="h-8 w-8 mr-3 text-red-500" />
            Activity Logs
          </h1>
          <p className="text-gray-400 mt-1">View and analyze system activity logs</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors">
            <RefreshCw className="h-5 w-5" />
          </button>
          
          <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none"
            />
          </div>

          {/* Log Type Filter */}
          <select
            value={selectedLogType}
            onChange={(e) => setSelectedLogType(e.target.value)}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none"
          >
            <option value="all">All Sources</option>
            <option value="auth">Authentication</option>
            <option value="follow">Follow Queue</option>
            <option value="database">Database</option>
            <option value="spotify">Spotify API</option>
            <option value="redis">Redis Cache</option>
            <option value="rate">Rate Limiter</option>
          </select>

          {/* Level Filter */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none"
          >
            <option value="all">All Levels</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
          </select>

          {/* Time Range */}
          <select className="px-4 py-2 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none">
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="p-3 bg-gray-900/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Total Logs</span>
              <span className="text-white font-semibold">{filteredLogs.length}</span>
            </div>
          </div>
          <div className="p-3 bg-red-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-red-400 text-sm">Errors</span>
              <span className="text-red-400 font-semibold">
                {filteredLogs.filter(l => l.level === 'error').length}
              </span>
            </div>
          </div>
          <div className="p-3 bg-yellow-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-yellow-400 text-sm">Warnings</span>
              <span className="text-yellow-400 font-semibold">
                {filteredLogs.filter(l => l.level === 'warning').length}
              </span>
            </div>
          </div>
          <div className="p-3 bg-green-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-green-400 text-sm">Success</span>
              <span className="text-green-400 font-semibold">
                {filteredLogs.filter(l => l.level === 'success').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
        <div className="divide-y divide-gray-700">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-gray-900/30 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    {getLevelIcon(log.level)}
                    <span className={`px-2 py-1 text-xs rounded-full ${getLevelStyle(log.level)}`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-gray-400 text-sm">{log.source}</span>
                    <div className="flex items-center text-gray-500 text-sm">
                      <Clock className="h-3 w-3 mr-1" />
                      {log.timestamp}
                    </div>
                  </div>
                  <p className="text-white mt-2">{log.message}</p>
                  
                  {/* Expandable Details */}
                  {expandedLog === log.id && (
                    <div className="mt-3 p-3 bg-gray-900/50 rounded-lg">
                      <h4 className="text-gray-400 text-sm font-semibold mb-2">Details:</h4>
                      <div className="space-y-1">
                        {Object.entries(log.details).map(([key, value]) => (
                          <div key={key} className="flex items-start">
                            <span className="text-gray-500 text-sm w-32">{key}:</span>
                            <span className="text-gray-300 text-sm font-mono">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  className="ml-4 p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ChevronRight 
                    className={`h-4 w-4 text-gray-400 transform transition-transform ${
                      expandedLog === log.id ? 'rotate-90' : ''
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-sm">
          Showing {filteredLogs.length} of {logs.length} logs
        </p>
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50" disabled>
            Previous
          </button>
          <button className="px-3 py-1 bg-red-600 text-white rounded-lg">1</button>
          <button className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors">2</button>
          <button className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors">3</button>
          <button className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogs;