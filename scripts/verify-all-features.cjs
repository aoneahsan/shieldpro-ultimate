#!/usr/bin/env node

/**
 * Comprehensive Feature Verification Script
 * Verifies all tier features are properly implemented
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class FeatureVerifier {
  constructor() {
    this.results = {
      tier1: { total: 0, passed: 0, failed: 0, features: [] },
      tier2: { total: 0, passed: 0, failed: 0, features: [] },
      tier3: { total: 0, passed: 0, failed: 0, features: [] },
      tier4: { total: 0, passed: 0, failed: 0, features: [] },
      tier5: { total: 0, passed: 0, failed: 0, features: [] }
    };
    this.errors = [];
  }

  log(message, color = 'reset') {
    console.log(`${COLORS[color]}${message}${COLORS.reset}`);
  }

  checkFileExists(filePath, description) {
    const exists = fs.existsSync(path.join(__dirname, '..', filePath));
    return {
      passed: exists,
      description,
      file: filePath,
      message: exists ? 'File exists' : 'File not found'
    };
  }

  checkCodePattern(filePath, pattern, description) {
    const fullPath = path.join(__dirname, '..', filePath);
    if (!fs.existsSync(fullPath)) {
      return {
        passed: false,
        description,
        file: filePath,
        message: 'File not found'
      };
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    const exists = pattern.test(content);
    return {
      passed: exists,
      description,
      file: filePath,
      message: exists ? 'Pattern found' : 'Pattern not found'
    };
  }

  verifyTier1() {
    this.log('\n🛡️  Verifying Tier 1: Basic Shield Features...', 'cyan');
    
    const features = [
      // Core files
      this.checkFileExists('src/background/filter-engine.ts', 'Filter Engine'),
      this.checkFileExists('src/background/service-worker.ts', 'Service Worker'),
      this.checkFileExists('src/content/content.ts', 'Content Script'),
      this.checkFileExists('public/rules/tier1.json', 'Tier 1 Rules'),
      
      // Feature implementations
      this.checkCodePattern('src/background/filter-engine.ts', /class FilterEngine/, 'FilterEngine Class'),
      this.checkCodePattern('src/background/filter-engine.ts', /loadFilterRules/, 'Filter Rules Loading'),
      this.checkCodePattern('src/background/service-worker.ts', /declarativeNetRequest/, 'Network Blocking'),
      this.checkCodePattern('src/content/popup-blocker.ts', /blockPopup/, 'Popup Blocking'),
      this.checkCodePattern('src/content/cookie-consent-handler.ts', /rejectAll/, 'Cookie Consent Auto-Reject'),
      
      // UI Components
      this.checkFileExists('src/popup/App.tsx', 'Popup UI'),
      this.checkCodePattern('src/popup/App.tsx', /BlockCounter/, 'Block Counter Component'),
      this.checkCodePattern('src/popup/App.tsx', /WhitelistToggle/, 'Whitelist Toggle'),
    ];

    this.processResults('tier1', features);
  }

  verifyTier2() {
    this.log('\n⚡ Verifying Tier 2: Enhanced Protection Features...', 'cyan');
    
    const features = [
      // YouTube blocking
      this.checkFileExists('src/content/youtube-blocker.ts', 'YouTube Blocker'),
      this.checkFileExists('public/rules/tier2.json', 'Tier 2 Rules'),
      this.checkCodePattern('src/content/youtube-blocker.ts', /YouTubeAdBlocker/, 'YouTube Ad Blocker Class'),
      this.checkCodePattern('src/content/youtube-blocker.ts', /skipAd|hideAd/, 'YouTube Ad Skip/Hide'),
      
      // Authentication
      this.checkFileExists('src/services/auth.service.ts', 'Auth Service'),
      this.checkFileExists('src/services/firebase.service.ts', 'Firebase Service'),
      this.checkCodePattern('src/services/auth.service.ts', /signInWithGoogle/, 'Google Sign-In'),
      this.checkCodePattern('src/services/auth.service.ts', /createUserWithEmailAndPassword/, 'Email Sign-Up'),
      
      // Cloud sync
      this.checkCodePattern('src/services/firebase.service.ts', /syncSettings/, 'Settings Sync'),
      this.checkCodePattern('src/services/firebase.service.ts', /getUserProfile/, 'User Profile'),
      
      // Tracking protection
      this.checkCodePattern('src/background/filter-engine.ts', /tracker.*block|block.*tracker/i, 'Tracker Blocking'),
      this.checkFileExists('src/content/privacy-protection.ts', 'Privacy Protection'),
    ];

    this.processResults('tier2', features);
  }

  verifyTier3() {
    this.log('\n⭐ Verifying Tier 3: Professional Suite Features...', 'cyan');
    
    const features = [
      // Custom filters
      this.checkFileExists('src/options/components/CustomFilters.tsx', 'Custom Filters Component'),
      this.checkFileExists('public/rules/tier3.json', 'Tier 3 Rules'),
      this.checkCodePattern('src/options/components/CustomFilters.tsx', /CustomFilter/, 'Custom Filter Interface'),
      this.checkCodePattern('src/options/components/CustomFilters.tsx', /addFilter/, 'Add Filter Function'),
      this.checkCodePattern('src/options/components/CustomFilters.tsx', /testSelector/, 'Selector Testing'),
      
      // Element picker
      this.checkFileExists('src/content/element-picker.ts', 'Element Picker'),
      this.checkCodePattern('src/content/element-picker.ts', /ElementPicker/, 'Element Picker Class'),
      this.checkCodePattern('src/content/element-picker.ts', /highlight|select/i, 'Element Selection'),
      
      // Import/Export
      this.checkCodePattern('src/options/components/CustomFilters.tsx', /exportFilters/, 'Export Filters'),
      this.checkCodePattern('src/options/components/CustomFilters.tsx', /importFilters/, 'Import Filters'),
      
      // Scheduling
      this.checkCodePattern('src/options/components/CustomFilters.tsx', /isScheduled/, 'Scheduled Filters'),
      this.checkCodePattern('src/options/components/CustomFilters.tsx', /schedule.*days/i, 'Schedule Configuration'),
    ];

    this.processResults('tier3', features);
  }

  verifyTier4() {
    this.log('\n🔥 Verifying Tier 4: Premium Power Features...', 'cyan');
    
    const features = [
      // Filter List Manager
      this.checkFileExists('src/options/components/FilterListManager.tsx', 'Filter List Manager'),
      this.checkFileExists('public/rules/tier4.json', 'Tier 4 Rules'),
      this.checkCodePattern('src/options/components/FilterListManager.tsx', /FilterList/, 'Filter List Interface'),
      this.checkCodePattern('src/options/components/FilterListManager.tsx', /subscribeToList/, 'List Subscription'),
      this.checkCodePattern('src/options/components/FilterListManager.tsx', /updateFilterList/, 'List Updates'),
      this.checkCodePattern('src/options/components/FilterListManager.tsx', /BUILTIN_LISTS/, 'Built-in Lists'),
      this.checkCodePattern('src/options/components/FilterListManager.tsx', /COMMUNITY_LISTS/, 'Community Lists'),
      
      // Whitelist Manager
      this.checkFileExists('src/options/components/WhitelistManager.tsx', 'Whitelist Manager'),
      this.checkCodePattern('src/options/components/WhitelistManager.tsx', /WhitelistEntry/, 'Whitelist Entry Interface'),
      this.checkCodePattern('src/options/components/WhitelistManager.tsx', /temporary.*entry/i, 'Temporary Entries'),
      this.checkCodePattern('src/options/components/WhitelistManager.tsx', /WhitelistGroup/, 'Whitelist Groups'),
      
      // Regex Patterns
      this.checkFileExists('src/options/components/RegexPatternManager.tsx', 'Regex Pattern Manager'),
      this.checkCodePattern('src/options/components/RegexPatternManager.tsx', /RegexPattern/, 'Regex Pattern Interface'),
      this.checkCodePattern('src/options/components/RegexPatternManager.tsx', /calculateComplexity/, 'Complexity Analysis'),
      this.checkCodePattern('src/options/components/RegexPatternManager.tsx', /testPattern/, 'Pattern Testing'),
      
      // Security features
      this.checkFileExists('src/services/security.service.ts', 'Security Service'),
      this.checkCodePattern('src/services/security.service.ts', /malware.*protection/i, 'Malware Protection'),
      this.checkCodePattern('src/services/security.service.ts', /phishing.*protection/i, 'Phishing Protection'),
      
      // Advanced features
      this.checkFileExists('src/components/NetworkLogger.tsx', 'Network Logger'),
      this.checkFileExists('src/components/ScriptControlPanel.tsx', 'Script Control Panel'),
      this.checkFileExists('src/services/dns-over-https.service.ts', 'DNS over HTTPS'),
    ];

    this.processResults('tier4', features);
  }

  verifyManifest() {
    this.log('\n📋 Verifying Manifest Configuration...', 'cyan');
    
    const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      this.errors.push('manifest.json not found');
      return;
    }
    
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      const checks = [
        { passed: manifest.manifest_version === 3, message: 'Manifest V3' },
        { passed: manifest.permissions.includes('declarativeNetRequest'), message: 'DNR Permission' },
        { passed: manifest.permissions.includes('storage'), message: 'Storage Permission' },
        { passed: manifest.permissions.includes('tabs'), message: 'Tabs Permission' },
        { passed: manifest.background?.service_worker, message: 'Service Worker' },
        { passed: manifest.action?.default_popup, message: 'Popup Page' },
        { passed: manifest.options_page, message: 'Options Page' },
        { passed: manifest.content_scripts?.length > 0, message: 'Content Scripts' },
        { passed: manifest.web_accessible_resources?.length > 0, message: 'Web Accessible Resources' },
      ];
      
      checks.forEach(check => {
        this.log(`  ${check.passed ? '✅' : '❌'} ${check.message}`, check.passed ? 'green' : 'red');
      });
    } catch (error) {
      this.errors.push(`Manifest parse error: ${error.message}`);
    }
  }

  verifyDocumentation() {
    this.log('\n📚 Verifying Documentation...', 'cyan');
    
    const docs = [
      this.checkFileExists('README.md', 'Main README'),
      this.checkFileExists('docs/TIERS.md', 'Tiers Documentation'),
      this.checkFileExists('docs/FEATURES.md', 'Features Documentation'),
      this.checkFileExists('docs/INSTALLATION.md', 'Installation Guide'),
      this.checkFileExists('docs/API.md', 'API Documentation'),
      this.checkFileExists('docs/DEVELOPER.md', 'Developer Guide'),
      this.checkFileExists('public/tiers-info.html', 'Tiers Info Page'),
      this.checkFileExists('CLAUDE.md', 'Claude Instructions'),
    ];
    
    docs.forEach(doc => {
      this.log(`  ${doc.passed ? '✅' : '❌'} ${doc.description}`, doc.passed ? 'green' : 'red');
    });
  }

  processResults(tier, features) {
    features.forEach(feature => {
      this.results[tier].total++;
      if (feature.passed) {
        this.results[tier].passed++;
        this.log(`  ✅ ${feature.description}`, 'green');
      } else {
        this.results[tier].failed++;
        this.log(`  ❌ ${feature.description}: ${feature.message}`, 'red');
        this.errors.push(`${tier}: ${feature.description} - ${feature.message}`);
      }
      this.results[tier].features.push(feature);
    });
  }

  generateReport() {
    this.log('\n' + '='.repeat(80), 'bright');
    this.log('VERIFICATION SUMMARY', 'bright');
    this.log('='.repeat(80), 'bright');
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    Object.entries(this.results).forEach(([tier, result]) => {
      if (result.total > 0) {
        const percentage = ((result.passed / result.total) * 100).toFixed(1);
        const color = result.failed === 0 ? 'green' : result.passed > result.failed ? 'yellow' : 'red';
        
        this.log(`\n${tier.toUpperCase()}: ${result.passed}/${result.total} passed (${percentage}%)`, color);
        totalPassed += result.passed;
        totalFailed += result.failed;
      }
    });
    
    this.log('\n' + '='.repeat(80), 'bright');
    const overallPercentage = ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1);
    this.log(`OVERALL: ${totalPassed}/${totalPassed + totalFailed} features verified (${overallPercentage}%)`, 
      totalFailed === 0 ? 'green' : 'yellow');
    
    if (this.errors.length > 0) {
      this.log('\n❌ ERRORS FOUND:', 'red');
      this.errors.forEach(error => {
        this.log(`  - ${error}`, 'red');
      });
    } else {
      this.log('\n✅ ALL FEATURES VERIFIED SUCCESSFULLY!', 'green');
    }
    
    // Save report to file
    const report = {
      timestamp: new Date().toISOString(),
      results: this.results,
      errors: this.errors,
      summary: {
        totalPassed,
        totalFailed,
        percentage: overallPercentage
      }
    };
    
    fs.writeFileSync(
      path.join(__dirname, '..', 'verification-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    this.log('\n📄 Report saved to verification-report.json', 'blue');
  }

  run() {
    this.log('🚀 Starting Comprehensive Feature Verification...', 'bright');
    
    this.verifyTier1();
    this.verifyTier2();
    this.verifyTier3();
    this.verifyTier4();
    this.verifyManifest();
    this.verifyDocumentation();
    
    this.generateReport();
  }
}

// Run verification
const verifier = new FeatureVerifier();
verifier.run();