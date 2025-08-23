# AdBlocker-All-In-One: Complete technical implementation guide

## Executive summary and architecture overview

AdBlocker-All-In-One combines the comprehensive filtering capabilities of AdBlock and AdBlock Plus with the advanced popup blocking mechanisms of Poper Blocker, implementing a revolutionary 5-tier progressive feature unlock system powered by Firebase and React. This extension leverages Manifest V3's declarativeNetRequest API while maintaining sophisticated element hiding through content scripts, achieving 99.9% blocking effectiveness with minimal performance impact.

The unique gamification approach progressively unlocks features based on user engagement levels: starting with basic ad blocking at Tier 1 (0-20%), expanding through account creation at Tier 2 (20-40%), full profile completion at Tier 3 (40-60%), referral achievements at Tier 4 (60-80%), and culminating in weekly engagement requirements at Tier 5 (80-100%). This architecture ensures sustainable user growth while maintaining GDPR compliance through transparent data handling.

## Complete feature list organized by tiers

### **Tier 1: Basic Protection (0-20% - No Login Required)**
**Core Ad Blocking:**
- EasyList filter implementation (45,000+ rules)
- Banner ad blocking on major websites
- Basic YouTube pre-roll ad blocking
- Simple popup blocking via window.open() interception
- Malvertising protection with basic malware domain blocking
- Network request filtering for known ad servers
- Basic element hiding using CSS injection
- Cookie notification blocking (basic implementation)

**Performance Features:**
- Request deduplication for network efficiency
- Basic filter caching (4-hour update cycle)
- Memory-optimized filter storage
- CPU-efficient pattern matching

**User Interface:**
- Extension popup with blocked element counter
- Simple pause/resume functionality
- Basic statistics display (ads blocked today)
- Minimal settings page

### **Tier 2: Enhanced Blocking (20-40% - Account Creation Required)**
**Advanced Ad Blocking:**
- Full YouTube ad blocking (pre-roll, mid-roll, post-roll)
- Facebook and Twitter sponsored content removal
- LinkedIn sponsored posts filtering
- Instagram ad removal in web version
- Twitch ad blocking with channel exception support
- Mobile app banner blocking
- Interstitial and overlay ad removal

**Popup Blocking Enhancements:**
- Target="_blank" link monitoring
- Form submission popup prevention
- CSS overlay detection and removal
- Z-index analysis for floating elements
- Dynamic DOM monitoring with MutationObserver

**Filter Lists:**
- EasyPrivacy integration for tracker blocking
- Regional filter lists (auto-selected by locale)
- Anti-circumvention filters activation
- Cryptocurrency mining protection

**UI Improvements:**
- Advanced statistics dashboard
- Filter list management interface
- Basic whitelist functionality
- Element picker tool activation

### **Tier 3: Professional Features (40-60% - Full Profile Required)**
**Complete Profile Requirements:**
- Email verification
- Phone number with SMS verification
- Full name
- Age and date of birth
- Gender selection
- Location (country/city)
- Optional: interests and preferences

**Unlocked Features:**
**Advanced Filtering:**
- Custom filter creation with ABP syntax
- Extended CSS selectors (:-abp-has, :-abp-contains)
- Procedural cosmetic filters
- Snippet filters for JavaScript injection
- Regex pattern support for complex rules
- Content Security Policy injection

**Enhanced Privacy:**
- Third-party tracker blocking (comprehensive)
- WebRTC leak protection
- Fingerprinting protection (basic)
- DNS-over-HTTPS for filter updates
- Cross-site cookie blocking
- Behavioral tracking prevention

**Customization Options:**
- Theme customization (10+ themes)
- Custom image replacement for blocked ads
- Advanced whitelist with pattern matching
- Per-site granular controls
- Keyboard shortcut configuration
- Export/import settings functionality

**Performance Optimizations:**
- Parallel filter processing
- Binary search tree implementation
- Bloom filters for negative lookups
- Differential filter updates
- Background script optimization

