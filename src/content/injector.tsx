import { PopupBlocker } from './popup-blocker';
import { CookieConsentBlocker } from './cookie-consent-blocker';
import { YouTubeBlocker } from './youtube-blocker';
import ElementPicker from './element-picker';

console.log('[ShieldPro] Content script injected');

// Initialize all content script modules
async function initializeContentScripts() {
  try {
    // Initialize popup blocker (Tier 1)
    const popupBlocker = new PopupBlocker();
    await popupBlocker.init();
    console.log('[ShieldPro] Popup blocker initialized');

    // Initialize cookie consent blocker (Tier 1)
    const cookieBlocker = new CookieConsentBlocker();
    await cookieBlocker.init();
    console.log('[ShieldPro] Cookie consent blocker initialized');

    // Initialize YouTube blocker (Tier 2+)
    if (window.location.hostname.includes('youtube.com')) {
      const youtubeBlocker = new YouTubeBlocker();
      await youtubeBlocker.init();
      console.log('[ShieldPro] YouTube blocker initialized');
    }

    // Initialize element picker (Tier 3+)
    const elementPicker = new ElementPicker();
    await elementPicker.init();
    console.log('[ShieldPro] Element picker initialized');

    // Listen for messages from popup/background
    chrome.runtime.onMessage.addListener((request) => {
      if (request.action === 'testSelector' && request.selector) {
        try {
          const elements = document.querySelectorAll(request.selector);
          sendResponse({ matchCount: elements.length });
        } catch {
          sendResponse({ matchCount: 0, error: 'Invalid selector' });
        }
      }
      return true;
    });
  } catch {
    console.error('[ShieldPro] Error initializing content scripts:', error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeContentScripts);
} else {
  initializeContentScripts();
}

// Re-initialize on navigation for SPAs
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    if (window.location.hostname.includes('youtube.com')) {
      const youtubeBlocker = new YouTubeBlocker();
      youtubeBlocker.init();
    }
  }
}).observe(document, { subtree: true, childList: true });

export {};
