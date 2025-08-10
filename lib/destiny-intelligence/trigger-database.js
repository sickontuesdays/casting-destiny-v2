// lib/destiny-intelligence/trigger-database.js
// Database of known trigger patterns, effects, and their relationships

export class TriggerDatabase {
  constructor() {
    // Known trigger conditions with reliability and context
    this.triggerConditions = {
      weapon_kill: {
        name: 'Weapon Kill',
        reliability: 0.9,
        frequency: 'high',
        contexts: ['combat', 'general'],
        requirements: ['weapon_equipped', 'enemy_available']
      },
      precision_kill: {
        name: 'Precision Kill',
        reliability: 0.7,
        frequency: 'medium',
        contexts: ['skilled_play', 'pve', 'pvp'],
        requirements: ['weapon_equipped', 'precision_shot']
      },
      grenade_kill: {
        name: 'Grenade Kill',
        reliability: 0.6,
        frequency: 'medium',
        contexts: ['ability_focused', 'add_clear'],
        requirements: ['grenade_available']
      },
      melee_kill: {
        name: 'Melee Kill',
        reliability: 0.5,
        frequency: 'medium',
        contexts: ['close_combat', 'ability_focused'],
        requirements: ['melee_available', 'close_range']
      },
      orb_collection: {
        name: 'Orb of Power Collection',
        reliability: 0.8,
        frequency: 'medium',
        contexts: ['team_play', 'orb_generation'],
        requirements: ['orb_available']
      },
      armor_charge_gain: {
        name: 'Armor Charge Gain',
        reliability: 0.9,
        frequency: 'high',
        contexts: ['charged_builds', 'elemental_wells'],
        requirements: ['well_pickup', 'orb_pickup']
      },
      ability_use: {
        name: 'Ability Use',
        reliability: 0.9,
        frequency: 'medium',
        contexts: ['ability_focused'],
        requirements: ['ability_available']
      },
      class_ability_use: {
        name: 'Class Ability Use',
        reliability: 0.9,
        frequency: 'medium',
        contexts: ['utility_builds'],
        requirements: ['class_ability_available']
      },
      low_health: {
        name: 'Low Health',
        reliability: 0.6,
        frequency: 'variable',
        contexts: ['dangerous_content', 'risk_reward'],
        requirements: ['health_below_threshold']
      },
      damage_taken: {
        name: 'Taking Damage',
        reliability: 0.8,
        frequency: 'high',
        contexts: ['defensive_builds', 'reactive'],
        requirements: ['enemy_damage_source']
      },
      weapon_reload: {
        name: 'Weapon Reload',
        reliability: 0.9,
        frequency: 'high',
        contexts: ['weapon_builds'],
        requirements: ['weapon_equipped', 'ammo_depleted']
      }
    }

    // Known effects and their impact ratings
    this.effects = {
      damage_increase: {
        name: 'Damage Increase',
        impact: 0.9,
        category: 'damage',
        stacking: 'multiplicative',
        typical_values: [10, 15, 20, 25, 30, 50]
      },
      weapon_damage_increase: {
        name: 'Weapon Damage Increase',
        impact: 0.8,
        category: 'damage',
        stacking: 'multiplicative',
        typical_values: [5, 10, 15, 20, 25, 30]
      },
      energy_restore: {
        name: 'Energy Restore',
        impact: 0.8,
        category: 'resource',
        stacking: 'additive',
        typical_values: [10, 15, 20, 25, 30, 50]
      },
      armor_charge_gain: {
        name: 'Armor Charge Gain',
        impact: 0.7,
        category: 'resource',
        stacking: 'additive',
        typical_values: [1, 2, 3, 4, 5]
      },
      cooldown_reduction: {
        name: 'Cooldown Reduction',
        impact: 0.8,
        category: 'resource',
        stacking: 'multiplicative_capped',
        typical_values: [10, 15, 20, 25, 30, 50]
      },
      health_restore: {
        name: 'Health Restore',
        impact: 0.6,
        category: 'defensive',
        stacking: 'additive',
        typical_values: [25, 50, 75, 100, 150]
      },
      overshield_grant: {
        name: 'Overshield Grant',
        impact: 0.7,
        category: 'defensive',
        stacking: 'overwrite',
        typical_values: [25, 50, 75, 100]
      },
      reload_speed_increase: {
        name: 'Reload Speed Increase',
        impact: 0.5,
        category: 'utility',
        stacking: 'additive_diminishing',
        typical_values: [10, 15, 20, 25, 30, 50]
      },
      orb_generation: {
        name: 'Orb Generation',
        impact: 0.7,
        category: 'generation',
        stacking: 'additive',
        typical_values: [1, 2, 3, 4, 5]
      }
    }

    // Known synergy patterns for quick pattern matching
    this.synergyPatterns = {
      infinite_grenade_loop: {
        triggers: ['grenade_kill', 'armor_charge_gain'],
        effects: ['energy_restore', 'cooldown_reduction'],
        strength: 0.9,
        reliability: 0.8,
        description: 'Grenade kills generate resources that restore grenade energy',
        sustainability: 0.85
      },
      weapon_dps_stack: {
        triggers: ['precision_kill', 'weapon_reload'],
        effects: ['weapon_damage_increase', 'damage_increase'],
        strength: 0.8,
        reliability: 0.9,
        description: 'Precision kills and reloads stack weapon damage bonuses',
        sustainability: 0.9
      },
      orb_generation_loop: {
        triggers: ['orb_collection', 'weapon_kill'],
        effects: ['orb_generation', 'energy_restore', 'armor_charge_gain'],
        strength: 0.85,
        reliability: 0.7,
        description: 'Orb collection enables more orb generation through kills',
        sustainability: 0.75
      },
      ability_spam_engine: {
        triggers: ['ability_kill', 'ability_use'],
        effects: ['energy_restore', 'cooldown_reduction'],
        strength: 0.9,
        reliability: 0.8,
        description: 'Using abilities generates resources to use more abilities',
        sustainability: 0.8
      },
      survivability_stack: {
        triggers: ['low_health', 'damage_taken', 'orb_collection'],
        effects: ['health_restore', 'overshield_grant'],
        strength: 0.7,
        reliability: 0.8,
        description: 'Multiple defensive layers activate under pressure',
        sustainability: 0.7
      }
    }

    // Trigger relationships for synergy detection
    this.triggerEnablement = {
      weapon_kill: {
        enables: ['orb_generation', 'ammo_generation'],
        enabled_by: ['weapon_equipped'],
        strength: 0.9
      },
      precision_kill: {
        enables: ['weapon_kill', 'orb_generation', 'critical_bonus'],
        enabled_by: ['weapon_equipped', 'precision_capability'],
        strength: 0.8
      },
      orb_collection: {
        enables: ['armor_charge_gain', 'energy_restore', 'health_restore'],
        enabled_by: ['orb_generation', 'teammate_supers'],
        strength: 0.8
      },
      ability_kill: {
        enables: ['orb_generation', 'energy_restore'],
        enabled_by: ['ability_available'],
        strength: 0.7
      },
      grenade_kill: {
        enables: ['ability_kill', 'energy_restore'],
        enabled_by: ['grenade_available'],
        strength: 0.7
      }
    }

    // Mathematical relationships for effect stacking
    this.mathematicalRelationships = {
      damage_stacking: {
        type: 'multiplicative',
        effects: ['damage_increase', 'weapon_damage_increase'],
        formula: (effects) => effects.reduce((acc, val) => acc * (1 + val/100), 1) - 1,
        cap: null
      },
      cooldown_stacking: {
        type: 'multiplicative_capped',
        effects: ['cooldown_reduction'],
        formula: (effects) => 1 - effects.reduce((acc, val) => acc * (1 - val/100), 1),
        cap: 0.8 // 80% reduction cap
      },
      energy_restoration: {
        type: 'additive',
        effects: ['energy_restore'],
        formula: (effects) => effects.reduce((acc, val) => acc + val, 0),
        cap: 100 // 100% energy cap
      },
      armor_charges: {
        type: 'additive',
        effects: ['armor_charge_gain'],
        formula: (effects) => effects.reduce((acc, val) => acc + val, 0),
        cap: 5 // Maximum 5 charges
      }
    }

    // Activity-specific trigger relevance
    this.activityRelevance = {
      raid: {
        high_value: ['weapon_kill', 'precision_kill', 'orb_collection'],
        medium_value: ['ability_kill', 'weapon_reload'],
        low_value: ['sprinting', 'movement_triggers'],
        modifiers: { dps_phase: 1.5, add_clear: 1.2, survival: 1.3 }
      },
      grandmaster: {
        high_value: ['damage_taken', 'low_health', 'orb_collection'],
        medium_value: ['precision_kill', 'weapon_kill'],
        low_value: ['risky_triggers', 'close_combat'],
        modifiers: { survival: 2.0, range: 1.5, safety: 1.8 }
      },
      pvp: {
        high_value: ['weapon_kill', 'precision_kill', 'ability_kill'],
        medium_value: ['weapon_reload', 'damage_taken'],
        low_value: ['pve_specific', 'orb_collection'],
        modifiers: { ttk_improvement: 2.0, mobility: 1.5, burst: 1.3 }
      },
      general_pve: {
        high_value: ['weapon_kill', 'ability_kill', 'orb_collection'],
        medium_value: ['precision_kill', 'weapon_reload'],
        low_value: ['specialized_triggers'],
        modifiers: { fun_factor: 1.2, accessibility: 1.3 }
      }
    }
  }

