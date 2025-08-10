// lib/destiny-intelligence/text-parser.js
// Extracts conditional triggers and mathematical relationships from item descriptions

export class TextParser {
  constructor() {
    // Optimized regex patterns for common trigger types
    this.triggerPatterns = {
      conditional: /(?:when|after|upon|while|during)\s+(.+?)\s+(?:causes?|grants?|gives?|provides?|you\s+(?:gain|receive|get))\s+(.+)/gi,
      collection: /collecting\s+(.+?)\s+causes?\s+you\s+to\s+(.+)/gi,
      kills: /(?:final\s+blows?|kills?)\s+with\s+(.+?)\s+(?:grants?|gives?|provides?)\s+(.+)/gi,
      abilities: /(?:using|casting|activating)\s+(.+?)\s+(?:grants?|gives?|provides?)\s+(.+)/gi
    }

    // Mathematical value extraction
    this.mathPatterns = {
      percentages: /(\d+(?:\.\d+)?)%/g,
      numbers: /(\d+(?:\.\d+)?)\s*(?:points?|seconds?|meters?)/g,
      multipliers: /(\d+(?:\.\d+)?)x/g,
      duration: /(?:for|lasts?)\s+(\d+(?:\.\d+)?)\s*seconds?/gi
    }

    // Normalized trigger conditions for consistent analysis
    this.knownTriggers = {
      'collecting an orb of power': 'orb_collection',
      'getting a grenade kill': 'grenade_kill', 
      'final blow with weapon': 'weapon_kill',
      'using class ability': 'class_ability_use',
      'taking damage': 'damage_taken',
      'precision kill': 'precision_kill',
      'weapon reload': 'weapon_reload',
      'low health': 'low_health'
    }

    // Normalized effects for consistent analysis
    this.knownEffects = {
      'gain armor charge': 'armor_charge_gain',
      'increase damage': 'damage_increase',
      'reduce cooldown': 'cooldown_reduction',
      'restore health': 'health_restore',
      'increase reload speed': 'reload_speed_increase',
      'grant overshield': 'overshield_grant'
    }
  }

  /**
   * Parse item description to extract triggers and effects
   * @param {string} description - Item description text
   * @param {Object} itemData - Additional item data for context
   * @returns {Object} Parsed trigger information
   */
  parseDescription(description, itemData = {}) {
    if (!description || typeof description !== 'string') {
      return this.createEmptyResult()
    }

    const result = {
      triggers: this.extractTriggers(description),
      effects: this.extractEffects(description),
      mathematical: this.extractMathematical(description),
      energy: this.extractEnergyInfo(description, itemData),
      confidence: 0
    }

    result.confidence = this.calculateConfidence(result)
    return result
  }

  /**
   * Extract conditional triggers from description
   */
  extractTriggers(description) {
    const triggers = []
    
    Object.entries(this.triggerPatterns).forEach(([type, pattern]) => {
      let match
      pattern.lastIndex = 0 // Reset regex
      
      while ((match = pattern.exec(description)) !== null) {
        const condition = match[1].toLowerCase().trim()
        const effect = match[2].toLowerCase().trim()
        
        triggers.push({
          raw: match[0],
          condition: condition,
          normalizedCondition: this.normalizeCondition(condition),
          effect: effect,
          type: type,
          confidence: this.getConditionConfidence(condition)
        })
      }
    })
    
    return triggers
  }

  /**
   * Extract mathematical effects and values
   */
  extractEffects(description) {
    const effects = []
    
    // Extract percentage bonuses
    const percentMatches = [...description.matchAll(this.mathPatterns.percentages)]
    percentMatches.forEach(match => {
      const context = this.getContext(description, match.index, 40)
      effects.push({
        type: 'percentage',
        value: parseFloat(match[1]),
        context: context,
        normalizedEffect: this.normalizeEffect(context)
      })
    })

    // Extract flat number bonuses
    const numberMatches = [...description.matchAll(this.mathPatterns.numbers)]
    numberMatches.forEach(match => {
      const context = this.getContext(description, match.index, 40)
      effects.push({
        type: 'flat',
        value: parseFloat(match[1]),
        context: context,
        normalizedEffect: this.normalizeEffect(context)
      })
    })
    
    return effects
  }

  /**
   * Extract mathematical relationships and formulas
   */
  extractMathematical(description) {
    const mathematical = []
    
    // Extract all mathematical values with enhanced context
    Object.entries(this.mathPatterns).forEach(([type, pattern]) => {
      const matches = [...description.matchAll(pattern)]
      matches.forEach(match => {
        mathematical.push({
          type: type,
          value: parseFloat(match[1]),
          position: match.index,
          context: this.getContext(description, match.index, 60),
          formula: this.extractFormula(description, match.index)
        })
      })
    })
    
    return mathematical
  }

