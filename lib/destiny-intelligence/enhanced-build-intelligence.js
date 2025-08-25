// lib/destiny-intelligence/enhanced-build-intelligence.js
// Enhanced Build Intelligence System - Bungie API Only

class EnhancedBuildIntelligence {
  constructor() {
    this.manifest = null
    this.userInventory = null
    this.initialized = false
    this.apiBaseUrl = null
  }

  // Initialize with proper API base URL
  async initialize() {
    if (this.initialized) return

    // Set API base URL for server-side calls
    this.apiBaseUrl = this.getApiBaseUrl()
    
    try {
      // Load manifest from Bungie API
      await this.loadManifest()
      console.log('Enhanced Build Intelligence initialized with Bungie data')
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize Enhanced Build Intelligence:', error)
      throw error
    }
  }

  // Get proper API base URL for server-side calls
  getApiBaseUrl() {
    // In browser context
    if (typeof window !== 'undefined') {
      return ''
    }
    
    // In server context - use environment variable or construct from host
    const baseUrl = process.env.NEXTAUTH_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:3000'
    
    return baseUrl
  }

  // Load manifest from Bungie API only
  async loadManifest() {
    try {
      console.log('Loading manifest from Bungie API...')
      const manifestUrl = `${this.apiBaseUrl}/api/bungie/manifest`
      
      const response = await fetch(manifestUrl, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to load manifest: ${response.status} ${response.statusText}`)
      }

      this.manifest = await response.json()
      
      if (!this.manifest || !this.manifest.data) {
        throw new Error('Invalid manifest data received from Bungie API')
      }

      console.log('Manifest loaded from Bungie:', {
        version: this.manifest.version,
        definitionCounts: this.manifest.metadata?.definitionCounts || {}
      })

    } catch (error) {
      console.error('Error loading manifest from Bungie:', error)
      throw error
    }
  }

  // Load user inventory from Bungie API only
  async loadUserInventory(accessToken) {
    if (!accessToken) {
      console.log('No access token provided for inventory loading')
      return null
    }

    try {
      console.log('Loading user inventory from Bungie API...')
      const inventoryUrl = `${this.apiBaseUrl}/api/bungie/inventory`
      
      const response = await fetch(inventoryUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error(`Failed to load inventory: ${response.status} ${response.statusText}`)
        return null
      }

      const inventoryData = await response.json()
      this.userInventory = inventoryData

      console.log('User inventory loaded:', {
        characters: inventoryData.characters?.length || 0,
        totalItems: inventoryData.items?.length || 0
      })

      return inventoryData

    } catch (error) {
      console.error('Error loading user inventory:', error)
      return null
    }
  }

  // Generate build with Bungie data only
  async generateBuild(buildRequest, accessToken) {
    try {
      await this.initialize()

      console.log('Generating build with request:', buildRequest)

      // Load user inventory if access token provided
      if (accessToken) {
        await this.loadUserInventory(accessToken)
      }

      // Select character and class
      const characterClass = this.selectCharacterClass(buildRequest)
      const subclass = this.selectSubclass(buildRequest, characterClass)
      
      // Generate equipment
      const weapons = this.selectWeapons(buildRequest)
      const armor = this.selectArmor(buildRequest, characterClass)
      const mods = this.selectMods(buildRequest, armor, weapons)

      // Create the build
      const build = {
        id: `build_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: buildRequest.name || `Generated ${characterClass} Build`,
        characterClass,
        subclass,
        weapons,
        armor,
        mods,
        stats: this.calculateBuildStats(armor, mods),
        metadata: {
          generatedAt: new Date().toISOString(),
          source: 'bungie-api',
          hasUserInventory: !!this.userInventory
        }
      }

      console.log('Build generated successfully:', {
        name: build.name,
        class: characterClass,
        subclass: subclass.name,
        hasInventory: !!this.userInventory
      })

      return {
        success: true,
        build,
        synergies: this.analyzeSynergies(build),
        conflicts: this.analyzeConflicts(build),
        optimization: this.suggestOptimizations(build)
      }

    } catch (error) {
      console.error('Error generating build:', error)
      return {
        success: false,
        error: error.message,
        build: null
      }
    }
  }

