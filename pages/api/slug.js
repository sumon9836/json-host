
import { get, ref } from 'firebase/database';
import { database } from '../../lib/firebaseClient';
import archiver from 'archiver';

export default async function handler(req, res) {
  const {
    query: { slug, download }
  } = req;

  if (!slug) return res.status(400).json({ error: 'Missing slug' });

  try {
    const dbRef = ref(database, `jsons/${slug}`);
    const snapshot = await get(dbRef);

    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Not found' });
    }

    const record = snapshot.val();

    // If ?download=1 -> stream a zip
    if (download) {
      if (!record.files) {
        return res.status(404).json({ error: 'No files to download' });
      }

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${slug}.zip"`);

      const archive = archiver('zip');
      archive.on('error', (err) => {
        console.error('Archive error', err);
        res.status(500).end();
      });

      archive.pipe(res);

      function walkFiles(obj, base = '') {
        for (const key of Object.keys(obj)) {
          const val = obj[key];
          if (val && typeof val === 'object' && !('type' in val) && !Array.isArray(val)) {
            // nested folder
            walkFiles(val, `${base}${key}/`);
          } else if (val && typeof val === 'object' && 'type' in val) {
            // it's a file
            const filename = `${base}${key}`;
            if (val.type === 'json') {
              archive.append(JSON.stringify(val.content, null, 2), { name: filename });
            } else {
              archive.append(val.content, { name: filename });
            }
          }
        }
      }

      walkFiles(record.files || {});

      await archive.finalize();
      return;
    }

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

    return res.status(200).json({
      slug,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      payload: record.payload,
      files: record.files
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
