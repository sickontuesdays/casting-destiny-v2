// lib/destiny-intelligence/armor-archetype-manager.js
// Manages Armor 3.0 archetypes, tiers, and intelligent armor selection

import { StatCalculator } from './stat-calculator.js'

export class ArmorArchetypeManager {
  constructor() {
    this.statCalculator = new StatCalculator()
    
    // Armor 3.0 archetypes with their stat priorities from Edge of Fate
    this.archetypes = {
      bulwark: {
        name: 'Bulwark',
        description: 'Defensive focused with health and class ability emphasis',
        primary: 'health',
        secondary: 'class',
        primaryWeight: 0.4,
        secondaryWeight: 0.3,
        playstyles: ['tank', 'survivability', 'defensive'],
        activities: ['grandmaster', 'master_dungeon', 'solo_content'],
        synergies: ['defensive_mods', 'healing_builds', 'overshield_builds']
      },
      
      gunner: {
        name: 'Gunner',
        description: 'Weapon-focused with damage and grenade synergy',
        primary: 'weapons',
        secondary: 'grenade',
        primaryWeight: 0.4,
        secondaryWeight: 0.3,
        playstyles: ['dps', 'weapon_master', 'precision'],
        activities: ['raid', 'dungeon', 'nightfall'],
        synergies: ['weapon_damage_mods', 'precision_builds', 'reload_builds']
      },
      
      specialist: {
        name: 'Specialist',
        description: 'Class ability focused with weapon support',
        primary: 'class',
        secondary: 'weapons',
        primaryWeight: 0.4,
        secondaryWeight: 0.3,
        playstyles: ['utility', 'support', 'class_mastery'],
        activities: ['raid', 'trials', 'dungeon'],
        synergies: ['class_ability_mods', 'utility_builds', 'support_builds']
      },
      
      paragon: {
        name: 'Paragon',
        description: 'Super and melee ability focused',
        primary: 'super',
        secondary: 'melee',
        primaryWeight: 0.4,
        secondaryWeight: 0.3,
        playstyles: ['ability_spam', 'super_focused', 'melee_builds'],
        activities: ['general_pve', 'gambit', 'strikes'],
        synergies: ['ability_mods', 'super_builds', 'melee_builds']
      },
      
      brawler: {
        name: 'Brawler',
        description: 'Melee focused with health synergy',
        primary: 'melee',
        secondary: 'health',
        primaryWeight: 0.4,
        secondaryWeight: 0.3,
        playstyles: ['melee_focused', 'close_combat', 'aggressive'],
        activities: ['general_pve', 'gambit', 'patrol'],
        synergies: ['melee_mods', 'close_combat_builds', 'aggressive_builds']
      },
      
      grenadier: {
        name: 'Grenadier',
        description: 'Grenade focused with super synergy',
        primary: 'grenade',
        secondary: 'super',
        primaryWeight: 0.4,
        secondaryWeight: 0.3,
        playstyles: ['grenade_spam', 'ability_focused', 'add_clear'],
        activities: ['general_pve', 'strikes', 'patrol'],
        synergies: ['grenade_mods', 'ability_builds', 'elemental_builds']
      }
    }

    // Armor tier system with stat ranges and features
    this.armorTiers = {
      1: { 
        range: [48, 53], 
        name: 'Tier 1',
        quality: 'basic',
        sources: ['world_drops', 'basic_activities'],
        features: []
      },
      2: { 
        range: [53, 58], 
        name: 'Tier 2',
        quality: 'improved',
        sources: ['playlist_activities', 'vendors'],
        features: []
      },
      3: { 
        range: [59, 64], 
        name: 'Tier 3',
        quality: 'good',
        sources: ['nightfall', 'dungeon', 'raid'],
        features: []
      },
      4: { 
        range: [65, 72], 
        name: 'Tier 4',
        quality: 'excellent',
        sources: ['master_content', 'trials'],
        features: []
      },
      5: { 
        range: [73, 75], 
        name: 'Tier 5',
        quality: 'perfect',
        sources: ['grandmaster', 'master_raid', 'flawless_trials'],
        features: ['stat_tuning', 'extra_energy', 'bonus_socket']
      }
    }

    // Stat distribution templates for different build types
    this.statDistributionTemplates = {
      dps_focused: {
        weapons: 180,
        super: 150,
        grenade: 100,
        health: 70,
        class: 70,
        melee: 70,
        priority: ['weapons', 'super', 'grenade']
      },
      
      survivability_focused: {
        health: 180,
        class: 150,
        weapons: 100,
        grenade: 70,
        super: 70,
        melee: 70,
        priority: ['health', 'class', 'weapons']
      },
      
      ability_spam: {
        grenade: 200,
        melee: 150,
        class: 100,
        super: 80,
        weapons: 70,
        health: 70,
        priority: ['grenade', 'melee', 'class']
      },
      
      pvp_optimized: {
        weapons: 200,
        health: 100,
        class: 70,
        grenade: 70,
        super: 70,
        melee: 70,
        priority: ['weapons', 'health', 'class']
      },
      
      balanced: {
        weapons: 120,
        health: 120,
        class: 120,
        grenade: 100,
        super: 100,
        melee: 100,
        priority: ['weapons', 'health', 'class']
      }
    }

    // Archetype synergy combinations
    this.archetypeSynergies = {
      defensive_utility: {
        archetypes: ['bulwark', 'specialist'],
        description: 'Defensive survivability with utility support',
        synergy_bonus: 0.2,
        recommended_stats: { health: 150, class: 150 }
      },
      
      weapon_ability: {
        archetypes: ['gunner', 'grenadier'],
        description: 'Weapon damage with ability spam support',
        synergy_bonus: 0.25,
        recommended_stats: { weapons: 150, grenade: 150 }
      },
      
      super_melee: {
        archetypes: ['paragon', 'brawler'],
        description: 'Super and melee ability focus',
        synergy_bonus: 0.2,
        recommended_stats: { super: 150, melee: 150 }
      }
    }
  }

