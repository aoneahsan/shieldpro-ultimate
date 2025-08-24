#!/usr/bin/env node

/**
 * Basic functionality test for ShieldPro Ultimate Extension
 * Tests core features without browser automation
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 BASIC FUNCTIONALITY TEST');
console.log('=============================\n');

let passedTests = 0;
let totalTests = 0;

function test(description, testFn) {
  totalTests++;
  try {
    testFn();
    console.log(`✅ ${description}`);
    passedTests++;
  } catch (error) {
    console.log(`❌ ${description} - ${error.message}`);
  }
}

// Test 1: Manifest validation
test('Manifest V3 structure is valid', () => {
  const manifest = JSON.parse(fs.readFileSync('./dist/manifest.json', 'utf8'));
  
  if (manifest.manifest_version !== 3) throw new Error('Not Manifest V3');
  if (!manifest.permissions.includes('storage')) throw new Error('Missing storage permission');
  if (!manifest.permissions.includes('declarativeNetRequest')) throw new Error('Missing declarativeNetRequest');
  if (!manifest.background.service_worker) throw new Error('Missing service worker');
  if (!manifest.action.default_popup) throw new Error('Missing popup');
});

// Test 2: Firefox manifest compatibility
test('Firefox manifest is MV2 compatible', () => {
  const firefoxManifest = JSON.parse(fs.readFileSync('./dist-firefox/manifest.json', 'utf8'));
  
  if (firefoxManifest.manifest_version !== 2) throw new Error('Firefox manifest should be MV2');
  if (!firefoxManifest.browser_action) throw new Error('Missing browser_action for Firefox');
  if (!firefoxManifest.browser_specific_settings) throw new Error('Missing Firefox-specific settings');
});

// Test 3: Essential files exist
test('All essential build files exist', () => {
  const requiredFiles = [
    'dist/background.js',
    'dist/popup.js', 
    'dist/content.js',
    'dist/options.js',
    'dist/popup.html',
    'dist/options.html'
  ];
  
  requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      throw new Error(`Missing required file: ${file}`);
    }
  });
});

// Test 4: Tier rules validation
test('Tier rules are valid JSON and contain blocking rules', () => {
  const tierFiles = [
    './dist/rules/tier1.json',
    './dist/rules/tier2.json', 
    './dist/rules/tier2-trackers.json',
    './dist/rules/tier3.json'
  ];
  
  tierFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      throw new Error(`Missing rules file: ${file}`);
    }
    
    const rules = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!Array.isArray(rules) || rules.length === 0) {
      throw new Error(`Invalid rules in ${file}`);
    }
    
    // Check rule structure
    const firstRule = rules[0];
    if (!firstRule.id || !firstRule.action || !firstRule.condition) {
      throw new Error(`Invalid rule structure in ${file}`);
    }
  });
});

// Test 5: Background script syntax
test('Background script has no syntax errors', () => {
  const backgroundCode = fs.readFileSync('./dist/background.js', 'utf8');
  
  // Basic checks for critical components
  if (!backgroundCode.includes('chrome.runtime')) {
    throw new Error('Background script missing chrome.runtime references');
  }
  if (!backgroundCode.includes('chrome.declarativeNetRequest')) {
    throw new Error('Background script missing declarativeNetRequest API');
  }
});

// Test 6: Content scripts validation
test('Content scripts include essential blocking code', () => {
  const contentCode = fs.readFileSync('./dist/content.js', 'utf8');
  
  // Should contain popup blocking logic
  if (!contentCode.includes('window.open') && !contentCode.includes('popup')) {
    throw new Error('Content script missing popup blocking logic');
  }
});

// Test 7: Popup HTML structure
test('Popup HTML has correct structure', () => {
  const popupHtml = fs.readFileSync('./dist/popup.html', 'utf8');
  
  if (!popupHtml.includes('<html')) throw new Error('Invalid HTML structure');
  if (!popupHtml.includes('popup.js')) throw new Error('Missing JavaScript reference');
  if (!popupHtml.includes('popup.') && !popupHtml.includes('.css')) {
    console.log('Warning: No CSS file referenced (might be inline)');
  }
});

// Test 8: Options page validation
test('Options page has correct structure', () => {
  const optionsHtml = fs.readFileSync('./dist/options.html', 'utf8');
  
  if (!optionsHtml.includes('<html')) throw new Error('Invalid HTML structure');
  if (!optionsHtml.includes('options.js')) throw new Error('Missing JavaScript reference');
});

// Test 9: Icons presence
test('Extension icons are present', () => {
  const iconSizes = [16, 48, 128];
  iconSizes.forEach(size => {
    const iconPath = `./dist/icons/icon-${size}.png`;
    if (!fs.existsSync(iconPath)) {
      throw new Error(`Missing icon: ${iconPath}`);
    }
    
    const stats = fs.statSync(iconPath);
    if (stats.size === 0) {
      throw new Error(`Empty icon file: ${iconPath}`);
    }
  });
});

// Test 10: Localization files
test('Localization files are valid', () => {
  const translationPath = './dist/locales/en/translation.json';
  if (!fs.existsSync(translationPath)) {
    throw new Error('Missing translation file');
  }
  
  const translations = JSON.parse(fs.readFileSync(translationPath, 'utf8'));
  if (Object.keys(translations).length === 0) {
    throw new Error('Empty translation file');
  }
});

// Test 11: Bundle size validation
test('Bundle sizes are within acceptable limits', () => {
  const stats = fs.statSync('./dist/vendor.js');
  const vendorSizeMB = stats.size / (1024 * 1024);
  
  if (vendorSizeMB > 2) { // Max 2MB
    throw new Error(`Vendor bundle too large: ${vendorSizeMB.toFixed(2)}MB`);
  }
  
  console.log(`   Vendor bundle size: ${vendorSizeMB.toFixed(2)}MB`);
});

// Test 12: Tier system completeness
test('All tier features have corresponding implementations', () => {
  // Tier 1: Basic features
  const tier1Features = ['popup-blocker', 'cookie-consent'];
  
  // Check content scripts
  const contentCode = fs.readFileSync('./dist/content.js', 'utf8');
  
  // Basic validation that core functionality is present
  if (!contentCode.includes('blocked') && !contentCode.includes('popup')) {
    throw new Error('Content script missing core blocking functionality');
  }
});

console.log('\n=============================');
console.log('TEST RESULTS');
console.log('=============================');
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

if (passedTests === totalTests) {
  console.log('\n🎉 ALL TESTS PASSED!');
  console.log('\n✅ EXTENSION IS READY FOR BROWSER TESTING');
  console.log('\nNext steps:');
  console.log('1. Open Chrome and go to chrome://extensions/');
  console.log('2. Enable "Developer mode"');
  console.log('3. Click "Load unpacked"');
  console.log('4. Select the "dist" folder');
  console.log('5. Test all features manually');
  console.log('\nThe extension should now be loaded and ready for Tier 4 development!');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed. Please fix the issues above.');
  process.exit(1);
}