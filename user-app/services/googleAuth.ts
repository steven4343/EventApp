import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

initializeApp(firebaseConfig);
const auth = getAuth();

let pendingTokenCallback: ((token: string) => void) | null = null;

export function onRedirectToken(callback: (token: string) => void) {
  pendingTokenCallback = callback;
}

export async function checkRedirectResult(): Promise<void> {
  if (Platform.OS !== 'web') return;
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const idToken = await result.user.getIdToken();
      pendingTokenCallback?.(idToken);
      pendingTokenCallback = null;
    }
  } catch (e) {
    console.error('Redirect result error:', e);
  }
}

export function signInWithGoogleRedirect() {
  const provider = new GoogleAuthProvider();
  return signInWithRedirect(auth, provider);
}

export async function signInWithGoogle(): Promise<string | null> {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return await result.user.getIdToken();
  } catch (e) {
    console.error('Google sign-in error:', e);
    return null;
  }
}
