// CORRECTED Destiny 2 Item Category Hashes based on actual Bungie API
export const ITEM_CATEGORIES = {
  // Weapons - Corrected based on Bungie API
  WEAPONS: [1],
  AUTO_RIFLE: [5],
  HAND_CANNON: [6], 
  PULSE_RIFLE: [7],
  SCOUT_RIFLE: [8],
  FUSION_RIFLE: [9],
  SNIPER_RIFLE: [10],
  SHOTGUN: [11],
  MACHINE_GUN: [12],
  ROCKET_LAUNCHER: [13],
  SIDEARM: [14],
  SWORD: [54],
  BOW: [31],
  TRACE_RIFLE: [33],
  LINEAR_FUSION_RIFLE: [22],
  GRENADE_LAUNCHER: [153],
  SUBMACHINE_GUN: [3954685534],
  
  // Armor - Corrected
  ARMOR: [20],
  HELMET: [45],
  GAUNTLETS: [46], 
  CHEST_ARMOR: [47],
  LEG_ARMOR: [48],
  CLASS_ITEM: [49],
  
  // Subclass Components - THESE ARE THE CRITICAL FIXES
  SUBCLASS: [21], // Subclass items
  ASPECTS: [3124752623], // Actual aspect category
  FRAGMENTS: [3683254069], // Actual fragment category  
  GRENADES: [23], // Grenade abilities
  MELEE_ABILITIES: [24], // Melee abilities
  CLASS_ABILITIES: [25], // Class abilities (barricade, dodge, rift)
  MOVEMENT_ABILITIES: [26], // Jump abilities
  SUPERS: [39], // Super abilities
  
  // Mods - Critical for builds
  MODS: [59], // General mods
  ARMOR_MODS: [4104513227], // Armor-specific mods
  WEAPON_MODS: [4104513228], // Weapon-specific mods
  GHOST_MODS: [4104513229], // Ghost mods
  
  // Consumables and Materials
  CONSUMABLES: [35],
  MATERIALS: [61], 
  CURRENCIES: [18],
  
  // Cosmetics (to filter OUT)
  EMBLEMS: [41],
  SHADERS: [42], 
  SHIPS: [43],
  SPARROWS: [44],
  ORNAMENTS: [81] // Weapon/armor ornaments to exclude
};

// CORRECTED Bucket Hashes (where items are equipped)
export const BUCKET_HASHES = {
  // Weapon Slots
  KINETIC_WEAPONS: 1498876634,
  ENERGY_WEAPONS: 2465295065, 
  POWER_WEAPONS: 953998645,
  
  // Armor Slots
  HELMET: 3448274439,
  GAUNTLETS: 3551918588,
  CHEST_ARMOR: 14239492,
  LEG_ARMOR: 20886954,
  CLASS_ITEM: 1585787867,
  
  // Subclass Slot - CRITICAL
  SUBCLASS: 3284755031,
  
  // Ghost and Vehicle
  GHOST: 4023194814,
  VEHICLE: 2025709351,
  SHIP: 284967655,
  EMBLEM: 4274335291
};

// Tier Types (Item Rarity)
export const TIER_TYPES = {
  BASIC: 2,
  COMMON: 3, 
  RARE: 4,
  LEGENDARY: 5,
  EXOTIC: 6
};

// Class Types
export const CLASS_TYPES = {
  0: 'Titan',
  1: 'Hunter', 
  2: 'Warlock',
  3: 'Unknown'
};

// CORRECTED Damage Types
export const DAMAGE_TYPES = {
  0: 'None',
  1: 'Kinetic',
  2: 'Arc', 
  3: 'Solar',
  4: 'Void',
  6: 'Stasis',
  7: 'Strand'
};

// Essential Build Components - What actually matters for builds
export const BUILD_ESSENTIAL_CATEGORIES = {
  // Core build components
  EXOTIC_ARMOR: [20], // + tierType === 6
  EXOTIC_WEAPONS: [1], // + tierType === 6
  ASPECTS: [3124752623],
  FRAGMENTS: [3683254069],
  SUPERS: [39],
  GRENADES: [23],
  MELEE: [24],
  CLASS_ABILITIES: [25],
  
  // Build enhancement
  ARMOR_MODS: [4104513227, 59],
  WEAPON_MODS: [4104513228, 59],
  
  // Filter OUT (cosmetics and irrelevant items)
  EXCLUDE: [41, 42, 43, 44, 81, 50, 51] // Emblems, shaders, ships, sparrows, ornaments, etc.
};

