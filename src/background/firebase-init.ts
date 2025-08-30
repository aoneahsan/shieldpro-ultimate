/**
 * Firebase Initialization for Service Worker
 * Separate initialization to avoid circular dependencies
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';

// Firebase configuration - hardcoded for service worker context
const firebaseConfig = {
  apiKey: "AIzaSyAKH9rJINZ1ptHK9JIrpZHmzfWx26DSlpA",
  authDomain: "shieldpro-ultimate.firebaseapp.com",
  projectId: "shieldpro-ultimate",
  storageBucket: "shieldpro-ultimate.firebasestorage.app",
  messagingSenderId: "370056444326",
  appId: "1:370056444326:web:366f19018c9797c723b767"
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