  /**
   * Extract energy cost information
   */
  extractEnergyInfo(description, itemData) {
    const energy = {
      cost: null,
      type: null,
      source: 'none'
    }
    
    // Check item data first (most reliable)
    if (itemData.plug?.energyCost) {
      energy.cost = itemData.plug.energyCost.energyCost
      energy.type = itemData.plug.energyCost.energyType
      energy.source = 'item_data'
    }
    
    // Fallback to text parsing
    const energyMatch = description.match(/(?:costs?|requires?)\s+(\d+)\s*energy/i)
    if (energyMatch && !energy.cost) {
      energy.cost = parseInt(energyMatch[1])
      energy.source = 'description'
    }
    
    return energy.cost ? energy : null
  }

  /**
   * Get surrounding context for better analysis
   */
  getContext(text, position, radius = 40) {
    const start = Math.max(0, position - radius)
    const end = Math.min(text.length, position + radius)
    return text.slice(start, end).trim()
  }

  /**
   * Normalize trigger condition to standard form
   */
  normalizeCondition(condition) {
    const lower = condition.toLowerCase()
    
    // Check direct matches first
    for (const [pattern, normalized] of Object.entries(this.knownTriggers)) {
      if (lower.includes(pattern)) {
        return normalized
      }
    }
    
    // Pattern-based normalization
    if (lower.includes('kill')) {
      if (lower.includes('grenade')) return 'grenade_kill'
      if (lower.includes('melee')) return 'melee_kill'
      if (lower.includes('precision')) return 'precision_kill'
      return 'weapon_kill'
    }
    
    if (lower.includes('using') || lower.includes('activating')) {
      if (lower.includes('grenade')) return 'grenade_use'
      if (lower.includes('melee')) return 'melee_use'
      if (lower.includes('super')) return 'super_use'
      if (lower.includes('class')) return 'class_ability_use'
    }
    
    // Default normalization
    return lower.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_')
  }

  /**
   * Normalize effect to standard form
   */
  normalizeEffect(effect) {
    const lower = effect.toLowerCase()
    
    // Check direct matches
    for (const [pattern, normalized] of Object.entries(this.knownEffects)) {
      if (lower.includes(pattern)) {
        return normalized
      }
    }
    
    // Pattern-based normalization
    if (lower.includes('damage')) {
      return lower.includes('increase') ? 'damage_increase' : 'damage_reduction'
    }
    
    if (lower.includes('cooldown')) {
      return 'cooldown_reduction'
    }
    
    if (lower.includes('reload')) {
      return 'reload_speed_increase'
    }
    
    return lower.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_')
  }

  /**
   * Extract mathematical formula context
   */
  extractFormula(description, position) {
    // Look for mathematical relationships near the position
    const context = this.getContext(description, position, 80)
    const formulaMatch = context.match(/(\d+(?:\.\d+)?[%x]?)\s*(?:per|for each|times|multiplied by)\s*(\d+(?:\.\d+)?)/i)
    
    return formulaMatch ? {
      base: parseFloat(formulaMatch[1]),
      multiplier: parseFloat(formulaMatch[2]),
      type: formulaMatch[0].includes('%') ? 'percentage' : 'flat'
    } : null
  }

  /**
   * Calculate confidence in parsing accuracy
   */
  getConditionConfidence(condition) {
    const lower = condition.toLowerCase()
    
    // High confidence for known patterns
    for (const pattern of Object.keys(this.knownTriggers)) {
      if (lower.includes(pattern)) return 0.9
    }
    
    // Medium confidence for action words
    if (lower.match(/\b(kill|use|cast|activate|collect|take)\b/)) {
      return 0.7
    }
    
    return 0.5
  }

  /**
   * Calculate overall parsing confidence
   */
  calculateConfidence(result) {
    let confidence = 0
    let weight = 0
    
    if (result.triggers.length > 0) {
      const avgTriggerConfidence = result.triggers.reduce((sum, t) => sum + t.confidence, 0) / result.triggers.length
      confidence += avgTriggerConfidence * 0.5
      weight += 0.5
    }
    
    if (result.mathematical.length > 0) {
      confidence += 0.3
      weight += 0.3
    }
    
    if (result.energy) {
      confidence += result.energy.source === 'item_data' ? 0.2 : 0.1
      weight += 0.2
    }
    
    return weight > 0 ? confidence / weight : 0
  }

  /**
   * Create empty result structure
   */
  createEmptyResult() {
    return {
      triggers: [],
      effects: [],
      mathematical: [],
      energy: null,
      confidence: 0
    }
  }

  /**
   * Batch parse multiple items efficiently
   */
  parseItems(items) {
    const results = new Map()
    
    Object.entries(items).forEach(([hash, item]) => {
      const description = item.displayProperties?.description || ''
      if (description) {
        const parsed = this.parseDescription(description, item)
        if (parsed.confidence > 0.3) { // Only store meaningful results
          results.set(hash, {
            ...item,
            parsed: parsed
          })
        }
      }
    })
    
    return results
  }
}

// Utility functions for external use
export function parseItemDescription(description, itemData) {
  const parser = new TextParser()
  return parser.parseDescription(description, itemData)
}

export function extractTriggers(description) {
  const parser = new TextParser()
  return parser.extractTriggers(description)
}

export function batchParseItems(items) {
  const parser = new TextParser()
  return parser.parseItems(items)
}