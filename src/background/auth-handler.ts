import {
  signInWithCredential,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { auth } from '../utils/firebase';
import authService from '../services/auth.service';

// Handle authentication messages from popup/options page
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SIGN_IN_WITH_GOOGLE') {
    handleGoogleSignIn()
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }

  if (request.type === 'SIGN_IN_WITH_EMAIL') {
    handleEmailSignIn(request.email, request.password)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.type === 'SIGN_UP_WITH_EMAIL') {
    handleEmailSignUp(request.email, request.password, request.displayName, request.referralCode)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.type === 'RESET_PASSWORD') {
    handlePasswordReset(request.email)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.type === 'SIGN_OUT') {
    handleSignOut()
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.type === 'GET_CURRENT_USER') {
    handleGetCurrentUser()
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});

async function handleGoogleSignIn() {
  // Use Chrome Identity API for OAuth

  // For Manifest V3, we need to use chrome.identity.launchWebAuthFlow
  // This opens a popup window for Google OAuth
  const redirectUrl = chrome.identity.getRedirectURL();
  const clientId =
    process.env.VITE_FIREBASE_CLIENT_ID ||
    '526899927330-q60p30m9tjt8nb9av2bgq7tii388kfgf.apps.googleusercontent.com';

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('response_type', 'token');
  authUrl.searchParams.set('redirect_uri', redirectUrl);
  authUrl.searchParams.set('scope', 'openid email profile');

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl.href,
        interactive: true,
      },
      async (redirectUrl) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!redirectUrl) {
          reject(new Error('No redirect URL received'));
          return;
        }

        // Extract access token from redirect URL
        const url = new URL(redirectUrl);
        const params = new URLSearchParams(url.hash.substring(1));
        const accessToken = params.get('access_token');

        if (!accessToken) {
          reject(new Error('No access token received'));
          return;
        }

        try {
          // Create Firebase credential with the token
          const credential = GoogleAuthProvider.credential(null, accessToken);
          const userCredential = await signInWithCredential(auth, credential);

          // Ensure user profile exists
          await authService.ensureUserProfile(userCredential.user);

          resolve({
            success: true,
            user: {
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              displayName: userCredential.user.displayName,
              photoURL: userCredential.user.photoURL,
            },
          });
        } catch {
          reject(error as Error);
        }
      }
    );
  });
}

async function handleEmailSignIn(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  await authService.ensureUserProfile(userCredential.user);

  return {
    success: true,
    user: {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      photoURL: userCredential.user.photoURL,
    },
  };
}

async function handleEmailSignUp(
  email: string,
  password: string,
  displayName?: string,
  referralCode?: string
) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  if (displayName) {
    await updateProfile(userCredential.user, { displayName });
  }

  await authService.createUserProfile(userCredential.user, referralCode);

  return {
    success: true,
    user: {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName || displayName,
      photoURL: userCredential.user.photoURL,
    },
  };
}

async function handlePasswordReset(email: string) {
  await sendPasswordResetEmail(auth, email);
  return { success: true };
}

async function handleSignOut() {
  await signOut(auth);
  // Clear any cached data
  await chrome.storage.local.remove(['user', 'userProfile']);
  return { success: true };
}

async function handleGetCurrentUser() {
  const user = auth.currentUser;
  if (user) {
    const profile = await authService.getUserProfile();
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        ...profile,
      },
    };
  }
  return { success: false, user: null };
}

export {};
