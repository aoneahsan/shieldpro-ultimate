#!/usr/bin/env node
/**
 * Simple release script
 * Handles version bumping and building
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const versionType = args[0] || 'patch'; // patch, minor, major

console.log(`🚀 Creating ${versionType} release...`);

try {
  // 1. Run all checks
  console.log('🔍 Running pre-release checks...');
  execSync('yarn precommit', { stdio: 'inherit' });
  
  // 2. Bump version in package.json
  console.log(`📈 Bumping ${versionType} version...`);
  const packagePath = path.join(__dirname, '../package.json');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const [major, minor, patch] = pkg.version.split('.').map(Number);
  let newVersion;
  
  switch (versionType) {
    case 'major':
      newVersion = `${major + 1}.0.0`;
      break;
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case 'patch':
    default:
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
  }
  
  pkg.version = newVersion;
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
  
  // 3. Update manifest version
  const manifestPath = path.join(__dirname, '../manifest.config.ts');
  let manifest = fs.readFileSync(manifestPath, 'utf8');
  manifest = manifest.replace(/version: packageJson\.version/g, `version: '${newVersion}'`);
  fs.writeFileSync(manifestPath, manifest);
  
  // 4. Build all versions
  console.log('🏗️  Building all browser versions...');
  execSync('yarn build:all', { stdio: 'inherit' });
  
  // 5. Create packages
  console.log('📦 Creating packages...');
  execSync('yarn package:all', { stdio: 'inherit' });
  
  // 6. Commit changes
  console.log('💾 Committing changes...');
  execSync(`git add package.json manifest.config.ts`, { stdio: 'inherit' });
  execSync(`git commit -m "chore: release v${newVersion}"`, { stdio: 'inherit' });
  execSync(`git tag v${newVersion}`, { stdio: 'inherit' });
  
  console.log(`✅ Release v${newVersion} created successfully!`);
  console.log(`\nNext steps:`);
  console.log(`  git push origin main --tags`);
  console.log(`  Upload packages from builds/ folder to stores`);
  
} catch (error) {
  console.error('❌ Release failed:', error.message);
  process.exit(1);
}