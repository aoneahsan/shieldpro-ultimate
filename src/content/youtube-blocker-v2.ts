/**
 * Advanced YouTube Ad Blocker
 * Based on successful ad blocker patterns like uBlock Origin and AdBlock Plus
 * Focuses on safe, effective blocking without breaking functionality
 */

export class YouTubeAdBlockerV2 {
  private observer: MutationObserver | null = null;
  private skipButtonTimer: number | null = null;
  private isActive = false;
  private blockedElements = new WeakSet();
  
  // Comprehensive ad selectors based on successful ad blockers
  private readonly adSelectors = {
    // Video ads (most important)
    videoAds: [
      // Primary video ad containers
      '.video-ads',
      '.ytp-ad-module',
      '.ytp-ad-player-overlay',
      '.ytp-ad-overlay-container',
      '.ytp-ad-text-overlay',
      '.ytp-ad-image-overlay',
      
      // YouTube-specific ad components  
      'ytd-player-legacy-desktop-watch-ads-renderer',
      'ytd-action-companion-ad-renderer',
      'ytd-display-ad-renderer',
      'ytd-video-masthead-ad-v3-renderer',
      'ytd-promoted-sparkles-web-renderer',
      
      // Ad overlays and popups
      '.ytp-ad-overlay-slot',
      '.ytp-ad-skip-button-container',
      '.ytp-ad-button-container',
      '#movie_player .videoAdUi',
      '.html5-endscreen-content .videowall-endscreen-element-video-ad'
    ],
    
    // Sidebar and companion ads
    companionAds: [
      'ytd-companion-slot-renderer',
      'ytd-action-companion-ad-renderer', 
      '#player-ads',
      '#watch7-sidebar-ads',
      '.ytd-merch-shelf-renderer',
      'ytd-shopping-shelf-renderer'
    ],
    
    // Feed/homepage ads
    feedAds: [
      'ytd-ad-slot-renderer',
      'ytd-in-feed-ad-layout-renderer',
      'ytd-statement-banner-renderer',
      'ytd-banner-promo-renderer-background',
      'ytd-primetime-promo-renderer',
      'ytd-carousel-ad-renderer',
      
      // Rich section ads
      'ytd-rich-section-renderer:has([data-content-type="ad"])',
      'ytd-rich-item-renderer:has(ytd-display-ad-renderer)',
      'ytd-rich-item-renderer:has(ytd-in-feed-ad-layout-renderer)'
    ],
    
    // Masthead and header ads
    mastheadAds: [
      'ytd-masthead-ad-v3-renderer',
      'ytd-video-masthead-ad-primary-video-renderer',
      'ytd-video-masthead-ad-advertiser-info-renderer',
      '#masthead-ad',
      '.ytd-rich-grid-masthead-renderer'
    ]
  };

  // Skip button selectors for faster ad skipping
  private readonly skipButtonSelectors = [
    '.ytp-ad-skip-button',
    '.ytp-ad-skip-button-modern',
    '.ytp-skip-ad-button',
    'button.ytp-ad-skip-button-container'
  ];

  // Elements that should never be blocked (safety list)
  private readonly safeElements = [
    'ytd-app',
    'ytd-page-manager', 
    'ytd-watch-flexy',
    'ytd-player',
    '#movie_player video',
    '.html5-video-container',
    '.video-stream',
    '.ytp-chrome-bottom',
    '.ytp-chrome-top',
    '.ytp-progress-bar-container',
    'ytd-watch-metadata'
  ];

  init(): void {
    if (this.isActive || !this.isYouTube()) return;
    
    this.isActive = true;
    console.warn('🛡️ YouTube Ad Blocker V2 initialized');
    
    // Initial cleanup
    this.removeExistingAds();
    
    // Set up observer for dynamic content
    this.startObserver();
    
    // Set up skip button acceleration
    this.setupSkipButtonHandler();
    
    // Handle navigation changes (YouTube is SPA)
    this.handleNavigationChanges();
  }

  destroy(): void {
    this.isActive = false;
    
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    if (this.skipButtonTimer) {
      clearTimeout(this.skipButtonTimer);
      this.skipButtonTimer = null;
    }
    
    console.warn('🛡️ YouTube Ad Blocker V2 destroyed');
  }

  private isYouTube(): boolean {
    return window.location.hostname.includes('youtube.com') || 
           window.location.hostname.includes('youtu.be');
  }

  private removeExistingAds(): void {
    // Process all ad categories
    Object.entries(this.adSelectors).forEach(([category, selectors]) => {
      selectors.forEach(selector => {
        this.removeAdElements(_selector, category);
      });
    });
  }

