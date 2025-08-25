import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

// Tier management function - checks user qualifications for tier upgrades
export const checkTierUpgrade = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const uid = context.auth.uid;
  const userDoc = await db.collection('users').doc(uid).get();
  
  if (!userDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'User profile not found');
  }

  const userData = userDoc.data()!;
  const currentTier = userData.tier.level;
  let newTier = currentTier;
  let message = '';

  // Check Tier 2: Account created (automatic)
  if (currentTier === 1 && context.auth.uid) {
    newTier = 2;
    message = 'Upgraded to Tier 2: Enhanced features unlocked!';
  }
  
  // Check Tier 3: Complete profile (name, photo, verified email)
  if (currentTier === 2) {
    const hasCompletedProfile = userData.displayName && 
                                userData.photoURL && 
                                context.auth.token.email_verified;
    if (hasCompletedProfile) {
      newTier = 3;
      message = 'Upgraded to Tier 3: Professional features unlocked!';
    }
  }
  
  // Check Tier 4: 30 successful referrals
  if (currentTier === 3) {
    if (userData.stats.referralCount >= 30) {
      newTier = 4;
      message = 'Upgraded to Tier 4: Premium features unlocked!';
    }
  }
  
  // Check Tier 5: Weekly engagement (7 consecutive days)
  if (currentTier === 4) {
    const weeklyEngagement = userData.stats.weeklyEngagement || [];
    if (weeklyEngagement.length >= 7) {
      newTier = 5;
      message = 'Upgraded to Tier 5: Ultimate features unlocked!';
    }
  }

  // Update tier if changed
  if (newTier > currentTier) {
    const tierNames: Record<number, string> = {
      1: 'Basic',
      2: 'Enhanced',
      3: 'Professional',
      4: 'Premium',
      5: 'Ultimate'
    };

    await db.collection('users').doc(uid).update({
      'tier.level': newTier,
      'tier.name': tierNames[newTier],
      'tier.unlockedAt': admin.firestore.FieldValue.serverTimestamp(),
      'tier.progress': newTier * 20
    });

    // Log tier upgrade
    await db.collection('tierUpgrades').add({
      userId: uid,
      fromTier: currentTier,
      toTier: newTier,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  return {
    currentTier,
    newTier,
    upgraded: newTier > currentTier,
    message
  };
});

// Weekly engagement checker - runs daily to check Tier 5 maintenance
export const checkWeeklyEngagement = functions.pubsub
  .schedule('every day 00:00')
  .timeZone('UTC')
  .onRun(async () => {
    const tier5Users = await db.collection('users')
      .where('tier.level', '==', 5)
      .get();

    const batch = db.batch();
    const now = new Date();
    const dayOfWeek = now.getDay();

    tier5Users.forEach(doc => {
      const userData = doc.data();
      const weeklyEngagement = userData.stats.weeklyEngagement || [];
      
      // Check if user has been active in the last 7 days
      const lastActive = userData.stats.lastActive?.toDate();
      const daysSinceActive = lastActive ? 
        Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)) : 
        999;

      if (daysSinceActive > 1) {
        // Reset engagement array if inactive
        batch.update(doc.ref, {
          'stats.weeklyEngagement': [],
          'tier.level': 4,
          'tier.name': 'Premium',
          'tier.progress': 60
        });
      }
    });

    await batch.commit();
    console.log('Weekly engagement check completed');
});

