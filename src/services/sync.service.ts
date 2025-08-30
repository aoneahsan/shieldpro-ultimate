import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  collection,
  query,
  where,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { firestore as db } from '../utils/firebase';
import { StorageManager } from '../shared/utils/storage';

export interface SyncData {
  settings: any;
  filters: any;
  whitelist: string[];
  blacklist: string[];
  customRules: any[];
  stats: any;
  lastModified: Timestamp;
}

export interface DeviceInfo {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  lastSync: Date;
  isCurrentDevice: boolean;
  userAgent: string;
  platform: string;
}

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'success' | 'error';
  lastSync: Date | null;
  nextSync: Date | null;
  pendingChanges: number;
}

type SyncStatusCallback = (status: 'idle' | 'syncing' | 'success' | 'error') => void;

class SyncService {
  private static instance: SyncService;
  private userId: string | null = null;
  private deviceId: string;
  private syncInterval: NodeJS.Timeout | null = null;
  private unsubscribe: (() => void) | null = null;
  private pendingSync: Promise<void> | null = null;
  private syncStatusCallbacks: Set<SyncStatusCallback> = new Set();
  private lastSyncTime: Date | null = null;

  private constructor() {
    this.deviceId = this.getOrCreateDeviceId();
    this.initializeSync();
  }

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  /**
   * Initialize sync service
   */
  private initializeSync() {
    // Listen for user changes
    chrome.storage.local.get(['userId'], (result) => {
      if (result.userId) {
        this.setUserId(result.userId);
      }
    });

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.userId) {
        this.setUserId(changes.userId.newValue);
      }
    });

    // Set up periodic sync
    this.setupPeriodicSync();
  }

  /**
   * Set user ID and start syncing
   */
  setUserId(userId: string | null) {
    if (this.userId === userId) return;

    this.userId = userId;
    
    if (userId) {
      this.startSync();
      this.registerDevice();
    } else {
      this.stopSync();
    }
  }

  /**
   * Start syncing
   */
  private async startSync() {
    if (!this.userId) return;

    // Set up real-time listener
    const syncRef = doc(db, 'sync', this.userId);
    this.unsubscribe = onSnapshot(syncRef, (snapshot) => {
      if (snapshot.exists()) {
        this.handleRemoteChanges(snapshot.data() as SyncData);
      }
    });

    // Perform initial sync
    await this.syncNow();
  }

  /**
   * Stop syncing
   */
  private stopSync() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sync now
   */
  async syncNow(): Promise<void> {
    if (!this.userId) {
      throw new Error('No user ID set');
    }

    // Prevent concurrent syncs
    if (this.pendingSync) {
      return this.pendingSync;
    }

    this.pendingSync = this.performSync();
    
    try {
      await this.pendingSync;
    } finally {
      this.pendingSync = null;
    }
  }

  /**
   * Perform sync operation
   */
  private async performSync(): Promise<void> {
    this.notifySyncStatus('syncing');

    try {
      const localData = await this.getLocalData();
      const remoteData = await this.getRemoteData();

      if (!remoteData || this.isLocalNewer(localData, remoteData)) {
        // Push local changes to remote
        await this.pushToRemote(localData);
      } else if (this.isRemoteNewer(localData, remoteData)) {
        // Pull remote changes to local
        await this.pullFromRemote(remoteData);
      }

      // Update device sync time
      await this.updateDeviceSyncTime();
      
      this.lastSyncTime = new Date();
      this.notifySyncStatus('success');
    } catch (error) {
      console.error('Sync failed:', error);
      this.notifySyncStatus('error');
      throw error;
    }
  }

  /**
   * Get local data
   */
  private async getLocalData(): Promise<SyncData> {
    const storage = StorageManager.getInstance();
    const settings = await storage.getSettings();
    const filters = await storage.getFilters();
    const whitelist = await storage.getWhitelist();
    const blacklist = await storage.getBlacklist();
    const customRules = await storage.getCustomRules();
    const stats = await storage.getStats();

    return {
      settings,
      filters,
      whitelist,
      blacklist,
      customRules,
      stats,
      lastModified: Timestamp.now()
    };
  }

  /**
   * Get remote data
   */
  private async getRemoteData(): Promise<SyncData | null> {
    if (!this.userId) return null;

    try {
      const syncRef = doc(db, 'sync', this.userId);
      const snapshot = await getDoc(syncRef);
      
      if (snapshot.exists()) {
        return snapshot.data() as SyncData;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get remote data:', error);
      return null;
    }
  }

  /**
   * Push local data to remote
   */
  private async pushToRemote(data: SyncData): Promise<void> {
    if (!this.userId) return;

    const syncRef = doc(db, 'sync', this.userId);
    await setDoc(syncRef, {
      ...data,
      lastModified: serverTimestamp(),
      deviceId: this.deviceId
    });
  }

  /**
   * Pull remote data to local
   */
  private async pullFromRemote(data: SyncData): Promise<void> {
    const storage = StorageManager.getInstance();
    
    await storage.updateSettings(data.settings);
    await storage.setFilters(data.filters);
    await storage.setWhitelist(data.whitelist);
    await storage.setBlacklist(data.blacklist);
    await storage.setCustomRules(data.customRules);
    await storage.updateStats(data.stats);
  }

  /**
   * Handle remote changes
   */
  private async handleRemoteChanges(remoteData: SyncData) {
    // Don't sync if change was from this device
    if ((remoteData as any).deviceId === this.deviceId) return;

    const localData = await this.getLocalData();
    
    if (this.isRemoteNewer(localData, remoteData)) {
      await this.pullFromRemote(remoteData);
      this.lastSyncTime = new Date();
      this.notifySyncStatus('success');
    }
  }

  /**
   * Check if local data is newer
   */
  private isLocalNewer(local: SyncData, remote: SyncData): boolean {
    return local.lastModified.toMillis() > remote.lastModified.toMillis();
  }

  /**
   * Check if remote data is newer
   */
  private isRemoteNewer(local: SyncData, remote: SyncData): boolean {
    return remote.lastModified.toMillis() > local.lastModified.toMillis();
  }

  /**
   * Set up periodic sync
   */
  private setupPeriodicSync() {
    // Sync every 5 minutes
    this.syncInterval = setInterval(() => {
      if (this.userId) {
        this.syncNow().catch(console.error);
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Register device
   */
  private async registerDevice(): Promise<void> {
    if (!this.userId) return;

    const deviceRef = doc(db, 'devices', `${this.userId}_${this.deviceId}`);
    
    await setDoc(deviceRef, {
      userId: this.userId,
      deviceId: this.deviceId,
      name: this.getDeviceName(),
      type: this.getDeviceType(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      lastSync: serverTimestamp(),
      registeredAt: serverTimestamp()
    }, { merge: true });
  }

  /**
   * Update device sync time
   */
  private async updateDeviceSyncTime(): Promise<void> {
    if (!this.userId) return;

    const deviceRef = doc(db, 'devices', `${this.userId}_${this.deviceId}`);
    
    await updateDoc(deviceRef, {
      lastSync: serverTimestamp()
    });
  }

  /**
   * Get connected devices
   */
  async getConnectedDevices(): Promise<DeviceInfo[]> {
    if (!this.userId) return [];

    try {
      const devicesQuery = query(
        collection(db, 'devices'),
        where('userId', '==', this.userId)
      );
      
      const snapshot = await getDocs(devicesQuery);
      const devices: DeviceInfo[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        devices.push({
          id: data.deviceId,
          name: data.name,
          type: data.type,
          lastSync: data.lastSync.toDate(),
          isCurrentDevice: data.deviceId === this.deviceId,
          userAgent: data.userAgent,
          platform: data.platform
        });
      });
      
      return devices;
    } catch (error) {
      console.error('Failed to get connected devices:', error);
      return [];
    }
  }

  /**
   * Remove device
   */
  async removeDevice(deviceId: string): Promise<void> {
    if (!this.userId) return;

    const deviceRef = doc(db, 'devices', `${this.userId}_${deviceId}`);
    await deleteDoc(deviceRef);
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    const pendingChanges = await this.getPendingChangesCount();
    
    return {
      status: 'idle',
      lastSync: this.lastSyncTime,
      nextSync: this.getNextSyncTime(),
      pendingChanges
    };
  }

  /**
   * Get pending changes count
   */
  private async getPendingChangesCount(): Promise<number> {
    // This would track local changes that haven't been synced yet
    // For now, return 0
    return 0;
  }

  /**
   * Get next sync time
   */
  private getNextSyncTime(): Date | null {
    if (!this.lastSyncTime) return null;
    
    const nextSync = new Date(this.lastSyncTime);
    nextSync.setMinutes(nextSync.getMinutes() + 5);
    return nextSync;
  }

  /**
   * Subscribe to sync status changes
   */
  onSyncStatusChange(callback: SyncStatusCallback): () => void {
    this.syncStatusCallbacks.add(callback);
    
    return () => {
      this.syncStatusCallbacks.delete(callback);
    };
  }

  /**
   * Notify sync status
   */
  private notifySyncStatus(status: 'idle' | 'syncing' | 'success' | 'error') {
    this.syncStatusCallbacks.forEach(callback => callback(status));
  }

  /**
   * Get or create device ID
   */
  private getOrCreateDeviceId(): string {
    const key = 'deviceId';
    let deviceId = localStorage.getItem(key);
    
    if (!deviceId) {
      deviceId = this.generateDeviceId();
      localStorage.setItem(key, deviceId);
    }
    
    return deviceId;
  }

  /**
   * Generate device ID
   */
  private generateDeviceId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get device name
   */
  private getDeviceName(): string {
    const type = this.getDeviceType();
    const browser = this.getBrowserName();
    return `${browser} on ${type}`;
  }

  /**
   * Get device type
   */
  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const ua = navigator.userAgent;
    
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    if (/mobile|android|iphone/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  /**
   * Get browser name
   */
  private getBrowserName(): string {
    const ua = navigator.userAgent;
    
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Browser';
  }
}

export { SyncService };