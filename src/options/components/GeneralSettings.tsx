import React, { useState, useEffect } from 'react';
import { Settings, Info, Shield, Youtube, Tv, MousePointer, Code, Database, Bell, Eye, EyeOff, Check, X } from 'lucide-react';
import { StorageManager } from '../../shared/utils/storage';

interface GeneralSettingsProps {
  currentTier: number;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ currentTier }) => {
  const [settings, setSettings] = useState({
    // Core blocking settings
    enabled: true,
    blockAds: true,
    blockTrackers: true,
    blockMalware: true,
    blockPhishing: true,
    blockCryptominers: true,
    
    // AdBlock Plus equivalent settings
    acceptableAds: false,
    acceptableAdsPrivacy: true, // Only non-tracking acceptable ads
    youtubeChannelWhitelist: true,
    twitchChannelWhitelist: true,
    showContextMenu: true,
    showBlockedCount: true,
    showBlockedInMenu: true,
    showDevToolsPanel: true,
    
    // Privacy settings
    disableDataCollection: false,
    allowAnonymousStats: true,
    helpWithAntiAdblock: true,
    showPageMessages: true,
    advancedMode: false,
    
    // Distraction Control (Tier 1+)
    blockCookieConsents: true,
    blockNewsletterPopups: true,
    blockFloatingVideos: true,
    blockNotificationPrompts: true,
    blockSurveyPopups: true,
    blockChatWidgets: false,
    
    // Performance settings
    enableCaching: true,
    enableLazyLoading: true,
    enableWebWorkers: true,
    
    // Update settings
    autoUpdateFilters: true,
    updateInterval: 4, // hours
    notifyOnUpdate: false,
  });

  const [youtubeChannels, setYoutubeChannels] = useState<string[]>([]);
  const [twitchChannels, setTwitchChannels] = useState<string[]>([]);
  const [newYoutubeChannel, setNewYoutubeChannel] = useState('');
  const [newTwitchChannel, setNewTwitchChannel] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const storage = StorageManager.getInstance();
    const storedSettings = await storage.getSettings();
    
    // Merge with default settings
    setSettings(prev => ({
      ...prev,
      ...storedSettings.general,
      enabled: storedSettings.enabled
    }));
    
    // Load whitelisted channels
    const whitelist = await storage.getWhitelist();
    const ytChannels = whitelist.filter(w => w.includes('youtube.com/channel/')).map(w => w.split('/').pop() || '');
    const twChannels = whitelist.filter(w => w.includes('twitch.tv/')).map(w => w.split('/').pop() || '');
    
    setYoutubeChannels(ytChannels);
    setTwitchChannels(twChannels);
  };

  const saveSettings = async (newSettings: typeof settings) => {
    const storage = StorageManager.getInstance();
    await storage.setSettings({
      enabled: newSettings.enabled,
      general: newSettings
    });
    setSettings(newSettings);
    
    // Send message to background to update settings
    chrome.runtime.sendMessage({ 
      action: 'updateSettings', 
      settings: newSettings 
    });
  };

  const handleToggle = (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  const addYoutubeChannel = async () => {
    if (newYoutubeChannel && !youtubeChannels.includes(newYoutubeChannel)) {
      const storage = StorageManager.getInstance();
      await storage.addToWhitelist(`youtube.com/channel/${newYoutubeChannel}`);
      setYoutubeChannels([...youtubeChannels, newYoutubeChannel]);
      setNewYoutubeChannel('');
    }
  };

  const removeYoutubeChannel = async (channel: string) => {
    const storage = StorageManager.getInstance();
    await storage.removeFromWhitelist(`youtube.com/channel/${channel}`);
    setYoutubeChannels(youtubeChannels.filter(c => c !== channel));
  };

  const addTwitchChannel = async () => {
    if (newTwitchChannel && !twitchChannels.includes(newTwitchChannel)) {
      const storage = StorageManager.getInstance();
      await storage.addToWhitelist(`twitch.tv/${newTwitchChannel}`);
      setTwitchChannels([...twitchChannels, newTwitchChannel]);
      setNewTwitchChannel('');
    }
  };

  const removeTwitchChannel = async (channel: string) => {
    const storage = StorageManager.getInstance();
    await storage.removeFromWhitelist(`twitch.tv/${channel}`);
    setTwitchChannels(twitchChannels.filter(c => c !== channel));
  };

  const SettingToggle = ({ 
    enabled, 
    onToggle, 
    label, 
    description, 
    icon: Icon,
    requiredTier = 1 
  }: {
    enabled: boolean;
    onToggle: () => void;
    label: string;
    description?: string;
    icon?: any;
    requiredTier?: number;
  }) => (
    <div className={`flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 ${currentTier < requiredTier ? 'opacity-50' : ''}`}>
      <button
        onClick={onToggle}
        disabled={currentTier < requiredTier}
        className={`mt-0.5 flex-shrink-0 w-12 h-6 rounded-full transition-colors ${
          enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
        } ${currentTier < requiredTier ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className={`w-5 h-5 mt-0.5 bg-white rounded-full shadow transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-0.5'
        }`} />
      </button>
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="w-4 h-4 text-gray-500" />}
          <label className="font-medium text-gray-900 dark:text-gray-100">{label}</label>
          {currentTier < requiredTier && (
            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
              Tier {requiredTier}+
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Core Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span>Core Blocking</span>
          </h3>
        </div>
        <div className="p-2">
          <SettingToggle
            enabled={settings.enabled}
            onToggle={() => handleToggle('enabled')}
            label="Enable Ad Blocking"
            description="Master switch for all blocking features"
            icon={Shield}
          />
          <SettingToggle
            enabled={settings.blockAds}
            onToggle={() => handleToggle('blockAds')}
            label="Block Advertisements"
            description="Block display ads, video ads, and pop-ups"
          />
          <SettingToggle
            enabled={settings.blockTrackers}
            onToggle={() => handleToggle('blockTrackers')}
            label="Block Trackers"
            description="Prevent tracking scripts and analytics"
          />
          <SettingToggle
            enabled={settings.blockMalware}
            onToggle={() => handleToggle('blockMalware')}
            label="Malware Protection"
            description="Block known malware domains"
            requiredTier={4}
          />
          <SettingToggle
            enabled={settings.blockPhishing}
            onToggle={() => handleToggle('blockPhishing')}
            label="Phishing Protection"
            description="Detect and block phishing sites"
            requiredTier={4}
          />
        </div>
      </div>

      {/* Acceptable Ads (AdBlock Plus equivalent) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold">Acceptable Ads</h3>
        </div>
        <div className="p-2">
          <SettingToggle
            enabled={settings.acceptableAds}
            onToggle={() => handleToggle('acceptableAds')}
            label="Allow some non-intrusive advertising"
            description="Support websites by allowing ads that meet strict criteria"
          />
          {settings.acceptableAds && (
            <SettingToggle
              enabled={settings.acceptableAdsPrivacy}
              onToggle={() => handleToggle('acceptableAdsPrivacy')}
              label="Only allow ads without third-party tracking"
              description="Additional privacy protection for acceptable ads"
            />
          )}
        </div>
      </div>

      {/* YouTube & Twitch Whitelisting */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Youtube className="w-5 h-5 text-red-600" />
            <span>Channel Whitelisting</span>
          </h3>
        </div>
        <div className="p-4">
          <SettingToggle
            enabled={settings.youtubeChannelWhitelist}
            onToggle={() => handleToggle('youtubeChannelWhitelist')}
            label="Allow ads on specific YouTube channels"
            description="Support your favorite creators"
            icon={Youtube}
            requiredTier={2}
          />
          
          {settings.youtubeChannelWhitelist && currentTier >= 2 && (
            <div className="mt-4 ml-12 space-y-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newYoutubeChannel}
                  onChange={(e) => setNewYoutubeChannel(e.target.value)}
                  placeholder="Channel ID or @username"
                  className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
                <button
                  onClick={addYoutubeChannel}
                  className="px-4 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Add
                </button>
              </div>
              <div className="space-y-1">
                {youtubeChannels.map(channel => (
                  <div key={channel} className="flex items-center justify-between px-3 py-1 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-sm">{channel}</span>
                    <button
                      onClick={() => removeYoutubeChannel(channel)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <SettingToggle
              enabled={settings.twitchChannelWhitelist}
              onToggle={() => handleToggle('twitchChannelWhitelist')}
              label="Allow ads on specific Twitch channels"
              description="Support streamers you watch"
              icon={Tv}
              requiredTier={2}
            />
            
            {settings.twitchChannelWhitelist && currentTier >= 2 && (
              <div className="mt-4 ml-12 space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTwitchChannel}
                    onChange={(e) => setNewTwitchChannel(e.target.value)}
                    placeholder="Channel name"
                    className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                  <button
                    onClick={addTwitchChannel}
                    className="px-4 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-1">
                  {twitchChannels.map(channel => (
                    <div key={channel} className="flex items-center justify-between px-3 py-1 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="text-sm">{channel}</span>
                      <button
                        onClick={() => removeTwitchChannel(channel)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interface Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold">Interface Options</h3>
        </div>
        <div className="p-2">
          <SettingToggle
            enabled={settings.showContextMenu}
            onToggle={() => handleToggle('showContextMenu')}
            label="Add items to right-click menu"
            icon={MousePointer}
          />
          <SettingToggle
            enabled={settings.showBlockedCount}
            onToggle={() => handleToggle('showBlockedCount')}
            label="Show blocked count on extension icon"
          />
          <SettingToggle
            enabled={settings.showBlockedInMenu}
            onToggle={() => handleToggle('showBlockedInMenu')}
            label="Show blocked count in popup menu"
          />
          <SettingToggle
            enabled={settings.showDevToolsPanel}
            onToggle={() => handleToggle('showDevToolsPanel')}
            label="Show panel in Developer Tools"
            icon={Code}
            requiredTier={3}
          />
          <SettingToggle
            enabled={settings.showPageMessages}
            onToggle={() => handleToggle('showPageMessages')}
            label="Show messages on web pages when relevant"
          />
        </div>
      </div>

      {/* Privacy & Data Collection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Eye className="w-5 h-5 text-purple-600" />
            <span>Privacy & Data</span>
          </h3>
        </div>
        <div className="p-2">
          <SettingToggle
            enabled={settings.disableDataCollection}
            onToggle={() => handleToggle('disableDataCollection')}
            label="Opt-out of all data collection"
            description="Completely disable telemetry and analytics"
            icon={EyeOff}
          />
          {!settings.disableDataCollection && (
            <>
              <SettingToggle
                enabled={settings.allowAnonymousStats}
                onToggle={() => handleToggle('allowAnonymousStats')}
                label="Allow anonymous filter usage statistics"
                description="Help improve filter lists with anonymous data"
                icon={Database}
              />
              <SettingToggle
                enabled={settings.helpWithAntiAdblock}
                onToggle={() => handleToggle('helpWithAntiAdblock')}
                label="Help improve anti-adblock wall detection"
                description="Share data about sites using adblock detection"
              />
            </>
          )}
        </div>
      </div>

      {/* Distraction Control (Premium in AdBlock, Free in ShieldPro) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Bell className="w-5 h-5 text-amber-600" />
            <span>Distraction Control</span>
            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">FREE</span>
          </h3>
        </div>
        <div className="p-2">
          <SettingToggle
            enabled={settings.blockCookieConsents}
            onToggle={() => handleToggle('blockCookieConsents')}
            label="Block cookie consent popups"
            description="AdBlock Plus charges $40/yr - We offer it FREE!"
          />
          <SettingToggle
            enabled={settings.blockNewsletterPopups}
            onToggle={() => handleToggle('blockNewsletterPopups')}
            label="Block newsletter signup popups"
            description="Premium feature in other blockers"
          />
          <SettingToggle
            enabled={settings.blockFloatingVideos}
            onToggle={() => handleToggle('blockFloatingVideos')}
            label="Block floating/sticky videos"
            description="Remove annoying floating video players"
          />
          <SettingToggle
            enabled={settings.blockNotificationPrompts}
            onToggle={() => handleToggle('blockNotificationPrompts')}
            label="Block notification permission prompts"
            requiredTier={2}
          />
          <SettingToggle
            enabled={settings.blockSurveyPopups}
            onToggle={() => handleToggle('blockSurveyPopups')}
            label="Block survey and feedback popups"
            requiredTier={2}
          />
          <SettingToggle
            enabled={settings.blockChatWidgets}
            onToggle={() => handleToggle('blockChatWidgets')}
            label="Block chat widgets"
            description="Remove customer support chat bubbles"
            requiredTier={2}
          />
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold">Advanced Settings</h3>
        </div>
        <div className="p-2">
          <SettingToggle
            enabled={settings.advancedMode}
            onToggle={() => handleToggle('advancedMode')}
            label="I'm an advanced user, show me advanced options"
            description="Enable developer features and detailed controls"
            requiredTier={3}
          />
          <SettingToggle
            enabled={settings.autoUpdateFilters}
            onToggle={() => handleToggle('autoUpdateFilters')}
            label="Auto-update filter lists"
            description={`Updates every ${settings.updateInterval} hours`}
          />
          <SettingToggle
            enabled={settings.notifyOnUpdate}
            onToggle={() => handleToggle('notifyOnUpdate')}
            label="Notify when filters are updated"
          />
        </div>
      </div>
    </div>
  );
};