import { getManifestComponent } from './bungie-api';
import { 
  ITEM_CATEGORIES, 
  BUCKET_HASHES, 
  TIER_TYPES, 
  CLASS_TYPES, 
  DAMAGE_TYPES,
  BUILD_ESSENTIAL_CATEGORIES,
  UTILITY_FUNCTIONS,
  CATEGORY_DETECTION 
} from './destiny-constants';

// IMPROVED data fetcher focused on build-essential items only
export const fetchAllDestinyData = async () => {
  try {
    console.log('Fetching build-essential Destiny data...');
    
    const inventoryItems = await getManifestComponent('DestinyInventoryItemDefinition');
    console.log('Raw inventory items count:', Object.keys(inventoryItems).length);

    // STEP 1: Filter to only build-essential items
    const buildEssentialItems = filterBuildEssentialItems(inventoryItems);
    console.log(`Filtered to ${Object.keys(buildEssentialItems).length} build-essential items`);

    // STEP 2: Organize data in build-focused structure
    const organizedData = {
      buildComponents: organizeBuildComponents(buildEssentialItems),
      exoticGear: organizeExoticGear(buildEssentialItems),
      subclassData: organizeSubclassData(buildEssentialItems),
      modData: organizeModData(buildEssentialItems),
      metadata: {
        totalOriginalItems: Object.keys(inventoryItems).length,
        buildEssentialItems: Object.keys(buildEssentialItems).length,
        lastUpdated: Date.now(),
        version: '3.0-build-focused'
      }
    };

    // Log organization results
    console.log('Build-focused data organized:', {
      exoticArmor: Object.values(organizedData.exoticGear.armor).reduce((total, items) => total + items.length, 0),
      exoticWeapons: Object.values(organizedData.exoticGear.weapons).reduce((total, items) => total + items.length, 0),
      subclassComponents: Object.values(organizedData.subclassData).reduce((total, classData) => 
        total + Object.values(classData).reduce((classTotal, damageData) => 
          classTotal + Object.values(damageData).reduce((damageTotal, items) => damageTotal + items.length, 0), 0), 0),
      mods: Object.values(organizedData.modData).reduce((total, items) => total + items.length, 0)
    });

    return organizedData;

  } catch (error) {
    console.error('Error fetching build-essential Destiny data:', error);
    throw error;
  }
};

// IMPROVED: Filter to only items essential for builds
const filterBuildEssentialItems = (inventoryItems) => {
  const essentialItems = {};
  let counts = {
    exoticArmor: 0,
    exoticWeapons: 0,
    aspects: 0,
    fragments: 0,
    grenades: 0,
    melees: 0,
    supers: 0,
    classAbilities: 0,
    mods: 0,
    excluded: 0
  };
  
  Object.entries(inventoryItems).forEach(([hash, item]) => {
    if (!item?.displayProperties?.name) return;
    
    // FIRST: Exclude cosmetic and irrelevant items
    if (UTILITY_FUNCTIONS.shouldExclude && UTILITY_FUNCTIONS.shouldExclude(item)) {
      counts.excluded++;
      return;
    }
    
    let isEssential = false;
    let reason = '';
    
    // EXOTIC GEAR (highest priority for builds)
    if (UTILITY_FUNCTIONS.isExotic(item)) {
      if (CATEGORY_DETECTION.isArmor(item)) {
        isEssential = true;
        reason = 'exotic_armor';
        counts.exoticArmor++;
      } else if (CATEGORY_DETECTION.isWeapon(item)) {
        isEssential = true;
        reason = 'exotic_weapon';
        counts.exoticWeapons++;
      }
    }
    
    // SUBCLASS COMPONENTS (critical for builds)
    else if (CATEGORY_DETECTION.isAspect && CATEGORY_DETECTION.isAspect(item)) {
      isEssential = true;
      reason = 'aspect';
      counts.aspects++;
    }
    else if (CATEGORY_DETECTION.isFragment && CATEGORY_DETECTION.isFragment(item)) {
      isEssential = true;
      reason = 'fragment';
      counts.fragments++;
    }
    else if (CATEGORY_DETECTION.isGrenade(item)) {
      isEssential = true;
      reason = 'grenade';
      counts.grenades++;
    }
    else if (CATEGORY_DETECTION.isMelee && CATEGORY_DETECTION.isMelee(item)) {
      isEssential = true;
      reason = 'melee';
      counts.melees++;
    }
    else if (CATEGORY_DETECTION.isSuper && CATEGORY_DETECTION.isSuper(item)) {
      isEssential = true;
      reason = 'super';
      counts.supers++;
    }
    else if (CATEGORY_DETECTION.isClassAbility && CATEGORY_DETECTION.isClassAbility(item)) {
      isEssential = true;
      reason = 'class_ability';
      counts.classAbilities++;
    }
    
    // MODS (build enhancers)
    else if (CATEGORY_DETECTION.isMod(item) && !CATEGORY_DETECTION.isCosmetic(item)) {
      // Only include mods that affect gameplay
      const description = item.displayProperties.description?.toLowerCase() || '';
      const name = item.displayProperties.name.toLowerCase();
      
      if (description.includes('damage') || description.includes('energy') || 
          description.includes('ability') || description.includes('weapon') || 
          description.includes('armor') || description.includes('resist') ||
          name.includes('mod') || name.includes('surge') || name.includes('kickstart')) {
        isEssential = true;
        reason = 'mod';
        counts.mods++;
      }
    }
    
    if (isEssential) {
      essentialItems[hash] = { ...item, buildReason: reason };
    }
  });
  
  console.log('Build-essential filter counts:', counts);
  return essentialItems;
};

