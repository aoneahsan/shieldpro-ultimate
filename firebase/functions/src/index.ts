import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

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