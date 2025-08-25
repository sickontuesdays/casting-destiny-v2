// pages/build-creator.js
// Build Creator page with Enhanced BIS integration

import { useState, useEffect } from 'react'
import { useAuth } from '../lib/useAuth'
import Layout from '../components/Layout'
import EnhancedBuildCreator from '../components/EnhancedBuildCreator'
import Head from 'next/head'

export default function BuildCreatorPage() {
  const { session, isLoading } = useAuth()
  const [systemStatus, setSystemStatus] = useState({
    inventory: 'pending',
    manifest: 'pending',
    intelligence: 'pending'
  })

  useEffect(() => {
    if (session?.user) {
      checkSystemStatus()
    }
  }, [session])

  const checkSystemStatus = async () => {
    // Check inventory availability
    try {
      const invResponse = await fetch('/api/bungie/inventory', {
        method: 'GET',
        credentials: 'include'
      })
      setSystemStatus(prev => ({
        ...prev,
        inventory: invResponse.ok ? 'ready' : 'error'
      }))
    } catch (error) {
      setSystemStatus(prev => ({ ...prev, inventory: 'error' }))
    }

    // Check manifest availability
    try {
      const manifestResponse = await fetch('/api/manifest')
      setSystemStatus(prev => ({
        ...prev,
        manifest: manifestResponse.ok ? 'ready' : 'error'
      }))
    } catch (error) {
      setSystemStatus(prev => ({ ...prev, manifest: 'error' }))
    }

    // Intelligence system is always ready if other systems are
    setSystemStatus(prev => ({
      ...prev,
      intelligence: (prev.inventory === 'ready' || prev.manifest === 'ready') ? 'ready' : 'pending'
    }))
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="loading-spinner large"></div>
          <p>Loading Build Creator...</p>
        </div>
      </Layout>
    )
  }

  if (!session?.user) {
    return (
      <Layout>
        <Head>
          <title>Build Creator - Casting Destiny v2</title>
        </Head>
        <div className="auth-required">
          <h2>Authentication Required</h2>
          <p>Please sign in with your Bungie account to use the Build Intelligence System.</p>
          <a href="/api/auth/signin" className="signin-btn">
            Sign In with Bungie
          </a>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Head>
        <title>Build Creator - Casting Destiny v2</title>
        <meta name="description" content="Create optimized Destiny 2 builds with AI-powered intelligence" />
      </Head>

      <div className="build-creator-page">
        {/* System Status Bar */}
        <div className="system-status-bar">
          <div className="status-item">
            <span className={`status-indicator ${systemStatus.inventory}`}></span>
            <span className="status-label">Inventory</span>
          </div>
          <div className="status-item">
            <span className={`status-indicator ${systemStatus.manifest}`}></span>
            <span className="status-label">Game Data</span>
          </div>
          <div className="status-item">
            <span className={`status-indicator ${systemStatus.intelligence}`}></span>
            <span className="status-label">AI System</span>
          </div>
        </div>

        {/* Main Build Creator Component */}
        <EnhancedBuildCreator />

        {/* Help Section */}
        <div className="help-section">
          <h3>How to Use the Build Intelligence System</h3>
          <div className="help-grid">
            <div className="help-item">
              <span className="help-icon">💬</span>
              <h4>Natural Language</h4>
              <p>Describe your ideal build in plain English and let the AI understand your needs.</p>
            </div>
            <div className="help-item">
              <span className="help-icon">🎯</span>
              <h4>Activity Optimization</h4>
              <p>Builds are automatically optimized for your selected activity type.</p>
            </div>
            <div className="help-item">
              <span className="help-icon">🔧</span>
              <h4>Full Customization</h4>
              <p>Every item can be changed after generation to perfect your build.</p>
            </div>
            <div className="help-item">
              <span className="help-icon">📊</span>
              <h4>Smart Ranking</h4>
              <p>Builds are scored and ranked based on synergies and effectiveness.</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .build-creator-page {
          min-height: calc(100vh - 120px);
          padding: 2rem 0;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 1rem;
        }

        .loading-spinner.large {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(255, 107, 53, 0.2);
          border-top-color: #ff6b35;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .auth-required {
          text-align: center;
          padding: 4rem 2rem;
          background: rgba(20, 20, 20, 0.7);
          border-radius: 1rem;
          border: 1px solid #333;
          max-width: 600px;
          margin: 4rem auto;
        }

        .auth-required h2 {
          color: #ff6b35;
          margin-bottom: 1rem;
        }

        .auth-required p {
          color: #888;
          margin-bottom: 2rem;
        }

        .signin-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 2rem;
          background: linear-gradient(135deg, #ff6b35, #f7931e);
          color: #fff;
          text-decoration: none;
          border-radius: 0.5rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .signin-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
        }

        .system-status-bar {
          display: flex;
          justify-content: center;
          gap: 2rem;
          padding: 1rem;
          background: rgba(20, 20, 20, 0.5);
          border-radius: 0.5rem;
          margin-bottom: 2rem;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #444;
          position: relative;
        }

        .status-indicator.ready {
          background: #4caf50;
          box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
          animation: pulse 2s infinite;
        }

        .status-indicator.error {
          background: #f44336;
          box-shadow: 0 0 10px rgba(244, 67, 54, 0.5);
        }

        .status-indicator.pending {
          background: #ff9800;
          box-shadow: 0 0 10px rgba(255, 152, 0, 0.5);
          animation: pulse 1s infinite;
        }

        .status-label {
          color: #888;
          font-size: 0.85rem;
        }

        .help-section {
          margin-top: 4rem;
          padding: 2rem;
          background: rgba(20, 20, 20, 0.5);
          border-radius: 1rem;
          border: 1px solid #333;
        }

        .help-section h3 {
          color: #ff6b35;
          margin-bottom: 2rem;
          text-align: center;
          font-size: 1.5rem;
        }

        .help-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }

        .help-item {
          text-align: center;
          padding: 1.5rem;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 0.5rem;
          transition: transform 0.3s ease;
        }

        .help-item:hover {
          transform: translateY(-4px);
        }

        .help-icon {
          font-size: 2rem;
          display: block;
          margin-bottom: 1rem;
        }

        .help-item h4 {
          color: #e0e0e0;
          margin-bottom: 0.5rem;
          font-size: 1.1rem;
        }

        .help-item p {
          color: #888;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @media (max-width: 768px) {
          .system-status-bar {
            flex-direction: column;
            align-items: center;
            gap: 1rem;
          }

          .help-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }
      `}</style>
    </Layout>
  )
}