class TriggerDatabase {
  constructor() {
    this.manifestData = null
    this.initialized = false
    this.triggers = new Map()
    this.effects = new Map()
    this.chains = new Map()
    this.conflicts = new Map()
  }

  async initialize(manifestData) {
    try {
      console.log('Initializing Trigger Database...')
      this.manifestData = manifestData
      this.buildTriggerMappings()
      this.buildEffectMappings()
      this.buildChainMappings()
      this.buildConflictMappings()
      this.initialized = true
      console.log('Trigger Database initialized successfully')
      return true
    } catch (error) {
      console.error('Error initializing Trigger Database:', error)
      return false
    }
  }

  isInitialized() {
    return this.initialized
  }

  buildTriggerMappings() {
    // Weapon-based triggers
    this.triggers.set('weapon_kill', {
      type: 'weapon_kill',
      sources: ['any_weapon', 'primary', 'special', 'heavy'],
      conditions: ['precision', 'elemental_match', 'weapon_type'],
      cooldown: 0,
      description: 'Triggering on weapon kills'
    })

    this.triggers.set('ability_kill', {
      type: 'ability_kill',
      sources: ['grenade', 'melee', 'super', 'class_ability'],
      conditions: ['elemental_match', 'charged_with_light'],
      cooldown: 0,
      description: 'Triggering on ability kills'
    })

    this.triggers.set('precision_kill', {
      type: 'precision_kill',
      sources: ['any_weapon', 'sniper', 'hand_cannon', 'scout_rifle'],
      conditions: ['weapon_type', 'range'],
      cooldown: 0,
      description: 'Triggering on precision kills'
    })

    // Damage-based triggers
    this.triggers.set('taking_damage', {
      type: 'taking_damage',
      sources: ['any_source', 'elemental', 'kinetic'],
      conditions: ['health_threshold', 'damage_type'],
      cooldown: 1000,
      description: 'Triggering when taking damage'
    })

    this.triggers.set('dealing_damage', {
      type: 'dealing_damage',
      sources: ['weapon', 'ability', 'super'],
      conditions: ['damage_threshold', 'target_type'],
      cooldown: 500,
      description: 'Triggering when dealing damage'
    })

    // Activity-based triggers
    this.triggers.set('orb_pickup', {
      type: 'orb_pickup',
      sources: ['orb_of_power', 'orb_of_light'],
      conditions: ['super_energy', 'charged_with_light'],
      cooldown: 0,
      description: 'Triggering on orb pickup'
    })

    this.triggers.set('enemy_death', {
      type: 'enemy_death',
      sources: ['nearby_enemy', 'any_enemy'],
      conditions: ['proximity', 'kill_method'],
      cooldown: 0,
      description: 'Triggering on enemy death nearby'
    })

    // Stat-based triggers
    this.triggers.set('low_health', {
      type: 'low_health',
      sources: ['critical_health', 'red_bar_health'],
      conditions: ['health_percentage'],
      cooldown: 2000,
      description: 'Triggering at low health'
    })

    this.triggers.set('full_health', {
      type: 'full_health',
      sources: ['maximum_health'],
      conditions: ['recent_damage'],
      cooldown: 1000,
      description: 'Triggering at full health'
    })

    // Time-based triggers
    this.triggers.set('periodic', {
      type: 'periodic',
      sources: ['timer'],
      conditions: ['interval'],
      cooldown: 0,
      description: 'Triggering periodically'
    })

    this.triggers.set('on_spawn', {
      type: 'on_spawn',
      sources: ['respawn', 'mission_start'],
      conditions: ['location'],
      cooldown: 0,
      description: 'Triggering on spawn/respawn'
    })
  }

