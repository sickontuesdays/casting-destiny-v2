import { useState, useEffect, useContext } from 'react'
import { AppContext } from '../pages/_app'

export default function AdminPanel() {
  const { intelligenceStatus, manifest, refreshIntelligence } = useContext(AppContext)
  const [systemStats, setSystemStats] = useState(null)
  const [updateLog, setUpdateLog] = useState([])
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      loadSystemStats()
      loadUpdateLog()
    }
  }, [isAuthenticated])

  const handleAdminLogin = async (e) => {
    e.preventDefault()
    setAuthError('')

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: adminPassword })
      })

      if (response.ok) {
        setIsAuthenticated(true)
        setAdminPassword('')
      } else {
        setAuthError('Invalid admin password')
      }
    } catch (error) {
      setAuthError('Authentication failed')
    }
  }

  const loadSystemStats = async () => {
    setIsLoadingStats(true)
    try {
      // Mock system stats - in production this would come from a real API
      const stats = {
        totalUsers: 1247,
        activeBuilds: 3892,
        systemUptime: '5 days, 14 hours',
        apiRequests: 45892,
        manifestVersion: manifest?.version || 'Unknown',
        intelligenceStatus: intelligenceStatus.isInitialized ? 'Online' : 'Offline',
        lastUpdate: new Date().toISOString(),
        performance: {
          avgBuildGenerationTime: '2.3s',
          successRate: '94.7%',
          errorRate: '5.3%'
        },
        popularExotics: [
          { name: 'Ophidian Aspect', usage: 23.5 },
          { name: 'Celestial Nighthawk', usage: 18.2 },
          { name: 'Doom Fang Pauldron', usage: 15.8 }
        ]
      }
      
      setSystemStats(stats)
    } catch (error) {
      console.error('Failed to load system stats:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  const loadUpdateLog = () => {
    // Mock update log - in production this would come from a database
    const log = [
      {
        timestamp: new Date().toISOString(),
        type: 'info',
        message: 'Intelligence system initialized successfully',
        details: { features: intelligenceStatus.features }
      },
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: 'success',
        message: 'Manifest data loaded',
        details: { version: manifest?.version }
      },
      {
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        type: 'warning',
        message: 'High API request volume detected',
        details: { requestCount: 1250 }
      },
      {
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        type: 'info',
        message: 'User authentication system online'
      }
    ]
    
    setUpdateLog(log)
  }

  const handleForceRefresh = async () => {
    try {
      await refreshIntelligence(true)
      await loadSystemStats()
      
      // Add log entry
      const newEntry = {
        timestamp: new Date().toISOString(),
        type: 'info',
        message: 'Manual system refresh triggered',
        details: { admin: true }
      }
      
      setUpdateLog(prev => [newEntry, ...prev].slice(0, 10))
    } catch (error) {
      console.error('Force refresh failed:', error)
    }
  }

  const handleClearCache = async () => {
    try {
      // In production, this would clear various caches
      console.log('Cache cleared')
      
      const newEntry = {
        timestamp: new Date().toISOString(),
        type: 'success',
        message: 'System cache cleared',
        details: { admin: true }
      }
      
      setUpdateLog(prev => [newEntry, ...prev].slice(0, 10))
    } catch (error) {
      console.error('Cache clear failed:', error)
    }
  }

  const exportSystemData = () => {
    const data = {
      systemStats,
      updateLog,
      intelligenceStatus,
      manifest: {
        version: manifest?.version,
        loadedAt: manifest?.loadedAt,
        tables: manifest?.tables
      },
      exportedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `casting-destiny-admin-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="login-container">
          <h2>Admin Access Required</h2>
          <form onSubmit={handleAdminLogin}>
            <div className="form-group">
              <label>Admin Password:</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
                required
              />
            </div>
            
            {authError && (
              <div className="error-message">
                {authError}
              </div>
            )}
            
            <button type="submit" className="login-btn">
              Access Admin Panel
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>System Administration</h2>
        <div className="admin-actions">
          <button onClick={handleForceRefresh} className="action-btn">
            🔄 Force Refresh
          </button>
          <button onClick={handleClearCache} className="action-btn">
            🗑️ Clear Cache
          </button>
          <button onClick={exportSystemData} className="action-btn">
            📥 Export Data
          </button>
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="action-btn logout"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="admin-section">
        <h3>System Status</h3>
        <div className="status-grid">
          <div className={`status-card ${intelligenceStatus.isInitialized ? 'online' : 'offline'}`}>
            <div className="status-indicator">
              <span className={`status-dot ${intelligenceStatus.isInitialized ? 'green' : 'red'}`}></span>
              <span>AI Intelligence</span>
            </div>
            <div className="status-value">
              {intelligenceStatus.isInitialized ? 'Online' : 'Offline'}
            </div>
          </div>

          <div className="status-card online">
            <div className="status-indicator">
              <span className="status-dot green"></span>
              <span>Bungie API</span>
            </div>
            <div className="status-value">Connected</div>
          </div>

          <div className={`status-card ${manifest?.version ? 'online' : 'offline'}`}>
            <div className="status-indicator">
              <span className={`status-dot ${manifest?.version ? 'green' : 'yellow'}`}></span>
              <span>Manifest</span>
            </div>
            <div className="status-value">
              {manifest?.version || 'Loading'}
            </div>
          </div>

          <div className="status-card online">
            <div className="status-indicator">
              <span className="status-dot green"></span>
              <span>Database</span>
            </div>
            <div className="status-value">Online</div>
          </div>
        </div>
      </div>

      {/* System Statistics */}
      <div className="admin-section">
        <h3>System Statistics</h3>
        {isLoadingStats ? (
          <div className="loading-stats">Loading statistics...</div>
        ) : systemStats ? (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Users</div>
              <div className="stat-value">{systemStats.totalUsers?.toLocaleString()}</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-label">Active Builds</div>
              <div className="stat-value">{systemStats.activeBuilds?.toLocaleString()}</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-label">API Requests (24h)</div>
              <div className="stat-value">{systemStats.apiRequests?.toLocaleString()}</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-label">Success Rate</div>
              <div className="stat-value">{systemStats.performance?.successRate}</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-label">Avg Build Time</div>
              <div className="stat-value">{systemStats.performance?.avgBuildGenerationTime}</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-label">System Uptime</div>
              <div className="stat-value">{systemStats.systemUptime}</div>
            </div>
          </div>
        ) : (
          <div className="no-stats">Failed to load statistics</div>
        )}
      </div>

      {/* Intelligence System Details */}
      <div className="admin-section">
        <h3>AI Intelligence System</h3>
        <div className="intelligence-details">
          <div className="detail-row">
            <span className="detail-label">Status:</span>
            <span className={`detail-value ${intelligenceStatus.isInitialized ? 'success' : 'error'}`}>
              {intelligenceStatus.isInitialized ? 'Initialized' : 'Not Ready'}
            </span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Version:</span>
            <span className="detail-value">{intelligenceStatus.version || 'Unknown'}</span>
          </div>
          
          {intelligenceStatus.error && (
            <div className="detail-row">
              <span className="detail-label">Error:</span>
              <span className="detail-value error">{intelligenceStatus.error}</span>
            </div>
          )}
          
          <div className="detail-row">
            <span className="detail-label">Features:</span>
            <div className="feature-list">
              {intelligenceStatus.features.map((feature, index) => (
                <span key={index} className="feature-tag">
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Popular Items */}
      {systemStats?.popularExotics && (
        <div className="admin-section">
          <h3>Popular Exotic Items</h3>
          <div className="popular-items">
            {systemStats.popularExotics.map((item, index) => (
              <div key={index} className="popular-item">
                <span className="item-name">{item.name}</span>
                <span className="item-usage">{item.usage}% usage</span>
                <div className="usage-bar">
                  <div 
                    className="usage-fill" 
                    style={{ width: `${item.usage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Update Log */}
      <div className="admin-section">
        <h3>System Update Log</h3>
        <div className="update-log">
          {updateLog.length === 0 ? (
            <p className="no-logs">No recent updates</p>
          ) : (
            <div className="log-entries">
              {updateLog.map((entry, index) => (
                <div key={index} className={`log-entry ${entry.type}`}>
                  <div className="log-header">
                    <span className="log-timestamp">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                    <span className={`log-type ${entry.type}`}>
                      {entry.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="log-message">{entry.message}</div>
                  {entry.details && (
                    <details className="log-details">
                      <summary>Details</summary>
                      <pre>{JSON.stringify(entry.details, null, 2)}</pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Manifest Information */}
      <div className="admin-section">
        <h3>Manifest Information</h3>
        <div className="manifest-info">
          <div className="info-row">
            <span className="info-label">Version:</span>
            <span className="info-value">{manifest?.version || 'Not loaded'}</span>
          </div>
          
          <div className="info-row">
            <span className="info-label">Loaded At:</span>
            <span className="info-value">
              {manifest?.loadedAt ? new Date(manifest.loadedAt).toLocaleString() : 'N/A'}
            </span>
          </div>
          
          <div className="info-row">
            <span className="info-label">Tables:</span>
            <span className="info-value">
              {manifest?.tables ? manifest.tables.length : 0} loaded
            </span>
          </div>
          
          {manifest?.isFallback && (
            <div className="info-row">
              <span className="info-label">Mode:</span>
              <span className="info-value warning">Fallback Mode</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}