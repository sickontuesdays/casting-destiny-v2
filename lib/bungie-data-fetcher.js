import { getManifestComponent } from './bungie-api';
import { 
  ITEM_CATEGORIES, 
  BUCKET_HASHES, 
  TIER_TYPES, 
  CLASS_TYPES, 
  DAMAGE_TYPES,
  UTILITY_FUNCTIONS,
  CATEGORY_DETECTION 
} from './destiny-constants';

// Fetch and organize all Destiny data using proper hash-based categorization
export const fetchAllDestinyData = async () => {
  try {
    console.log('Fetching comprehensive Destiny data with hash-based categorization...');
    
    // Get the main inventory items first
    const inventoryItems = await getManifestComponent('DestinyInventoryItemDefinition');
    console.log('Successfully fetched DestinyInventoryItemDefinition');
    
    // Fetch additional components with graceful fallbacks
    const componentPromises = [
      { name: 'socketCategories', promise: getManifestComponent('DestinySocketCategoryDefinition').catch(handleComponentError('DestinySocketCategoryDefinition')) },
      { name: 'socketTypes', promise: getManifestComponent('DestinySocketTypeDefinition').catch(handleComponentError('DestinySocketTypeDefinition')) },
      { name: 'plugSets', promise: getManifestComponent('DestinyPlugSetDefinition').catch(handleComponentError('DestinyPlugSetDefinition')) },
      { name: 'damageTypes', promise: getManifestComponent('DestinyDamageTypeDefinition').catch(handleComponentError('DestinyDamageTypeDefinition')) },
      { name: 'itemCategories', promise: getManifestComponent('DestinyItemCategoryDefinition').catch(handleComponentError('DestinyItemCategoryDefinition')) },
      { name: 'stats', promise: getManifestComponent('DestinyStatDefinition').catch(handleComponentError('DestinyStatDefinition')) },
      { name: 'progressions', promise: getManifestComponent('DestinyProgressionDefinition').catch(handleComponentError('DestinyProgressionDefinition')) },
      { name: 'collectibles', promise: getManifestComponent('DestinyCollectibleDefinition').catch(handleComponentError('DestinyCollectibleDefinition')) },
      { name: 'records', promise: getManifestComponent('DestinyRecordDefinition').catch(handleComponentError('DestinyRecordDefinition')) },
      { name: 'sandboxPerks', promise: getManifestComponent('DestinySandboxPerkDefinition').catch(handleComponentError('DestinySandboxPerkDefinition')) },
      { name: 'activities', promise: getManifestComponent('DestinyActivityDefinition').catch(handleComponentError('DestinyActivityDefinition')) },
      { name: 'seasons', promise: getManifestComponent('DestinySeasonDefinition').catch(handleComponentError('DestinySeasonDefinition')) },
      { name: 'vendors', promise: getManifestComponent('DestinyVendorDefinition').catch(handleComponentError('DestinyVendorDefinition')) },
      { name: 'places', promise: getManifestComponent('DestinyPlaceDefinition').catch(handleComponentError('DestinyPlaceDefinition')) }
    ];

    const results = await Promise.all(componentPromises.map(c => c.promise));
    
    const [
      socketCategories,
      socketTypes,
      plugSets,
      damageTypes,
      itemCategories,
      stats,
      progressions,
      collectibles,
      records,
      sandboxPerks,
      activities,
      seasons,
      vendors,
      places
    ] = results;

    console.log('Processing and categorizing data with hash-based identification...');

    // Organize data using proper hash-based categorization
    const organizedData = {
      // Subclass system (properly categorized)
      subclasses: organizeSubclassSystem(inventoryItems),
      
      // Weapons (by slot and type)
      weapons: organizeWeapons(inventoryItems),
      
      // Armor (by class and slot)
      armor: organizeArmor(inventoryItems),
      
      // Mods (by type and application)
      mods: organizeMods(inventoryItems),
      
      // Abilities (all types)
      abilities: organizeAbilities(inventoryItems),
      
      // Consumables and materials
      consumables: organizeConsumables(inventoryItems),
      
      // Collectibles
      collectibles: organizeCollectibles(inventoryItems),
      
      // Additional game data
      gameData: {
        stats: organizeStats(stats),
        activities: organizeActivities(activities),
        seasons: organizeSeasons(seasons),
        vendors: organizeVendors(vendors),
        places: organizePlaces(places)
      },
      
      // Metadata
      metadata: {
        totalItems: Object.keys(inventoryItems).length,
        lastUpdated: Date.now(),
        categories: generateCategoryBreakdown(inventoryItems)
      }
    };

    console.log('Data organization complete with hash-based categorization');
    return organizedData;

  } catch (error) {
    console.error('Error fetching Destiny data:', error);
    throw error;
  }
};

