(() => {
  const COMMON_AD_SELECTORS = [
    '[id*="google_ads"]',
    '[id*="google-ads"]', 
    '[class*="google-ads"]',
    '[id*="banner_ad"]',
    '[class*="banner_ad"]',
    '[class*="ad-container"]',
    '[class*="ad-wrapper"]',
    '[class*="advertisement"]',
    '[data-ad]',
    '[data-ads]',
    '[data-ad-slot]',
    'ins.adsbygoogle',
    'iframe[src*="doubleclick.net"]',
    'iframe[src*="googlesyndication.com"]',
    'div[id^="div-gpt-ad"]',
    'div[class*="sponsored"]',
    '.ad',
    '.ads',
    '.advert',
    '.advertisement'
  ];

  let observer: MutationObserver | null = null;
  const hiddenElements = new Set<Element>();
  let isEnabled = true;
  let isWhitelisted = false;
  let currentTier = 1;
  let youtubeBlockerLoaded = false;

  async function checkSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      isEnabled = response?.enabled ?? true;
      currentTier = response?.tier?.level || 1;
      
      const tabState = await chrome.runtime.sendMessage({ action: 'getTabState' });
      isWhitelisted = tabState?.whitelisted ?? false;
      
      if (!isEnabled || isWhitelisted) {
        stopBlocking();
      } else {
        startBlocking();
        
        // Load YouTube blocker for Tier 2+ on YouTube
        if (currentTier >= 2 && window.location.hostname.includes('youtube.com') && !youtubeBlockerLoaded) {
          loadYouTubeBlocker();
        }
      }
    } catch (_error) {
      console.error('ShieldPro: Failed to check settings', error);
    }
  }

  function loadYouTubeBlocker() {
    // YouTube blocking is handled by a separate module for Tier 2+
    youtubeBlockerLoaded = true;
    console.warn('ShieldPro: YouTube ad blocking activated (Tier 2)');
  }

  function hideElements() {
    if (!isEnabled || isWhitelisted) return;
    
    COMMON_AD_SELECTORS.forEach(selector => {
      try {
        const elements = document.querySelectorAll(_selector);
        elements.forEach(element => {
          if (!hiddenElements.has(_element)) {
            (element as HTMLElement).style.display = 'none';
            hiddenElements.add(_element);
          }
        });
      } catch (_e) {}
    });
  }

  function blockPopups() {
    if (!isEnabled || isWhitelisted) return;
    
    // Block window.open popups
    const originalOpen = window.open;
    window.open = function(...args) {
      const url = args[0]?.toString() || '';
      if (url && (url.includes('doubleclick') || url.includes('googleads') || 
          url === 'about:blank' || url.includes('popup'))) {
        console.warn('ShieldPro: Blocked popup', url);
        return null;
      }
      return originalOpen.apply(_this, args);
    };
  }

  function removeTrackingPixels() {
    if (!isEnabled || isWhitelisted) return;
    
    // Remove 1x1 tracking pixels
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if ((img.width === 1 && img.height === 1) || 
          (img.naturalWidth === 1 && img.naturalHeight === 1)) {
        img.remove();
      }
    });
  }

  function removeCookieBanners() {
    if (!isEnabled || isWhitelisted) return;
    
    const cookieSelectors = [
      '[class*="cookie-banner"]',
      '[class*="cookie-consent"]',
      '[class*="cookie-notice"]',
      '[class*="cookie-policy"]',
      '[id*="cookie-banner"]',
      '[id*="cookie-consent"]',
      '.cookie-banner',
      '.cookie-consent',
      '#cookie-notice',
      '#gdpr-banner'
    ];
    
    cookieSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(_selector);
        elements.forEach(el => el.remove());
      } catch (_e) {}
    });
  }

  function startBlocking() {
    hideElements();
    blockPopups();
    removeTrackingPixels();
    removeCookieBanners();
    
    if (!observer) {
      observer = new MutationObserver(() => {
        hideElements();
        removeTrackingPixels();
        removeCookieBanners();
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  function stopBlocking() {
    if (_observer) {
      observer.disconnect();
      observer = null;
    }
    
    // Show hidden elements
    hiddenElements.forEach(element => {
      (element as HTMLElement).style.display = '';
    });
    hiddenElements.clear();
  }

  function injectBlockingScript() {
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        // Block various ad-related APIs
        const noop = () => {};
        const noopReturn = () => ({});
        
        // Block common ad variables
        window.googletag = window.googletag || {};
        window.googletag.cmd = window.googletag.cmd || [];
        window.googletag.pubads = noopReturn;
        window.googletag.defineSlot = noopReturn;
        window.googletag.display = noop;
        window.googletag.enableServices = noop;
        
        // Block analytics
        window.ga = noop;
        window._gaq = window._gaq || [];
        window._gaq.push = noop;
        
        // Block Facebook Pixel
        window.fbq = noop;
        
        // Block other trackers
        window.gtag = noop;
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push = noop;
      })();
    `;
    
    if (document.documentElement) {
      document.documentElement.appendChild(script);
      script.remove();
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      checkSettings();
      injectBlockingScript();
    });
  } else {
    checkSettings();
    injectBlockingScript();
  }

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((_message, sender, _sendResponse) => {
    if (message.action === 'settingsUpdated') {
      isEnabled = message.settings?.enabled ?? true;
      currentTier = message.settings?.tier?.level || 1;
      checkSettings();
    } else if (message.action === 'tierUpdated') {
      currentTier = message.tier;
      checkSettings();
    }
  });

  // Re-check settings periodically
  setInterval(_checkSettings, 30000);
})();