  /**
   * Recommend optimal archetype for a build goal
   * @param {Object} buildGoal - Build goal parameters
   * @param {Object} constraints - Build constraints
   * @returns {Object} Archetype recommendation with alternatives
   */
  recommendArchetype(buildGoal, constraints = {}) {
    const scores = new Map()
    
    Object.entries(this.archetypes).forEach(([archetypeName, archetype]) => {
      const score = this.scoreArchetypeForBuild(archetype, buildGoal, constraints)
      scores.set(archetypeName, score)
    })
    
    // Sort by total score
    const sortedArchetypes = Array.from(scores.entries())
      .sort(([,a], [,b]) => b.totalScore - a.totalScore)
      .map(([name, scoreData]) => ({
        archetype: name,
        ...this.archetypes[name],
        score: scoreData
      }))
    
    return {
      recommended: sortedArchetypes[0],
      alternatives: sortedArchetypes.slice(1, 3),
      reasoning: this.generateArchetypeReasoning(sortedArchetypes[0], buildGoal)
    }
  }

  /**
   * Score an archetype for a specific build goal
   * @param {Object} archetype - Archetype data
   * @param {Object} buildGoal - Build goal parameters
   * @param {Object} constraints - Build constraints
   * @returns {Object} Detailed scoring breakdown
   */
  scoreArchetypeForBuild(archetype, buildGoal, constraints) {
    const scoring = {
      totalScore: 0,
      breakdown: {
        statAlignment: 0,
        playstyleMatch: 0,
        activityMatch: 0,
        constraintBonus: 0
      },
      confidence: 0
    }

    // Score stat alignment
    if (buildGoal.priorityStats) {
      const primaryStatScore = (buildGoal.priorityStats[archetype.primary] || 0) / 200 * 40
      const secondaryStatScore = (buildGoal.priorityStats[archetype.secondary] || 0) / 200 * 25
      
      scoring.breakdown.statAlignment = primaryStatScore + secondaryStatScore
    }

    // Score playstyle match
    if (buildGoal.playstyles) {
      const playstyleMatches = buildGoal.playstyles.filter(p => 
        archetype.playstyles.includes(p)
      ).length
      
      scoring.breakdown.playstyleMatch = (playstyleMatches / Math.max(1, buildGoal.playstyles.length)) * 20
    }

    // Score activity match
    if (buildGoal.activities) {
      const activityMatches = buildGoal.activities.filter(a => 
        archetype.activities.includes(a)
      ).length
      
      scoring.breakdown.activityMatch = (activityMatches / Math.max(1, buildGoal.activities.length)) * 15
    }

    // Apply constraint bonuses
    if (constraints.preferredArchetypes?.includes(archetype.name.toLowerCase())) {
      scoring.breakdown.constraintBonus = 10
    }

    // Calculate total score
    scoring.totalScore = Object.values(scoring.breakdown).reduce((sum, val) => sum + val, 0)
    
    // Calculate confidence
    scoring.confidence = this.calculateArchetypeConfidence(archetype, buildGoal, scoring.totalScore)

    return scoring
  }

