export interface UserTier {
  level: 1 | 2 | 3 | 4 | 5;
  name: 'Basic' | 'Enhanced' | 'Professional' | 'Premium' | 'Ultimate';
  unlockedAt: number;
  progress: number;
}

export interface BlockingStats {
  totalBlocked: number;
  blockedToday: number;
  blockedThisWeek: number;
  blockedThisMonth: number;
  lastReset: number;
  domainStats: Record<string, number>;
  categoryStats: {
    ads: number;
    trackers: number;
    malware: number;
    social: number;
    youtube: number;
    other: number;
  };
}

export interface ExtensionSettings {
  enabled: boolean;
  whitelist: string[];
  pausedDomains: string[];
  tier: UserTier;
  notifications: boolean;
  showBadge: boolean;
  autoUpdate: boolean;
  developerMode: boolean;
}

export interface TabState {
  tabId: number;
  domain: string;
  blocked: number;
  enabled: boolean;
  whitelisted: boolean;
}

export interface BlockedRequest {
  url: string;
  domain: string;
  type: string;
  timestamp: number;
  rule: string;
  tabId?: number;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  whitelist: [],
  pausedDomains: [],
  tier: {
    level: 1,
    name: 'Basic',
    unlockedAt: Date.now(),
    progress: 0,
  },
  notifications: true,
  showBadge: true,
  autoUpdate: true,
  developerMode: false,
};

export const DEFAULT_STATS: BlockingStats = {
  totalBlocked: 0,
  blockedToday: 0,
  blockedThisWeek: 0,
  blockedThisMonth: 0,
  lastReset: Date.now(),
  domainStats: {},
  categoryStats: {
    ads: 0,
    trackers: 0,
    malware: 0,
    social: 0,
    youtube: 0,
    other: 0,
  },
};