// Enhanced utility functions
export const UTILITY_FUNCTIONS = {
  // Check if item is essential for builds
  isBuildEssential: (item) => {
    if (!item?.itemCategoryHashes) return false;
    
    // Check if it's an exotic
    if (item.inventory?.tierType === TIER_TYPES.EXOTIC) {
      return UTILITY_FUNCTIONS.hasCategory(item, [...BUILD_ESSENTIAL_CATEGORIES.EXOTIC_ARMOR, ...BUILD_ESSENTIAL_CATEGORIES.EXOTIC_WEAPONS]);
    }
    
    // Check if it's a core build component
    const essentialCategories = [
      ...BUILD_ESSENTIAL_CATEGORIES.ASPECTS,
      ...BUILD_ESSENTIAL_CATEGORIES.FRAGMENTS,
      ...BUILD_ESSENTIAL_CATEGORIES.SUPERS,
      ...BUILD_ESSENTIAL_CATEGORIES.GRENADES,
      ...BUILD_ESSENTIAL_CATEGORIES.MELEE,
      ...BUILD_ESSENTIAL_CATEGORIES.CLASS_ABILITIES
    ];
    
    return UTILITY_FUNCTIONS.hasCategory(item, essentialCategories);
  },
  
  // Check if item should be excluded
  shouldExclude: (item) => {
    if (!item?.itemCategoryHashes) return false;
    return UTILITY_FUNCTIONS.hasCategory(item, BUILD_ESSENTIAL_CATEGORIES.EXCLUDE);
  },
  
  // Check if item matches any category
  hasCategory: (item, categories) => {
    if (!item?.itemCategoryHashes) return false;
    const categoryArray = Array.isArray(categories) ? categories : [categories];
    return item.itemCategoryHashes.some(hash => categoryArray.includes(hash));
  },
  
  // Get item class safely
  getItemClass: (item) => {
    if (item?.classType !== undefined) {
      return CLASS_TYPES[item.classType] || 'Unknown';
    }
    return 'Unknown';
  },
  
  // IMPROVED damage type detection
  getDamageType: (item) => {
    // Check damageType property first
    if (item?.damageType !== undefined && item.damageType !== 0) {
      return DAMAGE_TYPES[item.damageType] || 'None';
    }
    
    // Check defaultDamageType
    if (item?.defaultDamageType !== undefined && item.defaultDamageType !== 0) {
      return DAMAGE_TYPES[item.defaultDamageType] || 'None';
    }
    
    // Fallback to name parsing for subclass items
    if (item?.displayProperties?.name) {
      const name = item.displayProperties.name.toLowerCase();
      if (name.includes('arc')) return 'Arc';
      if (name.includes('solar')) return 'Solar'; 
      if (name.includes('void')) return 'Void';
      if (name.includes('stasis')) return 'Stasis';
      if (name.includes('strand')) return 'Strand';
    }
    
    return 'None';
  },
  
  // Get item tier safely
  getTierType: (item) => {
    const tierType = item?.inventory?.tierType;
    if (tierType) {
      return Object.entries(TIER_TYPES).find(([name, value]) => value === tierType)?.[0] || 'Unknown';
    }
    return 'Unknown';
  },
  
  // Check if item is exotic
  isExotic: (item) => {
    return item?.inventory?.tierType === TIER_TYPES.EXOTIC;
  },
  
  // IMPROVED: Check if item is a complete subclass
  isSubclass: (item) => {
    return UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.SUBCLASS);
  },
  
  // IMPROVED: Check if item is an aspect  
  isAspect: (item) => {
    return UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.ASPECTS) ||
           item?.displayProperties?.name?.toLowerCase().includes('aspect');
  },
  
  // IMPROVED: Check if item is a fragment
  isFragment: (item) => {
    return UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.FRAGMENTS) ||
           item?.displayProperties?.name?.toLowerCase().match(/fragment|echo of|whisper of|facet of/);
  },
  
  // Get bucket slot name
  getBucketSlotName: (bucketHash) => {
    return Object.entries(BUCKET_HASHES).find(([name, hash]) => hash === bucketHash)?.[0] || 'Unknown';
  }
};

// IMPROVED category detection
export const CATEGORY_DETECTION = {
  isWeapon: (item) => UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.WEAPONS),
  isArmor: (item) => UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.ARMOR),
  isMod: (item) => UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.MODS),
  isSubclass: (item) => UTILITY_FUNCTIONS.isSubclass(item),
  isAspect: (item) => UTILITY_FUNCTIONS.isAspect(item),
  isFragment: (item) => UTILITY_FUNCTIONS.isFragment(item),
  isGrenade: (item) => UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.GRENADES),
  isMelee: (item) => UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.MELEE_ABILITIES),
  isSuper: (item) => UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.SUPERS),
  isClassAbility: (item) => UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.CLASS_ABILITIES),
  isCosmetic: (item) => UTILITY_FUNCTIONS.shouldExclude(item),
  isBuildEssential: (item) => UTILITY_FUNCTIONS.isBuildEssential(item)
};