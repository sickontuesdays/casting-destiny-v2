// Item Category Hashes (from Bungie API)
export const ITEM_CATEGORIES = {
  // Weapons
  WEAPONS: [1],
  KINETIC_WEAPONS: [2],
  ENERGY_WEAPONS: [3], 
  POWER_WEAPONS: [4],
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
  
  // Armor
  ARMOR: [20],
  HELMET: [45],
  GAUNTLETS: [46],
  CHEST_ARMOR: [47], 
  LEG_ARMOR: [48],
  CLASS_ITEM: [49],
  
  // Subclass Items
  SUBCLASS: [21],
  ASPECTS: [3124752623],
  FRAGMENTS: [3683254069],
  
  // Abilities (these are inventory items)
  GRENADES: [23],
  MELEE_ABILITIES: [24],
  CLASS_ABILITIES: [25],
  MOVEMENT_ABILITIES: [26],
  SUPERS: [39],
  
  // Mods and Enhancements
  MODS: [59],
  ARMOR_MODS: [4104513227],
  WEAPON_MODS: [4104513228],
  GHOST_MODS: [4104513229],
  SEASONAL_ARTIFACT_MODS: [4104513230],
  
  // Other Items
  CONSUMABLES: [35],
  MATERIALS: [61],
  CURRENCIES: [18],
  EMBLEMS: [41],
  SHADERS: [42],
  SHIPS: [43],
  SPARROWS: [44],
  GHOST_SHELLS: [39],
  
  // Collectibles and Progression
  LORE: [3109687656],
  TRIUMPHS: [3163146113],
  
  // Quest and Bounty Items
  QUESTS: [53],
  BOUNTIES: [1784235469],
  
  // Seasonal Items
  SEASONAL_ARTIFACTS: [268598612],
  EVENT_ITEMS: [3109687656]
};

// Bucket Type Hashes (Equipment Slots)
export const BUCKET_HASHES = {
  // Weapons
  KINETIC_WEAPONS: 1498876634,
  ENERGY_WEAPONS: 2465295065,
  POWER_WEAPONS: 953998645,
  
  // Armor
  HELMET: 3448274439,
  GAUNTLETS: 3551918588,
  CHEST_ARMOR: 14239492,
  LEG_ARMOR: 20886954,
  CLASS_ITEM: 1585787867,
  
  // Other Equipment
  GHOST: 4023194814,
  VEHICLE: 2025709351,
  SHIP: 284967655,
  EMBLEM: 4274335291,
  
  // Inventory Spaces
  KINETIC_WEAPON_MODS: 3313201758,
  ENERGY_WEAPON_MODS: 3513791699,
  POWER_WEAPON_MODS: 2946476870,
  HELMET_MODS: 3876796314,
  GAUNTLETS_MODS: 3422420680,
  CHEST_ARMOR_MODS: 2685412382,
  LEG_ARMOR_MODS: 4023807067,
  CLASS_ITEM_MODS: 3681945176,
  
  // Consumables and Materials
  CONSUMABLES: 1469714392,
  MATERIALS: 3865314626,
  MODIFICATIONS: 3313201758
};

// Tier Types (Rarity)
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
  3: 'Unknown' // For items that can be used by any class
};

// Damage Types
export const DAMAGE_TYPES = {
  0: 'None',
  1: 'Kinetic', 
  2: 'Arc',
  3: 'Solar',
  4: 'Void',
  5: 'Raid', // Special damage type for raids
  6: 'Stasis',
  7: 'Strand'
};

// Ammo Types
export const AMMO_TYPES = {
  0: 'None',
  1: 'Primary',
  2: 'Special', 
  3: 'Heavy'
};

// Activity Types (for context)
export const ACTIVITY_TYPES = {
  STORY: 2043403989,
  STRIKE: 4110605575,
  RAID: 2659432250,
  DUNGEON: 608898761,
  PVP: 1164760504,
  GAMBIT: 1848252830,
  PATROL: 3497767639,
  SOCIAL: 40018287
};

// Season and Event Hashes (updated regularly)
export const SEASONAL_HASHES = {
  // These will need updates with new seasons
  CURRENT_SEASON: null, // To be determined dynamically
  CURRENT_ARTIFACT: null, // To be determined dynamically
  CURRENT_EVENT: null // To be determined dynamically
};

// Socket Category Hashes (for mod slots)
export const SOCKET_CATEGORIES = {
  WEAPON_PERKS: 4241085061,
  WEAPON_MODS: 2685412382,
  ARMOR_PERKS: 760375309,
  ARMOR_MODS: 590099826,
  ARMOR_TIER: 3154740035,
  GHOST_PERKS: 3379164649,
  VEHICLE_PERKS: 2278110604
};

// Progression Types
export const PROGRESSION_TYPES = {
  EXPERIENCE: 1716568313,
  VALOR: 3882308435,
  GLORY: 2679551909,
  INFAMY: 2772425241,
  SEASONAL_RANK: 1062449239,
  GUARDIAN_RANK: 2083746873
};

// Vendor Hashes (for context)
export const VENDOR_HASHES = {
  XUR: 2190858386,
  BANSHEE_44: 672118013,
  ADA_1: 350061650,
  SAINT_14: 765357505,
  SHAXX: 3603221665,
  ZAVALA: 69482069,
  IKORA: 1039003636,
  PETRA_VENJ: 1841717884
};

// Utility functions for working with these constants
export const UTILITY_FUNCTIONS = {
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
  
  // Get item damage type safely
  getDamageType: (item) => {
    if (item?.damageTypeHashes?.[0]) {
      return DAMAGE_TYPES[item.damageTypeHashes[0]] || 'Unknown';
    }
    if (item?.damageType) {
      return DAMAGE_TYPES[item.damageType] || 'Unknown';
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
  
  // Get bucket slot name
  getBucketSlotName: (bucketHash) => {
    return Object.entries(BUCKET_HASHES).find(([name, hash]) => hash === bucketHash)?.[0] || 'Unknown';
  }
};

// Future-proof category detection
export const CATEGORY_DETECTION = {
  isWeapon: (item) => UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.WEAPONS),
  isArmor: (item) => UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.ARMOR),
  isMod: (item) => UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.MODS),
  isConsumable: (item) => UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.CONSUMABLES),
  isSubclass: (item) => UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.SUBCLASS),
  isAspect: (item) => UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.ASPECTS),
  isFragment: (item) => UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.FRAGMENTS),
  isGrenade: (item) => UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.GRENADES),
  isMelee: (item) => UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.MELEE_ABILITIES),
  isClassAbility: (item) => UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.CLASS_ABILITIES),
  isSuper: (item) => UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.SUPERS),
  
  // Cosmetic items (to filter out)
  isCosmetic: (item) => {
    const cosmeticCategories = [
      ...ITEM_CATEGORIES.EMBLEMS,
      ...ITEM_CATEGORIES.SHADERS, 
      ...ITEM_CATEGORIES.SHIPS,
      ...ITEM_CATEGORIES.SPARROWS
    ];
    return UTILITY_FUNCTIONS.hasCategory(item, cosmeticCategories);
  }
};