// Update blocking statistics
export const updateBlockingStats = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { domain, category, count = 1 } = data;
  const uid = context.auth.uid;

  // Update user stats
  await db.collection('users').doc(uid).update({
    'stats.totalBlocked': admin.firestore.FieldValue.increment(count),
    'stats.lastActive': admin.firestore.FieldValue.serverTimestamp()
  });

  // Update detailed blocking stats
  const statsDoc = db.collection('blockingStats').doc(uid);
  const stats = await statsDoc.get();

  if (stats.exists) {
    await statsDoc.update({
      totalBlocked: admin.firestore.FieldValue.increment(count),
      [`domainStats.${domain}`]: admin.firestore.FieldValue.increment(count),
      [`categoryStats.${category}`]: admin.firestore.FieldValue.increment(count),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
  } else {
    await statsDoc.set({
      totalBlocked: count,
      domainStats: { [domain]: count },
      categoryStats: { [category]: count },
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  // Update global statistics
  const globalStats = db.collection('statistics').doc('global');
  await globalStats.update({
    totalBlocked: admin.firestore.FieldValue.increment(count),
    [`domainStats.${domain}`]: admin.firestore.FieldValue.increment(count),
    [`categoryStats.${category}`]: admin.firestore.FieldValue.increment(count),
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true };
});

// Process referral
export const processReferral = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { referralCode } = data;
  const referredId = context.auth.uid;

  // Find referrer by code
  const referrerQuery = await db.collection('users')
    .where('stats.referralCode', '==', referralCode)
    .limit(1)
    .get();

  if (referrerQuery.empty) {
    throw new functions.https.HttpsError('not-found', 'Invalid referral code');
  }

  const referrerDoc = referrerQuery.docs[0];
  const referrerId = referrerDoc.id;

  // Check if already referred
  const existingReferral = await db.collection('referrals')
    .where('referredId', '==', referredId)
    .get();

  if (!existingReferral.empty) {
    throw new functions.https.HttpsError('already-exists', 'User already has a referrer');
  }

  // Create referral record
  await db.collection('referrals').add({
    referrerId,
    referredId,
    referralCode,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });

  // Update referrer's count
  await db.collection('users').doc(referrerId).update({
    'stats.referralCount': admin.firestore.FieldValue.increment(1)
  });

  // Update referred user
  await db.collection('users').doc(referredId).update({
    'stats.referredBy': referralCode
  });

  // Check if referrer qualifies for Tier 4
  const updatedReferrer = await db.collection('users').doc(referrerId).get();
  const referrerData = updatedReferrer.data()!;
  
  if (referrerData.stats.referralCount >= 30 && referrerData.tier.level < 4) {
    await db.collection('users').doc(referrerId).update({
      'tier.level': 4,
      'tier.name': 'Premium',
      'tier.progress': 60,
      'tier.unlockedAt': admin.firestore.FieldValue.serverTimestamp()
    });
  }

  return { success: true, referrerId };
});

// Get user statistics
export const getUserStatistics = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const uid = context.auth.uid;
  
  // Get user profile
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'User not found');
  }

  // Get blocking stats
  const statsDoc = await db.collection('blockingStats').doc(uid).get();
  const blockingStats = statsDoc.exists ? statsDoc.data() : {};

  // Get referral count
  const referrals = await db.collection('referrals')
    .where('referrerId', '==', uid)
    .get();

  return {
    profile: userDoc.data(),
    blockingStats,
    referralCount: referrals.size
  };
});

// Generate unique referral code for new users
export const generateReferralCode = functions.auth.user().onCreate(async (user) => {
  const uid = user.uid;
  
  // Generate unique 8-character referral code
  const generateCode = (): string => {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  };
  
  let referralCode = generateCode();
  let attempts = 0;
  
  // Ensure uniqueness
  while (attempts < 10) {
    const existing = await db.collection('users')
      .where('stats.referralCode', '==', referralCode)
      .get();
    
    if (existing.empty) {
      break;
    }
    
    referralCode = generateCode();
    attempts++;
  }
  
  // Create initial user profile
  const userProfile = {
    uid,
    email: user.email || '',
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    tier: {
      level: user.email ? 2 : 1, // Tier 2 if authenticated with email
      name: user.email ? 'Enhanced' : 'Basic',
      progress: user.email ? 20 : 0,
      unlockedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    stats: {
      referralCode,
      referralCount: 0,
      totalBlocked: 0,
      weeklyEngagement: [],
      lastActive: admin.firestore.FieldValue.serverTimestamp()
    },
    settings: {
      notifications: true,
      autoUpdate: true,
      syncEnabled: true
    }
  };
  
  await db.collection('users').doc(uid).set(userProfile);
  
  // Initialize blocking stats
  await db.collection('blockingStats').doc(uid).set({
    totalBlocked: 0,
    domainStats: {},
    categoryStats: {},
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
  });
  
  console.log(`Created profile for user ${uid} with referral code ${referralCode}`);
  return { referralCode };
});

// Track daily engagement for Tier 5 users
export const trackDailyEngagement = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const uid = context.auth.uid;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'User not found');
  }
  
  const userData = userDoc.data()!;
  const weeklyEngagement = userData.stats.weeklyEngagement || [];
  
  // Check if already tracked today
  if (!weeklyEngagement.includes(today)) {
    weeklyEngagement.push(today);
    
    // Keep only last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const filteredEngagement = weeklyEngagement.filter((date: string) => {
      return new Date(date) >= sevenDaysAgo;
    });
    
    await db.collection('users').doc(uid).update({
      'stats.weeklyEngagement': filteredEngagement,
      'stats.lastActive': admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Check if qualifies for Tier 5
    if (filteredEngagement.length >= 7 && userData.tier.level === 4) {
      await db.collection('users').doc(uid).update({
        'tier.level': 5,
        'tier.name': 'Ultimate',
        'tier.progress': 100,
        'tier.unlockedAt': admin.firestore.FieldValue.serverTimestamp()
      });
      
      return { 
        success: true, 
        engagementDays: filteredEngagement.length,
        tierUpgraded: true,
        message: 'Congratulations! You\'ve unlocked Tier 5 - Ultimate!'
      };
    }
  }
  
  return { 
    success: true, 
    engagementDays: weeklyEngagement.length,
    tierUpgraded: false
  };
});

