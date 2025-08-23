import React, { useState, useEffect } from 'react';
import { Shield, Settings, TrendingUp, Users, Zap, ChevronRight } from 'lucide-react';

interface TierInfo {
  level: number;
  name: string;
  color: string;
  progress: number;
  features: string[];
}

const tiers: TierInfo[] = [
  {
    level: 1,
    name: 'Basic',
    color: 'bg-gray-500',
    progress: 20,
    features: ['Basic ad blocking', 'Popup blocker']
  },
  {
    level: 2,
    name: 'Enhanced',
    color: 'bg-blue-500',
    progress: 40,
    features: ['YouTube ad blocking', 'Tracker blocking']
  },
  {
    level: 3,
    name: 'Professional',
    color: 'bg-purple-500',
    progress: 60,
    features: ['Custom filters', 'Whitelist management']
  },
  {
    level: 4,
    name: 'Premium',
    color: 'bg-orange-500',
    progress: 80,
    features: ['Advanced privacy', 'Cloud sync']
  },
  {
    level: 5,
    name: 'Ultimate',
    color: 'bg-red-500',
    progress: 100,
    features: ['All features', 'Priority support']
  }
];

function App() {
  const [enabled, setEnabled] = useState(true);
  const [blockedCount, setBlockedCount] = useState(0);
  const [currentTier, setCurrentTier] = useState(1);

  useEffect(() => {
    chrome.storage.local.get(['enabled', 'blockedCount', 'tier'], (data) => {
      setEnabled(data.enabled ?? true);
      setBlockedCount(data.blockedCount ?? 0);
      setCurrentTier(data.tier ?? 1);
    });
  }, []);

  const toggleExtension = () => {
    const newState = !enabled;
    setEnabled(newState);
    chrome.storage.local.set({ enabled: newState });
    chrome.runtime.sendMessage({ action: 'toggleExtension' });
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  const currentTierInfo = tiers[currentTier - 1];

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Shield className={`w-8 h-8 ${enabled ? 'text-green-500' : 'text-gray-400'}`} />
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">ShieldPro</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {enabled ? 'Protection Active' : 'Protection Disabled'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleExtension}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ads Blocked</span>
            <span className="text-2xl font-bold text-primary-600">{blockedCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>Since installation</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Tier {currentTierInfo.level}: {currentTierInfo.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {currentTierInfo.progress}% to next tier
              </p>
            </div>
            <div className={`w-10 h-10 rounded-full ${currentTierInfo.color} flex items-center justify-center`}>
              <Zap className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
            <div
              className={`h-2 rounded-full ${currentTierInfo.color} transition-all duration-300`}
              style={{ width: `${currentTierInfo.progress}%` }}
            />
          </div>
          <div className="space-y-1">
            {currentTierInfo.features.map((feature, index) => (
              <div key={index} className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                <ChevronRight className="w-3 h-3 mr-1 text-green-500" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => chrome.tabs.create({ url: 'options.html#upgrade' })}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-2 px-4 rounded-lg font-medium text-sm hover:from-primary-700 hover:to-primary-800 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <Users className="w-4 h-4" />
            <span>Unlock Next Tier</span>
          </button>
          
          <button
            onClick={openOptions}
            className="w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg font-medium text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;