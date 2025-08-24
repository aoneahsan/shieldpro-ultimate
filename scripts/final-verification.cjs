#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('========================================');
console.log('SHIELDPRO ULTIMATE - FINAL VERIFICATION');
console.log('========================================\n');

let passedChecks = 0;
let totalChecks = 0;
let errors = [];

function checkFile(filePath, description) {
  totalChecks++;
  const exists = fs.existsSync(path.join(__dirname, '..', filePath));
  if (exists) {
    console.log(`✅ ${description}`);
    passedChecks++;
    return true;
  } else {
    console.log(`❌ ${description} - File not found: ${filePath}`);
    errors.push(`Missing: ${filePath}`);
    return false;
  }
}

function checkCommand(command, description) {
  totalChecks++;
  try {
    execSync(command, { stdio: 'pipe' });
    console.log(`✅ ${description}`);
    passedChecks++;
    return true;
  } catch (error) {
    console.log(`❌ ${description} - Command failed: ${command}`);
    errors.push(`Command failed: ${command}`);
    return false;
  }
}

console.log('📦 BUILD VERIFICATION');
console.log('------------------------');
checkFile('dist/manifest.json', 'Chrome/Edge manifest built');
checkFile('dist/popup.html', 'Popup HTML built');
checkFile('dist/options.html', 'Options HTML built');
checkFile('dist/background.js', 'Background script built');
checkFile('dist/content.js', 'Content script built');
checkFile('dist/youtube-blocker.js', 'YouTube blocker built');
checkFile('dist/vendor.js', 'Vendor bundle built');
checkFile('dist/icons/icon-128.png', 'Icons copied');
checkFile('dist/rules/tier1.json', 'Tier 1 rules copied');
checkFile('dist/rules/tier2.json', 'Tier 2 rules copied');
checkFile('dist/rules/tier3.json', 'Tier 3 rules copied');
checkFile('dist-firefox/manifest.json', 'Firefox manifest created');

console.log('\n📝 DOCUMENTATION');
console.log('------------------------');
checkFile('README.md', 'Main README');
checkFile('docs/INSTALL.md', 'Installation guide');
checkFile('docs/FEATURES.md', 'Features documentation');
checkFile('docs/TIERS.md', 'Tier system guide');
checkFile('CLAUDE.md', 'Claude.md configuration');

console.log('\n🧪 TESTING SETUP');
console.log('------------------------');
checkFile('tests/e2e/tier-features.spec.ts', 'E2E test specs');
checkFile('tests/fixtures/test-ads.html', 'Test fixture - ads');
checkFile('tests/fixtures/test-cookies.html', 'Test fixture - cookies');
checkFile('playwright.config.ts', 'Playwright configuration');
checkFile('jest.config.js', 'Jest configuration');

console.log('\n⚙️ CONFIGURATION');
console.log('------------------------');
checkFile('.env.example', 'Environment example');
checkFile('webpack.config.mjs', 'Webpack configuration');
checkFile('tsconfig.json', 'TypeScript configuration');
checkFile('.eslintrc.js', 'ESLint configuration');
checkFile('tailwind.config.js', 'Tailwind configuration');
checkFile('postcss.config.js', 'PostCSS configuration');

console.log('\n✨ CODE QUALITY');
console.log('------------------------');
checkCommand('npx tsc --noEmit', 'TypeScript compilation (no errors)');
checkCommand('yarn lint --max-warnings=50', 'ESLint (max 50 warnings)');

console.log('\n🎯 TIER 1 FEATURES (Basic)');
console.log('------------------------');
checkFile('src/background/filter-engine.ts', 'Filter engine implementation');
checkFile('src/content/popup-blocker.ts', 'Popup blocker implementation');
checkFile('src/content/cookie-consent-blocker.ts', 'Cookie consent blocker');
checkFile('public/rules/tier1.json', 'Basic ad blocking rules');

console.log('\n⚡ TIER 2 FEATURES (Enhanced)');
console.log('------------------------');
checkFile('src/content/youtube-blocker.ts', 'YouTube ad blocker');
checkFile('src/services/auth.service.ts', 'Authentication service');
checkFile('src/services/firebase.service.ts', 'Firebase integration');
checkFile('public/rules/tier2-trackers.json', 'Tracker blocking rules');

console.log('\n⭐ TIER 3 FEATURES (Professional)');
console.log('------------------------');
checkFile('src/content/element-picker.ts', 'Element picker tool');
checkFile('src/options/components/CustomFilters.tsx', 'Custom filter editor');
checkFile('src/options/components/AdvancedWhitelist.tsx', 'Advanced whitelist');
checkFile('public/rules/tier3.json', 'Professional filter rules');

console.log('\n🏗️ PROJECT STRUCTURE');
console.log('------------------------');
const requiredDirs = [
  'src/background',
  'src/content', 
  'src/popup',
  'src/options',
  'src/services',
  'src/shared',
  'src/tiers',
  'public/icons',
  'public/rules',
  'tests/unit',
  'tests/integration',
  'tests/e2e',
  'docs'
];

requiredDirs.forEach(dir => {
  totalChecks++;
  if (fs.existsSync(path.join(__dirname, '..', dir))) {
    console.log(`✅ Directory: ${dir}`);
    passedChecks++;
  } else {
    console.log(`❌ Directory missing: ${dir}`);
    errors.push(`Missing directory: ${dir}`);
  }
});

console.log('\n========================================');
console.log('VERIFICATION SUMMARY');
console.log('========================================');
console.log(`\nTotal Checks: ${totalChecks}`);
console.log(`Passed: ${passedChecks}`);
console.log(`Failed: ${totalChecks - passedChecks}`);
console.log(`Success Rate: ${Math.round((passedChecks / totalChecks) * 100)}%`);

if (errors.length > 0) {
  console.log('\n❌ ERRORS FOUND:');
  errors.forEach(error => console.log(`  - ${error}`));
} else {
  console.log('\n✅ ALL CHECKS PASSED!');
}

console.log('\n📋 NEXT STEPS:');
console.log('1. Load extension in Chrome: chrome://extensions/');
console.log('2. Enable Developer mode');
console.log('3. Click "Load unpacked" and select the dist/ folder');
console.log('4. Test all tier features');
console.log('5. Run: yarn test:e2e for automated testing');

process.exit(errors.length > 0 ? 1 : 0);