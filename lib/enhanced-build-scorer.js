// lib/enhanced-build-scorer.js
// Enhanced build scoring system that integrates all intelligence components

import { TextParser } from './destiny-intelligence/text-parser.js'
import { StatCalculator } from './destiny-intelligence/stat-calculator.js'
import { SynergyEngine } from './destiny-intelligence/synergy-engine.js'
import { BuildIntelligence } from './destiny-intelligence/build-intelligence.js'
import { TriggerDatabase } from './destiny-intelligence/trigger-database.js'
import { ArmorArchetypeManager } from './destiny-intelligence/armor-archetype-manager.js'

export class EnhancedBuildScorer {
  constructor() {
    this.textParser = new TextParser()
    this.statCalculator = new StatCalculator()
    this.synergyEngine = new SynergyEngine()
    this.buildIntelligence = new BuildIntelligence()
    this.triggerDatabase = new TriggerDatabase()
    this.armorManager = new ArmorArchetypeManager()
    
    // Scoring weights for different build aspects
    this.scoringWeights = {
      synergy: 0.3,        // Item synergies and interactions
      stats: 0.25,        // Stat optimization and breakpoints
      mathematical: 0.2,   // Mathematical efficiency of bonuses
      accessibility: 0.1,  // Ease of obtaining items
      viability: 0.15      // Effectiveness for intended content
    }
    
    // Activity-specific weight adjustments
    this.activityWeights = {
      raid: { synergy: 1.2, viability: 1.3, mathematical: 1.1 },
      grandmaster: { stats: 1.4, viability: 1.5, accessibility: 0.8 },
      pvp: { mathematical: 1.3, viability: 1.4, stats: 1.2 },
      general_pve: { accessibility: 1.2, synergy: 1.1 },
      trials: { stats: 1.2, mathematical: 1.2, viability: 1.3 }
    }
  }

  /**
   * Generate and score an intelligent build
   * @param {Object} buildRequest - Build generation request
   * @returns {Object} Generated build with comprehensive scoring
   */
  async generateIntelligentBuild(buildRequest) {
    const {
      request,
      lockedExotic,
      useInventoryOnly,
      userSession,
      manifest,
      activities = ['general_pve'],
      difficulty = 'normal'
    } = buildRequest

    // Parse the natural language request
    const parsedRequest = this.parseNaturalLanguageRequest(request)
    
    // Generate the build using AI intelligence
    const generatedBuild = await this.buildIntelligence.generateIntelligentBuild({
      goal: parsedRequest,
      lockedItems: lockedExotic ? [lockedExotic] : [],
      availableItems: manifest,
      constraints: {
        useInventoryOnly,
        activities,
        difficulty
      },
      userPreferences: {
        activities,
        difficulty
      }
    })

    // Enhanced comprehensive scoring
    const comprehensiveScore = await this.scoreCompleteBuild(
      generatedBuild.build,
      parsedRequest,
      manifest,
      activities
    )

    // Generate optimization recommendations
    const optimizations = this.generateBuildOptimizations(
      generatedBuild.build,
      comprehensiveScore,
      parsedRequest
    )

    return {
      ...generatedBuild.build,
      intelligence: {
        ...generatedBuild.intelligence,
        comprehensiveScore,
        optimizations,
        parsedRequest,
        confidence: comprehensiveScore.overallConfidence
      },
      metadata: {
        ...generatedBuild.build.metadata,
        scoringVersion: '2.0',
        intelligenceEnabled: true,
        generatedAt: new Date().toISOString()
      }
    }
  }

  /**
   * Parse natural language build request
   * @param {string} request - Natural language request
   * @returns {Object} Parsed build parameters
   */
  parseNaturalLanguageRequest(request) {
    const parsed = this.textParser.parseDescription(request)
    
    const buildParameters = {
      type: this.inferBuildType(request, parsed),
      priorityStats: this.inferStatPriorities(request, parsed),
      keyTriggers: this.extractKeyTriggers(request, parsed),
      keyEffects: this.extractKeyEffects(request, parsed),
      activities: this.extractActivities(request),
      playstyle: this.inferPlaystyle(request),
      difficulty: this.inferDifficulty(request),
      originalRequest: request,
      confidence: parsed.confidence
    }

    return buildParameters
  }

