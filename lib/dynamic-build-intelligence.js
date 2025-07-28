// IMPROVED Build Intelligence System focused on actual Destiny 2 builds
import { parseAdvancedSearch, processAdvancedKeywords, findAdvancedSynergisticItems } from './advanced-search-parser';

// REAL Destiny 2 Build Archetypes based on actual game mechanics
export const DESTINY_BUILD_ARCHETYPES = {
  grenade_spam: {
    name: "Grenade Spam Build",
    keywords: ['grenade', 'explosive', 'ordnance', 'constant grenades', 'grenade energy'],
    focus: 'grenade',
    requiredComponents: {
      stat: 'Discipline',
      exotics: ['Heart of Inmost Light', 'Armamentarium', 'Contraverse Hold', 'Verity\'s Brow'],
      mods: ['Grenade Kickstart', 'Bomber', 'Distribution', 'Elemental Ordnance'],
      aspects: ['Heart of Inmost Light effect', 'Controlled Burst', 'Chaos Accelerant'],
      activities: ['Add Control', 'Lost Sectors', 'Strikes']
    },
    damageTypes: ['Solar', 'Void', 'Arc', 'Stasis'],
    classes: ['Titan', 'Hunter', 'Warlock']
  },

  ability_loop: {
    name: "Ability Loop Build",
    keywords: ['ability', 'energy', 'loop', 'constant abilities', 'cooldown'],
    focus: 'ability',
    requiredComponents: {
      stat: 'Multiple (100 in two stats)',
      exotics: ['Heart of Inmost Light', 'Crown of Tempests', 'Sealed Ahamkara Grasps'],
      mods: ['Well of Potency', 'Elemental Ordnance', 'Melee Kickstart', 'Utility Kickstart'],
      aspects: ['Feed the Void', 'Devour', 'Combat Provision'],
      activities: ['All Content', 'Solo Play', 'Team Support']
    },
    damageTypes: ['Void', 'Arc', 'Solar'],
    classes: ['Titan', 'Hunter', 'Warlock']
  },

  weapon_swap: {
    name: "Weapon Swapping Build", 
    keywords: ['reload', 'never reload', 'auto loading', 'weapon swap', 'dps'],
    focus: 'weapon',
    requiredComponents: {
      stat: 'Handling/Reload',
      exotics: ['Actium War Rig', 'Lucky Pants', 'Transversive Steps'],
      mods: ['Auto-Loading Holster', 'Backup Mag', 'Weapon Reserves'],
      aspects: ['Rally Barricade synergy'],
      activities: ['Raids', 'Boss DPS', 'Dungeons']
    },
    damageTypes: ['Any'],
    classes: ['Titan', 'Hunter', 'Warlock']
  },

  invisibility: {
    name: "Void Invisibility Build",
    keywords: ['invisible', 'stealth', 'void hunter', 'vanish', 'cloak'],
    focus: 'stealth',
    requiredComponents: {
      stat: 'Mobility/Strength',
      exotics: ['Graviton Forfeit', 'Omnioculus', 'Gyrfalcon\'s Hauberk'],
      mods: ['Utility Kickstart', 'Distribution', 'Dynamo'],
      aspects: ['Vanishing Step', 'Trapper\'s Ambush', 'Stylish Executioner'],
      activities: ['Solo Content', 'Grandmaster Nightfalls', 'Stealth Missions']
    },
    damageTypes: ['Void'],
    classes: ['Hunter']
  },

  healing_support: {
    name: "Healing Support Build",
    keywords: ['heal', 'support', 'well of radiance', 'restoration', 'team heal'],
    focus: 'healing',
    requiredComponents: {
      stat: 'Recovery/Discipline',
      exotics: ['Phoenix Protocol', 'Boots of the Assembler', 'Starfire Protocol'],
      mods: ['Well of Life', 'Recuperation', 'Better Already', 'Elemental Armaments'],
      aspects: ['Touch of Flame', 'Heat Rises', 'Benevolent Dawn'],
      activities: ['Raids', 'Dungeons', 'Team Content', 'Grandmaster Nightfalls']
    },
    damageTypes: ['Solar'],
    classes: ['Warlock']
  },

  super_spam: {
    name: "Super Generation Build",
    keywords: ['super', 'intellect', 'orbs', 'fast super', 'super energy'],
    focus: 'super',
    requiredComponents: {
      stat: 'Intellect',
      exotics: ['Geomag Stabilizers', 'Orpheus Rig', 'Doom Fang Pauldron', 'Crown of Tempests'],
      mods: ['Hands-On', 'Ashes to Assets', 'Distribution', 'Heavy Handed'],
      aspects: ['Chaos Reach synergy', 'Shadowshot synergy'],
      activities: ['Raids', 'Dungeons', 'High-level Content']
    },
    damageTypes: ['Arc', 'Void', 'Solar'],
    classes: ['Titan', 'Hunter', 'Warlock']
  },

  melee_combat: {
    name: "Melee Combat Build",
    keywords: ['melee', 'punch', 'martial', 'strength', 'one two punch'],
    focus: 'melee',
    requiredComponents: {
      stat: 'Strength',
      exotics: ['Wormgod Caress', 'Synthoceps', 'Karnstein Armlets', 'Liar\'s Handshake'],
      mods: ['Melee Kickstart', 'Heavy Handed', 'Impact Induction', 'One-Two Punch'],
      aspects: ['Knockout', 'Path of Burning Steps', 'Combination Blow'],
      activities: ['Strikes', 'Lost Sectors', 'Close Combat']
    },
    damageTypes: ['Solar', 'Arc', 'Void'],
    classes: ['Titan', 'Hunter', 'Warlock']
  },

  tank_survivability: {
    name: "Tank Survivability Build",
    keywords: ['tank', 'survivability', 'resist', 'defense', 'overshield'],
    focus: 'defense',
    requiredComponents: {
      stat: 'Resilience/Recovery',
      exotics: ['One-Eyed Mask', 'Helm of Saint-14', 'Precious Scars', 'Loreley Splendor'],
      mods: ['Resist Mods', 'Recuperation', 'Better Already', 'Protective Light'],
      aspects: ['Controlled Burst', 'Sol Invictus', 'Offensive Bulwark'],
      activities: ['Grandmaster Nightfalls', 'Solo Content', 'Endgame PvE']
    },
    damageTypes: ['Void', 'Solar', 'Arc'],
    classes: ['Titan', 'Warlock']
  },

  weapon_damage: {
    name: "Weapon Damage Build",
    keywords: ['weapon damage', 'dps', 'damage', 'weapon', 'boss damage'],
    focus: 'weapon_damage',
    requiredComponents: {
      stat: 'Handling/Reload',
      exotics: ['Actium War Rig', 'Peacekeepers', 'Lucky Pants', 'Mantle of Battle Harmony'],
      mods: ['Targeting Mods', 'Damage Mods', 'Font of Might', 'High-Energy Fire'],
      aspects: ['Focusing Lens', 'Font of Might synergy'],
      activities: ['Raids', 'Boss Encounters', 'DPS Phases']
    },
    damageTypes: ['Any'],
    classes: ['Titan', 'Hunter', 'Warlock']
  },

  movement_speed: {
    name: "High Mobility Build",
    keywords: ['mobility', 'speed', 'movement', 'fast', 'agile'],
    focus: 'movement',
    requiredComponents: {
      stat: 'Mobility',
      exotics: ['St0mp-EE5', 'Transversive Steps', 'Dunemarchers'],
      mods: ['Traction', 'Powerful Friends', 'Mobility Mods'],
      aspects: ['Triple Jump', 'Icarus Dash', 'Shoulder Charge'],
      activities: ['Crucible', 'Speedruns', 'Solo Content']
    },
    damageTypes: ['Any'],
    classes: ['Hunter', 'Warlock', 'Titan']
  }
};

