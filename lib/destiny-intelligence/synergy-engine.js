// lib/destiny-intelligence/synergy-engine.js
// Advanced synergy detection and optimization for Destiny 2 builds

export class SynergyEngine {
  constructor() {
    this.initialized = false
    this.manifest = null
    this.synergyRules = null
    this.elementData = null
    this.version = '2.0.0'
  }

  async initialize(manifestData) {
    try {
      console.log('🔗 Initializing Synergy Engine...')
      
      this.manifest = manifestData
      this.elementData = this.buildElementData()
      this.synergyRules = this.buildSynergyRules()
      
      this.initialized = true
      console.log('✅ Synergy Engine initialized successfully')
      return true
      
    } catch (error) {
      console.error('❌ Failed to initialize Synergy Engine:', error)
      this.initialized = false
      throw error
    }
  }

  buildElementData() {
    return {
      'solar': {
        verbs: ['ignite', 'scorch', 'burn'],
        keywords: ['restoration', 'radiant', 'cure', 'solar wells', 'ember'],
        effects: ['ignition', 'scorch', 'restoration', 'radiant'],
        aspects: ['touch of flame', 'heat rises', 'icarus dash'],
        fragments: ['ember of torches', 'ember of char', 'ember of tempering']
      },
      'arc': {
        verbs: ['jolt', 'blind', 'amplify'],
        keywords: ['ionic trace', 'amplified', 'blind', 'arc wells', 'spark'],
        effects: ['jolt', 'blind', 'amplified'],
        aspects: ['flow state', 'tempest strike', 'lethal current'],
        fragments: ['spark of resistance', 'spark of magnitude', 'spark of focus']
      },
      'void': {
        verbs: ['suppress', 'weaken', 'volatile'],
        keywords: ['devour', 'invisibility', 'overshield', 'void wells', 'echo'],
        effects: ['suppress', 'weaken', 'volatile', 'devour'],
        aspects: ['controlled flow', 'offensive bulwark', 'stylish executioner'],
        fragments: ['echo of domineering', 'echo of persistence', 'echo of undermining']
      },
      'stasis': {
        verbs: ['freeze', 'slow', 'shatter'],
        keywords: ['crystal', 'shard', 'freeze', 'stasis wells', 'whisper'],
        effects: ['freeze', 'slow', 'shatter'],
        aspects: ['glacial quake', 'diamond lance', 'tectonic harvest'],
        fragments: ['whisper of chains', 'whisper of shards', 'whisper of fissures']
      },
      'strand': {
        verbs: ['suspend', 'unravel', 'sever'],
        keywords: ['threadling', 'tangle', 'woven mail', 'strand wells', 'thread'],
        effects: ['suspend', 'unravel', 'sever', 'threadling'],
        aspects: ['threaded specter', 'ensnaring slam', 'widow\'s silk'],
        fragments: ['thread of generation', 'thread of warding', 'thread of fury']
      },
      'prismatic': {
        verbs: ['transcend', 'combine', 'harmonize'],
        keywords: ['light and dark', 'transcendence', 'harmonic', 'prismatic wells', 'facet'],
        effects: ['transcendence', 'light/dark harmony', 'elemental mixing'],
        aspects: ['mixed light/dark aspects'],
        fragments: ['facet of balance', 'facet of purpose', 'facet of courage']
      }
    }
  }

