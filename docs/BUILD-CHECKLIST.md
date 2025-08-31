# Build Verification Checklist

## Pre-Build Checks
- [ ] Clean dist folder: `rm -rf dist`
- [ ] Verify vite.config.ts has production settings
- [ ] Check package.json build script is correct
- [ ] Ensure all dependencies are installed: `yarn install`

## Build Process
- [ ] Run build: `yarn build` or `/home/ahsan/.local/share/pnpm/yarn build`
- [ ] Watch for build errors
- [ ] Check for JSX transform warnings
- [ ] Verify no "2" appended to paths

## Post-Build Verification

### File Structure
```bash
# Run this command to verify:
ls -la dist/ | grep -E "popup|options|background|content|manifest"
```

Required files:
- [ ] `dist/popup.html` exists
- [ ] `dist/popup.js` exists  
- [ ] `dist/options.html` exists
- [ ] `dist/options.js` exists
- [ ] `dist/background.js` exists
- [ ] `dist/content.js` exists
- [ ] `dist/manifest.json` exists
- [ ] `dist/theme-loader.js` exists
- [ ] `dist/assets/` folder exists with CSS files

### Popup HTML Verification
```bash
# Check popup.html has required scripts:
grep -E "popup.js|theme-loader|assets.*css" dist/popup.html
```

Must contain:
- [ ] `<script src="theme-loader.js">`
- [ ] `<script type="module" src="popup.js">`
- [ ] `<link rel="stylesheet" href="assets/youtube.css">`
- [ ] Body has `opacity: 1` (not 0)

### JavaScript Verification
```bash
# Check for development JSX:
grep "jsxDEV" dist/popup.js && echo "ERROR: Development JSX found!" || echo "OK: Production build"
```

- [ ] No `jsxDEV` in popup.js
- [ ] Uses `jsx` or `jsxs` instead
- [ ] Import paths are relative (`./assets/`)

### Chrome Extension Load Test
1. [ ] Open Chrome Extensions page
2. [ ] Load unpacked from `dist/` folder
3. [ ] Click extension icon
4. [ ] Popup displays (not blank)
5. [ ] Check DevTools console for errors
6. [ ] Verify UI is styled (Tailwind CSS loaded)

## Quick Fix Commands

### If popup is blank:
```bash
# Fix opacity issue
sed -i 's/opacity: 0/opacity: 1/g' dist/popup.html

# Ensure script tags exist
grep "popup.js" dist/popup.html || echo '<script type="module" src="popup.js"></script>' >> dist/popup.html
```

### If JSX errors occur:
```bash
# Use clean config
cp vite.config.clean.ts vite.config.ts
rm -rf dist
yarn build
```

### If paths are wrong:
```bash
# Fix paths in popup.html
sed -i 's|../../popup.js|popup.js|g' dist/popup.html
sed -i 's|../../assets/|assets/|g' dist/popup.html
sed -i 's|../../theme-loader.js|theme-loader.js|g' dist/popup.html
```

## Automated Check Script

Save as `check-build.sh`:
```bash
#!/bin/bash

echo "🔍 Checking build output..."

# Check required files
files=("popup.html" "popup.js" "options.html" "options.js" "background.js" "content.js" "manifest.json")
for file in "${files[@]}"; do
  if [ -f "dist/$file" ]; then
    echo "✅ $file exists"
  else
    echo "❌ $file missing!"
    exit 1
  fi
done

# Check popup.html content
if grep -q "popup.js" dist/popup.html; then
  echo "✅ popup.js referenced"
else
  echo "❌ popup.js not referenced in popup.html!"
  exit 1
fi

# Check for dev JSX
if grep -q "jsxDEV" dist/popup.js; then
  echo "❌ Development JSX found in production build!"
  exit 1
else
  echo "✅ Production JSX transform used"
fi

# Check CSS
if ls dist/assets/*.css 1> /dev/null 2>&1; then
  echo "✅ CSS files generated"
else
  echo "❌ No CSS files found!"
  exit 1
fi

echo "✨ Build verification complete!"
```

## When to Run This Checklist

Run this checklist:
- After every build
- Before testing extension
- Before committing build changes
- When popup appears blank
- When seeing JSX errors in console