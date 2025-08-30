/**
 * Security Service - Tier 4 Premium Power Features
 * Handles malware protection, phishing detection, and security features
 */

interface MalwareDomain {
  domain: string;
  category: 'malware' | 'phishing' | 'cryptomining' | 'exploit' | 'botnet';
  severity: 'low' | 'medium' | 'high' | 'critical';
  lastSeen: number;
  source: string;
}

interface SecurityThreat {
  url: string;
  type: 'malware' | 'phishing' | 'cryptomining' | 'suspicious';
  severity: number;
  blocked: boolean;
  timestamp: number;
  details: string;
}

export class SecurityService {
  private malwareDomains: Set<string> = new Set();
  private phishingDomains: Set<string> = new Set();
  private cryptominingDomains: Set<string> = new Set();
  private threatCache: Map<string, SecurityThreat> = new Map();
  private lastUpdate: number = 0;
  private updateInterval: number = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Load cached security data
    const cached = await chrome.storage.local.get(['securityData', 'lastSecurityUpdate']);
    if (cached.securityData) {
      this.loadSecurityData(cached.securityData);
      this.lastUpdate = cached.lastSecurityUpdate || 0;
    }

    // Update security database if needed
    if (Date.now() - this.lastUpdate > this.updateInterval) {
      await this.updateSecurityDatabase();
    }

    // Setup periodic updates
    setInterval(() => {
      this.updateSecurityDatabase();
    }, this.updateInterval);

