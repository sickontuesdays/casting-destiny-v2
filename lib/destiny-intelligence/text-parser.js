// lib/destiny-intelligence/text-parser.js
// Advanced text parsing for natural language build requests

export class TextParser {
  constructor() {
    this.initialized = false
    this.keywords = {
      classes: ['titan', 'hunter', 'warlock'],
      elements: ['solar', 'arc', 'void', 'stasis', 'strand', 'prismatic'],
      activities: ['raid', 'pvp', 'crucible', 'dungeon', 'nightfall', 'gambit', 'trials', 'strikes'],
      playstyles: ['aggressive', 'defensive', 'support', 'balanced', 'dps', 'speed', 'tank'],
      stats: ['mobility', 'resilience', 'recovery', 'discipline', 'intellect', 'strength'],
      statAliases: {
        'health': 'recovery',
        'resistance': 'resilience', 
        'grenade': 'discipline',
        'super': 'intellect',
        'melee': 'strength',
        'speed': 'mobility',
        'movement': 'mobility'
      },
      weaponTypes: ['hand cannon', 'auto rifle', 'scout rifle', 'pulse rifle', 'sniper rifle', 'shotgun', 'fusion rifle', 'sword', 'rocket launcher'],
      exoticNames: []
    }
    this.patterns = this.buildPatterns()
  }

  async initialize(manifestData) {
    try {
      console.log('📝 Initializing Text Parser...')
      
      if (manifestData?.data?.DestinyInventoryItemDefinition) {
        this.buildItemKeywords(manifestData)
      }
      
      this.initialized = true
      console.log('✅ Text Parser initialized')
      return true
    } catch (error) {
      console.error('❌ Text Parser initialization failed:', error)
      return false
    }
  }

  buildItemKeywords(manifestData) {
    if (!manifestData?.data?.DestinyInventoryItemDefinition) return

    const items = manifestData.data.DestinyInventoryItemDefinition
    const exoticNames = []
    
    Object.values(items).forEach(item => {
      if (item.inventory?.tierType === 6 && item.displayProperties?.name) { // Exotic items
        exoticNames.push(item.displayProperties.name.toLowerCase())
      }
    })

    this.keywords.exoticNames = exoticNames
    console.log(`📝 Loaded ${exoticNames.length} exotic item names for parsing`)
  }

