// lib/destiny-intelligence/enhanced-build-intelligence.js
// Enhanced Build Intelligence system using GitHub cached manifest

export class EnhancedBuildIntelligence {
  constructor() {
    this.initialized = false
    this.manifest = null
    this.version = '2.0.0'
    this.itemDefinitions = null
    this.statDefinitions = null
    this.classDefinitions = null
    this.damageDefinitions = null
  }

  async initialize(manifestData) {
    try {
      console.log('🧠 Initializing Enhanced Build Intelligence System...')
      
      if (!manifestData || !manifestData.data) {
        throw new Error('Invalid manifest data provided')
      }
      
      this.manifest = manifestData
      this.itemDefinitions = manifestData.data.DestinyInventoryItemDefinition || {}
      this.statDefinitions = manifestData.data.DestinyStatDefinition || {}
      this.classDefinitions = manifestData.data.DestinyClassDefinition || {}
      this.damageDefinitions = manifestData.data.DestinyDamageTypeDefinition || {}
      
      console.log(`📊 Loaded definitions:`)
      console.log(`  Items: ${Object.keys(this.itemDefinitions).length}`)
      console.log(`  Stats: ${Object.keys(this.statDefinitions).length}`)
      console.log(`  Classes: ${Object.keys(this.classDefinitions).length}`)
      console.log(`  Damage Types: ${Object.keys(this.damageDefinitions).length}`)
      
      this.initialized = true
      console.log('✅ Enhanced Build Intelligence System initialized successfully')
      return true
      
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Build Intelligence:', error)
      this.initialized = false
      throw error
    }
  }

  isInitialized() {
    return this.initialized
  }

  async analyzeRequest(userInput, options = {}) {
    if (!this.initialized) {
      throw new Error('Build Intelligence not initialized')
    }

    try {
      console.log('🔍 Analyzing user request:', userInput)
      
      // Parse user input for build requirements
      const parsedRequest = this.parseUserInput(userInput)
      
      // Calculate confidence based on how well we understood the request
      const confidence = this.calculateParseConfidence(userInput, parsedRequest)
      
      return {
        success: true,
        parsedRequest,
        confidence,
        originalInput: userInput
      }
      
    } catch (error) {
      console.error('Error analyzing request:', error)
      return {
        success: false,
        error: error.message,
        originalInput: userInput
      }
    }
  }

  parseUserInput(input) {
    const parsed = {
      class: 'any',
      activity: 'general_pve', 
      element: 'any',
      playstyle: 'balanced',
      focusStats: [],
      exotic: null,
      keywords: []
    }

    const lowercaseInput = input.toLowerCase()

    // Parse class
    if (lowercaseInput.includes('titan')) parsed.class = 'titan'
    else if (lowercaseInput.includes('hunter')) parsed.class = 'hunter' 
    else if (lowercaseInput.includes('warlock')) parsed.class = 'warlock'

    // Parse activity
    if (lowercaseInput.includes('raid')) parsed.activity = 'raid'
    else if (lowercaseInput.includes('pvp') || lowercaseInput.includes('crucible')) parsed.activity = 'pvp'
    else if (lowercaseInput.includes('dungeon')) parsed.activity = 'dungeon'
    else if (lowercaseInput.includes('nightfall')) parsed.activity = 'nightfall'
    else if (lowercaseInput.includes('gambit')) parsed.activity = 'gambit'
    else if (lowercaseInput.includes('trials')) parsed.activity = 'trials'

    // Parse element
    if (lowercaseInput.includes('solar')) parsed.element = 'solar'
    else if (lowercaseInput.includes('arc')) parsed.element = 'arc'
    else if (lowercaseInput.includes('void')) parsed.element = 'void'
    else if (lowercaseInput.includes('stasis')) parsed.element = 'stasis'
    else if (lowercaseInput.includes('strand')) parsed.element = 'strand'
    else if (lowercaseInput.includes('prismatic')) parsed.element = 'prismatic'

    // Parse playstyle
    if (lowercaseInput.includes('aggressive') || lowercaseInput.includes('offense')) parsed.playstyle = 'aggressive'
    else if (lowercaseInput.includes('defensive') || lowercaseInput.includes('tank')) parsed.playstyle = 'defensive'
    else if (lowercaseInput.includes('support')) parsed.playstyle = 'support'
    else if (lowercaseInput.includes('dps') || lowercaseInput.includes('damage')) parsed.playstyle = 'dps'
    else if (lowercaseInput.includes('speed') || lowercaseInput.includes('fast')) parsed.playstyle = 'speed'

    // Parse focus stats
    if (lowercaseInput.includes('recovery') || lowercaseInput.includes('health')) parsed.focusStats.push('recovery')
    if (lowercaseInput.includes('mobility') || lowercaseInput.includes('speed')) parsed.focusStats.push('mobility')
    if (lowercaseInput.includes('resilience') || lowercaseInput.includes('resistance')) parsed.focusStats.push('resilience')
    if (lowercaseInput.includes('discipline') || lowercaseInput.includes('grenade')) parsed.focusStats.push('discipline')
    if (lowercaseInput.includes('intellect') || lowercaseInput.includes('super')) parsed.focusStats.push('intellect')
    if (lowercaseInput.includes('strength') || lowercaseInput.includes('melee')) parsed.focusStats.push('strength')

    return parsed
  }

