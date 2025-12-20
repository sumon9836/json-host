#!/usr/bin/env node
// scripts/cleanup-auths.js
// Deletes expired auths: removes storage file and RTDB entry.

import admin, { getDatabase } from '../lib/firebaseAdmin.js';

async function cleanup() {
  const db = getDatabase();
  const snapshot = await db.ref('auths').get();
  if (!snapshot.exists()) {
    console.log('No auth entries found.');
    return;
  }

  const now = Date.now();
  const entries = snapshot.val();
  const keys = Object.keys(entries);
  console.log(`Found ${keys.length} auth entries, checking for expiration...`);

  for (const key of keys) {
    const rec = entries[key];
    if (!rec.expiresAt) continue;
    if (rec.expiresAt > now) continue; // not expired

    console.log(`Expiring ${key} — removing storagePath=${rec.storagePath}`);
    try {
      if (rec.storagePath) {
        const bucket = admin.storage().bucket();
        const file = bucket.file(rec.storagePath);
        const exists = await file.exists();
        if (exists[0]) {
          await file.delete();
          console.log(`Deleted storage file ${rec.storagePath}`);
        } else {
          console.log(`Storage file missing: ${rec.storagePath}`);
        }
      }

      // remove RTDB entry
      await db.ref(`auths/${key}`).remove();
      console.log(`Removed DB entry auths/${key}`);
    } catch (err) {
      console.error(`Failed to remove ${key}:`, err.message || err);
    }
  }
}

if (require.main === module) {
  cleanup().then(() => {
    console.log('Cleanup done');
    process.exit(0);
  }).catch(err => {
    console.error('Cleanup failed', err);
    process.exit(1);
  });
}
