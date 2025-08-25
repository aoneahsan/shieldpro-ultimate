/**
 * Main Content Script Entry Point
 * Coordinates all content-level blocking and protection features
 */

import { YouTubeAdBlocker } from './youtube-blocker';
import { PopupBlocker } from './popup-blocker';
import { ElementPicker } from './element-picker';
import { PrivacyProtector } from './privacy-protection';
import { CookieConsentHandler } from './cookie-consent-handler';

class ContentScriptManager {
  private youtubeBlocker?: YouTubeAdBlocker;
  private popupBlocker: PopupBlocker;
  private elementPicker: ElementPicker;
  private privacyProtector: PrivacyProtector;
  private cookieConsentHandler: CookieConsentHandler;
  private currentTier: number = 1;

  constructor() {
    this.popupBlocker = new PopupBlocker();
    this.elementPicker = new ElementPicker();
    this.privacyProtector = new PrivacyProtector();
    this.cookieConsentHandler = new CookieConsentHandler();
    
    this.initialize();
  }

  private async initialize() {
    // Get current tier from storage
    const result = await chrome.storage.local.get(['settings']);
    this.currentTier = result.settings?.tier?.level || 1;

    // Initialize tier 1 features (always active)
    this.initializeTier1();

    // Initialize higher tier features based on current tier
    if (this.currentTier >= 2) {
      this.initializeTier2();
    }
    if (this.currentTier >= 3) {
      this.initializeTier3();
    }
    if (this.currentTier >= 4) {
      this.initializeTier4();
    }

    // Listen for tier updates
    this.listenForTierUpdates();
  }

  private initializeTier1() {
    // Basic ad blocking (handled by declarativeNetRequest)
    // Popup blocking
    this.popupBlocker.init();
    
    // Cookie consent auto-rejection
    this.cookieConsentHandler.init();
    
    // Basic element hiding
    this.injectBasicStyles();
  }

  private initializeTier2() {
    // YouTube ad blocking - DISABLED to prevent breaking YouTube
    // Will rely on declarativeNetRequest API instead
    // if (window.location.hostname.includes('youtube.com')) {
    //   this.youtubeBlocker = new YouTubeAdBlocker();
    //   this.youtubeBlocker.init();
    // }

    // Enhanced tracking protection
    this.privacyProtector.enableTrackingProtection();
  }

  private initializeTier3() {
    // Enable element picker
    this.elementPicker.enable();
    
    // Load custom filters
    this.loadCustomFilters();
  }

  private initializeTier4() {
    // Enhanced privacy features
    this.privacyProtector.enableAdvancedProtection();
    
    // Load regex patterns
    this.loadRegexPatterns();
  }

  private injectBasicStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Basic ad hiding rules - simplified to avoid breaking sites */
      .google-ads, .googleads,
      .ad-container, .ad-wrapper,
      .advertisement-container,
      iframe[src*="doubleclick.net"],
      iframe[src*="googlesyndication.com"] {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        width: 0 !important;
      }
    `;
    document.head.appendChild(style);
  }

  private async loadCustomFilters() {
    const result = await chrome.storage.local.get(['customFilters']);
    const filters = result.customFilters || [];
    
    if (filters.length > 0) {
      const style = document.createElement('style');
      style.id = 'shieldpro-custom-filters';
      style.textContent = filters
        .filter((f: any) => f.enabled)
        .map((f: any) => `${f.selector} { display: none !important; }`)
        .join('\n');
      document.head.appendChild(style);
    }
  }

  private async loadRegexPatterns() {
    const result = await chrome.storage.local.get(['regexPatterns']);
    const patterns = result.regexPatterns || [];
    
    patterns.filter((p: any) => p.enabled).forEach((pattern: any) => {
      try {
        const regex = new RegExp(pattern.pattern, pattern.flags);
        
        // Apply regex to current page content
        if (pattern.category === 'content') {
          this.applyContentRegex(regex, pattern.action);
        } else if (pattern.category === 'url') {
          this.applyUrlRegex(regex, pattern.action);
        }
      } catch (error) {
        console.error('Invalid regex pattern:', pattern.pattern);
      }
    });
  }

  private applyContentRegex(regex: RegExp, action: string) {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node;
    while (node = walker.nextNode()) {
      if (node.textContent && regex.test(node.textContent)) {
        if (action === 'block' && node.parentElement) {
          node.parentElement.style.display = 'none';
        }
      }
    }
  }

  private applyUrlRegex(regex: RegExp, action: string) {
    // Check all links and iframes
    document.querySelectorAll('a[href], iframe[src]').forEach(element => {
      const url = element.getAttribute('href') || element.getAttribute('src');
      if (url && regex.test(url)) {
        if (action === 'block') {
          element.remove();
        }
      }
    });
  }

  private listenForTierUpdates() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'tierUpdated') {
        this.currentTier = request.tier;
        this.initialize(); // Reinitialize with new tier
      } else if (request.action === 'customFiltersUpdated') {
        this.loadCustomFilters();
      } else if (request.action === 'regexPatternsUpdated') {
        this.loadRegexPatterns();
      } else if (request.action === 'activateElementPicker') {
        this.elementPicker.activate();
      } else if (request.action === 'testSelector') {
        const elements = document.querySelectorAll(request.selector);
        sendResponse({ matchCount: elements.length });
      }
    });
  }

  // Public method to get blocked count
  public getBlockedCount(): number {
    return this.popupBlocker.getBlockedCount();
  }
}

// Initialize content script manager
const contentManager = new ContentScriptManager();

// Report to background script when ads are blocked
let blockedCount = 0;
const observer = new MutationObserver(() => {
  const hiddenElements = document.querySelectorAll('[style*="display: none !important"]');
  if (hiddenElements.length > blockedCount) {
    const newBlocks = hiddenElements.length - blockedCount;
    blockedCount = hiddenElements.length;
    
    chrome.runtime.sendMessage({
      action: 'adBlocked',
      count: newBlocks,
      domain: window.location.hostname,
      category: 'ads'
    }).catch(() => {
      // Ignore errors if extension context is invalidated
    });
  }
});

// Wait for document.body to be available before observing
if (document.body) {
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
} else {
  // If body is not ready yet, wait for it
  const waitForBody = setInterval(() => {
    if (document.body) {
      clearInterval(waitForBody);
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }, 100);
}

export { ContentScriptManager };