// lib/destiny-intelligence/enhanced-build-intelligence.js
// Enhanced Build Intelligence System with full inventory integration and API support

import { SynergyEngine } from './synergy-engine.js'
import { BuildScorer } from '../build-scorer.js'

export class EnhancedBuildIntelligence {
  constructor() {
    this.synergyEngine = new SynergyEngine()
    this.buildScorer = new BuildScorer()
    this.userInventory = null
    this.manifest = null
    this.useInventoryOnly = true
    this.maxBuildsPerGeneration = 10
    this.initialized = false
    
    // Subclass element mappings
    this.subclassElements = {
      arc: { hash: 1, name: 'Arc', damageType: 2 },
      solar: { hash: 2, name: 'Solar', damageType: 3 },
      void: { hash: 3, name: 'Void', damageType: 4 },
      stasis: { hash: 4, name: 'Stasis', damageType: 6 },
      strand: { hash: 5, name: 'Strand', damageType: 7 },
      prismatic: { hash: 6, name: 'Prismatic', damageType: 0 }
    }
    
    // Activity type metadata for optimization
    this.activityMeta = {
      pvp: {
        priorityStats: ['mobility', 'recovery', 'resilience'],
        preferredExoticTypes: ['movement', 'dueling', 'oneshot'],
        modPriorities: ['targeting', 'unflinching', 'dexterity']
      },
      raid: {
        priorityStats: ['resilience', 'recovery', 'discipline'],
        preferredExoticTypes: ['dps', 'survivability', 'team_support'],
        modPriorities: ['reserves', 'finder', 'resistance']
      },
      dungeon: {
        priorityStats: ['resilience', 'recovery', 'strength'],
        preferredExoticTypes: ['survivability', 'add_clear', 'versatility'],
        modPriorities: ['resistance', 'recuperation', 'finisher']
      },
      gambit: {
        priorityStats: ['recovery', 'intellect', 'strength'],
        preferredExoticTypes: ['add_clear', 'invader', 'boss_damage'],
        modPriorities: ['scavenger', 'reserves', 'finder']
      },
      general_pve: {
        priorityStats: ['resilience', 'discipline', 'recovery'],
        preferredExoticTypes: ['add_clear', 'ability_regen', 'versatility'],
        modPriorities: ['finder', 'loader', 'champion']
      }
    }
    
    // Mod energy costs
    this.modEnergyCosts = {
      stat_mod: 3,
      combat_mod: 4,
      resistance: 1,
      loader: 3,
      finder: 3,
      scavenger: 2,
      targeting: 3,
      unflinching: 2,
      dexterity: 2,
      reserves: 3,
      champion: 6,
      elemental_well: 3,
      charged_with_light: 4,
      warmind_cell: 5
    }
  }

  async initialize(session) {
    try {
      console.log('🚀 Initializing Enhanced Build Intelligence System...')
      
      // Load user inventory from API
      if (session) {
        await this.loadUserInventory(session)
      }
      
      // Load manifest data
      await this.loadManifest()
      
      // Initialize sub-systems
      await this.synergyEngine.initialize(this.manifest)
      await this.buildScorer.initialize(this.manifest)
      
      this.initialized = true
      console.log('✅ Enhanced BIS initialized successfully')
      return true
      
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced BIS:', error)
      this.initialized = false
      return false
    }
  }

  async loadUserInventory(session) {
    try {
      const response = await fetch('/api/bungie/inventory', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        this.userInventory = data
        console.log('✅ User inventory loaded:', {
          characters: data.characters?.length || 0,
          vaultItems: Object.values(data.vault || {}).flat().length
        })
      } else {
        console.warn('⚠️ Could not load user inventory, using manifest only')
        this.useInventoryOnly = false
      }
    } catch (error) {
      console.error('Error loading user inventory:', error)
      this.useInventoryOnly = false
    }
  }

  async loadManifest() {
    try {
      const response = await fetch('/api/manifest')
      if (response.ok) {
        const data = await response.json()
        this.manifest = data
        console.log('✅ Manifest loaded')
      } else {
        // Try to load from local files as fallback
        console.warn('⚠️ Could not load manifest from API, using limited data')
      }
    } catch (error) {
      console.error('Error loading manifest:', error)
    }
  }

