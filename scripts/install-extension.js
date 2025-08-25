#!/usr/bin/env node
/**
 * Quick extension installer for Chrome
 * Opens Chrome with the extension loaded for testing
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const extensionPath = path.resolve(__dirname, '../dist');

// Check if dist exists
if (!fs.existsSync(extensionPath)) {
  console.log('❌ Build not found. Running build first...');
  execSync('yarn build', { stdio: 'inherit' });
}

console.log('🚀 Loading extension in Chrome...');

// Detect platform and open Chrome
const commands = {
  darwin: `open -a "Google Chrome" --args --load-extension="${extensionPath}" --auto-open-devtools-for-tabs`,
  win32: `start chrome --load-extension="${extensionPath}" --auto-open-devtools-for-tabs`,
  linux: `google-chrome --load-extension="${extensionPath}" --auto-open-devtools-for-tabs`
};

const platform = process.platform;
const command = commands[platform] || commands.linux;

try {
  execSync(command);
  console.log('✅ Extension loaded successfully!');
  console.log('📝 Chrome DevTools opened automatically');
  console.log('🔄 Use yarn watch for auto-rebuild');
} catch (error) {
  console.error('Failed to open Chrome:', error.message);
  console.log('\nManual installation:');
  console.log('1. Open chrome://extensions/');
  console.log('2. Enable "Developer mode"');
  console.log(`3. Click "Load unpacked" and select: ${extensionPath}`);
}