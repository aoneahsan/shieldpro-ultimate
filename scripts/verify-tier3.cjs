#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('='.repeat(50));
console.log('ShieldPro Ultimate - Tier 3 Feature Verification');
console.log('='.repeat(50));

let totalChecks = 0;
let passedChecks = 0;

function checkFile(filePath, description) {
  totalChecks++;
  const exists = fs.existsSync(path.join(__dirname, '..', filePath));
  if (exists) {
    console.log(`✅ ${description}`);
    passedChecks++;
  } else {
    console.log(`❌ ${description} - File not found: ${filePath}`);
  }
  return exists;
}

function checkFileContent(filePath, searchString, description) {
  totalChecks++;
  try {
    const content = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
    if (content.includes(searchString)) {
      console.log(`✅ ${description}`);
      passedChecks++;
      return true;
    } else {
      console.log(`❌ ${description} - Pattern not found in ${filePath}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description} - Error reading ${filePath}`);
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
      console.log(`✅ ${description} (${itemCount} items)`);
      passedChecks++;
      return true;
    } else {
      console.log(`❌ ${description} - Expected at least ${minItems} items, found ${itemCount}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description} - Error reading ${filePath}: ${error.message}`);
    return false;
  }
}

console.log('\n📁 Core Tier 3 Components:');
console.log('-'.repeat(30));

// Check custom filters component
checkFile('src/options/components/CustomFilters.tsx', 'Custom Filters Component');
checkFileContent('src/options/components/CustomFilters.tsx', 'currentTier < 3', 'Custom Filters - Tier 3 requirement check');
checkFileContent('src/options/components/CustomFilters.tsx', 'isScheduled', 'Custom Filters - Scheduled blocking');
checkFileContent('src/options/components/CustomFilters.tsx', 'isRegex', 'Custom Filters - RegEx support');
checkFileContent('src/options/components/CustomFilters.tsx', 'exportFilters', 'Custom Filters - Export functionality');
checkFileContent('src/options/components/CustomFilters.tsx', 'importFilters', 'Custom Filters - Import functionality');
checkFileContent('src/options/components/CustomFilters.tsx', 'activateElementPicker', 'Custom Filters - Element picker integration');

console.log('\n🎯 Element Picker:');
console.log('-'.repeat(30));

// Check element picker
checkFile('src/content/element-picker.ts', 'Element Picker Tool');
checkFileContent('src/content/element-picker.ts', 'tier < 3', 'Element Picker - Tier 3 requirement');
checkFileContent('src/content/element-picker.ts', 'createOverlay', 'Element Picker - Visual overlay');
checkFileContent('src/content/element-picker.ts', 'createToolbar', 'Element Picker - Toolbar UI');
checkFileContent('src/content/element-picker.ts', 'generateSelector', 'Element Picker - CSS selector generation');
checkFileContent('src/content/element-picker.ts', 'blockSimilar', 'Element Picker - Block similar elements');
checkFileContent('src/content/element-picker.ts', 'saveCustomFilter', 'Element Picker - Save custom filters');

console.log('\n📋 Advanced Whitelist:');
console.log('-'.repeat(30));

// Check advanced whitelist
checkFile('src/options/components/AdvancedWhitelist.tsx', 'Advanced Whitelist Component');
checkFileContent('src/options/components/AdvancedWhitelist.tsx', 'currentTier < 3', 'Advanced Whitelist - Tier 3 requirement');
checkFileContent('src/options/components/AdvancedWhitelist.tsx', 'isTemporary', 'Advanced Whitelist - Temporary whitelist');
checkFileContent('src/options/components/AdvancedWhitelist.tsx', 'expiresAt', 'Advanced Whitelist - Expiration support');
checkFileContent('src/options/components/AdvancedWhitelist.tsx', 'isRegex', 'Advanced Whitelist - RegEx patterns');
checkFileContent('src/options/components/AdvancedWhitelist.tsx', 'allowedResources', 'Advanced Whitelist - Resource type filtering');
checkFileContent('src/options/components/AdvancedWhitelist.tsx', 'exportWhitelist', 'Advanced Whitelist - Export functionality');
checkFileContent('src/options/components/AdvancedWhitelist.tsx', 'importWhitelist', 'Advanced Whitelist - Import functionality');

console.log('\n📊 Tiers Information Page:');
console.log('-'.repeat(30));

// Check tiers page
checkFile('src/tiers/TiersPage.tsx', 'Tiers Information Page');
checkFile('src/tiers/index.tsx', 'Tiers Page Entry');
checkFile('public/tiers.html', 'Tiers HTML Template');
checkFileContent('src/tiers/TiersPage.tsx', 'Tier 3', 'Tiers Page - Tier 3 information');
checkFileContent('src/tiers/TiersPage.tsx', 'Custom filter list editor', 'Tiers Page - Custom filters feature');
checkFileContent('src/tiers/TiersPage.tsx', 'Element picker tool', 'Tiers Page - Element picker feature');
checkFileContent('src/tiers/TiersPage.tsx', 'Import/export settings', 'Tiers Page - Import/export feature');
checkFileContent('src/tiers/TiersPage.tsx', 'referralCode', 'Tiers Page - Referral system');

console.log('\n🔧 Service Worker Updates:');
console.log('-'.repeat(30));

// Check service worker updates
checkFileContent('src/background/service-worker.ts', 'tier3_rules', 'Service Worker - Tier 3 rules loading');
checkFileContent('src/background/service-worker.ts', 'view-tiers', 'Service Worker - Context menu for tiers');
checkFileContent('src/background/service-worker.ts', 'activate-element-picker', 'Service Worker - Element picker context menu');
checkFileContent('src/background/service-worker.ts', 'contextMenus.onClicked', 'Service Worker - Context menu handler');

console.log('\n🎛️ Options Page Integration:');
console.log('-'.repeat(30));

// Check options page integration
checkFileContent('src/options/Options.tsx', 'CustomFilters', 'Options - Custom Filters import');
checkFileContent('src/options/Options.tsx', 'AdvancedWhitelist', 'Options - Advanced Whitelist import');
checkFileContent('src/options/Options.tsx', 'exportSettings', 'Options - Export settings functionality');
checkFileContent('src/options/Options.tsx', 'importSettings', 'Options - Import settings functionality');
checkFileContent('src/options/Options.tsx', 'currentTier >= 3', 'Options - Tier 3 features gating');

console.log('\n🚫 Tier 3 Blocking Rules:');
console.log('-'.repeat(30));

// Check tier 3 rules
checkJsonFile('public/rules/tier3.json', 100, 'Tier 3 blocking rules (100+ rules)');
checkFileContent('public/rules/tier3.json', 'segment.com', 'Tier 3 Rules - Analytics blocking');
checkFileContent('public/rules/tier3.json', 'amplitude.com', 'Tier 3 Rules - Tracking blocking');
checkFileContent('public/rules/tier3.json', 'mixpanel.com', 'Tier 3 Rules - Advanced analytics');
checkFileContent('public/rules/tier3.json', 'intercom.io', 'Tier 3 Rules - Chat widgets');
checkFileContent('public/rules/tier3.json', 'facebook.com/tr', 'Tier 3 Rules - Social pixels');

console.log('\n📦 Build Output:');
console.log('-'.repeat(30));

// Check build output
checkFile('dist/manifest.json', 'Extension Manifest');
checkFile('dist/options.html', 'Options Page HTML');
checkFile('dist/options.js', 'Options Page JavaScript');
checkFile('dist/rules/tier3.json', 'Tier 3 Rules in Build');
checkFile('dist/background.js', 'Background Service Worker');
checkFile('dist/content.js', 'Content Script');

console.log('\n' + '='.repeat(50));
console.log(`Verification Complete: ${passedChecks}/${totalChecks} checks passed`);
console.log('='.repeat(50));

if (passedChecks === totalChecks) {
  console.log('\n✅ All Tier 3 features are properly implemented!');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${totalChecks - passedChecks} checks failed. Please review the implementation.`);
  process.exit(1);
}