# Complete Deployment, Testing, and Firebase Implementation Guide

## Firebase Project Setup and Configuration

### **Initial Firebase Setup**

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project
firebase init

# Select the following options:
# - Firestore
# - Functions
# - Hosting
# - Storage
# - Emulators
```

### **Firebase Project Structure**

```
firebase/
├── .firebaserc
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── functions/
│   ├── src/
│   │   ├── index.ts
│   │   ├── auth/
│   │   │   ├── onCreate.ts
│   │   │   ├── onDelete.ts
│   │   │   └── verification.ts
│   │   ├── tier/
│   │   │   ├── calculator.ts
│   │   │   ├── upgrade.ts
│   │   │   └── downgrade.ts
│   │   ├── referral/
│   │   │   ├── tracker.ts
│   │   │   ├── validator.ts
│   │   │   └── rewards.ts
│   │   ├── engagement/
│   │   │   ├── weekly.ts
│   │   │   ├── reminder.ts
│   │   │   └── analytics.ts
│   │   └── scheduled/
│   │       ├── filterUpdates.ts
│   │       ├── statsAggregation.ts
│   │       └── cleanup.ts
│   ├── package.json
│   └── tsconfig.json
└── hosting/
    └── public/
```

### **Firestore Security Rules**

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function hasVerifiedEmail() {
      return isAuthenticated() && request.auth.token.email_verified;
    }
    
    function isValidTier(tier) {
      return tier >= 1 && tier <= 5;
    }
    
    function hasCompletedProfile() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.profile.fullName != null;
    }
    
    // User documents
    match /users/{userId} {
      // Users can read their own data
      allow read: if isOwner(userId);
      
      // Users can create their profile
      allow create: if isOwner(userId) && 
                      request.resource.data.tier.current == 1;
      
      // Users can update specific fields
      allow update: if isOwner(userId) && 
                      request.resource.data.uid == userId &&
                      (!request.resource.data.diff(resource.data).affectedKeys()
                        .hasAny(['tier.current', 'referrals.count', 'referrals.code']));
      
      // No direct deletes allowed
      allow delete: if false;
      
      // Public profile subset (for referrals)
      match /public/{userId} {
        allow read: if true;
        allow write: if false;
      }
    }
    
    // Referral tracking
    match /referrals/{referralId} {
      allow read: if isAuthenticated() && 
                    (resource.data.referrerUid == request.auth.uid ||
                     resource.data.referredUid == request.auth.uid);
      
      allow create: if isAuthenticated() &&
                      request.resource.data.referredUid == request.auth.uid &&
                      request.resource.data.status == 'pending';
      
      allow update: if false; // Only functions can update
      allow delete: if false;
    }
    
    // Filter lists (read-only for users)
    match /filters/{filterId} {
      allow read: if isAuthenticated() &&
                     resource.data.requiredTier <= 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.tier.current;
      
      allow write: if false; // Admin only via Admin SDK
    }
    
    // Statistics aggregation
    match /statistics/{statId} {
      allow read: if isOwner(statId);
      allow create: if isOwner(statId);
      allow update: if isOwner(statId) &&
                      request.resource.data.totalBlocked >= resource.data.totalBlocked;
      allow delete: if false;
    }
    
    // Global settings (read-only)
    match /settings/{document=**} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
    
    // Engagement tracking
    match /engagement/{userId} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId);
    }
  }
}
```

### **Complete Firestore Data Models**

