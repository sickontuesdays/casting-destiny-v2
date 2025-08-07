// Build scoring and generation system
export async function generateBuild({
  request,
  lockedExotic,
  useInventoryOnly,
  userSession,
  manifest
}) {
  if (!manifest) {
    throw new Error('Manifest data not available')
  }

  // Analyze the parsed request to determine build priorities
  const buildContext = analyzeBuildContext(request)
  
  // Score and select weapons
  const weapons = await selectWeapons(buildContext, lockedExotic, manifest, useInventoryOnly)
  
  // Score and select armor
  const armor = await selectArmor(buildContext, lockedExotic, manifest, useInventoryOnly)
  
  // Select subclass configuration
  const subclass = await selectSubclass(buildContext, manifest)
  
  // Select seasonal artifact mods
  const seasonalArtifact = await selectSeasonalMods(buildContext, manifest)
  
  // Calculate overall build score
  const score = calculateBuildScore({
    weapons,
    armor,
    subclass,
    seasonalArtifact,
    buildContext
  })

  return {
    name: generateBuildName(buildContext),
    description: generateBuildDescription(buildContext),
    score,
    playstyle: buildContext.playstyles,
    weapons,
    armor,
    subclass,
    seasonalArtifact,
    buildContext
  }
}

function analyzeBuildContext(request) {
  const context = {
    playstyles: [],
    priorities: {},
    activities: [],
    damageTypes: [],
    weaponTypes: [],
    specialRequirements: []
  }

  // Determine primary playstyle
  if (request.keywords.some(k => ['dps', 'damage', 'boss'].includes(k))) {
    context.playstyles.push('DPS')
    context.priorities.weaponDamage = 0.9
    context.priorities.survivability = 0.3
    context.priorities.utility = 0.4
  }

  if (request.keywords.some(k => ['pvp', 'crucible', 'trials'].includes(k))) {
    context.playstyles.push('PVP')
    context.priorities.mobility = 0.8
    context.priorities.weaponHandling = 0.7
    context.priorities.survivability = 0.6
  }

  if (request.keywords.some(k => ['add', 'clear', 'adds', 'mob'].includes(k))) {
    context.playstyles.push('Add Clear')
    context.priorities.aoe = 0.8
    context.priorities.ammo = 0.6
    context.priorities.speed = 0.7
  }

  if (request.keywords.some(k => ['gm', 'grandmaster', 'nightfall', 'survivability'].includes(k))) {
    context.playstyles.push('Survivability')
    context.priorities.survivability = 0.9
    context.priorities.range = 0.7
    context.priorities.utility = 0.6
  }

  if (request.keywords.some(k => ['support', 'healer', 'buff', 'team'].includes(k))) {
    context.playstyles.push('Support')
    context.priorities.teamUtility = 0.9
    context.priorities.survivability = 0.6
    context.priorities.abilities = 0.7
  }

  // Detect specific activities
  if (request.keywords.some(k => ['raid', 'vog', 'vault', 'dsc', 'garden'].includes(k))) {
    context.activities.push('Raid')
  }

  if (request.keywords.some(k => ['gambit'].includes(k))) {
    context.activities.push('Gambit')
  }

  // Default to general PvE if no specific context
  if (context.playstyles.length === 0) {
    context.playstyles.push('General PvE')
    context.priorities.balanced = 0.7
  }

  return context
}

async function selectWeapons(buildContext, lockedExotic, manifest, useInventoryOnly) {
  const weapons = {
    kinetic: null,
    energy: null,
    power: null
  }

  // If an exotic weapon is locked, place it first
  if (lockedExotic && lockedExotic.itemType === 'weapon') {
    const slot = determineWeaponSlot(lockedExotic)
    weapons[slot] = {
      ...lockedExotic,
      score: 95, // High score for locked exotic
      reasoning: 'Player selected exotic'
    }
  }

  // Score and select remaining weapons
  const weaponScores = {}
  
  for (const [weaponHash, weapon] of Object.entries(manifest.weapons || {})) {
    if (useInventoryOnly && !weapon.inUserInventory) continue
    if (weapon.hash === lockedExotic?.hash) continue // Skip already selected

    const score = scoreWeapon(weapon, buildContext)
    weaponScores[weaponHash] = { weapon, score }
  }

  // Select best weapons for each slot
  const slots = ['kinetic', 'energy', 'power']
  for (const slot of slots) {
    if (weapons[slot]) continue // Already filled by locked exotic

    const slotWeapons = Object.values(weaponScores)
      .filter(({ weapon }) => determineWeaponSlot(weapon) === slot)
      .sort((a, b) => b.score - a.score)

    if (slotWeapons.length > 0) {
      const best = slotWeapons[0]
      weapons[slot] = {
        ...best.weapon,
        score: best.score,
        recommendedPerks: getRecommendedPerks(best.weapon, buildContext)
      }
    }
  }

  return weapons
}

