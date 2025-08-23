const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    chromeWebSecurity: false,
    setupNodeEvents(on, config) {
      on('task', {
        loadExtension(pathToExtension) {
          // Load Chrome extension for testing
          return new Promise((resolve, reject) => {
            const fs = require('fs')
            const path = require('path')
            
            const manifestPath = path.join(pathToExtension, 'manifest.json')
            
            if (!fs.existsSync(manifestPath)) {
              reject(new Error(`Extension manifest not found at ${manifestPath}`))
              return
            }
            
            try {
              const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
              
              // Validate manifest structure
              if (!manifest.manifest_version) {
                reject(new Error('Invalid manifest: missing manifest_version'))
                return
              }
              
              if (!manifest.name) {
                reject(new Error('Invalid manifest: missing name'))
                return
              }
              
              // Check for required rule files
              if (manifest.declarative_net_request && manifest.declarative_net_request.rule_resources) {
                const ruleResources = manifest.declarative_net_request.rule_resources
                
                for (const resource of ruleResources) {
                  const rulePath = path.join(pathToExtension, resource.path)
                  if (!fs.existsSync(rulePath)) {
                    reject(new Error(`Rule file not found: ${resource.path}`))
                    return
                  }
                  
                  try {
                    const rules = JSON.parse(fs.readFileSync(rulePath, 'utf8'))
                    if (!Array.isArray(rules)) {
                      reject(new Error(`Invalid rule file format: ${resource.path}`))
                      return
                    }
                  } catch (e) {
                    reject(new Error(`Invalid JSON in rule file: ${resource.path}`))
                    return
                  }
                }
              }
              
              resolve({ success: true, manifest })
            } catch (e) {
              reject(new Error(`Failed to parse manifest: ${e.message}`))
            }
          })
        }
      })
    },
    env: {
      extensionPath: 'dist'
    }
  }
})