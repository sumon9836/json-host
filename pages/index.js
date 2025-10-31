
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
  const [copied, setCopied] = useState(false);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const handleViewJson = async (e) => {
    e.preventDefault();
    if (!viewSlug) return;
    
    setViewedData('');
    setError('');
    
    try {
      const res = await fetch(`/${viewSlug}`);
      if (res.ok) {
        const data = await res.json();
        setViewedData(JSON.stringify(data, null, 2));
      } else {
        setError('JSON not found with that slug');
      }
    } catch (err) {
      setError('Failed to fetch JSON: ' + err.message);
    }
  };

  const getPublicUrl = () => {
    const parsed = JSON.parse(result);
    return `${window.location.origin}/${parsed.slug}`;
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
          
          <form onSubmit={handleViewJson}>
            <div className="form-group">
              <label htmlFor="viewSlug">View Existing JSON by Slug</label>
              <div className="input-group">
                <input
                  id="viewSlug"
                  type="text"
                  placeholder="Enter slug to view"
                  value={viewSlug}
                  onChange={(e) => setViewSlug(e.target.value)}
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
          
          {result && (
            <div className="result-box">
              <h3>✅ Success!</h3>
              <pre>{result}</pre>
              <div className="action-buttons">
                <button onClick={handleDownload} className="action-btn download">
                  📥 Download JSON
                </button>
                <button 
                  onClick={() => handleCopy(getPublicUrl())} 
                  className="action-btn copy"
                >
                  {copied ? '✓ Copied!' : '📋 Copy URL'}
                </button>
              </div>
            </div>
          )}
          
          {viewedData && (
            <div className="result-box view-box">
              <h3>📄 Viewed JSON</h3>
              <pre>{viewedData}</pre>
              <button onClick={() => handleCopy(viewedData)} className="action-btn copy">
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