  /**
   * Get trigger information by name
   * @param {string} triggerName - Name of the trigger
   * @returns {Object|null} Trigger information
   */
  getTrigger(triggerName) {
    return this.triggerConditions[triggerName] || null
  }

  /**
   * Get effect information by name
   * @param {string} effectName - Name of the effect
   * @returns {Object|null} Effect information
   */
  getEffect(effectName) {
    return this.effects[effectName] || null
  }

  /**
   * Find synergy patterns that match given triggers and effects
   * @param {Array} triggers - Array of trigger names
   * @param {Array} effects - Array of effect names
   * @returns {Array} Matching synergy patterns with coverage scores
   */
  findMatchingSynergyPatterns(triggers, effects) {
    const matchingPatterns = []

    Object.entries(this.synergyPatterns).forEach(([patternName, pattern]) => {
      const triggerMatches = pattern.triggers.filter(t => triggers.includes(t)).length
      const effectMatches = pattern.effects.filter(e => effects.includes(e)).length
      
      const triggerCoverage = triggerMatches / pattern.triggers.length
      const effectCoverage = effectMatches / pattern.effects.length
      const overallMatch = (triggerCoverage + effectCoverage) / 2
      
      if (overallMatch > 0.4) { // Minimum 40% match
        matchingPatterns.push({
          pattern: patternName,
          ...pattern,
          triggerCoverage,
          effectCoverage,
          overallMatch
        })
      }
    })

    return matchingPatterns.sort((a, b) => b.overallMatch - a.overallMatch)
  }

