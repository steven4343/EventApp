import admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (serviceAccountBase64) {
    const decoded = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(decoded)),
    });
  } else if (serviceAccountPath) {
    admin.initializeApp({
      credential: admin.credential.cert(require(serviceAccountPath)),
    });
  } else if (process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } else {
    console.warn('Firebase: No credentials provided. Set FIREBASE_SERVICE_ACCOUNT_BASE64, FIREBASE_SERVICE_ACCOUNT_PATH, or FIREBASE_PROJECT_ID');
  }
}

export const firebaseAuth = admin.auth ? admin.auth() : null;
export default admin;
