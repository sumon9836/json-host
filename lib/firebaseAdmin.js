// lib/firebaseAdmin.js
import admin from "firebase-admin";

if (!admin.apps.length) {
  // Check if all required environment variables are present
  const requiredEnvVars = ['FB_PROJECT_ID', 'FB_PRIVATE_KEY', 'FB_CLIENT_EMAIL'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Missing required Firebase environment variables:', missingVars.join(', '));
    throw new Error(`Missing Firebase configuration. Please set up: ${missingVars.join(', ')}`);
  }

  const serviceAccount = {
    type: process.env.FB_TYPE || 'service_account',
    project_id: process.env.FB_PROJECT_ID,
    private_key_id: process.env.FB_PRIVATE_KEY_ID,
    private_key: process.env.FB_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FB_CLIENT_EMAIL,
    client_id: process.env.FB_CLIENT_ID,
    auth_uri: process.env.FB_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
    token_uri: process.env.FB_TOKEN_URI || 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: process.env.FB_AUTH_PROVIDER_CERT || 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: process.env.FB_CLIENT_CERT_URL,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://json-upload-e50c9-default-rtdb.firebaseio.com/",
    storageBucket: process.env.FB_STORAGE_BUCKET || 'json-upload-e50c9.appspot.com',
  });
}

export function getDatabase() {
  return admin.database();
}

export default admin;