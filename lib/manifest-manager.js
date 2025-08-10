import { IntelligentManifestProcessor } from './intelligent-manifest-processor'

class ManifestManager {
  constructor() {
    this.manifestData = null
    this.processedManifest = null
    this.lastUpdated = null
    this.isLoading = false
    this.processor = new IntelligentManifestProcessor()
    this.cache = new Map()
    this.version = null
  }

  async loadManifest(forceRefresh = false) {
    // Check if we already have fresh data
    if (!forceRefresh && this.processedManifest && this.isDataFresh()) {
      return this.processedManifest
    }

    if (this.isLoading) {
      // Wait for existing load to complete
      return new Promise((resolve) => {
        const checkLoading = () => {
          if (!this.isLoading) {
            resolve(this.processedManifest)
          } else {
            setTimeout(checkLoading, 100)
          }
        }
        checkLoading()
      })
    }

    this.isLoading = true

    try {
      console.log('Loading Destiny 2 manifest...')
      
      // Get manifest metadata first
      const manifestUrl = 'https://www.bungie.net/Platform/Destiny2/Manifest/'
      const manifestResponse = await fetch(manifestUrl, {
        headers: {
          'X-API-Key': process.env.BUNGIE_API_KEY
        }
      })

      if (!manifestResponse.ok) {
        throw new Error(`Failed to fetch manifest metadata: ${manifestResponse.status}`)
      }

      const manifestInfo = await manifestResponse.json()
      
      if (manifestInfo.ErrorCode !== 1) {
        throw new Error(`Bungie API error: ${manifestInfo.Message}`)
      }

      const newVersion = manifestInfo.Response.version
      
      // Check if we need to update based on version
      if (!forceRefresh && this.version === newVersion && this.processedManifest) {
        console.log('Manifest is up to date')
        this.isLoading = false
        return this.processedManifest
      }

      // Load the actual manifest data
      const manifestPaths = manifestInfo.Response.mobileWorldContentPaths.en
      const manifestDataUrl = `https://www.bungie.net${manifestPaths}`

      console.log('Downloading manifest data...')
      const dataResponse = await fetch(manifestDataUrl)
      
      if (!dataResponse.ok) {
        throw new Error(`Failed to fetch manifest data: ${dataResponse.status}`)
      }

      const rawManifestData = await dataResponse.json()

      // Process with intelligence system
      console.log('Processing manifest with intelligence system...')
      
      this.processedManifest = await this.processor.processManifest(rawManifestData, {
        categories: ['DestinyInventoryItemDefinition', 'DestinyStatDefinition', 'DestinyClassDefinition'],
        includeDescriptions: true,
        forceRefresh: forceRefresh
      })

      // Store metadata
      this.manifestData = rawManifestData
      this.lastUpdated = new Date()
      this.version = newVersion

      console.log(`Manifest loaded and processed successfully (${this.processedManifest.metadata.validItems} items)`)
      
      return this.processedManifest

    } catch (error) {
      console.error('Error loading manifest:', error)
      
      // Try to return cached data if available
      if (this.processedManifest) {
        console.log('Returning cached manifest data due to load error')
        return this.processedManifest
      }
      
      throw error
    } finally {
      this.isLoading = false
    }
  }

  async getItem(hash) {
    if (!this.processedManifest) {
      await this.loadManifest()
    }

    // Check cache first
    if (this.cache.has(hash)) {
      return this.cache.get(hash)
    }

    // Search across all categories
    for (const [category, items] of Object.entries(this.processedManifest)) {
      if (category === 'metadata') continue
      
      if (items instanceof Map && items.has(hash)) {
        const item = items.get(hash)
        this.cache.set(hash, item)
        return item
      }
    }

    return null
  }