```typescript
// firestore/models.ts

// User Model
interface UserDocument {
  // Authentication
  uid: string;
  email: string;
  emailVerified: boolean;
  phoneNumber?: string;
  phoneVerified: boolean;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  
  // Profile Information
  profile: {
    fullName: string;
    displayName?: string;
    dateOfBirth: FirebaseFirestore.Timestamp;
    age: number;
    gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
    avatar?: string;
    bio?: string;
    location: {
      country: string;
      countryCode: string;
      city: string;
      state?: string;
      timezone: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
    interests: string[];
    preferences: {
      language: string;
      dateFormat: string;
      notifications: {
        email: boolean;
        push: boolean;
        sms: boolean;
      };
    };
  };
  
  // Tier System
  tier: {
    current: 1 | 2 | 3 | 4 | 5;
    progress: number; // 0-100 percentage
    points: number; // Total points earned
    unlockedFeatures: string[];
    lockedFeatures: string[];
    history: Array<{
      from: number;
      to: number;
      timestamp: FirebaseFirestore.Timestamp;
      reason: string;
      method: 'manual' | 'automatic' | 'referral' | 'engagement' | 'profile';
    }>;
    nextTierRequirements: {
      type: string;
      description: string;
      progress: number;
      required: number;
    }[];
  };
  
  // Referral System
  referrals: {
    code: string; // Unique 8-character code
    customCode?: string; // Premium custom code
    count: number;
    successful: string[]; // User IDs
    pending: string[]; // Email addresses
    failed: string[];
    earnings: {
      total: number;
      currency: string;
      history: Array<{
        amount: number;
        userId: string;
        timestamp: FirebaseFirestore.Timestamp;
        status: 'pending' | 'paid' | 'cancelled';
      }>;
    };
    stats: {
      conversionRate: number;
      totalClicks: number;
      totalSignups: number;
      averageUserTier: number;
    };
  };
  
  // Engagement Tracking
  engagement: {
    lastActive: FirebaseFirestore.Timestamp;
    totalSessions: number;
    totalTimeSpent: number; // seconds
    weeklyStreak: number;
    longestStreak: number;
    lastWeeklyCheck: FirebaseFirestore.Timestamp;
    missedWeeks: number;
    activities: Array<{
      type: 'login' | 'weekly-check' | 'settings-change' | 'referral' | 'feature-use';
      timestamp: FirebaseFirestore.Timestamp;
      metadata: Record<string, any>;
      points: number;
    }>;
    achievements: Array<{
      id: string;
      name: string;
      description: string;
      unlockedAt: FirebaseFirestore.Timestamp;
      rarity: 'common' | 'rare' | 'epic' | 'legendary';
      icon: string;
    }>;
  };
  
  // Settings
  settings: {
    extension: {
      theme: 'light' | 'dark' | 'auto' | string; // custom theme ID
      language: string;
      autoUpdate: boolean;
      betaFeatures: boolean;
      debugMode: boolean;
    };
    blocking: {
      aggressiveness: 'low' | 'medium' | 'high' | 'custom';
      whitelistMode: boolean;
      customFilters: string[];
      whitelist: Array<{
        domain: string;
        addedAt: FirebaseFirestore.Timestamp;
        reason?: string;
        temporary: boolean;
        expiresAt?: FirebaseFirestore.Timestamp;
      }>;
      blacklist: Array<{
        domain: string;
        pattern: string;
        type: 'domain' | 'regex' | 'wildcard';
      }>;
      filterLists: Array<{
        id: string;
        enabled: boolean;
        customUrl?: string;
        lastUpdated: FirebaseFirestore.Timestamp;
      }>;
    };
    privacy: {
      doNotTrack: boolean;
      blockThirdPartyCookies: boolean;
      blockFingerprinting: boolean;
      blockWebRTC: boolean;
      blockSocialTrackers: boolean;
      clearDataOnClose: boolean;
    };
    sync: {
      enabled: boolean;
      devices: Array<{
        id: string;
        name: string;
        type: 'desktop' | 'mobile' | 'tablet';
        lastSync: FirebaseFirestore.Timestamp;
        browser: string;
        os: string;
      }>;
      lastSync: FirebaseFirestore.Timestamp;
      syncFrequency: number; // minutes
    };
  };
  
  // Statistics
  statistics: {
    lifetime: {
      adsBlocked: number;
      popupsBlocked: number;
      trackersBlocked: number;
      malwareBlocked: number;
      totalBlocked: number;
      timesSaved: number; // seconds
      bandwidthSaved: number; // bytes
      pagesVisited: number;
    };
    daily: Array<{
      date: string; // YYYY-MM-DD
      stats: {
        adsBlocked: number;
        popupsBlocked: number;
        trackersBlocked: number;
        totalBlocked: number;
        timesSaved: number;
        bandwidthSaved: number;
      };
      topBlockedDomains: Array<{
        domain: string;
        count: number;
      }>;
    }>;
    monthly: Array<{
      month: string; // YYYY-MM
      stats: {
        adsBlocked: number;
        popupsBlocked: number;
        trackersBlocked: number;
        totalBlocked: number;
        avgDailyBlocks: number;
      };
    }>;
  };
  
  // Subscription & Billing (for future monetization)
  subscription?: {
    status: 'active' | 'cancelled' | 'past_due' | 'trialing';
    plan: 'free' | 'basic' | 'pro' | 'enterprise';
    startDate: FirebaseFirestore.Timestamp;
    endDate?: FirebaseFirestore.Timestamp;
    autoRenew: boolean;
    paymentMethod?: {
      type: 'card' | 'paypal' | 'crypto';
      last4?: string;
      brand?: string;
    };
    invoices: Array<{
      id: string;
      amount: number;
      currency: string;
      date: FirebaseFirestore.Timestamp;
      status: 'paid' | 'pending' | 'failed';
      downloadUrl?: string;
    }>;
  };
  
  // Metadata
  metadata: {
    source: 'organic' | 'referral' | 'paid' | 'social';
    campaign?: string;
    platform: 'web' | 'chrome' | 'firefox' | 'edge' | 'safari';
    version: string;
    userAgent: string;
    ip?: string;
    country?: string;
    tags: string[];
    notes?: string;
    flags: {
      isVip: boolean;
      isBetaTester: boolean;
      isContributor: boolean;
      isSuspended: boolean;
      suspendedReason?: string;
      suspendedUntil?: FirebaseFirestore.Timestamp;
    };
  };
}

// Filter List Model
interface FilterListDocument {
  id: string;
  name: string;
  description: string;
  category: 'ads' | 'trackers' | 'malware' | 'social' | 'annoyances' | 'custom';
  language?: string;
  region?: string;
  version: string;
  format: 'easylist' | 'hosts' | 'domains' | 'adguard';
  
  source: {
    url: string;
    homepage?: string;
    license?: string;
    maintainer?: string;
    updateFrequency: number; // hours
    lastChecked: FirebaseFirestore.Timestamp;
    lastModified: FirebaseFirestore.Timestamp;
  };
  
  rules: {
    total: number;
    blocking: number;
    exception: number;
    cosmetic: number;
    snippet: number;
    content: string[]; // Actual rules (chunked if large)
  };
  
  metadata: {
    requiredTier: number;
    popularity: number;
    effectiveness: number;
    falsePositives: number;
    size: number; // bytes
    checksum: string;
    isDefault: boolean;
    isRecommended: boolean;
    tags: string[];
  };
  
  stats: {
    downloads: number;
    activeUsers: number;
    rating: number;
    reviews: number;
  };
  
  compatibility: {
    browsers: string[];
    minVersion: string;
    maxVersion?: string;
    conflicts: string[]; // IDs of conflicting lists
    dependencies: string[]; // IDs of required lists
  };
  
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

// Referral Model
interface ReferralDocument {
  id: string;
  referrerUid: string;
  referredEmail: string;
  referredUid?: string;
  referralCode: string;
  
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  
  tracking: {
    clickedAt?: FirebaseFirestore.Timestamp;
    signedUpAt?: FirebaseFirestore.Timestamp;
    completedAt?: FirebaseFirestore.Timestamp;
    expiredAt?: FirebaseFirestore.Timestamp;
    source: 'link' | 'email' | 'social' | 'qr' | 'direct';
    campaign?: string;
    medium?: string;
    device?: string;
    browser?: string;
    ip?: string;
    location?: {
      country: string;
      city: string;
    };
  };
  
  rewards: {
    referrerReward: {
      type: 'tier_upgrade' | 'points' | 'features' | 'discount';
      value: any;
      issued: boolean;
      issuedAt?: FirebaseFirestore.Timestamp;
    };
    referredReward: {
      type: 'tier_upgrade' | 'points' | 'features' | 'discount';
      value: any;
      issued: boolean;
      issuedAt?: FirebaseFirestore.Timestamp;
    };
  };
  
  validation: {
    emailVerified: boolean;
    phoneVerified: boolean;
    profileCompleted: boolean;
    minimumActivityMet: boolean;
    fraudCheck: {
      passed: boolean;
      score: number;
      reasons: string[];
    };
  };
  
  metadata: {
    attempts: number;
    notes?: string;
    tags: string[];
  };
  
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

## Complete Testing Strategy

### **Unit Testing Setup**

```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.css$': '<rootDir>/src/test/__mocks__/styleMock.js'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/test/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  }
};

