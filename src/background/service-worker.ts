import { storage } from '../shared/utils/storage';
import { TabState } from '../shared/types';

console.log('ShieldPro Ultimate - Background Service Worker Started');

const tabStates = new Map<number, TabState>();
const blockedRequests = new Map<number, number>();

// Update active rulesets based on user tier
async function updateTierRules(tier: number): Promise<void> {
  const enabledRulesets: string[] = ['tier1_rules'];
  const disabledRulesets: string[] = [];
  
  // Enable rules based on tier level
  if (tier >= 2) {
    enabledRulesets.push('tier2_rules');
  } else {
    disabledRulesets.push('tier2_rules');
  }
  
  if (tier >= 3) {
    enabledRulesets.push('tier3_rules');
  } else {
    disabledRulesets.push('tier3_rules');
  }
  
  if (tier >= 4) {
    enabledRulesets.push('tier4_rules');
  } else {
    disabledRulesets.push('tier4_rules');
  }
  
  if (tier >= 5) {
    enabledRulesets.push('tier5_rules');
  } else {
    disabledRulesets.push('tier5_rules');
  }
  
  try {
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: enabledRulesets,
      disableRulesetIds: disabledRulesets
    });
    console.log(`Updated rulesets for Tier ${tier}:`, enabledRulesets);
  } catch (error) {
    console.error('Failed to update rulesets:', error);
  }
}

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('Extension installed');
    
    const settings = await storage.getSettings();
    const stats = await storage.getStats();
    
    // Enable tier-based rulesets
    await updateTierRules(settings.tier.level || 1);
    
    updateIcon(settings.enabled);
    
    chrome.tabs.create({
      url: chrome.runtime.getURL('options.html?welcome=true')
    });
  } else if (details.reason === 'update') {
    console.log('Extension updated to version:', chrome.runtime.getManifest().version);
    // Re-apply tier rules after update
    const settings = await storage.getSettings();
    await updateTierRules(settings.tier.level || 1);
  }
});

chrome.declarativeNetRequest.onRuleMatchedDebug?.addListener(async (info) => {
  const { request, rule } = info;
  
  try {
    const url = new URL(request.url);
    const domain = url.hostname;
    
    const isWhitelisted = await storage.isWhitelisted(domain);
    if (isWhitelisted) return;
    
    const settings = await storage.getSettings();
    if (!settings.enabled) return;
    
    const category = categorizeRequest(request.url);
    await storage.incrementBlockedCount(domain, category);
    
    if (request.tabId && request.tabId > 0) {
      const currentCount = blockedRequests.get(request.tabId) || 0;
      blockedRequests.set(request.tabId, currentCount + 1);
      updateBadge(request.tabId);
      
      updateTabState(request.tabId, domain);
    }
    
    console.log(`Blocked: ${request.url} (Rule: ${rule.ruleId})`);
  } catch (error) {
    console.error('Error processing blocked request:', error);
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url) {
    try {
      const url = new URL(tab.url);
      const domain = url.hostname;
      
      blockedRequests.set(tabId, 0);
      
      tabStates.set(tabId, {
        tabId,
        domain,
        blocked: 0,
        enabled: true,
        whitelisted: await storage.isWhitelisted(domain)
      });
      
      updateBadge(tabId);
    } catch (error) {}
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabStates.delete(tabId);
  blockedRequests.delete(tabId);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender, sendResponse);
  return true;
});

