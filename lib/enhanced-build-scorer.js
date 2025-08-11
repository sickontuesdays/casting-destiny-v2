class EnhancedBuildScorer {
  constructor() {
    this.manifestData = null
    this.initialized = false
    this.scoreWeights = {
      synergy: 0.3,
      exotic: 0.25,
      stats: 0.2,
      mods: 0.15,
      viability: 0.1
    }
  }

  async initialize(manifestData) {
    try {
      console.log('Initializing Enhanced Build Scorer...')
      this.manifestData = manifestData
      this.initialized = true
      console.log('Enhanced Build Scorer initialized successfully')
      return true
    } catch (error) {
      console.error('Error initializing Enhanced Build Scorer:', error)
      return false
    }
  }

  isInitialized() {
    return this.initialized
  }

  scoreBuild(build) {
    if (!this.initialized) {
      console.warn('Enhanced Build Scorer not initialized')
      return 0
    }

    try {
      let totalScore = 0
      
      // Synergy score
      const synergyScore = this.calculateSynergyScore(build)
      totalScore += synergyScore * this.scoreWeights.synergy

      // Exotic score
      const exoticScore = this.calculateExoticScore(build)
      totalScore += exoticScore * this.scoreWeights.exotic

      // Stats score
      const statsScore = this.calculateStatsScore(build)
      totalScore += statsScore * this.scoreWeights.stats

      // Mods score
      const modsScore = this.calculateModsScore(build)
      totalScore += modsScore * this.scoreWeights.mods

      // Viability score
      const viabilityScore = this.calculateViabilityScore(build)
      totalScore += viabilityScore * this.scoreWeights.viability

      return Math.round(totalScore)
    } catch (error) {
      console.error('Error scoring build:', error)
      return 0
    }
  }

  calculateSynergyScore(build) {
    // Check for synergies between exotic and other items
    let score = 50 // Base score

    if (build.exotic) {
      // Check for matching element types
      const exoticElement = this.getItemElement(build.exotic)
      if (exoticElement) {
        // Bonus for matching subclass element
        if (build.subclass && this.getSubclassElement(build.subclass) === exoticElement) {
          score += 20
        }
        
        // Bonus for matching weapon elements
        if (build.weapons) {
          build.weapons.forEach(weapon => {
            if (this.getItemElement(weapon) === exoticElement) {
              score += 10
            }
          })
        }
      }

      // Check for exotic-specific synergies
      const exoticSynergies = this.getExoticSynergies(build.exotic)
      if (exoticSynergies && build.mods) {
        exoticSynergies.forEach(synergyMod => {
          if (build.mods.includes(synergyMod)) {
            score += 15
          }
        })
      }
    }

    return Math.min(score, 100)
  }

  calculateExoticScore(build) {
    if (!build.exotic) return 30 // No exotic equipped

    const exotic = this.manifestData?.armor?.find(item => item.hash === build.exotic.hash)
    if (!exotic) return 30

    let score = 60 // Base exotic score

    // Popular exotics get higher scores
    const popularExotics = [
      'Orpheus Rig', 'Celestial Nighthawk', 'Gjallarhorn', 
      'Osteo Striga', 'Witherhoard', 'Anarchy'
    ]
    
    if (popularExotics.some(name => exotic.displayProperties?.name?.includes(name))) {
      score += 20
    }

    // Class-specific bonuses
    if (this.isClassAppropriate(exotic, build.characterClass)) {
      score += 10
    }

    return Math.min(score, 100)
  }

  calculateStatsScore(build) {
    if (!build.stats) return 50

    let score = 0
    const statTargets = {
      mobility: 60,
      resilience: 100,
      recovery: 80,
      discipline: 60,
      intellect: 60,
      strength: 60
    }

    for (const [stat, target] of Object.entries(statTargets)) {
      const actualValue = build.stats[stat] || 0
      if (actualValue >= target) {
        score += 15
      } else if (actualValue >= target * 0.8) {
        score += 10
      } else if (actualValue >= target * 0.6) {
        score += 5
      }
    }

    return Math.min(score, 100)
  }

  calculateModsScore(build) {
    if (!build.mods || build.mods.length === 0) return 30

    let score = 40 // Base for having mods

    // Bonus for having full mod slots
    if (build.mods.length >= 10) {
      score += 20
    } else if (build.mods.length >= 7) {
      score += 15
    } else if (build.mods.length >= 5) {
      score += 10
    }

    // Bonus for having high-tier mods
    const highTierMods = ['Taking Charge', 'Protective Light', 'Charged with Light']
    const hasHighTierMods = build.mods.some(mod => 
      highTierMods.some(tierMod => mod.name?.includes(tierMod))
    )
    
    if (hasHighTierMods) {
      score += 15
    }

    return Math.min(score, 100)
  }

  calculateViabilityScore(build) {
    // Check if build is viable for different activities
    let score = 50

    // PvE viability
    if (this.isPvEViable(build)) {
      score += 20
    }

    // PvP viability
    if (this.isPvPViable(build)) {
      score += 15
    }

    // Raid viability
    if (this.isRaidViable(build)) {
      score += 15
    }

    return Math.min(score, 100)
  }

  getItemElement(item) {
    if (!item || !this.manifestData) return null
    
    // Look up element type from manifest
    const manifestItem = this.manifestData.weapons?.find(w => w.hash === item.hash) ||
                         this.manifestData.armor?.find(a => a.hash === item.hash)
    
    return manifestItem?.damageType || null
  }

  getSubclassElement(subclass) {
    if (!subclass) return null
    
    const elementMap = {
      'arc': 'Arc',
      'solar': 'Solar', 
      'void': 'Void',
      'stasis': 'Stasis',
      'strand': 'Strand'
    }
    
    for (const [key, value] of Object.entries(elementMap)) {
      if (subclass.toLowerCase().includes(key)) {
        return value
      }
    }
    
    return null
  }

  getExoticSynergies(exotic) {
    // Return mods that synergize with specific exotics
    const synergyMap = {
      'Orpheus Rig': ['Grenade Kickstart', 'Ashes to Assets'],
      'Celestial Nighthawk': ['Precision Charge', 'High-Energy Fire'],
      'Osteo Striga': ['Volatile Flow', 'Echo of Instability']
    }
    
    const exoticName = exotic.displayProperties?.name || exotic.name
    return synergyMap[exoticName] || []
  }

  isClassAppropriate(exotic, characterClass) {
    if (!exotic || !characterClass) return true
    
    const classMap = {
      'Hunter': ['hunter', 'nightstalker', 'gunslinger', 'arcstrider'],
      'Titan': ['titan', 'sentinel', 'sunbreaker', 'striker'],
      'Warlock': ['warlock', 'dawnblade', 'voidwalker', 'stormcaller']
    }
    
    const appropriateTerms = classMap[characterClass] || []
    const exoticClass = exotic.classType || exotic.itemCategoryHashes?.[0]
    
    return appropriateTerms.some(term => 
      exotic.displayProperties?.description?.toLowerCase().includes(term)
    )
  }

  isPvEViable(build) {
    // Check for PvE viability factors
    if (!build) return false
    
    // High resilience for survivability
    if (build.stats?.resilience >= 80) return true
    
    // Good exotic for PvE
    const pveExotics = ['Orpheus Rig', 'Celestial Nighthawk', 'Osteo Striga']
    if (build.exotic && pveExotics.some(name => 
      build.exotic.displayProperties?.name?.includes(name))) {
      return true
    }
    
    return false
  }

  isPvPViable(build) {
    // Check for PvP viability factors
    if (!build) return false
    
    // High mobility or recovery for PvP
    if (build.stats?.mobility >= 80 || build.stats?.recovery >= 80) return true
    
    // PvP-focused exotic
    const pvpExotics = ['Stomp-EE5', 'Transversive Steps', 'Dunemarchers']
    if (build.exotic && pvpExotics.some(name => 
      build.exotic.displayProperties?.name?.includes(name))) {
      return true
    }
    
    return false
  }

  isRaidViable(build) {
    // Check for raid viability factors
    if (!build) return false
    
    // Balanced stats for raids
    const stats = build.stats || {}
    const balancedStats = Object.values(stats).filter(val => val >= 60).length >= 3
    
    return balancedStats
  }

  getScoreBreakdown(build) {
    if (!this.initialized) {
      return {
        total: 0,
        breakdown: {},
        message: 'Scorer not initialized'
      }
    }

    const breakdown = {
      synergy: this.calculateSynergyScore(build),
      exotic: this.calculateExoticScore(build),
      stats: this.calculateStatsScore(build),
      mods: this.calculateModsScore(build),
      viability: this.calculateViabilityScore(build)
    }

    const total = Object.entries(breakdown).reduce((sum, [key, score]) => {
      return sum + (score * this.scoreWeights[key])
    }, 0)

    return {
      total: Math.round(total),
      breakdown,
      weights: this.scoreWeights
    }
  }
}

export default EnhancedBuildScorer