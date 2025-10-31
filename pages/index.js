// pages/index.js
import { useState } from 'react';

export default function Home() {
  const [slug, setSlug] = useState('');
  const [jsonText, setJsonText] = useState('{}');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = JSON.parse(jsonText);
      const body = { slug: slug || undefined, payload };
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      setResult({ success: res.ok, data });
    } catch (err) {
      setResult({ success: false, data: err.message || String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: '30px auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>JSON Upload → Firebase RTDB → Public Slug</h1>

      <form onSubmit={handleUpload}>
        <label>Custom slug (optional):</label>
        <input value={slug} onChange={(e)=>setSlug(e.target.value)} placeholder="my-slug" />

        <label>JSON payload:</label>
        <textarea rows={12} value={jsonText} onChange={(e)=>setJsonText(e.target.value)} style={{width:'100%'}} />

        <button type="submit" disabled={loading}>
          {loading ? 'Uploading…' : 'Upload'}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: 20 }}>
          <h3>Result</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
          {result.success && result.data?.url && (
            <div>
              <a href={result.data.url} target="_blank" rel="noreferrer">Open JSON</a>
            </div>
          )}
        </div>
      )}
    </main>
  );
}