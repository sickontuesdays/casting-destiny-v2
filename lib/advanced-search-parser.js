// CORRECTED advanced search parser with accurate Destiny 2 terminology
import { 
  ITEM_CATEGORIES, 
  TIER_TYPES, 
  UTILITY_FUNCTIONS, 
  CATEGORY_DETECTION,
  BUILD_ESSENTIAL_CATEGORIES 
} from './destiny-constants';

// IMPROVED keyword mappings based on actual Destiny 2 terminology
export const ENHANCED_KEYWORD_MAPPINGS = {
  // Build archetypes (most important)
  'grenade spam': { buildType: 'grenade', searchTerms: ['grenade', 'explosive', 'ordnance', 'discipline'], type: 'build' },
  'constant grenades': { buildType: 'grenade', searchTerms: ['grenade', 'energy', 'kickstart', 'bomber'], type: 'build' },
  'ability loop': { buildType: 'ability', searchTerms: ['ability', 'energy', 'well', 'elemental'], type: 'build' },
  'never reload': { buildType: 'weapon', searchTerms: ['reload', 'auto-loading', 'holster'], type: 'build' },
  'invisibility': { buildType: 'stealth', searchTerms: ['invisible', 'stealth', 'void', 'hunter'], type: 'build' },
  'void hunter': { buildType: 'stealth', searchTerms: ['void', 'hunter', 'invisible', 'smoke'], type: 'build' },
  'healing': { buildType: 'support', searchTerms: ['heal', 'well', 'restoration', 'solar'], type: 'build' },
  'support': { buildType: 'support', searchTerms: ['heal', 'team', 'well', 'rift'], type: 'build' },
  'super spam': { buildType: 'super', searchTerms: ['super', 'intellect', 'orbs', 'energy'], type: 'build' },
  'tank': { buildType: 'defense', searchTerms: ['resist', 'survivability', 'resilience'], type: 'build' },

  // Exotic armor (build anchors)
  'heart of inmost light': { categories: [20], tierType: TIER_TYPES.EXOTIC, type: 'exotic_armor' },
  'contraverse hold': { categories: [20], tierType: TIER_TYPES.EXOTIC, type: 'exotic_armor' },
  'armamentarium': { categories: [20], tierType: TIER_TYPES.EXOTIC, type: 'exotic_armor' },
  'phoenix protocol': { categories: [20], tierType: TIER_TYPES.EXOTIC, type: 'exotic_armor' },
  'orpheus rig': { categories: [20], tierType: TIER_TYPES.EXOTIC, type: 'exotic_armor' },
  'graviton forfeit': { categories: [20], tierType: TIER_TYPES.EXOTIC, type: 'exotic_armor' },
  'omnioculus': { categories: [20], tierType: TIER_TYPES.EXOTIC, type: 'exotic_armor' },
  'actium war rig': { categories: [20], tierType: TIER_TYPES.EXOTIC, type: 'exotic_armor' },
  'transversive steps': { categories: [20], tierType: TIER_TYPES.EXOTIC, type: 'exotic_armor' },

  // Exotic weapons
  'sunshot': { categories: [6], tierType: TIER_TYPES.EXOTIC, type: 'exotic_weapon' },
  'graviton lance': { categories: [7], tierType: TIER_TYPES.EXOTIC, type: 'exotic_weapon' },
  'trinity ghoul': { categories: [31], tierType: TIER_TYPES.EXOTIC, type: 'exotic_weapon' },
  'witherhoard': { categories: [153], tierType: TIER_TYPES.EXOTIC, type: 'exotic_weapon' },

  // Essential mods
  'grenade kickstart': { categories: [59], type: 'mod', searchTerms: ['grenade', 'kickstart'] },
  'bomber': { categories: [59], type: 'mod', searchTerms: ['bomber', 'grenade'] },
  'distribution': { categories: [59], type: 'mod', searchTerms: ['distribution', 'ability'] },
  'utility kickstart': { categories: [59], type: 'mod', searchTerms: ['utility', 'kickstart'] },
  'elemental ordnance': { categories: [59], type: 'mod', searchTerms: ['elemental', 'ordnance'] },
  'well of life': { categories: [59], type: 'mod', searchTerms: ['well', 'life'] },
  'font of might': { categories: [59], type: 'mod', searchTerms: ['font', 'might'] },

  // Subclass components
  'aspect': { categories: [3124752623], type: 'subclass_component' },
  'fragment': { categories: [3683254069], type: 'subclass_component' },
  'grenade': { categories: [23], type: 'ability' },
  'melee': { categories: [24], type: 'ability' },
  'super': { categories: [39], type: 'ability' },
  'class ability': { categories: [25], type: 'ability' },

  // Damage types for subclass filtering
  'arc': { damageType: 'Arc', type: 'damage' },
  'solar': { damageType: 'Solar', type: 'damage' },
  'void': { damageType: 'Void', type: 'damage' },
  'stasis': { damageType: 'Stasis', type: 'damage' },
  'strand': { damageType: 'Strand', type: 'damage' },

  // Classes
  'titan': { classType: 0, type: 'class' },
  'hunter': { classType: 1, type: 'class' },
  'warlock': { classType: 2, type: 'class' },

  // Weapon types
  'hand cannon': { categories: [6], type: 'weapon' },
  'auto rifle': { categories: [5], type: 'weapon' },
  'pulse rifle': { categories: [7], type: 'weapon' },
  'shotgun': { categories: [11], type: 'weapon' },
  'sniper': { categories: [10], type: 'weapon' },
  'fusion rifle': { categories: [9], type: 'weapon' },
  'rocket launcher': { categories: [13], type: 'weapon' },
  'sword': { categories: [54], type: 'weapon' },

  // Gameplay concepts
  'damage': { searchTerms: ['damage', 'hurt', 'dps'], type: 'concept' },
  'reload': { searchTerms: ['reload', 'magazine', 'auto-loading'], type: 'concept' },
  'energy': { searchTerms: ['energy', 'ability', 'cooldown'], type: 'concept' },
  'resist': { searchTerms: ['resist', 'damage', 'reduction'], type: 'concept' }
};

