// lib/destiny-intelligence/synergy-engine.js
// Detects and analyzes build synergies and interactions

export class SynergyEngine {
  constructor() {
    this.initialized = false
    this.manifest = null
    this.synergyRules = []
    this.weaponSynergies = new Map()
    this.armorSynergies = new Map()
    this.elementSynergies = new Map()
    this.activitySynergies = new Map()
  }

  async initialize(manifestData) {
    try {
      console.log('🔗 Initializing Synergy Engine...')
      
      if (!manifestData) {
        throw new Error('Manifest data required for SynergyEngine')
      }
      
      this.manifest = manifestData
      
      // Build synergy detection rules
      this._buildSynergyRules()
      this._buildWeaponSynergies()
      this._buildArmorSynergies()
      this._buildElementSynergies()
      this._buildActivitySynergies()
      
      this.initialized = true
      console.log('✅ Synergy Engine initialized successfully')
      
    } catch (error) {
      console.error('❌ Synergy Engine initialization failed:', error)
      this.initialized = false
      throw error
    }
  }

  _buildSynergyRules() {
    this.synergyRules = [
      // Stat synergies
      {
        id: 'ability_loop',
        type: 'stat',
        conditions: ['discipline', 'strength'],
        threshold: 70,
        effect: 'Enhanced ability cycling',
        strength: 'high'
      },
      {
        id: 'super_focus',
        type: 'stat', 
        conditions: ['intellect', 'recovery'],
        threshold: 70,
        effect: 'Sustained super generation',
        strength: 'medium'
      },
      {
        id: 'mobility_resilience',
        type: 'stat',
        conditions: ['mobility', 'resilience'],
        threshold: 60,
        effect: 'PvP survivability',
        strength: 'high'
      },

      // Element synergies
      {
        id: 'solar_healing',
        type: 'element',
        conditions: ['solar', 'recovery'],
        effect: 'Enhanced solar healing abilities',
        strength: 'medium'
      },
      {
        id: 'arc_speed',
        type: 'element',
        conditions: ['arc', 'mobility'],
        effect: 'Enhanced arc movement abilities',
        strength: 'medium'
      },
      {
        id: 'void_ability',
        type: 'element',
        conditions: ['void', 'discipline'],
        effect: 'Enhanced void ability damage',
        strength: 'medium'
      },

      // Activity synergies
      {
        id: 'raid_survivability',
        type: 'activity',
        conditions: ['raid', 'recovery', 'resilience'],
        effect: 'Optimized for raid encounters',
        strength: 'high'
      },
      {
        id: 'pvp_dueling',
        type: 'activity',
        conditions: ['pvp', 'mobility', 'resilience'],
        effect: 'Enhanced PvP performance',
        strength: 'high'
      },
      {
        id: 'dungeon_solo',
        type: 'activity',
        conditions: ['dungeon', 'recovery', 'strength'],
        effect: 'Solo dungeon viability',
        strength: 'high'
      }
    ]
  }

  _buildWeaponSynergies() {
    // Weapon type synergies
    this.weaponSynergies.set('hand_cannon_pvp', {
      weaponType: 'Hand Cannon',
      activity: 'pvp',
      recommendedStats: ['mobility', 'resilience'],
      effect: 'Enhanced dueling potential'
    })

    this.weaponSynergies.set('sniper_pve', {
      weaponType: 'Sniper Rifle',
      activity: 'raid',
      recommendedStats: ['recovery', 'intellect'],
      effect: 'Sustained damage output'
    })

    this.weaponSynergies.set('shotgun_aggressive', {
      weaponType: 'Shotgun',
      playstyle: 'aggressive',
      recommendedStats: ['mobility', 'strength'],
      effect: 'Close-quarters dominance'
    })
  }

  _buildArmorSynergies() {
    // Exotic armor synergies (placeholder data)
    this.armorSynergies.set('orpheus_rig', {
      name: 'Orpheus Rig',
      class: 'hunter',
      element: 'void',
      recommendedStats: ['intellect', 'discipline'],
      effect: 'Enhanced tether generation and orb creation'
    })

    this.armorSynergies.set('phoenix_protocol', {
      name: 'Phoenix Protocol',
      class: 'warlock', 
      element: 'solar',
      recommendedStats: ['recovery', 'intellect'],
      effect: 'Well of Radiance extension and healing'
    })
  }

  _buildElementSynergies() {
    this.elementSynergies.set('solar_healing', {
      element: 'solar',
      recommendedStats: ['recovery'],
      activities: ['raid', 'dungeon'],
      effect: 'Enhanced healing and restoration abilities'
    })

    this.elementSynergies.set('arc_chaining', {
      element: 'arc',
      recommendedStats: ['discipline'],
      activities: ['strike', 'patrol'],
      effect: 'Chain lightning and add clear'
    })

    this.elementSynergies.set('void_devour', {
      element: 'void',
      recommendedStats: ['discipline', 'strength'],
      activities: ['dungeon', 'nightfall'],
      effect: 'Health regeneration through ability kills'
    })
  }

  _buildActivitySynergies() {
    this.activitySynergies.set('raid_team', {
      activity: 'raid',
      recommendedStats: ['recovery', 'intellect'],
      playstyles: ['support', 'balanced'],
      effect: 'Team utility and sustained damage'
    })

    this.activitySynergies.set('pvp_dueling', {
      activity: 'pvp',
      recommendedStats: ['mobility', 'resilience'],
      playstyles: ['aggressive', 'balanced'],
      effect: 'Enhanced survivability and positioning'
    })

    this.activitySynergies.set('gm_survival', {
      activity: 'nightfall',
      recommendedStats: ['resilience', 'recovery'],
      playstyles: ['defensive', 'balanced'],
      effect: 'Grandmaster-level survivability'
    })
  }

