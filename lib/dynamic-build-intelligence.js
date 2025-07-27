import { parseAdvancedSearch, processAdvancedKeywords, findAdvancedSynergisticItems } from './advanced-search-parser';

// Enhanced keyword patterns for better build detection
export const BUILD_PATTERNS = {
  // Grenade-focused builds
  grenade_builds: {
    keywords: ['grenade', 'explosive', 'ordnance', 'throw', 'blast'],
    phrases: ['constant grenades', 'grenade energy', 'grenade damage', 'infinite grenades'],
    required_synergies: ['grenade', 'energy', 'ability'],
    min_items: 3,
    focus: 'grenade',
    buildTemplate: {
      super: 'Well of Radiance (Solar Warlock) or Hammer of Sol (Solar Titan)',
      abilities: {
        class: 'Healing Rift (Warlock) or Towering Barricade (Titan)',
        movement: 'Burst Glide (Warlock) or Catapult Lift (Titan)',
        melee: 'Celestial Fire (Warlock) or Throwing Hammer (Titan)'
      },
      weaponMods: ['Enhanced Loader', 'Backup Mag', 'Minor Spec'],
      armorModPlacements: {
        helmet: ['Hands-On', 'Ashes to Assets'],
        arms: ['Enhanced Loader (weapon type)', 'Grenade Kickstart'],
        chest: ['Elemental Resistance', 'Damage Resistance'],
        legs: ['Enhanced Dexterity', 'Recuperation'],
        classItem: ['Bomber', 'Distribution', 'Dynamo']
      }
    }
  },
  
  // Reload/weapon builds  
  reload_builds: {
    keywords: ['reload', 'magazine', 'auto-loading', 'feeding', 'ammunition'],
    phrases: ['never reload', 'auto reload', 'continuous fire', 'infinite ammo'],
    required_synergies: ['reload', 'magazine', 'auto'],
    min_items: 2,
    focus: 'reload',
    buildTemplate: {
      super: 'Ward of Dawn (Void Titan) or Well of Radiance (Solar Warlock)',
      abilities: {
        class: 'Rally Barricade (Titan) or Empowering Rift (Warlock)',
        movement: 'Catapult Lift (Titan) or Burst Glide (Warlock)',
        melee: 'Defensive Strike (Titan) or Celestial Fire (Warlock)'
      },
      weaponMods: ['Backup Mag', 'Enhanced Reload', 'Boss Spec'],
      armorModPlacements: {
        helmet: ['Ammo Finder (weapon type)', 'Enhanced Targeting'],
        arms: ['Enhanced Reload Speed', 'Auto-Loading Holster'],
        chest: ['Ammo Reserves', 'Damage Resistance'],
        legs: ['Enhanced Dexterity', 'Weapon Surge'],
        classItem: ['Holster Mods', 'Scavenger Mods']
      }
    }
  },
  
  // Super builds
  super_builds: {
    keywords: ['super', 'ultimate', 'energy', 'intellect', 'orbs'],
    phrases: ['fast super', 'super energy', 'frequent super', 'quick ultimate'],
    required_synergies: ['super', 'energy'],
    min_items: 3,
    focus: 'super',
    buildTemplate: {
      super: 'Varies by subclass - focus on damage supers',
      abilities: {
        class: 'Based on subclass synergy',
        movement: 'Optimized for super generation',
        melee: 'Ability that generates orbs or energy'
      },
      weaponMods: ['Orb Generation', 'Weapon Surge'],
      armorModPlacements: {
        helmet: ['Hands-On', 'Ashes to Assets', 'Heavy Handed'],
        arms: ['Impact Induction', 'Momentum Transfer'],
        chest: ['Elemental Resistance', 'Font of Wisdom'],
        legs: ['Innervation', 'Absolution'],
        classItem: ['Bomber', 'Distribution', 'Dynamo']
      },
      stats: { intellect: 100, discipline: 80 }
    }
  },
  
  // Healing builds
  healing_builds: {
    keywords: ['healing', 'health', 'recovery', 'restoration', 'cure'],
    phrases: ['team heal', 'constant healing', 'support build'],
    required_synergies: ['heal', 'health', 'recovery'],
    min_items: 2,
    focus: 'healing',
    buildTemplate: {
      super: 'Well of Radiance (Solar Warlock) or Ward of Dawn (Void Titan)',
      abilities: {
        class: 'Healing Rift (Warlock) or Healing Barricade (Titan)',
        movement: 'Burst Glide or Healing-focused',
        melee: 'Healing abilities or energy generation'
      },
      weaponMods: ['Recovery Boost', 'Weapon Surge'],
      armorModPlacements: {
        helmet: ['Hands-On', 'Targeting mods'],
        arms: ['Enhanced Loader', 'Kickstart mods'],
        chest: ['Elemental Well mods', 'Font of Restoration'],
        legs: ['Well of Life', 'Recuperation'],
        classItem: ['Bomber', 'Better Already']
      },
      stats: { recovery: 100, discipline: 80, intellect: 60 }
    }
  },
  
  // Stealth builds
  stealth_builds: {
    keywords: ['invisibility', 'stealth', 'vanish', 'cloak', 'hidden'],
    phrases: ['invisible hunter', 'stealth build', 'void hunter'],
    required_synergies: ['invisibility', 'stealth', 'void'],
    min_items: 2,
    focus: 'stealth',
    buildTemplate: {
      super: 'Shadowshot (Void Hunter)',
      abilities: {
        class: 'Marksman\'s Dodge or Gambler\'s Dodge',
        movement: 'Triple Jump or High Jump',
        melee: 'Smoke Bomb (Snare or Vanishing Step)'
      },
      weaponMods: ['Targeting mods', 'Weapon Surge'],
      armorModPlacements: {
        helmet: ['Enhanced Targeting', 'Hands-On'],
        arms: ['Enhanced Loader', 'Melee Kickstart'],
        chest: ['Void Resistance', 'Font of Might'],
        legs: ['Enhanced Dexterity', 'Utility Kickstart'],
        classItem: ['Dynamo', 'Distribution', 'Bomber']
      },
      stats: { mobility: 100, strength: 80, intellect: 60 }
    }
  },
  
  // Melee builds
  melee_builds: {
    keywords: ['melee', 'punch', 'strike', 'martial', 'strength'],
    phrases: ['melee damage', 'punch build', 'martial arts'],
    required_synergies: ['melee', 'damage', 'strength'],
    min_items: 2,
    focus: 'melee',
    buildTemplate: {
      super: 'Fists of Havoc (Arc Titan) or Burning Maul (Solar Titan)',
      abilities: {
        class: 'Towering Barricade or Rally Barricade',
        movement: 'Catapult Lift or Strafe Lift',
        melee: 'Shoulder Charge variants or Throwing Hammer'
      },
      weaponMods: ['One-Two Punch', 'Swashbuckler'],
      armorModPlacements: {
        helmet: ['Hands-On', 'Enhanced Targeting'],
        arms: ['Impact Induction', 'Enhanced Loader'],
        chest: ['Melee Resistance', 'Font of Might'],
        legs: ['Enhanced Dexterity', 'Traction'],
        classItem: ['Heavy Handed', 'Powerful Friends']
      },
      stats: { strength: 100, resilience: 80, mobility: 60 }
    }
  }
};