// IMPROVED search parsing with better build detection
export const parseAdvancedSearch = (input) => {
  const result = {
    includeKeywords: [],
    excludeKeywords: [],
    exactPhrases: [],
    buildTypes: [],
    hashFilters: {
      categories: [],
      tierTypes: [],
      damageTypes: [],
      classTypes: []
    },
    conceptTerms: [],
    originalInput: input.trim()
  };

  if (!input || input.trim().length === 0) {
    return result;
  }

  // Enhanced regex to handle quoted phrases and operators
  const searchPattern = /"([^"]+)"|(-\w+(?:\s+\w+)*)|(\w+(?:\s+\w+)*)/g;
  let match;

  // First pass: extract all terms
  const allTerms = [];
  while ((match = searchPattern.exec(input)) !== null) {
    if (match[1]) {
      // Quoted phrase
      const phrase = match[1].toLowerCase();
      result.exactPhrases.push(phrase);
      allTerms.push({ term: phrase, isExcluded: false, isPhrase: true });
    } else if (match[2]) {
      // Excluded term (starts with -)
      const excludedTerm = match[2].substring(1).toLowerCase();
      result.excludeKeywords.push(excludedTerm);
      allTerms.push({ term: excludedTerm, isExcluded: true, isPhrase: false });
    } else if (match[3]) {
      // Regular term or phrase
      const term = match[3].toLowerCase();
      result.includeKeywords.push(term);
      allTerms.push({ term: term, isExcluded: false, isPhrase: false });
    }
  }

  // Second pass: process keyword mappings and detect build types
  allTerms.forEach(({ term, isExcluded }) => {
    if (!isExcluded) {
      processKeywordMapping(term, result);
    }
  });

  // Remove duplicates
  result.includeKeywords = [...new Set(result.includeKeywords)];
  result.excludeKeywords = [...new Set(result.excludeKeywords)];
  result.exactPhrases = [...new Set(result.exactPhrases)];
  result.conceptTerms = [...new Set(result.conceptTerms)];
  result.buildTypes = [...new Set(result.buildTypes)];

  return result;
};

// IMPROVED keyword mapping processing
const processKeywordMapping = (keyword, result) => {
  // Check exact matches first
  const exactMapping = ENHANCED_KEYWORD_MAPPINGS[keyword];
  if (exactMapping) {
    applyMapping(exactMapping, result);
  }

  // Check partial matches for multi-word terms
  Object.entries(ENHANCED_KEYWORD_MAPPINGS).forEach(([key, mapping]) => {
    if (key.includes(keyword) || keyword.includes(key)) {
      applyMapping(mapping, result);
    }
  });
};

// Apply mapping to search result
const applyMapping = (mapping, result) => {
  if (mapping.buildType) {
    result.buildTypes.push(mapping.buildType);
  }
  
  if (mapping.categories) {
    result.hashFilters.categories.push(...mapping.categories);
  }
  
  if (mapping.tierType) {
    result.hashFilters.tierTypes.push(mapping.tierType);
  }
  
  if (mapping.damageType) {
    result.hashFilters.damageTypes.push(mapping.damageType);
  }
  
  if (mapping.classType !== undefined) {
    result.hashFilters.classTypes.push(mapping.classType);
  }
  
  if (mapping.searchTerms) {
    result.conceptTerms.push(...mapping.searchTerms);
  }
};