  /**
   * Comprehensive build scoring using all intelligence components
   * @param {Object} build - The build to score
   * @param {Object} buildParameters - Build parameters
   * @param {Object} manifest - Game manifest data
   * @param {Array} activities - Target activities
   * @returns {Object} Comprehensive scoring analysis
   */
  async scoreCompleteBuild(build, buildParameters, manifest, activities) {
    const scoring = {
      synergyScore: 0,
      statScore: 0,
      mathematicalScore: 0,
      accessibilityScore: 0,
      viabilityScore: 0,
      overallScore: 0,
      overallConfidence: 0,
      breakdown: {},
      recommendations: []
    }

    // Collect and parse all build items
    const allItems = this.collectAllBuildItems(build)
    const parsedItems = await this.parseAllItems(allItems, manifest)

    // 1. Synergy Analysis
    const synergyAnalysis = this.synergyEngine.analyzeSynergies(parsedItems, buildParameters)
    scoring.synergyScore = this.normalizeSynergyScore(synergyAnalysis.totalSynergyScore)
    scoring.breakdown.synergy = {
      rawScore: synergyAnalysis.totalSynergyScore,
      normalizedScore: scoring.synergyScore,
      synergyCount: synergyAnalysis.synergies.length,
      loopCount: synergyAnalysis.loops.length,
      conflicts: synergyAnalysis.conflicts.length,
      topSynergies: synergyAnalysis.synergies.slice(0, 3)
    }

    // 2. Stat Optimization Analysis
    const armorPieces = this.extractArmorPieces(build)
    if (armorPieces.length > 0) {
      const statAnalysis = this.statCalculator.calculateBuildStats(armorPieces, buildParameters.isPvP)
      scoring.statScore = this.normalizeStatScore(statAnalysis.buildScore)
      scoring.breakdown.stats = {
        buildScore: statAnalysis.buildScore,
        totalStats: statAnalysis.totalStats,
        breakpointsReached: this.countStatBreakpoints(statAnalysis.statBreakdowns),
        efficiency: statAnalysis.efficiency,
        recommendations: statAnalysis.recommendations
      }
    }

    // 3. Mathematical Efficiency Analysis
    const mathematicalAnalysis = this.analyzeMathematicalEfficiency(parsedItems, buildParameters)
    scoring.mathematicalScore = mathematicalAnalysis.efficiency
    scoring.breakdown.mathematical = mathematicalAnalysis

    // 4. Accessibility Analysis
    const accessibilityAnalysis = this.analyzeAccessibility(allItems, buildParameters)
    scoring.accessibilityScore = accessibilityAnalysis.score
    scoring.breakdown.accessibility = accessibilityAnalysis

    // 5. Viability Analysis
    const viabilityAnalysis = this.analyzeViability(build, buildParameters, activities)
    scoring.viabilityScore = viabilityAnalysis.score
    scoring.breakdown.viability = viabilityAnalysis

    // Calculate weighted overall score
    scoring.overallScore = this.calculateWeightedScore(scoring, activities)
    
    // Calculate overall confidence
    scoring.overallConfidence = this.calculateOverallConfidence(scoring, buildParameters)

    // Generate comprehensive recommendations
    scoring.recommendations = this.generateComprehensiveRecommendations(scoring, build, buildParameters)

    return scoring
  }

  /**
   * Analyze mathematical efficiency of item combinations
   * @param {Array} parsedItems - Items with parsed data
   * @param {Object} buildParameters - Build parameters
   * @returns {Object} Mathematical efficiency analysis
   */
  analyzeMathematicalEfficiency(parsedItems, buildParameters) {
    const analysis = {
      efficiency: 0,
      stackingEfficiency: 0,
      wastedEffects: [],
      calculatedBonuses: {},
      effectiveBonus: 0
    }

    // Collect mathematical effects
    const mathematicalEffects = []
    parsedItems.forEach(item => {
      if (item.parsed?.mathematical) {
        mathematicalEffects.push(...item.parsed.mathematical.map(effect => ({
          ...effect,
          itemName: item.displayProperties?.name || 'Unknown'
        })))
      }
    })

    if (mathematicalEffects.length === 0) {
      return analysis
    }

    // Calculate stacking efficiency using trigger database
    const stackingResults = this.triggerDatabase.calculateEffectStacking(mathematicalEffects)
    analysis.calculatedBonuses = stackingResults
    
    if (Object.keys(stackingResults).length > 0) {
      analysis.stackingEfficiency = this.calculateStackingEfficiency(stackingResults)
    }

    // Identify wasted effects
    analysis.wastedEffects = this.identifyWastedEffects(mathematicalEffects)

    // Calculate overall mathematical efficiency
    analysis.efficiency = this.calculateOverallMathematicalEfficiency(analysis)

    return analysis
  }