  buildEffectMappings() {
    // Stat enhancement effects
    this.effects.set('stat_boost', {
      type: 'stat_boost',
      targets: ['mobility', 'resilience', 'recovery', 'discipline', 'intellect', 'strength'],
      magnitude: [10, 20, 30, 50, 100],
      duration: [5000, 10000, 15000, 30000],
      stackable: true,
      description: 'Temporarily increases stats'
    })

    this.effects.set('damage_boost', {
      type: 'damage_boost',
      targets: ['weapon_damage', 'ability_damage', 'super_damage'],
      magnitude: [10, 15, 20, 25, 35],
      duration: [5000, 10000, 15000],
      stackable: false,
      description: 'Increases damage output'
    })

    // Defensive effects
    this.effects.set('damage_resistance', {
      type: 'damage_resistance',
      targets: ['all_damage', 'elemental_damage', 'kinetic_damage'],
      magnitude: [10, 15, 20, 25],
      duration: [5000, 10000, 15000],
      stackable: false,
      description: 'Reduces incoming damage'
    })

    this.effects.set('overshield', {
      type: 'overshield',
      targets: ['shield_points'],
      magnitude: [25, 50, 75, 100],
      duration: [8000, 12000, 16000],
      stackable: false,
      description: 'Grants temporary overshield'
    })

    // Ability enhancement effects
    this.effects.set('ability_regen', {
      type: 'ability_regen',
      targets: ['grenade', 'melee', 'class_ability', 'super'],
      magnitude: [20, 30, 50, 100],
      duration: [0], // Instant
      stackable: true,
      description: 'Instantly regenerates ability energy'
    })

    this.effects.set('ability_cooldown_reduction', {
      type: 'ability_cooldown_reduction',
      targets: ['grenade', 'melee', 'class_ability'],
      magnitude: [10, 20, 30, 50],
      duration: [10000, 15000, 20000],
      stackable: true,
      description: 'Reduces ability cooldowns'
    })

    // Weapon enhancement effects
    this.effects.set('reload_speed', {
      type: 'reload_speed',
      targets: ['primary', 'special', 'heavy', 'all_weapons'],
      magnitude: [25, 50, 75, 100],
      duration: [8000, 12000, 16000],
      stackable: false,
      description: 'Increases reload speed'
    })

    this.effects.set('weapon_handling', {
      type: 'weapon_handling',
      targets: ['primary', 'special', 'heavy', 'all_weapons'],
      magnitude: [30, 50, 70, 100],
      duration: [10000, 15000, 20000],
      stackable: false,
      description: 'Improves weapon handling'
    })

    // Special effects
    this.effects.set('invisibility', {
      type: 'invisibility',
      targets: ['player'],
      magnitude: [100],
      duration: [3000, 5000, 8000],
      stackable: false,
      description: 'Grants invisibility'
    })

    this.effects.set('charged_with_light', {
      type: 'charged_with_light',
      targets: ['light_stacks'],
      magnitude: [1, 2, 3, 4],
      duration: [60000], // 1 minute default
      stackable: true,
      description: 'Grants Charged with Light stacks'
    })
  }

  buildChainMappings() {
    // Kill chains
    this.chains.set('kill_chain_basic', {
      trigger: 'weapon_kill',
      effect: 'damage_boost',
      condition: 'rapid_kills',
      chain_length: 3,
      decay_time: 5000,
      description: 'Weapon kills grant increasing damage'
    })

    this.chains.set('precision_chain', {
      trigger: 'precision_kill',
      effect: 'reload_speed',
      condition: 'consecutive_precision',
      chain_length: 5,
      decay_time: 3000,
      description: 'Precision kills improve reload speed'
    })

    // Ability chains
    this.chains.set('ability_loop', {
      trigger: 'ability_kill',
      effect: 'ability_regen',
      condition: 'same_ability_type',
      chain_length: 999, // Infinite
      decay_time: 0,
      description: 'Ability kills regenerate ability energy'
    })

    this.chains.set('elemental_chain', {
      trigger: 'ability_kill',
      effect: 'damage_boost',
      condition: 'elemental_match',
      chain_length: 3,
      decay_time: 8000,
      description: 'Matching elemental kills increase damage'
    })

    // Defensive chains
    this.chains.set('survival_chain', {
      trigger: 'taking_damage',
      effect: 'damage_resistance',
      condition: 'health_threshold',
      chain_length: 3,
      decay_time: 10000,
      description: 'Taking damage grants increasing resistance'
    })

    this.chains.set('recovery_chain', {
      trigger: 'low_health',
      effect: 'stat_boost',
      condition: 'recovery_stat',
      chain_length: 2,
      decay_time: 15000,
      description: 'Low health boosts recovery'
    })
  }

