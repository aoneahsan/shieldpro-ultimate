import React, { useState } from 'react';
import { Shield, Users, Settings, Filter, Globe, Lock, ChevronRight, Check } from 'lucide-react';

function Options() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'filters', label: 'Filters', icon: Filter },
    { id: 'privacy', label: 'Privacy', icon: Lock },
    { id: 'whitelist', label: 'Whitelist', icon: Globe },
    { id: 'tiers', label: 'Tiers', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center space-x-4 mb-8">
          <Shield className="w-10 h-10 text-primary-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ShieldPro Ultimate</h1>
            <p className="text-gray-600 dark:text-gray-400">Advanced Ad Blocker Settings</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                      ${activeTab === tab.id
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'general' && <GeneralSettings />}
            {activeTab === 'filters' && <FilterSettings />}
            {activeTab === 'privacy' && <PrivacySettings />}
            {activeTab === 'whitelist' && <WhitelistSettings />}
            {activeTab === 'tiers' && <TierSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}

function GeneralSettings() {
  const [settings, setSettings] = useState({
    enabled: true,
    showBadge: true,
    notifications: true,
    autoUpdate: true,
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">General Settings</h2>
      
      <div className="space-y-4">
        {Object.entries(settings).map(([key, value]) => (
          <label key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
            <div>
              <p className="font-medium text-gray-900 dark:text-white capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configure {key.replace(/([A-Z])/g, ' $1').toLowerCase().trim()} settings
              </p>
            </div>
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
              className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function FilterSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Filter Settings</h2>
      <p className="text-gray-600 dark:text-gray-400">Configure ad blocking filters and rules</p>
      
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Active Filters</h3>
          <ul className="space-y-2">
            <li className="flex items-center text-sm text-blue-700 dark:text-blue-400">
              <Check className="w-4 h-4 mr-2" />
              EasyList (Ads)
            </li>
            <li className="flex items-center text-sm text-blue-700 dark:text-blue-400">
              <Check className="w-4 h-4 mr-2" />
              EasyPrivacy (Trackers)
            </li>
            <li className="flex items-center text-sm text-blue-700 dark:text-blue-400">
              <Check className="w-4 h-4 mr-2" />
              uBlock Filters
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function PrivacySettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Privacy Settings</h2>
      <p className="text-gray-600 dark:text-gray-400">Manage your privacy and tracking protection</p>
    </div>
  );
}

function WhitelistSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Whitelist</h2>
      <p className="text-gray-600 dark:text-gray-400">Manage websites where ads are allowed</p>
    </div>
  );
}

function TierSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tier Progress</h2>
      <p className="text-gray-600 dark:text-gray-400">Track your tier progress and unlock new features</p>
    </div>
  );
}

export default Options;