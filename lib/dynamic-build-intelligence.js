import { parseAdvancedSearch, processAdvancedKeywords, findAdvancedSynergisticItems } from './advanced-search-parser';

// Destiny 2 item category hashes and constants
export const ITEM_CATEGORIES = {
  WEAPONS: [1], // Weapon category hash
  ARMOR: [20], // Armor category hash
  MODS: [59], // Mod category hash
  GRENADES: [1], // Grenade abilities (part of weapons/abilities)
  ARMOR_MODS: [59], // Armor mod category
  WEAPON_MODS: [59], // Weapon mod category
  ASPECTS: [3124752623], // Aspect category (example hash)
  FRAGMENTS: [3124752624], // Fragment category (example hash)
  SUPERS: [39], // Super ability category
  CLASS_ABILITIES: [40], // Class ability category
  MELEE_ABILITIES: [41], // Melee ability category
  EXOTIC_WEAPONS: [1], // Exotic weapons
  EXOTIC_ARMOR: [20] // Exotic armor
};

export const TIER_TYPES = {
  EXOTIC: 6,
  LEGENDARY: 5,
  RARE: 4,
  UNCOMMON: 3,
  COMMON: 2
};

// Enhanced build patterns using hash-based detection
export const ENHANCED_BUILD_PATTERNS = {
  grenade_builds: {
    keywords: ['grenade', 'explosive', 'ordnance', 'throw', 'blast'],
    phrases: ['constant grenades', 'grenade energy', 'grenade damage', 'infinite grenades'],
    requiredCategories: [ITEM_CATEGORIES.GRENADES[0]],
    synergisticCategories: [
      ...ITEM_CATEGORIES.ARMOR_MODS,
      ...ITEM_CATEGORIES.ASPECTS,
      ...ITEM_CATEGORIES.FRAGMENTS
    ],
    conceptTerms: ['energy', 'ability', 'cooldown', 'discipline'],
    minItems: 3,
    focus: 'grenade',
    damageTypes: ['Solar', 'Arc', 'Void', 'Stasis', 'Strand'],
    buildTemplate: {
      name: 'Grenade Spam Build',
      priority: 'High Discipline (100), Focus on grenade energy mods',
      keyExotics: ['Armamentarium', 'Heart of Inmost Light', 'Contraverse Hold'],
      essentialMods: ['Grenade Kickstart', 'Bomber', 'Elemental Ordnance'],
      playstyle: 'Area control through constant grenade usage',
      activities: ['Strikes', 'Lost Sectors', 'Patrol', 'Add-heavy content']
    }
  },

  reload_builds: {
    keywords: ['reload', 'magazine', 'auto-loading', 'feeding', 'ammunition', 'never reload'],
    phrases: ['never reload', 'auto reload', 'continuous fire', 'infinite ammo'],
    requiredCategories: [ITEM_CATEGORIES.WEAPONS[0]],
    synergisticCategories: [
      ...ITEM_CATEGORIES.WEAPON_MODS,
      ...ITEM_CATEGORIES.ARMOR_MODS
    ],
    conceptTerms: ['auto-loading', 'holster', 'reserves', 'magazine'],
    minItems: 2,
    focus: 'reload',
    weaponTypes: ['auto_rifle', 'machine_gun', 'submachine_gun'],
    buildTemplate: {
      name: 'Auto-Loading Build',
      priority: 'Rally Barricade, Auto-Loading Holster, Backup Mag',
      keyExotics: ['Actium War Rig', 'Lucky Pants', 'Transversive Steps'],
      essentialMods: ['Auto-Loading Holster', 'Backup Mag', 'Reserves mods'],
      playstyle: 'Sustained damage without manual reloading',
      activities: ['Raids', 'Dungeons', 'Boss encounters', 'DPS phases']
    }
  },

  super_builds: {
    keywords: ['super', 'ultimate', 'energy', 'intellect', 'orbs'],
    phrases: ['fast super', 'super energy', 'frequent super', 'quick ultimate'],
    requiredCategories: [ITEM_CATEGORIES.SUPERS[0]],
    synergisticCategories: [
      ...ITEM_CATEGORIES.ARMOR_MODS,
      ...ITEM_CATEGORIES.WEAPON_MODS
    ],
    conceptTerms: ['orbs', 'light', 'energy', 'intellect'],
    minItems: 3,
    focus: 'super',
    buildTemplate: {
      name: 'Super Generation Build',
      priority: 'High Intellect (100), Orb generation, Super mods',
      keyExotics: ['Geomag Stabilizers', 'Orpheus Rig', 'Doom Fang Pauldron'],
      essentialMods: ['Hands-On', 'Ashes to Assets', 'Distribution'],
      playstyle: 'Frequent super usage for maximum uptime',
      activities: ['Raids', 'Dungeons', 'High-level content', 'Team activities']
    }
  },

  healing_builds: {
    keywords: ['healing', 'health', 'recovery', 'restoration', 'cure', 'support'],
    phrases: ['team heal', 'constant healing', 'support build', 'well of radiance'],
    requiredCategories: [ITEM_CATEGORIES.CLASS_ABILITIES[0]],
    synergisticCategories: [
      ...ITEM_CATEGORIES.ARMOR_MODS,
      ...ITEM_CATEGORIES.ASPECTS,
      ...ITEM_CATEGORIES.FRAGMENTS
    ],
    conceptTerms: ['heal', 'health', 'recovery', 'restoration', 'cure'],
    minItems: 2,
    focus: 'healing',
    preferredClasses: [2], // Warlock
    buildTemplate: {
      name: 'Support Healing Build',
      priority: 'High Recovery (100), Healing mods, Team support',
      keyExotics: ['Phoenix Protocol', 'Boots of the Assembler', 'Lunafaction Boots'],
      essentialMods: ['Well of Life', 'Recuperation', 'Better Already'],
      playstyle: 'Team support through healing and buffs',
      activities: ['Raids', 'Dungeons', 'Team content', 'Grandmaster Nightfalls']
    }
  },

  stealth_builds: {
    keywords: ['invisibility', 'stealth', 'vanish', 'cloak', 'hidden', 'void hunter'],
    phrases: ['invisible hunter', 'stealth build', 'void hunter', 'vanishing step'],
    requiredCategories: [ITEM_CATEGORIES.MELEE_ABILITIES[0], ITEM_CATEGORIES.CLASS_ABILITIES[0]],
    synergisticCategories: [
      ...ITEM_CATEGORIES.ARMOR_MODS,
      ...ITEM_CATEGORIES.ASPECTS,
      ...ITEM_CATEGORIES.FRAGMENTS
    ],
    conceptTerms: ['invisibility', 'stealth', 'void', 'smoke', 'vanish'],
    minItems: 2,
    focus: 'stealth',
    preferredClasses: [1], // Hunter
    damageTypes: ['Void'],
    buildTemplate: {
      name: 'Void Invisibility Build',
      priority: 'High Mobility (100), Void mods, Strength for melee',
      keyExotics: ['Graviton Forfeit', 'Omnioculus', 'Gyrfalcon\'s Hauberk'],
      essentialMods: ['Utility Kickstart', 'Dynamo', 'Distribution'],
      playstyle: 'Stealth-based survivability and team support',
      activities: ['Solo content', 'Grandmaster Nightfalls', 'Raids', 'Rescue missions']
    }
  },

  melee_builds: {
    keywords: ['melee', 'punch', 'strike', 'martial', 'strength', 'fist'],
    phrases: ['melee damage', 'punch build', 'martial arts', 'one two punch'],
    requiredCategories: [ITEM_CATEGORIES.MELEE_ABILITIES[0]],
    synergisticCategories: [
      ...ITEM_CATEGORIES.ARMOR_MODS,
      ...ITEM_CATEGORIES.WEAPON_MODS
    ],
    conceptTerms: ['melee', 'punch', 'strength', 'martial', 'close'],
    minItems: 2,
    focus: 'melee',
    buildTemplate: {
      name: 'Melee Combat Build',
      priority: 'High Strength (100), Melee mods, Close-range weapons',
      keyExotics: ['Wormgod Caress', 'Synthoceps', 'Karnstein Armlets'],
      essentialMods: ['Melee Kickstart', 'Heavy Handed', 'Impact Induction'],
      playstyle: 'Close-range combat with enhanced melee damage',
      activities: ['Strikes', 'Lost Sectors', 'Patrol', 'Close-quarters content']
    }
  },

  weapon_specific_builds: {
    keywords: ['hand cannon', 'auto rifle', 'fusion rifle', 'shotgun', 'sniper', 'sword', 'bow'],
    phrases: ['hand cannon build', 'auto rifle spam', 'fusion rifle build', 'shotgun ape'],
    requiredCategories: [ITEM_CATEGORIES.WEAPONS[0]],
    synergisticCategories: [
      ...ITEM_CATEGORIES.WEAPON_MODS,
      ...ITEM_CATEGORIES.ARMOR_MODS
    ],
    conceptTerms: ['weapon', 'damage', 'targeting', 'reload', 'handling'],
    minItems: 2,
    focus: 'weapon',
    weaponTypes: ['hand_cannon', 'auto_rifle', 'fusion_rifle', 'shotgun', 'sniper_rifle', 'sword'],
    buildTemplate: {
      name: 'Weapon-Specific Build',
      priority: 'Weapon-focused mods and synergies',
      keyExotics: ['Weapon-specific exotic armor and weapons'],
      essentialMods: ['Targeting mods', 'Reload mods', 'Damage mods', 'Reserves'],
      playstyle: 'Optimized around specific weapon types for maximum efficiency',
      activities: ['All content types', 'Crucible', 'PvE content']
    }
  },

  movement_builds: {
    keywords: ['mobility', 'speed', 'movement', 'agility', 'dodge', 'jump'],
    phrases: ['high mobility', 'speed build', 'movement build', 'agile hunter'],
    requiredCategories: [ITEM_CATEGORIES.CLASS_ABILITIES[0]],
    synergisticCategories: [
      ...ITEM_CATEGORIES.ARMOR_MODS,
      ...ITEM_CATEGORIES.ASPECTS
    ],
    conceptTerms: ['mobility', 'speed', 'movement', 'agility', 'dodge'],
    minItems: 2,
    focus: 'movement',
    preferredClasses: [1], // Hunter (most mobile)
    buildTemplate: {
      name: 'High Mobility Build',
      priority: 'Maximum Mobility (100), Movement-enhancing mods',
      keyExotics: ['St0mp-EE5', 'Dragon\'s Shadow', 'Transversive Steps'],
      essentialMods: ['Traction', 'Powerful Friends', 'Mobility mods'],
      playstyle: 'High-speed gameplay with enhanced movement capabilities',
      activities: ['Crucible', 'Speedruns', 'Solo content', 'Platforming']
    }
  },

  tank_builds: {
    keywords: ['tank', 'resilience', 'defense', 'survivability', 'shield', 'resist'],
    phrases: ['tank build', 'high resilience', 'defensive build', 'survivability'],
    requiredCategories: [ITEM_CATEGORIES.ARMOR[0]],
    synergisticCategories: [
      ...ITEM_CATEGORIES.ARMOR_MODS,
      ...ITEM_CATEGORIES.CLASS_ABILITIES
    ],
    conceptTerms: ['resilience', 'defense', 'resist', 'shield', 'protection'],
    minItems: 2,
    focus: 'defense',
    preferredClasses: [0], // Titan (naturally tanky)
    buildTemplate: {
      name: 'Tank Defense Build',
      priority: 'Maximum Resilience (100), Resistance mods',
      keyExotics: ['One-Eyed Mask', 'Helm of Saint-14', 'Precious Scars'],
      essentialMods: ['Resist mods', 'Recuperation', 'Better Already'],
      playstyle: 'Maximum survivability through damage resistance',
      activities: ['Grandmaster Nightfalls', 'Solo content', 'Endgame PvE']
    }
  }
};