async function handleMessage(request: any, sender: any, sendResponse: Function) {
  try {
    switch (request.action) {
      case 'getTabState':
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          const state = tabStates.get(tab.id) || {
            tabId: tab.id,
            domain: tab.url ? new URL(tab.url).hostname : '',
            blocked: blockedRequests.get(tab.id) || 0,
            enabled: true,
            whitelisted: false
          };
          sendResponse(state);
        } else {
          sendResponse(null);
        }
        break;
        
      case 'toggleExtension':
        const enabled = await storage.toggleExtension();
        updateIcon(enabled);
        updateAllBadges();
        sendResponse({ enabled });
        break;
        
      case 'toggleWhitelist':
        const domain = request.domain;
        const isWhitelisted = await storage.isWhitelisted(domain);
        
        if (isWhitelisted) {
          await storage.removeFromWhitelist(domain);
        } else {
          await storage.addToWhitelist(domain);
        }
        
        const tabs = await chrome.tabs.query({});
        tabs.forEach(tab => {
          if (tab.id && tab.url && tab.url.includes(domain)) {
            const state = tabStates.get(tab.id);
            if (state) {
              state.whitelisted = !isWhitelisted;
            }
            updateBadge(tab.id);
          }
        });
        
        sendResponse({ whitelisted: !isWhitelisted });
        break;
        
      case 'getStats':
        const stats = await storage.getStats();
        sendResponse(stats);
        break;
        
      case 'getSettings':
        const settings = await storage.getSettings();
        sendResponse(settings);
        break;
        
      case 'clearStats':
        await storage.clearStats();
        blockedRequests.clear();
        updateAllBadges();
        sendResponse({ success: true });
        break;
        
      case 'tierUpgraded':
        const newTier = request.tier;
        const userId = request.userId;
        
        if (newTier >= 1 && newTier <= 5) {
          const currentSettings = await storage.getSettings();
          const tierNames: Record<number, string> = {
            1: 'Basic',
            2: 'Enhanced',
            3: 'Professional',
            4: 'Premium',
            5: 'Ultimate'
          };
          
          await storage.setSettings({ 
            ...currentSettings, 
            tier: {
              level: newTier,
              name: tierNames[newTier] as any,
              unlockedAt: Date.now(),
              progress: newTier * 20
            }
          });
          await updateTierRules(newTier);
          
          // Notify all tabs about tier upgrade
          const allTabs = await chrome.tabs.query({});
          allTabs.forEach(tab => {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, {
                action: 'tierUpdated',
                tier: newTier
              }).catch(() => {}); // Ignore errors for tabs without content script
            }
          });
          
          // Show notification
          chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
            title: `Tier ${newTier} Unlocked!`,
            message: getTierMessage(newTier)
          });
          
          sendResponse({ success: true, tier: newTier });
        } else {
          sendResponse({ success: false, message: 'Invalid tier upgrade' });
        }
        break;
        
      case 'accountCreated':
        const settingsForAccount = await storage.getSettings();
        if (settingsForAccount.tier.level < 2) {
          await storage.setSettings({ 
            ...settingsForAccount, 
            tier: {
              level: 2,
              name: 'Enhanced',
              unlockedAt: Date.now(),
              progress: 20
            }
          });
          await updateTierRules(2);
          
          // Notify all tabs
          const tabsForNotify = await chrome.tabs.query({});
          tabsForNotify.forEach(tab => {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, {
                action: 'tierUpdated',
                tier: 2
              }).catch(() => {});
            }
          });
          
          // Show notification
          chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
            title: 'Tier 2 Unlocked!',
            message: 'YouTube ad blocking and advanced tracker blocking are now active!'
          });
          
          sendResponse({ success: true, tier: 2 });
        } else {
          sendResponse({ success: false, message: 'Already at Tier 2 or higher' });
        }
        break;
        
      case 'adBlocked':
        // Handle ad blocked messages from content scripts
        if (sender.tab?.id) {
          const count = blockedRequests.get(sender.tab.id) || 0;
          blockedRequests.set(sender.tab.id, count + 1);
          updateBadge(sender.tab.id);
          
          const category = request.category || 'other';
          const domain = request.domain || new URL(sender.tab.url || '').hostname;
          await storage.incrementBlockedCount(domain, category as any);
        }
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ error: error.message });
  }
}