  async generateBuilds(request, options = {}) {
    if (!this.initialized) {
      await this.initialize(options.session)
    }
    
    const {
      useInventoryOnly = this.useInventoryOnly,
      maxBuilds = this.maxBuildsPerGeneration,
      lockedExotic = null,
      preferredSubclass = null,
      activityType = 'general_pve'
    } = options
    
    console.log('🔨 Generating builds with options:', {
      request,
      useInventoryOnly,
      maxBuilds,
      lockedExotic: lockedExotic?.name,
      preferredSubclass,
      activityType
    })
    
    const builds = []
    const subclassesToConsider = this.determineSubclasses(preferredSubclass, request, activityType)
    
    // Generate builds for each relevant subclass
    for (const subclass of subclassesToConsider) {
      if (builds.length >= maxBuilds) break
      
      const subclassBuilds = await this.generateSubclassBuilds(
        request,
        subclass,
        activityType,
        {
          useInventoryOnly,
          lockedExotic,
          maxBuilds: Math.min(3, maxBuilds - builds.length) // Max 3 builds per subclass
        }
      )
      
      builds.push(...subclassBuilds)
    }
    
    // Score and rank all builds
    const scoredBuilds = await this.scoreAndRankBuilds(builds, request, activityType)
    
    // Return top builds up to maxBuilds limit
    return scoredBuilds.slice(0, maxBuilds)
  }

  determineSubclasses(preferredSubclass, request, activityType) {
    if (preferredSubclass) {
      return [preferredSubclass]
    }
    
    const subclasses = []
    const requestLower = request.toLowerCase()
    
    // Check for subclass mentions in request
    if (requestLower.includes('arc')) subclasses.push('arc')
    if (requestLower.includes('solar')) subclasses.push('solar')
    if (requestLower.includes('void')) subclasses.push('void')
    if (requestLower.includes('stasis')) subclasses.push('stasis')
    if (requestLower.includes('strand')) subclasses.push('strand')
    if (requestLower.includes('prismatic')) subclasses.push('prismatic')
    
    // If no specific subclass mentioned, determine best options based on request
    if (subclasses.length === 0) {
      if (requestLower.includes('dps') || requestLower.includes('damage')) {
        subclasses.push('solar', 'arc', 'strand') // High damage subclasses
      } else if (requestLower.includes('surviv') || requestLower.includes('tank')) {
        subclasses.push('void', 'stasis') // Survivability subclasses
      } else if (requestLower.includes('support') || requestLower.includes('team')) {
        subclasses.push('solar', 'void') // Support subclasses
      } else {
        // Default to top meta choices
        subclasses.push('strand', 'solar', 'void')
      }
    }
    
    return subclasses.slice(0, 3) // Limit to 3 subclasses max
  }

  async generateSubclassBuilds(request, subclass, activityType, options) {
    const builds = []
    const { useInventoryOnly, lockedExotic, maxBuilds } = options
    
    // Get available items
    const availableItems = useInventoryOnly ? 
      this.getUserItems() : 
      this.getAllGameItems()
    
    // Generate build variations
    for (let i = 0; i < maxBuilds; i++) {
      const build = await this.assembleBuild({
        request,
        subclass,
        activityType,
        availableItems,
        lockedExotic,
        variation: i // Create slight variations
      })
      
      if (build) {
        builds.push(build)
      }
    }
    
    return builds
  }

  async assembleBuild(params) {
    const { request, subclass, activityType, availableItems, lockedExotic, variation } = params
    
    const build = {
      name: this.generateBuildName(request, subclass, variation),
      subclass: subclass,
      classType: this.determineClassType(lockedExotic, availableItems),
      activityType: activityType,
      
      // Equipment slots
      kinetic: null,
      energy: null,
      power: null,
      helmet: null,
      arms: null,
      chest: null,
      legs: null,
      classItem: null,
      
      // Subclass configuration
      super: null,
      aspects: [],
      fragments: [],
      abilities: {
        grenade: null,
        melee: null,
        classAbility: null
      },
      
      // Mods
      mods: {
        helmet: [],
        arms: [],
        chest: [],
        legs: [],
        classItem: [],
        artifact: []
      },
      
      // Stats
      stats: {
        mobility: 0,
        resilience: 0,
        recovery: 0,
        discipline: 0,
        intellect: 0,
        strength: 0
      },
      
      // Metadata
      metadata: {
        generatedAt: new Date().toISOString(),
        variation: variation,
        useInventoryOnly: params.useInventoryOnly,
        confidence: 0
      }
    }
    
    // Fill equipment slots
    await this.fillWeaponSlots(build, availableItems, lockedExotic, activityType)
    await this.fillArmorSlots(build, availableItems, lockedExotic, activityType)
    
    // Configure subclass
    await this.configureSubclass(build, subclass, activityType)
    
    // Add mods
    await this.selectMods(build, activityType)
    
    // Calculate final stats
    this.calculateBuildStats(build)
    
    return build
  }

