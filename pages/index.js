// pages/index.js
import { useState } from 'react';

export default function Home() {
  const [slug, setSlug] = useState('');
  const [payload, setPayload] = useState('{\n  "name": "plugin",\n  "type": "whatsapp"\n}');
  const [result, setResult] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();
    try {
      const jsonData = JSON.parse(payload);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, payload: jsonData }),
      });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setResult(JSON.stringify({ success: false, error: err.message }, null, 2));
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'monospace' }}>
      <h2>JSON Upload → Firebase RTDB → Public Slug</h2>
      <form onSubmit={handleUpload}>
        <label>
          Custom slug (optional):&nbsp;
          <input
            type="text"
            placeholder="my-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </label>
        <br />
        <label>
          JSON payload:
          <br />
          <textarea
            rows="10"
            cols="50"
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
          />
        </label>
        <br />
        <button type="submit">Upload</button>
      </form>
      <h3>Result</h3>
      <pre>{result}</pre>
    </div>
  );
} 