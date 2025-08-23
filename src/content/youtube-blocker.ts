import { StorageManager } from '../shared/utils/storage';

class YouTubeAdBlocker {
  private storage = StorageManager.getInstance();
  private observer: MutationObserver | null = null;
  private adSkipTimer: NodeJS.Timeout | null = null;
  private isEnabled = false;
  private adSelectors = {
    // Video ad containers
    videoAds: [
      '.video-ads',
      '.ytp-ad-module',
      '.ytp-ad-overlay-container',
      '.ytp-ad-player-overlay',
      'ytd-player-legacy-desktop-watch-ads-renderer',
      'ytd-action-companion-ad-renderer',
      'ytd-display-ad-renderer',
      'ytd-video-masthead-ad-advertiser-info-renderer',
      'ytd-video-masthead-ad-primary-video-renderer',
      'ytd-in-feed-ad-layout-renderer',
      'ytd-ad-slot-renderer',
      'ytd-banner-promo-renderer',
      'ytd-statement-banner-renderer',
      'ytd-masthead-ad-v3-renderer',
      'ytd-primetime-promo-renderer'
    ],
    // Sidebar ads
    sidebarAds: [
      'ytd-companion-slot-renderer',
      'ytd-promoted-video-renderer',
      'ytd-compact-promoted-video-renderer',
      '#player-ads',
      '#masthead-ad',
      '#homepage-chrome-side-promo',
      '#watch-channel-brand-div',
      '#watch7-sidebar-ads'
    ],
    // In-feed ads
    feedAds: [
      'ytd-rich-item-renderer:has(ytd-display-ad-renderer)',
      'ytd-rich-item-renderer:has(ytd-in-feed-ad-layout-renderer)',
      'ytd-rich-section-renderer:has(ytd-statement-banner-renderer)',
      'ytd-feed-nudge-renderer',
      'ytm-promoted-sparkles-web-renderer'
    ],
    // Popup and overlay ads
    overlayAds: [
      '.ytp-ad-overlay-slot',
      '.ytp-ad-overlay-container',
      '.ytp-ad-overlay-close-button',
      '.ytp-ad-overlay-image',
      '.ytp-ad-text-overlay',
      'tp-yt-paper-dialog:has(ytd-mealbar-promo-renderer)',
      'yt-mealbar-promo-renderer',
      'ytd-popup-container'
    ]
  };

