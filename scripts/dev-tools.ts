#!/usr/bin/env node
/**
 * Development Tools and Helpers
 * Enhances the development experience with useful utilities
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { program } from 'commander';
import ora from 'ora';
import boxen from 'boxen';

// Extension development helpers
class DevTools {
  /**
   * Install Chrome Extension in development mode
   */
  static async installExtension() {
    const spinner = ora('Installing extension in Chrome...').start();
    
    try {
      // Open Chrome with extension loaded
      const extensionPath = path.resolve(__dirname, '../dist');
      const command = process.platform === 'darwin' 
        ? `open -a "Google Chrome" --args --load-extension="${extensionPath}" --auto-open-devtools-for-tabs`
        : process.platform === 'win32'
        ? `start chrome --load-extension="${extensionPath}" --auto-open-devtools-for-tabs`
        : `google-chrome --load-extension="${extensionPath}" --auto-open-devtools-for-tabs`;
      
      execSync(command);
      spinner.succeed('Extension loaded in Chrome with DevTools!');
    } catch (error) {
      spinner.fail('Failed to load extension');
      console.error(error);
    }
  }

  /**
   * Generate performance report
   */
  static async performanceReport() {
    const spinner = ora('Generating performance report...').start();
    
    try {
      // Build with stats
      execSync('yarn build --stats', { stdio: 'inherit' });
      
      // Analyze bundle
      execSync('yarn webpack-bundle-analyzer dist/stats.json', { stdio: 'inherit' });
      
      spinner.succeed('Performance report generated!');
    } catch (error) {
      spinner.fail('Failed to generate report');
      console.error(error);
    }
  }

  /**
   * Check for outdated dependencies
   */
  static async checkDependencies() {
    console.log(chalk.blue('🔍 Checking dependencies...\n'));
    
    try {
      execSync('yarn outdated', { stdio: 'inherit' });
    } catch (error) {
      // yarn outdated returns non-zero exit code when outdated deps exist
      console.log(chalk.yellow('\n⚠️  Some dependencies are outdated'));
      console.log(chalk.gray('Run "yarn upgrade-interactive" to update'));
    }
  }

  /**
   * Setup development environment
   */
  static async setupEnvironment() {
    const spinner = ora('Setting up development environment...').start();
    
    const tasks = [
      { name: 'Installing dependencies', cmd: 'yarn install' },
      { name: 'Setting up Git hooks', cmd: 'yarn husky install' },
      { name: 'Creating .env file', cmd: 'cp .env.example .env' },
      { name: 'Building initial version', cmd: 'yarn build' },
      { name: 'Running tests', cmd: 'yarn test' }
    ];
    
    for (const task of tasks) {
      spinner.text = task.name;
      try {
        execSync(task.cmd, { stdio: 'pipe' });
        spinner.succeed(task.name);
        spinner.start();
      } catch (error) {
        spinner.fail(task.name);
        console.error(error);
        process.exit(1);
      }
    }
    
    spinner.stop();
    
    const message = boxen(
      chalk.green('✅ Development environment ready!\n\n') +
      chalk.white('Available commands:\n') +
      chalk.gray('  yarn dev       - Start development server\n') +
      chalk.gray('  yarn build     - Build extension\n') +
      chalk.gray('  yarn test      - Run tests\n') +
      chalk.gray('  yarn lint      - Check code quality\n') +
      chalk.gray('  yarn release   - Create a release\n\n') +
      chalk.blue('Happy coding! 🚀'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green'
      }
    );
    
    console.log(message);
  }

  /**
   * Clean all build artifacts and caches
   */
  static async clean() {
    const spinner = ora('Cleaning build artifacts...').start();
    
    const dirsToClean = [
      'dist',
      'node_modules/.vite',
      'node_modules/.cache',
      'coverage',
      '.turbo',
      '.parcel-cache'
    ];
    
    for (const dir of dirsToClean) {
      const fullPath = path.resolve(__dirname, '..', dir);
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        spinner.text = `Cleaned ${dir}`;
      }
    }
    
    spinner.succeed('All build artifacts cleaned!');
  }

  /**
   * Generate changelog from commits
   */
  static async generateChangelog() {
    const spinner = ora('Generating changelog...').start();
    
    try {
      execSync('conventional-changelog -p angular -i CHANGELOG.md -s', { stdio: 'inherit' });
      spinner.succeed('Changelog generated!');
    } catch (error) {
      spinner.fail('Failed to generate changelog');
      console.error(error);
    }
  }

  /**
   * Validate manifest.json
   */
  static async validateManifest() {
    const spinner = ora('Validating manifest.json...').start();
    
    try {
      const manifestPath = path.resolve(__dirname, '../dist/manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      
      // Check required fields
      const required = ['manifest_version', 'name', 'version'];
      const missing = required.filter(field => !manifest[field]);
      
      if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
      }
      
      // Check version format
      if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
        throw new Error('Invalid version format. Use semantic versioning (x.y.z)');
      }
      
      spinner.succeed('Manifest is valid!');
    } catch (error) {
      spinner.fail(`Manifest validation failed: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Run development server with live metrics
   */
  static async devWithMetrics() {
    console.log(chalk.blue('🚀 Starting development server with metrics...\n'));
    
    // Start Vite with custom plugin for metrics
    execSync('yarn dev --debug', { stdio: 'inherit' });
  }
}

// CLI setup
program
  .name('dev-tools')
  .description('Development tools for ShieldPro Ultimate extension')
  .version('1.0.0');

program
  .command('install')
  .description('Install extension in Chrome for testing')
  .action(() => DevTools.installExtension());

program
  .command('perf')
  .description('Generate performance report')
  .action(() => DevTools.performanceReport());

program
  .command('deps')
  .description('Check for outdated dependencies')
  .action(() => DevTools.checkDependencies());

program
  .command('setup')
  .description('Setup development environment')
  .action(() => DevTools.setupEnvironment());

program
  .command('clean')
  .description('Clean all build artifacts')
  .action(() => DevTools.clean());

program
  .command('changelog')
  .description('Generate changelog from commits')
  .action(() => DevTools.generateChangelog());

program
  .command('validate')
  .description('Validate manifest.json')
  .action(() => DevTools.validateManifest());

program
  .command('dev:metrics')
  .description('Run dev server with live metrics')
  .action(() => DevTools.devWithMetrics());

program.parse();