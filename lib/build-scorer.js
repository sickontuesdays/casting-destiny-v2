// lib/build-scorer.js
// Fixed build scoring system with proper imports

import { EnhancedBuildScorer } from './enhanced-build-scorer'
import { StatCalculator } from './destiny-intelligence/stat-calculator'

export class BuildScorer {
  constructor() {
    this.manifest = null
    this.initialized = false
    this.enhancedScorer = new EnhancedBuildScorer()
    this.statCalculator = new StatCalculator()
    
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
    try {
      console.log('📊 Initializing Build Scorer...')
      
      this.manifest = manifest
      
      // Initialize sub-components
      await this.enhancedScorer.initialize(manifest)
      await this.statCalculator.initialize(manifest)
      
      this.initialized = true
      console.log('✅ Build Scorer initialized successfully')
      return true
      
    } catch (error) {
      console.error('❌ Build Scorer initialization failed:', error)
      this.initialized = false
      throw error
    }
  }

  /**
   * Calculate comprehensive score for a build
   * @param {Object} build - The build to score
   * @param {Object} options - Scoring options including activity type and user preferences
   * @returns {Object} Score object with total and breakdown
   */
  async calculateScore(build, options = {}) {
    if (!this.initialized) {
      throw new Error('BuildScorer not initialized')
    }

    const {
      activityType = 'general_pve',
      userRequest = '',
      focusStats = []
    } = options

    try {
      // Use enhanced scorer for detailed analysis
      const enhancedAnalysis = await this.enhancedScorer.scoreBuild(build, {
        activity: activityType,
        focusStats,
        userRequest
      })

      // Calculate legacy breakdown for compatibility
      const breakdown = {
        statDistribution: this.scoreStatDistribution(build, activityType),
        synergy: this.scoreSynergy(build),
        exoticUtility: this.scoreExoticUtility(build, activityType),
        modEffectiveness: this.scoreModEffectiveness(build),
        activityOptimization: this.scoreActivityOptimization(build, activityType),
        userPreference: this.scoreUserPreference(build, userRequest, focusStats)
      }

      // Calculate weighted total
      const total = this.calculateWeightedTotal(breakdown)

      return {
        total,
        breakdown,
        enhancedAnalysis,
        tier: this.getTier(total),
        recommendations: this.generateRecommendations(breakdown, build, options)
      }

    } catch (error) {
      console.error('Error calculating build score:', error)
      return {
        total: 50,
        error: error.message,
        tier: 'unknown'
      }
    }
  }

  scoreStatDistribution(build, activityType) {
    const stats = build.stats || {}
    const priorities = this.activityPriorities[activityType] || this.activityPriorities.general_pve
    
    let score = 0
    let totalWeight = 0

    Object.entries(priorities).forEach(([stat, weight]) => {
      const statValue = stats[stat] || 0
      const tier = Math.floor(statValue / 10)
      
      // Score based on tier achieved (0-10 tiers)
      const statScore = (tier / 10) * 100
      
      score += statScore * weight
      totalWeight += weight
    })

    return totalWeight > 0 ? Math.round(score / totalWeight) : 50
  }

  scoreSynergy(build) {
    const synergies = build.synergies || []
    
    if (!Array.isArray(synergies) || synergies.length === 0) {
      return 30 // Low score for no synergies
    }

    let score = 40 // Base score for having synergies
    
    synergies.forEach(synergy => {
      switch(synergy.strength) {
        case 'legendary': score += 20; break
        case 'high': score += 12; break  
        case 'medium': score += 7; break
        case 'low': score += 3; break
        default: score += 1; break
      }
    })

    return Math.min(score, 100)
  }

  scoreExoticUtility(build, activityType) {
    const armor = build.loadout?.armor || {}
    const weapons = build.loadout?.weapons || {}
    
    const exoticArmor = Object.values(armor).find(piece => piece && piece.isExotic)
    const exoticWeapons = Object.values(weapons).filter(weapon => weapon && weapon.isExotic)
    
    let score = 40 // Base score

    // Score exotic usage
    if (exoticArmor) score += 25
    if (exoticWeapons.length === 1) score += 20
    if (exoticWeapons.length > 1) score -= 30 // Penalty for impossible loadout

    // Activity-specific exotic bonuses
    if (activityType === 'raid' && exoticArmor) score += 10
    if (activityType === 'pvp' && exoticWeapons.length > 0) score += 10

    return Math.max(0, Math.min(100, score))
  }

