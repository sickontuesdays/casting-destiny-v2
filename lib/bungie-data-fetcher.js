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

// Fetch and organize ESSENTIAL Destiny data only (optimized for size)
export const fetchAllDestinyData = async () => {
  try {
    console.log('Fetching essential Destiny data with size optimization...');
    
    // Get only the main inventory items - other components are too large
    const inventoryItems = await getManifestComponent('DestinyInventoryItemDefinition');
    console.log('Successfully fetched DestinyInventoryItemDefinition');
    
    // Process and filter data to reduce size
    const filteredItems = filterEssentialItems(inventoryItems);
    console.log(`Filtered from ${Object.keys(inventoryItems).length} to ${Object.keys(filteredItems).length} essential items`);

    // Organize data using proper hash-based categorization (size-optimized)
    const organizedData = {
      // Core class/subclass system
      classes: organizeClassData(filteredItems),
      
      // Essential exotic items only
      exotics: organizeExotics(filteredItems),
      
      // Essential weapons (samples only)
      weapons: organizeWeaponsSample(filteredItems),
      
      // Essential armor (samples only) 
      armor: organizeArmorSample(filteredItems),
      
      // Essential mods (filtered)
      mods: organizeModsSample(filteredItems),
      
      // Seasonal artifacts (lightweight)
      artifacts: organizeArtifacts(filteredItems),
      
      // Other essential items
      other: organizeOtherItems(filteredItems),
      
      // Metadata
      metadata: {
        totalOriginalItems: Object.keys(inventoryItems).length,
        totalFilteredItems: Object.keys(filteredItems).length,
        lastUpdated: Date.now(),
        version: '2.0-optimized'
      }
    };

    console.log('Data organization complete with size optimization');
    return organizedData;

  } catch (error) {
    console.error('Error fetching Destiny data:', error);
    throw error;
  }
};

// Filter to only essential items to reduce payload size
const filterEssentialItems = (inventoryItems) => {
  const essentialItems = {};
  
  Object.entries(inventoryItems).forEach(([hash, item]) => {
    if (!item?.displayProperties?.name) return;
    
    // Only include items that are useful for builds
    const isEssential = 
      UTILITY_FUNCTIONS.isExotic(item) || // All exotics
      CATEGORY_DETECTION.isSubclass(item) || // All subclass items
      CATEGORY_DETECTION.isAspect(item) ||
      CATEGORY_DETECTION.isFragment(item) ||
      CATEGORY_DETECTION.isGrenade(item) ||
      CATEGORY_DETECTION.isMelee(item) ||
      CATEGORY_DETECTION.isSuper(item) ||
      CATEGORY_DETECTION.isClassAbility(item) ||
      (CATEGORY_DETECTION.isMod(item) && !CATEGORY_DETECTION.isCosmetic(item)) || // Essential mods only
      (CATEGORY_DETECTION.isWeapon(item) && item.inventory?.tierType >= TIER_TYPES.LEGENDARY) || // Legendary+ weapons
      (CATEGORY_DETECTION.isArmor(item) && item.inventory?.tierType >= TIER_TYPES.LEGENDARY); // Legendary+ armor
    
    if (isEssential) {
      essentialItems[hash] = item;
    }
  });
  
  return essentialItems;
};

// Organize class/subclass data (key for builds)
const organizeClassData = (inventoryItems) => {
  const classData = {
    Titan: { Arc: {}, Solar: {}, Void: {}, Stasis: {}, Strand: {} },
    Hunter: { Arc: {}, Solar: {}, Void: {}, Stasis: {}, Strand: {} },
    Warlock: { Arc: {}, Solar: {}, Void: {}, Stasis: {}, Strand: {} }
  };

  // Initialize each damage type with empty arrays
  Object.keys(classData).forEach(className => {
    Object.keys(classData[className]).forEach(damageType => {
      classData[className][damageType] = {
        supers: [],
        aspects: [],
        fragments: [],
        grenades: [],
        melees: [],
        classAbilities: [],
        movement: []
      };
    });
  });

  Object.values(inventoryItems).forEach(item => {
    if (!item?.displayProperties?.name) return;
    
    const className = UTILITY_FUNCTIONS.getItemClass(item);
    const damageType = UTILITY_FUNCTIONS.getDamageType(item);
    
    if (!classData[className] || !classData[className][damageType]) return;
    
    const itemSummary = createLightweightItemSummary(item);
    
    // Categorize by item type
    if (CATEGORY_DETECTION.isSuper(item)) {
      classData[className][damageType].supers.push(itemSummary);
    } else if (CATEGORY_DETECTION.isAspect(item)) {
      classData[className][damageType].aspects.push(itemSummary);
    } else if (CATEGORY_DETECTION.isFragment(item)) {
      // Fragments are usually universal, add to all classes
      Object.keys(classData).forEach(cls => {
        if (classData[cls][damageType]) {
          classData[cls][damageType].fragments.push(itemSummary);
        }
      });
    } else if (CATEGORY_DETECTION.isGrenade(item)) {
      classData[className][damageType].grenades.push(itemSummary);
    } else if (CATEGORY_DETECTION.isMelee(item)) {
      classData[className][damageType].melees.push(itemSummary);
    } else if (CATEGORY_DETECTION.isClassAbility(item)) {
      classData[className][damageType].classAbilities.push(itemSummary);
    }
  });

  return classData;
};