// IMPROVED item matching with build-focus
export const findAdvancedSynergisticItems = (parsedSearch, destinyData) => {
  const results = [];
  const { inventoryItems } = destinyData;
  
  if (!inventoryItems) return results;

  Object.values(inventoryItems).forEach(item => {
    if (!item?.displayProperties?.name || !item.displayProperties?.description) {
      return;
    }
    
    // Skip items that should be excluded (cosmetics, etc.)
    if (UTILITY_FUNCTIONS.shouldExclude && UTILITY_FUNCTIONS.shouldExclude(item)) {
      return;
    }
    
    const itemText = `${item.displayProperties.name} ${item.displayProperties.description}`.toLowerCase();
    
    // Check exclusions first
    const hasExcludedTerm = parsedSearch.excludeKeywords.some(excludeKeyword => 
      itemText.includes(excludeKeyword)
    );
    
    if (hasExcludedTerm) {
      return;
    }
    
    // Calculate match score with improved criteria
    let matchScore = 0;
    const matchReasons = [];
    
    // HIGHEST PRIORITY: Build-essential items
    if (UTILITY_FUNCTIONS.isBuildEssential && UTILITY_FUNCTIONS.isBuildEssential(item)) {
      matchScore += 40;
      matchReasons.push('Build essential item');
    }
    
    // HIGH PRIORITY: Hash-based filtering
    const hashMatches = calculateHashMatches(item, parsedSearch.hashFilters);
    matchScore += hashMatches.score;
    matchReasons.push(...hashMatches.reasons);
    
    // MEDIUM PRIORITY: Exact phrase matching
    const exactPhraseMatches = parsedSearch.exactPhrases.filter(phrase => 
      itemText.includes(phrase)
    );
    matchScore += exactPhraseMatches.length * 25;
    
    // LOWER PRIORITY: Keyword matching
    const keywordMatches = parsedSearch.includeKeywords.filter(keyword => 
      itemText.includes(keyword)
    );
    matchScore += keywordMatches.length * 10;
    
    // CONCEPT MATCHING: Related terms
    const conceptMatches = parsedSearch.conceptTerms.filter(concept => 
      itemText.includes(concept)
    );
    matchScore += conceptMatches.length * 15;
    
    // EXOTIC BONUS: Exotic items are crucial for builds
    if (UTILITY_FUNCTIONS.isExotic(item)) {
      matchScore += 30;
      matchReasons.push('Exotic item');
    }
    
    // BUILD TYPE BONUS: Items that match detected build types
    if (parsedSearch.buildTypes.length > 0) {
      const buildTypeMatches = parsedSearch.buildTypes.some(buildType => {
        return itemText.includes(buildType) || 
               (buildType === 'grenade' && itemText.includes('grenade')) ||
               (buildType === 'stealth' && itemText.includes('invisible')) ||
               (buildType === 'support' && itemText.includes('heal'));
      });
      
      if (buildTypeMatches) {
        matchScore += 20;
        matchReasons.push('Build type match');
      }
    }
    
    // Only include items with meaningful matches
    if (matchScore > 0) {
      results.push({
        hash: item.hash,
        name: item.displayProperties.name,
        description: item.displayProperties.description,
        type: determineItemDisplayType(item),
        icon: item.displayProperties.icon,
        matchedKeywords: keywordMatches,
        matchedPhrases: exactPhraseMatches,
        matchedConcepts: conceptMatches,
        hashMatchReasons: hashMatches.reasons,
        buildReasons: matchReasons,
        synergyScore: Math.min(Math.round(matchScore), 100),
        rarity: UTILITY_FUNCTIONS.getTierType(item),
        tierType: item.inventory?.tierType || 0,
        className: UTILITY_FUNCTIONS.getItemClass(item),
        damageType: UTILITY_FUNCTIONS.getDamageType(item),
        isExotic: UTILITY_FUNCTIONS.isExotic(item),
        bucketSlot: UTILITY_FUNCTIONS.getBucketSlotName(item.inventory?.bucketTypeHash),
        isBuildEssential: UTILITY_FUNCTIONS.isBuildEssential ? UTILITY_FUNCTIONS.isBuildEssential(item) : false
      });
    }
  });
  
  // Sort by synergy score, then by build importance, then by rarity
  return results.sort((a, b) => {
    // Prioritize build-essential items
    if (a.isBuildEssential && !b.isBuildEssential) return -1;
    if (!a.isBuildEssential && b.isBuildEssential) return 1;
    
    // Then by synergy score
    if (b.synergyScore !== a.synergyScore) {
      return b.synergyScore - a.synergyScore;
    }
    
    // Finally by rarity (exotics first)
    return b.tierType - a.tierType;
  });
};

