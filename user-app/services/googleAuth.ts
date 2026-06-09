import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential, getAuth } from 'firebase/auth';

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
const EXPO_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID;

export function useGoogleSignIn() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: CLIENT_ID,
    iosClientId: CLIENT_ID,
    androidClientId: CLIENT_ID,
    expoClientId: EXPO_CLIENT_ID,
    selectAccount: true,
  });

  async function signInWithGoogle(): Promise<string | null> {
    try {
      const result = await promptAsync();
      if (result?.type !== 'success') return null;

      const { idToken, accessToken } = result.params;
      if (!idToken) return null;

      const credential = GoogleAuthProvider.credential(idToken, accessToken);
      const auth = getAuth();
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseIdToken = await userCredential.user.getIdToken();

      return firebaseIdToken;
    } catch (e) {
      console.error('Google sign-in error:', e);
      return null;
    }
  }

  return {
    signInWithGoogle,
    isLoading: !request,
  };
}
