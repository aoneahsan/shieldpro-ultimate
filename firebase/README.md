# Firebase Configuration for ShieldPro Ultimate

This directory contains all Firebase-related configuration files for the ShieldPro Ultimate extension.

## 📁 Files Overview

- **`firestore.rules`** - Security rules for Firestore database
- **`firestore.indexes.json`** - Index definitions for optimized queries
- **`functions/`** - Cloud Functions code
- **`deploy-firestore.sh`** - Deployment script for rules and indexes
- **`backups/`** - Automatic backups of rules and indexes (created by deploy script)

## 🔒 Security Rules

The security rules implement a comprehensive permission system based on:
- **User Authentication** - Users can only access their own data
- **Tier-Based Access** - Features are locked based on user tier level
- **Admin Access** - Special permissions for admin users
- **Anonymous User Support** - Limited access for anonymous users
- **Data Integrity** - Prevents unauthorized modifications to critical fields

### Key Security Features:
1. **User Profile Protection** - Users cannot modify their UID, email, or referral codes
2. **Tier Verification** - Access to premium features requires appropriate tier level
3. **Referral System Security** - Referral codes and counts protected from manipulation
4. **Cloud Function Only Operations** - Critical operations restricted to server-side functions
5. **Public Statistics** - Global stats readable by all, writable only by functions

## 📊 Firestore Indexes

Indexes are configured for optimal query performance:

### Primary Indexes:
- `users` - tier.level, referralCode, isAnonymous + lastActiveDate
- `referrals` - referrerId, referredId, code
- `tierUpgrades` - userId + timestamp
- `blockingStats` - totalBlocked (descending)
- `feedback` - userId + createdAt

## 🚀 Deployment

### Quick Deploy Commands:

```bash
# Deploy everything
yarn firebase:deploy:all

# Deploy only rules
yarn firebase:deploy:rules

# Deploy only indexes
yarn firebase:deploy:indexes

# Deploy only functions
yarn firebase:deploy:functions
```

### Using the Deploy Script:

```bash
# Make script executable (first time only)
chmod +x firebase/deploy-firestore.sh

# Run the deployment script
./firebase/deploy-firestore.sh
```

The script provides an interactive menu with options to:
1. Deploy security rules only
2. Deploy indexes only
3. Deploy both rules and indexes
4. Backup current configuration
5. Validate environment
6. Deploy everything (rules, indexes, functions)

## 🔧 Local Development

### Start Firebase Emulators:

```bash
# Start all emulators
yarn firebase:emulators

# Or with specific emulators
firebase emulators:start --only firestore,functions,auth
```

### Environment Variables:

Set in your `.env` file:
```env
USE_FIREBASE_EMULATOR=true
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_FUNCTIONS_EMULATOR_HOST=localhost:5001
```

## 📝 Collections Structure

### Main Collections:

#### `users/{userId}`
- User profiles with tier information
- Settings and preferences
- Statistics and engagement tracking

#### `referrals/{referralCode}`
- Referral code mappings
- Usage tracking
- User relationships

#### `blockingStats/{userId}`
- Per-user blocking statistics
- Domain and category breakdowns
- Performance metrics

#### `statistics/global`
- Global application statistics
- Total users and blocks
- Aggregate metrics

#### `tierUpgrades/{upgradeId}`
- Tier upgrade history
- Timestamp tracking
- User progression logs

## ⚠️ Important Notes

1. **Permission Errors** - If you see permission-denied errors:
   - Ensure rules are deployed: `yarn firebase:deploy:rules`
   - Check user authentication status
   - Verify tier requirements for the operation

2. **Index Errors** - If queries fail with index errors:
   - Deploy indexes: `yarn firebase:deploy:indexes`
   - Wait 2-5 minutes for index building
   - Check Firebase Console for index status

3. **Cloud Functions** - Require Node.js version 22:
   ```bash
   nvm use 22
   cd firebase/functions
   npm install
   ```

4. **Testing Rules** - Use the Firebase Emulator Suite:
   ```bash
   firebase emulators:start --only firestore
   # Test rules at http://localhost:8080/firestore
   ```

## 🔍 Monitoring

### Check Deployment Status:
- **Rules**: [Firebase Console - Rules](https://console.firebase.google.com/project/_/firestore/rules)
- **Indexes**: [Firebase Console - Indexes](https://console.firebase.google.com/project/_/firestore/indexes)
- **Functions**: [Firebase Console - Functions](https://console.firebase.google.com/project/_/functions)

### View Logs:
```bash
# View function logs
firebase functions:log

# View specific function logs
firebase functions:log --only checkTierUpgrade
```

## 🆘 Troubleshooting

### Common Issues:

1. **"Missing or insufficient permissions"**
   - Solution: Deploy latest rules with `yarn firebase:deploy:rules`

2. **"The query requires an index"**
   - Solution: Deploy indexes with `yarn firebase:deploy:indexes`

3. **"Firebase CLI not found"**
   - Solution: Install with `npm install -g firebase-tools`

4. **"Not authenticated to Firebase"**
   - Solution: Run `firebase login`

5. **"No Firebase project selected"**
   - Solution: Run `firebase use <project-id>`

## 📚 Additional Resources

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore Indexes Guide](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Cloud Functions Documentation](https://firebase.google.com/docs/functions)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)

## 🔐 Security Best Practices

1. **Never expose sensitive data** in client-side code
2. **Always validate data** in security rules
3. **Use Cloud Functions** for sensitive operations
4. **Implement rate limiting** for API calls
5. **Regular security audits** of rules and functions
6. **Monitor usage patterns** for anomalies
7. **Keep dependencies updated** in Cloud Functions

## 📄 License

This Firebase configuration is part of the ShieldPro Ultimate project and follows the same license terms.