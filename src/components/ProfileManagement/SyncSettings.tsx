import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Check,
  AlertCircle,
  Smartphone,
  Monitor,
  Tablet,
  Clock,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { UserProfile } from '../../services/firebase.service';
import { SyncService } from '../../services/sync.service';

interface SyncSettingsProps {
  profile: UserProfile | null;
  onUpdate: (updates: Partial<UserProfile>) => Promise<void>;
}

interface DeviceInfo {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  lastSync: Date;
  isCurrentDevice: boolean;
}

export const SyncSettings: React.FC<SyncSettingsProps> = ({ profile, onUpdate }) => {
  const [syncEnabled, setSyncEnabled] = useState(profile?.settings.syncEnabled ?? true);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load sync status
    loadSyncStatus();

    // Load connected devices
    loadDevices();

    // Set up real-time sync listener
    const unsubscribe = SyncService.getInstance().onSyncStatusChange((status) => {
      setSyncStatus(status);
      if (status === 'success') {
        setLastSyncTime(new Date());
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const loadSyncStatus = async () => {
    try {
      const status = await SyncService.getInstance().getSyncStatus();
      setLastSyncTime(status.lastSync);
      setSyncStatus(status.status);
    } catch {
      console.error('Failed to load sync status:', error);
    }
  };

  const loadDevices = async () => {
    try {
      const deviceList = await SyncService.getInstance().getConnectedDevices();
      setDevices(deviceList);
    } catch {
      console.error('Failed to load devices:', error);
    }
  };

  const handleSyncToggle = async (enabled: boolean) => {
    setSyncEnabled(enabled);
    try {
      await onUpdate({
        settings: {
          ...profile?.settings,
          syncEnabled: enabled,
        },
      });

      if (enabled) {
        await handleManualSync();
      }
    } catch {
      console.error('Failed to update sync settings:', error);
      setSyncEnabled(!enabled); // Revert on error
    }
  };

  const handleManualSync = async () => {
    if (!isOnline) {
      setSyncStatus('error');
      return;
    }

    setSyncing(true);
    setSyncStatus('syncing');

    try {
      await SyncService.getInstance().syncNow();
      setSyncStatus('success');
      setLastSyncTime(new Date());
      await loadDevices(); // Refresh device list
    } catch {
      console.error('Sync failed:', error);
      setSyncStatus('error');
    } finally {
      setSyncing(false);
    }
  };

  const removeDevice = async (deviceId: string) => {
    try {
      await SyncService.getInstance().removeDevice(deviceId);
      await loadDevices();
    } catch {
      console.error('Failed to remove device:', error);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getRelativeTime = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  return (
    <div className="space-y-4">
      {/* Sync Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Sync Settings</span>
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Badge variant="outline" className="text-green-600">
                  <Wifi className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              ) : (
                <Badge variant="outline" className="text-red-600">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </Badge>
              )}
              {syncStatus === 'syncing' && (
                <Badge variant="secondary">
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Syncing
                </Badge>
              )}
              {syncStatus === 'success' && (
                <Badge variant="outline" className="text-green-600">
                  <Check className="h-3 w-3 mr-1" />
                  Synced
                </Badge>
              )}
              {syncStatus === 'error' && (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Error
                </Badge>
              )}
            </div>
          </CardTitle>
          <CardDescription>Sync your settings and data across all your devices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sync Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                {syncEnabled ? (
                  <Cloud className="h-5 w-5 text-primary" />
                ) : (
                  <CloudOff className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="font-medium">Enable Sync</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Automatically sync your data across devices
              </p>
            </div>
            <Switch checked={syncEnabled} onCheckedChange={handleSyncToggle} disabled={!isOnline} />
          </div>

          {!isOnline && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You're currently offline. Sync will resume when connection is restored.
              </AlertDescription>
            </Alert>
          )}

          {syncEnabled && (
            <>
              <Separator />

              {/* Last Sync Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Last synced: {lastSyncTime ? getRelativeTime(lastSyncTime) : 'Never'}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleManualSync}
                  disabled={syncing || !isOnline}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  Sync Now
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Connected Devices */}
      {syncEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Connected Devices</CardTitle>
            <CardDescription>Devices that have access to your synced data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {devices.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No devices connected yet
                </p>
              ) : (
                devices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center space-x-3">
                      {getDeviceIcon(device.type)}
                      <div>
                        <p className="font-medium">
                          {device.name}
                          {device.isCurrentDevice && (
                            <Badge variant="secondary" className="ml-2">
                              This device
                            </Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Last active: {getRelativeTime(device.lastSync)}
                        </p>
                      </div>
                    </div>
                    {!device.isCurrentDevice && (
                      <Button size="sm" variant="ghost" onClick={() => removeDevice(device.id)}>
                        Remove
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync Information */}
      <Card>
        <CardHeader>
          <CardTitle>What Gets Synced?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Extension settings and preferences</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Custom filter lists and rules</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Whitelist and blacklist entries</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Theme and appearance settings</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Statistics and usage data</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
