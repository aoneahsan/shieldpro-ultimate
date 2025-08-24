#!/usr/bin/env node
/**
 * Extension Validation Script
 * Validates built extension files and configurations without browser dependencies
 */

const fs = require('fs');
const path = require('path');

let testsPassed = 0;
let testsFailed = 0;

function log(message, type = 'info') {
  const colors = {
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    info: '\x1b[36m',
    reset: '\x1b[0m'
  };
  
  const prefix = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  console.log(`${colors[type]}${prefix[type]} ${message}${colors.reset}`);
}

function test(description, testFn) {
  try {
    const result = testFn();
    if (result) {
      log(`${description}: PASSED`, 'success');
      testsPassed++;
    } else {
      log(`${description}: FAILED`, 'error');
      testsFailed++;
    }
  } catch (error) {
    log(`${description}: ERROR - ${error.message}`, 'error');
    testsFailed++;
  }
}

function validateJSON(filePath, description) {
  test(`${description} - JSON validity`, () => {
    if (!fs.existsSync(filePath)) return false;
    try {
      JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return true;
    } catch (e) {
      return false;
    }
  });
}

function validateFileExists(filePath, description) {
  test(`${description} - File exists`, () => {
    return fs.existsSync(filePath);
  });
}

function validateManifest(manifestPath, expectedVersion, browser) {
  test(`${browser} Manifest - Version ${expectedVersion}`, () => {
    if (!fs.existsSync(manifestPath)) return false;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return manifest.manifest_version === expectedVersion;
  });
  
  test(`${browser} Manifest - Required fields`, () => {
    if (!fs.existsSync(manifestPath)) return false;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return manifest.name && manifest.version && manifest.description;
  });
  
  test(`${browser} Manifest - Permissions`, () => {
    if (!fs.existsSync(manifestPath)) return false;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const requiredPermissions = ['storage', 'tabs'];
    return requiredPermissions.every(perm => 
      manifest.permissions && manifest.permissions.includes(perm)
    );
  });
}

function validateRules(rulesPath, minRules, tierName) {
  test(`${tierName} Rules - File exists`, () => {
    return fs.existsSync(rulesPath);
  });
  
  test(`${tierName} Rules - Valid JSON`, () => {
    if (!fs.existsSync(rulesPath)) return false;
    try {
      const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
      return Array.isArray(rules);
    } catch (e) {
      return false;
    }
  });
  
  test(`${tierName} Rules - Minimum count (${minRules})`, () => {
    if (!fs.existsSync(rulesPath)) return false;
    try {
      const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
      return rules.length >= minRules;
    } catch (e) {
      return false;
    }
  });
}

function validateBuildOutput(distPath, browser) {
  const requiredFiles = [
    'manifest.json',
    'background.js',
    'popup.js',
    'options.js', 
    'content.js',
    'youtube-blocker.js',
    'popup.html',
    'options.html',
    'tiers-info.html',
    'blocked.html'
  ];
  
  requiredFiles.forEach(file => {
    validateFileExists(path.join(distPath, file), `${browser} - ${file}`);
  });
  
  // Check rules directory
  const rulesDir = path.join(distPath, 'rules');
  test(`${browser} - Rules directory`, () => {
    return fs.existsSync(rulesDir) && fs.statSync(rulesDir).isDirectory();
  });
  
  // Check icons directory
  const iconsDir = path.join(distPath, 'icons');
  test(`${browser} - Icons directory`, () => {
    return fs.existsSync(iconsDir) && fs.statSync(iconsDir).isDirectory();
  });
}

function validateServiceWorker(backgroundPath) {
  test('Service Worker - Contains tier management', () => {
    if (!fs.existsSync(backgroundPath)) return false;
    const content = fs.readFileSync(backgroundPath, 'utf8');
    return content.includes('updateTierRules') || content.includes('tierLevel');
  });
  
  test('Service Worker - Contains context menu', () => {
    if (!fs.existsSync(backgroundPath)) return false;
    const content = fs.readFileSync(backgroundPath, 'utf8');
    return content.includes('contextMenus') || content.includes('view-tiers');
  });
}

function validateContentScript(contentPath) {
  test('Content Script - Exists and has content', () => {
    if (!fs.existsSync(contentPath)) return false;
    const content = fs.readFileSync(contentPath, 'utf8');
    return content.length > 1000; // Should be substantial
  });
}

