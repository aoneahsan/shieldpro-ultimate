/**
 * Firebase Initialization for Service Worker
 * Separate initialization to avoid circular dependencies
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';

// Firebase configuration from environment
// These values should be loaded from chrome.storage or injected at build time
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || '',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.FIREBASE_APP_ID || ''
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;
let functions: Functions | null = null;
let initialized = false;

/**
 * Initialize Firebase services
 */
export function initializeFirebase() {
  if (initialized) {
    return { app, auth, firestore, functions };
  }

  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    firestore = getFirestore(app);
    functions = getFunctions(app);
    initialized = true;
    console.log('Firebase initialized in service worker');
  } catch (error) {
    console.error('Firebase initialization error in service worker:', error);
    // Try to get existing instances if already initialized
    try {
      auth = getAuth();
      firestore = getFirestore();
      functions = getFunctions();
      initialized = true;
    } catch (fallbackError) {
      console.error('Failed to get existing Firebase instances:', fallbackError);
    }
  }

  return { app, auth, firestore, functions };
}

/**
 * Get Firebase services (initializes if needed)
 */
export function getFirebaseServices() {
  if (!initialized) {
    initializeFirebase();
  }
  return { app, auth, firestore, functions };
}

// Export for direct access if needed
export { app, auth, firestore, functions };