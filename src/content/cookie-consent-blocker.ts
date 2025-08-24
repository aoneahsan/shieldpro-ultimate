import { StorageManager } from '../shared/utils/storage';

export class CookieConsentBlocker {
  private storage = StorageManager.getInstance();
  private observer: MutationObserver | null = null;
  private processedElements = new WeakSet<Element>();
  private tier = 1;

  async init(): Promise<void> {
    const settings = await this.storage.getSettings();
    this.tier = settings.tier?.level || 1;

    // Activate for Tier 1+ (basic cookie consent blocking)
    if (this.tier >= 1 && settings.enabled) {
      this.startBlocking();
      this.injectStyles();
    }

    // Listen for tier updates
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'tierUpdated' && message.tier >= 1) {
        this.tier = message.tier;
        this.startBlocking();
      }
    });
  }

  private startBlocking(): void {
    // Initial scan
    this.rejectAllCookies();
    this.hideConsentBanners();

    // Set up observer for dynamic content
    if (!this.observer) {
      this.observer = new MutationObserver(() => {
        this.rejectAllCookies();
        this.hideConsentBanners();
      });

      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'id', 'style']
      });
    }

    // Auto-click reject buttons
    this.setupAutoReject();
  }

  private rejectAllCookies(): void {
    // Common reject button selectors
    const rejectSelectors = [
      // Generic reject buttons
      'button[class*="reject"]',
      'button[class*="decline"]',
      'button[class*="deny"]',
      'button[class*="refuse"]',
      'button[id*="reject"]',
      'button[id*="decline"]',
      'button[id*="deny"]',
      'a[class*="reject"]',
      'a[class*="decline"]',
      
      // Specific cookie consent tools
      '[class*="cookiefirst-reject"]',
      '[id="onetrust-reject-all-handler"]',
      '.optanon-reject-all',
      '#reject-all',
      '.reject-all',
      '.decline-all',
      
      // Text-based selectors
      'button:contains("Reject")',
      'button:contains("Decline")',
      'button:contains("No thanks")',
      'button:contains("Only necessary")',
      'button:contains("Only essential")',
      
      // Popular consent management platforms
      '.qc-cmp-button[mode="secondary"]',
      '.didomi-dismiss-button',
      '.cn-decline-cookie',
      '.cc-deny',
      '.cc-dismiss',
      
      // Custom implementations
      '[data-action="reject"]',
      '[data-consent="reject"]',
      '[aria-label*="reject"]',
      '[aria-label*="decline"]'
    ];

    rejectSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (!this.processedElements.has(element)) {
            this.processedElements.add(element);
            
            // Check if it's actually a reject button
            const text = element.textContent?.toLowerCase() || '';
            const rejectKeywords = ['reject', 'decline', 'deny', 'refuse', 'no thanks', 'necessary', 'essential', 'dismiss'];
            
            if (rejectKeywords.some(keyword => text.includes(keyword))) {
              // Click the reject button
              (element as HTMLElement).click();
              console.log('ShieldPro: Auto-rejected cookies via', selector);
              
              // Track rejection
              chrome.runtime.sendMessage({
                action: 'adBlocked',
                category: 'other',
                domain: window.location.hostname
              });
            }
          }
        });
      } catch (e) {}
    });

    // Handle "only necessary cookies" options
    this.selectMinimalCookies();
  }

  private selectMinimalCookies(): void {
    // Uncheck all optional cookie checkboxes
    const checkboxSelectors = [
      'input[type="checkbox"][name*="marketing"]',
      'input[type="checkbox"][name*="analytics"]',
      'input[type="checkbox"][name*="advertising"]',
      'input[type="checkbox"][name*="performance"]',
      'input[type="checkbox"][name*="functional"]',
      'input[type="checkbox"][name*="targeting"]',
      'input[type="checkbox"][name*="social"]',
      'input[type="checkbox"][class*="optional"]',
      'input[type="checkbox"]:not([name*="necessary"]):not([name*="essential"]):not([name*="required"])'
    ];

    checkboxSelectors.forEach(selector => {
      try {
        const checkboxes = document.querySelectorAll(selector);
        checkboxes.forEach(checkbox => {
          if ((checkbox as HTMLInputElement).checked) {
            (checkbox as HTMLInputElement).checked = false;
            // Trigger change event
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      } catch (e) {}
    });

    // Click save/confirm after unchecking
    const saveSelectors = [
      'button[class*="save"]',
      'button[class*="confirm"]',
      'button[class*="accept-selected"]',
      'button:contains("Save")',
      'button:contains("Confirm")'
    ];

    setTimeout(() => {
      saveSelectors.forEach(selector => {
        try {
          const saveButton = document.querySelector(selector) as HTMLElement;
          if (saveButton && !this.processedElements.has(saveButton)) {
            saveButton.click();
            this.processedElements.add(saveButton);
          }
        } catch (e) {}
      });
    }, 500);
  }

  private hideConsentBanners(): void {
    const bannerSelectors = [
      // Generic cookie banners
      '[class*="cookie-banner"]',
      '[class*="cookie-consent"]',
      '[class*="cookie-notice"]',
      '[class*="cookie-policy"]',
      '[class*="cookie-bar"]',
      '[class*="cookie-popup"]',
      '[class*="cookie-modal"]',
      '[class*="gdpr-banner"]',
      '[class*="gdpr-consent"]',
      '[class*="privacy-banner"]',
      '[class*="consent-banner"]',
      '[id*="cookie-banner"]',
      '[id*="cookie-consent"]',
      '[id*="cookie-notice"]',
      '[id*="gdpr"]',
      
      // Popular consent tools
      '#onetrust-consent-sdk',
      '#onetrust-banner-sdk',
      '.optanon-alert-box-wrapper',
      '.qc-cmp-ui-container',
      '.didomi-popup-container',
      '.cookiefirst-root',
      '.cc-window',
      '.cc-banner',
      '#cookieConsent',
      '#cookie-law-info-bar',
      '.cookie-law-info-bar',
      '.cli-modal-backdrop',
      '.trustarc-banner-container',
      '.truste_box_overlay',
      
      // Overlay/backdrop elements
      '[class*="cookie-overlay"]',
      '[class*="consent-overlay"]',
      '[class*="modal-backdrop"]',
      'div[class*="overlay"]:has([class*="cookie"])',
      
      // Bottom/top bars
      'div[style*="position: fixed"][style*="bottom"]',
      'div[style*="position: fixed"][style*="top"]'
    ];

    bannerSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          // Check if it's likely a cookie banner
          const text = element.textContent?.toLowerCase() || '';
          const cookieKeywords = ['cookie', 'consent', 'privacy', 'gdpr', 'data protection', 'personalised ads'];
          
          if (cookieKeywords.some(keyword => text.includes(keyword))) {
            (element as HTMLElement).style.display = 'none';
            element.remove();
            
            // Remove body class that might prevent scrolling
            document.body.classList.remove('cookie-consent-open', 'modal-open', 'no-scroll');
            document.documentElement.classList.remove('cookie-consent-open', 'modal-open', 'no-scroll');
            
            // Restore scrolling
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
          }
        });
      } catch (e) {}
    });
  }

  private setupAutoReject(): void {
    // Intercept cookie consent APIs
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        // OneTrust
        if (window.OneTrust) {
          window.OneTrust.RejectAll = function() {
            console.log('ShieldPro: OneTrust cookies rejected');
          };
          if (window.OneTrust.RejectAll) {
            window.OneTrust.RejectAll();
          }
        }

        // Cookiebot
        if (window.Cookiebot) {
          window.Cookiebot.decline = function() {
            console.log('ShieldPro: Cookiebot cookies rejected');
          };
          if (window.Cookiebot.decline) {
            window.Cookiebot.decline();
          }
        }

        // Didomi
        if (window.didomiOnReady) {
          window.didomiOnReady.push(function(Didomi) {
            Didomi.setUserDisagreeToAll();
            console.log('ShieldPro: Didomi cookies rejected');
          });
        }

        // Quantcast
        if (window.__tcfapi) {
          window.__tcfapi('rejectAll', 2, function() {
            console.log('ShieldPro: TCF cookies rejected');
          });
        }

        // TrustArc
        if (window.truste) {
          window.truste.eu.clickListener = function() {
            console.log('ShieldPro: TrustArc cookies rejected');
          };
        }

        // Generic consent override
        window.gdprConsent = false;
        window.cookieConsent = false;
        window.hasConsent = false;
      })();
    `;

    if (document.documentElement) {
      document.documentElement.appendChild(script);
      script.remove();
    }
  }

  private injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      /* Hide cookie consent banners */
      [class*="cookie-banner"],
      [class*="cookie-consent"],
      [class*="cookie-notice"],
      [class*="gdpr"],
      [id*="cookie-banner"],
      [id*="cookie-consent"],
      #onetrust-consent-sdk,
      .optanon-alert-box-wrapper,
      .qc-cmp-ui-container,
      .didomi-popup-container,
      .cookiefirst-root,
      .cc-window,
      .trustarc-banner-container {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        height: 0 !important;
        width: 0 !important;
      }

      /* Remove blur/overlay effects */
      body:not(.cookie-consent-processed) {
        overflow: auto !important;
        position: static !important;
        filter: none !important;
      }

      /* Remove overlay backdrops */
      [class*="cookie-overlay"],
      [class*="consent-overlay"],
      [class*="modal-backdrop"] {
        display: none !important;
      }
    `;

    document.head.appendChild(style);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const blocker = new CookieConsentBlocker();
    blocker.init();
  });
} else {
  const blocker = new CookieConsentBlocker();
  blocker.init();
}