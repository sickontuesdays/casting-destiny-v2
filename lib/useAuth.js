// lib/useAuth.js
// React hook for managing authentication state

import { useState, useEffect, createContext, useContext, useCallback } from 'react'

const AuthContext = createContext({
  session: null,
  isLoading: true,
  error: null,
  login: () => {},
  logout: () => {},
  refreshSession: () => {},
  clearError: () => {}
})

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check session on mount and periodically
  useEffect(() => {
    checkSession()
    
    // Check session every 5 minutes
    const interval = setInterval(checkSession, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  const checkSession = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/auth/session', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.authenticated && data.user) {
          setSession({
            user: data.user,
            expiresAt: data.expiresAt,
            timeUntilExpiry: data.timeUntilExpiry,
            needsRefresh: data.needsRefresh
          })
          
          console.log('Session active:', {
            user: data.user.displayName,
            expiresIn: Math.round(data.timeUntilExpiry / 1000 / 60) + ' minutes'
          })
          
          // If session needs refresh, it was already handled by the API
          if (data.needsRefresh) {
            console.log('Session will be refreshed on next API call')
          }
        } else {
          setSession(null)
          console.log('No active session')
        }
      } else {
        console.error('Session check failed:', response.status)
        setSession(null)
      }
    } catch (error) {
      console.error('Error checking session:', error)
      setError('Failed to check authentication status')
      setSession(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback((redirectUrl = '/') => {
    // Store intended destination
    if (redirectUrl !== '/') {
      sessionStorage.setItem('auth_redirect', redirectUrl)
    }
    
    // Redirect to Bungie OAuth
    window.location.href = '/api/auth/bungie-login'
  }, [])

  const logout = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        setSession(null)
        console.log('Logged out successfully')
        
        // Clear any stored redirect
        sessionStorage.removeItem('auth_redirect')
        
        // Redirect to home
        window.location.href = '/'
      } else {
        console.error('Logout failed:', response.status)
        // Clear session locally even if server logout fails
        setSession(null)
      }
    } catch (error) {
      console.error('Error during logout:', error)
      setError('Logout failed')
      // Clear session anyway
      setSession(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshSession = useCallback(async () => {
    await checkSession()
  }, [checkSession])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value = {
    session,
    isLoading,
    error,
    login,
    logout,
    refreshSession,
    clearError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Main hook
export const useAuth = () => {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

// Helper hooks
export const useSession = () => {
  const { session } = useAuth()
  return session
}

export const useUser = () => {
  const { session } = useAuth()
  return session?.user || null
}

export const useIsAuthenticated = () => {
  const { session } = useAuth()
  return !!session?.user
}

// Helper functions for direct access
export const getCurrentUser = () => {
  const { session } = useAuth()
  return session?.user || null
}

export const isAuthenticated = () => {
  const { session } = useAuth()
  return !!session?.user
}

// Destiny-specific helpers
export const useDestinyMemberships = () => {
  const { session } = useAuth()
  return session?.user?.destinyMemberships || []
}

export const usePrimaryMembership = () => {
  const { session } = useAuth()
  const user = session?.user
  
  if (!user) return null
  
  return {
    membershipType: user.primaryMembershipType,
    membershipId: user.primaryMembershipId
  }
}

// Platform helpers
export const usePlatforms = () => {
  const { session } = useAuth()
  return session?.user?.platforms || []
}

// Avatar helper
export const useUserAvatar = () => {
  const { session } = useAuth()
  return session?.user?.avatar || null
}

export default useAuth