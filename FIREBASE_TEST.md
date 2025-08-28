# Firebase Permission Debugging

## Current Security Rules Status

### Fixed Issues:
1. **Safe Fallbacks**: Added existence checks before reading documents
   - `getUserTier()` now returns default tier 1 if user document doesn't exist
   - `isAdmin()` checks if document exists before reading

2. **Anonymous User Support**: 
   - Allow any authenticated user (including anonymous) to create their profile
   - Simplified authentication checks for initial operations

3. **Settings Access**: 
   - Allow authenticated users to read/write their settings even if they don't exist yet

## Potential Issues to Check:

### 1. Check if Firebase is initialized properly
Look in the browser console for:
- Firebase initialization errors
- Authentication state changes
- Network errors

### 2. Check Chrome DevTools Network Tab
Filter by "firestore" to see:
- Which documents are being accessed
- The exact permission error response

### 3. Common Permission Error Causes:

**Case 1: Trying to read before authentication**
- Solution: Ensure anonymous sign-in completes before any Firestore reads

**Case 2: Document path mismatch**
- Solution: Verify the exact path being accessed matches security rules

**Case 3: Missing required fields**
- Solution: Ensure all required fields are present when creating documents

## Quick Debug Steps:

1. Open Chrome DevTools Console
2. Look for the exact error message
3. Check which collection/document is causing the error
4. Note if user is authenticated when error occurs

## Security Rules Summary:

```javascript
// Users can:
- Read their own profile (users/{theirId})
- Create their own profile if authenticated
- Update their own profile (with restrictions)
- Read global stats (public)
- Read config documents (public)
- Access tier-based features based on their level
```

## If Still Getting Errors:

The error might be coming from:
1. Background service worker trying to access Firestore before auth
2. Content script trying to access Firestore directly (not allowed)
3. Popup trying to read user profile before sign-in completes

## Next Steps:

1. Open the extension popup
2. Open DevTools (right-click popup → Inspect)
3. Look at Console tab for specific error
4. Check Network tab for failed Firestore requests
5. Note the exact document path that's failing

Then we can create a more specific rule for that path.