  /**
   * Analyze build accessibility (ease of obtaining items)
   * @param {Array} items - All build items
   * @param {Object} buildParameters - Build parameters
   * @returns {Object} Accessibility analysis
   */
  analyzeAccessibility(items, buildParameters) {
    const analysis = {
      score: 0,
      difficulty: 'unknown',
      timeInvestment: 'unknown',
      rngDependency: 'unknown',
      mostDifficult: null,
      breakdown: {
        exoticCount: 0,
        legendaryCount: 0,
        rareCount: 0
      }
    }

    let totalAccessibility = 0
    let itemCount = 0

    items.forEach(item => {
      if (!item) return

      const itemAccessibility = this.calculateItemAccessibility(item)
      totalAccessibility += itemAccessibility.score
      itemCount++

      // Count by rarity
      if (item.tierType === 6) analysis.breakdown.exoticCount++
      else if (item.tierType === 5) analysis.breakdown.legendaryCount++
      else analysis.breakdown.rareCount++

      // Track most difficult item
      if (!analysis.mostDifficult || itemAccessibility.score < analysis.mostDifficult.score) {
        analysis.mostDifficult = {
          item: item.displayProperties?.name || 'Unknown',
          score: itemAccessibility.score,
          source: itemAccessibility.source
        }
      }
    })

    analysis.score = itemCount > 0 ? totalAccessibility / itemCount : 0
    analysis.difficulty = this.categorizeDifficulty(analysis.score)
    analysis.timeInvestment = this.estimateTimeInvestment(analysis.score, analysis.breakdown)
    analysis.rngDependency = this.assessRngDependency(analysis.breakdown)

    return analysis
  }

  /**
   * Analyze build viability for target activities
   * @param {Object} build - The build
   * @param {Object} buildParameters - Build parameters
   * @param {Array} activities - Target activities
   * @returns {Object} Viability analysis
   */
  analyzeViability(build, buildParameters, activities) {
    const analysis = {
      score: 0,
      activityScores: {},
      strengths: [],
      weaknesses: [],
      recommendations: []
    }

    // Analyze for each target activity
    activities.forEach(activity => {
      const activityScore = this.scoreForActivity(build, buildParameters, activity)
      analysis.activityScores[activity] = activityScore
    })

    // Calculate overall viability
    const activityScoreValues = Object.values(analysis.activityScores)
    analysis.score = activityScoreValues.length > 0 
      ? activityScoreValues.reduce((a, b) => a + b, 0) / activityScoreValues.length 
      : 0

    // Identify strengths and weaknesses
    analysis.strengths = this.identifyViabilityStrengths(build, buildParameters, activities)
    analysis.weaknesses = this.identifyViabilityWeaknesses(build, buildParameters, activities)

    return analysis
  }

  /**
   * Generate comprehensive optimization recommendations
   * @param {Object} build - The build
   * @param {Object} scoring - Comprehensive scoring data
   * @param {Object} buildParameters - Build parameters
   * @returns {Array} Optimization recommendations
   */
  generateBuildOptimizations(build, scoring, buildParameters) {
    const optimizations = []

    // Synergy optimizations
    if (scoring.synergyScore < 0.6) {
      optimizations.push({
        type: 'synergy',
        priority: 'high',
        message: 'Low synergy detected between items',
        suggestions: this.generateSynergyOptimizations(scoring.breakdown.synergy),
        impact: 'high'
      })
    }

    // Stat optimizations
    if (scoring.statScore < 0.6) {
      optimizations.push({
        type: 'stats',
        priority: 'medium',
        message: 'Stat distribution could be optimized',
        suggestions: this.generateStatOptimizations(scoring.breakdown.stats),
        impact: 'medium'
      })
    }

    // Mathematical efficiency optimizations
    if (scoring.mathematicalScore < 0.6) {
      optimizations.push({
        type: 'mathematical',
        priority: 'medium',
        message: 'Mathematical bonuses could be more efficient',
        suggestions: this.generateMathematicalOptimizations(scoring.breakdown.mathematical),
        impact: 'medium'
      })
    }

    // Accessibility optimizations (low priority unless very poor)
    if (scoring.accessibilityScore < 0.3) {
      optimizations.push({
        type: 'accessibility',
        priority: 'low',
        message: 'Build uses very difficult-to-obtain items',
        suggestions: ['Consider more accessible alternatives for rare items'],
        impact: 'low'
      })
    }

    return optimizations
  }

