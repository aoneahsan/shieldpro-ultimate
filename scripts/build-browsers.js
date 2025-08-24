#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import archiver from 'archiver';

const execAsync = promisify(exec);

const browsers = ['chrome', 'firefox', 'edge'];
const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const buildsDir = path.join(rootDir, 'builds');

async function clean() {
  console.log('🧹 Cleaning previous builds...');
  await fs.remove(buildsDir);
  await fs.ensureDir(buildsDir);
}

async function buildForBrowser(browser) {
  console.log(`\n🔨 Building for ${browser}...`);
  
  const browserDistDir = path.join(buildsDir, browser);
  await fs.ensureDir(browserDistDir);
  
  // Run webpack build with browser target
  const env = `BUILD_TARGET=${browser} NODE_ENV=production`;
  await execAsync(`${env} webpack --mode production --config webpack.config.js`);
  
  // Copy built files to browser-specific directory
  await fs.copy(distDir, browserDistDir);
  
  // Use appropriate manifest file
  const manifestFile = browser === 'chrome' ? 'manifest.json' : `manifest.${browser}.json`;
  const sourceManifest = path.join(rootDir, 'public', manifestFile);
  const targetManifest = path.join(browserDistDir, 'manifest.json');
  
  if (await fs.pathExists(sourceManifest)) {
    await fs.copy(sourceManifest, targetManifest);
  }
  
  // Handle browser-specific modifications
  if (browser === 'firefox') {
    await modifyForFirefox(browserDistDir);
  } else if (browser === 'edge') {
    await modifyForEdge(browserDistDir);
  }
  
  // Create ZIP package
  await createZip(browser, browserDistDir);
  
  console.log(`✅ ${browser} build complete!`);
}

async function modifyForFirefox(dir) {
  // Firefox-specific modifications
  const backgroundPath = path.join(dir, 'background.js');
  if (await fs.pathExists(backgroundPath)) {
    let content = await fs.readFile(backgroundPath, 'utf8');
    
    // Replace chrome namespace with browser namespace
    content = content.replace(/chrome\./g, 'browser.');
    
    // Add polyfill at the beginning
    const polyfill = `// Firefox polyfill
if (typeof browser === "undefined") {
  var browser = chrome;
}\n\n`;
    content = polyfill + content;
    
    await fs.writeFile(backgroundPath, content);
  }
  
  // Apply similar changes to content scripts
  const contentScripts = ['content.js', 'youtube-blocker.js'];
  for (const script of contentScripts) {
    const scriptPath = path.join(dir, script);
    if (await fs.pathExists(scriptPath)) {
      let content = await fs.readFile(scriptPath, 'utf8');
      content = content.replace(/chrome\./g, 'browser.');
      const polyfill = `if (typeof browser === "undefined") { var browser = chrome; }\n`;
      content = polyfill + content;
      await fs.writeFile(scriptPath, content);
    }
  }
}

async function modifyForEdge(dir) {
  // Edge-specific modifications (minimal, as Edge uses Chromium)
  const manifestPath = path.join(dir, 'manifest.json');
  if (await fs.pathExists(manifestPath)) {
    const manifest = await fs.readJson(manifestPath);
    
    // Add Edge-specific fields if needed
    if (!manifest.minimum_edge_version) {
      manifest.minimum_edge_version = "88";
    }
    
    await fs.writeJson(manifestPath, manifest, { spaces: 2 });
  }
}

async function createZip(browser, sourceDir) {
  const zipPath = path.join(buildsDir, `shieldpro-${browser}-v1.0.0.zip`);
  
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => {
      console.log(`📦 Created ${path.basename(zipPath)} (${(archive.pointer() / 1024 / 1024).toFixed(2)} MB)`);
      resolve();
    });
    
    archive.on('error', reject);
    
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

async function buildAll() {
  try {
    console.log('🚀 Starting multi-browser build process...\n');
    
    await clean();
    
    for (const browser of browsers) {
      await buildForBrowser(browser);
    }
    
    console.log('\n🎉 All builds completed successfully!');
    console.log(`📁 Build packages available in: ${buildsDir}`);
    
    // List created files
    const files = await fs.readdir(buildsDir);
    console.log('\n📦 Generated packages:');
    for (const file of files) {
      if (file.endsWith('.zip')) {
        const stats = await fs.stat(path.join(buildsDir, file));
        console.log(`   - ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      }
    }
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length > 0 && browsers.includes(args[0])) {
  // Build specific browser
  clean().then(() => buildForBrowser(args[0]));
} else {
  // Build all browsers
  buildAll();
}