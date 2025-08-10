import { BuildIntelligence } from './destiny-intelligence/build-intelligence'
import { SynergyEngine } from './destiny-intelligence/synergy-engine'
import { StatCalculator } from './destiny-intelligence/stat-calculator'

export class EnhancedBuildScorer {
  constructor() {
    this.manifest = null
    this.buildIntelligence = null
    this.synergyEngine = null
    this.statCalculator = null
    this.isInitialized = false
  }

  async initialize(manifest, buildIntelligenceInstance = null) {
    if (this.isInitialized) return

    if (!manifest) {
      throw new Error('Manifest data is required for EnhancedBuildScorer initialization')
    }

    this.manifest = manifest

    try {
      console.log('Initializing Enhanced Build Scorer...')

      // Use provided build intelligence or create new one
      if (buildIntelligenceInstance) {
        this.buildIntelligence = buildIntelligenceInstance
      } else {
        this.buildIntelligence = new BuildIntelligence()
        await this.buildIntelligence.initialize(manifest)
      }

      // Initialize synergy engine
      this.synergyEngine = new SynergyEngine()
      await this.synergyEngine.initialize(manifest)

      // Initialize stat calculator
      this.statCalculator = new StatCalculator()
      await this.statCalculator.initialize(manifest)

      this.isInitialized = true
      console.log('Enhanced Build Scorer initialized successfully')

    } catch (error) {
      console.error('Failed to initialize Enhanced Build Scorer:', error)
      throw new Error(`Enhanced Build Scorer initialization failed: ${error.message}`)
    }
  }

  async scoreBuild(build, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Enhanced Build Scorer not initialized. Call initialize() first.')
    }

    const {
      request = null,
      analysis = null,
      includeAlternatives = false,
      includeOptimizations = true,
      activityType = 'general',
      userPreferences = {}
    } = options

