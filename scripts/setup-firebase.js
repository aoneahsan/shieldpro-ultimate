#!/usr/bin/env node

/**
 * Firebase Setup Script
 * Helps users configure and deploy Firebase services
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.blue}${msg}${colors.reset}\n${'='.repeat(50)}`)
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
};

async function checkFirebaseCLI() {
  log.title('Checking Firebase CLI Installation');
  
  try {
    await execCommand('firebase --version');
    log.success('Firebase CLI is installed');
    return true;
  } catch (error) {
    log.error('Firebase CLI is not installed');
    log.info('Install it using: npm install -g firebase-tools');
    
    const install = await question('Would you like to install it now? (y/n): ');
    if (install.toLowerCase() === 'y') {
      log.info('Installing Firebase CLI...');
      try {
        await execCommand('npm install -g firebase-tools');
        log.success('Firebase CLI installed successfully');
        return true;
      } catch (err) {
        log.error('Failed to install Firebase CLI. Please install manually.');
        return false;
      }
    }
    return false;
  }
}

async function checkAuthentication() {
  log.title('Checking Firebase Authentication');
  
  try {
    await execCommand('firebase projects:list');
    log.success('You are authenticated with Firebase');
    return true;
  } catch (error) {
    log.warning('You are not authenticated with Firebase');
    log.info('Initiating login process...');
    
    try {
      await execCommand('firebase login');
      log.success('Successfully logged in to Firebase');
      return true;
    } catch (err) {
      log.error('Failed to login. Please run: firebase login');
      return false;
    }
  }
}

async function selectProject() {
  log.title('Firebase Project Configuration');
  
  // Check if .firebaserc exists
  const firebaseRcPath = path.join(process.cwd(), '.firebaserc');
  if (fs.existsSync(firebaseRcPath)) {
    const config = JSON.parse(fs.readFileSync(firebaseRcPath, 'utf8'));
    if (config.projects && config.projects.default) {
      log.success(`Using existing project: ${config.projects.default}`);
      
      const useExisting = await question('Use this project? (y/n): ');
      if (useExisting.toLowerCase() === 'y') {
        return config.projects.default;
      }
    }
  }
  
  // List available projects
  log.info('Fetching available Firebase projects...');
  try {
    const output = await execCommand('firebase projects:list');
    console.log(output);
    
    const projectId = await question('\nEnter your Firebase Project ID: ');
    
    // Save project configuration
    const firebaseRc = {
      projects: {
        default: projectId
      }
    };
    
    fs.writeFileSync(firebaseRcPath, JSON.stringify(firebaseRc, null, 2));
    log.success(`Project ${projectId} configured successfully`);
    
    return projectId;
  } catch (error) {
    log.error('Failed to list projects');
    return null;
  }
}

async function deployRules() {
  log.title('Deploying Firestore Security Rules');
  
  try {
    log.info('Deploying rules...');
    const output = await execCommand('firebase deploy --only firestore:rules');
    console.log(output);
    log.success('Firestore rules deployed successfully');
    return true;
  } catch (error) {
    log.error('Failed to deploy rules');
    console.error(error.message);
    return false;
  }
}

async function deployIndexes() {
  log.title('Deploying Firestore Indexes');
  
  try {
    log.info('Deploying indexes...');
    const output = await execCommand('firebase deploy --only firestore:indexes');
    console.log(output);
    log.success('Firestore indexes deployed successfully');
    log.warning('Note: Index building may take several minutes to complete');
    return true;
  } catch (error) {
    log.error('Failed to deploy indexes');
    console.error(error.message);
    return false;
  }
}

async function deployFunctions() {
  log.title('Deploying Cloud Functions');
  
  // Check Node version
  const nodeVersion = process.version.match(/^v(\d+)/)[1];
  if (nodeVersion !== '22') {
    log.warning(`Current Node version is ${nodeVersion}, but Firebase Functions require Node 22`);
    log.info('Please switch to Node 22 using: nvm use 22');
    
    const proceed = await question('Continue anyway? (y/n): ');
    if (proceed.toLowerCase() !== 'y') {
      return false;
    }
  }
  
  // Install dependencies
  const functionsPath = path.join(process.cwd(), 'firebase', 'functions');
  if (!fs.existsSync(path.join(functionsPath, 'node_modules'))) {
    log.info('Installing Cloud Functions dependencies...');
    try {
      await execCommand(`cd ${functionsPath} && npm install`);
      log.success('Dependencies installed');
    } catch (error) {
      log.error('Failed to install dependencies');
      return false;
    }
  }
  
  try {
    log.info('Deploying Cloud Functions...');
    const output = await execCommand('firebase deploy --only functions');
    console.log(output);
    log.success('Cloud Functions deployed successfully');
    return true;
  } catch (error) {
    log.error('Failed to deploy functions');
    console.error(error.message);
    return false;
  }
}

async function setupEmulators() {
  log.title('Firebase Emulators Setup');
  
  const setup = await question('Would you like to set up Firebase emulators for local development? (y/n): ');
  if (setup.toLowerCase() !== 'y') {
    return;
  }
  
  try {
    log.info('Downloading emulators...');
    await execCommand('firebase setup:emulators:firestore');
    await execCommand('firebase setup:emulators:auth');
    await execCommand('firebase setup:emulators:functions');
    await execCommand('firebase setup:emulators:storage');
    
    log.success('Emulators set up successfully');
    log.info('Start emulators with: yarn firebase:emulators');
  } catch (error) {
    log.warning('Some emulators may not have been set up properly');
    log.info('You can set them up manually later');
  }
}

async function createEnvFile() {
  log.title('Environment Variables Setup');
  
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    log.success('.env file already exists');
    return;
  }
  
  const create = await question('Would you like to create a .env file? (y/n): ');
  if (create.toLowerCase() !== 'y') {
    return;
  }
  
  const envContent = `# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id_here

# Firebase Emulators (for local development)
USE_FIREBASE_EMULATOR=false
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_FUNCTIONS_EMULATOR_HOST=localhost:5001
FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199

# Environment
NODE_ENV=development
`;
  
  fs.writeFileSync(envPath, envContent);
  log.success('.env file created');
  log.warning('Please update the .env file with your Firebase configuration');
  log.info('You can find these values in the Firebase Console > Project Settings');
}

async function main() {
  console.clear();
  log.title('🔥 Firebase Setup for ShieldPro Ultimate');
  
  // Check Firebase CLI
  const hasCLI = await checkFirebaseCLI();
  if (!hasCLI) {
    log.error('Cannot proceed without Firebase CLI');
    process.exit(1);
  }
  
  // Check authentication
  const isAuthenticated = await checkAuthentication();
  if (!isAuthenticated) {
    log.error('Cannot proceed without authentication');
    process.exit(1);
  }
  
  // Select project
  const projectId = await selectProject();
  if (!projectId) {
    log.error('No project selected');
    process.exit(1);
  }
  
  // Create .env file
  await createEnvFile();
  
  // Deployment menu
  log.title('Deployment Options');
  console.log('1. Deploy Firestore Rules');
  console.log('2. Deploy Firestore Indexes');
  console.log('3. Deploy Cloud Functions');
  console.log('4. Deploy Everything');
  console.log('5. Setup Emulators');
  console.log('6. Skip Deployment\n');
  
  const choice = await question('Select an option (1-6): ');
  
  switch (choice) {
    case '1':
      await deployRules();
      break;
    case '2':
      await deployIndexes();
      break;
    case '3':
      await deployFunctions();
      break;
    case '4':
      await deployRules();
      await deployIndexes();
      await deployFunctions();
      break;
    case '5':
      await setupEmulators();
      break;
    case '6':
      log.info('Skipping deployment');
      break;
    default:
      log.warning('Invalid option selected');
  }
  
  log.title('Setup Complete!');
  log.success('Firebase configuration is ready');
  log.info('\nUseful commands:');
  console.log('  yarn firebase:deploy:rules     - Deploy security rules');
  console.log('  yarn firebase:deploy:indexes   - Deploy indexes');
  console.log('  yarn firebase:deploy:functions - Deploy cloud functions');
  console.log('  yarn firebase:deploy:all       - Deploy everything');
  console.log('  yarn firebase:emulators        - Start local emulators');
  
  rl.close();
}

// Run the setup
main().catch((error) => {
  log.error('Setup failed:');
  console.error(error);
  process.exit(1);
});