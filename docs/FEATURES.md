# Features Documentation

## Complete Feature List by Tier

### 🛡️ Tier 1: Basic Shield (Free, No Account)

#### Ad Blocking
- **Network-level blocking**: Uses Chrome's declarativeNetRequest API
- **50+ ad networks blocked**: Including DoubleClick, Google AdSense, Facebook Ads
- **Banner removal**: Eliminates display advertising
- **Iframe blocking**: Prevents ad-containing iframes
- **Image ad filtering**: Blocks image-based advertisements

#### Popup Blocking
- **Window.open interception**: Catches popup attempts
- **Rate limiting**: Maximum 2 popups per minute
- **Onclick handler blocking**: Prevents sneaky popup triggers
- **New tab advertising block**: Stops redirect ads
- **Under-the-window popunder blocking**: Eliminates hidden popups

#### Cookie Consent Management
- **Auto-rejection**: Automatically clicks reject on cookie banners
- **40+ consent platforms supported**: Including OneTrust, Cookiebot, Quantcast
- **Visual hiding**: Removes consent banners from view
- **Preference management**: Only allows essential cookies
- **Multi-language support**: Works with international sites

#### Basic Features
- **On/Off toggle**: Quick enable/disable
- **Per-site whitelist**: Allow ads on specific sites
- **Blocking counter**: Real-time statistics
- **Lightweight operation**: Minimal performance impact

### ⚡ Tier 2: Enhanced Protection (Free Account Required)

#### YouTube Ad Blocking
- **Video ad removal**: Skips pre-roll, mid-roll, and post-roll ads
- **Banner removal**: Eliminates overlay ads on videos
- **Sidebar ad blocking**: Removes recommended video ads
- **Homepage ad filtering**: Cleans up YouTube homepage
- **Auto-skip functionality**: Automatically clicks skip when available
- **Sponsor block ready**: Framework for sponsor segment skipping

#### Advanced Tracking Protection
- **40+ tracker networks blocked**: Google Analytics, Facebook Pixel, etc.
- **Session recording prevention**: Blocks Hotjar, FullStory, etc.
- **Fingerprinting protection**: Basic browser fingerprint protection
- **Referrer management**: Controls referrer information
- **Third-party cookie blocking**: Enhanced privacy

#### Social Media Filtering
- **Widget removal**: Facebook Like, Twitter Share, etc.
- **Tracking pixel blocking**: Social media conversion tracking
- **Comment system filtering**: Disqus, Facebook Comments
- **Share button removal**: Optional social button hiding
- **Social login tracking block**: Prevents social sign-in tracking

#### Account Features
- **Cloud sync**: Settings sync across devices
- **Personal dashboard**: View your statistics
- **Referral system**: Share and earn tier upgrades
- **Email notifications**: Optional blocking reports

### ⭐ Tier 3: Professional Suite (Complete Profile Required)

#### Custom Filter Editor
- **Visual CSS selector builder**: Point and click filter creation
- **RegEx support**: Advanced pattern matching
- **Wildcard patterns**: Flexible URL matching
- **Import/Export filters**: Share with community
- **Filter templates**: Pre-built filter patterns
- **Testing mode**: Preview before applying

#### Element Picker Tool
- **Visual selection**: Click to select elements
- **Auto-selector generation**: Creates optimal CSS selectors
- **Similar element detection**: Block all similar items
- **Preview mode**: See changes before saving
- **Undo/Redo support**: Mistake recovery
- **Selector history**: Recent selections saved

#### Advanced Whitelist Management
- **Pattern-based whitelisting**: Wildcard and regex support
- **Temporary whitelist**: Time-limited exceptions
- **Resource-specific**: Allow only certain resource types
- **Subdomain control**: Granular domain management
- **Import/Export**: Backup and share whitelists
- **Whitelist groups**: Organize by category

#### Scheduled Blocking
- **Time-based rules**: Different rules for different times
- **Day-specific blocking**: Weekday vs weekend rules
- **Work mode**: Stricter blocking during work hours
- **Focus sessions**: Temporary maximum blocking
- **Schedule templates**: Pre-configured schedules

#### Professional Features
- **100+ additional blocking rules**: Professional filter set
- **Custom CSS injection**: Modify page appearance
- **JavaScript control**: Basic script blocking
- **Advanced statistics**: Detailed blocking analytics
- **Filter subscription**: Subscribe to community filters
- **Backup & Restore**: Complete settings backup

### 🏆 Tier 4: Premium Power (30 Referrals Required)

#### Security Features (Coming Soon)
- **Malware domain blocking**: Real-time threat database
- **Phishing protection**: URL reputation checking
- **Cryptomining blocker**: Prevents browser mining
- **Exploit kit prevention**: Blocks known exploit domains
- **HTTPS enforcement**: Force secure connections
- **Certificate validation**: SSL/TLS verification