  findBuildSynergies(buildData, parsedRequest) {
    if (!this.initialized) {
      return []
    }

    const synergies = []
    const stats = buildData.stats || {}
    
    // SAFETY: Ensure focusStats is array
    const focusStats = Array.isArray(parsedRequest.focusStats) ? parsedRequest.focusStats : []

    // Check stat synergies
    this.synergyRules.forEach(rule => {
      if (rule.type === 'stat') {
        const hasAllStats = rule.conditions.every(stat => 
          focusStats.includes(stat) && (stats[stat] || 0) >= (rule.threshold || 50)
        )
        
        if (hasAllStats) {
          synergies.push({
            id: rule.id,
            type: 'stat',
            name: this._formatSynergyName(rule.id),
            description: rule.effect,
            strength: rule.strength,
            conditions: rule.conditions,
            score: this._calculateSynergyScore(rule, buildData)
          })
        }
      }
    })

    // Check element synergies
    if (parsedRequest.element !== 'any') {
      this.synergyRules.forEach(rule => {
        if (rule.type === 'element' && rule.conditions.includes(parsedRequest.element)) {
          const hasStatRequirement = rule.conditions.some(condition => 
            focusStats.includes(condition) && (stats[condition] || 0) >= 50
          )
          
          if (hasStatRequirement) {
            synergies.push({
              id: rule.id,
              type: 'element',
              name: this._formatSynergyName(rule.id),
              description: rule.effect,
              strength: rule.strength,
              element: parsedRequest.element,
              score: this._calculateSynergyScore(rule, buildData)
            })
          }
        }
      })
    }

    // Check activity synergies
    if (parsedRequest.activity !== 'general_pve') {
      this.synergyRules.forEach(rule => {
        if (rule.type === 'activity' && rule.conditions.includes(parsedRequest.activity)) {
          const hasStatAlignment = rule.conditions.some(condition =>
            focusStats.includes(condition)
          )
          
          if (hasStatAlignment) {
            synergies.push({
              id: rule.id,
              type: 'activity',
              name: this._formatSynergyName(rule.id),
              description: rule.effect,
              strength: rule.strength,
              activity: parsedRequest.activity,
              score: this._calculateSynergyScore(rule, buildData)
            })
          }
        }
      })
    }

    // Sort by strength and score
    synergies.sort((a, b) => {
      const strengthOrder = { 'high': 3, 'medium': 2, 'low': 1 }
      const aStrength = strengthOrder[a.strength] || 0
      const bStrength = strengthOrder[b.strength] || 0
      
      if (aStrength !== bStrength) {
        return bStrength - aStrength
      }
      
      return (b.score || 0) - (a.score || 0)
    })

    console.log(`🔗 Found ${synergies.length} synergies for build`)
    return synergies
  }

  _formatSynergyName(id) {
    return id.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  _calculateSynergyScore(rule, buildData) {
    let score = 50 // Base score
    
    // Higher score for more conditions met
    if (rule.conditions && rule.conditions.length > 2) score += 10
    
    // Bonus for high-impact synergies
    if (rule.strength === 'high') score += 20
    else if (rule.strength === 'medium') score += 10
    
    return Math.min(score, 100)
  }

  // Advanced synergy analysis
  analyzeWeaponSynergies(weapons, parsedRequest) {
    const synergies = []
    
    Object.entries(weapons || {}).forEach(([slot, weapon]) => {
      if (!weapon || !weapon.type) return
      
      const weaponKey = weapon.type.toLowerCase().replace(' ', '_')
      const activityKey = `${weaponKey}_${parsedRequest.activity}`
      
      if (this.weaponSynergies.has(activityKey)) {
        const synergy = this.weaponSynergies.get(activityKey)
        synergies.push({
          type: 'weapon',
          slot,
          weapon: weapon.type,
          ...synergy
        })
      }
    })
    
    return synergies
  }

  analyzeElementalSynergies(element, stats, activity) {
    const synergies = []
    
    if (element && element !== 'any') {
      const elementKey = `${element}_${activity}` 
      
      if (this.elementSynergies.has(elementKey)) {
        const synergy = this.elementSynergies.get(elementKey)
        synergies.push({
          type: 'elemental',
          element,
          activity,
          ...synergy
        })
      }
    }
    
    return synergies
  }

  calculateSynergyStrength(synergies) {
    if (!Array.isArray(synergies) || synergies.length === 0) {
      return { overall: 'none', score: 0 }
    }
    
    const strengthValues = { 'high': 3, 'medium': 2, 'low': 1 }
    let totalStrength = 0
    
    synergies.forEach(synergy => {
      totalStrength += strengthValues[synergy.strength] || 0
    })
    
    const averageStrength = totalStrength / synergies.length
    
    let overall = 'low'
    if (averageStrength >= 2.5) overall = 'high'
    else if (averageStrength >= 1.5) overall = 'medium'
    
    return {
      overall,
      score: Math.round(averageStrength * 33.33), // Convert to 0-100 scale
      count: synergies.length,
      breakdown: synergies.reduce((acc, syn) => {
        acc[syn.strength] = (acc[syn.strength] || 0) + 1
        return acc
      }, {})
    }
  }

  isInitialized() {
    return this.initialized
  }
}