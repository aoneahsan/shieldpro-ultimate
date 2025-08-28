# Firebase Deployment Commands

## Direct Firebase CLI Commands (Simple Approach)

### Deploy Everything
```bash
firebase deploy --only firestore
```

### Deploy Rules Only
```bash
firebase deploy --only firestore:rules
```

### Deploy Indexes Only
```bash
firebase deploy --only firestore:indexes
```

### Deploy Cloud Functions
```bash
firebase deploy --only functions
```

### Deploy Everything (Rules, Indexes, Functions)
```bash
firebase deploy --only firestore,functions
```

## Test Locally with Emulators
```bash
firebase emulators:start
```

## View Firebase Console
https://console.firebase.google.com/project/shieldpro-ultimate/overview

## Files Overview
- `firestore.rules` - Security rules for database access
- `firestore.indexes.json` - Composite indexes for queries
- `functions/` - Cloud Functions code

## Quick Fix for Permission Errors
If you get "Missing or insufficient permissions" errors:
```bash
firebase deploy --only firestore:rules
```

## Note on Indexes
- Single-field indexes are created automatically by Firestore
- Only composite (multi-field) indexes need to be defined
- Index building takes 2-5 minutes after deployment