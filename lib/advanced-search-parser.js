import { 
  ITEM_CATEGORIES, 
  TIER_TYPES, 
  UTILITY_FUNCTIONS, 
  CATEGORY_DETECTION 
} from './destiny-constants';

// Enhanced keyword mappings with hash-based references
export const ENHANCED_KEYWORD_MAPPINGS = {
  // Weapon types (mapped to actual category hashes)
  'auto rifle': { categories: ITEM_CATEGORIES.AUTO_RIFLE, type: 'weapon' },
  'hand cannon': { categories: ITEM_CATEGORIES.HAND_CANNON, type: 'weapon' },
  'pulse rifle': { categories: ITEM_CATEGORIES.PULSE_RIFLE, type: 'weapon' },
  'scout rifle': { categories: ITEM_CATEGORIES.SCOUT_RIFLE, type: 'weapon' },
  'fusion rifle': { categories: ITEM_CATEGORIES.FUSION_RIFLE, type: 'weapon' },
  'shotgun': { categories: ITEM_CATEGORIES.SHOTGUN, type: 'weapon' },
  'sniper': { categories: ITEM_CATEGORIES.SNIPER_RIFLE, type: 'weapon' },
  'rocket': { categories: ITEM_CATEGORIES.ROCKET_LAUNCHER, type: 'weapon' },
  'sword': { categories: ITEM_CATEGORIES.SWORD, type: 'weapon' },
  'bow': { categories: ITEM_CATEGORIES.BOW, type: 'weapon' },
  'sidearm': { categories: ITEM_CATEGORIES.SIDEARM, type: 'weapon' },
  'machine gun': { categories: ITEM_CATEGORIES.MACHINE_GUN, type: 'weapon' },
  'grenade launcher': { categories: ITEM_CATEGORIES.GRENADE_LAUNCHER, type: 'weapon' },
  'submachine gun': { categories: ITEM_CATEGORIES.SUBMACHINE_GUN, type: 'weapon' },
  'trace rifle': { categories: ITEM_CATEGORIES.TRACE_RIFLE, type: 'weapon' },
  'linear fusion': { categories: ITEM_CATEGORIES.LINEAR_FUSION_RIFLE, type: 'weapon' },

  // Armor types
  'helmet': { categories: ITEM_CATEGORIES.HELMET, type: 'armor' },
  'gauntlets': { categories: ITEM_CATEGORIES.GAUNTLETS, type: 'armor' },
  'chest': { categories: ITEM_CATEGORIES.CHEST_ARMOR, type: 'armor' },
  'legs': { categories: ITEM_CATEGORIES.LEG_ARMOR, type: 'armor' },
  'class item': { categories: ITEM_CATEGORIES.CLASS_ITEM, type: 'armor' },

  // Subclass elements
  'aspect': { categories: ITEM_CATEGORIES.ASPECTS, type: 'subclass' },
  'fragment': { categories: ITEM_CATEGORIES.FRAGMENTS, type: 'subclass' },
  'grenade': { categories: ITEM_CATEGORIES.GRENADES, type: 'ability' },
  'melee': { categories: ITEM_CATEGORIES.MELEE_ABILITIES, type: 'ability' },
  'super': { categories: ITEM_CATEGORIES.SUPERS, type: 'ability' },
  'class ability': { categories: ITEM_CATEGORIES.CLASS_ABILITIES, type: 'ability' },

  // Rarity/Tier
  'exotic': { tierType: TIER_TYPES.EXOTIC, type: 'rarity' },
  'legendary': { tierType: TIER_TYPES.LEGENDARY, type: 'rarity' },
  'rare': { tierType: TIER_TYPES.RARE, type: 'rarity' },

  // Damage types
  'arc': { damageType: 'Arc', type: 'damage' },
  'solar': { damageType: 'Solar', type: 'damage' },
  'void': { damageType: 'Void', type: 'damage' },
  'stasis': { damageType: 'Stasis', type: 'damage' },
  'strand': { damageType: 'Strand', type: 'damage' },
  'kinetic': { damageType: 'Kinetic', type: 'damage' },

  // Classes
  'titan': { classType: 0, type: 'class' },
  'hunter': { classType: 1, type: 'class' },
  'warlock': { classType: 2, type: 'class' },

  // Mod types
  'mod': { categories: ITEM_CATEGORIES.MODS, type: 'mod' },
  'armor mod': { categories: ITEM_CATEGORIES.ARMOR_MODS, type: 'mod' },
  'weapon mod': { categories: ITEM_CATEGORIES.WEAPON_MODS, type: 'mod' },

  // Consumables
  'material': { categories: ITEM_CATEGORIES.MATERIALS, type: 'consumable' },
  'currency': { categories: ITEM_CATEGORIES.CURRENCIES, type: 'consumable' },
  'consumable': { categories: ITEM_CATEGORIES.CONSUMABLES, type: 'consumable' },

  // Gameplay concepts (for build searching)
  'damage': { searchTerms: ['damage', 'hurt', 'harm', 'injury'], type: 'concept' },
  'reload': { searchTerms: ['reload', 'magazine', 'ammo'], type: 'concept' },
  'heal': { searchTerms: ['heal', 'health', 'recovery', 'restore'], type: 'concept' },
  'ability': { searchTerms: ['ability', 'skill', 'power'], type: 'concept' },
  'energy': { searchTerms: ['energy', 'charge', 'cooldown'], type: 'concept' },
  'stealth': { searchTerms: ['stealth', 'invisible', 'vanish', 'cloak'], type: 'concept' },
  'shield': { searchTerms: ['shield', 'barrier', 'protection'], type: 'concept' }
};

