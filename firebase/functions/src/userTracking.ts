/**
 * Firebase Cloud Functions for User Tracking
 * Manages anonymous users, account linking, and cleanup
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const auth = admin.auth();

/**
 * Atomically increment global user count and return user number
 */
export const incrementUserCount = functions.https.onCall(async (data, context) => {
  try {
    const statsRef = db.doc('stats/global');
    
    // Use transaction for atomic increment
    const userNumber = await db.runTransaction(async (transaction) => {
      const statsDoc = await transaction.get(statsRef);
      
      let currentCount = 1;
      if (statsDoc.exists) {
        currentCount = (statsDoc.data()?.totalUsers || 0) + 1;
      }
      
      transaction.set(statsRef, {
        totalUsers: currentCount,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      return currentCount;
    });
    
    // Log for analytics
    console.log(`New user registered: #${userNumber}`);
    
    return { userNumber };
  } catch (error) {
    console.error('Error incrementing user count:', error);
    throw new functions.https.HttpsError('internal', 'Failed to increment user count');
  }
});

/**
 * Delete anonymous user from Auth
 * Called from client when cleaning up old accounts
 */
export const deleteAnonymousUser = functions.https.onCall(async (data, context) => {
  // Verify the caller has permission
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }
  
  const { uid } = data;
  
  try {
    // Verify user is anonymous before deleting
    const user = await auth.getUser(uid);
    
    if (!user.providerData || user.providerData.length === 0) {
      // User is anonymous, safe to delete
      await auth.deleteUser(uid);
      console.log(`Deleted anonymous user: ${uid}`);
      return { success: true };
    } else {
      throw new functions.https.HttpsError('failed-precondition', 'User is not anonymous');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to delete user');
  }
});

/**
 * Scheduled function to clean up old anonymous accounts
 * Runs daily at 2 AM
 */
export const cleanupOldAnonymousAccounts = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('Starting cleanup of old anonymous accounts...');
    
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    try {
      // Query old anonymous accounts
      const usersSnapshot = await db.collection('users')
        .where('isAnonymous', '==', true)
        .where('lastActiveDate', '<', admin.firestore.Timestamp.fromDate(threeMonthsAgo))
        .limit(500) // Process in batches to avoid timeout
        .get();
      
      const deletePromises: Promise<any>[] = [];
      
      usersSnapshot.forEach((doc) => {
        const uid = doc.id;
        
        // Delete from Auth
        deletePromises.push(
          auth.deleteUser(uid)
            .then(() => console.log(`Deleted auth user: ${uid}`))
            .catch((error) => console.error(`Failed to delete auth user ${uid}:`, error))
        );
        
        // Delete from Firestore
        deletePromises.push(
          doc.ref.delete()
            .then(() => console.log(`Deleted Firestore user: ${uid}`))
            .catch((error) => console.error(`Failed to delete Firestore user ${uid}:`, error))
        );
      });
      
      await Promise.all(deletePromises);
      
      console.log(`Cleanup completed. Processed ${usersSnapshot.size} accounts.`);
      
      // Log cleanup stats
      await db.collection('logs').add({
        type: 'cleanup',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        accountsDeleted: usersSnapshot.size,
        cutoffDate: threeMonthsAgo
      });
      
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    }
  });

/**
 * Track analytics events
 */
