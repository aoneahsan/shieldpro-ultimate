/**
 * Firebase Service
 * Handles all Firebase operations including auth, Firestore, and cloud functions
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  Timestamp,
  serverTimestamp,
  increment,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { auth, firestore as db } from '../utils/firebase';
import { User } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  tier: {
    level: number;
    name: string;
    unlockedAt: Timestamp;
    progress: number;
  };
  referralCode: string;
  referralCount: number;
  referredBy?: string;
  settings: {
    syncEnabled: boolean;
    notifications: boolean;
    theme: 'light' | 'dark' | 'auto';
    language: string;
  };
  stats: {
    totalBlocked: number;
    installDate: Timestamp;
    lastActive: Timestamp;
    weeklyEngagement: Record<string, boolean>;
  };
  subscription?: {
    status: 'active' | 'cancelled' | 'expired';
    plan: 'free' | 'pro' | 'ultimate';
    expiresAt?: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ReferralData {
  code: string;
  userId: string;
  usedBy: string[];
  createdAt: Timestamp;
}

class FirebaseService {
  private userProfileListener: Unsubscribe | null = null;
  private currentUser: User | null = null;

  constructor() {
    // Listen to auth state changes
    auth.onAuthStateChanged((user) => {
      this.currentUser = user;
      if (user) {
        this.setupUserProfileListener(user.uid);
      } else {
        this.cleanupListeners();
      }
    });
  }

  /**
   * Create or update user profile
   */
  async createUserProfile(user: User): Promise<UserProfile> {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // Update last active using setDoc with merge
        await setDoc(userRef, {
          stats: {
            lastActive: serverTimestamp()
          },
          updatedAt: serverTimestamp()
        }, { merge: true });
        return userSnap.data() as UserProfile;
      }

    // Create new profile
    const referralCode = this.generateReferralCode(user.uid);
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName: user.displayName || undefined,
      photoURL: user.photoURL || undefined,
      tier: {
        level: 2, // Tier 2 automatically unlocked on account creation
        name: 'Enhanced',
        unlockedAt: Timestamp.now(),
        progress: 20
      },
      referralCode,
      referralCount: 0,
      settings: {
        syncEnabled: true,
        notifications: true,
        theme: 'auto',
        language: 'en'
      },
      stats: {
        totalBlocked: 0,
        installDate: Timestamp.now(),
        lastActive: Timestamp.now(),
        weeklyEngagement: {}
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

      await setDoc(userRef, newProfile);

      // Create referral document
      await setDoc(doc(db, 'referrals', referralCode), {
        code: referralCode,
        userId: user.uid,
        usedBy: [],
        createdAt: Timestamp.now()
      });

      return newProfile;
    } catch (error: any) {
      console.error('Error creating user profile:', error);
      // Return a minimal profile on error
      return {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || undefined,
        photoURL: user.photoURL || undefined,
        tier: {
          level: 1,
          name: 'Basic',
          unlockedAt: Timestamp.now(),
          progress: 0
        },
        referralCode: '',
        referralCount: 0,
        settings: {
          syncEnabled: false,
          notifications: false,
          theme: 'auto',
          language: 'en'
        },
        stats: {
          totalBlocked: 0,
          installDate: Timestamp.now(),
          lastActive: Timestamp.now(),
          weeklyEngagement: {}
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data() as UserProfile;
      }
      return null;
    } catch (error: any) {
      // Handle permission errors gracefully
      if (error?.code === 'permission-denied') {
        console.log('Permission denied accessing user profile. User may need to sign in.');
        return null;
      }
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, 'users', uid);
    // Use setDoc with merge to handle non-existent documents
    await setDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  /**
   * Check and update tier based on profile completion
   */
  async checkTier3Eligibility(uid: string): Promise<boolean> {
    const profile = await this.getUserProfile(uid);
    if (!profile) return false;

    // Check if profile is complete
    const isComplete = 
      profile.displayName && 
      profile.photoURL && 
      profile.settings.notifications !== undefined &&
      profile.settings.theme &&
      profile.settings.language;

    if (isComplete && profile.tier.level < 3) {
      // Upgrade to Tier 3
      await this.updateUserProfile(uid, {
        tier: {
          level: 3,
          name: 'Professional',
          unlockedAt: Timestamp.now(),
          progress: 40
        }
      });
      return true;
    }

    return isComplete;
  }

  /**
   * Apply referral code
   */
  async applyReferralCode(userId: string, referralCode: string): Promise<boolean> {
    try {
      // Check if code exists
      const referralRef = doc(db, 'referrals', referralCode);
      const referralSnap = await getDoc(referralRef);

      if (!referralSnap.exists()) {
        throw new Error('Invalid referral code');
      }

      const referralData = referralSnap.data() as ReferralData;

      // Check if already used by this user
      if (referralData.usedBy.includes(userId)) {
        throw new Error('Referral code already used');
      }

      // Check if it's their own code
      if (referralData.userId === userId) {
        throw new Error('Cannot use your own referral code');
      }

      // Apply referral using setDoc with merge
      await setDoc(referralRef, {
        usedBy: [...referralData.usedBy, userId]
      }, { merge: true });

      // Update referrer's count using setDoc with merge
      const referrerRef = doc(db, 'users', referralData.userId);
      await setDoc(referrerRef, {
        referralCount: increment(1),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Update user's referredBy
      await this.updateUserProfile(userId, {
        referredBy: referralData.userId
      });

      // Check if referrer reached Tier 4 (30 referrals)
      const referrerProfile = await this.getUserProfile(referralData.userId);
      if (referrerProfile && referrerProfile.referralCount >= 30 && referrerProfile.tier.level < 4) {
        await this.updateUserProfile(referralData.userId, {
          tier: {
            level: 4,
            name: 'Premium',
            unlockedAt: Timestamp.now(),
            progress: 60
          }
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to apply referral code:', error);
      return false;
    }
  }

  /**
   * Update weekly engagement for Tier 5
   */
  async updateWeeklyEngagement(uid: string): Promise<void> {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const profile = await this.getUserProfile(uid);
    
    if (!profile) {
      console.log('User profile does not exist, skipping weekly engagement update');
      return;
    }

    const weeklyEngagement = profile.stats.weeklyEngagement || {};
    weeklyEngagement[today] = true;

    // Use setDoc with merge to handle non-existent documents
    await setDoc(doc(db, 'users', uid), {
      stats: {
        weeklyEngagement: {
          [today]: true
        },
        lastActive: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    }, { merge: true });

    // Check for Tier 5 eligibility
    const daysActive = Object.values(weeklyEngagement).filter(Boolean).length;
    if (daysActive >= 7 && profile.tier.level === 4) {
      await this.updateUserProfile(uid, {
        tier: {
          level: 5,
          name: 'Ultimate',
          unlockedAt: Timestamp.now(),
          progress: 100
        }
      });
    }
  }

  /**
   * Sync extension settings
   */
  async syncSettings(uid: string, settings: any): Promise<void> {
    // Use setDoc with merge to handle non-existent documents
    await setDoc(doc(db, 'users', uid), {
      extensionSettings: settings,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  /**
   * Get synced settings
   */
  async getSyncedSettings(uid: string): Promise<any> {
    const profile = await this.getUserProfile(uid);
    return profile ? (profile as any).extensionSettings : null;
  }

  /**
   * Generate unique referral code
   */
  private generateReferralCode(uid: string): string {
    const prefix = uid.substring(0, 4).toUpperCase();
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${suffix}`;
  }

  /**
   * Setup real-time listener for user profile
   */
  private setupUserProfileListener(uid: string): void {
    this.cleanupListeners();

    const userRef = doc(db, 'users', uid);
    this.userProfileListener = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const profile = doc.data() as UserProfile;
        // Notify extension about profile changes
        chrome.runtime.sendMessage({
          type: 'PROFILE_UPDATED',
          data: profile
        }).catch(() => {
          // Ignore if no listeners
        });
      }
    });
  }

  /**
   * Cleanup listeners
   */
  private cleanupListeners(): void {
    if (this.userProfileListener) {
      this.userProfileListener();
      this.userProfileListener = null;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.currentUser;
  }
}

// Export singleton instance
export const firebaseService = new FirebaseService();
export default firebaseService;