// Analyze items to detect build potential using enhanced patterns
export const analyzeItemsForBuilds = (items, searchQuery) => {
  const builds = [];
  const lowerQuery = searchQuery.toLowerCase();
  
  // Check each enhanced build pattern
  Object.entries(ENHANCED_BUILD_PATTERNS).forEach(([buildType, pattern]) => {
    // Check if search query matches this build type
    const queryMatches = pattern.keywords.some(keyword => lowerQuery.includes(keyword)) ||
                        pattern.phrases.some(phrase => lowerQuery.includes(phrase));
    
    if (!queryMatches) return;
    
    // Find items that match this build pattern using multiple criteria
    const buildItems = items.filter(item => {
      const itemText = `${item.name} ${item.description}`.toLowerCase();
      
      // Check for keyword matches
      const keywordMatches = pattern.keywords.some(keyword => itemText.includes(keyword));
      
      // Check for phrase matches
      const phraseMatches = pattern.phrases.some(phrase => itemText.includes(phrase));
      
      // Check for concept term matches
      const conceptMatches = pattern.conceptTerms.some(term => itemText.includes(term));
      
      // Check for damage type matches (if specified)
      const damageTypeMatches = !pattern.damageTypes || 
        pattern.damageTypes.some(type => itemText.includes(type.toLowerCase()));
      
      // Check for weapon type matches (if specified)
      const weaponTypeMatches = !pattern.weaponTypes || 
        pattern.weaponTypes.some(type => itemText.includes(type.replace('_', ' ')));
      
      // Item must match at least one criterion and damage/weapon type if specified
      return (keywordMatches || phraseMatches || conceptMatches) && 
             damageTypeMatches && weaponTypeMatches;
    });
    
    // Only create build if we have enough synergistic items
    if (buildItems.length >= pattern.minItems) {
      const build = assembleDynamicBuild(buildType, pattern, buildItems, searchQuery);
      if (build) {
        builds.push(build);
      }
    }
  });
  
  return builds.sort((a, b) => b.synergyScore - a.synergyScore);
};

