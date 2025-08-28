import React, { useState, useEffect } from 'react';
import { Cloud, Download, Upload, RefreshCw, Check, AlertCircle, Shield, Calendar, Smartphone, Monitor, Copy } from 'lucide-react';
import { StorageManager } from '../../shared/utils/storage';
import authService from '../../services/auth.service';

interface SyncDevice {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  lastSync: number;
  browser: string;
}

interface BackupSyncProps {
  currentTier: number;
}

export const BackupSync: React.FC<BackupSyncProps> = ({ currentTier }) => {
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [syncInterval, setSyncInterval] = useState(30); // minutes
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [devices, setDevices] = useState<SyncDevice[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [syncCode, setSyncCode] = useState('');
  const [enterSyncCode, setEnterSyncCode] = useState('');
  const [showSyncCode, setShowSyncCode] = useState(false);

  useEffect(() => {
    loadSyncSettings();
    if (currentTier >= 3) {
      checkAuthStatus();
    }
  }, [currentTier]);

  const loadSyncSettings = async () => {
    const storage = StorageManager.getInstance();
    const settings = await storage.getSettings();
    
    if (settings.sync) {
      setSyncEnabled(settings.sync.enabled || false);
      setAutoSync(settings.sync.auto || true);
      setSyncInterval(settings.sync.interval || 30);
      setLastSync(settings.sync.lastSync || null);
      setDevices(settings.sync.devices || []);
      setSyncCode(settings.sync.code || generateSyncCode());
    } else {
      setSyncCode(generateSyncCode());
    }

    // Load backups from storage
    const storedBackups = await chrome.storage.local.get('backups');
    if (storedBackups.backups) {
      setBackups(storedBackups.backups);
    }
  };

  const checkAuthStatus = async () => {
    const user = authService.getCurrentUser();
    if (!user && syncEnabled) {
      setSyncEnabled(false);
      alert('Please sign in to use cloud sync features');
    }
  };

  const generateSyncCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) code += '-';
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  const saveSyncSettings = async () => {
    const storage = StorageManager.getInstance();
    await storage.setSettings({
      sync: {
        enabled: syncEnabled,
        auto: autoSync,
        interval: syncInterval,
        lastSync,
        devices,
        code: syncCode
      }
    });
  };

  const handleSync = async () => {
    if (!authService.getCurrentUser()) {
      alert('Please sign in to sync your settings');
      return;
    }

    setSyncing(true);
    try {
      const storage = StorageManager.getInstance();
      const allSettings = await storage.getSettings();
      const whitelist = await storage.getWhitelist();
      const stats = await storage.getStats();

      // Create backup object
      const backup = {
        timestamp: Date.now(),
        version: chrome.runtime.getManifest().version,
        settings: allSettings,
        whitelist,
        stats,
        customFilters: await getCustomFilters(),
        device: {
          id: await getDeviceId(),
          name: await getDeviceName(),
          type: getDeviceType(),
          browser: getBrowserInfo()
        }
      };

      // Save to cloud (Firebase)
      await saveToCloud(backup);

      // Update last sync
      setLastSync(Date.now());
      
      // Update devices list
      const currentDevice: SyncDevice = {
        id: backup.device.id,
        name: backup.device.name,
        type: backup.device.type as 'desktop' | 'mobile' | 'tablet',
        lastSync: Date.now(),
        browser: backup.device.browser
      };
      
      const updatedDevices = devices.filter(d => d.id !== currentDevice.id);
      updatedDevices.push(currentDevice);
      setDevices(updatedDevices);
      
      await saveSyncSettings();
      
      // Show success notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
        title: 'Sync Complete',
        message: 'Your settings have been synced to the cloud'
      });
    } catch (error) {
      console.error('Sync error:', error);
      alert('Failed to sync settings. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleRestore = async (backup: any) => {
    if (confirm('This will replace all your current settings. Continue?')) {
      try {
        const storage = StorageManager.getInstance();
        
        // Restore settings
        await storage.setSettings(backup.settings);
        
        // Restore whitelist
        for (const domain of backup.whitelist) {
          await storage.addToWhitelist(domain);
        }
        
        // Restore custom filters if present
        if (backup.customFilters) {
          await chrome.storage.local.set({ customFilters: backup.customFilters });
        }
        
        // Reload extension
        chrome.runtime.reload();
      } catch (error) {
        console.error('Restore error:', error);
        alert('Failed to restore backup. Please try again.');
      }
    }
  };

  const handleExport = async () => {
    const storage = StorageManager.getInstance();
    const allSettings = await storage.getSettings();
    const whitelist = await storage.getWhitelist();
    const stats = await storage.getStats();
    const customFilters = await getCustomFilters();

    const exportData = {
      version: chrome.runtime.getManifest().version,
      exportDate: new Date().toISOString(),
      settings: allSettings,
      whitelist,
      stats,
      customFilters
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shieldpro-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        
        if (!importData.version || !importData.settings) {
          throw new Error('Invalid backup file');
        }

        await handleRestore(importData);
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import backup file. Please ensure it\'s a valid ShieldPro backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleSyncWithCode = async () => {
    if (!enterSyncCode) {
      alert('Please enter a sync code');
      return;
    }

    setSyncing(true);
    try {
      // Fetch settings from cloud using sync code
      const cloudData = await fetchFromCloud(enterSyncCode);
      
      if (cloudData) {
        await handleRestore(cloudData);
        setEnterSyncCode('');
        alert('Settings synced successfully!');
      } else {
        alert('No data found for this sync code');
      }
    } catch (error) {
      console.error('Sync with code error:', error);
      alert('Failed to sync with code. Please check the code and try again.');
    } finally {
      setSyncing(false);
    }
  };

  // Helper functions
  const getCustomFilters = async () => {
    const result = await chrome.storage.local.get('customFilters');
    return result.customFilters || [];
  };

  const getDeviceId = async () => {
    const result = await chrome.storage.local.get('deviceId');
    if (!result.deviceId) {
      const id = Math.random().toString(36).substring(2, 15);
      await chrome.storage.local.set({ deviceId: id });
      return id;
    }
    return result.deviceId;
  };

  const getDeviceName = async () => {
    return navigator.platform || 'Unknown Device';
  };

  const getDeviceType = () => {
    const ua = navigator.userAgent;
    if (/Mobile|Android/i.test(ua)) return 'mobile';
    if (/Tablet|iPad/i.test(ua)) return 'tablet';
    return 'desktop';
  };

  const getBrowserInfo = () => {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  const saveToCloud = async (data: any) => {
    // This would save to Firebase Firestore
    // For now, we'll save to local storage as a demo
    const backupsList = [...backups, data].slice(-10); // Keep last 10 backups
    setBackups(backupsList);
    await chrome.storage.local.set({ backups: backupsList });
  };

  const fetchFromCloud = async (code: string) => {
    // This would fetch from Firebase Firestore using the sync code
    // For demo, we'll check local backups
    return backups[backups.length - 1] || null;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Smartphone className="w-4 h-4 rotate-90" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Sync Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cloud className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Backup & Sync</h3>
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                AdBlock charges $40/yr - We offer FREE!
              </span>
            </div>
            {currentTier >= 3 && (
              <button
                onClick={() => setSyncEnabled(!syncEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  syncEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                } cursor-pointer`}
              >
                <div className={`absolute w-5 h-5 bg-white rounded-full shadow transition-transform top-0.5 ${
                  syncEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Sync your settings across all your devices
          </p>
          {currentTier < 3 && (
            <p className="text-sm text-amber-600 mt-2">
              ⚡ Unlock at Tier 3 by completing your profile
            </p>
          )}
        </div>

        {currentTier >= 3 && (
          <div className="p-4 space-y-4">
            {/* Sync Status */}
            {lastSync && (
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-sm">Last synced: {formatDate(lastSync)}</span>
                </div>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  <span>Sync Now</span>
                </button>
              </div>
            )}

            {/* Auto Sync Settings */}
            {syncEnabled && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Auto-sync enabled
                  </label>
                  <button
                    onClick={() => setAutoSync(!autoSync)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      autoSync ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div className={`absolute w-4 h-4 bg-white rounded-full shadow transition-transform top-0.5 ${
                      autoSync ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                
                {autoSync && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sync interval: {syncInterval} minutes
                    </label>
                    <input
                      type="range"
                      min="15"
                      max="120"
                      step="15"
                      value={syncInterval}
                      onChange={(e) => {
                        setSyncInterval(Number(e.target.value));
                        saveSyncSettings();
                      }}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sync Code */}
      {currentTier >= 3 && syncEnabled && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="font-medium flex items-center space-x-2">
              <Shield className="w-4 h-4 text-purple-600" />
              <span>Sync Code</span>
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Use this code to sync settings on another device
            </p>
          </div>
          
          <div className="p-4 space-y-4">
            <div>
              <div className="flex items-center space-x-2">
                <input
                  type={showSyncCode ? 'text' : 'password'}
                  value={syncCode}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 font-mono"
                />
                <button
                  onClick={() => setShowSyncCode(!showSyncCode)}
                  className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  {showSyncCode ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(syncCode);
                    chrome.notifications.create({
                      type: 'basic',
                      iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
                      title: 'Copied!',
                      message: 'Sync code copied to clipboard'
                    });
                  }}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter sync code from another device:
              </p>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={enterSyncCode}
                  onChange={(e) => setEnterSyncCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX-XXXX"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-mono"
                />
                <button
                  onClick={handleSyncWithCode}
                  disabled={syncing}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  Sync
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connected Devices */}
      {currentTier >= 3 && devices.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="font-medium">Connected Devices</h4>
          </div>
          
          <div className="p-4">
            <div className="space-y-2">
              {devices.map(device => (
                <div key={device.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getDeviceIcon(device.type)}
                    <div>
                      <div className="font-medium text-sm">{device.name}</div>
                      <div className="text-xs text-gray-500">
                        {device.browser} • Last sync: {formatDate(device.lastSync)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Manual Backup */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="font-medium">Manual Backup</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Export and import settings manually
          </p>
        </div>
        
        <div className="p-4">
          <div className="flex space-x-3">
            <button
              onClick={handleExport}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              <span>Export Settings</span>
            </button>
            
            <label className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Import Settings</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Recent Backups */}
      {backups.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="font-medium flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-green-600" />
              <span>Recent Backups</span>
            </h4>
          </div>
          
          <div className="p-4">
            <div className="space-y-2">
              {backups.slice(-5).reverse().map((backup, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <div className="text-sm font-medium">
                      {formatDate(backup.timestamp)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Version {backup.version} • {backup.device?.name || 'Unknown Device'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestore(backup)}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};