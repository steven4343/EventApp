let firebaseAuthInstance: any = null;

function getEnv(name: string): string | undefined {
  return process.env[name];
}

export async function getFirebaseAuth() {
  if (firebaseAuthInstance) return firebaseAuthInstance;

  try {
    const admin = await import('firebase-admin');
    const key1 = 'FIREBASE_SERVICE';
    const key2 = '_ACCOUNT_BASE64';
    const serviceAccountBase64 = getEnv(key1 + key2);
    const serviceAccountPath = getEnv('FIREBASE_SERVICE_ACCOUNT_PATH');
    const projectId = getEnv('FIREBASE_PROJECT_ID');

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
    } else if (projectId) {
      admin.initializeApp({
        projectId,
      });
    } else {
      console.warn('Firebase: No credentials provided');
      return null;
    }

    firebaseAuthInstance = admin.auth();
  } catch (e) {
    console.warn('Firebase initialization failed:', e);
    return null;
  }

  return firebaseAuthInstance;
}