// Organize exotic items (essential for builds)
const organizeExotics = (inventoryItems) => {
  const exotics = {
    armor: { Titan: [], Hunter: [], Warlock: [] },
    weapons: { kinetic: [], energy: [], power: [] }
  };

  Object.values(inventoryItems).forEach(item => {
    if (!UTILITY_FUNCTIONS.isExotic(item)) return;
    if (!item?.displayProperties?.name) return;
    
    const itemSummary = createLightweightItemSummary(item);
    
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

  return exotics;
};

// Sample weapons (to keep size manageable)
const organizeWeaponsSample = (inventoryItems) => {
  const weapons = { kinetic: [], energy: [], power: [] };
  const maxPerSlot = 15; // Limit to prevent large payloads
  
  Object.values(inventoryItems).forEach(item => {
    if (!CATEGORY_DETECTION.isWeapon(item)) return;
    if (!item?.displayProperties?.name) return;
    if (UTILITY_FUNCTIONS.isExotic(item)) return; // Exotics are handled separately
    
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

  return weapons;
};

// Sample armor (to keep size manageable)
const organizeArmorSample = (inventoryItems) => {
  const armor = {
    Titan: { helmet: [], gauntlets: [], chest: [], legs: [], classItem: [] },
    Hunter: { helmet: [], gauntlets: [], chest: [], legs: [], classItem: [] },
    Warlock: { helmet: [], gauntlets: [], chest: [], legs: [], classItem: [] }
  };
  const maxPerSlot = 10; // Limit to prevent large payloads

  Object.values(inventoryItems).forEach(item => {
    if (!CATEGORY_DETECTION.isArmor(item)) return;
    if (!item?.displayProperties?.name) return;
    if (UTILITY_FUNCTIONS.isExotic(item)) return; // Exotics are handled separately
    
    const className = UTILITY_FUNCTIONS.getItemClass(item);
    const bucketHash = item.inventory?.bucketTypeHash;
    const slot = getArmorSlot(bucketHash);
    
    if (armor[className] && armor[className][slot] && armor[className][slot].length < maxPerSlot) {
      armor[className][slot].push(createLightweightItemSummary(item));
    }
  });

  return armor;
};

// Sample mods (essential ones only)
const organizeModsSample = (inventoryItems) => {
  const mods = { armor: [], weapon: [], combat: [], seasonal: [] };
  const maxPerCategory = 20; // Limit to prevent large payloads
  
  Object.values(inventoryItems).forEach(item => {
    if (!CATEGORY_DETECTION.isMod(item)) return;
    if (!item?.displayProperties?.name) return;
    if (CATEGORY_DETECTION.isCosmetic(item)) return;
    
    const itemSummary = createLightweightItemSummary(item);
    const name = item.displayProperties.name.toLowerCase();
    const description = item.displayProperties.description?.toLowerCase() || '';
    
    // Categorize mods more intelligently
    if ((name.includes('armor') || description.includes('armor')) && mods.armor.length < maxPerCategory) {
      mods.armor.push(itemSummary);
    } else if ((name.includes('weapon') || description.includes('weapon')) && mods.weapon.length < maxPerCategory) {
      mods.weapon.push(itemSummary);
    } else if ((name.includes('resist') || name.includes('surge') || name.includes('damage')) && mods.combat.length < maxPerCategory) {
      mods.combat.push(itemSummary);
    } else if ((description.includes('seasonal') || description.includes('artifact')) && mods.seasonal.length < maxPerCategory) {
      mods.seasonal.push(itemSummary);
    }
  });

  return mods;
};

// Organize seasonal artifacts
const organizeArtifacts = (inventoryItems) => {
  const artifacts = [];
  
  Object.values(inventoryItems).forEach(item => {
    if (!item?.displayProperties?.name) return;
    
    const name = item.displayProperties.name.toLowerCase();
    const description = item.displayProperties.description?.toLowerCase() || '';
    
    // Look for seasonal artifact items
    if (name.includes('artifact') || description.includes('seasonal artifact') || 
        name.includes('synaptic spear') || name.includes('war table') ||
        item.itemTypeDisplayName?.toLowerCase().includes('artifact')) {
      artifacts.push(createLightweightItemSummary(item));
    }
  });

  return artifacts;
};

// Organize other essential items
const organizeOtherItems = (inventoryItems) => {
  const other = { materials: [], currencies: [], consumables: [] };
  const maxPerCategory = 10; // Keep it small
  
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

// Create lightweight item summary (minimal data)
const createLightweightItemSummary = (item) => ({
  hash: item.hash,
  name: item.displayProperties?.name || 'Unknown',
  description: item.displayProperties?.description || '',
  tierType: item.inventory?.tierType || 0,
  className: UTILITY_FUNCTIONS.getItemClass(item),
  damageType: UTILITY_FUNCTIONS.getDamageType(item),
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