
import { getDatabase, ref, get } from 'firebase/database';
import { database } from '../../lib/firebaseClient';

export default async function handler(req, res) {
  const {
    query: { slug }
  } = req;

  if (!slug) return res.status(400).json({ error: 'Missing slug' });

  try {
    const dbRef = ref(database, `jsons/${slug}`);
    const snapshot = await get(dbRef);

    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Not found' });
    }

    const record = snapshot.val();

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
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
