// lib/destiny-intelligence/armor-archetype-manager.js
// Advanced Armor Archetype Analysis and Management System

class ArmorArchetypeManager {
  constructor() {
    // Armor archetypes based on stat distributions and roles
    this.archetypes = {
      // Tank builds
      'fortress': {
        name: 'Fortress',
        description: 'Maximum survivability focus',
        primaryStats: ['resilience', 'recovery'],
        secondaryStats: ['intellect'],
        minTiers: { resilience: 8, recovery: 6 },
        activities: ['raid', 'dungeon', 'nightfall'],
        playstyle: 'defensive'
      },
      'regenerator': {
        name: 'Regenerator', 
        description: 'Recovery-focused survivability',
        primaryStats: ['recovery', 'resilience'],
        secondaryStats: ['discipline'],
        minTiers: { recovery: 10, resilience: 6 },
        activities: ['general_pve', 'raid'],
        playstyle: 'defensive'
      },

      // DPS builds
      'berserker': {
        name: 'Berserker',
        description: 'Maximum damage output',
        primaryStats: ['strength', 'discipline'],
        secondaryStats: ['recovery'],
        minTiers: { strength: 8, discipline: 8 },
        activities: ['raid', 'dungeon'],
        playstyle: 'aggressive'
      },
      'artillery': {
        name: 'Artillery',
        description: 'Grenade and super focused',
        primaryStats: ['discipline', 'intellect'],
        secondaryStats: ['recovery'],
        minTiers: { discipline: 10, intellect: 7 },
        activities: ['general_pve', 'raid'],
        playstyle: 'ability_focused'
      },

      // PvP builds  
      'assassin': {
        name: 'Assassin',
        description: 'High mobility and damage',
        primaryStats: ['mobility', 'recovery'],
        secondaryStats: ['intellect'],
        minTiers: { mobility: 8, recovery: 8 },
        activities: ['pvp', 'trials'],
        playstyle: 'aggressive'
      },
      'duelist': {
        name: 'Duelist',
        description: 'Balanced PvP engagement',
        primaryStats: ['mobility', 'recovery', 'resilience'],
        secondaryStats: ['intellect'],
        minTiers: { mobility: 6, recovery: 6, resilience: 6 },
        activities: ['pvp', 'trials', 'gambit'],
        playstyle: 'balanced'
      },

      // Support builds
      'medic': {
        name: 'Medic',
        description: 'Team support and healing',
        primaryStats: ['recovery', 'discipline'],
        secondaryStats: ['intellect', 'strength'],
        minTiers: { recovery: 8, discipline: 7 },
        activities: ['raid', 'dungeon'],
        playstyle: 'support'
      },
      'tactician': {
        name: 'Tactician',
        description: 'Super and ability support',
        primaryStats: ['intellect', 'discipline'],
        secondaryStats: ['recovery'],
        minTiers: { intellect: 8, discipline: 6 },
        activities: ['raid', 'general_pve'],
        playstyle: 'support'
      },

      // Specialized builds
      'speedrunner': {
        name: 'Speedrunner',
        description: 'Maximum mobility and efficiency',
        primaryStats: ['mobility', 'discipline'],
        secondaryStats: ['recovery'],
        minTiers: { mobility: 10, discipline: 8 },
        activities: ['dungeon', 'general_pve'],
        playstyle: 'aggressive'
      },
      'jack_of_all_trades': {
        name: 'Jack of All Trades',
        description: 'Balanced stats for versatility',
        primaryStats: ['recovery', 'discipline', 'intellect'],
        secondaryStats: ['resilience'],
        minTiers: { recovery: 6, discipline: 6, intellect: 6 },
        activities: ['general_pve', 'gambit'],
        playstyle: 'balanced'
      }
    }

    // Synergies between different archetypes
    this.archetypeSynergies = {
      'tank_support': {
        archetypes: ['fortress', 'medic'],
        synergy_bonus: 15,
        description: 'Tank and healer combination'
      },
      'dps_artillery': {
        archetypes: ['berserker', 'artillery'],
        synergy_bonus: 20,
        description: 'Melee and grenade synergy'
      },
      'pvp_mobility': {
        archetypes: ['assassin', 'duelist'],
        synergy_bonus: 12,
        description: 'High mobility PvP builds'
      }
    }

    // Tier 5 armor special considerations
    this.tier5Bonuses = {
      tunedStats: {
        mobility: 'Enhanced jump and movement speed',
        resilience: 'Increased damage resistance',
        recovery: 'Faster health regeneration',
        discipline: 'Reduced grenade cooldown',
        intellect: 'Faster super generation',
        strength: 'Reduced melee cooldown'
      },
      extraEnergy: 'Additional mod socket energy',
      bonusSocket: 'Extra armor mod socket'
    }
  }

