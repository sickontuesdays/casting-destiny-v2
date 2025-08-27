// lib/destiny-intelligence/text-parser.js
// Advanced text parsing for natural language build requests

export class TextParser {
  constructor() {
    this.initialized = false
    this.manifest = null
    this.weaponNames = new Set()
    this.armorNames = new Set()
    this.statNames = new Set()
    this.activityNames = new Set()
    this.classNames = new Set()
    this.elementNames = new Set()
    this.exoticNames = new Set()
  }

  async initialize(manifestData) {
    try {
      console.log('🔤 Initializing Text Parser...')
      
      if (!manifestData || !manifestData.data) {
        throw new Error('Invalid manifest data for TextParser')
      }
      
      this.manifest = manifestData
      
      // Build lookup tables from manifest data
      this._buildLookupTables()
      
      this.initialized = true
      console.log('✅ Text Parser initialized successfully')
      
    } catch (error) {
      console.error('❌ Text Parser initialization failed:', error)
      this.initialized = false
      throw error
    }
  }

  _buildLookupTables() {
    const items = this.manifest.data.DestinyInventoryItemDefinition || {}
    
    // Build weapon and armor name lookup
    Object.values(items).forEach(item => {
      if (!item.displayProperties?.name || item.displayProperties.name.includes('Classified')) {
        return
      }
      
      const name = item.displayProperties.name.toLowerCase()
      
      // Weapons (itemType 3)
      if (item.itemType === 3) {
        this.weaponNames.add(name)
        if (item.inventory?.tierType === 6) { // Exotic
          this.exoticNames.add(name)
        }
      }
      
      // Armor (itemType 2) 
      if (item.itemType === 2) {
        this.armorNames.add(name)
        if (item.inventory?.tierType === 6) { // Exotic
          this.exoticNames.add(name)
        }
      }
    })

    // Add stat names
    const stats = ['mobility', 'resilience', 'recovery', 'discipline', 'intellect', 'strength']
    stats.forEach(stat => this.statNames.add(stat))

    // Add activity names
    const activities = ['raid', 'dungeon', 'nightfall', 'gm', 'grandmaster', 'pvp', 'crucible', 'gambit', 'strike', 'patrol']
    activities.forEach(activity => this.activityNames.add(activity))

    // Add class names
    const classes = ['titan', 'hunter', 'warlock']
    classes.forEach(cls => this.classNames.add(cls))

    // Add element names
    const elements = ['solar', 'arc', 'void', 'stasis', 'strand', 'prismatic']
    elements.forEach(element => this.elementNames.add(element))

    console.log(`📚 Built lookup tables:`)
    console.log(`  Weapons: ${this.weaponNames.size}`)
    console.log(`  Armor: ${this.armorNames.size}`)  
    console.log(`  Exotics: ${this.exoticNames.size}`)
    console.log(`  Stats: ${this.statNames.size}`)
    console.log(`  Activities: ${this.activityNames.size}`)
  }

  parseUserInput(input) {
    if (!this.initialized) {
      throw new Error('TextParser not initialized')
    }

    console.log('🔍 Parsing input:', input)
    
    const lowercaseInput = input.toLowerCase()
    const words = lowercaseInput.split(/\s+/)
    
    const parsed = {
      class: 'any',
      activity: 'general_pve',
      element: 'any',
      playstyle: 'balanced',
      focusStats: [], // Always initialize as array
      exotic: null,
      weapons: [],
      confidence: 0,
      keywords: words
    }

    // Parse class
    const foundClass = words.find(word => this.classNames.has(word))
    if (foundClass) {
      parsed.class = foundClass
    }

    // Parse activity
    const foundActivity = words.find(word => this.activityNames.has(word))
    if (foundActivity) {
      // Map variants to standard names
      const activityMap = {
        'gm': 'nightfall',
        'grandmaster': 'nightfall',
        'crucible': 'pvp',
        'strike': 'nightfall'
      }
      parsed.activity = activityMap[foundActivity] || foundActivity
    }

    // Parse element
    const foundElement = words.find(word => this.elementNames.has(word))
    if (foundElement) {
      parsed.element = foundElement
    }

    // Parse playstyle
    if (lowercaseInput.includes('tank') || lowercaseInput.includes('survival') || lowercaseInput.includes('defensive')) {
      parsed.playstyle = 'tank'
    } else if (lowercaseInput.includes('dps') || lowercaseInput.includes('damage') || lowercaseInput.includes('offensive')) {
      parsed.playstyle = 'dps'
    } else if (lowercaseInput.includes('speed') || lowercaseInput.includes('fast') || lowercaseInput.includes('mobile')) {
      parsed.playstyle = 'speed'
    } else if (lowercaseInput.includes('ability') || lowercaseInput.includes('spam') || lowercaseInput.includes('cooldown')) {
      parsed.playstyle = 'ability'
    }

    // Parse focus stats - ENSURE ARRAY
    const foundStats = words.filter(word => this.statNames.has(word))
    parsed.focusStats = foundStats.length > 0 ? foundStats : []

    // Additional stat parsing for variations
    if (lowercaseInput.includes('health') || lowercaseInput.includes('heal')) parsed.focusStats.push('recovery')
    if (lowercaseInput.includes('resistance') || lowercaseInput.includes('resist')) parsed.focusStats.push('resilience')
    if (lowercaseInput.includes('grenade') || lowercaseInput.includes('nade')) parsed.focusStats.push('discipline')
    if (lowercaseInput.includes('super') || lowercaseInput.includes('ultimate')) parsed.focusStats.push('intellect')
    if (lowercaseInput.includes('melee') || lowercaseInput.includes('punch')) parsed.focusStats.push('strength')
    if (lowercaseInput.includes('movement') || lowercaseInput.includes('sprint')) parsed.focusStats.push('mobility')

    // Remove duplicates
    parsed.focusStats = [...new Set(parsed.focusStats)]

    // Parse exotic items
    const foundExotic = words.find(word => this.exoticNames.has(word))
    if (foundExotic) {
      parsed.exotic = foundExotic
    }

    // Calculate confidence
    parsed.confidence = this.calculateParseConfidence(input, parsed)

    console.log('📝 Parsed result:', {
      class: parsed.class,
      activity: parsed.activity,
      element: parsed.element,
      focusStats: parsed.focusStats,
      confidence: Math.round(parsed.confidence * 100) + '%'
    })

    return parsed
  }

