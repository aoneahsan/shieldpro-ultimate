# Security Notice

## API Key Rotation Completed

**Date**: August 30, 2025

All Firebase API keys have been removed from the source code and replaced with environment variables.

### Actions Taken:
1. ✅ Removed all hardcoded Firebase credentials from source files
2. ✅ Created .env.example template with placeholder values  
3. ✅ Updated .gitignore to exclude all sensitive files
4. ✅ Verified no secrets remain in active source code

### Required Actions:
1. **You must rotate your Firebase API keys** in the Firebase Console
2. **Update your local .env file** with the new credentials
3. **Never commit the .env file** (already in .gitignore)

### Files Updated:
- `src/background/firebase-init.ts` - Now uses environment variables
- `test-firebase.html` - Uses placeholder values
- `.gitignore` - Added dist-firefox/, dist-chrome/, dist-edge/

### Note on Git History:
Previous commits may contain exposed keys. These keys should be considered compromised and must be rotated in Firebase Console immediately.

## For Developers:

Before running the extension:
1. Copy `.env.example` to `.env`
2. Fill in your Firebase configuration from Firebase Console
3. Run `yarn build` to build with your configuration

The extension will not work without proper Firebase credentials in the .env file.