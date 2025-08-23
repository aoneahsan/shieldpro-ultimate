# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ShieldPro Ultimate** - A Chrome extension that blocks ads, popups, and trackers with a unique 5-tier progressive feature unlock system.

### Tech Stack
- **Frontend**: React 18 + TypeScript + TailwindCSS + Radix UI + Zustand
- **Backend**: Firebase (Auth, Firestore, Functions, Storage)
- **Extension**: Chrome Manifest V3 with declarativeNetRequest API
- **Testing**: Jest + React Testing Library + Puppeteer
- **Build**: Webpack 5

## Common Development Commands

### Initial Setup
```bash
# Install dependencies
yarn install

# Setup environment variables
cp .env.example .env
# Edit .env with your Firebase credentials

# Initialize Firebase
firebase init
# Select: Firestore, Functions, Hosting, Storage, Emulators
```

### Development
```bash
# Start development server with hot reload
yarn dev

# Watch mode for continuous building
yarn watch

# Start with specific tier unlocked (testing)
TIER=3 yarn dev

# Run Firebase emulators for local development
firebase emulators:start
```

### Testing
```bash
# Run all tests
yarn test

# Unit tests only
yarn test:unit

# Integration tests
yarn test:integration

# E2E tests (requires built extension)
yarn build && yarn test:e2e

# Test coverage report
yarn test:coverage

# Type checking
yarn type-check

# Linting
yarn lint

# Format code
yarn format
```

### Building & Deployment
```bash
# Create optimized production build
yarn build:prod

# Create ZIP for Chrome Web Store
yarn package

# Deploy to Firebase
firebase deploy --only firestore:rules
firebase deploy --only functions
firebase deploy --only hosting

# Version bump and release
yarn release -- --version=patch  # or minor, major
```

## High-Level Architecture

### Project Structure
```
/
├── src/                      # Source code
│   ├── background/          # Service worker and core logic
│   │   ├── service-worker.ts   # Main background script
│   │   ├── filter-engine.ts    # Core ad blocking engine
│   │   ├── firebase-sync.ts    # Firebase integration
│   │   └── tier-manager.ts     # Feature tier management
│   ├── content/            # Content scripts
│   │   ├── injector.tsx       # Main content script
│   │   ├── element-hider.ts   # CSS injection for hiding
│   │   ├── popup-blocker.ts   # Popup detection & blocking
│   │   └── youtube-blocker.ts # YouTube-specific blocking
│   ├── popup/              # Extension popup UI
│   │   ├── App.tsx            # Main popup component
│   │   ├── components/        # React components
│   │   └── hooks/             # Custom React hooks
│   ├── options/            # Options/settings page
│   │   ├── Options.tsx        # Settings root component
│   │   └── pages/             # Settings sub-pages
│   └── shared/             # Shared utilities
│       ├── types/             # TypeScript definitions
│       ├── utils/             # Helper functions
│       └── constants/         # App constants
├── public/                 # Static assets
│   ├── manifest.json          # Extension manifest V3
│   ├── icons/                 # Extension icons
│   └── rules/                 # DNR rule sets
├── firebase/               # Firebase configuration
│   ├── firestore.rules        # Security rules
│   └── functions/             # Cloud functions
└── tests/                  # Test files
    ├── unit/                  # Unit tests
    ├── integration/           # Integration tests
    └── e2e/                   # End-to-end tests
```

### Key Architecture Components

1. **Tier System (Core Feature)**
   - **Tier 1 (0-20%)**: Basic ad blocking without login
   - **Tier 2 (20-40%)**: Account creation unlocks YouTube blocking
   - **Tier 3 (40-60%)**: Full profile completion enables custom filters
   - **Tier 4 (60-80%)**: 30 referrals unlock premium features  
   - **Tier 5 (80-100%)**: Weekly engagement maintains ultimate features

2. **Filter Engine**
   - Uses Manifest V3's declarativeNetRequest API for efficient blocking
   - Implements trie data structure for pattern matching
   - Bloom filters for negative lookups optimization
   - Differential filter updates to minimize bandwidth

3. **Firebase Integration**
   - User authentication and profile management
   - Real-time tier status synchronization
   - Cloud functions for tier calculations and weekly engagement checks
   - Firestore for user data, statistics, and referral tracking

4. **Content Script Architecture**
   - Runs at document_start for early blocking
   - MutationObserver for dynamic content monitoring
   - Shadow DOM support for advanced blocking
   - CSS injection for element hiding

5. **State Management**
   - Zustand for global state management
   - Chrome storage API for persistent settings
   - Firebase for cross-device sync

## Key Implementation Details

### Firebase Configuration
- Project uses Firebase Auth, Firestore, Cloud Functions, and Storage
- Security rules enforce tier-based access control
- Cloud functions handle tier upgrades/downgrades automatically
- Weekly cron job checks Tier 5 engagement requirements

### Chrome Extension Standards
- Manifest V3 with service worker background script
- DeclarativeNetRequest for network-level blocking
- Content scripts for DOM manipulation
- Proper CSP headers and security implementation

### Performance Optimizations
- Lazy loading of tier-specific features
- Code splitting for popup and options pages
- Binary search tree for filter lookups
- LRU cache for recent blocking decisions
- Web Worker for heavy computations

### Testing Strategy
- Unit tests for all utility functions and hooks
- Integration tests for Firebase operations
- E2E tests with Puppeteer for extension flows
- Minimum 80% code coverage requirement

## Important Notes

1. **Environment Variables**: Always set up `.env` file with Firebase credentials before development
2. **Firebase Emulators**: Use `USE_FIREBASE_EMULATOR=true` for local development
3. **Node Version**: Use Node 22 for Firebase functions (not 24)
4. **Package Manager**: Use `yarn` for all dependency management
5. **Code Quality**: Run `yarn lint` and `yarn type-check` before committing
6. **Testing**: Ensure all tests pass before creating pull requests
7. **Tier Testing**: Use `TIER` environment variable to test specific tier features

## Common Workflows

### Adding a New Feature
1. Determine which tier the feature belongs to
2. Update `src/shared/constants/features.ts` with feature flag
3. Implement feature in appropriate module
4. Add tier check in component/function
5. Update tests to cover new feature
6. Update documentation if needed

### Updating Filter Lists
1. Modify filter rules in `public/rules/`
2. Update manifest.json if adding new rule sets
3. Test with different tier levels
4. Ensure backward compatibility

### Debugging Extension
1. Load unpacked extension from `dist/` folder
2. Open Chrome DevTools for background page
3. Use console logs in content scripts
4. Check Firebase emulator UI for backend issues
5. Monitor network tab for blocked requests

## Deployment Checklist
- [ ] All tests passing
- [ ] Version bumped in package.json and manifest.json
- [ ] Firebase rules deployed
- [ ] Cloud functions deployed
- [ ] Extension packaged as ZIP
- [ ] Release notes prepared
- [ ] Chrome Web Store listing updated