// IMPROVED: Analyze user's items to create actual builds
export const analyzeItemsForBuilds = (items, searchQuery) => {
  const builds = [];
  const lowerQuery = searchQuery.toLowerCase();
  
  // Match query to build archetypes
  Object.entries(DESTINY_BUILD_ARCHETYPES).forEach(([archetypeKey, archetype]) => {
    const queryMatches = archetype.keywords.some(keyword => lowerQuery.includes(keyword));
    
    if (!queryMatches) return;
    
    // Find items that match this archetype
    const matchingItems = findItemsForArchetype(items, archetype);
    
    if (matchingItems.total >= 2) { // Need at least 2 relevant items for a build
      const build = createBuildFromArchetype(archetype, matchingItems, searchQuery);
      if (build) {
        builds.push(build);
      }
    }
  });
  
  return builds.sort((a, b) => b.synergyScore - a.synergyScore);
};

// IMPROVED: Find items that match a specific build archetype
const findItemsForArchetype = (items, archetype) => {
  const matchingItems = {
    exotics: [],
    mods: [],
    aspects: [],
    fragments: [],
    abilities: [],
    total: 0
  };
  
  items.forEach(item => {
    const itemText = `${item.name} ${item.description}`.toLowerCase();
    let itemMatches = false;
    
    // Check if item matches archetype exotics
    if (item.type.includes('Exotic') && archetype.requiredComponents.exotics.some(exotic => 
      itemText.includes(exotic.toLowerCase()))) {
      matchingItems.exotics.push(item);
      itemMatches = true;
    }
    
    // Check if item matches archetype mods
    else if (item.type.includes('Mod') && archetype.requiredComponents.mods.some(mod => 
      itemText.includes(mod.toLowerCase()))) {
      matchingItems.mods.push(item);
      itemMatches = true;
    }
    
    // Check for archetype keywords in item
    else if (archetype.keywords.some(keyword => itemText.includes(keyword))) {
      if (itemText.includes('aspect')) {
        matchingItems.aspects.push(item);
        itemMatches = true;
      } else if (itemText.includes('fragment')) {
        matchingItems.fragments.push(item);
        itemMatches = true;
      } else {
        matchingItems.abilities.push(item);
        itemMatches = true;
      }
    }
    
    if (itemMatches) {
      matchingItems.total++;
    }
  });
  
  return matchingItems;
};

