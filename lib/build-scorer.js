// lib/build-scorer.js
// Build scoring system for evaluating generated builds

export class BuildScorer {
  constructor() {
    this.manifest = null
    this.initialized = false
    
    // Scoring weights for different factors
    this.weights = {
      statDistribution: 0.25,
      synergy: 0.20,
      exoticUtility: 0.15,
      modEffectiveness: 0.15,
      activityOptimization: 0.15,
      userPreference: 0.10
    }
    
    // Activity-specific stat priorities
    this.activityPriorities = {
      pvp: {
        mobility: 1.0,
        recovery: 0.9,
        resilience: 0.7,
        discipline: 0.6,
        intellect: 0.5,
        strength: 0.4
      },
      raid: {
        resilience: 1.0,
        recovery: 0.8,
        discipline: 0.7,
        intellect: 0.6,
        strength: 0.5,
        mobility: 0.4
      },
      dungeon: {
        resilience: 0.9,
        recovery: 0.9,
        discipline: 0.7,
        strength: 0.6,
        intellect: 0.5,
        mobility: 0.5
      },
      gambit: {
        recovery: 0.9,
        intellect: 0.8,
        resilience: 0.7,
        discipline: 0.6,
        strength: 0.5,
        mobility: 0.5
      },
      general_pve: {
        resilience: 0.8,
        recovery: 0.8,
        discipline: 0.7,
        intellect: 0.6,
        strength: 0.6,
        mobility: 0.5
      }
    }
  }

  async initialize(manifest) {
    this.manifest = manifest
    this.initialized = true
    console.log('BuildScorer initialized')
  }

  /**
   * Calculate comprehensive score for a build
   * @param {Object} build - The build to score
   * @param {Object} options - Scoring options including activity type and user preferences
   * @returns {Object} Score object with total and breakdown
   */
  async calculateScore(build, options = {}) {
    const {
      activityType = 'general_pve',
      userRequest = '',
      focusStats = []
    } = options

    const breakdown = {
      statDistribution: this.scoreStatDistribution(build, activityType),
      synergy: this.scoreSynergy(build),
      exoticUtility: this.scoreExoticUtility(build, activityType),
      modEffectiveness: this.scoreModEffectiveness(build),
      activityOptimization: this.scoreActivityOptimization(build, activityType),
      userPreference: this.scoreUserPreference(build, userRequest, focusStats)
    }

    // Calculate weighted total
    let total = 0
    for (const [category, score] of Object.entries(breakdown)) {
      total += score * this.weights[category]
    }

    return {
      total: Math.round(total),
      breakdown,
      analysis: this.generateAnalysis(build, breakdown, activityType)
    }
  }

  scoreStatDistribution(build, activityType) {
    if (!build.stats) return 50

    const priorities = this.activityPriorities[activityType] || this.activityPriorities.general_pve
    let score = 0
    let totalWeight = 0

    for (const [stat, value] of Object.entries(build.stats)) {
      const priority = priorities[stat] || 0.5
      const statScore = this.calculateStatScore(value)
      score += statScore * priority
      totalWeight += priority
    }

    return Math.round((score / totalWeight) * 100)
  }

  calculateStatScore(value) {
    // Tier-based scoring (each 10 points is a tier)
    const tier = Math.floor(value / 10)
    
    // Diminishing returns after tier 10
    if (tier >= 10) return 100
    if (tier >= 8) return 85 + (tier - 8) * 7.5
    if (tier >= 5) return 60 + (tier - 5) * 8.33
    return tier * 12
  }

  scoreSynergy(build) {
    let score = 70 // Base score
    
    // Check weapon synergy
    if (this.hasWeaponSynergy(build)) {
      score += 10
    }
    
    // Check ability synergy
    if (this.hasAbilitySynergy(build)) {
      score += 10
    }
    
    // Check exotic synergy
    if (this.hasExoticSynergy(build)) {
      score += 10
    }
    
    return Math.min(100, score)
  }

  hasWeaponSynergy(build) {
    // Check if weapons complement each other
    if (!build.kinetic || !build.energy || !build.power) return false
    
    // Example: Check for range coverage
    const hasCloseRange = this.isCloseRangeWeapon(build.kinetic) || this.isCloseRangeWeapon(build.energy)
    const hasLongRange = this.isLongRangeWeapon(build.kinetic) || this.isLongRangeWeapon(build.energy)
    
    return hasCloseRange && hasLongRange
  }

  hasAbilitySynergy(build) {
    // Check if abilities work well together
    if (!build.fragments || !build.aspects) return false
    
    // Simplified check - real implementation would analyze specific combinations
    return build.fragments.length >= 3 && build.aspects.length >= 2
  }

  hasExoticSynergy(build) {
    // Check if exotic pieces synergize with build
    const hasExoticArmor = ['helmet', 'arms', 'chest', 'legs', 'classItem'].some(
      slot => build[slot]?.tierType === 6
    )
    const hasExoticWeapon = ['kinetic', 'energy', 'power'].some(
      slot => build[slot]?.tierType === 6
    )
    
    return hasExoticArmor || hasExoticWeapon
  }

  scoreExoticUtility(build, activityType) {
    let score = 60 // Base score
    
    // Check for exotic armor
    const exoticArmor = this.findExoticArmor(build)
    if (exoticArmor) {
      score += this.getExoticValue(exoticArmor, activityType)
    }
    
    // Check for exotic weapon
    const exoticWeapon = this.findExoticWeapon(build)
    if (exoticWeapon) {
      score += this.getExoticValue(exoticWeapon, activityType)
    }
    
    return Math.min(100, score)
  }

