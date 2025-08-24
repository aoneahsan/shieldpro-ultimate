#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('='.repeat(60));
console.log('ShieldPro Ultimate - Complete System Verification');
console.log('='.repeat(60));

let totalChecks = 0;
let passedChecks = 0;
const issues = [];

function checkFile(filePath, description) {
  totalChecks++;
  const exists = fs.existsSync(path.join(__dirname, '..', filePath));
  if (exists) {
    console.log(`  ✅ ${description}`);
    passedChecks++;
  } else {
    console.log(`  ❌ ${description}`);
    issues.push(`Missing file: ${filePath}`);
  }
  return exists;
}

function checkFileContent(filePath, searchString, description) {
  totalChecks++;
  try {
    const content = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
    if (content.includes(searchString)) {
      console.log(`  ✅ ${description}`);
      passedChecks++;
      return true;
    } else {
      console.log(`  ❌ ${description}`);
      issues.push(`Pattern not found in ${filePath}: ${searchString}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ ${description}`);
    issues.push(`Error reading ${filePath}`);
    return false;
  }
}

function checkJsonFile(filePath, minItems, description) {
  totalChecks++;
  try {
    const content = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
    const json = JSON.parse(content);
    const itemCount = Array.isArray(json) ? json.length : Object.keys(json).length;
    if (itemCount >= minItems) {
      console.log(`  ✅ ${description} (${itemCount} items)`);
      passedChecks++;
      return true;
    } else {
      console.log(`  ❌ ${description} - Expected ${minItems}+, found ${itemCount}`);
      issues.push(`Insufficient items in ${filePath}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ ${description}`);
    issues.push(`JSON parse error in ${filePath}`);
    return false;
  }
}

function runCommand(command, description) {
  totalChecks++;
  try {
    execSync(command, { stdio: 'pipe' });
    console.log(`  ✅ ${description}`);
    passedChecks++;
    return true;
  } catch (error) {
    console.log(`  ❌ ${description}`);
    issues.push(`Command failed: ${command}`);
    return false;
  }
}

// TIER 1 VERIFICATION
console.log('\n🛡️ TIER 1 - Basic Shield (No account required)');
console.log('─'.repeat(50));

console.log('\n📁 Core Components:');
checkFile('src/popup/App.tsx', 'Popup interface');
checkFile('src/background/service-worker.ts', 'Service worker');
checkFile('src/content/injector.tsx', 'Content script injector');
checkFile('public/manifest.json', 'Extension manifest');

console.log('\n🚫 Ad Blocking:');
checkJsonFile('public/rules/tier1.json', 50, 'Basic ad blocking rules');
checkFileContent('public/rules/tier1.json', 'doubleclick.net', 'DoubleClick blocking');
checkFileContent('public/rules/tier1.json', 'googlesyndication.com', 'Google Ads blocking');
checkFileContent('public/rules/tier1.json', 'facebook.com/tr', 'Facebook pixel blocking');

console.log('\n🔧 Tier 1 Features:');
checkFile('src/content/popup-blocker.ts', 'Popup blocker');
checkFileContent('src/content/popup-blocker.ts', 'window.open', 'Popup detection');
checkFileContent('src/content/popup-blocker.ts', 'rate limiting', 'Rate limiting (2/min)');

checkFile('src/content/cookie-consent-blocker.ts', 'Cookie consent blocker');
checkFileContent('src/content/cookie-consent-blocker.ts', 'tier >= 1', 'Available for Tier 1');
checkFileContent('src/content/cookie-consent-blocker.ts', 'auto-reject', 'Auto-reject functionality');

console.log('\n📊 Statistics & UI:');
checkFileContent('src/popup/App.tsx', 'blockedCount', 'Blocking counter');
checkFileContent('src/popup/App.tsx', 'Toggle', 'On/off toggle');
checkFileContent('src/shared/utils/storage.ts', 'whitelist', 'Whitelist management');

// TIER 2 VERIFICATION
console.log('\n\n⚡ TIER 2 - Enhanced Protection (Account required)');
console.log('─'.repeat(50));

console.log('\n🔐 Authentication:');
checkFile('src/services/auth.service.ts', 'Authentication service');
checkFileContent('src/services/auth.service.ts', 'signInWithGoogle', 'Google Sign-in');
checkFileContent('src/services/auth.service.ts', 'signInWithEmail', 'Email Sign-in');
checkFileContent('src/services/auth.service.ts', 'referralCode', 'Referral system');

console.log('\n📺 YouTube Blocking:');
checkFile('src/content/youtube-blocker.ts', 'YouTube ad blocker');
checkFileContent('src/content/youtube-blocker.ts', 'tier.level >= 2', 'Tier 2 requirement');
checkFileContent('src/content/youtube-blocker.ts', 'video-ads', 'Video ad removal');
checkFileContent('src/content/youtube-blocker.ts', 'skipAd', 'Auto-skip ads');

console.log('\n🔍 Advanced Tracking:');
checkJsonFile('public/rules/tier2.json', 40, 'Advanced tracking rules');
checkFileContent('public/rules/tier2.json', 'analytics', 'Analytics blocking');
checkFileContent('public/rules/tier2.json', 'hotjar', 'Session recording blocking');
checkFileContent('public/rules/tier2.json', 'facebook', 'Social widget blocking');

console.log('\n☁️ Cross-Device Sync:');
checkFileContent('src/services/firebase.service.ts', 'Firestore', 'Firebase sync');
checkFileContent('src/shared/utils/storage.ts', 'syncSettings', 'Settings sync');

// TIER 3 VERIFICATION
console.log('\n\n⭐ TIER 3 - Professional Suite (Profile complete)');
console.log('─'.repeat(50));

console.log('\n✏️ Custom Filters:');
checkFile('src/options/components/CustomFilters.tsx', 'Custom filters editor');
checkFileContent('src/options/components/CustomFilters.tsx', 'isScheduled', 'Scheduled blocking');
checkFileContent('src/options/components/CustomFilters.tsx', 'isRegex', 'RegEx support');
checkFileContent('src/options/components/CustomFilters.tsx', 'exportFilters', 'Export filters');
checkFileContent('src/options/components/CustomFilters.tsx', 'importFilters', 'Import filters');

console.log('\n🎯 Element Picker:');
checkFile('src/content/element-picker.ts', 'Element picker tool');
checkFileContent('src/content/element-picker.ts', 'createOverlay', 'Visual overlay');
checkFileContent('src/content/element-picker.ts', 'generateSelector', 'Selector generation');
checkFileContent('src/content/element-picker.ts', 'blockSimilar', 'Block similar');

console.log('\n📋 Advanced Whitelist:');
checkFile('src/options/components/AdvancedWhitelist.tsx', 'Advanced whitelist');
checkFileContent('src/options/components/AdvancedWhitelist.tsx', 'isTemporary', 'Temporary entries');
checkFileContent('src/options/components/AdvancedWhitelist.tsx', 'allowedResources', 'Resource filtering');

console.log('\n💾 Import/Export:');
checkFileContent('src/options/Options.tsx', 'exportSettings', 'Export settings');
checkFileContent('src/options/Options.tsx', 'importSettings', 'Import settings');

console.log('\n🚫 Professional Filters:');
checkJsonFile('public/rules/tier3.json', 100, 'Professional blocking rules');

// DOCUMENTATION CHECK
console.log('\n\n📚 DOCUMENTATION');
console.log('─'.repeat(50));

checkFile('README.md', 'Main README');
checkFile('CLAUDE.md', 'Claude instructions');
checkFile('docs/INSTALL.md', 'Installation guide');
checkFile('docs/FEATURES.md', 'Features documentation');
checkFile('docs/TIERS.md', 'Tier system guide');
checkFile('docs/API.md', 'API documentation');

// BUILD VERIFICATION
console.log('\n\n🔨 BUILD SYSTEM');
console.log('─'.repeat(50));

console.log('\n📦 Dependencies:');
runCommand('yarn --version', 'Yarn installed');
runCommand('node --version', 'Node.js installed');

console.log('\n🏗️ Build Process:');
checkFile('webpack.config.js', 'Webpack configuration');
checkFile('tsconfig.json', 'TypeScript configuration');
checkFile('.eslintrc.js', 'ESLint configuration');

// MANIFEST VALIDATION
console.log('\n\n🎯 EXTENSION MANIFEST');
console.log('─'.repeat(50));

const manifestPath = path.join(__dirname, '..', 'public/manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  console.log('\n📋 Manifest V3 Compliance:');
  checkFileContent('public/manifest.json', '"manifest_version": 3', 'Manifest V3');
  checkFileContent('public/manifest.json', 'service_worker', 'Service worker defined');
  checkFileContent('public/manifest.json', 'declarativeNetRequest', 'DNR permission');
  checkFileContent('public/manifest.json', 'storage', 'Storage permission');
  checkFileContent('public/manifest.json', 'contextMenus', 'Context menu permission');
  
  console.log('\n🎨 Extension Info:');
  console.log(`  Name: ${manifest.name}`);
  console.log(`  Version: ${manifest.version}`);
  console.log(`  Description: ${manifest.description}`);
}

// ERROR CHECKING
console.log('\n\n🐛 ERROR CHECKING');
console.log('─'.repeat(50));

console.log('\n🔍 TypeScript Errors:');
runCommand('yarn type-check', 'No TypeScript errors');

console.log('\n🎨 Linting:');
runCommand('yarn lint --max-warnings=20', 'ESLint passed');

// BROWSER COMPATIBILITY
console.log('\n\n🌐 BROWSER COMPATIBILITY');
console.log('─'.repeat(50));

console.log('\n🔷 Chrome/Edge (Chromium):');
checkFileContent('public/manifest.json', 'action', 'Chrome action API');
checkFileContent('public/manifest.json', 'declarativeNetRequest', 'Chrome DNR API');

console.log('\n🦊 Firefox Preparation:');
console.log('  ⚠️  Firefox requires manifest adjustments:');
console.log('     - Use browser_action instead of action');
console.log('     - Limited declarativeNetRequest support');
console.log('     - May need webRequest fallback');

// FINAL SUMMARY
console.log('\n\n' + '='.repeat(60));
console.log('VERIFICATION SUMMARY');
console.log('='.repeat(60));

const percentage = Math.round((passedChecks / totalChecks) * 100);
console.log(`\n✅ Passed: ${passedChecks}/${totalChecks} checks (${percentage}%)`);

if (issues.length > 0) {
  console.log('\n⚠️  Issues Found:');
  issues.forEach(issue => console.log(`  - ${issue}`));
}

if (percentage === 100) {
  console.log('\n🎉 All systems operational! Ready for production.');
} else if (percentage >= 90) {
  console.log('\n✅ System mostly ready. Address minor issues above.');
} else if (percentage >= 70) {
  console.log('\n⚠️  Several issues need attention before release.');
} else {
  console.log('\n❌ Critical issues detected. Major fixes required.');
}

console.log('\n' + '='.repeat(60));

process.exit(issues.length > 0 ? 1 : 0);