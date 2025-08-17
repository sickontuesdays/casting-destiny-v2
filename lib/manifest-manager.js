// lib/manifest-manager.js
// Updated Manifest Manager - Uses GitHub Cache

import { getGitHubStorage } from './github-storage'

class ManifestManager {
  constructor() {
    this.manifest = null
    this.loading = false
    this.error = null
    this.lastLoadTime = null
    this.githubStorage = getGitHubStorage()
  }

  /**
   * Load manifest from GitHub cache (not directly from Bungie)
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
      
      console.log('Loading manifest from GitHub cache...')
      
      // Load from GitHub repository (not Bungie)
      const manifest = await this.githubStorage.loadManifest()
      
      if (!manifest) {
        throw new Error('Manifest not found in GitHub cache. Please use admin panel to pull manifest.')
      }
      
      this.manifest = manifest
      this.lastLoadTime = Date.now()
      
      console.log(`✅ Manifest loaded (version: ${manifest.version})`)
      console.log(`Items: ${manifest.metadata?.itemCount || 'unknown'}`)
      
      return this.manifest
      
    } catch (error) {
      console.error('Failed to load manifest:', error)
      this.error = error.message
      throw error
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
   * Get item definition by hash
   */
  getItemDefinition(itemHash) {
    const items = this.getDefinition('DestinyInventoryItemDefinition')
    if (!items) return null
    
    return items[itemHash] || null
  }

  /**
   * Get stat definition
   */
  getStatDefinition(statHash) {
    const stats = this.getDefinition('DestinyStatDefinition')
    if (!stats) return null
    
    return stats[statHash] || null
  }

  /**
   * Search items by name
   */
  searchItems(query, itemType = null) {
    const items = this.getDefinition('DestinyInventoryItemDefinition')
    if (!items) return []
    
    const results = []
    const searchTerm = query.toLowerCase()
    
    for (const [hash, item] of Object.entries(items)) {
      // Check name match
      if (!item.displayProperties?.name?.toLowerCase().includes(searchTerm)) {
        continue
      }
      
      // Filter by item type if specified
      if (itemType && item.itemType !== itemType) {
        continue
      }
      
      results.push({
        hash,
        name: item.displayProperties.name,
        description: item.displayProperties.description,
        icon: item.displayProperties.icon,
        itemType: item.itemType,
        itemSubType: item.itemSubType,
        classType: item.classType
      })
      
      // Limit results
      if (results.length >= 50) break
    }
    
    return results
  }

  /**
   * Get all exotic armor for a specific class
   */
  getExoticArmor(classType) {
    const items = this.getDefinition('DestinyInventoryItemDefinition')
    if (!items) return []
    
    const exotics = []
    
    for (const [hash, item] of Object.entries(items)) {
      // Check if it's exotic armor
      if (item.inventory?.tierType !== 6) continue // 6 = Exotic
      if (item.itemType !== 2) continue // 2 = Armor
      
      // Check class (3 = Titan, 2 = Hunter, 1 = Warlock, 0 = Any)
      if (item.classType !== classType && item.classType !== 0) continue
      
      exotics.push({
        hash,
        name: item.displayProperties.name,
        description: item.displayProperties.description,
        icon: item.displayProperties.icon,
        type: item.itemSubType,
        classType: item.classType
      })
    }
    
    return exotics
  }

  /**
   * Get manifest metadata without loading full manifest
   */
  async getMetadata() {
    try {
      const metadata = await this.githubStorage.getManifestMetadata()
      return metadata
    } catch (error) {
      console.error('Failed to get manifest metadata:', error)
      return null
    }
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
   * Force reload from GitHub
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