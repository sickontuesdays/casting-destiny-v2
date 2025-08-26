// lib/destiny-intelligence/stat-calculator.js
// Advanced stat calculation and optimization system for Destiny 2 builds

export class StatCalculator {
  constructor() {
    this.isInitialized = false
    this.manifest = null
    this.statDefinitions = null
    this.version = '1.0.0'
    
    // Stat hash mappings (actual Destiny 2 stat hashes)
    this.statHashes = {
      mobility: 2996146975,
      resilience: 392767087,
      recovery: 1943323491,
      discipline: 1735777505,
      intellect: 144602215,
      strength: 4244567218
    }

    // Stat breakpoints and effects
    this.statBreakpoints = this.initializeStatBreakpoints()
    this.armorArchetypes = this.initializeArmorArchetypes()
  }

  async initialize(manifestData) {
    try {
      console.log('📊 Initializing Stat Calculator...')
      
      if (!manifestData) {
        throw new Error('Manifest data is required')
      }

      this.manifest = manifestData
      this.statDefinitions = manifestData.data?.DestinyStatDefinition || {}
      
      console.log(`📈 Loaded ${Object.keys(this.statDefinitions).length} stat definitions`)
      
      this.isInitialized = true
      console.log('✅ Stat Calculator initialized successfully')
      return true
      
    } catch (error) {
      console.error('❌ Failed to initialize Stat Calculator:', error)
      this.isInitialized = false
      throw error
    }
  }

  initializeStatBreakpoints() {
    return {
      mobility: {
        tiers: {
          0: { walkSpeed: 0, jumpHeight: 0, slideDistance: 0 },
          5: { walkSpeed: 5, jumpHeight: 5, slideDistance: 8 },
          10: { walkSpeed: 10, jumpHeight: 10, slideDistance: 15 }
        },
        description: 'Movement speed, jump height, strafe speed'
      },
      resilience: {
        tiers: {
          0: { damageReduction: 0, flinchReduction: 0 },
          3: { damageReduction: 15, flinchReduction: 10 },
          6: { damageReduction: 25, flinchReduction: 20 },
          10: { damageReduction: 40, flinchReduction: 35 }
        },
        description: 'Damage resistance, flinch reduction, shield durability'
      },
      recovery: {
        tiers: {
          0: { healthRegenDelay: 9.0, healthRegenSpeed: 100 },
          3: { healthRegenDelay: 7.0, healthRegenSpeed: 85 },
          6: { healthRegenDelay: 5.5, healthRegenSpeed: 70 },
          10: { healthRegenDelay: 4.0, healthRegenSpeed: 50 }
        },
        description: 'Health regeneration delay and speed'
      },
      discipline: {
        tiers: {
          0: { grenadeCooldown: 152 },
          3: { grenadeCooldown: 121 },
          6: { grenadeCooldown: 96 },
          10: { grenadeCooldown: 68 }
        },
        description: 'Grenade ability regeneration rate'
      },
      intellect: {
        tiers: {
          0: { superCooldown: 502 },
          3: { superCooldown: 448 },
          6: { superCooldown: 394 },
          10: { superCooldown: 340 }
        },
        description: 'Super ability regeneration rate'
      },
      strength: {
        tiers: {
          0: { meleeCooldown: 100 },
          3: { meleeCooldown: 83 },
          6: { meleeCooldown: 69 },
          10: { meleeCooldown: 55 }
        },
        description: 'Melee ability regeneration rate'
      }
    }
  }

