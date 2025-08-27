import React, { useEffect, useState } from 'react';
import { ExtensionSettings, BlockingStats, TabState } from '../shared/types';
import { AccountManager } from './components/AccountManager';
import { EarlyAdopterStatus } from '../shared/constants/marketing';
import { 
  Shield, 
  Power, 
  ListX, 
  TrendingUp, 
  Globe, 
  Settings,
  RefreshCw,
  CheckCircle,
  XCircle,
  Activity,
  BarChart3,
  Youtube,
  Eye,
  Share2,
  Crown,
  AlertCircle
} from 'lucide-react';

const App: React.FC = () => {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [stats, setStats] = useState<BlockingStats | null>(null);
  const [tabState, setTabState] = useState<TabState | null>(null);
  const [earlyAdopterStatus, setEarlyAdopterStatus] = useState<EarlyAdopterStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    const interval = setInterval(loadData, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [settingsRes, statsRes, tabStateRes, earlyAdopterRes] = await Promise.all([
        chrome.runtime.sendMessage({ action: 'getSettings' }),
        chrome.runtime.sendMessage({ action: 'getStats' }),
        chrome.runtime.sendMessage({ action: 'getTabState' }),
        chrome.runtime.sendMessage({ action: 'getEarlyAdopterStatus' })
      ]);
      
      setSettings(settingsRes);
      setStats(statsRes);
      setTabState(tabStateRes);
      setEarlyAdopterStatus(earlyAdopterRes);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load data:', error);
      setLoading(false);
    }
  };

  const toggleExtension = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'toggleExtension' });
      setSettings(prev => prev ? { ...prev, enabled: response.enabled } : null);
    } catch (error) {
      console.error('Failed to toggle extension:', error);
    }
  };

  const toggleWhitelist = async () => {
    if (!tabState?.domain) return;
    
    try {
      const response = await chrome.runtime.sendMessage({ 
        action: 'toggleWhitelist',
        domain: tabState.domain 
      });
      setTabState(prev => prev ? { ...prev, whitelisted: response.whitelisted } : null);
    } catch (error) {
      console.error('Failed to toggle whitelist:', error);
    }
  };

  const clearStats = async () => {
    if (confirm('Clear all statistics?')) {
      try {
        await chrome.runtime.sendMessage({ action: 'clearStats' });
        await loadData();
      } catch (error) {
        console.error('Failed to clear stats:', error);
      }
    }
  };

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleTierUpgrade = (newTier: number) => {
    setSettings(prev => prev ? {
      ...prev,
      tier: {
        ...prev.tier,
        level: newTier as any,
        name: getTierName(newTier),
        unlockedAt: Date.now(),
        progress: newTier * 20
      }
    } : null);
  };

  const getTierName = (tier: number): any => {
    const names = ['Basic', 'Enhanced', 'Professional', 'Premium', 'Ultimate'];
    return names[tier - 1] || 'Basic';
  };

  const getTierColor = (tier: number): string => {
    const colors = ['bg-gray-500', 'bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-gradient-to-r from-yellow-400 to-orange-500'];
    return colors[tier - 1] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="popup-container flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const currentTier = settings?.tier?.level || 1;
  const isEarlyAdopter = earlyAdopterStatus?.isEarlyAdopter || false;
  const hasYouTubeAccess = isEarlyAdopter || currentTier >= 2;
  const isYouTubeActive = hasYouTubeAccess && tabState?.domain?.includes('youtube.com');

  return (
    <div className="popup-container bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6" />
            <h1 className="text-lg font-bold">ShieldPro Ultimate</h1>
          </div>
          <button
            onClick={openSettings}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
        
        {/* Power Toggle */}
        <button
          onClick={toggleExtension}
          className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
            settings?.enabled 
              ? 'bg-white/10 hover:bg-white/20' 
              : 'bg-red-500/20 hover:bg-red-500/30'
          }`}
        >
          <div className="flex items-center space-x-3">
            <Power className={`w-5 h-5 ${settings?.enabled ? 'text-green-300' : 'text-red-300'}`} />
            <span className="font-medium">
              {settings?.enabled ? 'Protection Active' : 'Protection Disabled'}
            </span>
          </div>
          <div className={`w-12 h-6 rounded-full transition-colors ${
            settings?.enabled ? 'bg-green-400' : 'bg-gray-400'
          }`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
              settings?.enabled ? 'translate-x-6' : 'translate-x-0.5'
            } mt-0.5`} />
          </div>
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Early Adopter Banner */}
        {earlyAdopterStatus && (
          <div className={`rounded-lg p-3 ${
            earlyAdopterStatus.isEarlyAdopter 
              ? 'bg-gradient-to-r from-yellow-400 to-orange-400' 
              : 'bg-gradient-to-r from-blue-400 to-purple-400'
          } text-white shadow-lg`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <Crown className="w-5 h-5" />
                  <span className="font-bold">
                    {earlyAdopterStatus.isEarlyAdopter 
                      ? `Early Adopter #${earlyAdopterStatus.userNumber.toLocaleString()}`
                      : `User #${earlyAdopterStatus.userNumber.toLocaleString()}`}
                  </span>
                </div>
                
                {earlyAdopterStatus.isEarlyAdopter && !earlyAdopterStatus.hasAccount && (
                  <div className="flex items-start space-x-1 mt-2 p-2 bg-white/20 rounded">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-semibold mb-1">Secure your lifetime benefits!</p>
                      <p>Create an account to keep all Tier 5 features forever.</p>
                    </div>
                  </div>
                )}
                
                {earlyAdopterStatus.hasAccount && (
                  <div className="flex items-center space-x-1 mt-1">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs">Lifetime Premium Secured</span>
                  </div>
                )}
              </div>
            </div>
            
            <a
              href={chrome.runtime.getURL('early-adopter.html')}
              target="_blank"
              className="inline-flex items-center space-x-1 mt-2 text-xs text-white/90 hover:text-white"
            >
              <span>Learn about your benefits</span>
              <Share2 className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Tier Badge */}
        <div className={`${getTierColor(currentTier)} text-white rounded-lg p-3`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs opacity-80">Current Tier</div>
              <div className="text-xl font-bold">{settings?.tier?.name || 'Basic'}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{currentTier}</div>
              <div className="text-xs opacity-80">Level</div>
            </div>
          </div>
          <div className="mt-2 bg-white/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-500"
              style={{ width: `${(settings?.tier?.progress || 0)}%` }}
            />
          </div>
        </div>

        {/* Account Manager for Tier 2 */}
        {currentTier < 2 && (
          <AccountManager 
            currentTier={currentTier}
            onTierUpgrade={handleTierUpgrade}
          />
        )}

        {/* Current Site */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Current Site</span>
            </div>
            {tabState?.whitelisted && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                Whitelisted
              </span>
            )}
          </div>
          
          <div className="text-sm font-medium text-gray-900 truncate mb-2">
            {tabState?.domain || 'No active tab'}
          </div>
          
          {/* YouTube Indicator for Tier 2+ */}
          {isYouTubeActive && (
            <div className="flex items-center space-x-2 mb-2 p-2 bg-red-50 rounded">
              <Youtube className="w-4 h-4 text-red-600" />
              <span className="text-xs text-red-600 font-medium">YouTube Ad Blocking Active</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                tabState?.whitelisted ? 'bg-yellow-400' : 
                settings?.enabled ? 'bg-green-500' : 'bg-gray-400'
              } animate-pulse`} />
              <span className="text-2xl font-bold text-primary-600">
                {tabState?.blocked || 0}
              </span>
              <span className="text-sm text-gray-500">blocked</span>
            </div>
            
            <button
              onClick={toggleWhitelist}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tabState?.whitelisted
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tabState?.whitelisted ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                  Remove Whitelist
                </>
              ) : (
                <>
                  <ListX className="w-3.5 h-3.5 inline mr-1" />
                  Add Whitelist
                </>
              )}
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Statistics</span>
            </div>
            <button
              onClick={clearStats}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500">Total Blocked</div>
              <div className="text-xl font-bold text-gray-900">
                {formatNumber(stats?.totalBlocked || 0)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Today</div>
              <div className="text-xl font-bold text-primary-600">
                {formatNumber(stats?.blockedToday || 0)}
              </div>
            </div>
          </div>
          
          {/* Category Breakdown */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500 mb-2">Category Breakdown</div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Ads</span>
                <span className="text-xs font-medium">{stats?.categoryStats?.ads || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Trackers</span>
                <span className="text-xs font-medium">{stats?.categoryStats?.trackers || 0}</span>
              </div>
              {hasYouTubeAccess && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">YouTube</span>
                    <span className="text-xs font-medium text-red-600">
                      {stats?.categoryStats?.youtube || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Social</span>
                    <span className="text-xs font-medium">{stats?.categoryStats?.social || 0}</span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Other</span>
                <span className="text-xs font-medium">{stats?.categoryStats?.other || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tier 2+ Features Indicator */}
        {currentTier >= 2 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Tier 2 Features Active</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
              <div className="flex items-center space-x-1">
                <Youtube className="w-3 h-3" />
                <span>YouTube Blocking</span>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="w-3 h-3" />
                <span>Advanced Trackers</span>
              </div>
              <div className="flex items-center space-x-1">
                <Share2 className="w-3 h-3" />
                <span>Social Trackers</span>
              </div>
              <div className="flex items-center space-x-1">
                <BarChart3 className="w-3 h-3" />
                <span>Analytics Blocking</span>
              </div>
            </div>
          </div>
        )}

        {/* Settings Button */}
        <button
          onClick={openSettings}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg transition-colors text-sm font-medium flex items-center justify-center space-x-2"
        >
          <Settings className="w-4 h-4" />
          <span>Advanced Settings</span>
        </button>
      </div>
    </div>
  );
};

export default App;