    try {
      // Calculate base scores
      const baseScore = this.calculateBaseScore(build)
      
      // Calculate synergy bonuses
      const synergyScore = await this.calculateSynergyScore(build)
      
      // Calculate stat optimization score
      const statScore = this.calculateStatScore(build, activityType)
      
      // Calculate activity-specific bonuses
      const activityScore = this.calculateActivityScore(build, activityType)

      // Total score calculation
      const totalScore = Math.round(
        baseScore * 0.3 + 
        synergyScore * 0.3 + 
        statScore * 0.25 + 
        activityScore * 0.15
      )

      // Generate detailed breakdown
      const breakdown = {
        base: { score: baseScore, weight: 0.3, description: 'Item quality and rarity' },
        synergy: { score: synergyScore, weight: 0.3, description: 'Item synergies and interactions' },
        stats: { score: statScore, weight: 0.25, description: 'Stat distribution and optimization' },
        activity: { score: activityScore, weight: 0.15, description: 'Activity-specific effectiveness' }
      }

      // Identify strengths and weaknesses
      const strengths = this.identifyStrengths(breakdown, build)
      const weaknesses = this.identifyWeaknesses(breakdown, build)

      // Generate optimization suggestions
      const suggestions = includeOptimizations ? 
        await this.generateOptimizationSuggestions(build, breakdown, activityType) : []

      // Generate alternatives if requested
      const alternatives = includeAlternatives ? 
        await this.generateAlternatives(build, totalScore, activityType) : []

      return {
        totalScore,
        breakdown,
        strengths,
        weaknesses,
        suggestions,
        alternatives,
        metadata: {
          scoringMethod: 'enhanced',
          activityType,
          generatedAt: new Date().toISOString(),
          manifestVersion: this.manifest?.version || 'unknown'
        }
      }

    } catch (error) {
      console.error('Error in enhanced build scoring:', error)
      throw new Error(`Enhanced build scoring failed: ${error.message}`)
    }
  }

  calculateBaseScore(build) {
    let score = 0
    let itemCount = 0

    // Score each equipment slot
    const slots = ['helmet', 'arms', 'chest', 'legs', 'class', 'kinetic', 'energy', 'power']
    
    for (const slot of slots) {
      const item = build[slot]
      if (item && item.hash) {
        const itemData = this.manifest?.data?.DestinyInventoryItemDefinition?.[item.hash]
        if (itemData) {
          // Base scoring by tier/rarity
          const tierType = itemData.inventory?.tierType
          if (tierType === 6) score += 90 // Exotic
          else if (tierType === 5) score += 70 // Legendary
          else if (tierType === 4) score += 50 // Rare
          else score += 30

          itemCount++
        }
      }
    }

    return itemCount > 0 ? Math.round(score / itemCount) : 0
  }

  async calculateSynergyScore(build) {
    if (!this.synergyEngine) return 50

    try {
      const synergies = await this.synergyEngine.findSynergies(build)
      
      let synergyScore = 50 // Base score
      let positiveBonus = 0
      let negativeBonus = 0

      for (const synergy of synergies) {
        if (synergy.strength === 'strong') {
          positiveBonus += synergy.impact === 'major' ? 15 : 10
        } else if (synergy.strength === 'moderate') {
          positiveBonus += synergy.impact === 'major' ? 8 : 5
        } else if (synergy.strength === 'weak') {
          positiveBonus += 3
        }

        // Check for conflicts
        if (synergy.type === 'conflict') {
          negativeBonus -= synergy.severity === 'high' ? 20 : 10
        }
      }

      return Math.max(0, Math.min(100, synergyScore + positiveBonus + negativeBonus))

    } catch (error) {
      console.warn('Error calculating synergy score:', error)
      return 50
    }
  }

  calculateStatScore(build, activityType) {
    if (!this.statCalculator) return 50

    try {
      const stats = this.statCalculator.calculateBuildStats(build)
      
      // Define optimal stat distributions for different activities using new stat names
      const optimalDistributions = {
        pvp: { weapons: 180, health: 100, class: 70, super: 40, grenade: 60, melee: 40 },
        raid: { weapons: 120, health: 100, class: 100, super: 60, grenade: 100, melee: 50 },
        grandmaster: { weapons: 100, health: 150, class: 100, super: 40, grenade: 70, melee: 40 },
        general: { weapons: 120, health: 120, class: 120, super: 80, grenade: 80, melee: 60 }
      }

      const target = optimalDistributions[activityType] || optimalDistributions.general
      let score = 0
      let statCount = 0

      for (const [statName, targetValue] of Object.entries(target)) {
        const currentValue = stats.totalStats?.[statName] || 0
        const efficiency = Math.min(100, (currentValue / targetValue) * 100)
        score += efficiency
        statCount++
      }

      return statCount > 0 ? Math.round(score / statCount) : 50

    } catch (error) {
      console.warn('Error calculating stat score:', error)
      return 50
    }
  }

  calculateActivityScore(build, activityType) {
    // Activity-specific scoring logic
    let score = 50 // Base score

    try {
      // Check for activity-appropriate exotics
      const exotic = this.findExoticInBuild(build)
      if (exotic) {
        const isOptimalForActivity = this.isExoticOptimalForActivity(exotic, activityType)
        if (isOptimalForActivity) score += 20
        else if (this.isExoticViableForActivity(exotic, activityType)) score += 10
        else score -= 10
      }

      // Check for appropriate weapon types
      const weaponScore = this.calculateWeaponAppropriatenessScore(build, activityType)
      score += weaponScore

      return Math.max(0, Math.min(100, score))

    } catch (error) {
      console.warn('Error calculating activity score:', error)
      return 50
    }
  }

  findExoticInBuild(build) {
    const slots = ['helmet', 'arms', 'chest', 'legs', 'class', 'kinetic', 'energy', 'power']
    
    for (const slot of slots) {
      const item = build[slot]
      if (item && item.hash) {
        const itemData = this.manifest?.data?.DestinyInventoryItemDefinition?.[item.hash]
        if (itemData && itemData.inventory?.tierType === 6) {
          return { slot, item, data: itemData }
        }
      }
    }
    return null
  }

  isExoticOptimalForActivity(exotic, activityType) {
    // Simplified activity optimization check
    const exoticName = exotic.data?.displayProperties?.name?.toLowerCase() || ''
    
    if (activityType === 'pvp') {
      return exoticName.includes('dragon') || exoticName.includes('stompees') || 
             exoticName.includes('transversive') || exoticName.includes('ophidian')
    } else if (activityType === 'grandmaster') {
      return exoticName.includes('loreley') || exoticName.includes('omnioculus') ||
             exoticName.includes('contraverse') || exoticName.includes('phoenix')
    }
    
    return false
  }

  isExoticViableForActivity(exotic, activityType) {
    // Check if exotic is at least viable for the activity
    const exoticName = exotic.data?.displayProperties?.name?.toLowerCase() || ''
    
    // Most exotics are viable for general PvE
    if (activityType === 'general' || activityType === 'raid') return true
    
    // PvP viability check (exclude pure PvE exotics)
    if (activityType === 'pvp') {
      const pveOnlyExotics = ['loreley', 'omnioculus', 'cuirass', 'falling star']
      return !pveOnlyExotics.some(name => exoticName.includes(name))
    }
    
    return true
  }

  calculateWeaponAppropriatenessScore(build, activityType) {
    // Simplified weapon appropriateness scoring
    let score = 0
    
    // Check weapon types against activity requirements
    const weapons = [build.kinetic, build.energy, build.power].filter(w => w)
    
    if (activityType === 'grandmaster') {
      // Prefer long-range, safe weapons
      score += weapons.filter(w => this.isLongRangeWeapon(w)).length * 5
    } else if (activityType === 'pvp') {
      // Prefer meta PvP weapons
      score += weapons.filter(w => this.isPvPMetaWeapon(w)).length * 5
    }
    
    return Math.min(20, score)
  }

  isLongRangeWeapon(weapon) {
    if (!weapon || !weapon.hash) return false
    const weaponData = this.manifest?.data?.DestinyInventoryItemDefinition?.[weapon.hash]
    const weaponType = weaponData?.itemSubType
    
    // Scout rifles, sniper rifles, linear fusion rifles
    return weaponType === 6 || weaponType === 9 || weaponType === 22
  }

  isPvPMetaWeapon(weapon) {
    if (!weapon || !weapon.hash) return false
    const weaponData = this.manifest?.data?.DestinyInventoryItemDefinition?.[weapon.hash]
    const weaponType = weaponData?.itemSubType
    
    // Hand cannons, pulse rifles, shotguns, fusion rifles
    return weaponType === 7 || weaponType === 8 || weaponType === 11 || weaponType === 12
  }

  identifyStrengths(breakdown, build) {
    const strengths = []
    
    for (const [category, data] of Object.entries(breakdown)) {
      if (data.score >= 75) {
        strengths.push({
          category,
          score: data.score,
          description: data.description,
          impact: 'high'
        })
      }
    }
    
    return strengths
  }

  identifyWeaknesses(breakdown, build) {
    const weaknesses = []
    
    for (const [category, data] of Object.entries(breakdown)) {
      if (data.score <= 40) {
        weaknesses.push({
          category,
          score: data.score,
          description: data.description,
          severity: data.score <= 25 ? 'high' : 'moderate'
        })
      }
    }
    
    return weaknesses
  }

  async generateOptimizationSuggestions(build, breakdown, activityType) {
    const suggestions = []
    
    try {
      // Stat optimization suggestions
      if (breakdown.stats.score < 60) {
        suggestions.push({
          type: 'stat_optimization',
          priority: 'high',
          description: 'Consider optimizing stat distribution for better performance',
          specific: 'Focus on reaching key stat breakpoints (60, 70, 100)',
          expectedImprovement: '15-25 point score increase'
        })
      }

      // Synergy improvement suggestions
      if (breakdown.synergy.score < 50) {
        suggestions.push({
          type: 'synergy_improvement',
          priority: 'high',
          description: 'Items lack synergy - consider builds with better item interactions',
          specific: 'Look for items that enhance the same damage types or abilities',
          expectedImprovement: '20-30 point score increase'
        })
      }

      // Activity-specific suggestions
      if (breakdown.activity.score < 60) {
        suggestions.push({
          type: 'activity_optimization',
          priority: 'medium',
          description: `Build not optimized for ${activityType}`,
          specific: `Consider ${activityType}-appropriate exotic armor and weapons`,
          expectedImprovement: '10-20 point score increase'
        })
      }

      return suggestions

    } catch (error) {
      console.warn('Error generating optimization suggestions:', error)
      return []
    }
  }

  async generateAlternatives(build, currentScore, activityType) {
    // This would generate alternative builds
    // For now, return placeholder data
    return []
  }

  // Utility methods
  isReady() {
    return this.isInitialized
  }

  getVersion() {
    return '2.0.0'
  }

  getCapabilities() {
    return {
      enhanced: this.isInitialized,
      synergies: this.isInitialized && this.synergyEngine !== null,
      stats: this.isInitialized && this.statCalculator !== null,
      intelligence: this.isInitialized && this.buildIntelligence !== null,
      activities: this.isInitialized
    }
  }
}

// Export as default for backward compatibility
export default EnhancedBuildScorer