import { EnhancedBuildScorer } from './enhanced-build-scorer'
import { BuildIntelligence } from './destiny-intelligence/build-intelligence'
import { SynergyEngine } from './destiny-intelligence/synergy-engine'
import { StatCalculator } from './destiny-intelligence/stat-calculator'

class BuildScorer {
  constructor() {
    this.enhancedScorer = null
    this.buildIntelligence = null
    this.synergyEngine = null
    this.statCalculator = null
    this.isInitialized = false
    this.manifest = null
  }

  async initialize(manifest) {
    if (this.isInitialized) return

    if (!manifest) {
      throw new Error('Manifest data is required for build scoring')
    }

    this.manifest = manifest

    try {
      console.log('Initializing intelligence-powered build scorer...')

      // Initialize all intelligence components
      this.enhancedScorer = new EnhancedBuildScorer()
      await this.enhancedScorer.initialize(manifest)

      this.buildIntelligence = new BuildIntelligence()
      await this.buildIntelligence.initialize(manifest)

      this.synergyEngine = new SynergyEngine()
      await this.synergyEngine.initialize(manifest)

      this.statCalculator = new StatCalculator()
      await this.statCalculator.initialize(manifest)

      this.isInitialized = true
      
      console.log('Intelligence-powered build scorer initialized successfully')
    } catch (error) {
      console.error('Failed to initialize build scorer:', error)
      throw new Error(`Build scorer initialization failed: ${error.message}`)
    }
  }

  async scoreBuild(build, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Build scorer not initialized. Call initialize() first.')
    }

    const {
      request = null,
      includeAlternatives = false,
      includeOptimizations = true,
      activityType = 'general',
      userPreferences = {}
    } = options

