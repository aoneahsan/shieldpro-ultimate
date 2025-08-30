/**
 * DNS-over-HTTPS Service - Tier 4 Premium Feature
 * Provides secure DNS resolution through encrypted HTTPS connections
 */

interface DoHProvider {
  name: string;
  url: string;
  description: string;
  location: string;
  supportsECS: boolean; // EDNS Client Subnet
  logging: 'none' | 'minimal' | 'standard';
  reliability: number; // 1-10 score
}

interface DNSQuery {
  domain: string;
  recordType: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS';
  timestamp: number;
  provider: string;
  response?: DNSResponse;
  error?: string;
  duration?: number;
}

interface DNSResponse {
  Status: number;
  TC: boolean; // Truncated
  RD: boolean; // Recursion Desired
  RA: boolean; // Recursion Available
  AD: boolean; // Authentic Data
  CD: boolean; // Checking Disabled
  Answer?: DNSRecord[];
  Authority?: DNSRecord[];
  Additional?: DNSRecord[];
}

interface DNSRecord {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface DoHSettings {
  enabled: boolean;
  primaryProvider: string;
  fallbackProvider: string;
  customProviders: DoHProvider[];
  cacheEnabled: boolean;
  cacheTTL: number;
  blockMaliciousDomains: boolean;
  logQueries: boolean;
  useECS: boolean;
}

export class DNSOverHTTPSService {
  private settings: DoHSettings;
  private cache: Map<string, { response: DNSResponse; expires: number }> = new Map();
  private queryLog: DNSQuery[] = [];
  private tierLevel: number = 1;
  
  private defaultProviders: DoHProvider[] = [
    {
      name: 'Cloudflare',
      url: 'https://cloudflare-dns.com/dns-query',
      description: 'Fast, privacy-focused DNS with malware blocking',
      location: 'Global',
      supportsECS: false,
      logging: 'none',
      reliability: 10
    },
    {
      name: 'Google Public DNS',
      url: 'https://dns.google/dns-query',
      description: 'Google\'s public DNS service with global coverage',
      location: 'Global',
      supportsECS: true,
      logging: 'minimal',
      reliability: 9
    },
    {
      name: 'Quad9',
      url: 'https://dns.quad9.net/dns-query',
      description: 'Security-focused DNS with threat intelligence',
      location: 'Global',
      supportsECS: false,
      logging: 'none',
      reliability: 9
    },
    {
      name: 'OpenDNS',
      url: 'https://doh.opendns.com/dns-query',
      description: 'Cisco\'s DNS with content filtering options',
      location: 'Global',
      supportsECS: true,
      logging: 'standard',
      reliability: 8
    },
    {
      name: 'AdGuard DNS',
      url: 'https://dns.adguard.com/dns-query',
      description: 'DNS with built-in ad and tracker blocking',
      location: 'Global',
      supportsECS: false,
      logging: 'none',
      reliability: 8
    }
  ];