export const trackAnalytics = functions.https.onCall(async (data, context) => {
  const { event, eventData, timestamp, uid } = data;
  
  try {
    // Store in analytics collection
    await db.collection('analytics').add({
      event,
      data: eventData,
      uid: uid || context.auth?.uid,
      timestamp: timestamp || admin.firestore.FieldValue.serverTimestamp(),
      userAgent: context.rawRequest?.headers['user-agent'],
      ip: context.rawRequest?.ip
    });
    
    // Update user stats if applicable
    if (uid) {
      const userRef = db.doc(`users/${uid}`);
      
      switch (event) {
        case 'account_created':
          await userRef.update({
            accountCreatedAnalytics: eventData,
            accountCreatedTimestamp: admin.firestore.FieldValue.serverTimestamp()
          });
          break;
          
        case 'tier_upgraded':
          await userRef.update({
            lastTierUpgrade: eventData,
            tierUpgradeTimestamp: admin.firestore.FieldValue.serverTimestamp()
          });
          break;
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error tracking analytics:', error);
    throw new functions.https.HttpsError('internal', 'Failed to track analytics');
  }
});

/**
 * Get global statistics
 */
export const getGlobalStats = functions.https.onCall(async (data, context) => {
  try {
    const statsDoc = await db.doc('stats/global').get();
    
    if (!statsDoc.exists) {
      return {
        totalUsers: 0,
        earlyAdoptersRemaining: 100000,
        currentPhase: 'EARLY_ADOPTER'
      };
    }
    
    const stats = statsDoc.data()!;
    const totalUsers = stats.totalUsers || 0;
    const earlyAdoptersRemaining = Math.max(0, 100000 - totalUsers);
    
    let currentPhase = 'EARLY_ADOPTER';
    if (totalUsers > 500000) currentPhase = 'MATURITY';
    else if (totalUsers > 250000) currentPhase = 'EXPANSION';
    else if (totalUsers > 100000) currentPhase = 'GROWTH';
    
    return {
      totalUsers,
      earlyAdoptersRemaining,
      currentPhase,
      lastUpdated: stats.lastUpdated
    };
  } catch (error) {
    console.error('Error getting global stats:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get stats');
  }
});

/**
 * Handle user tier updates based on global count
 */
export const updateUserTiers = functions.pubsub
  .schedule('0 */6 * * *') // Every 6 hours
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('Starting user tier update check...');
    
    try {
      const statsDoc = await db.doc('stats/global').get();
      const globalCount = statsDoc.data()?.totalUsers || 0;
      
      // Define tier reduction thresholds
      const reductionRules = [
        { threshold: 110000, reduceTo: 4 },
        { threshold: 125000, reduceTo: 3 },
        { threshold: 150000, reduceTo: 2 },
        { threshold: 200000, reduceTo: 1 }
      ];
      
      // Find applicable reduction
      let targetTier = 5;
      for (const rule of reductionRules) {
        if (globalCount >= rule.threshold) {
          targetTier = rule.reduceTo;
        }
      }
      
      if (targetTier < 5) {
        // Update early adopters without accounts
        const batch = db.batch();
        let updateCount = 0;
        
        const usersSnapshot = await db.collection('users')
          .where('isEarlyAdopter', '==', true)
          .where('hasAccount', '==', false)
          .where('currentTier', '>', targetTier)
          .limit(500)
          .get();
        
        usersSnapshot.forEach((doc) => {
          batch.update(doc.ref, {
            currentTier: targetTier,
            tierReducedAt: admin.firestore.FieldValue.serverTimestamp(),
            tierReductionReason: `Global user count reached ${globalCount}`
          });
          updateCount++;
        });
        
        if (updateCount > 0) {
          await batch.commit();
          console.log(`Updated ${updateCount} users to tier ${targetTier}`);
        }
      }
      
      console.log('Tier update check completed');
    } catch (error) {
      console.error('Error updating user tiers:', error);
      throw error;
    }
  });

/**
 * Send notification to early adopters without accounts
 */
export const notifyEarlyAdopters = functions.https.onCall(async (data, context) => {
  // Admin only function
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  try {
    const { message, threshold } = data;
    
    // Get early adopters without accounts
    const usersSnapshot = await db.collection('users')
      .where('isEarlyAdopter', '==', true)
      .where('hasAccount', '==', false)
      .where('userNumber', '<=', threshold || 100000)
      .get();
    
    const notifications: Promise<any>[] = [];
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      
      // Create notification document
      notifications.push(
        db.collection('notifications').add({
          userId: doc.id,
          userNumber: userData.userNumber,
          message: message || 'Secure your early adopter benefits by creating an account!',
          type: 'early_adopter_reminder',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          read: false
        })
      );
    });
    
    await Promise.all(notifications);
    
    return {
      success: true,
      notificationsSent: notifications.length
    };
  } catch (error) {
    console.error('Error sending notifications:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send notifications');
  }
});