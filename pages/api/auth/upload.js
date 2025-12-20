import formidable from 'formidable';
import fs from 'fs/promises';
import archiver from 'archiver';
import admin, { getDatabase } from '../../../lib/firebaseAdmin';
import { nanoid } from 'nanoid';

export const config = {
  api: {
    bodyParser: false,
  },
};

const AUTO_SLUG_LENGTH = 8;

async function makeZipFromFiles(files) {
  // files: array of { originalFilename, filepath }
  const archive = archiver('zip', { zlib: { level: 9 } });
  const chunks = [];

  archive.on('data', (c) => chunks.push(c));
  for (const f of files) {
    const name = f.originalFilename || f.newFilename || f.name || 'file';
    // read as buffer and append with relative path name when provided
    const buf = await fs.readFile(f.filepath || f.file || f.path);
    archive.append(buf, { name });
  }

  await archive.finalize();
  await new Promise((res, rej) => archive.on('end', res).on('error', rej));
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    const form = new formidable({ multiples: true });
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => (err ? reject(err) : resolve({ fields, files })));
    });

    const slug = (fields.slug || nanoid(AUTO_SLUG_LENGTH)).toLowerCase();
    const ttlSeconds = fields.ttl ? parseInt(fields.ttl, 10) : 3600; // default 1 hour

    // Collect provided files
    const fileFields = [];
    if (files['files[]']) {
      if (Array.isArray(files['files[]'])) fileFields.push(...files['files[]']);
      else fileFields.push(files['files[]']);
    }
    if (files.archive) fileFields.push(files.archive);

    if (fileFields.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    // If only one file was a zip, use it directly
    let zipBuffer = null;
    if (fileFields.length === 1) {
      const single = fileFields[0];
      const name = (single.originalFilename || single.newFilename || '').toLowerCase();
      const data = await fs.readFile(single.filepath || single.file || single.path);
      if (name.endsWith('.zip') || single.mimetype === 'application/zip') {
        zipBuffer = data;
      }
    }

    if (!zipBuffer) {
      // create zip from provided files
      zipBuffer = await makeZipFromFiles(fileFields);
    }

    // Upload zipBuffer to Firebase Storage
    const bucket = admin.storage().bucket();
    const storagePath = `auths/${slug}.zip`;
    const file = bucket.file(storagePath);

    await file.save(zipBuffer, {
      metadata: { contentType: 'application/zip' },
      resumable: false,
    });

    // Store metadata in RTDB at auths/{slug} with expiresAt
    const db = getDatabase();
    const now = Date.now();
    const expiresAt = now + (ttlSeconds * 1000);
    await db.ref(`auths/${slug}`).set({
      storagePath,
      createdAt: now,
      expiresAt,
      ttlSeconds
    });

    return res.status(201).json({ success: true, slug, url: `/api/auth/${slug}`, expiresAt });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}