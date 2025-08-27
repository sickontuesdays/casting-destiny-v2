// lib/enhanced-build-scorer.js
// Enhanced build scoring system with comprehensive analysis

export class EnhancedBuildScorer {
  constructor() {
    this.initialized = false
    this.manifest = null
    this.version = '2.0.0'
    this.scoringWeights = {
      statOptimization: 25,
      synergyStrength: 25,
      activityFit: 20,
      weaponSynergy: 15,
      armorOptimization: 10,
      exoticUtilization: 5
    }
  }

  async initialize(manifestData) {
    try {
      console.log('📊 Initializing Enhanced Build Scorer...')
      
      if (!manifestData) {
        throw new Error('Manifest data is required for build scoring')
      }
      
      this.manifest = manifestData
      this.initialized = true
      console.log('✅ Enhanced Build Scorer initialized successfully')
      return true
      
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Build Scorer:', error)
      this.initialized = false
      throw error
    }
  }

  isInitialized() {
    return this.initialized
  }

  async scoreBuild(build, requirements = {}, options = {}) {
    if (!this.initialized) {
      throw new Error('Enhanced Build Scorer not initialized')
    }

    try {
      console.log('📈 Scoring build with enhanced analysis...')
      
      const scores = {
        statOptimization: this.scoreStatOptimization(build, requirements),
        synergyStrength: this.scoreSynergyStrength(build),
        activityFit: this.scoreActivityFit(build, requirements),
        weaponSynergy: this.scoreWeaponSynergy(build, requirements),
        armorOptimization: this.scoreArmorOptimization(build, requirements),
        exoticUtilization: this.scoreExoticUtilization(build)
      }

      // Calculate weighted total score
      const totalScore = this.calculateWeightedScore(scores)

      const analysis = {
        overallScore: totalScore,
        categoryScores: scores,
        strengths: this.identifyStrengths(scores),
        weaknesses: this.identifyWeaknesses(scores),
        improvements: this.suggestImprovements(scores, build, requirements),
        tier: this.determineScoreTier(totalScore)
      }

      console.log(`✅ Build scored: ${totalScore}/100 (${analysis.tier} tier)`)
      return analysis
      
    } catch (error) {
      console.error('❌ Build scoring failed:', error)
      return {
        overallScore: 50,
        error: error.message
      }
    }
  }

  scoreStatOptimization(build, requirements) {
    const stats = build.stats || {}
    const focusStats = Array.isArray(requirements.focusStats) ? requirements.focusStats : []
    
    if (focusStats.length === 0) return 70 // Default score for no specific focus

    let totalScore = 0
    let weightedTotal = 0

    // Score each focus stat
    focusStats.forEach(statName => {
      const value = stats[statName] || 0
      const tier = Math.floor(value / 10)
      const efficiency = value % 10 === 0 ? 100 : ((10 - (value % 10)) / 10) * 100
      
      // Score based on tier achieved (target: tier 10 = 100 points)
      const tierScore = Math.min((tier / 10) * 100, 100)
      
      // Bonus for efficiency (no wasted stats)
      const efficiencyBonus = efficiency > 80 ? 10 : 0
      
      const statScore = Math.min(tierScore + efficiencyBonus, 100)
      totalScore += statScore
      weightedTotal += 1
    })

    return weightedTotal > 0 ? Math.round(totalScore / weightedTotal) : 70
  }

  scoreSynergyStrength(build) {
    const synergies = build.synergies || []
    
    if (synergies.length === 0) return 40 // Low score for no synergies

    const strengthValues = { high: 25, medium: 15, low: 8 }
    let totalStrength = 0

    synergies.forEach(synergy => {
      totalStrength += strengthValues[synergy.strength] || 5
    })

    // Cap at reasonable maximum (4 high-strength synergies = 100)
    return Math.min(totalStrength, 100)
  }

  scoreActivityFit(build, requirements) {
    const activity = requirements.activity || 'general_pve'
    const stats = build.stats || {}
    
    const activityRequirements = {
      raid: { recovery: 70, discipline: 60 },
      pvp: { mobility: 60, resilience: 60 },
      dungeon: { recovery: 70, strength: 50 },
      nightfall: { resilience: 80, recovery: 60 }
    }

    const required = activityRequirements[activity]
    if (!required) return 75 // Default for general PvE

    let score = 50 // Base score
    let metRequirements = 0
    let totalRequirements = Object.keys(required).length

    Object.entries(required).forEach(([stat, threshold]) => {
      const value = stats[stat] || 0
      if (value >= threshold) {
        metRequirements++
        score += 25 // Bonus for meeting requirement
      } else {
        // Partial credit for getting close
        const percentage = value / threshold
        score += Math.round(percentage * 15)
      }
    })

    return Math.min(score, 100)
  }

