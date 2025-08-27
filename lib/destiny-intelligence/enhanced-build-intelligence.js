// lib/destiny-intelligence/enhanced-build-intelligence.js
// Fixed version - resolves "focusStats is not iterable" error

class EnhancedBuildIntelligence {
  constructor(manifestData) {
    this.manifest = manifestData
    this.initialized = false
    this.version = '2.0.0'
    this.cache = new Map()
  }

  async initialize() {
    if (!this.manifest) {
      throw new Error('Manifest data is required for initialization')
    }
    
    console.log('🧠 Initializing Enhanced Build Intelligence...')
    
    this.initialized = true
    console.log('✅ Enhanced Build Intelligence initialized')
  }

  isInitialized() {
    return this.initialized
  }

  parseNaturalLanguageInput(input) {
    const lowercaseInput = input.toLowerCase()
    
    const parsed = {
      class: 'any',
      element: 'any',
      activity: 'general_pve',
      playstyle: 'balanced',
      focusStats: [], // Always initialize as array
      exotic: null,
      weapons: [],
      keywords: lowercaseInput.split(' ')
    }

    // Parse class
    if (lowercaseInput.includes('titan')) parsed.class = 'titan'
    else if (lowercaseInput.includes('hunter')) parsed.class = 'hunter'
    else if (lowercaseInput.includes('warlock')) parsed.class = 'warlock'

    // Parse element
    if (lowercaseInput.includes('solar')) parsed.element = 'solar'
    else if (lowercaseInput.includes('arc')) parsed.element = 'arc'
    else if (lowercaseInput.includes('void')) parsed.element = 'void'
    else if (lowercaseInput.includes('stasis')) parsed.element = 'stasis'
    else if (lowercaseInput.includes('strand')) parsed.element = 'strand'

    // Parse activity
    if (lowercaseInput.includes('raid')) parsed.activity = 'raid'
    else if (lowercaseInput.includes('pvp') || lowercaseInput.includes('crucible')) parsed.activity = 'pvp'
    else if (lowercaseInput.includes('dungeon')) parsed.activity = 'dungeon'
    else if (lowercaseInput.includes('nightfall') || lowercaseInput.includes('gm')) parsed.activity = 'nightfall'

    // Parse playstyle
    if (lowercaseInput.includes('tank') || lowercaseInput.includes('survival')) parsed.playstyle = 'tank'
    else if (lowercaseInput.includes('dps') || lowercaseInput.includes('damage')) parsed.playstyle = 'dps'
    else if (lowercaseInput.includes('speed') || lowercaseInput.includes('fast')) parsed.playstyle = 'speed'

    // Parse focus stats - ALWAYS ensure array
    if (lowercaseInput.includes('recovery') || lowercaseInput.includes('health')) parsed.focusStats.push('recovery')
    if (lowercaseInput.includes('mobility') || lowercaseInput.includes('speed')) parsed.focusStats.push('mobility')
    if (lowercaseInput.includes('resilience') || lowercaseInput.includes('resistance')) parsed.focusStats.push('resilience')
    if (lowercaseInput.includes('discipline') || lowercaseInput.includes('grenade')) parsed.focusStats.push('discipline')
    if (lowercaseInput.includes('intellect') || lowercaseInput.includes('super')) parsed.focusStats.push('intellect')
    if (lowercaseInput.includes('strength') || lowercaseInput.includes('melee')) parsed.focusStats.push('strength')

    console.log('📝 Parsed request:', parsed)
    return parsed
  }

  async generateBuild(parsedRequest, options = {}) {
    if (!this.initialized) {
      throw new Error('Enhanced Build Intelligence not initialized')
    }

    // Ensure parsedRequest has proper structure
    const safeRequest = {
      class: parsedRequest.class || 'any',
      element: parsedRequest.element || 'any',
      activity: parsedRequest.activity || 'general_pve',
      playstyle: parsedRequest.playstyle || 'balanced',
      focusStats: Array.isArray(parsedRequest.focusStats) ? parsedRequest.focusStats : [], // SAFETY CHECK
      exotic: parsedRequest.exotic || null,
      weapons: Array.isArray(parsedRequest.weapons) ? parsedRequest.weapons : [],
      keywords: Array.isArray(parsedRequest.keywords) ? parsedRequest.keywords : []
    }

    try {
      console.log('⚙️ Generating enhanced build with request:', safeRequest)
      
      const build = await this.createOptimalBuild(safeRequest, options)
      
      if (options.includeAlternatives) {
        build.alternatives = await this.generateAlternatives(safeRequest, options)
      }
      
      if (options.detailedAnalysis) {
        build.analysis = await this.performDetailedAnalysis(build, safeRequest)
      }
      
      return build
      
    } catch (error) {
      console.error('Error generating enhanced build:', error)
      return {
        error: error.message,
        parsedRequest: safeRequest
      }
    }
  }