// src/test/setup.ts
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import fetch from 'node-fetch';

// Polyfills
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;
global.fetch = fetch as any;

// Mock Chrome API
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    },
    getManifest: jest.fn(() => ({ version: '1.0.0' }))
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn()
    },
    sync: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  },
  declarativeNetRequest: {
    updateEnabledRulesets: jest.fn(),
    updateDynamicRules: jest.fn()
  }
} as any;

// Mock Firebase
jest.mock('firebase/app');
jest.mock('firebase/auth');
jest.mock('firebase/firestore');
```

### **Component Testing Examples**

```typescript
// __tests__/components/TierProgress.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TierProgress } from '@/components/TierProgress';
import { FirebaseProvider } from '@/contexts/FirebaseContext';

describe('TierProgress Component', () => {
  const mockUser = {
    uid: 'test-user',
    tier: {
      current: 2,
      progress: 45,
      unlockedFeatures: ['youtube-blocking', 'popup-advanced']
    }
  };
  
  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <FirebaseProvider>
        {component}
      </FirebaseProvider>
    );
  };
  
  it('displays current tier correctly', () => {
    renderWithProviders(<TierProgress user={mockUser} />);
    expect(screen.getByText('Tier 2')).toBeInTheDocument();
    expect(screen.getByText('Enhanced')).toBeInTheDocument();
  });
  
  it('shows progress percentage', () => {
    renderWithProviders(<TierProgress user={mockUser} />);
    expect(screen.getByText('45%')).toBeInTheDocument();
  });
  
  it('displays unlocked features', () => {
    renderWithProviders(<TierProgress user={mockUser} />);
    expect(screen.getByText(/YouTube ad blocking/i)).toBeInTheDocument();
    expect(screen.getByText(/Advanced popup blocking/i)).toBeInTheDocument();
  });
  
  it('shows upgrade prompt for non-max tier', () => {
    renderWithProviders(<TierProgress user={mockUser} />);
    expect(screen.getByText(/Upgrade to Tier 3/i)).toBeInTheDocument();
  });
  
  it('handles tier upgrade action', async () => {
    const onUpgrade = jest.fn();
    renderWithProviders(
      <TierProgress user={mockUser} onUpgrade={onUpgrade} />
    );
    
    const upgradeButton = screen.getByRole('button', { name: /upgrade/i });
    await userEvent.click(upgradeButton);
    
    expect(onUpgrade).toHaveBeenCalledWith(3);
  });
  
  it('displays max tier badge correctly', () => {
    const maxTierUser = { ...mockUser, tier: { ...mockUser.tier, current: 5 } };
    renderWithProviders(<TierProgress user={maxTierUser} />);
    
    expect(screen.getByText('Ultimate')).toBeInTheDocument();
    expect(screen.queryByText(/Upgrade/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Max Tier Reached/i)).toBeInTheDocument();
  });
});

