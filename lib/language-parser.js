// Natural language processing for build requests
export function parseLanguageInput(input, manifest) {
  const cleanInput = input.toLowerCase().trim()
  
  const parsedRequest = {
    originalInput: input,
    keywords: [],
    buildType: null,
    activities: [],
    weaponTypes: [],
    damageTypes: [],
    classType: null,
    specialRequirements: [],
    confidence: 0
  }

  // Extract keywords from input
  const words = cleanInput.split(/\s+/)
  parsedRequest.keywords = words

  // Parse build types
  parsedRequest.buildType = parseBuildType(cleanInput)
  
  // Parse activities
  parsedRequest.activities = parseActivities(cleanInput)
  
  // Parse weapon preferences
  parsedRequest.weaponTypes = parseWeaponTypes(cleanInput)
  
  // Parse damage types
  parsedRequest.damageTypes = parseDamageTypes(cleanInput)
  
  // Parse class type
  parsedRequest.classType = parseClassType(cleanInput)
  
  // Parse special requirements
  parsedRequest.specialRequirements = parseSpecialRequirements(cleanInput)
  
  // Calculate confidence score
  parsedRequest.confidence = calculateConfidence(parsedRequest)

  return parsedRequest
}

function parseBuildType(input) {
  const buildTypes = {
    'dps': ['dps', 'damage', 'boss damage', 'high damage', 'damage per second', 'burst damage', 'single target'],
    'pvp': ['pvp', 'crucible', 'trials', 'trials of osiris', 'comp', 'competitive', 'survival', 'control', 'clash'],
    'add_clear': ['add clear', 'adds', 'mob clear', 'trash', 'minor enemies', 'crowd control', 'aoe', 'area damage'],
    'survivability': ['survivability', 'tanky', 'survive', 'defensive', 'gm', 'grandmaster', 'nightfall', 'endgame'],
    'support': ['support', 'healer', 'healing', 'buff', 'team', 'wells', 'orbs', 'team support'],
    'ability_spam': ['ability spam', 'grenades', 'constant grenades', 'infinite abilities', 'ability regen', 'cooldown'],
    'movement': ['movement', 'speed', 'fast', 'mobility', 'parkour', 'traversal'],
    'exotic_synergy': ['build around', 'synergy', 'exotic synergy']
  }

  for (const [type, keywords] of Object.entries(buildTypes)) {
    for (const keyword of keywords) {
      if (input.includes(keyword)) {
        return type
      }
    }
  }

  return 'general' // Default
}

function parseActivities(input) {
  const activities = []
  
  const activityMappings = {
    'raid': ['raid', 'vog', 'vault of glass', 'dsc', 'deep stone crypt', 'garden', 'garden of salvation', 'last wish', 'kings fall', 'vow', 'vow of the disciple'],
    'nightfall': ['nightfall', 'nf', 'gm', 'grandmaster', 'ordeal', 'nightfall ordeal'],
    'trials': ['trials', 'trials of osiris', 'flawless'],
    'gambit': ['gambit', 'prime'],
    'dungeon': ['dungeon', 'prophecy', 'pit', 'shattered throne', 'grasp', 'duality', 'spire'],
    'crucible': ['crucible', 'pvp', 'comp', 'competitive', 'survival', 'control', 'clash', 'elimination'],
    'strike': ['strike', 'strikes', 'playlist'],
    'patrol': ['patrol', 'open world', 'public events', 'lost sectors']
  }

  for (const [activity, keywords] of Object.entries(activityMappings)) {
    for (const keyword of keywords) {
      if (input.includes(keyword) && !activities.includes(activity)) {
        activities.push(activity)
      }
    }
  }

  return activities
}

function parseWeaponTypes(input) {
  const weaponTypes = []
  
  const weaponMappings = {
    'hand_cannon': ['hand cannon', 'hc', 'handcannon'],
    'pulse_rifle': ['pulse', 'pulse rifle'],
    'scout_rifle': ['scout', 'scout rifle'],
    'auto_rifle': ['auto', 'auto rifle', 'ar'],
    'submachine_gun': ['smg', 'submachine gun', 'sub'],
    'sidearm': ['sidearm', 'side arm'],
    'bow': ['bow', 'combat bow'],
    'sniper_rifle': ['sniper', 'sniper rifle'],
    'shotgun': ['shotgun', 'shotty'],
    'fusion_rifle': ['fusion', 'fusion rifle'],
    'linear_fusion_rifle': ['linear fusion', 'linear', 'lfr'],
    'rocket_launcher': ['rocket', 'rocket launcher', 'rl'],
    'grenade_launcher': ['gl', 'grenade launcher'],
    'machine_gun': ['machine gun', 'mg', 'lmg'],
    'sword': ['sword'],
    'glaive': ['glaive']
  }

  for (const [type, keywords] of Object.entries(weaponMappings)) {
    for (const keyword of keywords) {
      if (input.includes(keyword) && !weaponTypes.includes(type)) {
        weaponTypes.push(type)
      }
    }
  }

  return weaponTypes
}

