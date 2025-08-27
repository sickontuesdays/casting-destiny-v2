// lib/client-manifest-loader.js
// Loads manifest directly from Bungie in browser, bypassing Vercel entirely

import { BungieApiService } from './bungie-api-service'

class ClientManifestLoader {
  constructor(accessToken = null) {
    this.accessToken = accessToken
    this.bungieApi = null
    this.manifestCache = null
    this.lastLoad = null
    this.loadingPromise = null
  }

  setAccessToken(token) {
    this.accessToken = token
    this.bungieApi = new BungieApiService(token)
  }

  async loadManifestDirectly() {
    // Prevent multiple simultaneous loads
    if (this.loadingPromise) {
      return this.loadingPromise
    }

    // Return cached manifest if still fresh (1 hour)
    if (this.manifestCache && this.lastLoad && 
        Date.now() - this.lastLoad < 3600000) {
      console.log('📦 Using cached manifest (still fresh)')
      return this.manifestCache
    }

    console.log('🌐 Loading manifest directly from Bungie API (browser → Bungie)')

    this.loadingPromise = this._performDirectLoad()
    
    try {
      const manifest = await this.loadingPromise
      this.manifestCache = manifest
      this.lastLoad = Date.now()
      return manifest
    } finally {
      this.loadingPromise = null
    }
  }

  async _performDirectLoad() {
    if (!this.bungieApi) {
      if (!this.accessToken) {
        throw new Error('Access token required for direct manifest loading')
      }
      this.bungieApi = new BungieApiService(this.accessToken)
    }

    try {
      // Step 1: Get manifest info directly from Bungie
      console.log('📡 Fetching manifest info from Bungie...')
      const manifestInfo = await this._fetchManifestInfo()
      
      // Step 2: Load essential definitions directly from Bungie's CDN
      console.log('📚 Loading essential definitions from Bungie CDN...')
      const definitions = await this._loadEssentialDefinitions(manifestInfo)
      
      // Step 3: Process and optimize for local use
      console.log('⚙️ Processing definitions for local use...')
      const processedManifest = this._processManifestData(manifestInfo, definitions)
      
      console.log('✅ Manifest loaded successfully via direct browser calls')
      console.log(`Version: ${processedManifest.version}, Items: ${processedManifest.metadata.totalItems}`)
      
      return processedManifest

    } catch (error) {
      console.error('❌ Failed to load manifest directly from Bungie:', error)
      throw new Error(`Direct manifest loading failed: ${error.message}`)
    }
  }