// IMPROVED: Create a complete build from archetype and user items
const createBuildFromArchetype = (archetype, matchingItems, searchQuery) => {
  // Calculate synergy score based on how well items match the archetype
  let synergyScore = 30; // Base score
  
  // High score for having archetype exotics
  synergyScore += matchingItems.exotics.length * 25;
  
  // Medium score for relevant mods
  synergyScore += matchingItems.mods.length * 15;
  
  // Lower score for subclass components
  synergyScore += (matchingItems.aspects.length + matchingItems.fragments.length) * 10;
  synergyScore += matchingItems.abilities.length * 5;
  
  // Bonus for having multiple component types
  const componentTypes = [
    matchingItems.exotics.length > 0,
    matchingItems.mods.length > 0,
    matchingItems.aspects.length > 0 || matchingItems.fragments.length > 0,
    matchingItems.abilities.length > 0
  ].filter(Boolean).length;
  
  synergyScore += componentTypes * 10;
  
  // Generate build guide based on archetype
  const buildGuide = generateArchetypeBuildGuide(archetype, matchingItems);
  
  return {
    name: determineCustomBuildName(archetype, matchingItems),
    description: `A ${archetype.focus}-focused build utilizing ${generateItemDescription(matchingItems)}`,
    synergyScore: Math.min(synergyScore, 100),
    buildType: archetype.focus,
    focus: archetype.focus,
    components: {
      exoticArmor: matchingItems.exotics.filter(item => item.type.includes('Armor')),
      exoticWeapons: matchingItems.exotics.filter(item => item.type.includes('Weapon')),
      mods: matchingItems.mods,
      aspects: matchingItems.aspects,
      fragments: matchingItems.fragments,
      abilities: matchingItems.abilities
    },
    buildGuide: buildGuide,
    allItems: Object.values(matchingItems).flat(),
    itemCount: matchingItems.total,
    playstyle: generateArchetypePlaystyle(archetype, matchingItems),
    buildTemplate: {
      name: archetype.name,
      priority: `Focus on ${archetype.requiredComponents.stat}`,
      keyExotics: archetype.requiredComponents.exotics,
      essentialMods: archetype.requiredComponents.mods,
      playstyle: `${archetype.focus}-focused gameplay`,
      activities: archetype.requiredComponents.activities
    }
  };
};