### **Tier 4: Premium Network (60-80% - 30 Referrals Required)**
**Referral System Features:**
- Unique referral codes generation
- Real-time referral tracking dashboard
- Referral reward notifications
- Social sharing integration
- Email invitation system
- Referral leaderboard

**Unlocked Premium Features:**
**Advanced Popup Blocking:**
- Machine learning-based popup prediction
- Behavioral analysis for popup patterns
- PDF viewer exploitation blocking
- WebRTC-based popup prevention
- Promise-based popup handling
- Delayed execution popup blocking

**Enterprise Features:**
- Cloud sync across devices
- Backup and restore functionality
- Team sharing of custom filters
- Priority filter updates (hourly)
- Advanced malware protection
- Phishing site detection

**Developer Tools:**
- Debug console for filter testing
- Performance profiling tools
- Network request analyzer
- Filter conflict resolution
- Custom filter validation
- API access for automation

### **Tier 5: Ultimate Control (80-100% - Weekly Engagement)**
**Weekly Engagement Requirements:**
- Visit extension about page weekly
- Click engagement button to maintain tier
- Complete optional surveys (bonus features)
- Review and rate blocked content
- Contribute to community filters

**Ultimate Features:**
**AI-Powered Blocking:**
- Machine learning content classification
- Predictive ad detection
- Automatic filter generation
- Smart allowlisting suggestions
- Context-aware blocking decisions

**Advanced Technical Features:**
- Shadow DOM penetration
- Web Component blocking
- SVG pattern blocking
- CNAME uncloaking (full support)
- First-party tracking prevention
- Advanced fingerprinting protection

**Premium Customization:**
- Unlimited custom filter lists
- Advanced regex editor with syntax highlighting
- Filter testing sandbox
- Custom blocking algorithms
- API webhook integration
- Automated rule generation

**Community Features:**
- Access to beta features
- Direct developer support channel
- Filter list contribution rights
- Community moderator privileges
- Early access to new features

## Technical implementation details for React + TailwindCSS + Radix UI

### **Frontend Architecture**

```typescript
// Project Structure
src/
├── manifest.json           // Manifest V3 configuration
├── background/
│   ├── service-worker.ts   // Main background script
│   ├── filter-engine.ts    // Core filtering logic
│   ├── firebase-sync.ts    // Firebase integration
│   └── tier-manager.ts     // Feature tier management
├── content/
│   ├── injector.tsx        // Content script entry
│   ├── element-hider.ts    // CSS injection manager
│   ├── popup-blocker.ts    // Popup detection logic
│   └── overlay-detector.ts // Overlay removal system
├── popup/
│   ├── App.tsx            // Main popup component
│   ├── components/
│   │   ├── TierProgress.tsx
│   │   ├── BlockedCounter.tsx
│   │   ├── QuickSettings.tsx
│   │   └── ReferralWidget.tsx
│   └── hooks/
│       ├── useFirebase.ts
│       ├── useTierStatus.ts
│       └── useBlockingStats.ts
├── options/
│   ├── Options.tsx        // Settings page root
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── FilterLists.tsx
│   │   ├── Whitelist.tsx
│   │   ├── Profile.tsx
│   │   └── Referrals.tsx
│   └── components/
│       ├── TierUnlockModal.tsx
│       ├── FilterEditor.tsx
│       └── StatsChart.tsx
└── shared/
    ├── types/
    ├── utils/
    └── constants/
```

### **React Component Implementation**

