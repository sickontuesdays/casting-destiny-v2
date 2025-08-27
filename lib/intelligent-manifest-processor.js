// lib/intelligent-manifest-processor.js
// Intelligent manifest processing system for enhanced analysis

export class IntelligentManifestProcessor {
  constructor() {
    this.initialized = false
    this.manifest = null
    this.processedData = {
      weapons: new Map(),
      armor: new Map(),
      mods: new Map(),
      stats: new Map(),
      classes: new Map()
    }
    this.version = '2.0.0'
  }

  async initialize(manifestData) {
    try {
      console.log('🔧 Initializing Intelligent Manifest Processor...')
      
      if (!manifestData || !manifestData.data) {
        throw new Error('Valid manifest data required for processing')
      }
      
      this.manifest = manifestData
      
      // Process all definition types
      await this._processItemDefinitions()
      await this._processStatDefinitions()  
      await this._processClassDefinitions()
      await this._analyzeBuildPotential()
      
      this.initialized = true
      console.log('✅ Intelligent Manifest Processor initialized successfully')
      console.log(`📊 Processed: ${this.processedData.weapons.size} weapons, ${this.processedData.armor.size} armor pieces`)
      
      return true
      
    } catch (error) {
      console.error('❌ Failed to initialize Intelligent Manifest Processor:', error)
      this.initialized = false
      throw error
    }
  }

  async _processItemDefinitions() {
    const items = this.manifest.data.DestinyInventoryItemDefinition || {}
    
    console.log('⚙️ Processing item definitions...')
    
    Object.entries(items).forEach(([hash, item]) => {
      if (!item.displayProperties?.name || item.displayProperties.name.includes('Classified')) {
        return
      }

      const processedItem = {
        hash: parseInt(hash),
        name: item.displayProperties.name,
        description: item.displayProperties.description || '',
        icon: item.displayProperties.icon,
        itemType: item.itemType,
        itemSubType: item.itemSubType,
        tierType: item.inventory?.tierType,
        isExotic: item.inventory?.tierType === 6,
        classType: item.classType,
        damageType: item.defaultDamageType,
        
        // Enhanced intelligence data
        intelligence: {
          category: this._categorizeItem(item),
          element: this._extractElement(item),
          activity: this._analyzeActivityFit(item),
          buildRole: this._determineBuildRole(item),
          synergies: this._identifyItemSynergies(item),
          tags: this._generateTags(item),
          rating: this._calculateItemRating(item)
        },

        // Raw data for detailed analysis
        stats: item.stats?.stats || {},
        sockets: item.sockets || {},
        perks: item.perks || [],
        objectives: item.objectives || []
      }

      // Sort into appropriate collections
      if (item.itemType === 3) { // Weapons
        this.processedData.weapons.set(hash, this._enhanceWeaponData(processedItem, item))
      } else if (item.itemType === 2) { // Armor
        this.processedData.armor.set(hash, this._enhanceArmorData(processedItem, item))
      } else if (item.itemType === 19 || item.itemType === 20) { // Mods/Shaders
        this.processedData.mods.set(hash, processedItem)
      }
    })
  }

  _categorizeItem(item) {
    if (item.itemType === 3) return 'weapon'
    if (item.itemType === 2) return 'armor'
    if (item.itemType === 19) return 'mod'
    if (item.itemType === 20) return 'shader'
    return 'other'
  }

  _extractElement(item) {
    const damageTypeMap = {
      1: 'kinetic',
      2: 'arc', 
      3: 'solar',
      4: 'void',
      6: 'stasis',
      7: 'strand'
    }
    
    return damageTypeMap[item.defaultDamageType] || 'kinetic'
  }

  _analyzeActivityFit(item) {
    const activities = []
    const name = item.displayProperties?.name?.toLowerCase() || ''
    const description = item.displayProperties?.description?.toLowerCase() || ''
    
    // Analyze based on name and description
    if (name.includes('raid') || description.includes('raid')) activities.push('raid')
    if (name.includes('trials') || description.includes('trials')) activities.push('pvp')
    if (name.includes('nightfall') || description.includes('nightfall')) activities.push('nightfall')
    if (name.includes('dungeon') || description.includes('dungeon')) activities.push('dungeon')
    
    // Default categorization based on item type
    if (item.itemType === 3) { // Weapons
      if (item.itemSubType === 6) activities.push('raid') // Sniper rifles often good for raids
      if (item.itemSubType === 7) activities.push('pvp') // Hand cannons popular in PvP
    }

    return activities.length > 0 ? activities : ['general_pve']
  }

  _determineBuildRole(item) {
    if (item.itemType === 3) { // Weapons
      return this._getWeaponRole(item)
    } else if (item.itemType === 2) { // Armor
      return this._getArmorRole(item)
    }
    return 'utility'
  }