  calculateParseConfidence(input, parsed) {
    let confidence = 0.5 // Base confidence
    
    // Increase confidence for each successfully parsed element
    if (parsed.class !== 'any') confidence += 0.1
    if (parsed.activity !== 'general_pve') confidence += 0.1
    if (parsed.element !== 'any') confidence += 0.1
    if (parsed.playstyle !== 'balanced') confidence += 0.1
    if (parsed.focusStats.length > 0) confidence += 0.1
    if (parsed.exotic) confidence += 0.1
    
    return Math.min(confidence, 1.0)
  }

  async generateBuild(parsedRequest, options = {}) {
    if (!this.initialized) {
      throw new Error('Build Intelligence not initialized')
    }

    try {
      console.log('⚙️ Generating build with parsed request:', parsedRequest)
      
      // Generate build based on parsed requirements
      const build = await this.createOptimalBuild(parsedRequest, options)
      
      // Add alternatives if requested
      if (options.includeAlternatives) {
        build.alternatives = await this.generateAlternatives(parsedRequest, options)
      }
      
      // Add detailed analysis if requested
      if (options.detailedAnalysis) {
        build.analysis = await this.performDetailedAnalysis(build, parsedRequest)
      }
      
      // Add optimization suggestions if requested
      if (options.optimizationSuggestions) {
        build.optimizations = await this.generateOptimizations(build, parsedRequest)
      }
      
      return build
      
    } catch (error) {
      console.error('Error generating build:', error)
      return {
        error: error.message,
        parsedRequest
      }
    }
  }

  async createOptimalBuild(parsedRequest, options) {
    // Create a comprehensive build based on the parsed request
    const build = {
      metadata: {
        class: parsedRequest.class,
        element: parsedRequest.element, 
        activity: parsedRequest.activity,
        playstyle: parsedRequest.playstyle,
        focusStats: parsedRequest.focusStats
      },
      loadout: {
        subclass: this.selectOptimalSubclass(parsedRequest),
        weapons: await this.selectOptimalWeapons(parsedRequest, options),
        armor: await this.selectOptimalArmor(parsedRequest, options),
        mods: await this.selectOptimalMods(parsedRequest, options)
      },
      stats: this.calculateExpectedStats(parsedRequest),
      synergies: this.identifyBuildSynergies(parsedRequest),
      score: 0 // Will be calculated
    }

    // Calculate overall build score
    build.score = this.calculateBuildScore(build, parsedRequest)
    
    return build
  }

