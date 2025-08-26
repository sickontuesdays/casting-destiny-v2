// lib/enhanced-build-scorer.js
// Advanced build scoring system with comprehensive analysis

export class EnhancedBuildScorer {
  constructor() {
    this.initialized = false
    this.manifest = null
    this.buildIntelligence = null
    this.version = '2.0.0'
    this.scoringWeights = {
      statOptimization: 25,
      synergyStrength: 25,
      activityFit: 20,
      weaponSynergy: 15,
      armorOptimization: 10,
      exoticUtilization: 5
    }
  }

  async initialize(manifestData, buildIntelligenceInstance = null) {
    try {
      console.log('📊 Initializing Enhanced Build Scorer...')
      
      if (!manifestData) {
        throw new Error('Manifest data is required for build scoring')
      }
      
      this.manifest = manifestData
      this.buildIntelligence = buildIntelligenceInstance
      
      this.initialized = true
      console.log('✅ Enhanced Build Scorer initialized successfully')
      return true
      
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Build Scorer:', error)
      this.initialized = false
      throw error
    }
  }

  isInitialized() {
    return this.initialized
  }

  async scoreBuild(build, requirements = {}, options = {}) {
    if (!this.initialized) {
      throw new Error('Enhanced Build Scorer not initialized')
    }

    try {
      console.log('📈 Scoring build with enhanced analysis...')
      
      const scores = {
        statOptimization: this.scoreStatOptimization(build, requirements),
        synergyStrength: this.scoreSynergyStrength(build),
        activityFit: this.scoreActivityFit(build, requirements),
        weaponSynergy: this.scoreWeaponSynergy(build, requirements),
        armorOptimization: this.scoreArmorOptimization(build, requirements),
        exoticUtilization: this.scoreExoticUtilization(build)
      }

      // Calculate weighted total score
      const totalScore = this.calculateWeightedScore(scores)

      // Generate detailed analysis
      const analysis = {
        overallScore: totalScore,
        categoryScores: scores,
        strengths: this.identifyStrengths(scores),
        weaknesses: this.identifyWeaknesses(scores),
        improvements: this.suggestImprovements(scores, build, requirements),
        tier: this.determineScoreTier(totalScore)
      }

      console.log(`✅ Build scored: ${totalScore}/100 (${analysis.tier} tier)`)
      
      return analysis
      
    } catch (error) {
      console.error('Error scoring build:', error)
      return {
        overallScore: 0,
        error: error.message,
        tier: 'error'
      }
    }
  }

  scoreStatOptimization(build, requirements) {
    const stats = build.stats || {}
    const focusStats = requirements.focusStats || []
    let score = 50 // Base score

    // Check if focused stats meet targets
    for (const focusStat of focusStats) {
      const statValue = stats[focusStat] || 0
      const tier = Math.floor(statValue / 10)
      
      if (tier >= 10) score += 10      // Tier 10 = +10 points
      else if (tier >= 8) score += 7   // Tier 8-9 = +7 points  
      else if (tier >= 6) score += 4   // Tier 6-7 = +4 points
      else if (tier >= 4) score += 2   // Tier 4-5 = +2 points
    }

    // Bonus for high overall stats
    const totalTier = Object.values(stats).reduce((sum, val) => sum + Math.floor(val / 10), 0)
    if (totalTier >= 50) score += 15      // 50+ total tiers
    else if (totalTier >= 40) score += 10 // 40+ total tiers
    else if (totalTier >= 30) score += 5  // 30+ total tiers

    // Penalty for critically low stats
    for (const [stat, value] of Object.entries(stats)) {
      if (value < 30 && !['mobility', 'strength'].includes(stat)) { // Allow low mobility/strength
        score -= 5
      }
    }

    return Math.max(0, Math.min(100, score))
  }

