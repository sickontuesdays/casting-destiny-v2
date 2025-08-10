export class SynergyEngine {
  constructor() {
    this.manifest = null
    this.isInitialized = false
    
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
        'energy_restore': ['energy_drain'],
        'cooldown_reduction': ['cooldown_increase'],
        'damage_increase': ['damage_reduction']
      }
    }
  }

  async initialize(manifest) {
    if (this.isInitialized) return

    if (!manifest) {
      throw new Error('Manifest data is required for SynergyEngine initialization')
    }

    this.manifest = manifest

    try {
      console.log('Initializing Synergy Engine...')

      // Process manifest data to identify synergy opportunities
      await this.processSynergyData()

      this.isInitialized = true
      console.log('Synergy Engine initialized successfully')

    } catch (error) {
      console.error('Failed to initialize Synergy Engine:', error)
      throw new Error(`Synergy Engine initialization failed: ${error.message}`)
    }
  }

  async processSynergyData() {
    // Process manifest to identify items with synergy potential
    try {
      const items = this.manifest?.data?.DestinyInventoryItemDefinition
      if (!items) return

      // Analyze exotic armor for synergy patterns
      for (const [hash, item] of Object.entries(items)) {
        if (item.inventory?.tierType === 6 && item.itemType === 2) { // Exotic armor
          this.analyzeItemSynergyPotential(item, hash)
        }
      }

    } catch (error) {
      console.warn('Error processing synergy data:', error)
    }
  }

  analyzeItemSynergyPotential(item, hash) {
    // Analyze item description and perks for synergy keywords
    const description = item.displayProperties?.description?.toLowerCase() || ''
    const name = item.displayProperties?.name?.toLowerCase() || ''
    
    // Store synergy potential data for later use
    if (!this.itemSynergyMap) {
      this.itemSynergyMap = new Map()
    }

    const synergyPotential = {
      triggers: this.extractTriggersFromDescription(description),
      effects: this.extractEffectsFromDescription(description),
      categories: this.categorizeItem(name, description)
    }

    this.itemSynergyMap.set(hash, synergyPotential)
  }

  extractTriggersFromDescription(description) {
    const triggers = []
    
    // Common trigger patterns
    const triggerPatterns = {
      'weapon_kill': ['weapon kills', 'defeating enemies with weapons'],
      'grenade_kill': ['grenade kills', 'grenade defeats'],
      'melee_kill': ['melee kills', 'melee defeats', 'powered melee'],
      'ability_kill': ['ability kills', 'ability defeats'],
      'precision_kill': ['precision kills', 'critical hits'],
      'orb_collection': ['picking up orbs', 'orb pickup', 'collecting orbs'],
      'super_use': ['super activation', 'casting super'],
      'taking_damage': ['taking damage', 'when damaged'],
      'low_health': ['critically wounded', 'low health']
    }

    for (const [trigger, patterns] of Object.entries(triggerPatterns)) {
      if (patterns.some(pattern => description.includes(pattern))) {
        triggers.push(trigger)
      }
    }

    return triggers
  }

  extractEffectsFromDescription(description) {
    const effects = []
    
    // Common effect patterns
    const effectPatterns = {
      'energy_restore': ['restore energy', 'gain energy', 'energy regeneration'],
      'damage_increase': ['increased damage', 'bonus damage', 'damage boost'],
      'cooldown_reduction': ['reduced cooldown', 'faster regeneration'],
      'orb_generation': ['generate orbs', 'create orbs'],
      'health_restore': ['restore health', 'health regeneration', 'healing'],
      'overshield': ['overshield', 'shield'],
      'invisibility': ['invisible', 'invisibility'],
      'weapon_damage': ['weapon damage', 'increased weapon'],
      'super_energy': ['super energy', 'super regeneration']
    }

    for (const [effect, patterns] of Object.entries(effectPatterns)) {
      if (patterns.some(pattern => description.includes(pattern))) {
        effects.push(effect)
      }
    }

    return effects
  }

  categorizeItem(name, description) {
    const categories = []
    
    // Categorize by playstyle
    if (description.includes('grenade') || name.includes('grenade')) {
      categories.push('grenade_focused')
    }
    if (description.includes('melee') || name.includes('melee')) {
      categories.push('melee_focused')
    }
    if (description.includes('weapon') || description.includes('gun')) {
      categories.push('weapon_focused')
    }
    if (description.includes('super') || description.includes('ultimate')) {
      categories.push('super_focused')
    }
    if (description.includes('healing') || description.includes('health')) {
      categories.push('survivability')
    }

    return categories
  }

  async findSynergies(build) {
    if (!this.isInitialized) {
      throw new Error('Synergy Engine not initialized. Call initialize() first.')
    }

    try {
      const synergies = []
      
      // Analyze build items for synergy patterns
      const buildItems = this.extractBuildItems(build)
      
      // Check for known synergy patterns
      for (const [patternName, pattern] of Object.entries(this.synergyPatterns)) {
        const synergyMatch = this.checkPatternMatch(buildItems, pattern)
        if (synergyMatch.matches) {
          synergies.push({
            type: 'pattern_match',
            pattern: patternName,
            strength: pattern.strength,
            description: pattern.description,
            items: synergyMatch.items,
            impact: this.calculateSynergyImpact(pattern.strength),
            recommendations: this.generateSynergyRecommendations(patternName, buildItems)
          })
        }
      }

      // Check for trigger-effect chains
      const chainSynergies = this.findTriggerEffectChains(buildItems)
      synergies.push(...chainSynergies)

      // Check for conflicts
      const conflicts = this.findConflicts(buildItems)
      synergies.push(...conflicts)

      return synergies

    } catch (error) {
      console.error('Error finding synergies:', error)
      return []
    }
  }

  extractBuildItems(build) {
    const items = []
    const slots = ['helmet', 'arms', 'chest', 'legs', 'class', 'kinetic', 'energy', 'power']
    
    for (const slot of slots) {
      const item = build[slot]
      if (item && item.hash) {
        const itemData = this.manifest?.data?.DestinyInventoryItemDefinition?.[item.hash]
        if (itemData) {
          items.push({
            slot,
            hash: item.hash,
            data: itemData,
            synergy: this.itemSynergyMap?.get(item.hash.toString()) || null
          })
        }
      }
    }

    return items
  }

  checkPatternMatch(buildItems, pattern) {
    const triggerMatches = []
    const effectMatches = []
    
    for (const item of buildItems) {
      if (item.synergy) {
        // Check triggers
        for (const trigger of pattern.triggers) {
          if (item.synergy.triggers.includes(trigger)) {
            triggerMatches.push({ item, trigger })
          }
        }
        
        // Check effects
        for (const effect of pattern.effects) {
          if (item.synergy.effects.includes(effect)) {
            effectMatches.push({ item, effect })
          }
        }
      }
    }

    const hasRequiredTriggers = triggerMatches.length > 0
    const hasRequiredEffects = effectMatches.length > 0
    
    return {
      matches: hasRequiredTriggers && hasRequiredEffects,
      items: [...triggerMatches, ...effectMatches],
      strength: triggerMatches.length + effectMatches.length
    }
  }

  findTriggerEffectChains(buildItems) {
    const chains = []
    
    try {
      // Look for items where one trigger enables another's effect
      for (let i = 0; i < buildItems.length; i++) {
        for (let j = i + 1; j < buildItems.length; j++) {
          const item1 = buildItems[i]
          const item2 = buildItems[j]
          
          if (item1.synergy && item2.synergy) {
            const chain = this.analyzeItemPairSynergy(item1, item2)
            if (chain) {
              chains.push(chain)
            }
          }
        }
      }

    } catch (error) {
      console.warn('Error finding trigger-effect chains:', error)
    }

    return chains
  }

  analyzeItemPairSynergy(item1, item2) {
    // Check if item1's effects enable item2's triggers or vice versa
    const synergy1to2 = this.findDirectionalSynergy(item1, item2)
    const synergy2to1 = this.findDirectionalSynergy(item2, item1)
    
    if (synergy1to2 || synergy2to1) {
      return {
        type: 'trigger_chain',
        strength: 'moderate',
        description: `${item1.data.displayProperties.name} and ${item2.data.displayProperties.name} create a synergy loop`,
        items: [item1, item2],
        impact: 'moderate',
        chain: synergy1to2 ? `${item1.data.displayProperties.name} → ${item2.data.displayProperties.name}` :
                             `${item2.data.displayProperties.name} → ${item1.data.displayProperties.name}`
      }
    }
    
    return null
  }

  findDirectionalSynergy(sourceItem, targetItem) {
    // Check if source item's effects enable target item's triggers
    for (const effect of sourceItem.synergy.effects) {
      for (const trigger of targetItem.synergy.triggers) {
        if (this.triggerRelationships.enables[trigger]?.includes(effect)) {
          return { effect, trigger }
        }
      }
    }
    return null
  }

  findConflicts(buildItems) {
    const conflicts = []
    
    try {
      for (let i = 0; i < buildItems.length; i++) {
        for (let j = i + 1; j < buildItems.length; j++) {
          const item1 = buildItems[i]
          const item2 = buildItems[j]
          
          if (item1.synergy && item2.synergy) {
            const conflict = this.checkForConflict(item1, item2)
            if (conflict) {
              conflicts.push({
                type: 'conflict',
                strength: 'negative',
                description: `${item1.data.displayProperties.name} and ${item2.data.displayProperties.name} have conflicting effects`,
                items: [item1, item2],
                impact: 'negative',
                severity: conflict.severity,
                details: conflict.details
              })
            }
          }
        }
      }

    } catch (error) {
      console.warn('Error finding conflicts:', error)
    }

    return conflicts
  }

  checkForConflict(item1, item2) {
    // Check for conflicting effects
    for (const effect1 of item1.synergy.effects) {
      for (const effect2 of item2.synergy.effects) {
        const conflicts = this.triggerRelationships.conflicts[effect1]
        if (conflicts && conflicts.includes(effect2)) {
          return {
            severity: 'moderate',
            details: `${effect1} conflicts with ${effect2}`
          }
        }
      }
    }
    return null
  }

  calculateSynergyImpact(strength) {
    const impactMap = {
      'very_high': 'major',
      'high': 'major',
      'medium': 'moderate',
      'low': 'minor'
    }
    return impactMap[strength] || 'minor'
  }

  generateSynergyRecommendations(patternName, buildItems) {
    const recommendations = []
    
    switch (patternName) {
      case 'grenade_loop':
        recommendations.push('Focus on Discipline stat for faster grenade regeneration')
        recommendations.push('Consider mods that enhance grenade energy')
        break
      case 'orb_engine':
        recommendations.push('Use masterworked weapons for orb generation')
        recommendations.push('Consider armor mods that consume orbs')
        break
      case 'ability_spam':
        recommendations.push('Prioritize ability-related stats')
        recommendations.push('Consider elemental well mods')
        break
      default:
        recommendations.push('Optimize related stats and mods')
    }
    
    return recommendations
  }

  async findPotentialSynergies(build) {
    // Find synergies that could be achieved with different items
    const potentialSynergies = []
    
    try {
      const buildItems = this.extractBuildItems(build)
      
      // Check what synergies are almost complete
      for (const [patternName, pattern] of Object.entries(this.synergyPatterns)) {
        const match = this.checkPatternMatch(buildItems, pattern)
        if (match.strength > 0 && !match.matches) {
          // Pattern is partially matched - suggest completion
          potentialSynergies.push({
            pattern: patternName,
            description: `Complete the ${pattern.description} synergy`,
            requirements: this.getPatternCompletionRequirements(pattern, match),
            benefit: pattern.strength,
            impact: this.calculateSynergyImpact(pattern.strength)
          })
        }
      }

    } catch (error) {
      console.warn('Error finding potential synergies:', error)
    }

    return potentialSynergies
  }

  getPatternCompletionRequirements(pattern, currentMatch) {
    const requirements = []
    
    // Find missing triggers and effects
    const foundTriggers = currentMatch.items
      .filter(item => item.trigger)
      .map(item => item.trigger)
    const foundEffects = currentMatch.items
      .filter(item => item.effect)
      .map(item => item.effect)

    const missingTriggers = pattern.triggers.filter(t => !foundTriggers.includes(t))
    const missingEffects = pattern.effects.filter(e => !foundEffects.includes(e))

    if (missingTriggers.length > 0) {
      requirements.push(`Need items with: ${missingTriggers.join(', ')}`)
    }
    if (missingEffects.length > 0) {
      requirements.push(`Need items with: ${missingEffects.join(', ')}`)
    }

    return requirements
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
      patternDetection: this.isInitialized,
      chainAnalysis: this.isInitialized,
      conflictDetection: this.isInitialized,
      potentialSynergies: this.isInitialized
    }
  }

  getSynergyStats() {
    return {
      knownPatterns: Object.keys(this.synergyPatterns).length,
      triggerRelationships: Object.keys(this.triggerRelationships.enables).length,
      conflictRules: Object.keys(this.triggerRelationships.conflicts).length,
      processedItems: this.itemSynergyMap?.size || 0
    }
  }
}

// Export as default for backward compatibility
export default SynergyEngine