import { useState, useEffect } from 'react'
import { useAuth } from '../lib/useAuth'

export default function FriendSystem() {
  const { session } = useAuth()
  const [friends, setFriends] = useState([])
  const [clanMembers, setClanMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('friends')
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (session) {
      loadFriendsAndClan()
    }
  }, [session])

  const loadFriendsAndClan = async () => {
    try {
      const [friendsResponse, clanResponse] = await Promise.all([
        fetch('/api/friends?type=destiny-friends'),
        fetch('/api/friends?type=clan-members')
      ])

      const friendsData = await friendsResponse.json()
      const clanData = await clanResponse.json()

      setFriends(friendsData)
      setClanMembers(clanData)
    } catch (error) {
      console.error('Error loading friends and clan:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!message.trim() || !selectedFriend) return

    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-message',
          friendId: selectedFriend.membershipId,
          message: message.trim()
        })
      })

      if (response.ok) {
        setMessage('')
        // Show success notification
        alert('Message sent! (Note: This is a simplified implementation)')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const shareBuild = async (friendId, buildData) => {
    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'share-build',
          friendId,
          buildId: buildData.id
        })
      })

      if (response.ok) {
        alert('Build shared successfully!')
      }
    } catch (error) {
      console.error('Error sharing build:', error)
    }
  }

  const renderFriendsList = (friendsList, title) => (
    <div className="friends-list">
      <h4>{title}</h4>
      {friendsList.length === 0 ? (
        <div className="no-friends">
          <p>No {title.toLowerCase()} found</p>
        </div>
      ) : (
        <div className="friends-grid">
          {friendsList.map((friend) => (
            <div 
              key={friend.membershipId}
              className={`friend-card ${friend.isOnline ? 'online' : 'offline'} ${!friend.hasUsedApp ? 'not-registered' : ''}`}
              onClick={() => setSelectedFriend(friend)}
            >
              <div className="friend-avatar">
                {friend.profilePicture ? (
                  <img 
                    src={`https://www.bungie.net${friend.profilePicture}`}
                    alt={friend.displayName}
                  />
                ) : (
                  <div className="default-avatar">
                    {friend.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className={`status-indicator ${friend.isOnline ? 'online' : 'offline'}`}></div>
              </div>
              
              <div className="friend-info">
                <div className="friend-name">{friend.displayName}</div>
                <div className="friend-status">
                  {friend.isOnline ? (
                    friend.lastPlayed ? `Playing ${friend.lastPlayed.activity}` : 'Online'
                  ) : (
                    friend.lastSeen ? `Last seen ${friend.lastSeen}` : 'Offline'
                  )}
                </div>
                {!friend.hasUsedApp && (
                  <div className="app-status">Not using Casting Destiny</div>
                )}
              </div>

              {friend.hasUsedApp && (
                <div className="friend-actions">
                  <button 
                    className="message-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedFriend(friend)
                    }}
                  >
                    💬
                  </button>
                  <button 
                    className="share-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      // This would open a build selection dialog
                      alert('Build sharing coming soon!')
                    }}
                  >
                    📤
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="friend-system">
        <div className="loading-friends">
          <div className="loading-spinner"></div>
          <p>Loading friends and clan members...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="friend-system">
      <div className="friends-tabs">
        <button 
          className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          Friends ({friends.length})
        </button>
        <button 
          className={`tab ${activeTab === 'clan' ? 'active' : ''}`}
          onClick={() => setActiveTab('clan')}
        >
          Clan ({clanMembers.length})
        </button>
      </div>

      <div className="friends-content">
        {activeTab === 'friends' && renderFriendsList(friends, 'Destiny Friends')}
        {activeTab === 'clan' && renderFriendsList(clanMembers, 'Clan Members')}
      </div>

      {selectedFriend && (
        <div className="message-panel">
          <div className="message-header">
            <h4>Message {selectedFriend.displayName}</h4>
            <button 
              className="close-message"
              onClick={() => setSelectedFriend(null)}
            >
              ×
            </button>
          </div>
          
          <div className="message-content">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              rows={3}
              className="message-input"
            />
            
            <div className="message-actions">
              <button 
                onClick={sendMessage}
                disabled={!message.trim()}
                className="send-btn"
              >
                Send Message
              </button>
            </div>
          </div>

          <div className="quick-actions">
            <h5>Quick Actions:</h5>
            <button className="quick-action">Share Current Build</button>
            <button className="quick-action">Invite to Fireteam</button>
            <button className="quick-action">View Profile</button>
          </div>
        </div>
      )}

      <div className="friends-info">
        <p className="info-text">
          Friends and clan members who haven't used Casting Destiny yet appear greyed out. 
          They'll be able to receive shared builds and messages once they sign in.
        </p>
      </div>
    </div>
  )
}