  async fillWeaponSlots(build, availableItems, lockedExotic, activityType) {
    const weapons = availableItems.weapons || []
    const activityMeta = this.activityMeta[activityType] || this.activityMeta.general_pve
    
    // Separate weapons by slot and tier
    const kineticWeapons = weapons.filter(w => w.bucketHash === 1498876634)
    const energyWeapons = weapons.filter(w => w.bucketHash === 2465295065)
    const powerWeapons = weapons.filter(w => w.bucketHash === 953998645)
    
    // Handle locked exotic weapon
    if (lockedExotic && lockedExotic.itemType === 3) { // Weapon type
      const slot = this.getWeaponSlot(lockedExotic)
      build[slot] = lockedExotic
    }
    
    // Select one exotic weapon if not locked
    if (!lockedExotic || lockedExotic.itemType !== 3) {
      const exoticWeapons = weapons.filter(w => w.tierType === 6) // Exotic tier
      if (exoticWeapons.length > 0) {
        const selectedExotic = this.selectBestExoticWeapon(exoticWeapons, activityType)
        const slot = this.getWeaponSlot(selectedExotic)
        build[slot] = selectedExotic
      }
    }
    
    // Fill remaining weapon slots with legendaries
    if (!build.kinetic) {
      build.kinetic = this.selectBestWeapon(kineticWeapons.filter(w => w.tierType === 5), activityType)
    }
    if (!build.energy) {
      build.energy = this.selectBestWeapon(energyWeapons.filter(w => w.tierType === 5), activityType)
    }
    if (!build.power) {
      build.power = this.selectBestWeapon(powerWeapons.filter(w => w.tierType === 5), activityType)
    }
  }

  async fillArmorSlots(build, availableItems, lockedExotic, activityType) {
    const armor = availableItems.armor || []
    const classType = build.classType
    
    // Filter armor by class
    const classArmor = armor.filter(a => 
      a.classType === classType || a.classType === 3 // Class-specific or any class
    )
    
    // Separate by slot
    const helmetArmor = classArmor.filter(a => a.bucketHash === 3448274439)
    const armsArmor = classArmor.filter(a => a.bucketHash === 3551918588)
    const chestArmor = classArmor.filter(a => a.bucketHash === 14239492)
    const legsArmor = classArmor.filter(a => a.bucketHash === 20886954)
    const classItems = classArmor.filter(a => a.bucketHash === 1585787867)
    
    // Handle locked exotic armor
    if (lockedExotic && lockedExotic.itemType === 2) { // Armor type
      const slot = this.getArmorSlot(lockedExotic)
      build[slot] = lockedExotic
    }
    
    // Select one exotic armor if not locked
    if (!lockedExotic || lockedExotic.itemType !== 2) {
      const exoticArmor = classArmor.filter(a => a.tierType === 6)
      if (exoticArmor.length > 0) {
        const selectedExotic = this.selectBestExoticArmor(exoticArmor, activityType, build.subclass)
        const slot = this.getArmorSlot(selectedExotic)
        build[slot] = selectedExotic
      }
    }
    
    // Fill remaining armor slots with high-stat legendaries
    if (!build.helmet) {
      build.helmet = this.selectBestArmor(helmetArmor.filter(a => a.tierType === 5), activityType)
    }
    if (!build.arms) {
      build.arms = this.selectBestArmor(armsArmor.filter(a => a.tierType === 5), activityType)
    }
    if (!build.chest) {
      build.chest = this.selectBestArmor(chestArmor.filter(a => a.tierType === 5), activityType)
    }
    if (!build.legs) {
      build.legs = this.selectBestArmor(legsArmor.filter(a => a.tierType === 5), activityType)
    }
    if (!build.classItem) {
      build.classItem = this.selectBestArmor(classItems, activityType)
    }
  }