  /**
   * Helper methods for scoring calculations
   */

  collectAllBuildItems(build) {
    const items = []
    
    // Collect weapons
    if (build.weapons) {
      Object.values(build.weapons).forEach(weapon => {
        if (weapon) items.push(weapon)
      })
    }
    
    // Collect armor
    if (build.armor) {
      Object.values(build.armor).forEach(armor => {
        if (armor) items.push(armor)
      })
    }
    
    // Add subclass and mods
    if (build.subclass) items.push(build.subclass)
    if (build.mods) build.mods.forEach(mod => { if (mod) items.push(mod) })

    return items
  }

  async parseAllItems(items, manifest) {
    return items.map(item => {
      if (!item) return null
      
      const description = item.displayProperties?.description || ''
      const parsed = this.textParser.parseDescription(description, item)
      
      return {
        ...item,
        parsed: parsed
      }
    }).filter(Boolean)
  }

  extractArmorPieces(build) {
    return build.armor ? Object.values(build.armor).filter(Boolean) : []
  }

  normalizeSynergyScore(rawScore) {
    return Math.min(1.0, rawScore / 10.0)
  }

  normalizeStatScore(buildScore) {
    return buildScore / 100
  }

  countStatBreakpoints(statBreakdowns) {
    return Object.values(statBreakdowns).filter(breakdown => 
      breakdown.breakpointReached
    ).length
  }

  calculateStackingEfficiency(stackingResults) {
    if (Object.keys(stackingResults).length === 0) return 0.5

    let totalEfficiency = 0
    let resultCount = 0
    
    Object.values(stackingResults).forEach(result => {
      const componentSum = result.componentEffects.reduce((sum, effect) => sum + effect.value, 0)
      const efficiency = componentSum > 0 ? result.finalValue / componentSum : 1.0
      totalEfficiency += Math.min(efficiency, 2.0) // Cap at 200% efficiency
      resultCount++
    })
    
    return resultCount > 0 ? totalEfficiency / resultCount / 2.0 : 0.5 // Normalize to 0-1
  }

  identifyWastedEffects(mathematicalEffects) {
    const wasted = []
    const effectGroups = new Map()
    
    // Group effects by context
    mathematicalEffects.forEach(effect => {
      const context = effect.context || 'unknown'
      if (!effectGroups.has(context)) {
        effectGroups.set(context, [])
      }
      effectGroups.get(context).push(effect)
    })
    
    // Check for diminishing returns
    effectGroups.forEach((effects, context) => {
      if (effects.length > 3) {
        wasted.push({
          context: context,
          reason: 'diminishing_returns',
          wastedEffects: effects.slice(3)
        })
      }
    })
    
    return wasted
  }

  calculateOverallMathematicalEfficiency(analysis) {
    let efficiency = analysis.stackingEfficiency || 0.5
    
    // Penalize for wasted effects
    if (analysis.wastedEffects.length > 0) {
      efficiency *= 0.8
    }
    
    // Bonus for having any mathematical effects
    if (Object.keys(analysis.calculatedBonuses).length > 0) {
      efficiency *= 1.1
    }
    
    return Math.min(1.0, efficiency)
  }

  calculateItemAccessibility(item) {
    const tierAccessibility = {
      6: 0.2, // Exotic - very difficult
      5: 0.6, // Legendary - moderate
      4: 0.8, // Rare - easy
      3: 0.9, // Uncommon - very easy
      2: 1.0  // Common - trivial
    }
    
    const tier = item.tierType || 2
    return {
      score: tierAccessibility[tier] || 0.5,
      source: tier === 6 ? 'exotic_acquisition' : 'general_loot'
    }
  }

  categorizeDifficulty(score) {
    if (score >= 0.8) return 'easy'
    if (score >= 0.6) return 'moderate' 
    if (score >= 0.4) return 'hard'
    return 'very_hard'
  }

  estimateTimeInvestment(score, breakdown) {
    if (breakdown.exoticCount >= 3) return 'very_long'
    if (breakdown.exoticCount >= 2 || score < 0.4) return 'long'
    if (breakdown.exoticCount >= 1 || score < 0.6) return 'medium'
    return 'short'
  }

