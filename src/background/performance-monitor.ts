interface PerformanceMetrics {
  blockedRequests: number;
  blockingTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkSaved: number;
  tier: number;
  timestamp: number;
}

interface TierMetrics {
  tier1: PerformanceMetrics;
  tier2: PerformanceMetrics;
  overall: PerformanceMetrics;
}

export class PerformanceMonitor {
  private metrics: TierMetrics = {
    tier1: this.createEmptyMetrics(1),
    tier2: this.createEmptyMetrics(2),
    overall: this.createEmptyMetrics(0)
  };

  private startTime = Date.now();
  private requestTimings = new Map<string, number>();
  private blockingSizes = new Map<string, number>();

  constructor() {
    this.initializeMonitoring();
  }

  private createEmptyMetrics(tier: number): PerformanceMetrics {
    return {
      blockedRequests: 0,
      blockingTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      networkSaved: 0,
      tier,
      timestamp: Date.now()
    };
  }

  private initializeMonitoring(): void {
    // Monitor memory usage
    if (chrome.runtime && chrome.runtime.getManifest) {
      setInterval(() => this.updateMemoryUsage(), 30000);
    }

    // Monitor blocking performance
    this.setupBlockingMonitor();

    // Save metrics periodically
    setInterval(() => this.saveMetrics(), 60000);
  }

  private async updateMemoryUsage(): Promise<void> {
    try {
      // Get memory usage if available
      if (chrome.system && chrome.system.memory) {
        chrome.system.memory.getInfo((info) => {
          const usedMemory = info.capacity - info.availableCapacity;
          const usagePercent = (usedMemory / info.capacity) * 100;
          
          this.metrics.overall.memoryUsage = usagePercent;
        });
      }
    } catch (error) {
      console.error('Failed to get memory usage:', error);
    }
  }

  private setupBlockingMonitor(): void {
    // Monitor declarativeNetRequest performance
    if (chrome.declarativeNetRequest && chrome.declarativeNetRequest.onRuleMatchedDebug) {
      chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(async (info) => {
        const startTime = performance.now();
        
        // Track which tier's rule was matched
        const ruleId = info.rule.ruleId;
        const tier = this.getRuleTier(ruleId);
        
        // Calculate blocking time
        const blockingTime = performance.now() - startTime;
        
        // Update metrics
        if (tier === 1) {
          this.metrics.tier1.blockedRequests++;
          this.metrics.tier1.blockingTime += blockingTime;
        } else if (tier === 2) {
          this.metrics.tier2.blockedRequests++;
          this.metrics.tier2.blockingTime += blockingTime;
        }
        
        this.metrics.overall.blockedRequests++;
        this.metrics.overall.blockingTime += blockingTime;
        
        // Estimate network saved (average ad size)
        const estimatedSize = this.estimateRequestSize(info.request.url);
        this.metrics.overall.networkSaved += estimatedSize;
        
        if (tier === 1) {
          this.metrics.tier1.networkSaved += estimatedSize;
        } else if (tier === 2) {
          this.metrics.tier2.networkSaved += estimatedSize;
        }
        
        // Track timing
        this.requestTimings.set(info.request.url, blockingTime);
      });
    }
  }

  private getRuleTier(ruleId: number): number {
    // Rules 1-99 are Tier 1
    if (ruleId < 100) return 1;
    // Rules 100-199 are Tier 2
    if (ruleId < 200) return 2;
    // Rules 200+ are higher tiers
    return Math.floor(ruleId / 100) + 1;
  }

  private estimateRequestSize(url: string): number {
    // Estimate sizes based on content type
    if (url.includes('video') || url.includes('youtube')) {
      return 500000; // 500KB for video ads
    }
    if (url.includes('.js')) {
      return 50000; // 50KB for scripts
    }
    if (url.includes('.css')) {
      return 20000; // 20KB for styles
    }
    if (url.includes('image') || url.includes('.jpg') || url.includes('.png')) {
      return 100000; // 100KB for images
    }
    if (url.includes('tracking') || url.includes('analytics')) {
      return 10000; // 10KB for tracking pixels
    }
    return 30000; // 30KB average
  }

