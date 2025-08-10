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
      optimizations: [],
      alternatives: [],
      confidence: 0,
      recommendations: []
    }

    try {
      // Analyze synergies between all build components
      if (build.armor) {
        const armorHashes = Object.values(build.armor)
          .filter(item => item && item.hash)
          .map(item => item.hash)

        // Find synergies for each armor piece
        for (const hash of armorHashes) {
          const synergies = await this.synergyEngine.findSynergies(hash, {
            includeWeapons: true,
            includeMods: true,
            includeSubclasses: true,
            contextItems: armorHashes,
            activityType
          })
          
          insights.synergies.push(...synergies.filter(s => s.strength > 0.3))
        }

        // Detect conflicts between items
        const conflicts = await this.synergyEngine.detectConflicts(armorHashes, {
          includeMods: true,
          includeStatWaste: true
        })
        insights.conflicts = conflicts
      }

      // Analyze stat distribution and optimization opportunities
      if (build.stats) {
        const statAnalysis = await this.statCalculator.analyzeStatDistribution(build.stats, {
          includeWasted: true,
          includeOptimizations: true,
          activityType,
          targetBreakpoints: this.getActivityBreakpoints(activityType)
        })

        insights.optimizations = statAnalysis.optimizations || []
        insights.confidence = statAnalysis.efficiency || 0.5
        insights.recommendations.push(...(statAnalysis.recommendations || []))
      }

      // Generate build alternatives using AI
      if (request) {
        const alternatives = await this.buildIntelligence.generateBuildAlternatives(
          build, 
          request, 
          { 
            maxAlternatives: 3,
            activityType,
            improvementFocus: insights.optimizations.length > 0 ? 'optimization' : 'variety'
          }
        )
        insights.alternatives = alternatives
      }

      // Generate activity-specific recommendations
      const activityRecommendations = await this.generateActivityRecommendations(build, activityType)
      insights.recommendations.push(...activityRecommendations)

      return insights

    } catch (error) {
      console.error('Error generating intelligence insights:', error)
      throw new Error(`Intelligence analysis failed: ${error.message}`)
    }
  }

  async generateBuild(request, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Build scorer not initialized. Call initialize() first.')
    }

    try {
      return await this.buildIntelligence.generateOptimalBuild(request, options)
    } catch (error) {
      console.error('Error generating build:', error)
      throw new Error(`Build generation failed: ${error.message}`)
    }
  }

  getActivityBreakpoints(activityType) {
    const breakpoints = {
      pvp: {
        mobility: [50, 100],
        resilience: [60, 100],
        recovery: [70, 100],
        intellect: [70, 100]
      },
      pve: {
        resilience: [100],
        recovery: [60, 100],
        discipline: [70, 100],
        strength: [50, 100]
      },
      raid: {
        resilience: [100],
        recovery: [70],
        discipline: [70, 100],
        intellect: [60]
      },
      gm: {
        resilience: [100],
        recovery: [100],
        discipline: [70],
        mobility: [50]
      },
      general: {
        resilience: [60, 100],
        recovery: [50, 100],
        discipline: [50, 100]
      }
    }

    return breakpoints[activityType] || breakpoints.general
  }

  async generateActivityRecommendations(build, activityType) {
    const recommendations = []

    try {
      // Get activity-specific stat priorities
      const statPriorities = await this.statCalculator.getActivityStatPriorities(activityType)
      const currentStats = build.stats || {}

      // Check if build meets activity requirements
      for (const [statHash, priority] of Object.entries(statPriorities)) {
        const currentValue = currentStats[statHash] || 0
        const recommended = priority.recommended || 60
        
        if (currentValue < recommended) {
          const statName = this.getStatName(statHash)
          recommendations.push({
            type: 'stat_priority',
            priority: priority.importance,
            description: `Increase ${statName} to ${recommended}+ for ${activityType}`,
            currentValue,
            recommendedValue: recommended,
            expectedImprovement: `${Math.round((recommended - currentValue) / 10)} tiers`
          })
        }
      }

      // Activity-specific exotic recommendations
      const exoticRecommendations = await this.getActivityExoticRecommendations(build, activityType)
      recommendations.push(...exoticRecommendations)

      return recommendations

    } catch (error) {
      console.error('Error generating activity recommendations:', error)
      return []
    }
  }

  async getActivityExoticRecommendations(build, activityType) {
    const recommendations = []
    
    try {
      const currentExotic = Object.values(build.armor || {})
        .find(item => item && item.tier === 'Exotic')

      if (!currentExotic) {
        // Suggest exotic for activity
        const topExotics = await this.buildIntelligence.getTopExoticsForActivity(activityType, {
          limit: 3,
          considerStats: true
        })

        if (topExotics.length > 0) {
          recommendations.push({
            type: 'exotic_suggestion',
            priority: 'high',
            description: `Consider using ${topExotics[0].name} for ${activityType}`,
            alternatives: topExotics.slice(1).map(e => e.name),
            expectedImprovement: 'Major build enhancement'
          })
        }
      } else {
        // Validate current exotic for activity
        const exoticRating = await this.buildIntelligence.rateExoticForActivity(
          currentExotic.hash, 
          activityType
        )

        if (exoticRating.score < 0.6) {
          recommendations.push({
            type: 'exotic_optimization',
            priority: 'medium',
            description: `${currentExotic.name} may not be optimal for ${activityType}`,
            alternatives: exoticRating.betterAlternatives || [],
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

  getStatName(statHash) {
    const statNames = {
      2996146975: 'Mobility',
      392767087: 'Resilience',
      1943323491: 'Recovery',
      1735777505: 'Discipline',
      144602215: 'Intellect',
      4244567218: 'Strength'
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