  buildSynergyRules() {
    return {
      // Element-based synergy rules
      elementSynergies: {
        'solar': [
          {
            name: 'Solar Weapon Synergy',
            description: 'Solar weapons trigger scorch and ignition effects',
            conditions: ['solar_subclass', 'solar_weapons'],
            benefits: ['increased_ignition_damage', 'enhanced_scorch_buildup']
          },
          {
            name: 'Well of Radiance Synergy', 
            description: 'Solar wells enhance ability regeneration',
            conditions: ['solar_subclass', 'elemental_well_mods'],
            benefits: ['faster_ability_regen', 'enhanced_damage']
          }
        ],
        'arc': [
          {
            name: 'Arc Chain Lightning',
            description: 'Arc abilities and weapons create chain effects',
            conditions: ['arc_subclass', 'arc_weapons'],
            benefits: ['chain_lightning', 'ionic_trace_generation']
          },
          {
            name: 'Amplified Synergy',
            description: 'Amplified state enhances movement and weapon handling',
            conditions: ['arc_subclass', 'amplified_effects'],
            benefits: ['enhanced_mobility', 'improved_handling']
          }
        ],
        'void': [
          {
            name: 'Void Devour Loop',
            description: 'Void kills trigger devour for health regeneration',
            conditions: ['void_subclass', 'devour_aspects'],
            benefits: ['health_on_kill', 'grenade_energy']
          },
          {
            name: 'Volatile Rounds',
            description: 'Void weapons create volatile explosions',
            conditions: ['void_subclass', 'void_weapons'],
            benefits: ['explosive_damage', 'add_clear']
          }
        ]
      },

      // Activity-based synergy rules
      activitySynergies: {
        'raid': [
          {
            name: 'Boss DPS Optimization',
            description: 'Build optimized for sustained boss damage',
            conditions: ['high_damage_weapons', 'damage_buffs'],
            benefits: ['increased_dps', 'phase_skipping']
          },
          {
            name: 'Team Utility Focus',
            description: 'Enhanced team support capabilities',
            conditions: ['support_supers', 'utility_aspects'],
            benefits: ['team_buffs', 'enhanced_survivability']
          }
        ],
        'pvp': [
          {
            name: 'Neutral Game Excellence',
            description: 'Strong performance without super abilities',
            conditions: ['high_stats', 'weapon_synergy'],
            benefits: ['consistent_performance', 'engagement_advantages']
          },
          {
            name: 'Quick Recovery Setup',
            description: 'Fast health recovery for sustained engagements',
            conditions: ['high_recovery', 'healing_effects'],
            benefits: ['faster_healing', 'engagement_reset']
          }
        ]
      },

      // Stat synergy rules
      statSynergies: [
        {
          name: 'Triple 100 Stats',
          description: 'Maximum effectiveness in three key stats',
          conditions: ['three_tier_10_stats'],
          benefits: ['peak_performance', 'consistent_abilities'],
          difficulty: 'very_high'
        },
        {
          name: 'Balanced High Stats',
          description: 'Well-rounded stat distribution',
          conditions: ['multiple_high_stats'],
          benefits: ['versatile_performance', 'consistent_uptime'],
          difficulty: 'moderate'
        }
      ],

      // Weapon synergy rules
      weaponSynergies: [
        {
          name: 'Elemental Weapon Matching',
          description: 'All weapons match subclass element',
          conditions: ['matching_weapon_elements'],
          benefits: ['enhanced_elemental_effects', 'consistent_synergy']
        },
        {
          name: 'Champion Counter Coverage',
          description: 'Complete champion mod coverage',
          conditions: ['champion_mods', 'appropriate_weapons'],
          benefits: ['champion_efficiency', 'team_utility']
        }
      ]
    }
  }

  async findSynergies(build) {
    if (!this.initialized) {
      throw new Error('Synergy Engine not initialized')
    }

    try {
      console.log('🔍 Analyzing build synergies...')
      
      const synergies = {
        element: this.findElementalSynergies(build),
        activity: this.findActivitySynergies(build),
        stat: this.findStatSynergies(build),
        weapon: this.findWeaponSynergies(build),
        armor: this.findArmorSynergies(build),
        overall: []
      }

      // Calculate overall synergy score
      synergies.score = this.calculateSynergyScore(synergies)
      
      // Generate combined synergies (cross-category)
      synergies.overall = this.generateOverallSynergies(build, synergies)
      
      console.log(`✅ Found ${synergies.overall.length} synergies with score ${synergies.score}`)
      
      return synergies
      
    } catch (error) {
      console.error('Error finding synergies:', error)
      return { overall: [], score: 0, error: error.message }
    }
  }