#### Advanced Privacy (Coming Soon)
- **Canvas fingerprinting block**: Prevents canvas tracking
- **WebGL fingerprinting protection**: Graphics card privacy
- **Audio fingerprinting block**: Audio API protection
- **Font fingerprinting prevention**: Font enumeration blocking
- **WebRTC leak protection**: IP address privacy
- **DNS-over-HTTPS**: Encrypted DNS queries

#### Developer Tools (Coming Soon)
- **Network request logger**: See all blocked requests
- **Script control panel**: Granular JavaScript control
- **Cookie manager**: Advanced cookie control
- **Storage inspector**: Local storage management
- **Performance profiler**: Extension impact analysis
- **Debug mode**: Detailed logging

### 👑 Tier 5: Ultimate Guardian (Weekly Active Use)

#### AI-Powered Features (Coming Soon)
- **Machine learning ad detection**: Learns from your browsing
- **Behavioral analysis**: Detects new ad patterns
- **Heuristic blocking**: Intelligent filter creation
- **Anomaly detection**: Identifies suspicious behavior
- **Custom model training**: Personalized AI filters
- **Community learning**: Shared AI improvements

#### Advanced Protection (Coming Soon)
- **Zero-day ad blocking**: Blocks new ad techniques
- **Polymorphic ad detection**: Handles changing ads
- **Obfuscation bypass**: Defeats ad hiding techniques
- **Advanced evasion handling**: Anti-adblock bypass
- **Real-time threat feeds**: Live protection updates
- **Sandboxed execution**: Safe ad analysis

#### Community Features (Coming Soon)
- **Filter voting**: Rate community filters
- **Filter sharing**: Blockchain-based distribution
- **Reputation system**: Trusted filter creators
- **Bounty program**: Rewards for filter creation
- **Beta testing**: Early access to features
- **Priority support**: Direct developer access

## Feature Details

### Blocking Engine

#### Technology Stack
- **Manifest V3**: Latest Chrome extension architecture
- **DeclarativeNetRequest**: Efficient network filtering
- **Content Scripts**: DOM manipulation
- **Service Workers**: Background processing
- **IndexedDB**: Local data storage

#### Performance Optimization
- **Lazy loading**: Load features as needed
- **Trie data structure**: Fast pattern matching
- **Bloom filters**: Quick negative lookups
- **Differential updates**: Minimal filter updates
- **Memory management**: Automatic cleanup

### User Interface

#### Popup Interface
- **Quick stats**: At-a-glance blocking info
- **Site controls**: Per-site management
- **Tier progress**: Visual tier advancement
- **Quick settings**: Common toggles

#### Options Page
- **Comprehensive settings**: All configuration options
- **Filter management**: Create and edit filters
- **Statistics dashboard**: Detailed analytics
- **Account management**: Profile and subscription

#### Context Menus
- **Right-click options**: Quick access to features
- **Page actions**: Site-specific operations
- **Element actions**: Direct element blocking

### Privacy & Security

#### Data Handling
- **Local first**: Data stays on device
- **Encrypted sync**: Secure cloud storage
- **No logs policy**: No browsing history stored
- **Anonymous statistics**: Aggregated data only
- **GDPR compliant**: Full data control

#### Permissions
- **Minimal permissions**: Only what's necessary
- **Permission explanations**: Clear reasoning
- **Optional permissions**: Advanced features opt-in
- **Revocable access**: Remove permissions anytime

## How Features Work Together

### Progressive Enhancement
Each tier builds upon the previous, creating a seamless experience:
1. **Foundation** (Tier 1): Core blocking engine
2. **Enhancement** (Tier 2): Specialized blockers
3. **Customization** (Tier 3): User control
4. **Protection** (Tier 4): Security layer
5. **Intelligence** (Tier 5): AI optimization

### Synergy Examples
- **Element Picker + Custom Filters**: Visual filter creation
- **Scheduler + Whitelist**: Time-based exceptions
- **AI + Community**: Crowd-sourced intelligence
- **Security + Privacy**: Complete protection

## Feature Comparison

| Feature | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Tier 5 |
|---------|--------|--------|--------|--------|--------|
| Basic Ad Block | ✅ | ✅ | ✅ | ✅ | ✅ |
| Popup Block | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cookie Block | ✅ | ✅ | ✅ | ✅ | ✅ |
| YouTube Block | ❌ | ✅ | ✅ | ✅ | ✅ |
| Custom Filters | ❌ | ❌ | ✅ | ✅ | ✅ |
| Element Picker | ❌ | ❌ | ✅ | ✅ | ✅ |
| Security | ❌ | ❌ | ❌ | ✅ | ✅ |
| AI Features | ❌ | ❌ | ❌ | ❌ | ✅ |