  /**
   * Calculate optimal stat distribution for armor pieces
   * @param {Array} armorPieces - Array of armor pieces
   * @param {Object} targetDistribution - Target stat distribution
   * @returns {Object} Optimization analysis
   */
  optimizeStatDistribution(armorPieces, targetDistribution) {
    const currentStats = this.calculateCurrentStats(armorPieces)
    
    const optimization = {
      current: currentStats,
      target: targetDistribution,
      gaps: {},
      surplus: {},
      efficiency: 0,
      recommendations: []
    }

    // Calculate gaps and surplus
    Object.entries(targetDistribution).forEach(([stat, targetValue]) => {
      const currentValue = currentStats[stat] || 0
      const difference = targetValue - currentValue

      if (difference > 0) {
        optimization.gaps[stat] = difference
      } else if (difference < 0) {
        optimization.surplus[stat] = Math.abs(difference)
      }
    })

    // Calculate efficiency
    optimization.efficiency = this.calculateStatEfficiency(currentStats, targetDistribution)

    // Generate recommendations
    optimization.recommendations = this.generateStatOptimizationRecommendations(
      optimization.gaps,
      optimization.surplus,
      armorPieces
    )

    return optimization
  }

  /**
   * Generate armor set recommendations for a build
   * @param {Object} buildRequirements - Build requirements
   * @param {Object} availableArmor - Available armor pieces by slot
   * @param {Object} constraints - Build constraints
   * @returns {Object} Complete armor set recommendations
   */
  generateArmorSetRecommendations(buildRequirements, availableArmor = {}, constraints = {}) {
    const recommendations = {
      archetype: null,
      armorPieces: {},
      setBonuses: [],
      totalStats: {},
      optimization: {},
      alternatives: []
    }

    // Determine optimal archetype
    const archetypeRecommendation = this.recommendArchetype(buildRequirements, constraints)
    recommendations.archetype = archetypeRecommendation.recommended

    // Find best armor pieces for each slot
    const slots = ['helmet', 'arms', 'chest', 'legs', 'classItem']
    
    slots.forEach(slot => {
      const slotArmor = availableArmor[slot] || {}
      const bestPiece = this.findBestArmorForSlot(
        slotArmor,
        slot,
        buildRequirements,
        recommendations.archetype,
        constraints
      )
      
      if (bestPiece) {
        recommendations.armorPieces[slot] = bestPiece
      }
    })

    // Calculate total stats
    const armorArray = Object.values(recommendations.armorPieces).filter(Boolean)
    recommendations.totalStats = this.calculateTotalBuildStats(armorArray)

    // Analyze set bonuses
    recommendations.setBonuses = this.analyzeSetBonuses(armorArray, buildRequirements)

    // Optimize the build
    recommendations.optimization = this.optimizeStatDistribution(
      armorArray,
      buildRequirements.priorityStats || {}
    )

    return recommendations
  }

  /**
   * Calculate archetype synergy bonuses
   * @param {Array} armorPieces - Array of armor pieces with archetypes
   * @returns {Object} Synergy analysis
   */
  calculateArchetypeSynergies(armorPieces) {
    const archetypeCounts = new Map()
    const synergies = []

    // Count archetypes
    armorPieces.forEach(piece => {
      const archetype = piece.archetype || 'unknown'
      archetypeCounts.set(archetype, (archetypeCounts.get(archetype) || 0) + 1)
    })

    // Check for synergy combinations
    Object.entries(this.archetypeSynergies).forEach(([synergyName, synergyData]) => {
      const hasAllRequired = synergyData.archetypes.every(arch => 
        archetypeCounts.get(arch) >= 1
      )

      if (hasAllRequired) {
        synergies.push({
          name: synergyName,
          ...synergyData,
          pieces: synergyData.archetypes.length,
          bonus: synergyData.synergy_bonus
        })
      }
    })

    return {
      archetypeCounts: Object.fromEntries(archetypeCounts),
      activeSynergies: synergies,
      totalBonus: synergies.reduce((sum, syn) => sum + syn.bonus, 0)
    }
  }

