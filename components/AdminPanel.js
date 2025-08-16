import { useState, useEffect, useContext } from 'react'
import { AppContext } from '../pages/_app'
import { useAuth } from '../lib/useAuth'

export default function AdminPanel() {
  const { session } = useAuth()
  const { manifest, refreshManifest } = useContext(AppContext)
  
  const [manifestStatus, setManifestStatus] = useState(null)
  const [isPulling, setIsPulling] = useState(false)
  const [pullResult, setPullResult] = useState(null)
  const [pullError, setPullError] = useState(null)
  const [systemStats, setSystemStats] = useState({
    manifestVersion: 'unknown',
    lastUpdated: 'never',
    itemCount: 0,
    cacheStatus: 'unknown'
  })

  // Check manifest status on load
  useEffect(() => {
    checkManifestStatus()
  }, [])

  const checkManifestStatus = async () => {
    try {
      const response = await fetch('/api/github/manifest/status')
      
      if (response.ok) {
        const status = await response.json()
        setManifestStatus(status)
        
        setSystemStats({
          manifestVersion: status.version || 'not cached',
          lastUpdated: status.lastUpdated ? new Date(status.lastUpdated).toLocaleString() : 'never',
          itemCount: status.itemCount || 0,
          cacheStatus: status.exists ? (status.isStale ? 'stale' : 'current') : 'empty'
        })
      } else if (response.status === 404) {
        setManifestStatus({ exists: false })
        setSystemStats(prev => ({ ...prev, cacheStatus: 'empty' }))
      }
    } catch (error) {
      console.error('Failed to check manifest status:', error)
    }
  }

  const handleManifestPull = async () => {
    if (!session) {
      setPullError('You must be logged in to pull the manifest')
      return
    }

    setIsPulling(true)
    setPullResult(null)
    setPullError(null)

    try {
      console.log('🔄 Starting manifest pull from Bungie...')
      
      const response = await fetch('/api/admin/manifest-pull', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (response.ok) {
        setPullResult(result)
        console.log('✅ Manifest pull successful:', result)
        
        // Refresh the manifest in the app context
        await refreshManifest()
        
        // Update status
        await checkManifestStatus()
      } else {
        setPullError(result.error || 'Failed to pull manifest')
        console.error('❌ Manifest pull failed:', result)
      }
    } catch (error) {
      console.error('❌ Error pulling manifest:', error)
      setPullError(error.message || 'Network error while pulling manifest')
    } finally {
      setIsPulling(false)
    }
  }

  const handleClearCache = async () => {
    if (confirm('Are you sure you want to clear the manifest cache? The app will need to re-download it.')) {
      // This would call an API to clear GitHub cache
      alert('Cache clearing not yet implemented')
    }
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>System Administration</h2>
        <p>Manage manifest data and system settings</p>
      </div>

      {/* User Info */}
      <div className="admin-section">
        <h3>Current User</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">Username:</span>
            <span className="value">{session?.user?.displayName || 'Not logged in'}</span>
          </div>
          <div className="info-item">
            <span className="label">Platform:</span>
            <span className="value">{session?.user?.platforms?.[0] || 'Unknown'}</span>
          </div>
          <div className="info-item">
            <span className="label">Membership ID:</span>
            <span className="value">{session?.user?.membershipId || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Manifest Management */}
      <div className="admin-section">
        <h3>Manifest Management</h3>
        
        <div className="manifest-status">
          <div className="status-grid">
            <div className="status-item">
              <span className="label">Cache Status:</span>
              <span className={`value status-${systemStats.cacheStatus}`}>
                {systemStats.cacheStatus}
              </span>
            </div>
            <div className="status-item">
              <span className="label">Version:</span>
              <span className="value">{systemStats.manifestVersion}</span>
            </div>
            <div className="status-item">
              <span className="label">Last Updated:</span>
              <span className="value">{systemStats.lastUpdated}</span>
            </div>
            <div className="status-item">
              <span className="label">Item Count:</span>
              <span className="value">{systemStats.itemCount.toLocaleString()}</span>
            </div>
          </div>

          {manifestStatus?.isStale && (
            <div className="warning-message">
              ⚠️ The cached manifest is older than 7 days and should be updated.
            </div>
          )}

          {!manifestStatus?.exists && (
            <div className="error-message">
              ❌ No manifest is currently cached. Please pull the manifest from Bungie.
            </div>
          )}
        </div>

        <div className="manifest-actions">
          <button 
            className="btn-primary"
            onClick={handleManifestPull}
            disabled={isPulling}
          >
            {isPulling ? (
              <>
                <span className="spinner"></span>
                Pulling Manifest...
              </>
            ) : (
              '🔄 Pull Manifest from Bungie'
            )}
          </button>

          <button 
            className="btn-secondary"
            onClick={checkManifestStatus}
            disabled={isPulling}
          >
            🔍 Check Status
          </button>

          <button 
            className="btn-danger"
            onClick={handleClearCache}
            disabled={isPulling || !manifestStatus?.exists}
          >
            🗑️ Clear Cache
          </button>
        </div>

        {/* Pull Result */}
        {pullResult && (
          <div className="success-message">
            <h4>✅ Manifest Pull Successful!</h4>
            <ul>
              <li>Version: {pullResult.version}</li>
              <li>Items: {pullResult.itemCount?.toLocaleString()}</li>
              <li>Tables: {pullResult.tables?.length}</li>
              {pullResult.warning && (
                <li className="warning">⚠️ {pullResult.warning}</li>
              )}
            </ul>
          </div>
        )}

        {/* Pull Error */}
        {pullError && (
          <div className="error-message">
            <h4>❌ Pull Failed</h4>
            <p>{pullError}</p>
          </div>
        )}
      </div>

      {/* Scheduled Updates */}
      <div className="admin-section">
        <h3>Automated Updates</h3>
        <div className="info-box">
          <p>
            The manifest is scheduled to automatically update every Tuesday at 1:30 PM EST
            after the weekly Destiny 2 reset.
          </p>
          <p className="note">
            Note: Automated updates require a GitHub Action or external cron job to be configured.
          </p>
        </div>
      </div>

      {/* System Health */}
      <div className="admin-section">
        <h3>System Health</h3>
        <div className="health-grid">
          <div className="health-item">
            <span className="indicator green"></span>
            <span>Authentication Service</span>
          </div>
          <div className="health-item">
            <span className={`indicator ${manifest ? 'green' : 'yellow'}`}></span>
            <span>Manifest Service</span>
          </div>
          <div className="health-item">
            <span className={`indicator ${manifestStatus?.exists ? 'green' : 'red'}`}></span>
            <span>GitHub Cache</span>
          </div>
          <div className="health-item">
            <span className="indicator green"></span>
            <span>Bungie API</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .admin-panel {
          padding: 20px;
        }

        .admin-header {
          margin-bottom: 30px;
        }

        .admin-header h2 {
          margin: 0 0 10px 0;
        }

        .admin-section {
          background: var(--card-bg, #1a1a2e);
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .admin-section h3 {
          margin: 0 0 20px 0;
          color: var(--primary, #4a9eff);
        }

        .info-grid, .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .info-item, .status-item {
          display: flex;
          flex-direction: column;
        }

        .label {
          font-size: 12px;
          color: var(--text-secondary, #888);
          margin-bottom: 5px;
        }

        .value {
          font-size: 16px;
          font-weight: 500;
        }

        .status-current { color: #4ade80; }
        .status-stale { color: #fbbf24; }
        .status-empty { color: #f87171; }

        .manifest-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .btn-primary, .btn-secondary, .btn-danger {
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s;
        }

        .btn-primary {
          background: var(--primary, #4a9eff);
          color: white;
        }

        .btn-secondary {
          background: var(--secondary, #6b7280);
          color: white;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-primary:disabled, .btn-secondary:disabled, .btn-danger:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .success-message, .error-message, .warning-message {
          padding: 15px;
          border-radius: 5px;
          margin-top: 20px;
        }

        .success-message {
          background: rgba(74, 222, 128, 0.1);
          border: 1px solid #4ade80;
          color: #4ade80;
        }

        .error-message {
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid #f87171;
          color: #f87171;
        }

        .warning-message {
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid #fbbf24;
          color: #fbbf24;
        }

        .health-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .health-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .indicator.green { background: #4ade80; }
        .indicator.yellow { background: #fbbf24; }
        .indicator.red { background: #f87171; }

        .spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-right: 8px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .info-box {
          background: rgba(74, 158, 255, 0.1);
          padding: 15px;
          border-radius: 5px;
          border: 1px solid rgba(74, 158, 255, 0.3);
        }

        .note {
          font-size: 12px;
          color: var(--text-secondary, #888);
          margin-top: 10px;
        }
      `}</style>
    </div>
  )
}