export const parseAdvancedSearch = (input) => {
  const result = {
    includeKeywords: [],
    excludeKeywords: [],
    exactPhrases: [],
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

  while ((match = searchPattern.exec(input)) !== null) {
    if (match[1]) {
      // Quoted phrase
      const phrase = match[1].toLowerCase();
      result.exactPhrases.push(phrase);
      processKeywordMapping(phrase, result);
    } else if (match[2]) {
      // Excluded term (starts with -)
      const excludedTerm = match[2].substring(1).toLowerCase();
      result.excludeKeywords.push(excludedTerm);
    } else if (match[3]) {
      // Regular term or phrase
      const term = match[3].toLowerCase();
      result.includeKeywords.push(term);
      processKeywordMapping(term, result);
    }
  }

  // Remove duplicates
  result.includeKeywords = [...new Set(result.includeKeywords)];
  result.excludeKeywords = [...new Set(result.excludeKeywords)];
  result.exactPhrases = [...new Set(result.exactPhrases)];
  result.conceptTerms = [...new Set(result.conceptTerms)];

  return result;
};

// Process keyword mappings and extract hash-based filters
const processKeywordMapping = (keyword, result) => {
  const mapping = ENHANCED_KEYWORD_MAPPINGS[keyword];
  
  if (mapping) {
    // Add category hashes
    if (mapping.categories) {
      result.hashFilters.categories.push(...mapping.categories);
    }
    
    // Add tier type
    if (mapping.tierType) {
      result.hashFilters.tierTypes.push(mapping.tierType);
    }
    
    // Add damage type
    if (mapping.damageType) {
      result.hashFilters.damageTypes.push(mapping.damageType);
    }
    
    // Add class type
    if (mapping.classType !== undefined) {
      result.hashFilters.classTypes.push(mapping.classType);
    }
    
    // Add concept terms
    if (mapping.searchTerms) {
      result.conceptTerms.push(...mapping.searchTerms);
    }
  }
  
  // Also check for partial matches in mapping keys
  Object.entries(ENHANCED_KEYWORD_MAPPINGS).forEach(([key, value]) => {
    if (key.includes(keyword) || keyword.includes(key)) {
      if (value.searchTerms) {
        result.conceptTerms.push(...value.searchTerms);
      }
    }
  });
};

// Enhanced item matching using hash-based filtering
export const findAdvancedSynergisticItems = (parsedSearch, destinyData) => {
  const results = [];
  const { inventoryItems } = destinyData;
  
  if (!inventoryItems) return results;

  Object.values(inventoryItems).forEach(item => {
    if (!item?.displayProperties?.name || !item.displayProperties?.description) {
      return;
    }
    
    const itemText = `${item.displayProperties.name} ${item.displayProperties.description}`.toLowerCase();
    
    // Check exclusions first
    const hasExcludedTerm = parsedSearch.excludeKeywords.some(excludeKeyword => 
      itemText.includes(excludeKeyword) || 
      !passesHashFilter(item, excludeKeyword, true)
    );
    
    if (hasExcludedTerm) {
      return;
    }
    
    // Calculate match score using multiple criteria
    let matchScore = 0;
    const matchReasons = [];
    
    // Hash-based filtering (highest priority)
    const hashMatches = calculateHashMatches(item, parsedSearch.hashFilters);
    matchScore += hashMatches.score;
    matchReasons.push(...hashMatches.reasons);
    
    // Exact phrase matching
    const exactPhraseMatches = parsedSearch.exactPhrases.filter(phrase => 
      itemText.includes(phrase)
    );
    matchScore += exactPhraseMatches.length * 25; // High weight for exact matches
    
    // Keyword matching
    const keywordMatches = parsedSearch.includeKeywords.filter(keyword => 
      itemText.includes(keyword)
    );
    matchScore += keywordMatches.length * 10;
    
    // Concept term matching
    const conceptMatches = parsedSearch.conceptTerms.filter(concept => 
      itemText.includes(concept)
    );
    matchScore += conceptMatches.length * 15;
    
    // Bonus for multiple match types
    const matchTypes = [
      hashMatches.reasons.length > 0,
      exactPhraseMatches.length > 0,
      keywordMatches.length > 0,
      conceptMatches.length > 0
    ].filter(Boolean).length;
    
    if (matchTypes > 1) {
      matchScore += matchTypes * 5;
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
        synergyScore: Math.min(Math.round(matchScore), 100),
        rarity: UTILITY_FUNCTIONS.getTierType(item),
        tierType: item.inventory?.tierType || 0,
        className: UTILITY_FUNCTIONS.getItemClass(item),
        damageType: UTILITY_FUNCTIONS.getDamageType(item),
        isExotic: UTILITY_FUNCTIONS.isExotic(item),
        bucketSlot: UTILITY_FUNCTIONS.getBucketSlotName(item.inventory?.bucketTypeHash)
      });
    }
  });
  
  // Sort by synergy score and then by rarity
  return results.sort((a, b) => {
    if (b.synergyScore !== a.synergyScore) {
      return b.synergyScore - a.synergyScore;
    }
    return b.tierType - a.tierType;
  });
};