// Helper function for component error handling
const handleComponentError = (componentName) => (error) => {
  console.warn(`Failed to fetch ${componentName}:`, error.message);
  return {};
};

// SUBCLASS SYSTEM - Properly organized using hash-based identification
const organizeSubclassSystem = (inventoryItems) => {
  const subclassSystem = {
    Titan: initializeClassStructure(),
    Hunter: initializeClassStructure(), 
    Warlock: initializeClassStructure(),
    Universal: initializeClassStructure() // For cross-class items
  };

  Object.values(inventoryItems).forEach(item => {
    if (!item?.displayProperties?.name) return;
    
    const className = UTILITY_FUNCTIONS.getItemClass(item);
    const damageType = UTILITY_FUNCTIONS.getDamageType(item);
    
    // Categorize by item type using hash-based detection
    if (CATEGORY_DETECTION.isSubclass(item)) {
      addToSubclassCategory(subclassSystem, className, damageType, 'subclasses', item);
    } else if (CATEGORY_DETECTION.isAspect(item)) {
      addToSubclassCategory(subclassSystem, className, damageType, 'aspects', item);
    } else if (CATEGORY_DETECTION.isFragment(item)) {
      // Fragments are usually universal
      addToSubclassCategory(subclassSystem, 'Universal', damageType, 'fragments', item);
    } else if (CATEGORY_DETECTION.isGrenade(item)) {
      addToSubclassCategory(subclassSystem, className, damageType, 'grenades', item);
    } else if (CATEGORY_DETECTION.isMelee(item)) {
      addToSubclassCategory(subclassSystem, className, damageType, 'melees', item);
    } else if (CATEGORY_DETECTION.isClassAbility(item)) {
      addToSubclassCategory(subclassSystem, className, 'Universal', 'classAbilities', item);
    } else if (CATEGORY_DETECTION.isSuper(item)) {
      addToSubclassCategory(subclassSystem, className, damageType, 'supers', item);
    }
  });

  return subclassSystem;
};

const initializeClassStructure = () => ({
  Arc: { subclasses: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [], supers: [] },
  Solar: { subclasses: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [], supers: [] },
  Void: { subclasses: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [], supers: [] },
  Stasis: { subclasses: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [], supers: [] },
  Strand: { subclasses: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [], supers: [] },
  Universal: { subclasses: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [], supers: [] }
});

const addToSubclassCategory = (subclassSystem, className, damageType, category, item) => {
  // Ensure we have valid targets
  const targetClass = subclassSystem[className] || subclassSystem['Universal'];
  const targetDamageType = targetClass[damageType] || targetClass['Universal'];
  
  if (targetDamageType && targetDamageType[category]) {
    targetDamageType[category].push(createItemSummary(item));
  }
};

