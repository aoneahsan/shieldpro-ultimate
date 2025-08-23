const fs = require('fs');
const path = require('path');

console.log('🧪 Testing extension structure...\n');

const distPath = './dist';
const manifestPath = path.join(distPath, 'manifest.json');

// Check if dist exists
if (!fs.existsSync(distPath)) {
  console.log('❌ dist folder not found');
  process.exit(1);
}

// Check manifest
if (!fs.existsSync(manifestPath)) {
  console.log('❌ manifest.json not found');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
console.log('✅ Manifest loaded successfully');
console.log(`📄 Extension: ${manifest.name} v${manifest.version}`);

// Validate rule files
if (manifest.declarative_net_request && manifest.declarative_net_request.rule_resources) {
  const ruleResources = manifest.declarative_net_request.rule_resources;
  console.log('\n🔍 Checking rule files:');
  
  let allRulesValid = true;
  for (const resource of ruleResources) {
    const rulePath = path.join(distPath, resource.path);
    if (!fs.existsSync(rulePath)) {
      console.log(`❌ Rule file missing: ${resource.path}`);
      allRulesValid = false;
    } else {
      try {
        const rules = JSON.parse(fs.readFileSync(rulePath, 'utf8'));
        if (!Array.isArray(rules)) {
          console.log(`❌ Invalid rule format: ${resource.path}`);
          allRulesValid = false;
        } else {
          console.log(`✅ ${resource.path} (${rules.length} rules)`);
        }
      } catch (e) {
        console.log(`❌ Invalid JSON: ${resource.path}`);
        allRulesValid = false;
      }
    }
  }
  
  if (allRulesValid) {
    console.log('\n🎉 All rule files are valid!');
  } else {
    console.log('\n❌ Some rule files have issues');
    process.exit(1);
  }
} else {
  console.log('⚠️  No declarative net request rules found');
}

// Check required files
const requiredFiles = ['background.js', 'content.js', 'popup.html', 'options.html'];
console.log('\n📋 Checking required files:');

let allFilesExist = true;
for (const file of requiredFiles) {
  if (fs.existsSync(path.join(distPath, file))) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} missing`);
    allFilesExist = false;
  }
}

if (allFilesExist) {
  console.log('\n🎉 Extension structure is valid!');
  console.log('✨ Ready to load in Chrome');
} else {
  console.log('\n❌ Some required files are missing');
  process.exit(1);
}