    // Listen for navigation events
    chrome.webNavigation?.onBeforeNavigate.addListener((_details) => {
      if (details.frameId === 0) { // Main frame only
        this.checkUrl(details.url, details.tabId);
      }
    });
  }

  /**
   * Check if URL is malicious
   */
  public async checkUrl(url: string, tabId?: number): Promise<SecurityThreat | null> {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const fullUrl = url.toLowerCase();

      // Check against known malware domains
      if (this.malwareDomains.has(domain)) {
        const threat: SecurityThreat = {
          url,
          type: 'malware',
          severity: 9,
          blocked: true,
          timestamp: Date.now(),
          details: 'Domain identified as malware distributor'
        };

        await this.handleThreat(_threat, tabId);
        return threat;
      }

      // Check against phishing domains
      if (this.phishingDomains.has(domain)) {
        const threat: SecurityThreat = {
          url,
          type: 'phishing',
          severity: 8,
          blocked: true,
          timestamp: Date.now(),
          details: 'Domain identified as phishing site'
        };

        await this.handleThreat(_threat, tabId);
        return threat;
      }

      // Check for cryptomining
      if (this.cryptominingDomains.has(domain) || this.isCryptominingUrl(_fullUrl)) {
        const threat: SecurityThreat = {
          url,
          type: 'cryptomining',
          severity: 6,
          blocked: true,
          timestamp: Date.now(),
          details: 'Cryptomining script detected'
        };

        await this.handleThreat(_threat, tabId);
        return threat;
      }

      // Heuristic checks for suspicious patterns
      const suspiciousScore = this.calculateSuspiciousScore(url, domain);
      if (suspiciousScore > 7) {
        const threat: SecurityThreat = {
          url,
          type: 'suspicious',
          severity: suspiciousScore,
          blocked: suspiciousScore > 8,
          timestamp: Date.now(),
          details: `Suspicious URL pattern detected (score: ${suspiciousScore})`
        };

        if (threat.blocked) {
          await this.handleThreat(_threat, tabId);
        }
        return threat;
      }

      return null;
    } catch (_error) {
      console.error('Error checking URL:', error);
      return null;
    }
  }

  /**
   * Handle detected security threat
   */
  private async handleThreat(threat: SecurityThreat, tabId?: number): Promise<void> {
    // Cache the threat
    this.threatCache.set(threat.url, _threat);

    // Update statistics
    await this.updateSecurityStats(_threat);

    // Block the navigation if severe
    if (threat.blocked && tabId) {
      try {
        await chrome.tabs.update(_tabId, {
          url: chrome.runtime.getURL(`/blocked.html?reason=${threat.type}&url=${encodeURIComponent(threat.url)}`)
        });
      } catch (_error) {
        console.error('Failed to redirect blocked page:', error);
      }
    }

    // Show notification for high severity threats
    if (threat.severity >= 8) {
      chrome.notifications?.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('/icons/icon-48.png'),
        title: 'ShieldPro Security Alert',
        message: `Blocked ${threat.type}: ${new URL(threat.url).hostname}`,
        priority: 2
      });
    }

    // Send message to popup/options
    chrome.runtime.sendMessage({
      type: 'SECURITY_THREAT_DETECTED',
      data: threat
    }).catch(() => {
      // Ignore if no listeners
    });
  }

  /**
   * Check if URL contains cryptomining patterns
   */
  private isCryptominingUrl(url: string): boolean {
    const cryptominingPatterns = [
      'coinhive', 'jsecoin', 'cryptoloot', 'minergate',
      'coinpot', 'crypto-loot', 'webminepool', 'mining',
      'miner.js', 'authedmine', 'coin-have', 'minero'
    ];

    return cryptominingPatterns.some(pattern => url.includes(_pattern));
  }

  /**
   * Calculate suspicious score for URL
   */
  private calculateSuspiciousScore(url: string, domain: string): number {
    let score = 0;

    // Check for suspicious URL patterns
    const suspiciousPatterns = [
      { pattern: /secure.*bank/i, score: 5 },
      { pattern: /paypal.*verify/i, score: 6 },
      { pattern: /amazon.*security/i, score: 5 },
      { pattern: /microsoft.*login/i, score: 4 },
      { pattern: /apple.*verification/i, score: 5 },
      { pattern: /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/i, score: 3 }, // IP address
      { pattern: /bit\.ly|tinyurl|shorturl/i, score: 2 }, // URL shorteners
      { pattern: /exe$|zip$|rar$/i, score: 4 }, // Executable files
      { pattern: /urgent|immediate|suspended|expired/i, score: 3 }
    ];

    suspiciousPatterns.forEach(({ pattern, score: points }) => {
      if (pattern.test(url)) {
        score += points;
      }
    });

    // Check domain characteristics
    if (domain.length > 50) score += 2; // Very long domains
    if ((domain.match(/-/g) || []).length > 3) score += 2; // Many hyphens
    if ((domain.match(/\./g) || []).length > 5) score += 3; // Many subdomains
    if (domain.includes('xn--')) score += 2; // Punycode (internationalized domains)

    return Math.min(_score, 10);
  }

  /**
   * Enhanced phishing protection
   */
  public async checkPhishingProtection(url: string): Promise<boolean> {
    const domain = new URL(url).hostname;
    
    // Check against known phishing domains
    if (this.phishingDomains.has(domain)) {
      return true;
    }
    
    // Check for phishing patterns
    const phishingPatterns = [
      /secure.*paypal.*(?:verify|update|confirm)/i,
      /(?:amazon|amaz0n|amazone).*(?:security|verify|suspend)/i,
      /(?:microsoft|micr0soft|mircosoft).*(?:account|verify|update)/i,
      /(?:apple|app1e|appl3).*(?:id|account|verify)/i,
      /(?:bank|banking).*(?:verify|secure|update).*(?:account|login)/i,
      /(?:netflix|netfl1x).*(?:payment|billing|suspend)/i,
      /(?:facebook|faceb00k).*(?:security|verify|locked)/i,
      /(?:google|g00gle|googIe).*(?:account|verify|suspended)/i
    ];
    
    return phishingPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Update security database from remote sources
   */
  private async updateSecurityDatabase(): Promise<void> {
    try {
      // In a real implementation, this would fetch from security feeds
      // For demo, we'll use predefined lists
      const securityData = {
        malwareDomains: [
          'malware-test-domain.com',
          'virus-distribution.net',
          'trojan-host.org',
          'ransomware-site.com'
        ],
        phishingDomains: [
          'fake-paypal-login.com',
          'amazon-security-check.net',
          'microsoft-account-verify.com',
          'apple-id-verification.org'
        ],
        cryptominingDomains: [
          'coinhive.com',
          'jsecoin.com',
          'cryptoloot.pro',
          'coin-have.com',
          'crypto-loot.com',
          'webminepool.com'
        ]
      };

      this.loadSecurityData(_securityData);
      this.lastUpdate = Date.now();

      // Cache the data
      await chrome.storage.local.set({
        securityData,
        lastSecurityUpdate: this.lastUpdate
      });

      console.log('Security database updated successfully');
    } catch (_error) {
      console.error('Failed to update security database:', error);
    }
  }

  /**
   * Load security data into memory
   */
  private loadSecurityData(data: any): void {
    this.malwareDomains.clear();
    this.phishingDomains.clear();
    this.cryptominingDomains.clear();

    data.malwareDomains?.forEach((domain: string) => this.malwareDomains.add(domain));
    data.phishingDomains?.forEach((domain: string) => this.phishingDomains.add(domain));
    data.cryptominingDomains?.forEach((domain: string) => this.cryptominingDomains.add(domain));
  }

  /**
   * Update security statistics
   */
  private async updateSecurityStats(threat: SecurityThreat): Promise<void> {
    const stats = await chrome.storage.local.get('securityStats');
    const current = stats.securityStats || {
      totalThreats: 0,
      malwareBlocked: 0,
      phishingBlocked: 0,
      cryptominingBlocked: 0,
      suspiciousBlocked: 0,
      lastThreat: null
    };

    current.totalThreats++;
    current[`${threat.type}Blocked`]++;
    current.lastThreat = threat;

    await chrome.storage.local.set({ securityStats: current });
  }

  /**
   * Get security statistics
   */
  public async getSecurityStats(): Promise<any> {
    const stats = await chrome.storage.local.get('securityStats');
    return stats.securityStats || {
      totalThreats: 0,
      malwareBlocked: 0,
      phishingBlocked: 0,
      cryptominingBlocked: 0,
      suspiciousBlocked: 0,
      lastThreat: null
    };
  }

  /**
   * Get recent threats
   */
  public getRecentThreats(limit: number = 10): SecurityThreat[] {
    return Array.from(this.threatCache.values())
      .sort((_a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Clear threat cache
   */
  public clearThreatCache(): void {
    this.threatCache.clear();
  }

  /**
   * Add custom domain to blocklist
   */
  public async addCustomThreatDomain(domain: string, category: 'malware' | 'phishing' | 'cryptomining'): Promise<void> {
    switch (category) {
      case 'malware':
        this.malwareDomains.add(domain);
        break;
      case 'phishing':
        this.phishingDomains.add(domain);
        break;
      case 'cryptomining':
        this.cryptominingDomains.add(domain);
        break;
    }

    // Update stored data
    const data = await chrome.storage.local.get('securityData');
    const current = data.securityData || { malwareDomains: [], phishingDomains: [], cryptominingDomains: [] };
    
    if (!current[`${category}Domains`].includes(domain)) {
      current[`${category}Domains`].push(domain);
      await chrome.storage.local.set({ securityData: current });
    }
  }

  /**
   * Remove domain from custom blocklist
   */
  public async removeCustomThreatDomain(domain: string, category: 'malware' | 'phishing' | 'cryptomining'): Promise<void> {
    switch (category) {
      case 'malware':
        this.malwareDomains.delete(domain);
        break;
      case 'phishing':
        this.phishingDomains.delete(domain);
        break;
      case 'cryptomining':
        this.cryptominingDomains.delete(domain);
        break;
    }

    // Update stored data
    const data = await chrome.storage.local.get('securityData');
    const current = data.securityData || { malwareDomains: [], phishingDomains: [], cryptominingDomains: [] };
    
    current[`${category}Domains`] = current[`${category}Domains`].filter((d: string) => d !== domain);
    await chrome.storage.local.set({ securityData: current });
  }
}

// Export singleton instance
export const securityService = new SecurityService();
export default securityService;