  findExoticArmor(build) {
    const armorSlots = ['helmet', 'arms', 'chest', 'legs', 'classItem']
    for (const slot of armorSlots) {
      if (build[slot]?.tierType === 6 || build[slot]?.tier === 'Exotic') {
        return build[slot]
      }
    }
    return null
  }

  findExoticWeapon(build) {
    const weaponSlots = ['kinetic', 'energy', 'power']
    for (const slot of weaponSlots) {
      if (build[slot]?.tierType === 6 || build[slot]?.tier === 'Exotic') {
        return build[slot]
      }
    }
    return null
  }

  getExoticValue(exotic, activityType) {
    // Simplified exotic value calculation
    // Real implementation would use exotic-specific ratings
    if (activityType === 'pvp') {
      return 20 // PvP exotic value
    } else if (activityType === 'raid') {
      return 25 // Raid exotic value
    }
    return 15 // Default exotic value
  }

  scoreModEffectiveness(build) {
    if (!build.mods) return 50
    
    let score = 60 // Base score
    let modCount = 0
    
    // Count effective mods
    for (const slot of Object.keys(build.mods)) {
      const slotMods = build.mods[slot] || []
      modCount += slotMods.length
    }
    
    // More mods = better optimization
    score += Math.min(40, modCount * 5)
    
    return Math.min(100, score)
  }

  scoreActivityOptimization(build, activityType) {
    let score = 70 // Base score
    
    // Activity-specific checks
    switch (activityType) {
      case 'pvp':
        if (build.stats?.mobility >= 80) score += 10
        if (build.stats?.recovery >= 80) score += 10
        if (build.stats?.resilience >= 60) score += 10
        break
        
      case 'raid':
        if (build.stats?.resilience >= 100) score += 15
        if (build.stats?.recovery >= 70) score += 10
        if (build.stats?.discipline >= 70) score += 5
        break
        
      case 'dungeon':
        if (build.stats?.resilience >= 90) score += 10
        if (build.stats?.recovery >= 80) score += 10
        if (build.stats?.discipline >= 60) score += 10
        break
        
      default:
        // General PvE
        if (build.stats?.resilience >= 80) score += 10
        if (build.stats?.recovery >= 70) score += 10
        if (build.stats?.discipline >= 60) score += 10
    }
    
    return Math.min(100, score)
  }

  scoreUserPreference(build, userRequest, focusStats) {
    let score = 70 // Base score
    
    // Check if focus stats are high
    if (focusStats && focusStats.length > 0) {
      for (const stat of focusStats) {
        if (build.stats && build.stats[stat] >= 80) {
          score += 10
        }
      }
    }
    
    // Check if build matches user request keywords
    if (userRequest) {
      const requestLower = userRequest.toLowerCase()
      
      if (requestLower.includes('tank') && build.stats?.resilience >= 90) {
        score += 15
      }
      if (requestLower.includes('dps') && this.findExoticWeapon(build)) {
        score += 15
      }
      if (requestLower.includes('ability') && build.stats?.discipline >= 80) {
        score += 15
      }
    }
    
    return Math.min(100, score)
  }

  generateAnalysis(build, breakdown, activityType) {
    const strengths = []
    const weaknesses = []
    
    // Analyze breakdown
    for (const [category, score] of Object.entries(breakdown)) {
      if (score >= 80) {
        strengths.push(this.getCategoryDescription(category, score))
      } else if (score < 60) {
        weaknesses.push(this.getCategoryDescription(category, score))
      }
    }
    
    return {
      strengths,
      weaknesses,
      recommendation: this.generateRecommendation(build, activityType)
    }
  }

  getCategoryDescription(category, score) {
    const descriptions = {
      statDistribution: `Stat distribution (${score}/100)`,
      synergy: `Build synergy (${score}/100)`,
      exoticUtility: `Exotic effectiveness (${score}/100)`,
      modEffectiveness: `Mod optimization (${score}/100)`,
      activityOptimization: `Activity optimization (${score}/100)`,
      userPreference: `User preference match (${score}/100)`
    }
    
    return descriptions[category] || `${category} (${score}/100)`
  }

  generateRecommendation(build, activityType) {
    const recommendations = []
    
    // Check stats
    if (build.stats) {
      const priorities = this.activityPriorities[activityType] || this.activityPriorities.general_pve
      for (const [stat, priority] of Object.entries(priorities)) {
        if (priority >= 0.8 && build.stats[stat] < 70) {
          recommendations.push(`Consider increasing ${stat} for better ${activityType} performance`)
        }
      }
    }
    
    // Check exotics
    if (!this.findExoticArmor(build)) {
      recommendations.push('Add an exotic armor piece for unique benefits')
    }
    if (!this.findExoticWeapon(build)) {
      recommendations.push('Consider using an exotic weapon for increased damage')
    }
    
    return recommendations.slice(0, 3) // Return top 3 recommendations
  }

  // Helper methods
  isCloseRangeWeapon(weapon) {
    if (!weapon) return false
    const name = (weapon.name || '').toLowerCase()
    return name.includes('shotgun') || name.includes('smg') || name.includes('sidearm')
  }

  isLongRangeWeapon(weapon) {
    if (!weapon) return false
    const name = (weapon.name || '').toLowerCase()
    return name.includes('scout') || name.includes('sniper') || name.includes('pulse')
  }
}

export default BuildScorer