  async createOptimalBuild(parsedRequest, options) {
    const build = {
      metadata: {
        class: parsedRequest.class,
        element: parsedRequest.element, 
        activity: parsedRequest.activity,
        playstyle: parsedRequest.playstyle,
        focusStats: parsedRequest.focusStats, // Already verified as array
        generatedAt: new Date().toISOString()
      },
      loadout: {
        subclass: this.selectOptimalSubclass(parsedRequest),
        weapons: await this.selectOptimalWeapons(parsedRequest, options),
        armor: await this.selectOptimalArmor(parsedRequest, options),
        mods: await this.selectOptimalMods(parsedRequest, options)
      },
      stats: this.calculateExpectedStats(parsedRequest),
      synergies: this.identifyBuildSynergies(parsedRequest),
      score: 0
    }

    build.score = this.calculateBuildScore(build, parsedRequest)
    return build
  }

  selectOptimalSubclass(parsedRequest) {
    const elementMap = {
      'solar': { element: 'Solar', aspects: ['Touch of Flame', 'Heat Rises'], fragments: ['Ember of Torches', 'Ember of Singeing'] },
      'arc': { element: 'Arc', aspects: ['Spark of Shock', 'Lightning Surge'], fragments: ['Spark of Ions', 'Spark of Magnitude'] }, 
      'void': { element: 'Void', aspects: ['Echo of Starvation', 'Chaos Accelerant'], fragments: ['Echo of Instability', 'Echo of Undermining'] },
      'stasis': { element: 'Stasis', aspects: ['Whisper of Chains', 'Whisper of Shards'], fragments: ['Whisper of Conduction', 'Whisper of Fractures'] },
      'strand': { element: 'Strand', aspects: ['Threaded Specter', 'Ensnaring Slam'], fragments: ['Thread of Ascent', 'Thread of Fury'] }
    }
    
    return parsedRequest.element !== 'any' ? 
      elementMap[parsedRequest.element] || elementMap['solar'] :
      elementMap['solar']
  }

  async selectOptimalWeapons(parsedRequest, options) {
    const weapons = { primary: null, special: null, heavy: null }

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
    return {
      helmet: { stats: this.getOptimalArmorStats(parsedRequest, 'helmet') },
      gauntlets: { stats: this.getOptimalArmorStats(parsedRequest, 'gauntlets') },
      chest: { stats: this.getOptimalArmorStats(parsedRequest, 'chest') },
      legs: { stats: this.getOptimalArmorStats(parsedRequest, 'legs') },
      classItem: { stats: this.getOptimalArmorStats(parsedRequest, 'classItem') }
    }
  }

  getOptimalArmorStats(parsedRequest, armorSlot) {
    const baseStats = {
      mobility: 10,
      resilience: 10, 
      recovery: 10,
      discipline: 10,
      intellect: 10,
      strength: 10
    }

    // FIXED: Ensure focusStats is always an array before iteration
    const focusStats = Array.isArray(parsedRequest.focusStats) ? parsedRequest.focusStats : []
    
    // Boost focused stats
    for (const focusStat of focusStats) {
      if (baseStats[focusStat] !== undefined) {
        baseStats[focusStat] = 25 // High investment in focused stats
      }
    }

    // Activity-specific adjustments
    if (parsedRequest.activity === 'pvp') {
      baseStats.mobility = Math.max(baseStats.mobility, 20)
      baseStats.resilience = Math.max(baseStats.resilience, 20)
    } else if (parsedRequest.activity === 'raid') {
      baseStats.recovery = Math.max(baseStats.recovery, 20)
      baseStats.discipline = Math.max(baseStats.discipline, 15)
    }

    return baseStats
  }

  async selectOptimalMods(parsedRequest, options) {
    const mods = {
      helmet: [],
      gauntlets: [],
      chest: [],
      legs: [],
      classItem: [],
      combatMods: []
    }

    // FIXED: Safe iteration over focusStats
    const focusStats = Array.isArray(parsedRequest.focusStats) ? parsedRequest.focusStats : []
    
    // Add stat-boosting mods based on focus
    focusStats.forEach(stat => {
      switch(stat) {
        case 'mobility':
          mods.legs.push('Mobility Mod')
          break
        case 'resilience':
          mods.chest.push('Resilience Mod')
          break
        case 'recovery':
          mods.helmet.push('Recovery Mod')
          break
        case 'discipline':
          mods.gauntlets.push('Discipline Mod')
          break
        case 'intellect':
          mods.helmet.push('Intellect Mod')
          break
        case 'strength':
          mods.gauntlets.push('Strength Mod')
          break
      }
    })

    return mods
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

    // FIXED: Safe iteration over focusStats
    const focusStats = Array.isArray(parsedRequest.focusStats) ? parsedRequest.focusStats : []
    
    // Boost expected stats based on focus
    focusStats.forEach(stat => {
      if (stats[stat] !== undefined) {
        stats[stat] = Math.min(stats[stat] + 30, 100)
      }
    })

    return stats
  }