  /**
   * Recommend optimal archetype based on build goals
   * @param {Object} buildGoal - User's build objectives
   * @param {Object} constraints - Available armor and constraints
   * @returns {Object} Archetype recommendation
   */
  recommendArchetype(buildGoal, constraints = {}) {
    const scores = new Map()

    // Score each archetype against build goal
    Object.entries(this.archetypes).forEach(([archetypeId, archetype]) => {
      let score = 0

      // Activity alignment
      if (archetype.activities.includes(buildGoal.activity || 'general_pve')) {
        score += 25
      }

      // Playstyle alignment  
      if (archetype.playstyle === buildGoal.playstyle) {
        score += 20
      }

      // Stat priority alignment
      const userPriorities = buildGoal.focusStats || []
      archetype.primaryStats.forEach(stat => {
        if (userPriorities.includes(stat)) {
          score += 15
        }
      })
      archetype.secondaryStats.forEach(stat => {
        if (userPriorities.includes(stat)) {
          score += 8
        }
      })

      // Class alignment (if specified)
      if (buildGoal.class && archetype.preferredClasses) {
        if (archetype.preferredClasses.includes(buildGoal.class)) {
          score += 10
        }
      }

      scores.set(archetypeId, { 
        ...archetype, 
        score, 
        archetypeId,
        feasibility: this.assessArchetypeFeasibility(archetype, constraints)
      })
    })

    // Sort by score and return top recommendations
    const sortedArchetypes = Array.from(scores.entries())
      .sort(([,a], [,b]) => b.score - a.score)
      .slice(0, 3)

    return {
      primaryRecommendation: sortedArchetypes[0] || null,
      alternativeOptions: sortedArchetypes.slice(1),
      reasoning: this.generateArchetypeReasoning(sortedArchetypes[0], buildGoal)
    }
  }

  /**
   * Assess if archetype is feasible with available armor
   * @param {Object} archetype - Archetype definition
   * @param {Object} constraints - Available armor and constraints
   * @returns {Object} Feasibility assessment
   */
  assessArchetypeFeasibility(archetype, constraints) {
    const assessment = {
      feasible: true,
      challenges: [],
      requirements: archetype.minTiers,
      estimatedDifficulty: 'medium'
    }

    // Check if required stat tiers are achievable
    Object.entries(archetype.minTiers).forEach(([stat, minTier]) => {
      const maxPossible = this.calculateMaxPossibleStatTier(stat, constraints)
      if (maxPossible < minTier) {
        assessment.feasible = false
        assessment.challenges.push(`${stat} T${minTier} not achievable (max: T${maxPossible})`)
      }
    })

    // Assess difficulty based on stat requirements
    const totalRequiredTiers = Object.values(archetype.minTiers).reduce((sum, tier) => sum + tier, 0)
    if (totalRequiredTiers > 45) {
      assessment.estimatedDifficulty = 'very_hard'
    } else if (totalRequiredTiers > 35) {
      assessment.estimatedDifficulty = 'hard'  
    } else if (totalRequiredTiers < 25) {
      assessment.estimatedDifficulty = 'easy'
    }

    return assessment
  }

  /**
   * Calculate maximum achievable tier for a stat
   * @param {string} stat - Stat name
   * @param {Object} constraints - Available armor constraints
   * @returns {number} Maximum tier achievable
   */
  calculateMaxPossibleStatTier(stat, constraints) {
    // Base calculation - can be enhanced with actual armor data
    const baseMax = 10 // T10 is max
    const armorBonus = constraints.tier5Available ? 1 : 0
    const modBonus = constraints.allowMods !== false ? 2 : 0
    
    return Math.min(baseMax, Math.floor((100 + armorBonus * 5 + modBonus * 10) / 10))
  }