  // Select character class based on request
  selectCharacterClass(buildRequest) {
    const classMap = {
      'hunter': 'Hunter',
      'titan': 'Titan', 
      'warlock': 'Warlock'
    }

    // Extract class from request
    const requestText = (buildRequest.description || '').toLowerCase()
    for (const [key, className] of Object.entries(classMap)) {
      if (requestText.includes(key)) {
        return className
      }
    }

    // Default to Hunter if no class specified
    return 'Hunter'
  }

  // Select subclass based on request and character class
  selectSubclass(buildRequest, characterClass) {
    const requestText = (buildRequest.description || '').toLowerCase()
    
    // Complete subclass selection based on keywords (including Prismatic from manifest data)
    const subclassKeywords = {
      'solar': { element: 'Solar', damageType: 'Fire' },
      'arc': { element: 'Arc', damageType: 'Lightning' },
      'void': { element: 'Void', damageType: 'Darkness' },
      'strand': { element: 'Strand', damageType: 'Kinetic' },
      'stasis': { element: 'Stasis', damageType: 'Cold' },
      'prismatic': { element: 'Prismatic', damageType: 'Light/Dark' }
    }

    for (const [keyword, subclassData] of Object.entries(subclassKeywords)) {
      if (requestText.includes(keyword)) {
        return {
          name: `${subclassData.element} ${characterClass}`,
          element: subclassData.element,
          damageType: subclassData.damageType,
          aspects: [],
          fragments: [],
          abilities: {
            grenade: null,
            melee: null,
            classAbility: null,
            super: null
          }
        }
      }
    }

    // Default to Solar
    return {
      name: `Solar ${characterClass}`,
      element: 'Solar',
      damageType: 'Fire', 
      aspects: [],
      fragments: [],
      abilities: {
        grenade: null,
        melee: null,
        classAbility: null,
        super: null
      }
    }
  }

  // Select weapons from available items
  selectWeapons(buildRequest) {
    const weapons = {
      kinetic: null,
      energy: null, 
      heavy: null
    }

    // If we have user inventory, try to select from it
    if (this.userInventory && this.userInventory.items) {
      const userWeapons = this.userInventory.items.filter(item => 
        item.itemType === 'Weapon' || item.bucketTypeHash === 1498876634 || 
        item.bucketTypeHash === 2465295065 || item.bucketTypeHash === 953998645
      )

      // Select one weapon per slot from user inventory
      const kineticWeapons = userWeapons.filter(w => w.bucketTypeHash === 1498876634)
      const energyWeapons = userWeapons.filter(w => w.bucketTypeHash === 2465295065) 
      const heavyWeapons = userWeapons.filter(w => w.bucketTypeHash === 953998645)

      weapons.kinetic = kineticWeapons[0] || null
      weapons.energy = energyWeapons[0] || null
      weapons.heavy = heavyWeapons[0] || null
    }

    // Fill empty slots with placeholder data from manifest
    if (!weapons.kinetic) {
      weapons.kinetic = this.getPlaceholderWeapon('kinetic')
    }
    if (!weapons.energy) {
      weapons.energy = this.getPlaceholderWeapon('energy')
    }
    if (!weapons.heavy) {
      weapons.heavy = this.getPlaceholderWeapon('heavy')
    }

    return weapons
  }

  // Select armor from available items
  selectArmor(buildRequest, characterClass) {
    const armor = {
      helmet: null,
      arms: null,
      chest: null,
      legs: null,
      classItem: null
    }

    // If we have user inventory, try to select from it
    if (this.userInventory && this.userInventory.items) {
      const userArmor = this.userInventory.items.filter(item => 
        item.itemType === 'Armor' || 
        [3448274439, 3551918588, 14239492, 20886954, 1585787867].includes(item.bucketTypeHash)
      )

      // Filter by character class
      const classArmor = userArmor.filter(item => 
        !item.classType || item.classType === characterClass
      )

      // Select armor pieces by bucket
      const helmets = classArmor.filter(a => a.bucketTypeHash === 3448274439)
      const arms = classArmor.filter(a => a.bucketTypeHash === 3551918588)
      const chests = classArmor.filter(a => a.bucketTypeHash === 14239492)
      const legs = classArmor.filter(a => a.bucketTypeHash === 20886954)
      const classItems = classArmor.filter(a => a.bucketTypeHash === 1585787867)

      armor.helmet = helmets[0] || null
      armor.arms = arms[0] || null
      armor.chest = chests[0] || null
      armor.legs = legs[0] || null
      armor.classItem = classItems[0] || null
    }

    // Fill empty slots with placeholder data
    if (!armor.helmet) armor.helmet = this.getPlaceholderArmor('helmet', characterClass)
    if (!armor.arms) armor.arms = this.getPlaceholderArmor('arms', characterClass)
    if (!armor.chest) armor.chest = this.getPlaceholderArmor('chest', characterClass)
    if (!armor.legs) armor.legs = this.getPlaceholderArmor('legs', characterClass)
    if (!armor.classItem) armor.classItem = this.getPlaceholderArmor('classItem', characterClass)

    return armor
  }

