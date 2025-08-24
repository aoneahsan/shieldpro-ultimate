# ShieldPro Ultimate API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Chrome Extension APIs](#chrome-extension-apis)
4. [Firebase Functions](#firebase-functions)
5. [Message Passing](#message-passing)
6. [Storage APIs](#storage-apis)
7. [Error Handling](#error-handling)

## Overview

ShieldPro Ultimate provides various APIs for interaction between extension components and external services.

## Authentication

### Firebase Authentication

#### Sign Up
```typescript
import authService from '@/services/auth.service';

// Sign up new user
const user = await authService.signUp(
  email: string,
  password: string,
  displayName?: string,
  referralCode?: string
);
```

#### Sign In
```typescript
// Email/Password sign in
const user = await authService.signIn(email: string, password: string);

// Social sign in
const user = await authService.signInWithSocial('google' | 'facebook' | 'github');
```

#### Sign Out
```typescript
await authService.signOut();
```

#### Get Current User
```typescript
const user = authService.getCurrentUser();
const profile = authService.getUserProfile();
const tier = authService.getUserTier();
```

## Chrome Extension APIs

### Message Passing

#### Send Message from Popup/Content to Background
```javascript
// Get tab state
const response = await chrome.runtime.sendMessage({ 
  action: 'getTabState' 
});

// Toggle extension
const { enabled } = await chrome.runtime.sendMessage({ 
  action: 'toggleExtension' 
});

// Toggle whitelist
const { whitelisted } = await chrome.runtime.sendMessage({ 
  action: 'toggleWhitelist',
  domain: 'example.com'
});

// Get statistics
const stats = await chrome.runtime.sendMessage({ 
  action: 'getStats' 
});

// Clear statistics
await chrome.runtime.sendMessage({ 
  action: 'clearStats' 
});

// Tier upgrade notification
await chrome.runtime.sendMessage({ 
  action: 'tierUpgraded',
  tier: 2,
  userId: 'user123'
});
```

#### Listen for Messages in Background
```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch(request.action) {
    case 'getTabState':
      // Return tab state
      sendResponse(tabState);
      break;
    // ... other cases
  }
  return true; // Keep channel open for async response
});
```

### Storage API

#### Local Storage
```typescript
import { StorageManager } from '@/shared/utils/storage';

const storage = StorageManager.getInstance();

// Get settings
const settings = await storage.getSettings();

// Update settings
await storage.setSettings({
  tier: {
    level: 2,
    name: 'Enhanced',
    unlockedAt: Date.now(),
    progress: 20
  }
});

// Get statistics
const stats = await storage.getStats();

// Increment blocked count
await storage.incrementBlockedCount(domain, category);

// Whitelist management
await storage.addToWhitelist('example.com');
await storage.removeFromWhitelist('example.com');
const isWhitelisted = await storage.isWhitelisted('example.com');
```

### Declarative Net Request API

#### Update Rulesets
```javascript
await chrome.declarativeNetRequest.updateEnabledRulesets({
  enableRulesetIds: ['tier1_rules', 'tier2_rules'],
  disableRulesetIds: ['tier3_rules', 'tier4_rules', 'tier5_rules']
});
```

#### Get Enabled Rulesets
```javascript
const rulesets = await chrome.declarativeNetRequest.getEnabledRulesets();
```

## Firebase Functions

### Check Tier Upgrade
```typescript
// Cloud Function
const checkTierUpgrade = functions.https.onCall(async (data, context) => {
  // Returns current tier and upgrade status
  return {
    currentTier: number,
    newTier: number,
    upgraded: boolean,
    message: string
  };
});

// Client call
const result = await firebase.functions().httpsCallable('checkTierUpgrade')();
```

### Update Blocking Statistics
```typescript
// Cloud Function
const updateBlockingStats = functions.https.onCall(async (data, context) => {
  const { domain, category, count } = data;
  // Updates user and global statistics
  return { success: true };
});

// Client call
await firebase.functions().httpsCallable('updateBlockingStats')({
  domain: 'example.com',
  category: 'ads',
  count: 1
});
```

### Process Referral
```typescript
// Cloud Function
const processReferral = functions.https.onCall(async (data, context) => {
  const { referralCode } = data;
  // Processes referral and updates counts
  return { success: true, referrerId: string };
});

// Client call
await firebase.functions().httpsCallable('processReferral')({
  referralCode: 'ABCD-1234'
});
```

### Get User Statistics
```typescript
// Cloud Function
const getUserStatistics = functions.https.onCall(async (data, context) => {
  // Returns comprehensive user statistics
  return {
    profile: UserProfile,
    blockingStats: BlockingStats,
    referralCount: number
  };
});

// Client call
const stats = await firebase.functions().httpsCallable('getUserStatistics')();
```

## Message Passing

### Content Script to Background
```javascript
// Send blocked ad notification
chrome.runtime.sendMessage({
  action: 'adBlocked',
  category: 'ads',
  domain: 'example.com'
});
```

### Background to Content Script
```javascript
// Notify tier update
chrome.tabs.sendMessage(tabId, {
  action: 'tierUpdated',
  tier: 2
});

// Update settings
chrome.tabs.sendMessage(tabId, {
  action: 'settingsUpdated',
  settings: { enabled: true, tier: 2 }
});
```

### Popup to Content Script
```javascript
// Get current tab
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

// Send message to content script
chrome.tabs.sendMessage(tab.id, {
  action: 'highlightAds'
});
```

## Storage APIs

### Chrome Storage Sync
```javascript
// Save to sync storage (syncs across devices)
await chrome.storage.sync.set({
  userPreferences: {
    theme: 'dark',
    language: 'en'
  }
});

// Get from sync storage
const { userPreferences } = await chrome.storage.sync.get('userPreferences');
```

### Chrome Storage Local
```javascript
// Save to local storage
await chrome.storage.local.set({
  stats: {
    totalBlocked: 1000,
    lastReset: Date.now()
  }
});

// Get from local storage
const { stats } = await chrome.storage.local.get('stats');

// Remove from storage
await chrome.storage.local.remove('stats');

// Clear all storage
await chrome.storage.local.clear();
```

### Storage Change Listener
```javascript
chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(`${key} changed from ${oldValue} to ${newValue}`);
  }
});
```

## Error Handling

### Standard Error Response Format
```typescript
interface ErrorResponse {
  error: boolean;
  message: string;
  code?: string;
  details?: any;
}
```

### Error Codes
```typescript
enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TIER = 'INVALID_TIER',
  RATE_LIMITED = 'RATE_LIMITED',
  INVALID_DOMAIN = 'INVALID_DOMAIN',
  NETWORK_ERROR = 'NETWORK_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}
```

### Error Handling Examples
```javascript
try {
  const response = await chrome.runtime.sendMessage({ action: 'someAction' });
  if (response.error) {
    console.error('Error:', response.message);
    // Handle specific error
    switch(response.code) {
      case 'UNAUTHORIZED':
        // Redirect to login
        break;
      case 'INVALID_TIER':
        // Show tier upgrade prompt
        break;
      default:
        // Show generic error
    }
  }
} catch (error) {
  console.error('Communication error:', error);
  // Handle communication failure
}
```

### Firebase Error Handling
```javascript
try {
  const user = await authService.signIn(email, password);
} catch (error) {
  switch(error.code) {
    case 'auth/user-not-found':
      // User doesn't exist
      break;
    case 'auth/wrong-password':
      // Invalid password
      break;
    case 'auth/too-many-requests':
      // Rate limited
      break;
    default:
      // Generic error
  }
}
```

## Type Definitions

### User Profile
```typescript
interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  tier: {
    level: 1 | 2 | 3 | 4 | 5;
    name: 'Basic' | 'Enhanced' | 'Professional' | 'Premium' | 'Ultimate';
    unlockedAt: number;
    progress: number;
  };
  stats: {
    totalBlocked: number;
    joinedAt: number;
    lastActive: number;
    referralCode: string;
    referredBy?: string;
    referralCount: number;
    weeklyEngagement: number[];
  };
  preferences: {
    notifications: boolean;
    autoUpdate: boolean;
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
}
```

### Blocking Statistics
```typescript
interface BlockingStats {
  totalBlocked: number;
  blockedToday: number;
  blockedThisWeek: number;
  blockedThisMonth: number;
  lastReset: number;
  domainStats: Record<string, number>;
  categoryStats: {
    ads: number;
    trackers: number;
    malware: number;
    social: number;
    youtube: number;
    other: number;
  };
}
```

### Extension Settings
```typescript
interface ExtensionSettings {
  enabled: boolean;
  whitelist: string[];
  pausedDomains: string[];
  tier: UserTier;
  notifications: boolean;
  autoUpdate: boolean;
  developerMode: boolean;
}
```

### Tab State
```typescript
interface TabState {
  tabId: number;
  domain: string;
  blocked: number;
  enabled: boolean;
  whitelisted: boolean;
}
```

## Rate Limiting

API calls are rate-limited to prevent abuse:

| Endpoint | Limit | Window |
|----------|-------|--------|
| Sign Up | 5 | 1 hour |
| Sign In | 10 | 1 hour |
| Update Stats | 100 | 1 minute |
| Process Referral | 10 | 1 hour |
| Get Statistics | 60 | 1 minute |

## Webhooks

### Tier Upgrade Webhook
```javascript
// Triggered when user's tier changes
{
  event: 'tier.upgraded',
  userId: string,
  fromTier: number,
  toTier: number,
  timestamp: number
}
```

### Referral Success Webhook
```javascript
// Triggered when referral is successful
{
  event: 'referral.success',
  referrerId: string,
  referredId: string,
  referralCode: string,
  timestamp: number
}
```

## Best Practices

1. **Always handle errors**: Wrap API calls in try-catch blocks
2. **Check authentication**: Verify user is logged in before protected calls
3. **Validate input**: Sanitize and validate all user input
4. **Rate limit client-side**: Implement debouncing for frequent operations
5. **Cache when possible**: Store frequently accessed data locally
6. **Use type safety**: Leverage TypeScript for type checking
7. **Log errors**: Track errors for debugging and monitoring

---

© 2024 ShieldPro Ultimate. All rights reserved.