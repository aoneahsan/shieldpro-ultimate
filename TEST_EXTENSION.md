# Extension Test Checklist

## ✅ Build Status
- Extension built successfully in `/dist` folder
- All required files present:
  - `manifest.json` ✓
  - `popup.html` ✓
  - `options.html` ✓
  - `background.js` ✓
  - `content.js` ✓
  - Icons in `icons/` folder ✓
  - Rules in `rules/` folder ✓

## ✅ Firebase Configuration
- Security rules deployed without warnings
- Indexes created for all queries
- Rules allow:
  - Anonymous users to read/write their own data
  - Authenticated users full access to their profiles
  - Proper tier-based access control

## ✅ Fixed Issues
1. **JSX Build Error**: Fixed by configuring Vite to use automatic JSX runtime
2. **Firebase Permission Errors**: Fixed with proper security rules
3. **Extension Structure**: Reorganized dist folder to match manifest paths

## Loading the Extension in Chrome

1. Open Chrome and go to `chrome://extensions`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `/dist` folder: `/home/ahsan/Documents/01-code/adblocker-all-in-one/dist`
5. The extension should load without errors

## Firebase Commands (Simple CLI)

```bash
# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only Firestore indexes
firebase deploy --only firestore:indexes

# Deploy both rules and indexes
firebase deploy --only firestore

# Check deployment status
firebase firestore:rules:get
firebase firestore:indexes:list
```

## Testing the Extension

1. Click the extension icon in Chrome toolbar
2. The popup should open without errors
3. Features should unlock based on tier:
   - Tier 1: Basic ad blocking (no login required)
   - Tier 2: YouTube ad blocking (after account creation)
   - Tier 3: Custom filters (after profile completion)
   - Tier 4: Premium features (after 30 referrals)
   - Tier 5: Ultimate features (with weekly engagement)

## Development Commands

```bash
# Watch mode for development
yarn watch

# Production build
yarn build:prod

# Run with emulators
USE_FIREBASE_EMULATOR=true yarn dev
```

## Current Status: READY TO USE ✓

The extension is fully built and ready to load in Chrome. All Firebase permissions have been configured and deployed. The JSX build error has been fixed.