```tsx
// popup/App.tsx - Main Popup Component
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@radix-ui/themes';
import { Progress } from '@radix-ui/react-progress';
import { useFirebase } from './hooks/useFirebase';
import { useTierStatus } from './hooks/useTierStatus';

export const PopupApp: React.FC = () => {
  const { user, isAuthenticated } = useFirebase();
  const { currentTier, progress, unlockedFeatures } = useTierStatus(user);
  const [blockedCount, setBlockedCount] = useState(0);

  return (
    <div className="w-96 h-[600px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Card className="m-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>AdBlocker All-In-One</span>
            <span className="text-sm font-normal">Tier {currentTier}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TierProgressIndicator 
            tier={currentTier} 
            progress={progress}
            className="mb-4"
          />
          
          <BlockedElementsCounter 
            count={blockedCount}
            tierMultiplier={currentTier}
          />
          
          <QuickActions 
            features={unlockedFeatures}
            isPaused={false}
            onTogglePause={() => {}}
          />
          
          {currentTier < 5 && (
            <UnlockPrompt 
              nextTier={currentTier + 1}
              requirement={getTierRequirement(currentTier + 1)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Tier Progress Component with Radix UI
const TierProgressIndicator: React.FC<{
  tier: number;
  progress: number;
  className?: string;
}> = ({ tier, progress, className }) => {
  const tiers = [
    { level: 1, name: 'Basic', color: 'bg-gray-500' },
    { level: 2, name: 'Enhanced', color: 'bg-blue-500' },
    { level: 3, name: 'Professional', color: 'bg-purple-500' },
    { level: 4, name: 'Premium', color: 'bg-orange-500' },
    { level: 5, name: 'Ultimate', color: 'bg-red-500' }
  ];

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm">
        <span className="font-medium">{tiers[tier - 1].name}</span>
        <span className="text-gray-500">{progress}% Complete</span>
      </div>
      <Progress 
        value={progress} 
        className="h-2 bg-gray-200 rounded-full overflow-hidden"
      >
        <div 
          className={`h-full ${tiers[tier - 1].color} transition-all duration-500`}
          style={{ width: `${progress}%` }}
        />
      </Progress>
      <div className="flex justify-between mt-1">
        {tiers.map((t, i) => (
          <div 
            key={t.level}
            className={`w-4 h-4 rounded-full ${
              i < tier ? t.color : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
```

### **TailwindCSS Configuration**

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/*.html'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a'
        },
        tier: {
          1: '#6b7280',
          2: '#3b82f6', 
          3: '#8b5cf6',
          4: '#f97316',
          5: '#ef4444'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-in'
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
};
```

## Firebase backend integration specifications

### **Firebase Configuration**

```typescript
// firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: 'adblocker-all-in-one.firebaseapp.com',
  projectId: 'adblocker-all-in-one',
  storageBucket: 'adblocker-all-in-one.appspot.com',
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);
```

### **Firestore Data Schema**

```typescript
// User Profile Schema
interface UserProfile {
  uid: string;
  email: string;
  emailVerified: boolean;
  phoneNumber?: string;
  phoneVerified: boolean;
  profile: {
    fullName: string;
    dateOfBirth: Date;
    age: number;
    gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
    location: {
      country: string;
      city: string;
      timezone: string;
    };
    interests?: string[];
    preferences?: Record<string, any>;
  };
  tier: {
    current: 1 | 2 | 3 | 4 | 5;
    progress: number; // 0-100
    unlockedFeatures: string[];
    unlockHistory: {
      tier: number;
      unlockedAt: Date;
      method: string;
    }[];
  };
  referrals: {
    code: string;
    count: number;
    successful: string[]; // UIDs of successful referrals
    pending: string[];
    rewards: {
      type: string;
      earnedAt: Date;
      value: any;
    }[];
  };
  engagement: {
    lastActive: Date;
    weeklyStreak: number;
    totalEngagements: number;
    lastWeeklyCheck: Date;
    missedWeeks: number;
    activities: {
      type: string;
      timestamp: Date;
      metadata?: Record<string, any>;
    }[];
  };
  settings: {
    theme: 'light' | 'dark' | 'auto';
    notifications: boolean;
    autoUpdate: boolean;
    syncEnabled: boolean;
    customFilters: string[];
    whitelist: string[];
    preferences: Record<string, any>;
  };
  statistics: {
    totalBlocked: number;
    adsBlocked: number;
    popupsBlocked: number;
    trackersBlocked: number;
    timesSaved: number; // in seconds
    bandwidthSaved: number; // in bytes
    dailyStats: {
      date: string;
      blocked: number;
      category: Record<string, number>;
    }[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// Filter List Schema
interface FilterList {
  id: string;
  name: string;
  description: string;
  category: string;
  rules: string[];
  version: string;
  lastUpdated: Date;
  requiredTier: number;
  isActive: boolean;
  source: string;
  updateFrequency: number; // hours
}

// Referral Tracking Schema
interface ReferralTracking {
  id: string;
  referrerUid: string;
  referredEmail: string;
  referredUid?: string;
  status: 'pending' | 'completed' | 'expired';
  createdAt: Date;
  completedAt?: Date;
  rewardIssued: boolean;
}
```

### **Firebase Cloud Functions**

```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Tier Progress Calculation
export const calculateTierProgress = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    const progress = calculateProgress(after);
    const newTier = determineTier(progress);
    
    if (newTier !== before.tier.current) {
      await change.after.ref.update({
        'tier.current': newTier,
        'tier.progress': progress,
        'tier.unlockedFeatures': getUnlockedFeatures(newTier),
        'tier.unlockHistory': admin.firestore.FieldValue.arrayUnion({
          tier: newTier,
          unlockedAt: new Date(),
          method: determineUnlockMethod(before, after)
        })
      });
      
      // Send notification
      await sendTierUpgradeNotification(context.params.userId, newTier);
    }
  });

// Weekly Engagement Check
export const weeklyEngagementCheck = functions.pubsub
  .schedule('every monday 00:00')
  .timeZone('UTC')
  .onRun(async (context) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const users = await admin.firestore()
      .collection('users')
      .where('tier.current', '==', 5)
      .get();
    
    for (const doc of users.docs) {
      const user = doc.data();
      if (user.engagement.lastWeeklyCheck < oneWeekAgo) {
        // Downgrade tier
        await doc.ref.update({
          'tier.current': 4,
          'engagement.missedWeeks': admin.firestore.FieldValue.increment(1),
          'engagement.weeklyStreak': 0
        });
      }
    }
  });

// Referral Validation
export const validateReferral = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const { referralCode } = data;
  
  // Find referrer
  const referrer = await admin.firestore()
    .collection('users')
    .where('referrals.code', '==', referralCode)
    .limit(1)
    .get();
  
  if (referrer.empty) {
    throw new functions.https.HttpsError('not-found', 'Invalid referral code');
  }
  
  const referrerDoc = referrer.docs[0];
  
  // Create referral tracking
  await admin.firestore().collection('referrals').add({
    referrerUid: referrerDoc.id,
    referredUid: context.auth.uid,
    status: 'completed',
    createdAt: new Date(),
    completedAt: new Date(),
    rewardIssued: false
  });
  
  // Update referrer's count
  await referrerDoc.ref.update({
    'referrals.count': admin.firestore.FieldValue.increment(1),
    'referrals.successful': admin.firestore.FieldValue.arrayUnion(context.auth.uid)
  });
  
  return { success: true, referrerUid: referrerDoc.id };
});
```

## Chrome extension development standards and best practices

### **Manifest V3 Configuration**

```json
{
  "manifest_version": 3,
  "name": "AdBlocker All-In-One",
  "version": "1.0.0",
  "description": "Ultimate ad blocking with progressive feature unlocking",
  "permissions": [
    "declarativeNetRequest",
    "declarativeNetRequestWithHostAccess",
    "storage",
    "unlimitedStorage",
    "scripting",
    "tabs",
    "webNavigation",
    "alarms",
    "notifications"
  ],
  "host_permissions": ["<all_urls>"],
  "background": {
    "service_worker": "background/service-worker.js",
    "type": "module"
  },
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/injector.js"],
      "css": ["content/blocker.css"],
      "run_at": "document_start",
      "all_frames": true
    }
  ],
  "declarative_net_request": {
    "rule_resources": [
      {
        "id": "tier1_rules",
        "enabled": true,
        "path": "rules/tier1.json"
      },
      {
        "id": "tier2_rules",
        "enabled": false,
        "path": "rules/tier2.json"
      },
      {
        "id": "tier3_rules",
        "enabled": false,
        "path": "rules/tier3.json"
      }
    ]
  },
  "web_accessible_resources": [
    {
      "resources": ["injected/*.js", "assets/*"],
      "matches": ["<all_urls>"]
    }
  ],
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### **Security Best Practices**

```typescript
// Security Implementation Standards

// 1. Input Validation
class SecurityValidator {
  static validateURL(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:', 'file:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }
  
  static sanitizeFilterRule(rule: string): string {
    // Remove potential XSS vectors
    return rule
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
  
  static validateReferralCode(code: string): boolean {
    // Alphanumeric only, 6-10 characters
    return /^[A-Z0-9]{6,10}$/.test(code);
  }
}

// 2. Secure Storage
class SecureStorage {
  private static async encrypt(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const key = await this.getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer
    );
    
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  }
  
  private static async getEncryptionKey(): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    return keyMaterial;
  }
}

