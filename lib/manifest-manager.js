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
      
      console.log('Fetching manifest metadata from Bungie API...')
      console.log('API Key present:', !!process.env.BUNGIE_API_KEY)
      
      const manifestResponse = await fetch(manifestUrl, {
        headers: {
          'X-API-Key': process.env.BUNGIE_API_KEY
        }
      })

      console.log('Manifest response status:', manifestResponse.status)
      console.log('Manifest response headers:', Object.fromEntries(manifestResponse.headers.entries()))

      if (!manifestResponse.ok) {
        const errorText = await manifestResponse.text()
        console.error('Manifest API error response:', errorText)
        throw new Error(`Failed to fetch manifest metadata: ${manifestResponse.status} - ${errorText}`)
      }

      const responseText = await manifestResponse.text()
      console.log('Raw response (first 500 chars):', responseText.substring(0, 500))
      
      let manifestInfo
      try {
        manifestInfo = JSON.parse(responseText)
      } catch (parseError) {
        console.error('JSON parse error. Full response:', responseText)
        throw new Error(`Invalid JSON response from Bungie API: ${parseError.message}`)
      }

      // DEBUG: Log the full Response object to see what's available
      console.log('Full manifest Response object:', JSON.stringify(manifestInfo.Response, null, 2))
      
      // DEBUG: Check for different possible property names
      const response = manifestInfo.Response
      console.log('Available properties:', Object.keys(response))
      console.log('jsonWorldContentPaths:', response.jsonWorldContentPaths)
      console.log('jsonWorldComponentContentPaths:', response.jsonWorldComponentContentPaths)
      console.log('mobileWorldContentPaths:', response.mobileWorldContentPaths)

      const newVersion = manifestInfo.Response.version
      
      // Check if we need to update based on version
      if (!forceRefresh && this.version === newVersion && this.processedManifest) {
        console.log('Manifest is up to date')
        this.isLoading = false
        return this.processedManifest
      }

      // NEW: Look for JSON paths in the new location
      const jsonPaths = manifestInfo.Response.jsonWorldContentPaths
      
      if (jsonPaths && jsonPaths.en) {
        // Found JSON manifest! Use the new JSON paths
        const manifestDataUrl = `https://www.bungie.net${jsonPaths.en}`
        console.log('Found JSON manifest! Downloading from:', manifestDataUrl)

        const dataResponse = await fetch(manifestDataUrl)
        
        if (!dataResponse.ok) {
          throw new Error(`Failed to fetch JSON manifest data: ${dataResponse.status}`)
        }

        const rawManifestData = await dataResponse.json()
        console.log('JSON manifest downloaded successfully!')

        // Process with intelligence system
        console.log('Processing manifest with intelligence system...')
        
        this.processedManifest = await this.processor.processManifest(rawManifestData, {
          categories: ['DestinyInventoryItemDefinition', 'DestinyStatDefinition', 'DestinyClassDefinition'],
          includeDescriptions: true,
          forceRefresh: forceRefresh
        })

      } else {
        console.log('No JSON manifest available, using minimal fallback')
        
        // Fallback to minimal manifest
        const minimalData = {
          DestinyInventoryItemDefinition: this.generateMinimalItems(),
          DestinyStatDefinition: this.generateMinimalStats(),
          DestinyClassDefinition: this.generateMinimalClasses()
        }
        
        this.processedManifest = await this.processor.processManifest(minimalData, {
          categories: ['DestinyInventoryItemDefinition', 'DestinyStatDefinition', 'DestinyClassDefinition'],
          includeDescriptions: true,
          forceRefresh: forceRefresh
        })
      }

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

  // Helper methods for minimal manifest data
  generateMinimalItems() {
    return {
      // Essential exotic armor pieces
      1623653768: { displayProperties: { name: "Nezarec's Sin", description: "Void damage kills increase ability energy recharge rate." }, itemType: 2, classType: 2, tier: 6 },
      2859863910: { displayProperties: { name: "Phoenix Protocol", description: "Kills and assists grant you Rift energy." }, itemType: 2, classType: 2, tier: 6 },
      1095572584: { displayProperties: { name: "Heart of Inmost Light", description: "Using an ability empowers the other two abilities." }, itemType: 2, classType: 0, tier: 6 },
      2552430982: { displayProperties: { name: "Orpheus Rig", description: "Provides ability energy for each enemy tethered." }, itemType: 2, classType: 1, tier: 6 }
    }
  }

  generateMinimalStats() {
    return {
      2996146975: { displayProperties: { name: "Mobility", description: "Increases movement speed and jump height." } },
      392767087: { displayProperties: { name: "Resilience", description: "Increases health and damage resistance." } },
      1943323491: { displayProperties: { name: "Recovery", description: "Increases health and shield regeneration speed." } },
      1735777505: { displayProperties: { name: "Discipline", description: "Decreases grenade cooldown time." } },
      144602215: { displayProperties: { name: "Intellect", description: "Decreases Super ability cooldown time." } },
      4244567218: { displayProperties: { name: "Strength", description: "Decreases melee ability cooldown time." } }
    }
  }

  generateMinimalClasses() {
    return {
      0: { displayProperties: { name: "Titan", description: "Disciplined and proud." }, classType: 0 },
      1: { displayProperties: { name: "Hunter", description: "Quick and clever." }, classType: 1 },
      2: { displayProperties: { name: "Warlock", description: "Learned and mystical." }, classType: 2 }
    }
  }
}

// Singleton instance
const manifestManager = new ManifestManager()

export default manifestManager
export { ManifestManager }