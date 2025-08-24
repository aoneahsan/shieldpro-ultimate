import { useState, useEffect } from 'react';
import { Shield, Users, Settings, Filter, Globe, Lock,  Check, Download, Upload } from 'lucide-react';
import { CustomFilters } from './components/CustomFilters';
import { AdvancedWhitelist } from './components/AdvancedWhitelist';
import { StorageManager } from '../shared/utils/storage';

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
  const [currentTier, setCurrentTier] = useState(1);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const storage = StorageManager.getInstance();
    const savedSettings = await storage.getSettings();
    setCurrentTier(savedSettings.tier?.level || 1);
    setSettings({
      enabled: savedSettings.enabled ?? true,
      showBadge: savedSettings.showBadge ?? true,
      notifications: savedSettings.notifications ?? true,
      autoUpdate: savedSettings.autoUpdate ?? true,
    });
  };

  const saveSettings = async (newSettings: typeof settings) => {
    setSettings(newSettings);
    const storage = StorageManager.getInstance();
    await storage.updateSettings(newSettings);
  };

  const exportSettings = async () => {
    const storage = StorageManager.getInstance();
    const allData = {
      settings: await storage.getSettings(),
      customFilters: await chrome.storage.local.get('customFilters'),
      whitelist: await chrome.storage.local.get('whitelist'),
      stats: await chrome.storage.local.get('stats'),
      version: '1.0.0',
      exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(allData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `shieldpro-settings-${Date.now()}.json`);
    linkElement.click();
  };

  const importSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          
          // Import settings
          if (imported.settings) {
            const storage = StorageManager.getInstance();
            await storage.updateSettings(imported.settings);
          }
          
          // Import custom filters
          if (imported.customFilters) {
            await chrome.storage.local.set({ customFilters: imported.customFilters.customFilters });
          }
          
          // Import whitelist
          if (imported.whitelist) {
            await chrome.storage.local.set({ whitelist: imported.whitelist.whitelist });
          }
          
          alert('Settings imported successfully! Reloading extension...');
          chrome.runtime.reload();
        } catch (error) {
          alert('Failed to import settings. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  };

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
              onChange={(e) => saveSettings({ ...settings, [key]: e.target.checked })}
              className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </label>
        ))}
      </div>

      {/* Import/Export Section - Tier 3 Feature */}
      {currentTier >= 3 && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Backup & Restore</h3>
          <div className="flex space-x-4">
            <button
              onClick={exportSettings}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Settings</span>
            </button>
            <button
              onClick={importSettings}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Import Settings</span>
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Tier 3 Feature: Export and import all your settings, custom filters, and whitelist
          </p>
        </div>
      )}
    </div>
  );
}

function FilterSettings() {
  const [currentTier, setCurrentTier] = useState(1);

  useEffect(() => {
    loadTier();
  }, []);

  const loadTier = async () => {
    const storage = StorageManager.getInstance();
    const settings = await storage.getSettings();
    setCurrentTier(settings.tier?.level || 1);
  };

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
              Tier 1: Basic Ad Blocking (50+ rules)
            </li>
            {currentTier >= 2 && (
              <li className="flex items-center text-sm text-blue-700 dark:text-blue-400">
                <Check className="w-4 h-4 mr-2" />
                Tier 2: Advanced Trackers (40+ rules)
              </li>
            )}
            {currentTier >= 3 && (
              <li className="flex items-center text-sm text-blue-700 dark:text-blue-400">
                <Check className="w-4 h-4 mr-2" />
                Tier 3: Professional Filters (100+ rules)
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Custom Filters Component */}
      <CustomFilters currentTier={currentTier} />
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
  const [currentTier, setCurrentTier] = useState(1);

  useEffect(() => {
    loadTier();
  }, []);

  const loadTier = async () => {
    const storage = StorageManager.getInstance();
    const settings = await storage.getSettings();
    setCurrentTier(settings.tier?.level || 1);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Whitelist Management</h2>
      <p className="text-gray-600 dark:text-gray-400">Manage websites where ads are allowed</p>
      
      {/* Basic whitelist for all tiers */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="font-medium text-gray-900 dark:text-white mb-2">Basic Whitelist</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Add websites where you want to allow ads (supports all tiers)
        </p>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Enter domain (e.g., example.com)"
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
          />
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            Add to Whitelist
          </button>
        </div>
      </div>

      {/* Advanced whitelist component for Tier 3+ */}
      <AdvancedWhitelist currentTier={currentTier} />
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