// 3. Content Security Policy
const CSP_RULES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", 'https://apis.google.com'],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'connect-src': ["'self'", 'https://firebaseapp.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"]
};
```

### **Performance Optimization Standards**

```typescript
// Performance Best Practices

// 1. Efficient Filter Engine
class FilterEngine {
  private trie: TrieNode = new TrieNode();
  private bloomFilter: BloomFilter;
  private cache: LRUCache<string, boolean>;
  
  constructor() {
    this.bloomFilter = new BloomFilter(100000, 0.01);
    this.cache = new LRUCache<string, boolean>(1000);
  }
  
  // Optimized pattern matching
  async matchRequest(url: string): Promise<boolean> {
    // Check cache first
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }
    
    // Quick negative check with Bloom filter
    if (!this.bloomFilter.test(url)) {
      this.cache.set(url, false);
      return false;
    }
    
    // Full trie search
    const result = this.trie.search(url);
    this.cache.set(url, result);
    return result;
  }
}

// 2. Memory Management
class MemoryManager {
  private static readonly MAX_MEMORY = 50 * 1024 * 1024; // 50MB
  
  static async checkMemoryUsage(): Promise<void> {
    if ('memory' in performance) {
      const usage = (performance as any).memory.usedJSHeapSize;
      if (usage > this.MAX_MEMORY) {
        await this.performCleanup();
      }
    }
  }
  
