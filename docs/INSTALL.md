# Installation Guide

## Quick Install

### Chrome & Chromium-based Browsers (Edge, Brave, Opera)

#### From Web Store (Recommended)
1. Open Chrome Web Store
2. Search for "ShieldPro Ultimate"
3. Click "Add to Chrome"
4. Confirm by clicking "Add Extension"

#### Manual Installation (Developer Mode)

1. **Download the Extension**
   ```bash
   # Clone from GitHub
   git clone https://github.com/yourusername/shieldpro-ultimate.git
   
   # Or download the latest release
   wget https://github.com/yourusername/shieldpro-ultimate/releases/latest/download/shieldpro-ultimate.zip
   unzip shieldpro-ultimate.zip
   ```

2. **Build from Source**
   ```bash
   cd shieldpro-ultimate
   yarn install
   yarn build:prod
   ```

3. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder from the project

### Firefox

Firefox support requires manifest modifications due to differences in the extension API:

1. **Modify for Firefox**
   ```bash
   # Use the Firefox-specific build
   yarn build:firefox
   ```

2. **Temporary Installation**
   - Open Firefox and go to `about:debugging`
   - Click "This Firefox"
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file from the `dist-firefox` folder

3. **Permanent Installation**
   - Package the extension as `.xpi` file
   - Sign it through Mozilla Add-ons Developer Hub
   - Install the signed `.xpi` file

## Post-Installation Setup

### First Launch

1. **Extension Icon**: After installation, you'll see the ShieldPro icon in your browser toolbar
2. **Initial Setup**: Click the icon to open the popup
3. **Default Protection**: Tier 1 features are immediately active

### Account Creation (Tier 2)

1. Click the "Sign In" button in the popup
2. Choose your preferred sign-in method:
   - Email & Password
   - Google Account
   - Facebook
   - GitHub
3. Complete registration to unlock Tier 2 features

### Profile Completion (Tier 3)

1. Open the Options page (right-click extension icon → Options)
2. Navigate to Profile settings
3. Complete:
   - Display name
   - Profile photo
   - Preferences
4. Save to unlock Tier 3 features

## Troubleshooting

### Extension Not Working

1. **Check Permissions**
   - Ensure the extension has necessary permissions
   - Go to `chrome://extensions/` and check ShieldPro Ultimate

2. **Conflicting Extensions**
   - Disable other ad blockers temporarily
   - Check for VPN or proxy conflicts

3. **Clear Cache**
   ```javascript
   // In Chrome DevTools Console
   chrome.storage.local.clear();
   chrome.runtime.reload();
   ```

### YouTube Ads Still Showing

1. Verify you have Tier 2 or higher
2. Refresh the YouTube page
3. Check if YouTube is whitelisted
4. Clear YouTube cookies and cache

### Sync Not Working

1. Ensure you're logged in
2. Check internet connection
3. Verify Firebase configuration
4. Try signing out and back in

## Browser-Specific Notes

### Chrome
- Full Manifest V3 support
- All features available
- Automatic updates from Web Store

### Microsoft Edge
- Install from Chrome Web Store or Edge Add-ons
- Full compatibility
- May require allowing extensions from other stores

### Brave
- Chrome Web Store extensions supported
- Brave Shields may conflict - adjust settings
- Consider disabling Brave's built-in ad blocker

### Opera
- Chrome extensions supported via Install Chrome Extensions addon
- Full functionality
- Opera's built-in ad blocker can be disabled per site

### Firefox
- Requires manifest modifications
- Limited declarativeNetRequest support
- Some Tier 4-5 features may not be available

## System Requirements

### Minimum Requirements
- **Browser**: Chrome 88+, Edge 88+, Firefox 89+
- **RAM**: 2GB
- **Storage**: 50MB free space
- **Internet**: Required for account features

### Recommended
- **Browser**: Latest stable version
- **RAM**: 4GB+
- **Storage**: 100MB free space
- **Internet**: Broadband for real-time filter updates

## Privacy & Security

### Data Collection
- No browsing history is collected
- Only aggregated statistics are stored
- Account data is encrypted
- See our [Privacy Policy](PRIVACY.md) for details

### Permissions Required
- `declarativeNetRequest`: For blocking ads
- `storage`: For saving settings
- `tabs`: For per-tab statistics
- `contextMenus`: For right-click options
- `alarms`: For scheduled features

## Updating

### Automatic Updates
- Chrome Web Store installations update automatically
- Check for updates: `chrome://extensions/` → Developer mode → Update

### Manual Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild
yarn install
yarn build:prod

# Reload in browser
# Go to chrome://extensions/ and click the refresh icon
```

## Uninstallation

### Chrome
1. Right-click the ShieldPro icon in toolbar
2. Select "Remove from Chrome"
3. Confirm removal

### Alternative Method
1. Go to `chrome://extensions/`
2. Find ShieldPro Ultimate
3. Click "Remove"
4. Confirm

### Data Cleanup
- Local settings are automatically removed
- Cloud data persists for account recovery
- Request data deletion: settings → privacy → delete account

## Support

### Get Help
- **Documentation**: Check other guides in `/docs`
- **FAQ**: See [FAQ.md](FAQ.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/shieldpro-ultimate/issues)
- **Community**: [Discord Server](https://discord.gg/shieldpro)

### Report Issues
1. Check existing issues on GitHub
2. Provide browser version and OS
3. Include steps to reproduce
4. Attach console logs if applicable