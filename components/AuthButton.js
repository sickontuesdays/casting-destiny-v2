import { useAuth } from '../lib/useAuth';
import { useState } from 'react';

const AuthButton = () => {
  const { 
    session, 
    loading, 
    error, 
    isRefreshing, 
    signIn, 
    signOut, 
    forceRefresh,
    isAuthenticated,
    isTokenExpired 
  } = useAuth();
  
  const [showUserDetails, setShowUserDetails] = useState(false);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '10px 15px',
        borderRadius: '10px',
        border: '1px solid rgba(244, 167, 36, 0.2)'
      }}>
        <div style={{
          width: '20px',
          height: '20px',
          border: '2px solid rgba(244, 167, 36, 0.2)',
          borderTop: '2px solid #f4a724',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <span style={{ color: '#b3b3b3' }}>Checking authentication...</span>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'rgba(255, 0, 0, 0.1)',
        padding: '10px 15px',
        borderRadius: '10px',
        border: '1px solid rgba(255, 0, 0, 0.3)'
      }}>
        <span style={{ color: '#ff6b6b' }}>⚠️ {error}</span>
        <button
          onClick={signIn}
          style={{
            background: '#f4a724',
            color: '#000',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          Retry Login
        </button>
      </div>
    );
  }

  if (isAuthenticated && session) {
    return (
      <div style={{ position: 'relative' }}>
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '10px 15px',
            borderRadius: '10px',
            border: '1px solid rgba(244, 167, 36, 0.2)',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onClick={() => setShowUserDetails(!showUserDetails)}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          {/* User Avatar */}
          <div style={{ position: 'relative' }}>
            <img 
              src={session.user.image || '/default-avatar.png'} 
              alt="Profile"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '2px solid #f4a724'
              }}
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name)}&background=f4a724&color=000&size=40`;
              }}
            />
            {/* Online indicator */}
            <div style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              width: '12px',
              height: '12px',
              background: '#4CAF50',
              border: '2px solid #1a1a2e',
              borderRadius: '50%'
            }}></div>
          </div>

          {/* User Info */}
          <div style={{ flex: 1 }}>
            <div style={{ 
              color: '#f4a724', 
              fontWeight: 'bold',
              fontSize: '1rem'
            }}>
              {session.user.name}
            </div>
            <div style={{ 
              color: '#b3b3b3', 
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>🌐 Connected to Bungie</span>
              {session.user.primaryMembership && (
                <span>• {session.user.primaryMembership.platformName}</span>
              )}
              {isTokenExpired && (
                <span style={{ color: '#FF9800' }}>⚠️ Refreshing...</span>
              )}
              {isRefreshing && (
                <span style={{ color: '#2196F3' }}>🔄 Updating...</span>
              )}
            </div>
          </div>

          {/* Dropdown Arrow */}
          <div style={{
            color: '#f4a724',
            fontSize: '1.2rem',
            transform: showUserDetails ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease'
          }}>
            ▼
          </div>
        </div>

        {/* User Details Dropdown */}
        {showUserDetails && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            right: '0',
            marginTop: '5px',
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: '10px',
            border: '1px solid rgba(244, 167, 36, 0.3)',
            padding: '15px',
            zIndex: 1000,
            minWidth: '300px'
          }}>
            {/* Session Info */}
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ 
                color: '#f4a724', 
                margin: '0 0 10px 0',
                fontSize: '1rem'
              }}>
                Session Information
              </h4>
              <div style={{ color: '#e6e6e6', fontSize: '0.85rem', lineHeight: '1.4' }}>
                <div>Member ID: {session.user.id}</div>
                {session.user.bungieNetUser?.userTitle && (
                  <div>Title: {session.user.bungieNetUser.userTitle}</div>
                )}
                <div>Session expires: {new Date(session.expires).toLocaleDateString()}</div>
                <div>Last activity: {new Date(session.lastActivity).toLocaleString()}</div>
              </div>
            </div>

            {/* Destiny Memberships */}
            {session.user.destinyMemberships && session.user.destinyMemberships.length > 0 && (
              <div style={{ marginBottom: '15px' }}>
                <h4 style={{ 
                  color: '#f4a724', 
                  margin: '0 0 10px 0',
                  fontSize: '1rem'
                }}>
                  Destiny Characters
                </h4>
                <div style={{ 
                  maxHeight: '120px', 
                  overflowY: 'auto',
                  fontSize: '0.85rem'
                }}>
                  {session.user.destinyMemberships.map((membership, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '5px 0',
                      borderBottom: index < session.user.destinyMemberships.length - 1 ? 
                        '1px solid rgba(244, 167, 36, 0.1)' : 'none'
                    }}>
                      <span style={{ color: '#e6e6e6' }}>
                        {membership.displayName}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          color: '#b3b3b3',
                          fontSize: '0.8rem'
                        }}>
                          {membership.platformName}
                        </span>
                        {membership.isPrimary && (
                          <span style={{
                            background: '#4CAF50',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            fontSize: '0.7rem'
                          }}>
                            Primary
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '10px',
              paddingTop: '10px',
              borderTop: '1px solid rgba(244, 167, 36, 0.2)'
            }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  forceRefresh();
                }}
                disabled={isRefreshing}
                style={{
                  background: 'rgba(33, 150, 243, 0.2)',
                  border: '1px solid rgba(33, 150, 243, 0.3)',
                  color: isRefreshing ? '#888' : '#2196F3',
                  padding: '8px 12px',
                  borderRadius: '5px',
                  cursor: isRefreshing ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isRefreshing) {
                    e.target.style.background = 'rgba(33, 150, 243, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isRefreshing) {
                    e.target.style.background = 'rgba(33, 150, 243, 0.2)';
                  }
                }}
              >
                {isRefreshing ? '🔄 Refreshing...' : '🔄 Refresh Session'}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  signOut();
                }}
                style={{
                  background: 'rgba(255, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 0, 0, 0.3)',
                  color: '#ff6b6b',
                  padding: '8px 12px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 0, 0, 0.2)';
                }}
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Not authenticated - show login button
  return (
    <button
      onClick={signIn}
      style={{
        background: 'linear-gradient(45deg, #f4a724, #ff8c00)',
        color: '#000',
        border: 'none',
        padding: '12px 20px',
        borderRadius: '10px',
        fontSize: '1rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 15px rgba(244, 167, 36, 0.3)'
      }}
      onMouseEnter={(e) => {
        e.target.style.background = 'linear-gradient(45deg, #ff8c00, #f4a724)';
        e.target.style.transform = 'translateY(-2px)';
        e.target.style.boxShadow = '0 6px 20px rgba(244, 167, 36, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.target.style.background = 'linear-gradient(45deg, #f4a724, #ff8c00)';
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = '0 4px 15px rgba(244, 167, 36, 0.3)';
      }}
    >
      🔗 Connect Your Bungie Account
    </button>
  );
};

export default AuthButton;