
import { getDatabase, ref, set } from 'firebase/database';
import { database } from '../../lib/firebaseClient';
import { nanoid } from 'nanoid';

const AUTO_SLUG_LENGTH = 8;

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { slug: customSlug, payload } = req.body;

    const slug = (customSlug || nanoid(AUTO_SLUG_LENGTH)).toLowerCase();

    const dbRef = ref(database, `jsons/${slug}`);
    await set(dbRef, {
      createdAt: Date.now(),
      payload,
    });

    const publicUrl = `/api/${slug}`;

    return res.status(201).json({
      success: true,
      slug,
      url: publicUrl,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
