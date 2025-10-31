
// pages/index.js
import { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [slug, setSlug] = useState('');
  const [payload, setPayload] = useState('{\n  "name": "plugin",\n  "type": "whatsapp"\n}');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult('');
    
    try {
      const jsonData = JSON.parse(payload);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, payload: jsonData }),
      });
      const data = await res.json();
      
      if (data.success) {
        setResult(JSON.stringify(data, null, 2));
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>JSON Upload - Firebase RTDB</title>
        <meta name="description" content="Upload JSON data to Firebase Realtime Database" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="container">
        <div className="card">
          <h1>📦 JSON Upload Service</h1>
          <p className="subtitle">Store JSON data in Firebase and get a public URL</p>
          
          <form onSubmit={handleUpload}>
            <div className="form-group">
              <label htmlFor="slug">Custom Slug (optional)</label>
              <input
                id="slug"
                type="text"
                placeholder="my-custom-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                disabled={loading}
              />
              <small>Leave empty for auto-generated slug</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="payload">JSON Payload</label>
              <textarea
                id="payload"
                rows="12"
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                disabled={loading}
                placeholder='{\n  "key": "value"\n}'
              />
            </div>
            
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? '⏳ Uploading...' : '🚀 Upload JSON'}
            </button>
          </form>
          
          {error && (
            <div className="error-box">
              <strong>❌ Error:</strong> {error}
            </div>
          )}
          
          {result && (
            <div className="result-box">
              <h3>✅ Success!</h3>
              <pre>{result}</pre>
            </div>
          )}
        </div>
        
        <style jsx>{`
          .container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          }
          
          .card {
            background: white;
            border-radius: 16px;
            padding: 40px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          }
          
          h1 {
            margin: 0 0 10px 0;
            color: #1a202c;
            font-size: 2em;
            text-align: center;
          }
          
          .subtitle {
            text-align: center;
            color: #718096;
            margin-bottom: 30px;
          }
          
          .form-group {
            margin-bottom: 24px;
          }
          
          label {
            display: block;
            margin-bottom: 8px;
            color: #2d3748;
            font-weight: 600;
            font-size: 14px;
          }
          
          input, textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 14px;
            font-family: 'Courier New', monospace;
            transition: border-color 0.2s;
            box-sizing: border-box;
          }
          
          input:focus, textarea:focus {
            outline: none;
            border-color: #667eea;
          }
          
          input:disabled, textarea:disabled {
            background: #f7fafc;
            cursor: not-allowed;
          }
          
          small {
            display: block;
            margin-top: 4px;
            color: #a0aec0;
            font-size: 12px;
          }
          
          .submit-btn {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          
          .submit-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
          }
          
          .submit-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          .error-box {
            margin-top: 20px;
            padding: 16px;
            background: #fed7d7;
            border-left: 4px solid #f56565;
            border-radius: 8px;
            color: #742a2a;
          }
          
          .result-box {
            margin-top: 20px;
            padding: 20px;
            background: #c6f6d5;
            border-left: 4px solid #48bb78;
            border-radius: 8px;
          }
          
          .result-box h3 {
            margin: 0 0 12px 0;
            color: #22543d;
          }
          
          .result-box pre {
            margin: 0;
            padding: 12px;
            background: #f7fafc;
            border-radius: 6px;
            overflow-x: auto;
            color: #2d3748;
            font-size: 13px;
          }
          
          @media (max-width: 640px) {
            .card {
              padding: 24px;
            }
            
            h1 {
              font-size: 1.5em;
            }
          }
        `}</style>
      </div>
    </>
  );
}
