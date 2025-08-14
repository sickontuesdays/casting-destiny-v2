export class EnhancedBuildScorer {
  constructor() {
    this.initialized = false
    this.manifest = null
    this.weights = {
      statOptimization: 0.35,
      synergyStrength: 0.25,
      activitySuitability: 0.20,
      exoticUtilization: 0.15,
      modEfficiency: 0.05
    }
    this.activityModifiers = {
      raid: { health: 1.3, super: 1.2, weapons: 1.1 },
      pvp: { weapons: 1.4, class: 1.3, health: 1.2 },
      dungeon: { health: 1.4, super: 1.1, grenade: 1.1 },
      nightfall: { health: 1.3, super: 1.2, weapons: 1.1 },
      general_pve: { super: 1.1, grenade: 1.1, melee: 1.1 }
    }
  }

  async initialize(manifestData) {
    try {
      this.manifest = manifestData
      this.initialized = true
      console.log('✅ Enhanced Build Scorer initialized')
      return true
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Build Scorer:', error)
      return false
    }
  }

  isInitialized() {
    return this.initialized
  }

  scoreBuild(build, options = {}) {
    if (!this.initialized) {
      console.warn('Build scorer not initialized')
      return { overall: 0, breakdown: {} }
    }

    const {
      activityType = 'general_pve',
      playstyle = 'balanced',
      userPreferences = {}
    } = options

    try {
      const scores = {
        statOptimization: this.scoreStatOptimization(build, activityType),
        synergyStrength: this.scoreSynergyStrength(build),
        activitySuitability: this.scoreActivitySuitability(build, activityType),
        exoticUtilization: this.scoreExoticUtilization(build),
        modEfficiency: this.scoreModEfficiency(build)
      }

      // Apply user preference modifiers
      const adjustedScores = this.applyUserPreferences(scores, userPreferences)

      // Calculate weighted overall score
      const overall = Object.entries(adjustedScores).reduce((total, [category, score]) => {
        return total + (score * this.weights[category])
      }, 0)

      return {
        overall: Math.round(overall),
        breakdown: adjustedScores,
        details: this.generateScoreDetails(build, adjustedScores)
      }

    } catch (error) {
      console.error('Error scoring build:', error)
      return { overall: 0, breakdown: {}, error: error.message }
    }
  }

  scoreStatOptimization(build, activityType) {
    const stats = build.stats?.totalStats || {}
    const modifiers = this.activityModifiers[activityType] || {}
    
    let optimizationScore = 0
    let totalWeight = 0

    const statNames = ['weapons', 'health', 'class', 'super', 'grenade', 'melee']
    
    statNames.forEach(statName => {
      const value = stats[statName] || 0
      const modifier = modifiers[statName] || 1.0
      const weight = modifier
      
      // Score based on tier efficiency and breakpoints
      const tier = Math.floor(value / 20)
      const wastedPoints = value % 20
      const breakpointScore = value >= 100 ? 20 : 0 // Bonus for secondary effects
      
      // Efficiency score (higher tiers are better, but wastage is penalized)
      const efficiency = (tier * 15) + breakpointScore - (wastedPoints * 0.5)
      const normalizedScore = Math.min(efficiency / 100, 1) * 100
      
      optimizationScore += normalizedScore * weight
      totalWeight += weight
    })

    return totalWeight > 0 ? optimizationScore / totalWeight : 0
  }

  scoreSynergyStrength(build) {
    if (!build.synergies || build.synergies.length === 0) {
      return 30 // Base score for no obvious conflicts
    }

    let synergyScore = 0
    let totalSynergies = build.synergies.length

    build.synergies.forEach(synergy => {
      switch (synergy.strength) {
        case 'powerful':
          synergyScore += 100
          break
        case 'strong':
          synergyScore += 80
          break
        case 'moderate':
          synergyScore += 60
          break
        case 'weak':
          synergyScore += 40
          break
        default:
          synergyScore += 50
      }
    })

    // Average synergy strength, with bonus for multiple synergies
    const averageStrength = synergyScore / totalSynergies
    const multiplicityBonus = Math.min(totalSynergies * 5, 20)
    
    return Math.min(averageStrength + multiplicityBonus, 100)
  }

  scoreActivitySuitability(build, activityType) {
    const suitabilityRules = {
      raid: {
        minHealthTier: 6,
        preferredStats: ['health', 'super'],
        exoticTypes: ['damage', 'survivability']
      },
      pvp: {
        minWeaponsTier: 8,
        preferredStats: ['weapons', 'class', 'health'],
        exoticTypes: ['mobility', 'damage']
      },
      dungeon: {
        minHealthTier: 7,
        preferredStats: ['health', 'super'],
        exoticTypes: ['survivability', 'damage']
      },
      nightfall: {
        minHealthTier: 6,
        preferredStats: ['health', 'weapons'],
        exoticTypes: ['survivability', 'utility']
      },
      general_pve: {
        minHealthTier: 4,
        preferredStats: ['super', 'grenade'],
        exoticTypes: ['damage', 'utility']
      }
    }

    const rules = suitabilityRules[activityType] || suitabilityRules.general_pve
    const stats = build.stats?.totalStats || {}
    
    let suitabilityScore = 50 // Base score

    // Check minimum stat requirements
    if (rules.minHealthTier) {
      const healthTier = Math.floor((stats.health || 0) / 20)
      if (healthTier >= rules.minHealthTier) {
        suitabilityScore += 20
      } else {
        suitabilityScore -= (rules.minHealthTier - healthTier) * 5
      }
    }

    if (rules.minWeaponsTier) {
      const weaponsTier = Math.floor((stats.weapons || 0) / 20)
      if (weaponsTier >= rules.minWeaponsTier) {
        suitabilityScore += 20
      } else {
        suitabilityScore -= (rules.minWeaponsTier - weaponsTier) * 5
      }
    }

    // Bonus for preferred stats being high
    rules.preferredStats.forEach(stat => {
      const tier = Math.floor((stats[stat] || 0) / 20)
      if (tier >= 8) suitabilityScore += 10
      else if (tier >= 6) suitabilityScore += 5
    })

    return Math.max(0, Math.min(suitabilityScore, 100))
  }

  scoreExoticUtilization(build) {
    let exoticScore = 0

    // Check for exotic armor
    const exoticArmor = this.findExoticArmor(build)
    if (exoticArmor) {
      exoticScore += 40
      
      // Bonus for synergy with build focus
      if (this.exoticSynergizesWithBuild(exoticArmor, build)) {
        exoticScore += 30
      }
    }

    // Check for exotic weapons
    const exoticWeapons = this.findExoticWeapons(build)
    if (exoticWeapons.length > 0) {
      exoticScore += 20 * exoticWeapons.length
    }

    // Penalty for conflicting exotics
    if (this.hasConflictingExotics(build)) {
      exoticScore -= 20
    }

    return Math.min(exoticScore, 100)
  }

  scoreModEfficiency(build) {
    if (!build.mods || build.mods.length === 0) {
      return 50 // Neutral score for no mods
    }

    let modScore = 60 // Base score for having mods
    
    // Check for redundant mods
    const modTypes = {}
    build.mods.forEach(mod => {
      const type = this.getModType(mod)
      modTypes[type] = (modTypes[type] || 0) + 1
    })

    // Penalty for too many of the same type
    Object.values(modTypes).forEach(count => {
      if (count > 2) {
        modScore -= (count - 2) * 10
      }
    })

    // Bonus for mod diversity
    const diversity = Object.keys(modTypes).length
    modScore += diversity * 5

    return Math.max(0, Math.min(modScore, 100))
  }

  applyUserPreferences(scores, preferences) {
    const adjustedScores = { ...scores }
    
    // Apply preference multipliers
    if (preferences.prioritizeStats) {
      adjustedScores.statOptimization *= 1.2
    }
    
    if (preferences.prioritizeSynergy) {
      adjustedScores.synergyStrength *= 1.3
    }
    
    if (preferences.prioritizeActivity) {
      adjustedScores.activitySuitability *= 1.2
    }

    return adjustedScores
  }

  generateScoreDetails(build, scores) {
    const details = []
    
    // Stat optimization details
    if (scores.statOptimization >= 80) {
      details.push('Excellent stat distribution for your activity')
    } else if (scores.statOptimization >= 60) {
      details.push('Good stat optimization with room for improvement')
    } else {
      details.push('Stats could be better optimized for this activity')
    }

    // Synergy details
    if (scores.synergyStrength >= 80) {
      details.push('Strong synergies detected between equipment')
    } else if (scores.synergyStrength >= 60) {
      details.push('Moderate synergies present')
    } else {
      details.push('Limited synergies - consider more complementary gear')
    }

    return details
  }

  findExoticArmor(build) {
    const armorSlots = ['helmet', 'arms', 'chest', 'legs', 'class']
    return armorSlots.find(slot => 
      build[slot] && build[slot].tier === 'Exotic'
    )
  }

  findExoticWeapons(build) {
    const weaponSlots = ['kinetic', 'energy', 'power']
    return weaponSlots.filter(slot => 
      build[slot] && build[slot].tier === 'Exotic'
    )
  }

  exoticSynergizesWithBuild(exotic, build) {
    // This would check if the exotic's perks align with the build's focus
    // For now, return a simple heuristic
    return Math.random() > 0.5
  }

  hasConflictingExotics(build) {
    // Check for exotic conflicts (multiple exotic armor pieces, etc.)
    const exoticArmor = this.findExoticArmor(build)
    return Array.isArray(exoticArmor) && exoticArmor.length > 1
  }

  getModType(mod) {
    // Categorize mods by type
    if (typeof mod === 'string') {
      if (mod.includes('Stat')) return 'stat'
      if (mod.includes('Resist')) return 'resistance'
      if (mod.includes('Loader')) return 'weapon'
      return 'utility'
    }
    return 'unknown'
  }

  // Public utility methods
  getWeights() {
    return { ...this.weights }
  }

  setWeights(newWeights) {
    this.weights = { ...this.weights, ...newWeights }
  }

  getActivityModifiers() {
    return { ...this.activityModifiers }
  }
}