// WEAPONS - Organized by type and slot using bucket hashes
const organizeWeapons = (inventoryItems) => {
  const weapons = {
    kinetic: [],
    energy: [],
    power: [],
    byType: {
      autoRifle: [],
      handCannon: [],
      pulseRifle: [],
      scoutRifle: [],
      sidearm: [],
      submachineGun: [],
      bow: [],
      traceRifle: [],
      fusionRifle: [],
      shotgun: [],
      sniperRifle: [],
      linearFusionRifle: [],
      grenadeauncher: [],
      rocketLauncher: [],
      machineGun: [],
      sword: []
    }
  };

  Object.values(inventoryItems).forEach(item => {
    if (!CATEGORY_DETECTION.isWeapon(item)) return;
    if (!item?.displayProperties?.name) return;
    
    const bucketHash = item.inventory?.bucketTypeHash;
    const itemSummary = createItemSummary(item);
    
    // Categorize by slot
    if (bucketHash === BUCKET_HASHES.KINETIC_WEAPONS) {
      weapons.kinetic.push(itemSummary);
    } else if (bucketHash === BUCKET_HASHES.ENERGY_WEAPONS) {
      weapons.energy.push(itemSummary);
    } else if (bucketHash === BUCKET_HASHES.POWER_WEAPONS) {
      weapons.power.push(itemSummary);
    }
    
    // Categorize by weapon type using hash-based detection
    const weaponType = getWeaponType(item);
    if (weaponType && weapons.byType[weaponType]) {
      weapons.byType[weaponType].push(itemSummary);
    }
  });

  // Sort by rarity (Exotic first, then Legendary, etc.)
  Object.keys(weapons).forEach(key => {
    if (Array.isArray(weapons[key])) {
      weapons[key].sort((a, b) => b.tierType - a.tierType);
    }
  });

  Object.keys(weapons.byType).forEach(type => {
    weapons.byType[type].sort((a, b) => b.tierType - a.tierType);
  });

  return weapons;
};

// ARMOR - Organized by class and slot using bucket hashes  
const organizeArmor = (inventoryItems) => {
  const armor = {
    Titan: { helmet: [], gauntlets: [], chest: [], legs: [], classItem: [] },
    Hunter: { helmet: [], gauntlets: [], chest: [], legs: [], classItem: [] },
    Warlock: { helmet: [], gauntlets: [], chest: [], legs: [], classItem: [] }
  };

  Object.values(inventoryItems).forEach(item => {
    if (!CATEGORY_DETECTION.isArmor(item)) return;
    if (!item?.displayProperties?.name) return;
    
    const className = UTILITY_FUNCTIONS.getItemClass(item);
    const bucketHash = item.inventory?.bucketTypeHash;
    const slot = getArmorSlot(bucketHash);
    
    if (armor[className] && armor[className][slot]) {
      armor[className][slot].push(createItemSummary(item));
    }
  });

  // Sort each slot by rarity
  Object.keys(armor).forEach(className => {
    Object.keys(armor[className]).forEach(slot => {
      armor[className][slot].sort((a, b) => b.tierType - a.tierType);
    });
  });

  return armor;
};

// MODS - Organized by type and application
const organizeMods = (inventoryItems) => {
  const mods = {
    armor: {
      general: [],
      combat: [],
      elemental: [],
      seasonal: []
    },
    weapon: {
      general: [],
      damage: [],
      utility: []
    },
    ghost: [],
    artifact: []
  };

  Object.values(inventoryItems).forEach(item => {
    if (!CATEGORY_DETECTION.isMod(item)) return;
    if (!item?.displayProperties?.name) return;
    if (CATEGORY_DETECTION.isCosmetic(item)) return; // Filter out ornaments, etc.
    
    const itemSummary = createItemSummary(item);
    const modType = getModType(item);
    
    // Categorize mods by their application
    if (modType.startsWith('armor')) {
      const subType = getArmorModSubType(item);
      if (mods.armor[subType]) {
        mods.armor[subType].push(itemSummary);
      } else {
        mods.armor.general.push(itemSummary);
      }
    } else if (modType.startsWith('weapon')) {
      const subType = getWeaponModSubType(item);
      if (mods.weapon[subType]) {
        mods.weapon[subType].push(itemSummary);
      } else {
        mods.weapon.general.push(itemSummary);
      }
    } else if (modType === 'ghost') {
      mods.ghost.push(itemSummary);
    } else if (modType === 'artifact') {
      mods.artifact.push(itemSummary);
    }
  });

  return mods;
};

