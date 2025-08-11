class TextParser {
  constructor() {
    this.manifestData = null
    this.initialized = false
    this.keywords = {
      activities: ['raid', 'dungeon', 'pvp', 'pve', 'crucible', 'gambit', 'strikes', 'nightfall'],
      playstyles: ['aggressive', 'defensive', 'support', 'solo', 'team', 'stealth', 'tank', 'dps'],
      elements: ['arc', 'solar', 'void', 'stasis', 'strand'],
      stats: ['mobility', 'resilience', 'recovery', 'discipline', 'intellect', 'strength'],
      weapons: ['auto rifle', 'scout rifle', 'pulse rifle', 'hand cannon', 'submachine gun', 'sidearm', 'sniper', 'shotgun', 'fusion rifle', 'linear fusion', 'rocket launcher', 'grenade launcher', 'sword', 'glaive', 'bow'],
      exotics: ['exotic', 'legendary', 'rare', 'uncommon', 'common']
    }
    this.synonyms = {
      'dps': ['damage', 'dps', 'high damage', 'damage per second'],
      'tank': ['tanky', 'survivability', 'survival', 'defensive', 'tough'],
      'support': ['heal', 'healing', 'buff', 'team support', 'utility'],
      'pvp': ['crucible', 'player vs player', 'pvp', 'competitive'],
      'pve': ['player vs environment', 'pve', 'enemies', 'ai']
    }
  }

  async initialize(manifestData) {
    try {
      console.log('Initializing Text Parser...')
      this.manifestData = manifestData
      this.buildItemKeywords(manifestData)
      this.initialized = true
      console.log('Text Parser initialized successfully')
      return true
    } catch (error) {
      console.error('Error initializing Text Parser:', error)
      return false
    }
  }

  isInitialized() {
    return this.initialized
  }

  buildItemKeywords(manifestData) {
    if (!manifestData) return

    // Extract exotic names for keyword matching
    const exoticNames = []
    
    if (manifestData.armor) {
      manifestData.armor
        .filter(item => item.tierType === 6) // Exotic tier
        .forEach(exotic => {
          if (exotic.displayProperties?.name) {
            exoticNames.push(exotic.displayProperties.name.toLowerCase())
          }
        })
    }

    if (manifestData.weapons) {
      manifestData.weapons
        .filter(item => item.tierType === 6) // Exotic tier
        .forEach(exotic => {
          if (exotic.displayProperties?.name) {
            exoticNames.push(exotic.displayProperties.name.toLowerCase())
          }
        })
    }

    this.keywords.exoticNames = exoticNames
  }

  parseUserInput(input) {
    if (!this.initialized) {
      console.warn('Text Parser not initialized')
      return {
        intent: 'unknown',
        entities: {},
        confidence: 0
      }
    }

    try {
      const normalizedInput = input.toLowerCase().trim()
      
      const result = {
        intent: this.detectIntent(normalizedInput),
        entities: this.extractEntities(normalizedInput),
        confidence: this.calculateConfidence(normalizedInput),
        originalInput: input,
        normalizedInput: normalizedInput
      }

      console.log('Parsed user input:', result)
      return result
    } catch (error) {
      console.error('Error parsing user input:', error)
      return {
        intent: 'unknown',
        entities: {},
        confidence: 0,
        error: error.message
      }
    }
  }

  detectIntent(input) {
    // Build creation intents
    if (this.containsKeywords(input, ['build', 'loadout', 'setup'])) {
      if (this.containsKeywords(input, ['high', 'max', 'maximum'])) {
        return 'build_optimize'
      }
      if (this.containsKeywords(input, ['create', 'make', 'generate'])) {
        return 'build_create'
      }
      return 'build_general'
    }

    // Activity-specific intents
    if (this.containsKeywords(input, ['raid'])) {
      return 'activity_raid'
    }
    if (this.containsKeywords(input, ['pvp', 'crucible'])) {
      return 'activity_pvp'
    }
    if (this.containsKeywords(input, ['dungeon'])) {
      return 'activity_dungeon'
    }

    // Stat optimization intents
    if (this.containsKeywords(input, this.keywords.stats)) {
      return 'stat_focus'
    }

    // Exotic recommendation intents
    if (this.containsKeywords(input, ['exotic', 'best', 'recommend'])) {
      return 'exotic_recommendation'
    }

    // Synergy detection intents
    if (this.containsKeywords(input, ['synergy', 'work with', 'combo'])) {
      return 'synergy_analysis'
    }

    return 'general_question'
  }

  extractEntities(input) {
    const entities = {}

    // Extract activity mentions
    entities.activities = this.extractKeywordMatches(input, this.keywords.activities)

    // Extract playstyle mentions
    entities.playstyles = this.extractKeywordMatches(input, this.keywords.playstyles)

    // Extract element mentions
    entities.elements = this.extractKeywordMatches(input, this.keywords.elements)

    // Extract stat mentions
    entities.stats = this.extractKeywordMatches(input, this.keywords.stats)

    // Extract weapon type mentions
    entities.weapons = this.extractKeywordMatches(input, this.keywords.weapons)

    // Extract class mentions
    entities.classes = this.extractClassMentions(input)

    // Extract exotic mentions
    entities.exotics = this.extractExoticMentions(input)

    // Extract numbers (for stat values)
    entities.numbers = this.extractNumbers(input)

    // Extract boolean preferences
    entities.preferences = this.extractPreferences(input)

    return entities
  }

  extractKeywordMatches(input, keywords) {
    const matches = []
    keywords.forEach(keyword => {
      if (input.includes(keyword)) {
        matches.push(keyword)
      }
    })
    return matches
  }

  extractClassMentions(input) {
    const classes = ['hunter', 'titan', 'warlock']
    return this.extractKeywordMatches(input, classes)
  }

  extractExoticMentions(input) {
    if (!this.keywords.exoticNames) return []
    
    const matches = []
    this.keywords.exoticNames.forEach(exoticName => {
      if (input.includes(exoticName)) {
        matches.push(exoticName)
      }
    })
    return matches
  }

  extractNumbers(input) {
    const numberPattern = /\b\d+\b/g
    const matches = input.match(numberPattern)
    return matches ? matches.map(num => parseInt(num)) : []
  }

  extractPreferences(input) {
    const preferences = {}
    
    // High/low preferences
    if (this.containsKeywords(input, ['high', 'max', 'maximum'])) {
      preferences.priority = 'high'
    } else if (this.containsKeywords(input, ['low', 'min', 'minimum'])) {
      preferences.priority = 'low'
    }

    // Solo/team preferences
    if (this.containsKeywords(input, ['solo', 'alone'])) {
      preferences.groupSize = 'solo'
    } else if (this.containsKeywords(input, ['team', 'group', 'fireteam'])) {
      preferences.groupSize = 'team'
    }

    // Difficulty preferences
    if (this.containsKeywords(input, ['easy', 'simple', 'beginner'])) {
      preferences.difficulty = 'easy'
    } else if (this.containsKeywords(input, ['hard', 'difficult', 'challenging', 'advanced'])) {
      preferences.difficulty = 'hard'
    }

    return preferences
  }

  containsKeywords(input, keywords) {
    return keywords.some(keyword => input.includes(keyword))
  }

  calculateConfidence(input) {
    let confidence = 0.5 // Base confidence

    // Increase confidence based on keyword matches
    const totalKeywords = Object.values(this.keywords).flat().length
    let matchedKeywords = 0

    Object.values(this.keywords).forEach(keywordList => {
      keywordList.forEach(keyword => {
        if (input.includes(keyword)) {
          matchedKeywords++
        }
      })
    })

    // Confidence boost from keyword density
    const keywordDensity = matchedKeywords / Math.max(input.split(' ').length, 1)
    confidence += keywordDensity * 0.3

    // Confidence boost from specific patterns
    if (input.includes('build') || input.includes('loadout')) {
      confidence += 0.2
    }

    if (this.keywords.exoticNames && this.keywords.exoticNames.some(name => input.includes(name))) {
      confidence += 0.2
    }

    return Math.min(confidence, 1.0)
  }

  generateSearchTerms(parsedInput) {
    if (!parsedInput || !this.initialized) {
      return []
    }

    const searchTerms = []
    const entities = parsedInput.entities

    // Add activity-based search terms
    if (entities.activities && entities.activities.length > 0) {
      entities.activities.forEach(activity => {
        searchTerms.push(`${activity} build`)
        searchTerms.push(`best ${activity} loadout`)
      })
    }

    // Add stat-based search terms
    if (entities.stats && entities.stats.length > 0) {
      entities.stats.forEach(stat => {
        searchTerms.push(`high ${stat} build`)
        searchTerms.push(`${stat} focused loadout`)
      })
    }

    // Add class-based search terms
    if (entities.classes && entities.classes.length > 0) {
      entities.classes.forEach(className => {
        searchTerms.push(`${className} build`)
        if (entities.activities && entities.activities.length > 0) {
          entities.activities.forEach(activity => {
            searchTerms.push(`${className} ${activity} build`)
          })
        }
      })
    }

    // Add exotic-based search terms
    if (entities.exotics && entities.exotics.length > 0) {
      entities.exotics.forEach(exotic => {
        searchTerms.push(`${exotic} build`)
        searchTerms.push(`${exotic} synergy`)
      })
    }

    return searchTerms.slice(0, 10) // Limit to top 10 search terms
  }

  expandSynonyms(term) {
    const expanded = [term]
    
    Object.entries(this.synonyms).forEach(([key, synonymList]) => {
      if (synonymList.includes(term.toLowerCase())) {
        expanded.push(...synonymList.filter(syn => syn !== term.toLowerCase()))
      }
    })

    return [...new Set(expanded)] // Remove duplicates
  }

  classifyBuildType(parsedInput) {
    if (!parsedInput || !this.initialized) {
      return 'general'
    }

    const entities = parsedInput.entities

    // PvP build
    if (entities.activities && entities.activities.some(act => ['pvp', 'crucible'].includes(act))) {
      return 'pvp'
    }

    // Raid build
    if (entities.activities && entities.activities.includes('raid')) {
      return 'raid'
    }

    // Dungeon build
    if (entities.activities && entities.activities.includes('dungeon')) {
      return 'dungeon'
    }

    // Solo build
    if (entities.preferences && entities.preferences.groupSize === 'solo') {
      return 'solo'
    }

    // Stat-focused build
    if (entities.stats && entities.stats.length >= 2) {
      return 'stat_focused'
    }

    // Exotic-centered build
    if (entities.exotics && entities.exotics.length > 0) {
      return 'exotic_centered'
    }

    return 'general'
  }
}

// Export both named and default
export { TextParser }
export default TextParser