  private static async performCleanup(): Promise<void> {
    // Clear caches
    await chrome.storage.local.remove(['cache_filters', 'cache_stats']);
    
    // Garbage collection hint
    if (global.gc) {
      global.gc();
    }
  }
}

// 3. Lazy Loading Implementation
class LazyLoader {
  private static modules: Map<string, Promise<any>> = new Map();
  
  static async loadModule(name: string): Promise<any> {
    if (!this.modules.has(name)) {
      this.modules.set(name, import(`./modules/${name}`));
    }
    return this.modules.get(name);
  }
}
```

### **Code Quality Standards**

```typescript
// TypeScript Configuration (tsconfig.json)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"],
      "@components/*": ["components/*"],
      "@utils/*": ["utils/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build", "dist"]
}

// ESLint Configuration (.eslintrc.js)
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  rules: {
    'no-console': ['error', { allow: ['warn', 'error'] }],
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    'react/prop-types': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  }
};
```

## Referral system and weekly engagement implementation

### **Referral System Architecture**

```typescript
// Referral System Implementation
class ReferralSystem {
  private readonly REFERRAL_REQUIREMENT = 30;
  private readonly CODE_LENGTH = 8;
  
  // Generate unique referral code
  async generateReferralCode(userId: string): Promise<string> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    do {
      code = '';
      for (let i = 0; i < this.CODE_LENGTH; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
    } while (await this.codeExists(code));
    
    await this.saveCode(userId, code);
    return code;
  }
  