// ABILITIES - All ability types properly categorized
const organizeAbilities = (inventoryItems) => {
  const abilities = {
    grenades: [],
    melees: [],
    classAbilities: [],
    movement: [],
    supers: []
  };

  Object.values(inventoryItems).forEach(item => {
    if (!item?.displayProperties?.name) return;
    
    const itemSummary = createItemSummary(item);
    
    if (CATEGORY_DETECTION.isGrenade(item)) {
      abilities.grenades.push(itemSummary);
    } else if (CATEGORY_DETECTION.isMelee(item)) {
      abilities.melees.push(itemSummary);
    } else if (CATEGORY_DETECTION.isClassAbility(item)) {
      abilities.classAbilities.push(itemSummary);
    } else if (CATEGORY_DETECTION.isSuper(item)) {
      abilities.supers.push(itemSummary);
    }
  });

  return abilities;
};

// CONSUMABLES - Materials, currencies, etc.
const organizeConsumables = (inventoryItems) => {
  const consumables = {
    materials: [],
    currencies: [],
    consumables: [],
    quests: [],
    bounties: []
  };

  Object.values(inventoryItems).forEach(item => {
    if (!item?.displayProperties?.name) return;
    
    const itemSummary = createItemSummary(item);
    
    if (UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.MATERIALS)) {
      consumables.materials.push(itemSummary);
    } else if (UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.CURRENCIES)) {
      consumables.currencies.push(itemSummary);
    } else if (UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.CONSUMABLES)) {
      consumables.consumables.push(itemSummary);
    } else if (UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.QUESTS)) {
      consumables.quests.push(itemSummary);
    } else if (UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.BOUNTIES)) {
      consumables.bounties.push(itemSummary);
    }
  });

  return consumables;
};

// COLLECTIBLES - Cosmetics and collection items
const organizeCollectibles = (inventoryItems) => {
  const collectibles = {
    emblems: [],
    shaders: [],
    ships: [],
    sparrows: [],
    ghostShells: [],
    emotes: [],
    finishers: []
  };

  Object.values(inventoryItems).forEach(item => {
    if (!item?.displayProperties?.name) return;
    
    const itemSummary = createItemSummary(item);
    
    if (UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.EMBLEMS)) {
      collectibles.emblems.push(itemSummary);
    } else if (UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.SHADERS)) {
      collectibles.shaders.push(itemSummary);
    } else if (UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.SHIPS)) {
      collectibles.ships.push(itemSummary);
    } else if (UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.SPARROWS)) {
      collectibles.sparrows.push(itemSummary);
    } else if (UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.GHOST_SHELLS)) {
      collectibles.ghostShells.push(itemSummary);
    }
  });

  return collectibles;
};

// UTILITY FUNCTIONS

// Create standardized item summary
const createItemSummary = (item) => ({
  hash: item.hash,
  name: item.displayProperties?.name || 'Unknown',
  description: item.displayProperties?.description || '',
  icon: item.displayProperties?.icon || '',
  tierType: item.inventory?.tierType || 0,
  tierTypeName: UTILITY_FUNCTIONS.getTierType(item),
  classType: item.classType,
  className: UTILITY_FUNCTIONS.getItemClass(item),
  damageType: UTILITY_FUNCTIONS.getDamageType(item),
  bucketTypeHash: item.inventory?.bucketTypeHash,
  itemCategoryHashes: item.itemCategoryHashes || [],
  isExotic: UTILITY_FUNCTIONS.isExotic(item),
  itemTypeDisplayName: item.itemTypeDisplayName || ''
});

