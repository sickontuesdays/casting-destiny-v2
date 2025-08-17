// components/AdminPanel.js
// Updated Admin Panel with Manual Manifest Pull

import { useState, useEffect, useContext } from 'react'
import { useAuth } from '../lib/useAuth'
import { AppContext } from '../pages/_app'
import { getManifestManager } from '../lib/manifest-manager'

export default function AdminPanel() {
  const { session } = useAuth()
  const { manifest, refreshManifest } = useContext(AppContext)
  
  const [pulling, setPulling] = useState(false)
  const [pullStatus, setPullStatus] = useState(null)
  const [adminPassword, setAdminPassword] = useState('')
  const [showPasswordInput, setShowPasswordInput] = useState(false)
  const [manifestInfo, setManifestInfo] = useState(null)
  const [error, setError] = useState(null)

  // Load manifest metadata on mount
  useEffect(() => {
    loadManifestInfo()
  }, [manifest])

  const loadManifestInfo = async () => {
    try {
      const manager = getManifestManager()
      const metadata = await manager.getMetadata()
      
      if (metadata) {
        setManifestInfo({
          version: metadata.version,
          lastUpdated: metadata.lastUpdated,
          itemCount: metadata.itemCount,
          size: metadata.size
        })
      }
    } catch (error) {
      console.error('Failed to load manifest info:', error)
    }
  }

  const handleManifestPull = async () => {
    if (!adminPassword) {
      setError('Admin password required')
      setShowPasswordInput(true)
      return
    }

    try {
      setPulling(true)
      setPullStatus('Connecting to Bungie API...')
      setError(null)
      
      const response = await fetch('/api/admin/manifest-pull', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': adminPassword
        }
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to pull manifest')
      }
      
      setPullStatus(`✅ Success! Version ${data.version} - ${data.itemCount} items`)
      
      // Refresh the manifest in the app
      setTimeout(() => {
        refreshManifest()
        loadManifestInfo()
      }, 1000)
      
    } catch (error) {
      console.error('Manifest pull failed:', error)
      setError(error.message)
      setPullStatus('❌ Failed to pull manifest')
    } finally {
      setPulling(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const formatSize = (bytes) => {
    if (!bytes) return 'Unknown'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  return (
    <div className="admin-panel">
      <div className="admin-section">
        <h2>Manifest Management</h2>
        
        {/* Current Manifest Info */}
        <div className="manifest-info">
          <h3>Current Manifest</h3>
          {manifestInfo ? (
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Version:</span>
                <span className="value">{manifestInfo.version || 'Not loaded'}</span>
              </div>
              <div className="info-item">
                <span className="label">Last Updated:</span>
                <span className="value">{formatDate(manifestInfo.lastUpdated)}</span>
              </div>
              <div className="info-item">
                <span className="label">Item Count:</span>
                <span className="value">{manifestInfo.itemCount || 0}</span>
              </div>
              <div className="info-item">
                <span className="label">Size:</span>
                <span className="value">{formatSize(manifestInfo.size)}</span>
              </div>
            </div>
          ) : (
            <p className="no-manifest">No manifest loaded</p>
          )}
        </div>

        {/* Manual Pull Section */}
        <div className="manifest-pull">
          <h3>Manual Manifest Pull</h3>
          <p className="description">
            Pull the latest manifest from Bungie and save it to GitHub.
            This should be done when you first set up the app and whenever
            you need to manually update the manifest.
          </p>
          
          {showPasswordInput && (
            <div className="password-input">
              <input
                type="password"
                placeholder="Enter admin password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleManifestPull()
                }}
              />
            </div>
          )}
          
          <button
            className="pull-btn"
            onClick={handleManifestPull}
            disabled={pulling}
          >
            {pulling ? 'Pulling...' : 'Pull Manifest from Bungie'}
          </button>
          
          {pullStatus && (
            <div className={`pull-status ${pullStatus.includes('✅') ? 'success' : ''}`}>
              {pullStatus}
            </div>
          )}
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        {/* Automated Updates Info */}
        <div className="automation-info">
          <h3>Automated Updates</h3>
          <div className="schedule-info">
            <p>
              <strong>Schedule:</strong> Every Tuesday at 1:30 PM EST
            </p>
            <p>
              <strong>Status:</strong> {manifest ? '✅ Active' : '⚠️ No manifest loaded'}
            </p>
            <p className="note">
              Automated updates are handled by GitHub Actions.
              Make sure your GitHub Action is configured with the
              BUNGIE_API_KEY secret.
            </p>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="admin-section">
        <h2>System Status</h2>
        <div className="status-grid">
          <div className="status-item">
            <span className="status-label">User Session:</span>
            <span className={`status-value ${session ? 'active' : 'inactive'}`}>
              {session ? '✅ Active' : '❌ Not authenticated'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Manifest:</span>
            <span className={`status-value ${manifest ? 'active' : 'inactive'}`}>
              {manifest ? '✅ Loaded' : '❌ Not loaded'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">GitHub Storage:</span>
            <span className={`status-value ${manifestInfo ? 'active' : 'inactive'}`}>
              {manifestInfo ? '✅ Connected' : '⚠️ Not connected'}
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .admin-panel {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .admin-section {
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid #333;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 24px;
        }
        
        .admin-section h2 {
          margin-top: 0;
          color: #ff6b35;
          border-bottom: 2px solid #ff6b35;
          padding-bottom: 8px;
        }
        
        .manifest-info, .manifest-pull, .automation-info {
          margin: 20px 0;
        }
        
        .info-grid, .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin-top: 16px;
        }
        
        .info-item, .status-item {
          display: flex;
          justify-content: space-between;
          padding: 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        
        .label, .status-label {
          font-weight: 600;
          color: #999;
        }
        
        .value {
          color: #fff;
        }
        
        .status-value.active {
          color: #4ade80;
        }
        
        .status-value.inactive {
          color: #f87171;
        }
        
        .password-input {
          margin: 16px 0;
        }
        
        .password-input input {
          width: 100%;
          max-width: 300px;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid #444;
          border-radius: 4px;
          color: #fff;
        }
        
        .pull-btn {
          background: #ff6b35;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .pull-btn:hover:not(:disabled) {
          background: #ff7f4f;
          transform: translateY(-1px);
        }
        
        .pull-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .pull-status {
          margin-top: 16px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          border-left: 4px solid #ff6b35;
        }
        
        .pull-status.success {
          border-left-color: #4ade80;
          color: #4ade80;
        }
        
        .error-message {
          margin-top: 16px;
          padding: 12px;
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid #f87171;
          border-radius: 4px;
          color: #f87171;
        }
        
        .description {
          color: #999;
          margin: 12px 0;
        }
        
        .note {
          color: #888;
          font-size: 14px;
          font-style: italic;
        }
        
        .no-manifest {
          color: #999;
          font-style: italic;
        }
      `}</style>
    </div>
  )
}