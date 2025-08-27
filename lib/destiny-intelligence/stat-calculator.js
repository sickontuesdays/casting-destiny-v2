// lib/destiny-intelligence/stat-calculator.js
// Advanced stat calculation and optimization system

export class StatCalculator {
  constructor() {
    this.initialized = false
    this.statHashes = {
      mobility: 2996146975,
      resilience: 392767087,
      recovery: 1943323491,
      discipline: 1735777505,
      intellect: 144602215,
      strength: 4244567218
    }
    this.statEffects = {}
  }

  async initialize(manifestData) {
    try {
      console.log('🧮 Initializing Stat Calculator...')
      
      if (!manifestData) {
        throw new Error('Manifest data required for StatCalculator')
      }
      
      this.manifest = manifestData
      this._buildStatEffectsDatabase()
      
      this.initialized = true
      console.log('✅ Stat Calculator initialized successfully')
      return true
      
    } catch (error) {
      console.error('❌ Failed to initialize Stat Calculator:', error)
      this.initialized = false
      throw error
    }
  }

  _buildStatEffectsDatabase() {
    // Build comprehensive stat effects database
    this.statEffects = {
      mobility: {
        description: 'Walking and strafing speed, jump height, sprint speed',
        tiers: {
          1: 'Very slow movement',
          2: 'Slow movement', 
          3: 'Below average movement',
          4: 'Slightly slow movement',
          5: 'Average movement',
          6: 'Slightly fast movement',
          7: 'Above average movement',
          8: 'Fast movement',
          9: 'Very fast movement',
          10: 'Maximum movement speed'
        },
        breakpoints: [50, 80, 100], // Important PvP breakpoints
        pvpImportant: true
      },
      
      resilience: {
        description: 'Damage resistance and flinch reduction',
        tiers: {
          1: 'Very low damage resistance',
          2: 'Low damage resistance',
          3: 'Below average resistance', 
          4: 'Slightly low resistance',
          5: 'Average resistance',
          6: 'Slightly high resistance',
          7: 'Above average resistance',
          8: 'High resistance',
          9: 'Very high resistance',
          10: 'Maximum damage resistance'
        },
        breakpoints: [60, 100], // Important PvE breakpoints
        pveImportant: true
      },

      recovery: {
        description: 'Health regeneration speed',
        tiers: {
          1: 'Very slow health regen',
          2: 'Slow health regen',
          3: 'Below average regen',
          4: 'Slightly slow regen', 
          5: 'Average regen',
          6: 'Slightly fast regen',
          7: 'Above average regen',
          8: 'Fast regen',
          9: 'Very fast regen',
          10: 'Maximum health regeneration'
        },
        breakpoints: [70, 100],
        universallyImportant: true
      },

      discipline: {
        description: 'Grenade cooldown reduction',
        tiers: {
          1: 'Very slow grenade regen',
          2: 'Slow grenade regen',
          3: 'Below average grenade regen',
          4: 'Slightly slow grenade regen',
          5: 'Average grenade regen',
          6: 'Slightly fast grenade regen', 
          7: 'Above average grenade regen',
          8: 'Fast grenade regen',
          9: 'Very fast grenade regen',
          10: 'Maximum grenade regeneration'
        },
        breakpoints: [60, 100]
      },

      intellect: {
        description: 'Super ability cooldown reduction',
        tiers: {
          1: 'Very slow super regen',
          2: 'Slow super regen',
          3: 'Below average super regen',
          4: 'Slightly slow super regen',
          5: 'Average super regen',
          6: 'Slightly fast super regen',
          7: 'Above average super regen', 
          8: 'Fast super regen',
          9: 'Very fast super regen',
          10: 'Maximum super regeneration'
        },
        breakpoints: [70, 100]
      },

      strength: {
        description: 'Melee ability cooldown reduction',
        tiers: {
          1: 'Very slow melee regen',
          2: 'Slow melee regen',
          3: 'Below average melee regen',
          4: 'Slightly slow melee regen',
          5: 'Average melee regen', 
          6: 'Slightly fast melee regen',
          7: 'Above average melee regen',
          8: 'Fast melee regen',
          9: 'Very fast melee regen',
          10: 'Maximum melee regeneration'
        },
        breakpoints: [50, 100]
      }
    }
  }

  calculateStatEffects(statName, value, isPvP = false) {
    const tier = Math.floor(value / 10)
    const excess = value % 10
    const stat = this.statEffects[statName]
    
    if (!stat) {
      return {
        tier: 0,
        value: 0,
        effect: 'Unknown stat',
        efficiency: 0
      }
    }

    return {
      tier: Math.min(tier, 10),
      value,
      effect: stat.tiers[Math.min(tier, 10)] || stat.tiers[10],
      efficiency: excess === 0 ? 100 : Math.round(((10 - excess) / 10) * 100),
      wastedPoints: excess,
      description: stat.description,
      isImportantForPvP: isPvP && stat.pvpImportant,
      isImportantForPvE: !isPvP && (stat.pveImportant || stat.universallyImportant),
      nextTierCost: excess === 0 ? 10 : (10 - excess),
      nextTier: tier < 10 ? {
        tier: tier + 1,
        cost: (tier === 0 ? (10 - excess) : 0),
        effects: stat.tiers[Math.min(tier + 1, 10)]
      } : null
    }
  }