// Get weapon type using hash-based detection
const getWeaponType = (item) => {
  const categoryHashes = item.itemCategoryHashes || [];
  
  if (categoryHashes.includes(ITEM_CATEGORIES.AUTO_RIFLE[0])) return 'autoRifle';
  if (categoryHashes.includes(ITEM_CATEGORIES.HAND_CANNON[0])) return 'handCannon';
  if (categoryHashes.includes(ITEM_CATEGORIES.PULSE_RIFLE[0])) return 'pulseRifle';
  if (categoryHashes.includes(ITEM_CATEGORIES.SCOUT_RIFLE[0])) return 'scoutRifle';
  if (categoryHashes.includes(ITEM_CATEGORIES.SIDEARM[0])) return 'sidearm';
  if (categoryHashes.includes(ITEM_CATEGORIES.SUBMACHINE_GUN[0])) return 'submachineGun';
  if (categoryHashes.includes(ITEM_CATEGORIES.BOW[0])) return 'bow';
  if (categoryHashes.includes(ITEM_CATEGORIES.TRACE_RIFLE[0])) return 'traceRifle';
  if (categoryHashes.includes(ITEM_CATEGORIES.FUSION_RIFLE[0])) return 'fusionRifle';
  if (categoryHashes.includes(ITEM_CATEGORIES.SHOTGUN[0])) return 'shotgun';
  if (categoryHashes.includes(ITEM_CATEGORIES.SNIPER_RIFLE[0])) return 'sniperRifle';
  if (categoryHashes.includes(ITEM_CATEGORIES.LINEAR_FUSION_RIFLE[0])) return 'linearFusionRifle';
  if (categoryHashes.includes(ITEM_CATEGORIES.GRENADE_LAUNCHER[0])) return 'grenadeLauncher';
  if (categoryHashes.includes(ITEM_CATEGORIES.ROCKET_LAUNCHER[0])) return 'rocketLauncher';
  if (categoryHashes.includes(ITEM_CATEGORIES.MACHINE_GUN[0])) return 'machineGun';
  if (categoryHashes.includes(ITEM_CATEGORIES.SWORD[0])) return 'sword';
  
  return 'unknown';
};

// Get armor slot using bucket hash
const getArmorSlot = (bucketHash) => {
  switch (bucketHash) {
    case BUCKET_HASHES.HELMET: return 'helmet';
    case BUCKET_HASHES.GAUNTLETS: return 'gauntlets';
    case BUCKET_HASHES.CHEST_ARMOR: return 'chest';
    case BUCKET_HASHES.LEG_ARMOR: return 'legs';
    case BUCKET_HASHES.CLASS_ITEM: return 'classItem';
    default: return 'unknown';
  }
};

// Get mod type using hash-based detection
const getModType = (item) => {
  const categoryHashes = item.itemCategoryHashes || [];
  const name = item.displayProperties?.name?.toLowerCase() || '';
  const description = item.displayProperties?.description?.toLowerCase() || '';
  
  // Check for armor mods
  if (categoryHashes.includes(ITEM_CATEGORIES.ARMOR_MODS[0]) || 
      name.includes('armor') || description.includes('armor')) {
    return 'armor';
  }
  
  // Check for weapon mods  
  if (categoryHashes.includes(ITEM_CATEGORIES.WEAPON_MODS[0]) ||
      name.includes('weapon') || description.includes('weapon')) {
    return 'weapon';
  }
  
  // Check for ghost mods
  if (categoryHashes.includes(ITEM_CATEGORIES.GHOST_MODS[0]) ||
      name.includes('ghost') || description.includes('ghost')) {
    return 'ghost';
  }
  
  // Check for seasonal artifact mods
  if (categoryHashes.includes(ITEM_CATEGORIES.SEASONAL_ARTIFACT_MODS[0]) ||
      description.includes('artifact') || description.includes('seasonal')) {
    return 'artifact';
  }
  
  return 'general';
};

// Get armor mod subtype
const getArmorModSubType = (item) => {
  const name = item.displayProperties?.name?.toLowerCase() || '';
  const description = item.displayProperties?.description?.toLowerCase() || '';
  
  // Combat mods (damage, resistance)
  if (name.includes('resistance') || name.includes('damage') || 
      name.includes('surge') || name.includes('resist')) {
    return 'combat';
  }
  
  // Elemental well mods
  if (name.includes('well') || name.includes('elemental') ||
      description.includes('elemental well')) {
    return 'elemental';
  }
  
  // Seasonal mods
  if (description.includes('seasonal') || description.includes('artifact')) {
    return 'seasonal';
  }
  
  return 'general';
};

