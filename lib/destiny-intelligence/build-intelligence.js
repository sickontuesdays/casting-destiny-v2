export class BuildIntelligence {
  constructor() {
    this.initialized = false
    this.manifest = null
    this.textParser = null
    this.synergyEngine = null
    this.version = '2.0.0'
  }

  async initialize(manifestData) {
    try {
      console.log('🧠 Initializing Build Intelligence System...')
      
      this.manifest = manifestData
      
      // Import and initialize text parser
      const { TextParser } = await import('./text-parser')
      this.textParser = new TextParser()
      await this.textParser.initialize(manifestData)
      
      // Import and initialize synergy engine
      const { SynergyEngine } = await import('./synergy-engine')
      this.synergyEngine = new SynergyEngine()
      await this.synergyEngine.initialize(manifestData)
      
      this.initialized = true
      console.log('✅ Build Intelligence System initialized successfully')
      return true
      
    } catch (error) {
      console.error('❌ Failed to initialize Build Intelligence:', error)
      this.initialized = false
      throw error
    }
  }

  isInitialized() {
    return this.initialized
  }

  async parseRequest(userInput) {
    if (!this.initialized) {
      throw new Error('Build Intelligence not initialized')
    }

    try {
      const parsed = this.textParser.parseUserInput(userInput)
      console.log('🔍 Parsed user request:', parsed)
      return parsed
    } catch (error) {
      console.error('Error parsing request:', error)
      throw new Error(`Failed to parse request: ${error.message}`)
    }
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
      console.log('🏗️ Generating build from input:', userInput)
      
      // Parse the user request
      const parsedRequest = await this.parseRequest(userInput)
      
      // Extract build requirements
      const requirements = this.extractBuildRequirements(parsedRequest)
      
      // Apply locked exotic if provided
      if (lockedExotic) {
        requirements.lockedExotic = lockedExotic
      }
      
      // Generate base build
      const build = await this.generateBaseBuild(requirements)
      
      // Find synergies
      const synergies = await this.synergyEngine.findSynergies(build)
      build.synergies = synergies
      
      // Detect conflicts
      const conflicts = this.detectConflicts(build, requirements)
      build.conflicts = conflicts
      
      // Generate optimization suggestions
      if (optimizationSuggestions) {
        build.optimization = await this.generateOptimizations(build, requirements)
      }
      
      // Generate alternatives if requested
      if (includeAlternatives) {
        build.alternatives = await this.generateAlternatives(build, requirements)
      }
      
      // Detailed analysis
      if (detailedAnalysis) {
        build.analysis = {
          requirements,
          strengths: this.identifyBuildStrengths(build, synergies),
          weaknesses: this.identifyBuildWeaknesses(build, conflicts),
          recommendations: this.generateRecommendations(build, requirements)
        }
      }
      
      // Add metadata
      build.metadata = {
        generatedAt: new Date().toISOString(),
        version: this.version,
        confidence: parsedRequest.confidence || 0.8,
        userInput: userInput,
        parsedRequest: parsedRequest
      }
      
      console.log('✅ Build generated successfully')
      return build
      
    } catch (error) {
      console.error('❌ Build generation failed:', error)
      throw new Error(`Build generation failed: ${error.message}`)
    }
  }

  extractBuildRequirements(parsedRequest) {
    const requirements = {
      classType: this.extractClass(parsedRequest),
      activityType: this.extractActivity(parsedRequest),
      focusStats: this.extractStats(parsedRequest),
      preferredExotic: this.extractExotic(parsedRequest),
      playstyle: this.extractPlaystyle(parsedRequest),
      subclass: this.extractSubclass(parsedRequest),
      weaponTypes: this.extractWeaponTypes(parsedRequest),
      elements: this.extractElements(parsedRequest),
      priorities: this.extractPriorities(parsedRequest)
    }
    
    console.log('📋 Extracted requirements:', requirements)
    return requirements
  }

  extractClass(parsedRequest) {
    const classes = parsedRequest.entities?.classes || []
    if (classes.length > 0) {
      const classMap = { hunter: 1, titan: 0, warlock: 2 }
      return classMap[classes[0].toLowerCase()] ?? 'any'
    }
    return 'any'
  }

  extractActivity(parsedRequest) {
    const activities = parsedRequest.entities?.activities || []
    if (activities.length > 0) {
      return activities[0]
    }
    
    // Infer from intent
    if (parsedRequest.intent === 'activity_raid') return 'raid'
    if (parsedRequest.intent === 'activity_pvp') return 'pvp'
    if (parsedRequest.intent === 'activity_dungeon') return 'dungeon'
    
    return 'general_pve'
  }

  extractStats(parsedRequest) {
    const stats = parsedRequest.entities?.stats || []
    const statMap = {
      'mobility': 'weapons',
      'resilience': 'health',
      'recovery': 'health',
      'discipline': 'grenade',
      'intellect': 'super',
      'strength': 'melee'
    }
    
    return stats.map(stat => statMap[stat] || stat).filter(Boolean)
  }

  extractExotic(parsedRequest) {
    const exotics = parsedRequest.entities?.exotics || []
    return exotics.length > 0 ? exotics[0] : null
  }

  extractPlaystyle(parsedRequest) {
    const playstyles = parsedRequest.entities?.playstyles || []
    if (playstyles.length > 0) {
      return playstyles[0]
    }
    
    // Infer from other entities
    if (parsedRequest.entities?.stats?.includes('mobility')) return 'aggressive'
    if (parsedRequest.entities?.stats?.includes('resilience')) return 'defensive'
    
    return 'balanced'
  }

  extractSubclass(parsedRequest) {
    const elements = parsedRequest.entities?.elements || []
    if (elements.length > 0) {
      return elements[0]
    }
    return null
  }

  extractWeaponTypes(parsedRequest) {
    return parsedRequest.entities?.weapons || []
  }

  extractElements(parsedRequest) {
    return parsedRequest.entities?.elements || []
  }

  extractPriorities(parsedRequest) {
    const priorities = []
    
    if (parsedRequest.intent === 'stat_focus') {
      priorities.push('stat_optimization')
    }
    
    if (parsedRequest.entities?.activities?.length > 0) {
      priorities.push('activity_suitability')
    }
    
    if (parsedRequest.entities?.exotics?.length > 0) {
      priorities.push('exotic_synergy')
    }
    
    return priorities.length > 0 ? priorities : ['balanced']
  }

  async generateBaseBuild(requirements) {
    const build = {
      name: this.generateBuildName(requirements),
      description: this.generateBuildDescription(requirements),
      helmet: null,
      arms: null,
      chest: null,
      legs: null,
      class: null,
      kinetic: null,
      energy: null,
      power: null,
      mods: [],
      stats: {
        totalStats: {
          weapons: 0,
          health: 0,
          class: 0,
          super: 0,
          grenade: 0,
          melee: 0
        }
      }
    }

    try {
      // Handle locked exotic first
      if (requirements.lockedExotic) {
        const slot = this.getArmorSlotForExotic(requirements.lockedExotic)
        if (slot) {
          build[slot] = {
            hash: requirements.lockedExotic.hash,
            name: requirements.lockedExotic.name,
            tier: 'Exotic',
            description: requirements.lockedExotic.description,
            icon: requirements.lockedExotic.icon
          }
        }
      } else if (requirements.preferredExotic) {
        const exotic = await this.findExoticByName(requirements.preferredExotic)
        if (exotic) {
          const slot = this.getArmorSlotForExotic(exotic)
          if (slot) {
            build[slot] = {
              hash: exotic.hash,
              name: exotic.displayProperties.name,
              tier: 'Exotic',
              description: exotic.displayProperties.description,
              icon: exotic.displayProperties.icon
            }
          }
        }
      }

      // Fill remaining armor slots
      await this.fillArmorSlots(build, requirements)
      
      // Add weapons based on requirements
      await this.fillWeaponSlots(build, requirements)
      
      // Calculate and distribute stats
      this.calculateBuildStats(build, requirements)
      
      // Add recommended mods
      build.mods = this.recommendMods(build, requirements)
      
      return build
      
    } catch (error) {
      console.error('Error generating base build:', error)
      return build
    }
  }

  generateBuildName(requirements) {
    const parts = []
    
    if (requirements.classType !== 'any') {
      const classNames = { 0: 'Titan', 1: 'Hunter', 2: 'Warlock' }
      parts.push(classNames[requirements.classType])
    }
    
    if (requirements.preferredExotic) {
      parts.push(requirements.preferredExotic)
    } else if (requirements.focusStats.length > 0) {
      parts.push(`High ${requirements.focusStats[0]}`)
    }
    
    if (requirements.activityType !== 'general_pve') {
      parts.push(requirements.activityType.toUpperCase())
    }
    
    parts.push('Build')
    
    return parts.join(' ')
  }

  generateBuildDescription(requirements) {
    const parts = []
    
    if (requirements.focusStats.length > 0) {
      parts.push(`Optimized for ${requirements.focusStats.join(' and ')}`)
    }
    
    if (requirements.activityType !== 'general_pve') {
      parts.push(`Designed for ${requirements.activityType}`)
    }
    
    if (requirements.playstyle !== 'balanced') {
      parts.push(`${requirements.playstyle} playstyle`)
    }
    
    return parts.join('. ') + '.'
  }

  async fillArmorSlots(build, requirements) {
    const armorSlots = ['helmet', 'arms', 'chest', 'legs', 'class']
    const items = this.manifest?.data?.DestinyInventoryItemDefinition || {}
    
    for (const slot of armorSlots) {
      if (build[slot]) continue // Skip if already filled (exotic)
      
      // Find suitable legendary armor for this slot
      const slotHash = this.getSlotHashForArmor(slot)
      const legendaryArmor = Object.values(items).filter(item =>
        item.itemType === 2 && // Armor
        item.tierType === 5 && // Legendary
        item.itemSubType === slotHash &&
        (requirements.classType === 'any' || item.classType === requirements.classType)
      )
      
      if (legendaryArmor.length > 0) {
        const chosen = legendaryArmor[Math.floor(Math.random() * legendaryArmor.length)]
        build[slot] = {
          hash: chosen.hash,
          name: chosen.displayProperties?.name || `${slot} Armor`,
          tier: 'Legendary',
          description: chosen.displayProperties?.description || '',
          icon: chosen.displayProperties?.icon || null
        }
      } else {
        // Fallback generic armor
        build[slot] = {
          hash: Date.now() + Math.random(),
          name: `Legendary ${slot.charAt(0).toUpperCase() + slot.slice(1)}`,
          tier: 'Legendary',
          description: `High-quality ${slot} armor`,
          icon: null
        }
      }
    }
  }

  async fillWeaponSlots(build, requirements) {
    const weaponSlots = ['kinetic', 'energy', 'power']
    const items = this.manifest?.data?.DestinyInventoryItemDefinition || {}
    
    // Get exotic weapons if requested
    const exoticWeapons = Object.values(items).filter(item =>
      item.itemType === 3 && item.tierType === 6
    )
    
    // Get legendary weapons
    const legendaryWeapons = Object.values(items).filter(item =>
      item.itemType === 3 && item.tierType === 5
    )
    
    for (const slot of weaponSlots) {
      // For now, assign generic weapons
      build[slot] = {
        hash: Date.now() + Math.random(),
        name: `${slot.charAt(0).toUpperCase() + slot.slice(1)} Weapon`,
        tier: 'Legendary',
        description: `Powerful ${slot} weapon`,
        icon: null,
        powerLevel: 1350 + Math.floor(Math.random() * 200)
      }
    }
  }

  calculateBuildStats(build, requirements) {
    const baseStats = {
      weapons: 60,
      health: 60,
      class: 60,
      super: 60,
      grenade: 60,
      melee: 60
    }
    
    // Apply focus stat bonuses
    if (requirements.focusStats.length > 0) {
      requirements.focusStats.forEach(stat => {
        if (baseStats[stat] !== undefined) {
          baseStats[stat] += 40 // Boost focused stats
        }
      })
    }
    
    // Apply activity-specific optimizations
    const activityBonuses = {
      raid: { health: 20, super: 15 },
      pvp: { weapons: 30, class: 20 },
      dungeon: { health: 25, super: 10 },
      nightfall: { health: 20, weapons: 15 }
    }
    
    const bonuses = activityBonuses[requirements.activityType] || {}
    Object.entries(bonuses).forEach(([stat, bonus]) => {
      baseStats[stat] += bonus
    })
    
    // Ensure stats don't exceed maximum
    Object.keys(baseStats).forEach(stat => {
      baseStats[stat] = Math.min(baseStats[stat], 200)
    })
    
    build.stats.totalStats = baseStats
  }

  recommendMods(build, requirements) {
    const mods = []
    
    // Stat mods based on focus
    if (requirements.focusStats.length > 0) {
      requirements.focusStats.forEach(stat => {
        mods.push(`${stat.charAt(0).toUpperCase() + stat.slice(1)} Mod`)
      })
    }
    
    // Activity-specific mods
    if (requirements.activityType === 'pvp') {
      mods.push('Targeting Mod', 'Unflinching Mod')
    } else if (requirements.activityType === 'raid') {
      mods.push('Resist Mod', 'Ammo Finder')
    }
    
    return mods.slice(0, 5) // Limit to 5 mods
  }

  detectConflicts(build, requirements) {
    const conflicts = []
    
    // Check for multiple exotics
    const exoticCount = Object.values(build).filter(item => 
      item && item.tier === 'Exotic'
    ).length
    
    if (exoticCount > 1) {
      conflicts.push({
        type: 'multiple_exotics',
        severity: 'high',
        description: 'Multiple exotic items equipped'
      })
    }
    
    return conflicts
  }

  async generateOptimizations(build, requirements) {
    return {
      statOptimizations: this.suggestStatOptimizations(build, requirements),
      gearOptimizations: this.suggestGearOptimizations(build, requirements),
      modOptimizations: this.suggestModOptimizations(build, requirements)
    }
  }

  suggestStatOptimizations(build, requirements) {
    const suggestions = []
    const stats = build.stats.totalStats
    
    Object.entries(stats).forEach(([stat, value]) => {
      const tier = Math.floor(value / 20)
      const waste = value % 20
      
      if (waste > 15) {
        suggestions.push(`Consider redistributing ${waste} points from ${stat}`)
      }
      
      if (tier < 5 && requirements.focusStats.includes(stat)) {
        suggestions.push(`Increase ${stat} to reach higher tiers`)
      }
    })
    
    return suggestions
  }

  suggestGearOptimizations(build, requirements) {
    const suggestions = []
    
    // Check for better exotic options
    if (!this.hasExoticArmor(build)) {
      suggestions.push('Consider adding an exotic armor piece for additional benefits')
    }
    
    return suggestions
  }

  suggestModOptimizations(build, requirements) {
    const suggestions = []
    
    if (build.mods.length < 5) {
      suggestions.push('Add more mods to maximize build potential')
    }
    
    return suggestions
  }

  async generateAlternatives(build, requirements) {
    const alternatives = []
    
    // Generate stat-focused alternatives
    if (requirements.focusStats.length > 0) {
      const altStats = [...requirements.focusStats]
      altStats.reverse()
      
      alternatives.push({
        name: `Alternative ${altStats[0]} Focus`,
        description: `Similar build with emphasis on ${altStats[0]}`,
        score: 85,
        changes: [`Prioritize ${altStats[0]} over ${requirements.focusStats[0]}`]
      })
    }
    
    // Generate playstyle alternatives
    const playstyleAlts = {
      'aggressive': 'defensive',
      'defensive': 'aggressive',
      'balanced': 'aggressive'
    }
    
    const altPlaystyle = playstyleAlts[requirements.playstyle]
    if (altPlaystyle) {
      alternatives.push({
        name: `${altPlaystyle.charAt(0).toUpperCase() + altPlaystyle.slice(1)} Variant`,
        description: `Modified for ${altPlaystyle} playstyle`,
        score: 80,
        changes: [`Adjust stats for ${altPlaystyle} approach`]
      })
    }
    
    return alternatives
  }

  identifyBuildStrengths(build, synergies) {
    const strengths = []
    
    if (synergies.length > 2) {
      strengths.push('Strong synergy between multiple items')
    }
    
    const totalStats = Object.values(build.stats.totalStats || {}).reduce((a, b) => a + b, 0)
    if (totalStats > 600) {
      strengths.push('Well-optimized stat distribution')
    }
    
    if (this.hasExoticArmor(build)) {
      strengths.push('Effective exotic utilization')
    }
    
    return strengths
  }

  identifyBuildWeaknesses(build, conflicts) {
    const weaknesses = []
    
    if (conflicts.length > 0) {
      weaknesses.push(`${conflicts.length} potential conflicts detected`)
    }
    
    const stats = build.stats.totalStats || {}
    const lowStats = Object.entries(stats).filter(([stat, value]) => value < 60)
    if (lowStats.length > 2) {
      weaknesses.push('Several stats below optimal thresholds')
    }
    
    return weaknesses
  }

  generateRecommendations(build, requirements) {
    const recommendations = []
    
    recommendations.push('Consider masterworking high-stat armor pieces')
    recommendations.push('Experiment with different mod combinations')
    
    if (requirements.activityType === 'raid') {
      recommendations.push('Coordinate with your fireteam for optimal synergy')
    }
    
    return recommendations
  }

  // Helper methods
  async findExoticByName(name) {
    const items = this.manifest?.data?.DestinyInventoryItemDefinition || {}
    
    return Object.values(items).find(item =>
      item.itemType === 2 &&
      item.tierType === 6 &&
      item.displayProperties?.name?.toLowerCase().includes(name.toLowerCase())
    )
  }

  getArmorSlotForExotic(exotic) {
    const slotMap = {
      26: 'helmet',
      27: 'arms', 
      28: 'chest',
      29: 'legs',
      30: 'class'
    }
    
    return slotMap[exotic.itemSubType] || 'helmet'
  }

  getSlotHashForArmor(slot) {
    const slotHashes = {
      helmet: 26,
      arms: 27,
      chest: 28,
      legs: 29,
      class: 30
    }
    
    return slotHashes[slot] || 26
  }

  hasExoticArmor(build) {
    const armorSlots = ['helmet', 'arms', 'chest', 'legs', 'class']
    return armorSlots.some(slot => build[slot]?.tier === 'Exotic')
  }

  getVersion() {
    return this.version
  }
}