import { useState, useEffect } from 'react'
import { useAuth } from '../lib/useAuth'

export default function FriendSystem() {
  const { session, isLoading } = useAuth()
  const [friends, setFriends] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (session?.user) {
      loadFriends()
      loadPendingRequests()
    }
  }, [session])

  const loadFriends = async () => {
    try {
      const response = await fetch('/api/friends', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setFriends(data.friends || [])
      } else {
        console.error('Failed to load friends')
      }
    } catch (error) {
      console.error('Error loading friends:', error)
      setError('Failed to load friends')
    }
  }

  const loadPendingRequests = async () => {
    try {
      const response = await fetch('/api/friends?type=pending', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setPendingRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Error loading pending requests:', error)
    }
  }

  const searchUsers = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch('/api/friends/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ searchTerm })
      })

      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.users || [])
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('Error searching users:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const sendFriendRequest = async (targetUserId) => {
    try {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ targetUserId })
      })

      if (response.ok) {
        // Remove from search results or update UI
        setSearchResults(prev => 
          prev.map(user => 
            user.membershipId === targetUserId 
              ? { ...user, requestSent: true }
              : user
          )
        )
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to send friend request')
      }
    } catch (error) {
      console.error('Error sending friend request:', error)
      setError('Failed to send friend request')
    }
  }

  const respondToRequest = async (requestId, accept) => {
    try {
      const response = await fetch('/api/friends/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ requestId, accept })
      })

      if (response.ok) {
        // Reload friends and pending requests
        loadFriends()
        loadPendingRequests()
      } else {
        setError('Failed to respond to friend request')
      }
    } catch (error) {
      console.error('Error responding to friend request:', error)
      setError('Failed to respond to friend request')
    }
  }

  const removeFriend = async (friendId) => {
    try {
      const response = await fetch('/api/friends/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ friendId })
      })

      if (response.ok) {
        setFriends(prev => prev.filter(friend => friend.membershipId !== friendId))
      } else {
        setError('Failed to remove friend')
      }
    } catch (error) {
      console.error('Error removing friend:', error)
      setError('Failed to remove friend')
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    searchUsers(searchTerm)
  }

  if (isLoading) {
    return (
      <div className="friend-system">
        <div className="loading">Loading friends...</div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="friend-system">
        <div className="auth-required">
          <p>Sign in to view and manage your friends</p>
        </div>
      </div>
    )
  }

  return (
    <div className="friend-system">
      <div className="friend-system-header">
        <h3>Friends</h3>
      </div>

      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Search Section */}
      <div className="friend-search">
        <form onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Search for players by Bungie name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" disabled={isSearching}>
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="search-results">
            <h4>Search Results</h4>
            <div className="user-list">
              {searchResults.map(user => (
                <div key={user.membershipId} className="user-item">
                  <div className="user-info">
                    <span className="user-name">{user.displayName}</span>
                    <span className="user-code">#{user.bungieGlobalDisplayNameCode}</span>
                  </div>
                  <div className="user-actions">
                    {user.requestSent ? (
                      <span className="request-sent">Request Sent</span>
                    ) : user.isFriend ? (
                      <span className="already-friend">Already Friends</span>
                    ) : (
                      <button 
                        onClick={() => sendFriendRequest(user.membershipId)}
                        className="add-friend-btn"
                      >
                        Add Friend
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="pending-requests">
          <h4>Pending Friend Requests</h4>
          <div className="request-list">
            {pendingRequests.map(request => (
              <div key={request.id} className="request-item">
                <div className="request-info">
                  <span className="requester-name">{request.requesterName}</span>
                  <span className="request-date">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="request-actions">
                  <button 
                    onClick={() => respondToRequest(request.id, true)}
                    className="accept-btn"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => respondToRequest(request.id, false)}
                    className="decline-btn"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className="friends-list">
        <h4>Your Friends ({friends.length})</h4>
        {friends.length === 0 ? (
          <div className="no-friends">
            <p>No friends yet. Search for players above to add them!</p>
          </div>
        ) : (
          <div className="friend-list">
            {friends.map(friend => (
              <div key={friend.membershipId} className="friend-item">
                <div className="friend-info">
                  <span className="friend-name">{friend.displayName}</span>
                  <span className="friend-status">
                    {friend.isOnline ? 'Online' : 'Offline'}
                  </span>
                  {friend.lastPlayed && (
                    <span className="last-played">
                      Last played: {new Date(friend.lastPlayed).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="friend-actions">
                  <button 
                    onClick={() => removeFriend(friend.membershipId)}
                    className="remove-friend-btn"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}