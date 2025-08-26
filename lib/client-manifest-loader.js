// lib/client-manifest-loader.js
// Client-side manifest loader that bypasses Vercel entirely - loads directly from Bungie

export class ClientManifestLoader {
  constructor() {
    this.cached = null
    this.loading = false
    this.apiKey = null
  }

  async initialize() {
    // Try to get API key from a minimal endpoint
    try {
      const response = await fetch('/api/auth/api-key')
      if (response.ok) {
        const data = await response.json()
        this.apiKey = data.apiKey
      }
    } catch (error) {
      console.warn('Could not get API key from server, trying public access')
    }
  }

  async loadManifest() {
    if (this.loading) {
      console.log('Manifest already loading...')
      return this.cached
    }

    if (this.cached) {
      console.log('Using cached manifest')
      return this.cached
    }

    try {
      this.loading = true
      
      console.log('🌐 Loading manifest directly from Bungie (bypassing Vercel)...')
      
      // Get manifest metadata directly from Bungie
      const manifestMetaUrl = 'https://www.bungie.net/Platform/Destiny2/Manifest/'
      const headers = {}
      
      if (this.apiKey) {
        headers['X-API-Key'] = this.apiKey
      }
      
      const manifestResponse = await fetch(manifestMetaUrl, { headers })
      
      if (!manifestResponse.ok) {
        throw new Error(`Bungie API error: ${manifestResponse.status}`)
      }

      const manifestMeta = await manifestResponse.json()
      
      if (manifestMeta.ErrorCode !== 1) {
        throw new Error(manifestMeta.Message || 'Failed to get manifest from Bungie')
      }

      console.log('📦 Downloading manifest data directly from Bungie...')
      
      // Download the JSON manifest data directly from Bungie
      const jsonPath = manifestMeta.Response.jsonWorldContentPaths.en
      const fullManifestUrl = `https://www.bungie.net${jsonPath}`
      
      const fullManifestResponse = await fetch(fullManifestUrl)
      const fullManifest = await fullManifestResponse.json()

      console.log('🔄 Processing manifest data locally...')

      // Process and filter the manifest locally in the browser
      const processedManifest = {
        version: manifestMeta.Response.version,
        lastUpdated: new Date().toISOString(),
        data: {}
      }

      // Filter to essential items only - weapons and armor that are legendary/exotic
      const itemDefinitions = {}
      let itemCount = 0
      
      for (const itemHash in fullManifest.DestinyInventoryItemDefinition) {
        const item = fullManifest.DestinyInventoryItemDefinition[itemHash]
        
        // Only include weapons (3) and armor (2) that are legendary (5) or exotic (6)
        if ([2, 3].includes(item.itemType) && 
            [5, 6].includes(item.inventory?.tierType) &&
            item.displayProperties?.name) {
          
          // Include only essential properties to reduce size
          itemDefinitions[itemHash] = {
            displayProperties: {
              name: item.displayProperties.name,
              description: item.displayProperties.description || '',
              icon: item.displayProperties.icon
            },
            itemType: item.itemType,
            itemSubType: item.itemSubType,
            classType: item.classType,
            inventory: {
              tierType: item.inventory.tierType,
              bucketTypeHash: item.inventory.bucketTypeHash
            },
            defaultDamageType: item.defaultDamageType,
            stats: item.stats,
            hash: parseInt(itemHash)
          }
          
          itemCount++
          
          // Limit items to stay within reasonable memory usage
          if (itemCount > 8000) break
        }
      }
      
      processedManifest.data.DestinyInventoryItemDefinition = itemDefinitions

      // Include essential stat definitions
      const statDefinitions = {}
      const essentialStats = [
        2996146975, // Mobility
        392767087,  // Resilience  
        1943323491, // Recovery
        1735777505, // Discipline
        144602215,  // Intellect
        4244567218  // Strength
      ]
      
      for (const statHash of essentialStats) {
        if (fullManifest.DestinyStatDefinition[statHash]) {
          const stat = fullManifest.DestinyStatDefinition[statHash]
          statDefinitions[statHash] = {
            displayProperties: {
              name: stat.displayProperties?.name,
              icon: stat.displayProperties?.icon
            },
            hash: stat.hash
          }
        }
      }
      
      processedManifest.data.DestinyStatDefinition = statDefinitions

      // Include essential class definitions  
      const classDefinitions = {}
      const essentialClasses = [671679327, 2271682572, 3655393761] // Titan, Hunter, Warlock
      
      for (const classHash of essentialClasses) {
        if (fullManifest.DestinyClassDefinition[classHash]) {
          const classDef = fullManifest.DestinyClassDefinition[classHash]
          classDefinitions[classHash] = {
            displayProperties: {
              name: classDef.displayProperties?.name,
              icon: classDef.displayProperties?.icon
            },
            classType: classDef.classType,
            hash: classDef.hash
          }
        }
      }
      
      processedManifest.data.DestinyClassDefinition = classDefinitions

      // Include essential damage type definitions
      const damageDefinitions = {}
      const essentialDamageTypes = [1, 2, 3, 4, 6, 7] // Kinetic, Arc, Solar, Void, Stasis, Strand
      
      for (const damageHash in fullManifest.DestinyDamageTypeDefinition) {
        const damage = fullManifest.DestinyDamageTypeDefinition[damageHash]
        if (essentialDamageTypes.includes(damage.enumValue)) {
          damageDefinitions[damageHash] = {
            displayProperties: {
              name: damage.displayProperties?.name,
              icon: damage.displayProperties?.icon
            },
            enumValue: damage.enumValue,
            hash: damage.hash
          }
        }
      }
      
      processedManifest.data.DestinyDamageTypeDefinition = damageDefinitions

      // Add metadata
      processedManifest.metadata = {
        itemCount,
        source: 'bungie-direct-client',
        processedAt: new Date().toISOString(),
        loadedInBrowser: true
      }

      console.log(`✅ Manifest loaded and processed directly in browser (${itemCount} items)`)
      
      this.cached = processedManifest
      return processedManifest

    } catch (error) {
      console.error('❌ Failed to load manifest directly from Bungie:', error)
      throw error
    } finally {
      this.loading = false
    }
  }

  clearCache() {
    this.cached = null
  }
}

// Singleton instance for global use
let clientLoader = null

export function getClientManifestLoader() {
  if (!clientLoader) {
    clientLoader = new ClientManifestLoader()
  }
  return clientLoader
}