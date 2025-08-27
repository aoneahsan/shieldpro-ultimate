#!/bin/bash
# Safe build script to prevent jsxDEV errors

echo "🔨 Building extension in production mode..."
echo "Setting NODE_ENV=production"
export NODE_ENV=production

echo "Running vite build..."
./node_modules/.bin/vite build --mode production

echo "✅ Build complete!"
echo ""
echo "Checking for jsxDEV in output..."
if grep -r "jsxDEV" dist/ 2>/dev/null; then
    echo "❌ WARNING: jsxDEV found in production build!"
    echo "This will cause runtime errors. Please check vite.config.ts"
    exit 1
else
    echo "✅ No jsxDEV found - build is safe!"
fi

echo ""
echo "Build artifacts in dist/ folder"