  buildPatterns() {
    return {
      // Class patterns
      classPatterns: new RegExp(`\\b(${this.keywords.classes.join('|')})\\b`, 'i'),
      
      // Element patterns
      elementPatterns: new RegExp(`\\b(${this.keywords.elements.join('|')})\\b`, 'i'),
      
      // Activity patterns
      activityPatterns: new RegExp(`\\b(${this.keywords.activities.join('|')})\\b`, 'i'),
      
      // Stat patterns with aliases
      statPatterns: new RegExp(`\\b(${[...this.keywords.stats, ...Object.keys(this.keywords.statAliases)].join('|')})\\b`, 'i'),
      
      // High stat indicators
      highStatPatterns: /\b(high|max|maximum|tier (?:8|9|10)|100|tier ten)\b/i,
      
      // Focus patterns
      focusPatterns: /\b(focus|emphasize|priority|prioritize|concentrate|specialize)\s+(?:on\s+)?(\w+)/gi,
      
      // Exotic patterns
      exoticPatterns: /\b(exotic|using|with)\s+([\w\s'-]+?)(?:\s|$)/gi
    }
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
        normalizedInput: normalizedInput,
        patterns: this.extractPatterns(normalizedInput)
      }

      console.log('🔍 Parsed input result:', result)
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
    // Determine what the user is trying to do
    if (/\b(build|create|make|generate)\b/.test(input)) {
      return 'build_generation'
    } else if (/\b(optimize|improve|enhance|better)\b/.test(input)) {
      return 'build_optimization'
    } else if (/\b(compare|vs|versus|against)\b/.test(input)) {
      return 'build_comparison'
    } else if (/\b(analyze|analysis|breakdown)\b/.test(input)) {
      return 'build_analysis'
    }
    
    return 'build_generation' // Default intent
  }

  extractEntities(input) {
    const entities = {
      class: this.extractClass(input),
      element: this.extractElement(input),
      activity: this.extractActivity(input),
      playstyle: this.extractPlaystyle(input),
      focusStats: this.extractFocusStats(input),
      weaponTypes: this.extractWeaponTypes(input),
      exotics: this.extractExotics(input)
    }

    return entities
  }

  extractClass(input) {
    const match = this.patterns.classPatterns.exec(input)
    return match ? match[1].toLowerCase() : 'any'
  }

  extractElement(input) {
    const match = this.patterns.elementPatterns.exec(input)
    return match ? match[1].toLowerCase() : 'any'
  }

  extractActivity(input) {
    const match = this.patterns.activityPatterns.exec(input)
    if (!match) return 'general_pve'
    
    const activity = match[1].toLowerCase()
    
    // Normalize activity names
    if (activity === 'crucible') return 'pvp'
    if (activity === 'strikes') return 'general_pve'
    
    return activity
  }

  extractPlaystyle(input) {
    for (const playstyle of this.keywords.playstyles) {
      if (input.includes(playstyle)) {
        return playstyle
      }
    }
    
    // Infer playstyle from context
    if (/\b(damage|dps|kill|destroy)\b/.test(input)) return 'dps'
    if (/\b(survive|tank|defensive|safe)\b/.test(input)) return 'defensive'
    if (/\b(help|team|support|utility)\b/.test(input)) return 'support'
    if (/\b(fast|quick|speed|mobile)\b/.test(input)) return 'speed'
    if (/\b(aggressive|offense|attack)\b/.test(input)) return 'aggressive'
    
    return 'balanced'
  }

  extractFocusStats(input) {
    const focusStats = []
    
    // Direct stat mentions
    for (const stat of this.keywords.stats) {
      if (input.includes(stat)) {
        focusStats.push(stat)
      }
    }
    
    // Stat aliases
    for (const [alias, actualStat] of Object.entries(this.keywords.statAliases)) {
      if (input.includes(alias) && !focusStats.includes(actualStat)) {
        focusStats.push(actualStat)
      }
    }
    
    // High stat indicators
    if (this.patterns.highStatPatterns.test(input)) {
      // Look for nearby stat words
      const words = input.split(/\s+/)
      for (let i = 0; i < words.length; i++) {
        if (this.patterns.highStatPatterns.test(words[i])) {
          // Check surrounding words for stat names
          const context = words.slice(Math.max(0, i-2), i+3).join(' ')
          for (const stat of this.keywords.stats) {
            if (context.includes(stat) && !focusStats.includes(stat)) {
              focusStats.push(stat)
            }
          }
        }
      }
    }
    
    return focusStats
  }

  extractWeaponTypes(input) {
    const weaponTypes = []
    
    for (const weaponType of this.keywords.weaponTypes) {
      if (input.includes(weaponType)) {
        weaponTypes.push(weaponType)
      }
    }
    
    return weaponTypes
  }

  extractExotics(input) {
    const exotics = []
    
    // Look for exotic item names in the input
    for (const exoticName of this.keywords.exoticNames) {
      if (input.includes(exoticName)) {
        exotics.push(exoticName)
      }
    }
    
    // Look for exotic patterns
    const exoticMatches = [...input.matchAll(this.patterns.exoticPatterns)]
    for (const match of exoticMatches) {
      const potentialExotic = match[2]?.trim()
      if (potentialExotic && potentialExotic.length > 3) {
        exotics.push(potentialExotic)
      }
    }
    
    return [...new Set(exotics)] // Remove duplicates
  }

  extractPatterns(input) {
    const patterns = {
      hasNumbers: /\d+/.test(input),
      hasTierMention: /tier\s+\d+/i.test(input),
      hasComparison: /\b(better|worse|vs|versus|compared?)\b/i.test(input),
      hasNegation: /\b(not|no|without|avoid|exclude)\b/i.test(input),
      hasQuestion: /\?/.test(input),
      hasUrgency: /\b(urgent|asap|quickly|fast|need)\b/i.test(input),
      hasPreference: /\b(prefer|like|want|favorite)\b/i.test(input)
    }
    
    return patterns
  }

  calculateConfidence(input) {
    let confidence = 0.5 // Base confidence
    
    // Increase confidence for recognized elements
    if (this.patterns.classPatterns.test(input)) confidence += 0.1
    if (this.patterns.elementPatterns.test(input)) confidence += 0.1  
    if (this.patterns.activityPatterns.test(input)) confidence += 0.1
    if (this.patterns.statPatterns.test(input)) confidence += 0.1
    
    // Decrease confidence for very short or unclear input
    if (input.length < 10) confidence -= 0.2
    if (input.split(' ').length < 3) confidence -= 0.1
    
    // Increase confidence for detailed requests
    if (input.length > 50) confidence += 0.1
    if (input.split(' ').length > 8) confidence += 0.1
    
    return Math.max(0.1, Math.min(1.0, confidence))
  }

  // Helper methods for specific parsing tasks
  
  parseStatRequirements(input) {
    const requirements = {}
    
    // Look for specific stat targets
    const tierMatches = [...input.matchAll(/tier\s+(\d+)\s+(\w+)/gi)]
    for (const match of tierMatches) {
      const tier = parseInt(match[1])
      const stat = match[2].toLowerCase()
      
      if (this.keywords.stats.includes(stat)) {
        requirements[stat] = { target: tier * 10, priority: 'high' }
      }
    }
    
    // Look for "high" stat requests
    const highStatMatches = [...input.matchAll(/high\s+(\w+)/gi)]
    for (const match of highStatMatches) {
      const stat = match[1].toLowerCase()
      if (this.keywords.stats.includes(stat)) {
        requirements[stat] = { target: 80, priority: 'high' }
      }
    }
    
    return requirements
  }

  parseWeaponRequirements(input) {
    const requirements = {
      primary: null,
      special: null,
      heavy: null,
      exotic: null
    }
    
    // Extract weapon type preferences
    const weaponTypes = this.extractWeaponTypes(input)
    
    // Simple assignment logic (can be enhanced)
    for (const weaponType of weaponTypes) {
      if (['hand cannon', 'auto rifle', 'scout rifle', 'pulse rifle'].includes(weaponType)) {
        requirements.primary = weaponType
      } else if (['shotgun', 'sniper rifle', 'fusion rifle'].includes(weaponType)) {
        requirements.special = weaponType
      } else if (['rocket launcher', 'machine gun', 'sword'].includes(weaponType)) {
        requirements.heavy = weaponType
      }
    }
    
    return requirements
  }

  parseActivityContext(input) {
    const context = {
      primary: this.extractActivity(input),
      difficulty: 'normal',
      teamSize: 'any',
      role: 'any'
    }
    
    // Detect difficulty indicators
    if (/\b(master|grandmaster|gm|hard|difficult)\b/i.test(input)) {
      context.difficulty = 'high'
    } else if (/\b(easy|casual|normal|basic)\b/i.test(input)) {
      context.difficulty = 'normal'
    }
    
    // Detect team context
    if (/\b(solo|alone|single|myself)\b/i.test(input)) {
      context.teamSize = 'solo'
    } else if (/\b(team|group|fireteam|squad)\b/i.test(input)) {
      context.teamSize = 'team'
    }
    
    // Detect role preferences
    if (/\b(leader|carry|support|helper)\b/i.test(input)) {
      context.role = 'support'
    } else if (/\b(dps|damage|carry|main)\b/i.test(input)) {
      context.role = 'damage'
    }
    
    return context
  }

  // Advanced parsing methods

  extractComplexRequirements(input) {
    const requirements = {
      mustHave: [],
      mustNotHave: [],
      preferences: [],
      constraints: []
    }
    
    // Parse "must have" requirements
    const mustHaveMatches = [...input.matchAll(/\b(?:must|need|require|essential)\s+(\w+(?:\s+\w+)*)/gi)]
    for (const match of mustHaveMatches) {
      requirements.mustHave.push(match[1].trim())
    }
    
    // Parse exclusions
    const excludeMatches = [...input.matchAll(/\b(?:not|no|without|avoid|exclude)\s+(\w+(?:\s+\w+)*)/gi)]
    for (const match of excludeMatches) {
      requirements.mustNotHave.push(match[1].trim())
    }
    
    // Parse preferences
    const preferMatches = [...input.matchAll(/\b(?:prefer|like|want|favor)\s+(\w+(?:\s+\w+)*)/gi)]
    for (const match of preferMatches) {
      requirements.preferences.push(match[1].trim())
    }
    
    return requirements
  }

  extractNumericRequirements(input) {
    const numeric = {
      statTargets: {},
      tierTargets: {},
      percentages: []
    }
    
    // Extract tier requirements (e.g., "tier 8 recovery")
    const tierMatches = [...input.matchAll(/tier\s+(\d+)\s+(\w+)/gi)]
    for (const match of tierMatches) {
      const tier = parseInt(match[1])
      const stat = this.normalizeStat(match[2])
      if (stat && tier >= 1 && tier <= 10) {
        numeric.tierTargets[stat] = tier
        numeric.statTargets[stat] = tier * 10
      }
    }
    
    // Extract percentage requirements (e.g., "80% recovery")
    const percentMatches = [...input.matchAll(/(\d+)%\s+(\w+)/g)]
    for (const match of percentMatches) {
      const percent = parseInt(match[1])
      const stat = this.normalizeStat(match[2])
      if (stat && percent >= 0 && percent <= 100) {
        numeric.statTargets[stat] = percent
        numeric.percentages.push({ stat, value: percent })
      }
    }
    
    return numeric
  }

  normalizeStat(statName) {
    const normalized = statName.toLowerCase()
    
    if (this.keywords.stats.includes(normalized)) {
      return normalized
    }
    
    return this.keywords.statAliases[normalized] || null
  }

  // Contextual analysis methods

  analyzeActivityContext(input, activity) {
    const context = {
      activity,
      focus: [],
      challenges: [],
      teamRole: null
    }
    
    const activityContexts = {
      'raid': {
        focus: ['survivability', 'team utility', 'boss damage'],
        challenges: ['mechanics', 'coordination', 'sustained damage'],
        commonRoles: ['dps', 'support', 'add clear']
      },
      'pvp': {
        focus: ['mobility', 'quick recovery', 'neutral game'],
        challenges: ['dueling', 'positioning', 'ability timing'],
        commonRoles: ['slayer', 'support', 'objective']
      },
      'dungeon': {
        focus: ['solo survivability', 'champion handling', 'versatility'],
        challenges: ['mechanics', 'resource management', 'sustained combat'],
        commonRoles: ['solo', 'versatile']
      }
    }
    
    const activityData = activityContexts[activity]
    if (activityData) {
      context.focus = activityData.focus
      context.challenges = activityData.challenges
      
      // Try to detect team role from input
      for (const role of activityData.commonRoles) {
        if (input.includes(role)) {
          context.teamRole = role
          break
        }
      }
    }
    
    return context
  }

  extractConstraints(input) {
    const constraints = {
      budget: null,
      time: null,
      difficulty: null,
      equipment: []
    }
    
    // Look for constraint indicators
    if (/\b(budget|cheap|expensive|cost)\b/i.test(input)) {
      if (/\b(budget|cheap|low cost)\b/i.test(input)) {
        constraints.budget = 'low'
      } else if (/\b(expensive|high end|premium)\b/i.test(input)) {
        constraints.budget = 'high'
      }
    }
    
    if (/\b(quick|fast|simple|easy)\b/i.test(input)) {
      constraints.difficulty = 'simple'
    } else if (/\b(complex|advanced|detailed)\b/i.test(input)) {
      constraints.difficulty = 'advanced'
    }
    
    return constraints
  }

  // Validation and quality methods

  validateParsedRequest(parsed) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    }
    