  /**
   * Analyze Tier 5 armor special features
   * @param {Object} armorPiece - Tier 5 armor piece
   * @param {Object} buildRequirements - Build requirements
   * @returns {Object} Tier 5 analysis
   */
  analyzeTier5Features(armorPiece, buildRequirements) {
    if (!this.isTier5Armor(armorPiece)) {
      return null
    }

    const analysis = {
      currentTunedStat: armorPiece.tunedStat || null,
      optimalTunedStat: null,
      tuningValue: 5,
      extraEnergyCapacity: true,
      bonusSocket: true,
      recommendations: []
    }

    // Determine optimal tuned stat
    if (buildRequirements.priorityStats) {
      const priorities = Object.entries(buildRequirements.priorityStats)
        .sort(([,a], [,b]) => b - a)
      
      analysis.optimalTunedStat = priorities[0]?.[0] || null
    }

    // Generate tuning recommendations
    if (analysis.currentTunedStat !== analysis.optimalTunedStat) {
      analysis.recommendations.push({
        type: 'reroll_tuning',
        message: `Consider rerolling for ${analysis.optimalTunedStat} tuning`,
        impact: 'medium'
      })
    }

    return analysis
  }

  /**
   * Helper methods
   */

  calculateCurrentStats(armorPieces) {
    const stats = {
      weapons: 0, health: 0, class: 0,
      super: 0, grenade: 0, melee: 0
    }

    armorPieces.forEach(piece => {
      if (!piece) return

      const pieceStats = this.statCalculator.parseArmorStats(piece)
      Object.entries(pieceStats).forEach(([stat, value]) => {
        if (stats.hasOwnProperty(stat)) {
          stats[stat] += value
        }
      })
    })

    return stats
  }

  calculateStatEfficiency(currentStats, targetStats) {
    let totalTarget = 0
    let totalAchieved = 0

    Object.entries(targetStats).forEach(([stat, target]) => {
      totalTarget += target
      totalAchieved += Math.min(currentStats[stat] || 0, target)
    })

    return totalTarget > 0 ? totalAchieved / totalTarget : 0
  }

  generateStatOptimizationRecommendations(gaps, surplus, armorPieces) {
    const recommendations = []

    // Address large gaps
    Object.entries(gaps).forEach(([stat, gap]) => {
      if (gap > 50) {
        recommendations.push({
          type: 'stat_gap',
          stat,
          gap,
          priority: 'high',
          message: `Need ${gap} more ${stat} to reach target`
        })
      }
    })

    // Address surplus
    Object.entries(surplus).forEach(([stat, surplusAmount]) => {
      if (surplusAmount > 30) {
        recommendations.push({
          type: 'stat_surplus',
          stat,
          surplus: surplusAmount,
          priority: 'medium',
          message: `${surplusAmount} excess ${stat} could be redistributed`
        })
      }
    })

    return recommendations
  }

  findBestArmorForSlot(slotArmor, slot, buildRequirements, archetype, constraints) {
    const pieces = Object.values(slotArmor)
    const scoredPieces = pieces.map(piece => ({
      piece,
      score: this.scoreArmorPiece(piece, buildRequirements, archetype, constraints)
    }))

    scoredPieces.sort((a, b) => b.score.total - a.score.total)
    return scoredPieces[0]?.piece || null
  }

  scoreArmorPiece(armorPiece, buildRequirements, archetype, constraints) {
    const score = {
      statAlignment: 0,
      archetypeMatch: 0,
      tier: 0,
      total: 0
    }

    // Score stat alignment
    const pieceStats = this.statCalculator.parseArmorStats(armorPiece)
    if (buildRequirements.priorityStats) {
      Object.entries(buildRequirements.priorityStats).forEach(([stat, target]) => {
        const statValue = pieceStats[stat] || 0
        score.statAlignment += statValue * (target / 200)
      })
    }

    // Score archetype match
    const pieceArchetype = this.inferArmorArchetype(pieceStats)
    if (pieceArchetype === archetype.archetype) {
      score.archetypeMatch = 20
    }

    // Score tier quality
    const tier = this.calculateArmorTier(pieceStats)
    score.tier = tier * 2

    score.total = score.statAlignment + score.archetypeMatch + score.tier
    return score
  }