  assessRngDependency(breakdown) {
    if (breakdown.exoticCount >= 3) return 'very_high'
    if (breakdown.exoticCount >= 2) return 'high'
    if (breakdown.exoticCount >= 1 || breakdown.legendaryCount >= 3) return 'medium'
    return 'low'
  }

  scoreForActivity(build, buildParameters, activity) {
    const items = this.collectAllBuildItems(build)
    const triggers = []
    const effects = []
    
    // Extract triggers and effects
    items.forEach(item => {
      if (item.parsed?.triggers) {
        triggers.push(...item.parsed.triggers.map(t => t.normalizedCondition))
      }
      if (item.parsed?.effects) {
        effects.push(...item.parsed.effects.map(e => e.normalizedEffect))
      }
    })
    
    // Get activity relevance
    const relevance = this.triggerDatabase.getActivityRelevance(activity, triggers, effects)
    return relevance.relevanceScore
  }

  identifyViabilityStrengths(build, buildParameters, activities) {
    const strengths = []
    
    if (buildParameters.type === 'dps' && activities.includes('raid')) {
      strengths.push('High damage output optimized for raid encounters')
    }
    
    if (buildParameters.type === 'survivability' && activities.includes('grandmaster')) {
      strengths.push('Strong survivability for high-end content')
    }
    
    return strengths
  }

  identifyViabilityWeaknesses(build, buildParameters, activities) {
    const weaknesses = []
    
    if (buildParameters.type === 'ability_spam' && activities.includes('grandmaster')) {
      weaknesses.push('May lack survivability for grandmaster content')
    }
    
    if (buildParameters.type === 'pvp' && activities.includes('pve')) {
      weaknesses.push('PvP-focused build may underperform in PvE')
    }
    
    return weaknesses
  }

  calculateWeightedScore(scoring, activities) {
    let totalScore = 0
    let totalWeight = 0
    
    // Get activity-specific weights
    const activityWeight = activities.length > 0 ? this.activityWeights[activities[0]] || {} : {}
    
    Object.entries(this.scoringWeights).forEach(([aspect, weight]) => {
      const adjustedWeight = weight * (activityWeight[aspect] || 1.0)
      const aspectScore = scoring[aspect + 'Score'] || 0
      
      totalScore += aspectScore * adjustedWeight
      totalWeight += adjustedWeight
    })
    
    return totalWeight > 0 ? totalScore / totalWeight : 0
  }

  calculateOverallConfidence(scoring, buildParameters) {
    let confidence = 0
    let weight = 0
    
    // Confidence from request parsing
    if (buildParameters.confidence > 0) {
      confidence += buildParameters.confidence * 0.3
      weight += 0.3
    }
    
    // Confidence from synergy analysis
    if (scoring.breakdown.synergy?.synergyCount > 0) {
      confidence += 0.8 * 0.3
      weight += 0.3
    }
    
    // Confidence from stat optimization
    if (scoring.statScore > 0.6) {
      confidence += 0.7 * 0.2
      weight += 0.2
    }
    
    // Confidence from completeness
    const completeness = this.calculateBuildCompleteness(scoring)
    confidence += completeness * 0.2
    weight += 0.2
    
    return weight > 0 ? confidence / weight : 0.5
  }

  calculateBuildCompleteness(scoring) {
    // Simple completeness based on whether we have scores for major categories
    let completeness = 0
    if (scoring.synergyScore > 0) completeness += 0.25
    if (scoring.statScore > 0) completeness += 0.25
    if (scoring.mathematicalScore > 0) completeness += 0.25
    if (scoring.viabilityScore > 0) completeness += 0.25
    return completeness
  }

