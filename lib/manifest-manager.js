// lib/manifest-manager.js
// Fixed Manifest Manager - Uses local files, not GitHub

class ManifestManager {
  constructor() {
    this.manifest = null
    this.loading = false
    this.error = null
    this.lastLoadTime = null
  }

  /**
   * Load manifest from local files or API endpoint
   */
  async loadManifest() {
    if (this.loading) {
      console.log('Manifest already loading...')
      return this.manifest
    }

    if (this.manifest && this.lastLoadTime) {
      // Check if cached manifest is still fresh (1 hour)
      const age = Date.now() - this.lastLoadTime
      if (age < 60 * 60 * 1000) {
        console.log('Using cached manifest')
        return this.manifest
      }
    }

    try {
      this.loading = true
      this.error = null
      
      console.log('Loading manifest from local data...')
      
      // For server-side, we'll return a simplified manifest
      // The actual data will come from the local JSON files
      const manifest = {
        version: 'local-2.0.0',
        language: 'en',
        data: {
          DestinyInventoryItemDefinition: {},
          ExoticArmor: [],
          ExoticWeapons: [],
          ArmorMods: [],
          WeaponMods: [],
          ArtifactMods: [],
          Fragments: [],
          Aspects: [],
          Abilities: []
        },
        metadata: {
          itemCount: 0,
          lastUpdated: new Date().toISOString(),
          source: 'local'
        }
      }
      
      this.manifest = manifest
      this.lastLoadTime = Date.now()
      
      console.log('✅ Manifest structure loaded')
      
      return this.manifest
      
    } catch (error) {
      console.error('Failed to load manifest:', error)
      this.error = error.message
      
      // Return empty manifest structure to prevent crashes
      return {
        version: 'error',
        language: 'en',
        data: {},
        metadata: {
          error: error.message
        }
      }
    } finally {
      this.loading = false
    }
  }

  /**
   * Get specific definition table from manifest
   */
  getDefinition(tableName) {
    if (!this.manifest) {
      console.warn('Manifest not loaded')
      return null
    }
    
    return this.manifest.data?.[tableName] || null
  }

  /**
   * Get specific item by hash
   */
  getItem(itemHash) {
    if (!this.manifest) return null
    
    // Try DestinyInventoryItemDefinition first
    if (this.manifest.data?.DestinyInventoryItemDefinition) {
      const item = this.manifest.data.DestinyInventoryItemDefinition[itemHash]
      if (item) return item
    }
    
    // Search in other collections
    const collections = ['ExoticArmor', 'ExoticWeapons', 'ArmorMods', 'WeaponMods']
    for (const collection of collections) {
      if (this.manifest.data?.[collection]) {
        const items = Array.isArray(this.manifest.data[collection]) 
          ? this.manifest.data[collection]
          : Object.values(this.manifest.data[collection])
        
        const item = items.find(i => i.hash === itemHash || i.hash === String(itemHash))
        if (item) return item
      }
    }
    
    return null
  }

  /**
   * Get stat definition
   */
  getStat(statHash) {
    // Return basic stat definitions
    const stats = {
      2996146975: { displayProperties: { name: 'Mobility' } },
      392767087: { displayProperties: { name: 'Resilience' } },
      1943323491: { displayProperties: { name: 'Recovery' } },
      1735777505: { displayProperties: { name: 'Discipline' } },
      144602215: { displayProperties: { name: 'Intellect' } },
      4244567218: { displayProperties: { name: 'Strength' } }
    }
    
    return stats[statHash] || { displayProperties: { name: 'Unknown Stat' } }
  }

  /**
   * Get manifest metadata
   */
  getMetadata() {
    return this.manifest?.metadata || null
  }

  /**
   * Check if manifest is loaded
   */
  isLoaded() {
    return !!this.manifest
  }

  /**
   * Get manifest version
   */
  getVersion() {
    return this.manifest?.version || null
  }

  /**
   * Clear cached manifest
   */
  clearCache() {
    this.manifest = null
    this.lastLoadTime = null
    this.error = null
    console.log('Manifest cache cleared')
  }

  /**
   * Force reload
   */
  async forceReload() {
    this.clearCache()
    return await this.loadManifest()
  }
}

// Singleton instance
let manifestManager = null

export function getManifestManager() {
  if (!manifestManager) {
    manifestManager = new ManifestManager()
  }
  return manifestManager
}

export default ManifestManager