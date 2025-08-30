import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  User,
  onAuthStateChanged,
  sendEmailVerification,
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
  getDocs,
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
  private authInitialized: boolean = false;
  private authStatePromise: Promise<void>;
  private authStateResolve: (() => void) | null = null;
  private isSigningOut: boolean = false;

  constructor() {
    // Create a promise that resolves when auth state is first loaded
    this.authStatePromise = new Promise((resolve) => {
      this.authStateResolve = resolve;
    });

    // Check if we have a logout flag in storage
    this.initializeAuthListener();
  }

  private async initializeAuthListener() {
    // Check if we're supposed to be logged out
    try {
      if (chrome?.storage?.local) {
        const { forceLoggedOut } = await chrome.storage.local.get('forceLoggedOut');
        if (forceLoggedOut) {
          // Clear the flag and don't set up auth listener
          await chrome.storage.local.remove('forceLoggedOut');
          this.currentUser = null;
          this.userProfile = null;
          this.authInitialized = true;
          if (this.authStateResolve) {
            this.authStateResolve();
          }
          return;
        }
      }
    } catch {
      console.error('Error checking logout flag:', error);
    }

    onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.email || 'null', 'isSigningOut:', this.isSigningOut);

      // If we're signing out, ignore any auth state changes
      if (this.isSigningOut) {
        console.log('Ignoring auth state change during sign out');
        return;
      }

      this.currentUser = user;
      if (user) {
        await this.loadUserProfile(user.uid);
        // Cache the auth state
        await this.cacheAuthState(user, this.userProfile);
      } else {
        this.userProfile = null;
        // Clear cached auth state
        await this.clearAuthCache();
      }

      // Mark as initialized and resolve the promise
      if (!this.authInitialized) {
        this.authInitialized = true;
        if (this.authStateResolve) {
          this.authStateResolve();
        }
      }
    });
  }

  // Wait for auth to be initialized
  async waitForAuth(): Promise<void> {
    return this.authStatePromise;
  }

  // Cache auth state for instant loading
  private async cacheAuthState(user: User | null, profile: UserProfile | null): Promise<void> {
    try {
      if (chrome?.storage?.local) {
        await chrome.storage.local.set({
          authUser: user
            ? {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
              }
            : null,
          authProfile: profile,
        });
      }
    } catch {
      console.error('Failed to cache auth state:', error);
    }
  }

  // Clear auth cache
  private async clearAuthCache(): Promise<void> {
    try {
      if (chrome?.storage?.local) {
        await chrome.storage.local.remove(['authUser', 'authProfile']);
      }
    } catch {
      console.error('Failed to clear auth cache:', error);
    }
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
  private async createUserProfileInternal(user: User, referralCode?: string): Promise<void> {
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
        progress: 0,
      },
      stats: {
        totalBlocked: 0,
        joinedAt: Date.now(),
        lastActive: Date.now(),
        referralCode: uniqueReferralCode,
        referredBy: referralCode,
        referralCount: 0,
        weeklyEngagement: [0],
      },
      preferences: {
        notifications: true,
        autoUpdate: true,
        theme: 'system',
        language: navigator.language || 'en',
      },
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
        'stats.lastActive': serverTimestamp(),
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
        'stats.lastActive': serverTimestamp(),
      });
    }
  }

  // Sign up with email and password
  async signUp(
    email: string,
    password: string,
    displayName?: string,
    referralCode?: string
  ): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (displayName) {
        await updateProfile(user, { displayName });
      }

      await this.createUserProfileInternal(user, referralCode);
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

  // Sign in with Google - Not available in extension context
  async signInWithGoogle(): Promise<User> {
    // In Chrome extension context, this should be handled via message passing
    // to the background script which uses Chrome Identity API
    throw new Error(
      'Google Sign-In must be handled through the background script in Chrome extensions'
    );
  }

  // Social sign in - Not available in extension context
  async signInWithSocial(provider: 'google' | 'facebook' | 'github'): Promise<User> {
    // In Chrome extension context, social sign-in should be handled via message passing
    // to the background script which uses Chrome Identity API
    throw new Error(
      'Social sign-in must be handled through the background script in Chrome extensions'
    );
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      console.log('AuthService: Starting sign out');
      // Set flag to prevent auth state reload
      this.isSigningOut = true;

      // Clear local state immediately
      this.currentUser = null;
      this.userProfile = null;

      // Clear the cache immediately
      await this.clearAuthCache();
      console.log('AuthService: Cleared auth cache');

      // Set a flag to prevent auth reload on next popup open
      if (chrome?.storage?.local) {
        await chrome.storage.local.set({ forceLoggedOut: true });
        // Remove it after a delay
        setTimeout(async () => {
          try {
            await chrome.storage.local.remove('forceLoggedOut');
          } catch {
            console.error('Error removing logout flag:', error);
          }
        }, 5000);
      }

      // Using the imported signOut function from Firebase
      await firebaseSignOut(auth);
      console.log('AuthService: Firebase sign out complete');

      // Keep the flag set for longer to ensure state doesn't reload
      setTimeout(() => {
        this.isSigningOut = false;
      }, 2000);
    } catch (error: any) {
      console.error('Sign out error:', error);
      this.isSigningOut = false;
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
      'stats.lastActive': serverTimestamp(),
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
      5: 'Ultimate',
    };

    const tierProgress = {
      1: 0,
      2: 20,
      3: 40,
      4: 60,
      5: 80,
    };

    // Check if document exists first
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      await updateDoc(userRef, {
        'tier.level': newTier,
        'tier.name': tierNames[newTier],
        'tier.unlockedAt': Date.now(),
        'tier.progress': tierProgress[newTier],
      });
    } else {
      // Create a basic user profile if it doesn't exist
      const userProfile: UserProfile = {
        uid,
        email: '',
        tier: {
          level: newTier,
          name: tierNames[newTier],
          unlockedAt: Date.now(),
          progress: tierProgress[newTier],
        },
        stats: {
          totalBlocked: 0,
          joinedAt: Date.now(),
          lastActive: Date.now(),
          referralCode: this.generateReferralCode(uid),
          referralCount: 0,
          weeklyEngagement: [0],
        },
        preferences: {
          notifications: true,
          autoUpdate: true,
          theme: 'system',
          language: navigator.language || 'en',
        },
      };
      await setDoc(userRef, userProfile);
    }

    // Send message to extension to update rules
    if (chrome?.runtime?.sendMessage) {
      chrome.runtime.sendMessage({
        action: 'tierUpgraded',
        tier: newTier,
      });
    }
  }

  // Check and update weekly engagement for Tier 5
  async updateWeeklyEngagement(uid: string): Promise<void> {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.log('User document does not exist, skipping weekly engagement update');
      return;
    }

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

    await updateDoc(userRef, {
      'stats.weeklyEngagement': weeklyEngagement,
      'stats.lastActive': serverTimestamp(),
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

  // Public wrapper for createUserProfile
  async createUserProfile(user: User, referralCode?: string): Promise<void> {
    return this.createUserProfileInternal(user, referralCode);
  }

  // Ensure user profile exists
  async ensureUserProfile(user: User): Promise<void> {
    if (!user) return;

    // Check if profile exists
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // Create profile if it doesn't exist
      await this.createUserProfileInternal(user);
    } else {
      // Load existing profile
      await this.loadUserProfile(user.uid);
    }
  }

  // Check if user is logged in
  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  // Check if auth state has been initialized
  isAuthInitialized(): boolean {
    return this.authInitialized;
  }

  // Get user tier
  getUserTier(): number {
    return this.userProfile?.tier.level || 1;
  }

  // Delete user account
  async deleteAccount(): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    try {
      // Delete the user account
      await deleteUser(this.currentUser);

      // Clear local data
      this.currentUser = null;
      this.userProfile = null;

      // Clear chrome storage
      await chrome.storage.local.clear();
    } catch {
      console.error('Failed to delete account:', error);
      throw error;
    }
  }
}

export default new AuthService();