  async configureSubclass(build, subclass, activityType) {
    // Set subclass element
    build.subclass = subclass
    
    // Select super based on activity
    build.super = this.selectSuper(subclass, build.classType, activityType)
    
    // Select aspects (usually 2)
    build.aspects = this.selectAspects(subclass, build.classType, activityType)
    
    // Select fragments based on available slots from aspects
    const fragmentSlots = this.calculateFragmentSlots(build.aspects)
    build.fragments = this.selectFragments(subclass, activityType, fragmentSlots)
    
    // Select abilities
    build.abilities = {
      grenade: this.selectGrenade(subclass, activityType),
      melee: this.selectMelee(subclass, activityType),
      classAbility: this.selectClassAbility(build.classType)
    }
  }

  async selectMods(build, activityType) {
    const activityMeta = this.activityMeta[activityType] || this.activityMeta.general_pve
    const availableEnergy = 10 // Each armor piece has 10 energy
    
    // Select mods for each armor piece
    const armorSlots = ['helmet', 'arms', 'chest', 'legs', 'classItem']
    
    for (const slot of armorSlots) {
      if (!build[slot]) continue
      
      let remainingEnergy = availableEnergy
      const slotMods = []
      
      // Priority 1: Stat mods based on activity
      const statMod = this.selectStatMod(activityType, remainingEnergy)
      if (statMod) {
        slotMods.push(statMod)
        remainingEnergy -= statMod.energyCost
      }
      
      // Priority 2: Combat mods based on activity priorities
      for (const modType of activityMeta.modPriorities) {
        if (remainingEnergy <= 0) break
        
        const combatMod = this.selectCombatMod(modType, slot, remainingEnergy)
        if (combatMod) {
          slotMods.push(combatMod)
          remainingEnergy -= combatMod.energyCost
        }
      }
      
      build.mods[slot] = slotMods
    }
    
    // Select artifact mods (limited by unlock points)
    build.mods.artifact = this.selectArtifactMods(activityType, build)
  }

  selectArtifactMods(activityType, build) {
    const artifactMods = []
    const maxArtifactPoints = 12 // Typical artifact unlock points
    let usedPoints = 0
    
    // Priority artifact mods based on activity and build
    const priorityMods = this.getArtifactModPriorities(activityType, build)
    
    for (const mod of priorityMods) {
      if (usedPoints >= maxArtifactPoints) break
      
      artifactMods.push({
        name: mod.name,
        description: mod.description,
        unlockCost: mod.cost,
        priority: mod.priority,
        recommended: usedPoints < 2 // First 2 are highly recommended
      })
      
      usedPoints += mod.cost
    }
    
    return artifactMods
  }

  calculateBuildStats(build) {
    let stats = {
      mobility: 0,
      resilience: 0,
      recovery: 0,
      discipline: 0,
      intellect: 0,
      strength: 0
    }
    
    // Add armor stats
    const armorSlots = ['helmet', 'arms', 'chest', 'legs', 'classItem']
    for (const slot of armorSlots) {
      const armor = build[slot]
      if (armor && armor.stats) {
        Object.keys(stats).forEach(stat => {
          stats[stat] += armor.stats[stat] || 0
        })
      }
    }
    
    // Add mod bonuses
    for (const slot of armorSlots) {
      const mods = build.mods[slot] || []
      for (const mod of mods) {
        if (mod.statBonus) {
          Object.keys(mod.statBonus).forEach(stat => {
            stats[stat] += mod.statBonus[stat] || 0
          })
        }
      }
    }
    
    // Add fragment bonuses
    for (const fragment of build.fragments) {
      if (fragment.statModifiers) {
        Object.keys(fragment.statModifiers).forEach(stat => {
          stats[stat] += fragment.statModifiers[stat] || 0
        })
      }
    }
    
    // Cap stats at 100
    Object.keys(stats).forEach(stat => {
      stats[stat] = Math.min(100, stats[stat])
    })
    
    build.stats = stats
  }