// IMPROVED: Organize build components by their actual function
const organizeBuildComponents = (items) => {
  const components = {
    abilities: {
      supers: [],
      grenades: [],
      melees: [],
      classAbilities: []
    },
    subclassModifiers: {
      aspects: [],
      fragments: []
    },
    gear: {
      exoticArmor: [],
      exoticWeapons: [],
      legendaryWeapons: []
    },
    mods: {
      armor: [],
      weapon: [],
      combat: []
    }
  };

  Object.values(items).forEach(item => {
    if (!item?.displayProperties?.name) return;
    
    const itemSummary = createBuildItemSummary(item);
    
    // Categorize by build function
    switch (item.buildReason) {
      case 'super':
        components.abilities.supers.push(itemSummary);
        break;
      case 'grenade':
        components.abilities.grenades.push(itemSummary);
        break;
      case 'melee':
        components.abilities.melees.push(itemSummary);
        break;
      case 'class_ability':
        components.abilities.classAbilities.push(itemSummary);
        break;
      case 'aspect':
        components.subclassModifiers.aspects.push(itemSummary);
        break;
      case 'fragment':
        components.subclassModifiers.fragments.push(itemSummary);
        break;
      case 'exotic_armor':
        components.gear.exoticArmor.push(itemSummary);
        break;
      case 'exotic_weapon':
        components.gear.exoticWeapons.push(itemSummary);
        break;
      case 'mod':
        // FIXED: Safe categorization that ensures the object exists
        categorizeModByFunction(item, components.mods, itemSummary);
        break;
    }
  });

  return components;
};

