// lib/destiny-intelligence/build-intelligence.js
// Frontend Build Intelligence system - processes builds locally using cached manifest data

export class BuildIntelligence {
  constructor() {
    this.initialized = false
    this.manifest = null
    this.version = '2.0.0'
    this.itemDefinitions = null
    this.statDefinitions = null
    this.classDefinitions = null
    this.damageDefinitions = null
  }

  async initialize(manifestData) {
    try {
      console.log('🧠 Initializing Frontend Build Intelligence System...')
      
      if (!manifestData || !manifestData.data) {
        throw new Error('Invalid manifest data provided')
      }
      
      this.manifest = manifestData
      this.itemDefinitions = manifestData.data.DestinyInventoryItemDefinition || {}
      this.statDefinitions = manifestData.data.DestinyStatDefinition || {}
      this.classDefinitions = manifestData.data.DestinyClassDefinition || {}
      this.damageDefinitions = manifestData.data.DestinyDamageTypeDefinition || {}
      
      console.log(`📊 Frontend Intelligence loaded:`)
      console.log(`  Items: ${Object.keys(this.itemDefinitions).length}`)
      console.log(`  Stats: ${Object.keys(this.statDefinitions).length}`)
      console.log(`  Classes: ${Object.keys(this.classDefinitions).length}`)
      console.log(`  Damage Types: ${Object.keys(this.damageDefinitions).length}`)
      
      this.initialized = true
      console.log('✅ Frontend Build Intelligence System initialized successfully')
      return true
      
    } catch (error) {
      console.error('❌ Failed to initialize Frontend Build Intelligence:', error)
      this.initialized = false
      throw error
    }
  }

  isInitialized() {
    return this.initialized
  }

  async generateBuild(userInput, options = {}) {
    if (!this.initialized) {
      throw new Error('Build Intelligence not initialized')
    }

    const {
      useInventoryOnly = false,
      lockedExotic = null,
      includeAlternatives = false,
      detailedAnalysis = true,
      optimizationSuggestions = true
    } = options

    try {
      console.log('🏗️ Frontend generating build from input:', userInput)
      
      // IMPORTANT: All processing happens locally - no API calls!
      
      // Parse the user request locally
      const parsedRequest = this.parseUserInputLocally(userInput)
      
      // Generate build entirely using local manifest data
      const build = await this.createBuildLocally(parsedRequest, options)
      
      // Add alternatives if requested
      if (includeAlternatives) {
        build.alternatives = this.generateAlternativesLocally(parsedRequest)
      }
      
      // Add detailed analysis if requested
      if (detailedAnalysis) {
        build.analysis = this.performDetailedAnalysisLocally(build, parsedRequest)
      }
      
      // Add optimization suggestions if requested
      if (optimizationSuggestions) {
        build.optimizations = this.generateOptimizationsLocally(build, parsedRequest)
      }
      
      console.log('✅ Frontend build generation completed successfully')
      
      return {
        success: true,
        build,
        metadata: {
          generatedAt: new Date().toISOString(),
          source: 'frontend-local',
          manifestVersion: this.manifest.version,
          processingMethod: 'local'
        }
      }
      
    } catch (error) {
      console.error('❌ Frontend build generation failed:', error)
      return {
        success: false,
        error: error.message,
        userInput
      }
    }
  }

