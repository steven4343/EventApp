import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || GOOGLE_CLIENT_ID;

let pendingTokenCallback: ((token: string) => void) | null = null;

export function onRedirectToken(callback: (token: string) => void) {
  pendingTokenCallback = callback;
}

export function checkRedirectResult(): void {
  if (Platform.OS !== 'web') return;
  try {
    const fragment = window.location.hash.replace('#', '');
    if (!fragment) return;
    const params = new URLSearchParams(fragment);
    const idToken = params.get('id_token');
    if (idToken) {
      window.location.hash = '';
      pendingTokenCallback?.(idToken);
      pendingTokenCallback = null;
    }
  } catch (e) {
    console.error('Redirect result error:', e);
  }
}

export function signInWithGoogleRedirect(): void {
  const redirectUri = window.location.origin;
  const nonce = Array.from({ length: 32 }, () =>
    Math.random().toString(36).charAt(2)
  ).join('');

  const params = new URLSearchParams({
    client_id: WEB_CLIENT_ID,
    response_type: 'id_token',
    redirect_uri: redirectUri,
    scope: 'openid email profile',
    nonce,
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function signInWithGoogle(): Promise<string | null> {
  try {
    const clientId = Platform.OS === 'web' ? WEB_CLIENT_ID : GOOGLE_CLIENT_ID;
    const nonce = Array.from({ length: 32 }, () =>
      Math.random().toString(36).charAt(2)
    ).join('');

    const redirectUri = Platform.OS === 'web'
      ? window.location.origin
      : makeRedirectUri({ preferLocalhost: true });

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'id_token',
      redirect_uri: redirectUri,
      scope: 'openid email profile',
      nonce,
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type === 'success' && result.url) {
      const fragment = new URLSearchParams(result.url.split('#')[1] || '');
      const idToken = fragment.get('id_token');
      if (idToken) return idToken;

      const query = new URLSearchParams(result.url.split('?')[1] || '');
      return query.get('id_token');
    }
    return null;
  } catch (e) {
    console.error('Google sign-in error:', e);
    return null;
  }
}
