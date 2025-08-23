import browser from 'webextension-polyfill';

console.log('ShieldPro Ultimate - Background Service Worker Started');

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension installed');
    chrome.storage.local.set({
      enabled: true,
      tier: 1,
      blockedCount: 0,
      installDate: Date.now(),
      lastActiveDate: Date.now(),
    });
    
    chrome.tabs.create({
      url: chrome.runtime.getURL('options.html?welcome=true')
    });
  } else if (details.reason === 'update') {
    console.log('Extension updated to version:', chrome.runtime.getManifest().version);
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getBlockedCount') {
    chrome.storage.local.get('blockedCount', (data) => {
      sendResponse({ count: data.blockedCount || 0 });
    });
    return true;
  }
  
  if (request.action === 'incrementBlockedCount') {
    chrome.storage.local.get('blockedCount', (data) => {
      const newCount = (data.blockedCount || 0) + 1;
      chrome.storage.local.set({ blockedCount: newCount });
      
      chrome.action.setBadgeText({ text: newCount.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
    });
  }
  
  if (request.action === 'toggleExtension') {
    chrome.storage.local.get('enabled', (data) => {
      const newState = !data.enabled;
      chrome.storage.local.set({ enabled: newState });
      
      updateIcon(newState);
      sendResponse({ enabled: newState });
    });
    return true;
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    chrome.storage.local.get(['enabled', 'tier'], (data) => {
      if (data.enabled) {
        console.log(`Tab ${tabId} loaded, applying tier ${data.tier} rules`);
      }
    });
  }
});

chrome.alarms.create('dailyEngagement', { periodInMinutes: 24 * 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyEngagement') {
    chrome.storage.local.set({ lastActiveDate: Date.now() });
  }
});

function updateIcon(enabled: boolean) {
  const iconPath = enabled ? 'icons/icon-' : 'icons/icon-disabled-';
  chrome.action.setIcon({
    path: {
      '16': `${iconPath}16.png`,
      '32': `${iconPath}32.png`,
      '48': `${iconPath}48.png`,
      '128': `${iconPath}128.png`,
    }
  });
}

export {};