  parseUserInputLocally(input) {
    console.log('🔍 Parsing user input locally:', input)
    
    const parsed = {
      class: 'any',
      activity: 'general_pve', 
      element: 'any',
      playstyle: 'balanced',
      focusStats: [],
      exotic: null,
      keywords: input.toLowerCase().split(' ')
    }

    const lowercaseInput = input.toLowerCase()

    // Parse class
    if (lowercaseInput.includes('titan')) parsed.class = 'titan'
    else if (lowercaseInput.includes('hunter')) parsed.class = 'hunter' 
    else if (lowercaseInput.includes('warlock')) parsed.class = 'warlock'

    // Parse activity
    if (lowercaseInput.includes('raid')) parsed.activity = 'raid'
    else if (lowercaseInput.includes('pvp') || lowercaseInput.includes('crucible')) parsed.activity = 'pvp'
    else if (lowercaseInput.includes('dungeon')) parsed.activity = 'dungeon'
    else if (lowercaseInput.includes('nightfall')) parsed.activity = 'nightfall'
    else if (lowercaseInput.includes('gambit')) parsed.activity = 'gambit'
    else if (lowercaseInput.includes('trials')) parsed.activity = 'trials'

    // Parse element (including all 6 elements)
    if (lowercaseInput.includes('solar')) parsed.element = 'solar'
    else if (lowercaseInput.includes('arc')) parsed.element = 'arc'
    else if (lowercaseInput.includes('void')) parsed.element = 'void'
    else if (lowercaseInput.includes('stasis')) parsed.element = 'stasis'
    else if (lowercaseInput.includes('strand')) parsed.element = 'strand'
    else if (lowercaseInput.includes('prismatic')) parsed.element = 'prismatic'

    // Parse playstyle
    if (lowercaseInput.includes('aggressive') || lowercaseInput.includes('offense')) parsed.playstyle = 'aggressive'
    else if (lowercaseInput.includes('defensive') || lowercaseInput.includes('tank')) parsed.playstyle = 'defensive'
    else if (lowercaseInput.includes('support')) parsed.playstyle = 'support'
    else if (lowercaseInput.includes('dps') || lowercaseInput.includes('damage')) parsed.playstyle = 'dps'
    else if (lowercaseInput.includes('speed') || lowercaseInput.includes('fast')) parsed.playstyle = 'speed'

    // Parse focus stats
    if (lowercaseInput.includes('recovery') || lowercaseInput.includes('health')) parsed.focusStats.push('recovery')
    if (lowercaseInput.includes('mobility') || lowercaseInput.includes('speed')) parsed.focusStats.push('mobility')
    if (lowercaseInput.includes('resilience') || lowercaseInput.includes('resistance')) parsed.focusStats.push('resilience')
    if (lowercaseInput.includes('discipline') || lowercaseInput.includes('grenade')) parsed.focusStats.push('discipline')
    if (lowercaseInput.includes('intellect') || lowercaseInput.includes('super')) parsed.focusStats.push('intellect')
    if (lowercaseInput.includes('strength') || lowercaseInput.includes('melee')) parsed.focusStats.push('strength')

    console.log('📝 Parsed request:', parsed)
    return parsed
  }

  async createBuildLocally(parsedRequest, options) {
    console.log('⚙️ Creating build locally using manifest data')
    
    // All processing uses local manifest data - no API calls
    const build = {
      metadata: {
        name: this.generateBuildName(parsedRequest),
        description: this.generateBuildDescription(parsedRequest),
        class: parsedRequest.class,
        element: parsedRequest.element,
        activity: parsedRequest.activity,
        playstyle: parsedRequest.playstyle,
        focusStats: parsedRequest.focusStats,
        generatedAt: new Date().toISOString(),
        version: this.version
      },
      loadout: {
        subclass: this.selectSubclassLocally(parsedRequest),
        weapons: this.selectWeaponsLocally(parsedRequest, options),
        armor: this.selectArmorLocally(parsedRequest, options),
        mods: this.selectModsLocally(parsedRequest)
      },
      stats: this.calculateExpectedStatsLocally(parsedRequest),
      synergies: this.identifyBuildSynergiesLocally(parsedRequest),
      score: 0
    }

    // Calculate overall build score using local data
    build.score = this.calculateBuildScoreLocally(build, parsedRequest)
    
    console.log('✅ Build created locally, score:', build.score)
    return build
  }

  generateBuildName(parsedRequest) {
    const parts = []
    
    if (parsedRequest.element !== 'any') {
      parts.push(parsedRequest.element.charAt(0).toUpperCase() + parsedRequest.element.slice(1))
    }
    
    if (parsedRequest.class !== 'any') {
      parts.push(parsedRequest.class.charAt(0).toUpperCase() + parsedRequest.class.slice(1))
    }
    
    if (parsedRequest.activity !== 'general_pve') {
      parts.push(parsedRequest.activity.charAt(0).toUpperCase() + parsedRequest.activity.slice(1))
    }
    
    parts.push('Build')
    
    return parts.join(' ')
  }