  /**
   * Calculate effect stacking based on mathematical relationships
   * @param {Array} effects - Array of effects with values
   * @returns {Object} Calculated stacked effects
   */
  calculateEffectStacking(effects) {
    const results = {}

    Object.entries(this.mathematicalRelationships).forEach(([relationName, config]) => {
      const relevantEffects = effects.filter(effect => 
        config.effects.includes(effect.type) && effect.value
      )
      
      if (relevantEffects.length > 1) {
        const values = relevantEffects.map(e => e.value)
        let result = config.formula(values)
        
        // Apply cap if configured
        if (config.cap !== null) {
          result = Math.min(result, config.cap)
        }
        
        results[relationName] = {
          finalValue: result,
          componentEffects: relevantEffects,
          stackingType: config.type,
          cappedByLimit: config.cap !== null && result >= config.cap
        }
      }
    })

    return results
  }

  /**
   * Get activity-specific relevance for triggers and effects
   * @param {string} activity - Activity name
   * @param {Array} triggers - Array of trigger names
   * @param {Array} effects - Array of effect names
   * @returns {Object} Relevance analysis
   */
  getActivityRelevance(activity, triggers, effects) {
    const activityData = this.activityRelevance[activity]
    if (!activityData) {
      return { relevanceScore: 0.5, analysis: 'Unknown activity' }
    }

    let relevanceScore = 0
    const totalItems = triggers.length + effects.length
    const analysis = {
      highValue: [],
      mediumValue: [],
      lowValue: [],
      modifiers: activityData.modifiers
    }

    // Score triggers
    triggers.forEach(trigger => {
      if (activityData.high_value.includes(trigger)) {
        relevanceScore += 1.0
        analysis.highValue.push(trigger)
      } else if (activityData.medium_value.includes(trigger)) {
        relevanceScore += 0.6
        analysis.mediumValue.push(trigger)
      } else if (activityData.low_value.includes(trigger)) {
        relevanceScore += 0.2
        analysis.lowValue.push(trigger)
      } else {
        relevanceScore += 0.4 // Neutral
      }
    })

    // Score effects similarly
    effects.forEach(effect => {
      if (activityData.high_value.includes(effect)) {
        relevanceScore += 1.0
        analysis.highValue.push(effect)
      } else if (activityData.medium_value.includes(effect)) {
        relevanceScore += 0.6
        analysis.mediumValue.push(effect)
      } else if (activityData.low_value.includes(effect)) {
        relevanceScore += 0.2
        analysis.lowValue.push(effect)
      } else {
        relevanceScore += 0.4
      }
    })

    return {
      relevanceScore: totalItems > 0 ? relevanceScore / totalItems : 0,
      analysis
    }
  }

