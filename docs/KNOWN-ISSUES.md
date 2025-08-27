# Known Issues & Solutions

## Critical Issues That Must Never Recur

### 1. ❌ **jsxDEV is not a function Error**

**Error Message**: 
```
Uncaught TypeError: o.jsxDEV is not a function
```

**Root Cause**: 
- React is being built in development mode instead of production
- jsxDEV is a development-only function that doesn't exist in production React

**Permanent Solution**:

1. **UPDATE vite.config.ts**:
```javascript
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production' || process.env.NODE_ENV === 'production';
  
  return {
    // CRITICAL: Define NODE_ENV
    define: {
      'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
    },
    
    plugins: [
      react({
        jsxRuntime: 'automatic',
        jsxImportSource: 'react',
        fastRefresh: !isProd, // MUST be false for production
        tsDecorators: true
      }),
    ],
    
    // ESBuild configuration
    esbuild: {
      jsx: 'automatic',
      jsxDev: false, // CRITICAL: Disable jsxDev
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
      jsxInject: `import React from 'react'`,
      minify: isProd,
      drop: isProd ? ['console', 'debugger'] : [],
    },
    
    build: {
      minify: isProd ? 'terser' : false,
      sourcemap: !isProd,
    }
  }
});
```

2. **CREATE vite.config.production.ts** (backup config):
- Copy from main config but force all production settings
- Set mode: 'production' explicitly
- Disable all development features

**Build Command**:
```json
// package.json
"build": "NODE_ENV=production vite build --mode production"
```

**Checklist Before Every Build**:
- [ ] NODE_ENV is set to "production"
- [ ] vite build uses --mode production
- [ ] React plugin has fastRefresh disabled for production
- [ ] esbuild is configured properly
- [ ] No development-only React functions in production build

---

### 2. ❌ **Duplicate HTML Files Issue**

**Problem**: 
- Multiple HTML files for same page (e.g., /options.html and /src/options/index.html)
- Some load without styling

**Solution**:
- NEVER create HTML files in public/ folder for pages that exist in src/
- Always use src/[page]/index.html as the single source
- Update all references in manifest.json and service-worker.ts

**Correct Structure**:
```
src/
  options/
    index.html  ✅ (USE THIS)
  popup/
    index.html  ✅ (USE THIS)
public/
  options.html ❌ (NEVER CREATE)
  popup.html   ❌ (NEVER CREATE)
```

---

### 3. ❌ **Build Failing with "2" Parameter**

**Error**: 
```
Could not resolve entry module "2/index.html"
```

**Cause**: 
- Extra parameter being passed to build commands
- Shell alias or npm script issue

**Solution**:
- Check package.json scripts don't have trailing numbers
- Use npx directly if yarn has issues
- Clear npm cache if needed

---

### 4. ❌ **CSS Not Loading on Extension Pages**

**Problem**: 
- Styles not applied to options/popup pages

**Solution**:
- Ensure Tailwind CSS is imported in index.tsx files
- Check vite.config.ts includes CSS processing
- Verify manifest.json web_accessible_resources

---

## Prevention Checklist

Before EVERY commit or build:

1. **React Production Build**
   - [ ] Run: `grep -r "jsxDEV" dist/` - should return NOTHING
   - [ ] Check: NODE_ENV=production is set
   - [ ] Verify: vite.config.ts has production checks

2. **File Structure**
   - [ ] No duplicate HTML files
   - [ ] All pages use src/[page]/index.html
   - [ ] manifest.json points to correct paths

3. **Build Process**
   - [ ] Build command works: `yarn build`
   - [ ] No extra parameters in scripts
   - [ ] Extension loads without console errors

4. **Testing**
   - [ ] Options page loads with styling
   - [ ] Popup page loads with styling
   - [ ] No console errors on any page
   - [ ] Tab persistence works on options page

## Commands to Verify Issues Are Fixed

```bash
# Check for jsxDEV in built files (should return nothing)
grep -r "jsxDEV" dist/

# Check React is in production mode
grep -r "process.env.NODE_ENV" dist/ | grep -v production

# Verify no duplicate HTML files
find . -name "*.html" -path "*/public/*" -o -path "*/src/*" | sort

# Test build works
yarn build

# Check for console errors
# Load extension and open Developer Tools on:
# - Popup page
# - Options page
# - Background service worker
```

## Issue Tracking Log

| Date | Issue | Fixed By | Verified |
|------|-------|----------|----------|
| 2024-01-27 | jsxDEV error on options page | Updated vite.config.ts | ⏳ |
| 2024-01-27 | Duplicate HTML files | Removed public/*.html files | ✅ |
| 2024-01-27 | URL state not persisting | Added hash-based routing | ✅ |

---

**IMPORTANT**: This file MUST be checked before making ANY changes to:
- Build configuration
- Vite config
- Package.json scripts
- React setup
- File structure