  initializeArmorArchetypes() {
    return {
      'pvp_mobility': {
        name: 'PvP Mobility Focus',
        stats: { mobility: 100, recovery: 80, resilience: 60, discipline: 50, intellect: 40, strength: 20 },
        description: 'Optimized for PvP movement and positioning'
      },
      'raid_support': {
        name: 'Raid Support',
        stats: { recovery: 100, intellect: 80, discipline: 70, resilience: 50, mobility: 40, strength: 30 },
        description: 'High survivability with frequent supers and grenades'
      },
      'solo_survivability': {
        name: 'Solo Content Specialist', 
        stats: { recovery: 100, resilience: 80, intellect: 60, discipline: 60, mobility: 40, strength: 40 },
        description: 'Maximum survivability for challenging solo content'
      },
      'ability_spam': {
        name: 'Ability Spam Build',
        stats: { discipline: 100, intellect: 100, strength: 80, recovery: 60, resilience: 40, mobility: 40 },
        description: 'Maximize ability uptime with triple 100s in ability stats'
      },
      'balanced_allrounder': {
        name: 'Balanced All-Rounder',
        stats: { recovery: 80, resilience: 60, mobility: 60, discipline: 60, intellect: 60, strength: 50 },
        description: 'Well-rounded for all content types'
      }
    }
  }

  /**
   * Calculate stat effects at specific values
   */
  calculateStatEffects(statName, value, isPvP = false) {
    if (!this.statBreakpoints[statName]) {
      return { tier: 0, effects: {}, description: 'Unknown stat' }
    }

    const tier = Math.floor(value / 10)
    const stat = this.statBreakpoints[statName]
    
    // Get effects for this tier (or closest lower tier)
    let effectsTier = tier
    while (effectsTier >= 0 && !stat.tiers[effectsTier]) {
      effectsTier--
    }

    const effects = effectsTier >= 0 ? stat.tiers[effectsTier] : stat.tiers[0]
    
    return {
      tier,
      value,
      effects: effects || {},
      description: stat.description,
      nextBreakpoint: this.getNextBreakpoint(statName, tier),
      efficiency: this.calculateStatEfficiency(value, tier)
    }
  }

  getNextBreakpoint(statName, currentTier) {
    const stat = this.statBreakpoints[statName]
    if (!stat) return null

    const nextTier = currentTier + 1
    if (nextTier <= 10 && stat.tiers[nextTier]) {
      return {
        tier: nextTier,
        pointsNeeded: (nextTier * 10) - (currentTier * 10 + (currentTier < 10 ? 10 : 0)),
        effects: stat.tiers[nextTier]
      }
    }

    return null
  }

  calculateStatEfficiency(value, tier) {
    // Calculate how efficiently stat points are used
    const excess = value % 10
    const efficiency = excess === 0 ? 1.0 : (10 - excess) / 10
    
    return {
      efficiency,
      wastedPoints: excess,
      isOptimal: excess === 0,
      recommendation: excess > 5 ? 'add_points' : excess > 0 ? 'minor_waste' : 'optimal'
    }
  }

  /**
   * Calculate combined stats for a full armor set
   */
  calculateBuildStats(armorPieces, isPvP = false) {
    const totalStats = {
      mobility: 0,
      resilience: 0,
      recovery: 0,
      discipline: 0,
      intellect: 0,
      strength: 0
    }

    const statBreakdown = {
      base: { ...totalStats },
      armor: { ...totalStats },
      mods: { ...totalStats },
      masterwork: { ...totalStats }
    }

    // Process each armor piece
    for (const piece of armorPieces) {
      if (!piece || !piece.stats) continue

      // Add armor stats
      for (const stat of piece.stats) {
        const statName = this.getStatNameByHash(stat.statHash)
        if (statName && totalStats[statName] !== undefined) {
          const baseValue = stat.value || 0
          totalStats[statName] += baseValue
          statBreakdown.armor[statName] += baseValue
        }
      }

      // Add masterwork bonus (typically +2 to all stats for masterworked armor)
      if (piece.masterwork) {
        Object.keys(totalStats).forEach(statName => {
          totalStats[statName] += 2
          statBreakdown.masterwork[statName] += 2
        })
      }
    }

    // Calculate stat effects for each stat
    const statEffects = {}
    Object.entries(totalStats).forEach(([statName, value]) => {
      statEffects[statName] = this.calculateStatEffects(statName, value, isPvP)
    })

    return {
      totalStats,
      statBreakdown,
      statEffects,
      overallTier: Object.values(totalStats).reduce((sum, val) => sum + Math.floor(val / 10), 0),
      efficiency: this.calculateOverallEfficiency(totalStats),
      recommendations: this.generateStatRecommendations(totalStats, statEffects)
    }
  }