// Assemble a build from real Destiny items with enhanced logic
const assembleDynamicBuild = (buildType, pattern, items, searchQuery) => {
  // Categorize items by type with better detection
  const categorizedItems = categorizeItemsEnhanced(items);
  
  // Calculate synergy score based on item relationships and pattern matching
  const synergyScore = calculateEnhancedSynergyScore(items, pattern, searchQuery);
  
  // Generate build name and description with more context
  const buildInfo = generateEnhancedBuildInfo(buildType, pattern, categorizedItems, searchQuery);
  
  // Generate complete build guide with template integration
  const completeGuide = generateCompleteBuildGuide(pattern, categorizedItems, items);
  
  return {
    name: buildInfo.name,
    description: buildInfo.description,
    synergyScore: Math.min(synergyScore, 100),
    buildType: buildType,
    focus: pattern.focus,
    components: {
      exoticArmor: categorizedItems.exoticArmor,
      exoticWeapons: categorizedItems.exoticWeapons,
      legendaryWeapons: categorizedItems.legendaryWeapons,
      mods: categorizedItems.mods,
      aspects: categorizedItems.aspects,
      fragments: categorizedItems.fragments,
      abilities: categorizedItems.abilities
    },
    buildGuide: completeGuide,
    allItems: items,
    itemCount: items.length,
    playstyle: generateDynamicPlaystyle(pattern, categorizedItems),
    buildTemplate: pattern.buildTemplate
  };
};