  constructor() {
    this.settings = {
      enabled: false,
      primaryProvider: 'Cloudflare',
      fallbackProvider: 'Quad9',
      customProviders: [],
      cacheEnabled: true,
      cacheTTL: 300, // 5 minutes
      blockMaliciousDomains: true,
      logQueries: false,
      useECS: false
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

    // Load settings
    await this.loadSettings();

    // Set up DNS interception if enabled
    if (this.settings.enabled) {
      await this.setupDNSInterception();
    }

    console.log('DNS-over-HTTPS service initialized for Tier 4');
  }

  private async loadSettings(): Promise<void> {
    const stored = await chrome.storage.local.get(['dohSettings']);
    if (stored.dohSettings) {
      this.settings = { ...this.settings, ...stored.dohSettings };
    }
  }

  private async saveSettings(): Promise<void> {
    await chrome.storage.local.set({ dohSettings: this.settings });
  }

  private async setupDNSInterception(): Promise<void> {
    // In a real implementation, this would set up DNS query interception
    // For Chrome extensions, we're limited in DNS interception capabilities
    // This is more of a framework for when such capabilities become available
    console.log('DNS interception setup (framework ready)');
  }

  public async resolveDoH(domain: string, recordType: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' = 'A'): Promise<DNSResponse> {
    if (this.tierLevel < 4) {
      throw new Error('DNS-over-HTTPS requires Tier 4');
    }

    const cacheKey = `${domain}:${recordType}`;
    
    // Check cache first
    if (this.settings.cacheEnabled) {
      const cached = this.cache.get(_cacheKey);
      if (cached && cached.expires > Date.now()) {
        return cached.response;
      }
    }

    // Get provider URL
    const provider = this.getProvider(this.settings.primaryProvider);
    if (!provider) {
      throw new Error('DNS provider not configured');
    }

    const query: DNSQuery = {
      domain,
      recordType,
      timestamp: Date.now(),
      provider: provider.name
    };

    const startTime = Date.now();

    try {
      const response = await this.performDoHQuery(provider.url, _domain, recordType);
      
      query.response = response;
      query.duration = Date.now() - startTime;

      // Cache the response
      if (this.settings.cacheEnabled && response.Answer && response.Answer.length > 0) {
        const ttl = Math.min(...response.Answer.map(r => r.TTL)) * 1000;
        this.cache.set(_cacheKey, {
          response,
          expires: Date.now() + Math.min(_ttl, this.settings.cacheTTL * 1000)
        });
      }

      // Log query if enabled
      if (this.settings.logQueries) {
        this.queryLog.push(_query);
        if (this.queryLog.length > 1000) {
          this.queryLog = this.queryLog.slice(-500); // Keep last 500
        }
      }

      return response;
    } catch (__error) {
      query.error = error instanceof Error ? error.message : 'Unknown error';
      query.duration = Date.now() - startTime;

      if (this.settings.logQueries) {
        this.queryLog.push(_query);
      }

      // Try fallback provider
      if (this.settings.fallbackProvider !== this.settings.primaryProvider) {
        const fallbackProvider = this.getProvider(this.settings.fallbackProvider);
        if (_fallbackProvider) {
          try {
            return await this.performDoHQuery(fallbackProvider.url, _domain, recordType);
          } catch (_fallbackError) {
            console.error('Fallback DNS query failed:', _fallbackError);
          }
        }
      }

      throw error;
    }
  }

  private async performDoHQuery(providerUrl: string, domain: string, recordType: string): Promise<DNSResponse> {
    const typeMap: Record<string, number> = {
      'A': 1,
      'AAAA': 28,
      'CNAME': 5,
      'MX': 15,
      'TXT': 16,
      'NS': 2
    };

    const params = new URLSearchParams({
      name: domain,
      type: typeMap[recordType].toString()
    });

    const response = await fetch(`${providerUrl}?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/dns-json',
        'User-Agent': 'ShieldPro-Ultimate/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`DNS query failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private getProvider(name: string): DoHProvider | undefined {
    return [...this.defaultProviders, ...this.settings.customProviders]
      .find(p => p.name === name);
  }

  public async enableDoH(primaryProvider: string = 'Cloudflare'): Promise<void> {
    if (this.tierLevel < 4) {
      throw new Error('DNS-over-HTTPS requires Tier 4');
    }

    this.settings.enabled = true;
    this.settings.primaryProvider = primaryProvider;
    
    await this.saveSettings();
    await this.setupDNSInterception();

    console.log(`DNS-over-HTTPS enabled with provider: ${primaryProvider}`);
  }

  public async disableDoH(): Promise<void> {
    this.settings.enabled = false;
    await this.saveSettings();
    console.log('DNS-over-HTTPS disabled');
  }

  public getAvailableProviders(): DoHProvider[] {
    return [...this.defaultProviders, ...this.settings.customProviders];
  }

  public async addCustomProvider(provider: Omit<DoHProvider, 'reliability'>): Promise<void> {
    const newProvider: DoHProvider = {
      ...provider,
      reliability: 5 // Default reliability for custom providers
    };

    this.settings.customProviders.push(_newProvider);
    await this.saveSettings();
  }

  public async removeCustomProvider(name: string): Promise<void> {
    this.settings.customProviders = this.settings.customProviders.filter(p => p.name !== name);
    await this.saveSettings();
  }

  public async updateSettings(updates: Partial<DoHSettings>): Promise<void> {
    this.settings = { ...this.settings, ...updates };
    await this.saveSettings();

    if (updates.enabled !== undefined) {
      if (updates.enabled) {
        await this.setupDNSInterception();
      }
    }
  }

  public getSettings(): DoHSettings {
    return { ...this.settings };
  }

  public getQueryLog(): DNSQuery[] {
    return [...this.queryLog];
  }

  public clearCache(): void {
    this.cache.clear();
    console.log('DNS cache cleared');
  }

  public clearQueryLog(): void {
    this.queryLog = [];
    console.log('DNS query log cleared');
  }

  public getCacheStats(): { entries: number; hitRate: number } {
    const totalQueries = this.queryLog.length;
    const cacheHits = this.queryLog.filter(q => q.duration && q.duration < 10).length; // Assume <10ms = cache hit
    
    return {
      entries: this.cache.size,
      hitRate: totalQueries > 0 ? cacheHits / totalQueries : 0
    };
  }

  public async testProvider(providerName: string): Promise<{ success: boolean; latency: number; error?: string }> {
    const provider = this.getProvider(_providerName);
    if (!provider) {
      return { success: false, latency: 0, error: 'Provider not found' };
    }

    const startTime = Date.now();
    try {
      const response = await this.performDoHQuery(provider.url, 'google.com', 'A');
      const latency = Date.now() - startTime;
      
      return {
        success: response.Status === 0 && response.Answer && response.Answer.length > 0,
        latency
      };
    } catch (__error) {
      return {
        success: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  public async performBenchmark(): Promise<{ provider: string; latency: number; reliability: number }[]> {
    const results = [];
    
    for (const provider of this.defaultProviders) {
      const tests = [];
      
      // Run 3 test queries
      for (let i = 0; i < 3; i++) {
        const result = await this.testProvider(provider.name);
        tests.push(_result);
        await new Promise(resolve => setTimeout(_resolve, 100)); // Small delay between tests
      }
      
      const successful = tests.filter(t => t.success).length;
      const avgLatency = tests.reduce((_sum, t) => sum + t.latency, 0) / tests.length;
      
      results.push({
        provider: provider.name,
        latency: avgLatency,
        reliability: (successful / tests.length) * 10
      });
    }
    
    return results.sort((_a, b) => a.latency - b.latency);
  }
}

// Export singleton instance
export const dnsOverHTTPSService = new DNSOverHTTPSService();
export default dnsOverHTTPSService;