  async searchItems(query, options = {}) {
    if (!this.processedManifest) {
      await this.loadManifest()
    }

    const {
      category = null,
      maxResults = 50,
      includeIntelligence = true,
      fuzzySearch = true
    } = options

    const results = []
    const searchTerm = query.toLowerCase()

    const categoriesToSearch = category 
      ? [category] 
      : ['weapons', 'armor', 'mods', 'subclasses']

    for (const cat of categoriesToSearch) {
      if (!this.processedManifest[cat]) continue

      for (const [hash, item] of this.processedManifest[cat]) {
        // Skip if we have enough results
        if (results.length >= maxResults) break

        // Basic name search
        if (item.name.toLowerCase().includes(searchTerm)) {
          results.push({ ...item, relevance: 1.0 })
          continue
        }

        // Fuzzy search in description if enabled
        if (fuzzySearch && item.description && item.description.toLowerCase().includes(searchTerm)) {
          results.push({ ...item, relevance: 0.8 })
          continue
        }

        // Search in intelligence data if available and enabled
        if (includeIntelligence && item.intelligence) {
          const intelligenceMatch = this.searchIntelligenceData(item.intelligence, searchTerm)
          if (intelligenceMatch > 0) {
            results.push({ ...item, relevance: intelligenceMatch })
          }
        }
      }
    }

    // Sort by relevance
    return results.sort((a, b) => b.relevance - a.relevance)
  }

  searchIntelligenceData(intelligence, searchTerm) {
    let relevance = 0

    // Search triggers
    if (intelligence.triggers) {
      for (const trigger of intelligence.triggers) {
        if (trigger.type.toLowerCase().includes(searchTerm) ||
            trigger.condition.toLowerCase().includes(searchTerm)) {
          relevance = Math.max(relevance, 0.7)
        }
      }
    }

    // Search effects
    if (intelligence.effects) {
      for (const effect of intelligence.effects) {
        if (effect.type.toLowerCase().includes(searchTerm) ||
            effect.description.toLowerCase().includes(searchTerm)) {
          relevance = Math.max(relevance, 0.6)
        }
      }
    }

    return relevance
  }

  async getItemsByCategory(category) {
    if (!this.processedManifest) {
      await this.loadManifest()
    }

    return this.processedManifest[category] || new Map()
  }

  async getIntelligenceData(hash) {
    const item = await this.getItem(hash)
    return item?.intelligence || null
  }

  async getManifestStats() {
    if (!this.processedManifest) {
      await this.loadManifest()
    }

    return {
      ...this.processedManifest.metadata,
      version: this.version,
      lastUpdated: this.lastUpdated,
      cacheSize: this.cache.size
    }
  }

  isDataFresh() {
    if (!this.lastUpdated) return false
    
    const now = new Date()
    const hoursSinceUpdate = (now - this.lastUpdated) / (1000 * 60 * 60)
    
    // Consider data fresh for 6 hours
    return hoursSinceUpdate < 6
  }

  clearCache() {
    this.cache.clear()
    console.log('Manifest cache cleared')
  }

  // Get items with specific intelligence features
  async getItemsWithTriggers(triggerType = null) {
    if (!this.processedManifest) {
      await this.loadManifest()
    }

    const items = []

    for (const [category, categoryItems] of Object.entries(this.processedManifest)) {
      if (category === 'metadata') continue

      for (const [hash, item] of categoryItems) {
        if (item.intelligence?.triggers?.length > 0) {
          if (!triggerType || item.intelligence.triggers.some(t => t.type === triggerType)) {
            items.push(item)
          }
        }
      }
    }

    return items
  }

  // Get items that synergize with a specific item
  async getSynergyItems(itemHash) {
    const baseItem = await this.getItem(itemHash)
    if (!baseItem?.intelligence) return []

    const synergyItems = []

    for (const [category, categoryItems] of Object.entries(this.processedManifest)) {
      if (category === 'metadata') continue

      for (const [hash, item] of categoryItems) {
        if (hash === itemHash) continue // Skip the base item itself

        if (item.intelligence && this.processor.checkSynergy(baseItem, item)) {
          synergyItems.push({
            ...item,
            synergyReason: this.processor.getSynergyReason(baseItem, item)
          })
        }
      }
    }

    return synergyItems
  }
}

// Singleton instance
const manifestManager = new ManifestManager()

export default manifestManager
export { ManifestManager }