// Enhanced item categorization with better detection
const categorizeItemsEnhanced = (items) => {
  const categories = {
    exoticArmor: [],
    exoticWeapons: [],
    legendaryWeapons: [],
    mods: [],
    aspects: [],
    fragments: [],
    abilities: [],
    other: []
  };
  
  items.forEach(item => {
    const isExotic = item.rarity === 'Exotic' || item.type.includes('Exotic');
    const name = item.name.toLowerCase();
    
    // Enhanced categorization logic
    if (item.type.includes('Armor') && isExotic) {
      categories.exoticArmor.push(item);
    } else if (item.type.includes('Weapon') && isExotic) {
      categories.exoticWeapons.push(item);
    } else if (item.type.includes('Weapon')) {
      categories.legendaryWeapons.push(item);
    } else if (item.type.includes('Mod')) {
      categories.mods.push(item);
    } else if (name.includes('aspect') || item.description.toLowerCase().includes('aspect')) {
      categories.aspects.push(item);
    } else if (name.includes('fragment') || name.includes('echo of') || name.includes('facet of') || name.includes('whisper of')) {
      categories.fragments.push(item);
    } else if (name.includes('grenade') || name.includes('melee') || name.includes('super') || name.includes('ability')) {
      categories.abilities.push(item);
    } else {
      categories.other.push(item);
    }
  });
  
  return categories;
};