  scoreModEffectiveness(build) {
    const mods = build.loadout?.mods || {}
    let score = 50 // Base score

    // Count mod types
    let modCount = 0
    Object.values(mods).forEach(modArray => {
      if (Array.isArray(modArray)) {
        modCount += modArray.length
      }
    })

    // Score based on mod usage
    if (modCount >= 8) score += 20      // Well-modded build
    else if (modCount >= 5) score += 10 // Decent mod usage
    else if (modCount >= 2) score += 5  // Basic mod usage
    else score -= 10                    // Under-modded

    return Math.max(0, Math.min(100, score))
  }

  scoreActivityOptimization(build, activityType) {
    const weapons = build.loadout?.weapons || {}
    const stats = build.stats || {}
    
    let score = 50 // Base score

    // Activity-specific weapon scoring
    const activityWeaponBonus = {
      raid: {
        'Linear Fusion Rifle': 15,
        'Scout Rifle': 10,
        'Sniper Rifle': 10
      },
      pvp: {
        'Hand Cannon': 15,
        'Shotgun': 10,
        'Pulse Rifle': 10
      },
      dungeon: {
        'Sword': 15,
        'Fusion Rifle': 10,
        'Auto Rifle': 8
      }
    }

    const bonuses = activityWeaponBonus[activityType] || {}
    Object.values(weapons).forEach(weapon => {
      if (weapon && weapon.type) {
        score += bonuses[weapon.type] || 2
      }
    })

    // Activity-specific stat scoring using priorities
    const priorities = this.activityPriorities[activityType] || {}
    Object.entries(priorities).forEach(([stat, priority]) => {
      const statValue = stats[stat] || 0
      const tier = Math.floor(statValue / 10)
      score += (tier / 10) * priority * 15 // Scale by priority
    })

    return Math.max(0, Math.min(100, score))
  }

  scoreUserPreference(build, userRequest, focusStats) {
    let score = 60 // Base score
    
    // Score based on how well build matches focus stats
    if (Array.isArray(focusStats) && focusStats.length > 0) {
      const stats = build.stats || {}
      let matchedStats = 0
      
      focusStats.forEach(stat => {
        const value = stats[stat] || 0
        const tier = Math.floor(value / 10)
        
        if (tier >= 8) matchedStats++
        else if (tier >= 6) matchedStats += 0.7
        else if (tier >= 4) matchedStats += 0.4
      })
      
      const matchPercentage = focusStats.length > 0 ? matchedStats / focusStats.length : 0
      score += matchPercentage * 30 // Up to 30 bonus points
    }

    return Math.max(0, Math.min(100, score))
  }

  calculateWeightedTotal(breakdown) {
    let total = 0
    let totalWeight = 0

    Object.entries(this.weights).forEach(([category, weight]) => {
      const score = breakdown[category] || 0
      total += score * weight
      totalWeight += weight
    })

    return totalWeight > 0 ? Math.round(total / totalWeight) : 50
  }

  getTier(score) {
    if (score >= 90) return 'S'
    if (score >= 80) return 'A'
    if (score >= 70) return 'B' 
    if (score >= 60) return 'C'
    if (score >= 50) return 'D'
    return 'F'
  }

  generateRecommendations(breakdown, build, options) {
    const recommendations = []
    
    // Find lowest scoring categories
    const sortedCategories = Object.entries(breakdown)
      .sort(([,a], [,b]) => a - b)
    
    const lowest = sortedCategories[0]
    if (lowest && lowest[1] < 60) {
      switch(lowest[0]) {
        case 'statDistribution':
          recommendations.push('Focus on optimizing stat tiers for your priority stats')
          break
        case 'synergy':
          recommendations.push('Look for armor and weapons that work well together')
          break
        case 'exoticUtility':
          recommendations.push('Consider using an exotic that enhances your playstyle')
          break
        case 'activityOptimization':
          recommendations.push(`Optimize your loadout for ${options.activityType || 'your target activity'}`)
          break
      }
    }

    return recommendations
  }

  isInitialized() {
    return this.initialized
  }
}