
import { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [slug, setSlug] = useState('');
  const [payload, setPayload] = useState('{\n  "name": "plugin",\n  "type": "whatsapp"\n}');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [viewSlug, setViewSlug] = useState('');
  const [viewedData, setViewedData] = useState('');
  const [viewedRecord, setViewedRecord] = useState(null);
  const [copied, setCopied] = useState(false);
  const [folderFiles, setFolderFiles] = useState(null);
  const [ttlMinutes, setTtlMinutes] = useState(60); // default expiry for auth uploads (minutes)

  // Parsed upload result object (keeps slug, url, expiresAt)
  const [uploadedResult, setUploadedResult] = useState(null);

  // View type: 'json' or 'auth' determines which API to call when viewing a slug
  const [viewType, setViewType] = useState('json');

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for when clipboard API fails
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err2) {
        console.error('Failed to copy:', err2);
        setError('Failed to copy to clipboard');
      }
      document.body.removeChild(textArea);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([result], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'response.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
        setUploadedResult(data);
        setResult(JSON.stringify(data, null, 2));
      } else {
        setUploadedResult(null);
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewJson = async (e) => {
    e.preventDefault();
    if (!viewSlug) return;

    setViewedData('');
    setViewedRecord(null);
    setError('');

    try {
      const path = viewType === 'auth' ? `/api/auth/${viewSlug}` : `/api/${viewSlug}`;
      const res = await fetch(path);
      if (res.ok) {
        const data = await res.json();
        setViewedRecord(data);
        setViewedData(JSON.stringify(data, null, 2));
      } else if (res.status === 410) {
        setError('Entry expired');
      } else {
        setError('Not found');
      }
    } catch (err) {
      setError('Failed to fetch: ' + err.message);
    }
  };

  const formatDate = (ts) => {
    try {
      return new Date(ts).toLocaleString();
    } catch (e) {
      return String(ts);
    }
  };

  const getUploadedSlug = () => {
    if (uploadedResult && uploadedResult.slug) return uploadedResult.slug;
    try {
      const parsed = JSON.parse(result || '{}');
      return parsed.slug;
    } catch (e) {
      return null;
    }
  };

  const getPublicUrl = () => {
    const slugVal = getUploadedSlug();
    if (!slugVal) return '';
    return `${window.location.origin}/${slugVal}`;
  };

  const flattenFiles = (obj, base = '') => {
    const out = [];
    for (const k of Object.keys(obj || {})) {
      const v = obj[k];
      if (v && typeof v === 'object' && !('type' in v) && !Array.isArray(v)) {
        out.push(...flattenFiles(v, `${base}${k}/`));
      } else {
        out.push({ path: `${base}${k}`, type: (v && v.type) || 'file' });
      }
    }
    return out;
  };

  const handleUploadFolder = async (e) => {
    e.preventDefault();
    if (!folderFiles || folderFiles.length === 0) {
      setError('No files selected');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');

    try {
      const fd = new FormData();
      if (slug) fd.append('slug', slug);

      for (const file of Array.from(folderFiles)) {
        const filename = file.webkitRelativePath || file.name;
        fd.append('files[]', file, filename);
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      if (data.success) {
        setUploadedResult(data);
        setResult(JSON.stringify(data, null, 2));
      } else {
        setUploadedResult(null);
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadZip = () => {
    try {
      const slugValue = getUploadedSlug();
      if (!slugValue) return setError('No slug available for download');
      const url = `/api/${slugValue}?download=1`;
      const link = document.createElement('a');
      link.href = url;
      link.download = `${slugValue}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('No slug available for download');
    }
  };

  const handleUploadAuthFolder = async () => {
    if (!folderFiles || folderFiles.length === 0) {
      setError('No files selected');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');

    try {
      const fd = new FormData();
      if (slug) fd.append('slug', slug);
      if (ttlMinutes) fd.append('ttl', String(ttlMinutes * 60));

      for (const file of Array.from(folderFiles)) {
        const filename = file.webkitRelativePath || file.name;
        fd.append('files[]', file, filename);
      }

      const res = await fetch('/api/auth/upload', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      if (data.success) {
        setUploadedResult(data);
        setResult(JSON.stringify(data, null, 2));
      } else {
        setUploadedResult(null);
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAuthZip = () => {
    try {
      const slugValue = getUploadedSlug();
      if (!slugValue) return setError('No slug available for download');
      const url = `/api/auth/${slugValue}?download=1`;
      const link = document.createElement('a');
      link.href = url;
      link.download = `${slugValue}-auth.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('No slug available for download');
    }
  };

  return (
    <>
      <Head>
        <title>JSON Upload - Firebase RTDB</title>
        <meta name="description" content="Upload JSON data to Firebase Realtime Database" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className={`container ${darkMode ? 'dark' : ''}`}>
        <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? '☀️' : '🌙'}
        </button>
        
        <div className="card">
          <h1>📦 JSON Upload Service</h1>
          <p className="subtitle">Store JSON data in Firebase and get a public URL instantly</p>
          
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
          
          <div className="divider">
            <span>OR</span>
          </div>

          <form onSubmit={handleUploadFolder}>
            <div className="form-group">
              <label htmlFor="folder">Upload Folder (select a folder)</label>
              <input
                id="folder"
                type="file"
                webkitdirectory="true"
                directory="true"
                multiple
                onChange={(e) => setFolderFiles(e.target.files)}
              />
              <small>You can select a folder (Chrome/Edge). All files inside will be uploaded keeping relative paths.</small>
            </div>

            <div className="form-group">
              <label htmlFor="slugFolder">Custom Slug (optional)</label>
              <input
                id="slugFolder"
                type="text"
                placeholder="my-folder-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="ttlMinutes">Auth TTL (minutes)</label>
              <input
                id="ttlMinutes"
                type="number"
                min="1"
                value={ttlMinutes}
                onChange={(e) => setTtlMinutes(Number(e.target.value))}
                disabled={loading}
              />
              <small>Uploaded auth ZIP will be auto-deleted after this many minutes (default 60).</small>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? '⏳ Uploading...' : '📁 Upload Folder'}
              </button>

              <button
                type="button"
                className="submit-btn"
                onClick={handleUploadAuthFolder}
                disabled={loading}
                title="Upload selected folder as Baileys auth ZIP"
              >
                {loading ? '⏳ Uploading...' : '🔐 Upload as Baileys Auth'}
              </button>
            </div>
          </form>
          
          <form onSubmit={handleViewJson}>
            <div className="form-group">
              <label htmlFor="viewSlug">View by Slug</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select value={viewType} onChange={(e) => setViewType(e.target.value)} style={{ padding: 8, borderRadius: 6 }}>
                  <option value="json">JSON / Folder</option>
                  <option value="auth">Baileys Auth</option>
                </select>
                <input
                  id="viewSlug"
                  type="text"
                  placeholder="Enter slug to view"
                  value={viewSlug}
                  onChange={(e) => setViewSlug(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="view-btn">
                  🔍 View
                </button>
              </div>
            </div>
          </form>
          
          {error && (
            <div className="error-box">
              <strong>❌ Error:</strong> {error}
            </div>
          )}
          
          {uploadedResult && (
            <div className="result-box">
              <h3>✅ Upload Success</h3>

              <div style={{ marginBottom: 8 }}>
                <strong>Slug:</strong> {uploadedResult.slug} {' '}
                <button className="action-btn copy" style={{ padding: '6px 10px', minWidth: 80 }} onClick={() => handleCopy(uploadedResult.slug)}>
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>

              <div style={{ marginBottom: 8 }}>
                <strong>URL:</strong> <a href={uploadedResult.url} target="_blank" rel="noreferrer">{uploadedResult.url}</a> {' '}
                <button className="action-btn copy" style={{ padding: '6px 10px', minWidth: 120 }} onClick={() => handleCopy(window.location.origin + uploadedResult.url)}>
                  {copied ? '✓ Copied!' : 'Copy URL'}
                </button>
              </div>

              {uploadedResult.expiresAt && (
                <div style={{ marginBottom: 12 }}><strong>Expires:</strong> {formatDate(uploadedResult.expiresAt)}</div>
              )}

              <div className="action-buttons" style={{ marginBottom: 12 }}>
                {/* If uploadedResult url references auth API, show auth download */}
                {uploadedResult.url && uploadedResult.url.includes('/api/auth') && (
                  <button onClick={handleDownloadAuthZip} className="action-btn download">🔐 Download Auth ZIP</button>
                )}

                {uploadedResult.url && !uploadedResult.url.includes('/api/auth') && (
                  <>
                    <button onClick={handleDownload} className="action-btn download">📥 Download JSON</button>
                    <button onClick={handleDownloadZip} className="action-btn download">📦 Download ZIP</button>
                  </>
                )}
              </div>

              <pre style={{ maxHeight: 260, overflow: 'auto' }}>{result}</pre>
            </div>
          )}
          
          {viewedRecord && (
            <div className="result-box view-box">
              <h3>📄 Viewed Record</h3>

              <div style={{ marginBottom: 8 }}>
                <strong>Slug:</strong> {viewedRecord.slug || viewSlug}
                {viewedRecord.expiresAt && (
                  <span style={{ marginLeft: 12 }}><strong>Expires:</strong> {formatDate(viewedRecord.expiresAt)}</span>
                )}
              </div>

              {viewedRecord.payload && (
                <div style={{ marginBottom: 12 }}>
                  <strong>Payload:</strong>
                  <pre style={{ maxHeight: 200, overflow: 'auto' }}>{JSON.stringify(viewedRecord.payload, null, 2)}</pre>
                </div>
              )}

              {viewedRecord.files && (
                <div style={{ marginBottom: 12 }}>
                  <strong>Files:</strong>
                  <ul>
                    {flattenFiles(viewedRecord.files).map((f) => (
                      <li key={f.path}>
                        {f.path} ({f.type})
                      </li>
                    ))}
                  </ul>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => {
                      const slugValue = viewSlug; // may be "auth/slug" namespace handled separate
                      const url = viewType === 'auth' ? `/api/auth/${slugValue}?download=1` : `/api/${slugValue}?download=1`;
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `${slugValue}.zip`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }} className="action-btn download">📦 Download ZIP</button>
                  </div>
                </div>
              )}

              <button onClick={() => handleCopy(JSON.stringify(viewedRecord, null, 2))} className="action-btn copy">
                {copied ? '✓ Copied!' : '📋 Copy JSON'}
              </button>
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
            transition: background 0.3s ease;
            position: relative;
          }
          
          .container.dark {
            background: linear-gradient(135deg, #2d3561 0%, #3d2952 100%);
          }
          
          .theme-toggle {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50px;
            font-size: 20px;
            cursor: pointer;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            z-index: 1000;
          }
          
          .theme-toggle:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(1.1);
          }
          
          .card {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 700px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.5s ease;
          }
          
          .dark .card {
            background: #2a2e3f;
            color: #e4e4e7;
          }
          
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          h1 {
            margin: 0 0 10px 0;
            color: #1a202c;
            font-size: 2em;
            text-align: center;
            animation: fadeIn 0.8s ease;
          }
          
          .dark h1 {
            color: #f4f4f5;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          .subtitle {
            text-align: center;
            color: #718096;
            margin-bottom: 30px;
            font-size: 15px;
          }
          
          .dark .subtitle {
            color: #a1a1aa;
          }
          
          .divider {
            display: flex;
            align-items: center;
            text-align: center;
            margin: 30px 0;
            color: #a0aec0;
          }
          
          .divider::before,
          .divider::after {
            content: '';
            flex: 1;
            border-bottom: 2px solid #e2e8f0;
          }
          
          .dark .divider::before,
          .dark .divider::after {
            border-bottom-color: #3f3f46;
          }
          
          .divider span {
            padding: 0 15px;
            font-weight: 600;
            font-size: 12px;
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
          
          .dark label {
            color: #e4e4e7;
          }
          
          input, textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 14px;
            font-family: 'Courier New', monospace;
            transition: all 0.2s;
            box-sizing: border-box;
            background: white;
            color: #1a202c;
          }
          
          .dark input,
          .dark textarea {
            background: #1a1d2e;
            border-color: #3f3f46;
            color: #e4e4e7;
          }
          
          input:focus, textarea:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }
          
          input:disabled, textarea:disabled {
            background: #f7fafc;
            cursor: not-allowed;
            opacity: 0.6;
          }
          
          .dark input:disabled,
          .dark textarea:disabled {
            background: #18181b;
          }
          
          small {
            display: block;
            margin-top: 4px;
            color: #a0aec0;
            font-size: 12px;
          }
          
          .dark small {
            color: #71717a;
          }
          
          .input-group {
            display: flex;
            gap: 10px;
          }
          
          .input-group input {
            flex: 1;
          }
          
          .submit-btn, .view-btn {
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .submit-btn {
            width: 100%;
          }
          
          .view-btn {
            padding: 12px 20px;
            white-space: nowrap;
          }
          
          .submit-btn:hover:not(:disabled), .view-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
          }
          
          .submit-btn:active:not(:disabled), .view-btn:active {
            transform: translateY(0);
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
            animation: shake 0.5s ease;
          }
          
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
          }
          
          .result-box {
            margin-top: 20px;
            padding: 20px;
            background: #c6f6d5;
            border-left: 4px solid #48bb78;
            border-radius: 8px;
            animation: slideIn 0.4s ease;
          }
          
          .view-box {
            background: #dbeafe;
            border-left-color: #3b82f6;
          }
          
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          .result-box h3 {
            margin: 0 0 12px 0;
            color: #22543d;
          }
          
          .view-box h3 {
            color: #1e3a8a;
          }
          
          .result-box pre {
            margin: 0;
            padding: 12px;
            background: rgba(255, 255, 255, 0.6);
            border-radius: 6px;
            overflow-x: auto;
            color: #2d3748;
            font-size: 13px;
          }
          
          .action-buttons {
            display: flex;
            gap: 10px;
            margin-top: 12px;
            flex-wrap: wrap;
          }
          
          .action-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            flex: 1;
            min-width: 120px;
          }
          
          .action-btn.download {
            background: #48bb78;
            color: white;
          }
          
          .action-btn.copy {
            background: #4299e1;
            color: white;
          }
          
          .action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
          }
          
          @media (max-width: 640px) {
            .card {
              padding: 24px;
            }
            
            h1 {
              font-size: 1.5em;
            }
            
            .input-group {
              flex-direction: column;
            }
            
            .view-btn {
              width: 100%;
            }
            
            .action-buttons {
              flex-direction: column;
            }
            
            .action-btn {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </>
  );
}