  buildConflictMappings() {
    // Buff conflicts (effects that don't stack or override each other)
    this.conflicts.set('damage_boost_conflict', {
      conflicting_effects: ['damage_boost', 'weapon_damage_boost'],
      resolution: 'highest_magnitude',
      description: 'Multiple damage boosts use highest value'
    })

    this.conflicts.set('stat_boost_conflict', {
      conflicting_effects: ['stat_boost'],
      resolution: 'additive_cap',
      cap: 100,
      description: 'Stat boosts are additive up to cap'
    })

    this.conflicts.set('invisibility_conflict', {
      conflicting_effects: ['invisibility', 'stealth'],
      resolution: 'longest_duration',
      description: 'Invisibility effects use longest duration'
    })

    // Trigger conflicts (triggers that interfere with each other)
    this.conflicts.set('kill_trigger_conflict', {
      conflicting_triggers: ['weapon_kill', 'ability_kill', 'precision_kill'],
      resolution: 'priority_order',
      priority: ['precision_kill', 'ability_kill', 'weapon_kill'],
      description: 'Kill triggers prioritize precision over ability over weapon'
    })

    this.conflicts.set('health_trigger_conflict', {
      conflicting_triggers: ['low_health', 'full_health'],
      resolution: 'current_state',
      description: 'Health triggers based on current health state'
    })
  }

  getTrigger(triggerType) {
    if (!this.initialized) {
      console.warn('Trigger Database not initialized')
      return null
    }
    return this.triggers.get(triggerType) || null
  }

  getEffect(effectType) {
    if (!this.initialized) {
      console.warn('Trigger Database not initialized')
      return null
    }
    return this.effects.get(effectType) || null
  }

  getChain(chainType) {
    if (!this.initialized) {
      console.warn('Trigger Database not initialized')
      return null
    }
    return this.chains.get(chainType) || null
  }

  getConflict(conflictType) {
    if (!this.initialized) {
      console.warn('Trigger Database not initialized')
      return null
    }
    return this.conflicts.get(conflictType) || null
  }

  findTriggersBySource(source) {
    if (!this.initialized) return []
    
    const matchingTriggers = []
    this.triggers.forEach((trigger, key) => {
      if (trigger.sources.includes(source) || trigger.sources.includes('any_' + source)) {
        matchingTriggers.push({ type: key, ...trigger })
      }
    })
    return matchingTriggers
  }

  findEffectsByTarget(target) {
    if (!this.initialized) return []
    
    const matchingEffects = []
    this.effects.forEach((effect, key) => {
      if (effect.targets.includes(target) || effect.targets.includes('all_' + target)) {
        matchingEffects.push({ type: key, ...effect })
      }
    })
    return matchingEffects
  }

  findChainsByTrigger(triggerType) {
    if (!this.initialized) return []
    
    const matchingChains = []
    this.chains.forEach((chain, key) => {
      if (chain.trigger === triggerType) {
        matchingChains.push({ type: key, ...chain })
      }
    })
    return matchingChains
  }