// Enhanced synergy score calculation
const calculateEnhancedSynergyScore = (items, pattern, searchQuery) => {
  let score = 0;
  const baseScore = 30; // Starting score
  
  // Keyword matching bonus
  const keywordMatches = items.reduce((total, item) => {
    const itemText = `${item.name} ${item.description}`.toLowerCase();
    const queryLower = searchQuery.toLowerCase();
    
    let matches = 0;
    matches += pattern.keywords.filter(keyword => itemText.includes(keyword)).length * 5;
    matches += pattern.phrases.filter(phrase => itemText.includes(phrase)).length * 10;
    matches += pattern.conceptTerms.filter(term => itemText.includes(term)).length * 3;
    
    // Direct query match bonus
    if (itemText.includes(queryLower) || queryLower.includes(item.name.toLowerCase())) {
      matches += 15;
    }
    
    return total + matches;
  }, 0);
  
  score += Math.min(keywordMatches, 40);
  
  // Exotic item bonus
  const exoticCount = items.filter(item => 
    item.rarity === 'Exotic' || item.type.includes('Exotic')
  ).length;
  score += Math.min(exoticCount * 15, 30);
  
  // Category diversity bonus
  const categories = categorizeItemsEnhanced(items);
  const categoryCount = Object.values(categories).filter(cat => cat.length > 0).length;
  score += Math.min(categoryCount * 5, 25);
  
  // Build template compatibility bonus
  if (pattern.buildTemplate) {
    const templateMatches = items.filter(item => {
      const itemName = item.name.toLowerCase();
      return pattern.buildTemplate.keyExotics.some(exotic => 
        itemName.includes(exotic.toLowerCase())
      ) || pattern.buildTemplate.essentialMods.some(mod => 
        itemName.includes(mod.toLowerCase())
      );
    }).length;
    score += Math.min(templateMatches * 10, 20);
  }
  
  return Math.min(baseScore + score, 100);
};

// Enhanced build info generation
const generateEnhancedBuildInfo = (buildType, pattern, categorizedItems, searchQuery) => {
  const template = pattern.buildTemplate;
  let name = template.name;
  let description = template.playstyle;
  
  // Customize based on exotic items found
  if (categorizedItems.exoticArmor.length > 0) {
    const exoticName = categorizedItems.exoticArmor[0].name;
    name = `${exoticName} ${pattern.focus.charAt(0).toUpperCase() + pattern.focus.slice(1)} Build`;
  } else if (categorizedItems.exoticWeapons.length > 0) {
    const exoticName = categorizedItems.exoticWeapons[0].name;
    name = `${exoticName} ${pattern.focus.charAt(0).toUpperCase() + pattern.focus.slice(1)} Build`;
  }
  
  // Enhanced description based on available items
  const itemTypes = [];
  if (categorizedItems.exoticArmor.length > 0) itemTypes.push('exotic armor');
  if (categorizedItems.exoticWeapons.length > 0) itemTypes.push('exotic weapons');
  if (categorizedItems.mods.length > 0) itemTypes.push('synergistic mods');
  if (categorizedItems.aspects.length > 0) itemTypes.push('subclass aspects');
  if (categorizedItems.fragments.length > 0) itemTypes.push('fragments');
  
  if (itemTypes.length > 0) {
    description = `A ${pattern.focus}-focused build utilizing ${itemTypes.join(', ')} for optimal ${pattern.focus} performance`;
  }
  
  return { name, description };
};

