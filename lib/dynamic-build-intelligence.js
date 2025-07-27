import { parseAdvancedSearch, processAdvancedKeywords, findAdvancedSynergisticItems } from './advanced-search-parser';

// Enhanced keyword patterns for better build detection
export const BUILD_PATTERNS = {
  // Grenade-focused builds
  grenade_builds: {
    keywords: ['grenade', 'explosive', 'ordnance', 'throw', 'blast'],
    phrases: ['constant grenades', 'grenade energy', 'grenade damage', 'infinite grenades'],
    required_synergies: ['grenade', 'energy', 'ability'],
    min_items: 3,
    focus: 'grenade'
  },
  
  // Reload/weapon builds  
  reload_builds: {
    keywords: ['reload', 'magazine', 'auto-loading', 'feeding', 'ammunition'],
    phrases: ['never reload', 'auto reload', 'continuous fire', 'infinite ammo'],
    required_synergies: ['reload', 'magazine', 'auto'],
    min_items: 2,
    focus: 'reload'
  },
  
  // Super builds
  super_builds: {
    keywords: ['super', 'ultimate', 'energy', 'intellect', 'orbs'],
    phrases: ['fast super', 'super energy', 'frequent super', 'quick ultimate'],
    required_synergies: ['super', 'energy'],
    min_items: 3,
    focus: 'super'
  },
  
  // Healing builds
  healing_builds: {
    keywords: ['healing', 'health', 'recovery', 'restoration', 'cure'],
    phrases: ['team heal', 'constant healing', 'support build'],
    required_synergies: ['heal', 'health', 'recovery'],
    min_items: 2,
    focus: 'healing'
  },
  
  // Stealth builds
  stealth_builds: {
    keywords: ['invisibility', 'stealth', 'vanish', 'cloak', 'hidden'],
    phrases: ['invisible hunter', 'stealth build', 'void hunter'],
    required_synergies: ['invisibility', 'stealth', 'void'],
    min_items: 2,
    focus: 'stealth'
  },
  
  // Melee builds
  melee_builds: {
    keywords: ['melee', 'punch', 'strike', 'martial', 'strength'],
    phrases: ['melee damage', 'punch build', 'martial arts'],
    required_synergies: ['melee', 'damage', 'strength'],
    min_items: 2,
    focus: 'melee'
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