  scoreSynergyStrength(build) {
    const synergies = build.synergies || []
    let score = 30 // Base score

    // Count synergies by strength
    let legendaryCount = 0
    let highCount = 0
    let mediumCount = 0

    if (Array.isArray(synergies)) {
      for (const synergy of synergies) {
        if (synergy.strength === 'legendary') legendaryCount++
        else if (synergy.strength === 'high') highCount++
        else if (synergy.strength === 'medium') mediumCount++
      }
    } else if (typeof synergies === 'object' && synergies.overall) {
      // Handle structured synergy object
      for (const synergy of synergies.overall) {
        if (synergy.strength === 'legendary') legendaryCount++
        else if (synergy.strength === 'high') highCount++
        else if (synergy.strength === 'medium') mediumCount++
      }
    }

    // Score based on synergy quality
    score += legendaryCount * 20  // Legendary synergies = +20 each
    score += highCount * 12       // High synergies = +12 each
    score += mediumCount * 7      // Medium synergies = +7 each

    // Bonus for synergy diversity
    const synergyTypes = new Set()
    const allSynergies = Array.isArray(synergies) ? synergies : (synergies.overall || [])
    
    for (const synergy of allSynergies) {
      if (synergy.type) synergyTypes.add(synergy.type)
    }

    if (synergyTypes.size >= 3) score += 10 // Multiple synergy types

    return Math.max(0, Math.min(100, score))
  }

  scoreActivityFit(build, requirements) {
    const activity = requirements.activity || build.metadata?.activity
    let score = 50 // Base score

    if (!activity || activity === 'general_pve') {
      return 75 // Good default score for general content
    }

    const stats = build.stats || {}
    const element = build.metadata?.element
    const weapons = build.loadout?.weapons || {}

    // Activity-specific scoring
    switch (activity) {
      case 'raid':
        // Prioritize survivability and team utility
        if (stats.recovery >= 80) score += 15
        if (stats.intellect >= 70) score += 10
        if (stats.discipline >= 60) score += 5
        
        // Check for boss damage weapons
        const hasBossDamageWeapon = Object.values(weapons).some(w => 
          w && ['sniper rifle', 'linear fusion rifle', 'rocket launcher'].some(type => 
            w.type && w.type.toLowerCase().includes(type)
          )
        )
        if (hasBossDamageWeapon) score += 15
        
        break

      case 'pvp':
        // Prioritize mobility and quick recovery
        if (stats.mobility >= 80) score += 15
        if (stats.recovery >= 70) score += 15
        if (stats.resilience >= 60) score += 10
        
        // Check for PvP meta weapons
        const hasPvPWeapon = Object.values(weapons).some(w => 
          w && ['hand cannon', 'pulse rifle', 'shotgun'].some(type => 
            w.type && w.type.toLowerCase().includes(type)
          )
        )
        if (hasPvPWeapon) score += 10
        
        break

      case 'dungeon':
        // Balance of survivability and damage
        if (stats.recovery >= 80) score += 15
        if (stats.resilience >= 60) score += 10
        if (stats.intellect >= 60) score += 8
        
        break

      case 'nightfall':
        // Champion coverage and survivability
        if (stats.recovery >= 70) score += 10
        if (stats.resilience >= 60) score += 10
        // Would check for champion mods if available
        break
    }

    // Element matching bonus
    if (element && element !== 'any') {
      const elementalWeapons = Object.values(weapons).filter(w => 
        w && w.element && w.element.toLowerCase() === element
      ).length
      
      if (elementalWeapons >= 2) score += 10
    }

    return Math.max(0, Math.min(100, score))
  }

  scoreWeaponSynergy(build, requirements) {
    const weapons = build.loadout?.weapons || {}
    const element = build.metadata?.element
    let score = 40 // Base score

    // Check for elemental matching
    if (element && element !== 'any') {
      const matchingWeapons = Object.values(weapons).filter(w => 
        w && w.element && w.element.toLowerCase() === element
      ).length

      score += matchingWeapons * 15 // +15 per matching weapon
    }

    // Check for weapon diversity (covering all ranges)
    const weaponTypes = Object.values(weapons)
      .filter(w => w && w.type)
      .map(w => w.type.toLowerCase())

    const hasCloseRange = weaponTypes.some(t => ['shotgun', 'submachine gun', 'sidearm'].includes(t))
    const hasMidRange = weaponTypes.some(t => ['auto rifle', 'pulse rifle', 'hand cannon'].includes(t))
    const hasLongRange = weaponTypes.some(t => ['sniper rifle', 'scout rifle', 'bow'].includes(t))

    if (hasCloseRange && hasMidRange) score += 10
    if (hasMidRange && hasLongRange) score += 10
    if (hasCloseRange && hasLongRange) score += 5

    // Check for exotic weapons
    const exoticWeapons = Object.values(weapons).filter(w => w && w.tierType === 6)
    if (exoticWeapons.length > 0) {
      score += 15 // Bonus for exotic weapon utilization
    }

    // Activity-specific weapon synergy
    const activity = requirements.activity || build.metadata?.activity
    if (activity) {
      const activityBonus = this.calculateWeaponActivityBonus(weapons, activity)
      score += activityBonus
    }

    return Math.max(0, Math.min(100, score))
  }

