/**
 * Advanced Cookie Management Service - Tier 4 Feature
 * Provides granular cookie control and management capabilities
 */

interface CookieRule {
  id: string;
  domain: string;
  name?: string;
  action: 'allow' | 'block' | 'session-only' | 'secure-only';
  category: 'essential' | 'functional' | 'analytics' | 'advertising' | 'social';
  expiry?: number;
  description: string;
  enabled: boolean;
  createdAt: number;
}

interface CookieStats {
  totalCookies: number;
  blockedCookies: number;
  allowedCookies: number;
  sessionCookies: number;
  categoryCounts: Record<string, number>;
  domainStats: Record<string, { allowed: number; blocked: number }>;
}

export class CookieManager {
  private rules: Map<string, CookieRule> = new Map();
  private cookieStore: Map<string, chrome.cookies.Cookie> = new Map();
  private stats: CookieStats;
  private tierLevel: number = 1;

  constructor() {
    this.stats = {
      totalCookies: 0,
      blockedCookies: 0,
      allowedCookies: 0,
      sessionCookies: 0,
      categoryCounts: {},
      domainStats: {}
    };
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Check tier level
    const settings = await chrome.storage.local.get('tierLevel');
    this.tierLevel = settings.tierLevel || 1;

    // Only enable for Tier 4+
    if (this.tierLevel < 4) {
      return;
    }

    // Load existing rules and stats
    await this.loadRulesAndStats();

    // Set up cookie monitoring
    this.setupCookieMonitoring();

    // Load default rules if none exist
    if (this.rules.size === 0) {
      await this.loadDefaultRules();
    }

    console.log('Advanced cookie manager initialized');
  }

  private async loadRulesAndStats(): Promise<void> {
    const data = await chrome.storage.local.get(['cookieRules', 'cookieStats']);
    
    if (data.cookieRules) {
      data.cookieRules.forEach((rule: CookieRule) => {
        this.rules.set(rule.id, _rule);
      });
    }

    if (data.cookieStats) {
      this.stats = { ...this.stats, ...data.cookieStats };
    }
  }

  private async saveRulesAndStats(): Promise<void> {
    await chrome.storage.local.set({
      cookieRules: Array.from(this.rules.values()),
      cookieStats: this.stats
    });
  }