  /**
   * Generate reasoning for archetype recommendation
   * @param {Array} topArchetype - Highest scoring archetype
   * @param {Object} buildGoal - Original build goal
   * @returns {string} Human-readable reasoning
   */
  generateArchetypeReasoning(topArchetype, buildGoal) {
    if (!topArchetype) return 'No suitable archetype found'

    const [archetypeId, archetype] = topArchetype
    const reasons = []

    if (archetype.activities.includes(buildGoal.activity)) {
      reasons.push(`optimized for ${buildGoal.activity}`)
    }

    if (archetype.playstyle === buildGoal.playstyle) {
      reasons.push(`matches ${buildGoal.playstyle} playstyle`)
    }

    const matchingStats = archetype.primaryStats.filter(stat => 
      (buildGoal.focusStats || []).includes(stat)
    )
    if (matchingStats.length > 0) {
      reasons.push(`prioritizes your focus stats: ${matchingStats.join(', ')}`)
    }

    return `Recommended ${archetype.name} archetype because it ${reasons.join(', ')}`
  }

  /**
   * Optimize stat distribution for given armor pieces
   * @param {Array} armorPieces - Available armor pieces
   * @param {Object} targetDistribution - Desired stat distribution
   * @returns {Object} Optimization results
   */
  optimizeStatDistribution(armorPieces, targetDistribution) {
    const optimization = {
      recommendedPieces: [],
      achievedStats: {},
      tierBreakdown: {},
      optimizationScore: 0,
      gaps: [],
      alternatives: []
    }

    // Simple greedy optimization - can be enhanced with more sophisticated algorithms
    const slots = ['helmet', 'gauntlets', 'chest', 'legs', 'classItem']
    
    slots.forEach(slot => {
      const slotPieces = armorPieces.filter(piece => piece.slot === slot)
      if (slotPieces.length === 0) return

      // Score each piece based on target distribution
      const scored = slotPieces.map(piece => ({
        ...piece,
        score: this.scoreArmorPiece(piece, targetDistribution)
      }))

      // Select highest scoring piece
      const best = scored.sort((a, b) => b.score - a.score)[0]
      optimization.recommendedPieces.push(best)
    })

    // Calculate achieved stats
    optimization.achievedStats = this.calculateTotalStats(optimization.recommendedPieces)
    
    // Calculate tier breakdown
    Object.entries(optimization.achievedStats).forEach(([stat, value]) => {
      optimization.tierBreakdown[stat] = Math.floor(value / 10)
    })

    // Calculate optimization score
    optimization.optimizationScore = this.calculateOptimizationScore(
      optimization.tierBreakdown,
      targetDistribution
    )

    return optimization
  }

  /**
   * Score armor piece based on target stat distribution
   * @param {Object} armorPiece - Armor piece to score
   * @param {Object} targetDistribution - Target stat priorities
   * @returns {number} Score for this piece
   */
  scoreArmorPiece(armorPiece, targetDistribution) {
    let score = 0
    const stats = armorPiece.stats || {}

    Object.entries(targetDistribution).forEach(([stat, priority]) => {
      const statValue = stats[stat] || 0
      score += statValue * priority
    })

    // Bonus for high total stats
    const totalStats = Object.values(stats).reduce((sum, val) => sum + val, 0)
    score += totalStats * 0.1

    // Bonus for tier 5 armor
    if (this.isTier5Armor(armorPiece)) {
      score += 50
    }

    return score
  }

  /**
   * Calculate total stats from armor pieces
   * @param {Array} armorPieces - Array of armor pieces
   * @returns {Object} Total stat values
   */
  calculateTotalStats(armorPieces) {
    const totalStats = {
      mobility: 0,
      resilience: 0,
      recovery: 0,
      discipline: 0,
      intellect: 0,
      strength: 0
    }

    armorPieces.forEach(piece => {
      Object.entries(piece.stats || {}).forEach(([stat, value]) => {
        if (totalStats[stat] !== undefined) {
          totalStats[stat] += value
        }
      })
    })

    return totalStats
  }

  /**
   * Calculate optimization score
   * @param {Object} achievedTiers - Achieved stat tiers
   * @param {Object} targetDistribution - Target distribution
   * @returns {number} Optimization score (0-100)
   */
  calculateOptimizationScore(achievedTiers, targetDistribution) {
    let score = 0
    let maxPossibleScore = 0

    Object.entries(targetDistribution).forEach(([stat, priority]) => {
      const achievedTier = achievedTiers[stat] || 0
      const maxTier = 10
      
      score += Math.min(achievedTier, maxTier) * priority
      maxPossibleScore += maxTier * priority
    })

    return maxPossibleScore > 0 ? Math.round((score / maxPossibleScore) * 100) : 0
  }

