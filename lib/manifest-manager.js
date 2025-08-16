import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'

class ManifestManager {
  constructor() {
    this.manifest = null
    this.isLoaded = false
    this.cache = new Map()
    this.baseUrl = 'https://www.bungie.net'
    this.apiKey = process.env.BUNGIE_API_KEY
    this.version = null
    this.lastUpdated = null
    this.githubToken = process.env.GITHUB_TOKEN
    this.repoOwner = 'sickontuesdays'
    this.repoName = 'casting-destiny-v2'
    this.localCachePath = process.env.VERCEL ? '/tmp/manifest' : path.join(process.cwd(), 'cache', 'manifest')
  }

  async loadManifest() {
    if (this.isLoaded && this.manifest && this.isDataFresh()) {
      return this.manifest
    }

    try {
      console.log('🔄 Loading Destiny 2 manifest...')
      
      // Check if we need to update from Bungie
      if (this.shouldUpdateManifest()) {
        await this.updateManifestFromBungie()
      }
      
      // Try to load from GitHub cache first
      const githubManifest = await this.loadFromGitHub()
      if (githubManifest) {
        this.manifest = githubManifest
        this.isLoaded = true
        this.version = githubManifest.version
        this.lastUpdated = new Date(githubManifest.metadata?.timestamp || Date.now())
        console.log('✅ Manifest loaded from GitHub cache')
        return this.manifest
      }
      
      // Fallback to fetching directly from Bungie
      const manifestData = await this.fetchDirectFromBungie()
      
      this.manifest = manifestData
      this.isLoaded = true
      this.version = manifestData.version
      this.lastUpdated = new Date()
      
      console.log('✅ Manifest loaded successfully from Bungie')
      
      // Save to GitHub for future use
      this.saveToGitHub(manifestData).catch(err => 
        console.error('Failed to save to GitHub:', err)
      )
      
      return this.manifest
    } catch (error) {
      console.error('❌ Failed to load manifest:', error)
      return this.createFallbackManifest()
    }
  }

  shouldUpdateManifest() {
    const now = new Date()
    const day = now.getDay()
    const hour = now.getHours()
    const minute = now.getMinutes()
    
    // Check if it's Tuesday (day 2) after 1:30 PM EST (18:30 UTC)
    if (day === 2 && (hour > 18 || (hour === 18 && minute >= 30))) {
      // Check last update time
      if (!this.lastUpdated) return true
      
      const timeSinceUpdate = now - this.lastUpdated
      const hoursSinceUpdate = timeSinceUpdate / (1000 * 60 * 60)
      
      // Update if more than 24 hours since last update
      return hoursSinceUpdate > 24
    }
    
    // Also update if manifest is more than 7 days old
    if (this.lastUpdated) {
      const daysSinceUpdate = (now - this.lastUpdated) / (1000 * 60 * 60 * 24)
      return daysSinceUpdate > 7
    }
    
    return false
  }

  async fetchDirectFromBungie() {
    // Get manifest info
    const manifestInfo = await this.getManifestInfo()
    
    // Get the SQLite database URL
    const dbUrl = `${this.baseUrl}${manifestInfo.mobileWorldContentPaths.en}`
    
    console.log('Downloading manifest database...')
    const response = await fetch(dbUrl)
    
    if (!response.ok) {
      throw new Error(`Failed to download manifest: ${response.status}`)
    }
    
    // For this implementation, we'll fetch the JSON version instead
    // In production, you'd parse the SQLite database
    const manifestData = await this.fetchJsonManifest(manifestInfo)
    
    return {
      version: manifestInfo.version,
      data: manifestData,
      metadata: {
        timestamp: Date.now(),
        version: manifestInfo.version,
        lastUpdated: new Date().toISOString()
      }
    }
  }