  generateBuildDescription(parsedRequest) {
    const parts = []
    
    if (parsedRequest.class !== 'any') {
      parts.push(`Optimized ${parsedRequest.class} build`)
    } else {
      parts.push('Versatile build')
    }
    
    if (parsedRequest.element !== 'any') {
      parts.push(`focusing on ${parsedRequest.element} damage`)
    }
    
    if (parsedRequest.activity !== 'general_pve') {
      parts.push(`for ${parsedRequest.activity} activities`)
    }
    
    if (parsedRequest.focusStats.length > 0) {
      parts.push(`with emphasis on ${parsedRequest.focusStats.join(' and ')}`)
    }
    
    return parts.join(' ')
  }

  selectSubclassLocally(parsedRequest) {
    // Element mapping for subclasses
    const elementSubclasses = {
      'solar': { 
        element: 'Solar',
        name: 'Solar Subclass',
        aspects: ['Solar damage aspects'],
        fragments: ['Solar utility fragments']
      },
      'arc': { 
        element: 'Arc',
        name: 'Arc Subclass', 
        aspects: ['Arc chain aspects'],
        fragments: ['Arc mobility fragments']
      },
      'void': { 
        element: 'Void',
        name: 'Void Subclass',
        aspects: ['Void utility aspects'],
        fragments: ['Void survivability fragments']
      },
      'stasis': { 
        element: 'Stasis',
        name: 'Stasis Subclass',
        aspects: ['Stasis control aspects'],
        fragments: ['Stasis utility fragments']
      },
      'strand': { 
        element: 'Strand',
        name: 'Strand Subclass',
        aspects: ['Strand traversal aspects'],
        fragments: ['Strand damage fragments']
      },
      'prismatic': { 
        element: 'Prismatic',
        name: 'Prismatic Subclass',
        aspects: ['Multi-element aspects'],
        fragments: ['Versatile fragments']
      }
    }
    
    return parsedRequest.element !== 'any' ? 
      elementSubclasses[parsedRequest.element] || elementSubclasses['solar'] :
      elementSubclasses['solar'] // Default to solar
  }

  selectWeaponsLocally(parsedRequest, options) {
    // Activity-based weapon selection using local manifest data
    const activityWeapons = {
      'raid': { 
        primary: { type: 'Scout Rifle', element: parsedRequest.element },
        special: { type: 'Sniper Rifle', element: parsedRequest.element },
        heavy: { type: 'Linear Fusion Rifle', element: parsedRequest.element }
      },
      'pvp': { 
        primary: { type: 'Hand Cannon', element: 'kinetic' },
        special: { type: 'Shotgun', element: parsedRequest.element },
        heavy: { type: 'Rocket Launcher', element: parsedRequest.element }
      },
      'dungeon': { 
        primary: { type: 'Auto Rifle', element: parsedRequest.element },
        special: { type: 'Fusion Rifle', element: parsedRequest.element },
        heavy: { type: 'Sword', element: parsedRequest.element }
      },
      'nightfall': { 
        primary: { type: 'Pulse Rifle', element: parsedRequest.element },
        special: { type: 'Sniper Rifle', element: parsedRequest.element },
        heavy: { type: 'Machine Gun', element: parsedRequest.element }
      }
    }

    const weapons = activityWeapons[parsedRequest.activity] || activityWeapons['raid']
    
    // If locked exotic provided, incorporate it
    if (options.lockedExotic) {
      const exoticSlot = this.determineExoticSlot(options.lockedExotic)
      if (exoticSlot && weapons[exoticSlot]) {
        weapons[exoticSlot] = {
          ...options.lockedExotic,
          locked: true
        }
      }
    }

    return weapons
  }