  findElementalSynergies(build) {
    const synergies = []
    const element = build.metadata.element
    
    if (!element || element === 'any') return synergies

    const elementRules = this.synergyRules.elementSynergies[element] || []
    
    for (const rule of elementRules) {
      if (this.checkSynergyConditions(build, rule.conditions)) {
        synergies.push({
          name: rule.name,
          description: rule.description,
          type: 'elemental',
          element: element,
          benefits: rule.benefits,
          strength: 'high'
        })
      }
    }

    // Check for elemental weapon matching
    if (build.loadout?.weapons) {
      const weaponElements = Object.values(build.loadout.weapons)
        .filter(w => w && w.element)
        .map(w => w.element.toLowerCase())
      
      const matchingWeapons = weaponElements.filter(e => e === element).length
      
      if (matchingWeapons >= 2) {
        synergies.push({
          name: 'Elemental Weapon Harmony',
          description: `Multiple ${element} weapons enhance elemental effects`,
          type: 'elemental',
          element: element,
          benefits: ['enhanced_elemental_damage', 'consistent_procs'],
          strength: 'medium'
        })
      }
    }

    return synergies
  }

  findActivitySynergies(build) {
    const synergies = []
    const activity = build.metadata.activity
    
    if (!activity) return synergies

    const activityRules = this.synergyRules.activitySynergies[activity] || []
    
    for (const rule of activityRules) {
      if (this.checkSynergyConditions(build, rule.conditions)) {
        synergies.push({
          name: rule.name,
          description: rule.description,
          type: 'activity',
          activity: activity,
          benefits: rule.benefits,
          strength: 'high'
        })
      }
    }

    // Activity-specific stat synergies
    if (activity === 'pvp' && build.stats) {
      if (build.stats.mobility >= 80 && build.stats.recovery >= 80) {
        synergies.push({
          name: 'PvP Mobility Excellence',
          description: 'High mobility and recovery for superior PvP performance',
          type: 'activity',
          activity: 'pvp',
          benefits: ['enhanced_movement', 'quick_recovery'],
          strength: 'high'
        })
      }
    }

    if (activity === 'raid' && build.stats) {
      if (build.stats.recovery >= 80 && build.stats.intellect >= 70) {
        synergies.push({
          name: 'Raid Survivability Focus',
          description: 'High recovery and intellect for raid encounters',
          type: 'activity', 
          activity: 'raid',
          benefits: ['enhanced_survivability', 'frequent_supers'],
          strength: 'high'
        })
      }
    }

    return synergies
  }

  findStatSynergies(build) {
    const synergies = []
    const stats = build.stats || {}
    
    // Count high tier stats
    const tierCounts = {}
    let totalHighStats = 0
    
    for (const [stat, value] of Object.entries(stats)) {
      const tier = Math.floor(value / 10)
      tierCounts[stat] = tier
      if (tier >= 8) totalHighStats++
    }

    // Triple 100 synergy
    const tier10Stats = Object.entries(tierCounts).filter(([stat, tier]) => tier >= 10)
    if (tier10Stats.length >= 3) {
      synergies.push({
        name: 'Triple 100 Mastery',
        description: `Tier 10 in ${tier10Stats.map(([stat]) => stat).join(', ')}`,
        type: 'stat',
        benefits: ['maximum_efficiency', 'peak_performance'],
        strength: 'legendary',
        stats: tier10Stats.map(([stat]) => stat)
      })
    }

    // High stat synergies
    if (totalHighStats >= 4) {
      synergies.push({
        name: 'High Stat Distribution',
        description: 'Multiple high-tier stats for versatile performance',
        type: 'stat',
        benefits: ['versatile_performance', 'consistent_abilities'],
        strength: 'high'
      })
    }

    // Specific stat combinations
    if (stats.mobility >= 80 && stats.recovery >= 80) {
      synergies.push({
        name: 'Movement Excellence',
        description: 'Superior mobility and recovery for enhanced positioning',
        type: 'stat',
        benefits: ['enhanced_movement', 'quick_healing'],
        strength: 'medium'
      })
    }

    if (stats.discipline >= 80 && stats.intellect >= 80) {
      synergies.push({
        name: 'Ability Mastery',
        description: 'Fast grenade and super regeneration',
        type: 'stat',
        benefits: ['frequent_abilities', 'enhanced_uptime'],
        strength: 'medium'
      })
    }

    return synergies
  }