    try {
      // Use enhanced scorer for comprehensive analysis
      const enhancedScore = await this.enhancedScorer.scoreBuild(build, {
        request,
        analysis: build.analysis,
        includeAlternatives,
        includeOptimizations,
        activityType,
        userPreferences
      })

      // Add intelligence-based insights
      const intelligenceInsights = await this.generateIntelligenceInsights(build, request, activityType)

      return {
        ...enhancedScore,
        intelligence: intelligenceInsights,
        scoringMethod: 'intelligence',
        version: '2.0',
        generatedAt: new Date().toISOString()
      }

    } catch (error) {
      console.error('Error scoring build:', error)
      throw new Error(`Build scoring failed: ${error.message}`)
    }
  }

  async generateIntelligenceInsights(build, request, activityType) {
    const insights = {
      synergies: [],
      conflicts: [],
      recommendations: [],
      optimizations: []
    }

    try {
      // Generate synergy analysis
      if (this.synergyEngine) {
        insights.synergies = await this.synergyEngine.findSynergies(build)
      }

      // Generate activity-specific recommendations
      insights.recommendations = await this.generateActivityRecommendations(build, activityType)

      // Generate exotic recommendations
      const exoticRecommendations = await this.generateExoticRecommendations(build, activityType)
      insights.recommendations.push(...exoticRecommendations)

      return insights

    } catch (error) {
      console.warn('Error generating intelligence insights:', error)
      return insights
    }
  }

  async generateBuild(request, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Build scorer not initialized. Call initialize() first.')
    }

    try {
      return await this.buildIntelligence.generateBuild(request, options)
    } catch (error) {
      console.error('Error generating build:', error)
      throw new Error(`Build generation failed: ${error.message}`)
    }
  }

  getActivityBreakpoints(activityType) {
    // Updated to use new Armor 3.0 stat names
    const breakpoints = {
      pvp: {
        weapons: [150, 180],
        health: [100, 150],
        class: [70, 100],
        super: [70, 100]
      },
      pve: {
        health: [100],
        class: [60, 100],
        grenade: [70, 100],
        melee: [50, 100]
      },
      raid: {
        health: [100],
        class: [70],
        grenade: [70, 100],
        super: [60]
      },
      gm: {
        health: [100],
        class: [100],
        grenade: [70],
        weapons: [50]
      },
      general: {
        health: [60, 100],
        class: [50, 100],
        grenade: [50, 100]
      }
    }

    return breakpoints[activityType] || breakpoints.general
  }

  async generateActivityRecommendations(build, activityType) {
    const recommendations = []

    try {
      // Get activity-specific stat priorities
      const statRequirements = this.statCalculator.calculateStatRequirements({ type: activityType })
      const currentStats = await this.statCalculator.calculateBuildStats(build)

      // Check if build meets activity requirements using new stat names
      for (const [statName, requiredValue] of Object.entries(statRequirements)) {
        const currentValue = currentStats.totalStats?.[statName] || 0
        
        if (currentValue < requiredValue) {
          recommendations.push({
            type: 'stat_priority',
            priority: 'high',
            description: `${this.getStatDisplayName(statName)} is below optimal for ${activityType}`,
            currentValue,
            recommendedValue: requiredValue,
            gap: requiredValue - currentValue,
            statName
          })
        }
      }

    } catch (error) {
      console.warn('Error generating activity recommendations:', error)
    }

    return recommendations
  }

  async generateExoticRecommendations(build, activityType) {
    const recommendations = []

    try {
      // Find current exotic in build
      const currentExotic = this.findExoticInBuild(build)
      
      if (currentExotic) {
        // Check if exotic is optimal for activity
        const isOptimal = this.isExoticOptimalForActivity(currentExotic, activityType)
        
        if (!isOptimal) {
          recommendations.push({
            type: 'exotic_optimization',
            priority: 'medium',
            description: `${currentExotic.name} may not be optimal for ${activityType}`,
            alternatives: await this.getAlternativeExotics(currentExotic, activityType),
            expectedImprovement: '10-20 point score increase'
          })
        }
      }

      return recommendations

    } catch (error) {
      console.error('Error getting exotic recommendations:', error)
      return []
    }
  }

  findExoticInBuild(build) {
    const slots = ['helmet', 'arms', 'chest', 'legs', 'class', 'kinetic', 'energy', 'power']
    
    for (const slot of slots) {
      const item = build[slot]
      if (item && item.hash) {
        const itemData = this.manifest?.data?.DestinyInventoryItemDefinition?.[item.hash]
        if (itemData && itemData.inventory?.tierType === 6) {
          return {
            slot,
            hash: item.hash,
            name: itemData.displayProperties?.name,
            data: itemData
          }
        }
      }
    }
    return null
  }

  isExoticOptimalForActivity(exotic, activityType) {
    // Simplified exotic optimization check
    const exoticName = exotic.name?.toLowerCase() || ''
    
    if (activityType === 'pvp') {
      return exoticName.includes('dragon') || exoticName.includes('stompees') || 
             exoticName.includes('transversive') || exoticName.includes('ophidian')
    } else if (activityType === 'grandmaster') {
      return exoticName.includes('loreley') || exoticName.includes('omnioculus') ||
             exoticName.includes('contraverse') || exoticName.includes('phoenix')
    }
    
    return true // Most exotics work for general content
  }

  async getAlternativeExotics(currentExotic, activityType) {
    // This would return alternative exotic suggestions
    // Simplified implementation for now
    return []
  }

  getStatDisplayName(statName) {
    // Updated to use new Armor 3.0 stat names
    const displayNames = {
      weapons: 'Weapons',
      health: 'Health',
      class: 'Class',
      super: 'Super',
      grenade: 'Grenade',
      melee: 'Melee'
    }
    return displayNames[statName] || statName
  }

  getStatName(statHash) {
    // Updated to use new Armor 3.0 stat names
    const statNames = {
      2996146975: 'Weapons',
      392767087: 'Health',
      1943323491: 'Class',
      1735777505: 'Super',
      144602215: 'Grenade',
      4244567218: 'Melee'
    }
    return statNames[statHash] || 'Unknown Stat'
  }

  // Utility methods
  getScoringCapabilities() {
    return {
      enhanced: this.isInitialized,
      intelligence: this.isInitialized,
      synergies: this.isInitialized,
      statCalculation: this.isInitialized,
      version: '2.0',
      features: [
        'Enhanced Scoring',
        'Synergy Detection',
        'Stat Optimization',
        'Activity Recommendations',
        'Build Alternatives',
        'Intelligence Analysis'
      ]
    }
  }

  isReady() {
    return this.isInitialized
  }

  getManifestVersion() {
    return this.manifest?.metadata?.version || 'unknown'
  }
}

// Export singleton instance
const buildScorer = new BuildScorer()

export default buildScorer
export { BuildScorer }

// Direct exports for easy usage
export const generateBuild = async (request, options = {}) => {
  return await buildScorer.generateBuild(request, options)
}

export const scoreBuild = async (build, options = {}) => {
  return await buildScorer.scoreBuild(build, options)
}

export const initializeBuildScorer = async (manifest) => {
  return await buildScorer.initialize(manifest)
}