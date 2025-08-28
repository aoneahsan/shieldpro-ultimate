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
  AlertCircle,
  Gift
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
      
      // If early adopter, override tier to 5
      if (earlyAdopterRes?.isEarlyAdopter && settingsRes) {
        settingsRes.tier = {
          level: 5,
          name: 'Ultimate',
          unlockedAt: earlyAdopterRes.installDate || Date.now(),
          progress: 100
        };
      }
      
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

  // Early adopters always have Tier 5!
  const actualTier = earlyAdopterStatus?.isEarlyAdopter ? 5 : (settings?.tier?.level || 1);
  const currentTier = actualTier;
  const isEarlyAdopter = earlyAdopterStatus?.isEarlyAdopter || false;
  const hasYouTubeAccess = isEarlyAdopter || currentTier >= 2;
  const isYouTubeActive = hasYouTubeAccess && tabState?.domain?.includes('youtube.com');

  return (
    <div className="popup-container bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Compact Header with Power Toggle (10% space for our message) */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-white" />
            <h1 className="text-sm font-bold text-white">ShieldPro</h1>
          </div>
          
          {/* Compact Early Adopter/Account Prompt */}
          {isEarlyAdopter && !earlyAdopterStatus?.hasAccount && (
            <div className="flex items-center space-x-2 text-white">
              <Gift className="w-4 h-4" />
              <span className="text-xs">Secure your lifetime access!</span>
            </div>
          )}
          
          <button
            onClick={toggleExtension}
            className={`flex items-center space-x-2 px-3 py-1 rounded-full transition-all ${
              settings?.enabled 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            <Power className="w-4 h-4 text-white" />
            <span className="text-xs font-medium text-white">
              {settings?.enabled ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>

      <div className="p-3 space-y-2.5">
        {/* PRIMARY USER FOCUS - Current Site Stats (Above the fold - 90%) */}
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          {/* Big blocking number first - what users care about most */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={`relative ${settings?.enabled ? 'animate-pulse' : ''}`}>
                <div className={`w-3 h-3 rounded-full ${
                  settings?.enabled ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                {settings?.enabled && (
                  <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-400 animate-ping" />
                )}
              </div>
              <div>
                <span className="text-3xl font-bold text-primary-600">
                  {tabState?.blocked || 0}
                </span>
                <span className="text-sm text-gray-500 ml-2">blocked on this page</span>
              </div>
            </div>
          </div>

          {/* Current site info */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <Globe className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-500">Current Site</span>
                {tabState?.whitelisted && (
                  <span className="text-xs bg-yellow-100 text-yellow-600 px-1.5 py-0.5 rounded">
                    Whitelisted
                  </span>
                )}
              </div>
              <div className="text-sm font-medium text-gray-900 truncate">
                {tabState?.domain || 'No active tab'}
              </div>
            </div>
            <button
              onClick={toggleWhitelist}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                tabState?.whitelisted
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tabState?.whitelisted ? 'Remove' : 'Whitelist'}
            </button>
          </div>

          {/* YouTube indicator inline */}
          {isYouTubeActive && (
            <div className="flex items-center space-x-1.5 text-red-600 bg-red-50 px-2 py-1 rounded">
              <Youtube className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">YouTube Ad Blocking Active</span>
            </div>
          )}
        </div>

        {/* Overall Statistics - Compact */}
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(stats?.totalBlocked || 0)}
              </div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-600">
                {formatNumber(stats?.blockedToday || 0)}
              </div>
              <div className="text-xs text-gray-500">Today</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {currentTier}
              </div>
              <div className="text-xs text-gray-500">Tier</div>
            </div>
          </div>
        </div>

        {/* Account prompt for early adopters - compact */}
        {isEarlyAdopter && !earlyAdopterStatus?.hasAccount && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg p-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Crown className="w-4 h-4" />
                <span className="text-xs font-bold">
                  Early Adopter #{earlyAdopterStatus.userNumber.toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => {
                  const accountSection = document.getElementById('account-section');
                  accountSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-xs font-medium transition-colors"
              >
                Create Account
              </button>
            </div>
          </div>
        )}

        {/* Account prompt for non-early adopters - compact */}
        {!isEarlyAdopter && currentTier < 2 && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg p-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">
                Unlock YouTube blocking & more
              </span>
              <button
                onClick={() => {
                  const accountSection = document.getElementById('account-section');
                  accountSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-xs font-medium transition-colors"
              >
                Upgrade Free
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2">
          <button
            onClick={openSettings}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg transition-colors text-xs font-medium flex items-center justify-center space-x-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
          <button
            onClick={clearStats}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg transition-colors text-xs font-medium flex items-center justify-center"
            title="Clear Statistics"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* BELOW THE FOLD - Additional details */}
        
        {/* Category Breakdown - Collapsible */}
        <details className="bg-white rounded-lg shadow-sm border border-gray-100">
          <summary className="p-3 cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Detailed Stats</span>
              </div>
            </div>
          </summary>
          <div className="px-3 pb-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Ads Blocked</span>
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
        </details>

        {/* Tier Features - Only show if tier 2+ */}
        {currentTier >= 2 && (
          <details className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <summary className="p-3 cursor-pointer">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Tier {currentTier} Features Active
                </span>
              </div>
            </summary>
            <div className="px-3 pb-3">
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
          </details>
        )}

        {/* Account Management Section - Below fold */}
        <div id="account-section">
          {isEarlyAdopter && !earlyAdopterStatus?.hasAccount && (
            <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Gift className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm mb-1">🎉 Secure Your FREE Benefits!</p>
                  <p className="text-xs opacity-95 mb-2">
                    Create a free account to:
                    • Save & sync settings across all devices
                    • Keep all 5 tiers unlocked forever  
                    • Never lose your early adopter status
                  </p>
                  <AccountManager 
                    currentTier={5}
                    onTierUpgrade={handleTierUpgrade}
                  />
                </div>
              </div>
            </div>
          )}

          {!isEarlyAdopter && currentTier < 2 && (
            <AccountManager 
              currentTier={currentTier}
              onTierUpgrade={handleTierUpgrade}
            />
          )}
        </div>

        {/* Early Adopter full details - if applicable */}
        {earlyAdopterStatus && earlyAdopterStatus.isEarlyAdopter && (
          <div className="text-center">
            <a
              href={chrome.runtime.getURL('early-adopter.html')}
              target="_blank"
              className="inline-flex items-center space-x-1 text-xs text-primary-600 hover:text-primary-700"
            >
              <span>View all early adopter benefits</span>
              <Share2 className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;