function getTierMessage(tier: number): string {
  switch (tier) {
    case 2:
      return 'YouTube ad blocking and advanced tracker blocking are now active!';
    case 3:
      return 'Custom filters and element picker are now available!';
    case 4:
      return 'Premium features unlocked! Enjoy malware protection and advanced privacy tools.';
    case 5:
      return 'Ultimate protection activated! All features are now available.';
    default:
      return 'New features unlocked!';
  }
}

function categorizeRequest(url: string): keyof import('../shared/types').BlockingStats['categoryStats'] {
  const lowerUrl = url.toLowerCase();
  
  // YouTube specific
  if (lowerUrl.includes('youtube.com') && (lowerUrl.includes('/api/stats/') || 
      lowerUrl.includes('/pagead/') || lowerUrl.includes('/ptracking'))) {
    return 'youtube';
  }
  
  // Ads
  if (lowerUrl.includes('doubleclick') || lowerUrl.includes('googlesyndication') || 
      lowerUrl.includes('adsystem') || lowerUrl.includes('adserver') ||
      lowerUrl.includes('googleadservices') || lowerUrl.includes('googlevideo.com/videoplayback')) {
    return 'ads';
  }
  
  // Analytics and trackers
  if (lowerUrl.includes('analytics') || lowerUrl.includes('metrics') || 
      lowerUrl.includes('tracking') || lowerUrl.includes('beacon') ||
      lowerUrl.includes('mixpanel') || lowerUrl.includes('segment') ||
      lowerUrl.includes('amplitude') || lowerUrl.includes('hotjar') ||
      lowerUrl.includes('fullstory') || lowerUrl.includes('mouseflow') ||
      lowerUrl.includes('clarity.ms') || lowerUrl.includes('crazyegg')) {
    return 'trackers';
  }
  
  // Social media
  if (lowerUrl.includes('facebook') || lowerUrl.includes('twitter') || 
      lowerUrl.includes('linkedin') || lowerUrl.includes('pinterest') ||
      lowerUrl.includes('instagram') || lowerUrl.includes('tiktok')) {
    return 'social';
  }
  
  return 'other';
}

function updateTabState(tabId: number, domain: string) {
  const state = tabStates.get(tabId);
  if (state) {
    state.blocked++;
  } else {
    tabStates.set(tabId, {
      tabId,
      domain,
      blocked: 1,
      enabled: true,
      whitelisted: false
    });
  }
}

function updateIcon(enabled: boolean) {
  const path = enabled ? {
    16: 'icons/icon-16.png',
    32: 'icons/icon-32.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png'
  } : {
    16: 'icons/icon-16.png',
    32: 'icons/icon-32.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png'
  };
  
  chrome.action.setIcon({ path });
  
  if (!enabled) {
    chrome.action.setBadgeBackgroundColor({ color: '#94a3b8' });
    chrome.action.setBadgeText({ text: 'OFF' });
  }
}

async function updateBadge(tabId: number) {
  const state = tabStates.get(tabId);
  const settings = await storage.getSettings();
  const blocked = blockedRequests.get(tabId) || 0;
  
  if (!settings.enabled) {
    chrome.action.setBadgeText({ text: 'OFF', tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#94a3b8', tabId });
    return;
  }
  
  if (state?.whitelisted) {
    chrome.action.setBadgeText({ text: '', tabId });
    return;
  }
  
  const text = blocked > 999 ? '999+' : blocked > 0 ? blocked.toString() : '';
  
  chrome.action.setBadgeText({ text, tabId });
  if (blocked > 0) {
    // Use different colors based on tier
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];
    const tierLevel = settings.tier.level || 1;
    const color = colors[Math.min(tierLevel - 1, 4)];
    chrome.action.setBadgeBackgroundColor({ color, tabId });
  }
}

async function updateAllBadges() {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id) {
      updateBadge(tab.id);
    }
  }
}

// Keep service worker alive
setInterval(() => {
  chrome.storage.local.get(null, () => {});
}, 20000);

export {};