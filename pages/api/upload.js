
import { ref, set } from 'firebase/database';
import { database } from '../../lib/firebaseClient';
import { nanoid } from 'nanoid';
import formidable from 'formidable';
import fs from 'fs/promises';
import AdmZip from 'adm-zip';

export const config = {
  api: {
    bodyParser: false,
  },
};

const AUTO_SLUG_LENGTH = 8;

function setNested(obj, parts, value) {
  const [first, ...rest] = parts;
  if (!first) return;
  if (rest.length === 0) {
    obj[first] = value;
    return;
  }
  obj[first] = obj[first] || {};
  setNested(obj[first], rest, value);
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const contentType = (req.headers['content-type'] || '').toLowerCase();

    // Multipart / folder upload handling
    if (contentType.includes('multipart/form-data')) {
      const form = formidable({ multiples: true });

      const { fields, files } = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => (err ? reject(err) : resolve({ fields, files })));
      });

      const slug = (fields.slug || nanoid(AUTO_SLUG_LENGTH)).toLowerCase();

      const filesObj = {};

      const fileFields = [];

      // Accept files[] or archive
      if (files['files[]']) {
        if (Array.isArray(files['files[]'])) fileFields.push(...files['files[]']);
        else fileFields.push(files['files[]']);
      }
      if (files.archive) {
        // single uploaded file (maybe a zip)
        fileFields.push(files.archive);
      }

      for (const f of fileFields) {
        const originalFilename = f.originalFilename || f.newFilename || f.name || f.filepath || f.path || f.filename || 'file';

        // If this is a zip file, extract
        if (originalFilename.toLowerCase().endsWith('.zip') || f.mimetype === 'application/zip') {
          const buffer = await fs.readFile(f.filepath || f.file);
          const zip = new AdmZip(buffer);
          const entries = zip.getEntries();

          for (const entry of entries) {
            if (entry.isDirectory) continue;
            const entryName = entry.entryName; // relative path
            const text = entry.getData().toString('utf8');
            let parsed = null;
            let type = 'text';
            try {
              parsed = JSON.parse(text);
              type = 'json';
            } catch (e) {
              parsed = text;
            }
            setNested(filesObj, entryName.split('/'), { type, content: parsed });
          }

          continue;
        }

        // Normal individual file
        const relPath = originalFilename; // when uploaded from browser with name=file.webkitRelativePath, this will be preserved
        const buf = await fs.readFile(f.filepath || f.file || f.filepath || f.path);
        const text = buf.toString('utf8');
        let parsed = null;
        let type = 'text';
        try {
          parsed = JSON.parse(text);
          type = 'json';
        } catch (e) {
          parsed = text;
        }
        setNested(filesObj, relPath.split('/'), { type, content: parsed });
      }

      const dbRef = ref(database, `jsons/${slug}`);
      await set(dbRef, {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        files: filesObj,
      });

      return res.status(201).json({ success: true, slug, url: `/api/${slug}` });
    }

    // Fallback: JSON payload (original behavior)
    if (contentType.includes('application/json')) {
      const body = await new Promise((resolve) => {
        let buf = '';
        req.on('data', (chunk) => (buf += chunk));
        req.on('end', () => resolve(JSON.parse(buf || '{}')));
      });

      const { slug: customSlug, payload } = body;
      const slug = (customSlug || nanoid(AUTO_SLUG_LENGTH)).toLowerCase();
      const dbRef = ref(database, `jsons/${slug}`);
      await set(dbRef, {
        createdAt: Date.now(),
        payload,
      });

      return res.status(201).json({ success: true, slug, url: `/api/${slug}` });
    }

    return res.status(400).json({ success: false, error: 'Unsupported content type' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