// __tests__/hooks/useBlockingStats.test.ts
import { renderHook, act } from '@testing-library/react';
import { useBlockingStats } from '@/hooks/useBlockingStats';

describe('useBlockingStats Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('initializes with zero stats', () => {
    const { result } = renderHook(() => useBlockingStats());
    
    expect(result.current.stats).toEqual({
      adsBlocked: 0,
      popupsBlocked: 0,
      trackersBlocked: 0,
      totalBlocked: 0
    });
  });
  
  it('increments stats correctly', async () => {
    const { result } = renderHook(() => useBlockingStats());
    
    act(() => {
      result.current.incrementStat('adsBlocked');
      result.current.incrementStat('adsBlocked');
      result.current.incrementStat('popupsBlocked');
    });
    
    expect(result.current.stats.adsBlocked).toBe(2);
    expect(result.current.stats.popupsBlocked).toBe(1);
    expect(result.current.stats.totalBlocked).toBe(3);
  });
  
  it('persists stats to storage', async () => {
    const { result } = renderHook(() => useBlockingStats());
    
    act(() => {
      result.current.incrementStat('adsBlocked');
    });
    
    await waitFor(() => {
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        blockingStats: expect.objectContaining({
          adsBlocked: 1,
          totalBlocked: 1
        })
      });
    });
  });
  
  it('loads stats from storage on mount', async () => {
    chrome.storage.local.get.mockResolvedValueOnce({
      blockingStats: {
        adsBlocked: 10,
        popupsBlocked: 5,
        trackersBlocked: 3,
        totalBlocked: 18
      }
    });
    
    const { result } = renderHook(() => useBlockingStats());
    
    await waitFor(() => {
      expect(result.current.stats.adsBlocked).toBe(10);
      expect(result.current.stats.totalBlocked).toBe(18);
    });
  });
});
```

### **Integration Testing**

```typescript
// __tests__/integration/tier-upgrade.test.ts
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { TierManager } from '@/services/TierManager';