  calculateTotalBuildStats(armorPieces) {
    return this.calculateCurrentStats(armorPieces)
  }

  analyzeSetBonuses(armorPieces, buildRequirements) {
    const setBonuses = []
    const setNames = new Map()

    // Count pieces from each set
    armorPieces.forEach(piece => {
      if (piece.setName) {
        setNames.set(piece.setName, (setNames.get(piece.setName) || 0) + 1)
      }
    })

    // Check for active set bonuses
    setNames.forEach((count, setName) => {
      if (count >= 2) {
        setBonuses.push({
          setName,
          pieces: count,
          bonusLevel: count >= 4 ? 'four_piece' : 'two_piece'
        })
      }
    })

    return setBonuses
  }

  inferArmorArchetype(armorStats) {
    let bestArchetype = 'unknown'
    let bestScore = 0

    Object.entries(this.archetypes).forEach(([archetypeName, archetype]) => {
      const primaryValue = armorStats[archetype.primary] || 0
      const secondaryValue = armorStats[archetype.secondary] || 0
      const score = (primaryValue * 2) + secondaryValue

      if (score > bestScore) {
        bestScore = score
        bestArchetype = archetypeName
      }
    })

    return bestArchetype
  }

  calculateArmorTier(armorStats) {
    const total = Object.values(armorStats).reduce((sum, val) => sum + val, 0)
    
    if (total >= 73) return 5
    if (total >= 65) return 4
    if (total >= 59) return 3
    if (total >= 53) return 2
    return 1
  }

  isTier5Armor(armorPiece) {
    const stats = this.statCalculator.parseArmorStats(armorPiece)
    const total = Object.values(stats).reduce((sum, val) => sum + val, 0)
    return total >= 73
  }

  calculateArchetypeConfidence(archetype, buildGoal, score) {
    const maxPossibleScore = 75
    const baseConfidence = score / maxPossibleScore

    // Bonus for specific archetype
    const specificityBonus = archetype.playstyles.length < 4 ? 0.1 : 0

    return Math.min(1.0, baseConfidence + specificityBonus)
  }

  generateArchetypeReasoning(recommendation, buildGoal) {
    const reasons = []

    if (buildGoal.priorityStats) {
      const primaryStat = buildGoal.priorityStats[recommendation.primary]
      if (primaryStat > 150) {
        reasons.push(`High ${recommendation.primary} priority matches archetype focus`)
      }
    }

    if (buildGoal.playstyles) {
      const matchingStyles = buildGoal.playstyles.filter(p => 
        recommendation.playstyles.includes(p)
      )
      if (matchingStyles.length > 0) {
        reasons.push(`Playstyle alignment: ${matchingStyles.join(', ')}`)
      }
    }

    return reasons.join('; ')
  }

  /**
   * Get archetype recommendations for specific activities
   * @param {string} activity - Activity name
   * @returns {Array} Recommended archetypes for activity
   */
  getArchetypesForActivity(activity) {
    const recommendations = []

    Object.entries(this.archetypes).forEach(([name, archetype]) => {
      if (archetype.activities.includes(activity)) {
        recommendations.push({
          name,
          ...archetype,
          priority: archetype.activities.indexOf(activity) === 0 ? 'high' : 'medium'
        })
      }
    })

    return recommendations.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }
}

// Utility functions for external use
export function recommendArmorArchetype(buildGoal, constraints = {}) {
  const manager = new ArmorArchetypeManager()
  return manager.recommendArchetype(buildGoal, constraints)
}

export function optimizeArmorStats(armorPieces, targetDistribution) {
  const manager = new ArmorArchetypeManager()
  return manager.optimizeStatDistribution(armorPieces, targetDistribution)
}

export function generateArmorBuild(buildRequirements, availableArmor = {}, constraints = {}) {
  const manager = new ArmorArchetypeManager()
  return manager.generateArmorSetRecommendations(buildRequirements, availableArmor, constraints)
}