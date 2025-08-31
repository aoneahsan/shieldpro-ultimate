declare global {
  const __ENV__: {
    NODE_ENV: 'development' | 'production';
    VITE_FIREBASE_API_KEY: string;
    VITE_FIREBASE_AUTH_DOMAIN: string;
    VITE_FIREBASE_PROJECT_ID: string;
    VITE_FIREBASE_STORAGE_BUCKET: string;
    VITE_FIREBASE_MESSAGING_SENDER_ID: string;
    VITE_FIREBASE_APP_ID: string;
    VITE_FIREBASE_MEASUREMENT_ID: string;
    VITE_USE_FIREBASE_EMULATOR: string;
    VITE_FIREBASE_CLIENT_ID: string;
  };
}

export {};