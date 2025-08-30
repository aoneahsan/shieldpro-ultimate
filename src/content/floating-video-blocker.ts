/**
 * Floating Video Blocker
 * Blocks sticky/floating/picture-in-picture videos that competitors charge for
 */

import { StorageManager } from '../shared/utils/storage';

export class FloatingVideoBlocker {
  private storage = StorageManager.getInstance();
  private observer: MutationObserver | null = null;
  private processedElements = new WeakSet<Element>();
  private tier = 1;
  private blockedCount = 0;

  async init(): Promise<void> {
    const settings = await this.storage.getSettings();
    this.tier = settings.tier?.level || 1;

    // Activate for Tier 1+ (FREE - competitors charge $40/year for this!)
    if (this.tier >= 1 && settings.enabled) {
      this.startBlocking();
      this.injectStyles();
    }

    // Listen for tier updates
    chrome.runtime.onMessage.addListener((_message) => {
      if (message.action === 'tierUpdated' && message.tier >= 1) {
        this.tier = message.tier;
        this.startBlocking();
      }
    });
  }

  private startBlocking(): void {
    // Initial scan
    this.blockFloatingVideos();

    // Set up observer for dynamic content
    if (!this.observer) {
      this.observer = new MutationObserver(() => {
        this.blockFloatingVideos();
      });

      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'id'],
      });
    }

    // Check periodically for sneaky videos
    setInterval(() => this.blockFloatingVideos(), 2000);
  }

  private blockFloatingVideos(): void {
    const selectors = [
      // Generic floating video selectors
      '[class*="sticky-video"]',
      '[class*="sticky-player"]',
      '[class*="floating-video"]',
      '[class*="floating-player"]',
      '[class*="float-video"]',
      '[class*="pip-container"]',
      '[class*="pip-window"]',
      '[class*="miniplayer"]',
      '[class*="mini-player"]',
      '[class*="video-float"]',
      '[class*="video-sticky"]',
      '[class*="corner-video"]',
      '[class*="pinned-video"]',

      // Platform-specific selectors
      '.video-js.vjs-pip-window',
      '.jwplayer.jw-flag-floating',
      '.youtube-player.floating',
      '.brightcove-video-player[style*="fixed"]',
      '.mux-player[style*="fixed"]',
      '.vimeo-player-container[style*="fixed"]',
      '.dailymotion-player[style*="fixed"]',
      '.twitch-player[style*="fixed"]',

      // News sites common patterns
      '.video-container[style*="position: fixed"]',
      '.video-wrapper[style*="position: sticky"]',
      '.media-player[style*="position: fixed"]',
      '.article-video[style*="position: sticky"]',
      '.news-video[style*="position: fixed"]',

      // Position-based selectors
      'div[style*="position: fixed"][style*="bottom"] video',
      'div[style*="position: fixed"][style*="right"] video',
      'div[style*="position: fixed"][style*="z-index"] video',
      'div[style*="position: sticky"] video',
      'div[style*="position: fixed"] iframe[src*="youtube"]',
      'div[style*="position: fixed"] iframe[src*="vimeo"]',
      'div[style*="position: fixed"] iframe[src*="dailymotion"]',
      'div[style*="position: fixed"] iframe[src*="twitch"]',
      'div[style*="position: fixed"] iframe[src*="facebook"]',
      'div[style*="position: fixed"] iframe[src*="twitter"]',

      // Specific news sites
      '#cnn-video-float',
      '.bbc-media-player-floating',
      '.nyt-video-player[data-floating="true"]',
      '.wsj-video-player-sticky',
      '.guardian-video-container--sticky',
      '.foxnews-video-float',
      '.nbcnews-video-sticky',
      '.usatoday-video-float',

      // Ad network video players
      '.outbrain-video-float',
      '.taboola-video-sticky',
      '.revcontent-video-float',
    ];

    selectors.forEach((_selector) => {
      try {
        const elements = document.querySelectorAll(_selector);
        elements.forEach((_element) => {
          if (!this.processedElements.has(_element) && this.isFloatingVideo(_element)) {
            this.processedElements.add(_element);
            this.removeFloatingVideo(_element);
          }
        });
      } catch {
        // Ignore selector errors
      }
    });

    // Also check for videos with computed styles
    this.checkComputedStyles();
  }

  private isFloatingVideo(element: Element): boolean {
    const styles = window.getComputedStyle(_element);
    const position = styles.position;

    // Check if element is floating/sticky
    if (position === 'fixed' || position === 'sticky') {
      // Check if it contains video or is video-related
      const hasVideo =
        element.querySelector('video, iframe') ||
        element.tagName === 'VIDEO' ||
        element.tagName === 'IFRAME';

      if (_hasVideo) {
        // Check position on screen (usually bottom-right)
        const rect = element.getBoundingClientRect();
        const isCorner =
          rect.bottom > window.innerHeight * 0.5 && rect.right > window.innerWidth * 0.5;

        // Check size (floating videos are usually smaller)
        const isSmall =
          rect.width < window.innerWidth * 0.5 && rect.height < window.innerHeight * 0.5;

        return isCorner || isSmall;
      }
    }

    return false;
  }

  private checkComputedStyles(): void {
    // Find all videos and iframes
    const mediaElements = document.querySelectorAll('video, iframe');

    mediaElements.forEach((_element) => {
      const parent = element.parentElement;
      if (parent && !this.processedElements.has(_parent)) {
        if (this.isFloatingVideo(_parent)) {
          this.processedElements.add(_parent);
          this.removeFloatingVideo(_parent);
        }
      }
    });
  }

  private removeFloatingVideo(element: Element): void {
    // Try to remove gracefully first
    const closeButton = element.querySelector(
      '[class*="close"], [class*="dismiss"], [aria-label*="close"]'
    );
    if (closeButton instanceof HTMLElement) {
      closeButton.click();
      this.blockedCount++;
      console.warn('ShieldPro: Closed floating video via button');
      return;
    }

    // Otherwise, hide it
    if (element instanceof HTMLElement) {
      element.style.display = 'none';
      element.style.visibility = 'hidden';
      element.remove();
      this.blockedCount++;
      console.warn('ShieldPro: Removed floating video');
    }

    // Report to extension
    chrome.runtime
      .sendMessage({
        action: 'floatingVideoBlocked',
        count: this.blockedCount,
        domain: window.location.hostname,
      })
      .catch(() => {});
  }

  private injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      /* Hide floating videos - AdBlock Plus charges $40/year for this! */
      [class*="sticky-video"],
      [class*="floating-video"],
      [class*="pip-container"],
      [class*="miniplayer"],
      [class*="video-float"],
      .video-js.vjs-pip-window,
      .jwplayer.jw-flag-floating,
      div[style*="position: fixed"] video,
      div[style*="position: sticky"] video {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
      
      /* Specific news sites floating videos */
      #cnn-video-float,
      .bbc-media-player-floating,
      .nyt-video-player[data-floating="true"],
      .wsj-video-player-sticky {
        display: none !important;
      }
    `;
    document.head.appendChild(_style);
  }

  public getBlockedCount(): number {
    return this.blockedCount;
  }
}

// Export singleton instance
export const floatingVideoBlocker = new FloatingVideoBlocker();
