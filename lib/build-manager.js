// lib/build-manager.js
// Updated Build Manager for serverless environments (Vercel)

import crypto from 'crypto'

class BuildManager {
  constructor() {
    this.initialized = false
    this.version = '2.0.0'
    this.isServerless = process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME
  }

  async initialize() {
    if (this.initialized) return
    
    console.log(`🏗️ Initializing Build Manager (${this.isServerless ? 'Serverless' : 'Local'} mode)`)
    
    // In serverless environments, we can't use filesystem persistence
    // Instead we'll need to use external storage or return temporary results
    
    this.initialized = true
  }

  // Save a build (serverless-friendly)
  async saveBuild(userId, buildData) {
    await this.initialize()
    
    try {
      // Validate input
      if (!userId || !buildData) {
        throw new Error('User ID and build data are required')
      }

      // Generate unique build ID
      const buildId = this.generateBuildId()
      const timestamp = new Date().toISOString()

      // Create comprehensive build record
      const build = {
        id: buildId,
        userId,
        name: buildData.name || buildData.metadata?.name || 'Untitled Build',
        description: buildData.description || buildData.metadata?.description || '',
        
        // Build data structure
        metadata: {
          ...buildData.metadata,
          createdAt: timestamp,
          updatedAt: timestamp,
          version: this.version,
          buildId
        },
        
        // Loadout information
        loadout: this.sanitizeLoadout(buildData.loadout || buildData.items),
        
        // Stats and scoring
        stats: buildData.stats || {},
        score: buildData.score || 0,
        synergies: buildData.synergies || [],
        
        // Activity and class info
        activity: buildData.activity || buildData.metadata?.activity || 'general_pve',
        guardianClass: buildData.guardianClass || buildData.metadata?.class || 'any',
        
        // Tags and categorization
        tags: Array.isArray(buildData.tags) ? buildData.tags : [],
        isPublic: buildData.isPublic || false,
        
        // Usage tracking
        usage: {
          timesUsed: 0,
          lastUsed: null,
          rating: null,
          favorites: 0
        }
      }

      // In serverless environment, we can't persist to filesystem
      if (this.isServerless) {
        console.log(`💾 Build saved temporarily: ${build.name} (ID: ${buildId})`)
        console.warn('⚠️ Serverless environment: Build will not persist between sessions')
        
        // Return success with warning about persistence
        return {
          success: true,
          buildId,
          build,
          warning: 'Build saved temporarily - will not persist between sessions',
          note: 'Consider implementing database storage for production use'
        }
      } else {
        // In local development, attempt filesystem storage
        return await this.saveToFilesystem(userId, build)
      }
      
    } catch (error) {
      console.error('❌ Failed to save build:', error)
      return {
        success: false,
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    }
  }

  // Load user builds (serverless-friendly)
  async loadUserBuilds(userId) {
    await this.initialize()
    
    try {
      if (!userId) {
        throw new Error('User ID is required')
      }

      // In serverless environment, we can't load from filesystem
      if (this.isServerless) {
        console.log(`📁 Loading builds for user ${userId} (serverless mode)`)
        console.warn('⚠️ Serverless environment: No persistent storage available')
        
        // Return empty array with explanation
        return {
          builds: [],
          message: 'No persistent storage in serverless environment',
          suggestion: 'Builds are saved temporarily per session only'
        }
      } else {
        // In local development, attempt filesystem loading
        return await this.loadFromFilesystem(userId)
      }
      
    } catch (error) {
      console.error('❌ Failed to load builds:', error)
      return {
        builds: [],
        error: error.message
      }
    }
  }

  // Delete a build
  async deleteBuild(userId, buildId) {
    await this.initialize()
    
    if (this.isServerless) {
      return {
        success: false,
        error: 'Delete not supported in serverless environment',
        message: 'Builds are temporary in serverless mode'
      }
    }
    
    // Local filesystem deletion would go here
    return {
      success: false,
      error: 'Filesystem operations not implemented in this version'
    }
  }

  // Share a build
  async shareBuild(userId, buildId, options = {}) {
    await this.initialize()
    
    try {
      // Generate shareable build data structure
      const shareId = this.generateShareId()
      const shareData = {
        shareId,
        buildId,
        userId,
        createdAt: new Date().toISOString(),
        expiresAt: options.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        shareType: options.shareType || 'public',
        permissions: options.permissions || ['view']
      }

      if (this.isServerless) {
        return {
          success: true,
          shareId,
          shareData,
          warning: 'Share created temporarily - use database for production',
          shareUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/builds/shared/${shareId}`
        }
      }

      return shareData
      
    } catch (error) {
      console.error('❌ Failed to share build:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Get build statistics
  async getBuildStats(userId) {
    await this.initialize()
    
    if (this.isServerless) {
      return {
        total: 0,
        byClass: {},
        byActivity: {},
        recentBuilds: [],
        mostUsedItems: {},
        message: 'Stats not available in serverless mode'
      }
    }
    
    // Would implement filesystem-based stats here
    return this.getDefaultStats()
  }

  // Utility methods
  sanitizeLoadout(loadoutData) {
    if (!loadoutData) return {}
    
    // Handle both new loadout format and legacy items format
    const loadout = loadoutData.items ? loadoutData.items : loadoutData
    
    const sanitized = {}
    
    // Standard loadout slots
    const slots = ['helmet', 'gauntlets', 'chest', 'legs', 'classItem', 'primary', 'secondary', 'heavy', 'subclass']
    
    slots.forEach(slot => {
      if (loadout[slot]) {
        sanitized[slot] = this.sanitizeItem(loadout[slot])
      }
    })
    
    return sanitized
  }

  sanitizeItem(item) {
    if (!item) return null
    
    return {
      itemHash: item.itemHash || item.hash,
      itemInstanceId: item.itemInstanceId || item.instanceId,
      name: item.name || item.displayProperties?.name,
      description: item.description || item.displayProperties?.description,
      icon: item.icon || item.displayProperties?.icon,
      tierType: item.tierType || item.inventory?.tierType,
      isExotic: item.isExotic || (item.inventory?.tierType === 6),
      itemType: item.itemType,
      itemSubType: item.itemSubType,
      classType: item.classType,
      damageType: item.damageType || item.defaultDamageType,
      powerLevel: item.powerLevel || item.light,
      masterworked: item.masterworked || false,
      
      // Stats (if present)
      stats: item.stats || {},
      
      // Perks and sockets (if present)
      perks: Array.isArray(item.perks) ? item.perks : [],
      sockets: item.sockets || {},
      
      // Additional metadata
      source: item.source || 'unknown',
      season: item.season,
      
      // Remove sensitive or unnecessary data
      // (no raw API response data, tokens, etc.)
    }
  }

  generateBuildId() {
    return `build-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`
  }

  generateShareId() {
    return `share-${crypto.randomBytes(16).toString('hex')}`
  }

  getDefaultStats() {
    return {
      total: 0,
      byClass: {
        titan: 0,
        hunter: 0,
        warlock: 0
      },
      byActivity: {
        general_pve: 0,
        raid: 0,
        dungeon: 0,
        pvp: 0,
        nightfall: 0
      },
      recentBuilds: [],
      mostUsedItems: {},
      message: 'No builds found'
    }
  }

  // Local filesystem methods (for development)
  async saveToFilesystem(userId, build) {
    // This would implement actual filesystem saving
    // For now, just return success
    return {
      success: true,
      buildId: build.id,
      build,
      note: 'Filesystem storage not implemented in this version'
    }
  }

  async loadFromFilesystem(userId) {
    // This would implement actual filesystem loading
    // For now, just return empty
    return {
      builds: [],
      note: 'Filesystem storage not implemented in this version'
    }
  }

  // Validation methods
  validateBuildData(buildData) {
    const errors = []
    
    if (!buildData) {
      errors.push('Build data is required')
      return errors
    }
    
    if (!buildData.loadout && !buildData.items) {
      errors.push('Build must include loadout or items')
    }
    
    if (buildData.name && buildData.name.length > 100) {
      errors.push('Build name must be 100 characters or less')
    }
    
    if (buildData.description && buildData.description.length > 500) {
      errors.push('Build description must be 500 characters or less')
    }
    
    return errors
  }

  // Search and filter methods
  searchBuilds(builds, query) {
    if (!query || !Array.isArray(builds)) return builds
    
    const searchTerm = query.toLowerCase()
    
    return builds.filter(build => {
      return (
        build.name?.toLowerCase().includes(searchTerm) ||
        build.description?.toLowerCase().includes(searchTerm) ||
        build.activity?.toLowerCase().includes(searchTerm) ||
        build.guardianClass?.toLowerCase().includes(searchTerm) ||
        (build.tags && build.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      )
    })
  }

  filterBuildsByActivity(builds, activity) {
    if (!activity || !Array.isArray(builds)) return builds
    return builds.filter(build => build.activity === activity)
  }

  filterBuildsByClass(builds, guardianClass) {
    if (!guardianClass || !Array.isArray(builds)) return builds
    return builds.filter(build => build.guardianClass === guardianClass)
  }

  // Export/Import methods for data portability
  exportBuilds(builds) {
    return {
      version: this.version,
      exportedAt: new Date().toISOString(),
      builds: Array.isArray(builds) ? builds : [],
      format: 'destiny-build-manager-v2'
    }
  }

  validateImportData(importData) {
    if (!importData || typeof importData !== 'object') {
      return { valid: false, error: 'Invalid import data format' }
    }
    
    if (!importData.builds || !Array.isArray(importData.builds)) {
      return { valid: false, error: 'Import data must contain builds array' }
    }
    
    return { valid: true }
  }

  isInitialized() {
    return this.initialized
  }
}

export default BuildManager