import 'dotenv/config';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getPrivateKey(): string {
  const key = process.env.FIREBASE_PRIVATE_KEY ?? '';
  return key
    .replace(/^[\s"']+|[\s"']+$/g, '')
    .replace(/\\\\r\\\\n/g, '\n')
    .replace(/\\\\n/g, '\n')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n');
}

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Uso: npx tsx scripts/promote-superadmin.ts <email>');
    process.exit(1);
  }

  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: getPrivateKey(),
      }),
    });
  }

  const db = getFirestore();
  const snapshot = await db.collection('usuarios').where('email', '==', email).limit(1).get();

  if (snapshot.empty) {
    console.error(`No se encontró usuario con email: ${email}`);
    process.exit(1);
  }

  const doc = snapshot.docs[0];
  const current = doc.data();

  if (current.rol === 'superadmin') {
    console.log(`✓ ${email} ya es superadmin`);
    process.exit(0);
  }

  await doc.ref.update({ rol: 'superadmin' });
  console.log(`✓ ${email} promovido a superadmin (rol anterior: ${current.rol})`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