  private removeAdElements(selector: string, category: string): void {
    try {
      const elements = document.querySelectorAll(_selector);
      
      elements.forEach(element => {
        // Safety check - never block essential elements
        if (this.isSafeElement(_element)) return;
        
        // Check if already processed
        if (this.blockedElements.has(_element)) return;
        
        // Mark as processed
        this.blockedElements.add(_element);
        
        // Remove the ad element safely
        this.safeRemoveElement(element as HTMLElement, category);
      });
      
      if (elements.length > 0) {
        console.warn(`🚫 Blocked ${elements.length} ${category} ad(_s)`);
      }
    } catch (_error) {
      // Fail silently to avoid breaking the page
      console.debug(`Error removing ${selector}:`, error);
    }
  }

  private isSafeElement(element: Element): boolean {
    // Check if element or its parents are in safe list
    let current: Element | null = element;
    
    while (_current) {
      const tagName = current.tagName?.toLowerCase();
      const className = current.className;
      const id = current.id;
      
      // Check against safe selectors
      for (const safeSelector of this.safeElements) {
        if (safeSelector.startsWith('#') && id === safeSelector.slice(1)) return true;
        if (safeSelector.startsWith('.') && className.includes(safeSelector.slice(1))) return true;
        if (tagName === safeSelector) return true;
        if (current.matches?.(_safeSelector)) return true;
      }
      
      current = current.parentElement;
    }
    
    return false;
  }

  private safeRemoveElement(element: HTMLElement, category: string): void {
    try {
      // For video ads, hide first to test impact
      if (category === 'videoAds') {
        element.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; height: 0 !important; width: 0 !important;';
        
        // Remove after a short delay to ensure no critical functionality is affected
        setTimeout(() => {
          if (element.parentNode && !this.isVideoPlaying()) {
            element.remove();
          }
        }, 100);
      } else {
        // Non-video ads can be removed immediately
        element.style.display = 'none';
        element.remove();
      }
    } catch (_error) {
      console.debug('Safe removal failed:', error);
    }
  }

  private isVideoPlaying(): boolean {
    try {
      const video = document.querySelector('video.html5-main-video') as HTMLVideoElement;
      return video && !video.paused && video.currentTime > 0;
    } catch {
      return false;
    }
  }

  private startObserver(): void {
    if (this.observer) return;
    
    this.observer = new MutationObserver((_mutations) => {
      let shouldProcess = false;
      
      // Check if we need to process changes
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldProcess = true;
          break;
        }
      }
      
      if (_shouldProcess) {
        // Throttle processing to avoid performance issues
        this.throttledAdRemoval();
      }
    });
    
    // Start observing with minimal impact
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });
  }

  private throttledAdRemoval = this.throttle(() => {
    this.removeExistingAds();
    this.checkForSkipButton();
  }, 500);

  private setupSkipButtonHandler(): void {
    // Check for skip buttons more frequently
    const checkInterval = setInterval(() => {
      if (!this.isActive) {
        clearInterval(_checkInterval);
        return;
      }
      this.checkForSkipButton();
    }, 250);
  }

  private checkForSkipButton(): void {
    this.skipButtonSelectors.forEach(selector => {
      const skipButton = document.querySelector(_selector) as HTMLElement;
      
      if (skipButton && skipButton.offsetParent !== null) {
        // Click skip button immediately
        setTimeout(() => {
          if (skipButton && typeof skipButton.click === 'function') {
            skipButton.click();
            console.warn('⏭️ Auto-skipped ad');
          }
        }, 50);
      }
    });
  }

  private handleNavigationChanges(): void {
    // YouTube is a SPA, so we need to handle navigation
    let lastUrl = location.href;
    
    const urlObserver = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        
        // Re-initialize after navigation
        setTimeout(() => {
          if (this.isActive) {
            this.removeExistingAds();
          }
        }, 1000);
      }
    });
    
    urlObserver.observe(document.body, { childList: true, subtree: true });
  }

  // Utility function for throttling
  private throttle<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: number | null = null;
    
    return (...args: Parameters<T>) => {
      if (_timeout) clearTimeout(_timeout);
      
      timeout = window.setTimeout(() => {
        timeout = null;
        func.apply(_this, args);
      }, _wait);
    };
  }

  // Public method to get blocking stats
  getStats(): { blockedAds: number; isActive: boolean } {
    return {
      blockedAds: this.blockedElements.size || 0,
      isActive: this.isActive
    };
  }
}