/**
 * Aggressive Ad Blocker for Torrent and High-Ad Sites
 * Blocks all types of intrusive ads including popups, redirects, and overlays
 */

export class TorrentSiteBlocker {
  private observer: MutationObserver | null = null;
  private clickInterceptor: ((e: MouseEvent) => void) | null = null;
  private isActive: boolean = false;

  init() {
    if (this.isActive) return;
    this.isActive = true;

    // Check if we're on a torrent/high-ad site
    if (this.isTorrentSite()) {
      console.log('[ShieldPro] Aggressive blocking activated for high-ad site');
      this.applyAggressiveBlocking();
    }
  }

  private isTorrentSite(): boolean {
    const hostname = window.location.hostname.toLowerCase();
    const torrentSites = [
      '1337x', '1377x', 'piratebay', 'rarbg', 'yts', 'eztv', 
      'torrentz', 'kickass', 'limetorrents', 'torrentgalaxy',
      'magnetdl', 'torlock', 'zooqle', 'torrentdownloads',
      'demonoid', 'yourbittorrent', 'torrentfunk', 'glodls',
      'kickasstorrents', 'extratorrent', 'isohunt', 'bitsnoop',
      'torrenthound', 'torrents.io', 'torrentproject', 'btdig',
      'torrentcd', 'seedpeer', 'monova', 'torrentcrazy'
    ];
    
    return torrentSites.some(site => hostname.includes(site));
  }

  private applyAggressiveBlocking() {
    // 1. Inject aggressive CSS immediately
    this.injectAggressiveCSS();
    
    // 2. Block all popups and redirects
    this.blockPopupsAndRedirects();
    
    // 3. Remove existing ads on page load
    this.removeAds();
    
    // 4. Monitor for new ads
    this.startObserver();
    
    // 5. Intercept clicks to prevent ad hijacking
    this.interceptClicks();
    
    // 6. Block overlay ads
    this.blockOverlays();
    
    // 7. Disable right-click hijacking
    this.restoreRightClick();
  }

  private injectAggressiveCSS() {
    const style = document.createElement('style');
    style.id = 'shieldpro-aggressive-blocking';
    style.textContent = `
      /* Hide ALL potential ad elements */
      [class*="ad"], [class*="Ad"], [class*="AD"],
      [id*="ad"], [id*="Ad"], [id*="AD"],
      [class*="banner"], [class*="Banner"],
      [class*="popup"], [class*="Popup"], 
      [class*="modal"], [class*="Modal"],
      [class*="overlay"], [class*="Overlay"],
      [class*="sponsor"], [class*="Sponsor"],
      [class*="promo"], [class*="Promo"],
      [class*="widget"], [class*="Widget"],
      [class*="sticky"], [class*="Sticky"],
      [class*="float"], [class*="Float"],
      [data-ad], [data-ads], [data-advertisement],
      [data-google], [data-banner],
      iframe[src*="doubleclick"],
      iframe[src*="googlesyndication"],
      iframe[src*="googleadservices"],
      iframe[src*="amazon-adsystem"],
      iframe[src*="adsystem"],
      iframe[src*="adsafeprotected"],
      iframe[src*="moatads"],
      iframe[src*="googletagmanager"],
      iframe[src*="google-analytics"],
      iframe[src*="scorecardresearch"],
      iframe[src*="outbrain"],
      iframe[src*="taboola"],
      iframe[src*="criteo"],
      iframe[src*="facebook"],
      iframe[src*="twitter"],
      ins.adsbygoogle,
      div[id^="div-gpt-ad"],
      div[id^="google_ads"],
      div[class^="vm-placement"],
      div[id^="yandex_rtb"],
      .adsbox, .adsbygoogle, .ad-container, .ad-wrapper,
      .advertisement, .advertising, .ads-area, .ad-unit,
      .banner-ad, .banner-ads, .display-ad, .text-ad,
      .sponsored-content, .promoted-content,
      .popup-ad, .popunder, .interstitial,
      /* Specific to torrent sites */
      .exo-native-widget, .exo-horizontal, .exo-vertical,
      .mgbox, .mgheader, .mcontent, .mgline,
      #kt_player, .video-js, .jw-wrapper,
      .popMagic, .pop-magic, #popmake-overlay,
      .fancybox-overlay, .mfp-bg, .mfp-wrap,
      /* Block floating elements */
      div[style*="position: fixed"],
      div[style*="position:fixed"],
      div[style*="z-index: 9999"],
      div[style*="z-index:9999"],
      div[style*="z-index: 10000"],
      div[style*="z-index:10000"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        height: 0 !important;
        width: 0 !important;
        position: absolute !important;
        left: -9999px !important;
      }
      
      /* Remove ad placeholders and spaces */
      .ad-slot:after, .ad-container:after {
        display: none !important;
      }
      
      /* Prevent body scroll lock from popups */
      body {
        overflow: auto !important;
        position: static !important;
      }
      
      /* Hide cookie notices aggressively */
      [class*="cookie"], [class*="Cookie"],
      [class*="consent"], [class*="Consent"],
      [class*="gdpr"], [class*="GDPR"],
      [class*="privacy"], [class*="Privacy"],
      [id*="cookie"], [id*="Cookie"],
      [id*="consent"], [id*="Consent"] {
        display: none !important;
      }
      
      /* Remove blur effects used by some sites */
      body > *:not(script):not(style) {
        filter: none !important;
        -webkit-filter: none !important;
      }
    `;
    
    // Add to both head and body to ensure it's applied
    if (document.head) {
      document.head.appendChild(style);
    } else {
      document.documentElement.appendChild(style);
    }
  }

