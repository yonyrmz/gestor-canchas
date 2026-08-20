function getPrivateKey(): string {
  const key = process.env.FIREBASE_PRIVATE_KEY ?? '';
  return key
    .replace(/^"|"$/g, '')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n');
}

let _app: ReturnType<typeof import('firebase-admin/app')['initializeApp']> | null = null;

async function getApp() {
  if (_app) return _app;
  const { initializeApp, getApps, cert } = await import('firebase-admin/app');
  if (getApps().length > 0) {
    _app = getApps()[0];
  } else {
    _app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: getPrivateKey(),
      }),
    });
  }
  return _app;
}

export async function getDb() {
  const { getFirestore } = await import('firebase-admin/firestore');
  return getFirestore(await getApp());
}

export async function getFirebaseAuth() {
  const { getAuth } = await import('firebase-admin/auth');
  return getAuth(await getApp());
}
