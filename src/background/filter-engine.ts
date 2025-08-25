/**
 * Core ad blocking filter engine
 * Uses Chrome's declarativeNetRequest API for efficient network-level blocking
 */

// Firebase auth removed - not needed for filter engine

interface FilterRule {
  id: number;
  priority: number;
  action: {
    type: 'block' | 'allow' | 'redirect' | 'modifyHeaders';
    redirect?: { url: string };
    responseHeaders?: Array<{ header: string; operation: string; value?: string }>;
  };
  condition: {
    urlFilter?: string;
    regexFilter?: string;
    domains?: string[];
    excludedDomains?: string[];
    resourceTypes?: chrome.declarativeNetRequest.ResourceType[];
    requestMethods?: string[];
  };
}

export class FilterEngine {
  private rules: Map<number, FilterRule> = new Map();
  private blockedRequests: Map<string, number> = new Map();
  private whitelist: Set<string> = new Set();
  private tierLevel: number = 1;
  private enabled: boolean = true;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Load saved settings
    const settings = await chrome.storage.local.get(['whitelist', 'enabled', 'tierLevel']);
    this.whitelist = new Set(settings.whitelist || []);
    this.enabled = settings.enabled !== false;
    this.tierLevel = settings.tierLevel || 1;

    // Setup request listener for stats tracking
    chrome.declarativeNetRequest.onRuleMatchedDebug?.addListener((info) => {
      this.handleBlockedRequest(info);
    });

    // Load initial rules based on tier
    await this.loadFilterRules();
    await this.loadRulesForTier(this.tierLevel);