  identifyBuildSynergies(parsedRequest) {
    const synergies = []

    // FIXED: Safe access to focusStats
    const focusStats = Array.isArray(parsedRequest.focusStats) ? parsedRequest.focusStats : []

    // Stat synergies
    if (focusStats.includes('discipline') && focusStats.includes('strength')) {
      synergies.push({
        type: 'stat',
        name: 'Ability Loop',
        description: 'High discipline and strength create powerful ability cycling'
      })
    }

    if (focusStats.includes('recovery') && parsedRequest.activity === 'raid') {
      synergies.push({
        type: 'activity',
        name: 'Raid Survivability',
        description: 'High recovery provides excellent sustain for raid encounters'
      })
    }

    return synergies
  }

  calculateBuildScore(build, parsedRequest) {
    let score = 70 // Base score

    // FIXED: Safe access to focusStats
    const focusStats = Array.isArray(parsedRequest.focusStats) ? parsedRequest.focusStats : []

    // Score based on stat focus alignment
    if (build.stats && focusStats.length > 0) {
      const focusAlignment = focusStats.every(stat => 
        build.stats[stat] && build.stats[stat] >= 70
      )
      if (focusAlignment) score += 15
    }

    // Activity alignment
    if (build.metadata.activity === parsedRequest.activity) score += 10

    // Element alignment
    if (build.metadata.element === parsedRequest.element) score += 5

    // Synergy bonus
    if (build.synergies && build.synergies.length > 0) {
      score += Math.min(build.synergies.length * 3, 15)
    }

    return Math.min(score, 100)
  }

  async generateAlternatives(parsedRequest, options, count = 3) {
    const alternatives = []
    
    for (let i = 0; i < count; i++) {
      // Create variation by adjusting focus stats
      const altRequest = { ...parsedRequest }
      
      // FIXED: Safe array operations
      if (Array.isArray(parsedRequest.focusStats) && parsedRequest.focusStats.length > 0) {
        // Shuffle focus stats for variation
        altRequest.focusStats = [...parsedRequest.focusStats].reverse()
      }
      
      const altBuild = await this.createOptimalBuild(altRequest, options)
      alternatives.push(altBuild)
    }
    
    return alternatives
  }

  async performDetailedAnalysis(build, parsedRequest) {
    return {
      statEfficiency: this.analyzeStatEfficiency(build.stats),
      synergySummary: this.analyzeSynergies(build.synergies),
      activityFit: this.analyzeActivityFit(build, parsedRequest),
      optimizationTips: this.generateOptimizationTips(build, parsedRequest)
    }
  }

  analyzeStatEfficiency(stats) {
    if (!stats) return { overall: 'unknown', details: {} }
    
    const efficiency = {}
    let totalEfficiency = 0
    let statCount = 0

    Object.entries(stats).forEach(([statName, value]) => {
      const tier = Math.floor(value / 10)
      const waste = value % 10
      const eff = waste === 0 ? 100 : ((10 - waste) / 10 * 100)
      
      efficiency[statName] = {
        tier,
        waste,
        efficiency: Math.round(eff)
      }
      
      totalEfficiency += eff
      statCount++
    })

    return {
      overall: statCount > 0 ? Math.round(totalEfficiency / statCount) : 0,
      details: efficiency
    }
  }

  analyzeSynergies(synergies) {
    if (!Array.isArray(synergies)) return { count: 0, strength: 'none' }
    
    return {
      count: synergies.length,
      strength: synergies.length >= 3 ? 'high' : synergies.length >= 1 ? 'medium' : 'none',
      types: synergies.map(s => s.type).filter((t, i, arr) => arr.indexOf(t) === i)
    }
  }

  analyzeActivityFit(build, parsedRequest) {
    const activityRequirements = {
      'raid': ['recovery', 'discipline'],
      'pvp': ['mobility', 'resilience'],
      'dungeon': ['recovery', 'strength'],
      'nightfall': ['resilience', 'recovery']
    }

    const required = activityRequirements[parsedRequest.activity] || []
    const focusStats = Array.isArray(parsedRequest.focusStats) ? parsedRequest.focusStats : []
    
    const alignment = required.filter(stat => focusStats.includes(stat)).length
    const maxAlignment = required.length
    
    return {
      score: maxAlignment > 0 ? Math.round((alignment / maxAlignment) * 100) : 75,
      recommendation: alignment === maxAlignment ? 'perfect' : alignment > 0 ? 'good' : 'suboptimal'
    }
  }

  generateOptimizationTips(build, parsedRequest) {
    const tips = []

    // FIXED: Safe access to focusStats
    const focusStats = Array.isArray(parsedRequest.focusStats) ? parsedRequest.focusStats : []

    if (focusStats.length === 0) {
      tips.push('Consider specifying focus stats for more targeted optimization')
    }

    if (parsedRequest.activity === 'general_pve') {
      tips.push('Specify an activity type for more optimized recommendations')
    }

    if (!parsedRequest.exotic) {
      tips.push('Consider locking an exotic armor piece for enhanced synergies')
    }

    return tips
  }
}

export default EnhancedBuildIntelligence