  /**
   * Check if armor is Tier 5 (Legendary with enhanced features)
   * @param {Object} armorPiece - Armor piece to check
   * @returns {boolean} Is Tier 5 armor
   */
  isTier5Armor(armorPiece) {
    return armorPiece.tier === 5 || 
           armorPiece.tier === 'Legendary' ||
           armorPiece.enhanced === true ||
           (armorPiece.sockets && armorPiece.sockets.length > 4)
  }

  /**
   * Generate complete armor set recommendations
   * @param {Object} buildRequirements - Build requirements and goals
   * @param {Object} availableArmor - Available armor inventory
   * @param {Object} constraints - Build constraints
   * @returns {Object} Complete armor recommendations
   */
  generateArmorSetRecommendations(buildRequirements, availableArmor = {}, constraints = {}) {
    const recommendations = {
      primarySet: null,
      alternativeSet: null,
      archetype: null,
      synergies: null,
      totalStats: null,
      setBonuses: null,
      optimization: null,
      reasoning: []
    }

    // Get recommended archetype
    const archetypeRec = this.recommendArchetype(buildRequirements, constraints)
    recommendations.archetype = archetypeRec.primaryRecommendation

    if (!recommendations.archetype) {
      return recommendations
    }

    // Convert available armor to array format
    const armorArray = this.flattenArmorInventory(availableArmor)
    
    // Optimize stat distribution
    const optimization = this.optimizeStatDistribution(
      armorArray, 
      this.convertArchetypeToDistribution(recommendations.archetype[1])
    )
    recommendations.primarySet = optimization.recommendedPieces
    recommendations.optimization = optimization

    // Calculate synergies
    recommendations.synergies = this.calculateArchetypeSynergies(recommendations.primarySet)

    // Calculate total stats
    recommendations.totalStats = this.calculateTotalBuildStats(recommendations.primarySet)

    // Analyze set bonuses
    recommendations.setBonuses = this.analyzeSetBonuses(recommendations.primarySet, buildRequirements)

    // Generate reasoning
    recommendations.reasoning = this.generateSetRecommendationReasoning(
      recommendations, buildRequirements
    )

    return recommendations
  }

  /**
   * Flatten armor inventory to array format
   * @param {Object} availableArmor - Armor inventory by slot
   * @returns {Array} Flat array of armor pieces
   */
  flattenArmorInventory(availableArmor) {
    const armorArray = []
    
    Object.entries(availableArmor).forEach(([slot, pieces]) => {
      if (Array.isArray(pieces)) {
        pieces.forEach(piece => {
          armorArray.push({ ...piece, slot })
        })
      }
    })

    return armorArray
  }

  /**
   * Convert archetype to stat distribution format
   * @param {Object} archetype - Archetype definition
   * @returns {Object} Stat distribution priorities
   */
  convertArchetypeToDistribution(archetype) {
    const distribution = {}
    
    archetype.primaryStats.forEach(stat => {
      distribution[stat] = 10 // High priority
    })
    
    archetype.secondaryStats.forEach(stat => {
      distribution[stat] = 5 // Medium priority
    })

    return distribution
  }

  /**
   * Calculate total build stats including bonuses
   * @param {Array} armorPieces - Selected armor pieces
   * @returns {Object} Total build stats
   */
  calculateTotalBuildStats(armorPieces) {
    const baseStats = this.calculateTotalStats(armorPieces)
    
    // Add Tier 5 bonuses
    armorPieces.forEach(piece => {
      if (this.isTier5Armor(piece) && piece.tunedStat) {
        baseStats[piece.tunedStat] = (baseStats[piece.tunedStat] || 0) + 5
      }
    })

    // Add mod bonuses (simplified)
    Object.keys(baseStats).forEach(stat => {
      baseStats[stat] += 20 // Assume +20 from mods
    })

    return baseStats
  }

  /**
   * Analyze set bonuses and special effects
   * @param {Array} armorPieces - Selected armor pieces
   * @param {Object} buildRequirements - Build requirements
   * @returns {Object} Set bonus analysis
   */
  analyzeSetBonuses(armorPieces, buildRequirements) {
    const analysis = {
      tier5Count: 0,
      tunedStatBonuses: {},
      extraEnergySlots: 0,
      bonusSockets: 0,
      setEffects: []
    }

    armorPieces.forEach(piece => {
      if (this.isTier5Armor(piece)) {
        analysis.tier5Count++
        
        if (piece.tunedStat) {
          analysis.tunedStatBonuses[piece.tunedStat] = 
            (analysis.tunedStatBonuses[piece.tunedStat] || 0) + 5
        }
        
        if (piece.extraEnergy) {
          analysis.extraEnergySlots++
        }
        
        if (piece.bonusSocket) {
          analysis.bonusSockets++
        }
      }
    })

    return analysis
  }

