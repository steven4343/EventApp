import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export async function signInWithGoogle(): Promise<string | null> {
  try {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();
    return idToken;
  } catch (e) {
    console.error('Google sign-in error:', e);
    return null;
  }
}
