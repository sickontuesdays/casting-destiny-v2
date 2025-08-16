class ManifestManager {
  constructor() {
    this.manifest = null
    this.isLoaded = false
    this.cache = new Map()
    this.baseUrl = 'https://www.bungie.net'
    this.apiKey = process.env.NEXT_PUBLIC_BUNGIE_API_KEY // Use public env var for client
    this.version = null
    this.lastUpdated = null
  }

  async loadManifest() {
    if (this.isLoaded && this.manifest) {
      return this.manifest
    }

    try {
      console.log('🔄 Loading Destiny 2 manifest...')
      
      // Try to load from API endpoint
      if (typeof window !== 'undefined') {
        // Client-side: fetch from our API
        const response = await fetch('/api/bungie/manifest')
        if (response.ok) {
          const data = await response.json()
          this.manifest = data
          this.isLoaded = true
          this.version = data.version
          this.lastUpdated = new Date()
          console.log('✅ Manifest loaded from API')
          return this.manifest
        }
      }
      
      // Fallback to basic manifest
      return this.createFallbackManifest()
      
    } catch (error) {
      console.error('❌ Failed to load manifest:', error)
      return this.createFallbackManifest()
    }
  }

  createFallbackManifest() {
    const fallback = {
      version: 'fallback-1.0.0',
      data: {
        DestinyInventoryItemDefinition: this.createSampleItems(),
        DestinyStatDefinition: this.createSampleStats(),
        DestinyClassDefinition: this.createSampleClasses(),
        DestinyRaceDefinition: this.createSampleRaces(),
        DestinyGenderDefinition: this.createSampleGenders()
      },
      loadedAt: new Date().toISOString(),
      tables: ['DestinyInventoryItemDefinition', 'DestinyStatDefinition'],
      isFallback: true
    }
    
    this.manifest = fallback
    this.isLoaded = true
    this.version = fallback.version
    this.lastUpdated = new Date()
    
    return fallback
  }

  createSampleItems() {
    return {
      1234567890: {
        hash: 1234567890,
        displayProperties: {
          name: "Gjallarhorn",
          description: "If there is beauty in destruction, why not also in its delivery?",
          icon: "/common/destiny2_content/icons/gjallarhorn.jpg"
        },
        itemType: 3,
        itemSubType: 10,
        tierType: 6,
        inventory: { tierType: 6 }
      },
      1234567891: {
        hash: 1234567891,
        displayProperties: {
          name: "Celestial Nighthawk",
          description: "Starlight is your guide. No vacuum will contain you.",
          icon: "/common/destiny2_content/icons/celestial_nighthawk.jpg"
        },
        itemType: 2,
        itemSubType: 26,
        classType: 1,
        tierType: 6,
        inventory: { tierType: 6 }
      }
    }
  }

  createSampleStats() {
    return {
      2996146975: { 
        hash: 2996146975,
        displayProperties: { name: "Mobility" },
        statCategory: 1
      },
      392767087: {
        hash: 392767087,
        displayProperties: { name: "Resilience" },
        statCategory: 1
      },
      1943323491: {
        hash: 1943323491,
        displayProperties: { name: "Recovery" },
        statCategory: 1
      },
      1735777505: {
        hash: 1735777505,
        displayProperties: { name: "Discipline" },
        statCategory: 2
      },
      144602215: {
        hash: 144602215,
        displayProperties: { name: "Intellect" },
        statCategory: 2
      },
      4244567218: {
        hash: 4244567218,
        displayProperties: { name: "Strength" },
        statCategory: 2
      }
    }
  }

  createSampleClasses() {
    return {
      0: { hash: 0, displayProperties: { name: "Titan" }, classType: 0 },
      1: { hash: 1, displayProperties: { name: "Hunter" }, classType: 1 },
      2: { hash: 2, displayProperties: { name: "Warlock" }, classType: 2 }
    }
  }

  createSampleRaces() {
    return {
      0: { hash: 0, displayProperties: { name: "Human" } },
      1: { hash: 1, displayProperties: { name: "Awoken" } },
      2: { hash: 2, displayProperties: { name: "Exo" } }
    }
  }

  createSampleGenders() {
    return {
      0: { hash: 0, displayProperties: { name: "Male" } },
      1: { hash: 1, displayProperties: { name: "Female" } }
    }
  }

  // Helper methods
  getItem(hash) {
    return this.manifest?.data?.DestinyInventoryItemDefinition?.[hash] || null
  }

  getStat(hash) {
    return this.manifest?.data?.DestinyStatDefinition?.[hash] || null
  }

  searchItems(query, options = {}) {
    const items = this.manifest?.data?.DestinyInventoryItemDefinition || {}
    const results = []
    const searchTerm = query.toLowerCase()
    
    Object.values(items).forEach(item => {
      if (item.displayProperties?.name?.toLowerCase().includes(searchTerm)) {
        results.push(item)
      }
    })
    
    return results.slice(0, options.maxResults || 50)
  }

  isReady() {
    return this.isLoaded && this.manifest !== null
  }

  getVersion() {
    return this.manifest?.version || 'unknown'
  }
  
  getStats() {
    return {
      isLoaded: this.isLoaded,
      version: this.version,
      lastUpdated: this.lastUpdated,
      itemCount: Object.keys(this.manifest?.data?.DestinyInventoryItemDefinition || {}).length
    }
  }
}

export default ManifestManager