// zip-local-and-upload.js (simplified)
const archiver = require('archiver');
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function zipAndUpload(folderPath, baseUrl, ttlSeconds = 3600) {
  const out = fs.createWriteStream('auth.zip');
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.directory(folderPath, false).pipe(out);
  await archive.finalize();
  await new Promise(r => out.on('close', r));

  const fd = new FormData();
  fd.append('archive', fs.createReadStream('auth.zip'));
  fd.append('ttl', String(ttlSeconds));
  const res = await axios.post(`${baseUrl}/api/auth/upload`, fd, { headers: fd.getHeaders() });
  return res.data;
}


const fs = require('fs');
const path = require('path');
const os = require('os');
const AdmZip = require('adm-zip');
const axios = require('axios');

async function downloadAndReplaceAuth(baseUrl, slug, authDir) {
  const url = `${baseUrl}/api/auth/${slug}?download=1`;
  const res = await axios.get(url, { responseType: 'arraybuffer' });
  const zip = new AdmZip(Buffer.from(res.data));

  const tmp = path.join(os.tmpdir(), `auth-${Date.now()}`);
  fs.mkdirSync(tmp, { recursive: true });
  zip.extractAllTo(tmp, true);

  // Stop or ensure the bot isn't accessing authDir here
  if (fs.existsSync(authDir)) fs.rmSync(authDir, { recursive: true, force: true });
  fs.renameSync(tmp, authDir); // atomic on same filesystem
}


const { default: makeWASocket, useMultiFileAuthState } = require('@adiwajshing/baileys');

async function startBot(authDir) {
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const sock = makeWASocket({ auth: state });
  sock.ev.on('creds.update', saveCreds);
  // Bot will connect quickly using restored credentials
}

// requires admin credentials on a trusted server (not from the browser)
const admin = require('./lib/firebaseAdmin'); // admin SDK from project
const db = admin.database();
const bucket = admin.storage().bucket();

async function deleteAuthSlug(slug) {
  const rec = (await db.ref(`auths/${slug}`).get()).val();
  if (!rec) return;
  if (rec.storagePath) await bucket.file(rec.storagePath).delete().catch(() => {});
  await db.ref(`auths/${slug}`).remove();
}