import { TextParser } from './text-parser'
import { SynergyEngine } from './synergy-engine'
import { StatCalculator } from './stat-calculator'
import { TriggerDatabase } from './trigger-database'
import { ArmorArchetypeManager } from './armor-archetype-manager'

export class BuildIntelligence {
  constructor() {
    this.manifest = null
    this.textParser = null
    this.synergyEngine = null
    this.statCalculator = null
    this.triggerDatabase = null
    this.armorArchetypeManager = null
    this.isInitialized = false
  }

  async initialize(manifest) {
    if (this.isInitialized) return

    if (!manifest) {
      throw new Error('Manifest data is required for BuildIntelligence initialization')
    }

    this.manifest = manifest

    try {
      console.log('Initializing Build Intelligence...')

      // Initialize all intelligence components
      this.textParser = new TextParser()
      await this.textParser.initialize(manifest)

      this.synergyEngine = new SynergyEngine()
      await this.synergyEngine.initialize(manifest)

      this.statCalculator = new StatCalculator()
      await this.statCalculator.initialize(manifest)

      this.triggerDatabase = new TriggerDatabase()
      await this.triggerDatabase.initialize(manifest)

      this.armorArchetypeManager = new ArmorArchetypeManager()
      await this.armorArchetypeManager.initialize(manifest)

      this.isInitialized = true
      console.log('Build Intelligence initialized successfully')

    } catch (error) {
      console.error('Failed to initialize Build Intelligence:', error)
      throw new Error(`Build Intelligence initialization failed: ${error.message}`)
    }
  }

  async analyzeRequest(input, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Build Intelligence not initialized. Call initialize() first.')
    }