  async fetchJsonManifest(manifestInfo) {
    // Essential tables to fetch
    const tables = {
      DestinyInventoryItemDefinition: {},
      DestinyStatDefinition: {},
      DestinyClassDefinition: {},
      DestinySocketTypeDefinition: {},
      DestinySocketCategoryDefinition: {},
      DestinyPlugSetDefinition: {},
      DestinyInventoryBucketDefinition: {},
      DestinyDamageTypeDefinition: {},
      DestinyActivityDefinition: {},
      DestinyActivityModeDefinition: {},
      DestinyVendorDefinition: {},
      DestinyProgressionDefinition: {},
      DestinySandboxPerkDefinition: {},
      DestinyTalentGridDefinition: {},
      DestinyItemTierTypeDefinition: {}
    }

    // Note: In production, you would download and parse the SQLite database
    // For now, we'll use sample data structure
    console.log('Processing manifest tables...')
    
    // This would be replaced with actual SQLite parsing
    return tables
  }

  async loadFromGitHub() {
    if (!this.githubToken) {
      console.log('No GitHub token configured, skipping GitHub cache')
      return null
    }

    try {
      const url = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/data/manifest/manifest.json`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          console.log('No manifest found in GitHub cache')
          return null
        }
        throw new Error(`GitHub API error: ${response.status}`)
      }

      const data = await response.json()
      const content = Buffer.from(data.content, 'base64').toString('utf-8')
      const manifest = JSON.parse(content)
      
      // Check if manifest is recent enough
      if (manifest.metadata?.timestamp) {
        const age = Date.now() - manifest.metadata.timestamp
        const daysOld = age / (1000 * 60 * 60 * 24)
        
        if (daysOld > 7) {
          console.log('GitHub cache is too old, will fetch fresh data')
          return null
        }
      }
      
      return manifest
    } catch (error) {
      console.error('Failed to load from GitHub:', error)
      return null
    }
  }

  async saveToGitHub(manifestData) {
    if (!this.githubToken) {
      console.log('No GitHub token configured, skipping GitHub save')
      return
    }

    try {
      const url = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/data/manifest/manifest.json`
      
      // Check if file exists
      let sha = null
      try {
        const getResponse = await fetch(url, {
          headers: {
            'Authorization': `token ${this.githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        })
        
        if (getResponse.ok) {
          const existing = await getResponse.json()
          sha = existing.sha
        }
      } catch (e) {
        // File doesn't exist, that's okay
      }

      const content = Buffer.from(JSON.stringify(manifestData, null, 2)).toString('base64')
      
      const body = {
        message: `Update manifest - ${new Date().toISOString()}`,
        content: content,
        branch: 'main'
      }
      
      if (sha) {
        body.sha = sha
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to save to GitHub: ${error}`)
      }

      console.log('✅ Manifest saved to GitHub repository')
    } catch (error) {
      console.error('Failed to save to GitHub:', error)
      throw error
    }
  }

  async getManifestInfo() {
    try {
      const response = await fetch(`${this.baseUrl}/Platform/Destiny2/Manifest/`, {
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.ErrorCode !== 1) {
        throw new Error(`Bungie API Error: ${data.Message}`)
      }

      return data.Response
    } catch (error) {
      console.error('Failed to get manifest info:', error)
      throw error
    }
  }

  createFallbackManifest() {
    return {
      version: 'fallback-1.0.0',
      data: {
        DestinyInventoryItemDefinition: this.createSampleItems(),
        DestinyStatDefinition: this.createSampleStats(),
        DestinyClassDefinition: this.createSampleClasses(),
        DestinyRaceDefinition: this.createSampleRaces(),
        DestinyGenderDefinition: this.createSampleGenders()
      },
      metadata: {
        timestamp: Date.now(),
        lastUpdated: new Date().toISOString()
      },
      isFallback: true
    }
  }

  createSampleItems() {
    // Sample exotic and legendary items for fallback
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

  isDataFresh() {
    if (!this.lastUpdated) return false
    const hoursSinceUpdate = (Date.now() - this.lastUpdated.getTime()) / (1000 * 60 * 60)
    return hoursSinceUpdate < 24
  }

  clearCache() {
    this.cache.clear()
    console.log('Manifest cache cleared')
  }

  getStats() {
    return {
      isLoaded: this.isLoaded,
      version: this.version,
      lastUpdated: this.lastUpdated,
      cacheSize: this.cache.size,
      itemCount: Object.keys(this.manifest?.data?.DestinyInventoryItemDefinition || {}).length
    }
  }
}

export default ManifestManager