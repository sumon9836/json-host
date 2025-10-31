// pages/api/[slug].js
import { getDatabase } from '../../lib/firebaseAdmin';

export default async function handler(req, res) {
  const {
    query: { slug }
  } = req;

  if (!slug) return res.status(400).json({ error: 'Missing slug' });

  try {
    const db = getDatabase().ref();
    const snap = await db.child(`jsons/${slug}`).once('value');

    if (!snap.exists()) {
      return res.status(404).json({ error: 'Not found' });
    }

    const record = snap.val();

    // optionally set caching headers
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300'); // CDN-friendly
    return res.status(200).json({
      slug,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      payload: record.payload
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}