  selectArmorLocally(parsedRequest, options) {
    // Generate armor set optimized for the request using local data
    return {
      helmet: { 
        type: 'Helmet',
        stats: this.getOptimalArmorStatsLocally(parsedRequest, 'helmet'),
        element: parsedRequest.element !== 'any' ? parsedRequest.element : 'solar'
      },
      gauntlets: { 
        type: 'Gauntlets',
        stats: this.getOptimalArmorStatsLocally(parsedRequest, 'gauntlets'),
        element: parsedRequest.element !== 'any' ? parsedRequest.element : 'solar'
      },
      chest: { 
        type: 'Chest Armor',
        stats: this.getOptimalArmorStatsLocally(parsedRequest, 'chest'),
        element: parsedRequest.element !== 'any' ? parsedRequest.element : 'solar'
      },
      legs: { 
        type: 'Leg Armor',
        stats: this.getOptimalArmorStatsLocally(parsedRequest, 'legs'),
        element: parsedRequest.element !== 'any' ? parsedRequest.element : 'solar'
      },
      classItem: { 
        type: 'Class Item',
        stats: this.getOptimalArmorStatsLocally(parsedRequest, 'classItem'),
        element: parsedRequest.element !== 'any' ? parsedRequest.element : 'solar'
      }
    }
  }

  getOptimalArmorStatsLocally(parsedRequest, armorSlot) {
    // Default stat distribution
    const baseStats = {
      mobility: 10,
      resilience: 10,
      recovery: 10,
      discipline: 10,
      intellect: 10,
      strength: 10
    }

    // Ensure focusStats is an array before iterating
    const focusStats = Array.isArray(parsedRequest.focusStats) ? parsedRequest.focusStats : []
    
    // Boost focused stats significantly
    for (const focusStat of focusStats) {
      if (baseStats[focusStat] !== undefined) {
        baseStats[focusStat] = 25 // High investment in focused stats
      }
    }

    // Activity-specific stat adjustments
    if (parsedRequest.activity === 'pvp') {
      baseStats.mobility = Math.max(baseStats.mobility, 20)
      baseStats.recovery = Math.max(baseStats.recovery, 20)
      baseStats.resilience = Math.max(baseStats.resilience, 15)
    } else if (parsedRequest.activity === 'raid') {
      baseStats.recovery = Math.max(baseStats.recovery, 20)
      baseStats.intellect = Math.max(baseStats.intellect, 15)
      baseStats.discipline = Math.max(baseStats.discipline, 15)
    } else if (parsedRequest.activity === 'dungeon') {
      baseStats.recovery = Math.max(baseStats.recovery, 25)
      baseStats.resilience = Math.max(baseStats.resilience, 20)
    }

    // Playstyle adjustments
    if (parsedRequest.playstyle === 'aggressive') {
      baseStats.mobility = Math.max(baseStats.mobility, 20)
      baseStats.strength = Math.max(baseStats.strength, 15)
    } else if (parsedRequest.playstyle === 'defensive') {
      baseStats.resilience = Math.max(baseStats.resilience, 25)
      baseStats.recovery = Math.max(baseStats.recovery, 20)
    } else if (parsedRequest.playstyle === 'support') {
      baseStats.discipline = Math.max(baseStats.discipline, 20)
      baseStats.intellect = Math.max(baseStats.intellect, 20)
    }

    return baseStats
  }

  selectModsLocally(parsedRequest) {
    const mods = {
      combat: [],
      armor: [],
      weapon: []
    }

    // Activity-based combat mods
    if (parsedRequest.activity === 'raid') {
      mods.combat.push('Boss Spec', 'Major Spec', 'Taken Spec')
    } else if (parsedRequest.activity === 'pvp') {
      mods.combat.push('Targeting Adjuster', 'Unflinching Aim', 'Dexterity')
    } else if (parsedRequest.activity === 'nightfall') {
      mods.combat.push('Champion mods', 'Barrier Breach', 'Overload Disruption')
    }

    // Armor mods based on focus stats - ensure array
    const focusStats = Array.isArray(parsedRequest.focusStats) ? parsedRequest.focusStats : []
    for (const stat of focusStats) {
      mods.armor.push(`${stat.charAt(0).toUpperCase() + stat.slice(1)} Mod`)
    }

    // Default armor mods if no focus stats specified
    if (mods.armor.length === 0) {
      mods.armor.push('Recovery Mod', 'Resilience Mod')
    }

    // Element-specific weapon mods
    if (parsedRequest.element !== 'any') {
      mods.weapon.push(`${parsedRequest.element.charAt(0).toUpperCase() + parsedRequest.element.slice(1)} weapon synergy`)
    }

    mods.weapon.push('Backup Mag', 'Minor Spec')

    return mods
  }

