# HTML Files Fix Documentation

## Problem
The vite build process keeps corrupting the popup.html and options.html files by:
1. Removing the JavaScript module import (`<script type="module" src="...">`)
2. Changing paths incorrectly
3. Setting incorrect opacity values

## Solution

### Automatic Fix (Recommended)
The build process now automatically runs `./scripts/fix-html-files.sh` after every build.

### Manual Fix
If needed, run:
```bash
./scripts/fix-html-files.sh
```

### What the Fix Does

#### popup.html
- Adds proper `<script type="module" crossorigin src="popup.js"></script>`
- Sets `opacity: 1` in body style
- Includes all necessary modulepreload links
- Ensures correct asset paths

#### options.html
- Adds proper `<script type="module" crossorigin src="options.js"></script>`
- Sets `opacity: 1` in body style
- Includes all necessary modulepreload links
- Ensures correct asset paths

## Correct HTML Structure

### popup.html Must Have:
```html
<script src="theme-loader.js"></script>
<script type="module" crossorigin src="popup.js"></script>
<link rel="modulepreload" crossorigin href="assets/youtube.DWxOQNjk.js">
<link rel="modulepreload" crossorigin href="assets/storage.D7aoBfUR.js">
<link rel="stylesheet" crossorigin href="assets/youtube.css">
```

### options.html Must Have:
```html
<script src="theme-loader.js"></script>
<script type="module" crossorigin src="options.js"></script>
<link rel="modulepreload" crossorigin href="assets/youtube.DWxOQNjk.js">
<link rel="modulepreload" crossorigin href="assets/auth.service.BEW3isC_.js">
<link rel="modulepreload" crossorigin href="assets/storage.D7aoBfUR.js">
<link rel="stylesheet" crossorigin href="assets/youtube.css">
<link rel="stylesheet" crossorigin href="assets/options.css">
```

## Prevention
- Always run `yarn build` (not manual vite commands)
- The build script automatically applies the fix
- Check HTML files after build if issues persist

## Testing
After build:
1. Load extension in Chrome
2. Click extension icon - popup should appear
3. Right-click icon → Options - options page should load
4. Both should have proper styling and functionality