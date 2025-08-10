// lib/destiny-intelligence/synergy-engine.js
// Analyzes trigger interactions and calculates synergies between items

export class SynergyEngine {
  constructor() {
    // Synergy strength multipliers
    this.synergyTypes = {
      trigger_chain: { multiplier: 1.5, description: 'One trigger enables another' },
      energy_loop: { multiplier: 1.8, description: 'Creates sustainable energy generation' },
      damage_stack: { multiplier: 1.4, description: 'Multiple damage bonuses stack' },
      cooldown_synergy: { multiplier: 1.6, description: 'Cooldown reductions work together' },
      condition_overlap: { multiplier: 1.1, description: 'Conditions trigger simultaneously' },
      negative_synergy: { multiplier: 0.8, description: 'Items work against each other' }
    }

    // Known synergy patterns for quick detection
    this.synergyPatterns = {
      grenade_loop: {
        triggers: ['grenade_kill', 'grenade_use'],
        effects: ['energy_restore', 'cooldown_reduction'],
        strength: 'high',
        description: 'Grenade kills restore grenade energy'
      },
      orb_engine: {
        triggers: ['orb_collection', 'weapon_kill'],
        effects: ['orb_generation', 'armor_charge_gain'],
        strength: 'high',
        description: 'Orb collection enables more orb generation'
      },
      weapon_damage: {
        triggers: ['weapon_kill', 'precision_kill'],
        effects: ['damage_increase', 'weapon_damage_increase'],
        strength: 'medium',
        description: 'Weapon damage bonuses stack together'
      },
      ability_spam: {
        triggers: ['ability_use', 'ability_kill'],
        effects: ['energy_restore', 'cooldown_reduction'],
        strength: 'very_high',
        description: 'Abilities generate resources for more abilities'
      }
    }

    // Trigger relationships for synergy detection
    this.triggerRelationships = {
      enables: {
        'weapon_kill': ['orb_generation', 'ammo_generation'],
        'ability_kill': ['orb_generation', 'energy_restore'],
        'orb_collection': ['armor_charge_gain', 'health_restore'],
        'precision_kill': ['weapon_kill', 'orb_generation'],
        'grenade_kill': ['ability_kill', 'energy_restore'],
        'melee_kill': ['ability_kill', 'energy_restore']
      },
      conflicts: {
        'low_health': ['full_health'],
        'sprinting': ['crouching'],
        'airborne': ['grounded'],
        'close_range': ['long_range']
      }
    }

    // Mathematical stacking rules
    this.stackingRules = {
      damage_increase: 'multiplicative',
      weapon_damage: 'multiplicative', 
      cooldown_reduction: 'multiplicative_capped',
      energy_restore: 'additive',
      armor_charge_gain: 'additive',
      reload_speed: 'additive_diminishing'
    }
  }

  /**
   * Analyze synergies between multiple items
   * @param {Array} items - Array of items with parsed data
   * @param {Object} buildContext - Build context and goals
   * @returns {Object} Complete synergy analysis
   */
  analyzeSynergies(items, buildContext = {}) {
    const analysis = {
      synergies: [],
      conflicts: [],
      loops: [],
      totalSynergyScore: 0,
      recommendations: [],
      triggerMap: new Map(),
      effectMap: new Map()
    }

    // Build trigger and effect maps for fast lookup
    this.buildMaps(items, analysis)

    // Find pairwise synergies
    analysis.synergies = this.findPairwiseSynergies(items, buildContext)

    // Detect resource loops
    analysis.loops = this.detectResourceLoops(analysis.triggerMap, analysis.effectMap)

    // Find conflicts
    analysis.conflicts = this.findConflicts(items)

    // Calculate total synergy score
    analysis.totalSynergyScore = this.calculateTotalScore(analysis)

    // Generate recommendations
    analysis.recommendations = this.generateSynergyRecommendations(analysis, buildContext)

    return analysis
  }