describe('Tier Upgrade Integration', () => {
  let testEnv: any;
  let tierManager: TierManager;
  
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'test-project',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8')
      }
    });
  });
  
  beforeEach(async () => {
    await testEnv.clearFirestore();
    tierManager = new TierManager(testEnv.authenticatedContext('test-user'));
  });
  
  afterAll(async () => {
    await testEnv.cleanup();
  });
  
  it('upgrades from tier 1 to tier 2 on account creation', async () => {
    // Create initial user at tier 1
    const userDoc = doc(testEnv.firestore(), 'users', 'test-user');
    await setDoc(userDoc, {
      uid: 'test-user',
      email: 'test@example.com',
      tier: { current: 1, progress: 100 }
    });
    
    // Trigger account verification
    await tierManager.verifyEmailAndUpgrade('test@example.com');
    
    // Check tier upgrade
    const updatedUser = await getDoc(userDoc);
    expect(updatedUser.data().tier.current).toBe(2);
    expect(updatedUser.data().tier.unlockedFeatures).toContain('youtube-blocking');
  });
  
  it('upgrades to tier 3 when profile is completed', async () => {
    const userDoc = doc(testEnv.firestore(), 'users', 'test-user');
    await setDoc(userDoc, {
      uid: 'test-user',
      tier: { current: 2, progress: 50 }
    });
    
    // Complete profile
    await tierManager.completeProfile({
      fullName: 'Test User',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'male',
      location: { country: 'US', city: 'New York' }
    });
    
    const updatedUser = await getDoc(userDoc);
    expect(updatedUser.data().tier.current).toBe(3);
  });
  
  it('handles referral-based tier upgrade', async () => {
    // Setup referrer at tier 3
    const referrerDoc = doc(testEnv.firestore(), 'users', 'referrer');
    await setDoc(referrerDoc, {
      uid: 'referrer',
      tier: { current: 3 },
      referrals: { code: 'REF12345', count: 29, successful: [] }
    });
    
    // Add 30th successful referral
    await tierManager.processReferral('referrer', 'new-user');
    
    const updatedReferrer = await getDoc(referrerDoc);
    expect(updatedReferrer.data().referrals.count).toBe(30);
    expect(updatedReferrer.data().tier.current).toBe(4);
  });
  
  it('downgrades tier 5 users who miss weekly engagement', async () => {
    const userDoc = doc(testEnv.firestore(), 'users', 'test-user');
    await setDoc(userDoc, {
      uid: 'test-user',
      tier: { current: 5 },
      engagement: {
        lastWeeklyCheck: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days ago
      }
    });
    
    // Run weekly check
    await tierManager.checkWeeklyEngagement('test-user');
    
    const updatedUser = await getDoc(userDoc);
    expect(updatedUser.data().tier.current).toBe(4);
    expect(updatedUser.data().engagement.missedWeeks).toBe(1);
  });
});
```

### **End-to-End Testing**

```typescript
// __tests__/e2e/extension-flow.test.ts
import puppeteer from 'puppeteer';
import path from 'path';