    // Check for conflicting requirements
    if (parsed.entities.class === 'hunter' && parsed.entities.playstyle === 'tank') {
      validation.warnings.push('Hunter builds are typically not optimized for tanking')
      validation.suggestions.push('Consider Titan for defensive builds')
    }
    
    // Check for unrealistic stat combinations
    const focusStats = parsed.entities.focusStats || []
    if (focusStats.length > 3) {
      validation.warnings.push('Focusing on too many stats may result in lower overall performance')
      validation.suggestions.push('Consider prioritizing 2-3 key stats')
    }
    
    return validation
  }

  // Utility methods for debugging and analysis

  getParsingDebugInfo(input) {
    return {
      originalInput: input,
      normalizedInput: input.toLowerCase().trim(),
      words: input.toLowerCase().split(/\s+/),
      matches: {
        classes: this.patterns.classPatterns.exec(input),
        elements: this.patterns.elementPatterns.exec(input),
        activities: this.patterns.activityPatterns.exec(input),
        stats: this.patterns.statPatterns.exec(input)
      },
      keywordCounts: {
        classes: this.keywords.classes.filter(c => input.toLowerCase().includes(c)).length,
        elements: this.keywords.elements.filter(e => input.toLowerCase().includes(e)).length,
        activities: this.keywords.activities.filter(a => input.toLowerCase().includes(a)).length,
        stats: this.keywords.stats.filter(s => input.toLowerCase().includes(s)).length
      }
    }
  }
}