  scoreArmorOptimization(build, requirements) {
    const armor = build.loadout?.armor || {}
    const stats = build.stats || {}
    const element = build.metadata?.element
    let score = 40 // Base score

    // Check for elemental armor matching
    if (element && element !== 'any') {
      const matchingArmor = Object.values(armor).filter(piece => 
        piece && piece.element && piece.element.toLowerCase() === element
      ).length

      score += matchingArmor * 8 // +8 per matching armor piece
    }

    // Check for exotic armor
    const exoticArmor = Object.values(armor).filter(piece => piece && piece.tierType === 6)
    if (exoticArmor.length > 0) {
      score += 20 // Bonus for exotic armor
    }

    // Check for stat distribution efficiency
    const statEfficiency = this.calculateStatEfficiency(stats)
    score += statEfficiency * 20 // Up to +20 for perfect efficiency

    // Check for armor mod optimization
    const mods = build.loadout?.mods || {}
    if (mods.armor && mods.armor.length >= 5) {
      score += 15 // Full armor mod utilization
    }

    return Math.max(0, Math.min(100, score))
  }

  scoreExoticUtilization(build) {
    const weapons = build.loadout?.weapons || {}
    const armor = build.loadout?.armor || {}
    let score = 20 // Base score

    // Count exotic items
    const exoticWeapons = Object.values(weapons).filter(w => w && w.tierType === 6)
    const exoticArmor = Object.values(armor).filter(piece => piece && piece.tierType === 6)

    const totalExotics = exoticWeapons.length + exoticArmor.length

    if (totalExotics === 0) {
      score = 40 // Neutral score for no exotics
    } else if (totalExotics === 1) {
      score = 100 // Perfect - one exotic as intended
    } else {
      score = 20 // Penalty for multiple exotics (not possible in game)
    }

    // Bonus for synergistic exotic choice
    if (totalExotics === 1) {
      const exotic = [...exoticWeapons, ...exoticArmor][0]
      const element = build.metadata?.element
      const activity = build.metadata?.activity

      // Check if exotic fits the build theme
      if (element && exotic.element && exotic.element.toLowerCase() === element) {
        score = Math.min(100, score + 10) // Element matching bonus
      }

      // Activity-specific exotic bonuses
      if (activity === 'raid' && this.isRaidExotic(exotic)) {
        score = Math.min(100, score + 15)
      } else if (activity === 'pvp' && this.isPvPExotic(exotic)) {
        score = Math.min(100, score + 15)
      }
    }

    return Math.max(0, Math.min(100, score))
  }

  calculateWeightedScore(scores) {
    let totalScore = 0

    for (const [category, score] of Object.entries(scores)) {
      const weight = this.scoringWeights[category] || 0
      totalScore += (score * weight) / 100
    }

    return Math.round(totalScore)
  }

  calculateStatEfficiency(stats) {
    // Calculate how efficiently stats are distributed (avoiding waste)
    let efficiency = 1.0
    let wastedPoints = 0
    
    for (const [stat, value] of Object.entries(stats)) {
      const tier = Math.floor(value / 10)
      const excess = value % 10
      
      // Waste = points above tier breakpoint
      if (excess > 0 && tier < 10) {
        wastedPoints += excess
      }
    }

    // Reduce efficiency based on wasted points
    const maxWaste = Object.keys(stats).length * 9 // Max 9 wasted per stat
    efficiency = Math.max(0, 1 - (wastedPoints / maxWaste))

    return efficiency
  }

  identifyStrengths(scores) {
    const strengths = []
    const threshold = 80

    for (const [category, score] of Object.entries(scores)) {
      if (score >= threshold) {
        strengths.push({
          category,
          score,
          description: this.getStrengthDescription(category, score)
        })
      }
    }

    return strengths
  }