    try {
      const parsedRequest = await this.textParser.parseNaturalLanguage(input, options)
      
      return {
        success: true,
        parsedRequest,
        confidence: parsedRequest.confidence || 0.8,
        detectedSynergies: parsedRequest.synergies || [],
        error: null
      }

    } catch (error) {
      console.error('Error analyzing request:', error)
      return {
        success: false,
        parsedRequest: null,
        confidence: 0,
        detectedSynergies: [],
        error: error.message
      }
    }
  }

  async generateBuild(parsedRequest, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Build Intelligence not initialized. Call initialize() first.')
    }

    const {
      includeAlternatives = false,
      detailedAnalysis = true,
      optimizationSuggestions = true
    } = options

    try {
      // Extract key requirements from parsed request
      const requirements = this.extractBuildRequirements(parsedRequest)
      
      // Generate base build
      const build = await this.generateBaseBuild(requirements)
      
      // Find synergies
      const synergies = await this.synergyEngine.findSynergies(build)
      
      // Detect conflicts
      const conflicts = await this.detectConflicts(build, requirements)
      
      // Generate optimization suggestions
      const optimization = optimizationSuggestions ? 
        await this.generateOptimizations(build, requirements) : null

      // Generate alternatives if requested
      const alternatives = includeAlternatives ? 
        await this.generateAlternatives(build, requirements) : []

      return {
        build,
        synergies,
        conflicts,
        optimization,
        alternatives,
        analysis: detailedAnalysis ? {
          requirements,
          strengths: this.identifyBuildStrengths(build, synergies),
          weaknesses: this.identifyBuildWeaknesses(build, conflicts),
          recommendations: this.generateRecommendations(build, requirements)
        } : null,
        metadata: {
          generatedAt: new Date().toISOString(),
          version: this.getVersion(),
          confidence: parsedRequest.confidence || 0.8
        }
      }

    } catch (error) {
      console.error('Error generating build:', error)
      throw new Error(`Build generation failed: ${error.message}`)
    }
  }

  extractBuildRequirements(parsedRequest) {
    return {
      classType: parsedRequest.class || 'any',
      activityType: parsedRequest.activity || 'general_pve',
      focusStats: parsedRequest.stats || [],
      preferredExotic: parsedRequest.exotic || null,
      playstyle: parsedRequest.playstyle || 'balanced',
      subclass: parsedRequest.subclass || null,
      weaponTypes: parsedRequest.weapons || [],
      modPreferences: parsedRequest.mods || [],
      triggers: parsedRequest.triggers || [],
      effects: parsedRequest.effects || []
    }
  }

  async generateBaseBuild(requirements) {
    // Generate a basic build structure
    const build = {
      helmet: null,
      arms: null,
      chest: null,
      legs: null,
      class: null,
      kinetic: null,
      energy: null,
      power: null,
      mods: [],
      stats: {}
    }

    try {
      // If exotic is specified, use it
      if (requirements.preferredExotic) {
        const exotic = await this.findExoticByName(requirements.preferredExotic)
        if (exotic) {
          const slot = this.getArmorSlotForExotic(exotic)
          if (slot) {
            build[slot] = { hash: exotic.hash, name: exotic.displayProperties.name }
          }
        }
      }

      // Fill remaining slots with appropriate legendary gear
      await this.fillLegendarySlots(build, requirements)

      // Calculate base stats
      build.stats = await this.statCalculator.calculateBuildStats(build)

      return build

    } catch (error) {
      console.error('Error generating base build:', error)
      throw error
    }
  }

  async findExoticByName(name) {
    try {
      const items = this.manifest?.data?.DestinyInventoryItemDefinition
      if (!items) return null

      for (const [hash, item] of Object.entries(items)) {
        if (item.displayProperties?.name?.toLowerCase().includes(name.toLowerCase()) &&
            item.inventory?.tierType === 6) { // Exotic tier
          return { ...item, hash: parseInt(hash) }
        }
      }
      return null

    } catch (error) {
      console.warn('Error finding exotic by name:', error)
      return null
    }
  }

  getArmorSlotForExotic(exotic) {
    const armorType = exotic.itemSubType
    const slotMap = {
      26: 'helmet',     // Helmet
      27: 'arms',       // Gauntlets
      28: 'chest',      // Chest
      29: 'legs',       // Legs
      30: 'class'       // Class item
    }
    return slotMap[armorType] || null
  }

  async fillLegendarySlots(build, requirements) {
    // This would implement logic to fill empty armor slots with appropriate legendary gear
    // For now, return placeholder data
    const slots = ['helmet', 'arms', 'chest', 'legs', 'class']
    
    for (const slot of slots) {
      if (!build[slot]) {
        // Find appropriate legendary armor for this slot
        const legendaryItem = await this.findLegendaryForSlot(slot, requirements)
        if (legendaryItem) {
          build[slot] = legendaryItem
        }
      }
    }
  }

  async findLegendaryForSlot(slot, requirements) {
    // Placeholder implementation - would find actual legendary armor
    return {
      hash: 0,
      name: `Legendary ${slot.charAt(0).toUpperCase() + slot.slice(1)}`,
      tier: 'legendary'
    }
  }

  async detectConflicts(build, requirements) {
    const conflicts = []

    try {
      // Check for stat conflicts
      const statConflicts = this.checkStatConflicts(build, requirements)
      conflicts.push(...statConflicts)

      // Check for activity conflicts
      const activityConflicts = this.checkActivityConflicts(build, requirements)
      conflicts.push(...activityConflicts)

      return conflicts

    } catch (error) {
      console.warn('Error detecting conflicts:', error)
      return []
    }
  }

  checkStatConflicts(build, requirements) {
    const conflicts = []
    
    // Check if build stats match requirements
    if (requirements.focusStats && requirements.focusStats.length > 0) {
      for (const stat of requirements.focusStats) {
        const currentValue = build.stats[stat] || 0
        if (currentValue < 60) { // Below useful threshold
          conflicts.push({
            type: 'stat_deficiency',
            severity: 'moderate',
            description: `${stat} is below recommended threshold`,
            recommendation: `Consider armor or mods that boost ${stat}`
          })
        }
      }
    }

    return conflicts
  }

  checkActivityConflicts(build, requirements) {
    const conflicts = []
    
    // Check if exotic is appropriate for activity
    const exotic = this.findExoticInBuild(build)
    if (exotic && requirements.activityType) {
      const isAppropriate = this.isExoticAppropriateForActivity(exotic, requirements.activityType)
      if (!isAppropriate) {
        conflicts.push({
          type: 'activity_mismatch',
          severity: 'low',
          description: `${exotic.name} may not be optimal for ${requirements.activityType}`,
          recommendation: `Consider activity-specific exotic alternatives`
        })
      }
    }

    return conflicts
  }

  findExoticInBuild(build) {
    const slots = ['helmet', 'arms', 'chest', 'legs', 'class']
    for (const slot of slots) {
      const item = build[slot]
      if (item && item.hash) {
        const itemData = this.manifest?.data?.DestinyInventoryItemDefinition?.[item.hash]
        if (itemData && itemData.inventory?.tierType === 6) {
          return { ...item, data: itemData }
        }
      }
    }
    return null
  }

  isExoticAppropriateForActivity(exotic, activityType) {
    // Simplified activity appropriateness check
    const exoticName = exotic.name?.toLowerCase() || ''
    
    if (activityType === 'pvp') {
      const pvpExotics = ['dragon', 'stompees', 'transversive', 'ophidian', 'dunemarchers']
      return pvpExotics.some(name => exoticName.includes(name))
    } else if (activityType === 'grandmaster') {
      const gmExotics = ['loreley', 'omnioculus', 'contraverse', 'phoenix', 'well']
      return gmExotics.some(name => exoticName.includes(name))
    }
    
    return true // Most exotics work for general content
  }

  async generateOptimizations(build, requirements) {
    const optimizations = []

    try {
      // Stat optimizations
      const statOptimizations = await this.generateStatOptimizations(build, requirements)
      optimizations.push(...statOptimizations)

      // Synergy optimizations
      const synergyOptimizations = await this.generateSynergyOptimizations(build)
      optimizations.push(...synergyOptimizations)

      return {
        suggestions: optimizations,
        priority: this.prioritizeOptimizations(optimizations),
        estimatedImprovement: this.estimateOptimizationImpact(optimizations)
      }

    } catch (error) {
      console.warn('Error generating optimizations:', error)
      return { suggestions: [], priority: [], estimatedImprovement: 0 }
    }
  }

  async generateStatOptimizations(build, requirements) {
    const optimizations = []
    
    if (requirements.focusStats && requirements.focusStats.length > 0) {
      for (const stat of requirements.focusStats) {
        const currentValue = build.stats[stat] || 0
        if (currentValue < 100) {
          optimizations.push({
            type: 'stat_boost',
            target: stat,
            current: currentValue,
            recommended: Math.min(100, currentValue + 20),
            method: 'armor_mods',
            impact: 'moderate'
          })
        }
      }
    }

    return optimizations
  }

  async generateSynergyOptimizations(build) {
    const optimizations = []
    
    // Look for potential synergies that could be enhanced
    const potentialSynergies = await this.synergyEngine.findPotentialSynergies(build)
    
    for (const synergy of potentialSynergies) {
      optimizations.push({
        type: 'synergy_enhancement',
        description: synergy.description,
        requirements: synergy.requirements,
        benefit: synergy.benefit,
        impact: synergy.impact || 'moderate'
      })
    }

    return optimizations
  }

  prioritizeOptimizations(optimizations) {
    return optimizations.sort((a, b) => {
      const impactOrder = { high: 3, moderate: 2, low: 1 }
      return (impactOrder[b.impact] || 1) - (impactOrder[a.impact] || 1)
    })
  }

  estimateOptimizationImpact(optimizations) {
    const impactValues = { high: 15, moderate: 10, low: 5 }
    return optimizations.reduce((total, opt) => total + (impactValues[opt.impact] || 5), 0)
  }

  async generateAlternatives(build, requirements) {
    // This would generate alternative builds
    // For now, return empty array
    return []
  }

  identifyBuildStrengths(build, synergies) {
    const strengths = []
    
    if (synergies && synergies.length > 0) {
      strengths.push(`Strong synergies detected (${synergies.length})`)
    }

    return strengths
  }

  identifyBuildWeaknesses(build, conflicts) {
    const weaknesses = []
    
    if (conflicts && conflicts.length > 0) {
      weaknesses.push(`${conflicts.length} potential issues identified`)
    }

    return weaknesses
  }

  generateRecommendations(build, requirements) {
    const recommendations = []
    
    recommendations.push('Consider masterworking high-stat armor pieces')
    recommendations.push('Optimize mods for your playstyle')
    
    return recommendations
  }

  async getTopExoticSuggestions(options = {}) {
    const { limit = 10, classType = 'any', activityType = 'general' } = options

    try {
      const items = this.manifest?.data?.DestinyInventoryItemDefinition
      if (!items) return []

      const exotics = []
      
      for (const [hash, item] of Object.entries(items)) {
        if (item.inventory?.tierType === 6 && // Exotic
            item.itemType === 2 && // Armor
            item.displayProperties?.name) {
          
          exotics.push({
            hash: parseInt(hash),
            name: item.displayProperties.name,
            description: item.displayProperties.description,
            icon: item.displayProperties.icon,
            classType: item.classType,
            armorType: item.itemSubType,
            complexity: this.calculateExoticComplexity(item)
          })
        }
      }

      // Filter by class if specified
      let filteredExotics = exotics
      if (classType !== 'any') {
        const classMap = { titan: 0, hunter: 1, warlock: 2 }
        filteredExotics = exotics.filter(exotic => 
          exotic.classType === classMap[classType.toLowerCase()]
        )
      }

      // Sort by appropriateness for activity
      filteredExotics.sort((a, b) => {
        const aScore = this.scoreExoticForActivity(a, activityType)
        const bScore = this.scoreExoticForActivity(b, activityType)
        return bScore - aScore
      })

      return filteredExotics.slice(0, limit)

    } catch (error) {
      console.warn('Error getting exotic suggestions:', error)
      return []
    }
  }

  calculateExoticComplexity(item) {
    // Simple complexity calculation based on description length
    const description = item.displayProperties?.description || ''
    if (description.length > 200) return 'complex'
    if (description.length > 100) return 'moderate'
    return 'simple'
  }

  scoreExoticForActivity(exotic, activityType) {
    // Simple scoring based on name matching
    const name = exotic.name.toLowerCase()
    
    if (activityType === 'pvp') {
      if (name.includes('dragon') || name.includes('stompees')) return 90
      if (name.includes('transversive') || name.includes('ophidian')) return 85
      return 50
    } else if (activityType === 'grandmaster') {
      if (name.includes('loreley') || name.includes('omnioculus')) return 90
      if (name.includes('contraverse') || name.includes('phoenix')) return 85
      return 60
    }
    
    return 70 // Default score for general content
  }

  async generateBuildAlternatives(build, parsedRequest, options = {}) {
    const { maxAlternatives = 3 } = options
    
    // Placeholder - would generate actual alternatives
    return []
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
      naturalLanguageProcessing: this.isInitialized && this.textParser !== null,
      synergyDetection: this.isInitialized && this.synergyEngine !== null,
      statCalculation: this.isInitialized && this.statCalculator !== null,
      triggerAnalysis: this.isInitialized && this.triggerDatabase !== null,
      armorAnalysis: this.isInitialized && this.armorArchetypeManager !== null
    }
  }
}

// Export as default for backward compatibility
export default BuildIntelligence