  findWeaponSynergies(build) {
    const synergies = []
    const weapons = build.loadout?.weapons || {}
    const element = build.metadata.element

    // Check for elemental weapon matching
    const weaponElements = Object.values(weapons)
      .filter(w => w && w.element)
      .map(w => w.element.toLowerCase())

    const elementCount = {}
    weaponElements.forEach(e => {
      elementCount[e] = (elementCount[e] || 0) + 1
    })

    // Monochromatic synergy (all same element)
    if (element !== 'any' && elementCount[element] >= 2) {
      synergies.push({
        name: 'Monochromatic Arsenal',
        description: `All ${element} weapons for maximum elemental synergy`,
        type: 'weapon',
        element: element,
        benefits: ['enhanced_elemental_effects', 'consistent_procs'],
        strength: 'high'
      })
    }

    // Rainbow synergy (different elements)
    const uniqueElements = Object.keys(elementCount).length
    if (uniqueElements >= 3) {
      synergies.push({
        name: 'Rainbow Arsenal',
        description: 'Multiple elements for versatile damage coverage',
        type: 'weapon',
        benefits: ['elemental_coverage', 'match_game_ready'],
        strength: 'medium'
      })
    }

    // Exotic weapon synergies
    const exoticWeapons = Object.values(weapons).filter(w => w && w.tierType === 6)
    if (exoticWeapons.length > 0) {
      for (const exotic of exoticWeapons) {
        synergies.push({
          name: `${exotic.name} Synergy`,
          description: `Build optimized around ${exotic.name} exotic perks`,
          type: 'weapon',
          exotic: exotic.name,
          benefits: ['exotic_perk_optimization', 'enhanced_effectiveness'],
          strength: 'high'
        })
      }
    }

    return synergies
  }

  findArmorSynergies(build) {
    const synergies = []
    const armor = build.loadout?.armor || {}
    const mods = build.loadout?.mods || {}

    // Check for elemental armor matching
    if (build.metadata.element !== 'any') {
      const matchingArmor = Object.values(armor).filter(piece => 
        piece && piece.element && piece.element.toLowerCase() === build.metadata.element
      ).length

      if (matchingArmor >= 3) {
        synergies.push({
          name: 'Elemental Armor Harmony',
          description: `${build.metadata.element} armor reduces mod costs`,
          type: 'armor',
          element: build.metadata.element,
          benefits: ['reduced_mod_costs', 'enhanced_elemental_effects'],
          strength: 'medium'
        })
      }
    }

    // Exotic armor synergies
    const exoticArmor = Object.values(armor).filter(piece => piece && piece.tierType === 6)
    if (exoticArmor.length > 0) {
      for (const exotic of exoticArmor) {
        synergies.push({
          name: `${exotic.name} Build Focus`,
          description: `Build centered around ${exotic.name} exotic effects`,
          type: 'armor',
          exotic: exotic.name,
          benefits: ['exotic_perk_maximization', 'build_identity'],
          strength: 'high'
        })
      }
    }

    // Mod synergies
    if (mods.armor && mods.armor.length > 0) {
      const modTypes = this.analyzeModTypes(mods.armor)
      
      if (modTypes.stat >= 3) {
        synergies.push({
          name: 'Stat Mod Optimization',
          description: 'Multiple stat mods for enhanced performance',
          type: 'armor',
          benefits: ['stat_optimization', 'tier_breakpoints'],
          strength: 'medium'
        })
      }

      if (modTypes.combat >= 2) {
        synergies.push({
          name: 'Combat Mod Synergy',
          description: 'Coordinated combat mods for enhanced effectiveness',
          type: 'armor',
          benefits: ['enhanced_combat_performance', 'tactical_advantages'],
          strength: 'medium'
        })
      }
    }

    return synergies
  }

  analyzeModTypes(armorMods) {
    const types = {
      stat: 0,
      combat: 0,
      utility: 0,
      elemental: 0
    }

    for (const mod of armorMods) {
      const modName = mod.toLowerCase()
      
      if (this.elementData && Object.keys(this.elementData).some(e => modName.includes(e))) {
        types.elemental++
      } else if (['mobility', 'resilience', 'recovery', 'discipline', 'intellect', 'strength'].some(s => modName.includes(s))) {
        types.stat++
      } else if (['targeting', 'dexterity', 'unflinching', 'loader'].some(t => modName.includes(t))) {
        types.combat++
      } else {
        types.utility++
      }
    }

    return types
  }

