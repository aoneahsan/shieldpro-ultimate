/**
 * Main Content Script Entry Point
 * Coordinates all content-level blocking and protection features
 */

import { YouTubeAdBlockerV2 } from './youtube-blocker-v2';
import { PopupBlocker } from './popup-blocker';
import { AggressivePopupBlocker } from './aggressive-popup-blocker';
import { ElementPicker } from './element-picker';
import { PrivacyProtector } from './privacy-protection';
import { CookieConsentHandler } from './cookie-consent-handler';
import { FloatingVideoBlocker } from './floating-video-blocker';

class ContentScriptManager {
  private youtubeBlocker?: YouTubeAdBlockerV2;
  private popupBlocker: PopupBlocker;
  private aggressivePopupBlocker: AggressivePopupBlocker;
  private elementPicker: ElementPicker;
  private privacyProtector: PrivacyProtector;
  private cookieConsentHandler: CookieConsentHandler;
  private floatingVideoBlocker: FloatingVideoBlocker;
  private currentTier: number = 1;
  private isEarlyAdopter: boolean = false;

  constructor() {
    // Initialize aggressive popup blocker first (runs earliest)
    this.aggressivePopupBlocker = new AggressivePopupBlocker();
    this.popupBlocker = new PopupBlocker();
    this.elementPicker = new ElementPicker();
    this.privacyProtector = new PrivacyProtector();
    this.cookieConsentHandler = new CookieConsentHandler();
    this.floatingVideoBlocker = new FloatingVideoBlocker();
    
    this.initialize();
  }

  private async initialize() {
    // Get current tier and early adopter status from storage
    const result = await chrome.storage.local.get(['settings', 'earlyAdopterStatus']);
    this.currentTier = result.settings?.tier?.level || 1;
    this.isEarlyAdopter = result.earlyAdopterStatus?.isEarlyAdopter || false;

    // Initialize tier 1 features (always active)
    this.initializeTier1();

    // Initialize higher tier features based on current tier or early adopter status
    if (this.isEarlyAdopter || this.currentTier >= 2) {
      this.initializeTier2();
    }
    if (this.isEarlyAdopter || this.currentTier >= 3) {
      this.initializeTier3();
    }
    if (this.isEarlyAdopter || this.currentTier >= 4) {
      this.initializeTier4();
    }

    // Listen for tier updates
    this.listenForTierUpdates();
  }

  private initializeTier1() {
    // Basic ad blocking (handled by declarativeNetRequest)
    // Popup blocking
    this.popupBlocker.init();
    
    // Cookie consent auto-rejection (FREE - competitors charge $40/year!)
    this.cookieConsentHandler.init();
    
    // Floating video blocking (FREE - AdBlock Plus Premium feature!)
    this.floatingVideoBlocker.init();
    
    // Basic element hiding
    this.injectBasicStyles();
  }