  /**
   * Find synergy between two specific items
   * @param {Object} item1 - First item
   * @param {Object} item2 - Second item
   * @param {Object} buildContext - Build context
   * @returns {Object} Synergy analysis between the two items
   */
  findSynergy(item1, item2, buildContext) {
    const synergy = {
      item1: item1.displayProperties?.name || 'Unknown',
      item2: item2.displayProperties?.name || 'Unknown',
      type: null,
      strength: 0,
      multiplier: 1,
      description: '',
      triggers: [],
      effects: [],
      mathematical: null
    }

    if (!item1.parsed || !item2.parsed) {
      return synergy
    }

    // Check trigger-based synergies
    const triggerSynergy = this.analyzeTriggerSynergy(item1.parsed, item2.parsed)
    if (triggerSynergy.strength > 0) {
      Object.assign(synergy, triggerSynergy)
    }

    // Check mathematical synergies
    const mathSynergy = this.analyzeMathematicalSynergy(item1.parsed, item2.parsed)
    if (mathSynergy.strength > 0) {
      synergy.mathematical = mathSynergy
      synergy.strength = Math.max(synergy.strength, mathSynergy.strength)
    }

    // Check energy synergies
    const energySynergy = this.analyzeEnergySynergy(item1.parsed, item2.parsed)
    if (energySynergy.strength > 0) {
      synergy.strength = Math.max(synergy.strength, energySynergy.strength)
    }

    return synergy
  }

  /**
   * Build trigger and effect maps for efficient analysis
   */
  buildMaps(items, analysis) {
    items.forEach((item, index) => {
      if (!item.parsed) return

      // Map triggers
      item.parsed.triggers.forEach(trigger => {
        const condition = trigger.normalizedCondition
        if (!analysis.triggerMap.has(condition)) {
          analysis.triggerMap.set(condition, [])
        }
        analysis.triggerMap.get(condition).push({ item, index, trigger })
      })

      // Map effects
      item.parsed.effects.forEach(effect => {
        const effectType = effect.normalizedEffect
        if (!analysis.effectMap.has(effectType)) {
          analysis.effectMap.set(effectType, [])
        }
        analysis.effectMap.get(effectType).push({ item, index, effect })
      })
    })
  }