  _getWeaponRole(item) {
    const subTypeRoles = {
      6: 'precision', // Sniper Rifle
      7: 'versatile', // Hand Cannon
      8: 'add_clear', // Auto Rifle
      9: 'versatile', // Pulse Rifle
      13: 'add_clear', // Shotgun
      14: 'burst_damage', // Fusion Rifle
      18: 'boss_damage', // Rocket Launcher
      19: 'sustained_damage', // Machine Gun
      22: 'boss_damage' // Linear Fusion Rifle
    }
    
    return subTypeRoles[item.itemSubType] || 'versatile'
  }

  _getArmorRole(item) {
    // Analyze armor stats to determine role
    const stats = item.stats?.stats || {}
    let primaryStat = null
    let maxValue = 0

    Object.entries(stats).forEach(([statHash, statData]) => {
      if (statData.value > maxValue) {
        maxValue = statData.value
        primaryStat = this._getStatNameByHash(parseInt(statHash))
      }
    })

    const roleMap = {
      'mobility': 'mobility',
      'resilience': 'tank',
      'recovery': 'survivability',
      'discipline': 'ability_spam',
      'intellect': 'super_focus', 
      'strength': 'melee_focus'
    }

    return roleMap[primaryStat] || 'balanced'
  }

  _identifyItemSynergies(item) {
    const synergies = []
    const name = item.displayProperties?.name?.toLowerCase() || ''
    const description = item.displayProperties?.description?.toLowerCase() || ''
    
    // Identify potential synergies based on item properties
    if (item.itemType === 2 && item.inventory?.tierType === 6) { // Exotic armor
      if (description.includes('grenade')) synergies.push('grenade_synergy')
      if (description.includes('super')) synergies.push('super_synergy')
      if (description.includes('melee')) synergies.push('melee_synergy')
      if (description.includes('healing') || description.includes('recovery')) synergies.push('healing_synergy')
    }
    
    if (item.itemType === 3 && item.inventory?.tierType === 6) { // Exotic weapons
      if (description.includes('chain')) synergies.push('chain_reaction')
      if (description.includes('explosion')) synergies.push('explosive_synergy')
      if (description.includes('precision')) synergies.push('precision_synergy')
    }
    
    return synergies
  }

  _generateTags(item) {
    const tags = []
    const name = item.displayProperties?.name?.toLowerCase() || ''
    
    // Add basic categorization tags
    if (item.inventory?.tierType === 6) tags.push('exotic')
    if (item.inventory?.tierType === 5) tags.push('legendary')
    
    // Add element tags
    const element = this._extractElement(item)
    if (element !== 'kinetic') tags.push(element)
    
    // Add activity tags
    const activities = this._analyzeActivityFit(item)
    tags.push(...activities)
    
    // Add role tags
    const role = this._determineBuildRole(item)
    tags.push(role)
    
    return [...new Set(tags)] // Remove duplicates
  }

  _calculateItemRating(item) {
    let rating = 50 // Base rating
    
    // Exotic items get higher base rating
    if (item.inventory?.tierType === 6) rating = 75
    else if (item.inventory?.tierType === 5) rating = 60
    
    // Adjust based on various factors
    if (item.stats?.stats && Object.keys(item.stats.stats).length > 0) rating += 5
    if (item.sockets?.socketEntries && item.sockets.socketEntries.length > 0) rating += 5
    if (item.perks && item.perks.length > 0) rating += 5
    
    return Math.min(rating, 100)
  }

  _enhanceWeaponData(processedItem, rawItem) {
    return {
      ...processedItem,
      weaponData: {
        ammoType: rawItem.equippingBlock?.ammoType,
        defaultDamageType: rawItem.defaultDamageType,
        intrinsicPerks: this._extractIntrinsicPerks(rawItem),
        recommendedPerks: this._analyzeRecommendedPerks(rawItem),
        optimalRange: this._calculateOptimalRange(rawItem),
        effectiveness: this._analyzeWeaponEffectiveness(rawItem)
      }
    }
  }

  _enhanceArmorData(processedItem, rawItem) {
    return {
      ...processedItem,
      armorData: {
        classRestriction: rawItem.classType,
        statDistribution: this._analyzeStatDistribution(rawItem),
        modSlots: this._analyzeModSlots(rawItem),
        seasonalMods: this._identifySeasonalModCompatibility(rawItem),
        buildSynergy: this._analyzeArmorBuildSynergy(rawItem)
      }
    }
  }

  _extractIntrinsicPerks(item) {
    // Extract intrinsic weapon perks
    return item.perks?.map(perk => ({
      hash: perk.perkHash,
      requirement: perk.requirementDisplayString
    })) || []
  }

