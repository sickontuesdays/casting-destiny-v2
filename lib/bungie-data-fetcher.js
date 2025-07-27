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

// Debug enhanced data fetcher
export const fetchAllDestinyData = async () => {
  try {
    console.log('Fetching essential Destiny data with debug logging...');
    
    const inventoryItems = await getManifestComponent('DestinyInventoryItemDefinition');
    console.log('Raw inventory items count:', Object.keys(inventoryItems).length);
    
    // Debug: Sample some items to understand structure
    const sampleItems = Object.values(inventoryItems).slice(0, 10);
    console.log('Sample items structure:', sampleItems.map(item => ({
      name: item.displayProperties?.name,
      categories: item.itemCategoryHashes,
      tierType: item.inventory?.tierType,
      classType: item.classType,
      damageType: item.damageType,
      damageTypeHashes: item.damageTypeHashes
    })));

    // Filter essential items with debug logging
    const filteredItems = filterEssentialItemsDebug(inventoryItems);
    console.log(`Filtered from ${Object.keys(inventoryItems).length} to ${Object.keys(filteredItems).length} essential items`);

    // Organize data with debug logging
    const organizedData = {
      classes: organizeClassDataDebug(filteredItems),
      exotics: organizeExoticsDebug(filteredItems),
      weapons: organizeWeaponsSampleDebug(filteredItems),
      armor: organizeArmorSampleDebug(filteredItems),
      mods: organizeModsSampleDebug(filteredItems),
      artifacts: organizeArtifactsDebug(filteredItems),
      other: organizeOtherItemsDebug(filteredItems),
      metadata: {
        totalOriginalItems: Object.keys(inventoryItems).length,
        totalFilteredItems: Object.keys(filteredItems).length,
        lastUpdated: Date.now(),
        version: '2.1-debug'
      }
    };

    // Debug log organized data counts
    console.log('Organized data summary:', {
      classes: Object.keys(organizedData.classes).length,
      exoticArmor: Object.values(organizedData.exotics.armor).reduce((total, items) => total + items.length, 0),
      exoticWeapons: Object.values(organizedData.exotics.weapons).reduce((total, items) => total + items.length, 0),
      artifacts: organizedData.artifacts.length
    });

    return organizedData;

  } catch (error) {
    console.error('Error fetching Destiny data:', error);
    throw error;
  }
};

// Enhanced filtering with better detection logic
const filterEssentialItemsDebug = (inventoryItems) => {
  const essentialItems = {};
  let counts = {
    exotics: 0,
    subclass: 0,
    aspects: 0,
    fragments: 0,
    grenades: 0,
    melees: 0,
    supers: 0,
    mods: 0,
    weapons: 0,
    armor: 0
  };
  
  Object.entries(inventoryItems).forEach(([hash, item]) => {
    if (!item?.displayProperties?.name) return;
    
    let isEssential = false;
    let reason = '';
    
    // Check if exotic (highest priority)
    if (UTILITY_FUNCTIONS.isExotic(item)) {
      isEssential = true;
      reason = 'exotic';
      counts.exotics++;
    }
    
    // Check subclass items using proper category detection
    else if (item.itemCategoryHashes?.includes(21)) { // Subclass category
      isEssential = true;
      reason = 'subclass';
      counts.subclass++;
    }
    
    // Aspects - check multiple possible hashes
    else if (item.itemCategoryHashes?.some(hash => [3124752623, 1469714392].includes(hash)) ||
             item.displayProperties.name.toLowerCase().includes('aspect')) {
      isEssential = true;
      reason = 'aspect';
      counts.aspects++;
    }
    
    // Fragments - broader detection
    else if (item.itemCategoryHashes?.some(hash => [3683254069, 1469714392].includes(hash)) ||
             item.displayProperties.name.toLowerCase().match(/fragment|echo of|whisper of|facet of/)) {
      isEssential = true;
      reason = 'fragment';
      counts.fragments++;
    }
    
    // Grenades
    else if (item.itemCategoryHashes?.includes(23) ||
             item.displayProperties.name.toLowerCase().includes('grenade')) {
      isEssential = true;
      reason = 'grenade';
      counts.grenades++;
    }
    
    // Melees
    else if (item.itemCategoryHashes?.includes(24) ||
             item.displayProperties.name.toLowerCase().match(/melee|punch|strike/)) {
      isEssential = true;
      reason = 'melee';
      counts.melees++;
    }
    
    // Supers
    else if (item.itemCategoryHashes?.includes(39) ||
             item.displayProperties.name.toLowerCase().match(/super|nova bomb|golden gun|fist of havoc|ward of dawn/)) {
      isEssential = true;
      reason = 'super';
      counts.supers++;
    }
    
    // Mods (but not cosmetics) - be more selective
    else if (item.itemCategoryHashes?.includes(59) && 
             !item.itemCategoryHashes?.some(hash => [41, 42, 43, 44].includes(hash)) &&
             !item.displayProperties.name.toLowerCase().match(/ornament|shader|emblem/)) {
      isEssential = true;
      reason = 'mod';
      counts.mods++;
    }
    
    // High-tier weapons (Legendary+)
    else if (CATEGORY_DETECTION.isWeapon(item) && 
             item.inventory?.tierType >= TIER_TYPES.LEGENDARY) {
      isEssential = true;
      reason = 'weapon';
      counts.weapons++;
    }
    
    // High-tier armor (Legendary+)
    else if (CATEGORY_DETECTION.isArmor(item) && 
             item.inventory?.tierType >= TIER_TYPES.LEGENDARY) {
      isEssential = true;
      reason = 'armor';
      counts.armor++;
    }
    
    if (isEssential) {
      essentialItems[hash] = { ...item, debugReason: reason };
    }
  });
  
  console.log('Filter counts:', counts);
  return essentialItems;
};

