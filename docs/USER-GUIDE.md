# ShieldPro Ultimate - Complete User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Understanding the Tier System](#understanding-the-tier-system)
3. [Installation Guide](#installation-guide)
4. [Using ShieldPro](#using-shieldpro)
5. [Tier-Specific Features](#tier-specific-features)
6. [Troubleshooting](#troubleshooting)
7. [FAQ](#faq)

---

## Getting Started

### What is ShieldPro Ultimate?

ShieldPro Ultimate is a revolutionary ad blocker that uses a 5-tier progressive unlock system. Instead of paying for premium features, you unlock them through engagement:
- **Tier 1**: Available immediately - no signup required
- **Tier 2**: Create a free account
- **Tier 3**: Complete your profile
- **Tier 4**: Share with 30 friends
- **Tier 5**: Stay active weekly

### Key Benefits
- ✅ **100% Free** - All features unlock through engagement
- ✅ **Privacy First** - Your data stays secure
- ✅ **Cross-Device Sync** - Settings sync across all devices
- ✅ **Regular Updates** - Constantly improving protection
- ✅ **Community Driven** - Share and unlock together

---

## Understanding the Tier System

### Tier Progression Overview

```
Tier 1 (0%) ──► Tier 2 (20%) ──► Tier 3 (40%) ──► Tier 4 (60%) ──► Tier 5 (80-100%)
   │                │                 │                │                  │
   Free          Account           Profile          Referrals          Weekly Use
```

### How Features Stack

Each tier includes ALL features from previous tiers plus new ones:

| Tier | Unlock Requirement | New Features |
|------|-------------------|--------------|
| **1** | None | Basic ad blocking, popup blocking, cookie rejection |
| **2** | Create account | YouTube ad blocking, tracker protection, cloud sync |
| **3** | Complete profile | Custom filters, element picker, scheduling |
| **4** | 30 referrals | Filter lists, whitelist manager, regex patterns, security |
| **5** | Weekly activity | AI features, priority support, beta access |

---

## Installation Guide

### Chrome Installation

1. **Visit Chrome Web Store**
   - Go to [Chrome Web Store](https://chrome.google.com/webstore)
   - Search for "ShieldPro Ultimate"
   
2. **Add to Chrome**
   - Click "Add to Chrome"
   - Click "Add Extension" in the popup
   
3. **Pin the Extension**
   - Click the puzzle piece icon in toolbar
   - Click the pin icon next to ShieldPro

### Edge Installation

1. **Visit Edge Add-ons**
   - Go to [Edge Add-ons](https://microsoftedge.microsoft.com/addons)
   - Search for "ShieldPro Ultimate"
   
2. **Get Extension**
   - Click "Get"
   - Click "Add Extension"

### Firefox Installation

1. **Visit Firefox Add-ons**
   - Go to [Firefox Add-ons](https://addons.mozilla.org)
   - Search for "ShieldPro Ultimate"
   
2. **Add to Firefox**
   - Click "Add to Firefox"
   - Click "Add" in the permission dialog

### Manual Installation (Developer Mode)

1. **Download Extension**
   - Download the latest release from GitHub
   - Extract the ZIP file
   
2. **Enable Developer Mode**
   - Chrome: Go to `chrome://extensions`
   - Enable "Developer mode" toggle
   
3. **Load Extension**
   - Click "Load unpacked"
   - Select the extracted folder

---

## Using ShieldPro

### First Time Setup

1. **Click Extension Icon**
   - Find ShieldPro icon in your toolbar
   - Click to open the popup

2. **View Your Tier Status**
   - Current tier shown at top
   - Blocked count displayed prominently

3. **Quick Actions**
   - Toggle blocking on/off
   - Whitelist current site
   - View statistics

### Basic Controls

#### Enable/Disable Blocking
- **Global Toggle**: Click power button in popup
- **Per-Site**: Click shield icon for site-specific control
- **Temporary Disable**: Hold Shift + click for 1-hour disable

#### Whitelist Management
- **Quick Whitelist**: Click heart icon in popup
- **Advanced Whitelist** (Tier 4): Options → Whitelist Manager
- **Temporary Whitelist**: Right-click → "Whitelist for 1 hour"

#### View Statistics
- **Popup Stats**: See today's blocked count
- **Detailed Stats**: Options → Statistics
- **Export Stats**: Options → Export Data

---

## Tier-Specific Features

### Tier 1: Basic Shield (Free - No Login)

#### Features Available
- **Ad Blocking**: Blocks 1000+ ad networks
- **Popup Blocking**: Stops annoying popups
- **Cookie Auto-Reject**: Rejects cookies from 40+ platforms
- **Basic Statistics**: Track blocked ads

#### How to Use
1. Install extension - works immediately
2. Browse normally - ads blocked automatically
3. Check popup for blocked count
4. Whitelist sites if needed

### Tier 2: Enhanced Protection (Create Account)

#### Unlock Process
1. Click "Sign In" in popup
2. Choose sign-in method:
   - Google (fastest)
   - Email/Password
   - GitHub
3. Verify email if using email signup

#### New Features
- **YouTube Ad Blocking**
  - Skips video ads automatically
  - Removes banner ads
  - Blocks mid-roll interruptions
  
- **Tracker Protection**
  - Blocks 40+ tracking networks
  - Prevents session recording
  - Stops behavioral tracking
  
- **Cloud Sync**
  - Settings sync across devices
  - Whitelist syncs automatically
  - Statistics combined

### Tier 3: Professional Suite (Complete Profile)

#### Unlock Process
1. Go to Options → Profile
2. Add display name
3. Upload profile photo
4. Set notification preferences
5. Save changes

#### New Features

##### Custom Filters
1. **Access**: Options → Custom Filters
2. **Create Filter**:
   ```css
   /* Example: Hide all divs with class "ad" */
   div.ad { display: none !important; }
   ```
3. **Test Filter**: Click "Test" button
4. **Schedule Filter**: Set days/times

##### Element Picker
1. **Activate**: Click "Element Picker" in options
2. **Select Element**: Hover and click on page
3. **Confirm Block**: Click checkmark
4. **Edit Selector**: Modify if needed

##### Import/Export
- **Export**: Options → Custom Filters → Export
- **Import**: Options → Custom Filters → Import
- **Format**: JSON file with all settings

### Tier 4: Premium Power (30 Referrals)

#### Unlock Process
1. Go to Options → Referrals
2. Copy your referral link
3. Share via:
   - Social media
   - Email
   - Messaging apps
4. Track progress in dashboard

#### New Features

##### Filter List Manager
1. **Access**: Options → Filter Lists
2. **Subscribe to Lists**:
   - Browse community lists
   - Click "Subscribe"
   - Auto-updates enabled
3. **Add Custom List**:
   - Click "Add List"
   - Enter URL
   - Choose update frequency

##### Advanced Whitelist
1. **Groups**: Organize sites into groups
2. **Temporary Entries**: Set expiration times
3. **Scope Control**: Whitelist only ads or trackers
4. **Quick Add**: Popular sites one-click add

##### Regex Patterns
1. **Create Pattern**:
   ```regex
   # Block tracking parameters
   (utm_[a-z]+|fbclid|gclid)=[^&]*
   ```
2. **Test Pattern**: Real-time testing
3. **Performance Monitor**: See complexity score

##### Security Features
- **Malware Protection**: Blocks malicious domains
- **Phishing Detection**: Warns about fake sites
- **DNS over HTTPS**: Encrypted DNS queries
- **Script Control**: Block/allow JavaScript

### Tier 5: Ultimate Champion (Weekly Activity)

#### Unlock Process
1. Use ShieldPro 5+ times per week
2. Maintain activity to keep access
3. Get reminder notifications

#### New Features
- **AI-Powered Blocking**: Smart ad detection
- **Predictive Blocking**: Learns from patterns
- **Priority Support**: 24-hour response
- **Beta Features**: Early access
- **API Access**: Developer tools
- **Custom Reports**: Advanced analytics

---

## Troubleshooting

### Common Issues

#### Extension Not Blocking Ads
1. **Check if enabled**: Look for green shield icon
2. **Clear cache**: Ctrl+Shift+Delete → Clear cache
3. **Update filters**: Options → Update Filters
4. **Check whitelist**: Remove site from whitelist

#### YouTube Ads Still Showing
1. **Verify Tier 2+**: Need account for YouTube blocking
2. **Refresh page**: Force reload with Ctrl+F5
3. **Update extension**: Check for updates
4. **Report issue**: Help → Report Problem

#### Site Not Working Properly
1. **Whitelist temporarily**: Test if blocking causes issue
2. **Disable custom filters**: Options → Custom Filters → Disable
3. **Check console**: F12 → Console for errors
4. **Report broken site**: Help → Report Broken Site

#### Sync Not Working
1. **Check login status**: Ensure logged in
2. **Force sync**: Options → Sync → Force Sync
3. **Check internet**: Verify connection
4. **Re-authenticate**: Sign out and back in

### Performance Issues

#### High Memory Usage
- Disable unused filter lists
- Reduce custom filters
- Clear statistics monthly
- Restart browser

#### Slow Page Loading
- Check regex pattern complexity
- Disable experimental features
- Reduce active filter lists
- Report specific sites

---

## FAQ

### General Questions

**Q: Is ShieldPro really free?**
A: Yes! All features unlock through engagement, not payment.

**Q: Is my data private?**
A: Absolutely. We only store settings and statistics, never browsing data.

**Q: Can I use on multiple devices?**
A: Yes! Create an account (Tier 2) for sync across all devices.

**Q: How do referrals work?**
A: Share your unique link. When 30 people install and use ShieldPro, you unlock Tier 4.

### Feature Questions

**Q: Why isn't YouTube blocking working?**
A: YouTube blocking requires Tier 2 (free account). Sign in to unlock.

**Q: Can I block specific elements?**
A: Yes! Use Element Picker (Tier 3) or Custom Filters (Tier 3).

**Q: How do I backup my settings?**
A: Options → Export Settings. Save the JSON file securely.

**Q: Can I use my own filter lists?**
A: Yes! Tier 4 includes Filter List Manager for custom lists.

### Technical Questions

**Q: Does ShieldPro slow down browsing?**
A: No! We use Chrome's native blocking API for maximum performance.

**Q: Is it compatible with other extensions?**
A: Generally yes, but avoid using multiple ad blockers simultaneously.

**Q: How often do filters update?**
A: Daily for built-in lists, configurable for custom lists.

**Q: Can websites detect I'm using ShieldPro?**
A: We include anti-detection measures, but some sites may still detect.

### Tier Questions

**Q: Can I lose a tier once unlocked?**
A: Only Tier 5 requires maintenance (weekly activity). Tiers 1-4 are permanent.

**Q: How long to unlock all tiers?**
A: Tiers 1-3: Minutes. Tier 4: Depends on sharing. Tier 5: One week of use.

**Q: What if I don't want to share for Tier 4?**
A: Tiers 1-3 provide excellent protection. Tier 4 adds advanced features.

**Q: How is weekly activity measured?**
A: Opening the extension or having it block ads counts as activity.

---

## Support & Contact

### Getting Help
- **Documentation**: Right-click extension → "Tier Information"
- **Support Email**: support@shieldpro.example.com
- **Community Forum**: community.shieldpro.example.com
- **GitHub Issues**: github.com/shieldpro/issues

### Reporting Issues
1. **Describe the problem** clearly
2. **Include browser version** (Help → About)
3. **List your tier level**
4. **Provide example URL** if site-specific
5. **Attach screenshots** if visual issue

### Feature Requests
- Vote on existing requests
- Submit new ideas
- Join beta testing (Tier 5)

### Contributing
- Report bugs on GitHub
- Submit filter lists
- Translate to other languages
- Share with friends to help growth

---

*Last updated: November 2024*
*Version: 1.0.0*