  _analyzeRecommendedPerks(item) {
    // Analyze and recommend optimal perks for weapon
    const recommendations = []
    
    if (item.itemSubType === 6) { // Sniper
      recommendations.push('Triple Tap', 'Firing Line', 'Fourth Times the Charm')
    } else if (item.itemSubType === 7) { // Hand Cannon
      recommendations.push('Explosive Payload', 'Rangefinder', 'Kill Clip')
    }
    
    return recommendations
  }

  _calculateOptimalRange(item) {
    // Calculate optimal engagement range for weapons
    const rangeMap = {
      6: 'long', // Sniper
      7: 'medium', // Hand Cannon
      8: 'short-medium', // Auto Rifle
      13: 'close' // Shotgun
    }
    
    return rangeMap[item.itemSubType] || 'medium'
  }

  _analyzeWeaponEffectiveness(item) {
    return {
      pve: this._calculatePvEEffectiveness(item),
      pvp: this._calculatePvPEffectiveness(item),
      versatility: this._calculateVersatility(item)
    }
  }

  _calculatePvEEffectiveness(item) {
    // Simplified PvE effectiveness calculation
    let score = 50
    
    if (item.itemSubType === 22) score += 30 // Linear Fusion (high DPS)
    else if (item.itemSubType === 6) score += 25 // Sniper (precision)
    else if (item.itemSubType === 8) score += 20 // Auto Rifle (versatile)
    
    return Math.min(score, 100)
  }

  _calculatePvPEffectiveness(item) {
    // Simplified PvP effectiveness calculation
    let score = 50
    
    if (item.itemSubType === 7) score += 30 // Hand Cannon
    else if (item.itemSubType === 13) score += 25 // Shotgun
    else if (item.itemSubType === 9) score += 20 // Pulse Rifle
    
    return Math.min(score, 100)
  }

  _calculateVersatility(item) {
    // Calculate how versatile the item is across activities
    const pve = this._calculatePvEEffectiveness(item)
    const pvp = this._calculatePvPEffectiveness(item)
    
    return Math.round((pve + pvp) / 2)
  }

  _analyzeStatDistribution(item) {
    const stats = item.stats?.stats || {}
    const distribution = {}
    let totalStats = 0
    
    Object.entries(stats).forEach(([statHash, statData]) => {
      const statName = this._getStatNameByHash(parseInt(statHash))
      if (statName) {
        distribution[statName] = statData.value || 0
        totalStats += statData.value || 0
      }
    })
    
    return {
      stats: distribution,
      total: totalStats,
      focus: this._determineStatFocus(distribution),
      tier: totalStats > 64 ? 'high' : totalStats > 56 ? 'medium' : 'low'
    }
  }

  _determineStatFocus(stats) {
    let maxStat = null
    let maxValue = 0
    
    Object.entries(stats).forEach(([stat, value]) => {
      if (value > maxValue) {
        maxValue = value
        maxStat = stat
      }
    })
    
    return maxStat || 'balanced'
  }

  _analyzeModSlots(item) {
    const sockets = item.sockets?.socketEntries || []
    const modSlots = []
    
    sockets.forEach((socket, index) => {
      if (socket.socketTypeHash) {
        modSlots.push({
          index,
          typeHash: socket.socketTypeHash,
          category: this._categorizeSocket(socket.socketTypeHash)
        })
      }
    })
    
    return modSlots
  }

  _categorizeSocket(socketTypeHash) {
    // Categorize socket types (simplified)
    const socketCategories = {
      3313201758: 'stat_mod',
      1282012138: 'combat_mod',
      2685412949: 'elemental_mod',
      4241085061: 'raid_mod'
    }
    
    return socketCategories[socketTypeHash] || 'utility_mod'
  }

  _identifySeasonalModCompatibility(item) {
    // Identify which seasonal mods this armor can use
    const compatibility = []
    
    if (item.classType !== 3) { // Not class-agnostic
      compatibility.push('class_specific_mods')
    }
    
    return compatibility
  }

  _analyzeArmorBuildSynergy(item) {
    const statFocus = this._determineStatFocus(this._analyzeStatDistribution(item).stats)
    
    return {
      primaryFocus: statFocus,
      buildTypes: this._getCompatibleBuilds(statFocus, item),
      synergies: this._getArmorSynergies(item)
    }
  }

  _getCompatibleBuilds(statFocus, item) {
    const buildTypes = []
    
    switch(statFocus) {
      case 'mobility':
        buildTypes.push('pvp', 'speedrun')
        break
      case 'resilience':
        buildTypes.push('tank', 'gm_content')
        break
      case 'recovery':
        buildTypes.push('raid', 'survivability')
        break
      case 'discipline':
        buildTypes.push('ability_spam', 'grenade_build')
        break
      case 'intellect':
        buildTypes.push('super_focus', 'support')
        break
      case 'strength':
        buildTypes.push('melee_build', 'close_combat')
        break
      default:
        buildTypes.push('general_pve')
    }
    
    return buildTypes
  }