  /**
   * Suggest missing components for a synergy pattern
   * @param {Array} currentTriggers - Current triggers in build
   * @param {Array} currentEffects - Current effects in build
   * @param {string} targetPattern - Target synergy pattern name
   * @returns {Object} Missing components analysis
   */
  suggestMissingComponents(currentTriggers, currentEffects, targetPattern) {
    const pattern = this.synergyPatterns[targetPattern]
    if (!pattern) {
      return null
    }

    const missingTriggers = pattern.triggers.filter(t => !currentTriggers.includes(t))
    const missingEffects = pattern.effects.filter(e => !currentEffects.includes(e))

    return {
      pattern: targetPattern,
      missingTriggers,
      missingEffects,
      completeness: {
        triggers: (pattern.triggers.length - missingTriggers.length) / pattern.triggers.length,
        effects: (pattern.effects.length - missingEffects.length) / pattern.effects.length
      },
      priority: pattern.strength,
      description: pattern.description
    }
  }

  /**
   * Validate if a trigger-effect combination makes sense
   * @param {string} trigger - Trigger name
   * @param {string} effect - Effect name
   * @returns {Object} Validation result
   */
  validateTriggerEffectCombination(trigger, effect) {
    const triggerData = this.getTrigger(trigger)
    const effectData = this.getEffect(effect)

    if (!triggerData || !effectData) {
      return { valid: false, reason: 'Unknown trigger or effect' }
    }

    // Check direct enablement
    const enablement = this.triggerEnablement[trigger]
    if (enablement?.enables.includes(effect)) {
      return { 
        valid: true, 
        strength: enablement.strength,
        reasoning: 'Direct enablement relationship'
      }
    }

    // Check context compatibility
    const contextOverlap = triggerData.contexts.some(ctx => 
      this.effectMatchesContext(effect, ctx)
    )

    if (contextOverlap) {
      return {
        valid: true,
        strength: 0.6,
        reasoning: 'Compatible contexts'
      }
    }

    return {
      valid: false,
      reason: 'No logical relationship found'
    }
  }

  /**
   * Get all synergy patterns sorted by strength
   * @returns {Array} Sorted synergy patterns
   */
  getAllSynergyPatterns() {
    return Object.entries(this.synergyPatterns)
      .map(([name, pattern]) => ({ name, ...pattern }))
      .sort((a, b) => (b.strength * b.reliability) - (a.strength * a.reliability))
  }

