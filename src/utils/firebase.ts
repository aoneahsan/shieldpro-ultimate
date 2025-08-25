/**
 * Firebase Configuration and Initialization
 * Central place for Firebase setup and utilities
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  linkWithCredential,
  EmailAuthProvider,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore,
  connectFirestoreEmulator,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { 
  getFunctions, 
  Functions,
  connectFunctionsEmulator,
  httpsCallable
} from 'firebase/functions';
import { 
  getStorage, 
  Storage,
  connectStorageEmulator
} from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let functions: Functions;
let storage: Storage;

// Check if Firebase is already initialized
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  firestore = getFirestore(app);
  functions = getFunctions(app);
  storage = getStorage(app);
} catch (error) {
  console.error('Firebase initialization error:', error);
  // If already initialized, get the existing instances
  auth = getAuth();
  firestore = getFirestore();
  functions = getFunctions();
  storage = getStorage();
}

// Connect to emulators if in development and enabled
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    connectFirestoreEmulator(firestore, 'localhost', 8080);
    connectFunctionsEmulator(functions, 'localhost', 5001);
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('Connected to Firebase emulators');
  } catch (error) {
    // Already connected to emulators
    console.log('Firebase emulators already connected');
  }
}

// Export Firebase instances
export { app, auth, firestore, functions, storage };

// Export Firebase types
export type { User, FirebaseApp, Auth, Firestore, Functions, Storage };

// Export commonly used Firebase functions
export {
  // Auth functions
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  linkWithCredential,
  EmailAuthProvider,
  
  // Firestore functions
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  Timestamp,
  
  // Functions
  httpsCallable
};

/**
 * Helper function to get current user
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Helper function to check if user is anonymous
 */
export const isAnonymousUser = (user: User | null): boolean => {
  return user?.isAnonymous ?? false;
};

/**
 * Helper function to check if user has verified email
 */
export const hasVerifiedEmail = (user: User | null): boolean => {
  return user?.emailVerified ?? false;
};

/**
 * Firebase error codes for better error handling
 */
export const FirebaseErrorCode = {
  // Auth errors
  EMAIL_ALREADY_IN_USE: 'auth/email-already-in-use',
  INVALID_EMAIL: 'auth/invalid-email',
  USER_NOT_FOUND: 'auth/user-not-found',
  WRONG_PASSWORD: 'auth/wrong-password',
  WEAK_PASSWORD: 'auth/weak-password',
  NETWORK_REQUEST_FAILED: 'auth/network-request-failed',
  TOO_MANY_REQUESTS: 'auth/too-many-requests',
  USER_DISABLED: 'auth/user-disabled',
  
  // Firestore errors
  PERMISSION_DENIED: 'permission-denied',
  NOT_FOUND: 'not-found',
  ALREADY_EXISTS: 'already-exists',
  RESOURCE_EXHAUSTED: 'resource-exhausted',
  FAILED_PRECONDITION: 'failed-precondition',
  ABORTED: 'aborted',
  OUT_OF_RANGE: 'out-of-range',
  UNIMPLEMENTED: 'unimplemented',
  INTERNAL: 'internal',
  UNAVAILABLE: 'unavailable',
  DATA_LOSS: 'data-loss',
  UNAUTHENTICATED: 'unauthenticated'
} as const;

/**
 * Helper function to handle Firebase errors
 */
export const handleFirebaseError = (error: any): string => {
  const code = error?.code || error?.message || 'unknown-error';
  
  const errorMessages: Record<string, string> = {
    [FirebaseErrorCode.EMAIL_ALREADY_IN_USE]: 'This email is already registered',
    [FirebaseErrorCode.INVALID_EMAIL]: 'Invalid email address',
    [FirebaseErrorCode.USER_NOT_FOUND]: 'No account found with this email',
    [FirebaseErrorCode.WRONG_PASSWORD]: 'Incorrect password',
    [FirebaseErrorCode.WEAK_PASSWORD]: 'Password should be at least 6 characters',
    [FirebaseErrorCode.NETWORK_REQUEST_FAILED]: 'Network error. Please check your connection',
    [FirebaseErrorCode.TOO_MANY_REQUESTS]: 'Too many attempts. Please try again later',
    [FirebaseErrorCode.USER_DISABLED]: 'This account has been disabled',
    [FirebaseErrorCode.PERMISSION_DENIED]: 'You don\'t have permission to perform this action',
    [FirebaseErrorCode.NOT_FOUND]: 'Requested resource not found',
    [FirebaseErrorCode.UNAUTHENTICATED]: 'Please sign in to continue'
  };
  
  return errorMessages[code] || `An error occurred: ${code}`;
};

/**
 * Cloud Functions callable references
 */
export const cloudFunctions = {
  // User tracking functions
  incrementUserCount: httpsCallable(functions, 'incrementUserCount'),
  deleteAnonymousUser: httpsCallable(functions, 'deleteAnonymousUser'),
  trackAnalytics: httpsCallable(functions, 'trackAnalytics'),
  getGlobalStats: httpsCallable(functions, 'getGlobalStats'),
  
  // Tier management functions  
  checkTierUpgrade: httpsCallable(functions, 'checkTierUpgrade'),
  trackDailyEngagement: httpsCallable(functions, 'trackDailyEngagement'),
  getTierProgress: httpsCallable(functions, 'getTierProgress'),
  
  // Referral functions
  processReferral: httpsCallable(functions, 'processReferral'),
  
  // Stats functions
  updateBlockingStats: httpsCallable(functions, 'updateBlockingStats'),
  getUserStatistics: httpsCallable(functions, 'getUserStatistics'),
  
  // Data export functions
  exportUserData: httpsCallable(functions, 'exportUserData')
};

/**
 * Initialize Firebase Auth state listener
 */
export const initAuthListener = (callback: (user: User | null) => void) => {
  return auth.onAuthStateChanged(callback);
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// Export default Firebase app
export default app;