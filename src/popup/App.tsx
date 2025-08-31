import React, { useEffect, useState, useCallback } from 'react';
import { ExtensionSettings, BlockingStats, TabState } from '../shared/types';
import { AccountManager } from './components/AccountManager';
import { EarlyAdopterStatus } from '../shared/constants/marketing';
import {
  Shield,
  Power,
  TrendingUp,
  Globe,
  Settings,
  RefreshCw,
  Activity,
  BarChart3,
  Youtube,
  Share2,
  Crown,
  Gift,
} from 'lucide-react';

const App: React.FC = () => {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [stats, setStats] = useState<BlockingStats | null>(null);
  const [tabState, setTabState] = useState<TabState | null>(null);
  const [earlyAdopterStatus, setEarlyAdopterStatus] = useState<EarlyAdopterStatus | null>(null);
  const [hasNewData, setHasNewData] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [_authChecked, setAuthChecked] = useState(false);

  // Load cached data immediately on mount for instant display
  useEffect(() => {
    // Load cached data first for instant display
    loadCachedData();

    // Then load fresh data in background
    loadDataInBackground();

    // Set up background refresh every 5 seconds
    const interval = setInterval(() => {
      loadDataInBackground();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadCachedData = async () => {
    try {
      // Get cached data from chrome storage for instant display
      const cached = await chrome.storage.local.get([
        'cachedSettings',
        'cachedStats',
        'cachedTabState',
        'cachedEarlyAdopter',
        'authUser',
        'authProfile',
      ]);

      if (cached.cachedSettings) {
        const settingsData = cached.cachedSettings;
        // If early adopter, override tier to 5
        if (cached.cachedEarlyAdopter?.isEarlyAdopter) {
          settingsData.tier = {
            level: 5,
            name: 'Ultimate',
            unlockedAt: cached.cachedEarlyAdopter.installDate || Date.now(),
            progress: 100,
          };
        }
        // But if user is authenticated, use their tier
        else if (cached.authProfile?.tier?.level) {
          settingsData.tier = cached.authProfile.tier;
        }
        setSettings(settingsData);
      } else {
        // Default settings if no cache
        setSettings({
          enabled: true,
          tier: { level: 1, name: 'Basic', unlockedAt: Date.now(), progress: 0 },
        } as ExtensionSettings);
      }

      setStats(
        cached.cachedStats ||
          ({ totalBlocked: 0, blockedToday: 0, categoryStats: {} } as BlockingStats)
      );
      setTabState(
        cached.cachedTabState ||
          ({ domain: 'Loading...', blocked: 0, whitelisted: false } as TabState)
      );
      setEarlyAdopterStatus(cached.cachedEarlyAdopter || null);

      // Mark auth as checked if we have cache
      if ('authUser' in cached) {
        setAuthChecked(true);
      }
    } catch (error) {
      console.error('Failed to load cached data:', error);
      // Set defaults on error
      setSettings({
        enabled: true,
        tier: { level: 1, name: 'Basic', unlockedAt: Date.now(), progress: 0 },
      } as ExtensionSettings);
      setStats({ totalBlocked: 0, blockedToday: 0, categoryStats: {} } as BlockingStats);
      setTabState({ domain: 'Loading...', blocked: 0, whitelisted: false } as TabState);
    }
  };

  const loadDataInBackground = useCallback(async () => {
    try {
      const [settingsRes, statsRes, tabStateRes, earlyAdopterRes] = await Promise.all([
        chrome.runtime.sendMessage({ action: 'getSettings' }),
        chrome.runtime.sendMessage({ action: 'getStats' }),
        chrome.runtime.sendMessage({ action: 'getTabState' }),
        chrome.runtime.sendMessage({ action: 'getEarlyAdopterStatus' }),
      ]);

      // Cache the data for next instant load
      await chrome.storage.local.set({
        cachedSettings: settingsRes,
        cachedStats: statsRes,
        cachedTabState: tabStateRes,
        cachedEarlyAdopter: earlyAdopterRes,
      });

      // Check if data has changed
      const hasChanged =
        JSON.stringify(stats) !== JSON.stringify(statsRes) ||
        JSON.stringify(tabState) !== JSON.stringify(tabStateRes);

      if (hasChanged) {
        setHasNewData(true);
      }

      // If early adopter, override tier to 5
      if (earlyAdopterRes?.isEarlyAdopter && settingsRes) {
        settingsRes.tier = {
          level: 5,
          name: 'Ultimate',
          unlockedAt: earlyAdopterRes.installDate || Date.now(),
          progress: 100,
        };
      }

      // Update state with fresh data
      setSettings(settingsRes);
      setStats(statsRes);
      setTabState(tabStateRes);
      setEarlyAdopterStatus(earlyAdopterRes);
    } catch (error) {
      console.error('Failed to load fresh data:', error);
    }
  }, [stats, tabState]);

  const refreshData = async () => {
    setIsRefreshing(true);
    setHasNewData(false);
    await loadDataInBackground();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const toggleExtension = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'toggleExtension' });
      setSettings((prev) => (prev ? { ...prev, enabled: response.enabled } : null));
    } catch (error) {
      console.error('Failed to toggle extension:', error);
    }
  };

  const toggleWhitelist = async () => {
    if (!tabState?.domain) return;

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'toggleWhitelist',
        domain: tabState.domain,
      });
      setTabState((prev) => (prev ? { ...prev, whitelisted: response.whitelisted } : null));
    } catch (error) {
      console.error('Failed to toggle whitelist:', error);
    }
  };

  const loadData = async () => {
    await loadDataInBackground();
  };

  const clearStats = async () => {
    if (window.confirm('Clear all statistics?')) {
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
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            tier: {
              ...prev.tier,
              level: newTier,
              name: getTierName(newTier),
              unlockedAt: Date.now(),
              progress: newTier * 20,
            },
          }
        : null
    );
  };

  const getTierName = (tier: number): string => {
    const names = ['Basic', 'Enhanced', 'Professional', 'Premium', 'Ultimate'];
    return names[tier - 1] || 'Basic';
  };

  const _getTierColor = (tier: number): string => {
    const colors = [
      'bg-gray-500',
      'bg-green-500',
      'bg-blue-500',
      'bg-purple-500',
      'bg-gradient-to-r from-yellow-400 to-orange-500',
    ];
    return colors[tier - 1] || 'bg-gray-500';
  };

  // Early adopters always have Tier 5!
  const actualTier = earlyAdopterStatus?.isEarlyAdopter ? 5 : settings?.tier?.level || 1;
  const currentTier = actualTier;
  const isEarlyAdopter = earlyAdopterStatus?.isEarlyAdopter || false;
  const hasYouTubeAccess = isEarlyAdopter || currentTier >= 2;
  const isYouTubeActive = hasYouTubeAccess && tabState?.domain?.includes('youtube.com');

  return (
    <div className="popup-container bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Compact Header with Power Toggle and Refresh */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-white" />
            <h1 className="text-sm font-bold text-white">ShieldPro</h1>
            {hasNewData && !isRefreshing && (
              <div
                className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"
                title="New data available"
              />
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Refresh button */}
            <button
              onClick={refreshData}
              className={`p-1.5 rounded-lg hover:bg-white/10 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4 text-white" />
            </button>

            {/* Power Toggle */}
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
      </div>

      <div className="p-3 space-y-2.5">
        {/* TIER STATUS - First thing users see */}
        {currentTier >= 2 && (
          <div
            className={`${currentTier === 5 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 'bg-gradient-to-r from-green-500 to-emerald-500'} text-white rounded-lg p-2.5 shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span className="text-sm font-bold">
                  Tier {currentTier} Features Active
                  {currentTier === 5 && ' - ULTIMATE'}
                </span>
              </div>
              {isEarlyAdopter && (
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  {earlyAdopterStatus && (
                    <span className="text-xs">
                      #{earlyAdopterStatus.userNumber.toLocaleString()}
                    </span>
                  )}
                </div>
              )}
            </div>
            {currentTier === 5 && (
              <p className="text-xs mt-1 opacity-90">All premium features unlocked forever!</p>
            )}
          </div>
        )}

        {/* Account prompt for early adopters - only show if no account */}
        {isEarlyAdopter && !earlyAdopterStatus?.hasAccount && (
          <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg p-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs font-medium">Secure your lifetime benefits!</span>
              </div>
              <button
                onClick={() => {
                  // Set a flag to show the form immediately
                  const accountSection = document.getElementById('account-section-form');
                  accountSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap"
              >
                Create Account
              </button>
            </div>
          </div>
        )}

        {/* Account prompt for non-early adopters - only for tier 1 */}
        {!isEarlyAdopter && currentTier < 2 && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg p-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs font-medium">Unlock YouTube blocking & more</span>
              </div>
              <button
                onClick={() => {
                  const accountSection = document.getElementById('account-section');
                  accountSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap"
              >
                Upgrade Free
              </button>
            </div>
          </div>
        )}

        {/* PRIMARY USER FOCUS - Current Site Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-100 dark:border-gray-700">
          {/* Big blocking number first - what users care about most */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={`relative ${settings?.enabled ? 'animate-pulse' : ''}`}>
                <div
                  className={`w-3 h-3 rounded-full ${
                    settings?.enabled ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
                {settings?.enabled && (
                  <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-400 animate-ping" />
                )}
              </div>
              <div>
                <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                  {tabState?.blocked || 0}
                </span>
                <span className="text-sm text-gray-500 ml-2">blocked on this page</span>
              </div>
            </div>
          </div>

          {/* Current site info */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Current Site</span>
                {tabState?.whitelisted && (
                  <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded">
                    Whitelisted
                  </span>
                )}
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {tabState?.domain || 'No active tab'}
              </div>
            </div>
            <button
              onClick={toggleWhitelist}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                tabState?.whitelisted
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/40'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {tabState?.whitelisted ? 'Remove' : 'Whitelist'}
            </button>
          </div>

          {/* YouTube indicator inline */}
          {isYouTubeActive && (
            <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded">
              <Youtube className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-xs font-medium">YouTube Ad Blocking Active</span>
            </div>
          )}
        </div>

        {/* Overall Statistics - Compact */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats?.totalBlocked || 0)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {formatNumber(stats?.blockedToday || 0)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Today</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {currentTier}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Tier</div>
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
              <span className="text-xs font-medium">Unlock YouTube blocking & more</span>
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
            className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-3 rounded-lg transition-colors text-xs font-medium flex items-center justify-center space-x-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
          <button
            onClick={clearStats}
            className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-3 rounded-lg transition-colors text-xs font-medium flex items-center justify-center"
            title="Clear Statistics"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* BELOW THE FOLD - Additional details */}

        {/* Category Breakdown - Collapsible */}
        <details className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <summary className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors list-none">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Detailed Stats
              </span>
            </div>
          </summary>
          <div className="px-3 pb-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">Ads Blocked</span>
              <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                {stats?.categoryStats?.ads || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">Trackers</span>
              <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                {stats?.categoryStats?.trackers || 0}
              </span>
            </div>
            {hasYouTubeAccess && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">YouTube</span>
                  <span className="text-xs font-medium text-red-600 dark:text-red-400">
                    {stats?.categoryStats?.youtube || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Social</span>
                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                    {stats?.categoryStats?.social || 0}
                  </span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">Other</span>
              <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                {stats?.categoryStats?.other || 0}
              </span>
            </div>
          </div>
        </details>

        {/* Account Management Section - Below fold */}
        {/* Show these as separate, always-visible elements for better UX */}

        {/* Early Adopter Account Creation Section */}
        {isEarlyAdopter && !earlyAdopterStatus?.hasAccount && (
          <>
            {/* Benefits Card */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg p-3 shadow-lg">
              <div className="flex items-start gap-2">
                <Crown className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm mb-2">🎉 Your Early Adopter Benefits</p>
                  <ul className="text-xs space-y-1 opacity-95">
                    <li>✅ All 5 tiers unlocked forever (worth $120/year)</li>
                    <li>✅ Lifetime premium features at no cost</li>
                    <li>✅ Priority support & early access to new features</li>
                    <li>✅ Your settings sync across all devices</li>
                    <li>✅ Never lose your early adopter status</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Account Creation Form - Always visible, not hidden in component state */}
            <div
              id="account-section-form"
              className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Gift className="w-4 h-4 text-green-600" />
                Secure Your Lifetime Access
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Create your free account now to lock in all benefits forever
              </p>
              <AccountManager currentTier={5} onTierUpgrade={handleTierUpgrade} />
            </div>
          </>
        )}

        {/* Non-Early Adopter Account Section */}
        {!isEarlyAdopter && currentTier < 2 && (
          <>
            {/* Benefits Card */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg p-3 shadow-lg">
              <div className="flex items-start gap-2">
                <TrendingUp className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm mb-2">Unlock Tier 2 Features</p>
                  <ul className="text-xs space-y-1 opacity-95">
                    <li>✅ YouTube ad blocking</li>
                    <li>✅ Advanced tracker blocking</li>
                    <li>✅ Social media tracker removal</li>
                    <li>✅ Analytics blocking</li>
                    <li>✅ 40+ additional blocking rules</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Account Creation Form */}
            <div
              id="account-section-form"
              className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <AccountManager currentTier={currentTier} onTierUpgrade={handleTierUpgrade} />
            </div>
          </>
        )}

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
