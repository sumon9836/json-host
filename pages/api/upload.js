// pages/api/upload.js
import { getDatabase } from '../../lib/firebaseAdmin';
import { nanoid } from 'nanoid';

const AUTO_SLUG_LENGTH = 8;

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf8');
    const data = JSON.parse(raw);

    const slug = (data.slug || nanoid(AUTO_SLUG_LENGTH)).toLowerCase();
    const payload = data.payload || data;

    const db = getDatabase().ref(`jsons/${slug}`);
    await db.set({
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
    return res.status(500).json({ success: false, data: { error: err.message } });
  }
}