// Enhanced class data organization with proper damage type detection
const organizeClassDataDebug = (inventoryItems) => {
  const classData = {
    Titan: initializeClassStructure(),
    Hunter: initializeClassStructure(),
    Warlock: initializeClassStructure()
  };

  let addedItems = 0;

  Object.values(inventoryItems).forEach(item => {
    if (!item?.displayProperties?.name) return;
    
    // Determine class with fallback logic
    let className = 'Unknown';
    if (item.classType === 0) className = 'Titan';
    else if (item.classType === 1) className = 'Hunter';
    else if (item.classType === 2) className = 'Warlock';
    else if (item.classType === 3) className = 'Unknown'; // Universal items
    
    // For universal items, add to all classes
    const targetClasses = className === 'Unknown' ? ['Titan', 'Hunter', 'Warlock'] : [className];
    
    // Determine damage type with enhanced detection
    let damageType = getDamageTypeEnhanced(item);
    
    targetClasses.forEach(targetClass => {
      if (!classData[targetClass]) return;
      
      const itemSummary = createLightweightItemSummary(item);
      
      // Categorize by item type with improved detection
      if (item.debugReason === 'super' || item.itemCategoryHashes?.includes(39)) {
        if (!classData[targetClass][damageType]) classData[targetClass][damageType] = initializeDamageTypeStructure();
        classData[targetClass][damageType].supers.push(itemSummary);
        addedItems++;
      } else if (item.debugReason === 'aspect' || item.displayProperties.name.toLowerCase().includes('aspect')) {
        if (!classData[targetClass][damageType]) classData[targetClass][damageType] = initializeDamageTypeStructure();
        classData[targetClass][damageType].aspects.push(itemSummary);
        addedItems++;
      } else if (item.debugReason === 'fragment') {
        // Add fragments to all damage types since they're universal
        Object.keys(classData[targetClass]).forEach(dt => {
          if (!classData[targetClass][dt].fragments.some(f => f.hash === item.hash)) {
            classData[targetClass][dt].fragments.push(itemSummary);
          }
        });
        addedItems++;
      } else if (item.debugReason === 'grenade') {
        if (!classData[targetClass][damageType]) classData[targetClass][damageType] = initializeDamageTypeStructure();
        classData[targetClass][damageType].grenades.push(itemSummary);
        addedItems++;
      } else if (item.debugReason === 'melee') {
        if (!classData[targetClass][damageType]) classData[targetClass][damageType] = initializeDamageTypeStructure();
        classData[targetClass][damageType].melees.push(itemSummary);
        addedItems++;
      }
    });
  });

  console.log(`Added ${addedItems} items to class data`);
  return classData;
};