  selectOptimalSubclass(parsedRequest) {
    // Map elements to subclass recommendations
    const elementMap = {
      'solar': { element: 'Solar', aspects: ['Solar aspects'], fragments: ['Solar fragments'] },
      'arc': { element: 'Arc', aspects: ['Arc aspects'], fragments: ['Arc fragments'] }, 
      'void': { element: 'Void', aspects: ['Void aspects'], fragments: ['Void fragments'] },
      'stasis': { element: 'Stasis', aspects: ['Stasis aspects'], fragments: ['Stasis fragments'] },
      'strand': { element: 'Strand', aspects: ['Strand aspects'], fragments: ['Strand fragments'] },
      'prismatic': { element: 'Prismatic', aspects: ['Prismatic aspects'], fragments: ['Prismatic fragments'] }
    }
    
    return parsedRequest.element !== 'any' ? 
      elementMap[parsedRequest.element] || elementMap['solar'] :
      elementMap['solar'] // Default to solar
  }

  async selectOptimalWeapons(parsedRequest, options) {
    // Select weapons based on activity and playstyle
    const weapons = {
      primary: null,
      special: null, 
      heavy: null
    }

    // Activity-based weapon recommendations
    const activityWeapons = {
      'raid': { primary: 'Scout Rifle', special: 'Sniper Rifle', heavy: 'Linear Fusion Rifle' },
      'pvp': { primary: 'Hand Cannon', special: 'Shotgun', heavy: 'Rocket Launcher' },
      'dungeon': { primary: 'Auto Rifle', special: 'Fusion Rifle', heavy: 'Sword' },
      'nightfall': { primary: 'Pulse Rifle', special: 'Sniper Rifle', heavy: 'Machine Gun' }
    }

    const recommended = activityWeapons[parsedRequest.activity] || activityWeapons['raid']
    
    weapons.primary = { type: recommended.primary, element: parsedRequest.element }
    weapons.special = { type: recommended.special, element: parsedRequest.element }
    weapons.heavy = { type: recommended.heavy, element: parsedRequest.element }

    return weapons
  }

  async selectOptimalArmor(parsedRequest, options) {
    // Generate armor set optimized for the request
    return {
      helmet: { stats: this.getOptimalArmorStats(parsedRequest, 'helmet') },
      gauntlets: { stats: this.getOptimalArmorStats(parsedRequest, 'gauntlets') },
      chest: { stats: this.getOptimalArmorStats(parsedRequest, 'chest') },
      legs: { stats: this.getOptimalArmorStats(parsedRequest, 'legs') },
      classItem: { stats: this.getOptimalArmorStats(parsedRequest, 'classItem') }
    }
  }

  getOptimalArmorStats(parsedRequest, armorSlot) {
    // Default stat distribution based on focus stats
    const baseStats = {
      mobility: 10,
      resilience: 10, 
      recovery: 10,
      discipline: 10,
      intellect: 10,
      strength: 10
    }

    // Boost focused stats
    for (const focusStat of parsedRequest.focusStats) {
      if (baseStats[focusStat] !== undefined) {
        baseStats[focusStat] = 25 // High investment in focused stats
      }
    }

    // Activity-specific adjustments
    if (parsedRequest.activity === 'pvp') {
      baseStats.mobility = Math.max(baseStats.mobility, 20)
      baseStats.recovery = Math.max(baseStats.recovery, 20)
    } else if (parsedRequest.activity === 'raid') {
      baseStats.recovery = Math.max(baseStats.recovery, 20)
      baseStats.intellect = Math.max(baseStats.intellect, 15)
    }

    return baseStats
  }

  async selectOptimalMods(parsedRequest, options) {
    // Select mods based on build requirements
    return {
      combat: this.getCombatMods(parsedRequest),
      armor: this.getArmorMods(parsedRequest), 
      weapon: this.getWeaponMods(parsedRequest)
    }
  }