  /**
   * Find synergies between all pairs of items
   */
  findPairwiseSynergies(items, buildContext) {
    const synergies = []

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const synergy = this.findSynergy(items[i], items[j], buildContext)
        if (synergy.strength > 0.3) { // Only include meaningful synergies
          synergies.push(synergy)
        }
      }
    }

    return synergies.sort((a, b) => b.strength - a.strength)
  }

  /**
   * Analyze trigger-based synergies between two items
   */
  analyzeTriggerSynergy(parsed1, parsed2) {
    const synergy = {
      type: null,
      strength: 0,
      multiplier: 1,
      description: '',
      triggers: []
    }

    const triggers1 = parsed1.triggers.map(t => t.normalizedCondition)
    const triggers2 = parsed2.triggers.map(t => t.normalizedCondition)
    const effects1 = parsed1.effects.map(e => e.normalizedEffect)
    const effects2 = parsed2.effects.map(e => e.normalizedEffect)

    // Check for trigger chains (item1 trigger enables item2 effect)
    for (const trigger1 of triggers1) {
      for (const effect2 of effects2) {
        if (this.triggerEnablesEffect(trigger1, effect2)) {
          synergy.type = 'trigger_chain'
          synergy.strength = 0.8
          synergy.multiplier = this.synergyTypes.trigger_chain.multiplier
          synergy.description = `${trigger1} enables ${effect2}`
          synergy.triggers.push({ trigger: trigger1, enables: effect2 })
        }
      }
    }

    // Check for circular dependencies (energy loops)
    const circularDeps = this.findCircularDependencies(triggers1, effects1, triggers2, effects2)
    if (circularDeps.length > 0) {
      synergy.type = 'energy_loop'
      synergy.strength = 0.9
      synergy.multiplier = this.synergyTypes.energy_loop.multiplier
      synergy.description = 'Creates sustainable energy loop'
      synergy.triggers.push(...circularDeps)
    }

    // Check for condition overlap
    const overlap = triggers1.filter(t => triggers2.includes(t))
    if (overlap.length > 0) {
      synergy.type = 'condition_overlap'
      synergy.strength = 0.6
      synergy.multiplier = this.synergyTypes.condition_overlap.multiplier
      synergy.description = `Both items trigger on: ${overlap.join(', ')}`
    }

    return synergy
  }

  /**
   * Analyze mathematical synergies between items
   */
  analyzeMathematicalSynergy(parsed1, parsed2) {
    const synergy = {
      type: 'mathematical',
      strength: 0,
      calculations: [],
      stackingType: null
    }

    // Get mathematical effects from both items
    const math1 = parsed1.mathematical || []
    const math2 = parsed2.mathematical || []

    if (math1.length === 0 || math2.length === 0) {
      return synergy
    }

    // Look for stacking bonuses
    const stackableEffects = this.findStackableEffects(math1, math2)
    if (stackableEffects.length > 0) {
      synergy.strength = 0.7
      synergy.stackingType = this.determineStackingType(stackableEffects)
      synergy.calculations = this.calculateStackedValues(stackableEffects)
    }

    return synergy
  }

  /**
   * Analyze energy cost synergies
   */
  analyzeEnergySynergy(parsed1, parsed2) {
    const synergy = {
      strength: 0,
      energyEfficiency: 0
    }

    const energy1 = parsed1.energy?.cost || 0
    const energy2 = parsed2.energy?.cost || 0
    const totalCost = energy1 + energy2

    // Perfect energy usage (exactly 10)
    if (totalCost === 10) {
      synergy.strength = 0.6
      synergy.energyEfficiency = 1.0
    }
    // Efficient usage (8-9)
    else if (totalCost >= 8 && totalCost <= 9) {
      synergy.strength = 0.4
      synergy.energyEfficiency = 0.8
    }
    // Over capacity (penalty)
    else if (totalCost > 10) {
      synergy.strength = -0.3
      synergy.energyEfficiency = 0.3
    }

    return synergy
  }

  /**
   * Detect resource loops in the build
   */
  detectResourceLoops(triggerMap, effectMap) {
    const loops = []
    const visited = new Set()

    // Build a graph of trigger->effect relationships
    const graph = new Map()

    triggerMap.forEach((triggerItems, trigger) => {
      const enabledEffects = this.triggerRelationships.enables[trigger] || []
      
      enabledEffects.forEach(effect => {
        if (effectMap.has(effect)) {
          if (!graph.has(trigger)) {
            graph.set(trigger, [])
          }
          graph.get(trigger).push(effect)
        }
      })
    })

    // Find cycles using DFS
    for (const trigger of triggerMap.keys()) {
      if (!visited.has(trigger)) {
        const cycle = this.findCycleDFS(graph, trigger, visited, new Set(), [])
        if (cycle.length > 0) {
          loops.push({
            type: 'resource_loop',
            chain: cycle,
            strength: this.calculateLoopStrength(cycle),
            sustainability: this.calculateLoopSustainability(cycle)
          })
        }
      }
    }

    return loops
  }

  /**
   * Find conflicts between items
   */
  findConflicts(items) {
    const conflicts = []

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const item1 = items[i]
        const item2 = items[j]

        if (!item1.parsed || !item2.parsed) continue

        // Check trigger conflicts
        const triggerConflicts = this.findTriggerConflicts(item1.parsed, item2.parsed)
        if (triggerConflicts.length > 0) {
          conflicts.push({
            item1: item1.displayProperties?.name || 'Unknown',
            item2: item2.displayProperties?.name || 'Unknown',
            type: 'trigger_conflict',
            conflicts: triggerConflicts,
            severity: 'medium'
          })
        }

        // Check energy conflicts
        const energyConflict = this.checkEnergyConflict(item1.parsed, item2.parsed)
        if (energyConflict.hasConflict) {
          conflicts.push({
            item1: item1.displayProperties?.name || 'Unknown',
            item2: item2.displayProperties?.name || 'Unknown',
            type: 'energy_conflict',
            totalCost: energyConflict.totalCost,
            severity: 'high'
          })
        }
      }
    }

    return conflicts
  }

  /**
   * Helper methods for synergy analysis
   */

  triggerEnablesEffect(trigger, effect) {
    const enabledEffects = this.triggerRelationships.enables[trigger] || []
    return enabledEffects.includes(effect) || this.effectsAreRelated(trigger, effect)
  }

  effectsAreRelated(trigger, effect) {
    const relationMap = {
      'weapon_kill': ['weapon_damage', 'ammo_generation', 'orb_generation'],
      'ability_kill': ['ability_energy', 'orb_generation', 'cooldown_reduction'],
      'orb_collection': ['ability_energy', 'health_restore', 'armor_charge'],
      'grenade_kill': ['grenade_energy', 'grenade_damage'],
      'precision_kill': ['weapon_damage', 'critical_bonus']
    }

    const relatedEffects = relationMap[trigger] || []
    return relatedEffects.some(related => effect.includes(related))
  }

  findCircularDependencies(triggers1, effects1, triggers2, effects2) {
    const dependencies = []

    // Check if item1 effects enable item2 triggers and vice versa
    for (const effect1 of effects1) {
      for (const trigger2 of triggers2) {
        if (this.triggerEnablesEffect(effect1, trigger2)) {
          for (const effect2 of effects2) {
            for (const trigger1 of triggers1) {
              if (this.triggerEnablesEffect(effect2, trigger1)) {
                dependencies.push({
                  loop: [trigger1, effect1, trigger2, effect2],
                  type: 'circular'
                })
              }
            }
          }
        }
      }
    }

    return dependencies
  }

  findStackableEffects(math1, math2) {
    const stackable = []

    for (const effect1 of math1) {
      for (const effect2 of math2) {
        if (this.effectsCanStack(effect1, effect2)) {
          stackable.push({ effect1, effect2 })
        }
      }
    }

    return stackable
  }

  effectsCanStack(effect1, effect2) {
    // Check if contexts suggest same type of bonus
    const context1 = effect1.context?.toLowerCase() || ''
    const context2 = effect2.context?.toLowerCase() || ''

    const damageKeywords = ['damage', 'bonus', 'increase']
    const reloadKeywords = ['reload', 'speed']
    const cooldownKeywords = ['cooldown', 'reduction']

    const isDamage1 = damageKeywords.some(kw => context1.includes(kw))
    const isDamage2 = damageKeywords.some(kw => context2.includes(kw))
    
    if (isDamage1 && isDamage2) return true

    const isReload1 = reloadKeywords.some(kw => context1.includes(kw))
    const isReload2 = reloadKeywords.some(kw => context2.includes(kw))
    
    if (isReload1 && isReload2) return true

    return false
  }

  determineStackingType(stackableEffects) {
    // Analyze contexts to determine stacking behavior
    const contexts = stackableEffects.flatMap(s => [s.effect1.context, s.effect2.context])
    const allContexts = contexts.join(' ').toLowerCase()

    if (allContexts.includes('multiply') || allContexts.includes('amplify')) {
      return 'multiplicative'
    }

    return 'additive' // Default assumption
  }

  calculateStackedValues(stackableEffects) {
    return stackableEffects.map(({ effect1, effect2 }) => {
      const value1 = effect1.value || 0
      const value2 = effect2.value || 0

      return {
        effect1Value: value1,
        effect2Value: value2,
        stackedValue: value1 + value2, // Simplified calculation
        stackingType: 'additive'
      }
    })
  }

  findTriggerConflicts(parsed1, parsed2) {
    const conflicts = []
    const triggers1 = parsed1.triggers.map(t => t.normalizedCondition)
    const triggers2 = parsed2.triggers.map(t => t.normalizedCondition)

    for (const trigger1 of triggers1) {
      for (const trigger2 of triggers2) {
        const conflictingTriggers = this.triggerRelationships.conflicts[trigger1] || []
        if (conflictingTriggers.includes(trigger2)) {
          conflicts.push({
            trigger1,
            trigger2,
            reason: 'mutually_exclusive'
          })
        }
      }
    }

    return conflicts
  }

  checkEnergyConflict(parsed1, parsed2) {
    const cost1 = parsed1.energy?.cost || 0
    const cost2 = parsed2.energy?.cost || 0
    const totalCost = cost1 + cost2

    return {
      hasConflict: totalCost > 10,
      totalCost,
      overage: Math.max(0, totalCost - 10)
    }
  }

  findCycleDFS(graph, node, visited, recStack, path) {
    visited.add(node)
    recStack.add(node)
    path.push(node)

    const neighbors = graph.get(node) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        const cycle = this.findCycleDFS(graph, neighbor, visited, recStack, [...path])
        if (cycle.length > 0) return cycle
      } else if (recStack.has(neighbor)) {
        // Found cycle
        const cycleStart = path.indexOf(neighbor)
        return path.slice(cycleStart)
      }
    }

    recStack.delete(node)
    return []
  }

  calculateLoopStrength(cycle) {
    const baseStrength = 0.8
    const lengthPenalty = Math.max(0, (cycle.length - 3) * 0.1)
    return Math.max(0.3, baseStrength - lengthPenalty)
  }

  calculateLoopSustainability(cycle) {
    // Estimate practical sustainability
    const reliabilityMap = {
      'weapon_kill': 0.9,
      'ability_kill': 0.7,
      'orb_collection': 0.8,
      'precision_kill': 0.6
    }

    let sustainability = 1.0
    for (const step of cycle) {
      const reliability = reliabilityMap[step] || 0.5
      sustainability *= reliability
    }

    return sustainability
  }

  calculateTotalScore(analysis) {
    let score = 0

    // Add synergy scores
    analysis.synergies.forEach(synergy => {
      score += synergy.strength * synergy.multiplier
    })

    // Add loop scores (loops are valuable)
    analysis.loops.forEach(loop => {
      score += loop.strength * loop.sustainability * 2
    })

    // Subtract conflict penalties
    analysis.conflicts.forEach(conflict => {
      const penalty = conflict.severity === 'high' ? 0.5 : 0.2
      score -= penalty
    })

    return Math.max(0, score)
  }

  generateSynergyRecommendations(analysis, buildContext) {
    const recommendations = []

    // Recommend maximizing strong synergies
    const strongSynergies = analysis.synergies.filter(s => s.strength > 0.7)
    if (strongSynergies.length > 0) {
      recommendations.push({
        type: 'maximize_synergy',
        priority: 'high',
        message: 'Strong synergies detected - build around these combinations',
        synergies: strongSynergies
      })
    }

    // Recommend addressing conflicts
    const highConflicts = analysis.conflicts.filter(c => c.severity === 'high')
    if (highConflicts.length > 0) {
      recommendations.push({
        type: 'resolve_conflicts',
        priority: 'high',
        message: 'Resolve energy or trigger conflicts',
        conflicts: highConflicts
      })
    }

    // Recommend completing loops
    if (analysis.loops.length > 0) {
      recommendations.push({
        type: 'optimize_loops',
        priority: 'medium',
        message: 'Resource loops detected - optimize for sustainability',
        loops: analysis.loops
      })
    }

    return recommendations
  }
}

// Utility functions for external use
export function analyzeSynergies(items, buildContext = {}) {
  const engine = new SynergyEngine()
  return engine.analyzeSynergies(items, buildContext)
}

export function findItemSynergy(item1, item2, buildContext = {}) {
  const engine = new SynergyEngine()
  return engine.findSynergy(item1, item2, buildContext)
}