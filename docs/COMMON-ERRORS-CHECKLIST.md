# Common Extension Errors Checklist

This document tracks common errors encountered during development and provides a checklist to verify before completing any work.

## Error History

### 1. Localization Error
**Error:** "Localization used, but default_locale wasn't specified in the manifest."
**Solution:** Add `default_locale: 'en'` to manifest.config.ts
**Date First Encountered:** 2025-08-27
**Status:** ✅ FIXED

### 2. CSS Loading Error
**Error:** "Could not load css 'src/content/content.css' for script."
**Solution:** Copy content.css to public folder and reference it as 'content.css' in manifest (not 'src/content/content.css')
**Date First Encountered:** 2025-08-27
**Status:** ✅ FIXED

## Pre-Completion Checklist

Before finishing any work on the extension, verify:

### Manifest Checks
- [ ] `default_locale` is set to 'en' if _locales folder exists
- [ ] All file paths in manifest.json are relative to the dist folder root
- [ ] Service worker path exists and is correct
- [ ] Content script CSS paths are valid and files exist
- [ ] Icon paths are valid and all icon files exist
- [ ] Rules JSON files exist at specified paths
- [ ] HTML files (popup.html, options.html) exist at specified paths

### Content Scripts
- [ ] Content script JS files exist at specified paths
- [ ] Content script CSS files exist at specified paths
- [ ] Paths in manifest are relative to dist root, not src
- [ ] All content script files are included in build output

### Build Output Structure
- [ ] dist/ folder contains all necessary files after build
- [ ] No references to src/ folder in final manifest.json
- [ ] All assets are copied/built to correct locations

### Common Path Issues
- [ ] Content CSS should be at `dist/content.css` not `dist/src/content/content.css`
- [ ] Or manifest should reference actual path where CSS is built
- [ ] Verify web_accessible_resources paths are correct

## Known Issues and Solutions

### Issue: Content CSS not loading [RESOLVED]
**Previous Manifest Reference:** `"css": ["src/content/content.css"]`
**Problem:** Path didn't exist in dist folder after build
**Solution Applied:**
1. Copied content.css to public/ folder
2. Updated manifest.config.ts to reference 'content.css' (not 'src/content/content.css')
3. Vite now copies public/content.css to dist/content.css during build
**Current Status:** ✅ FIXED

### Issue: Manifest not loading
**Common Causes:**
1. Invalid JSON syntax
2. Missing required fields
3. Invalid file paths
4. Missing default_locale when using _locales

## Verification Commands

```bash
# Check if all manifest files exist
yarn build
ls -la dist/

# Verify content.css location
find dist/ -name "*.css" -type f

# Check manifest validity
cat dist/manifest.json | jq .

# Test extension loading
# 1. Open Chrome
# 2. Go to chrome://extensions
# 3. Enable Developer mode
# 4. Click "Load unpacked"
# 5. Select dist/ folder
```

## Prevention Strategy

1. **Always run build before testing:** `yarn build`
2. **Check file paths:** Ensure all paths in manifest exist in dist/
3. **Test extension loading:** Load unpacked extension after each build
4. **Review this checklist:** Before marking any task complete

## Update Log

- **2025-08-27:** Document created, added localization and CSS loading errors