  getCombatMods(parsedRequest) {
    const activityMods = {
      'raid': ['Boss Spec', 'Major Spec', 'Taken Spec'],
      'pvp': ['Targeting Adjuster', 'Unflinching', 'Dexterity'],
      'nightfall': ['Champion mods', 'Barrier', 'Overload']
    }
    
    return activityMods[parsedRequest.activity] || activityMods['raid']
  }

  getArmorMods(parsedRequest) {
    const mods = []
    
    // Add stat mods based on focus
    for (const stat of parsedRequest.focusStats) {
      mods.push(`${stat.charAt(0).toUpperCase() + stat.slice(1)} mod`)
    }
    
    return mods.length > 0 ? mods : ['Recovery mod', 'Resilience mod']
  }

  getWeaponMods(parsedRequest) {
    return ['Backup Mag', 'Targeting Adjuster', 'Minor Spec']
  }

  calculateExpectedStats(parsedRequest) {
    const stats = {
      mobility: 50,
      resilience: 50,
      recovery: 50, 
      discipline: 50,
      intellect: 50,
      strength: 50
    }

    // Boost focused stats
    for (const focusStat of parsedRequest.focusStats) {
      if (stats[focusStat] !== undefined) {
        stats[focusStat] = 100 // Tier 10 in focused stats
      }
    }

    return stats
  }

  identifyBuildSynergies(parsedRequest) {
    const synergies = []

    // Element-based synergies
    if (parsedRequest.element === 'solar') {
      synergies.push('Solar weapon damage buffs', 'Ignition synergy', 'Radiant effects')
    } else if (parsedRequest.element === 'void') {
      synergies.push('Void 3.0 synergy', 'Volatile rounds', 'Devour effects')
    } else if (parsedRequest.element === 'arc') {
      synergies.push('Arc 3.0 synergy', 'Ionic traces', 'Jolt effects')
    }

    // Activity-specific synergies
    if (parsedRequest.activity === 'raid') {
      synergies.push('Boss damage optimization', 'Team utility', 'Survivability focus')
    } else if (parsedRequest.activity === 'pvp') {
      synergies.push('Neutral game focus', 'Quick recovery', 'Mobility optimization')
    }

    return synergies
  }

  calculateBuildScore(build, parsedRequest) {
    let score = 70 // Base score

    // Bonus for matching requested class
    if (build.metadata.class === parsedRequest.class && parsedRequest.class !== 'any') {
      score += 10
    }

    // Bonus for matching element
    if (build.metadata.element === parsedRequest.element && parsedRequest.element !== 'any') {
      score += 10
    }

    // Bonus for focused stats
    for (const focusStat of parsedRequest.focusStats) {
      if (build.stats[focusStat] >= 80) {
        score += 5
      }
    }

    return Math.min(score, 100)
  }

  async generateAlternatives(parsedRequest, options) {
    // Generate 2-3 alternative builds with different approaches
    const alternatives = []

    // Alternative 1: Different element
    const elements = ['solar', 'arc', 'void', 'stasis', 'strand']
    const altElement = elements.find(e => e !== parsedRequest.element) || 'solar'
    
    alternatives.push({
      name: `${altElement.charAt(0).toUpperCase() + altElement.slice(1)} Alternative`,
      description: `Same build concept but optimized for ${altElement} damage`,
      modifications: {
        element: altElement,
        subclass: this.selectOptimalSubclass({...parsedRequest, element: altElement})
      }
    })

    // Alternative 2: Different playstyle
    const altPlaystyle = parsedRequest.playstyle === 'aggressive' ? 'defensive' : 'aggressive'
    alternatives.push({
      name: `${altPlaystyle.charAt(0).toUpperCase() + altPlaystyle.slice(1)} Variant`,
      description: `Modified for ${altPlaystyle} gameplay`,
      modifications: {
        playstyle: altPlaystyle,
        stats: this.calculateExpectedStats({...parsedRequest, playstyle: altPlaystyle})
      }
    })

    return alternatives
  }