// Enhanced damage type detection
const getDamageTypeEnhanced = (item) => {
  // Check damageType property first
  if (item.damageType) {
    const damageTypeNames = {
      1: 'Kinetic',
      2: 'Arc', 
      3: 'Solar',
      4: 'Void',
      6: 'Stasis',
      7: 'Strand'
    };
    if (damageTypeNames[item.damageType]) {
      return damageTypeNames[item.damageType];
    }
  }
  
  // Check damageTypeHashes
  if (item.damageTypeHashes?.length > 0) {
    const damageHash = item.damageTypeHashes[0];
    if (damageHash === 2) return 'Arc';
    if (damageHash === 3) return 'Solar';
    if (damageHash === 4) return 'Void';
    if (damageHash === 6) return 'Stasis';
    if (damageHash === 7) return 'Strand';
  }
  
  // Check item name for damage type keywords
  const name = item.displayProperties.name.toLowerCase();
  if (name.includes('arc')) return 'Arc';
  if (name.includes('solar')) return 'Solar';
  if (name.includes('void')) return 'Void';
  if (name.includes('stasis')) return 'Stasis';
  if (name.includes('strand')) return 'Strand';
  
  // Default fallback
  return 'Void'; // Most common subclass type
};

const initializeClassStructure = () => ({
  Arc: initializeDamageTypeStructure(),
  Solar: initializeDamageTypeStructure(),
  Void: initializeDamageTypeStructure(),
  Stasis: initializeDamageTypeStructure(),
  Strand: initializeDamageTypeStructure()
});

const initializeDamageTypeStructure = () => ({
  supers: [],
  aspects: [],
  fragments: [],
  grenades: [],
  melees: [],
  classAbilities: [],
  movement: []
});

// Enhanced exotic organization with proper damage type detection
const organizeExoticsDebug = (inventoryItems) => {
  const exotics = {
    armor: { Titan: [], Hunter: [], Warlock: [] },
    weapons: { kinetic: [], energy: [], power: [] }
  };

  let exoticCount = 0;

  Object.values(inventoryItems).forEach(item => {
    if (!UTILITY_FUNCTIONS.isExotic(item)) return;
    if (!item?.displayProperties?.name) return;
    
    const itemSummary = createLightweightItemSummary(item);
    exoticCount++;
    
    if (CATEGORY_DETECTION.isArmor(item)) {
      const className = UTILITY_FUNCTIONS.getItemClass(item);
      if (exotics.armor[className]) {
        exotics.armor[className].push(itemSummary);
      }
    } else if (CATEGORY_DETECTION.isWeapon(item)) {
      const bucketHash = item.inventory?.bucketTypeHash;
      let slot = 'kinetic';
      
      if (bucketHash === BUCKET_HASHES.ENERGY_WEAPONS) slot = 'energy';
      else if (bucketHash === BUCKET_HASHES.POWER_WEAPONS) slot = 'power';
      
      exotics.weapons[slot].push(itemSummary);
    }
  });

  console.log(`Found ${exoticCount} exotic items`);
  return exotics;
};

// Weapons with proper limits
const organizeWeaponsSampleDebug = (inventoryItems) => {
  const weapons = { kinetic: [], energy: [], power: [] };
  const maxPerSlot = 10; // Reduced limit
  
  Object.values(inventoryItems).forEach(item => {
    if (!CATEGORY_DETECTION.isWeapon(item)) return;
    if (!item?.displayProperties?.name) return;
    if (UTILITY_FUNCTIONS.isExotic(item)) return; // Exotics handled separately
    
    const bucketHash = item.inventory?.bucketTypeHash;
    const itemSummary = createLightweightItemSummary(item);
    
    if (bucketHash === BUCKET_HASHES.KINETIC_WEAPONS && weapons.kinetic.length < maxPerSlot) {
      weapons.kinetic.push(itemSummary);
    } else if (bucketHash === BUCKET_HASHES.ENERGY_WEAPONS && weapons.energy.length < maxPerSlot) {
      weapons.energy.push(itemSummary);
    } else if (bucketHash === BUCKET_HASHES.POWER_WEAPONS && weapons.power.length < maxPerSlot) {
      weapons.power.push(itemSummary);
    }
  });

  console.log('Weapon counts:', {
    kinetic: weapons.kinetic.length,
    energy: weapons.energy.length,
    power: weapons.power.length
  });

  return weapons;
};