  resolveTriggerConflicts(activeTriggers) {
    if (!this.initialized || !activeTriggers || activeTriggers.length === 0) {
      return activeTriggers
    }

    const resolved = [...activeTriggers]
    
    this.conflicts.forEach(conflict => {
      if (conflict.conflicting_triggers) {
        const conflictingInActive = activeTriggers.filter(trigger => 
          conflict.conflicting_triggers.includes(trigger.type)
        )
        
        if (conflictingInActive.length > 1) {
          // Resolve based on resolution strategy
          switch (conflict.resolution) {
            case 'priority_order':
              const prioritized = this.resolvePriorityConflict(conflictingInActive, conflict.priority)
              // Remove lower priority triggers
              conflictingInActive.forEach(trigger => {
                if (trigger !== prioritized) {
                  const index = resolved.findIndex(t => t.type === trigger.type)
                  if (index !== -1) resolved.splice(index, 1)
                }
              })
              break
              
            case 'current_state':
              // Keep the most recent trigger
              const mostRecent = conflictingInActive.reduce((latest, current) => 
                (current.timestamp || 0) > (latest.timestamp || 0) ? current : latest
              )
              conflictingInActive.forEach(trigger => {
                if (trigger !== mostRecent) {
                  const index = resolved.findIndex(t => t.type === trigger.type)
                  if (index !== -1) resolved.splice(index, 1)
                }
              })
              break
          }
        }
      }
    })
    
    return resolved
  }

  resolveEffectConflicts(activeEffects) {
    if (!this.initialized || !activeEffects || activeEffects.length === 0) {
      return activeEffects
    }

    const resolved = [...activeEffects]
    
    this.conflicts.forEach(conflict => {
      if (conflict.conflicting_effects) {
        const conflictingInActive = activeEffects.filter(effect => 
          conflict.conflicting_effects.includes(effect.type)
        )
        
        if (conflictingInActive.length > 1) {
          switch (conflict.resolution) {
            case 'highest_magnitude':
              const highest = conflictingInActive.reduce((max, current) => 
                (current.magnitude || 0) > (max.magnitude || 0) ? current : max
              )
              conflictingInActive.forEach(effect => {
                if (effect !== highest) {
                  const index = resolved.findIndex(e => e.type === effect.type)
                  if (index !== -1) resolved.splice(index, 1)
                }
              })
              break
              
            case 'longest_duration':
              const longest = conflictingInActive.reduce((max, current) => 
                (current.duration || 0) > (max.duration || 0) ? current : max
              )
              conflictingInActive.forEach(effect => {
                if (effect !== longest) {
                  const index = resolved.findIndex(e => e.type === effect.type)
                  if (index !== -1) resolved.splice(index, 1)
                }
              })
              break
              
            case 'additive_cap':
              // Sum magnitudes up to cap
              const totalMagnitude = conflictingInActive.reduce((sum, effect) => 
                sum + (effect.magnitude || 0), 0
              )
              if (totalMagnitude > conflict.cap) {
                // Scale down proportionally
                const scale = conflict.cap / totalMagnitude
                conflictingInActive.forEach(effect => {
                  if (effect.magnitude) {
                    effect.magnitude = Math.floor(effect.magnitude * scale)
                  }
                })
              }
              break
          }
        }
      }
    })
    
    return resolved
  }

  resolvePriorityConflict(conflictingItems, priority) {
    if (!priority || priority.length === 0) {
      return conflictingItems[0]
    }
    
    for (const priorityType of priority) {
      const found = conflictingItems.find(item => item.type === priorityType)
      if (found) return found
    }
    
    return conflictingItems[0]
  }

  simulateTriggerChain(trigger, context = {}) {
    if (!this.initialized) {
      return { success: false, reason: 'Database not initialized' }
    }

    const chains = this.findChainsByTrigger(trigger.type)
    if (chains.length === 0) {
      return { success: false, reason: 'No chains found for trigger' }
    }

    const results = []
    
    chains.forEach(chain => {
      const effect = this.getEffect(chain.effect)
      if (effect) {
        results.push({
          chain: chain.type,
          trigger: trigger.type,
          effect: chain.effect,
          magnitude: effect.magnitude[0], // Use first magnitude as default
          duration: effect.duration[0],
          success: true
        })
      }
    })

    return {
      success: results.length > 0,
      results,
      totalChains: results.length
    }
  }
}

// Export both named and default
export { TriggerDatabase }
export default TriggerDatabase