function validateUIPages() {
  // Validate tiers info page
  test('Tiers Info Page - Contains tier information', () => {
    const tiersPath = path.join('dist', 'tiers-info.html');
    if (!fs.existsSync(tiersPath)) return false;
    const content = fs.readFileSync(tiersPath, 'utf8');
    return content.includes('Tier 1') && content.includes('Tier 4') && content.includes('ShieldPro');
  });
  
  // Validate blocked page
  test('Blocked Page - Contains security warning', () => {
    const blockedPath = path.join('dist', 'blocked.html');
    if (!fs.existsSync(blockedPath)) return false;
    const content = fs.readFileSync(blockedPath, 'utf8');
    return content.includes('Site Blocked') && content.includes('ShieldPro');
  });
}

function main() {
  log('🔍 Starting Extension Validation Tests...', 'info');
  
  // Validate Chrome/Edge build
  log('\n📦 Validating Chrome/Edge Build', 'info');
  validateManifest('dist/manifest.json', 3, 'Chrome/Edge');
  validateBuildOutput('dist', 'Chrome/Edge');
  
  // Validate Firefox build  
  log('\n🦊 Validating Firefox Build', 'info');
  validateManifest('dist-firefox/manifest.json', 2, 'Firefox');
  validateBuildOutput('dist-firefox', 'Firefox');
  
  // Validate rules files
  log('\n📋 Validating Tier Rules', 'info');
  validateRules('dist/rules/tier1.json', 40, 'Tier 1');
  validateRules('dist/rules/tier2.json', 10, 'Tier 2');
  validateRules('dist/rules/tier3.json', 100, 'Tier 3');
  validateRules('dist/rules/tier4-security.json', 15, 'Tier 4 Security');
  
  // Validate core scripts
  log('\n⚙️ Validating Core Scripts', 'info');
  validateServiceWorker('dist/background.js');
  validateContentScript('dist/content.js');
  
  // Validate UI pages
  log('\n🖼️ Validating UI Pages', 'info');
  validateUIPages();
  
  // Additional JSON validation
  log('\n📄 Validating JSON Files', 'info');
  validateJSON('dist/manifest.json', 'Chrome Manifest');
  validateJSON('dist-firefox/manifest.json', 'Firefox Manifest');
  validateJSON('dist/locales/en/translation.json', 'English Translations');
  
  // Size checks
  test('Bundle Size - Within reasonable limits', () => {
    const manifestPath = 'dist/manifest.json';
    if (!fs.existsSync(manifestPath)) return false;
    
    // Check that main files are not too large (indicating potential issues)
    const backgroundSize = fs.statSync('dist/background.js').size;
    const popupSize = fs.statSync('dist/popup.js').size;
    
    // Background should be reasonable size (under 100KB)
    // Popup can be larger due to React bundle
    return backgroundSize < 100000 && popupSize < 2000000;
  });
  
  // Summary
  log('\n📊 VALIDATION SUMMARY', 'info');
  log('═'.repeat(40), 'info');
  
  const total = testsPassed + testsFailed;
  const successRate = Math.round((testsPassed / total) * 100);
  
  if (successRate >= 95) {
    log(`✅ EXCELLENT: ${testsPassed}/${total} tests passed (${successRate}%)`, 'success');
    log('🚀 Extension is ready for production!', 'success');
  } else if (successRate >= 85) {
    log(`⚠️  GOOD: ${testsPassed}/${total} tests passed (${successRate}%)`, 'warning');
    log('📋 Minor issues need attention', 'warning');
  } else {
    log(`❌ NEEDS WORK: ${testsPassed}/${total} tests passed (${successRate}%)`, 'error');
    log('🔧 Several issues need to be resolved', 'error');
  }
  
  // Check for critical issues
  const criticalFailures = testsFailed;
  if (criticalFailures === 0) {
    log('\n🎉 NO CRITICAL ISSUES FOUND!', 'success');
    log('✅ All core functionality validated', 'success');
    log('✅ Cross-browser builds working', 'success');
    log('✅ All tier features present', 'success');
  } else {
    log(`\n⚠️  ${criticalFailures} issues need attention`, 'warning');
  }
  
  process.exit(testsFailed > 0 ? 1 : 0);
}

main();