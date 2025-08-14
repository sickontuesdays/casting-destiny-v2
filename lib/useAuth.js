import { useState, useEffect, createContext, useContext } from 'react'

const AuthContext = createContext({
  session: null,
  isLoading: true,
  error: null,
  login: () => {},
  logout: () => {},
  refreshSession: () => {}
})

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/auth/session', {
        credentials: 'include'
      })

      if (response.ok) {
        const sessionData = await response.json()
        if (sessionData.user) {
          setSession(sessionData)
          console.log('Session restored:', sessionData.user.displayName)
        } else {
          setSession(null)
        }
      } else if (response.status === 401) {
        // Not authenticated - this is normal
        setSession(null)
      } else {
        console.error('Session check failed:', response.statusText)
      }
    } catch (error) {
      console.error('Error checking session:', error)
      setError('Failed to check authentication status')
      setSession(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = (redirectUrl = '/') => {
    // Redirect to Bungie OAuth
    window.location.href = `/api/auth/bungie-login?redirect=${encodeURIComponent(redirectUrl)}`
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        setSession(null)
        console.log('Logged out successfully')
      } else {
        console.error('Logout failed:', response.statusText)
      }
    } catch (error) {
      console.error('Error during logout:', error)
      // Clear session anyway
      setSession(null)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshSession = async () => {
    await checkSession()
  }

  const value = {
    session,
    isLoading,
    error,
    login,
    logout,
    refreshSession
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  
  if (!context) {
    // Fallback for when hook is used outside provider
    const [session, setSession] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
      const checkAuthStatus = async () => {
        try {
          const response = await fetch('/api/auth/session', {
            credentials: 'include'
          })

          if (response.ok) {
            const sessionData = await response.json()
            setSession(sessionData.user ? sessionData : null)
          } else {
            setSession(null)
          }
        } catch (error) {
          console.error('Auth check failed:', error)
          setSession(null)
          setError('Authentication check failed')
        } finally {
          setIsLoading(false)
        }
      }

      checkAuthStatus()
    }, [])

    const login = (redirectUrl = '/') => {
      window.location.href = `/api/auth/bungie-login?redirect=${encodeURIComponent(redirectUrl)}`
    }

    const logout = async () => {
      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        })

        if (response.ok) {
          setSession(null)
          window.location.href = '/'
        }
      } catch (error) {
        console.error('Logout failed:', error)
        setSession(null)
        window.location.href = '/'
      }
    }

    const refreshSession = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include'
        })

        if (response.ok) {
          const sessionData = await response.json()
          setSession(sessionData.user ? sessionData : null)
        } else {
          setSession(null)
        }
      } catch (error) {
        console.error('Session refresh failed:', error)
        setSession(null)
      } finally {
        setIsLoading(false)
      }
    }

    return {
      session,
      isLoading,
      error,
      login,
      logout,
      refreshSession
    }
  }

  return context
}

// Helper function to get current user info
export const getCurrentUser = () => {
  const { session } = useAuth()
  return session?.user || null
}

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  const { session } = useAuth()
  return !!session?.user
}

// Helper function to get access token
export const getAccessToken = () => {
  const { session } = useAuth()
  return session?.accessToken || null
}

// Helper function to check token expiry
export const isTokenExpired = () => {
  const { session } = useAuth()
  
  if (!session?.expiresAt) return true
  
  return Date.now() > new Date(session.expiresAt).getTime()
}

export default useAuth