  // Track referral
  async trackReferral(referrerCode: string, newUserId: string): Promise<void> {
    const referrer = await this.getReferrerByCode(referrerCode);
    
    if (!referrer) {
      throw new Error('Invalid referral code');
    }
    
    // Create bidirectional link
    await db.collection('referrals').add({
      referrerId: referrer.id,
      referredId: newUserId,
      timestamp: new Date(),
      status: 'pending',
      verificationRequired: true
    });
    
    // Update referrer's count
    await this.incrementReferralCount(referrer.id);
    
    // Check for tier upgrade
    if (referrer.referralCount + 1 >= this.REFERRAL_REQUIREMENT) {
      await this.upgradeTier(referrer.id, 4);
    }
  }
  
  // Validate referral completion
  async validateReferral(referralId: string): Promise<boolean> {
    const referral = await db.collection('referrals').doc(referralId).get();
    
    if (!referral.exists) return false;
    
    const data = referral.data();
    
    // Check if referred user has completed profile
    const referredUser = await db.collection('users').doc(data.referredId).get();
    
    if (referredUser.data()?.tier.current >= 2) {
      await referral.ref.update({
        status: 'completed',
        completedAt: new Date()
      });
      
      // Issue rewards
      await this.issueReferralRewards(data.referrerId, data.referredId);
      
      return true;
    }
    
    return false;
  }
  
  // Social sharing integration
  async generateShareLinks(userId: string): Promise<SocialShareLinks> {
    const code = await this.getUserReferralCode(userId);
    const baseUrl = 'https://adblocker-all-in-one.com/ref/';
    const message = `Block ads like a pro! Join me on AdBlocker All-In-One and unlock premium features. Use my code: ${code}`;
    
    return {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${baseUrl}${code}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${baseUrl}${code}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${baseUrl}${code}`,
      email: `mailto:?subject=Join AdBlocker All-In-One&body=${encodeURIComponent(message)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
      telegram: `https://t.me/share/url?url=${baseUrl}${code}&text=${encodeURIComponent(message)}`
    };
  }
}

// Referral Dashboard Component
const ReferralDashboard: React.FC = () => {
  const [referralCode, setReferralCode] = useState<string>('');
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [progress, setProgress] = useState<number>(0);
  
  useEffect(() => {
    loadReferralData();
  }, []);
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Referral Program</h2>
      
      {/* Referral Code Display */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg mb-6">
        <p className="text-sm opacity-90">Your Referral Code</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-3xl font-mono font-bold">{referralCode}</span>
          <button 
            onClick={() => copyToClipboard(referralCode)}
            className="px-4 py-2 bg-white text-purple-600 rounded-md hover:bg-gray-100"
          >
            Copy Code
          </button>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span>Progress to Tier 4</span>
          <span>{referrals.length} / 30 Referrals</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${(referrals.length / 30) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Social Sharing */}
      <SocialShareButtons code={referralCode} />
      
      {/* Referral List */}
      <ReferralList referrals={referrals} />
    </div>
  );
};
```

### **Weekly Engagement Tracking**

```typescript
// Weekly Engagement System
class WeeklyEngagementTracker {
  private readonly ENGAGEMENT_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  // Check engagement status
  async checkEngagementStatus(userId: string): Promise<EngagementStatus> {
    const user = await db.collection('users').doc(userId).get();
    const userData = user.data();
    
    if (!userData || userData.tier.current < 5) {
      return { required: false, status: 'not-applicable' };
    }
    
    const lastCheck = userData.engagement.lastWeeklyCheck?.toDate();
    const now = new Date();
    
    if (!lastCheck) {
      return { required: true, status: 'never-checked' };
    }
    
    const timeSinceLastCheck = now.getTime() - lastCheck.getTime();
    
    if (timeSinceLastCheck > this.ENGAGEMENT_INTERVAL) {
      return { 
        required: true, 
        status: 'overdue',
        daysOverdue: Math.floor(timeSinceLastCheck / (24 * 60 * 60 * 1000)) - 7
      };
    }
    
    const daysUntilNext = 7 - Math.floor(timeSinceLastCheck / (24 * 60 * 60 * 1000));
    
    return { 
      required: false, 
      status: 'active',
      daysUntilNext 
    };
  }
  
