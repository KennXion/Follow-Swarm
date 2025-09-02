/**
 * Settings Page Component
 * 
 * Comprehensive settings management interface with tabbed navigation.
 * Includes profile, subscription, notifications, security, and API settings.
 * Features dark mode support and gradient-based visual design.
 */
import { useState } from 'react';
import { 
  User, 
  CreditCard, 
  Bell, 
  Shield, 
  Key,
  Save,
  CheckCircle,
  Sparkles,
  Crown,
  Zap,
  Lock,
  Music,
  Link,
  AlertCircle,
  Copy,
  RefreshCw,
  TrendingUp
} from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({
    displayName: '',
    email: '',
    country: ''
  });
  const [notifications, setNotifications] = useState({
    emailCompleted: true,
    weeklyReports: false,
    rateLimitWarnings: true
  });

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User, color: 'from-blue-500 to-cyan-500' },
    { id: 'subscription', name: 'Subscription', icon: CreditCard, color: 'from-purple-500 to-pink-500' },
    { id: 'notifications', name: 'Notifications', icon: Bell, color: 'from-yellow-500 to-orange-500' },
    { id: 'security', name: 'Security', icon: Shield, color: 'from-green-500 to-emerald-500' },
    { id: 'api', name: 'API Keys', icon: Key, color: 'from-red-500 to-rose-500' }
  ];

  const handleSave = async () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText('fs_api_key_xxxxxxxxxxxxxxxxxxxxx');
    alert('API key copied to clipboard!');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl mr-4">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Information</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Update your account details</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={profile.displayName}
                  onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-spotify-green focus:border-transparent transition-all"
                  placeholder="Enter your display name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-spotify-green focus:border-transparent transition-all"
                  placeholder="your@email.com"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Country/Region
                </label>
                <select
                  value={profile.country}
                  onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-spotify-green focus:border-transparent transition-all"
                >
                  <option value="">Select a country</option>
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'subscription':
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl mr-4">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Subscription Plans</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Choose the plan that fits your needs</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Current Plan</h4>
                  <p className="text-2xl font-bold text-spotify-green">Free</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Limit</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">100 follows</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group relative bg-white dark:bg-gray-800/50 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-spotify-green dark:hover:border-spotify-green p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="absolute top-4 right-4">
                  <Crown className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="mb-4">
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white">Pro Plan</h4>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Perfect for growing artists</p>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">$5</span>
                  <span className="text-gray-500 dark:text-gray-400">/month</span>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center text-gray-700 dark:text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    1,000 follows per month
                  </li>
                  <li className="flex items-center text-gray-700 dark:text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Priority support
                  </li>
                  <li className="flex items-center text-gray-700 dark:text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Advanced analytics
                  </li>
                </ul>
                <button className="mt-6 w-full py-2.5 bg-gradient-to-r from-spotify-green to-green-500 text-white font-semibold rounded-xl hover:from-spotify-dark-green hover:to-green-600 transition-all duration-300">
                  Upgrade
                </button>
              </div>

              <div className="group relative bg-white dark:bg-gray-800/50 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-spotify-green dark:hover:border-spotify-green p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="absolute top-4 right-4">
                  <Sparkles className="h-5 w-5 text-purple-500 animate-pulse" />
                </div>
                <div className="mb-4">
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white">Premium Plan</h4>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Unlimited possibilities</p>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">$10</span>
                  <span className="text-gray-500 dark:text-gray-400">/month</span>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center text-gray-700 dark:text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Unlimited follows
                  </li>
                  <li className="flex items-center text-gray-700 dark:text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    24/7 Premium support
                  </li>
                  <li className="flex items-center text-gray-700 dark:text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    API access included
                  </li>
                </ul>
                <button className="mt-6 w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300">
                  Go Premium
                </button>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl mr-4">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Preferences</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Control how you receive updates</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center">
                    <Zap className="h-5 w-5 text-yellow-500 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Follow Completions</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when follows are completed</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.emailCompleted}
                    onChange={(e) => setNotifications({ ...notifications, emailCompleted: e.target.checked })}
                    className="h-5 w-5 rounded text-spotify-green focus:ring-spotify-green"
                  />
                </label>
              </div>

              <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-blue-500 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Weekly Reports</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive weekly performance summaries</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.weeklyReports}
                    onChange={(e) => setNotifications({ ...notifications, weeklyReports: e.target.checked })}
                    className="h-5 w-5 rounded text-spotify-green focus:ring-spotify-green"
                  />
                </label>
              </div>

              <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Rate Limit Warnings</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Alert when approaching rate limits</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.rateLimitWarnings}
                    onChange={(e) => setNotifications({ ...notifications, rateLimitWarnings: e.target.checked })}
                    className="h-5 w-5 rounded text-spotify-green focus:ring-spotify-green"
                  />
                </label>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl mr-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security Settings</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account security</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Connected Accounts</h4>
                <div className="bg-gradient-to-r from-spotify-green/10 to-green-500/10 dark:from-spotify-green/20 dark:to-green-500/20 rounded-xl border border-spotify-green/30 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-12 w-12 bg-gradient-to-br from-spotify-green to-green-600 rounded-xl flex items-center justify-center">
                        <Music className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="font-semibold text-gray-900 dark:text-white">Spotify</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                          <Link className="h-3 w-3 mr-1" />
                          Connected
                        </p>
                      </div>
                    </div>
                    <button className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                      Disconnect
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Two-Factor Authentication</h4>
                <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Lock className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">2FA Status</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Not enabled</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-spotify-green text-white rounded-xl hover:bg-spotify-dark-green transition-colors">
                      Enable 2FA
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'api':
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl mr-4">
                <Key className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">API Access</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your API keys for programmatic access</p>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Security Notice</p>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                    Keep your API keys secure. Never share them publicly or commit them to version control.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">Your API Key</h4>
                <div className="flex gap-2">
                  <button
                    onClick={copyApiKey}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-spotify-green dark:hover:text-spotify-green transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-spotify-green dark:hover:text-spotify-green transition-colors">
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-900/50 rounded-lg p-4 font-mono text-sm text-gray-700 dark:text-gray-300">
                fs_api_key_xxxxxxxxxxxxxxxxxxxxx
              </div>
              <button className="mt-4 w-full py-2.5 bg-gradient-to-r from-spotify-green to-green-500 text-white font-semibold rounded-xl hover:from-spotify-dark-green hover:to-green-600 transition-all duration-300">
                Generate New Key
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // const currentTab = tabs.find(tab => tab.id === activeTab); // TODO: Use for tab-specific logic

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account and preferences</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
        <div className="grid grid-cols-12 divide-x divide-gray-200 dark:divide-gray-700">
          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-3 p-6 bg-gray-50 dark:bg-gray-900/30">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActive
                        ? `bg-gradient-to-r ${tab.color} text-white shadow-lg transform scale-105`
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : ''}`} />
                    {tab.name}
                    {isActive && (
                      <Sparkles className="ml-auto h-4 w-4 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="col-span-12 lg:col-span-9 p-8">
            <div className="animate-fade-in">
              {renderTabContent()}
            </div>
            
            {/* Save Button */}
            <div className="mt-8 flex items-center justify-end border-t border-gray-200 dark:border-gray-700 pt-6">
              {saved && (
                <div className="mr-4 flex items-center text-green-600 dark:text-green-400 animate-fade-in">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="font-medium">Saved successfully</span>
                </div>
              )}
              <button
                onClick={handleSave}
                className="group flex items-center px-6 py-2.5 bg-gradient-to-r from-spotify-green to-green-500 text-white font-semibold rounded-xl hover:from-spotify-dark-green hover:to-green-600 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-spotify-green/30"
              >
                <Save className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;