  generateComprehensiveRecommendations(scoring, build, buildParameters) {
    const recommendations = []
    
    // Critical recommendations (score < 0.5)
    if (scoring.synergyScore < 0.5) {
      recommendations.push({
        type: 'critical',
        priority: 'high',
        message: 'Items have poor synergy - consider alternatives that work better together',
        category: 'synergy'
      })
    }
    
    // Optimization recommendations (score < 0.7)
    if (scoring.statScore < 0.7) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        message: 'Stat distribution could be improved for better efficiency',
        category: 'stats'
      })
    }
    
    // Positive feedback (score > 0.8)
    if (scoring.overallScore > 0.8) {
      recommendations.push({
        type: 'positive',
        priority: 'info',
        message: 'Excellent build with strong optimization across multiple areas',
        category: 'overall'
      })
    }
    
    return recommendations
  }

  // Helper methods for natural language parsing
  inferBuildType(request, parsed) {
    const lower = request.toLowerCase()
    if (lower.includes('dps') || lower.includes('damage') || lower.includes('boss')) return 'dps'
    if (lower.includes('grenade') || lower.includes('ability') || lower.includes('spam')) return 'ability_spam'
    if (lower.includes('surviv') || lower.includes('tank') || lower.includes('defensive')) return 'survivability'
    if (lower.includes('pvp') || lower.includes('crucible') || lower.includes('trials')) return 'pvp'
    return 'general'
  }

  inferStatPriorities(request, parsed) {
    const priorities = { weapons: 0, health: 0, class: 0, super: 0, grenade: 0, melee: 0 }
    
    const lower = request.toLowerCase()
    if (lower.includes('damage') || lower.includes('dps')) {
      priorities.weapons = 180
      priorities.super = 150
    }
    if (lower.includes('grenade')) priorities.grenade = 180
    if (lower.includes('melee')) priorities.melee = 150
    if (lower.includes('surviv') || lower.includes('tank')) {
      priorities.health = 180
      priorities.class = 150
    }
    
    return priorities
  }

  extractKeyTriggers(request, parsed) {
    return parsed.triggers.map(t => t.normalizedCondition)
  }

  extractKeyEffects(request, parsed) {
    return parsed.effects.map(e => e.normalizedEffect)
  }

  extractActivities(request) {
    const lower = request.toLowerCase()
    const activities = []
    
    if (lower.includes('raid')) activities.push('raid')
    if (lower.includes('gm') || lower.includes('grandmaster')) activities.push('grandmaster')
    if (lower.includes('pvp') || lower.includes('crucible')) activities.push('pvp')
    if (lower.includes('trials')) activities.push('trials')
    if (lower.includes('dungeon')) activities.push('dungeon')
    
    return activities.length > 0 ? activities : ['general_pve']
  }

  inferPlaystyle(request) {
    const lower = request.toLowerCase()
    if (lower.includes('aggressive') || lower.includes('rush')) return 'aggressive'
    if (lower.includes('defensive') || lower.includes('safe')) return 'defensive'
    if (lower.includes('support') || lower.includes('team')) return 'support'
    return 'balanced'
  }

  inferDifficulty(request) {
    const lower = request.toLowerCase()
    if (lower.includes('gm') || lower.includes('grandmaster') || lower.includes('master')) return 'master'
    if (lower.includes('hard') || lower.includes('difficult')) return 'hard'
    return 'normal'
  }

  // Optimization suggestion generators
  generateSynergyOptimizations(synergyBreakdown) {
    const suggestions = []
    
    if (synergyBreakdown.synergyCount === 0) {
      suggestions.push('Look for items with complementary trigger conditions')
    }
    
    if (synergyBreakdown.conflicts > 0) {
      suggestions.push('Replace conflicting items with compatible alternatives')
    }
    
    if (synergyBreakdown.loopCount === 0) {
      suggestions.push('Consider items that create resource generation loops')
    }
    
    return suggestions
  }

  generateStatOptimizations(statsBreakdown) {
    const suggestions = []
    
    if (statsBreakdown.breakpointsReached < 2) {
      suggestions.push('Focus on reaching 100-point stat breakpoints for secondary effects')
    }
    
    if (statsBreakdown.efficiency < 0.7) {
      suggestions.push('Redistribute stats for better efficiency')
    }
    
    return suggestions
  }

  generateMathematicalOptimizations(mathBreakdown) {
    const suggestions = []
    
    if (mathBreakdown.wastedEffects.length > 0) {
      suggestions.push('Avoid stacking effects with diminishing returns')
    }
    
    if (mathBreakdown.stackingEfficiency < 0.6) {
      suggestions.push('Look for effects that stack multiplicatively rather than additively')
    }
    
    return suggestions
  }
}

// Main export function that replaces the old generateBuild function
export async function generateBuild(buildRequest) {
  const scorer = new EnhancedBuildScorer()
  return scorer.generateIntelligentBuild(buildRequest)
}

// Additional utility exports
export function scoreExistingBuild(build, buildParameters, manifest, activities = ['general_pve']) {
  const scorer = new EnhancedBuildScorer()
  return scorer.scoreCompleteBuild(build, buildParameters, manifest, activities)
}

export function optimizeBuild(build, buildParameters, manifest) {
  const scorer = new EnhancedBuildScorer()
  return scorer.generateBuildOptimizations(build, {}, buildParameters)
}