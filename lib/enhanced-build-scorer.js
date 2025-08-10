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
    
    // Scoring weights for different aspects of builds
    this.scoringWeights = {
      synergy: 0.3,        // How well items work together
      stats: 0.25,        // Stat optimization and breakpoints
      mathematical: 0.2,   // Mathematical efficiency of bonuses
      accessibility: 0.1,  // How easy the build is to obtain
      uniqueness: 0.05,    // How unique/creative the build is
      viability: 0.1       // How viable for intended content
    }
    
    // Activity-specific weight adjustments
    this.activityWeights = {
      raid: { synergy: 1.2, stats: 1.1, viability: 1.3 },
      grandmaster: { stats: 1.4, viability: 1.5, accessibility: 0.8 },
      pvp: { mathematical: 1.3, viability: 1.4, uniqueness: 0.7 },
      general_pve: { accessibility: 1.2, uniqueness: 1.1 },
      trials: { stats: 1.2, mathematical: 1.2, viability: 1.3 }
    }
  }

  /**
   * Generate and score a complete build using intelligence system
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
   * Parse natural language build request using intelligence
   * @param {string} request - Natural language request
   * @returns {Object} Parsed build parameters
   */
  parseNaturalLanguageRequest(request) {
    const parsed = this.textParser.parseDescription(request)
    
    // Extract build type and parameters
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
      uniquenessScore: 0,
      viabilityScore: 0,
      overallScore: 0,
      overallConfidence: 0,
      breakdown: {},
      recommendations: []
    }

    // Collect all build items for analysis
    const allItems = this.collectAllBuildItems(build)
    
    // Parse all items if not already parsed
    const parsedItems = await this.parseAllItems(allItems, manifest)

    // 1. Synergy Analysis
    const synergyAnalysis = this.synergyEngine.analyzeSynergies(parsedItems, buildParameters)
    scoring.synergyScore = this.normalizeSynergyScore(synergyAnalysis.totalSynergyScore)
    scoring.breakdown.synergy = {
      rawScore: synergyAnalysis.totalSynergyScore,
      normalizedScore: scoring.synergyScore,
      synergyCount: synergyAnalysis.synergies.length,
      loopCount: synergyAnalysis.loops.length,
      conflicts: synergyAnalysis.conflicts.length
    }

    // 2. Stat Optimization Analysis
    const armorPieces = this.extractArmorPieces(build)
    const statAnalysis = this.statCalculator.calculateBuildStats(armorPieces, buildParameters.isPvP)
    scoring.statScore = this.normalizeStatScore(statAnalysis.buildScore)
    scoring.breakdown.stats = {
      buildScore: statAnalysis.buildScore,
      breakpointsReached: this.countStatBreakpoints(statAnalysis.statBreakdowns),
      efficiency: this.calculateStatEfficiency(statAnalysis.totalStats),
      archetype: this.analyzeArmorArchetypes(armorPieces)
    }

    // 3. Mathematical Efficiency Analysis
    const mathematicalAnalysis = this.analyzeMathematicalEfficiency(parsedItems, buildParameters)
    scoring.mathematicalScore = mathematicalAnalysis.efficiency
    scoring.breakdown.mathematical = mathematicalAnalysis

    // 4. Accessibility Analysis
    const accessibilityAnalysis = this.analyzeAccessibility(allItems, buildParameters)
    scoring.accessibilityScore = accessibilityAnalysis.score
    scoring.breakdown.accessibility = accessibilityAnalysis

    // 5. Uniqueness Analysis
    const uniquenessAnalysis = this.analyzeUniqueness(build, parsedItems)
    scoring.uniquenessScore = uniquenessAnalysis.score
    scoring.breakdown.uniqueness = uniquenessAnalysis

    // 6. Viability Analysis
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
      optimalCombinations: [],
      calculatedBonuses: {}
    }

    // Collect all mathematical effects
    const mathematicalEffects = []
    for (const item of parsedItems) {
      if (item.parsed?.mathematical) {
        mathematicalEffects.push(...item.parsed.mathematical)
      }
    }

    // Calculate stacking efficiency
    if (mathematicalEffects.length > 1) {
      const stackingResults = this.triggerDatabase.calculateEffectStacking(mathematicalEffects)
      analysis.calculatedBonuses = stackingResults
      analysis.stackingEfficiency = this.calculateStackingEfficiency(stackingResults)
    }

    // Identify wasted effects (diminishing returns, caps hit)
    analysis.wastedEffects = this.identifyWastedEffects(mathematicalEffects)

    // Find optimal combinations
    analysis.optimalCombinations = this.findOptimalMathematicalCombinations(
      mathematicalEffects,
      buildParameters
    )

    // Calculate overall mathematical efficiency
    analysis.efficiency = this.calculateOverallMathematicalEfficiency(analysis)

    return analysis
  }

  /**
   * Analyze build accessibility (how easy to obtain)
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
      breakdown: {}
    }

    let totalAccessibility = 0
    let itemCount = 0

    for (const item of items) {
      if (!item) continue

      const itemAccessibility = this.calculateItemAccessibility(item)
      totalAccessibility += itemAccessibility.score
      itemCount++

      // Track most difficult item
      if (!analysis.mostDifficult || itemAccessibility.score < analysis.mostDifficult.score) {
        analysis.mostDifficult = {
          item: item.displayProperties?.name || 'Unknown',
          score: itemAccessibility.score,
          source: itemAccessibility.source
        }
      }
    }

    analysis.score = itemCount > 0 ? totalAccessibility / itemCount : 0
    analysis.difficulty = this.categorizeDifficulty(analysis.score)
    analysis.timeInvestment = this.estimateTimeInvestment(analysis.score, items)
    analysis.rngDependency = this.assessRngDependency(items)

    return analysis
  }

  /**
   * Analyze build uniqueness and creativity
   * @param {Object} build - The build
   * @param {Array} parsedItems - Parsed items
   * @returns {Object} Uniqueness analysis
   */
  analyzeUniqueness(build, parsedItems) {
    const analysis = {
      score: 0,
      creativityFactors: [],
      metaDeviation: 0,
      unexpectedSynergies: [],
      novelCombinations: []
    }

    // Check for non-meta item combinations
    analysis.metaDeviation = this.calculateMetaDeviation(build)

    // Identify unexpected synergies
    analysis.unexpectedSynergies = this.findUnexpectedSynergies(parsedItems)

    // Find novel item combinations
    analysis.novelCombinations = this.identifyNovelCombinations(build)

    // Calculate creativity factors
    analysis.creativityFactors = this.identifyCreativityFactors(build, parsedItems)

    // Calculate overall uniqueness score
    analysis.score = this.calculateUniquenessScore(analysis)

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
    for (const activity of activities) {
      const activityScore = this.scoreForActivity(build, buildParameters, activity)
      analysis.activityScores[activity] = activityScore
    }

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
   * @param {Object} scoring - Comprehensive scoring data
   * @param {Object} build - The build
   * @param {Object} buildParameters - Build parameters
   * @returns {Array} Optimization recommendations
   */
  generateBuildOptimizations(build, scoring, buildParameters) {
    const optimizations = []

    // Synergy optimizations
    if (scoring.synergyScore < 0.7) {
      optimizations.push({
        type: 'synergy',
        priority: 'high',
        message: 'Low synergy detected between items',
        suggestions: this.generateSynergyOptimizations(build, scoring.breakdown.synergy),
        impact: 'high'
      })
    }

    // Stat optimizations
    if (scoring.statScore < 0.6) {
      optimizations.push({
        type: 'stats',
        priority: 'high',
        message: 'Stat distribution could be optimized',
        suggestions: this.generateStatOptimizations(build, scoring.breakdown.stats),
        impact: 'medium'
      })
    }

    // Mathematical efficiency optimizations
    if (scoring.mathematicalScore < 0.6) {
      optimizations.push({
        type: 'mathematical',
        priority: 'medium',
        message: 'Mathematical efficiency could be improved',
        suggestions: this.generateMathematicalOptimizations(scoring.breakdown.mathematical),
        impact: 'medium'
      })
    }

    // Accessibility optimizations
    if (scoring.accessibilityScore < 0.4) {
      optimizations.push({
        type: 'accessibility',
        priority: 'low',
        message: 'Build requires difficult-to-obtain items',
        suggestions: this.generateAccessibilityOptimizations(build, scoring.breakdown.accessibility),
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
    
    // Add subclass
    if (build.subclass) items.push(build.subclass)
    
    // Add mods
    if (build.mods) {
      build.mods.forEach(mod => {
        if (mod) items.push(mod)
      })
    }

    return items
  }

  async parseAllItems(items, manifest) {
    const parsedItems = []
    
    for (const item of items) {
      if (!item) continue
      
      const description = item.displayProperties?.description || ''
      const parsed = this.textParser.parseDescription(description, item)
      
      parsedItems.push({
        ...item,
        parsed: parsed
      })
    }
    
    return parsedItems
  }

  extractArmorPieces(build) {
    return build.armor ? Object.values(build.armor).filter(Boolean) : []
  }

  normalizeSynergyScore(rawScore) {
    // Normalize synergy score to 0-1 range
    return Math.min(1.0, rawScore / 10.0)
  }

  normalizeStatScore(buildScore) {
    // Build score is already 0-100, normalize to 0-1
    return buildScore / 100
  }

  countStatBreakpoints(statBreakdowns) {
    let breakpoints = 0
    for (const breakdown of Object.values(statBreakdowns)) {
      if (breakdown.breakpointReached) breakpoints++
    }
    return breakpoints
  }

  calculateStatEfficiency(totalStats) {
    let efficiency = 0
    let statCount = 0
    
    for (const [stat, value] of Object.entries(totalStats)) {
      if (value > 0) {
        // Efficiency is higher when reaching breakpoints (100, 200)
        const firstBreakpoint = value >= 100 ? 1 : value / 100
        const secondBreakpoint = value >= 200 ? 1 : Math.max(0, (value - 100) / 100)
        efficiency += (firstBreakpoint + secondBreakpoint * 0.5) / 1.5
        statCount++
      }
    }
    
    return statCount > 0 ? efficiency / statCount : 0
  }

  analyzeArmorArchetypes(armorPieces) {
    const archetypes = {}
    for (const piece of armorPieces) {
      const archetype = piece.archetype || 'unknown'
      archetypes[archetype] = (archetypes[archetype] || 0) + 1
    }
    return archetypes
  }

  calculateStackingEfficiency(stackingResults) {
    let totalEfficiency = 0
    let resultCount = 0
    
    for (const [type, result] of Object.entries(stackingResults)) {
      // Calculate efficiency based on how close to optimal the stacking is
      const componentSum = result.componentEffects.reduce((sum, effect) => sum + effect.value, 0)
      const efficiency = result.finalValue / componentSum
      totalEfficiency += Math.min(efficiency, 2.0) // Cap at 200% efficiency
      resultCount++
    }
    
    return resultCount > 0 ? totalEfficiency / resultCount : 1.0
  }

  identifyWastedEffects(mathematicalEffects) {
    const wasted = []
    
    // Group effects by type
    const effectGroups = {}
    for (const effect of mathematicalEffects) {
      const type = effect.context || 'unknown'
      if (!effectGroups[type]) effectGroups[type] = []
      effectGroups[type].push(effect)
    }
    
    // Check for diminishing returns
    for (const [type, effects] of Object.entries(effectGroups)) {
      if (effects.length > 3) {
        wasted.push({
          type: type,
          reason: 'diminishing_returns',
          effects: effects.slice(3) // Effects beyond 3rd are likely wasted
        })
      }
    }
    
    return wasted
  }

  findOptimalMathematicalCombinations(mathematicalEffects, buildParameters) {
    // This would analyze all possible combinations and find the most efficient ones
    // Simplified implementation for now
    return []
  }

  calculateOverallMathematicalEfficiency(analysis) {
    let efficiency = analysis.stackingEfficiency || 0.5
    
    // Penalize for wasted effects
    if (analysis.wastedEffects.length > 0) {
      efficiency *= 0.8
    }
    
    // Bonus for optimal combinations
    if (analysis.optimalCombinations.length > 0) {
      efficiency *= 1.2
    }
    
    return Math.min(1.0, efficiency)
  }

  calculateItemAccessibility(item) {
    // This would use actual acquisition data
    // Simplified implementation based on tier
    const tierAccessibility = {
      6: 0.3, // Exotic
      5: 0.7, // Legendary
      4: 0.8, // Rare
      3: 0.9, // Uncommon
      2: 1.0  // Common
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

  estimateTimeInvestment(score, items) {
    const exoticCount = items.filter(item => item?.tierType === 6).length
    
    if (score >= 0.8 && exoticCount <= 1) return 'short'
    if (score >= 0.6 && exoticCount <= 2) return 'medium'
    return 'long'
  }

  assessRngDependency(items) {
    const exoticCount = items.filter(item => item?.tierType === 6).length
    const legendaryCount = items.filter(item => item?.tierType === 5).length
    
    if (exoticCount >= 3) return 'very_high'
    if (exoticCount >= 2 || legendaryCount >= 4) return 'high'
    if (exoticCount >= 1 || legendaryCount >= 2) return 'medium'
    return 'low'
  }

  calculateMetaDeviation(build) {
    // This would compare against known meta builds
    // Simplified implementation
    return 0.5
  }

  findUnexpectedSynergies(parsedItems) {
    // Find synergies that don't follow common patterns
    return []
  }

  identifyNovelCombinations(build) {
    // Identify unusual item combinations
    return []
  }

  identifyCreativityFactors(build, parsedItems) {
    const factors = []
    
    // Check for unusual exotic combinations
    const exotics = this.collectAllBuildItems(build).filter(item => item?.tierType === 6)
    if (exotics.length > 1) {
      factors.push('multiple_exotics')
    }
    
    // Check for complex synergy chains
    const synergyAnalysis = this.synergyEngine.analyzeSynergies(parsedItems)
    if (synergyAnalysis.loops.length > 0) {
      factors.push('synergy_loops')
    }
    
    return factors
  }

  calculateUniquenessScore(analysis) {
    let score = 0.5 // Base score
    
    // Bonus for meta deviation
    score += analysis.metaDeviation * 0.3
    
    // Bonus for creativity factors
    score += analysis.creativityFactors.length * 0.1
    
    // Bonus for unexpected synergies
    score += analysis.unexpectedSynergies.length * 0.1
    
    return Math.min(1.0, score)
  }

  scoreForActivity(build, buildParameters, activity) {
    const items = this.collectAllBuildItems(build)
    const triggers = []
    const effects = []
    
    // Extract triggers and effects
    for (const item of items) {
      if (item.parsed?.triggers) {
        triggers.push(...item.parsed.triggers.map(t => t.normalizedCondition))
      }
      if (item.parsed?.effects) {
        effects.push(...item.parsed.effects.map(e => e.normalizedEffect))
      }
    }
    
    // Get activity relevance
    const relevance = this.triggerDatabase.getActivityRelevance(activity, triggers, effects)
    return relevance.relevanceScore
  }

  identifyViabilityStrengths(build, buildParameters, activities) {
    const strengths = []
    
    // This would analyze the build's strengths for each activity
    // Simplified implementation
    if (buildParameters.type === 'dps' && activities.includes('raid')) {
      strengths.push('High damage output for raid encounters')
    }
    
    return strengths
  }

  identifyViabilityWeaknesses(build, buildParameters, activities) {
    const weaknesses = []
    
    // This would analyze the build's weaknesses for each activity
    // Simplified implementation
    if (buildParameters.type === 'ability_spam' && activities.includes('grandmaster')) {
      weaknesses.push('May lack survivability for high-end content')
    }
    
    return weaknesses
  }

  calculateWeightedScore(scoring, activities) {
    let totalScore = 0
    let totalWeight = 0
    
    // Get activity-specific weights
    const activityWeight = activities.length > 0 ? this.activityWeights[activities[0]] || {} : {}
    
    for (const [aspect, weight] of Object.entries(this.scoringWeights)) {
      const adjustedWeight = weight * (activityWeight[aspect] || 1.0)
      const aspectScore = scoring[aspect + 'Score'] || 0
      
      totalScore += aspectScore * adjustedWeight
      totalWeight += adjustedWeight
    }
    
    return totalWeight > 0 ? totalScore / totalWeight : 0
  }

  calculateOverallConfidence(scoring, buildParameters) {
    let confidence = 0
    let factors = 0
    
    // Confidence from request parsing
    if (buildParameters.confidence) {
      confidence += buildParameters.confidence * 0.3
      factors += 0.3
    }
    
    // Confidence from synergy analysis
    if (scoring.breakdown.synergy?.synergyCount > 0) {
      confidence += 0.8 * 0.3
      factors += 0.3
    }
    
    // Confidence from stat optimization
    if (scoring.statScore > 0.6) {
      confidence += 0.7 * 0.2
      factors += 0.2
    }
    
    // Confidence from mathematical analysis
    if (scoring.mathematicalScore > 0.5) {
      confidence += 0.6 * 0.2
      factors += 0.2
    }
    
    return factors > 0 ? confidence / factors : 0.5
  }

  generateComprehensiveRecommendations(scoring, build, buildParameters) {
    const recommendations = []
    
    // High-impact recommendations
    if (scoring.synergyScore < 0.5) {
      recommendations.push({
        type: 'critical',
        priority: 'high',
        message: 'Consider items with better synergistic relationships',
        impact: 'high'
      })
    }
    
    // Medium-impact recommendations
    if (scoring.statScore < 0.7) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        message: 'Stat distribution could be improved for better efficiency',
        impact: 'medium'
      })
    }
    
    // Low-impact recommendations
    if (scoring.uniquenessScore > 0.8) {
      recommendations.push({
        type: 'positive',
        priority: 'low',
        message: 'Unique and creative build approach detected',
        impact: 'positive'
      })
    }
    
    return recommendations
  }

  // Placeholder optimization generation methods
  generateSynergyOptimizations(build, synergyBreakdown) {
    return ['Consider items that share trigger conditions']
  }

  generateStatOptimizations(build, statsBreakdown) {
    return ['Focus on reaching 100-point stat breakpoints']
  }

  generateMathematicalOptimizations(mathematicalBreakdown) {
    return ['Avoid stacking effects with diminishing returns']
  }

  generateAccessibilityOptimizations(build, accessibilityBreakdown) {
    return ['Consider easier-to-obtain alternatives for rare items']
  }

  // Helper methods for natural language parsing
  inferBuildType(request, parsed) {
    const lower = request.toLowerCase()
    if (lower.includes('dps') || lower.includes('damage')) return 'dps'
    if (lower.includes('grenade') || lower.includes('ability')) return 'ability_spam'
    if (lower.includes('surviv') || lower.includes('tank')) return 'survivability'
    if (lower.includes('pvp') || lower.includes('crucible')) return 'pvp'
    return 'general'
  }

  inferStatPriorities(request, parsed) {
    const priorities = {
      weapons: 0,
      health: 0,
      class: 0,
      super: 0,
      grenade: 0,
      melee: 0
    }
    
    const lower = request.toLowerCase()
    if (lower.includes('damage') || lower.includes('dps')) {
      priorities.weapons = 180
      priorities.super = 150
    }
    if (lower.includes('grenade')) {
      priorities.grenade = 180
    }
    if (lower.includes('melee')) {
      priorities.melee = 150
    }
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
    if (lower.includes('aggressive')) return 'aggressive'
    if (lower.includes('defensive')) return 'defensive'
    if (lower.includes('support')) return 'support'
    return 'balanced'
  }

  inferDifficulty(request) {
    const lower = request.toLowerCase()
    if (lower.includes('gm') || lower.includes('grandmaster') || lower.includes('master')) return 'master'
    if (lower.includes('hard') || lower.includes('difficult')) return 'hard'
    return 'normal'
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
  // This would return optimization suggestions for an existing build
  return scorer.generateBuildOptimizations(build, {}, buildParameters)
}