  async init(): Promise<void> {
    const settings = await this.storage.getSettings();
    if (settings.tier >= 2 && settings.enabled) {
      this.isEnabled = true;
      this.startBlocking();
    }

    // Listen for settings changes
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'settingsUpdated') {
        if (message.settings.tier >= 2 && message.settings.enabled) {
          if (!this.isEnabled) {
            this.isEnabled = true;
            this.startBlocking();
          }
        } else {
          this.isEnabled = false;
          this.stopBlocking();
        }
      }
    });
  }

  private startBlocking(): void {
    // Initial cleanup
    this.removeAds();
    this.skipVideoAds();
    this.blockAdRequests();

    // Set up mutation observer
    this.observer = new MutationObserver(() => {
      this.removeAds();
      this.skipVideoAds();
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Check for video ads periodically
    this.adSkipTimer = setInterval(() => {
      this.skipVideoAds();
      this.removeAds();
    }, 1000);

    // Inject CSS to hide ads
    this.injectCSS();

    // Override YouTube's ad-related functions
    this.overrideYouTubeFunctions();
  }

  private stopBlocking(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.adSkipTimer) {
      clearInterval(this.adSkipTimer);
      this.adSkipTimer = null;
    }
  }

  private removeAds(): void {
    // Remove all types of ads
    Object.values(this.adSelectors).flat().forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el) {
          el.remove();
          // Track removed ad
          chrome.runtime.sendMessage({
            action: 'adBlocked',
            category: 'youtube',
            domain: 'youtube.com'
          });
        }
      });
    });

    // Remove ads by class patterns
    const adPatterns = [
      '[class*="ad-"]',
      '[class*="ads-"]',
      '[class*="promoted"]',
      '[class*="sponsor"]',
      '[id*="ad-"]',
      '[id*="ads-"]'
    ];

    adPatterns.forEach(pattern => {
      const elements = document.querySelectorAll(pattern);
      elements.forEach(el => {
        const classList = el.className.toString().toLowerCase();
        const idList = el.id.toLowerCase();
        if ((classList.includes('ad-') || classList.includes('ads-') || 
             classList.includes('promoted') || classList.includes('sponsor') ||
             idList.includes('ad-') || idList.includes('ads-')) &&
            !classList.includes('load') && !classList.includes('add')) {
          el.remove();
        }
      });
    });
  }

  private skipVideoAds(): void {
    // Skip video ads automatically
    const video = document.querySelector('video') as HTMLVideoElement;
    const adIndicator = document.querySelector('.ytp-ad-player-overlay');
    const skipButton = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern') as HTMLElement;
    const adText = document.querySelector('.ytp-ad-text');

    if (adIndicator || adText) {
      if (skipButton) {
        skipButton.click();
        chrome.runtime.sendMessage({
          action: 'adBlocked',
          category: 'youtube',
          domain: 'youtube.com'
        });
      } else if (video) {
        // If no skip button, try to skip by seeking to end
        if (video.duration && isFinite(video.duration)) {
          video.currentTime = video.duration;
        }
        // Or mute and speed up the ad
        video.muted = true;
        video.playbackRate = 16; // Maximum speed
      }
    }

    // Click on "Skip Ad" text if present
    const skipAdText = Array.from(document.querySelectorAll('*')).find(el => 
      el.textContent?.trim() === 'Skip Ad' || 
      el.textContent?.trim() === 'Skip Ads'
    ) as HTMLElement;
    
    if (skipAdText) {
      skipAdText.click();
    }
  }

  private blockAdRequests(): void {
    // Intercept and block XHR requests to ad endpoints
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method: string, url: string, ...args: any[]) {
      const blockedPatterns = [
        '/api/stats/ads',
        '/api/stats/qoe',
        '/pagead/',
        '/ptracking',
        '/get_midroll_',
        '/youtubei/v1/log_event',
        '/csi_204',
        '/generate_204'
      ];

      if (blockedPatterns.some(pattern => url.includes(pattern))) {
        chrome.runtime.sendMessage({
          action: 'adBlocked',
          category: 'youtube',
          domain: 'youtube.com'
        });
        return; // Block the request
      }

      return originalOpen.apply(this, [method, url, ...args] as any);
    };

    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : input.toString();
      const blockedPatterns = [
        '/api/stats/ads',
        '/api/stats/qoe',
        '/pagead/',
        '/ptracking',
        '/get_midroll_',
        '/youtubei/v1/log_event'
      ];

      if (blockedPatterns.some(pattern => url.includes(pattern))) {
        chrome.runtime.sendMessage({
          action: 'adBlocked',
          category: 'youtube',
          domain: 'youtube.com'
        });
        return Promise.reject(new Error('Blocked by ShieldPro'));
      }

      return originalFetch.apply(this, [input, init] as any);
    };
  }

  private injectCSS(): void {
    const style = document.createElement('style');
    style.textContent = `
      /* Hide all YouTube ads */
      .video-ads,
      .ytp-ad-module,
      .ytp-ad-overlay-container,
      .ytp-ad-player-overlay,
      ytd-player-legacy-desktop-watch-ads-renderer,
      ytd-action-companion-ad-renderer,
      ytd-display-ad-renderer,
      ytd-video-masthead-ad-advertiser-info-renderer,
      ytd-video-masthead-ad-primary-video-renderer,
      ytd-in-feed-ad-layout-renderer,
      ytd-ad-slot-renderer,
      ytd-banner-promo-renderer,
      ytd-statement-banner-renderer,
      ytd-masthead-ad-v3-renderer,
      ytd-primetime-promo-renderer,
      ytd-companion-slot-renderer,
      ytd-promoted-video-renderer,
      ytd-compact-promoted-video-renderer,
      #player-ads,
      #masthead-ad,
      #homepage-chrome-side-promo,
      #watch-channel-brand-div,
      #watch7-sidebar-ads,
      .ytp-ad-overlay-slot,
      .ytp-ad-overlay-image,
      .ytp-ad-text-overlay,
      ytd-mealbar-promo-renderer,
      yt-mealbar-promo-renderer,
      ytd-popup-container:has(ytd-mealbar-promo-renderer),
      tp-yt-paper-dialog:has(ytd-mealbar-promo-renderer),
      ytd-feed-nudge-renderer,
      ytm-promoted-sparkles-web-renderer,
      ytd-rich-item-renderer:has(ytd-display-ad-renderer),
      ytd-rich-item-renderer:has(ytd-in-feed-ad-layout-renderer),
      ytd-rich-section-renderer:has(ytd-statement-banner-renderer) {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        width: 0 !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }

      /* Remove ad placeholders */
      .ytp-ad-preview-container,
      .ytp-ad-message-container {
        display: none !important;
      }

      /* Hide "Ad" badges */
      .ytp-ad-badge,
      .ytp-ad-badge-container {
        display: none !important;
      }

      /* Hide ad duration and skip button area when no ad */
      .ytp-ad-duration-remaining,
      .ytp-ad-skip-button-container:empty {
        display: none !important;
      }

      /* Clean up empty spaces left by ads */
      ytd-rich-grid-renderer #contents:has(ytd-ad-slot-renderer) {
        gap: 0 !important;
      }
    `;
    document.head.appendChild(style);
  }

  private overrideYouTubeFunctions(): void {
    // Override YouTube's internal ad-related functions
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        // Block YouTube's ad-related objects
        if (window.ytInitialPlayerResponse && window.ytInitialPlayerResponse.adPlacements) {
          delete window.ytInitialPlayerResponse.adPlacements;
        }

        // Override ad-related properties
        Object.defineProperty(window, 'ytInitialPlayerResponse', {
          get: function() {
            return this._ytInitialPlayerResponse;
          },
          set: function(value) {
            if (value && value.adPlacements) {
              delete value.adPlacements;
            }
            if (value && value.playerAds) {
              delete value.playerAds;
            }
            this._ytInitialPlayerResponse = value;
          }
        });

        // Remove ads from player config
        const originalPlayerConfig = window.ytplayer?.config;
        if (originalPlayerConfig) {
          if (originalPlayerConfig.args?.ad3_module) {
            delete originalPlayerConfig.args.ad3_module;
          }
          if (originalPlayerConfig.args?.ad_device) {
            delete originalPlayerConfig.args.ad_device;
          }
          if (originalPlayerConfig.args?.ad_flags) {
            delete originalPlayerConfig.args.ad_flags;
          }
          if (originalPlayerConfig.args?.ad_logging_flag) {
            delete originalPlayerConfig.args.ad_logging_flag;
          }
          if (originalPlayerConfig.args?.ad_preroll) {
            delete originalPlayerConfig.args.ad_preroll;
          }
          if (originalPlayerConfig.args?.ad_tag) {
            delete originalPlayerConfig.args.ad_tag;
          }
        }

        // Block YouTube ad-related API calls
        const originalSetTimeout = window.setTimeout;
        window.setTimeout = function(func, delay, ...args) {
          const funcString = func.toString();
          if (funcString.includes('ad') || funcString.includes('Ad') || funcString.includes('AD')) {
            return -1; // Return invalid timer ID
          }
          return originalSetTimeout.apply(this, [func, delay, ...args]);
        };
      })();
    `;
    document.documentElement.appendChild(script);
    script.remove();
  }
}

// Initialize YouTube ad blocker when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const blocker = new YouTubeAdBlocker();
    blocker.init();
  });
} else {
  const blocker = new YouTubeAdBlocker();
  blocker.init();
}

export { YouTubeAdBlocker };