// Generate complete build guide with enhanced template integration
const generateCompleteBuildGuide = (pattern, categorizedItems, allItems) => {
  const template = pattern.buildTemplate;
  
  return {
    subclass: {
      super: template.keyExotics.length > 0 ? 
        `Optimized for ${template.keyExotics[0]} exotic synergy` : 
        `${pattern.focus}-focused super ability`,
      abilities: {
        class: `${pattern.focus} synergy class ability`,
        movement: `Optimized movement ability`,
        melee: `${pattern.focus} synergy melee ability`
      },
      aspects: categorizedItems.aspects.length > 0 ? 
        categorizedItems.aspects.map(item => item.name) : 
        [`${pattern.focus.charAt(0).toUpperCase() + pattern.focus.slice(1)} synergy aspects`],
      fragments: categorizedItems.fragments.length > 0 ? 
        categorizedItems.fragments.map(item => item.name) : 
        [`${pattern.focus.charAt(0).toUpperCase() + pattern.focus.slice(1)} synergy fragments`]
    },
    
    weapons: {
      primary: categorizedItems.legendaryWeapons.find(w => w.description?.includes('kinetic'))?.name || 
               `${pattern.focus} synergy primary weapon`,
      secondary: categorizedItems.legendaryWeapons.find(w => w.description?.includes('energy'))?.name ||
                 `${pattern.focus} synergy secondary weapon`,
      heavy: categorizedItems.legendaryWeapons.find(w => w.description?.includes('heavy'))?.name ||
             `${pattern.focus} synergy heavy weapon`,
      exotic: categorizedItems.exoticWeapons.length > 0 ? 
              categorizedItems.exoticWeapons[0].name : 
              template.keyExotics[0] || `${pattern.focus} exotic weapon`
    },
    
    armor: {
      exotic: categorizedItems.exoticArmor.length > 0 ? 
              categorizedItems.exoticArmor[0].name : 
              template.keyExotics[0] || `${pattern.focus} exotic armor`,
      priority: template.priority,
      stats: template.priority.includes('100') ? 
             template.priority : 
             `Focus on ${pattern.focus}-related stats`
    },
    
    mods: {
      essential: template.essentialMods,
      recommended: categorizedItems.mods.map(mod => mod.name),
      priority: template.priority
    },
    
    gameplay: {
      style: template.playstyle,
      activities: template.activities,
      tips: generateGameplayTips(pattern.focus, template)
    }
  };
};

// Generate gameplay tips based on build template
const generateGameplayTips = (focus, template) => {
  const baseTips = [
    `Focus on ${template.priority}`,
    `Utilize ${template.keyExotics.join(' or ')} for maximum synergy`,
    `Prioritize ${template.essentialMods.join(', ')} mods`,
    `Best suited for ${template.activities.join(', ')}`
  ];
  
  return baseTips;
};

// Generate dynamic playstyle info
const generateDynamicPlaystyle = (pattern, categorizedItems) => {
  const template = pattern.buildTemplate;
  
  return {
    strengths: [template.playstyle, `${pattern.focus} optimization`, 'Synergistic item usage'],
    weaknesses: [`Requires specific ${pattern.focus} items`, 'May lack versatility'],
    bestActivities: template.activities,
    keyItems: [
      ...categorizedItems.exoticArmor.map(item => item.name),
      ...categorizedItems.exoticWeapons.map(item => item.name)
    ]
  };
};

// Main function to find builds using enhanced patterns
export const findDynamicBuilds = (searchQuery, destinyData) => {
  // Use existing item search to get relevant items
  const parsedSearch = parseAdvancedSearch(searchQuery);
  const processedKeywords = processAdvancedKeywords(parsedSearch);
  const relevantItems = findAdvancedSynergisticItems(processedKeywords, destinyData);
  
  // Analyze top synergistic items with enhanced patterns
  const topItems = relevantItems.slice(0, 50); // Increased from 30 for better coverage
  
  // Analyze these items to create enhanced dynamic builds
  const builds = analyzeItemsForBuilds(topItems, searchQuery);
  
  return {
    builds,
    totalFound: builds.length,
    sourceItems: topItems.length,
    query: searchQuery
  };
};