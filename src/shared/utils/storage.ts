import { ExtensionSettings, BlockingStats, DEFAULT_SETTINGS, DEFAULT_STATS } from '../types';

export class StorageManager {
  private static instance: StorageManager;

  private constructor() {}

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  async getSettings(): Promise<ExtensionSettings> {
    try {
      const result = await chrome.storage.local.get('settings');
      return result.settings || DEFAULT_SETTINGS;
    } catch {
      console.error('Failed to get settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  async setSettings(settings: Partial<ExtensionSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      await chrome.storage.local.set({ settings: newSettings });
    } catch {
      console.error('Failed to save settings:', error);
    }
  }

  async updateSettings(settings: Partial<ExtensionSettings>): Promise<void> {
    return this.setSettings(settings);
  }

  async getStats(): Promise<BlockingStats> {
    try {
      const result = await chrome.storage.local.get('stats');
      return result.stats || DEFAULT_STATS;
    } catch {
      console.error('Failed to get stats:', error);
      return DEFAULT_STATS;
    }
  }

  async updateStats(update: Partial<BlockingStats>): Promise<void> {
    try {
      const currentStats = await this.getStats();
      const newStats = { ...currentStats, ...update };
      await chrome.storage.local.set({ stats: newStats });
    } catch {
      console.error('Failed to update stats:', error);
    }
  }

  async incrementBlockedCount(
    domain: string,
    category: keyof BlockingStats['categoryStats'] = 'ads'
  ): Promise<void> {
    try {
      const stats = await this.getStats();
      // const now = Date.now();
      const today = new Date().setHours(0, 0, 0, 0);
      // const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
      // const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

      // Reset daily stats if needed
      if (stats.lastReset < today) {
        stats.blockedToday = 0;
        stats.lastReset = today;
      }

      // Update counts
      stats.totalBlocked++;
      stats.blockedToday++;
      stats.domainStats[domain] = (stats.domainStats[domain] || 0) + 1;
      stats.categoryStats[category]++;

      await this.updateStats(stats);
    } catch {
      console.error('Failed to increment blocked count:', error);
    }
  }

  async addToWhitelist(domain: string): Promise<void> {
    try {
      const settings = await this.getSettings();
      if (!settings.whitelist.includes(domain)) {
        settings.whitelist.push(domain);
        await this.setSettings({ whitelist: settings.whitelist });
      }
    } catch {
      console.error('Failed to add to whitelist:', error);
    }
  }

  async removeFromWhitelist(domain: string): Promise<void> {
    try {
      const settings = await this.getSettings();
      settings.whitelist = settings.whitelist.filter((d) => d !== domain);
      await this.setSettings({ whitelist: settings.whitelist });
    } catch {
      console.error('Failed to remove from whitelist:', error);
    }
  }

  async isWhitelisted(domain: string): Promise<boolean> {
    try {
      const settings = await this.getSettings();
      return settings.whitelist.some((whitelistedDomain) => {
        return domain === whitelistedDomain || domain.endsWith(`.${whitelistedDomain}`);
      });
    } catch {
      console.error('Failed to check whitelist:', error);
      return false;
    }
  }

  async toggleExtension(): Promise<boolean> {
    try {
      const settings = await this.getSettings();
      const newState = !settings.enabled;
      await this.setSettings({ enabled: newState });
      return newState;
    } catch {
      console.error('Failed to toggle extension:', error);
      return true;
    }
  }

  async clearStats(): Promise<void> {
    try {
      await chrome.storage.local.set({ stats: DEFAULT_STATS });
    } catch {
      console.error('Failed to clear stats:', error);
    }
  }

  async getFilters(): Promise<any> {
    try {
      const result = await chrome.storage.local.get('filters');
      return result.filters || {};
    } catch {
      console.error('Failed to get filters:', error);
      return {};
    }
  }

  async setFilters(filters: any): Promise<void> {
    try {
      await chrome.storage.local.set({ filters });
    } catch {
      console.error('Failed to set filters:', error);
    }
  }

  async getWhitelist(): Promise<string[]> {
    try {
      const settings = await this.getSettings();
      return settings.whitelist || [];
    } catch {
      console.error('Failed to get whitelist:', error);
      return [];
    }
  }

  async setWhitelist(whitelist: string[]): Promise<void> {
    try {
      await this.setSettings({ whitelist });
    } catch {
      console.error('Failed to set whitelist:', error);
    }
  }

  async getBlacklist(): Promise<string[]> {
    try {
      const result = await chrome.storage.local.get('blacklist');
      return result.blacklist || [];
    } catch {
      console.error('Failed to get blacklist:', error);
      return [];
    }
  }

  async setBlacklist(blacklist: string[]): Promise<void> {
    try {
      await chrome.storage.local.set({ blacklist });
    } catch {
      console.error('Failed to set blacklist:', error);
    }
  }

  async getCustomRules(): Promise<any[]> {
    try {
      const result = await chrome.storage.local.get('customRules');
      return result.customRules || [];
    } catch {
      console.error('Failed to get custom rules:', error);
      return [];
    }
  }

  async setCustomRules(customRules: any[]): Promise<void> {
    try {
      await chrome.storage.local.set({ customRules });
    } catch {
      console.error('Failed to set custom rules:', error);
    }
  }
}

export const storage = StorageManager.getInstance();
