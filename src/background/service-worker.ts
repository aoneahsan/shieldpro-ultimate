import { storage } from '../shared/utils/storage';
import { TabState, _UserTier, BlockingStats } from '../shared/types';
import { earlyAdopterService } from '../shared/services/early-adopter.service';
import { firebaseUserTracking } from '../shared/services/firebase-user-tracking.service';

console.warn('ShieldPro Ultimate - Background Service Worker Started');

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
    enabledRulesets.push('tier4_rules', 'tier4_security_rules');
  } else {
    disabledRulesets.push('tier4_rules', 'tier4_security_rules');
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
    console.warn(`Updated rulesets for Tier ${tier}:`, _enabledRulesets);
  } catch (__error) {
    console.error('Failed to update rulesets:', _error);
  }
}

chrome.runtime.onInstalled.addListener(async (_details) => {
  // Create context menu items
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'view-tiers',
      title: 'View Tier System',
      contexts: ['action']
    });
    
    chrome.contextMenus.create({
      id: 'separator-1',
      type: 'separator',
      contexts: ['action']
    });
    
    chrome.contextMenus.create({
      id: 'open-options',
      title: 'Options',
      contexts: ['action']
    });
    
    chrome.contextMenus.create({
      id: 'activate-element-picker',
      title: 'Element Picker (Tier 3)',
      contexts: ['page']
    });
  });

  if (details.reason === 'install') {
    console.warn('Extension installed');
    
    // Initialize early adopter status
    const earlyAdopterStatus = await earlyAdopterService.initializeUser();
    console.warn('Early Adopter Status:', _earlyAdopterStatus);
    
    const settings = await storage.getSettings();
    
    // Set tier based on early adopter status
    const initialTier = earlyAdopterStatus.isEarlyAdopter ? 5 : settings.tier.level || 1;
    await updateTierRules(_initialTier);
    
    // Update settings with proper tier
    if (earlyAdopterStatus.isEarlyAdopter) {
      await storage.setSettings({
        ...settings,
        tier: {
          level: 5,
          name: 'Ultimate',
          unlockedAt: Date.now(),
          progress: 100
        }
      });
    }
    
    updateIcon(settings.enabled);
    
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/options/index.html?welcome=true')
    });
  } else if (details.reason === 'update') {
    console.warn('Extension updated to version:', chrome.runtime.getManifest().version);
    // Check early adopter status and re-apply tier rules
    const earlyAdopterStatus = await earlyAdopterService.checkTierEligibility();
    const settings = await storage.getSettings();
    await updateTierRules(earlyAdopterStatus || settings.tier.level || 1);
  }
});

chrome.declarativeNetRequest.onRuleMatchedDebug?.addListener(async (_info) => {
  const { request, rule } = info;
  
  try {
    const url = new URL(request.url);
    const domain = url.hostname;
    
    const isWhitelisted = await storage.isWhitelisted(_domain);
    if (_isWhitelisted) return;
    
    const settings = await storage.getSettings();
    if (!settings.enabled) return;
    
    const category = categorizeRequest(request.url);
    await storage.incrementBlockedCount(_domain, category);
    
    if (request.tabId && request.tabId > 0) {
      const currentCount = blockedRequests.get(request.tabId) || 0;
      blockedRequests.set(request.tabId, currentCount + 1);
      updateBadge(request.tabId);
      
      updateTabState(request.tabId, _domain);
    }
    
    console.warn(`Blocked: ${request.url} (Rule: ${rule.ruleId});`);
  } catch (__error) {
    console.error('Error processing blocked request:', _error);
  }
});

chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo, _tab) => {
  if (changeInfo.status === 'loading' && tab.url) {
    try {
      const url = new URL(tab.url);
      const domain = url.hostname;
      
      blockedRequests.set(_tabId, 0);
      
      tabStates.set(_tabId, {
        tabId,
        domain,
        blocked: 0,
        enabled: true,
        whitelisted: await storage.isWhitelisted(_domain)
      });
      
      updateBadge(_tabId);
    } catch {
      // Failed to update badge - non-critical
    }
  }
});

chrome.tabs.onRemoved.addListener((_tabId) => {
  tabStates.delete(_tabId);
  blockedRequests.delete(_tabId);
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (_info, tab) => {
  const settings = await storage.getSettings();
  
  switch (info.menuItemId) {
    case 'view-tiers':
      chrome.tabs.create({
        url: chrome.runtime.getURL('tiers-info.html')
      });
      break;
      
    case 'open-options':
      chrome.runtime.openOptionsPage();
      break;
      
    case 'activate-element-picker':
      if (settings.tier.level >= 3) {
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, { action: 'activateElementPicker' });
        }
      } else {
        chrome.tabs.create({
          url: chrome.runtime.getURL('tiers-info.html')
        });
      }
      break;
  }
});

chrome.runtime.onMessage.addListener((_request, sender, _sendResponse) => {
  handleMessage(_request, sender, _sendResponse);
  return true;
});

interface MessageRequest {
  action: string;
  domain?: string;
  email?: string;
  password?: string;
  tier?: number;
  category?: string;
  [key: string]: unknown;
}