  getStatNameByHash(hash) {
    // Convert stat hash to stat name
    for (const [name, statHash] of Object.entries(this.statHashes)) {
      if (statHash === hash) return name
    }
    
    return null
  }

  calculateOverallEfficiency(stats) {
    let totalWaste = 0
    let totalStats = 0

    for (const [statName, value] of Object.entries(stats)) {
      const excess = value % 10
      totalWaste += excess
      totalStats += value
    }

    const maxPossibleWaste = Object.keys(stats).length * 9
    const efficiency = totalStats > 0 ? 1 - (totalWaste / Math.max(maxPossibleWaste, 1)) : 0

    return {
      efficiency: Math.max(0, efficiency),
      wastedPoints: totalWaste,
      totalPoints: totalStats,
      averageTier: totalStats / (Object.keys(stats).length * 10)
    }
  }

  /**
   * Generate stat optimization recommendations
   */
  generateStatRecommendations(stats, statEffects) {
    const recommendations = []

    for (const [statName, value] of Object.entries(stats)) {
      const tier = Math.floor(value / 10)
      const excess = value % 10

      // Recommend reaching next tier if close
      if (excess >= 7 && tier < 10) {
        const pointsNeeded = 10 - excess
        recommendations.push({
          type: 'optimization',
          stat: statName,
          description: `Add ${pointsNeeded} more ${statName} to reach tier ${tier + 1}`,
          priority: 'high',
          pointsNeeded
        })
      }

      // Recommend reducing waste if significant
      if (excess >= 5 && tier >= 8) {
        recommendations.push({
          type: 'efficiency',
          stat: statName,
          description: `Consider reallocating ${excess} excess ${statName} points`,
          priority: 'medium',
          wastedPoints: excess
        })
      }

      // Recommend critical stat thresholds
      if (this.isCriticallyLow(statName, value, tier)) {
        recommendations.push({
          type: 'critical',
          stat: statName,
          description: `${statName} is critically low for most activities`,
          priority: 'high',
          minimumRecommended: this.getMinimumRecommended(statName)
        })
      }
    }

    return recommendations
  }

  isCriticallyLow(statName, value, tier) {
    const criticalThresholds = {
      recovery: 30,    // Recovery below 30 is problematic
      resilience: 30,  // Some damage resistance is important
      mobility: 20,    // Basic movement needed
      discipline: 20,  // Some grenade regen helpful
      intellect: 20,   // Basic super regen
      strength: 10     // Least critical for most builds
    }

    return value < (criticalThresholds[statName] || 0)
  }

  getMinimumRecommended(statName) {
    const recommendations = {
      recovery: 70,     // Tier 7+ recovery recommended
      resilience: 50,   // Tier 5+ resilience helpful
      mobility: 50,     // Tier 5+ for movement
      discipline: 50,   // Tier 5+ for grenade uptime
      intellect: 50,    // Tier 5+ for super frequency
      strength: 30      // Tier 3+ sufficient for most
    }

    return recommendations[statName] || 50
  }

