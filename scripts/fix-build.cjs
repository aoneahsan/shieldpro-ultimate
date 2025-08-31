#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const distDir = path.join(__dirname, '..', 'dist');

console.log('🔧 Post-build fixes starting...');

// 1. Remove duplicate CSS links from HTML files
console.log('📝 Fixing HTML files...');
const htmlFiles = glob.sync(path.join(distDir, '*.html'));

htmlFiles.forEach(htmlFile => {
  let content = fs.readFileSync(htmlFile, 'utf8');
  const fileName = path.basename(htmlFile);
  
  // Remove the hashed CSS link injected by webpack
  // Keep only the non-hashed CSS reference
  const hashPattern = /<link href="[^"]+\.[a-f0-9]{20}\.css" rel="stylesheet">/g;
  content = content.replace(hashPattern, '');
  
  fs.writeFileSync(htmlFile, content);
  console.log(`  ✓ Fixed ${fileName}`);
});

// 2. Rename hashed CSS files to non-hashed names
console.log('🎨 Renaming CSS files...');
const cssFiles = glob.sync(path.join(distDir, '*.*.css'));

cssFiles.forEach(cssFile => {
  const fileName = path.basename(cssFile);
  // Extract the base name (popup, options, etc) from hashed filename
  const match = fileName.match(/^([^.]+)\.[a-f0-9]{20}\.css$/);
  
  if (match) {
    const baseName = match[1];
    const newPath = path.join(distDir, `${baseName}.css`);
    
    // Copy content to new file (in case the non-hashed already exists)
    fs.copyFileSync(cssFile, newPath);
    // Remove the hashed file
    fs.unlinkSync(cssFile);
    
    console.log(`  ✓ Renamed ${fileName} to ${baseName}.css`);
  }
});

// 3. Ensure tiers-info.html exists
const tiersInfoPath = path.join(distDir, 'tiers-info.html');
if (!fs.existsSync(tiersInfoPath)) {
  console.log('📄 Creating tiers-info.html...');
  
  const tiersInfoContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ShieldPro Ultimate - Tier Information</title>
  <script src="theme-loader.js"></script>
  <link rel="stylesheet" href="tiers-info.css">
</head>
<body>
  <div id="root"></div>
  <script src="vendor.js"></script>
  <script src="tiers-info.js"></script>
</body>
</html>`;
  
  fs.writeFileSync(tiersInfoPath, tiersInfoContent);
  console.log('  ✓ Created tiers-info.html');
}

// 4. Ensure theme-loader.js exists
const themeLoaderSource = path.join(__dirname, '..', 'public', 'theme-loader.js');
const themeLoaderDest = path.join(distDir, 'theme-loader.js');
if (fs.existsSync(themeLoaderSource) && !fs.existsSync(themeLoaderDest)) {
  console.log('📄 Copying theme-loader.js...');
  fs.copyFileSync(themeLoaderSource, themeLoaderDest);
  console.log('  ✓ Copied theme-loader.js');
}

console.log('✅ Post-build fixes completed!');