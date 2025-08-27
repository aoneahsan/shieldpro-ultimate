/**
 * Aggressive Popup and Ad Blocker
 * Blocks all types of popups including click-triggered ones
 */

export class AggressivePopupBlocker {
  private blockedCount = 0;
  private originalOpen: typeof window.open;
  private clickJackingPreventionActive = false;
  private lastClickTime = 0;
  private suspiciousClickHandlers = new WeakSet<EventListener>();

  constructor() {
    this.originalOpen = window.open.bind(window);
    this.init();
  }

  init() {
    // Inject protection as early as possible
    this.injectEarlyProtection();
    
    // Override window.open
    this.overrideWindowOpen();
    
    // Block all click-triggered popups
    this.blockClickPopups();
    
    // Prevent clickjacking and overlay ads
    this.preventClickjacking();
    
    // Block popunder attempts
    this.blockPopunders();
    
    // Remove existing onclick handlers
    this.removeOnclickHandlers();
    
    // Monitor DOM changes
    this.monitorDOMChanges();
    
    // Block programmatic clicks
    this.blockProgrammaticClicks();
    
    // Prevent tab-under techniques
    this.preventTabUnder();
  }

  private injectEarlyProtection() {
    // This runs before any page scripts
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        'use strict';
        
        // Save original functions
        const _open = window.open;
        const _addEventListener = EventTarget.prototype.addEventListener;
        const _removeEventListener = EventTarget.prototype.removeEventListener;
        const _setTimeout = window.setTimeout;
        const _setInterval = window.setInterval;
        const _createElement = document.createElement;
        
        // Track blocked popups
        let blockedPopups = 0;
        
        // Block window.open completely on first page interaction
        let firstInteraction = true;
        let interactionTimeout;
        
        // Override window.open
        window.open = function(url, target, features) {
          const urlStr = url ? url.toString() : '';
          
          // Block all window.open calls within 3 seconds of page interaction
          if (firstInteraction) {
            console.log('[ShieldPro] Blocked popup attempt:', urlStr);
            blockedPopups++;
            return null;
          }
          
          // Block blank windows
          if (!urlStr || urlStr === 'about:blank' || urlStr === 'javascript:void(0)') {
            console.log('[ShieldPro] Blocked blank popup');
            blockedPopups++;
            return null;
          }
          
          // Block if called too quickly after user interaction
          const now = Date.now();
          if (window.__lastInteraction && (now - window.__lastInteraction) < 100) {
            console.log('[ShieldPro] Blocked rapid popup');
            blockedPopups++;
            return null;
          }
          
          // Block known ad domains
          const adPatterns = [
            /doubleclick\\.net/i,
            /googlesyndication/i,
            /googleadservices/i,
            /amazon-adsystem/i,
            /popads\\.net/i,
            /popcash\\.net/i,
            /popunder/i,
            /popup/i,
            /\\/(ads?|advertisement|banner|popup|popunder)\\//i,
            /^https?:\\/\\/[^/]*\\.(tk|ml|ga|cf)\\//i,
            /\\.ads?\\./i,
            /track(ing)?\\./i,
            /click\\./i,
            /redirect/i,
            /aff(iliate)?\\./i,
            /partner\\./i
          ];
          
          if (adPatterns.some(pattern => pattern.test(urlStr))) {
            console.log('[ShieldPro] Blocked ad popup:', urlStr);
            blockedPopups++;
            return null;
          }
          
          // Block popups with suspicious features
          if (features && (
            features.includes('width=') || 
            features.includes('height=') || 
            features.includes('top=') || 
            features.includes('left=') ||
            features.includes('toolbar=no') ||
            features.includes('location=no')
          )) {
            console.log('[ShieldPro] Blocked popup with suspicious features');
            blockedPopups++;
            return null;
          }
          
          // Allow same-origin navigation in same tab
          if (target === '_self' && urlStr.startsWith(window.location.origin)) {
            return _open.call(window, url, target, features);
          }
          
          // Block everything else by default
          console.log('[ShieldPro] Blocked popup by default:', urlStr);
          blockedPopups++;
          return null;
        };
        
        // Track user interactions
        ['click', 'mousedown', 'mouseup', 'touchstart', 'touchend'].forEach(eventType => {
          document.addEventListener(eventType, function() {
            window.__lastInteraction = Date.now();
            
            if (firstInteraction) {
              firstInteraction = false;
              clearTimeout(interactionTimeout);
              interactionTimeout = setTimeout(() => {
                firstInteraction = true;
              }, 3000);
            }
          }, true);
        });
        
        // Override addEventListener to detect popup triggers
        EventTarget.prototype.addEventListener = function(type, listener, options) {
          if (type === 'click' || type === 'mousedown' || type === 'mouseup') {
            const listenerStr = listener.toString();
            if (listenerStr.includes('window.open') || 
                listenerStr.includes('popup') || 
                listenerStr.includes('_blank')) {
              console.log('[ShieldPro] Blocked suspicious click handler');
              return;
            }
          }
          return _addEventListener.call(this, type, listener, options);
        };
        
        // Block createElement for suspicious elements
        document.createElement = function(tagName) {
          const element = _createElement.call(document, tagName);
          
          if (tagName.toLowerCase() === 'a') {
            // Override link click behavior
            Object.defineProperty(element, 'click', {
              value: function() {
                if (this.target === '_blank' || !this.href.startsWith(window.location.origin)) {
                  console.log('[ShieldPro] Blocked programmatic link click');
                  return;
                }
                return HTMLAnchorElement.prototype.click.call(this);
              },
              writable: false,
              configurable: false
            });
          }
          
          return element;
        };
        
        // Block popunder techniques
        let blurTimeout;
        window.addEventListener('blur', function() {
          blurTimeout = setTimeout(() => {
            window.focus();
            console.log('[ShieldPro] Prevented popunder');
          }, 0);
        }, true);
        
        window.addEventListener('focus', function() {
          clearTimeout(blurTimeout);
        }, true);
        
        // Prevent beforeunload dialogs
        window.addEventListener('beforeunload', function(e) {
          delete e.returnValue;
        }, true);
        
        // Block alert/confirm/prompt spam
        let dialogCount = 0;
        const resetDialogs = () => { dialogCount = 0; };
        setInterval(resetDialogs, 10000);
        
        const _alert = window.alert;
        const _confirm = window.confirm;
        const _prompt = window.prompt;
        
        window.alert = function(msg) {
          if (++dialogCount > 1) {
            console.log('[ShieldPro] Blocked excessive alert');
            return;
          }
          return _alert.call(window, msg);
        };
        
        window.confirm = function(msg) {
          if (++dialogCount > 1) {
            console.log('[ShieldPro] Blocked excessive confirm');
            return false;
          }
          return _confirm.call(window, msg);
        };
        
        window.prompt = function(msg, defaultText) {
          if (++dialogCount > 1) {
            console.log('[ShieldPro] Blocked excessive prompt');
            return null;
          }
          return _prompt.call(window, msg, defaultText);
        };
        
        // Report blocked popups
        setInterval(() => {
          if (blockedPopups > 0) {
            window.postMessage({
              type: 'SHIELDPRO_BLOCKED',
              count: blockedPopups
            }, '*');
            blockedPopups = 0;
          }
        }, 1000);
        
        console.log('[ShieldPro] Aggressive popup protection active');
      })();
    `;
    
    // Inject the script as early as possible
    if (document.documentElement) {
      document.documentElement.insertBefore(script, document.documentElement.firstChild);
      script.remove();
    } else {
      // If documentElement doesn't exist yet, wait for it
      const observer = new MutationObserver(() => {
        if (document.documentElement) {
          document.documentElement.insertBefore(script, document.documentElement.firstChild);
          script.remove();
          observer.disconnect();
        }
      });
      observer.observe(document, { childList: true, subtree: true });
    }
  }

  private overrideWindowOpen() {
    // Additional window.open override in content script context
    window.open = new Proxy(this.originalOpen, {
      apply: (target, thisArg, args) => {
        const [url, name, features] = args;
        console.log('[ShieldPro] window.open intercepted:', url);
        
        // Always block in content script context
        this.blockedCount++;
        this.reportBlocked();
        return null;
      }
    });
  }

  private blockClickPopups() {
    // Capture all clicks at the earliest phase
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const now = Date.now();
      
      // Block rapid clicks (likely programmatic)
      if (now - this.lastClickTime < 50) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('[ShieldPro] Blocked rapid click');
        return false;
      }
      this.lastClickTime = now;
      
      // Check for onclick handlers
      if (target.onclick || target.getAttribute('onclick')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('[ShieldPro] Blocked onclick handler');
        this.blockedCount++;
        return false;
      }
      
      // Check parent elements for onclick
      let parent = target.parentElement;
      let depth = 0;
      while (parent && depth < 5) {
        if (parent.onclick || parent.getAttribute('onclick')) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          console.log('[ShieldPro] Blocked parent onclick handler');
          this.blockedCount++;
          return false;
        }
        parent = parent.parentElement;
        depth++;
      }
      
      // Block links with target="_blank" to external domains
      const link = target.closest('a') as HTMLAnchorElement;
      if (link && link.target === '_blank') {
        const linkUrl = new URL(link.href, window.location.href);
        if (linkUrl.hostname !== window.location.hostname) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          console.log('[ShieldPro] Blocked external link:', link.href);
          this.blockedCount++;
          
          // Navigate in same tab instead (safer)
          if (this.isSafeUrl(link.href)) {
            window.location.href = link.href;
          }
          return false;
        }
      }
    }, true); // Use capture phase

    // Also block on mousedown to catch earlier
    document.addEventListener('mousedown', (e) => {
      const target = e.target as HTMLElement;
      
      if (target.onclick || target.getAttribute('onclick') || 
          target.closest('[onclick]') || 
          (target.closest('a') as HTMLAnchorElement)?.target === '_blank') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('[ShieldPro] Blocked mousedown popup trigger');
        return false;
      }
    }, true);
  }

  private preventClickjacking() {
    // Remove all elements with high z-index that might be overlays
    const checkForOverlays = () => {
      const elements = document.querySelectorAll('*');
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const zIndex = parseInt(style.zIndex) || 0;
        
        // Remove high z-index elements that are likely overlays
        if (zIndex > 9999) {
          const isAd = el.className.toLowerCase().includes('ad') ||
                       el.id.toLowerCase().includes('ad') ||
                       el.getAttribute('data-ad') !== null;
          
          if (isAd || style.position === 'fixed' || style.position === 'absolute') {
            el.remove();
            console.log('[ShieldPro] Removed potential overlay ad');
          }
        }
        
        // Remove invisible clickjacking elements
        if (style.opacity === '0' && (el.tagName === 'A' || el.onclick)) {
          el.remove();
          console.log('[ShieldPro] Removed invisible click element');
        }
      });
    };
    
    // Check periodically
    checkForOverlays();
    setInterval(checkForOverlays, 2000);
  }

  private blockPopunders() {
    let lastBlur = 0;
    
    window.addEventListener('blur', () => {
      lastBlur = Date.now();
    }, true);
    
    window.addEventListener('focus', () => {
      const timeSinceBlur = Date.now() - lastBlur;
      
      // If refocused very quickly, likely a popunder attempt
      if (timeSinceBlur < 100) {
        console.log('[ShieldPro] Blocked potential popunder');
        window.focus();
        
        // Close any windows opened in the last 100ms
        // Note: We can't actually close other windows due to security restrictions
        // but we can report it
        this.blockedCount++;
        this.reportBlocked();
      }
    }, true);
  }

  private removeOnclickHandlers() {
    const removeHandlers = () => {
      // Remove onclick from all elements
      document.querySelectorAll('[onclick]').forEach(el => {
        el.removeAttribute('onclick');
        (el as any).onclick = null;
      });
      
      // Remove suspicious event listeners from body and document
      ['click', 'mousedown', 'mouseup', 'contextmenu'].forEach(eventType => {
        document.body.onclick = null;
        document.onclick = null;
      });
    };
    
    // Run immediately and after DOM is ready
    removeHandlers();
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', removeHandlers);
    }
    
    // Also run periodically to catch dynamically added handlers
    setInterval(removeHandlers, 1000);
  }

  private monitorDOMChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            const el = node as HTMLElement;
            
            // Remove onclick handlers from new elements
            if (el.onclick || el.getAttribute('onclick')) {
              el.onclick = null;
              el.removeAttribute('onclick');
              console.log('[ShieldPro] Removed onclick from new element');
            }
            
            // Check all children too
            el.querySelectorAll('[onclick]').forEach(child => {
              child.removeAttribute('onclick');
              (child as any).onclick = null;
            });
            
            // Remove suspicious links
            if (el.tagName === 'A' && (el as HTMLAnchorElement).target === '_blank') {
              (el as HTMLAnchorElement).target = '_self';
            }
            
            el.querySelectorAll('a[target="_blank"]').forEach(link => {
              (link as HTMLAnchorElement).target = '_self';
            });
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['onclick', 'href', 'target']
    });
  }

  private blockProgrammaticClicks() {
    // Override click() method on all elements
    const originalClick = HTMLElement.prototype.click;
    
    HTMLElement.prototype.click = function() {
      if (this.tagName === 'A' && (this as HTMLAnchorElement).target === '_blank') {
        console.log('[ShieldPro] Blocked programmatic click on external link');
        return;
      }
      
      if (this.onclick || this.getAttribute('onclick')) {
        console.log('[ShieldPro] Blocked programmatic click with onclick');
        return;
      }
      
      return originalClick.call(this);
    };
  }

  private preventTabUnder() {
    // Prevent tab-under by monitoring visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page was hidden, likely tab-under attempt
        setTimeout(() => {
          if (document.hidden) {
            // Still hidden after delay, bring it back
            window.focus();
            console.log('[ShieldPro] Prevented tab-under');
          }
        }, 100);
      }
    });
  }

  private isSafeUrl(url: string): boolean {
    try {
      const urlObj = new URL(url, window.location.href);
      
      // Block known ad domains
      const adDomains = [
        'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
        'amazon-adsystem.com', 'popads.net', 'popcash.net', 'popunder.net',
        'outbrain.com', 'taboola.com', 'mgid.com'
      ];
      
      return !adDomains.some(domain => urlObj.hostname.includes(domain));
    } catch {
      return false;
    }
  }

  private reportBlocked() {
    // Report to background script
    chrome.runtime.sendMessage({
      action: 'popupBlocked',
      url: window.location.href,
      count: this.blockedCount
    }).catch(() => {
      // Silent fail if extension context is invalidated
    });
  }

  public getBlockedCount(): number {
    return this.blockedCount;
  }
}

// Auto-initialize
export const aggressivePopupBlocker = new AggressivePopupBlocker();