  optimizeStatDistribution(targetStats, constraints = {}) {
    const maxPoints = constraints.maxPoints || 600 // Typical max with masterworked armor
    const minTiers = constraints.minTiers || {}
    const maxTiers = constraints.maxTiers || {}
    
    const optimized = {}
    let remainingPoints = maxPoints

    // First pass: meet minimum requirements
    Object.entries(targetStats).forEach(([stat, target]) => {
      const minTier = minTiers[stat] || 0
      const minPoints = Math.max(minTier * 10, target)
      
      optimized[stat] = minPoints
      remainingPoints -= minPoints
    })

    // Second pass: optimize remaining points
    const priorities = Object.entries(targetStats)
      .sort(([,a], [,b]) => b - a) // Sort by priority (higher target = higher priority)

    while (remainingPoints > 0) {
      let improved = false
      
      for (const [stat, target] of priorities) {
        if (remainingPoints <= 0) break
        
        const current = optimized[stat] || 0
        const maxTier = maxTiers[stat] || 10
        
        if (current < target && current < (maxTier * 10)) {
          const needed = Math.min(10 - (current % 10), remainingPoints, target - current)
          optimized[stat] = current + needed
          remainingPoints -= needed
          improved = true
        }
      }
      
      if (!improved) break // No more improvements possible
    }

    return {
      distribution: optimized,
      totalPoints: maxPoints - remainingPoints,
      remainingPoints,
      efficiency: this.calculateDistributionEfficiency(optimized)
    }
  }

  calculateDistributionEfficiency(stats) {
    let totalWaste = 0
    let totalStats = 0

    Object.entries(stats).forEach(([stat, value]) => {
      const waste = value % 10
      totalWaste += waste
      totalStats += value
    })

    const efficiency = totalStats > 0 ? ((totalStats - totalWaste) / totalStats) * 100 : 0
    
    return {
      percentage: Math.round(efficiency),
      wastedPoints: totalWaste,
      recommendations: this.generateEfficiencyRecommendations(stats)
    }
  }

  generateEfficiencyRecommendations(stats) {
    const recommendations = []
    
    Object.entries(stats).forEach(([stat, value]) => {
      const tier = Math.floor(value / 10)
      const excess = value % 10
      
      if (excess > 5) {
        recommendations.push({
          stat,
          current: value,
          suggestion: `Add ${10 - excess} points to reach tier ${tier + 1}`,
          benefit: `Unlock next tier of ${stat} effects`
        })
      } else if (excess > 0 && excess <= 3) {
        recommendations.push({
          stat,
          current: value,
          suggestion: `Remove ${excess} points to optimize efficiency`,
          benefit: `Reallocate ${excess} wasted points to other stats`
        })
      }
    })

    return recommendations
  }

  compareStatBuilds(build1, build2, focusStats = []) {
    const stats1 = build1.stats || {}
    const stats2 = build2.stats || {}
    
    const comparison = {
      winner: null,
      differences: {},
      focusComparison: {},
      recommendation: ''
    }

    let build1Score = 0
    let build2Score = 0

    // Compare each stat
    Object.keys(this.statHashes).forEach(stat => {
      const value1 = stats1[stat] || 0
      const value2 = stats2[stat] || 0
      const tier1 = Math.floor(value1 / 10)
      const tier2 = Math.floor(value2 / 10)
      
      comparison.differences[stat] = {
        build1: { value: value1, tier: tier1 },
        build2: { value: value2, tier: tier2 },
        advantage: tier1 > tier2 ? 'build1' : tier2 > tier1 ? 'build2' : 'tie'
      }

      // Score builds based on tier differences
      if (tier1 > tier2) build1Score += tier1 - tier2
      else if (tier2 > tier1) build2Score += tier2 - tier1
    })

    // Give extra weight to focus stats
    focusStats.forEach(stat => {
      const diff = comparison.differences[stat]
      if (diff && diff.advantage !== 'tie') {
        const tierDiff = Math.abs(diff.build1.tier - diff.build2.tier)
        if (diff.advantage === 'build1') build1Score += tierDiff * 2
        else build2Score += tierDiff * 2
      }
      
      comparison.focusComparison[stat] = diff
    })

    // Determine winner
    if (build1Score > build2Score) {
      comparison.winner = 'build1'
      comparison.recommendation = `Build 1 is better overall (score: ${build1Score} vs ${build2Score})`
    } else if (build2Score > build1Score) {
      comparison.winner = 'build2'
      comparison.recommendation = `Build 2 is better overall (score: ${build2Score} vs ${build1Score})`
    } else {
      comparison.winner = 'tie'
      comparison.recommendation = 'Both builds are roughly equivalent'
    }

    return comparison
  }

  isInitialized() {
    return this.initialized
  }
}