// Get weapon mod subtype
const getWeaponModSubType = (item) => {
  const name = item.displayProperties?.name?.toLowerCase() || '';
  const description = item.displayProperties?.description?.toLowerCase() || '';
  
  // Damage mods
  if (name.includes('damage') || name.includes('spec') || 
      name.includes('boss') || name.includes('major')) {
    return 'damage';
  }
  
  // Utility mods (reload, handling, etc.)
  if (name.includes('reload') || name.includes('handling') ||
      name.includes('magazine') || name.includes('backup')) {
    return 'utility';
  }
  
  return 'general';
};

// Additional game data organizers
const organizeStats = (stats) => {
  if (!stats || typeof stats !== 'object') return [];
  
  return Object.values(stats)
    .filter(stat => stat?.displayProperties?.name)
    .map(stat => ({
      hash: stat.hash,
      name: stat.displayProperties.name,
      description: stat.displayProperties.description || '',
      icon: stat.displayProperties.icon || ''
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

const organizeActivities = (activities) => {
  if (!activities || typeof activities !== 'object') return [];
  
  return Object.values(activities)
    .filter(activity => activity?.displayProperties?.name)
    .map(activity => ({
      hash: activity.hash,
      name: activity.displayProperties.name,
      description: activity.displayProperties.description || '',
      icon: activity.displayProperties.icon || '',
      activityTypeHash: activity.activityTypeHash,
      destinationHash: activity.destinationHash,
      placeHash: activity.placeHash
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

const organizeSeasons = (seasons) => {
  if (!seasons || typeof seasons !== 'object') return [];
  
  return Object.values(seasons)
    .filter(season => season?.displayProperties?.name)
    .map(season => ({
      hash: season.hash,
      name: season.displayProperties.name,
      description: season.displayProperties.description || '',
      seasonNumber: season.seasonNumber,
      startDate: season.startDate,
      endDate: season.endDate
    }))
    .sort((a, b) => (b.seasonNumber || 0) - (a.seasonNumber || 0));
};

const organizeVendors = (vendors) => {
  if (!vendors || typeof vendors !== 'object') return [];
  
  return Object.values(vendors)
    .filter(vendor => vendor?.displayProperties?.name)
    .map(vendor => ({
      hash: vendor.hash,
      name: vendor.displayProperties.name,
      description: vendor.displayProperties.description || '',
      icon: vendor.displayProperties.icon || '',
      vendorLocationHash: vendor.vendorLocationHash
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

const organizePlaces = (places) => {
  if (!places || typeof places !== 'object') return [];
  
  return Object.values(places)
    .filter(place => place?.displayProperties?.name)
    .map(place => ({
      hash: place.hash,
      name: place.displayProperties.name,
      description: place.displayProperties.description || '',
      icon: place.displayProperties.icon || ''
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

// Generate category breakdown for metadata
const generateCategoryBreakdown = (inventoryItems) => {
  const breakdown = {
    weapons: 0,
    armor: 0,
    mods: 0,
    consumables: 0,
    subclassItems: 0,
    cosmetics: 0,
    other: 0
  };

  Object.values(inventoryItems).forEach(item => {
    if (!item?.displayProperties?.name) return;
    
    if (CATEGORY_DETECTION.isWeapon(item)) {
      breakdown.weapons++;
    } else if (CATEGORY_DETECTION.isArmor(item)) {
      breakdown.armor++;
    } else if (CATEGORY_DETECTION.isMod(item)) {
      breakdown.mods++;
    } else if (CATEGORY_DETECTION.isConsumable(item)) {
      breakdown.consumables++;
    } else if (CATEGORY_DETECTION.isSubclass(item) || CATEGORY_DETECTION.isAspect(item) || 
               CATEGORY_DETECTION.isFragment(item)) {
      breakdown.subclassItems++;
    } else if (CATEGORY_DETECTION.isCosmetic(item)) {
      breakdown.cosmetics++;
    } else {
      breakdown.other++;
    }
  });

  return breakdown;
};