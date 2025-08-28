/**
 * Firebase User Tracking Service
 * Manages anonymous users and account linking with automatic cleanup
 */

import { 
  getAuth, 
  signInAnonymously, 
  linkWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
  User,
  deleteUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  increment,
  serverTimestamp,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface IncrementUserCountResponse {
  userNumber: number;
}
import { app as firebaseApp } from '@/utils/firebase';
import { EarlyAdopterStatus } from '../constants/marketing';

interface FirebaseUserData {
  uid: string;
  isAnonymous: boolean;
  userNumber: number;
  installDate: Timestamp;
  isEarlyAdopter: boolean;
  currentTier: number;
  lockedTier: number;
  hasAccount: boolean;
  email?: string;
  accountCreatedDate?: Timestamp;
  lastActiveDate: Timestamp;
  extensionVersion: string;
  platform: string;
  referralCode?: string;
  referredBy?: string;
  referralCount: number;
  metadata: {
    ip?: string;
    country?: string;
    region?: string;
    language: string;
    timezone: string;
  };
}

class FirebaseUserTrackingService {
  private static instance: FirebaseUserTrackingService;
  private auth = getAuth(firebaseApp);
  private db = getFirestore(firebaseApp);
  private functions = getFunctions(firebaseApp);
  private currentUser: User | null = null;
  private globalUserCount: number = 0;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeAuthListener();
    this.startCleanupScheduler();
  }

  static getInstance(): FirebaseUserTrackingService {
    if (!FirebaseUserTrackingService.instance) {
      FirebaseUserTrackingService.instance = new FirebaseUserTrackingService();
    }
    return FirebaseUserTrackingService.instance;
  }

  /**
   * Initialize or get anonymous user
   */
  async initializeAnonymousUser(): Promise<{ uid: string; userNumber: number }> {
    try {
      // Sign in anonymously
      const userCredential = await signInAnonymously(this.auth);
      const user = userCredential.user;
      
      // Get or create user document
      const userDocRef = doc(this.db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // New user - get global user number
        const userNumber = await this.getAndIncrementGlobalUserCount();
        
        // Create user data
        const userData: FirebaseUserData = {
          uid: user.uid,
          isAnonymous: true,
          userNumber,
          installDate: serverTimestamp() as Timestamp,
          isEarlyAdopter: userNumber <= 100000,
          currentTier: userNumber <= 100000 ? 5 : 1,
          lockedTier: userNumber <= 100000 ? 5 : 1,
          hasAccount: false,
          lastActiveDate: serverTimestamp() as Timestamp,
          extensionVersion: chrome.runtime.getManifest().version,
          platform: navigator.platform,
          referralCount: 0,
          metadata: {
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        };
        
        // Save to Firestore
        await setDoc(userDocRef, userData);
        
        // Track analytics
        this.trackEvent('user_initialized', {
          userNumber,
          isEarlyAdopter: userData.isEarlyAdopter
        });
        
        return { uid: user.uid, userNumber };
      } else {
        // Existing user - update last active using setDoc with merge
        await setDoc(userDocRef, {
          lastActiveDate: serverTimestamp()
        }, { merge: true });
        
        return { 
          uid: user.uid, 
          userNumber: userDoc.data().userNumber 
        };
      }
    } catch (error) {
      console.error('Error initializing anonymous user:', error);
      throw error;
    }
  }

  /**
   * Link anonymous account with email
   */
  async linkAnonymousAccount(email: string, password: string): Promise<void> {
    if (!this.currentUser || !this.currentUser.isAnonymous) {
      throw new Error('No anonymous user to link');
    }
    
    try {
      // Create email credential
      const credential = EmailAuthProvider.credential(email, password);
      
      // Link with anonymous account
      await linkWithCredential(this.currentUser, credential);
      
      // Update user document
      const userDocRef = doc(this.db, 'users', this.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as FirebaseUserData;
        
        // Update with account info using setDoc with merge
        await setDoc(userDocRef, {
          isAnonymous: false,
          hasAccount: true,
          email,
          accountCreatedDate: serverTimestamp(),
          // Early adopters get permanent Tier 5
          currentTier: userData.isEarlyAdopter ? 5 : userData.currentTier,
          lockedTier: userData.isEarlyAdopter ? 5 : userData.lockedTier
        }, { merge: true });
        
        // Track conversion
        this.trackEvent('account_created', {
          userNumber: userData.userNumber,
          isEarlyAdopter: userData.isEarlyAdopter,
          daysAfterInstall: this.daysSinceInstall(userData.installDate)
        });
      }
    } catch (error) {
      console.error('Error linking account:', error);
      throw error;
    }
  }

  /**
   * Get global user count
   */
  async getGlobalUserCount(): Promise<number> {
    try {
      const statsDoc = await getDoc(doc(this.db, 'stats', 'global'));
      if (statsDoc.exists()) {
        this.globalUserCount = statsDoc.data().totalUsers || 0;
        return this.globalUserCount;
      }
      return 0;
    } catch (error) {
      console.error('Error getting global user count:', error);
      return 0;
    }
  }

  /**
   * Get and increment global user count (atomic operation)
   */
  private async getAndIncrementGlobalUserCount(): Promise<number> {
    try {
      // Use Cloud Function for atomic increment
      const incrementUserCount = httpsCallable(this.functions, 'incrementUserCount');
      const result = await incrementUserCount();
      return (result.data as IncrementUserCountResponse).userNumber;
    } catch (error) {
      console.error('Error incrementing user count:', error);
      // Fallback to client-side increment (less reliable)
      const statsRef = doc(this.db, 'stats', 'global');
      await setDoc(statsRef, {
        totalUsers: increment(1)
      }, { merge: true });
      return await this.getGlobalUserCount();
    }
  }

  /**
   * Update user tier based on global count
   */
  async updateUserTier(uid: string): Promise<number> {
    const userDocRef = doc(this.db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return 1;
    }
    
    const userData = userDoc.data() as FirebaseUserData;
    const globalCount = await this.getGlobalUserCount();
    
    // Calculate new tier
    let newTier = userData.currentTier;
    
    if (userData.isEarlyAdopter && userData.hasAccount) {
      // Early adopters with accounts always get Tier 5
      newTier = 5;
    } else if (userData.isEarlyAdopter && !userData.hasAccount) {
      // Apply tier reduction schedule
      newTier = this.calculateReducedTier(globalCount);
    } else if (userData.hasAccount) {
      // Regular users with accounts
      newTier = this.calculateAccountTier(globalCount);
    } else {
      // Regular users without accounts
      newTier = this.calculateDefaultTier(globalCount);
    }
    
    // Update if changed
    if (newTier !== userData.currentTier) {
      await setDoc(userDocRef, {
        currentTier: newTier,
        lastActiveDate: serverTimestamp()
      }, { merge: true });
    }
    
    return newTier;
  }

  /**
   * Track analytics event
   */
  private async trackEvent(eventName: string, data: any): Promise<void> {
    try {
      const trackEvent = httpsCallable(this.functions, 'trackAnalytics');
      await trackEvent({
        event: eventName,
        data,
        timestamp: new Date().toISOString(),
        uid: this.currentUser?.uid
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  /**
   * Cleanup old anonymous accounts (runs periodically)
   */
  private async cleanupOldAnonymousAccounts(): Promise<void> {
    try {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      // Query old anonymous accounts
      const usersRef = collection(this.db, 'users');
      const q = query(
        usersRef,
        where('isAnonymous', '==', true),
        where('lastActiveDate', '<', Timestamp.fromDate(threeMonthsAgo))
      );
      
      const querySnapshot = await getDocs(q);
      
      // Delete old accounts
      const deletePromises = querySnapshot.docs.map(async (doc) => {
        // Delete from Auth
        try {
          const deleteAnonymousUser = httpsCallable(this.functions, 'deleteAnonymousUser');
          await deleteAnonymousUser({ uid: doc.id });
        } catch (error) {
          console.error(`Error deleting auth user ${doc.id}:`, error);
        }
        
        // Delete from Firestore
        await deleteDoc(doc.ref);
      });
      
      await Promise.all(deletePromises);
      
      console.log(`Cleaned up ${querySnapshot.size} old anonymous accounts`);
    } catch (error) {
      console.error('Error cleaning up old accounts:', error);
    }
  }

  /**
   * Initialize auth state listener
   */
  private initializeAuthListener(): void {
    onAuthStateChanged(this.auth, async (user) => {
      this.currentUser = user;
      
      if (user) {
        // Check if document exists before updating
        const userDocRef = doc(this.db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          // Update last active only if document exists
          setDoc(userDocRef, {
            lastActiveDate: serverTimestamp()
          }, { merge: true }).catch(console.error);
        } else {
          console.log('User document does not exist yet, skipping lastActiveDate update');
        }
      }
    });
  }

  /**
   * Start cleanup scheduler
   */
  private startCleanupScheduler(): void {
    // Run cleanup once a day
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldAnonymousAccounts();
    }, 24 * 60 * 60 * 1000); // 24 hours
    
    // Also run on initialization
    setTimeout(() => {
      this.cleanupOldAnonymousAccounts();
    }, 60000); // After 1 minute
  }

  /**
   * Helper methods
   */
  
  private calculateReducedTier(globalCount: number): number {
    if (globalCount < 110000) return 5;
    if (globalCount < 125000) return 4;
    if (globalCount < 150000) return 3;
    if (globalCount < 200000) return 2;
    return 1;
  }
  
  private calculateAccountTier(globalCount: number): number {
    if (globalCount <= 100000) return 5;
    if (globalCount <= 250000) return 5;
    if (globalCount <= 500000) return 4;
    return 3;
  }
  
  private calculateDefaultTier(globalCount: number): number {
    if (globalCount <= 100000) return 5;
    if (globalCount <= 250000) return 3;
    if (globalCount <= 500000) return 2;
    return 1;
  }
  
  private daysSinceInstall(installDate: Timestamp): number {
    const install = installDate.toDate();
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - install.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get user status for display
   */
  async getUserStatus(uid: string): Promise<EarlyAdopterStatus | null> {
    try {
      const userDoc = await getDoc(doc(this.db, 'users', uid));
      
      if (!userDoc.exists()) {
        return null;
      }
      
      const data = userDoc.data() as FirebaseUserData;
      
      return {
        isEarlyAdopter: data.isEarlyAdopter,
        userId: data.uid,
        installDate: data.installDate.toDate().toISOString(),
        userNumber: data.userNumber,
        hasAccount: data.hasAccount,
        accountCreatedDate: data.accountCreatedDate?.toDate().toISOString(),
        currentTier: data.currentTier,
        lockedTier: data.lockedTier,
        benefits: this.getBenefitsForTier(data.currentTier)
      };
    } catch (error) {
      console.error('Error getting user status:', error);
      return null;
    }
  }
  
  private getBenefitsForTier(tier: number): string[] {
    const benefits = {
      1: ['Basic ad blocking', 'Cookie consent blocking'],
      2: ['Everything in Tier 1', 'YouTube ad blocking', 'Social media tracker blocking'],
      3: ['Everything in Tier 2', 'Custom filters', 'Element picker', 'Whitelist management'],
      4: ['Everything in Tier 3', 'Advanced privacy protection', 'Regex patterns', 'Cloud sync'],
      5: ['Everything in Tier 4', 'AI-powered blocking', 'Premium support', 'All future features']
    };
    
    return benefits[tier as keyof typeof benefits] || [];
  }

  /**
   * Cleanup on extension uninstall
   */
  async cleanup(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Sign out
    await this.auth.signOut();
  }
}

export const firebaseUserTracking = FirebaseUserTrackingService.getInstance();