// Analyze items to detect build potential
export const analyzeItemsForBuilds = (items, searchQuery) => {
  const builds = [];
  const lowerQuery = searchQuery.toLowerCase();
  
  // Check each build pattern
  Object.entries(BUILD_PATTERNS).forEach(([buildType, pattern]) => {
    // Check if search query matches this build type
    const queryMatches = pattern.keywords.some(keyword => lowerQuery.includes(keyword)) ||
                        pattern.phrases.some(phrase => lowerQuery.includes(phrase));
    
    if (!queryMatches) return;
    
    // Find items that match this build pattern
    const buildItems = items.filter(item => {
      const itemText = `${item.name} ${item.description}`.toLowerCase();
      
      // Count synergy matches
      const synergyMatches = pattern.required_synergies.filter(synergy => 
        itemText.includes(synergy)
      ).length;
      
      // Item must match at least one required synergy
      return synergyMatches > 0;
    });
    
    // Only create build if we have enough synergistic items
    if (buildItems.length >= pattern.min_items) {
      const build = assembleDynamicBuild(buildType, pattern, buildItems, searchQuery);
      if (build) {
        builds.push(build);
      }
    }
  });
  
  return builds.sort((a, b) => b.synergyScore - a.synergyScore);
};

// Assemble a build from real Destiny items
const assembleDynamicBuild = (buildType, pattern, items, searchQuery) => {
  // Categorize items by type
  const categorizedItems = categorizeItems(items);
  
  // Calculate synergy score based on item relationships
  const synergyScore = calculateSynergyScore(items, pattern);
  
  // Generate build name and description
  const buildInfo = generateBuildInfo(buildType, pattern, categorizedItems, searchQuery);
  
  // Generate complete build guide
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
      fragments: categorizedItems.fragments
    },
    // NEW: Complete build guide with everything needed
    buildGuide: completeGuide,
    allItems: items,
    itemCount: items.length,
    playstyle: generateDynamicPlaystyle(pattern, categorizedItems)
  };
};

