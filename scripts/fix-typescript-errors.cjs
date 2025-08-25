#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files with unused imports to fix
const fixes = [
  {
    file: 'src/background/filter-engine.ts',
    removeLines: ['import { auth } from \'../config/firebase\';']
  },
  {
    file: 'src/components/NetworkLogger.tsx',
    removeImports: ['Shield', 'ShieldCheck', 'Upload', 'BarChart3']
  },
  {
    file: 'src/components/ReferralSystem.tsx',
    removeLines: ['import authService from \'../services/auth.service\';']
  },
  {
    file: 'src/components/ScriptControlPanel.tsx',
    removeImports: ['Settings']
  },
  {
    file: 'src/components/TierProgressionManager.tsx',
    removeImports: ['auth', 'db']
  },
  {
    file: 'src/options/components/BackupRestore.tsx',
    removeImports: ['Database', 'RefreshCw', 'AlertCircle']
  },
  {
    file: 'src/options/components/PrivacySettings.tsx',
    removeImports: ['Lock', 'Eye', 'Fingerprint', 'Chrome', 'Server', 'Cpu', 'HardDrive', 'Monitor', 'Smartphone', 'AlertTriangle', 'CheckCircle']
  },
  {
    file: 'src/options/components/Statistics.tsx',
    removeImports: ['Zap', 'Clock', 'TrendingUp', 'Calendar', 'Globe', 'Youtube', 'ShoppingBag', 'FileText', 'BarChart3']
  },
  {
    file: 'src/options/components/WhitelistManager.tsx',
    removeImports: ['X', 'Link', 'FileText', 'Calendar', 'TrendingUp', 'AlertTriangle']
  },
  {
    file: 'src/popup/App.tsx',
    removeImports: ['TrendingUp', 'XCircle']
  },
  {
    file: 'src/services/firebase.service.ts',
    removeImports: ['collection', 'query', 'where', 'getDocs']
  },
  {
    file: 'src/tiers/TiersPage.tsx',
    removeImports: ['XCircle', 'Calendar', 'FileText', 'Download', 'Upload', 'Settings', 'Eye', 'Clock', 'Filter', 'Youtube', 'Share2']
  }
];

function removeUnusedImports(filePath, importsToRemove) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  importsToRemove.forEach(importName => {
    // Remove from multi-line imports
    const multiLineRegex = new RegExp(`\\s*${importName},?\\s*`, 'g');
    content = content.replace(multiLineRegex, (match) => {
      // If it's the only import, return empty
      if (match.includes(',')) {
        return '';
      }
      return match.includes('\n') ? '\n' : '';
    });
    
    // Clean up empty import lines
    content = content.replace(/import\s*{\s*}\s*from\s*['"][^'"]+['"];?\n?/g, '');
  });
  
  fs.writeFileSync(fullPath, content);
  console.log(`Fixed imports in ${filePath}`);
}

function removeLines(filePath, linesToRemove) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  linesToRemove.forEach(line => {
    content = content.replace(line + '\n', '');
    content = content.replace(line, '');
  });
  
  fs.writeFileSync(fullPath, content);
  console.log(`Fixed lines in ${filePath}`);
}

// Apply fixes
fixes.forEach(fix => {
  if (fix.removeImports) {
    removeUnusedImports(fix.file, fix.removeImports);
  }
  if (fix.removeLines) {
    removeLines(fix.file, fix.removeLines);
  }
});

console.log('\nDone fixing common TypeScript errors!');