  public getMetrics(): TierMetrics {
    // Calculate averages
    const overall = this.metrics.overall;
    if (overall.blockedRequests > 0) {
      overall.cpuUsage = overall.blockingTime / overall.blockedRequests;
    }

    const tier1 = this.metrics.tier1;
    if (tier1.blockedRequests > 0) {
      tier1.cpuUsage = tier1.blockingTime / tier1.blockedRequests;
    }

    const tier2 = this.metrics.tier2;
    if (tier2.blockedRequests > 0) {
      tier2.cpuUsage = tier2.blockingTime / tier2.blockedRequests;
    }

    return this.metrics;
  }

  public getPerformanceReport(): string {
    const metrics = this.getMetrics();
    const runTime = Date.now() - this.startTime;
    const hours = Math.floor(runTime / 3600000);
    const minutes = Math.floor((runTime % 3600000) / 60000);

    return `
=== ShieldPro Performance Report ===
Runtime: ${hours}h ${minutes}m

Overall Performance:
• Total Blocked: ${metrics.overall.blockedRequests.toLocaleString()}
• Network Saved: ${this.formatBytes(metrics.overall.networkSaved)}
• Avg Blocking Time: ${metrics.overall.cpuUsage.toFixed(2)}ms
• Memory Usage: ${metrics.overall.memoryUsage.toFixed(1)}%

Tier 1 Performance:
• Requests Blocked: ${metrics.tier1.blockedRequests.toLocaleString()}
• Network Saved: ${this.formatBytes(metrics.tier1.networkSaved)}
• Avg Response: ${metrics.tier1.cpuUsage.toFixed(2)}ms

Tier 2 Performance:
• Requests Blocked: ${metrics.tier2.blockedRequests.toLocaleString()}
• Network Saved: ${this.formatBytes(metrics.tier2.networkSaved)}
• Avg Response: ${metrics.tier2.cpuUsage.toFixed(2)}ms
• YouTube Ads Blocked: ${this.countYouTubeBlocks()}
• Trackers Blocked: ${this.countTrackerBlocks()}

Efficiency:
• Requests/Hour: ${Math.round(metrics.overall.blockedRequests / hours).toLocaleString()}
• Data Saved/Hour: ${this.formatBytes(metrics.overall.networkSaved / hours)}
• Performance Impact: ${this.getPerformanceImpact()}
    `;
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1073741824).toFixed(2) + ' GB';
  }

  private countYouTubeBlocks(): string {
    let count = 0;
    this.requestTimings.forEach((time, url) => {
      if (url.includes('youtube.com')) count++;
    });
    return count.toLocaleString();
  }

  private countTrackerBlocks(): string {
    let count = 0;
    this.requestTimings.forEach((time, url) => {
      if (url.includes('analytics') || url.includes('tracking') || 
          url.includes('facebook') || url.includes('twitter')) {
        count++;
      }
    });
    return count.toLocaleString();
  }

  private getPerformanceImpact(): string {
    const avgTime = this.metrics.overall.cpuUsage;
    if (avgTime < 0.5) return 'Negligible (< 0.5ms)';
    if (avgTime < 1) return 'Very Low (< 1ms)';
    if (avgTime < 5) return 'Low (< 5ms)';
    if (avgTime < 10) return 'Moderate (< 10ms)';
    return 'High (> 10ms)';
  }

  private async saveMetrics(): Promise<void> {
    try {
      const data = {
        metrics: this.metrics,
        report: this.getPerformanceReport(),
        timestamp: Date.now()
      };
      
      await chrome.storage.local.set({ performanceMetrics: data });
    } catch (error) {
      console.error('Failed to save performance metrics:', error);
    }
  }

  public async loadMetrics(): Promise<void> {
    try {
      const result = await chrome.storage.local.get('performanceMetrics');
      if (result.performanceMetrics) {
        this.metrics = result.performanceMetrics.metrics;
      }
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
    }
  }

  public resetMetrics(): void {
    this.metrics = {
      tier1: this.createEmptyMetrics(1),
      tier2: this.createEmptyMetrics(2),
      overall: this.createEmptyMetrics(0)
    };
    this.requestTimings.clear();
    this.blockingSizes.clear();
    this.startTime = Date.now();
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();