// Calculate hash-based matches
const calculateHashMatches = (item, hashFilters) => {
  let score = 0;
  const reasons = [];
  
  // Category hash matching
  if (hashFilters.categories.length > 0) {
    const categoryMatches = hashFilters.categories.filter(category =>
      item.itemCategoryHashes?.includes(category)
    );
    if (categoryMatches.length > 0) {
      score += categoryMatches.length * 30; // High weight for exact category matches
      reasons.push(`Matches ${categoryMatches.length} category filter(s)`);
    }
  }
  
  // Tier type matching
  if (hashFilters.tierTypes.length > 0) {
    if (hashFilters.tierTypes.includes(item.inventory?.tierType)) {
      score += 20;
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

// Check if item passes hash-based filter
const passesHashFilter = (item, keyword, isExclusion = false) => {
  const mapping = ENHANCED_KEYWORD_MAPPINGS[keyword];
  if (!mapping) return true; // No filter to apply
  
  let passes = true;
  
  if (mapping.categories) {
    const hasCategory = mapping.categories.some(cat => 
      item.itemCategoryHashes?.includes(cat)
    );
    if (isExclusion) {
      passes = passes && !hasCategory;
    } else {
      passes = passes && hasCategory;
    }
  }
  
  if (mapping.tierType) {
    const hasTier = item.inventory?.tierType === mapping.tierType;
    if (isExclusion) {
      passes = passes && !hasTier;
    } else {
      passes = passes && hasTier;
    }
  }
  
  return passes;
};

// Determine item display type using hash-based detection
const determineItemDisplayType = (item) => {
  if (CATEGORY_DETECTION.isWeapon(item)) {
    if (UTILITY_FUNCTIONS.isExotic(item)) return 'Exotic Weapon';
    return 'Weapon';
  }
  
  if (CATEGORY_DETECTION.isArmor(item)) {
    if (UTILITY_FUNCTIONS.isExotic(item)) return 'Exotic Armor';
    return 'Armor';
  }
  
  if (CATEGORY_DETECTION.isMod(item)) return 'Mod';
  if (CATEGORY_DETECTION.isSubclass(item)) return 'Subclass';
  if (CATEGORY_DETECTION.isAspect(item)) return 'Aspect';
  if (CATEGORY_DETECTION.isFragment(item)) return 'Fragment';
  if (CATEGORY_DETECTION.isGrenade(item)) return 'Grenade';
  if (CATEGORY_DETECTION.isMelee(item)) return 'Melee';
  if (CATEGORY_DETECTION.isSuper(item)) return 'Super';
  if (CATEGORY_DETECTION.isConsumable(item)) return 'Consumable';
  if (CATEGORY_DETECTION.isCosmetic(item)) return 'Cosmetic';
  
  return item.itemTypeDisplayName || 'Unknown';
};

// Legacy support - process keywords for backwards compatibility
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
    hashFilters: parsedSearch.hashFilters
  };
};