// Get tier progress details
export const getTierProgress = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const uid = context.auth.uid;
  const userDoc = await db.collection('users').doc(uid).get();
  
  if (!userDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'User not found');
  }
  
  const userData = userDoc.data()!;
  const currentTier = userData.tier.level;
  
  // Calculate progress to next tier
  let progressToNext = {
    currentTier,
    nextTier: currentTier + 1,
    requirements: {} as any,
    progress: {} as any,
    canUpgrade: false
  };
  
  switch (currentTier) {
    case 1:
      progressToNext.requirements = { createAccount: true };
      progressToNext.progress = { hasAccount: !!context.auth.uid };
      progressToNext.canUpgrade = true;
      break;
      
    case 2:
      const hasName = !!userData.displayName;
      const hasPhoto = !!userData.photoURL;
      const hasVerifiedEmail = context.auth.token.email_verified || false;
      
      progressToNext.requirements = {
        displayName: true,
        photoURL: true,
        verifiedEmail: true
      };
      progressToNext.progress = {
        displayName: hasName,
        photoURL: hasPhoto,
        verifiedEmail: hasVerifiedEmail
      };
      progressToNext.canUpgrade = hasName && hasPhoto && hasVerifiedEmail;
      break;
      
    case 3:
      const referralCount = userData.stats.referralCount || 0;
      progressToNext.requirements = { referrals: 30 };
      progressToNext.progress = { 
        referrals: referralCount,
        percentage: Math.min(100, (referralCount / 30) * 100)
      };
      progressToNext.canUpgrade = referralCount >= 30;
      break;
      
    case 4:
      const engagementDays = (userData.stats.weeklyEngagement || []).length;
      progressToNext.requirements = { weeklyEngagement: 7 };
      progressToNext.progress = {
        engagementDays,
        percentage: Math.min(100, (engagementDays / 7) * 100)
      };
      progressToNext.canUpgrade = engagementDays >= 7;
      break;
      
    case 5:
      progressToNext.requirements = { maintain: 'Weekly engagement' };
      progressToNext.progress = { 
        status: 'Maximum tier reached',
        weeklyEngagement: (userData.stats.weeklyEngagement || []).length
      };
      progressToNext.canUpgrade = false;
      break;
  }
  
  return progressToNext;
});

// Export user data (GDPR compliance)
export const exportUserData = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const uid = context.auth.uid;
  
  // Collect all user data
  const userData = await db.collection('users').doc(uid).get();
  const blockingStats = await db.collection('blockingStats').doc(uid).get();
  const referralsSent = await db.collection('referrals')
    .where('referrerId', '==', uid)
    .get();
  const referralsReceived = await db.collection('referrals')
    .where('referredId', '==', uid)
    .get();
  
  const exportData = {
    profile: userData.exists ? userData.data() : null,
    blockingStats: blockingStats.exists ? blockingStats.data() : null,
    referralsSent: referralsSent.docs.map(doc => doc.data()),
    referralsReceived: referralsReceived.docs.map(doc => doc.data()),
    exportedAt: new Date().toISOString()
  };
  
  return exportData;
});

// Delete user data (GDPR compliance)
export const deleteUserData = functions.auth.user().onDelete(async (user) => {
  const uid = user.uid;
  
  // Delete user documents
  const batch = db.batch();
  
  batch.delete(db.collection('users').doc(uid));
  batch.delete(db.collection('blockingStats').doc(uid));
  
  // Delete referrals
  const referrals = await db.collection('referrals')
    .where('referrerId', '==', uid)
    .get();
  
  referrals.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(`Deleted all data for user ${uid}`);
});

// Clean up old data (runs weekly)
export const cleanupOldData = functions.pubsub
  .schedule('every sunday 00:00')
  .timeZone('UTC')
  .onRun(async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Clean up old tier upgrade logs
    const oldUpgrades = await db.collection('tierUpgrades')
      .where('timestamp', '<', thirtyDaysAgo)
      .get();

    const batch = db.batch();
    oldUpgrades.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Cleaned up ${oldUpgrades.size} old records`);
  });