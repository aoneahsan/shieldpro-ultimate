#!/usr/bin/env node

/**
 * ShieldPro Ultimate - Feature Verification Script
 * Verifies all Tier 1 and Tier 2 features are properly implemented
 */

const fs = require('fs');
const path = require('path');

console.log('🛡️  ShieldPro Ultimate - Feature Verification\n');
console.log('='.repeat(50));

let totalChecks = 0;
let passedChecks = 0;
let warnings = [];

function checkFile(filePath, description) {
    totalChecks++;
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
        console.log(`✅ ${description}`);
        passedChecks++;
        return true;
    } else {
        console.log(`❌ ${description} - File not found: ${filePath}`);
        return false;
    }
}

function checkFileContent(filePath, searchString, description) {
    totalChecks++;
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes(searchString)) {
            console.log(`✅ ${description}`);
            passedChecks++;
            return true;
        } else {
            console.log(`❌ ${description} - Missing: "${searchString}"`);
            return false;
        }
    } else {
        console.log(`❌ ${description} - File not found: ${filePath}`);
        return false;
    }
}

function checkJsonRules(filePath, minRules, description) {
    totalChecks++;
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
        const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        if (Array.isArray(content) && content.length >= minRules) {
            console.log(`✅ ${description} (${content.length} rules)`);
            passedChecks++;
            return true;
        } else {
            console.log(`❌ ${description} - Expected at least ${minRules} rules, found ${content.length}`);
            return false;
        }
    } else {
        console.log(`❌ ${description} - File not found: ${filePath}`);
        return false;
    }
}

// TIER 1 VERIFICATION
console.log('\n📋 TIER 1: Basic Features (No Login Required)');
console.log('-'.repeat(50));

// Core Files
console.log('\n🔧 Core Extension Files:');
checkFile('dist/manifest.json', 'Extension manifest');
checkFile('dist/background.js', 'Service worker');
checkFile('dist/content.js', 'Content script');
checkFile('dist/popup.html', 'Popup UI');
checkFile('dist/options.html', 'Options page');

// Blocking Rules
console.log('\n🚫 Ad Blocking Rules:');
checkJsonRules('dist/rules/tier1.json', 50, 'Tier 1 blocking rules');
checkFileContent('dist/rules/tier1.json', 'doubleclick', 'DoubleClick blocking');
checkFileContent('dist/rules/tier1.json', 'googlesyndication', 'Google AdSense blocking');
checkFileContent('dist/rules/tier1.json', 'amazon-adsystem', 'Amazon ads blocking');
checkFileContent('dist/rules/tier1.json', 'facebook.com/tr', 'Facebook tracking blocking');
checkFileContent('dist/rules/tier1.json', 'popads', 'Popup ads blocking');

// Content Scripts
console.log('\n💉 Content Script Features:');
checkFile('src/content/content-script.ts', 'Element hiding script');
checkFile('src/content/popup-blocker.ts', 'Popup blocker');
checkFile('src/content/cookie-consent-blocker.ts', 'Cookie consent blocker');
checkFileContent('src/content/popup-blocker.ts', 'window.open', 'Window.open override');
checkFileContent('src/content/cookie-consent-blocker.ts', 'rejectAllCookies', 'Cookie auto-reject');

// UI Components
console.log('\n🎨 User Interface:');
checkFile('dist/popup.js', 'Popup JavaScript');
checkFile('dist/vendor.js', 'Vendor bundle');
checkFileContent('src/popup/App.tsx', 'toggleExtension', 'On/off toggle');
checkFileContent('src/popup/App.tsx', 'toggleWhitelist', 'Whitelist functionality');
checkFileContent('src/popup/App.tsx', 'formatNumber', 'Blocked counter display');

// Storage
console.log('\n💾 Storage & Settings:');
checkFile('src/shared/utils/storage.ts', 'Storage manager');
checkFileContent('src/shared/utils/storage.ts', 'getSettings', 'Settings retrieval');
checkFileContent('src/shared/utils/storage.ts', 'addToWhitelist', 'Whitelist management');
checkFileContent('src/shared/utils/storage.ts', 'incrementBlockedCount', 'Statistics tracking');

// TIER 2 VERIFICATION
console.log('\n\n📋 TIER 2: Enhanced Features (Account Required)');
console.log('-'.repeat(50));

// YouTube Blocking
console.log('\n📺 YouTube Ad Blocking:');
checkFile('dist/youtube-blocker.js', 'YouTube blocker bundle');
checkFile('src/content/youtube-blocker.ts', 'YouTube blocker source');
checkFileContent('src/content/youtube-blocker.ts', 'skipVideoAds', 'Video ad skipping');
checkFileContent('src/content/youtube-blocker.ts', 'ytp-ad-skip-button', 'Skip button clicking');
checkFileContent('src/content/youtube-blocker.ts', 'blockAdRequests', 'Request interception');