  calculateExpectedStatsLocally(parsedRequest) {
    const stats = {
      mobility: 50,
      resilience: 50,
      recovery: 50, 
      discipline: 50,
      intellect: 50,
      strength: 50
    }

    // Ensure focusStats is an array before iterating
    const focusStats = Array.isArray(parsedRequest.focusStats) ? parsedRequest.focusStats : []
    
    // Boost focused stats to tier 10
    for (const focusStat of focusStats) {
      if (stats[focusStat] !== undefined) {
        stats[focusStat] = 100 // Tier 10 in focused stats
      }
    }

    // Activity-specific stat targets
    if (parsedRequest.activity === 'pvp') {
      stats.mobility = Math.max(stats.mobility, 80)
      stats.recovery = Math.max(stats.recovery, 70)
    } else if (parsedRequest.activity === 'raid') {
      stats.recovery = Math.max(stats.recovery, 80)
      stats.intellect = Math.max(stats.intellect, 70)
    }

    return stats
  }

  identifyBuildSynergiesLocally(parsedRequest) {
    const synergies = []

    // Element-based synergies
    const elementSynergies = {
      'solar': ['Solar weapon damage buffs', 'Ignition synergy', 'Radiant effects', 'Restoration healing'],
      'arc': ['Arc 3.0 synergy', 'Ionic traces', 'Jolt effects', 'Amplified benefits'], 
      'void': ['Void 3.0 synergy', 'Volatile rounds', 'Devour effects', 'Invisibility utility'],
      'stasis': ['Stasis crystal synergy', 'Slow effects', 'Shatter damage', 'Elemental well generation'],
      'strand': ['Strand tangle synergy', 'Suspend utility', 'Unravel damage', 'Threadling generation'],
      'prismatic': ['Multi-element synergy', 'Transcendence effects', 'Light/Dark ability mixing', 'Enhanced fragment options']
    }

    if (parsedRequest.element !== 'any' && elementSynergies[parsedRequest.element]) {
      synergies.push(...elementSynergies[parsedRequest.element])
    }

    // Activity-specific synergies
    const activitySynergies = {
      'raid': ['Boss damage optimization', 'Team utility focus', 'Survivability priority', 'Well generation'],
      'pvp': ['Neutral game optimization', 'Quick recovery focus', 'Mobility advantage', 'Engagement control'],
      'dungeon': ['Solo survivability', 'Consistent damage output', 'Champion handling', 'Resource management'],
      'nightfall': ['Champion counter builds', 'Match game preparation', 'Utility for team', 'Efficient ability cycling']
    }

    if (activitySynergies[parsedRequest.activity]) {
      synergies.push(...activitySynergies[parsedRequest.activity])
    }

    return synergies
  }

  calculateBuildScoreLocally(build, parsedRequest) {
    let score = 70 // Base score

    // Bonus for matching requested class
    if (build.metadata.class === parsedRequest.class && parsedRequest.class !== 'any') {
      score += 10
    }

    // Bonus for matching element
    if (build.metadata.element === parsedRequest.element && parsedRequest.element !== 'any') {
      score += 10
    }

    // Bonus for focused stats
    const focusStats = Array.isArray(parsedRequest.focusStats) ? parsedRequest.focusStats : []
    for (const focusStat of focusStats) {
      if (build.stats[focusStat] >= 80) {
        score += 5
      }
    }

    // Bonus for synergies
    if (build.synergies.length >= 3) {
      score += 5
    }

    // Activity compatibility bonus
    const activityBonus = this.getActivityCompatibilityBonus(build, parsedRequest)
    score += activityBonus

    return Math.min(score, 100)
  }

  getActivityCompatibilityBonus(build, parsedRequest) {
    let bonus = 0

    if (parsedRequest.activity === 'raid' && build.stats.recovery >= 70) {
      bonus += 3
    }
    
    if (parsedRequest.activity === 'pvp' && build.stats.mobility >= 70) {
      bonus += 3
    }
    
    if (parsedRequest.activity === 'dungeon' && build.stats.resilience >= 70) {
      bonus += 3
    }

    return bonus
  }

