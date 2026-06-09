let firebaseAuthInstance: any = null;

export async function getFirebaseAuth() {
  if (firebaseAuthInstance) return firebaseAuthInstance;

  try {
    const admin = await import('firebase-admin');
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (serviceAccountBase64) {
      const decoded = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(decoded)),
      });
    } else if (serviceAccountPath) {
      const fs = await import('fs');
      const raw = fs.readFileSync(serviceAccountPath, 'utf-8');
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(raw)),
      });
    } else if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    } else {
      console.warn('Firebase: No credentials provided. Set FIREBASE_SERVICE_ACCOUNT_BASE64, FIREBASE_SERVICE_ACCOUNT_PATH, or FIREBASE_PROJECT_ID');
      return null;
    }

    firebaseAuthInstance = admin.auth();
  } catch (e) {
    console.warn('Firebase initialization failed:', e);
    return null;
  }

  return firebaseAuthInstance;
}
