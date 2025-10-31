// lib/firebaseAdmin.js
import admin from 'firebase-admin';

let firebaseApp;

function initFirebaseAdmin() {
  if (admin.apps && admin.apps.length) {
    firebaseApp = admin.apps[0];
    return firebaseApp;
  }

  if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_BASE64 env var');
  }
  if (!process.env.FIREBASE_DB_URL) {
    throw new Error('Missing FIREBASE_DB_URL env var');
  }

  const saJson = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
  );

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(saJson),
    databaseURL: process.env.FIREBASE_DB_URL
  });

  return firebaseApp;
}

export function getDatabase() {
  if (!firebaseApp) initFirebaseAdmin();
  return admin.database();
}