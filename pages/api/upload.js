// pages/api/upload.js
import { getDatabase } from '../../lib/firebaseAdmin';
import { nanoid } from 'nanoid';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false, // we parse manually to support file uploads
  },
};

const AUTO_SLUG_LENGTH = parseInt(process.env.AUTO_SLUG_LENGTH || '8', 10);

async function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

async function slugAvailable(dbRef, slug) {
  const snap = await dbRef.child(`jsons/${slug}`).once('value');
  return !snap.exists();
}

export default async function handler(req, res) {
  try {
    const db = getDatabase().ref();
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Try to handle raw JSON content-type first
    const ct = req.headers['content-type'] || '';
    let slug, payload;

    if (ct.includes('application/json')) {
      // Note: Next.js normally parses JSON bodies, but we disabled bodyParser.
      // Read body manually:
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString('utf8') || '{}';
      const data = JSON.parse(raw);
      slug = data.slug;
      payload = data.payload ?? data; // allow direct JSON to be payload
    } else {
      // multipart/form-data (file upload)
      const { fields, files } = await parseForm(req);
      slug = fields.slug;
      if (files.file) {
        const filePath = files.file.path || files.file.filepath;
        const contents = fs.readFileSync(filePath, 'utf8');
        payload = JSON.parse(contents);
      } else if (fields.payload) {
        payload = JSON.parse(fields.payload);
      } else {
        throw new Error('No payload provided');
      }
    }

    // sanitize slug: allow a-z0-9-_
    if (slug) slug = String(slug).trim().toLowerCase().replace(/[^a-z0-9\-_]/g, '-');
    // generate if empty
    if (!slug) {
      // try unique generation
      for (let i = 0; i < 5; i++) {
        const candidate = nanoid(AUTO_SLUG_LENGTH);
        const free = await slugAvailable(db, candidate);
        if (free) {
          slug = candidate;
          break;
        }
      }
      if (!slug) slug = nanoid(AUTO_SLUG_LENGTH);
    } else {
      // if custom slug exists, reject
      const free = await slugAvailable(db, slug);
      if (!free) {
        return res.status(409).json({ error: 'Slug already in use' });
      }
    }

    const now = Date.now();
    const record = {
      createdAt: now,
      updatedAt: now,
      payload,
    };

    await db.child(`jsons/${slug}`).set(record);

    // Provide public download URL (relative to deployed domain)
    const base = process.env.NEXT_PUBLIC_BASE_URL || ''; // optional
    const publicUrl = base ? `${base}/api/${slug}` : `/api/${slug}`;

    return res.status(201).json({ slug, url: publicUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}