  generateOverallSynergies(build, categorizedSynergies) {
    const overall = []
    
    // Combine synergies from all categories
    const allSynergies = [
      ...categorizedSynergies.element,
      ...categorizedSynergies.activity,
      ...categorizedSynergies.stat,
      ...categorizedSynergies.weapon,
      ...categorizedSynergies.armor
    ]

    // Group by strength
    const strongSynergies = allSynergies.filter(s => ['high', 'legendary'].includes(s.strength))
    const mediumSynergies = allSynergies.filter(s => s.strength === 'medium')

    // Create overall assessment
    if (strongSynergies.length >= 3) {
      overall.push({
        name: 'Highly Synergistic Build',
        description: `Build has ${strongSynergies.length} strong synergies working together`,
        type: 'overall',
        strength: 'legendary',
        components: strongSynergies.map(s => s.name)
      })
    } else if (strongSynergies.length >= 2 || mediumSynergies.length >= 3) {
      overall.push({
        name: 'Well-Coordinated Build',
        description: 'Build components work well together',
        type: 'overall',
        strength: 'high',
        components: [...strongSynergies, ...mediumSynergies].map(s => s.name)
      })
    }

    // Check for element-weapon-activity triple synergy
    const hasElementalWeapons = categorizedSynergies.weapon.some(s => s.element === build.metadata.element)
    const hasElementalSubclass = build.metadata.element !== 'any'
    const hasActivityOptimization = categorizedSynergies.activity.length > 0

    if (hasElementalWeapons && hasElementalSubclass && hasActivityOptimization) {
      overall.push({
        name: 'Perfect Synergy Triangle',
        description: `${build.metadata.element} element, matching weapons, and ${build.metadata.activity} optimization`,
        type: 'overall',
        strength: 'legendary',
        components: ['elemental_focus', 'weapon_matching', 'activity_optimization']
      })
    }

    return overall
  }

  calculateSynergyScore(synergies) {
    let score = 0
    
    // Weight different synergy types
    const weights = {
      'legendary': 15,
      'high': 10,
      'medium': 6,
      'low': 3
    }

    const allSynergies = [
      ...synergies.element,
      ...synergies.activity, 
      ...synergies.stat,
      ...synergies.weapon,
      ...synergies.armor,
      ...synergies.overall
    ]

    for (const synergy of allSynergies) {
      score += weights[synergy.strength] || 3
    }

    // Cap at 100
    return Math.min(score, 100)
  }

  checkSynergyConditions(build, conditions) {
    // Check if build meets the conditions for a synergy
    for (const condition of conditions) {
      if (!this.evaluateCondition(build, condition)) {
        return false
      }
    }
    return true
  }

  evaluateCondition(build, condition) {
    const conditionType = condition.toLowerCase()
    
    // Element conditions
    if (conditionType.includes('solar_subclass')) {
      return build.metadata.element === 'solar'
    }
    if (conditionType.includes('arc_subclass')) {
      return build.metadata.element === 'arc'
    }
    if (conditionType.includes('void_subclass')) {
      return build.metadata.element === 'void'
    }
    
    // Weapon conditions
    if (conditionType.includes('solar_weapons')) {
      return this.buildHasElementalWeapons(build, 'solar')
    }
    if (conditionType.includes('arc_weapons')) {
      return this.buildHasElementalWeapons(build, 'arc')
    }
    if (conditionType.includes('void_weapons')) {
      return this.buildHasElementalWeapons(build, 'void')
    }
    
    // Stat conditions
    if (conditionType.includes('high_stats')) {
      const highStats = Object.values(build.stats || {}).filter(v => v >= 80).length
      return highStats >= 2
    }
    
    if (conditionType.includes('three_tier_10_stats')) {
      const tier10Stats = Object.values(build.stats || {}).filter(v => v >= 100).length
      return tier10Stats >= 3
    }

    // Activity conditions
    if (conditionType.includes('high_damage_weapons')) {
      return this.buildHasHighDamageWeapons(build)
    }
    
    // Default to true for unknown conditions
    return true
  }

  buildHasElementalWeapons(build, element) {
    const weapons = build.loadout?.weapons || {}
    return Object.values(weapons).some(w => 
      w && w.element && w.element.toLowerCase() === element
    )
  }

