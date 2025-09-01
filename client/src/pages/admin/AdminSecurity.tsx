import { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Key,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  UserX,
  AlertCircle,
  RefreshCw,
  Download
} from 'lucide-react';

/**
 * AdminSecurity Component
 * 
 * Security monitoring and management dashboard for tracking security events,
 * managing blocked IPs, monitoring API keys, and reviewing authentication logs.
 * Provides real-time threat detection and security incident management.
 */
const AdminSecurity = () => {
  const [showTokens, setShowTokens] = useState(false); // Toggle API key visibility
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h'); // Security event time filter

  const securityEvents = [
    {
      id: 1,
      type: 'warning',
      event: 'Multiple failed login attempts',
      user: 'user@example.com',
      ip: '192.168.1.1',
      timestamp: '2 minutes ago',
      status: 'blocked'
    },
    {
      id: 2,
      type: 'success',
      event: 'Admin login',
      user: 'admin@followswarm.com',
      ip: '10.0.0.1',
      timestamp: '15 minutes ago',
      status: 'success'
    },
    {
      id: 3,
      type: 'error',
      event: 'Suspicious activity detected',
      user: 'suspicious@test.com',
      ip: '45.67.89.12',
      timestamp: '1 hour ago',
      status: 'investigating'
    },
    {
      id: 4,
      type: 'info',
      event: 'Password reset requested',
      user: 'forgetful@user.com',
      ip: '78.90.12.34',
      timestamp: '3 hours ago',
      status: 'completed'
    },
    {
      id: 5,
      type: 'warning',
      event: 'Rate limit exceeded',
      user: 'bot@scanner.com',
      ip: '123.45.67.89',
      timestamp: '5 hours ago',
      status: 'throttled'
    }
  ];

  const blockedIPs = [
    { ip: '192.168.1.1', reason: 'Multiple failed attempts', blockedAt: '2 hours ago', expires: 'In 22 hours' },
    { ip: '45.67.89.12', reason: 'Suspicious activity', blockedAt: '1 day ago', expires: 'Permanent' },
    { ip: '123.45.67.89', reason: 'Rate limit abuse', blockedAt: '3 days ago', expires: 'In 4 days' }
  ];

  const apiKeys = [
    { id: 1, name: 'Production API', key: 'sk_live_...abc123', created: '30 days ago', lastUsed: '1 minute ago', status: 'active' },
    { id: 2, name: 'Development API', key: 'sk_test_...xyz789', created: '60 days ago', lastUsed: '1 hour ago', status: 'active' },
    { id: 3, name: 'Legacy API', key: 'sk_old_...def456', created: '180 days ago', lastUsed: '30 days ago', status: 'inactive' }
  ];

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-400" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-400" />;
      default: return <AlertCircle className="h-4 w-4 text-blue-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      blocked: 'bg-red-900/50 text-red-400 border-red-800',
      success: 'bg-green-900/50 text-green-400 border-green-800',
      investigating: 'bg-yellow-900/50 text-yellow-400 border-yellow-800',
      completed: 'bg-blue-900/50 text-blue-400 border-blue-800',
      throttled: 'bg-orange-900/50 text-orange-400 border-orange-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full border ${styles[status] || 'bg-gray-900/50 text-gray-400 border-gray-800'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Shield className="h-8 w-8 mr-3 text-red-500" />
            Security Center
          </h1>
          <p className="text-gray-400 mt-1">Monitor and manage system security</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </button>
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Lock className="h-8 w-8 text-green-500" />
            <CheckCircle className="h-5 w-5 text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">Secure</h3>
          <p className="text-gray-400 text-sm mt-1">System Status</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <span className="text-2xl font-bold text-white">3</span>
          </div>
          <p className="text-gray-400 text-sm">Active Threats</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <UserX className="h-8 w-8 text-red-500" />
            <span className="text-2xl font-bold text-white">12</span>
          </div>
          <p className="text-gray-400 text-sm">Blocked IPs</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Key className="h-8 w-8 text-blue-500" />
            <span className="text-2xl font-bold text-white">3</span>
          </div>
          <p className="text-gray-400 text-sm">API Keys</p>
        </div>
      </div>

      {/* Recent Security Events */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Recent Security Events</h2>
          <button className="text-gray-400 hover:text-white transition-colors">
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-700">
                <th className="pb-3 text-gray-400 font-medium text-sm">Event</th>
                <th className="pb-3 text-gray-400 font-medium text-sm">User</th>
                <th className="pb-3 text-gray-400 font-medium text-sm">IP Address</th>
                <th className="pb-3 text-gray-400 font-medium text-sm">Time</th>
                <th className="pb-3 text-gray-400 font-medium text-sm">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {securityEvents.map((event) => (
                <tr key={event.id} className="hover:bg-gray-900/50 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center space-x-2">
                      {getEventIcon(event.type)}
                      <span className="text-white">{event.event}</span>
                    </div>
                  </td>
                  <td className="py-3 text-gray-300">{event.user}</td>
                  <td className="py-3 text-gray-300">{event.ip}</td>
                  <td className="py-3 text-gray-300">{event.timestamp}</td>
                  <td className="py-3">{getStatusBadge(event.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Blocked IPs */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Blocked IP Addresses</h2>
        <div className="space-y-3">
          {blockedIPs.map((blocked, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
              <div>
                <p className="text-white font-mono">{blocked.ip}</p>
                <p className="text-gray-400 text-sm mt-1">{blocked.reason}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-300 text-sm">Blocked {blocked.blockedAt}</p>
                <p className="text-gray-400 text-sm">Expires: {blocked.expires}</p>
              </div>
              <button className="ml-4 px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors text-sm">
                Unblock
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">API Keys</h2>
          <button
            onClick={() => setShowTokens(!showTokens)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {showTokens ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        
        <div className="space-y-3">
          {apiKeys.map((key) => (
            <div key={key.id} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
              <div>
                <p className="text-white font-medium">{key.name}</p>
                <p className="text-gray-400 font-mono text-sm mt-1">
                  {showTokens ? key.key : '••••••••••••••••'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-300 text-sm">Created {key.created}</p>
                <p className="text-gray-400 text-sm">Last used {key.lastUsed}</p>
              </div>
              <div className="ml-4">
                {key.status === 'active' ? (
                  <span className="px-3 py-1 bg-green-900/50 text-green-400 rounded-lg text-sm">Active</span>
                ) : (
                  <span className="px-3 py-1 bg-gray-900/50 text-gray-400 rounded-lg text-sm">Inactive</span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <button className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
          Generate New API Key
        </button>
      </div>
    </div>
  );
};

export default AdminSecurity;