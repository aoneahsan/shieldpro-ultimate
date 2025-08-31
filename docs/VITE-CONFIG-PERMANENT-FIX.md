# Vite Configuration - Permanent Fix for HTML Files

## Problem Solved
The recurring issue where popup.html and options.html were missing script tags and had incorrect paths has been permanently fixed.

## Solution Implementation

### Custom Vite Plugin
Created a custom Vite plugin `fixExtensionHtml()` in `vite.config.ts` that:

1. **Automatically processes HTML files** during the build
2. **Fixes all paths** to work with Chrome extension structure
3. **Ensures correct script tags** are present
4. **Sets opacity to 1** (visible)
5. **Copies necessary files** to dist folder

### What the Plugin Does

#### During Bundle Generation:
- Detects popup.html and options.html
- Fixes theme-loader.js path to root level
- Ensures opacity is set to 1 (not 0)
- Fixes all asset paths (removes ../ prefixes)
- Adds proper script tags with type="module"
- Creates root-level HTML files (dist/popup.html, dist/options.html)

#### After Bundle Writing:
- Copies theme-loader.js to dist/
- Copies content.css to dist/
- Copies manifest.json to dist/
- Copies icons folder to dist/icons/
- Copies rules folder to dist/rules/
- Copies _locales folder to dist/_locales/

## How It Works

### Build Process Flow:
1. Vite builds the React app
2. HTML files are generated in dist/src/popup/ and dist/src/options/
3. Plugin processes these HTML files
4. Plugin creates fixed versions at dist/popup.html and dist/options.html
5. Plugin copies all necessary static files

### Automatic Path Corrections:
- `../../theme-loader.js` → `theme-loader.js`
- `../../assets/` → `assets/`
- `../assets/` → `assets/`
- Script tags are ensured to have `type="module" crossorigin`

## No Manual Intervention Required

### The build process now:
- ✅ Automatically fixes HTML files
- ✅ Handles all path corrections
- ✅ Copies all necessary files
- ✅ Works with `yarn build`, `yarn watch`, etc.
- ✅ No need for post-build scripts

## Usage

Simply run:
```bash
yarn build
```

Or for watch mode:
```bash
yarn watch
```

The extension will be ready to load from the `dist/` folder with all files properly configured.

## Technical Details

### Key Configuration in vite.config.ts:

```typescript
plugins: [
  react({...}),
  fixExtensionHtml(), // Custom plugin handles everything
]

rollupOptions: {
  output: {
    assetFileNames: (assetInfo) => {
      // HTML files stay at root
      if (assetInfo.name?.endsWith('.html')) {
        return '[name][extname]';
      }
      // Everything else goes to assets
      return 'assets/[name].[ext]';
    },
  },
}
```

## Verification

After build, check that:
1. `dist/popup.html` exists with proper script tags
2. `dist/options.html` exists with proper script tags
3. Both have `opacity: 1` in styles
4. Both have correct asset paths
5. `dist/theme-loader.js` exists
6. All other necessary files are in place

## Future Maintenance

If you need to modify the build output structure:
1. Edit the `fixExtensionHtml()` plugin in `vite.config.ts`
2. The plugin handles all HTML processing and file copying
3. No need to modify multiple places or add post-build scripts