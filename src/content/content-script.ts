console.log('ShieldPro Ultimate - Content Script Loaded');

// Import blockers
import './popup-blocker';
import './cookie-consent-blocker';

interface BlockingRule {
  selector: string;
  action: 'hide' | 'remove';
}

// Enhanced blocking rules for Tier 1
const basicBlockingRules: BlockingRule[] = [
  // Ad containers
  { selector: '[id*="banner_ad"]', action: 'remove' },
  { selector: '[id*="google_ads"]', action: 'remove' },
  { selector: '[id*="banner-ad"]', action: 'remove' },
  { selector: '[id*="google-ad"]', action: 'remove' },
  { selector: '[class*="advertisement"]', action: 'hide' },
  { selector: '[class*="ad-container"]', action: 'hide' },
  { selector: '[class*="ad-wrapper"]', action: 'hide' },
  { selector: '[class*="ad-banner"]', action: 'hide' },
  { selector: '[class*="sponsored"]', action: 'hide' },
  { selector: '[class*="sponsor-"]', action: 'hide' },
  
  // Iframes
  { selector: 'iframe[src*="doubleclick"]', action: 'remove' },
  { selector: 'iframe[src*="googlesyndication"]', action: 'remove' },
  { selector: 'iframe[src*="googleadservices"]', action: 'remove' },
  { selector: 'iframe[src*="amazon-adsystem"]', action: 'remove' },
  { selector: 'iframe[src*="facebook.com/plugins"]', action: 'remove' },
  { selector: 'iframe[src*="platform.twitter"]', action: 'remove' },
  
  // Common ad divs
  { selector: 'div[id*="ad-"]', action: 'hide' },
  { selector: 'div[id*="ads-"]', action: 'hide' },
  { selector: 'div[class*="ad-slot"]', action: 'hide' },
  { selector: 'div[class*="advert"]', action: 'hide' },
  { selector: 'div[data-ad]', action: 'hide' },
  { selector: 'div[data-ads]', action: 'hide' },
  
  // Sticky ads
  { selector: '[class*="sticky-ad"]', action: 'remove' },
  { selector: '[class*="fixed-ad"]', action: 'remove' },
  { selector: '[class*="floating-ad"]', action: 'remove' },
  
  // Video ads
  { selector: '[class*="video-ad"]', action: 'remove' },
  { selector: '[class*="preroll-ad"]', action: 'remove' },
  { selector: '[class*="midroll-ad"]', action: 'remove' },
  
  // Native ads
  { selector: '[class*="native-ad"]', action: 'hide' },
  { selector: '[class*="promoted-content"]', action: 'hide' },
  { selector: '[class*="recommended-ad"]', action: 'hide' },
];

let blockedCount = 0;

function applyBlockingRules(rules: BlockingRule[]) {
  rules.forEach(rule => {
    const elements = document.querySelectorAll(rule.selector);
    elements.forEach(element => {
      if (rule.action === 'remove') {
        element.remove();
      } else if (rule.action === 'hide') {
        (element as HTMLElement).style.display = 'none';
      }
      blockedCount++;
    });
  });
  
  if (blockedCount > 0) {
    chrome.runtime.sendMessage({ action: 'incrementBlockedCount' });
  }
}

chrome.storage.local.get(['enabled', 'tier'], (data) => {
  if (data.enabled) {
    applyBlockingRules(basicBlockingRules);
    
    const observer = new MutationObserver(() => {
      applyBlockingRules(basicBlockingRules);
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded - Applying blocking rules');
  chrome.storage.local.get(['enabled'], (data) => {
    if (data.enabled) {
      applyBlockingRules(basicBlockingRules);
    }
  });
});

export {};