  buildHasHighDamageWeapons(build) {
    const weapons = build.loadout?.weapons || {}
    const highDamageTypes = ['sniper rifle', 'linear fusion rifle', 'rocket launcher', 'sword']
    
    return Object.values(weapons).some(w => 
      w && w.type && highDamageTypes.some(type => w.type.toLowerCase().includes(type))
    )
  }

  // Advanced synergy analysis methods

  findHiddenSynergies(build) {
    const hidden = []
    
    // Look for non-obvious synergies
    const element = build.metadata.element
    const activity = build.metadata.activity
    const stats = build.stats || {}

    // Cross-element synergies for Prismatic
    if (element === 'prismatic') {
      hidden.push({
        name: 'Prismatic Versatility',
        description: 'Access to Light and Dark abilities simultaneously',
        type: 'hidden',
        benefits: ['elemental_flexibility', 'unique_combinations'],
        strength: 'high'
      })
    }

    // Underrated stat combinations
    if (stats.strength >= 80 && stats.mobility >= 80) {
      hidden.push({
        name: 'Mobile Melee Mastery',
        description: 'High mobility and strength for aggressive melee gameplay',
        type: 'hidden',
        benefits: ['enhanced_positioning', 'frequent_melee'],
        strength: 'medium'
      })
    }

    return hidden
  }

  suggestSynergyImprovements(build) {
    const suggestions = []
    
    const element = build.metadata.element
    const weapons = build.loadout?.weapons || {}
    const stats = build.stats || {}

    // Suggest elemental weapon matching
    if (element !== 'any') {
      const nonMatchingWeapons = Object.entries(weapons).filter(([slot, weapon]) => 
        weapon && weapon.element && weapon.element.toLowerCase() !== element
      )
      
      if (nonMatchingWeapons.length > 0) {
        suggestions.push({
          type: 'weapon_matching',
          description: `Consider ${element} weapons for enhanced elemental synergy`,
          priority: 'medium',
          impact: 'synergy_enhancement'
        })
      }
    }

    // Suggest stat optimization
    for (const [stat, value] of Object.entries(stats)) {
      const currentTier = Math.floor(value / 10)
      if (currentTier === 9) { // Close to tier 10
        suggestions.push({
          type: 'stat_optimization',
          description: `${10 - (value % 10)} more ${stat} for tier 10`,
          priority: 'high',
          impact: 'stat_breakpoint'
        })
      }
    }

    return suggestions
  }

  // Utility methods

  getElementSynergySummary(build) {
    const element = build.metadata.element
    if (!element || element === 'any') return null

    const elementData = this.elementData[element]
    if (!elementData) return null

    return {
      element,
      effects: elementData.effects,
      keywords: elementData.keywords,
      recommendedAspects: elementData.aspects.slice(0, 2),
      recommendedFragments: elementData.fragments.slice(0, 3)
    }
  }

  getSynergyStrengthColor(strength) {
    const colors = {
      'legendary': '#be123c', // Red for legendary
      'high': '#7c3aed',       // Purple for high
      'medium': '#2563eb',     // Blue for medium  
      'low': '#059669'         // Green for low
    }
    
    return colors[strength] || colors['medium']
  }

  // Debugging and analysis tools

  analyzeBuildCompletely(build) {
    return {
      synergies: this.findSynergies(build),
      hiddenSynergies: this.findHiddenSynergies(build),
      improvements: this.suggestSynergyImprovements(build),
      elementSummary: this.getElementSynergySummary(build),
      overallAssessment: this.assessOverallSynergy(build)
    }
  }

  assessOverallSynergy(build) {
    const synergies = this.findSynergies(build)
    const score = synergies.score || 0
    
    let assessment = 'basic'
    if (score >= 80) assessment = 'legendary'
    else if (score >= 60) assessment = 'high'
    else if (score >= 40) assessment = 'medium'
    
    return {
      level: assessment,
      score,
      description: this.getSynergyDescription(assessment, score),
      topSynergies: synergies.overall.slice(0, 3)
    }
  }

  getSynergyDescription(level, score) {
    const descriptions = {
      'legendary': 'Exceptional synergy with multiple legendary-tier combinations',
      'high': 'Strong synergy across build components with excellent coordination',
      'medium': 'Good synergy with room for optimization',
      'basic': 'Functional build with potential for enhanced synergy'
    }
    
    return descriptions[level] || 'Build synergy analysis complete'
  }
}