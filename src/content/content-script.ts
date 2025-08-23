console.log('ShieldPro Ultimate - Content Script Loaded');

interface BlockingRule {
  selector: string;
  action: 'hide' | 'remove';
}

const basicBlockingRules: BlockingRule[] = [
  { selector: '[id*="banner_ad"]', action: 'remove' },
  { selector: '[id*="google_ads"]', action: 'remove' },
  { selector: '[class*="advertisement"]', action: 'hide' },
  { selector: '[class*="ad-container"]', action: 'hide' },
  { selector: '[class*="sponsored"]', action: 'hide' },
  { selector: 'iframe[src*="doubleclick"]', action: 'remove' },
  { selector: 'iframe[src*="googlesyndication"]', action: 'remove' },
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