function parseDamageTypes(input) {
  const damageTypes = []
  
  const damageMappings = {
    'solar': ['solar', 'fire', 'burn', 'ignition'],
    'void': ['void', 'purple', 'devour', 'volatile'],
    'arc': ['arc', 'lightning', 'electric', 'chain lightning'],
    'strand': ['strand', 'green', 'grapple', 'suspend'],
    'stasis': ['stasis', 'ice', 'freeze', 'crystal'],
    'kinetic': ['kinetic', 'white', 'no element']
  }

  for (const [type, keywords] of Object.entries(damageMappings)) {
    for (const keyword of keywords) {
      if (input.includes(keyword) && !damageTypes.includes(type)) {
        damageTypes.push(type)
      }
    }
  }

  return damageTypes
}

function parseClassType(input) {
  if (input.includes('titan') || input.includes('crayon')) return 'titan'
  if (input.includes('hunter') || input.includes('cloak')) return 'hunter'
  if (input.includes('warlock') || input.includes('dress') || input.includes('bond')) return 'warlock'
  
  return null // No specific class mentioned
}

function parseSpecialRequirements(input) {
  const requirements = []
  
  const requirementMappings = {
    'no_reload': ['never reload', 'no reload', 'infinite ammo', 'auto loading'],
    'constant_abilities': ['constant abilities', 'infinite abilities', 'ability spam', 'cooldown reduction'],
    'high_mobility': ['fast', 'speed', 'mobility', 'movement'],
    'max_range': ['long range', 'range', 'distance'],
    'close_range': ['close range', 'melee', 'cqc', 'close quarters'],
    'team_play': ['team', 'fireteam', 'group', 'cooperative'],
    'solo_play': ['solo', 'alone', 'independent'],
    'budget_build': ['budget', 'cheap', 'easy to get', 'accessible'],
    'meta_build': ['meta', 'optimal', 'best in slot', 'bis', 'competitive'],
    'fun_build': ['fun', 'meme', 'silly', 'creative', 'unique']
  }

  for (const [requirement, keywords] of Object.entries(requirementMappings)) {
    for (const keyword of keywords) {
      if (input.includes(keyword) && !requirements.includes(requirement)) {
        requirements.push(requirement)
      }
    }
  }

  return requirements
}

function calculateConfidence(parsedRequest) {
  let confidence = 0
  
  // Base confidence for having a build type
  if (parsedRequest.buildType && parsedRequest.buildType !== 'general') {
    confidence += 30
  }
  
  // Confidence boost for specific activities
  if (parsedRequest.activities.length > 0) {
    confidence += 20
  }
  
  // Confidence boost for weapon type preferences
  if (parsedRequest.weaponTypes.length > 0) {
    confidence += 15
  }
  
  // Confidence boost for damage type preferences
  if (parsedRequest.damageTypes.length > 0) {
    confidence += 10
  }
  
  // Confidence boost for class specificity
  if (parsedRequest.classType) {
    confidence += 10
  }
  
  // Confidence boost for special requirements
  if (parsedRequest.specialRequirements.length > 0) {
    confidence += 15
  }

  return Math.min(100, confidence)
}

// Export additional utility functions
export function generateSearchSuggestions(partialInput, manifest) {
  const suggestions = []
  const input = partialInput.toLowerCase()
  
  // Common build suggestions
  const commonBuilds = [
    'High DPS build for raid bosses',
    'PVP hand cannon build for Crucible',
    'Add clear build with SMG',
    'Survivability build for Grandmaster Nightfalls',
    'Solar 3.0 healing build',
    'Void 3.0 devour build',
    'Arc 3.0 chain lightning build',
    'Strand grapple movement build',
    'Infinite grenade build',
    'Never reload build',
    'Maximum range sniper build',
    'Close quarters shotgun build'
  ]
  
  // Filter suggestions based on input
  for (const suggestion of commonBuilds) {
    if (suggestion.toLowerCase().includes(input)) {
      suggestions.push(suggestion)
    }
  }
  
  // Add exotic-specific suggestions if manifest available
  if (manifest?.weapons) {
    Object.values(manifest.weapons)
      .filter(weapon => weapon.tierType === 6) // Exotics only
      .forEach(exotic => {
        const name = exotic.displayProperties?.name
        if (name && name.toLowerCase().includes(input)) {
          suggestions.push(`Build around ${name}`)
        }
      })
  }
  
  return suggestions.slice(0, 8) // Limit to 8 suggestions
}

export function validateBuildRequest(parsedRequest) {
  const validation = {
    isValid: true,
    warnings: [],
    suggestions: []
  }
  
  // Check for conflicting requirements
  if (parsedRequest.buildType === 'pvp' && parsedRequest.activities.includes('raid')) {
    validation.warnings.push('PVP builds may not be optimal for raid content')
    validation.suggestions.push('Consider separate builds for PVP and raid activities')
  }
  
  // Check for low confidence
  if (parsedRequest.confidence < 50) {
    validation.warnings.push('Build request may be too vague')
    validation.suggestions.push('Try being more specific about the activity or playstyle you want')
  }
  
  // Check for impossible combinations
  if (parsedRequest.weaponTypes.length > 3) {
    validation.warnings.push('Too many weapon types specified')
    validation.suggestions.push('Destiny 2 builds can only use 3 weapons at once')
  }
  
  return validation
}