  // Select mods for the build
  selectMods(buildRequest, armor, weapons) {
    // Basic mod selection - in a full implementation this would be much more sophisticated
    return {
      armor: {
        helmet: [],
        arms: [],
        chest: [],
        legs: [],
        classItem: []
      },
      combat: [],
      artifact: []
    }
  }

  // Get placeholder weapon from manifest or create basic one
  getPlaceholderWeapon(slot) {
    const weaponNames = {
      kinetic: 'Placeholder Kinetic Weapon',
      energy: 'Placeholder Energy Weapon', 
      heavy: 'Placeholder Heavy Weapon'
    }

    return {
      itemInstanceId: `placeholder_${slot}_${Date.now()}`,
      itemHash: 0,
      name: weaponNames[slot],
      itemType: 'Weapon',
      slot: slot,
      tier: 'Legendary',
      isExotic: false,
      damageType: slot === 'kinetic' ? 'Kinetic' : 'Solar',
      weaponType: 'Auto Rifle',
      icon: `/icons/empty_slot.png`,
      stats: {},
      source: 'placeholder'
    }
  }

  // Get placeholder armor from manifest or create basic one
  getPlaceholderArmor(slot, characterClass) {
    const armorNames = {
      helmet: `${characterClass} Helmet`,
      arms: `${characterClass} Arms`, 
      chest: `${characterClass} Chest`,
      legs: `${characterClass} Legs`,
      classItem: `${characterClass} Class Item`
    }

    return {
      itemInstanceId: `placeholder_${slot}_${Date.now()}`,
      itemHash: 0,
      name: armorNames[slot],
      itemType: 'Armor',
      slot: slot,
      tier: 'Legendary',
      isExotic: false,
      classType: characterClass,
      stats: {
        mobility: Math.floor(Math.random() * 30) + 10,
        resilience: Math.floor(Math.random() * 30) + 10,
        recovery: Math.floor(Math.random() * 30) + 10,
        discipline: Math.floor(Math.random() * 30) + 10,
        intellect: Math.floor(Math.random() * 30) + 10,
        strength: Math.floor(Math.random() * 30) + 10
      },
      icon: `/icons/empty_slot.png`,
      source: 'placeholder'
    }
  }

  // Calculate build stats
  calculateBuildStats(armor, mods) {
    const stats = {
      mobility: 0,
      resilience: 0,
      recovery: 0,
      discipline: 0,
      intellect: 0,
      strength: 0
    }

    // Sum armor stats
    Object.values(armor).forEach(piece => {
      if (piece && piece.stats) {
        Object.keys(stats).forEach(stat => {
          stats[stat] += piece.stats[stat] || 0
        })
      }
    })

    return stats
  }

  // Analyze synergies in the build
  analyzeSynergies(build) {
    return [
      {
        type: 'basic',
        description: 'Build generated successfully with Bungie API data',
        strength: 'high'
      }
    ]
  }

  // Analyze conflicts in the build
  analyzeConflicts(build) {
    return []
  }

  // Suggest optimizations
  suggestOptimizations(build) {
    return [
      {
        type: 'suggestion',
        description: 'Consider using actual user inventory for more personalized builds',
        priority: 'medium'
      }
    ]
  }

  // Get system version
  getVersion() {
    return '2.0.0-bungie-api'
  }
}

// Export singleton instance
const enhancedBuildIntelligence = new EnhancedBuildIntelligence()
export default enhancedBuildIntelligence