async function selectArmor(buildContext, lockedExotic, manifest, useInventoryOnly) {
  const armor = {
    helmet: null,
    arms: null,
    chest: null,
    legs: null,
    classItem: null
  }

  // If an exotic armor is locked, place it first
  if (lockedExotic && lockedExotic.itemType === 'armor') {
    const slot = determineArmorSlot(lockedExotic)
    armor[slot] = {
      ...lockedExotic,
      score: 95,
      reasoning: 'Player selected exotic'
    }
  }

  // For non-exotic slots, recommend legendary armor with stat priorities
  const armorScores = {}
  
  for (const [armorHash, armorPiece] of Object.entries(manifest.armor || {})) {
    if (useInventoryOnly && !armorPiece.inUserInventory) continue
    if (armorPiece.hash === lockedExotic?.hash) continue
    if (armorPiece.tierType === 6 && lockedExotic) continue // Only one exotic

    const score = scoreArmor(armorPiece, buildContext)
    armorScores[armorHash] = { armor: armorPiece, score }
  }

  // Fill remaining armor slots
  const slots = ['helmet', 'arms', 'chest', 'legs', 'classItem']
  for (const slot of slots) {
    if (armor[slot]) continue

    const slotArmor = Object.values(armorScores)
      .filter(({ armor: armorPiece }) => determineArmorSlot(armorPiece) === slot)
      .sort((a, b) => b.score - a.score)

    if (slotArmor.length > 0) {
      const best = slotArmor[0]
      armor[slot] = {
        ...best.armor,
        score: best.score,
        recommendedStats: getRecommendedStats(buildContext),
        recommendedMods: getRecommendedMods(best.armor, buildContext)
      }
    }
  }

  return armor
}

async function selectSubclass(buildContext, manifest) {
  const subclasses = manifest.subclasses || {}
  let bestSubclass = null
  let bestScore = 0

  for (const [subclassHash, subclass] of Object.entries(subclasses)) {
    const score = scoreSubclass(subclass, buildContext)
    if (score > bestScore) {
      bestScore = score
      bestSubclass = subclass
    }
  }

  if (!bestSubclass) return null

  return {
    ...bestSubclass,
    score: bestScore,
    recommendedAspects: getRecommendedAspects(bestSubclass, buildContext),
    recommendedFragments: getRecommendedFragments(bestSubclass, buildContext)
  }
}

async function selectSeasonalMods(buildContext, manifest) {
  const seasonalMods = manifest.seasonalArtifact?.mods || {}
  const recommendedMods = []

  for (const [modHash, mod] of Object.entries(seasonalMods)) {
    const score = scoreSeasonalMod(mod, buildContext)
    if (score > 70) { // Threshold for recommendation
      recommendedMods.push(mod.displayProperties.name)
    }
  }

  return {
    season: manifest.seasonalArtifact?.season || 'Current',
    name: manifest.seasonalArtifact?.name || 'Seasonal Artifact',
    recommendedMods: recommendedMods.slice(0, 5) // Limit to top 5
  }
}

// Scoring functions
function scoreWeapon(weapon, buildContext) {
  let score = 50 // Base score

  // DPS builds favor high damage weapons
  if (buildContext.playstyles.includes('DPS')) {
    if (weapon.itemSubType === 'rocket_launcher' || weapon.itemSubType === 'linear_fusion_rifle') {
      score += 30
    }
    if (weapon.tierType === 6) score += 20 // Exotic bonus
  }

  // PVP builds favor different weapons
  if (buildContext.playstyles.includes('PVP')) {
    if (weapon.itemSubType === 'hand_cannon' || weapon.itemSubType === 'pulse_rifle') {
      score += 25
    }
    if (weapon.stats?.range > 70) score += 15
  }

  // Add clear builds favor AOE weapons
  if (buildContext.playstyles.includes('Add Clear')) {
    if (weapon.itemSubType === 'submachine_gun' || weapon.itemSubType === 'auto_rifle') {
      score += 20
    }
  }

  return Math.min(100, score)
}

