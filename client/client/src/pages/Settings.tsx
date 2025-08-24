import { useState, useEffect } from 'react';
import { 
  User, 
  CreditCard, 
  Bell, 
  Shield, 
  Key,
  Save,
  CheckCircle
} from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({
    displayName: '',
    email: '',
    country: ''
  });

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'subscription', name: 'Subscription', icon: CreditCard },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'api', name: 'API Keys', icon: Key }
  ];

  const handleSave = async () => {
    // Save settings logic here
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Display Name</label>
              <input
                type="text"
                value={profile.displayName}
                onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-spotify-green focus:ring-spotify-green"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-spotify-green focus:ring-spotify-green"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Country</label>
              <input
                type="text"
                value={profile.country}
                onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-spotify-green focus:ring-spotify-green"
              />
            </div>
          </div>
        );

      case 'subscription':
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">Current Plan: Free</h3>
              <p className="text-gray-600 mb-4">100 follows per month</p>
              <div className="space-y-4">
                <div className="border rounded-lg p-4 hover:border-spotify-green cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">Pro Plan</h4>
                      <p className="text-sm text-gray-600">1,000 follows per month</p>
                    </div>
                    <span className="text-2xl font-bold">$5/mo</span>
                  </div>
                </div>
                <div className="border rounded-lg p-4 hover:border-spotify-green cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">Premium Plan</h4>
                      <p className="text-sm text-gray-600">Unlimited follows</p>
                    </div>
                    <span className="text-2xl font-bold">$10/mo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
            <label className="flex items-center">
              <input type="checkbox" className="rounded text-spotify-green focus:ring-spotify-green" />
              <span className="ml-2">Email notifications for completed follows</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded text-spotify-green focus:ring-spotify-green" />
              <span className="ml-2">Weekly summary reports</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded text-spotify-green focus:ring-spotify-green" />
              <span className="ml-2">Rate limit warnings</span>
            </label>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Connected Accounts</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-spotify-green rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">S</span>
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">Spotify</p>
                      <p className="text-sm text-gray-600">Connected</p>
                    </div>
                  </div>
                  <button className="text-red-600 hover:text-red-700">Disconnect</button>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Two-Factor Authentication</h3>
              <button className="px-4 py-2 bg-spotify-green text-white rounded-lg hover:bg-green-600">
                Enable 2FA
              </button>
            </div>
          </div>
        );

      case 'api':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">API Key</h3>
              <p className="text-sm text-gray-600 mb-4">
                Use this key to access the Follow Swarm API programmatically
              </p>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
                fs_api_key_xxxxxxxxxxxxxxxxxxxxx
              </div>
              <button className="mt-4 px-4 py-2 bg-spotify-green text-white rounded-lg hover:bg-green-600">
                Generate New Key
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="grid grid-cols-12 divide-x divide-gray-200">
          {/* Sidebar */}
          <div className="col-span-3 p-6">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-spotify-green text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="col-span-9 p-6">
            {renderTabContent()}
            
            {/* Save Button */}
            <div className="mt-6 flex items-center justify-end">
              {saved && (
                <div className="mr-4 flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Saved successfully
                </div>
              )}
              <button
                onClick={handleSave}
                className="flex items-center px-6 py-2 bg-spotify-green text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
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