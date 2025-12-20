import admin, { getDatabase } from '../../../lib/firebaseAdmin';
import { get, ref } from 'firebase/database';

export default async function handler(req, res) {
  const {
    query: { slug, download }
  } = req;

  if (!slug) return res.status(400).json({ error: 'Missing slug' });

  try {
    const db = getDatabase();
    const snapshot = await get(ref(db, `auths/${slug}`));
    if (!snapshot.exists()) return res.status(404).json({ error: 'Not found' });

    const record = snapshot.val();

    // If expired, respond 410 Gone
    const now = Date.now();
    if (record.expiresAt && record.expiresAt <= now) {
      return res.status(410).json({ error: 'Auth entry expired' });
    }

    if (download) {
      if (!record.storagePath) return res.status(404).json({ error: 'File not available' });

      const bucket = admin.storage().bucket();
      const file = bucket.file(record.storagePath);
      const exists = await file.exists();
      if (!exists[0]) return res.status(404).json({ error: 'Stored file missing' });

      // Stream file to response
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${slug}.zip"`);
      const readStream = file.createReadStream();
      readStream.on('error', (err) => {
        console.error('Read stream error', err);
        res.status(500).end();
      });
      readStream.pipe(res);
      return;
    }

    return res.status(200).json({ slug, ...record });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}