  private blockPopupsAndRedirects() {
    // Override window.open
    const originalOpen = window.open;
    window.open = function(...args: any[]) {
      console.log('[ShieldPro] Blocked popup:', args[0]);
      return null;
    };

    // Block popunder attempts
    let lastClickTime = 0;
    document.addEventListener('click', (e) => {
      const now = Date.now();
      if (now - lastClickTime < 50) {
        e.stopPropagation();
        e.preventDefault();
        console.log('[ShieldPro] Blocked rapid click (popunder attempt)');
      }
      lastClickTime = now;
    }, true);

    // Block beforeunload popups
    window.addEventListener('beforeunload', (e) => {
      e.stopImmediatePropagation();
      e.returnValue = undefined;
    }, true);

    // Prevent tab-under
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        window.focus();
      }
    });
  }

  private removeAds() {
    // Aggressive ad removal
    const adSelectors = [
      // Generic ad selectors
      '[class*="ad"]', '[id*="ad"]',
      '[class*="banner"]', '[id*="banner"]',
      '[class*="popup"]', '[id*="popup"]',
      '[class*="modal"]', '[id*="modal"]',
      '[class*="overlay"]', '[id*="overlay"]',
      '[class*="sponsor"]', '[class*="promo"]',
      'iframe[src*="ad"]', 'iframe[src*="banner"]',
      'ins.adsbygoogle', 'div[id^="google_ads"]',
      // Torrent site specific
      '.exo-native-widget', '.mgbox', '#kt_player',
      '.popMagic', '.fancybox-overlay', '.mfp-bg'
    ];

    adSelectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(el => {
          el.remove();
          console.log('[ShieldPro] Removed ad element:', selector);
        });
      } catch (e) {
        // Invalid selector, ignore
      }
    });

    // Remove iframes that are likely ads
    document.querySelectorAll('iframe').forEach(iframe => {
      const src = iframe.src || '';
      const id = iframe.id || '';
      const className = iframe.className || '';
      
      if (src.includes('ad') || src.includes('banner') || 
          src.includes('popup') || src.includes('google') ||
          src.includes('doubleclick') || src.includes('amazon') ||
          id.includes('ad') || className.includes('ad')) {
        iframe.remove();
        console.log('[ShieldPro] Removed iframe:', src);
      }
    });
  }

  private startObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            const element = node as HTMLElement;
            
            // Check if it's an ad
            if (this.isAdElement(element)) {
              element.remove();
              console.log('[ShieldPro] Removed dynamically added ad');
            }
            
            // Check children
            element.querySelectorAll('*').forEach(child => {
              if (this.isAdElement(child as HTMLElement)) {
                child.remove();
              }
            });
          }
        });
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private isAdElement(element: HTMLElement): boolean {
    const id = element.id?.toLowerCase() || '';
    const className = element.className?.toString().toLowerCase() || '';
    const src = (element as HTMLIFrameElement).src?.toLowerCase() || '';
    
    const adKeywords = [
      'ad', 'ads', 'adsense', 'advertisement', 'banner',
      'popup', 'popunder', 'modal', 'overlay', 'sponsor',
      'promo', 'widget', 'google', 'doubleclick', 'amazon',
      'exo', 'mgbox', 'popmagic', 'fancybox'
    ];
    
    return adKeywords.some(keyword => 
      id.includes(keyword) || 
      className.includes(keyword) || 
      src.includes(keyword)
    );
  }

  private interceptClicks() {
    // Prevent click hijacking
    this.clickInterceptor = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if click target has suspicious attributes
      if (target.hasAttribute('data-ad') || 
          target.hasAttribute('data-banner') ||
          target.closest('[data-ad], [data-banner]')) {
        e.stopPropagation();
        e.preventDefault();
        console.log('[ShieldPro] Blocked ad click hijack');
        return;
      }
      
      // Check for blank target links (often ads)
      if (target.tagName === 'A' || target.closest('a')) {
        const link = (target.tagName === 'A' ? target : target.closest('a')) as HTMLAnchorElement;
        if (link.target === '_blank' && !link.href.includes(window.location.hostname)) {
          // External link, might be ad
          const isLikelyAd = this.isLikelyAdURL(link.href);
          if (isLikelyAd) {
            e.stopPropagation();
            e.preventDefault();
            console.log('[ShieldPro] Blocked external ad link:', link.href);
          }
        }
      }
    };
    
    document.addEventListener('click', this.clickInterceptor, true);
    document.addEventListener('mousedown', this.clickInterceptor, true);
  }

  private isLikelyAdURL(url: string): boolean {
    const adDomains = [
      'doubleclick', 'googleadservices', 'googlesyndication',
      'google-analytics', 'googletagmanager', 'amazon-adsystem',
      'facebook', 'outbrain', 'taboola', 'criteo', 'adsystem',
      'adsafeprotected', 'moatads', 'scorecardresearch',
      'clickbank', 'clickserve', 'clicktale', 'clicktrack',
      'cloudfront', 'amazonaws', 'bit.ly', 'tinyurl', 'short.link'
    ];
    
    return adDomains.some(domain => url.includes(domain));
  }

  private blockOverlays() {
    // Remove any overlay elements
    setInterval(() => {
      // Find elements with high z-index that cover the page
      document.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el);
        const zIndex = parseInt(style.zIndex);
        
        if (zIndex > 9000 && style.position === 'fixed') {
          // Likely an overlay
          const element = el as HTMLElement;
          if (element.offsetWidth > window.innerWidth * 0.8 ||
              element.offsetHeight > window.innerHeight * 0.8) {
            element.remove();
            console.log('[ShieldPro] Removed overlay element');
          }
        }
      });
      
      // Restore body scroll
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    }, 1000);
  }

  private restoreRightClick() {
    // Re-enable right click
    document.addEventListener('contextmenu', (e) => {
      e.stopPropagation();
      return true;
    }, true);
    
    // Remove any oncontextmenu attributes
    document.querySelectorAll('[oncontextmenu]').forEach(el => {
      el.removeAttribute('oncontextmenu');
    });
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    if (this.clickInterceptor) {
      document.removeEventListener('click', this.clickInterceptor, true);
      document.removeEventListener('mousedown', this.clickInterceptor, true);
      this.clickInterceptor = null;
    }
    
    // Remove injected styles
    const style = document.getElementById('shieldpro-aggressive-blocking');
    if (style) {
      style.remove();
    }
    
    this.isActive = false;
  }
}