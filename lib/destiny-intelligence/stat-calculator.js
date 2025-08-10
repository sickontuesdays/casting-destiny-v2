export class StatCalculator {
  constructor() {
    this.manifest = null
    this.isInitialized = false
    
    // New Armor 3.0 stat definitions from Edge of Fate
    this.statDefinitions = {
      weapons: {
        name: 'Weapons',
        primary: {
          range: [0, 100],
          effects: {
            reloadSpeed: { max: 10, unit: '%' },
            handling: { max: 10, unit: '%' },
            primaryDamage: { max: 15, unit: '%' },
            specialDamage: { max: 15, unit: '%' },
            heavyDamage: { max: 10, unit: '%' }
          }
        },
        secondary: {
          range: [101, 200],
          effects: {
            bossDamage: { max: 10, unit: '%' },
            guardianDamage: { max: 6, unit: '%' },
            doubleAmmoChance: { max: 100, unit: '%' }
          }
        }
      },
      
      health: {
        name: 'Health',
        primary: {
          range: [0, 100],
          effects: {
            flinchResistance: { max: 10, unit: '%' },
            orbHealing: { max: 70, unit: 'HP' }
          }
        },
        secondary: {
          range: [101, 200],
          effects: {
            shieldCapacity: { max: 20, unit: 'HP', pveOnly: true },
            shieldRechargeRate: { max: 45, unit: '%' }
          }
        }
      },
      
      class: {
        name: 'Class',
        primary: {
          range: [0, 100],
          effects: {
            cooldownReduction: { max: 65, unit: '%' },
            energyGained: { max: 190, unit: '%' }
          }
        },
        secondary: {
          range: [101, 200],
          effects: {
            overshieldPvE: { max: 40, unit: 'HP' },
            overshieldPvP: { max: 20, unit: 'HP' }
          }
        }
      },
      
      super: {
        name: 'Super',
        primary: {
          range: [0, 100],
          effects: {
            energyGained: { max: 190, unit: '%' }
          }
        },
        secondary: {
          range: [101, 200],
          effects: {
            superDamagePvE: { max: 45, unit: '%' },
            superDamagePvP: { max: 15, unit: '%' }
          }
        }
      },
      
      grenade: {
        name: 'Grenade',
        primary: {
          range: [0, 100],
          effects: {
            cooldownReduction: { max: 65, unit: '%' },
            energyGained: { max: 190, unit: '%' }
          }
        },
        secondary: {
          range: [101, 200],
          effects: {
            grenadeDamagePvE: { max: 65, unit: '%' },
            grenadeDamagePvP: { max: 20, unit: '%' }
          }
        }
      },
      
      melee: {
        name: 'Melee',
        primary: {
          range: [0, 100],
          effects: {
            cooldownReduction: { max: 65, unit: '%' },
            energyGained: { max: 190, unit: '%' }
          }
        },
        secondary: {
          range: [101, 200],
          effects: {
            meleeDamagePvE: { max: 30, unit: '%' },
            meleeDamagePvP: { max: 20, unit: '%' }
          }
        }
      }
    }

    // Stat hash mappings for manifest data
    this.statHashMappings = {
      2996146975: 'weapons',    // Mobility -> Weapons
      392767087: 'health',      // Resilience -> Health  
      1943323491: 'class',      // Recovery -> Class
      1735777505: 'super',      // Intellect -> Super
      144602215: 'grenade',     // Discipline -> Grenade
      4244567218: 'melee'       // Strength -> Melee
    }

    // Armor archetype definitions
    this.armorArchetypes = {
      bulwark: { primary: 'health', secondary: 'class', focus: 'defensive' },
      gunner: { primary: 'weapons', secondary: 'grenade', focus: 'damage' },
      specialist: { primary: 'class', secondary: 'weapons', focus: 'utility' },
      paragon: { primary: 'super', secondary: 'melee', focus: 'abilities' },
      brawler: { primary: 'melee', secondary: 'health', focus: 'melee' },
      grenadier: { primary: 'grenade', secondary: 'super', focus: 'grenades' }
    }
  }

  async initialize(manifest) {
    if (this.isInitialized) return

    if (!manifest) {
      throw new Error('Manifest data is required for StatCalculator initialization')
    }

    this.manifest = manifest

    try {
      console.log('Initializing Stat Calculator...')

      // Process stat definitions from manifest if needed
      await this.processStatDefinitions()

      this.isInitialized = true
      console.log('Stat Calculator initialized successfully')

    } catch (error) {
      console.error('Failed to initialize Stat Calculator:', error)
      throw new Error(`Stat Calculator initialization failed: ${error.message}`)
    }
  }

  async processStatDefinitions() {
    try {
      const statDefs = this.manifest?.data?.DestinyStatDefinition
      if (statDefs) {
        // Update stat definitions with manifest data if needed
        console.log('Processed stat definitions from manifest')
      }
    } catch (error) {
      console.warn('Error processing stat definitions:', error)
    }
  }

  /**
   * Calculate effects for a specific stat value
   * @param {string} statName - The stat name
   * @param {number} value - The stat value (0-200)
   * @param {boolean} isPvP - Whether this is for PvP content
   * @returns {Object} Calculated effects and metadata
   */
  calculateStatEffects(statName, value, isPvP = false) {
    const stat = this.statDefinitions[statName.toLowerCase()]
    if (!stat) {
      return { error: `Unknown stat: ${statName}` }
    }

    const clampedValue = Math.max(0, Math.min(200, value))
    const effects = {}

    // Calculate primary effects (0-100)
    if (clampedValue <= 100) {
      Object.entries(stat.primary.effects).forEach(([effectName, config]) => {
        if (isPvP && config.pveOnly) return
        
        effects[effectName] = this.linearScale(clampedValue, 0, 100, 0, config.max)
      })
    } else {
      // Max primary effects at 100
      Object.entries(stat.primary.effects).forEach(([effectName, config]) => {
        if (isPvP && config.pveOnly) return
        effects[effectName] = config.max
      })

      // Calculate secondary effects (101-200)
      const secondaryValue = clampedValue - 100
      Object.entries(stat.secondary.effects).forEach(([effectName, config]) => {
        const baseName = effectName.replace(/(PvE|PvP)$/, '')
        
        if (isPvP && effectName.endsWith('PvP')) {
          effects[baseName] = this.linearScale(secondaryValue, 1, 100, 0, config.max)
        } else if (!isPvP && effectName.endsWith('PvE')) {
          effects[baseName] = this.linearScale(secondaryValue, 1, 100, 0, config.max)
        } else if (!effectName.endsWith('PvE') && !effectName.endsWith('PvP')) {
          effects[effectName] = this.linearScale(secondaryValue, 1, 100, 0, config.max)
        }
      })
    }

    return {
      statName,
      value: clampedValue,
      tier: this.getStatTier(clampedValue),
      effects,
      breakpointReached: clampedValue >= 100,
      efficiency: this.calculateStatEfficiency(clampedValue),
      nextBreakpoint: clampedValue < 100 ? 100 : clampedValue < 200 ? 200 : null
    }
  }

  /**
   * Calculate total build stats from armor pieces
   * @param {Array|Object} armorPieces - Array of armor pieces or build object
   * @param {boolean} isPvP - Whether this is for PvP
   * @returns {Object} Complete build stat analysis
   */
  calculateBuildStats(armorPieces, isPvP = false) {
    const totalStats = {
      weapons: 0, health: 0, class: 0,
      super: 0, grenade: 0, melee: 0
    }

    const armorBreakdown = []

    // Handle both array of armor pieces and build object
    let pieces = armorPieces
    if (!Array.isArray(armorPieces)) {
      // Extract armor pieces from build object
      pieces = [
        armorPieces.helmet,
        armorPieces.arms, 
        armorPieces.chest,
        armorPieces.legs,
        armorPieces.class
      ].filter(piece => piece && piece.hash)
    }

    // Sum stats from all armor pieces
    pieces.forEach(armor => {
      if (!armor) return

      const armorStats = this.parseArmorStats(armor)
      armorBreakdown.push({
        slot: this.determineArmorSlot(armor),
        name: armor.displayProperties?.name || armor.name || 'Unknown',
        stats: armorStats,
        archetype: this.inferArchetype(armorStats),
        tier: this.calculateArmorTier(armorStats)
      })

      // Add to totals
      Object.entries(armorStats).forEach(([statName, value]) => {
        if (totalStats.hasOwnProperty(statName)) {
          totalStats[statName] += value
        }
      })
    })

    // Calculate effects for each stat
    const statEffects = {}
    const statBreakdowns = {}
    
    Object.entries(totalStats).forEach(([statName, totalValue]) => {
      const analysis = this.calculateStatEffects(statName, totalValue, isPvP)
      statEffects[statName] = analysis.effects
      statBreakdowns[statName] = analysis
    })

    return {
      totalStats,
      statEffects,
      statBreakdowns,
      armorBreakdown,
      buildScore: this.calculateBuildScore(totalStats),
      recommendations: this.generateStatRecommendations(totalStats, statBreakdowns),
      efficiency: this.calculateOverallEfficiency(totalStats),
      breakpointsReached: this.countBreakpoints(statBreakdowns)
    }
  }

  /**
   * Parse armor stats from item data
   * @param {Object} armor - Armor item data
   * @returns {Object} Parsed stats object
   */
  parseArmorStats(armor) {
    const stats = {
      weapons: 0, health: 0, class: 0,
      super: 0, grenade: 0, melee: 0
    }

    // Try investmentStats first (most reliable)
    if (armor.investmentStats) {
      armor.investmentStats.forEach(stat => {
        const statName = this.statHashMappings[stat.statTypeHash]
        if (statName && stats.hasOwnProperty(statName)) {
          stats[statName] = stat.value || 0
        }
      })
    }

    // Fallback to stats object
    if (armor.stats?.stats) {
      Object.entries(armor.stats.stats).forEach(([hash, statData]) => {
        const statName = this.statHashMappings[parseInt(hash)]
        if (statName && stats.hasOwnProperty(statName)) {
          stats[statName] = statData.value || 0
        }
      })
    }

    // Handle simplified stat objects that might already use new names
    if (armor.stats && !armor.stats.stats) {
      Object.entries(armor.stats).forEach(([statName, value]) => {
        if (stats.hasOwnProperty(statName.toLowerCase())) {
          stats[statName.toLowerCase()] = value || 0
        }
      })
    }

    return stats
  }

  /**
   * Calculate requirements for specific build goals
   * @param {Object} buildGoal - Build goal parameters
   * @returns {Object} Required stat distributions
   */
  calculateStatRequirements(buildGoal) {
    const requirements = {
      weapons: 0, health: 0, class: 0,
      super: 0, grenade: 0, melee: 0
    }

    const goalType = buildGoal.type || buildGoal.name?.toLowerCase()

    switch (goalType) {
      case 'dps':
      case 'high dps':
        requirements.weapons = 150
        requirements.super = 100
        requirements.grenade = 70
        break
        
      case 'ability_spam':
      case 'ability spam':
        requirements.grenade = 180
        requirements.melee = 100
        requirements.class = 70
        break
        
      case 'survivability':
      case 'tank':
        requirements.health = 150
        requirements.class = 100
        requirements.weapons = 70
        break
        
      case 'pvp':
      case 'pvp optimized':
        requirements.weapons = 180
        requirements.health = 100
        requirements.class = 70
        break
        
      case 'support':
      case 'team support':
        requirements.class = 180
        requirements.grenade = 150
        requirements.super = 100
        break
        
      default:
        // Balanced approach
        requirements.weapons = 120
        requirements.health = 120
        requirements.class = 120
    }

    return requirements
  }

  /**
   * Helper methods
   */
  
  linearScale(value, inMin, inMax, outMin, outMax) {
    const clamped = Math.max(inMin, Math.min(inMax, value))
    return outMin + (clamped - inMin) * (outMax - outMin) / (inMax - inMin)
  }

  getStatTier(value) {
    return Math.floor(value / 20)
  }

  calculateStatEfficiency(value) {
    if (value <= 100) {
      return value / 100
    } else {
      const primary = 1.0
      const secondary = (value - 100) / 100
      return (primary + secondary * 0.8) / 1.8 // Secondary effects are 80% as valuable
    }
  }

  calculateBuildScore(totalStats) {
    let score = 0
    let statCount = 0

    Object.values(totalStats).forEach(value => {
      if (value > 0) {
        const efficiency = this.calculateStatEfficiency(value)
        const breakpointBonus = value >= 100 ? 20 : 0
        const secondaryBonus = value >= 200 ? 10 : 0
        
        score += (efficiency * 70) + breakpointBonus + secondaryBonus
        statCount++
      }
    })

    return statCount > 0 ? Math.round(score / statCount) : 0
  }

  generateStatRecommendations(totalStats, statBreakdowns) {
    const recommendations = []

    Object.entries(totalStats).forEach(([statName, value]) => {
      // Recommend reaching 100 breakpoint
      if (value > 70 && value < 100) {
        recommendations.push({
          type: 'breakpoint',
          stat: statName,
          message: `Add ${100 - value} more ${statName} to reach secondary effects`,
          priority: 'high',
          pointsNeeded: 100 - value
        })
      }

      // Recommend efficiency improvements
      if (value > 100 && value < 140) {
        recommendations.push({
          type: 'efficiency',
          stat: statName,
          message: `${statName} at ${value} could push to 150+ for better secondary effects`,
          priority: 'medium',
          pointsNeeded: 150 - value
        })
      }

      // Flag wasted points
      if (value > 200) {
        recommendations.push({
          type: 'waste',
          stat: statName,
          message: `${value - 200} wasted points in ${statName} (cap is 200)`,
          priority: 'high',
          wastedPoints: value - 200
        })
      }
    })

    return recommendations
  }

  calculateOverallEfficiency(totalStats) {
    const values = Object.values(totalStats).filter(v => v > 0)
    if (values.length === 0) return 0

    const avgEfficiency = values.reduce((sum, value) => {
      return sum + this.calculateStatEfficiency(value)
    }, 0) / values.length

    return avgEfficiency
  }

  countBreakpoints(statBreakdowns) {
    return Object.values(statBreakdowns).filter(breakdown => 
      breakdown.breakpointReached
    ).length
  }

  determineArmorSlot(armor) {
    const bucketHash = armor.inventory?.bucketTypeHash
    const slotMap = {
      3448274439: 'helmet',
      3551918588: 'arms', 
      14239492: 'chest',
      20886954: 'legs',
      1585787867: 'classItem'
    }
    return slotMap[bucketHash] || 'unknown'
  }

  inferArchetype(armorStats) {
    let bestArchetype = 'unknown'
    let bestScore = 0

    Object.entries(this.armorArchetypes).forEach(([archetype, config]) => {
      const primaryValue = armorStats[config.primary] || 0
      const secondaryValue = armorStats[config.secondary] || 0
      const score = (primaryValue * 2) + secondaryValue

      if (score > bestScore) {
        bestScore = score
        bestArchetype = archetype
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

  /**
   * Convert old stat names to new system
   * @param {string} oldStatName - Old stat name
   * @returns {string} New stat name
   */
  convertOldStatToNew(oldStatName) {
    const mapping = {
      'Mobility': 'weapons',
      'Resilience': 'health',
      'Recovery': 'class',
      'Intellect': 'super', 
      'Discipline': 'grenade',
      'Strength': 'melee'
    }
    
    return mapping[oldStatName] || oldStatName.toLowerCase()
  }

  // Utility methods
  isReady() {
    return this.isInitialized
  }

  getVersion() {
    return '1.0.0'
  }

  getCapabilities() {
    return {
      statCalculation: this.isInitialized,
      breakpointAnalysis: this.isInitialized,
      efficiencyCalculation: this.isInitialized,
      requirementGeneration: this.isInitialized,
      armorArchetypes: this.isInitialized
    }
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