// IMPROVED hash matching with focus on build components
const calculateHashMatches = (item, hashFilters) => {
  let score = 0;
  const reasons = [];
  
  // Category hash matching (highest weight for essential categories)
  if (hashFilters.categories.length > 0) {
    const categoryMatches = hashFilters.categories.filter(category =>
      item.itemCategoryHashes?.includes(category)
    );
    if (categoryMatches.length > 0) {
      // Higher weight for build-essential categories
      const weight = isBuildEssentialCategory(categoryMatches) ? 35 : 25;
      score += categoryMatches.length * weight;
      reasons.push(`Matches ${categoryMatches.length} category filter(s)`);
    }
  }
  
  // Tier type matching (exotics get higher weight)
  if (hashFilters.tierTypes.length > 0) {
    if (hashFilters.tierTypes.includes(item.inventory?.tierType)) {
      const weight = item.inventory?.tierType === TIER_TYPES.EXOTIC ? 25 : 15;
      score += weight;
      reasons.push(`Matches rarity filter`);
    }
  }
  
  // Damage type matching
  if (hashFilters.damageTypes.length > 0) {
    const itemDamageType = UTILITY_FUNCTIONS.getDamageType(item);
    if (hashFilters.damageTypes.includes(itemDamageType)) {
      score += 15;
      reasons.push(`Matches damage type filter`);
    }
  }
  
  // Class type matching
  if (hashFilters.classTypes.length > 0) {
    if (hashFilters.classTypes.includes(item.classType)) {
      score += 15;
      reasons.push(`Matches class filter`);
    }
  }
  
  return { score, reasons };
};

// Check if categories are build-essential
const isBuildEssentialCategory = (categories) => {
  const essentialCats = [
    ...BUILD_ESSENTIAL_CATEGORIES.EXOTIC_ARMOR,
    ...BUILD_ESSENTIAL_CATEGORIES.EXOTIC_WEAPONS,
    ...BUILD_ESSENTIAL_CATEGORIES.ASPECTS,
    ...BUILD_ESSENTIAL_CATEGORIES.FRAGMENTS,
    ...BUILD_ESSENTIAL_CATEGORIES.SUPERS,
    ...BUILD_ESSENTIAL_CATEGORIES.GRENADES,
    ...BUILD_ESSENTIAL_CATEGORIES.MELEE
  ];
  
  return categories.some(cat => essentialCats.includes(cat));
};

// IMPROVED item type determination
const determineItemDisplayType = (item) => {
  // Check build reason first (from our improved data fetcher)
  if (item.buildReason) {
    const reasonToType = {
      'exotic_armor': 'Exotic Armor',
      'exotic_weapon': 'Exotic Weapon',
      'aspect': 'Aspect',
      'fragment': 'Fragment',
      'grenade': 'Grenade',
      'melee': 'Melee',
      'super': 'Super',
      'class_ability': 'Class Ability',
      'mod': 'Mod'
    };
    
    if (reasonToType[item.buildReason]) {
      return reasonToType[item.buildReason];
    }
  }
  
  // Fallback to category detection
  if (CATEGORY_DETECTION.isWeapon(item)) {
    if (UTILITY_FUNCTIONS.isExotic(item)) return 'Exotic Weapon';
    return 'Weapon';
  }
  
  if (CATEGORY_DETECTION.isArmor(item)) {
    if (UTILITY_FUNCTIONS.isExotic(item)) return 'Exotic Armor';
    return 'Armor';
  }
  
  if (CATEGORY_DETECTION.isMod(item)) return 'Mod';
  if (CATEGORY_DETECTION.isAspect(item)) return 'Aspect';
  if (CATEGORY_DETECTION.isFragment(item)) return 'Fragment';
  if (CATEGORY_DETECTION.isGrenade(item)) return 'Grenade';
  if (CATEGORY_DETECTION.isMelee(item)) return 'Melee';
  if (CATEGORY_DETECTION.isSuper(item)) return 'Super';
  if (CATEGORY_DETECTION.isClassAbility(item)) return 'Class Ability';
  
  return item.itemTypeDisplayName || 'Unknown';
};

// Legacy support
export const processAdvancedKeywords = (parsedSearch) => {
  const allTerms = [
    ...parsedSearch.includeKeywords,
    ...parsedSearch.exactPhrases,
    ...parsedSearch.conceptTerms
  ];
  
  return {
    include: [...new Set(allTerms)],
    exclude: parsedSearch.excludeKeywords,
    exactPhrases: parsedSearch.exactPhrases,
    hashFilters: parsedSearch.hashFilters,
    buildTypes: parsedSearch.buildTypes
  };
};