import React, { useState, useEffect } from 'react'
import { SessionProvider } from 'next-auth/react'
import Layout from '../components/Layout'
import '../styles/globals.css'
import '../styles/destiny-theme.css'

// Global context for app state
export const AppContext = React.createContext()

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  const [manifest, setManifest] = useState(null)
  const [userBuilds, setUserBuilds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadManifest()
  }, [])

  const loadManifest = async () => {
    try {
      const response = await fetch('/api/bungie/manifest')
      const data = await response.json()
      setManifest(data)
    } catch (error) {
      console.error('Error loading manifest:', error)
    } finally {
      setLoading(false)
    }
  }

  const appContextValue = {
    manifest,
    userBuilds,
    setUserBuilds,
    loading,
    refreshManifest: loadManifest
  }

  return (
    <SessionProvider session={session}>
      <AppContext.Provider value={appContextValue}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </AppContext.Provider>
    </SessionProvider>
  )
}

export default MyApp