function scoreArmor(armor, buildContext) {
  let score = 50

  if (armor.tierType === 6) { // Exotic
    score += 25
    
    // Score based on exotic perks matching build context
    if (buildContext.playstyles.includes('DPS') && armor.displayProperties.name.includes('Damage')) {
      score += 20
    }
  }

  return Math.min(100, score)
}

function scoreSubclass(subclass, buildContext) {
  let score = 50

  // Score based on damage type and build context
  if (buildContext.playstyles.includes('DPS')) {
    if (subclass.damageType === 'Solar' || subclass.damageType === 'Void') {
      score += 20
    }
  }

  return Math.min(100, score)
}

function scoreSeasonalMod(mod, buildContext) {
  let score = 40

  if (buildContext.playstyles.includes('DPS') && mod.displayProperties.description.toLowerCase().includes('damage')) {
    score += 30
  }

  return Math.min(100, score)
}

// Helper functions
function determineWeaponSlot(weapon) {
  if (weapon.itemCategoryHashes?.includes(2)) return 'kinetic'
  if (weapon.itemCategoryHashes?.includes(3)) return 'energy'
  if (weapon.itemCategoryHashes?.includes(4)) return 'power'
  return 'kinetic' // default
}

function determineArmorSlot(armor) {
  if (armor.itemCategoryHashes?.includes(45)) return 'helmet'
  if (armor.itemCategoryHashes?.includes(46)) return 'arms'
  if (armor.itemCategoryHashes?.includes(47)) return 'chest'
  if (armor.itemCategoryHashes?.includes(48)) return 'legs'
  if (armor.itemCategoryHashes?.includes(49)) return 'classItem'
  return 'helmet' // default
}

function getRecommendedPerks(weapon, buildContext) {
  const perks = []
  
  if (buildContext.playstyles.includes('DPS')) {
    perks.push('Vorpal Weapon', 'Firing Line', 'Fourth Times the Charm')
  }
  
  if (buildContext.playstyles.includes('PVP')) {
    perks.push('Kill Clip', 'Rampage', 'Snapshot Sights')
  }

  return perks.slice(0, 3)
}

function getRecommendedStats(buildContext) {
  const stats = {}

  if (buildContext.playstyles.includes('PVP')) {
    stats.Mobility = 80
    stats.Recovery = 100
    stats.Intellect = 70
  } else if (buildContext.playstyles.includes('DPS')) {
    stats.Discipline = 100
    stats.Recovery = 80
    stats.Intellect = 60
  } else {
    stats.Recovery = 100
    stats.Discipline = 80
    stats.Intellect = 60
  }

  return stats
}

function getRecommendedMods(armor, buildContext) {
  const mods = []

  if (buildContext.playstyles.includes('DPS')) {
    mods.push('Grenade Kickstart', 'Font of Might', 'High-Energy Fire')
  } else if (buildContext.playstyles.includes('Survivability')) {
    mods.push('Protective Light', 'Concussive Dampener', 'Recuperation')
  }

  return mods.slice(0, 4)
}

function getRecommendedAspects(subclass, buildContext) {
  // This would be more sophisticated with actual aspect data
  return ['Aspect 1', 'Aspect 2']
}

function getRecommendedFragments(subclass, buildContext) {
  // This would be more sophisticated with actual fragment data
  return ['Fragment 1', 'Fragment 2', 'Fragment 3']
}

function calculateBuildScore({ weapons, armor, subclass, seasonalArtifact, buildContext }) {
  let totalScore = 0
  let components = 0

  if (weapons.kinetic) { totalScore += weapons.kinetic.score; components++ }
  if (weapons.energy) { totalScore += weapons.energy.score; components++ }
  if (weapons.power) { totalScore += weapons.power.score; components++ }

  Object.values(armor).forEach(piece => {
    if (piece) { totalScore += piece.score; components++ }
  })

  if (subclass) { totalScore += subclass.score; components++ }

  return components > 0 ? Math.round(totalScore / components) : 0
}

function generateBuildName(buildContext) {
  const playstyle = buildContext.playstyles[0] || 'General'
  const activity = buildContext.activities[0] || 'PvE'
  return `${playstyle} ${activity} Build`
}

function generateBuildDescription(buildContext) {
  const playstyle = buildContext.playstyles[0] || 'General PvE'
  return `Optimized ${playstyle.toLowerCase()} build focusing on ${Object.keys(buildContext.priorities).join(', ')}.`
}