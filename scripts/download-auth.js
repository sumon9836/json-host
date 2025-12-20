#!/usr/bin/env node
// Simple example: download auth zip by slug, extract it into ./restored
// Usage: node scripts/download-auth.js https://your-app.example slug outputDir

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

async function downloadAndExtract(baseUrl, slug, outDir) {
  const url = `${baseUrl}/api/auth/${slug}?download=1`;
  const res = await axios.get(url, { responseType: 'arraybuffer' });
  const zipBuf = Buffer.from(res.data);
  const zip = new AdmZip(zipBuf);
  zip.extractAllTo(outDir, true);
  console.log('Extracted to', outDir);
}

(async () => {
  const [,, baseUrl, slug, outDir = './restored'] = process.argv;
  if (!baseUrl || !slug) return console.error('Usage: download-auth.js <BASE_URL> <SLUG> [outDir]');
  await downloadAndExtract(baseUrl, slug, outDir);
})();