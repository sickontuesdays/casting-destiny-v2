// pages/admin.js
// Simplified admin page - no Bungie OAuth required, just API key input

import { useState, useEffect } from 'react'

export default function AdminPage() {
  const [apiKey, setApiKey] = useState('')
  const [pulling, setPulling] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [manifestInfo, setManifestInfo] = useState(null)
  const [logs, setLogs] = useState([])

  // Load current manifest info on mount
  useEffect(() => {
    loadManifestInfo()
    // Load saved API key from localStorage
    const savedKey = localStorage.getItem('admin_api_key')
    if (savedKey) {
      setApiKey(savedKey)
    }
  }, [])

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const loadManifestInfo = async () => {
    try {
      const response = await fetch('/api/github/manifest/status')
      if (response.ok) {
        const data = await response.json()
        setManifestInfo(data)
        addLog('Loaded current manifest info from GitHub')
      } else {
        addLog('No manifest found in GitHub repo')
      }
    } catch (error) {
      addLog('Could not load manifest status')
      console.error('Failed to load manifest info:', error)
    }
  }

  const handleManifestPull = async () => {
    if (!apiKey) {
      setError('Bungie API key is required')
      return
    }

    try {
      setPulling(true)
      setError('')
      setStatus('Starting manifest download from Bungie...')
      addLog('Starting manifest pull...')
      
      // Save API key to localStorage for convenience
      localStorage.setItem('admin_api_key', apiKey)
      
      const response = await fetch('/api/admin/manifest-pull', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: apiKey
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to pull manifest')
      }
      
      setStatus('✅ Manifest successfully downloaded and saved to GitHub!')
      addLog(`Success! Version ${data.data?.version || 'unknown'} downloaded`)
      addLog(`Items: ${data.data?.metadata?.itemCount || 'unknown'}`)
      
      // Reload manifest info
      setTimeout(() => {
        loadManifestInfo()
      }, 2000)
      
    } catch (error) {
      console.error('Manifest pull failed:', error)
      setError(error.message)
      setStatus('❌ Failed to download manifest')
      addLog(`Error: ${error.message}`)
    } finally {
      setPulling(false)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="admin-page">
      <div className="container">
        <header className="admin-header">
          <h1>🛠️ Admin Panel</h1>
          <p>Download Destiny 2 manifest to GitHub repository</p>
        </header>

        {/* Current Manifest Status */}
        <div className="status-section">
          <h2>Current Manifest Status</h2>
          {manifestInfo ? (
            <div className="manifest-status">
              <div className="status-item">
                <span className="label">Version:</span>
                <span className="value">{manifestInfo.version}</span>
              </div>
              <div className="status-item">
                <span className="label">Last Updated:</span>
                <span className="value">{formatDate(manifestInfo.lastUpdated)}</span>
              </div>
              <div className="status-item">
                <span className="label">Items:</span>
                <span className="value">{manifestInfo.itemCount || 'Unknown'}</span>
              </div>
              <div className="status-item">
                <span className="label">Size:</span>
                <span className="value">{manifestInfo.size ? `${(manifestInfo.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}</span>
              </div>
            </div>
          ) : (
            <div className="no-manifest">
              <p>❌ No manifest found in GitHub repository</p>
              <p>Use the section below to download the manifest from Bungie</p>
            </div>
          )}
        </div>

        {/* Manifest Download Section */}
        <div className="download-section">
          <h2>Download New Manifest</h2>
          <p>Enter your Bungie API key to download the latest manifest to the GitHub repository</p>
          
          <div className="api-key-input">
            <input
              type="password"
              placeholder="Enter Bungie API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={pulling}
            />
            <button
              onClick={handleManifestPull}
              disabled={pulling || !apiKey}
              className="download-btn"
            >
              {pulling ? '⏳ Downloading...' : '📥 Download Manifest'}
            </button>
          </div>

          <div className="help-text">
            <p>Get your API key at <a href="https://www.bungie.net/en/Application" target="_blank" rel="noopener">bungie.net/en/Application</a></p>
          </div>

          {status && (
            <div className={`status-message ${status.includes('✅') ? 'success' : status.includes('❌') ? 'error' : ''}`}>
              {status}
            </div>
          )}

          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}
        </div>

        {/* Logs Section */}
        {logs.length > 0 && (
          <div className="logs-section">
            <div className="logs-header">
              <h3>Activity Log</h3>
              <button onClick={clearLogs} className="clear-logs">Clear</button>
            </div>
            <div className="logs-container">
              {logs.map((log, index) => (
                <div key={index} className="log-entry">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="info-section">
          <h3>ℹ️ Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <strong>Purpose:</strong> Downloads the latest Destiny 2 manifest from Bungie and saves it to your GitHub repository
            </div>
            <div className="info-item">
              <strong>Frequency:</strong> Run this when you first set up the app or when you need fresh data
            </div>
            <div className="info-item">
              <strong>Automatic Updates:</strong> Set up GitHub Actions to run this automatically on Tuesdays
            </div>
            <div className="info-item">
              <strong>Storage:</strong> Manifest is saved to GitHub and cached for your application
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .admin-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: #fff;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .admin-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .admin-header h1 {
          color: #ff6b35;
          font-size: 2.5em;
          margin-bottom: 10px;
        }

        .admin-header p {
          color: #a0a0a0;
          font-size: 1.1em;
        }

        .status-section, .download-section, .logs-section, .info-section {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .status-section h2, .download-section h2 {
          color: #ff6b35;
          margin-bottom: 16px;
          font-size: 1.4em;
        }

        .manifest-status {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
        }

        .status-item .label {
          color: #888;
          font-weight: 600;
        }

        .status-item .value {
          color: #4ade80;
          font-weight: 500;
        }

        .no-manifest {
          text-align: center;
          padding: 20px;
          color: #ffa500;
        }

        .api-key-input {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }

        .api-key-input input {
          flex: 1;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #fff;
          font-size: 14px;
        }

        .api-key-input input:focus {
          outline: none;
          border-color: #ff6b35;
          box-shadow: 0 0 10px rgba(255, 107, 53, 0.3);
        }

        .download-btn {
          background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          white-space: nowrap;
          transition: all 0.3s ease;
        }

        .download-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 107, 53, 0.4);
        }

        .download-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .help-text {
          font-size: 12px;
          color: #888;
          margin-bottom: 16px;
        }

        .help-text a {
          color: #ff6b35;
          text-decoration: none;
        }

        .status-message {
          padding: 12px 16px;
          border-radius: 8px;
          margin-top: 16px;
          font-weight: 500;
        }

        .status-message.success {
          background: rgba(74, 222, 128, 0.2);
          border: 1px solid rgba(74, 222, 128, 0.3);
          color: #4ade80;
        }

        .status-message.error {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          padding: 12px 16px;
          border-radius: 8px;
          margin-top: 16px;
        }

        .logs-section {
          max-height: 400px;
        }

        .logs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .logs-header h3 {
          color: #ff6b35;
          margin: 0;
        }

        .clear-logs {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        }

        .logs-container {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          padding: 16px;
          max-height: 300px;
          overflow-y: auto;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 12px;
        }

        .log-entry {
          margin-bottom: 4px;
          color: #a0a0a0;
          line-height: 1.4;
        }

        .info-section h3 {
          color: #ff6b35;
          margin-bottom: 16px;
        }

        .info-grid {
          display: grid;
          gap: 12px;
        }

        .info-item {
          padding: 12px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          font-size: 14px;
          line-height: 1.4;
        }

        .info-item strong {
          color: #4ade80;
        }

        @media (max-width: 768px) {
          .api-key-input {
            flex-direction: column;
          }

          .manifest-status {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}