# json-host — Baileys auth upload / auto-delete

This project allows uploading a Baileys auth folder as a ZIP (or folder via browser), stores it in Firebase Storage and RTDB, and exposes a slug for downloading. Uploaded auths are auto-deleted after a TTL (default 1 hour).

## How TTL works
- When uploading via `/api/auth/upload`, the server stores `expiresAt` (timestamp) and `ttlSeconds` in RTDB (default 3600s = 1 hour). You can override by adding `ttl` (seconds) in the upload form or request.
- A scheduled GitHub Actions workflow runs `scripts/cleanup-auths.js` every 15 minutes and deletes any expired entries (removes storage file and DB record).

## Setup for scheduled cleanup
1. Add Firebase admin env vars as repository secrets in GitHub: `FB_PROJECT_ID`, `FB_PRIVATE_KEY`, `FB_CLIENT_EMAIL`, `FB_PRIVATE_KEY_ID`, `FB_CLIENT_ID`, `FB_STORAGE_BUCKET`.
2. The workflow `.github/workflows/cleanup.yml` runs automatically on schedule; ensure `npm ci` installs dependencies successfully.

## Uploading
- Browser: Use the UI and click **🔐 Upload as Baileys Auth** (you can set TTL minutes in the form).
- curl (zip):
  curl -F "archive=@myAuth.zip" https://YOUR_DOMAIN/api/auth/upload

## Downloading
- Download ZIP by slug: `GET /api/auth/{slug}?download=1` (response may be 410 if auth expired)
- Example CLI: `curl -o auth.zip "https://your.domain/api/auth/abc123?download=1"`

## Scripts
- `scripts/download-auth.js` — download and extract an auth by slug
- `scripts/cleanup-auths.js` — delete expired entries (used by the scheduled workflow)

## Security notes
- Baileys auth is sensitive — do not expose slugs publicly unless you intend them to be usable. Consider encrypting ZIPs before upload if needed.

If you want, I can also add optional server-side encryption of uploaded zips before saving them to Storage. Let me know.