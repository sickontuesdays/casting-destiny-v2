// lib/destiny-intelligence/enhanced-build-intelligence.js
// Enhanced Build Intelligence System - Fixed focusStats iteration bug

class EnhancedBuildIntelligence {
  constructor(manifestProcessor, synergyEngine, scorer) {
    this.manifestProcessor = manifestProcessor
    this.synergyEngine = synergyEngine
    this.scorer = scorer
  }

  async generateBuild(request, options = {}) {
    try {
      // Parse the natural language request
      const parsedRequest = this.parseNaturalLanguageInput(request)
      
      // Create safe request object with proper array initialization
      const safeRequest = {
        ...parsedRequest,
        focusStats: Array.isArray(parsedRequest.focusStats) ? parsedRequest.focusStats : [],
        tags: Array.isArray(parsedRequest.tags) ? parsedRequest.tags : []
      }
      
      // Generate the optimal build
      const build = await this.createOptimalBuild(safeRequest, options)
      
      // Add detailed analysis if requested
      if (options.detailedAnalysis) {
        build.analysis = await this.performDetailedAnalysis(build, safeRequest)
      }
      
      // Add optimization suggestions if requested
      if (options.optimizationSuggestions) {
        build.optimizations = await this.generateOptimizations(build, safeRequest)
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

  parseNaturalLanguageInput(request) {
    const parsed = {
      class: 'any',
      element: 'any',
      activity: 'general_pve',
      playstyle: 'balanced',
      focusStats: [], // Always initialize as array
      tags: [],
      weapons: [],
      exotic: null,
      priority: 'effectiveness'
    }

    const requestLower = request.toLowerCase()

    // Parse class
    if (requestLower.includes('titan')) parsed.class = 'titan'
    else if (requestLower.includes('hunter')) parsed.class = 'hunter' 
    else if (requestLower.includes('warlock')) parsed.class = 'warlock'

    // Parse element
    if (requestLower.includes('solar')) parsed.element = 'solar'
    else if (requestLower.includes('arc')) parsed.element = 'arc'
    else if (requestLower.includes('void')) parsed.element = 'void'
    else if (requestLower.includes('stasis')) parsed.element = 'stasis'
    else if (requestLower.includes('strand')) parsed.element = 'strand'
    else if (requestLower.includes('prismatic')) parsed.element = 'prismatic'

    // Parse activity
    if (requestLower.includes('raid')) parsed.activity = 'raid'
    else if (requestLower.includes('pvp') || requestLower.includes('crucible')) parsed.activity = 'pvp'
    else if (requestLower.includes('dungeon')) parsed.activity = 'dungeon'
    else if (requestLower.includes('nightfall')) parsed.activity = 'nightfall'
    else if (requestLower.includes('gambit')) parsed.activity = 'gambit'
    else if (requestLower.includes('trials')) parsed.activity = 'trials'

    // Parse playstyle
    if (requestLower.includes('aggressive') || requestLower.includes('dps')) parsed.playstyle = 'aggressive'
    else if (requestLower.includes('tank') || requestLower.includes('survivability')) parsed.playstyle = 'defensive'
    else if (requestLower.includes('support') || requestLower.includes('healer')) parsed.playstyle = 'support'
    else if (requestLower.includes('ability') || requestLower.includes('spam')) parsed.playstyle = 'ability_focused'

    // Parse focus stats (always ensure it's an array)
    const statKeywords = {
      'mobility': ['mobility', 'speed', 'movement'],
      'resilience': ['resilience', 'tank', 'health'],
      'recovery': ['recovery', 'healing', 'survivability'],
      'discipline': ['discipline', 'grenade'],
      'intellect': ['intellect', 'super'],
      'strength': ['strength', 'melee']
    }

    for (const [stat, keywords] of Object.entries(statKeywords)) {
      if (keywords.some(keyword => requestLower.includes(keyword))) {
        parsed.focusStats.push(stat)
      }
    }

    // Default focus stats if none specified
    if (parsed.focusStats.length === 0) {
      if (parsed.activity === 'pvp') {
        parsed.focusStats.push('mobility', 'recovery')
      } else {
        parsed.focusStats.push('recovery', 'discipline')
      }
    }

    return parsed
  }

  async createOptimalBuild(parsedRequest, options) {
    // Create a comprehensive build based on the parsed request
    const build = {
      metadata: {
        class: parsedRequest.class,
        element: parsedRequest.element, 
        activity: parsedRequest.activity,
        playstyle: parsedRequest.playstyle,
        focusStats: parsedRequest.focusStats || []
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

    // Ensure focusStats is an array before iteration
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
    
    // Ensure focusStats is an array before iteration
    const focusStats = Array.isArray(parsedRequest.focusStats) ? parsedRequest.focusStats : []
    
    // Add stat mods based on focus
    for (const stat of focusStats) {
      mods.push(`${stat.charAt(0).toUpperCase() + stat.slice(1)} mod`)
    }
    
    return mods.length > 0 ? mods : ['Recovery mod', 'Discipline mod']
  }

  getWeaponMods(parsedRequest) {
    const mods = []
    
    if (parsedRequest.activity === 'pvp') {
      mods.push('Targeting Adjuster', 'Unflinching Aim')
    } else {
      mods.push('Boss Spec', 'Major Spec')
    }
    
    return mods
  }

  calculateExpectedStats(parsedRequest) {
    // Calculate expected total stats for the build
    const stats = {
      mobility: 50,
      resilience: 50,
      recovery: 50,
      discipline: 50,
      intellect: 50,
      strength: 50
    }

    // Ensure focusStats is an array before iteration
    const focusStats = Array.isArray(parsedRequest.focusStats) ? parsedRequest.focusStats : []

    // Boost focus stats
    for (const stat of focusStats) {
      if (stats[stat] !== undefined) {
        stats[stat] = 100 // T10 in focused stats
      }
    }

    return stats
  }

  identifyBuildSynergies(parsedRequest) {
    const synergies = []

    // Ensure focusStats is an array before checking length
    const focusStats = Array.isArray(parsedRequest.focusStats) ? parsedRequest.focusStats : []

    if (focusStats.includes('discipline') && parsedRequest.playstyle === 'ability_focused') {
      synergies.push('High discipline enables frequent grenade usage')
    }

    if (parsedRequest.element === 'solar' && focusStats.includes('recovery')) {
      synergies.push('Solar abilities can boost recovery effectiveness')
    }

    if (parsedRequest.activity === 'pvp' && focusStats.includes('mobility')) {
      synergies.push('High mobility improves strafe speed and jump height in PvP')
    }

    return synergies
  }

  calculateBuildScore(build, parsedRequest) {
    let score = 50 // Base score

    // Score based on focus stat alignment
    const focusStats = Array.isArray(parsedRequest.focusStats) ? parsedRequest.focusStats : []
    for (const stat of focusStats) {
      if (build.stats[stat] >= 100) {
        score += 15
      } else if (build.stats[stat] >= 80) {
        score += 10
      }
    }

    // Activity-specific bonuses
    if (parsedRequest.activity === 'pvp') {
      if (build.stats.mobility >= 80) score += 10
      if (build.stats.recovery >= 80) score += 10
    } else {
      if (build.stats.recovery >= 80) score += 8
      if (build.stats.intellect >= 70) score += 5
    }

    // Synergy bonuses
    score += build.synergies.length * 5

    return Math.min(score, 100) // Cap at 100
  }

  async performDetailedAnalysis(build, parsedRequest) {
    return {
      strengths: this.identifyBuildStrengths(build, parsedRequest),
      weaknesses: this.identifyBuildWeaknesses(build, parsedRequest),
      recommendations: this.generateRecommendations(build, parsedRequest)
    }
  }

  identifyBuildStrengths(build, parsedRequest) {
    const strengths = []
    
    const focusStats = Array.isArray(parsedRequest.focusStats) ? parsedRequest.focusStats : []
    
    for (const stat of focusStats) {
      if (build.stats[stat] >= 100) {
        strengths.push(`Excellent ${stat} optimization`)
      }
    }

    if (build.synergies.length > 3) {
      strengths.push('Strong build synergies')
    }

    return strengths
  }

  identifyBuildWeaknesses(build, parsedRequest) {
    const weaknesses = []

    // Check for neglected important stats
    if (build.stats.recovery < 50 && parsedRequest.activity !== 'pvp') {
      weaknesses.push('Low recovery may impact survivability')
    }

    if (build.stats.resilience < 50 && parsedRequest.activity === 'pvp') {
      weaknesses.push('Low resilience reduces damage resistance in PvP')
    }

    return weaknesses
  }

  generateRecommendations(build, parsedRequest) {
    const recommendations = []

    const focusStats = Array.isArray(parsedRequest.focusStats) ? parsedRequest.focusStats : []
    
    for (const stat of focusStats) {
      if (build.stats[stat] < 80) {
        recommendations.push(`Consider higher ${stat} investment`)
      }
    }

    if (build.synergies.length < 2) {
      recommendations.push('Look for equipment with better synergy')
    }

    return recommendations
  }

  async generateOptimizations(build, parsedRequest) {
    return {
      statOptimizations: this.suggestStatOptimizations(build, parsedRequest),
      equipmentAlternatives: this.suggestEquipmentAlternatives(build, parsedRequest),
      modOptimizations: this.suggestModOptimizations(build, parsedRequest)
    }
  }

  suggestStatOptimizations(build, parsedRequest) {
    const suggestions = []
    
    const focusStats = Array.isArray(parsedRequest.focusStats) ? parsedRequest.focusStats : []
    
    for (const stat of focusStats) {
      const currentTier = Math.floor(build.stats[stat] / 10)
      if (currentTier < 10) {
        const pointsNeeded = (currentTier + 1) * 10 - build.stats[stat]
        suggestions.push({
          stat,
          currentTier,
          pointsNeeded,
          recommendation: `Add ${pointsNeeded} ${stat} to reach T${currentTier + 1}`
        })
      }
    }
    
    return suggestions
  }

  suggestEquipmentAlternatives(build, parsedRequest) {
    return {
      weapons: ['Alternative weapon suggestions would go here'],
      armor: ['Alternative armor suggestions would go here'],
      exotic: ['Alternative exotic suggestions would go here']
    }
  }

  suggestModOptimizations(build, parsedRequest) {
    return {
      combat: ['Optimized combat mod suggestions'],
      armor: ['Optimized armor mod suggestions'],
      weapon: ['Optimized weapon mod suggestions']
    }
  }
}

module.exports = EnhancedBuildIntelligence