import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);

// Initialize Analytics conditionally (not available in extension context)
export const initAnalytics = async () => {
  const supported = await isSupported();
  if (supported) {
    return getAnalytics(app);
  }
  return null;
};

// Connect to emulators if in development
if (process.env.USE_FIREBASE_EMULATOR === 'true' && process.env.NODE_ENV === 'development') {
  connectAuthEmulator(auth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099'}`);
  connectFirestoreEmulator(db, 
    process.env.FIREBASE_FIRESTORE_EMULATOR_HOST?.split(':')[0] || 'localhost',
    parseInt(process.env.FIREBASE_FIRESTORE_EMULATOR_HOST?.split(':')[1] || '8080')
  );
  connectFunctionsEmulator(functions, 
    process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST?.split(':')[0] || 'localhost',
    parseInt(process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST?.split(':')[1] || '5001')
  );
  connectStorageEmulator(storage,
    process.env.FIREBASE_STORAGE_EMULATOR_HOST?.split(':')[0] || 'localhost',
    parseInt(process.env.FIREBASE_STORAGE_EMULATOR_HOST?.split(':')[1] || '9199')
  );
  
  console.log('Firebase Emulators connected');
}

export default app;