// Categorize items by their actual Destiny 2 types
const categorizeItems = (items) => {
  const categories = {
    exoticArmor: [],
    exoticWeapons: [],
    legendaryWeapons: [],
    mods: [],
    aspects: [],
    fragments: [],
    other: []
  };
  
  items.forEach(item => {
    const isExotic = item.rarity === 'Exotic' || item.type.includes('Exotic');
    
    if (item.type.includes('Armor') && isExotic) {
      categories.exoticArmor.push(item);
    } else if (item.type.includes('Weapon') && isExotic) {
      categories.exoticWeapons.push(item);
    } else if (item.type.includes('Weapon')) {
      categories.legendaryWeapons.push(item);
    } else if (item.type.includes('Mod')) {
      categories.mods.push(item);
    } else if (item.name.includes('Aspect')) {
      categories.aspects.push(item);
    } else if (item.name.includes('Fragment')) {
      categories.fragments.push(item);
    } else {
      categories.other.push(item);
    }
  });
  
  return categories;
};

// Calculate how well items synergize together
const calculateSynergyScore = (items, pattern) => {
  let score = 0;
  const baseScore = 40; // Starting score
  
  // Bonus for having multiple synergistic items
  const synergyMatches = items.reduce((total, item) => {
    const itemText = `${item.name} ${item.description}`.toLowerCase();
    return total + pattern.required_synergies.filter(synergy => 
      itemText.includes(synergy)
    ).length;
  }, 0);
  
  score += Math.min(synergyMatches * 8, 40); // Up to 40 points for synergies
  
  // Bonus for having exotic items (they usually enable builds)
  const exoticCount = items.filter(item => 
    item.rarity === 'Exotic' || item.type.includes('Exotic')
  ).length;
  score += Math.min(exoticCount * 15, 30); // Up to 30 points for exotics
  
  // Bonus for having different item types (more complete build)
  const categories = categorizeItems(items);
  const categoryCount = Object.values(categories).filter(cat => cat.length > 0).length;
  score += Math.min(categoryCount * 5, 25); // Up to 25 points for diversity
  
  return Math.min(score, 100);
};

// Generate build info based on actual items found
const generateBuildInfo = (buildType, pattern, categorizedItems, searchQuery) => {
  const focus = pattern.focus;
  let name = '';
  let description = '';
  
  // Try to use exotic armor/weapon names in build name if available
  if (categorizedItems.exoticArmor.length > 0) {
    const exoticName = categorizedItems.exoticArmor[0].name;
    name = `${exoticName} ${focus.charAt(0).toUpperCase() + focus.slice(1)} Build`;
  } else if (categorizedItems.exoticWeapons.length > 0) {
    const exoticName = categorizedItems.exoticWeapons[0].name;
    name = `${exoticName} ${focus.charAt(0).toUpperCase() + focus.slice(1)} Build`;
  } else {
    name = `${focus.charAt(0).toUpperCase() + focus.slice(1)} Synergy Build`;
  }
  
  // Generate description based on items
  const itemTypes = [];
  if (categorizedItems.exoticArmor.length > 0) itemTypes.push('exotic armor');
  if (categorizedItems.exoticWeapons.length > 0) itemTypes.push('exotic weapons');
  if (categorizedItems.mods.length > 0) itemTypes.push('synergistic mods');
  
  description = `A ${focus}-focused build utilizing ${itemTypes.join(', ')} for maximum synergy`;
  
  return { name, description };
};