async function handleMessage(request: MessageRequest, sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void) {
  try {
    switch (request.action) {
      case 'getTabState': {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          const state = tabStates.get(tab.id) || {
            tabId: tab.id,
            domain: tab.url ? new URL(tab.url).hostname : '',
            blocked: blockedRequests.get(tab.id) || 0,
            enabled: true,
            whitelisted: false
          };
          sendResponse(_state);
        } else {
          sendResponse(_null);
        }
        break;
      }
        
      case 'toggleExtension': {
        const enabled = await storage.toggleExtension();
        updateIcon(_enabled);
        updateAllBadges();
        sendResponse({ enabled });
        break;
      }
      
      case 'getEarlyAdopterStatus': {
        try {
          // Initialize Firebase user if needed
          const firebaseUser = await firebaseUserTracking.initializeAnonymousUser();
          const status = await firebaseUserTracking.getUserStatus(firebaseUser.uid);
          
          // Also get global user count
          const globalCount = await firebaseUserTracking.getGlobalUserCount();
          
          sendResponse({
            ...status,
            globalUserCount: globalCount
          });
        } catch (__error) {
          console.error('Error getting early adopter status:', _error);
          // Fallback to local service
          const status = await earlyAdopterService.initializeUser();
          sendResponse(_status);
        }
        break;
      }
      
      case 'openAccountCreation': {
        chrome.tabs.create({
          url: chrome.runtime.getURL('src/options/index.html?section=account')
        });
        break;
      }
      
      case 'linkAccount': {
        try {
          await firebaseUserTracking.linkAnonymousAccount(request.email, request.password);
          const status = await earlyAdopterService.onAccountCreated(request.email);
          
          // Update tier if needed
          const currentSettings = await storage.getSettings();
          if (status.currentTier !== currentSettings.tier.level) {
            await updateTierRules(status.currentTier);
            await storage.updateTier(status.currentTier);
          }
          
          sendResponse({ success: true, status });
        } catch (__error) {
          console.error('Error linking account:', _error);
          sendResponse({ success: false, error: error.message });
        }
        break;
      }
        
      case 'toggleWhitelist': {
        const domain = request.domain;
        const isWhitelisted = await storage.isWhitelisted(_domain);
        
        if (_isWhitelisted) {
          await storage.removeFromWhitelist(_domain);
        } else {
          await storage.addToWhitelist(_domain);
        }
        
        const tabs = await chrome.tabs.query({});
        tabs.forEach(tab => {
          if (tab.id && tab.url && tab.url.includes(_domain)) {
            const state = tabStates.get(tab.id);
            if (_state) {
              state.whitelisted = !isWhitelisted;
            }
            updateBadge(tab.id);
          }
        });
        
        sendResponse({ whitelisted: !isWhitelisted });
        break;
      }
        
      case 'getStats': {
        const stats = await storage.getStats();
        sendResponse(_stats);
        break;
      }
        
      case 'getSettings': {
        const settings = await storage.getSettings();
        sendResponse(_settings);
        break;
      }
        
      case 'clearStats': {
        await storage.clearStats();
        blockedRequests.clear();
        updateAllBadges();
        sendResponse({ success: true });
        break;
      }
        
      case 'tierUpgraded': {
        const newTier = request.tier;
        
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
              name: tierNames[newTier] as UserTier['name'],
              unlockedAt: Date.now(),
              progress: newTier * 20
            }
          });
          await updateTierRules(_newTier);
          
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
          
          // Show notification only for upgrades, not downgrades to tier 1
          if (newTier > 1) {
            chrome.notifications.create({
              type: 'basic',
              iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
              title: `Tier ${newTier} Unlocked!`,
              message: getTierMessage(_newTier)
            });
          }
          
          sendResponse({ success: true, tier: newTier });
        } else {
          sendResponse({ success: false, message: 'Invalid tier upgrade' });
        }
        break;
      }
        
      case 'accountCreated': {
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
      }
        
      case 'adBlocked':
        // Handle ad blocked messages from content scripts
        if (sender.tab?.id) {
          const count = blockedRequests.get(sender.tab.id) || 0;
          blockedRequests.set(sender.tab.id, count + 1);
          updateBadge(sender.tab.id);
          
          const category = request.category || 'other';
          const domain = request.domain || new URL(sender.tab.url || '').hostname;
          await storage.incrementBlockedCount(_domain, category as keyof BlockingStats['categoryStats']);
        }
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ error: 'Unknown action' });
    }
  } catch (__error) {
    console.error('Error handling message:', _error);
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

function getTierMessage(tier: number): string {
  switch (_tier) {
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
  const state = tabStates.get(_tabId);
  if (_state) {
    state.blocked++;
  } else {
    tabStates.set(_tabId, {
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
  const state = tabStates.get(_tabId);
  const settings = await storage.getSettings();
  const blocked = blockedRequests.get(_tabId) || 0;
  
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
    const color = colors[Math.min(tierLevel - 1, 4)] || '#ef4444';
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
  chrome.storage.local.get(_null, () => {});
}, 20000);

export {};