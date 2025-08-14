import { useState, useEffect } from 'react'
import { useAuth } from '../lib/useAuth'

export default function FriendSystem() {
  const { session } = useAuth()
  const [friends, setFriends] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('friends')

  useEffect(() => {
    if (session?.user) {
      loadFriendData()
    }
  }, [session])

  const loadFriendData = async () => {
    if (!session?.user) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/friends', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setFriends(data.friends || [])
        setPendingRequests(data.pendingRequests || [])
        setSentRequests(data.sentRequests || [])
      } else {
        throw new Error('Failed to load friend data')
      }
    } catch (error) {
      console.error('Error loading friends:', error)
      setError(error.message)
      
      // Load mock data for demo
      loadMockFriendData()
    } finally {
      setIsLoading(false)
    }
  }

  const loadMockFriendData = () => {
    setFriends([
      {
        membershipId: 'mock-friend-1',
        displayName: 'GuardianOne',
        displayNameCode: '1234',
        isOnline: true,
        lastSeen: new Date().toISOString(),
        addedAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        membershipId: 'mock-friend-2',
        displayName: 'DestinyPro',
        displayNameCode: '5678',
        isOnline: false,
        lastSeen: new Date(Date.now() - 3600000).toISOString(),
        addedAt: new Date(Date.now() - 604800000).toISOString()
      }
    ])

    setPendingRequests([
      {
        id: 'pending-1',
        requesterId: 'mock-requester-1',
        requesterName: 'NewGuardian',
        requesterCode: '9999',
        createdAt: new Date(Date.now() - 1800000).toISOString()
      }
    ])

    setSentRequests([
      {
        id: 'sent-1',
        targetUserId: 'mock-target-1',
        sentAt: new Date(Date.now() - 900000).toISOString()
      }
    ])
  }

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsLoading(true)
    try {
      // Mock search results for demo
      const mockResults = [
        {
          membershipId: 'search-result-1',
          displayName: query + 'Player',
          displayNameCode: '1111',
          membershipType: 3,
          isOnline: Math.random() > 0.5
        },
        {
          membershipId: 'search-result-2', 
          displayName: 'Destiny' + query,
          displayNameCode: '2222',
          membershipType: 2,
          isOnline: Math.random() > 0.5
        }
      ]

      setSearchResults(mockResults)
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const sendFriendRequest = async (targetUserId, targetDisplayName) => {
    try {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          targetUserId,
          targetDisplayName 
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Add to sent requests
        setSentRequests(prev => [...prev, {
          id: data.requestId,
          targetUserId,
          sentAt: new Date().toISOString()
        }])

        // Remove from search results
        setSearchResults(prev => 
          prev.filter(user => user.membershipId !== targetUserId)
        )

        console.log('Friend request sent successfully')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send friend request')
      }
    } catch (error) {
      console.error('Error sending friend request:', error)
      setError(error.message)
    }
  }

  const respondToFriendRequest = async (requestId, accept) => {
    try {
      const response = await fetch('/api/friends/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          requestId, 
          accept 
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Remove from pending requests
        const request = pendingRequests.find(req => req.id === requestId)
        setPendingRequests(prev => 
          prev.filter(req => req.id !== requestId)
        )

        if (accept && request) {
          // Add to friends list
          setFriends(prev => [...prev, {
            membershipId: request.requesterId,
            displayName: request.requesterName,
            displayNameCode: request.requesterCode,
            isOnline: false,
            addedAt: new Date().toISOString()
          }])
        }

        console.log(`Friend request ${accept ? 'accepted' : 'declined'}`)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to respond to friend request')
      }
    } catch (error) {
      console.error('Error responding to friend request:', error)
      setError(error.message)
    }
  }

  const removeFriend = async (friendId) => {
    if (!confirm('Are you sure you want to remove this friend?')) {
      return
    }

    try {
      // Mock removal for demo
      setFriends(prev => 
        prev.filter(friend => friend.membershipId !== friendId)
      )
      
      console.log('Friend removed')
    } catch (error) {
      console.error('Error removing friend:', error)
      setError(error.message)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    searchUsers(searchQuery)
  }

  const formatLastSeen = (timestamp) => {
    const now = new Date()
    const lastSeen = new Date(timestamp)
    const diffMs = now - lastSeen
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    return `${diffDays} days ago`
  }

  const renderFriendsList = () => (
    <div className="friends-list">
      {friends.length === 0 ? (
        <div className="empty-state">
          <p>No friends yet</p>
          <p>Search for players to add as friends!</p>
        </div>
      ) : (
        friends.map(friend => (
          <div key={friend.membershipId} className="friend-item">
            <div className="friend-info">
              <div className="friend-name">
                <span className="display-name">{friend.displayName}</span>
                <span className="name-code">#{friend.displayNameCode}</span>
              </div>
              <div className="friend-status">
                <span className={`status-indicator ${friend.isOnline ? 'online' : 'offline'}`}>
                  {friend.isOnline ? '🟢 Online' : '🔴 Offline'}
                </span>
                {!friend.isOnline && friend.lastSeen && (
                  <span className="last-seen">
                    Last seen: {formatLastSeen(friend.lastSeen)}
                  </span>
                )}
              </div>
            </div>
            <div className="friend-actions">
              <button 
                className="action-btn invite"
                onClick={() => console.log('Invite to fireteam')}
                disabled={!friend.isOnline}
              >
                Invite
              </button>
              <button 
                className="action-btn remove"
                onClick={() => removeFriend(friend.membershipId)}
              >
                Remove
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )

  const renderPendingRequests = () => (
    <div className="pending-requests">
      {pendingRequests.length === 0 ? (
        <div className="empty-state">
          <p>No pending friend requests</p>
        </div>
      ) : (
        pendingRequests.map(request => (
          <div key={request.id} className="request-item">
            <div className="request-info">
              <div className="requester-name">
                <span className="display-name">{request.requesterName}</span>
                <span className="name-code">#{request.requesterCode}</span>
              </div>
              <div className="request-time">
                {formatLastSeen(request.createdAt)}
              </div>
            </div>
            <div className="request-actions">
              <button 
                className="action-btn accept"
                onClick={() => respondToFriendRequest(request.id, true)}
              >
                Accept
              </button>
              <button 
                className="action-btn decline"
                onClick={() => respondToFriendRequest(request.id, false)}
              >
                Decline
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )

  const renderSentRequests = () => (
    <div className="sent-requests">
      {sentRequests.length === 0 ? (
        <div className="empty-state">
          <p>No outgoing friend requests</p>
        </div>
      ) : (
        sentRequests.map(request => (
          <div key={request.id} className="request-item">
            <div className="request-info">
              <div className="target-info">
                Request sent
              </div>
              <div className="request-time">
                {formatLastSeen(request.sentAt)}
              </div>
            </div>
            <div className="request-status">
              <span className="status-badge pending">Pending</span>
            </div>
          </div>
        ))
      )}
    </div>
  )

  const renderSearch = () => (
    <div className="friend-search">
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for guardians..."
          className="search-input"
        />
        <button 
          type="submit" 
          className="search-btn"
          disabled={isLoading || !searchQuery.trim()}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {searchResults.length > 0 && (
        <div className="search-results">
          <h4>Search Results</h4>
          {searchResults.map(user => (
            <div key={user.membershipId} className="search-result-item">
              <div className="user-info">
                <div className="user-name">
                  <span className="display-name">{user.displayName}</span>
                  <span className="name-code">#{user.displayNameCode}</span>
                </div>
                <div className="user-platform">
                  {user.membershipType === 1 ? 'Xbox' :
                   user.membershipType === 2 ? 'PlayStation' :
                   user.membershipType === 3 ? 'Steam' : 'Unknown'}
                </div>
              </div>
              <div className="search-actions">
                <button 
                  className="action-btn add-friend"
                  onClick={() => sendFriendRequest(user.membershipId, user.displayName)}
                >
                  Add Friend
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  if (!session?.user) {
    return (
      <div className="friend-system-auth">
        <p>Please sign in to use the friend system</p>
      </div>
    )
  }

  return (
    <div className="friend-system">
      <div className="friend-header">
        <h3>Friends & Social</h3>
        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}
      </div>

      <div className="friend-tabs">
        <button 
          className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          Friends ({friends.length})
        </button>
        <button 
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Requests ({pendingRequests.length})
        </button>
        <button 
          className={`tab ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          Sent ({sentRequests.length})
        </button>
        <button 
          className={`tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          Search
        </button>
      </div>

      <div className="friend-content">
        {isLoading && activeTab !== 'search' && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <span>Loading...</span>
          </div>
        )}

        {activeTab === 'friends' && renderFriendsList()}
        {activeTab === 'pending' && renderPendingRequests()}
        {activeTab === 'sent' && renderSentRequests()}
        {activeTab === 'search' && renderSearch()}
      </div>

      <div className="friend-footer">
        <button 
          onClick={loadFriendData}
          className="refresh-btn"
          disabled={isLoading}
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  )
}