// Generate complete build guide with all loadout details
const generateCompleteBuildGuide = (pattern, categorizedItems, allItems) => {
  const template = pattern.buildTemplate || {};
  
  return {
    subclass: {
      super: template.super || `${pattern.focus}-focused super ability`,
      abilities: template.abilities || {
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
      kinetic: categorizedItems.legendaryWeapons.find(w => w.name.includes('Kinetic'))?.name || 
               categorizedItems.exoticWeapons.find(w => w.name.includes('Kinetic'))?.name ||
               `${pattern.focus} synergy kinetic weapon`,
      energy: categorizedItems.legendaryWeapons.find(w => w.name.includes('Energy'))?.name ||
              categorizedItems.exoticWeapons.find(w => w.name.includes('Energy'))?.name ||
              `${pattern.focus} synergy energy weapon`,
      heavy: categorizedItems.legendaryWeapons.find(w => w.name.includes('Heavy'))?.name ||
             categorizedItems.exoticWeapons.find(w => w.name.includes('Heavy'))?.name ||
             `${pattern.focus} synergy heavy weapon`,
      exotic: categorizedItems.exoticWeapons.length > 0 ? 
              categorizedItems.exoticWeapons[0].name : 
              `${pattern.focus} synergy exotic weapon`,
      weaponMods: template.weaponMods || [`${pattern.focus} weapon mods`]
    },
    
    armor: {
      helmet: categorizedItems.exoticArmor.find(a => a.name.toLowerCase().includes('helm') || 
                                                     a.name.toLowerCase().includes('mask') ||
                                                     a.name.toLowerCase().includes('hood'))?.name ||
              `${pattern.focus} synergy helmet`,
      arms: categorizedItems.exoticArmor.find(a => a.name.toLowerCase().includes('arm') || 
                                                   a.name.toLowerCase().includes('gauntlet') ||
                                                   a.name.toLowerCase().includes('glove'))?.name ||
            `${pattern.focus} synergy arms`,
      chest: categorizedItems.exoticArmor.find(a => a.name.toLowerCase().includes('chest') || 
                                                    a.name.toLowerCase().includes('vest') ||
                                                    a.name.toLowerCase().includes('robe'))?.name ||
             `${pattern.focus} synergy chest`,
      legs: categorizedItems.exoticArmor.find(a => a.name.toLowerCase().includes('leg') || 
                                                   a.name.toLowerCase().includes('boot') ||
                                                   a.name.toLowerCase().includes('step'))?.name ||
            `${pattern.focus} synergy legs`,
      classItem: `${pattern.focus} synergy class item`,
      exotic: categorizedItems.exoticArmor.length > 0 ? 
              categorizedItems.exoticArmor[0].name : 
              `${pattern.focus} exotic armor`
    },
    
    mods: {
      helmet: template.armorModPlacements?.helmet || [`${pattern.focus} helmet mods`],
      arms: template.armorModPlacements?.arms || [`${pattern.focus} arms mods`],
      chest: template.armorModPlacements?.chest || [`${pattern.focus} chest mods`],
      legs: template.armorModPlacements?.legs || [`${pattern.focus} legs mods`],
      classItem: template.armorModPlacements?.classItem || [`${pattern.focus} class item mods`],
      combat: categorizedItems.mods.filter(mod => 
        mod.name.toLowerCase().includes('surge') || 
        mod.name.toLowerCase().includes('resist')).map(mod => mod.name),
      seasonal: categorizedItems.mods.filter(mod => 
        mod.name.toLowerCase().includes('artifact') ||
        mod.name.toLowerCase().includes('seasonal')).map(mod => mod.name)
    },
    
    stats: template.stats || {
      primary: `100 ${getStatForFocus(pattern.focus)}`,
      secondary: `80+ in synergy stats`,
      tertiary: `60+ in utility stats`
    },
    
    gameplay: {
      rotation: generateGameplayRotation(pattern.focus),
      tips: generateGameplayTips(pattern.focus, categorizedItems)
    }
  };
};

// Helper function to get primary stat for build focus
const getStatForFocus = (focus) => {
  const statMap = {
    'grenade': 'Discipline',
    'reload': 'Reload Speed', 
    'super': 'Intellect',
    'healing': 'Recovery',
    'stealth': 'Mobility',
    'melee': 'Strength'
  };
  return statMap[focus] || 'Discipline';
};

// Generate gameplay rotation
const generateGameplayRotation = (focus) => {
  const rotations = {
    'grenade': [
      '1. Throw grenade to trigger exotic/mod effects',
      '2. Use abilities to recharge grenade energy',
      '3. Collect elemental wells for energy',
      '4. Repeat grenade usage for constant area control'
    ],
    'reload': [
      '1. Empty magazine completely',
      '2. Use class ability or exotic effect to auto-reload',
      '3. Continue firing without manual reload',
      '4. Maintain constant damage output'
    ],
    'super': [
      '1. Generate orbs with weapon kills',
      '2. Use mods to convert other actions to super energy',
      '3. Cast super frequently for maximum uptime',
      '4. Create orbs for teammates'
    ],
    'healing': [
      '1. Use healing abilities to support team',
      '2. Position near allies for maximum effect',
      '3. Maintain wells/rifts for area healing',
      '4. Focus on survivability over damage'
    ],
    'stealth': [
      '1. Activate invisibility before engagements',
      '2. Use stealth for positioning and flanking',
      '3. Chain invisibility effects with kills',
      '4. Revive teammates safely while invisible'
    ],
    'melee': [
      '1. Close distance safely using abilities',
      '2. Use melee to trigger exotic effects',
      '3. Combo melee with weapons for max damage',
      '4. Use wells/mods to refresh melee energy'
    ]
  };
  return rotations[focus] || ['Use abilities synergistically', 'Focus on build strengths'];
};

// Generate gameplay tips
const generateGameplayTips = (focus, categorizedItems) => {
  const baseTips = {
    'grenade': [
      'Pre-cook grenades around corners',
      'Use grenade energy mods on all armor pieces',
      'Coordinate with teammates for maximum area denial'
    ],
    'reload': [
      'Never manually reload - always use auto-reload triggers',
      'Position near cover for rally barricade use',
      'Prioritize magazine size and reserves'
    ],
    'super': [
      'Generate orbs constantly with weapon kills',
      'Use super as soon as available for maximum uptime',
      'Coordinate super usage with team'
    ],
    'healing': [
      'Stay near teammates to maximize healing effects',
      'Use cover while maintaining healing uptime',
      'Prioritize team survival over personal damage'
    ],
    'stealth': [
      'Use invisibility proactively, not reactively',
      'Flank enemies while invisible for advantage',
      'Chain stealth effects with precision kills'
    ],
    'melee': [
      'Use ranged weapons to soften targets first',
      'Combo melee with one-two punch weapons',
      'Stay mobile to avoid taking damage in close range'
    ]
  };
  
  let tips = baseTips[focus] || ['Focus on synergy between abilities'];
  
  // Add exotic-specific tips
  if (categorizedItems.exoticArmor.length > 0) {
    tips.push(`Maximize ${categorizedItems.exoticArmor[0].name} exotic perk uptime`);
  }
  
  return tips;
};

// Generate playstyle info based on actual items
const generateDynamicPlaystyle = (pattern, categorizedItems) => {
  const focus = pattern.focus;
  
  const playstyle = {
    strengths: [],
    weaknesses: [],
    bestActivities: []
  };
  
  // Generate strengths based on focus and available items
  switch (focus) {
    case 'grenade':
      playstyle.strengths = ['Area damage', 'Add clearing', 'Ability uptime'];
      playstyle.weaknesses = ['Ability dependency', 'Single target limitations'];
      playstyle.bestActivities = ['Strikes', 'Lost Sectors', 'Patrol'];
      break;
    case 'reload':
      playstyle.strengths = ['Sustained damage', 'No downtime', 'Weapon efficiency'];
      playstyle.weaknesses = ['Ammo dependency', 'Limited versatility'];
      playstyle.bestActivities = ['Raids', 'Dungeons', 'Boss encounters'];
      break;
    case 'super':
      playstyle.strengths = ['High burst damage', 'Frequent ultimates', 'Orb generation'];
      playstyle.weaknesses = ['Neutral game dependency', 'Cooldown windows'];
      playstyle.bestActivities = ['Raids', 'Trials', 'Dungeons'];
      break;
    case 'healing':
      playstyle.strengths = ['Team support', 'Survivability', 'Sustainability'];
      playstyle.weaknesses = ['Lower damage output', 'Team dependency'];
      playstyle.bestActivities = ['Raids', 'Dungeons', 'Team activities'];
      break;
    case 'stealth':
      playstyle.strengths = ['Survivability', 'Positioning', 'Solo capability'];
      playstyle.weaknesses = ['Team utility', 'Damage windows'];
      playstyle.bestActivities = ['Solo content', 'Nightfalls', 'Trials'];
      break;
    case 'melee':
      playstyle.strengths = ['High damage potential', 'Ability synergy', 'Close combat'];
      playstyle.weaknesses = ['Range limitations', 'Risk vs reward'];
      playstyle.bestActivities = ['Strikes', 'Lost Sectors', 'Patrol'];
      break;
  }
  
  // Adjust based on available exotic items
  if (categorizedItems.exoticArmor.length > 0) {
    playstyle.strengths.push('Exotic synergy');
  }
  
  return playstyle;
};

// Main function to find builds using real Bungie data
export const findDynamicBuilds = (searchQuery, destinyData) => {
  // First, use your existing item search to get relevant items
  const parsedSearch = parseAdvancedSearch(searchQuery);
  const processedKeywords = processAdvancedKeywords(parsedSearch);
  const relevantItems = findAdvancedSynergisticItems(processedKeywords, destinyData);
  
  // Only analyze top synergistic items to avoid noise
  const topItems = relevantItems.slice(0, 30);
  
  // Analyze these items to create dynamic builds
  const builds = analyzeItemsForBuilds(topItems, searchQuery);
  
  return {
    builds,
    totalFound: builds.length,
    sourceItems: topItems.length,
    query: searchQuery
  };
};