describe('Extension E2E Tests', () => {
  let browser: puppeteer.Browser;
  let page: puppeteer.Page;
  
  beforeAll(async () => {
    const pathToExtension = path.join(__dirname, '../../dist');
    browser = await puppeteer.launch({
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`
      ]
    });
  });
  
  afterAll(async () => {
    await browser.close();
  });
  
  beforeEach(async () => {
    page = await browser.newPage();
  });
  
  afterEach(async () => {
    await page.close();
  });
  
  it('blocks ads on test page', async () => {
    // Navigate to test page with ads
    await page.goto('https://www.example-with-ads.com');
    
    // Wait for ad blocking to complete
    await page.waitForTimeout(2000);
    
    // Check that ads are hidden
    const adElements = await page.$$('.ad-container');
    for (const element of adElements) {
      const isVisible = await element.isIntersectingViewport();
      expect(isVisible).toBe(false);
    }
    
    // Check blocking counter
    const extensionPopup = await browser.newPage();
    await extensionPopup.goto(`chrome-extension://${extensionId}/popup.html`);
    
    const counter = await extensionPopup.$eval(
      '.blocked-counter',
      el => el.textContent
    );
    expect(parseInt(counter)).toBeGreaterThan(0);
  });
  
  it('blocks popups on trigger', async () => {
    await page.goto('https://www.popup-test.com');
    
    // Try to trigger popup
    await page.click('#popup-trigger');
    
    // Check that no new windows opened
    const pages = await browser.pages();
    expect(pages.length).toBe(2); // Original + current, no popup
    
    // Verify popup was logged as blocked
    const blockedPopups = await page.evaluate(() => {
      return window.adblockerStats?.blockedPopups || 0;
    });
    expect(blockedPopups).toBeGreaterThan(0);
  });
  
  it('handles YouTube ad blocking', async () => {
    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    // Wait for video player
    await page.waitForSelector('.html5-video-player');
    
    // Check for ad elements
    const adOverlay = await page.$('.ytp-ad-overlay-container');
    expect(adOverlay).toBeNull();
    
    // Play video and check for mid-roll ads
    await page.click('.ytp-play-button');
    await page.waitForTimeout(5000);
    
    const skipButton = await page.$('.ytp-ad-skip-button');
    expect(skipButton).toBeNull();
  });
});
```

## Deployment Guide

### **Build Configuration**

```javascript
// webpack.config.js
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'source-map' : 'inline-source-map',
    
    entry: {
      popup: './src/popup/index.tsx',
      options: './src/options/index.tsx',
      background: './src/background/service-worker.ts',
      content: './src/content/injector.ts'
    },
    
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js'
    },
    
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          use: 'ts-loader',
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader'
          ]
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/,
          type: 'asset/resource',
          generator: {
            filename: 'assets/[name][ext]'
          }
        }
      ]
    },
    
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    
    plugins: [
      new CleanWebpackPlugin(),
      
      new CopyPlugin({
        patterns: [
          { from: 'public/manifest.json' },
          { from: 'public/icons', to: 'icons' },
          { from: 'public/rules', to: 'rules' },
          { from: 'public/_locales', to: '_locales' }
        ]
      }),
      
      new HtmlPlugin({
        template: './public/popup.html',
        filename: 'popup.html',
        chunks: ['popup']
      }),
      
      new HtmlPlugin({
        template: './public/options.html',
        filename: 'options.html',
        chunks: ['options']
      }),
      
      new MiniCssExtractPlugin({
        filename: '[name].css'
      })
    ],
    
    optimization: {
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction,
              drop_debugger: isProduction
            },
            mangle: true,
            format: {
              comments: false
            }
          },
          extractComments: false
        })
      ],
      
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            priority: 10
          },
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true
          }
        }
      }
    }
  };
};
```

### **CI/CD Pipeline (GitHub Actions)**

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  release:
    types: [created]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
  
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build extension
        run: npm run build:prod
      
      - name: Create extension package
        run: |
          cd dist
          zip -r ../extension.zip *
      
      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: extension-package
          path: extension.zip
  
  deploy-firebase:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Firebase CLI
        run: npm install -g firebase-tools
      
      - name: Deploy to Firebase
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
        run: |
          firebase deploy --only firestore:rules
          firebase deploy --only functions
          firebase deploy --only hosting
  
  publish-chrome:
    needs: build
    if: github.event_name == 'release'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Download artifact
        uses: actions/download-artifact@v3
        with:
          name: extension-package
      
      - name: Publish to Chrome Web Store
        uses: trmcnvn/chrome-addon@v2
        with:
          extension: ${{ secrets.CHROME_EXTENSION_ID }}
          zip: extension.zip
          client-id: ${{ secrets.CHROME_CLIENT_ID }}
          client-secret: ${{ secrets.CHROME_CLIENT_SECRET }}
          refresh-token: ${{ secrets.CHROME_REFRESH_TOKEN }}
```