    // Listen for tier changes
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.tierLevel) {
        this.updateTier(changes.tierLevel.newValue);
      }
      if (changes.whitelist) {
        this.whitelist = new Set(changes.whitelist.newValue || []);
        this.updateDynamicRules();
      }
      if (changes.enabled !== undefined) {
        this.enabled = changes.enabled.newValue;
        this.updateBlockingState();
      }
    });
  }

  private async loadFilterRules() {
    // Load base filter rules for ad blocking
    try {
      const baseRules = await this.generateBaseRules();
      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: baseRules
      });
    } catch (error) {
      console.error('Failed to load filter rules:', error);
    }
  }

  private generateBaseRules(): chrome.declarativeNetRequest.Rule[] {
    // Common tracker and ad domains to block
    const trackerDomains = [
      'google-analytics.com', 'googletagmanager.com', 'doubleclick.net',
      'facebook.com/tr', 'analytics.twitter.com', 'amazon-adsystem.com',
      'googlesyndication.com', 'googleadservices.com', 'adsrvr.org',
      'adsystem.com', 'adnxs.com', 'criteo.com', 'outbrain.com',
      'taboola.com', 'scorecardresearch.com', 'quantserve.com',
      'mixpanel.com', 'segment.io', 'amplitude.com', 'hotjar.com',
      'fullstory.com', 'mouseflow.com', 'clarity.ms', 'crazyegg.com'
    ];

    return trackerDomains.map((domain, index) => ({
      id: 10000 + index,
      priority: 1,
      action: { type: 'block' as const },
      condition: {
        urlFilter: `*://*.${domain}/*`,
        resourceTypes: [
          'script' as const,
          'xmlhttprequest' as const,
          'image' as const,
          'sub_frame' as const
        ]
      }
    }));
  }

  private async loadRulesForTier(tier: number) {
    this.tierLevel = tier;
    
    // Clear existing rules
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: Array.from(this.rules.keys())
    });
    this.rules.clear();

    // Load tier-specific rules
    const ruleFiles = [];
    if (tier >= 1) ruleFiles.push('/rules/tier1.json');
    if (tier >= 2) ruleFiles.push('/rules/tier2.json', '/rules/tier2-trackers.json');
    if (tier >= 3) ruleFiles.push('/rules/tier3.json');
    if (tier >= 4) ruleFiles.push('/rules/tier4-security.json');
    if (tier >= 5) ruleFiles.push('/rules/tier5-ai.json');

    for (const file of ruleFiles) {
      try {
        const response = await fetch(chrome.runtime.getURL(file));
        const rules = await response.json();
        await this.addRules(rules);
      } catch (error) {
        console.warn(`Failed to load rules from ${file}:`, error);
      }
    }

    console.warn(`Filter engine loaded ${this.rules.size} rules for Tier ${tier}`);
  }

  private async addRules(rules: FilterRule[]) {
    const newRules = rules.filter(rule => !this.rules.has(rule.id));
    
    if (newRules.length > 0) {
      // Add to Chrome's declarativeNetRequest
      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: newRules.map(rule => ({
          id: rule.id,
          priority: rule.priority,
          action: rule.action as chrome.declarativeNetRequest.RuleAction,
          condition: rule.condition as chrome.declarativeNetRequest.RuleCondition
        }))
      });

      // Store locally for management
      newRules.forEach(rule => this.rules.set(rule.id, rule));
    }
  }

  private async updateDynamicRules() {
    // Create whitelist rules (higher priority)
    const whitelistRules: chrome.declarativeNetRequest.Rule[] = [];
    let ruleId = 1000000; // Start from high number to avoid conflicts

    for (const domain of this.whitelist) {
      whitelistRules.push({
        id: ruleId++,
        priority: 100000, // Very high priority
        action: { type: chrome.declarativeNetRequest.RuleActionType.ALLOW },
        condition: {
          urlFilter: `||${domain}^`,
          resourceTypes: Object.values(chrome.declarativeNetRequest.ResourceType) as chrome.declarativeNetRequest.ResourceType[]
        }
      });
    }

    // Update rules
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: Array.from({ length: 1000 }, (_, i) => 1000000 + i), // Remove old whitelist rules
      addRules: whitelistRules
    });
  }

  private async updateBlockingState() {
    if (this.enabled) {
      // Re-enable all rules
      await this.loadRulesForTier(this.tierLevel);
    } else {
      // Disable all rules
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: Array.from(this.rules.keys())
      });
    }
  }

  private handleBlockedRequest(info: chrome.declarativeNetRequest.MatchedRuleInfoDebug) {
    const url = new URL(info.request.url);
    const domain = url.hostname;
    
    // Update blocked count
    const count = this.blockedRequests.get(domain) || 0;
    this.blockedRequests.set(domain, count + 1);

    // Send message to popup/content scripts
    chrome.runtime.sendMessage({
      type: 'REQUEST_BLOCKED',
      data: {
        url: info.request.url,
        domain,
        ruleId: info.rule.ruleId,
        tabId: info.request.tabId,
        timestamp: Date.now()
      }
    }).catch(() => {
      // Ignore errors if no listeners
    });

    // Update stats
    this.updateStats(domain, info.rule.ruleId);
  }

  private async updateStats(domain: string, ruleId: number) {
    const stats = await chrome.storage.local.get('stats');
    const currentStats = stats.stats || {
      totalBlocked: 0,
      blockedToday: 0,
      domainStats: {},
      categoryStats: {
        ads: 0,
        trackers: 0,
        malware: 0,
        social: 0,
        youtube: 0,
        other: 0
      }
    };

    currentStats.totalBlocked++;
    currentStats.blockedToday++;
    currentStats.domainStats[domain] = (currentStats.domainStats[domain] || 0) + 1;

    // Categorize based on rule ID ranges
    if (ruleId < 10000) {
      currentStats.categoryStats.ads++;
    } else if (ruleId < 20000) {
      currentStats.categoryStats.trackers++;
    } else if (ruleId < 30000) {
      currentStats.categoryStats.social++;
    } else if (ruleId < 40000) {
      currentStats.categoryStats.youtube++;
    } else if (ruleId < 50000) {
      currentStats.categoryStats.malware++;
    } else {
      currentStats.categoryStats.other++;
    }

    await chrome.storage.local.set({ stats: currentStats });
  }

  public async updateTier(newTier: number) {
    if (newTier !== this.tierLevel) {
      await this.loadRulesForTier(newTier);
    }
  }

  public async addCustomRule(rule: Partial<FilterRule>): Promise<void> {
    const id = Date.now(); // Generate unique ID
    const fullRule: FilterRule = {
      id,
      priority: rule.priority || 1000,
      action: rule.action || { type: 'block' },
      condition: rule.condition || {}
    };

    await this.addRules([fullRule]);
  }

  public async removeCustomRule(ruleId: number): Promise<void> {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [ruleId]
    });
    this.rules.delete(ruleId);
  }

  public getBlockedCount(domain?: string): number {
    if (domain) {
      return this.blockedRequests.get(domain) || 0;
    }
    return Array.from(this.blockedRequests.values()).reduce((a, b) => a + b, 0);
  }

  public async exportRules(): Promise<FilterRule[]> {
    return Array.from(this.rules.values());
  }

  public async importRules(rules: FilterRule[]): Promise<void> {
    await this.addRules(rules);
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public getTierLevel(): number {
    return this.tierLevel;
  }
}

// Export singleton instance
export const filterEngine = new FilterEngine();