// lib/useAuth.js
import { useState, useEffect } from 'react'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(0)

  // Check for existing session on mount
  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const sessionData = await response.json()
        if (sessionData.user) {
          setSession(sessionData)
        } else {
          setSession(null)
        }
      } else if (response.status === 401) {
        // Not authenticated - this is normal
        setSession(null)
      } else {
        throw new Error(`Session check failed: ${response.status}`)
      }
    } catch (error) {
      console.error('Error checking session:', error)
      setError(error.message)
      setSession(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async () => {
    try {
      setError(null)
      
      // Redirect to Bungie OAuth
      window.location.href = '/api/auth/bungie-login'
    } catch (error) {
      console.error('Login failed:', error)
      setError(error.message)
    }
  }

  const logout = async () => {
    try {
      setError(null)
      setIsLoading(true)

      const response = await fetch('/api/auth/bungie-logout', {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        setSession(null)
        // Optionally redirect to home page
        window.location.href = '/'
      } else {
        throw new Error('Logout failed')
      }
    } catch (error) {
      console.error('Logout failed:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshSession = async () => {
    await checkSession()
  }

  // Utility functions
  const isAuthenticated = () => {
    return !!session?.user
  }

  const getUser = () => {
    return session?.user || null
  }

  const getAccessToken = () => {
    return session?.accessToken || null
  }

  const hasValidToken = () => {
    if (!session?.accessToken || !session?.expiresAt) return false
    
    // Check if token expires within the next 5 minutes
    const expiresAt = new Date(session.expiresAt)
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000)
    
    // Add safety check to prevent infinite loops
    const isValid = expiresAt > fiveMinutesFromNow
    
    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('Token validation:', {
        hasToken: !!session?.accessToken,
        expiresAt: session?.expiresAt,
        expiresAtDate: expiresAt.toISOString(),
        fiveMinutesFromNow: fiveMinutesFromNow.toISOString(),
        isValid
      })
    }
    
    return isValid
  }

  const getUserMembershipId = () => {
    return session?.user?.membershipId || null
  }

  const getUserMembershipType = () => {
    return session?.user?.membershipType || null
  }

  const isAdmin = () => {
    return session?.user?.isAdmin || false
  }

  // Auto-refresh session if token is expiring soon (but prevent loops)
  useEffect(() => {
    if (session && !isLoading) {
      const tokenValid = hasValidToken()
      
      // Only refresh if token is actually invalid AND we're not already loading
      if (!tokenValid) {
        console.log('Token invalid, refreshing session...')
        
        // Add delay to prevent rapid refresh loops
        const refreshTimer = setTimeout(() => {
          refreshSession()
        }, 1000)
        
        return () => clearTimeout(refreshTimer)
      }
    }
  }, [session?.expiresAt]) // Only trigger when expiration date changes

  // Periodic session check (every 30 minutes) - but only if we have a valid session
  useEffect(() => {
    if (session && hasValidToken()) {
      const interval = setInterval(() => {
        if (hasValidToken()) {
          refreshSession()
        }
      }, 30 * 60 * 1000) // 30 minutes

      return () => clearInterval(interval)
    }
  }, [session?.user?.membershipId]) // Only re-setup when user changes

  return {
    // Session state
    session,
    isLoading,
    error,
    
    // Authentication actions
    login,
    logout,
    refreshSession,
    
    // Utility functions
    isAuthenticated,
    getUser,
    getAccessToken,
    hasValidToken,
    getUserMembershipId,
    getUserMembershipType,
    isAdmin,
    
    // Convenience properties
    user: getUser(),
    accessToken: getAccessToken(),
    membershipId: getUserMembershipId(),
    membershipType: getUserMembershipType()
  }
}

// Higher-order component for protecting routes
export function withAuth(WrappedComponent) {
  return function AuthenticatedComponent(props) {
    const { session, isLoading, login } = useAuth()

    if (isLoading) {
      return (
        <div className="auth-loading">
          <div className="loading-spinner"></div>
          <span>Loading...</span>
        </div>
      )
    }

    if (!session?.user) {
      return (
        <div className="auth-required">
          <div className="auth-prompt">
            <h2>Authentication Required</h2>
            <p>You need to sign in to access this page.</p>
            <button onClick={login} className="login-btn">
              Sign in with Bungie
            </button>
          </div>
        </div>
      )
    }

    return <WrappedComponent {...props} />
  }
}

// Hook for components that need admin access
export function useAdminAuth() {
  const auth = useAuth()
  
  return {
    ...auth,
    isAdmin: auth.isAdmin(),
    requireAdmin: () => {
      if (!auth.isAuthenticated()) {
        throw new Error('Authentication required')
      }
      if (!auth.isAdmin()) {
        throw new Error('Admin access required')
      }
    }
  }
}

// Custom hook for API calls with authentication
export function useAuthenticatedFetch() {
  const { getAccessToken, hasValidToken, refreshSession } = useAuth()

  const authenticatedFetch = async (url, options = {}) => {
    // Ensure we have a valid token
    if (!hasValidToken()) {
      await refreshSession()
    }

    const accessToken = getAccessToken()
    if (!accessToken) {
      throw new Error('No access token available')
    }

    // Add authorization header
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    // Add credentials for cookie-based session
    const fetchOptions = {
      ...options,
      headers,
      credentials: 'include'
    }

    const response = await fetch(url, fetchOptions)

    // Handle token expiration
    if (response.status === 401) {
      await refreshSession()
      // Retry with new token
      return fetch(url, fetchOptions)
    }

    return response
  }

  return { authenticatedFetch }
}