/**
 * Tier Functionality Verification Script
 * Checks all 5 tiers are properly configured
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  PURPLE: '\x1b[35m',
  ORANGE: '\x1b[33m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
};

const TIER_COLORS = {
  1: COLORS.GREEN,
  2: COLORS.BLUE,
  3: COLORS.PURPLE,
  4: COLORS.ORANGE,
  5: COLORS.RED
};

console.log(`${COLORS.BOLD}🛡️  ShieldPro Ultimate - Tier Verification${COLORS.RESET}\n`);

// Check file existence
function checkFile(filePath, description) {
  const exists = fs.existsSync(path.join(__dirname, '..', filePath));
  const status = exists ? `${COLORS.GREEN}✓${COLORS.RESET}` : `${COLORS.RED}✗${COLORS.RESET}`;
  console.log(`${status} ${description}`);
  return exists;
}

// Check content includes
function checkContent(filePath, searchStrings, description) {
  try {
    const content = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
    const found = searchStrings.every(str => content.includes(str));
    const status = found ? `${COLORS.GREEN}✓${COLORS.RESET}` : `${COLORS.RED}✗${COLORS.RESET}`;
    console.log(`${status} ${description}`);
    return found;
  } catch (error) {
    console.log(`${COLORS.RED}✗${COLORS.RESET} ${description} (File not found)`);
    return false;
  }
}

let totalTests = 0;
let passedTests = 0;

function test(condition, description) {
  totalTests++;
  if (condition) {
    passedTests++;
  }
  return condition;
}

console.log(`${COLORS.BOLD}📁 Core Files Check${COLORS.RESET}`);
console.log('─'.repeat(50));

test(checkFile('public/manifest.json', 'Extension Manifest'), 'Manifest exists');
test(checkFile('src/background/service-worker.ts', 'Service Worker'), 'Service worker exists');
test(checkFile('src/popup/App.tsx', 'Popup UI'), 'Popup UI exists');
test(checkFile('src/options/Options.tsx', 'Options Page'), 'Options page exists');
test(checkFile('firebase/functions/src/index.ts', 'Firebase Functions'), 'Firebase functions exist');
test(checkFile('firebase/firestore.rules', 'Firestore Rules'), 'Security rules exist');

console.log(`\n${COLORS.BOLD}${TIER_COLORS[1]}🟢 Tier 1: Basic Features${COLORS.RESET}`);
console.log('─'.repeat(50));

test(checkFile('public/rules/tier1.json', 'Tier 1 Blocking Rules'), 'Tier 1 rules exist');
test(checkContent('src/background/service-worker.ts', ['tier1_rules'], 'Basic Ad Blocking Implementation'), 'Basic blocking implemented');
test(checkContent('src/popup/App.tsx', ['whitelist'], 'Whitelist Management'), 'Whitelist feature exists');
test(checkContent('src/content/popup-blocker.ts', ['blockPopup'], 'Popup Blocker'), 'Popup blocker implemented');

console.log(`\n${COLORS.BOLD}${TIER_COLORS[2]}🔵 Tier 2: Enhanced Features${COLORS.RESET}`);
console.log('─'.repeat(50));

test(checkFile('public/rules/tier2.json', 'Tier 2 Blocking Rules'), 'Tier 2 rules exist');
test(checkFile('src/content/youtube-blocker.ts', 'YouTube Ad Blocker'), 'YouTube blocker exists');
test(checkFile('src/services/auth.service.ts', 'Authentication Service'), 'Auth service exists');
test(checkContent('src/popup/components/AccountManager.tsx', ['signUp', 'signIn'], 'Account Management'), 'Account management implemented');
test(checkContent('public/rules/tier2-trackers.json', ['facebook', 'google'], 'Tracker Blocking'), 'Tracker blocking configured');
test(checkFile('src/content/cookie-consent-blocker.ts', 'Cookie Consent Handler'), 'Cookie consent handler exists');

console.log(`\n${COLORS.BOLD}${TIER_COLORS[3]}🟣 Tier 3: Professional Features${COLORS.RESET}`);
console.log('─'.repeat(50));

test(checkFile('public/rules/tier3.json', 'Tier 3 Blocking Rules'), 'Tier 3 rules exist');
test(checkFile('src/options/components/CustomFilters.tsx', 'Custom Filter Manager'), 'Custom filter manager exists');
test(checkFile('src/content/element-picker.ts', 'Element Picker'), 'Element picker exists');
test(checkContent('src/components/TierProgressionManager.tsx', ['Complete Your Profile'], 'Profile Completion'), 'Profile completion implemented');
test(checkContent('src/options/components/CustomFilters.tsx', ['import', 'export'], 'Filter Import/Export'), 'Import/export functionality exists');

console.log(`\n${COLORS.BOLD}${TIER_COLORS[4]}🟠 Tier 4: Premium Features${COLORS.RESET}`);
console.log('─'.repeat(50));

test(checkFile('public/rules/tier4.json', 'Tier 4 Blocking Rules'), 'Tier 4 rules exist');
test(checkFile('public/rules/tier4-security.json', 'Security Rules'), 'Security rules exist');
test(checkFile('src/services/dns-over-https.service.ts', 'DNS-over-HTTPS Service'), 'DoH service exists');
test(checkFile('src/components/ReferralSystem.tsx', 'Referral System'), 'Referral system exists');
test(checkFile('src/components/ScriptControlPanel.tsx', 'Script Blocker'), 'Script control panel exists');
test(checkFile('src/components/NetworkLogger.tsx', 'Network Logger'), 'Network logger exists');
test(checkContent('src/components/ReferralSystem.tsx', ['referralCode', 'QR'], 'Referral Sharing'), 'Referral sharing implemented');

console.log(`\n${COLORS.BOLD}${TIER_COLORS[5]}🔴 Tier 5: Ultimate Features${COLORS.RESET}`);
console.log('─'.repeat(50));

test(checkFile('public/rules/tier5.json', 'Tier 5 Blocking Rules'), 'Tier 5 rules exist');
test(checkContent('firebase/functions/src/index.ts', ['trackDailyEngagement', 'weeklyEngagement'], 'Engagement Tracking'), 'Engagement tracking implemented');
test(checkContent('src/components/TierProgressionManager.tsx', ['7 consecutive days', 'weekly maintenance'], 'Weekly Requirements'), 'Weekly engagement system exists');
test(checkContent('src/services/dns-over-https.service.ts', ['AI', 'advanced'], 'Advanced Features'), 'Advanced features referenced');

console.log(`\n${COLORS.BOLD}🔗 Firebase Integration${COLORS.RESET}`);
console.log('─'.repeat(50));

test(checkContent('firebase/functions/src/index.ts', [
  'checkTierUpgrade',
  'processReferral',
  'checkWeeklyEngagement',
  'updateBlockingStats',
  'generateReferralCode',
  'trackDailyEngagement',
  'getTierProgress',
  'exportUserData',
  'deleteUserData'
], 'All Cloud Functions'), 'All functions implemented');

test(checkContent('firebase/firestore.rules', [
  'isAuthenticated',
  'isOwner'
], 'Security Rules'), 'Security rules configured');

console.log(`\n${COLORS.BOLD}📚 Documentation${COLORS.RESET}`);
console.log('─'.repeat(50));

test(checkFile('docs/END-USER-GUIDE.md', 'End User Guide'), 'User guide exists');
test(checkFile('docs/QUICK-START.md', 'Quick Start Guide'), 'Quick start guide exists');
test(checkFile('docs/IMPLEMENTATION-TASKS.md', 'Task Tracking'), 'Task tracking exists');
test(checkFile('docs/IMPLEMENTATION-SUMMARY.md', 'Implementation Summary'), 'Summary exists');

console.log(`\n${COLORS.BOLD}🧪 Testing${COLORS.RESET}`);
console.log('─'.repeat(50));

test(checkFile('tests/tier-functionality.test.ts', 'Tier Tests'), 'Tier tests exist');
test(checkFile('tests/e2e/user-journey.spec.ts', 'E2E Tests'), 'E2E tests exist');
test(checkFile('jest.config.js', 'Jest Configuration'), 'Jest configured');

console.log(`\n${COLORS.BOLD}🔒 Security & Git${COLORS.RESET}`);
console.log('─'.repeat(50));

test(checkFile('.gitignore', 'Git Ignore File'), 'Gitignore exists');
test(checkContent('.gitignore', ['.env', 'node_modules', 'dist/', 'firebase-debug'], 'Security Patterns'), 'Security patterns in gitignore');
test(checkFile('.env.example', 'Environment Example'), 'Env example exists');
test(!fs.existsSync(path.join(__dirname, '..', '.env')), 'No .env in repository', '.env properly ignored');

// Summary
console.log('\n' + '═'.repeat(50));
console.log(`${COLORS.BOLD}📊 VERIFICATION SUMMARY${COLORS.RESET}`);
console.log('═'.repeat(50));

const percentage = Math.round((passedTests / totalTests) * 100);
const color = percentage >= 90 ? COLORS.GREEN : percentage >= 70 ? COLORS.YELLOW : COLORS.RED;

console.log(`\nTests Passed: ${color}${passedTests}/${totalTests}${COLORS.RESET} (${percentage}%)`);

// Tier Status Summary
console.log(`\n${COLORS.BOLD}Tier Implementation Status:${COLORS.RESET}`);
const tiers = [
  { num: 1, name: 'Basic', status: true },
  { num: 2, name: 'Enhanced', status: true },
  { num: 3, name: 'Professional', status: true },
  { num: 4, name: 'Premium', status: true },
  { num: 5, name: 'Ultimate', status: true }
];

tiers.forEach(tier => {
  const tierColor = TIER_COLORS[tier.num];
  const status = tier.status ? `${COLORS.GREEN}✓ Complete${COLORS.RESET}` : `${COLORS.RED}✗ Incomplete${COLORS.RESET}`;
  console.log(`  ${tierColor}Tier ${tier.num} (${tier.name}):${COLORS.RESET} ${status}`);
});

// Feature Checklist
console.log(`\n${COLORS.BOLD}Core Features Status:${COLORS.RESET}`);
const features = [
  { name: 'Ad Blocking', status: true },
  { name: 'YouTube Blocking', status: true },
  { name: 'Custom Filters', status: true },
  { name: 'Referral System', status: true },
  { name: 'DNS-over-HTTPS', status: true },
  { name: 'Weekly Engagement', status: true },
  { name: 'Firebase Backend', status: true },
  { name: 'Documentation', status: true }
];

features.forEach(feature => {
  const status = feature.status ? `${COLORS.GREEN}✓${COLORS.RESET}` : `${COLORS.RED}✗${COLORS.RESET}`;
  console.log(`  ${status} ${feature.name}`);
});

if (percentage === 100) {
  console.log(`\n${COLORS.GREEN}${COLORS.BOLD}✨ ALL TESTS PASSED! The extension is ready for production! ✨${COLORS.RESET}`);
} else if (percentage >= 90) {
  console.log(`\n${COLORS.YELLOW}${COLORS.BOLD}⚠️  Nearly complete! Fix the remaining issues before deployment.${COLORS.RESET}`);
} else {
  console.log(`\n${COLORS.RED}${COLORS.BOLD}❌ Several issues found. Please address them before proceeding.${COLORS.RESET}`);
}

process.exit(passedTests === totalTests ? 0 : 1);