  async scoreAndRankBuilds(builds, request, activityType) {
    const scoredBuilds = []
    
    for (const build of builds) {
      const score = await this.buildScorer.calculateScore(build, {
        activityType,
        userRequest: request
      })
      
      scoredBuilds.push({
        ...build,
        score: score.total,
        scoreBreakdown: score.breakdown,
        confidence: this.calculateConfidence(build, request)
      })
    }
    
    // Sort by score (highest first)
    scoredBuilds.sort((a, b) => b.score - a.score)
    
    return scoredBuilds
  }

  // Helper methods
  
  getUserItems() {
    if (!this.userInventory) {
      return { weapons: [], armor: [], mods: [] }
    }
    
    const items = {
      weapons: [],
      armor: [],
      mods: []
    }
    
    // Collect from characters
    for (const character of this.userInventory.characters || []) {
      items.weapons.push(...(character.equipment?.filter(i => i.itemType === 3) || []))
      items.armor.push(...(character.equipment?.filter(i => i.itemType === 2) || []))
      items.weapons.push(...(character.inventory?.filter(i => i.itemType === 3) || []))
      items.armor.push(...(character.inventory?.filter(i => i.itemType === 2) || []))
    }
    
    // Collect from vault
    if (this.userInventory.vault) {
      items.weapons.push(...(this.userInventory.vault.weapons || []))
      items.armor.push(...(this.userInventory.vault.armor || []))
      items.mods.push(...(this.userInventory.vault.mods || []))
    }
    
    return items
  }

  getAllGameItems() {
    if (!this.manifest?.data?.DestinyInventoryItemDefinition) {
      return { weapons: [], armor: [], mods: [] }
    }
    
    const items = {
      weapons: [],
      armor: [],
      mods: []
    }
    
    const allItems = Object.values(this.manifest.data.DestinyInventoryItemDefinition)
    
    items.weapons = allItems.filter(i => i.itemType === 3 && !i.redacted)
    items.armor = allItems.filter(i => i.itemType === 2 && !i.redacted)
    items.mods = allItems.filter(i => (i.itemType === 19 || i.itemType === 20) && !i.redacted)
    
    return items
  }

  determineClassType(lockedExotic, availableItems) {
    if (lockedExotic && lockedExotic.classType !== undefined && lockedExotic.classType !== 3) {
      return lockedExotic.classType
    }
    
    // Determine based on available items or default to most popular
    const classTypes = [0, 1, 2] // Titan, Hunter, Warlock
    return classTypes[Math.floor(Math.random() * classTypes.length)]
  }

  getWeaponSlot(weapon) {
    if (weapon.bucketHash === 1498876634) return 'kinetic'
    if (weapon.bucketHash === 2465295065) return 'energy'
    if (weapon.bucketHash === 953998645) return 'power'
    return 'kinetic'
  }

  getArmorSlot(armor) {
    if (armor.bucketHash === 3448274439) return 'helmet'
    if (armor.bucketHash === 3551918588) return 'arms'
    if (armor.bucketHash === 14239492) return 'chest'
    if (armor.bucketHash === 20886954) return 'legs'
    if (armor.bucketHash === 1585787867) return 'classItem'
    return 'helmet'
  }

  selectBestExoticWeapon(exotics, activityType) {
    // Simple selection for now - can be enhanced with actual DPS calculations
    return exotics[Math.floor(Math.random() * exotics.length)]
  }

  selectBestExoticArmor(exotics, activityType, subclass) {
    // Simple selection for now - can be enhanced with synergy calculations
    return exotics[Math.floor(Math.random() * exotics.length)]
  }

  selectBestWeapon(weapons, activityType) {
    if (weapons.length === 0) return null
    return weapons[Math.floor(Math.random() * weapons.length)]
  }

  selectBestArmor(armor, activityType) {
    if (armor.length === 0) return null
    
    // Prefer high-stat armor
    const sorted = armor.sort((a, b) => {
      const aTotal = Object.values(a.stats || {}).reduce((sum, val) => sum + val, 0)
      const bTotal = Object.values(b.stats || {}).reduce((sum, val) => sum + val, 0)
      return bTotal - aTotal
    })
    
    return sorted[0]
  }