// Armor with proper limits
const organizeArmorSampleDebug = (inventoryItems) => {
  const armor = {
    Titan: { helmet: [], gauntlets: [], chest: [], legs: [], classItem: [] },
    Hunter: { helmet: [], gauntlets: [], chest: [], legs: [], classItem: [] },
    Warlock: { helmet: [], gauntlets: [], chest: [], legs: [], classItem: [] }
  };
  const maxPerSlot = 5; // Reduced limit

  Object.values(inventoryItems).forEach(item => {
    if (!CATEGORY_DETECTION.isArmor(item)) return;
    if (!item?.displayProperties?.name) return;
    if (UTILITY_FUNCTIONS.isExotic(item)) return; // Exotics handled separately
    
    const className = UTILITY_FUNCTIONS.getItemClass(item);
    const bucketHash = item.inventory?.bucketTypeHash;
    const slot = getArmorSlot(bucketHash);
    
    if (armor[className] && armor[className][slot] && armor[className][slot].length < maxPerSlot) {
      armor[className][slot].push(createLightweightItemSummary(item));
    }
  });

  return armor;
};

// Mods with strict filtering and limits
const organizeModsSampleDebug = (inventoryItems) => {
  const mods = { armor: [], weapon: [], combat: [], seasonal: [] };
  const maxPerCategory = 10; // Strict limit
  
  Object.values(inventoryItems).forEach(item => {
    if (item.debugReason !== 'mod') return; // Only items we explicitly marked as mods
    if (!item?.displayProperties?.name) return;
    
    const itemSummary = createLightweightItemSummary(item);
    const name = item.displayProperties.name.toLowerCase();
    const description = item.displayProperties.description?.toLowerCase() || '';
    
    // Strict categorization
    if ((name.includes('armor') || description.includes('armor')) && mods.armor.length < maxPerCategory) {
      mods.armor.push(itemSummary);
    } else if ((name.includes('weapon') || description.includes('weapon')) && mods.weapon.length < maxPerCategory) {
      mods.weapon.push(itemSummary);
    } else if ((name.includes('resist') || name.includes('surge')) && mods.combat.length < maxPerCategory) {
      mods.combat.push(itemSummary);
    } else if (description.includes('seasonal') && mods.seasonal.length < maxPerCategory) {
      mods.seasonal.push(itemSummary);
    }
  });

  console.log('Mod counts:', {
    armor: mods.armor.length,
    weapon: mods.weapon.length,
    combat: mods.combat.length,
    seasonal: mods.seasonal.length
  });

  return mods;
};

// Artifacts with strict filtering - only actual seasonal artifacts
const organizeArtifactsDebug = (inventoryItems) => {
  const artifacts = [];
  const maxArtifacts = 5; // Strict limit
  
  Object.values(inventoryItems).forEach(item => {
    if (!item?.displayProperties?.name) return;
    if (artifacts.length >= maxArtifacts) return;
    
    const name = item.displayProperties.name.toLowerCase();
    const description = item.displayProperties.description?.toLowerCase() || '';
    
    // Very strict artifact detection - only actual seasonal artifacts
    if ((name.includes('artifact') && !name.includes('mod')) ||
        name.includes('synaptic spear') ||
        name.includes('war table') ||
        (description.includes('seasonal artifact') && !description.includes('mod'))) {
      artifacts.push(createLightweightItemSummary(item));
    }
  });

  console.log(`Found ${artifacts.length} seasonal artifacts`);
  return artifacts;
};

// Other items with strict limits
const organizeOtherItemsDebug = (inventoryItems) => {
  const other = { materials: [], currencies: [], consumables: [] };
  const maxPerCategory = 5; // Very strict limit
  
  Object.values(inventoryItems).forEach(item => {
    if (!item?.displayProperties?.name) return;
    
    const itemSummary = createLightweightItemSummary(item);
    
    if (UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.MATERIALS) && other.materials.length < maxPerCategory) {
      other.materials.push(itemSummary);
    } else if (UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.CURRENCIES) && other.currencies.length < maxPerCategory) {
      other.currencies.push(itemSummary);
    } else if (UTILITY_FUNCTIONS.hasCategory(item, ITEM_CATEGORIES.CONSUMABLES) && other.consumables.length < maxPerCategory) {
      other.consumables.push(itemSummary);
    }
  });

  return other;
};

// Create lightweight item summary with improved damage type detection
const createLightweightItemSummary = (item) => ({
  hash: item.hash,
  name: item.displayProperties?.name || 'Unknown',
  description: item.displayProperties?.description || '',
  tierType: item.inventory?.tierType || 0,
  className: UTILITY_FUNCTIONS.getItemClass(item),
  damageType: getDamageTypeEnhanced(item),
  isExotic: UTILITY_FUNCTIONS.isExotic(item)
});

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