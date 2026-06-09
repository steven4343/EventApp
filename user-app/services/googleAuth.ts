import { initializeApp } from 'firebase/app';
import { getAuth, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';

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

export function startGoogleSignIn() {
  const provider = new GoogleAuthProvider();
  signInWithRedirect(auth, provider);
}

export async function finishGoogleSignIn(): Promise<string | null> {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;
    return await result.user.getIdToken();
  } catch (e) {
    console.error('Google redirect error:', e);
    return null;
  }
}