  /**
   * Calculate stat requirements for specific build goals
   */
  calculateStatRequirements(buildGoal) {
    const requirements = {
      primary: {},      // Must-have stats
      secondary: {},    // Nice-to-have stats
      tertiary: {},     // Optional stats
      constraints: {}   // Maximum/minimum constraints
    }

    const goal = buildGoal.toLowerCase()

    // PvP builds
    if (goal.includes('pvp') || goal.includes('crucible')) {
      requirements.primary = {
        mobility: { min: 70, target: 100, priority: 'high' },
        recovery: { min: 60, target: 80, priority: 'high' }
      }
      requirements.secondary = {
        resilience: { min: 40, target: 60, priority: 'medium' }
      }
      requirements.tertiary = {
        discipline: { min: 30, target: 50, priority: 'low' },
        intellect: { min: 30, target: 50, priority: 'low' }
      }
    }

    // Raid builds
    else if (goal.includes('raid')) {
      requirements.primary = {
        recovery: { min: 70, target: 100, priority: 'high' }
      }
      requirements.secondary = {
        intellect: { min: 50, target: 80, priority: 'medium' },
        discipline: { min: 50, target: 70, priority: 'medium' }
      }
      requirements.tertiary = {
        resilience: { min: 40, target: 60, priority: 'low' },
        mobility: { min: 30, target: 50, priority: 'low' }
      }
    }

    // Solo/Dungeon builds
    else if (goal.includes('solo') || goal.includes('dungeon')) {
      requirements.primary = {
        recovery: { min: 80, target: 100, priority: 'high' },
        resilience: { min: 60, target: 80, priority: 'high' }
      }
      requirements.secondary = {
        intellect: { min: 50, target: 70, priority: 'medium' }
      }
      requirements.tertiary = {
        discipline: { min: 40, target: 60, priority: 'low' },
        mobility: { min: 30, target: 50, priority: 'low' }
      }
    }

    // Ability spam builds
    else if (goal.includes('ability') || goal.includes('spam')) {
      requirements.primary = {
        discipline: { min: 80, target: 100, priority: 'high' },
        intellect: { min: 70, target: 100, priority: 'high' },
        strength: { min: 60, target: 100, priority: 'medium' }
      }
      requirements.secondary = {
        recovery: { min: 50, target: 70, priority: 'medium' }
      }
    }

    // Default balanced build
    else {
      requirements.primary = {
        recovery: { min: 60, target: 80, priority: 'high' }
      }
      requirements.secondary = {
        resilience: { min: 40, target: 60, priority: 'medium' },
        discipline: { min: 40, target: 60, priority: 'medium' },
        intellect: { min: 40, target: 60, priority: 'medium' }
      }
    }

    return requirements
  }

  /**
   * Find optimal stat distribution for given constraints
   */
  optimizeStatDistribution(totalStatPoints, requirements, constraints = {}) {
    const distribution = {
      mobility: 10,
      resilience: 10, 
      recovery: 10,
      discipline: 10,
      intellect: 10,
      strength: 10
    }

    let remainingPoints = totalStatPoints - 60 // Base 10 points per stat

    // Satisfy primary requirements first
    if (requirements.primary) {
      for (const [stat, req] of Object.entries(requirements.primary)) {
        const pointsNeeded = Math.max(0, req.target - distribution[stat])
        const pointsToAdd = Math.min(pointsNeeded, remainingPoints)
        
        distribution[stat] += pointsToAdd
        remainingPoints -= pointsToAdd
      }
    }

    // Then secondary requirements
    if (requirements.secondary && remainingPoints > 0) {
      for (const [stat, req] of Object.entries(requirements.secondary)) {
        const pointsNeeded = Math.max(0, req.target - distribution[stat])
        const pointsToAdd = Math.min(pointsNeeded, remainingPoints)
        
        distribution[stat] += pointsToAdd
        remainingPoints -= pointsToAdd
      }
    }

    // Distribute remaining points efficiently
    while (remainingPoints > 0) {
      let bestStat = null
      let bestValue = 0

      for (const [stat, value] of Object.entries(distribution)) {
        const tier = Math.floor(value / 10)
        const excess = value % 10
        
        // Prioritize completing tiers over starting new ones
        if (excess > 0 && tier < 10) {
          const pointsToTier = 10 - excess
          if (pointsToTier <= remainingPoints && pointsToTier > bestValue) {
            bestStat = stat
            bestValue = pointsToTier
          }
        }
      }

      if (bestStat) {
        distribution[bestStat] += bestValue
        remainingPoints -= bestValue
      } else {
        // No tier completions available, distribute evenly
        const statsUnder100 = Object.entries(distribution).filter(([stat, val]) => val < 100)
        if (statsUnder100.length > 0) {
          const targetStat = statsUnder100[0][0]
          distribution[targetStat] += Math.min(remainingPoints, 10)
          remainingPoints -= Math.min(remainingPoints, 10)
        } else {
          break // All stats maxed
        }
      }
    }

    // Calculate efficiency metrics
    const efficiency = this.calculateOverallEfficiency(distribution)
    const tierBreakdown = this.calculateTierBreakdown(distribution)

    return {
      distribution,
      efficiency,
      tierBreakdown,
      remainingPoints,
      totalTiers: Object.values(distribution).reduce((sum, val) => sum + Math.floor(val / 10), 0)
    }
  }

