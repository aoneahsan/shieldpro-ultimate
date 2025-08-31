# Build Troubleshooting Guide

## Common Build Issues and Solutions

### 1. JSX Transform Error: `e.jsxDEV is not a function`

**Problem**: Production build uses development JSX transform
**Symptoms**: 
- Error in browser console: `Uncaught TypeError: e.jsxDEV is not a function`
- Popup shows blank page

**Root Cause**: 
- Vite config using development JSX runtime in production
- Mixing development and production React transforms

**Solution**:
```javascript
// vite.config.ts - CORRECT production config
plugins: [
  react({
    jsxRuntime: 'automatic',  // NOT 'classic' in production
    jsxImportSource: 'react',
    jsxDev: false,  // MUST be false for production
    fastRefresh: false,  // Disable in production
  }),
],

esbuild: {
  jsx: 'automatic',  // Use automatic JSX transform
  minify: true,
  drop: ['console', 'debugger'],
}
```

### 2. Popup HTML Missing Script Tag

**Problem**: Built popup.html doesn't include popup.js
**Symptoms**: 
- Blank popup window
- No JavaScript errors (because script isn't loaded)

**Root Cause**: 
- Build process not properly injecting script tags
- Manual HTML files overriding generated ones

**Solution**:
1. Use Vite-generated HTML from `dist/src/popup/index.html`
2. Copy to `dist/popup.html` with corrected paths:
```html
<!-- dist/popup.html -->
<script type="module" crossorigin src="popup.js"></script>
<link rel="stylesheet" crossorigin href="assets/youtube.css">
```

### 3. CSS Not Loading in Popup

**Problem**: Styles missing in extension popup
**Symptoms**: 
- Unstyled popup content
- Missing Tailwind classes

**Solution**:
1. Ensure CSS is generated during build
2. Reference correct CSS file in popup.html:
```html
<link rel="stylesheet" crossorigin href="assets/youtube.css">
```

### 4. Strange "2" Appended to Build Commands

**Problem**: Build commands fail with "2" appended to paths
**Symptoms**: 
- Error: `Could not resolve entry module "2/src/content/content.ts"`

**Root Cause**: 
- Shell alias or environment issue
- Package.json script malformation

**Solution**:
- Use full yarn path: `/home/ahsan/.local/share/pnpm/yarn build`
- Or use npx directly: `npx vite build`

## Build Verification Checklist

After building, verify these files exist:
```bash
dist/
├── popup.html          # Must have <script src="popup.js">
├── popup.js            # Compiled React app
├── options.html        # Must have <script src="options.js">
├── options.js          # Compiled options page
├── background.js       # Service worker
├── content.js          # Content script
├── manifest.json       # Extension manifest
├── theme-loader.js     # Theme initialization
├── assets/
│   ├── youtube.css     # Main styles
│   └── *.js           # Chunk files
└── icons/             # Extension icons
```

## Critical Build Files

### 1. vite.config.ts (Production)
- MUST use automatic JSX runtime
- MUST disable jsxDev for production
- MUST set proper build targets

### 2. popup.html Requirements
- MUST include popup.js script tag
- MUST include CSS link
- MUST have theme-loader.js for dark mode

### 3. Build Command
```bash
# Correct build command
yarn build

# If issues, use clean config:
cp vite.config.clean.ts vite.config.ts
yarn build
```

## Prevention Measures

1. **Always test popup after build**:
   - Load extension in Chrome
   - Click extension icon
   - Check for blank popup
   - Open DevTools for errors

2. **Verify generated files**:
   ```bash
   # Check popup.html has script tag
   grep "popup.js" dist/popup.html
   
   # Check CSS exists
   ls -la dist/assets/*.css
   ```

3. **Use production config**:
   - Keep `vite.config.clean.ts` as backup
   - Don't mix development and production JSX settings

## Emergency Fix Script

Create this script as `fix-build.sh`:
```bash
#!/bin/bash

# Backup current config
cp vite.config.ts vite.config.backup.ts

# Use clean production config
cp vite.config.clean.ts vite.config.ts

# Clean and rebuild
rm -rf dist
yarn build

# Fix popup.html paths
sed -i 's|../../popup.js|popup.js|g' dist/popup.html
sed -i 's|../../assets/|assets/|g' dist/popup.html
sed -i 's|../../theme-loader.js|theme-loader.js|g' dist/popup.html

echo "Build fixed and ready!"
```

## Related Files
- `/vite.config.ts` - Main build configuration
- `/vite.config.clean.ts` - Clean production config (backup)
- `/src/popup/index.html` - Source popup HTML
- `/dist/popup.html` - Built popup HTML (must have script tags)