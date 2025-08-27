import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  onAuthStateChanged,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  FacebookAuthProvider,
  GithubAuthProvider
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  increment,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, firestore as db } from '../utils/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  tier: {
    level: 1 | 2 | 3 | 4 | 5;
    name: 'Basic' | 'Enhanced' | 'Professional' | 'Premium' | 'Ultimate';
    unlockedAt: number;
    progress: number;
  };
  stats: {
    totalBlocked: number;
    joinedAt: number;
    lastActive: number;
    referralCode: string;
    referredBy?: string;
    referralCount: number;
    weeklyEngagement: number[];
  };
  preferences: {
    notifications: boolean;
    autoUpdate: boolean;
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
  subscription?: {
    active: boolean;
    plan: string;
    expiresAt?: number;
  };
}

class AuthService {
  private currentUser: User | null = null;
  private userProfile: UserProfile | null = null;

  constructor() {
    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      if (user) {
        await this.loadUserProfile(user.uid);
      } else {
        this.userProfile = null;
      }
    });
  }

  // Generate unique referral code
  private generateReferralCode(uid: string): string {
    const prefix = uid.substring(0, 4).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${random}`;
  }

  // Check if referral code exists
  private async isReferralCodeUnique(code: string): Promise<boolean> {
    const q = query(collection(db, 'users'), where('stats.referralCode', '==', code));
    const snapshot = await getDocs(q);
    return snapshot.empty;
  }

  // Create user profile in Firestore
  private async createUserProfile(user: User, referralCode?: string): Promise<void> {
    let uniqueReferralCode = this.generateReferralCode(user.uid);
    
    // Ensure referral code is unique
    while (!(await this.isReferralCodeUnique(uniqueReferralCode))) {
      uniqueReferralCode = this.generateReferralCode(user.uid);
    }

    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName: user.displayName || undefined,
      photoURL: user.photoURL || undefined,
      tier: {
        level: 1,
        name: 'Basic',
        unlockedAt: Date.now(),
        progress: 0
      },
      stats: {
        totalBlocked: 0,
        joinedAt: Date.now(),
        lastActive: Date.now(),
        referralCode: uniqueReferralCode,
        referredBy: referralCode,
        referralCount: 0,
        weeklyEngagement: [0]
      },
      preferences: {
        notifications: true,
        autoUpdate: true,
        theme: 'system',
        language: navigator.language || 'en'
      }
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);

    // If referred by someone, update referrer's count
    if (referralCode) {
      await this.updateReferrerCount(referralCode);
    }

    this.userProfile = userProfile;
  }

  // Update referrer's count and check for tier upgrade
  private async updateReferrerCount(referralCode: string): Promise<void> {
    const q = query(collection(db, 'users'), where('stats.referralCode', '==', referralCode));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty && snapshot.docs[0]) {
      const referrerDoc = snapshot.docs[0];
      const referrerId = referrerDoc.id;
      const referrerData = referrerDoc.data() as UserProfile;
      
      await updateDoc(doc(db, 'users', referrerId), {
        'stats.referralCount': increment(1),
        'stats.lastActive': serverTimestamp()
      });

      // Check if referrer qualifies for Tier 4 (30 referrals)
      if (referrerData.stats.referralCount + 1 >= 30 && referrerData.tier.level < 4) {
        await this.upgradeTier(referrerId, 4);
      }
    }
  }

  // Load user profile from Firestore
  private async loadUserProfile(uid: string): Promise<void> {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      this.userProfile = docSnap.data() as UserProfile;
      
      // Update last active
      await updateDoc(docRef, {
        'stats.lastActive': serverTimestamp()
      });
    }
  }

  // Sign up with email and password
  async signUp(email: string, password: string, displayName?: string, referralCode?: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (displayName) {
        await updateProfile(user, { displayName });
      }

      await this.createUserProfile(user, referralCode);
      await sendEmailVerification(user);

      // Automatically upgrade to Tier 2 upon account creation
      await this.upgradeTier(user.uid, 2);

      return user;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Sign in with Google
  async signInWithGoogle(): Promise<User> {
    return this.signInWithSocial('google');
  }

  // Social sign in
  async signInWithSocial(provider: 'google' | 'facebook' | 'github'): Promise<User> {
    try {
      let authProvider;
      switch (provider) {
        case 'google':
          authProvider = new GoogleAuthProvider();
          break;
        case 'facebook':
          authProvider = new FacebookAuthProvider();
          break;
        case 'github':
          authProvider = new GithubAuthProvider();
          break;
        default:
          throw new Error('Invalid provider');
      }

      const userCredential = await signInWithPopup(auth, authProvider);
      const user = userCredential.user;

      // Check if user profile exists
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        await this.createUserProfile(user);
        // Automatically upgrade to Tier 2 for social sign-ups
        await this.upgradeTier(user.uid, 2);
      }

      return user;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
      this.currentUser = null;
      this.userProfile = null;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Reset password
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Update user profile
  async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    if (!this.currentUser) throw new Error('No user logged in');

    const docRef = doc(db, 'users', this.currentUser.uid);
    await updateDoc(docRef, {
      ...updates,
      'stats.lastActive': serverTimestamp()
    });

    // Reload profile
    await this.loadUserProfile(this.currentUser.uid);
  }

  // Upgrade user tier
  async upgradeTier(uid: string, newTier: 1 | 2 | 3 | 4 | 5): Promise<void> {
    const tierNames = {
      1: 'Basic',
      2: 'Enhanced',
      3: 'Professional',
      4: 'Premium',
      5: 'Ultimate'
    };

    const tierProgress = {
      1: 0,
      2: 20,
      3: 40,
      4: 60,
      5: 80
    };

    await updateDoc(doc(db, 'users', uid), {
      'tier.level': newTier,
      'tier.name': tierNames[newTier],
      'tier.unlockedAt': Date.now(),
      'tier.progress': tierProgress[newTier]
    });

    // Send message to extension to update rules
    if (chrome?.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ 
        action: 'tierUpgraded', 
        tier: newTier 
      });
    }
  }

  // Check and update weekly engagement for Tier 5
  async updateWeeklyEngagement(uid: string): Promise<void> {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) return;

    const userData = userDoc.data() as UserProfile;
    const weeklyEngagement = userData.stats.weeklyEngagement || [];
    const today = new Date().getDay();
    
    // Reset weekly engagement array if it's a new week
    if (weeklyEngagement.length > 7) {
      weeklyEngagement.splice(0, weeklyEngagement.length - 7);
    }

    // Mark today as engaged
    if (!weeklyEngagement.includes(today)) {
      weeklyEngagement.push(today);
    }

    await updateDoc(doc(db, 'users', uid), {
      'stats.weeklyEngagement': weeklyEngagement,
      'stats.lastActive': serverTimestamp()
    });

    // Check if user maintains Tier 5 (7 days of engagement)
    if (userData.tier.level === 5 && weeklyEngagement.length < 7) {
      // Downgrade to Tier 4 if not maintaining engagement
      await this.upgradeTier(uid, 4);
    } else if (userData.tier.level === 4 && weeklyEngagement.length === 7) {
      // Upgrade to Tier 5 if maintaining full week engagement
      await this.upgradeTier(uid, 5);
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Get user profile
  getUserProfile(): UserProfile | null {
    return this.userProfile;
  }

  // Check if user is logged in
  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  // Get user tier
  getUserTier(): number {
    return this.userProfile?.tier.level || 1;
  }
}

export default new AuthService();