  calculateTierBreakdown(stats) {
    const breakdown = {}
    let totalTiers = 0

    for (const [statName, value] of Object.entries(stats)) {
      const tier = Math.floor(value / 10)
      const excess = value % 10
      
      breakdown[statName] = {
        tier,
        value,
        excess,
        isOptimal: excess === 0,
        efficiency: excess === 0 ? 1.0 : (10 - excess) / 10
      }
      
      totalTiers += tier
    }

    breakdown.summary = {
      totalTiers,
      averageTier: totalTiers / 6,
      tier10Count: Object.values(breakdown).filter(s => s.tier >= 10).length,
      tier8PlusCount: Object.values(breakdown).filter(s => s.tier >= 8).length
    }

    return breakdown
  }

  /**
   * Suggest armor pieces to reach stat targets
   */
  generateArmorRecommendations(targetStats, currentStats = null) {
    const recommendations = []

    // Calculate stat gaps
    const gaps = {}
    for (const [stat, target] of Object.entries(targetStats)) {
      const current = currentStats ? currentStats[stat] || 0 : 0
      gaps[stat] = Math.max(0, target - current)
    }

    // Sort stats by gap size (prioritize largest gaps)
    const sortedGaps = Object.entries(gaps)
      .filter(([stat, gap]) => gap > 0)
      .sort(([,a], [,b]) => b - a)

    for (const [stat, gap] of sortedGaps) {
      const tier = Math.floor(gap / 10)
      const excess = gap % 10

      recommendations.push({
        stat,
        pointsNeeded: gap,
        tiersNeeded: tier + (excess > 0 ? 1 : 0),
        priority: this.getStatPriority(stat),
        suggestions: this.getArmorPieceSuggestions(stat, gap)
      })
    }

    return recommendations
  }

  getStatPriority(statName) {
    const priorities = {
      recovery: 'very_high',
      resilience: 'high',
      mobility: 'high',
      discipline: 'medium',
      intellect: 'medium', 
      strength: 'low'
    }

    return priorities[statName] || 'medium'
  }

  getArmorPieceSuggestions(stat, pointsNeeded) {
    const suggestions = []

    // High stat armor pieces typically roll 20-25 in focused stats
    const piecesNeeded = Math.ceil(pointsNeeded / 20)
    
    suggestions.push(`Target ${piecesNeeded} high-${stat} armor pieces`)
    
    if (pointsNeeded >= 40) {
      suggestions.push(`Consider ${stat} mods to supplement armor stats`)
    }

    if (pointsNeeded >= 60) {
      suggestions.push(`Use multiple ${stat} armor mods and high-stat gear`)
    }

    return suggestions
  }