  async _fetchManifestInfo() {
    const url = 'https://www.bungie.net/Platform/Destiny2/Manifest/'
    
    const response = await fetch(url, {
      headers: {
        'X-API-Key': process.env.NEXT_PUBLIC_BUNGIE_API_KEY || 'your-bungie-api-key'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch manifest info: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.ErrorCode !== 1) {
      throw new Error(`Bungie API error: ${data.ErrorStatus} - ${data.Message}`)
    }

    return data.Response
  }

  async _loadEssentialDefinitions(manifestInfo) {
    const jsonPaths = manifestInfo.jsonWorldComponentContentPaths.en
    
    // Only load essential definitions to avoid memory issues
    const essentialDefinitions = [
      'DestinyInventoryItemDefinition',    // Items (weapons, armor)
      'DestinyStatDefinition',             // Stats
      'DestinyClassDefinition',            // Classes 
      'DestinyInventoryBucketDefinition',  // Inventory slots
      'DestinyDamageTypeDefinition',       // Elements
      'DestinySocketTypeDefinition',       // Mod sockets
      'DestinyPlugSetDefinition'           // Mod sets
    ]

    const definitions = {}
    const loadPromises = []

    for (const defType of essentialDefinitions) {
      if (jsonPaths[defType]) {
        const promise = this._loadDefinition(defType, jsonPaths[defType])
        loadPromises.push(promise)
      }
    }

    // Load all definitions in parallel
    const results = await Promise.allSettled(loadPromises)
    
    results.forEach((result, index) => {
      const defType = essentialDefinitions[index]
      if (result.status === 'fulfilled') {
        definitions[defType] = result.value
        console.log(`✅ ${defType}: ${Object.keys(result.value).length} items`)
      } else {
        console.warn(`❌ Failed to load ${defType}:`, result.reason.message)
        definitions[defType] = {}
      }
    })

    return definitions
  }

  async _loadDefinition(defType, path) {
    const url = `https://www.bungie.net${path}`
    
    const response = await fetch(url, {
      headers: {
        'X-API-Key': process.env.NEXT_PUBLIC_BUNGIE_API_KEY || 'your-bungie-api-key'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  }

  _processManifestData(manifestInfo, definitions) {
    // Process raw definitions into optimized format for build generation
    const processedManifest = {
      version: manifestInfo.version,
      timestamp: new Date().toISOString(),
      source: 'direct-bungie-browser',
      
      // Raw definition data
      data: definitions,
      
      // Processed data for faster access
      weapons: this._processWeapons(definitions.DestinyInventoryItemDefinition || {}),
      armor: this._processArmor(definitions.DestinyInventoryItemDefinition || {}),
      stats: this._processStats(definitions.DestinyStatDefinition || {}),
      classes: this._processClasses(definitions.DestinyClassDefinition || {}),
      
      metadata: {
        loadedAt: new Date().toISOString(),
        source: 'direct-browser-to-bungie',
        definitionCounts: Object.entries(definitions).reduce((acc, [key, value]) => {
          acc[key] = Object.keys(value).length
          return acc
        }, {}),
        totalItems: Object.keys(definitions.DestinyInventoryItemDefinition || {}).length,
        loadMethod: 'client-side-direct'
      }
    }

    return processedManifest
  }

  _processWeapons(items) {
    const weapons = new Map()
    
    Object.entries(items).forEach(([hash, item]) => {
      // Only include actual weapons
      if (item.itemType === 3 && item.displayProperties?.name && !item.displayProperties.name.includes('Classified')) {
        weapons.set(hash, {
          hash: parseInt(hash),
          name: item.displayProperties.name,
          description: item.displayProperties.description,
          icon: item.displayProperties.icon,
          itemType: item.itemType,
          itemSubType: item.itemSubType,
          tierType: item.inventory?.tierType,
          isExotic: item.inventory?.tierType === 6,
          damageType: item.defaultDamageType,
          ammoType: item.equippingBlock?.ammoType,
          stats: item.stats?.stats || {},
          sockets: item.sockets || {},
          perks: item.perks || []
        })
      }
    })

    console.log(`🔫 Processed ${weapons.size} weapons`)
    return weapons
  }

  _processArmor(items) {
    const armor = new Map()
    
    Object.entries(items).forEach(([hash, item]) => {
      // Only include actual armor
      if (item.itemType === 2 && item.displayProperties?.name && !item.displayProperties.name.includes('Classified')) {
        armor.set(hash, {
          hash: parseInt(hash),
          name: item.displayProperties.name,
          description: item.displayProperties.description,
          icon: item.displayProperties.icon,
          itemType: item.itemType,
          classType: item.classType,
          tierType: item.inventory?.tierType,
          isExotic: item.inventory?.tierType === 6,
          stats: item.stats?.stats || {},
          sockets: item.sockets || {}
        })
      }
    })

    console.log(`🛡️ Processed ${armor.size} armor pieces`)
    return armor
  }

  _processStats(stats) {
    const processed = new Map()
    
    Object.entries(stats).forEach(([hash, stat]) => {
      processed.set(hash, {
        hash: parseInt(hash),
        name: stat.displayProperties?.name,
        description: stat.displayProperties?.description,
        icon: stat.displayProperties?.icon,
        statCategory: stat.statCategory,
        interpolate: stat.interpolate
      })
    })

    console.log(`📊 Processed ${processed.size} stats`)
    return processed
  }

  _processClasses(classes) {
    const processed = new Map()
    
    Object.entries(classes).forEach(([hash, classInfo]) => {
      processed.set(hash, {
        hash: parseInt(hash),
        name: classInfo.displayProperties?.name,
        description: classInfo.displayProperties?.description,
        classType: classInfo.classType,
        mentorVendorHash: classInfo.mentorVendorHash
      })
    })

    console.log(`👥 Processed ${processed.size} classes`)
    return processed
  }

  // Clear cache (useful for forcing refresh)
  clearCache() {
    this.manifestCache = null
    this.lastLoad = null
    console.log('🗑️ Manifest cache cleared')
  }

  // Check if manifest is cached and fresh
  isCacheFresh() {
    return this.manifestCache && this.lastLoad && 
           Date.now() - this.lastLoad < 3600000 // 1 hour
  }

  // Get cache status
  getCacheStatus() {
    return {
      cached: !!this.manifestCache,
      fresh: this.isCacheFresh(),
      lastLoad: this.lastLoad ? new Date(this.lastLoad).toISOString() : null,
      size: this.manifestCache ? JSON.stringify(this.manifestCache).length : 0
    }
  }
}

export default ClientManifestLoader