  calculateParseConfidence(input, parsed) {
    let confidence = 0.3 // Base confidence
    
    // Increase confidence for each successfully parsed element
    if (parsed.class !== 'any') confidence += 0.15
    if (parsed.activity !== 'general_pve') confidence += 0.15
    if (parsed.element !== 'any') confidence += 0.1
    if (parsed.playstyle !== 'balanced') confidence += 0.1
    if (parsed.focusStats.length > 0) confidence += 0.1 + (parsed.focusStats.length * 0.05)
    if (parsed.exotic) confidence += 0.1
    
    // Bonus for longer, more descriptive inputs
    const wordCount = input.split(/\s+/).length
    if (wordCount >= 5) confidence += 0.05
    if (wordCount >= 10) confidence += 0.05
    
    return Math.min(confidence, 1.0)
  }

  // Advanced parsing methods
  extractWeaponTypes(input) {
    const lowercaseInput = input.toLowerCase()
    const weaponTypes = []

    // Primary weapons
    if (lowercaseInput.includes('auto rifle') || lowercaseInput.includes('auto')) weaponTypes.push('Auto Rifle')
    if (lowercaseInput.includes('scout rifle') || lowercaseInput.includes('scout')) weaponTypes.push('Scout Rifle')
    if (lowercaseInput.includes('pulse rifle') || lowercaseInput.includes('pulse')) weaponTypes.push('Pulse Rifle')
    if (lowercaseInput.includes('hand cannon')) weaponTypes.push('Hand Cannon')
    if (lowercaseInput.includes('bow')) weaponTypes.push('Combat Bow')

    // Special weapons
    if (lowercaseInput.includes('shotgun')) weaponTypes.push('Shotgun')
    if (lowercaseInput.includes('fusion rifle') || lowercaseInput.includes('fusion')) weaponTypes.push('Fusion Rifle')
    if (lowercaseInput.includes('sniper rifle') || lowercaseInput.includes('sniper')) weaponTypes.push('Sniper Rifle')
    if (lowercaseInput.includes('glaive')) weaponTypes.push('Glaive')

    // Heavy weapons
    if (lowercaseInput.includes('rocket launcher') || lowercaseInput.includes('rocket')) weaponTypes.push('Rocket Launcher')
    if (lowercaseInput.includes('machine gun') || lowercaseInput.includes('lmg')) weaponTypes.push('Machine Gun')
    if (lowercaseInput.includes('linear fusion') || lowercaseInput.includes('linear')) weaponTypes.push('Linear Fusion Rifle')
    if (lowercaseInput.includes('sword')) weaponTypes.push('Sword')
    if (lowercaseInput.includes('grenade launcher')) weaponTypes.push('Grenade Launcher')

    return weaponTypes
  }

  extractActivityModifiers(input) {
    const lowercaseInput = input.toLowerCase()
    const modifiers = []

    // Activity types
    if (lowercaseInput.includes('contest') || lowercaseInput.includes('day one')) modifiers.push('contest')
    if (lowercaseInput.includes('master') || lowercaseInput.includes('grandmaster')) modifiers.push('master')
    if (lowercaseInput.includes('legend')) modifiers.push('legend')
    if (lowercaseInput.includes('hero')) modifiers.push('hero')

    // Playstyle modifiers
    if (lowercaseInput.includes('solo')) modifiers.push('solo')
    if (lowercaseInput.includes('team') || lowercaseInput.includes('group')) modifiers.push('team')
    if (lowercaseInput.includes('speedrun') || lowercaseInput.includes('fast clear')) modifiers.push('speedrun')

    return modifiers
  }

  findExoticReferences(input) {
    const lowercaseInput = input.toLowerCase()
    const words = lowercaseInput.split(/\s+/)
    const foundExotics = []

    // Check for exact exotic name matches
    words.forEach(word => {
      if (this.exoticNames.has(word)) {
        foundExotics.push(word)
      }
    })

    // Check for multi-word exotic names
    this.exoticNames.forEach(exoticName => {
      if (lowercaseInput.includes(exoticName)) {
        foundExotics.push(exoticName)
      }
    })

    return [...new Set(foundExotics)] // Remove duplicates
  }

  extractNumericRequirements(input) {
    const numbers = input.match(/\d+/g) || []
    const requirements = {}

    // Look for stat requirements like "100 recovery" or "tier 10 intellect"
    const statRegex = /(\d+)\s*(mobility|resilience|recovery|discipline|intellect|strength)/gi
    const tierRegex = /(tier|t)\s*(\d+)\s*(mobility|resilience|recovery|discipline|intellect|strength)/gi

    let match
    while ((match = statRegex.exec(input)) !== null) {
      const value = parseInt(match[1])
      const stat = match[2].toLowerCase()
      requirements[stat] = value
    }

    while ((match = tierRegex.exec(input)) !== null) {
      const tier = parseInt(match[2])
      const stat = match[3].toLowerCase()
      requirements[stat] = tier * 10 // Convert tier to stat points
    }

    return requirements
  }

  isInitialized() {
    return this.initialized
  }
}