// Generate complete build guide based on archetype
const generateArchetypeBuildGuide = (archetype, matchingItems) => {
  const primaryExotic = matchingItems.exotics[0];
  
  return {
    subclass: {
      super: determineBestSuper(archetype, matchingItems),
      abilities: {
        class: determineBestClassAbility(archetype),
        movement: determineBestMovement(archetype),
        melee: determineBestMelee(archetype)
      },
      aspects: matchingItems.aspects.length > 0 ? 
        matchingItems.aspects.map(item => item.name) : 
        archetype.requiredComponents.aspects,
      fragments: matchingItems.fragments.length > 0 ? 
        matchingItems.fragments.map(item => item.name) : 
        generateRecommendedFragments(archetype)
    },
    
    weapons: generateWeaponRecommendations(archetype, matchingItems),
    
    armor: {
      exotic: primaryExotic ? primaryExotic.name : archetype.requiredComponents.exotics[0],
      priority: `${archetype.requiredComponents.stat} (aim for 100)`,
      stats: `${archetype.requiredComponents.stat} is crucial for this build's effectiveness`
    },
    
    mods: {
      essential: archetype.requiredComponents.mods,
      recommended: matchingItems.mods.map(mod => mod.name),
      priority: `Prioritize ${archetype.focus}-enhancing mods`
    },
    
    gameplay: {
      style: `${archetype.focus}-focused gameplay with emphasis on ${archetype.requiredComponents.stat}`,
      activities: archetype.requiredComponents.activities,
      tips: generateArchetypeGameplayTips(archetype)
    }
  };
};

// Helper functions for build guide generation
const determineBestSuper = (archetype, matchingItems) => {
  const focusToSuper = {
    'grenade': 'High-damage area super (Nova Bomb, Thundercrash, Blade Barrage)',
    'ability': 'Support super (Well of Radiance, Ward of Dawn, Shadowshot)',
    'weapon': 'DPS super (Golden Gun, Chaos Reach)',
    'weapon_damage': 'DPS super (Golden Gun, Chaos Reach, Cuirass Thundercrash)',
    'stealth': 'Shadowshot (Deadfall or Moebius Quiver)',
    'healing': 'Well of Radiance',
    'super': 'Roaming super for orb generation',
    'melee': 'Roaming melee super (Arc Staff, Hammer of Sol)',
    'defense': 'Defensive super (Ward of Dawn, Well of Radiance)',
    'movement': 'Mobile super (Spectral Blades, Dawnblade)'
  };
  
  return focusToSuper[archetype.focus] || 'Any super that synergizes with your exotic';
};

const determineBestClassAbility = (archetype) => {
  const focusToClass = {
    'grenade': 'Class ability that enhances grenade energy',
    'weapon': 'Rally Barricade for reload, Marksman\'s Dodge for reload',
    'weapon_damage': 'Rally Barricade for damage boost, Marksman\'s Dodge for reload',
    'stealth': 'Gambler\'s Dodge for melee energy and invisibility',
    'healing': 'Healing Rift for team support',
    'defense': 'Towering Barricade for protection',
    'melee': 'Gambler\'s Dodge or abilities that enhance melee',
    'movement': 'Marksman\'s Dodge for mobility, Icarus Dash'
  };
  
  return focusToClass[archetype.focus] || 'Class ability that supports your playstyle';
};