### **Release Process**

```bash
#!/bin/bash
# scripts/release.sh

# Version bump
echo "Current version: $(node -p "require('./package.json').version")"
read -p "Enter new version: " VERSION

# Update version in files
npm version $VERSION --no-git-tag-version
sed -i "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" public/manifest.json

# Build and test
npm run lint
npm run test
npm run build:prod

# Create release package
cd dist
zip -r ../release-$VERSION.zip *
cd ..

# Git operations
git add .
git commit -m "Release v$VERSION"
git tag -a "v$VERSION" -m "Release version $VERSION"

# Push to repository
git push origin main
git push origin "v$VERSION"

echo "Release v$VERSION created successfully!"
echo "Package available at: release-$VERSION.zip"
```

### **Monitoring and Analytics**

```typescript
// analytics/monitor.ts
import { Analytics } from 'firebase/analytics';
import { Performance } from 'firebase/performance';

class ExtensionMonitor {
  private analytics: Analytics;
  private performance: Performance;
  
  constructor() {
    this.analytics = getAnalytics();
    this.performance = getPerformance();
  }
  
  // Track user events
  trackEvent(eventName: string, parameters?: Record<string, any>): void {
    logEvent(this.analytics, eventName, {
      ...parameters,
      timestamp: Date.now(),
      version: chrome.runtime.getManifest().version
    });
  }
  
  // Track tier upgrades
  trackTierUpgrade(fromTier: number, toTier: number, method: string): void {
    this.trackEvent('tier_upgrade', {
      from_tier: fromTier,
      to_tier: toTier,
      upgrade_method: method
    });
  }
  
  // Track blocking statistics
  trackBlockingStats(stats: BlockingStats): void {
    this.trackEvent('blocking_stats', {
      ads_blocked: stats.adsBlocked,
      popups_blocked: stats.popupsBlocked,
      trackers_blocked: stats.trackersBlocked,
      total_blocked: stats.totalBlocked
    });
  }
  
  // Performance monitoring
  measureFilterPerformance(): void {
    const trace = this.performance.trace('filter_execution');
    trace.start();
    
    // Filter execution logic
    
    trace.stop();
  }
  
  // Error tracking
  trackError(error: Error, context?: Record<string, any>): void {
    this.trackEvent('error', {
      error_message: error.message,
      error_stack: error.stack,
      ...context
    });
  }
}
```

This completes the comprehensive documentation package for your AdBlocker-All-In-One Chrome extension, covering all aspects from Firebase implementation to testing strategies and deployment procedures.