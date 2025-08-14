export class SynergyEngine {
  constructor() {
    this.initialized = false
    this.manifest = null
    this.synergyRules = new Map()
    this.conflictRules = new Map()
    this.exoticSynergies = new Map()
  }

  async initialize(manifestData) {
    try {
      console.log('🔗 Initializing Synergy Engine...')
      
      this.manifest = manifestData
      this.buildSynergyRules()
      this.buildConflictRules()
      this.buildExoticSynergies()
      
      this.initialized = true
      console.log('✅ Synergy Engine initialized')
      return true
      
    } catch (error) {
      console.error('❌ Synergy Engine initialization failed:', error)
      return false
    }
  }

  buildSynergyRules() {
    // Stat-based synergies
    this.synergyRules.set('high_weapons_fast_reload', {
      condition: (build) => this.getStatValue(build, 'weapons') >= 100,
      effect: 'Faster weapon handling and reload speeds',
      strength: 'moderate',
      category: 'weapon_performance'
    })

    this.synergyRules.set('high_health_survivability', {
      condition: (build) => this.getStatValue(build, 'health') >= 120,
      effect: 'Increased survivability and damage resistance',
      strength: 'strong',
      category: 'survivability'
    })

    this.synergyRules.set('high_super_frequent_supers', {
      condition: (build) => this.getStatValue(build, 'super') >= 100,
      effect: 'More frequent Super ability usage',
      strength: 'strong',
      category: 'ability_regen'
    })

    this.synergyRules.set('high_grenade_spam', {
      condition: (build) => this.getStatValue(build, 'grenade') >= 100,
      effect: 'Frequent grenade ability usage',
      strength: 'moderate',
      category: 'ability_regen'
    })

    this.synergyRules.set('high_melee_combat', {
      condition: (build) => this.getStatValue(build, 'melee') >= 100,
      effect: 'Enhanced melee combat effectiveness',
      strength: 'moderate',
      category: 'ability_regen'
    })

    this.synergyRules.set('high_class_utility', {
      condition: (build) => this.getStatValue(build, 'class') >= 100,
      effect: 'Frequent class ability usage',
      strength: 'moderate',
      category: 'ability_regen'
    })

    // Multi-stat synergies
    this.synergyRules.set('balanced_high_stats', {
      condition: (build) => {
        const stats = ['weapons', 'health', 'class', 'super', 'grenade', 'melee']
        const highStats = stats.filter(stat => this.getStatValue(build, stat) >= 80)
        return highStats.length >= 4
      },
      effect: 'Well-rounded combat effectiveness',
      strength: 'strong',
      category: 'overall_performance'
    })

    this.synergyRules.set('ability_focused', {
      condition: (build) => {
        const abilityStats = ['super', 'grenade', 'melee', 'class']
        const highAbilityStats = abilityStats.filter(stat => this.getStatValue(build, stat) >= 80)
        return highAbilityStats.length >= 3
      },
      effect: 'Powerful ability-based gameplay',
      strength: 'strong',
      category: 'ability_synergy'
    })

    // Equipment-based synergies
    this.synergyRules.set('exotic_armor_synergy', {
      condition: (build) => this.hasExoticArmor(build),
      effect: 'Unique exotic armor benefits',
      strength: 'moderate',
      category: 'exotic_synergy'
    })

    this.synergyRules.set('exotic_weapon_synergy', {
      condition: (build) => this.hasExoticWeapon(build),
      effect: 'Unique exotic weapon benefits',
      strength: 'moderate',
      category: 'exotic_synergy'
    })
  }

  buildConflictRules() {
    // Multiple exotics conflict
    this.conflictRules.set('multiple_exotic_armor', {
      condition: (build) => this.countExoticArmor(build) > 1,
      description: 'Cannot equip multiple exotic armor pieces',
      severity: 'critical',
      category: 'equipment_restriction'
    })

    this.conflictRules.set('multiple_exotic_weapons', {
      condition: (build) => this.countExoticWeapons(build) > 1,
      description: 'Cannot equip multiple exotic weapons',
      severity: 'critical',
      category: 'equipment_restriction'
    })

    // Stat waste conflicts
    this.conflictRules.set('stat_waste', {
      condition: (build) => {
        const stats = build.stats?.totalStats || {}
        return Object.values(stats).some(value => value > 200)
      },
      description: 'Some stats exceed maximum effective value',
      severity: 'moderate',
      category: 'stat_inefficiency'
    })

    this.conflictRules.set('low_survivability', {
      condition: (build) => this.getStatValue(build, 'health') < 40,
      description: 'Very low survivability stats',
      severity: 'high',
      category: 'survivability_risk'
    })
  }

  buildExoticSynergies() {
    // Armor exotic synergies based on known items
    this.exoticSynergies.set('ophidian_aspect', {
      name: 'Ophidian Aspect',
      synergiesWith: ['weapons'],
      boosts: { weapons: 'Enhanced weapon handling' },
      playstyles: ['aggressive', 'weapon_focused'],
      activities: ['pvp', 'general_pve']
    })

    this.exoticSynergies.set('celestial_nighthawk', {
      name: 'Celestial Nighthawk',
      synergiesWith: ['super'],
      boosts: { super: 'Massive single-target damage' },
      playstyles: ['dps', 'boss_damage'],
      activities: ['raid', 'dungeon', 'nightfall']
    })

    this.exoticSynergies.set('doom_fang_pauldron', {
      name: 'Doom Fang Pauldron',
      synergiesWith: ['melee', 'super'],
      boosts: { 
        melee: 'Melee kills extend Super',
        super: 'Longer Super duration'
      },
      playstyles: ['aggressive', 'melee_focused'],
      activities: ['general_pve', 'patrol']
    })
  }

  async findSynergies(build) {
    if (!this.initialized) {
      console.warn('Synergy Engine not initialized')
      return []
    }

    try {
      const synergies = []

      // Check stat-based synergies
      for (const [id, rule] of this.synergyRules) {
        if (rule.condition(build)) {
          synergies.push({
            id,
            name: this.generateSynergyName(rule),
            description: rule.effect,
            strength: rule.strength,
            category: rule.category,
            type: 'stat_synergy',
            items: this.getRelevantItems(build, rule)
          })
        }
      }

      // Check exotic-specific synergies
      const exoticSynergies = this.findExoticSynergies(build)
      synergies.push(...exoticSynergies)

      // Check mod synergies
      const modSynergies = this.findModSynergies(build)
      synergies.push(...modSynergies)

      // Analyze and score synergies
      const scoredSynergies = this.scoreSynergies(synergies, build)

      console.log(`🔗 Found ${scoredSynergies.length} synergies`)
      return scoredSynergies

    } catch (error) {
      console.error('Error finding synergies:', error)
      return []
    }
  }

  findExoticSynergies(build) {
    const synergies = []
    
    // Check each equipment slot for exotics
    const slots = ['helmet', 'arms', 'chest', 'legs', 'class', 'kinetic', 'energy', 'power']
    
    slots.forEach(slot => {
      const item = build[slot]
      if (item && item.tier === 'Exotic') {
        const exoticKey = item.name?.toLowerCase().replace(/\s+/g, '_')
        const exoticData = this.exoticSynergies.get(exoticKey)
        
        if (exoticData) {
          // Check if build stats align with exotic's strengths
          exoticData.synergiesWith.forEach(stat => {
            const statValue = this.getStatValue(build, stat)
            if (statValue >= 60) {
              synergies.push({
                id: `exotic_${exoticKey}_${stat}`,
                name: `${item.name} + High ${stat}`,
                description: `${item.name} benefits from high ${stat}: ${exoticData.boosts[stat]}`,
                strength: statValue >= 100 ? 'strong' : 'moderate',
                category: 'exotic_synergy',
                type: 'exotic_stat_synergy',
                items: [item.name],
                exotic: item.name
              })
            }
          })
        } else {
          // Generic exotic synergy
          synergies.push({
            id: `exotic_${exoticKey}`,
            name: `${item.name} Synergy`,
            description: `${item.name} provides unique exotic benefits`,
            strength: 'moderate',
            category: 'exotic_synergy',
            type: 'exotic_generic',
            items: [item.name],
            exotic: item.name
          })
        }
      }
    })

    return synergies
  }

  findModSynergies(build) {
    const synergies = []
    
    if (!build.mods || build.mods.length === 0) {
      return synergies
    }

    // Group mods by type
    const modGroups = this.groupModsByType(build.mods)
    
    // Check for mod synergies
    Object.entries(modGroups).forEach(([type, mods]) => {
      if (mods.length >= 2) {
        synergies.push({
          id: `mod_synergy_${type}`,
          name: `${type} Mod Stack`,
          description: `Multiple ${type} mods work together for enhanced effect`,
          strength: mods.length >= 3 ? 'strong' : 'moderate',
          category: 'mod_synergy',
          type: 'mod_stack',
          items: mods
        })
      }
    })

    return synergies
  }

  scoreSynergies(synergies, build) {
    return synergies.map(synergy => {
      let score = this.getBaseScore(synergy.strength)
      
      // Boost score based on category importance
      const categoryBoosts = {
        'exotic_synergy': 15,
        'ability_synergy': 12,
        'overall_performance': 10,
        'survivability': 8,
        'weapon_performance': 6,
        'mod_synergy': 4
      }
      
      score += categoryBoosts[synergy.category] || 0
      
      // Consider build context
      score += this.getContextualScore(synergy, build)
      
      return {
        ...synergy,
        score: Math.min(score, 100)
      }
    }).sort((a, b) => b.score - a.score)
  }

  getBaseScore(strength) {
    const scores = {
      'weak': 30,
      'moderate': 60,
      'strong': 80,
      'powerful': 95
    }
    return scores[strength] || 50
  }

  getContextualScore(synergy, build) {
    let contextScore = 0
    
    // Bonus for multiple related synergies
    const relatedSynergies = this.countRelatedSynergies(synergy, build)
    contextScore += relatedSynergies * 2
    
    // Bonus for activity-specific synergies
    if (synergy.category === 'survivability' && this.isDefensiveActivity(build)) {
      contextScore += 5
    }
    
    if (synergy.category === 'weapon_performance' && this.isOffensiveActivity(build)) {
      contextScore += 5
    }
    
    return contextScore
  }

  async findConflicts(build) {
    const conflicts = []
    
    for (const [id, rule] of this.conflictRules) {
      if (rule.condition(build)) {
        conflicts.push({
          id,
          description: rule.description,
          severity: rule.severity,
          category: rule.category,
          type: 'build_conflict',
          suggestions: this.generateConflictSuggestions(rule, build)
        })
      }
    }
    
    return conflicts
  }

  generateConflictSuggestions(rule, build) {
    const suggestions = []
    
    if (rule.category === 'equipment_restriction') {
      suggestions.push('Remove one exotic item to comply with game restrictions')
    }
    
    if (rule.category === 'stat_inefficiency') {
      suggestions.push('Redistribute stats to avoid waste and improve efficiency')
    }
    
    if (rule.category === 'survivability_risk') {
      suggestions.push('Increase health stat for better survivability')
    }
    
    return suggestions
  }

  // Helper methods
  getStatValue(build, statName) {
    return build.stats?.totalStats?.[statName] || 0
  }

  hasExoticArmor(build) {
    const armorSlots = ['helmet', 'arms', 'chest', 'legs', 'class']
    return armorSlots.some(slot => build[slot]?.tier === 'Exotic')
  }

  hasExoticWeapon(build) {
    const weaponSlots = ['kinetic', 'energy', 'power']
    return weaponSlots.some(slot => build[slot]?.tier === 'Exotic')
  }

  countExoticArmor(build) {
    const armorSlots = ['helmet', 'arms', 'chest', 'legs', 'class']
    return armorSlots.filter(slot => build[slot]?.tier === 'Exotic').length
  }

  countExoticWeapons(build) {
    const weaponSlots = ['kinetic', 'energy', 'power']
    return weaponSlots.filter(slot => build[slot]?.tier === 'Exotic').length
  }

  generateSynergyName(rule) {
    const categoryNames = {
      'weapon_performance': 'Weapon Mastery',
      'survivability': 'Tank Build',
      'ability_regen': 'Ability Focus',
      'overall_performance': 'Well-Rounded',
      'ability_synergy': 'Ability Chain',
      'exotic_synergy': 'Exotic Power'
    }
    
    return categoryNames[rule.category] || 'Synergy'
  }

  getRelevantItems(build, rule) {
    // Return items that contribute to this synergy
    const items = []
    
    if (rule.category === 'exotic_synergy') {
      const slots = ['helmet', 'arms', 'chest', 'legs', 'class', 'kinetic', 'energy', 'power']
      slots.forEach(slot => {
        if (build[slot]?.tier === 'Exotic') {
          items.push(build[slot].name)
        }
      })
    }
    
    return items
  }

  groupModsByType(mods) {
    const groups = {}
    
    mods.forEach(mod => {
      const type = this.getModType(mod)
      if (!groups[type]) {
        groups[type] = []
      }
      groups[type].push(mod)
    })
    
    return groups
  }

  getModType(mod) {
    if (typeof mod === 'string') {
      if (mod.toLowerCase().includes('stat')) return 'stat'
      if (mod.toLowerCase().includes('resist')) return 'resistance'
      if (mod.toLowerCase().includes('loader')) return 'weapon'
      if (mod.toLowerCase().includes('finder')) return 'ammo'
      return 'utility'
    }
    return 'unknown'
  }

  countRelatedSynergies(synergy, build) {
    // Count how many other synergies share similar categories or effects
    return 0 // Simplified for now
  }

  isDefensiveActivity(build) {
    // Determine if this build is for defensive activities like raids/nightfalls
    return false // Would check build metadata or requirements
  }

  isOffensiveActivity(build) {
    // Determine if this build is for offensive activities like PvP
    return false // Would check build metadata or requirements
  }

  // Public utility methods
  isInitialized() {
    return this.initialized
  }

  getSynergyRules() {
    return Array.from(this.synergyRules.entries())
  }

  getConflictRules() {
    return Array.from(this.conflictRules.entries())
  }

  getExoticSynergies() {
    return Array.from(this.exoticSynergies.entries())
  }

  // Method to add custom synergy rules
  addSynergyRule(id, rule) {
    this.synergyRules.set(id, rule)
  }

  // Method to add custom conflict rules
  addConflictRule(id, rule) {
    this.conflictRules.set(id, rule)
  }
}