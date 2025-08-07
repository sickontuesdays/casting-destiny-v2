import { useState, useEffect } from 'react'

export default function AdminPanel() {
  const [manifestInfo, setManifestInfo] = useState(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateLog, setUpdateLog] = useState([])
  const [systemStats, setSystemStats] = useState(null)

  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    try {
      // Load manifest info
      const manifestResponse = await fetch('/api/bungie/manifest')
      const manifestData = await manifestResponse.json()
      setManifestInfo(manifestData)

      // Load system stats (simplified)
      setSystemStats({
        totalUsers: 'N/A',
        activeBuilds: 'N/A',
        lastUpdate: manifestData.lastUpdate || 'Unknown'
      })
    } catch (error) {
      console.error('Error loading admin data:', error)
    }
  }

  const updateManifest = async () => {
    setIsUpdating(true)
    const startTime = new Date()
    
    try {
      const response = await fetch('/api/bungie/manifest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          adminPassword: prompt('Enter admin password:') 
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        const endTime = new Date()
        const duration = (endTime - startTime) / 1000
        
        const logEntry = {
          timestamp: new Date().toISOString(),
          type: 'success',
          message: `Manifest updated successfully in ${duration}s`,
          details: result
        }
        
        setUpdateLog(prev => [logEntry, ...prev])
        setManifestInfo(result.manifest)
        alert('Manifest updated successfully!')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'error',
        message: `Manifest update failed: ${error.message}`
      }
      
      setUpdateLog(prev => [logEntry, ...prev])
      alert(`Update failed: ${error.message}`)
    } finally {
      setIsUpdating(false)
    }
  }

  const testBungieAPI = async () => {
    try {
      const response = await fetch('https://www.bungie.net/Platform/Destiny2/Manifest/')
      const data = await response.json()
      
      if (data.Response) {
        alert('Bungie API is accessible and responding normally')
      } else {
        alert('Bungie API returned unexpected response')
      }
    } catch (error) {
      alert(`Bungie API test failed: ${error.message}`)
    }
  }

  const clearUpdateLog = () => {
    setUpdateLog([])
  }

  return (
    <div className="admin-panel">
      <div className="admin-sections">
        
        {/* System Status */}
        <div className="admin-section">
          <h3>System Status</h3>
          <div className="status-grid">
            <div className="status-item">
              <label>Bungie API Status:</label>
              <span className="status-value success">✓ Connected</span>
            </div>
            <div className="status-item">
              <label>Last Manifest Update:</label>
              <span className="status-value">
                {manifestInfo?.lastUpdate 
                  ? new Date(manifestInfo.lastUpdate).toLocaleString()
                  : 'Unknown'
                }
              </span>
            </div>
            <div className="status-item">
              <label>Manifest Version:</label>
              <span className="status-value">{manifestInfo?.version || 'Unknown'}</span>
            </div>
            <div className="status-item">
              <label>Total Users:</label>
              <span className="status-value">{systemStats?.totalUsers || 'N/A'}</span>
            </div>
          </div>
          
          <div className="status-actions">
            <button className="test-btn" onClick={testBungieAPI}>
              Test Bungie API
            </button>
          </div>
        </div>

        {/* Manifest Management */}
        <div className="admin-section">
          <h3>Manifest Management</h3>
          <div className="manifest-info">
            <p>Current manifest contains:</p>
            <ul>
              <li>Weapons: {manifestInfo?.weapons ? Object.keys(manifestInfo.weapons).length : 'Unknown'}</li>
              <li>Armor: {manifestInfo?.armor ? Object.keys(manifestInfo.armor).length : 'Unknown'}</li>
              <li>Mods: {manifestInfo?.mods ? Object.keys(manifestInfo.mods).length : 'Unknown'}</li>
              <li>Subclasses: {manifestInfo?.subclasses ? Object.keys(manifestInfo.subclasses).length : 'Unknown'}</li>
            </ul>
          </div>
          
          <div className="manifest-actions">
            <button 
              className="update-btn"
              onClick={updateManifest}
              disabled={isUpdating}
            >
              {isUpdating ? 'Updating Manifest...' : 'Force Update Manifest'}
            </button>
            
            <div className="update-schedule">
              <p><strong>Automatic Updates:</strong> Every Tuesday at 1:30 PM EST</p>
            </div>
          </div>
        </div>

        {/* Seasonal Artifact */}
        <div className="admin-section">
          <h3>Seasonal Artifact</h3>
          <div className="artifact-info">
            <p>Current Season: {manifestInfo?.currentSeason || 'Unknown'}</p>
            <p>Artifact: {manifestInfo?.seasonalArtifact?.name || 'Unknown'}</p>
          </div>
          
          <div className="artifact-actions">
            <button className="update-btn">Update Artifact Mods</button>
            <button className="config-btn">Configure Season</button>
          </div>
        </div>

        {/* Update Log */}
        <div className="admin-section">
          <h3>Update Log</h3>
          <div className="log-actions">
            <button className="clear-btn" onClick={clearUpdateLog}>
              Clear Log
            </button>
          </div>
          
          <div className="update-log">
            {updateLog.length === 0 ? (
              <p className="no-logs">No recent updates</p>
            ) : (
              <div className="log-entries">
                {updateLog.map((entry, index) => (
                  <div key={index} className={`log-entry ${entry.type}`}>
                    <div className="log-timestamp">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                    <div className="log-message">{entry.message}</div>
                    {entry.details && (
                      <div className="log-details">
                        <pre>{JSON.stringify(entry.details, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Build Statistics */}
        <div className="admin-section">
          <h3>Build Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <label>Total Builds Created:</label>
              <span className="stat-value">{systemStats?.activeBuilds || 'N/A'}</span>
            </div>
            <div className="stat-item">
              <label>Most Popular Exotic:</label>
              <span className="stat-value">Analyzing...</span>
            </div>
            <div className="stat-item">
              <label>Most Popular Build Type:</label>
              <span className="stat-value">Analyzing...</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}