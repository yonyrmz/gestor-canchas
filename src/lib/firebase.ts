import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

function getPrivateKey(): string {
  const key = process.env.FIREBASE_PRIVATE_KEY ?? '';
  return key
    .replace(/^"|"$/g, '')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n');
}

function getApp() {
  if (getApps().length > 0) return getApps()[0];

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: getPrivateKey(),
    }),
  });
}

export function getDb() {
  return getFirestore(getApp());
}

export function getFirebaseAuth() {
  return getAuth(getApp());
}
