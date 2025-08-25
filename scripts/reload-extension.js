#!/usr/bin/env node
/**
 * Hot reload extension in Chrome
 * Reloads the extension without restarting Chrome
 */

import { execSync } from 'child_process';

console.log('🔄 Reloading extension...');

// Use Chrome debugging protocol to reload
const reloadScript = `
chrome.runtime.reload();
`;

try {
  // This works if Chrome is running with remote debugging
  execSync(`echo '${reloadScript}' | nc localhost 9222`, { stdio: 'ignore' });
  console.log('✅ Extension reloaded!');
} catch (error) {
  console.log('⚠️  Auto-reload failed. Please reload manually:');
  console.log('1. Go to chrome://extensions/');
  console.log('2. Click the refresh button on your extension');
}