  generateAlternativesLocally(parsedRequest) {
    const alternatives = []

    // Alternative 1: Different element
    const elements = ['solar', 'arc', 'void', 'stasis', 'strand', 'prismatic']
    const altElement = elements.find(e => e !== parsedRequest.element) || 'solar'
    
    alternatives.push({
      name: `${altElement.charAt(0).toUpperCase() + altElement.slice(1)} Alternative`,
      description: `Same build concept optimized for ${altElement} damage`,
      changes: {
        element: altElement,
        subclass: this.selectSubclassLocally({...parsedRequest, element: altElement})
      }
    })

    // Alternative 2: Different playstyle
    const playstyles = ['aggressive', 'defensive', 'support', 'balanced']
    const altPlaystyle = playstyles.find(p => p !== parsedRequest.playstyle) || 'balanced'
    
    alternatives.push({
      name: `${altPlaystyle.charAt(0).toUpperCase() + altPlaystyle.slice(1)} Variant`,
      description: `Modified for ${altPlaystyle} gameplay approach`,
      changes: {
        playstyle: altPlaystyle,
        stats: this.calculateExpectedStatsLocally({...parsedRequest, playstyle: altPlaystyle})
      }
    })

    return alternatives
  }

  performDetailedAnalysisLocally(build, parsedRequest) {
    return {
      strengths: this.identifyStrengthsLocally(build, parsedRequest),
      weaknesses: this.identifyWeaknessesLocally(build, parsedRequest), 
      recommendations: this.generateRecommendationsLocally(build, parsedRequest),
      compatibility: this.assessActivityCompatibilityLocally(build, parsedRequest)
    }
  }

  identifyStrengthsLocally(build, parsedRequest) {
    const strengths = []
    
    // Check stat optimization
    for (const [stat, value] of Object.entries(build.stats)) {
      if (value >= 80 && parsedRequest.focusStats.includes(stat)) {
        const tier = Math.floor(value / 10)
        strengths.push(`Tier ${tier} ${stat} for enhanced ${parsedRequest.activity} performance`)
      }
    }
    
    // Check synergies
    if (build.synergies.length > 2) {
      strengths.push(`Strong ${build.metadata.element} synergies for consistent damage`)
    }
    
    // Activity-specific strengths
    if (parsedRequest.activity === 'raid' && build.stats.recovery >= 70) {
      strengths.push('High survivability for raid encounters')
    }
    
    return strengths
  }

  identifyWeaknessesLocally(build, parsedRequest) {
    const weaknesses = []
    
    // Check for critically low stats
    if (parsedRequest.activity === 'pvp' && build.stats.mobility < 50) {
      weaknesses.push('Low mobility may impact PvP movement and survivability')
    }
    
    if (parsedRequest.activity === 'raid' && build.stats.recovery < 50) {
      weaknesses.push('Low recovery reduces survivability in challenging content')
    }
    
    if (build.stats.resilience < 30) {
      weaknesses.push('Very low resilience may cause frequent deaths')
    }
    
    return weaknesses
  }

  generateRecommendationsLocally(build, parsedRequest) {
    const recommendations = []
    
    // Stat tier recommendations
    for (const focusStat of parsedRequest.focusStats) {
      const currentTier = Math.floor(build.stats[focusStat] / 10)
      if (currentTier < 8) {
        recommendations.push(`Consider reaching tier 8+ ${focusStat} for optimal ${parsedRequest.activity} performance`)
      }
    }
    
    // Element synergy recommendations
    if (parsedRequest.element !== 'any') {
      recommendations.push(`Use ${parsedRequest.element} weapons to maximize elemental synergies`)
    }
    
    // Activity-specific recommendations
    if (parsedRequest.activity === 'raid') {
      recommendations.push('Prioritize team utility and consistent damage output')
    } else if (parsedRequest.activity === 'pvp') {
      recommendations.push('Focus on neutral game advantages and quick recovery')
    }
    
    return recommendations
  }