  _getArmorSynergies(item) {
    const synergies = []
    
    if (item.inventory?.tierType === 6) { // Exotic armor
      const name = item.displayProperties?.name?.toLowerCase() || ''
      const desc = item.displayProperties?.description?.toLowerCase() || ''
      
      if (desc.includes('grenade')) synergies.push('grenade_enhancement')
      if (desc.includes('super')) synergies.push('super_enhancement')
      if (desc.includes('melee')) synergies.push('melee_enhancement')
      if (desc.includes('healing')) synergies.push('healing_enhancement')
      if (desc.includes('damage')) synergies.push('damage_enhancement')
    }
    
    return synergies
  }

  async _processStatDefinitions() {
    const stats = this.manifest.data.DestinyStatDefinition || {}
    
    Object.entries(stats).forEach(([hash, stat]) => {
      this.processedData.stats.set(hash, {
        hash: parseInt(hash),
        name: stat.displayProperties?.name,
        description: stat.displayProperties?.description,
        icon: stat.displayProperties?.icon,
        statCategory: stat.statCategory,
        interpolate: stat.interpolate
      })
    })
  }

  async _processClassDefinitions() {
    const classes = this.manifest.data.DestinyClassDefinition || {}
    
    Object.entries(classes).forEach(([hash, classInfo]) => {
      this.processedData.classes.set(hash, {
        hash: parseInt(hash),
        name: classInfo.displayProperties?.name,
        description: classInfo.displayProperties?.description,
        classType: classInfo.classType,
        genderizedClassNames: classInfo.genderizedClassNames
      })
    })
  }

  async _analyzeBuildPotential() {
    console.log('🔍 Analyzing build potential...')
    
    // Analyze weapon combinations
    this._analyzeWeaponCombinations()
    
    // Analyze armor sets
    this._analyzeArmorSets()
    
    // Identify exotic synergies
    this._identifyExoticSynergies()
  }

  _analyzeWeaponCombinations() {
    // Analyze effective weapon combinations
    const weapons = Array.from(this.processedData.weapons.values())
    const primaryWeapons = weapons.filter(w => w.weaponData?.ammoType === 1)
    const specialWeapons = weapons.filter(w => w.weaponData?.ammoType === 2)
    const heavyWeapons = weapons.filter(w => w.weaponData?.ammoType === 3)
    
    console.log(`🔫 Weapon analysis: ${primaryWeapons.length} primary, ${specialWeapons.length} special, ${heavyWeapons.length} heavy`)
  }

  _analyzeArmorSets() {
    // Analyze armor set combinations and stat distributions
    const armor = Array.from(this.processedData.armor.values())
    const titanArmor = armor.filter(a => a.classType === 0)
    const hunterArmor = armor.filter(a => a.classType === 1) 
    const warlockArmor = armor.filter(a => a.classType === 2)
    
    console.log(`🛡️ Armor analysis: ${titanArmor.length} Titan, ${hunterArmor.length} Hunter, ${warlockArmor.length} Warlock`)
  }

  _identifyExoticSynergies() {
    // Identify synergies between exotic items
    const exoticWeapons = Array.from(this.processedData.weapons.values()).filter(w => w.isExotic)
    const exoticArmor = Array.from(this.processedData.armor.values()).filter(a => a.isExotic)
    
    console.log(`✨ Exotic analysis: ${exoticWeapons.length} weapons, ${exoticArmor.length} armor pieces`)
  }

  _getStatNameByHash(hash) {
    const hashToName = {
      2996146975: 'mobility',
      392767087: 'resilience', 
      1943323491: 'recovery',
      1735777505: 'discipline',
      144602215: 'intellect',
      4244567218: 'strength'
    }
    
    return hashToName[hash] || null
  }

  // Public query methods
  getProcessedWeapons() {
    return this.processedData.weapons
  }

  getProcessedArmor() {
    return this.processedData.armor
  }

  getItemByHash(hash) {
    return this.processedData.weapons.get(hash) || 
           this.processedData.armor.get(hash) || 
           this.processedData.mods.get(hash)
  }

  searchItems(query, options = {}) {
    const results = []
    const queryLower = query.toLowerCase()
    
    const allItems = new Map([
      ...this.processedData.weapons,
      ...this.processedData.armor,
      ...this.processedData.mods
    ])
    
    for (const [hash, item] of allItems) {
      if (item.name.toLowerCase().includes(queryLower) ||
          item.description.toLowerCase().includes(queryLower) ||
          item.intelligence.tags.some(tag => tag.includes(queryLower))) {
        results.push(item)
      }
    }
    
    return results
  }

  isInitialized() {
    return this.initialized
  }
}