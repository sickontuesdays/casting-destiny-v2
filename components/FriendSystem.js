import { useState, useEffect } from 'react'
import { useAuth } from '../lib/useAuth'

export default function FriendSystem() {
  const { session } = useAuth()
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState(null)
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    if (session?.user) {
      loadFriends()
    }
  }, [session])

  const loadFriends = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Loading friends from Bungie API...')
      
      const response = await fetch('/api/bungie/friends', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        if (response.status === 401) {
          throw new Error('Authentication expired. Please sign in again.')
        } else if (response.status === 503) {
          throw new Error('Bungie.net is currently under maintenance.')
        } else {
          throw new Error(errorData.error || `Failed to load friends (${response.status})`)
        }
      }
      
      const data = await response.json()
      
      console.log('Bungie friends loaded:', data.summary)
      
      setFriends(data.friends || [])
      setSummary(data.summary || {})
      setLastUpdated(data.lastUpdated)
      
    } catch (error) {
      console.error('Error loading friends:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredFriends = friends.filter(friend => {
    switch (selectedFilter) {
      case 'bungie':
        return friend.source === 'bungie' || friend.source === 'bungie_and_clan'
      case 'clan':
        return friend.source === 'clan' || friend.source === 'bungie_and_clan'
      case 'online':
        return friend.isOnline
      default:
        return true
    }
  })

  const getSourceLabel = (source) => {
    switch (source) {
      case 'bungie':
        return '🎮 Bungie Friend'
      case 'clan':
        return '⚡ Clan Member'
      case 'bungie_and_clan':
        return '🎮⚡ Friend & Clan'
      default:
        return '👤 Friend'
    }
  }

  const getSourceColor = (source) => {
    switch (source) {
      case 'bungie':
        return '#4a9eff'
      case 'clan':
        return '#ff6b35'
      case 'bungie_and_clan':
        return '#ffd700'
      default:
        return '#888'
    }
  }

  const renderFriend = (friend) => (
    <div key={friend.membershipId} className="friend-item bungie-friend">
      <div className="friend-info">
        <div className="friend-name">
          <div className="friend-details">
            <span className="display-name">{friend.displayName}</span>
            {friend.displayNameCode && (
              <span className="name-code">#{friend.displayNameCode}</span>
            )}
          </div>
          <div className="friend-status">
            <span 
              className="source-badge"
              style={{ backgroundColor: getSourceColor(friend.source) }}
            >
              {getSourceLabel(friend.source)}
            </span>
          </div>
        </div>
        
        <div className="friend-meta">
          <span className={`status-indicator ${friend.isOnline ? 'online' : 'offline'}`}>
            {friend.isOnline ? '🟢 Online' : '⚫ Offline'}
          </span>
          {friend.joinDate && (
            <span className="join-date">
              Joined: {new Date(friend.joinDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <div className="friend-actions">
        <button 
          className="action-btn share-build"
          title="Share Build (Coming Soon)"
          disabled
        >
          📤 Share
        </button>
      </div>
    </div>
  )

  if (!session?.user) {
    return (
      <div className="friend-system-auth">
        <p>Sign in to view your Destiny friends</p>
      </div>
    )
  }

  return (
    <div className="friend-system">
      <div className="friend-header">
        <div className="header-info">
          <h3>Destiny Friends</h3>
          {summary && (
            <div className="friend-summary">
              <span className="summary-item">
                <strong>{summary.total}</strong> total
              </span>
              <span className="summary-item">
                <strong>{summary.online}</strong> online
              </span>
            </div>
          )}
        </div>
        
        <button 
          onClick={loadFriends}
          className="refresh-btn"
          disabled={loading}
          title="Refresh friends from Bungie"
        >
          {loading ? '⏳' : '🔄'}
        </button>
      </div>

      {/* Source Filters */}
      <div className="friend-filters">
        <button 
          className={`filter-btn ${selectedFilter === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('all')}
        >
          All ({friends.length})
        </button>
        <button 
          className={`filter-btn ${selectedFilter === 'bungie' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('bungie')}
        >
          🎮 Bungie ({summary?.sources?.bungie + summary?.sources?.both || 0})
        </button>
        <button 
          className={`filter-btn ${selectedFilter === 'clan' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('clan')}
        >
          ⚡ Clan ({summary?.sources?.clan + summary?.sources?.both || 0})
        </button>
        <button 
          className={`filter-btn ${selectedFilter === 'online' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('online')}
        >
          🟢 Online ({summary?.online || 0})
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <div className="error-details">
            <strong>Failed to load friends</strong>
            <p>{error}</p>
          </div>
          <button onClick={loadFriends} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      <div className="friend-content">
        {loading && friends.length === 0 && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <span>Loading friends from Bungie...</span>
          </div>
        )}

        {!loading && friends.length === 0 && !error && (
          <div className="no-friends">
            <h4>No friends found</h4>
            <p>Add friends on Bungie.net or join a clan to see them here for build sharing.</p>
          </div>
        )}

        {filteredFriends.length === 0 && friends.length > 0 && !loading && (
          <div className="no-results">
            <h4>No friends match this filter</h4>
            <p>Try selecting a different filter option.</p>
          </div>
        )}

        <div className="friends-list">
          {filteredFriends.map(renderFriend)}
        </div>
      </div>

      {lastUpdated && (
        <div className="friend-footer">
          <span className="last-updated">
            Updated: {new Date(lastUpdated).toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  )
}