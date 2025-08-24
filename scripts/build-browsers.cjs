#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const browsers = ['chrome', 'edge', 'firefox'];
const buildsDir = path.join(__dirname, '..', 'builds');

// Create builds directory if it doesn't exist
if (!fs.existsSync(buildsDir)) {
  fs.mkdirSync(buildsDir, { recursive: true });
}

function buildForBrowser(browser) {
  console.log(`\n🚀 Building for ${browser}...`);
  
  try {
    // Set environment variable for browser target
    process.env.BUILD_TARGET = browser;
    
    // Run webpack build
    execSync('npx webpack --mode production --config webpack.config.cjs', {
      stdio: 'inherit',
      env: { ...process.env, BUILD_TARGET: browser }
    });
    
    // Create browser-specific directory
    const browserDir = path.join(buildsDir, browser);
    if (fs.existsSync(browserDir)) {
      fs.rmSync(browserDir, { recursive: true, force: true });
    }
    fs.mkdirSync(browserDir, { recursive: true });
    
    // Copy dist files to browser-specific directory
    const distDir = path.join(__dirname, '..', 'dist');
    copyDirectory(distDir, browserDir);
    
    // Modify manifest.json for Firefox if needed
    if (browser === 'firefox') {
      const manifestPath = path.join(browserDir, 'manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      // Firefox-specific modifications
      delete manifest.background.service_worker;
      manifest.background.scripts = ['background.js'];
      manifest.background.persistent = false;
      
      // Firefox uses browser_specific_settings instead of key
      delete manifest.key;
      manifest.browser_specific_settings = {
        gecko: {
          id: "shieldpro@example.com",
          strict_min_version: "109.0"
        }
      };
      
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    }
    
    // Create ZIP file for the browser
    const zipName = `shieldpro-${browser}.zip`;
    const zipPath = path.join(buildsDir, zipName);
    
    console.log(`📦 Creating ${zipName}...`);
    execSync(`cd ${browserDir} && zip -r ${zipPath} .`, {
      stdio: 'inherit'
    });
    
    console.log(`✅ Successfully built for ${browser}: ${zipPath}`);
    
  } catch (error) {
    console.error(`❌ Failed to build for ${browser}:`, error.message);
    process.exit(1);
  }
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Build for all browsers or specific one from command line
const targetBrowser = process.argv[2];

if (targetBrowser && browsers.includes(targetBrowser)) {
  buildForBrowser(targetBrowser);
} else if (!targetBrowser) {
  console.log('🎯 Building for all browsers...\n');
  browsers.forEach(buildForBrowser);
  console.log('\n🎉 All builds completed successfully!');
} else {
  console.error(`Invalid browser: ${targetBrowser}`);
  console.log(`Available browsers: ${browsers.join(', ')}`);
  process.exit(1);
}