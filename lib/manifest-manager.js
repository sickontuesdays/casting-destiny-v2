
class ManifestManager {
  constructor() {
    this.manifest = null
    this.isLoaded = false
    this.cache = new Map()
    this.version = null
    this.lastUpdated = null
    this.loadPromise = null
  }

  /**
   * Load manifest from GitHub cache (not directly from Bungie)
   */
  async loadManifest() {
    // Return existing manifest if already loaded
    if (this.isLoaded && this.manifest) {
      return this.manifest
    }

    // Prevent multiple simultaneous loads
    if (this.loadPromise) {
      return this.loadPromise
    }

    this.loadPromise = this._loadManifestInternal()
    
    try {
      const result = await this.loadPromise
      return result
    } finally {
      this.loadPromise = null
    }
  }

  async _loadManifestInternal() {
    try {
      console.log('📦 Loading manifest from GitHub cache...')
      
      // Only load from GitHub cache endpoint
      const response = await fetch('/api/github/manifest')
      
      if (response.ok) {
        const data = await response.json()
        this.manifest = data
        this.isLoaded = true
        this.version = data.version
        this.lastUpdated = new Date(data.lastUpdated || Date.now())
        
        console.log(`✅ Manifest loaded from GitHub (v${this.version})`)
        console.log(`   Items: ${data.metadata?.itemCount || 'unknown'}`)
        
        return this.manifest
      } else if (response.status === 404) {
        console.warn('⚠️ No manifest found in GitHub cache')
        console.log('   Please use Admin Panel to download manifest')
        
        // Return minimal fallback for basic functionality
        return this.createMinimalFallback()
      } else {
        throw new Error(`Failed to load manifest: ${response.status}`)
      }
      
    } catch (error) {
      console.error('❌ Failed to load manifest:', error)
      
      // Return minimal fallback to prevent app crash
      return this.createMinimalFallback()
    }
  }

  /**
   * Create minimal fallback manifest for basic app functionality
   */
  createMinimalFallback() {
    const fallback = {
      version: 'fallback',
      lastUpdated: new Date().toISOString(),
      data: {
        DestinyInventoryItemDefinition: {},
        DestinyStatDefinition: this.createBasicStats(),
        DestinyClassDefinition: this.createBasicClasses()
      },
      metadata: {
        itemCount: 0,
        isFallback: true
      }
    }
    
    this.manifest = fallback
    this.isLoaded = true
    this.version = 'fallback'
    this.lastUpdated = new Date()
    
    console.log('📋 Using minimal fallback manifest')
    
    return fallback
  }

  createBasicStats() {
    return {
      2996146975: { hash: 2996146975, displayProperties: { name: "Mobility" } },
      392767087: { hash: 392767087, displayProperties: { name: "Resilience" } },
      1943323491: { hash: 1943323491, displayProperties: { name: "Recovery" } },
      1735777505: { hash: 1735777505, displayProperties: { name: "Discipline" } },
      144602215: { hash: 144602215, displayProperties: { name: "Intellect" } },
      4244567218: { hash: 4244567218, displayProperties: { name: "Strength" } }
    }
  }

  createBasicClasses() {
    return {
      0: { hash: 0, displayProperties: { name: "Titan" } },
      1: { hash: 1, displayProperties: { name: "Hunter" } },
      2: { hash: 2, displayProperties: { name: "Warlock" } }
    }
  }

  /**
   * Get item definition by hash
   */
  getItem(hash) {
    if (!this.manifest?.data?.DestinyInventoryItemDefinition) {
      return null
    }
    return this.manifest.data.DestinyInventoryItemDefinition[hash] || null
  }

  /**
   * Get stat definition by hash
   */
  getStat(hash) {
    if (!this.manifest?.data?.DestinyStatDefinition) {
      return null
    }
    return this.manifest.data.DestinyStatDefinition[hash] || null
  }

  /**
   * Search items by name
   */
  searchItems(query, options = {}) {
    const items = this.manifest?.data?.DestinyInventoryItemDefinition || {}
    const results = []
    const searchTerm = query.toLowerCase()
    const maxResults = options.maxResults || 50
    
    for (const [hash, item] of Object.entries(items)) {
      if (item.displayProperties?.name?.toLowerCase().includes(searchTerm)) {
        results.push({
          ...item,
          hash: parseInt(hash)
        })
        
        if (results.length >= maxResults) {
          break
        }
      }
    }
    
    return results
  }

  /**
   * Check if manifest is ready
   */
  isReady() {
    return this.isLoaded && this.manifest !== null && !this.manifest.metadata?.isFallback
  }

  /**
   * Check if using fallback
   */
  isFallback() {
    return this.manifest?.metadata?.isFallback === true
  }

  /**
   * Get manifest version
   */
  getVersion() {
    return this.version || 'unknown'
  }

  /**
   * Get manifest statistics
   */
  getStats() {
    return {
      isLoaded: this.isLoaded,
      isFallback: this.isFallback(),
      version: this.version,
      lastUpdated: this.lastUpdated,
      itemCount: Object.keys(this.manifest?.data?.DestinyInventoryItemDefinition || {}).length,
      tableCount: Object.keys(this.manifest?.data || {}).length
    }
  }

  /**
   * Clear manifest from memory
   */
  clear() {
    this.manifest = null
    this.isLoaded = false
    this.cache.clear()
    this.version = null
    this.lastUpdated = null
    console.log('🗑️ Manifest cleared from memory')
  }

  /**
   * Force reload manifest from GitHub
   */
  async reload() {
    this.clear()
    return await this.loadManifest()
  }
}

// Export singleton instance for client-side use
let manifestManager = null

export function getManifestManager() {
  if (typeof window === 'undefined') {
    // Server-side: always create new instance
    return new ManifestManager()
  }
  
  // Client-side: use singleton
  if (!manifestManager) {
    manifestManager = new ManifestManager()
  }
  return manifestManager
}

export default ManifestManager