// IMPROVED: Organize exotic gear by class and slot
const organizeExoticGear = (items) => {
  const exotics = {
    armor: { Titan: [], Hunter: [], Warlock: [] },
    weapons: { kinetic: [], energy: [], power: [] }
  };

  Object.values(items).forEach(item => {
    if (!UTILITY_FUNCTIONS.isExotic(item)) return;
    
    const itemSummary = createBuildItemSummary(item);
    
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

// IMPROVED: Organize subclass data by class and damage type
const organizeSubclassData = (items) => {
  const subclassData = {
    Titan: initializeClassStructure(),
    Hunter: initializeClassStructure(),
    Warlock: initializeClassStructure()
  };

  Object.values(items).forEach(item => {
    if (!isSubclassComponent(item)) return;
    
    const className = UTILITY_FUNCTIONS.getItemClass(item);
    const damageType = determineDamageType(item);
    
    // Skip if we can't determine class or damage type
    if (className === 'Unknown' || damageType === 'None') return;
    
    const itemSummary = createBuildItemSummary(item);
    
    // Add to appropriate category
    switch (item.buildReason) {
      case 'super':
        subclassData[className][damageType].supers.push(itemSummary);
        break;
      case 'aspect':
        subclassData[className][damageType].aspects.push(itemSummary);
        break;
      case 'fragment':
        // Fragments are usually universal across damage types
        Object.keys(subclassData[className]).forEach(dt => {
          if (!subclassData[className][dt].fragments.some(f => f.hash === item.hash)) {
            subclassData[className][dt].fragments.push(itemSummary);
          }
        });
        break;
      case 'grenade':
        subclassData[className][damageType].grenades.push(itemSummary);
        break;
      case 'melee':
        subclassData[className][damageType].melees.push(itemSummary);
        break;
      case 'class_ability':
        subclassData[className][damageType].classAbilities.push(itemSummary);
        break;
    }
  });

  return subclassData;
};

// IMPROVED: Organize mods by their actual function
const organizeModData = (items) => {
  const mods = {
    armor: [],
    weapon: [],
    combat: [],
    utility: []
  };

  Object.values(items).forEach(item => {
    if (item.buildReason !== 'mod') return;
    
    const itemSummary = createBuildItemSummary(item);
    categorizeModByFunction(item, mods, itemSummary);
  });

  return mods;
};

// FIXED: Helper function to categorize mods by their actual function
const categorizeModByFunction = (item, modsObject, itemSummary) => {
  // Ensure the itemSummary is provided or create it
  const summary = itemSummary || createBuildItemSummary(item);
  
  // Ensure all mod categories exist
  if (!modsObject.weapon) modsObject.weapon = [];
  if (!modsObject.combat) modsObject.combat = [];
  if (!modsObject.utility) modsObject.utility = [];
  if (!modsObject.armor) modsObject.armor = [];
  
  const name = item.displayProperties.name.toLowerCase();
  const description = item.displayProperties.description?.toLowerCase() || '';
  
  // Categorize by actual function
  if (name.includes('weapon') || description.includes('weapon') || 
      name.includes('targeting') || name.includes('reload') || name.includes('reserves')) {
    modsObject.weapon.push(summary);
  } else if (name.includes('resist') || description.includes('resist') || 
             name.includes('surge') || description.includes('damage')) {
    modsObject.combat.push(summary);
  } else if (name.includes('utility') || name.includes('kickstart') || 
             description.includes('ability') || description.includes('energy')) {
    modsObject.utility.push(summary);
  } else {
    modsObject.armor.push(summary);
  }
};

// Helper functions
const isSubclassComponent = (item) => {
  return ['super', 'aspect', 'fragment', 'grenade', 'melee', 'class_ability'].includes(item.buildReason);
};

const determineDamageType = (item) => {
  const damageType = UTILITY_FUNCTIONS.getDamageType(item);
  if (damageType !== 'None') return damageType;
  
  // Fallback: try to determine from name patterns
  const name = item.displayProperties.name.toLowerCase();
  if (name.includes('arc')) return 'Arc';
  if (name.includes('solar')) return 'Solar';
  if (name.includes('void')) return 'Void';
  if (name.includes('stasis')) return 'Stasis';
  if (name.includes('strand')) return 'Strand';
  
  // Default for fragments and universal items
  return 'Void';
};

const initializeClassStructure = () => ({
  Arc: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [] },
  Solar: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [] },
  Void: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [] },
  Stasis: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [] },
  Strand: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [] }
});

// Create focused build item summary
const createBuildItemSummary = (item) => ({
  hash: item.hash,
  name: item.displayProperties?.name || 'Unknown',
  description: item.displayProperties?.description || '',
  tierType: item.inventory?.tierType || 0,
  className: UTILITY_FUNCTIONS.getItemClass(item),
  damageType: UTILITY_FUNCTIONS.getDamageType(item),
  isExotic: UTILITY_FUNCTIONS.isExotic(item),
  bucketSlot: UTILITY_FUNCTIONS.getBucketSlotName ? UTILITY_FUNCTIONS.getBucketSlotName(item.inventory?.bucketTypeHash) : 'Unknown',
  buildReason: item.buildReason,
  icon: item.displayProperties?.icon
});