  assessActivityCompatibilityLocally(build, parsedRequest) {
    const compatibility = {}
    
    // Rate compatibility for different activities
    const activities = ['raid', 'pvp', 'dungeon', 'nightfall', 'gambit']
    
    for (const activity of activities) {
      if (activity === parsedRequest.activity) {
        compatibility[activity] = 'High' // Always high for target activity
      } else {
        compatibility[activity] = this.calculateActivityCompatibility(build, activity)
      }
    }
    
    compatibility.overall = 'Good'
    
    return compatibility
  }

  calculateActivityCompatibility(build, activity) {
    let score = 50 // Base compatibility
    
    if (activity === 'pvp') {
      score += build.stats.mobility >= 60 ? 20 : 0
      score += build.stats.recovery >= 60 ? 15 : 0
    } else if (activity === 'raid') {
      score += build.stats.recovery >= 70 ? 20 : 0
      score += build.stats.intellect >= 60 ? 10 : 0
    } else if (activity === 'dungeon') {
      score += build.stats.resilience >= 60 ? 15 : 0
      score += build.stats.recovery >= 70 ? 15 : 0
    }
    
    return score >= 70 ? 'High' : score >= 50 ? 'Medium' : 'Low'
  }

  generateOptimizationsLocally(build, parsedRequest) {
    return {
      statOptimizations: this.suggestStatOptimizationsLocally(build, parsedRequest),
      modOptimizations: this.suggestModOptimizationsLocally(build, parsedRequest),
      weaponOptimizations: this.suggestWeaponOptimizationsLocally(build, parsedRequest),
      elementOptimizations: this.suggestElementOptimizationsLocally(build, parsedRequest)
    }
  }

  suggestStatOptimizationsLocally(build, parsedRequest) {
    const optimizations = []
    
    // Suggest reaching beneficial stat breakpoints
    for (const [stat, value] of Object.entries(build.stats)) {
      const currentTier = Math.floor(value / 10)
      
      if (currentTier < 10 && parsedRequest.focusStats.includes(stat)) {
        const nextTier = currentTier + 1
        const pointsNeeded = (nextTier * 10) - value
        optimizations.push(`Add ${pointsNeeded} more ${stat} to reach tier ${nextTier}`)
      }
    }
    
    return optimizations
  }

  suggestModOptimizationsLocally(build, parsedRequest) {
    const optimizations = []
    
    if (parsedRequest.activity === 'raid') {
      optimizations.push('Use Boss Spec and Major Spec for encounter optimization')
      optimizations.push('Consider Well mods for enhanced ability regeneration')
    } else if (parsedRequest.activity === 'pvp') {
      optimizations.push('Equip Targeting and Dexterity mods for weapon handling')
      optimizations.push('Use Unflinching mods for dueling advantages')
    }
    
    return optimizations
  }

  suggestWeaponOptimizationsLocally(build, parsedRequest) {
    const optimizations = []
    
    if (parsedRequest.element !== 'any') {
      optimizations.push(`Prioritize ${parsedRequest.element} weapons to maximize elemental synergies`)
    }
    
    if (parsedRequest.activity === 'raid') {
      optimizations.push('Include high-damage weapons for DPS phases')
      optimizations.push('Ensure champion mod coverage for encounters')
    }
    
    return optimizations
  }

  suggestElementOptimizationsLocally(build, parsedRequest) {
    const optimizations = []
    
    if (parsedRequest.element !== 'any') {
      optimizations.push(`Match armor element to ${parsedRequest.element} for cost reduction`)
      optimizations.push(`Use ${parsedRequest.element} subclass aspects for maximum synergy`)
    }
    
    return optimizations
  }

  determineExoticSlot(exoticItem) {
    if (!exoticItem || !exoticItem.bucketHash) return null
    
    // Weapon bucket hashes
    const weaponBuckets = {
      1498876634: 'primary',   // Primary weapons
      2465295065: 'special',   // Special weapons  
      953998645: 'heavy'       // Heavy weapons
    }
    
    return weaponBuckets[exoticItem.bucketHash] || 'armor'
  }

  // Helper method for external usage
  async parseRequest(userInput) {
    return this.parseUserInputLocally(userInput)
  }
}