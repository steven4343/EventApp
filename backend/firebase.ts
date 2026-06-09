let firebaseAuthInstance: any = null;

export async function getFirebaseAuth() {
  if (firebaseAuthInstance) return firebaseAuthInstance;

  try {
    const admin = await import('firebase-admin');
    admin.initializeApp({ projectId: 'evantapp-7127a' });
    firebaseAuthInstance = admin.auth();
  } catch (e) {
    console.warn('Firebase initialization failed:', e);
    return null;
  }

  return firebaseAuthInstance;
}
