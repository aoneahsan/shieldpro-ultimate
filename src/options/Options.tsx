import { useState, useEffect } from 'react';
import { Shield, Users, Settings, Filter, Globe, Lock, Check, Download, Upload, Network, Code, Zap, ShieldX, Database, List, Sparkles, Gift, Star, X, Palette, Image, Cloud, Info } from 'lucide-react';
import { CustomFilters } from './components/CustomFilters';
import { AdvancedWhitelist } from './components/AdvancedWhitelist';
import { FilterListManager } from './components/FilterListManager';
import { WhitelistManager } from './components/WhitelistManager';
import { RegexPatternManager } from './components/RegexPatternManager';
import { ScriptControlPanel } from '../components/ScriptControlPanel';
import { NetworkLogger } from '../components/NetworkLogger';
import { GeneralSettings } from './components/GeneralSettings';
import { ThemeManager } from './components/ThemeManager';
import { ImageSwap } from './components/ImageSwap';
import { BackupSync } from './components/BackupSync';
import { StorageManager } from '../shared/utils/storage';

function Options() {
  // Get initial tab from URL or default to 'general'
  const getInitialTab = () => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.slice(1); // Remove #
    return params.get('tab') || hash || 'general';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [currentTier, setCurrentTier] = useState(1);
  const [isEarlyAdopter, setIsEarlyAdopter] = useState(false);
  const [userNumber, setUserNumber] = useState(0);

  useEffect(() => {
    loadCurrentTier();
    checkEarlyAdopterStatus();
    
    // Handle browser back/forward navigation
    const handlePopState = () => {
      setActiveTab(getInitialTab());
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const loadCurrentTier = async () => {
    const storage = StorageManager.getInstance();
    const settings = await storage.getSettings();
    setCurrentTier(settings.tier?.level || 1);
  };

  const checkEarlyAdopterStatus = async () => {
    try {
      // Import the early adopter service
      const { earlyAdopterService } = await import('../shared/services/early-adopter.service');
      const status = await earlyAdopterService.initializeUser();
      setIsEarlyAdopter(status.isEarlyAdopter);
      setUserNumber(status.userNumber);
    } catch (error) {
      console.error('Error checking early adopter status:', error);
    }
  };

  // Update URL when tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    // Update URL without page reload
    const newUrl = `${window.location.pathname}#${tabId}`;
    window.history.pushState({ tab: tabId }, '', newUrl);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'filters', label: 'Filters', icon: Filter },
    { id: 'privacy', label: 'Privacy', icon: Lock },
    { id: 'whitelist', label: 'Whitelist', icon: Globe },
    { id: 'tiers', label: 'Tiers', icon: Users },
    ...(currentTier >= 2 ? [
      { id: 'themes', label: 'Themes', icon: Palette }
    ] : []),
    ...(currentTier >= 3 ? [
      { id: 'custom-filters', label: 'Custom Filters', icon: Filter },
      { id: 'image-swap', label: 'Image Swap', icon: Image },
      { id: 'backup-sync', label: 'Backup & Sync', icon: Cloud }
    ] : []),
    ...(currentTier >= 4 ? [
      { id: 'filter-lists', label: 'Filter Lists', icon: Database },
      { id: 'whitelist-manager', label: 'Whitelist Manager', icon: List },
      { id: 'regex-patterns', label: 'Regex Patterns', icon: Code },
      { id: 'scripts', label: 'Script Control', icon: Code },
      { id: 'network', label: 'Network Logger', icon: Network },
      { id: 'security', label: 'Security', icon: Shield }
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Early Adopter Banner */}
      {isEarlyAdopter && userNumber > 0 && (
        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Sparkles className="w-6 h-6" />
                <div>
                  <h2 className="text-lg font-bold flex items-center space-x-2">
                    <span>🎆 Early Adopter Benefits Active!</span>
                    <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs">
                      #{userNumber.toLocaleString()}
                    </span>
                  </h2>
                  <p className="text-sm opacity-90">
                    You're one of the first 100,000 users – ALL features from ALL 5 tiers are FREE for you forever! 🎉
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold flex items-center space-x-1">
                  <Star className="w-3 h-3" />
                  <span>Lifetime Premium</span>
                </div>
                <Gift className="w-8 h-8 text-yellow-300 animate-bounce" />
              </div>
            </div>
          </div>
        </div>
      )}
      
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
            <div className="relative">
              <nav className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 px-6" aria-label="Tabs">
                <div className="flex space-x-6 min-w-max">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`
                          flex items-center space-x-2 py-4 px-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                          ${activeTab === tab.id
                            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                          }
                        `}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </nav>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'general' && <GeneralSettings currentTier={isEarlyAdopter ? 5 : currentTier} />}
            {activeTab === 'filters' && <FilterSettings />}
            {activeTab === 'privacy' && <PrivacySettings />}
            {activeTab === 'whitelist' && <WhitelistSettings />}
            {activeTab === 'tiers' && <TierSettings />}
            {activeTab === 'themes' && (isEarlyAdopter || currentTier >= 2) && <ThemeManager currentTier={isEarlyAdopter ? 5 : currentTier} />}
            {activeTab === 'custom-filters' && (isEarlyAdopter || currentTier >= 3) && <CustomFilters currentTier={isEarlyAdopter ? 5 : currentTier} />}
            {activeTab === 'image-swap' && (isEarlyAdopter || currentTier >= 3) && <ImageSwap currentTier={isEarlyAdopter ? 5 : currentTier} />}
            {activeTab === 'backup-sync' && (isEarlyAdopter || currentTier >= 3) && <BackupSync currentTier={isEarlyAdopter ? 5 : currentTier} />}
            {activeTab === 'filter-lists' && (isEarlyAdopter || currentTier >= 4) && <FilterListManager currentTier={isEarlyAdopter ? 5 : currentTier} />}
            {activeTab === 'whitelist-manager' && (isEarlyAdopter || currentTier >= 4) && <WhitelistManager currentTier={isEarlyAdopter ? 5 : currentTier} />}
            {activeTab === 'regex-patterns' && (isEarlyAdopter || currentTier >= 4) && <RegexPatternManager currentTier={isEarlyAdopter ? 5 : currentTier} />}
            {activeTab === 'scripts' && (isEarlyAdopter || currentTier >= 4) && <ScriptControlPanel currentTier={isEarlyAdopter ? 5 : currentTier} />}
            {activeTab === 'network' && (isEarlyAdopter || currentTier >= 4) && <NetworkLogger currentTier={isEarlyAdopter ? 5 : currentTier} />}
            {activeTab === 'security' && (isEarlyAdopter || currentTier >= 4) && <SecuritySettings />}
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
  const [currentTier, setCurrentTier] = useState(1);
  const [privacySettings, setPrivacySettings] = useState({
    // Tier 2+ features
    trackingProtection: true,
    socialMediaBlocking: true,
    sessionRecordingPrevention: true,
    // Tier 4 features
    canvasFingerprinting: false,
    webrtcLeakProtection: false,
    audioFingerprinting: false,
    fontFingerprinting: false,
    dnsOverHttps: false,
  });

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    const storage = StorageManager.getInstance();
    const settings = await storage.getSettings();
    setCurrentTier(settings.tier?.level || 1);
    
    // Load privacy settings
    const stored = await chrome.storage.local.get(['privacySettings']);
    if (stored.privacySettings) {
      setPrivacySettings(prev => ({ ...prev, ...stored.privacySettings }));
    }
  };

  const updatePrivacySetting = async (key: string, value: boolean) => {
    const newSettings = { ...privacySettings, [key]: value };
    setPrivacySettings(newSettings);
    await chrome.storage.local.set({ privacySettings: newSettings });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Privacy Settings</h2>
      <p className="text-gray-600 dark:text-gray-400">Manage your privacy and tracking protection</p>
      
      {/* Show upgrade prompt for Tier 1 users */}
      {currentTier < 2 && (
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-full">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Unlock Privacy Protection</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Advanced privacy features are available starting from Tier 2</p>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-gray-700 dark:text-gray-300">Upgrade to Tier 2 to unlock:</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">Advanced Tracking Protection (40+ networks)</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">Social Media Widget Blocking</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">Session Recording Prevention</span>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                <strong>How to upgrade:</strong> Simply create a free account in the extension popup to instantly unlock Tier 2!
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Tier 2+ Privacy Features */}
      {currentTier >= 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Enhanced Protection</h3>
          
          <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Advanced Tracking Protection</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Block 40+ tracking networks</p>
            </div>
            <input
              type="checkbox"
              checked={privacySettings.trackingProtection}
              onChange={(e) => updatePrivacySetting('trackingProtection', e.target.checked)}
              className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Social Media Blocking</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Block social media widgets and trackers</p>
            </div>
            <input
              type="checkbox"
              checked={privacySettings.socialMediaBlocking}
              onChange={(e) => updatePrivacySetting('socialMediaBlocking', e.target.checked)}
              className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Session Recording Prevention</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Block Hotjar, FullStory, and similar services</p>
            </div>
            <input
              type="checkbox"
              checked={privacySettings.sessionRecordingPrevention}
              onChange={(e) => updatePrivacySetting('sessionRecordingPrevention', e.target.checked)}
              className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </label>
        </div>
      )}

      {/* Tier 4 Advanced Privacy Features */}
      {currentTier >= 4 && (
        <div className="space-y-4 border-t pt-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Ultimate Privacy Protection</h3>
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
              TIER 4
            </span>
          </div>

          <label className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Canvas Fingerprinting Protection</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Inject noise to prevent canvas-based tracking</p>
            </div>
            <input
              type="checkbox"
              checked={privacySettings.canvasFingerprinting}
              onChange={(e) => updatePrivacySetting('canvasFingerprinting', e.target.checked)}
              className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">WebRTC Leak Protection</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Prevent IP address leaks through WebRTC</p>
            </div>
            <input
              type="checkbox"
              checked={privacySettings.webrtcLeakProtection}
              onChange={(e) => updatePrivacySetting('webrtcLeakProtection', e.target.checked)}
              className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Audio Fingerprinting Protection</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Randomize audio context to prevent fingerprinting</p>
            </div>
            <input
              type="checkbox"
              checked={privacySettings.audioFingerprinting}
              onChange={(e) => updatePrivacySetting('audioFingerprinting', e.target.checked)}
              className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Font Fingerprinting Protection</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Spoof font metrics to prevent identification</p>
            </div>
            <input
              type="checkbox"
              checked={privacySettings.fontFingerprinting}
              onChange={(e) => updatePrivacySetting('fontFingerprinting', e.target.checked)}
              className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">DNS-over-HTTPS</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Secure DNS queries through encrypted HTTPS</p>
            </div>
            <input
              type="checkbox"
              checked={privacySettings.dnsOverHttps}
              onChange={(e) => updatePrivacySetting('dnsOverHttps', e.target.checked)}
              className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
          </label>
        </div>
      )}
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
  const [currentTier, setCurrentTier] = useState(1);
  const [isEarlyAdopter, setIsEarlyAdopter] = useState(false);
  const [userStats, setUserStats] = useState({
    isLoggedIn: false,
    profileComplete: 0,
    referralCount: 0,
    weeklyEngagement: 0,
    lastActiveDate: null as string | null
  });

  useEffect(() => {
    loadTierData();
  }, []);

  const loadTierData = async () => {
    const storage = StorageManager.getInstance();
    const settings = await storage.getSettings();
    setCurrentTier(settings.tier?.level || 1);
    
    // Check early adopter status
    try {
      const { earlyAdopterService } = await import('../shared/services/early-adopter.service');
      const status = await earlyAdopterService.initializeUser();
      setIsEarlyAdopter(status.isEarlyAdopter);
    } catch (error) {
      console.error('Error checking early adopter status:', error);
    }
    
    // Load user stats
    const stats = await chrome.storage.local.get(['userStats']);
    if (stats.userStats) {
      setUserStats(stats.userStats);
    }
  };

  const tierData = [
    {
      tier: 1,
      name: 'Basic',
      icon: Shield,
      color: 'gray',
      requirement: 'Free - No signup required',
      features: [
        'Basic ad blocking (50+ rules)',
        'Popup blocker',
        'Cookie consent auto-dismiss',
        'Basic statistics'
      ],
      unlocked: true,
      progress: 100
    },
    {
      tier: 2,
      name: 'Member',
      icon: Users,
      color: 'blue',
      requirement: 'Create free account',
      features: [
        'YouTube ad blocking',
        'Advanced tracker blocking (40+ networks)',
        'Social media widget blocking',
        'Custom themes',
        'Session recording prevention'
      ],
      unlocked: userStats.isLoggedIn,
      progress: userStats.isLoggedIn ? 100 : 0
    },
    {
      tier: 3,
      name: 'Pro',
      icon: Star,
      color: 'purple',
      requirement: 'Complete profile (100%)',
      features: [
        'Custom filter rules',
        'Image replacement',
        'Backup & sync settings',
        'Advanced whitelist management',
        'Import/Export filters'
      ],
      unlocked: userStats.profileComplete >= 100,
      progress: userStats.profileComplete
    },
    {
      tier: 4,
      name: 'Elite',
      icon: Zap,
      color: 'orange',
      requirement: 'Refer 30 friends',
      features: [
        'Filter list subscriptions',
        'Regex pattern matching',
        'Script control panel',
        'Network request logger',
        'Advanced security features'
      ],
      unlocked: userStats.referralCount >= 30,
      progress: Math.min(100, (userStats.referralCount / 30) * 100)
    },
    {
      tier: 5,
      name: 'Ultimate',
      icon: Sparkles,
      color: 'gradient',
      requirement: 'Weekly active usage',
      features: [
        'AI-powered ad detection',
        'Real-time filter updates',
        'Priority support',
        'Beta features access',
        'Custom filter sharing'
      ],
      unlocked: currentTier >= 5,
      progress: userStats.weeklyEngagement
    }
  ];

  if (isEarlyAdopter) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tier Progress</h2>
        
        {/* Early Adopter Special Status */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Gift className="w-10 h-10" />
              <div>
                <h3 className="text-2xl font-bold">Early Adopter - All Tiers Unlocked!</h3>
                <p className="text-white/90">You have lifetime access to all features from all 5 tiers</p>
              </div>
            </div>
            <div className="text-4xl">🎉</div>
          </div>
          
          <div className="grid grid-cols-5 gap-2 mt-6">
            {[1, 2, 3, 4, 5].map((tier) => (
              <div key={tier} className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">Tier {tier}</div>
                <Check className="w-6 h-6 mx-auto mt-1" />
              </div>
            ))}
          </div>
        </div>

        {/* All Features List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Unlocked Features</h3>
          {tierData.map((tier) => (
            <div key={tier.tier} className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <tier.icon className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Tier {tier.tier}: {tier.name}
                  </h4>
                </div>
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <ul className="space-y-1 ml-7">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                    <Check className="w-3 h-3 mr-2 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tier Progress</h2>
      <p className="text-gray-600 dark:text-gray-400">Track your tier progress and unlock new features</p>
      
      {/* Current Status */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Current Tier</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              Tier {currentTier} - {tierData[currentTier - 1]?.name}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">Next Tier</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentTier < 5 ? `Tier ${currentTier + 1} - ${tierData[currentTier]?.name}` : 'Max Level'}
            </p>
          </div>
        </div>
      </div>

      {/* Tier Progression */}
      <div className="space-y-6">
        {tierData.map((tier, index) => {
          const Icon = tier.icon;
          const isUnlocked = tier.unlocked;
          const isCurrent = currentTier === tier.tier;
          
          return (
            <div
              key={tier.tier}
              className={`relative rounded-lg border-2 transition-all ${
                isUnlocked
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : isCurrent
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              {/* Connection Line */}
              {index < tierData.length - 1 && (
                <div className={`absolute left-8 top-full h-6 w-0.5 -translate-x-1/2 ${
                  isUnlocked ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                }`} />
              )}
              
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center ${
                    isUnlocked
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Tier {tier.tier}: {tier.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {tier.requirement}
                        </p>
                      </div>
                      {isUnlocked && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <Check className="w-5 h-5" />
                          <span className="text-sm font-medium">Unlocked</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Progress Bar */}
                    {!isUnlocked && tier.tier > 1 && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Progress</span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {Math.round(tier.progress)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${tier.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Features */}
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Features:</p>
                      <ul className="space-y-1">
                        {tier.features.map((feature, idx) => (
                          <li
                            key={idx}
                            className={`text-sm flex items-start ${
                              isUnlocked
                                ? 'text-gray-700 dark:text-gray-300'
                                : 'text-gray-500 dark:text-gray-500'
                            }`}
                          >
                            <span className="mr-2">•</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Action Button */}
                    {!isUnlocked && isCurrent && (
                      <div className="mt-4">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                          {tier.tier === 2 && 'Create Account'}
                          {tier.tier === 3 && 'Complete Profile'}
                          {tier.tier === 4 && 'Invite Friends'}
                          {tier.tier === 5 && 'Stay Active'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips Section */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">Pro Tip</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {currentTier === 1 && "Create a free account to instantly unlock Tier 2 and get YouTube ad blocking!"}
              {currentTier === 2 && "Complete your profile to unlock Tier 3 and get custom filter rules!"}
              {currentTier === 3 && "Invite 30 friends to unlock Tier 4 and access advanced security features!"}
              {currentTier === 4 && "Stay active weekly to reach Tier 5 and get AI-powered ad detection!"}
              {currentTier === 5 && "You've reached the highest tier! Enjoy all premium features!"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SecuritySettings() {
  const [securitySettings, setSecuritySettings] = useState({
    malwareBlocking: true,
    phishingProtection: true,
    cryptominingPrevention: true,
    threatNotifications: true,
    securityLogging: false,
    advancedThreatDetection: true,
    automaticThreatReporting: false
  });

  const [threatStats, setThreatStats] = useState({
    totalThreats: 0,
    malwareBlocked: 0,
    phishingBlocked: 0,
    cryptominingBlocked: 0,
    lastThreatDetected: null as string | null
  });

  useEffect(() => {
    loadSecuritySettings();
    loadThreatStats();
  }, []);

  const loadSecuritySettings = async () => {
    const stored = await chrome.storage.local.get(['securitySettings']);
    if (stored.securitySettings) {
      setSecuritySettings(prev => ({ ...prev, ...stored.securitySettings }));
    }
  };

  const loadThreatStats = async () => {
    const stored = await chrome.storage.local.get(['threatStats']);
    if (stored.threatStats) {
      setThreatStats(stored.threatStats);
    }
  };

  const updateSecuritySetting = async (key: string, value: boolean) => {
    const newSettings = { ...securitySettings, [key]: value };
    setSecuritySettings(newSettings);
    await chrome.storage.local.set({ securitySettings: newSettings });
  };

  const clearThreatLogs = async () => {
    if (confirm('Are you sure you want to clear all threat logs?')) {
      await chrome.storage.local.remove(['threatLogs']);
      setThreatStats({
        totalThreats: 0,
        malwareBlocked: 0,
        phishingBlocked: 0,
        cryptominingBlocked: 0,
        lastThreatDetected: null
      });
      await chrome.storage.local.set({ threatStats: { totalThreats: 0, malwareBlocked: 0, phishingBlocked: 0, cryptominingBlocked: 0, lastThreatDetected: null } });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Security Center</h2>
        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
          TIER 4
        </span>
      </div>
      
      <p className="text-gray-600 dark:text-gray-400">
        Advanced security features to protect against malware, phishing, and other threats
      </p>

      {/* Threat Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Total Threats</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">{threatStats.totalThreats}</p>
            </div>
            <Shield className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Malware Blocked</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{threatStats.malwareBlocked}</p>
            </div>
            <ShieldX className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Phishing Blocked</p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{threatStats.phishingBlocked}</p>
            </div>
            <Lock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Cryptomining</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{threatStats.cryptominingBlocked}</p>
            </div>
            <Zap className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Threat Protection</h3>
        
        <label className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Malware Blocking</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Block known malicious domains and files</p>
          </div>
          <input
            type="checkbox"
            checked={securitySettings.malwareBlocking}
            onChange={(e) => updateSecuritySetting('malwareBlocking', e.target.checked)}
            className="h-5 w-5 text-red-600 focus:ring-red-500 border-gray-300 rounded"
          />
        </label>

        <label className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Phishing Protection</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Detect and block phishing attempts</p>
          </div>
          <input
            type="checkbox"
            checked={securitySettings.phishingProtection}
            onChange={(e) => updateSecuritySetting('phishingProtection', e.target.checked)}
            className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
          />
        </label>

        <label className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Cryptomining Prevention</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Block cryptocurrency mining scripts</p>
          </div>
          <input
            type="checkbox"
            checked={securitySettings.cryptominingPrevention}
            onChange={(e) => updateSecuritySetting('cryptominingPrevention', e.target.checked)}
            className="h-5 w-5 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
          />
        </label>

        <label className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Advanced Threat Detection</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Use heuristic analysis for unknown threats</p>
          </div>
          <input
            type="checkbox"
            checked={securitySettings.advancedThreatDetection}
            onChange={(e) => updateSecuritySetting('advancedThreatDetection', e.target.checked)}
            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </label>
      </div>

      {/* Notification Settings */}
      <div className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Notifications & Logging</h3>
        
        <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Threat Notifications</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Show notifications when threats are detected</p>
          </div>
          <input
            type="checkbox"
            checked={securitySettings.threatNotifications}
            onChange={(e) => updateSecuritySetting('threatNotifications', e.target.checked)}
            className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
        </label>

        <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Security Logging</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Keep detailed logs of security events</p>
          </div>
          <input
            type="checkbox"
            checked={securitySettings.securityLogging}
            onChange={(e) => updateSecuritySetting('securityLogging', e.target.checked)}
            className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
        </label>

        <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Automatic Threat Reporting</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Anonymously report new threats to improve protection</p>
          </div>
          <input
            type="checkbox"
            checked={securitySettings.automaticThreatReporting}
            onChange={(e) => updateSecuritySetting('automaticThreatReporting', e.target.checked)}
            className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
        </label>
      </div>

      {/* Actions */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Security Actions</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage security logs and data</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={clearThreatLogs}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Clear Threat Logs
            </button>
          </div>
        </div>

        {threatStats.lastThreatDetected && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Last threat detected: {new Date(threatStats.lastThreatDetected).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Options;