  /**
   * Compare stat distributions
   */
  compareStatDistributions(distributionA, distributionB) {
    const comparison = {
      differences: {},
      better: {},
      summary: {
        totalDifference: 0,
        tierDifference: 0,
        efficiencyComparison: null
      }
    }

    let totalDiff = 0
    let tierDiff = 0

    for (const stat of Object.keys(distributionA)) {
      const valueA = distributionA[stat] || 0
      const valueB = distributionB[stat] || 0
      const diff = valueA - valueB

      const tierA = Math.floor(valueA / 10)
      const tierB = Math.floor(valueB / 10)
      const tierDifference = tierA - tierB

      comparison.differences[stat] = {
        valueDifference: diff,
        tierDifference: tierDifference,
        better: diff > 0 ? 'A' : diff < 0 ? 'B' : 'equal'
      }

      totalDiff += Math.abs(diff)
      tierDiff += Math.abs(tierDifference)
    }

    comparison.summary.totalDifference = totalDiff
    comparison.summary.tierDifference = tierDiff

    // Calculate efficiency comparison
    const effA = this.calculateOverallEfficiency(distributionA)
    const effB = this.calculateOverallEfficiency(distributionB)
    
    comparison.summary.efficiencyComparison = {
      A: effA.efficiency,
      B: effB.efficiency,
      better: effA.efficiency > effB.efficiency ? 'A' : 'B'
    }

    return comparison
  }

  /**
   * Get stat recommendations for specific activities
   */
  getActivityStatRecommendations(activity) {
    const recommendations = {
      'pvp': {
        essential: ['mobility', 'recovery'],
        recommended: ['resilience'],
        optional: ['discipline', 'intellect'],
        avoid: ['strength'],
        description: 'Focus on movement and survivability for PvP success'
      },
      'raid': {
        essential: ['recovery'],
        recommended: ['intellect', 'discipline'],
        optional: ['resilience', 'mobility'],
        avoid: [],
        description: 'Prioritize survivability and ability uptime for raid encounters'
      },
      'dungeon': {
        essential: ['recovery', 'resilience'],
        recommended: ['intellect'],
        optional: ['discipline', 'mobility'],
        avoid: [],
        description: 'Maximum survivability for challenging solo content'
      },
      'general_pve': {
        essential: ['recovery'],
        recommended: ['discipline', 'intellect'],
        optional: ['resilience', 'mobility', 'strength'],
        avoid: [],
        description: 'Balanced approach suitable for most PvE activities'
      }
    }

    return recommendations[activity] || recommendations['general_pve']
  }

  /**
   * Convert between old and new stat systems
   */
  convertOldStatToNew(oldStatName) {
    const mapping = {
      'Mobility': 'mobility',
      'Resilience': 'resilience',
      'Recovery': 'recovery',
      'Intellect': 'intellect', 
      'Discipline': 'discipline',
      'Strength': 'strength'
    }
    
    return mapping[oldStatName] || oldStatName.toLowerCase()
  }

  // Utility methods
  isReady() {
    return this.isInitialized
  }

  getVersion() {
    return this.version
  }

  getCapabilities() {
    return {
      statCalculation: this.isInitialized,
      breakpointAnalysis: this.isInitialized,
      efficiencyCalculation: this.isInitialized,
      requirementGeneration: this.isInitialized,
      armorArchetypes: this.isInitialized,
      optimization: this.isInitialized
    }
  }

  // Static utility methods for external use
  static calculateStatTier(statValue) {
    return Math.floor(statValue / 10)
  }

  static calculateStatEfficiency(statValue) {
    const tier = Math.floor(statValue / 10)
    const excess = statValue % 10
    return excess === 0 ? 1.0 : (10 - excess) / 10
  }

  static getTotalTiers(statDistribution) {
    return Object.values(statDistribution).reduce((sum, val) => sum + Math.floor(val / 10), 0)
  }
}

// Export as default for backward compatibility
export default StatCalculator

// Utility functions for external use
export function calculateStatEffects(statName, value, isPvP = false) {
  const calculator = new StatCalculator()
  return calculator.calculateStatEffects(statName, value, isPvP)
}

export function calculateBuildStats(armorPieces, isPvP = false) {
  const calculator = new StatCalculator()
  return calculator.calculateBuildStats(armorPieces, isPvP)
}

export function getStatRequirements(buildGoal) {
  const calculator = new StatCalculator()
  return calculator.calculateStatRequirements(buildGoal)
}