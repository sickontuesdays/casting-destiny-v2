import { useState, useEffect, useCallback } from 'react';

const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // Refresh 5 minutes before expiry
const SESSION_CHECK_INTERVAL = 60 * 1000; // Check session every minute

export const useAuth = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check and refresh session
  const checkSession = useCallback(async (forceRefresh = false) => {
    try {
      setError(null);
      
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const sessionData = await response.json();
        
        if (sessionData) {
          // Check if token needs refresh
          const needsRefresh = forceRefresh || shouldRefreshToken(sessionData);
          
          if (needsRefresh && !isRefreshing) {
            console.log('Token needs refresh, attempting refresh...');
            const refreshedSession = await refreshToken(sessionData);
            setSession(refreshedSession || sessionData);
          } else {
            setSession(sessionData);
          }
        } else {
          setSession(null);
        }
      } else {
        // Session invalid or expired
        setSession(null);
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setError('Failed to verify authentication status');
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [isRefreshing]);

  // Check if token should be refreshed
  const shouldRefreshToken = (sessionData) => {
    if (!sessionData?.expires) return false;
    
    const expiryTime = new Date(sessionData.expires).getTime();
    const currentTime = Date.now();
    const timeUntilExpiry = expiryTime - currentTime;
    
    return timeUntilExpiry <= TOKEN_REFRESH_THRESHOLD;
  };

  // Refresh the access token
  const refreshToken = async (currentSession) => {
    if (!currentSession?.refreshToken || isRefreshing) {
      return null;
    }

    setIsRefreshing(true);
    
    try {
      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: currentSession.refreshToken
        }),
      });

      if (response.ok) {
        const refreshedData = await response.json();
        console.log('Token refreshed successfully');
        return refreshedData;
      } else {
        console.warn('Token refresh failed, user will need to re-authenticate');
        return null;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    } finally {
      setIsRefreshing(false);
    }
  };

  // Sign in with Bungie
  const signIn = useCallback(() => {
    // Store the current page to redirect back after login
    const currentPath = window.location.pathname + window.location.search;
    localStorage.setItem('auth-redirect', currentPath);
    
    window.location.href = '/api/auth/bungie-login';
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await fetch('/api/auth/bungie-logout', { method: 'POST' });
      setSession(null);
      setError(null);
      
      // Clear any stored redirect
      localStorage.removeItem('auth-redirect');
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out failed:', error);
      setError('Failed to sign out');
    } finally {
      setLoading(false);
    }
  }, []);

  // Force token refresh
  const forceRefresh = useCallback(async () => {
    if (session) {
      await checkSession(true);
    }
  }, [session, checkSession]);

  // Get fresh access token (for API calls)
  const getAccessToken = useCallback(async () => {
    if (!session) return null;
    
    // Check if token needs refresh
    if (shouldRefreshToken(session)) {
      const refreshedSession = await refreshToken(session);
      if (refreshedSession) {
        setSession(refreshedSession);
        return refreshedSession.accessToken;
      }
    }
    
    return session.accessToken;
  }, [session]);

  // Check for authentication result on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authResult = urlParams.get('auth');
    
    if (authResult === 'success') {
      // Handle successful login redirect
      const redirectPath = localStorage.getItem('auth-redirect') || '/';
      localStorage.removeItem('auth-redirect');
      
      // Clean up URL and redirect
      window.history.replaceState({}, document.title, redirectPath);
    } else if (authResult === 'error') {
      setError('Authentication failed. Please try again.');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Initial session check and periodic refresh
  useEffect(() => {
    checkSession();
    
    // Set up periodic session checking
    const interval = setInterval(() => {
      if (session && !isRefreshing) {
        checkSession();
      }
    }, SESSION_CHECK_INTERVAL);
    
    return () => clearInterval(interval);
  }, [checkSession, session, isRefreshing]);

  // Handle window focus to check for expired sessions
  useEffect(() => {
    const handleFocus = () => {
      if (session && !isRefreshing) {
        checkSession();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkSession, session, isRefreshing]);

  return {
    session,
    loading,
    error,
    isRefreshing,
    signIn,
    signOut,
    forceRefresh,
    getAccessToken,
    isAuthenticated: !!session,
    isTokenExpired: session ? shouldRefreshToken(session) : false
  };
};