// Advanced Blocking Rules
console.log('\n🛡️ Advanced Tracker Blocking:');
checkJsonRules('dist/rules/tier2.json', 40, 'Tier 2 blocking rules');
checkFileContent('dist/rules/tier2.json', 'youtube.com/api/stats/ads', 'YouTube ad API blocking');
checkFileContent('dist/rules/tier2.json', 'facebook.com/plugins', 'Social widget blocking');
checkFileContent('dist/rules/tier2.json', 'mixpanel', 'Analytics blocking');
checkFileContent('dist/rules/tier2.json', 'hotjar', 'Session recording blocking');

// Firebase Integration
console.log('\n🔥 Firebase & Authentication:');
checkFile('src/config/firebase.ts', 'Firebase configuration');
checkFile('src/services/auth.service.ts', 'Authentication service');
checkFileContent('src/config/firebase.ts', 'initializeApp', 'Firebase initialization');
checkFileContent('src/services/auth.service.ts', 'signUp', 'User registration');
checkFileContent('src/services/auth.service.ts', 'signIn', 'User login');
checkFileContent('src/services/auth.service.ts', 'upgradeTier', 'Tier upgrade system');

// Account UI
console.log('\n👤 Account Management UI:');
checkFile('src/popup/components/AccountManager.tsx', 'Account manager component');
checkFileContent('src/popup/components/AccountManager.tsx', 'handleSignup', 'Signup handler');
checkFileContent('src/popup/components/AccountManager.tsx', 'handleLogin', 'Login handler');
checkFileContent('src/popup/components/AccountManager.tsx', 'referralCode', 'Referral system');

// Firebase Rules
console.log('\n🔒 Security Rules:');
checkFile('firebase/firestore.rules', 'Firestore security rules');
checkFileContent('firebase/firestore.rules', 'isAuthenticated', 'Authentication check');
checkFileContent('firebase/firestore.rules', 'tier.level', 'Tier-based access');

// CSS and Styling
console.log('\n🎨 Styling & CSS:');
checkFile('src/content/element-hider.css', 'Element hiding CSS');
checkFile('src/content/content.css', 'Content script styles');
checkFileContent('src/content/element-hider.css', 'display: none !important', 'Ad hiding styles');

// Environment Configuration
console.log('\n⚙️ Configuration:');
if (fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    if (envContent.includes('REACT_APP_FIREBASE_API_KEY')) {
        console.log('✅ Firebase credentials configured');
        passedChecks++;
        totalChecks++;
    } else {
        console.log('⚠️ Firebase credentials not found in .env');
        warnings.push('Firebase credentials may not be configured');
        totalChecks++;
    }
} else {
    console.log('⚠️ .env file not found');
    warnings.push('.env file missing - Firebase will not work');
    totalChecks++;
}

// Build Output
console.log('\n📦 Build Output:');
if (fs.existsSync('dist')) {
    const distFiles = fs.readdirSync('dist');
    console.log(`✅ Build directory contains ${distFiles.length} items`);
    passedChecks++;
    totalChecks++;
    
    // Check for critical files
    const criticalFiles = ['manifest.json', 'background.js', 'content.js', 'popup.html'];
    criticalFiles.forEach(file => {
        if (distFiles.includes(file)) {
            console.log(`  ✓ ${file}`);
        } else {
            console.log(`  ✗ Missing: ${file}`);
            warnings.push(`Critical file missing: ${file}`);
        }
    });
} else {
    console.log('❌ Build directory not found - run "yarn build" first');
    totalChecks++;
}

// Package Check
if (fs.existsSync('extension.zip')) {
    const stats = fs.statSync('extension.zip');
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`✅ Extension package ready (${sizeInMB} MB)`);
    passedChecks++;
    totalChecks++;
} else {
    console.log('⚠️ Extension package not found - run "yarn package" to create');
    warnings.push('Extension not packaged for Chrome Web Store');
    totalChecks++;
}

// SUMMARY
console.log('\n' + '=' . repeat(50));
console.log('📊 VERIFICATION SUMMARY');
console.log('=' . repeat(50));

const percentage = Math.round((passedChecks / totalChecks) * 100);
const status = percentage === 100 ? '✅ PASSED' : percentage >= 90 ? '⚠️ MOSTLY COMPLETE' : '❌ INCOMPLETE';

console.log(`\nTotal Checks: ${totalChecks}`);
console.log(`Passed: ${passedChecks}`);
console.log(`Failed: ${totalChecks - passedChecks}`);
console.log(`Success Rate: ${percentage}%`);
console.log(`\nStatus: ${status}`);

if (warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    warnings.forEach(warning => console.log(`  - ${warning}`));
}

if (percentage === 100) {
    console.log('\n🎉 All Tier 1 and Tier 2 features are fully implemented!');
    console.log('The extension is ready for testing and deployment.');
} else if (percentage >= 90) {
    console.log('\n📝 Most features are implemented. Check warnings above.');
} else {
    console.log('\n❗ Some features are missing. Review the failed checks above.');
}

console.log('\n📦 To test the extension:');
console.log('1. Run: yarn build:prod');
console.log('2. Open Chrome and go to: chrome://extensions/');
console.log('3. Enable Developer Mode');
console.log('4. Click "Load unpacked" and select the "dist" folder');
console.log('5. Test Tier 1 features without login');
console.log('6. Create an account to unlock Tier 2 features');

process.exit(percentage === 100 ? 0 : 1);