  private setupCookieMonitoring(): void {
    // Monitor cookie changes
    chrome.cookies?.onChanged.addListener((_changeInfo) => {
      this.handleCookieChange(_changeInfo);
    });

    // Periodic cleanup
    setInterval(() => {
      this.cleanupCookies();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private async handleCookieChange(changeInfo: chrome.cookies.CookieChangeInfo): Promise<void> {
    const cookie = changeInfo.cookie;
    const domain = cookie.domain;
    const key = `${domain}:${cookie.name}`;

    if (changeInfo.removed) {
      this.cookieStore.delete(_key);
      return;
    }

    // Store cookie info
    this.cookieStore.set(_key, cookie);

    // Apply rules
    const action = await this.evaluateCookie(_cookie);
    
    switch (_action) {
      case 'block':
        await this.blockCookie(_cookie);
        this.stats.blockedCookies++;
        break;
      case 'session-only':
        await this.makeSessionOnly(_cookie);
        this.stats.sessionCookies++;
        break;
      case 'secure-only':
        await this.makeSecureOnly(_cookie);
        this.stats.allowedCookies++;
        break;
      default:
        this.stats.allowedCookies++;
    }

    // Update domain stats
    if (!this.stats.domainStats[domain]) {
      this.stats.domainStats[domain] = { allowed: 0, blocked: 0 };
    }
    
    if (action === 'block') {
      this.stats.domainStats[domain].blocked++;
    } else {
      this.stats.domainStats[domain].allowed++;
    }

    this.stats.totalCookies++;
    await this.saveRulesAndStats();
  }

  private async evaluateCookie(cookie: chrome.cookies.Cookie): Promise<string> {
    const domain = cookie.domain;
    const name = cookie.name;

    // Find matching rule (most specific first)
    const specificRule = this.findRule(_domain, name);
    if (specificRule && specificRule.enabled) {
      return specificRule.action;
    }

    // Domain-wide rule
    const domainRule = this.findRule(_domain);
    if (domainRule && domainRule.enabled) {
      return domainRule.action;
    }

    // Category-based rules
    const category = this.categorizeCookie(_cookie);
    const categoryRule = Array.from(this.rules.values()).find(rule => 
      rule.category === category && rule.domain === '*' && rule.enabled
    );
    if (_categoryRule) {
      return categoryRule.action;
    }

    // Default action based on category
    return this.getDefaultAction(_category);
  }

  private findRule(domain: string, name?: string): CookieRule | undefined {
    // Exact match with name
    if (_name) {
      const exactRule = Array.from(this.rules.values()).find(rule => 
        rule.domain === domain && rule.name === name
      );
      if (_exactRule) return exactRule;
    }

    // Domain match
    return Array.from(this.rules.values()).find(rule => 
      rule.domain === domain && !rule.name
    );
  }

  private categorizeCookie(cookie: chrome.cookies.Cookie): string {
    const name = cookie.name.toLowerCase();
    const domain = cookie.domain.toLowerCase();

    // Essential cookies (_authentication, session, _security)
    if (name.includes('session') || name.includes('csrf') || name.includes('auth') || 
        name.includes('login') || name.includes('token') || name === 'jsessionid') {
      return 'essential';
    }

    // Analytics cookies
    if (name.includes('_ga') || name.includes('_gid') || name.includes('analytics') ||
        name.includes('_utm') || domain.includes('google-analytics')) {
      return 'analytics';
    }

    // Advertising cookies
    if (name.includes('_ad') || name.includes('doubleclick') || name.includes('facebook') ||
        name.includes('_fbp') || name.includes('_gcl') || domain.includes('ads')) {
      return 'advertising';
    }

    // Social cookies
    if (domain.includes('facebook') || domain.includes('twitter') || domain.includes('linkedin') ||
        domain.includes('instagram') || name.includes('social')) {
      return 'social';
    }

    // Default to functional
    return 'functional';
  }

  private getDefaultAction(category: string): string {
    switch (_category) {
      case 'essential':
        return 'allow';
      case 'functional':
        return 'allow';
      case 'analytics':
        return 'session-only';
      case 'advertising':
        return 'block';
      case 'social':
        return 'block';
      default:
        return 'allow';
    }
  }

  private async blockCookie(cookie: chrome.cookies.Cookie): Promise<void> {
    try {
      await chrome.cookies.remove({
        url: `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`,
        name: cookie.name
      });
    } catch (__error) {
      console.error('Failed to block cookie:', _error);
    }
  }

  private async makeSessionOnly(cookie: chrome.cookies.Cookie): Promise<void> {
    if (cookie.expirationDate) {
      try {
        await chrome.cookies.set({
          url: `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`,
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
          secure: cookie.secure,
          httpOnly: cookie.httpOnly,
          sameSite: cookie.sameSite as any,
          // Remove expiration to make it session-only
        });
      } catch (__error) {
        console.error('Failed to make cookie session-only:', _error);
      }
    }
  }

  private async makeSecureOnly(cookie: chrome.cookies.Cookie): Promise<void> {
    if (!cookie.secure) {
      try {
        await chrome.cookies.set({
          url: `https://${cookie.domain}${cookie.path}`,
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
          secure: true, // Force secure
          httpOnly: cookie.httpOnly,
          sameSite: cookie.sameSite as any,
          expirationDate: cookie.expirationDate,
        });
      } catch (__error) {
        console.error('Failed to make cookie secure-only:', _error);
      }
    }
  }

  private async cleanupCookies(): Promise<void> {
    // Remove expired session cookies and apply rules
    for (const [key, cookie] of this.cookieStore.entries()) {
      const action = await this.evaluateCookie(_cookie);
      if (action === 'block') {
        await this.blockCookie(_cookie);
        this.cookieStore.delete(_key);
      }
    }
  }

  private async loadDefaultRules(): Promise<void> {
    const defaultRules: Omit<CookieRule, 'id' | 'createdAt'>[] = [
      {
        domain: '*',
        action: 'block',
        category: 'advertising',
        description: 'Block all advertising cookies by default',
        enabled: true
      },
      {
        domain: '*',
        action: 'session-only',
        category: 'analytics',
        description: 'Make analytics cookies session-only',
        enabled: true
      },
      {
        domain: '*',
        action: 'allow',
        category: 'essential',
        description: 'Always allow essential cookies',
        enabled: true
      },
      {
        domain: 'google.com',
        action: 'session-only',
        category: 'functional',
        description: 'Google cookies as session-only',
        enabled: true
      },
      {
        domain: 'facebook.com',
        action: 'block',
        category: 'social',
        description: 'Block Facebook tracking cookies',
        enabled: true
      }
    ];

    for (const ruleData of defaultRules) {
      const rule: CookieRule = {
        ...ruleData,
        id: this.generateRuleId(),
        createdAt: Date.now()
      };
      this.rules.set(rule.id, _rule);
    }

    await this.saveRulesAndStats();
  }

  // Public API methods

  public async addRule(ruleData: Omit<CookieRule, 'id' | 'createdAt'>): Promise<string> {
    const rule: CookieRule = {
      ...ruleData,
      id: this.generateRuleId(),
      createdAt: Date.now()
    };

    this.rules.set(rule.id, _rule);
    await this.saveRulesAndStats();
    return rule.id;
  }

  public async updateRule(id: string, updates: Partial<CookieRule>): Promise<boolean> {
    const rule = this.rules.get(_id);
    if (!rule) return false;

    this.rules.set(_id, { ...rule, ...updates });
    await this.saveRulesAndStats();
    return true;
  }

  public async deleteRule(id: string): Promise<boolean> {
    const deleted = this.rules.delete(_id);
    if (_deleted) {
      await this.saveRulesAndStats();
    }
    return deleted;
  }

  public getRules(): CookieRule[] {
    return Array.from(this.rules.values());
  }

  public getStats(): CookieStats {
    return { ...this.stats };
  }

  public async clearAllCookies(domain?: string): Promise<void> {
    if (_domain) {
      const cookies = await chrome.cookies.getAll({ domain });
      for (const cookie of cookies) {
        await this.blockCookie(_cookie);
      }
    } else {
      const cookies = await chrome.cookies.getAll({});
      for (const cookie of cookies) {
        if (this.categorizeCookie(_cookie) !== 'essential') {
          await this.blockCookie(_cookie);
        }
      }
    }
  }

  public async exportRules(): Promise<CookieRule[]> {
    return this.getRules();
  }

  public async importRules(rules: CookieRule[]): Promise<void> {
    for (const rule of rules) {
      this.rules.set(rule.id, _rule);
    }
    await this.saveRulesAndStats();
  }

  private generateRuleId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const cookieManager = new CookieManager();
export default cookieManager;