  /**
   * Find potential conflicts between triggers
   * @param {Array} triggers - Array of trigger names
   * @returns {Array} Potential conflicts
   */
  findTriggerConflicts(triggers) {
    const conflicts = []
    
    // Define conflicting trigger pairs
    const conflictPairs = [
      ['low_health', 'full_health'],
      ['sprinting', 'crouching'],
      ['airborne', 'grounded'],
      ['close_range', 'long_range']
    ]

    conflictPairs.forEach(([trigger1, trigger2]) => {
      if (triggers.includes(trigger1) && triggers.includes(trigger2)) {
        conflicts.push({
          trigger1,
          trigger2,
          reason: 'mutually_exclusive',
          severity: 'medium'
        })
      }
    })

    return conflicts
  }

  /**
   * Calculate trigger reliability for a build
   * @param {Array} triggers - Array of trigger names
   * @param {string} activity - Target activity
   * @returns {Object} Reliability analysis
   */
  calculateTriggerReliability(triggers, activity = 'general_pve') {
    let totalReliability = 0
    let weightedReliability = 0
    let totalWeight = 0

    triggers.forEach(triggerName => {
      const trigger = this.getTrigger(triggerName)
      if (trigger) {
        const baseReliability = trigger.reliability
        const activityRelevance = this.getActivityRelevance(activity, [triggerName], [])
        const weight = activityRelevance.relevanceScore
        
        totalReliability += baseReliability
        weightedReliability += baseReliability * weight
        totalWeight += weight
      }
    })

    return {
      averageReliability: triggers.length > 0 ? totalReliability / triggers.length : 0,
      weightedReliability: totalWeight > 0 ? weightedReliability / totalWeight : 0,
      triggerCount: triggers.length
    }
  }

  /**
   * Helper method to check if effect matches context
   */
  effectMatchesContext(effect, context) {
    const contextMatching = {
      'combat': ['damage_increase', 'weapon_damage_increase'],
      'defensive': ['health_restore', 'overshield_grant'],
      'utility': ['reload_speed_increase', 'handling_increase'],
      'resource': ['energy_restore', 'armor_charge_gain', 'cooldown_reduction']
    }

    const matchingEffects = contextMatching[context] || []
    return matchingEffects.some(matchEffect => effect.includes(matchEffect))
  }

  /**
   * Export database for analysis or debugging
   * @returns {Object} Complete database export
   */
  exportDatabase() {
    return {
      triggers: this.triggerConditions,
      effects: this.effects,
      synergyPatterns: this.synergyPatterns,
      enablement: this.triggerEnablement,
      mathematics: this.mathematicalRelationships,
      activityRelevance: this.activityRelevance,
      version: '1.0',
      exportDate: new Date().toISOString()
    }
  }
}

// Utility functions for external use
export function createTriggerDatabase() {
  return new TriggerDatabase()
}

export function analyzeTriggerSynergy(triggers, effects, activity = 'general_pve') {
  const db = new TriggerDatabase()
  
  const patterns = db.findMatchingSynergyPatterns(triggers, effects)
  const conflicts = db.findTriggerConflicts(triggers)
  const relevance = db.getActivityRelevance(activity, triggers, effects)
  const reliability = db.calculateTriggerReliability(triggers, activity)
  
  return {
    synergyPatterns: patterns,
    conflicts,
    activityRelevance: relevance,
    reliability,
    recommendations: patterns.slice(0, 3) // Top 3 patterns
  }
}

export function validateBuildSynergy(triggers, effects) {
  const db = new TriggerDatabase()
  const validations = []
  
  triggers.forEach(trigger => {
    effects.forEach(effect => {
      const validation = db.validateTriggerEffectCombination(trigger, effect)
      if (validation.valid) {
        validations.push({
          trigger,
          effect,
          ...validation
        })
      }
    })
  })
  
  return validations.sort((a, b) => b.strength - a.strength)
}