  /**
   * Generate reasoning for set recommendations
   * @param {Object} recommendations - Generated recommendations
   * @param {Object} buildRequirements - Original requirements
   * @returns {Array} Array of reasoning strings
   */
  generateSetRecommendationReasoning(recommendations, buildRequirements) {
    const reasoning = []

    if (recommendations.archetype) {
      const [, archetype] = recommendations.archetype
      reasoning.push(`Selected ${archetype.name} archetype for ${buildRequirements.activity || 'general'} activities`)
    }

    if (recommendations.optimization?.optimizationScore > 80) {
      reasoning.push(`Excellent stat optimization (${recommendations.optimization.optimizationScore}% efficiency)`)
    } else if (recommendations.optimization?.optimizationScore > 60) {
      reasoning.push(`Good stat optimization (${recommendations.optimization.optimizationScore}% efficiency)`)
    } else {
      reasoning.push(`Moderate stat optimization (${recommendations.optimization.optimizationScore}% efficiency) - consider farming better armor`)
    }

    if (recommendations.setBonuses?.tier5Count > 3) {
      reasoning.push(`Strong Tier 5 armor set (${recommendations.setBonuses.tier5Count} pieces) provides enhanced capabilities`)
    }

    if (recommendations.synergies?.activeSynergies.length > 0) {
      reasoning.push(`Active archetype synergies boost overall effectiveness`)
    }

    return reasoning
  }

  /**
   * Get archetype recommendations for user interface
   * @param {Object} userPreferences - User's stated preferences
   * @returns {Array} UI-friendly archetype recommendations
   */
  getArchetypeRecommendationsForUI(userPreferences) {
    const recommendations = []

    Object.entries(this.archetypes).forEach(([archetypeId, archetype]) => {
      const recommendation = {
        id: archetypeId,
        name: archetype.name,
        description: archetype.description,
        primaryStats: archetype.primaryStats,
        activities: archetype.activities,
        playstyle: archetype.playstyle,
        difficulty: 'medium',
        priority: this.calculateUIPriority(archetype, userPreferences)
      }

      // Assess difficulty based on stat requirements
      const totalTiers = Object.values(archetype.minTiers || {}).reduce((sum, tier) => sum + tier, 0)
      if (totalTiers > 40) {
        recommendation.difficulty = 'hard'
      } else if (totalTiers < 25) {
        recommendation.difficulty = 'easy'
      }

      recommendations.push(recommendation)
    })

    return recommendations.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  /**
   * Calculate UI priority for archetype
   * @param {Object} archetype - Archetype definition
   * @param {Object} userPreferences - User preferences
   * @returns {string} Priority level
   */
  calculateUIPrivate(archetype, userPreferences) {
    let score = 0

    // Activity match
    if (userPreferences.activity && archetype.activities.includes(userPreferences.activity)) {
      score += 3
    }

    // Playstyle match
    if (userPreferences.playstyle === archetype.playstyle) {
      score += 2
    }

    // Stat preferences
    const userStats = userPreferences.focusStats || []
    archetype.primaryStats.forEach(stat => {
      if (userStats.includes(stat)) {
        score += 2
      }
    })

    if (score >= 5) {
      return 'high'
    } else if (score >= 3) {
      return 'medium'
    } else {
      return 'low'
    }
  }
}

// Export the class and utility functions
module.exports = ArmorArchetypeManager

// Utility functions for external use
function recommendArmorArchetype(buildGoal, constraints = {}) {
  const manager = new ArmorArchetypeManager()
  return manager.recommendArchetype(buildGoal, constraints)
}

function optimizeArmorStats(armorPieces, targetDistribution) {
  const manager = new ArmorArchetypeManager()
  return manager.optimizeStatDistribution(armorPieces, targetDistribution)
}

function generateArmorBuild(buildRequirements, availableArmor = {}, constraints = {}) {
  const manager = new ArmorArchetypeManager()
  return manager.generateArmorSetRecommendations(buildRequirements, availableArmor, constraints)
}

module.exports.recommendArmorArchetype = recommendArmorArchetype
module.exports.optimizeArmorStats = optimizeArmorStats
module.exports.generateArmorBuild = generateArmorBuild