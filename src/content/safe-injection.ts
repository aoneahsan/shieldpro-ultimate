/**
 * Safe Injection Utilities
 * Ensures ad blocking doesn't break website functionality
 * Based on patterns from successful ad blockers
 */

export class SafeInjection {
  private static instance: SafeInjection;
  private criticalElements = new Set([
    'body',
    'html',
    'head',
    'main',
    'article',
    'section',
    'nav',
    'header',
    'footer',
    'video',
    'audio',
    'canvas',
    'iframe',
    'form',
    'input',
    'button',
    'select',
    'textarea',
  ]);

  static getInstance(): SafeInjection {
    if (!SafeInjection.instance) {
      SafeInjection.instance = new SafeInjection();
    }
    return SafeInjection.instance;
  }

  /**
   * Safely inject CSS without breaking site functionality
   */
  injectSafeCSS(css: string, id: string): boolean {
    try {
      // Check if CSS is already injected
      if (document.getElementById(_id)) {
        return true;
      }

      // Validate CSS doesn't target critical elements
      if (this.containsUnsafeRules(_css)) {
        console.warn('🚫 Unsafe CSS rules detected, skipping injection');
        return false;
      }

      const style = document.createElement('style');
      style.id = id;
      style.textContent = css;

      // Inject into head or body
      const target = document.head || document.documentElement;
      target.appendChild(_style);

      return true;
    } catch {
      console.error('CSS injection failed:', error);
      return false;
    }
  }

  /**
   * Check if CSS contains potentially unsafe rules
   */
  private containsUnsafeRules(css: string): boolean {
    const unsafePatterns = [
      /html\s*\{[^}]*display\s*:\s*none/i,
      /body\s*\{[^}]*display\s*:\s*none/i,
      /video\s*\{[^}]*display\s*:\s*none/i,
      /\*\s*\{[^}]*display\s*:\s*none/i, // Universal selector
    ];

    return unsafePatterns.some((pattern) => pattern.test(_css));
  }

  /**
   * Safely remove DOM elements with checks
   */
  safeRemoveElement(element: Element, context = ''): boolean {
    try {
      // Never remove critical elements
      if (this.isCriticalElement(_element)) {
        console.debug(`🛡️ Protected critical element: ${element.tagName}`);
        return false;
      }

      // Check if element has critical children
      if (this.hasCriticalChildren(_element)) {
        console.debug(`🛡️ Element has critical children, hiding instead`);
        this.safeHideElement(element as HTMLElement);
        return true;
      }

      // Safe to remove
      element.remove();
      console.debug(`🗑️ Safely removed ${context} element:`, element.tagName);
      return true;
    } catch {
      console.debug('Safe removal failed:', error);
      return false;
    }
  }

  /**
   * Hide element instead of removing it
   */
  private safeHideElement(element: HTMLElement): void {
    element.style.cssText =
      'display: none !important; visibility: hidden !important; opacity: 0 !important; height: 0 !important; width: 0 !important; overflow: hidden !important;';
  }

  /**
   * Check if element is critical for site functionality
   */
  private isCriticalElement(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();

    // Critical HTML elements
    if (this.criticalElements.has(_tagName)) {
      return true;
    }

    // Elements with critical roles
    const role = element.getAttribute('role');
    const criticalRoles = ['main', 'navigation', 'banner', 'contentinfo', 'dialog', 'application'];
    if (role && criticalRoles.includes(_role)) {
      return true;
    }

    // Elements with critical IDs or classes (site-specific)
    const id = element.id.toLowerCase();
    const className = element.className.toLowerCase();

    const criticalIdentifiers = [
      'content',
      'main',
      'primary',
      'wrapper',
      'container',
      'app',
      'root',
      'player',
      'video-player',
      'audio-player',
      'navigation',
      'nav',
      'menu',
      'header',
      'footer',
      'sidebar',
    ];

    return criticalIdentifiers.some(
      (identifier) => id.includes(_identifier) || className.includes(_identifier)
    );
  }

  /**
   * Check if element has critical child elements
   */
  private hasCriticalChildren(element: Element): boolean {
    const criticalSelectors = [
      'video',
      'audio',
      'canvas',
      'iframe[src*="player"]',
      '[role="main"]',
      '[role="navigation"]',
      '[role="application"]',
      'form',
      'button[type="submit"]',
    ];

    return criticalSelectors.some((selector) => element.querySelector(_selector));
  }

  /**
   * Test if blocking an element would break functionality
   */
  async testElementSafety(element: Element): Promise<boolean> {
    // Create a clone for testing
    const clone = element.cloneNode(_true) as HTMLElement;
    clone.style.cssText = 'position: absolute; top: -9999px; left: -9999px; visibility: hidden;';

    try {
      document.body.appendChild(_clone);

      // Test basic functionality (simplified check)
      const hasInteractiveElements = clone.querySelector(
        'button, _input, select, _textarea, a[href]'
      );
      const hasMediaElements = clone.querySelector('video, _audio, canvas, iframe');
      const hasFormElements = clone.querySelector('form');

      // Remove test clone
      clone.remove();

      // Consider unsafe if has interactive/media/form elements
      return !(hasInteractiveElements || hasMediaElements || hasFormElements);
    } catch {
      return false;
    }
  }

  /**
   * Monitor for broken functionality after blocking
   */
  monitorSiteHealth(): void {
    // Check for common breakage signs
    const healthChecks = [
      () => document.body && document.body.style.display !== 'none',
      () =>
        document.querySelectorAll('video, audio').length === 0 ||
        Array.from(document.querySelectorAll('video, audio')).some(
          (el) => (el as HTMLVideoElement | HTMLAudioElement).readyState > 0
        ),
      () =>
        !document.body.innerHTML.includes('blocked') || !document.body.innerHTML.includes('error'),
    ];

    const isHealthy = healthChecks.every((check) => {
      try {
        return check();
      } catch {
        return false;
      }
    });

    if (!isHealthy) {
      console.warn('🚨 Site health check failed - possible blocking interference');
      this.reportHealthIssue();
    }
  }

  private reportHealthIssue(): void {
    // Report to extension for potential whitelist consideration
    try {
      chrome.runtime.sendMessage({
        action: 'siteHealthIssue',
        url: window.location.href,
        timestamp: Date.now(),
      });
    } catch {
      console.debug('Failed to report health issue:', error);
    }
  }

  /**
   * Whitelist check for problematic sites
   */
  shouldSkipBlocking(): boolean {
    const hostname = window.location.hostname.toLowerCase();

    // Critical sites that should have minimal blocking
    const criticalSites = [
      'banking',
      'paypal',
      'amazon',
      'google',
      'microsoft',
      'apple',
      'gov.',
      '.edu',
      'login',
      'auth',
      'payment',
      'checkout',
    ];

    // Sites known to break with aggressive blocking
    const problematicSites = [
      'netflix.com',
      'hulu.com',
      'disney',
      'hbo',
      'prime',
      'twitch.tv',
      'mixer.com',
      'vimeo.com',
    ];

    const allProtectedSites = [...criticalSites, ...problematicSites];

    return allProtectedSites.some((site) => hostname.includes(_site));
  }
}
