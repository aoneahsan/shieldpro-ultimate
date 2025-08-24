#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const sourceManifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'public', 'manifest.json'), 'utf8')
);

// Create Firefox-compatible manifest
const firefoxManifest = {
  ...sourceManifest,
  manifest_version: 2, // Firefox still uses MV2 for better compatibility
  
  // Convert MV3 background to MV2
  background: {
    scripts: ['background.js'],
    persistent: false
  },
  
  // Remove MV3-specific properties
  action: undefined,
  host_permissions: undefined,
  
  // Add MV2 browser_action (converted from action)
  browser_action: sourceManifest.action,
  
  // Merge host_permissions into permissions for MV2
  permissions: [
    ...sourceManifest.permissions,
    ...(sourceManifest.host_permissions || [])
  ].filter(p => p !== 'declarativeNetRequest'), // Firefox doesn't support this yet
  
  // Add Firefox-specific properties
  browser_specific_settings: {
    gecko: {
      id: 'shieldpro@example.com',
      strict_min_version: '89.0'
    }
  },
  
  // Remove unsupported APIs
  declarative_net_request: undefined,
  
  // Convert web_accessible_resources to MV2 format
  web_accessible_resources: sourceManifest.web_accessible_resources?.[0]?.resources || []
};

// Remove undefined properties
Object.keys(firefoxManifest).forEach(key => {
  if (firefoxManifest[key] === undefined) {
    delete firefoxManifest[key];
  }
});

// Save Firefox manifest
const outputPath = path.join(__dirname, '..', 'dist-firefox', 'manifest.json');
const outputDir = path.dirname(outputPath);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(firefoxManifest, null, 2));

console.log('✅ Firefox manifest created at:', outputPath);
console.log('Key changes:');
console.log('  - Converted to Manifest V2');
console.log('  - Added browser_specific_settings for Firefox');
console.log('  - Converted action to browser_action');
console.log('  - Merged host_permissions into permissions');
console.log('  - Removed declarativeNetRequest (not supported in Firefox MV2)');