  scoreWeaponSynergy(build, requirements) {
    const weapons = build.loadout?.weapons || {}
    const activity = requirements.activity || 'general_pve'
    
    // Activity-specific weapon synergies
    const activityWeaponFit = {
      raid: { 'Linear Fusion Rifle': 25, 'Scout Rifle': 20, 'Auto Rifle': 15 },
      pvp: { 'Hand Cannon': 25, 'Shotgun': 20, 'Pulse Rifle': 15 },
      dungeon: { 'Sword': 25, 'Fusion Rifle': 20, 'Auto Rifle': 15 },
      nightfall: { 'Machine Gun': 25, 'Sniper Rifle': 20, 'Pulse Rifle': 15 }
    }

    const activityFit = activityWeaponFit[activity] || {}
    let score = 50 // Base score

    Object.values(weapons).forEach(weapon => {
      if (weapon && weapon.type) {
        score += activityFit[weapon.type] || 5 // Small bonus for any weapon
      }
    })

    return Math.min(score, 100)
  }

  scoreArmorOptimization(build, requirements) {
    const armor = build.loadout?.armor || {}
    const focusStats = Array.isArray(requirements.focusStats) ? requirements.focusStats : []
    
    let score = 60 // Base score
    
    // Check if exotic armor aligns with build focus
    const exoticPieces = Object.values(armor).filter(piece => 
      piece && piece.isExotic
    )

    if (exoticPieces.length === 1) {
      score += 15 // Good - exactly one exotic
    } else if (exoticPieces.length === 0) {
      score -= 10 // Missing exotic potential
    } else {
      score -= 20 // Multiple exotics (impossible)
    }

    // Check stat distribution across armor pieces
    if (focusStats.length > 0) {
      const hasGoodDistribution = this.checkStatDistribution(armor, focusStats)
      score += hasGoodDistribution ? 20 : -5
    }

    return Math.max(Math.min(score, 100), 0)
  }

  scoreExoticUtilization(build) {
    const armor = build.loadout?.armor || {}
    const weapons = build.loadout?.weapons || {}
    
    // Check for exotic usage
    const exoticArmor = Object.values(armor).find(piece => piece && piece.isExotic)
    const exoticWeapons = Object.values(weapons).filter(weapon => weapon && weapon.isExotic)

    if (exoticArmor && exoticWeapons.length === 0) return 85 // Good exotic armor usage
    if (!exoticArmor && exoticWeapons.length === 1) return 80 // Good exotic weapon usage
    if (exoticArmor && exoticWeapons.length === 1) return 95 // Excellent - both exotic slots used
    if (!exoticArmor && exoticWeapons.length === 0) return 40 // No exotics used
    
    return 30 // Multiple exotics (problematic)
  }

  calculateWeightedScore(scores) {
    let totalScore = 0
    let totalWeight = 0

    Object.entries(this.scoringWeights).forEach(([category, weight]) => {
      const score = scores[category] || 0
      totalScore += score * weight
      totalWeight += weight
    })

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50
  }

  identifyStrengths(scores) {
    const strengths = []
    
    Object.entries(scores).forEach(([category, score]) => {
      if (score >= 80) {
        strengths.push({
          category: this.formatCategoryName(category),
          score,
          level: 'excellent'
        })
      } else if (score >= 70) {
        strengths.push({
          category: this.formatCategoryName(category),
          score,
          level: 'good'
        })
      }
    })

    return strengths
  }

  identifyWeaknesses(scores) {
    const weaknesses = []
    
    Object.entries(scores).forEach(([category, score]) => {
      if (score < 50) {
        weaknesses.push({
          category: this.formatCategoryName(category),
          score,
          severity: score < 30 ? 'critical' : 'moderate'
        })
      }
    })

    return weaknesses
  }

  suggestImprovements(scores, build, requirements) {
    const improvements = []
    
    // Stat optimization improvements
    if (scores.statOptimization < 70) {
      improvements.push({
        type: 'stats',
        priority: 'high',
        suggestion: 'Focus on reaching tier 10 in your priority stats',
        details: 'Consider masterworking armor and using stat mods'
      })
    }

    // Synergy improvements
    if (scores.synergyStrength < 60) {
      improvements.push({
        type: 'synergy',
        priority: 'medium',
        suggestion: 'Look for exotic armor that enhances your playstyle',
        details: 'Choose weapons and abilities that work together'
      })
    }

    // Activity fit improvements
    if (scores.activityFit < 65) {
      improvements.push({
        type: 'activity',
        priority: 'medium', 
        suggestion: `Optimize stats for ${requirements.activity || 'your target activity'}`,
        details: 'Focus on stats that matter most for your chosen activity'
      })
    }

    return improvements
  }

  determineScoreTier(score) {
    if (score >= 90) return 'S'
    if (score >= 80) return 'A'
    if (score >= 70) return 'B'
    if (score >= 60) return 'C'
    if (score >= 50) return 'D'
    return 'F'
  }

  formatCategoryName(category) {
    return category
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }

  checkStatDistribution(armor, focusStats) {
    // Check if armor pieces have good stat distribution for focus stats
    // This is a simplified check - real implementation would analyze actual armor stats
    const armorPieces = Object.values(armor).filter(Boolean)
    return armorPieces.length >= 4 // Basic check: has most armor slots filled
  }
}