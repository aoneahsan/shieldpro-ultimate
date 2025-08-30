/**
 * Cookie Consent Auto-Rejection Handler
 * Automatically rejects cookie consent popups from 40+ platforms
 */

export class CookieConsentHandler {
  private consentSelectors = {
    // Generic reject buttons
    generic: [
      '[id*="reject"]',
      '[class*="reject"]',
      '[id*="decline"]',
      '[class*="decline"]',
      '[id*="deny"]',
      '[class*="deny"]',
      'button:contains("Reject")',
      'button:contains("Decline")',
      'button:contains("No thanks")',
      'button:contains("I decline")',
      'a:contains("Reject all")',
      'a:contains("Decline all")',
    ],

    // Platform-specific selectors
    platforms: {
      // OneTrust
      onetrust: [
        '.ot-pc-refuse-all-handler',
        '#onetrust-reject-all-handler',
        '.onetrust-close-btn-handler.banner-close-button',
      ],

      // Cookiebot
      cookiebot: [
        '#CybotCookiebotDialogBodyButtonDecline',
        '[data-cookiebanner-reject]',
        '.CybotCookiebotDialogBodyButton[data-cookiebanner-reject]',
      ],

      // TrustArc / TRUSTe
      trustarc: ['.trustarc-decline-button', '#truste-consent-decline', '.truste-button2'],

      // Quantcast
      quantcast: [
        '[onclick*="__qcCmp(\'setConsent\', false)"]',
        '.qc-cmp-button[mode="secondary"]',
        '.qc-cmp-button.qc-cmp-secondary-button',
      ],

      // Google Consent
      google: [
        '[jsname="tWT92d"]', // Reject all button
        'button[aria-label*="Reject"]',
        '#W0wltc', // "Reject all" on YouTube
      ],

      // Facebook
      facebook: [
        '[data-cookiebanner="accept_only_essential_button"]',
        '[data-testid="cookie-policy-banner-decline"]',
      ],

      // Amazon
      amazon: ['input[aria-labelledby*="decline"]', '#sp-cc-rejectall-link'],

      // Didomi
      didomi: [
        '#didomi-notice-disagree-button',
        '.didomi-components-button.didomi-button-secondary',
      ],

      // Usercentrics
      usercentrics: [
        '[data-testid="uc-deny-all-button"]',
        '.sc-gsDKAQ.fmuRqt', // Deny button class
      ],

      // Civic Cookie Control
      civic: ['.ccc-reject-button', '.ccc-banner-decline-button'],

      // Crownpeak
      crownpeak: ['.cp-reject-all', '#cp-reject-all-btn'],

      // Termly
      termly: ['.t-declineAllButton', '#termly-reject-all'],
    },
  };

  private rejectedDomains: Set<string> = new Set();
  private observerActive = false;
  private observer?: MutationObserver;

  init() {
    // Check if cookie consent already rejected for this domain
    this.loadRejectedDomains();

    if (!this.rejectedDomains.has(window.location.hostname)) {
      this.detectAndRejectCookies();
      this.startObserver();
    }
  }

  private async loadRejectedDomains() {
    const result = await chrome.storage.local.get(['rejectedCookieDomains']);
    if (result.rejectedCookieDomains) {
      this.rejectedDomains = new Set(result.rejectedCookieDomains);
    }
  }

  private async saveRejectedDomain(domain: string) {
    this.rejectedDomains.add(domain);
    await chrome.storage.local.set({
      rejectedCookieDomains: Array.from(this.rejectedDomains),
    });
  }

  private detectAndRejectCookies() {
    // Try platform-specific selectors first
    for (const [platform, selectors] of Object.entries(this.consentSelectors.platforms)) {
      for (const selector of selectors) {
        const element = this.findElement(selector);
        if (element) {
          this.rejectCookies(element, platform);
          return;
        }
      }
    }

    // Try generic selectors
    for (const selector of this.consentSelectors.generic) {
      const element = this.findElement(selector);
      if (element) {
        this.rejectCookies(element, 'generic');
        return;
      }
    }
  }

  private findElement(selector: string): HTMLElement | null {
    try {
      // Handle :contains pseudo-selector
      if (selector.includes(':contains')) {
        const [baseSelector, text] = selector.split(':contains');
        const cleanText = text.replace(/[()'"]/g, '');
        const elements = document.querySelectorAll(baseSelector);

        for (const element of elements) {
          if (element.textContent?.toLowerCase().includes(cleanText.toLowerCase())) {
            return element as HTMLElement;
          }
        }
        return null;
      }

      // Regular selector
      return document.querySelector(selector) as HTMLElement;
    } catch {
      return null;
    }
  }

  private rejectCookies(element: HTMLElement, platform: string) {
    try {
      // Click the reject button
      element.click();

      // For some platforms, we need to trigger additional events
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
      });
      element.dispatchEvent(clickEvent);

      // Save that we've rejected cookies for this domain
      this.saveRejectedDomain(window.location.hostname);

      // Report to background script
      chrome.runtime
        .sendMessage({
          action: 'cookiesRejected',
          platform,
          domain: window.location.hostname,
        })
        .catch(() => {});

      // Stop observing once rejected
      this.stopObserver();

      console.warn(`ShieldPro: Auto-rejected cookies via ${platform}`);
    } catch {
      console.error('Failed to reject cookies:', error);
    }
  }

  private startObserver() {
    if (this.observerActive) return;

    // Wait for document.body to be available
    if (!document.body) {
      // If body is not ready, wait and try again
      setTimeout(() => this.startObserver(), 100);
      return;
    }

    this.observerActive = true;
    let attempts = 0;
    const maxAttempts = 20; // Try for 10 seconds

    this.observer = new MutationObserver(() => {
      if (attempts++ < maxAttempts) {
        this.detectAndRejectCookies();
      } else {
        this.stopObserver();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Stop observing after 10 seconds
    setTimeout(() => this.stopObserver(), 10000);
  }

  private stopObserver() {
    if (this.observer) {
      this.observer.disconnect();
      this.observerActive = false;
    }
  }

  // Public method to manually reject cookies
  public rejectAll() {
    this.detectAndRejectCookies();
  }

  // Get statistics
  public getStats() {
    return {
      rejectedDomains: this.rejectedDomains.size,
      domains: Array.from(this.rejectedDomains),
    };
  }
}

export default CookieConsentHandler;