const determineBestMovement = (archetype) => {
  const focusToMovement = {
    'stealth': 'High Jump or Triple Jump for mobility',
    'movement': 'Triple Jump, Icarus Dash, or High Lift for maximum mobility',
    'weapon_damage': 'Strafe Jump or Balanced Glide for stability'
  };
  
  return focusToMovement[archetype.focus] || 'Movement ability that suits your playstyle';
};

const determineBestMelee = (archetype) => {
  const focusToMelee = {
    'melee': 'Melee that synergizes with your exotic armor',
    'stealth': 'Smoke Bomb for invisibility',
    'healing': 'Melee that provides healing or support',
    'grenade': 'Melee that generates grenade energy'
  };
  
  return focusToMelee[archetype.focus] || 'Melee that complements your build focus';
};

const generateRecommendedFragments = (archetype) => {
  const focusToFragments = {
    'grenade': ['Echo of Instability', 'Echo of Undermining', 'Whisper of Fissures'],
    'ability': ['Echo of Persistence', 'Echo of Remnants', 'Facet of Courage'],
    'stealth': ['Echo of Obscurity', 'Echo of Persistence', 'Echo of Remnants'],
    'healing': ['Ember of Empyrean', 'Ember of Solace', 'Ember of Benevolence'],
    'super': ['Echo of Persistence', 'Whisper of Refraction', 'Facet of Devotion'],
    'melee': ['Echo of Leeching', 'Ember of Torches', 'Facet of Strength'],
    'defense': ['Whisper of Chains', 'Echo of Leeching', 'Ember of Resolve'],
    'weapon_damage': ['Font of Might', 'High-Energy Fire', 'Elemental Time Dilation'],
    'movement': ['Facet of Grace', 'Echo of Expulsion', 'Ember of Tempering']
  };
  
  return focusToFragments[archetype.focus] || ['Fragments that enhance your build focus'];
};

const generateWeaponRecommendations = (archetype, matchingItems) => {
  const exoticWeapon = matchingItems.exotics.find(item => item.type.includes('Weapon'));
  
  const focusToWeapons = {
    'grenade': {
      primary: 'Weapon with Demolitionist or grenade synergy',
      secondary: 'Special weapon for major enemies',
      heavy: 'Rocket launcher or grenade launcher',
      exotic: exoticWeapon ? exoticWeapon.name : 'Sunshot, Graviton Lance, or grenade-synergy exotic'
    },
    'weapon': {
      primary: 'High DPS primary (hand cannon, auto rifle)',
      secondary: 'Special weapon with auto-loading',
      heavy: 'Heavy weapon with auto-loading',
      exotic: exoticWeapon ? exoticWeapon.name : 'Weapon with reload/damage synergy'
    },
    'weapon_damage': {
      primary: 'Primary with damage perks (Rampage, Kill Clip)',
      secondary: 'High-damage special weapon',
      heavy: 'Heavy weapon optimized for DPS',
      exotic: exoticWeapon ? exoticWeapon.name : 'High-damage exotic weapon'
    },
    'stealth': {
      primary: 'Suppressed or void weapon',
      secondary: 'Void special weapon',
      heavy: 'Void heavy weapon',
      exotic: exoticWeapon ? exoticWeapon.name : 'Le Monarque, Graviton Lance'
    },
    'healing': {
      primary: 'Solar weapon with healing synergy',
      secondary: 'Special weapon for add clear',
      heavy: 'Solar heavy weapon',
      exotic: exoticWeapon ? exoticWeapon.name : 'Sunshot, Polaris Lance'
    }
  };
  
  return focusToWeapons[archetype.focus] || {
    primary: 'Primary weapon that supports your build',
    secondary: 'Special weapon for versatility',
    heavy: 'Heavy weapon for DPS',
    exotic: exoticWeapon ? exoticWeapon.name : 'Exotic that synergizes with your build'
  };
};