  identifyWeaknesses(scores) {
    const weaknesses = []
    const threshold = 40

    for (const [category, score] of Object.entries(scores)) {
      if (score < threshold) {
        weaknesses.push({
          category,
          score,
          description: this.getWeaknessDescription(category, score)
        })
      }
    }

    return weaknesses
  }

  suggestImprovements(scores, build, requirements) {
    const improvements = []

    // Stat optimization suggestions
    if (scores.statOptimization < 70) {
      improvements.push({
        category: 'stats',
        priority: 'high',
        description: 'Focus on reaching tier breakpoints in key stats',
        actionable: this.getStatImprovementActions(build, requirements)
      })
    }

    // Synergy improvements
    if (scores.synergyStrength < 60) {
      improvements.push({
        category: 'synergy',
        priority: 'medium', 
        description: 'Align weapon elements with subclass for better synergy',
        actionable: this.getSynergyImprovementActions(build, requirements)
      })
    }

    // Activity fit improvements
    if (scores.activityFit < 70) {
      improvements.push({
        category: 'activity',
        priority: 'medium',
        description: `Optimize build for ${requirements.activity || 'target activity'}`,
        actionable: this.getActivityImprovementActions(build, requirements)
      })
    }

    return improvements
  }

  getStatImprovementActions(build, requirements) {
    const actions = []
    const stats = build.stats || {}
    const focusStats = requirements.focusStats || []

    for (const focusStat of focusStats) {
      const currentValue = stats[focusStat] || 0
      const currentTier = Math.floor(currentValue / 10)
      
      if (currentTier < 8) {
        const targetTier = Math.min(10, currentTier + 2)
        const pointsNeeded = (targetTier * 10) - currentValue
        
        actions.push(`Add ${pointsNeeded} more ${focusStat} to reach tier ${targetTier}`)
      }
    }

    return actions
  }

  getSynergyImprovementActions(build, requirements) {
    const actions = []
    const element = build.metadata?.element
    const weapons = build.loadout?.weapons || {}

    if (element && element !== 'any') {
      // Check weapon element matching
      const nonMatchingWeapons = Object.entries(weapons).filter(([slot, weapon]) => 
        weapon && weapon.element && weapon.element.toLowerCase() !== element
      )

      if (nonMatchingWeapons.length > 0) {
        actions.push(`Switch to ${element} weapons for enhanced elemental synergy`)
      }

      // Check for elemental mods
      actions.push(`Equip ${element} elemental well mods for ability regeneration`)
    }

    return actions
  }

  getActivityImprovementActions(build, requirements) {
    const actions = []
    const activity = requirements.activity || build.metadata?.activity
    const stats = build.stats || {}

    if (!activity) return actions

    switch (activity) {
      case 'raid':
        if (stats.recovery < 70) actions.push('Increase recovery for raid survivability')
        if (stats.intellect < 60) actions.push('Boost intellect for more frequent supers')
        actions.push('Equip boss damage weapons for DPS phases')
        break

      case 'pvp':
        if (stats.mobility < 70) actions.push('Increase mobility for better positioning')
        if (stats.recovery < 60) actions.push('Boost recovery for faster healing')
        actions.push('Use meta PvP weapons for competitive advantage')
        break

      case 'dungeon':
        if (stats.recovery < 70) actions.push('Prioritize recovery for solo survivability') 
        if (stats.resilience < 50) actions.push('Add resilience for damage reduction')
        actions.push('Include champion counter weapons')
        break
    }

    return actions
  }

  determineScoreTier(score) {
    if (score >= 90) return 'S-Tier'
    if (score >= 80) return 'A-Tier'
    if (score >= 70) return 'B-Tier'
    if (score >= 60) return 'C-Tier'
    if (score >= 50) return 'D-Tier'
    return 'F-Tier'
  }

  getStrengthDescription(category, score) {
    const descriptions = {
      statOptimization: 'Excellent stat distribution with optimal tier breakpoints',
      synergyStrength: 'Strong synergies creating powerful build interactions',
      activityFit: 'Perfectly optimized for target activity requirements',
      weaponSynergy: 'Weapons work together excellently with subclass',
      armorOptimization: 'Armor and mods create efficient stat distribution',
      exoticUtilization: 'Exotic item choice enhances overall build effectiveness'
    }

    return descriptions[category] || 'Strong performance in this category'
  }