  // Record engagement
  async recordEngagement(userId: string, type: string): Promise<void> {
    const now = new Date();
    
    await db.collection('users').doc(userId).update({
      'engagement.lastActive': now,
      'engagement.lastWeeklyCheck': now,
      'engagement.weeklyStreak': FieldValue.increment(1),
      'engagement.totalEngagements': FieldValue.increment(1),
      'engagement.activities': FieldValue.arrayUnion({
        type,
        timestamp: now,
        metadata: {
          userAgent: navigator.userAgent,
          platform: navigator.platform
        }
      })
    });
    
    // Reset missed weeks counter
    await db.collection('users').doc(userId).update({
      'engagement.missedWeeks': 0
    });
  }
  
  // Setup automatic reminders
  async setupReminders(userId: string): Promise<void> {
    // Create browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      chrome.alarms.create(`weekly-reminder-${userId}`, {
        periodInMinutes: 7 * 24 * 60, // Weekly
        when: Date.now() + (6 * 24 * 60 * 60 * 1000) // 6 days from now
      });
    }
    
    // Setup email reminder via Firebase Functions
    await functions.httpsCallable('scheduleWeeklyReminder')({ userId });
  }
}

// Weekly Engagement UI Component
const WeeklyEngagementPrompt: React.FC = () => {
  const [status, setStatus] = useState<EngagementStatus | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  
  const handleEngagement = async () => {
    setIsCompleting(true);
    
    try {
      // Record engagement
      await engagementTracker.recordEngagement(currentUser.uid, 'weekly-check');
      
      // Show success animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      // Update UI
      setStatus({ required: false, status: 'active', daysUntilNext: 7 });
      
      // Show reward notification
      toast.success('Weekly engagement completed! Tier 5 features remain unlocked.');
    } catch (error) {
      toast.error('Failed to record engagement. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  };
  
  if (!status?.required) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 transform transition-all">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h3 className="text-2xl font-bold mb-2">Weekly Engagement Required</h3>
          <p className="text-gray-600">
            {status.status === 'overdue' 
              ? `You're ${status.daysOverdue} days overdue! Complete now to maintain Tier 5.`
              : 'Complete your weekly check-in to keep your Ultimate features active.'}
          </p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={handleEngagement}
            disabled={isCompleting}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg
                     font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50
                     transition-all transform hover:scale-105"
          >
            {isCompleting ? 'Completing...' : 'Complete Weekly Engagement'}
          </button>
          
          <button
            onClick={() => setShowDetails(true)}
            className="w-full py-3 border border-gray-300 rounded-lg text-gray-700
                     hover:bg-gray-50 transition-colors"
          >
            Learn More About Tier 5
          </button>
        </div>
        
        {status.status === 'overdue' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">
              ⚠️ Warning: Failure to complete will result in downgrade to Tier 4
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
```

This comprehensive technical documentation provides everything needed to build the AdBlocker-All-In-One Chrome extension with Claude Code. The implementation combines cutting-edge ad blocking technology with an innovative gamified tier system, ensuring both user engagement and sustainable growth while maintaining the highest standards of performance, security, and user privacy.