const generateArchetypeGameplayTips = (archetype) => {
  const focusToTips = {
    'grenade': [
      'Prioritize Discipline stat (aim for 100)',
      'Use grenade kickstart mods for faster cooldowns',
      'Chain grenade kills to maintain energy',
      'Coordinate with team for maximum area control'
    ],
    'stealth': [
      'Use invisibility for repositioning and revives',
      'Coordinate smoke bombs with team pushes',
      'Prioritize Mobility and Strength stats',
      'Use suppressing abilities to support team'
    ],
    'healing': [
      'Position wells and rifts strategically for team',
      'Prioritize Recovery and Discipline',
      'Communicate with team about healing placement',
      'Use healing to enable aggressive team plays'
    ],
    'weapon_damage': [
      'Focus on weapon damage mods and perks',
      'Use damage-boosting abilities before DPS phases',
      'Coordinate with team for maximum damage windows',
      'Prioritize weapon handling and reload stats'
    ],
    'movement': [
      'Use mobility for positioning and escapes',
      'Prioritize Mobility stat (aim for 100)',
      'Practice movement techniques for your class',
      'Use movement to control engagement distances'
    ]
  };
  
  return focusToTips[archetype.focus] || [
    `Focus on maximizing ${archetype.requiredComponents.stat}`,
    `Use mods that enhance ${archetype.focus} effectiveness`,
    `Best suited for ${archetype.requiredComponents.activities.join(', ')}`,
    'Coordinate with team for maximum effectiveness'
  ];
};

// Helper functions for build naming and descriptions
const determineCustomBuildName = (archetype, matchingItems) => {
  const primaryExotic = matchingItems.exotics[0];
  
  if (primaryExotic) {
    return `${primaryExotic.name} ${archetype.focus.charAt(0).toUpperCase() + archetype.focus.slice(1)} Build`;
  }
  
  return archetype.name;
};

const generateItemDescription = (matchingItems) => {
  const components = [];
  if (matchingItems.exotics.length > 0) components.push('exotic gear');
  if (matchingItems.mods.length > 0) components.push('specialized mods');
  if (matchingItems.aspects.length > 0 || matchingItems.fragments.length > 0) components.push('subclass synergies');
  
  return components.length > 0 ? components.join(' and ') : 'available components';
};

const generateArchetypePlaystyle = (archetype, matchingItems) => {
  return {
    strengths: [
      `Excels at ${archetype.focus}-focused gameplay`,
      `Optimized for ${archetype.requiredComponents.stat}`,
      'Synergistic component integration'
    ],
    weaknesses: [
      `Requires specific ${archetype.focus} items`,
      'May lack versatility in other areas',
      `Dependent on ${archetype.requiredComponents.stat} stat investment`
    ],
    bestActivities: archetype.requiredComponents.activities,
    keyItems: matchingItems.exotics.map(item => item.name)
  };
};

// IMPROVED: Main function to find builds using real archetype system
export const findDynamicBuilds = (searchQuery, destinyData) => {
  // Use existing item search to get relevant items
  const parsedSearch = parseAdvancedSearch(searchQuery);
  const processedKeywords = processAdvancedKeywords(parsedSearch);
  const relevantItems = findAdvancedSynergisticItems(processedKeywords, destinyData);
  
  // Focus on top synergistic items for build creation
  const topItems = relevantItems.slice(0, 30);
  
  // Analyze these items using real Destiny 2 build archetypes
  const builds = analyzeItemsForBuilds(topItems, searchQuery);
  
  return {
    builds,
    totalFound: builds.length,
    sourceItems: topItems.length,
    query: searchQuery
  };
};