  getWeaknessDescription(category, score) {
    const descriptions = {
      statOptimization: 'Stat distribution could be optimized for better tier breakpoints',
      synergyStrength: 'Limited synergy between build components',
      activityFit: 'Build may not be well-suited for target activity',
      weaponSynergy: 'Weapons could be better aligned with subclass element',
      armorOptimization: 'Armor and mod choices could be more efficient',
      exoticUtilization: 'Exotic choice may not fit build theme optimally'
    }

    return descriptions[category] || 'Room for improvement in this category'
  }

  // Helper methods for exotic classification

  isRaidExotic(exotic) {
    const raidExotics = [
      'whisper of the worm', 'sleeper simulant', 'gjalla', 'divinity',
      'anarchy', 'xenophage', 'izanagi', 'well of radiance', 'ward of dawn'
    ]
    
    return exotic.name && raidExotics.some(name => 
      exotic.name.toLowerCase().includes(name)
    )
  }

  isPvPExotic(exotic) {
    const pvpExotics = [
      'thorn', 'last word', 'ace of spades', 'chaperone', 'felwinter',
      'transversive steps', 'ophidian aspect', 'stompees'
    ]
    
    return exotic.name && pvpExotics.some(name => 
      exotic.name.toLowerCase().includes(name)
    )
  }

  // Advanced scoring methods

  calculateSynergyMultiplier(build) {
    const synergies = build.synergies || []
    let multiplier = 1.0

    const legendaryCount = Array.isArray(synergies) ? 
      synergies.filter(s => s.strength === 'legendary').length :
      (synergies.overall || []).filter(s => s.strength === 'legendary').length

    // Each legendary synergy adds 5% multiplier
    multiplier += legendaryCount * 0.05
    
    return Math.min(1.5, multiplier) // Cap at 50% bonus
  }

  assessBuildViability(build, requirements) {
    const scores = {
      statOptimization: this.scoreStatOptimization(build, requirements),
      synergyStrength: this.scoreSynergyStrength(build),
      activityFit: this.scoreActivityFit(build, requirements)
    }

    const averageScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / 3
    
    return {
      viable: averageScore >= 60,
      competitiveViable: averageScore >= 80,
      averageScore: Math.round(averageScore),
      criticalIssues: Object.entries(scores).filter(([cat, score]) => score < 40),
      recommendations: averageScore < 60 ? this.getViabilityRecommendations(scores) : []
    }
  }

  getViabilityRecommendations(scores) {
    const recommendations = []

    if (scores.statOptimization < 40) {
      recommendations.push('Critical: Stat distribution needs major optimization')
    }
    
    if (scores.synergyStrength < 40) {
      recommendations.push('Important: Build lacks synergy between components')
    }
    
    if (scores.activityFit < 40) {
      recommendations.push('Consider: Build may not suit intended activity')
    }

    return recommendations
  }

  // Comparative scoring methods

  compareBuildScores(buildA, buildB, requirements) {
    const scoreA = this.scoreBuild(buildA, requirements)
    const scoreB = this.scoreBuild(buildB, requirements)

    return {
      winner: scoreA.overallScore > scoreB.overallScore ? 'A' : 'B',
      scoreDifference: Math.abs(scoreA.overallScore - scoreB.overallScore),
      categoryComparison: this.compareCategoryScores(scoreA.categoryScores, scoreB.categoryScores),
      recommendation: this.generateComparisonRecommendation(scoreA, scoreB)
    }
  }

  compareCategoryScores(scoresA, scoresB) {
    const comparison = {}
    
    for (const category of Object.keys(scoresA)) {
      const diff = scoresA[category] - scoresB[category]
      comparison[category] = {
        difference: diff,
        winner: diff > 0 ? 'A' : 'B',
        significant: Math.abs(diff) >= 10
      }
    }
    
    return comparison
  }

  generateComparisonRecommendation(scoreA, scoreB) {
    const scoreDiff = scoreA.overallScore - scoreB.overallScore
    
    if (Math.abs(scoreDiff) < 5) {
      return 'Builds are very similar in overall effectiveness - choose based on personal preference'
    } else if (scoreDiff > 0) {
      return `Build A is significantly stronger (${scoreDiff} points higher)`
    } else {
      return `Build B is significantly stronger (${Math.abs(scoreDiff)} points higher)`
    }
  }
}