  private initializeTier2() {
    // Safe YouTube ad blocking with V2 implementation
    if (window.location.hostname.includes('youtube.com')) {
      // Inject YouTube-specific CSS
      this.injectYouTubeStyles();
      
      this.youtubeBlocker = new YouTubeAdBlockerV2();
      // Initialize after DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.youtubeBlocker?.init();
        });
      } else {
        this.youtubeBlocker.init();
      }
    }

    // Enhanced tracking protection
    this.privacyProtector.enableTrackingProtection();
  }

  private initializeTier3() {
    // Enable element picker
    this.elementPicker.enable();
    
    // Load custom filters
    this.loadCustomFilters();
    
    // Image swap feature is initialized automatically through imageSwapper
    // It loads its own settings from storage
    console.warn('ShieldPro Ultimate - Tier 3 features enabled (Element Picker, Custom Filters, Image Swap)');
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
      /* Aggressive ad hiding rules */
      
      /* Common ad containers */
      [id*="ad"], [id*="Ad"], [id*="AD"],
      [class*="ad-"], [class*="Ad-"], [class*="_ad_"],
      [class*="advertisement"], [class*="Advertisement"],
      [class*="adsense"], [class*="AdSense"],
      [class*="google-ad"], [class*="googlead"],
      [class*="banner"], [class*="Banner"],
      [class*="popup"], [class*="Popup"],
      [class*="popunder"], [class*="modal-ad"],
      [class*="sponsored"], [class*="Sponsored"],
      [class*="promo"], [class*="Promo"],
      [data-ad], [data-ads], [data-advertisement],
      [data-google-query-id],
      
      /* Common ad IDs */
      #ad, #ads, #adsense, #advert, #advertisement,
      #banner, #popup, #popunder, #overlay,
      #google_ads, #googleads, #sponsored,
      
      /* Ad iframes */
      iframe[src*="doubleclick.net"],
      iframe[src*="googlesyndication.com"],
      iframe[src*="googleadservices.com"],
      iframe[src*="google-analytics.com"],
      iframe[src*="amazon-adsystem.com"],
      iframe[src*="facebook.com/tr"],
      iframe[src*="taboola.com"],
      iframe[src*="outbrain.com"],
      iframe[src*="mgid.com"],
      iframe[src*="revcontent.com"],
      iframe[src*="popads.net"],
      iframe[src*="popcash.net"],
      iframe[src*="propellerads.com"],
      iframe[id*="google_ads"],
      iframe[id*="aswift"],
      
      /* Specific ad elements */
      .google-ads, .googleads, .adsbyGoogle, .adsbygoogle,
      .ad-container, .ad-wrapper, .ad-unit, .ad-slot,
      .advertisement-container, .advertisement-wrapper,
      .banner-ad, .banner-ads, .side-ad, .sidebar-ad,
      .top-ad, .bottom-ad, .header-ad, .footer-ad,
      .popup-ad, .popunder-ad, .overlay-ad,
      .sponsored-content, .sponsored-post,
      .promoted-content, .promoted-post,
      
      /* Ad placeholders and containers */
      div[id^="div-gpt-ad"],
      div[id^="google_ads_iframe"],
      div[class^="ad-placement"],
      div[data-google-query-id],
      ins.adsbygoogle,
      
      /* Sticky and floating ads */
      [style*="position: fixed"][class*="ad"],
      [style*="position: sticky"][class*="ad"],
      .sticky-ad, .floating-ad, .fixed-ad,
      
      /* Video ads */
      .video-ads, .video-ad-container,
      .preroll-ad, .midroll-ad, .postroll-ad,
      
      /* Native ads */
      .native-ad, .native-ads,
      .content-ad, .in-article-ad,
      
      /* Social media ads */
      .facebook-ad, .twitter-ad, .instagram-ad,
      [data-testid*="sponsored"],
      
      /* Popup overlays */
      .modal-backdrop[style*="display: block"],
      .overlay[style*="display: block"],
      div[style*="z-index: 9999"],
      div[style*="z-index: 99999"],
      div[style*="z-index: 999999"] {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        width: 0 !important;
        opacity: 0 !important;
        pointer-events: none !important;
        position: absolute !important;
        left: -9999px !important;
        top: -9999px !important;
      }
      
      /* Hide empty ad containers */
      .ad-container:empty,
      .advertisement:empty,
      [class*="ad-"]:empty {
        display: none !important;
      }
      
      /* Remove ad spacing */
      .ad-spacer, .ad-placeholder {
        display: none !important;
        height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      /* Block cookie notices (Tier 1 feature) */
      .cookie-notice, .cookie-banner, .cookie-consent,
      .gdpr-notice, .gdpr-banner, .privacy-notice,
      #cookie-notice, #cookie-banner, #cookie-consent,
      [class*="cookie-"], [id*="cookie-"],
      [class*="consent-"], [id*="consent-"],
      [class*="gdpr"], [id*="gdpr"] {
        display: none !important;
      }
      
      /* Site-specific rules for 1377x.to and similar torrent sites */
      a[href*="//1377x.to/cdn-cgi/"],
      a[href*="//1377x.to/torrent/"],
      div[onclick*="window.open"],
      div[onmousedown*="window.open"],
      a[onclick*="window.open"],
      a[onmousedown*="window.open"],
      *[onclick*="_blank"],
      *[onmousedown*="_blank"] {
        pointer-events: none !important;
        cursor: default !important;
      }
      
      /* Remove click handlers from suspicious elements */
      [onclick]:not(_button):not(_a):not(_input):not(_select) {
        pointer-events: none !important;
      }
      
      /* Anti-adblock detection bypass */
      .adblock-detected, .adblock-message, .adblock-modal,
      .adblocker-detected, .adblocker-message,
      #adblock-detected, #adblock-message,
      [class*="adblock"], [id*="adblock"] {
        display: none !important;
      }
    `;
    
    // Inject style as early as possible
    if (document.head) {
      document.head.insertBefore(_style, document.head.firstChild);
    } else {
      // If head doesn't exist yet, wait for it
      const observer = new MutationObserver(() => {
        if (document.head) {
          document.head.insertBefore(_style, document.head.firstChild);
          observer.disconnect();
        }
      });
      observer.observe(document, { childList: true, subtree: true });
    }
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
      document.head.appendChild(_style);
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
      4, // NodeFilter.SHOW_TEXT = 4
      null
    );

    let node;
    while ((node = walker.nextNode())) {
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
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
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

  private injectYouTubeStyles() {
    const youtubeCSS = `
/* YouTube Ad Blocking - Safe and Effective */
.video-ads, .ytp-ad-module, .ytp-ad-player-overlay, .ytp-ad-overlay-container,
.ytp-ad-text-overlay, .ytp-ad-image-overlay, .ytp-ad-overlay-slot {
  display: none !important;
  visibility: hidden !important;
}

ytd-display-ad-renderer, ytd-video-masthead-ad-v3-renderer, ytd-promoted-sparkles-web-renderer,
ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer, ytd-statement-banner-renderer,
ytd-banner-promo-renderer-background, ytd-primetime-promo-renderer, ytd-carousel-ad-renderer,
ytd-companion-slot-renderer, ytd-action-companion-ad-renderer { display: none !important; }

#player-ads, #watch7-sidebar-ads, .ytd-merch-shelf-renderer, ytd-shopping-shelf-renderer,
ytd-masthead-ad-v3-renderer, #masthead-ad { display: none !important; }

/* Skip button enhancement */
.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button {
  opacity: 1 !important; visibility: visible !important; background: #ff0000 !important;
  color: white !important; border: none !important; padding: 6px 12px !important;
  cursor: pointer !important; z-index: 9999 !important;
}

/* Feed ads - careful targeting */
ytd-rich-item-renderer:has(ytd-display-ad-renderer),
ytd-rich-item-renderer:has(ytd-in-feed-ad-layout-renderer) { display: none !important; }

/* Ensure video player works */
#movie_player, .html5-video-container, .video-stream, .ytp-chrome-bottom,
.ytp-chrome-top, .ytp-progress-bar-container { display: block !important; visibility: visible !important; }
    `;
    
    const style = document.createElement('style');
    style.id = 'shieldpro-youtube-blocker';
    style.textContent = youtubeCSS;
    document.head.appendChild(_style);
  }

  // Public method to get blocked count
  public getBlockedCount(): number {
    return this.popupBlocker.getBlockedCount() + (this.youtubeBlocker?.getStats().blockedAds || 0);
  }
}

// Initialize content script manager
new ContentScriptManager();

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