  async performDetailedAnalysis(build, parsedRequest) {
    return {
      strengths: this.identifyStrengths(build, parsedRequest),
      weaknesses: this.identifyWeaknesses(build, parsedRequest), 
      recommendations: this.generateRecommendations(build, parsedRequest),
      compatibility: this.assessActivityCompatibility(build, parsedRequest)
    }
  }

  identifyStrengths(build, parsedRequest) {
    const strengths = []
    
    // Check stat optimization
    for (const [stat, value] of Object.entries(build.stats)) {
      if (value >= 80 && parsedRequest.focusStats.includes(stat)) {
        strengths.push(`High ${stat} (${value}) for ${parsedRequest.activity}`)
      }
    }
    
    // Check synergies
    if (build.synergies.length > 2) {
      strengths.push('Strong elemental synergies')
    }
    
    return strengths
  }

  identifyWeaknesses(build, parsedRequest) {
    const weaknesses = []
    
    // Check for low important stats
    if (parsedRequest.activity === 'pvp' && build.stats.mobility < 50) {
      weaknesses.push('Low mobility for PvP content')
    }
    
    if (parsedRequest.activity === 'raid' && build.stats.recovery < 50) {
      weaknesses.push('Low recovery for raid survivability')
    }
    
    return weaknesses
  }

  generateRecommendations(build, parsedRequest) {
    const recommendations = []
    
    // Stat recommendations
    for (const focusStat of parsedRequest.focusStats) {
      if (build.stats[focusStat] < 80) {
        recommendations.push(`Consider adding more ${focusStat} mods to reach tier 8+`)
      }
    }
    
    // Exotic recommendations
    if (!build.loadout.exotic) {
      recommendations.push('Consider adding an exotic armor piece for additional abilities')
    }
    
    return recommendations
  }

  assessActivityCompatibility(build, parsedRequest) {
    const compatibility = {
      [parsedRequest.activity]: 'High',
      overall: 'Good'
    }
    
    // Add specific compatibility notes
    if (parsedRequest.activity === 'raid') {
      compatibility.survivability = build.stats.recovery >= 70 ? 'High' : 'Medium'
      compatibility.teamUtility = build.synergies.length >= 2 ? 'High' : 'Medium'
    }
    
    return compatibility
  }

  async generateOptimizations(build, parsedRequest) {
    return {
      statOptimizations: this.suggestStatOptimizations(build, parsedRequest),
      modOptimizations: this.suggestModOptimizations(build, parsedRequest),
      weaponOptimizations: this.suggestWeaponOptimizations(build, parsedRequest)
    }
  }

  suggestStatOptimizations(build, parsedRequest) {
    const optimizations = []
    
    // Suggest reaching stat tiers
    for (const [stat, value] of Object.entries(build.stats)) {
      const currentTier = Math.floor(value / 10)
      const nextTier = currentTier + 1
      
      if (nextTier <= 10 && parsedRequest.focusStats.includes(stat)) {
        const pointsNeeded = (nextTier * 10) - value
        optimizations.push(`${pointsNeeded} more ${stat} to reach tier ${nextTier}`)
      }
    }
    
    return optimizations
  }

  suggestModOptimizations(build, parsedRequest) {
    const optimizations = []
    
    if (parsedRequest.activity === 'raid') {
      optimizations.push('Use Boss Spec mods for encounter damage')
      optimizations.push('Consider Well mods for ability regeneration')
    }
    
    return optimizations
  }

  suggestWeaponOptimizations(build, parsedRequest) {
    const optimizations = []
    
    if (parsedRequest.activity === 'raid') {
      optimizations.push('Prioritize high-damage weapons for DPS phases')
      optimizations.push('Include at least one weapon with champion mods')
    }
    
    return optimizations
  }
}