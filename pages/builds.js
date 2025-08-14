import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/useAuth'
import BuildDisplay from '../components/BuildDisplay'

export default function BuildsPage() {
  const { session, isLoading } = useAuth()
  const [builds, setBuilds] = useState([])
  const [selectedBuild, setSelectedBuild] = useState(null)
  const [isLoadingBuilds, setIsLoadingBuilds] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [filterBy, setFilterBy] = useState('all')
  const router = useRouter()

  useEffect(() => {
    if (session?.user) {
      loadUserBuilds()
    }
  }, [session])

  const loadUserBuilds = async () => {
    setIsLoadingBuilds(true)
    setError(null)

    try {
      const response = await fetch('/api/build', {
        credentials: 'include'
      })

      if (response.ok) {
        const buildsData = await response.json()
        setBuilds(buildsData)
        console.log(`Loaded ${buildsData.length} builds`)
      } else {
        throw new Error('Failed to load builds')
      }
    } catch (error) {
      console.error('Error loading builds:', error)
      setError(error.message)
      
      // Load mock builds for demo
      setBuilds(createMockBuilds())
    } finally {
      setIsLoadingBuilds(false)
    }
  }

  const createMockBuilds = () => {
    return [
      {
        id: 'mock-build-1',
        name: 'High Mobility Hunter',
        description: 'PvP-focused Hunter build with maximum mobility',
        tags: ['pvp', 'hunter', 'mobility'],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        build: {
          name: 'High Mobility Hunter',
          stats: {
            totalStats: {
              weapons: 80,
              health: 60,
              class: 100,
              super: 70,
              grenade: 60,
              melee: 50
            }
          },
          helmet: { name: 'Wormhusk Crown', tier: 'Exotic' },
          synergies: [
            { name: 'Mobility Focus', strength: 'strong', description: 'High mobility stats for PvP' }
          ]
        },
        stats: {
          timesUsed: 5,
          lastUsed: new Date(Date.now() - 3600000).toISOString(),
          rating: 4.5
        }
      },
      {
        id: 'mock-build-2',
        name: 'Titan Tank Build',
        description: 'Maximum survivability for raids and difficult content',
        tags: ['raid', 'titan', 'survivability'],
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString(),
        build: {
          name: 'Titan Tank Build',
          stats: {
            totalStats: {
              weapons: 50,
              health: 100,
              class: 80,
              super: 70,
              grenade: 60,
              melee: 60
            }
          },
          chest: { name: 'Precious Scars', tier: 'Exotic' },
          synergies: [
            { name: 'Tank Setup', strength: 'powerful', description: 'Maximum survivability' }
          ]
        },
        stats: {
          timesUsed: 12,
          lastUsed: new Date(Date.now() - 7200000).toISOString(),
          rating: 5.0
        }
      },
      {
        id: 'mock-build-3',
        name: 'Warlock Ability Spam',
        description: 'Grenade and super focused Warlock build',
        tags: ['pve', 'warlock', 'abilities'],
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        updatedAt: new Date(Date.now() - 259200000).toISOString(),
        build: {
          name: 'Warlock Ability Spam',
          stats: {
            totalStats: {
              weapons: 60,
              health: 70,
              class: 80,
              super: 100,
              grenade: 100,
              melee: 60
            }
          },
          arms: { name: 'Necrotic Grip', tier: 'Exotic' },
          synergies: [
            { name: 'Ability Chain', strength: 'strong', description: 'Frequent ability usage' }
          ]
        },
        stats: {
          timesUsed: 8,
          lastUsed: new Date(Date.now() - 14400000).toISOString(),
          rating: 4.2
        }
      }
    ]
  }

  const deleteBuild = async (buildId) => {
    if (!confirm('Are you sure you want to delete this build?')) {
      return
    }

    try {
      const response = await fetch('/api/build', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ buildId })
      })

      if (response.ok) {
        setBuilds(prev => prev.filter(build => build.id !== buildId))
        
        // Close build display if this build was selected
        if (selectedBuild?.id === buildId) {
          setSelectedBuild(null)
        }
        
        console.log('Build deleted successfully')
      } else {
        throw new Error('Failed to delete build')
      }
    } catch (error) {
      console.error('Error deleting build:', error)
      setError('Failed to delete build')
    }
  }

  const duplicateBuild = async (build) => {
    try {
      const duplicatedBuild = {
        ...build.build,
        name: `${build.name} (Copy)`,
        description: `Copy of ${build.description}`
      }

      const response = await fetch('/api/build', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          build: duplicatedBuild,
          name: duplicatedBuild.name,
          description: duplicatedBuild.description,
          tags: build.tags
        })
      })

      if (response.ok) {
        await loadUserBuilds() // Refresh builds list
        console.log('Build duplicated successfully')
      } else {
        throw new Error('Failed to duplicate build')
      }
    } catch (error) {
      console.error('Error duplicating build:', error)
      setError('Failed to duplicate build')
    }
  }

  const getFilteredBuilds = () => {
    let filtered = builds

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(build =>
        build.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        build.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        build.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Apply category filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(build => 
        build.tags.includes(filterBy)
      )
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        break
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'mostUsed':
        filtered.sort((a, b) => (b.stats?.timesUsed || 0) - (a.stats?.timesUsed || 0))
        break
      default:
        break
    }

    return filtered
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderBuildCard = (build) => {
    const totalStats = build.build?.stats?.totalStats || {}
    const totalStatValue = Object.values(totalStats).reduce((sum, val) => sum + val, 0)

    return (
      <div key={build.id} className="build-card">
        <div className="build-card-header">
          <h3 className="build-name">{build.name}</h3>
          <div className="build-rating">
            {build.stats?.rating && (
              <span className="rating">★ {build.stats.rating.toFixed(1)}</span>
            )}
          </div>
        </div>

        <div className="build-description">
          <p>{build.description}</p>
        </div>

        <div className="build-tags">
          {build.tags.map(tag => (
            <span key={tag} className="build-tag">
              {tag}
            </span>
          ))}
        </div>

        <div className="build-stats-summary">
          <div className="stat-item">
            <span className="stat-label">Total Stats:</span>
            <span className="stat-value">{totalStatValue}/1200</span>
          </div>
          {build.stats?.timesUsed && (
            <div className="stat-item">
              <span className="stat-label">Used:</span>
              <span className="stat-value">{build.stats.timesUsed} times</span>
            </div>
          )}
        </div>

        <div className="build-meta">
          <span className="created-date">
            Created: {formatDate(build.createdAt)}
          </span>
          {build.stats?.lastUsed && (
            <span className="last-used">
              Last used: {formatDate(build.stats.lastUsed)}
            </span>
          )}
        </div>

        <div className="build-actions">
          <button 
            onClick={() => setSelectedBuild(build)}
            className="action-btn primary"
          >
            View Build
          </button>
          <button 
            onClick={() => duplicateBuild(build)}
            className="action-btn secondary"
          >
            Duplicate
          </button>
          <button 
            onClick={() => deleteBuild(build.id)}
            className="action-btn danger"
          >
            Delete
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="auth-required">
        <div className="auth-container">
          <h1>Sign In Required</h1>
          <p>Please sign in to view your saved builds.</p>
          <button 
            className="bungie-login-btn"
            onClick={() => window.location.href = '/api/auth/bungie-login'}
          >
            Sign in with Bungie.net
          </button>
        </div>
      </div>
    )
  }

  if (selectedBuild) {
    return (
      <div className="builds-page">
        <BuildDisplay 
          build={selectedBuild.build}
          onNewSearch={() => setSelectedBuild(null)}
        />
      </div>
    )
  }

  const filteredBuilds = getFilteredBuilds()

  return (
    <div className="builds-page">
      <div className="page-header">
        <h1>My Builds</h1>
        <p>Manage your saved Destiny 2 builds</p>
        
        <div className="header-actions">
          <button 
            onClick={() => router.push('/')}
            className="create-build-btn"
          >
            + Create New Build
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="builds-controls">
        <div className="search-controls">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search builds..."
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <select 
            value={filterBy} 
            onChange={(e) => setFilterBy(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            <option value="pvp">PvP</option>
            <option value="raid">Raid</option>
            <option value="pve">PvE</option>
            <option value="hunter">Hunter</option>
            <option value="titan">Titan</option>
            <option value="warlock">Warlock</option>
          </select>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name (A-Z)</option>
            <option value="mostUsed">Most Used</option>
          </select>
        </div>

        <div className="refresh-controls">
          <button 
            onClick={loadUserBuilds}
            disabled={isLoadingBuilds}
            className="refresh-btn"
          >
            {isLoadingBuilds ? 'Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Builds List */}
      <div className="builds-content">
        {isLoadingBuilds ? (
          <div className="loading-builds">
            <div className="loading-spinner"></div>
            <span>Loading your builds...</span>
          </div>
        ) : filteredBuilds.length === 0 ? (
          <div className="no-builds">
            <div className="no-builds-content">
              <h3>
                {builds.length === 0 ? 'No saved builds yet' : 'No builds match your filters'}
              </h3>
              <p>
                {builds.length === 0 
                  ? 'Create your first build to get started!'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {builds.length === 0 && (
                <button 
                  onClick={() => router.push('/')}
                  className="create-first-build-btn"
                >
                  Create Your First Build
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="builds-grid">
            {filteredBuilds.map(renderBuildCard)}
          </div>
        )}
      </div>

      {/* Stats Summary */}
      {builds.length > 0 && (
        <div className="builds-summary">
          <div className="summary-stats">
            <div className="summary-item">
              <span className="summary-label">Total Builds:</span>
              <span className="summary-value">{builds.length}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Showing:</span>
              <span className="summary-value">{filteredBuilds.length}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Uses:</span>
              <span className="summary-value">
                {builds.reduce((sum, build) => sum + (build.stats?.timesUsed || 0), 0)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}