import { useState } from 'react';
import { 
  Settings, 
  Database, 
  Server, 
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Save,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

/**
 * AdminSystem Component
 * 
 * System configuration and settings management interface. Provides controls
 * for maintenance mode, performance tuning, backup management, and real-time
 * system health monitoring with visual status indicators.
 */
const AdminSystem = () => {
  // System configuration state with default values
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    debugMode: false,
    rateLimiting: true,
    caching: true,
    autoBackup: true,
    emailNotifications: true,
    maxFollowsPerHour: 30,
    maxFollowsPerDay: 500,
    sessionTimeout: 3600,
    maxUploadSize: 10
  });

  const [saving, setSaving] = useState(false);

  const handleToggle = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
  };

  const systemStatus = [
    { name: 'Database', status: 'operational', latency: '12ms', icon: Database },
    { name: 'Redis Cache', status: 'operational', latency: '3ms', icon: Server },
    { name: 'Queue System', status: 'operational', jobs: 234, icon: Cpu },
    { name: 'File Storage', status: 'warning', usage: '78%', icon: HardDrive },
    { name: 'API Gateway', status: 'operational', requests: '1.2k/min', icon: Wifi }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Settings className="h-8 w-8 mr-3 text-red-500 animate-spin-slow" />
            System Settings
          </h1>
          <p className="text-gray-400 mt-1">Configure system parameters and monitor health</p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-lg transition-colors flex items-center"
        >
          {saving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* System Status */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {systemStatus.map((service) => {
            const Icon = service.icon;
            return (
              <div key={service.name} className="bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <Icon className="h-5 w-5 text-gray-400" />
                  {service.status === 'operational' ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  )}
                </div>
                <h3 className="text-white font-medium">{service.name}</h3>
                <p className="text-gray-400 text-sm mt-1">
                  {service.latency || service.jobs || service.usage || service.requests}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* General Settings */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">General Settings</h2>
        <div className="space-y-4">
          {/* Maintenance Mode */}
          <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
            <div>
              <h3 className="text-white font-medium">Maintenance Mode</h3>
              <p className="text-gray-400 text-sm">Disable all user access temporarily</p>
            </div>
            <button
              onClick={() => handleToggle('maintenanceMode')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {settings.maintenanceMode ? (
                <ToggleRight className="h-8 w-8 text-red-500" />
              ) : (
                <ToggleLeft className="h-8 w-8" />
              )}
            </button>
          </div>

          {/* Debug Mode */}
          <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
            <div>
              <h3 className="text-white font-medium">Debug Mode</h3>
              <p className="text-gray-400 text-sm">Enable detailed logging and error messages</p>
            </div>
            <button
              onClick={() => handleToggle('debugMode')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {settings.debugMode ? (
                <ToggleRight className="h-8 w-8 text-red-500" />
              ) : (
                <ToggleLeft className="h-8 w-8" />
              )}
            </button>
          </div>

          {/* Rate Limiting */}
          <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
            <div>
              <h3 className="text-white font-medium">Rate Limiting</h3>
              <p className="text-gray-400 text-sm">Protect against API abuse</p>
            </div>
            <button
              onClick={() => handleToggle('rateLimiting')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {settings.rateLimiting ? (
                <ToggleRight className="h-8 w-8 text-red-500" />
              ) : (
                <ToggleLeft className="h-8 w-8" />
              )}
            </button>
          </div>

          {/* Caching */}
          <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
            <div>
              <h3 className="text-white font-medium">Redis Caching</h3>
              <p className="text-gray-400 text-sm">Cache frequently accessed data</p>
            </div>
            <button
              onClick={() => handleToggle('caching')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {settings.caching ? (
                <ToggleRight className="h-8 w-8 text-red-500" />
              ) : (
                <ToggleLeft className="h-8 w-8" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Performance Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rate Limits */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Rate Limits</h2>
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm">Max Follows per Hour</label>
              <input
                type="number"
                value={settings.maxFollowsPerHour}
                onChange={(e) => handleChange('maxFollowsPerHour', parseInt(e.target.value))}
                className="w-full mt-1 px-4 py-2 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="text-gray-400 text-sm">Max Follows per Day</label>
              <input
                type="number"
                value={settings.maxFollowsPerDay}
                onChange={(e) => handleChange('maxFollowsPerDay', parseInt(e.target.value))}
                className="w-full mt-1 px-4 py-2 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm">Session Timeout (seconds)</label>
              <input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
                className="w-full mt-1 px-4 py-2 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Backup Settings */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Backup & Storage</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
              <div>
                <h3 className="text-white font-medium">Auto Backup</h3>
                <p className="text-gray-400 text-sm">Daily automatic database backups</p>
              </div>
              <button
                onClick={() => handleToggle('autoBackup')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {settings.autoBackup ? (
                  <ToggleRight className="h-8 w-8 text-red-500" />
                ) : (
                  <ToggleLeft className="h-8 w-8" />
                )}
              </button>
            </div>

            <div>
              <label className="text-gray-400 text-sm">Max Upload Size (MB)</label>
              <input
                type="number"
                value={settings.maxUploadSize}
                onChange={(e) => handleChange('maxUploadSize', parseInt(e.target.value))}
                className="w-full mt-1 px-4 py-2 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="p-4 bg-gray-900/50 rounded-lg">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Storage Usage</span>
                <span className="text-white">78.3 GB / 100 GB</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-red-600 to-orange-600 h-2 rounded-full" style={{ width: '78.3%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Database Information */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Database Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-900/50 rounded-lg">
            <p className="text-gray-400 text-sm mb-1">Total Records</p>
            <p className="text-2xl font-bold text-white">1,247,892</p>
          </div>
          <div className="p-4 bg-gray-900/50 rounded-lg">
            <p className="text-gray-400 text-sm mb-1">Database Size</p>
            <p className="text-2xl font-bold text-white">4.8 GB</p>
          </div>
          <div className="p-4 bg-gray-900/50 rounded-lg">
            <p className="text-gray-400 text-sm mb-1">Last Backup</p>
            <p className="text-2xl font-bold text-white">2 hours ago</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSystem;