import { getManifestComponent } from './bungie-api';

// Class definitions for organizing data
const CLASS_TYPES = {
  0: 'Titan',
  1: 'Hunter', 
  2: 'Warlock'
};

const DAMAGE_TYPES = {
  1: 'Kinetic',
  2: 'Arc',
  3: 'Solar', 
  4: 'Void',
  6: 'Stasis',
  7: 'Strand'
};

// Fetch and organize all Destiny data
export const fetchAllDestinyData = async () => {
  try {
    console.log('Fetching comprehensive Destiny data...');
    
    // Fetch all necessary manifest components
    const [
      inventoryItems,
      socketCategories,
      socketTypes,
      plugSets,
      damageTypes,
      itemCategories,
      stats,
      talentGrids,
      progressions,
      collectibles,
      records,
      sandboxPerks
    ] = await Promise.all([
      getManifestComponent('DestinyInventoryItemDefinition'),
      getManifestComponent('DestinySocketCategoryDefinition'),
      getManifestComponent('DestinySocketTypeDefinition'),
      getManifestComponent('DestinyPlugSetDefinition'),
      getManifestComponent('DestinyDamageTypeDefinition'),
      getManifestComponent('DestinyItemCategoryDefinition'),
      getManifestComponent('DestinyStatDefinition'),
      getManifestComponent('DestinyTalentGridDefinition'),
      getManifestComponent('DestinyProgressionDefinition'),
      getManifestComponent('DestinyCollectibleDefinition'),
      getManifestComponent('DestinyRecordDefinition'),
      getManifestComponent('DestinySandboxPerkDefinition')
    ]);

    console.log('Processing and categorizing data...');

    // Organize data by categories
    const organizedData = {
      classes: organizeByClass(inventoryItems),
      exotics: organizeExotics(inventoryItems),
      weapons: organizeWeapons(inventoryItems),
      armor: organizeArmor(inventoryItems),
      mods: organizeMods(inventoryItems),
      artifacts: organizeArtifacts(inventoryItems),
      abilities: organizeAbilities(inventoryItems, talentGrids),
      stats: organizeStats(stats),
      other: organizeOtherItems(inventoryItems)
    };

    console.log('Data organization complete');
    return organizedData;

  } catch (error) {
    console.error('Error fetching Destiny data:', error);
    throw error;
  }
};

// Organize subclass abilities by class
const organizeByClass = (inventoryItems) => {
  const classes = {
    Titan: { supers: [], aspects: [], fragments: [], abilities: [] },
    Hunter: { supers: [], aspects: [], fragments: [], abilities: [] },
    Warlock: { supers: [], aspects: [], fragments: [], abilities: [] }
  };

  Object.values(inventoryItems).forEach(item => {
    if (!item.displayProperties?.name) return;

    const name = item.displayProperties.name;
    const description = item.displayProperties.description || '';
    
    // Detect supers
    if (isSuper(item, name, description)) {
      const className = getClassFromItem(item, name, description);
      if (className && classes[className]) {
        classes[className].supers.push({
          name,
          description,
          damageType: getDamageType(item),
          hash: item.hash
        });
      }
    }
    
    // Detect aspects
    if (isAspect(item, name, description)) {
      const className = getClassFromItem(item, name, description);
      if (className && classes[className]) {
        classes[className].aspects.push({
          name,
          description,
          damageType: getDamageType(item),
          hash: item.hash
        });
      }
    }
    
    // Detect fragments
    if (isFragment(item, name, description)) {
      // Fragments are usually class-agnostic
      Object.keys(classes).forEach(className => {
        classes[className].fragments.push({
          name,
          description,
          damageType: getDamageType(item),
          hash: item.hash
        });
      });
    }
    
    // Detect other abilities (grenades, melees, class abilities)
    if (isAbility(item, name, description)) {
      const className = getClassFromItem(item, name, description);
      if (className && classes[className]) {
        classes[className].abilities.push({
          name,
          description,
          type: getAbilityType(name, description),
          damageType: getDamageType(item),
          hash: item.hash
        });
      }
    }
  });

  return classes;
};

// Organize exotic items
const organizeExotics = (inventoryItems) => {
  const exotics = {
    armor: { Titan: [], Hunter: [], Warlock: [] },
    weapons: { kinetic: [], energy: [], heavy: [] }
  };

  Object.values(inventoryItems).forEach(item => {
    if (!item.displayProperties?.name) return;
    if (!isExotic(item)) return;

    const name = item.displayProperties.name;
    const description = item.displayProperties.description || '';

    if (isArmor(item)) {
      const className = getClassFromItem(item, name, description);
      if (className && exotics.armor[className]) {
        exotics.armor[className].push({
          name,
          description,
          slot: getArmorSlot(item),
          hash: item.hash
        });
      }
    } else if (isWeapon(item)) {
      const slot = getWeaponSlot(item);
      if (slot && exotics.weapons[slot]) {
        exotics.weapons[slot].push({
          name,
          description,
          weaponType: getWeaponType(item),
          damageType: getDamageType(item),
          hash: item.hash
        });
      }
    }
  });

  return exotics;
};

// Organize regular weapons
const organizeWeapons = (inventoryItems) => {
  const weapons = {
    kinetic: [],
    energy: [], 
    heavy: []
  };

  Object.values(inventoryItems).forEach(item => {
    if (!item.displayProperties?.name) return;
    if (!isWeapon(item)) return;
    if (isExotic(item)) return; // Skip exotics, they're in separate section

    const name = item.displayProperties.name;
    const slot = getWeaponSlot(item);
    
    if (slot && weapons[slot]) {
      weapons[slot].push({
        name,
        weaponType: getWeaponType(item),
        damageType: getDamageType(item),
        hash: item.hash
      });
    }
  });

  // Limit to prevent overwhelming data
  Object.keys(weapons).forEach(slot => {
    weapons[slot] = weapons[slot].slice(0, 50);
  });

  return weapons;
};

// Organize armor
const organizeArmor = (inventoryItems) => {
  const armor = {
    Titan: { helmet: [], arms: [], chest: [], legs: [], classItem: [] },
    Hunter: { helmet: [], arms: [], chest: [], legs: [], classItem: [] },
    Warlock: { helmet: [], arms: [], chest: [], legs: [], classItem: [] }
  };

  Object.values(inventoryItems).forEach(item => {
    if (!item.displayProperties?.name) return;
    if (!isArmor(item)) return;
    if (isExotic(item)) return; // Skip exotics

    const name = item.displayProperties.name;
    const className = getClassFromItem(item, name, '');
    const slot = getArmorSlot(item);
    
    if (className && slot && armor[className] && armor[className][slot]) {
      armor[className][slot].push({
        name,
        hash: item.hash
      });
    }
  });

  // Limit results
  Object.keys(armor).forEach(className => {
    Object.keys(armor[className]).forEach(slot => {
      armor[className][slot] = armor[className][slot].slice(0, 20);
    });
  });

  return armor;
};

// Organize mods
const organizeMods = (inventoryItems) => {
  const mods = {
    armor: [],
    weapon: [],
    ghost: []
  };

  Object.values(inventoryItems).forEach(item => {
    if (!item.displayProperties?.name) return;
    if (!isMod(item)) return;

    const name = item.displayProperties.name;
    const description = item.displayProperties.description || '';
    
    if (isArmorMod(item, name, description)) {
      mods.armor.push({ name, description, hash: item.hash });
    } else if (isWeaponMod(item, name, description)) {
      mods.weapon.push({ name, description, hash: item.hash });
    } else if (isGhostMod(item, name, description)) {
      mods.ghost.push({ name, description, hash: item.hash });
    }
  });

  return mods;
};

// Organize seasonal artifacts
const organizeArtifacts = (inventoryItems) => {
  const artifacts = [];

  Object.values(inventoryItems).forEach(item => {
    if (!item.displayProperties?.name) return;
    
    const name = item.displayProperties.name;
    const description = item.displayProperties.description || '';
    
    if (isArtifact(item, name, description)) {
      artifacts.push({
        name,
        description,
        hash: item.hash
      });
    }
  });

  return artifacts;
};

// Organize abilities
const organizeAbilities = (inventoryItems, talentGrids) => {
  const abilities = {
    grenades: [],
    melees: [],
    classAbilities: [],
    movement: []
  };

  Object.values(inventoryItems).forEach(item => {
    if (!item.displayProperties?.name) return;
    
    const name = item.displayProperties.name;
    const description = item.displayProperties.description || '';
    
    if (isGrenade(item, name, description)) {
      abilities.grenades.push({ name, description, hash: item.hash });
    } else if (isMelee(item, name, description)) {
      abilities.melees.push({ name, description, hash: item.hash });
    } else if (isClassAbility(item, name, description)) {
      abilities.classAbilities.push({ name, description, hash: item.hash });
    } else if (isMovementAbility(item, name, description)) {
      abilities.movement.push({ name, description, hash: item.hash });
    }
  });

  return abilities;
};

// Organize stats
const organizeStats = (stats) => {
  const organizedStats = [];
  
  Object.values(stats).forEach(stat => {
    if (stat.displayProperties?.name) {
      organizedStats.push({
        name: stat.displayProperties.name,
        description: stat.displayProperties.description || '',
        hash: stat.hash
      });
    }
  });

  return organizedStats;
};

// Organize other relevant items
const organizeOtherItems = (inventoryItems) => {
  const other = {
    consumables: [],
    currencies: [],
    materials: []
  };

  Object.values(inventoryItems).forEach(item => {
    if (!item.displayProperties?.name) return;
    
    const name = item.displayProperties.name;
    
    if (isConsumable(item)) {
      other.consumables.push({ name, hash: item.hash });
    } else if (isCurrency(item)) {
      other.currencies.push({ name, hash: item.hash });
    } else if (isMaterial(item)) {
      other.materials.push({ name, hash: item.hash });
    }
  });

  // Limit results
  Object.keys(other).forEach(category => {
    other[category] = other[category].slice(0, 30);
  });

  return other;
};

// Helper functions for item classification
const isExotic = (item) => {
  return item.inventory?.tierTypeName === 'Exotic' || 
         item.itemTypeDisplayName === 'Exotic';
};

const isWeapon = (item) => {
  return item.itemCategoryHashes?.includes(1) || // Weapon category
         item.itemTypeDisplayName?.includes('Weapon');
};

const isArmor = (item) => {
  return item.itemCategoryHashes?.includes(20) || // Armor category
         item.itemTypeDisplayName?.includes('Armor');
};

const isMod = (item) => {
  return item.itemCategoryHashes?.includes(59) || // Mod category
         item.itemTypeDisplayName?.includes('Mod');
};

const isSuper = (item, name, description) => {
  const superKeywords = ['super', 'ward of dawn', 'golden gun', 'nova bomb', 'fists of havoc', 'shadowshot', 'hammer', 'storm', 'blade', 'chaos', 'well of radiance'];
  return superKeywords.some(keyword => 
    name.toLowerCase().includes(keyword) || 
    description.toLowerCase().includes(keyword)
  );
};

const isAspect = (item, name, description) => {
  return name.toLowerCase().includes('aspect') || 
         description.toLowerCase().includes('aspect');
};

const isFragment = (item, name, description) => {
  return name.toLowerCase().includes('fragment') || 
         name.toLowerCase().includes('echo') ||
         name.toLowerCase().includes('facet');
};

const isAbility = (item, name, description) => {
  const abilityKeywords = ['grenade', 'melee', 'rift', 'barricade', 'dodge', 'jump', 'glide', 'lift'];
  return abilityKeywords.some(keyword => 
    name.toLowerCase().includes(keyword) || 
    description.toLowerCase().includes(keyword)
  );
};

const getClassFromItem = (item, name, description) => {
  const lowerName = name.toLowerCase();
  const lowerDesc = description.toLowerCase();
  
  if (lowerName.includes('titan') || lowerDesc.includes('titan')) return 'Titan';
  if (lowerName.includes('hunter') || lowerDesc.includes('hunter')) return 'Hunter';
  if (lowerName.includes('warlock') || lowerDesc.includes('warlock')) return 'Warlock';
  
  // Additional logic based on item properties could go here
  return null;
};

const getDamageType = (item) => {
  if (item.damageTypeHashes && item.damageTypeHashes.length > 0) {
    return DAMAGE_TYPES[item.damageTypeHashes[0]] || 'Unknown';
  }
  return 'Kinetic';
};

const getWeaponSlot = (item) => {
  // Logic to determine kinetic/energy/heavy based on item properties
  if (item.inventory?.bucketTypeHash === 1498876634) return 'kinetic';
  if (item.inventory?.bucketTypeHash === 2465295065) return 'energy';
  if (item.inventory?.bucketTypeHash === 953998645) return 'heavy';
  return null;
};

const getWeaponType = (item) => {
  return item.itemTypeDisplayName || 'Unknown';
};

const getArmorSlot = (item) => {
  if (item.inventory?.bucketTypeHash === 3448274439) return 'helmet';
  if (item.inventory?.bucketTypeHash === 3551918588) return 'arms';
  if (item.inventory?.bucketTypeHash === 14239492) return 'chest';
  if (item.inventory?.bucketTypeHash === 20886954) return 'legs';
  if (item.inventory?.bucketTypeHash === 1585787867) return 'classItem';
  return null;
};

// Additional helper functions...
const isArmorMod = (item, name, description) => {
  return description.includes('armor') || name.includes('armor') || 
         description.includes('equipped') || description.includes('socketed');
};

const isWeaponMod = (item, name, description) => {
  return description.includes('weapon') || name.includes('weapon');
};

const isGhostMod = (item, name, description) => {
  return description.includes('ghost') || name.includes('ghost');
};

const isArtifact = (item, name, description) => {
  return name.includes('artifact') || description.includes('artifact') ||
         name.includes('seasonal') || description.includes('seasonal');
};

const isGrenade = (item, name, description) => {
  return name.toLowerCase().includes('grenade');
};

const isMelee = (item, name, description) => {
  return name.toLowerCase().includes('melee') || 
         name.toLowerCase().includes('punch') ||
         name.toLowerCase().includes('strike');
};

const isClassAbility = (item, name, description) => {
  return name.toLowerCase().includes('rift') ||
         name.toLowerCase().includes('barricade') ||
         name.toLowerCase().includes('dodge');
};

const isMovementAbility = (item, name, description) => {
  return name.toLowerCase().includes('jump') ||
         name.toLowerCase().includes('glide') ||
         name.toLowerCase().includes('lift');
};

const getAbilityType = (name, description) => {
  if (name.toLowerCase().includes('grenade')) return 'Grenade';
  if (name.toLowerCase().includes('melee')) return 'Melee';
  if (name.toLowerCase().includes('rift')) return 'Class Ability';
  if (name.toLowerCase().includes('barricade')) return 'Class Ability';
  if (name.toLowerCase().includes('dodge')) return 'Class Ability';
  return 'Other';
};

const isConsumable = (item) => {
  return item.itemCategoryHashes?.includes(35) || // Consumable category
         item.itemTypeDisplayName?.includes('Consumable');
};

const isCurrency = (item) => {
  return item.itemCategoryHashes?.includes(18) || // Currency category
         item.itemTypeDisplayName?.includes('Currency');
};

const isMaterial = (item) => {
  return item.itemCategoryHashes?.includes(61) || // Material category
         item.itemTypeDisplayName?.includes('Material');
};