  selectStatMod(activityType, remainingEnergy) {
    const priorityStats = this.activityMeta[activityType]?.priorityStats || []
    if (priorityStats.length === 0 || remainingEnergy < 3) return null
    
    const statName = priorityStats[0]
    return {
      name: `${statName.charAt(0).toUpperCase() + statName.slice(1)} Mod`,
      energyCost: 3,
      statBonus: { [statName]: 10 }
    }
  }

  selectCombatMod(modType, slot, remainingEnergy) {
    const cost = this.modEnergyCosts[modType] || 3
    if (remainingEnergy < cost) return null
    
    return {
      name: `${modType.charAt(0).toUpperCase() + modType.slice(1)} Mod`,
      type: modType,
      energyCost: cost,
      slot: slot
    }
  }

  getArtifactModPriorities(activityType, build) {
    // Return prioritized list of artifact mods based on build and activity
    // This would be enhanced with actual seasonal artifact data
    return [
      { name: 'Anti-Champion Mod', description: 'Stuns champions', cost: 1, priority: 1 },
      { name: 'Elemental Time Dilation', description: 'Extends elemental buff duration', cost: 3, priority: 2 },
      { name: 'Font of Might', description: 'Weapon damage bonus', cost: 4, priority: 3 }
    ]
  }

  selectSuper(subclass, classType, activityType) {
    // Simplified super selection - would be enhanced with actual game data
    const supers = {
      solar: ['Golden Gun', 'Well of Radiance', 'Hammer of Sol'],
      arc: ['Thundercrash', 'Chaos Reach', 'Gathering Storm'],
      void: ['Ward of Dawn', 'Nova Bomb', 'Shadowshot'],
      stasis: ['Silence and Squall', 'Shadebinder', 'Behemoth'],
      strand: ['Silkstrike', 'Needlestorm', 'Bladefury']
    }
    
    const subclassSupers = supers[subclass] || []
    return subclassSupers[classType] || subclassSupers[0] || 'Default Super'
  }

  selectAspects(subclass, classType, activityType) {
    // Return 2 aspects for the subclass
    // This would pull from actual game data
    return [
      { name: `${subclass} Aspect 1`, fragmentSlots: 2 },
      { name: `${subclass} Aspect 2`, fragmentSlots: 3 }
    ]
  }

  calculateFragmentSlots(aspects) {
    return aspects.reduce((total, aspect) => total + (aspect.fragmentSlots || 0), 0)
  }

  selectFragments(subclass, activityType, maxSlots) {
    // Select fragments up to available slots
    const fragments = []
    for (let i = 0; i < Math.min(maxSlots, 5); i++) {
      fragments.push({
        name: `${subclass} Fragment ${i + 1}`,
        statModifiers: {}
      })
    }
    return fragments
  }

  selectGrenade(subclass, activityType) {
    const grenades = {
      solar: 'Solar Grenade',
      arc: 'Pulse Grenade',
      void: 'Vortex Grenade',
      stasis: 'Duskfield Grenade',
      strand: 'Threadling Grenade'
    }
    return grenades[subclass] || 'Grenade'
  }

  selectMelee(subclass, activityType) {
    const melees = {
      solar: 'Throwing Hammer',
      arc: 'Ballistic Slam',
      void: 'Shield Bash',
      stasis: 'Shiver Strike',
      strand: 'Frenzied Blade'
    }
    return melees[subclass] || 'Melee'
  }

  selectClassAbility(classType) {
    const abilities = ['Towering Barricade', 'Marksman\'s Dodge', 'Healing Rift']
    return abilities[classType] || abilities[0]
  }

  generateBuildName(request, subclass, variation) {
    const variationNames = ['Prime', 'Alpha', 'Optimal', 'Enhanced', 'Master']
    const name = `${subclass.charAt(0).toUpperCase() + subclass.slice(1)} ${variationNames[variation] || 'Build'}`
    return name
  }

  calculateConfidence(build, request) {
    // Calculate confidence score based on how well the build matches the request
    let confidence = 70 // Base confidence
    
    if (build.score > 80) confidence += 10
    if (build.score > 90) confidence += 10
    
    // Additional factors would be calculated here
    
    return Math.min(100, confidence)
  }
}

export default EnhancedBuildIntelligence