import { signInWithRedirect, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';

export async function signInWithGoogle(): Promise<string | null> {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
    return null;
  } catch (e) {
    console.error('Google redirect error:', e);
    return null;
  }
}

export async function getGoogleRedirectResult(): Promise<string | null> {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;
    const idToken = await result.user.getIdToken();
    return idToken;
  } catch (e) {
    console.error('Google redirect result error:', e);
    return null;
  }
}
