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
    
    // First get the manifest to see what's available
    const manifest = await getManifestComponent('DestinyInventoryItemDefinition');
    console.log('Successfully fetched DestinyInventoryItemDefinition');
    
    // FIXED: Try to fetch additional components, but don't fail if some are missing
    // Note: Some components like DestinyTalentGridDefinition may not be available in newer API versions
    const componentPromises = [
      { name: 'socketCategories', promise: getManifestComponent('DestinySocketCategoryDefinition').catch(e => { console.warn('Failed to fetch DestinySocketCategoryDefinition:', e.message); return {}; }) },
      { name: 'socketTypes', promise: getManifestComponent('DestinySocketTypeDefinition').catch(e => { console.warn('Failed to fetch DestinySocketTypeDefinition:', e.message); return {}; }) },
      { name: 'plugSets', promise: getManifestComponent('DestinyPlugSetDefinition').catch(e => { console.warn('Failed to fetch DestinyPlugSetDefinition:', e.message); return {}; }) },
      { name: 'damageTypes', promise: getManifestComponent('DestinyDamageTypeDefinition').catch(e => { console.warn('Failed to fetch DestinyDamageTypeDefinition:', e.message); return {}; }) },
      { name: 'itemCategories', promise: getManifestComponent('DestinyItemCategoryDefinition').catch(e => { console.warn('Failed to fetch DestinyItemCategoryDefinition:', e.message); return {}; }) },
      { name: 'stats', promise: getManifestComponent('DestinyStatDefinition').catch(e => { console.warn('Failed to fetch DestinyStatDefinition:', e.message); return {}; }) },
      { name: 'progressions', promise: getManifestComponent('DestinyProgressionDefinition').catch(e => { console.warn('Failed to fetch DestinyProgressionDefinition:', e.message); return {}; }) },
      { name: 'collectibles', promise: getManifestComponent('DestinyCollectibleDefinition').catch(e => { console.warn('Failed to fetch DestinyCollectibleDefinition:', e.message); return {}; }) },
      { name: 'records', promise: getManifestComponent('DestinyRecordDefinition').catch(e => { console.warn('Failed to fetch DestinyRecordDefinition:', e.message); return {}; }) },
      { name: 'sandboxPerks', promise: getManifestComponent('DestinySandboxPerkDefinition').catch(e => { console.warn('Failed to fetch DestinySandboxPerkDefinition:', e.message); return {}; }) }
    ];

    const results = await Promise.all(componentPromises.map(c => c.promise));
    
    // FIXED: Map results back to named variables (removed talentGrids since it's not available)
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
      sandboxPerks
    ] = results;

    console.log('Processing and categorizing data...');

    // Organize data by categories using the main inventory items
    const organizedData = {
      classes: organizeByClass(manifest),
      exotics: organizeExotics(manifest),
      weapons: organizeWeapons(manifest),
      armor: organizeArmor(manifest),
      mods: organizeMods(manifest),
      artifacts: organizeArtifacts(manifest),
      abilities: organizeAbilities(manifest), // FIXED: Removed talentGrids parameter
      stats: organizeStats(stats),
      other: organizeOtherItems(manifest)
    };

    console.log('Data organization complete');
    return organizedData;

  } catch (error) {
    console.error('Error fetching Destiny data:', error);
    throw error;
  }
};

// Organize subclass abilities by class using proper Destiny 2 categorization
const organizeByClass = (inventoryItems) => {
  const classes = {
    Titan: { 
      Arc: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [], movement: [] },
      Solar: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [], movement: [] },
      Void: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [], movement: [] },
      Stasis: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [], movement: [] },
      Strand: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [], movement: [] }
    },
    Hunter: { 
      Arc: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [], movement: [] },
      Solar: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [], movement: [] },
      Void: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [], movement: [] },
      Stasis: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [], movement: [] },
      Strand: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [], movement: [] }
    },
    Warlock: { 
      Arc: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [], movement: [] },
      Solar: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [], movement: [] },
      Void: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [], movement: [] },
      Stasis: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [], movement: [] },
      Strand: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [], movement: [] }
    }
  };

  Object.values(inventoryItems).forEach(item => {
    if (!item.displayProperties?.name) return;

    const name = item.displayProperties.name;
    const description = item.displayProperties.description || '';
    
    // Use item category hashes for proper identification
    const categoryHashes = item.itemCategoryHashes || [];
    
    // Check for supers using proper categorization
    if (isProperSuper(item, categoryHashes, name, description)) {
      const className = getClassFromSuper(name, description);
      const damageType = getDamageTypeFromSuper(name, description);
      
      if (className && damageType && classes[className] && classes[className][damageType]) {
        classes[className][damageType].supers.push({
          name,
          description,
          hash: item.hash,
          categoryHashes
        });
      }
    }
    
    // Check for aspects using proper categorization  
    if (isProperAspect(item, categoryHashes, name, description)) {
      const className = getClassFromAspect(name, description);
      const damageType = getDamageTypeFromAspect(name, description);
      
      if (className && damageType && classes[className] && classes[className][damageType]) {
        classes[className][damageType].aspects.push({
          name,
          description,
          hash: item.hash
        });
      }
    }
    
    // Check for fragments using proper categorization
    if (isProperFragment(item, categoryHashes, name, description)) {
      const damageType = getDamageTypeFromFragment(name, description);
      
      // Fragments are usually cross-class, add to all classes for the damage type
      if (damageType) {
        Object.keys(classes).forEach(className => {
          if (classes[className][damageType]) {
            classes[className][damageType].fragments.push({
              name,
              description,
              hash: item.hash
            });
          }
        });
      }
    }
    
    // Check for grenades
    if (isProperGrenade(item, categoryHashes, name, description)) {
      const className = getClassFromGrenade(name, description);
      const damageType = getDamageTypeFromGrenade(name, description);
      
      if (className && damageType && classes[className] && classes[className][damageType]) {
        classes[className][damageType].grenades.push({
          name,
          description,
          hash: item.hash
        });
      } else if (damageType) {
        // Some grenades are cross-class
        Object.keys(classes).forEach(className => {
          if (classes[className][damageType]) {
            classes[className][damageType].grenades.push({
              name,
              description,
              hash: item.hash
            });
          }
        });
      }
    }
    
    // Check for melees
    if (isProperMelee(item, categoryHashes, name, description)) {
      const className = getClassFromMelee(name, description);
      const damageType = getDamageTypeFromMelee(name, description);
      
      if (className && damageType && classes[className] && classes[className][damageType]) {
        classes[className][damageType].melees.push({
          name,
          description,
          hash: item.hash
        });
      }
    }
    
    // Check for class abilities
    if (isProperClassAbility(item, categoryHashes, name, description)) {
      const className = getClassFromClassAbility(name, description);
      
      if (className) {
        // Class abilities go across all damage types for a class
        Object.keys(classes[className]).forEach(damageType => {
          classes[className][damageType].classAbilities.push({
            name,
            description,
            hash: item.hash
          });
        });
      }
    }
    
    // Check for movement abilities
    if (isProperMovement(item, categoryHashes, name, description)) {
      const className = getClassFromMovement(name, description);
      
      if (className) {
        // Movement abilities go across all damage types for a class
        Object.keys(classes[className]).forEach(damageType => {
          classes[className][damageType].movement.push({
            name,
            description,
            hash: item.hash
          });
        });
      }
    }
  });

  return classes;
};

// Organize exotic items using proper bucket hashes and item categories
const organizeExotics = (inventoryItems) => {
  const exotics = {
    armor: { Titan: [], Hunter: [], Warlock: [] },
    weapons: { kinetic: [], energy: [], heavy: [] }
  };

  Object.values(inventoryItems).forEach(item => {
    if (!item.displayProperties?.name) return;
    if (!isProperExotic(item)) return;

    const name = item.displayProperties.name;
    const description = item.displayProperties.description || '';
    const bucketHash = item.inventory?.bucketTypeHash;

    if (isProperExoticArmor(item, bucketHash)) {
      const className = getClassFromExoticArmor(item, name, description);
      if (className && exotics.armor[className]) {
        exotics.armor[className].push({
          name,
          description,
          slot: getArmorSlotFromBucket(bucketHash),
          hash: item.hash,
          bucketHash
        });
      }
    } else if (isProperExoticWeapon(item, bucketHash)) {
      const slot = getWeaponSlotFromBucket(bucketHash);
      if (slot && exotics.weapons[slot]) {
        exotics.weapons[slot].push({
          name,
          description,
          weaponType: item.itemTypeDisplayName || 'Unknown',
          damageType: getDamageTypeFromItem(item),
          hash: item.hash,
          bucketHash
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
    if (isProperExotic(item)) return; // Skip exotics, they're in separate section

    const name = item.displayProperties.name;
    const slot = getWeaponSlotFromBucket(item.inventory?.bucketTypeHash);
    
    if (slot && weapons[slot]) {
      weapons[slot].push({
        name,
        weaponType: item.itemTypeDisplayName || 'Unknown',
        damageType: getDamageTypeFromItem(item),
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
    if (isProperExotic(item)) return; // Skip exotics

    const name = item.displayProperties.name;
    const className = getClassFromExoticArmor(item, name, '');
    const slot = getArmorSlotFromBucket(item.inventory?.bucketTypeHash);
    
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

// Organize mods (excluding ornaments, trackers, and cosmetic items)
const organizeMods = (inventoryItems) => {
  const mods = {
    armor: [],
    weapon: [],
    ghost: [],
    artifact: []
  };

  Object.values(inventoryItems).forEach(item => {
    if (!item.displayProperties?.name) return;
    if (!isProperMod(item)) return;

    const name = item.displayProperties.name;
    const description = item.displayProperties.description || '';
    
    // Skip ornaments, trackers, and cosmetic items
    if (isCosmetic(item, name, description)) return;
    
    if (isProperArmorMod(item, name, description)) {
      mods.armor.push({ 
        name, 
        description, 
        hash: item.hash,
        bucketHash: item.inventory?.bucketTypeHash
      });
    } else if (isProperWeaponMod(item, name, description)) {
      mods.weapon.push({ 
        name, 
        description, 
        hash: item.hash,
        bucketHash: item.inventory?.bucketTypeHash
      });
    } else if (isProperGhostMod(item, name, description)) {
      mods.ghost.push({ 
        name, 
        description, 
        hash: item.hash 
      });
    } else if (isProperArtifactMod(item, name, description)) {
      mods.artifact.push({ 
        name, 
        description, 
        hash: item.hash 
      });
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

// FIXED: Organize abilities (simplified since DestinyTalentGridDefinition is not available)
const organizeAbilities = (inventoryItems) => {
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

// Enhanced helper functions for proper Destiny 2 item identification

// Proper exotic identification using tier type
const isProperExotic = (item) => {
  return item.inventory?.tierTypeName === 'Exotic' || 
         item.inventory?.tierType === 6; // Exotic tier type number
};

const isProperExoticArmor = (item, bucketHash) => {
  const armorBuckets = [3448274439, 3551918588, 14239492, 20886954, 1585787867]; // helmet, arms, chest, legs, class item
  return armorBuckets.includes(bucketHash);
};

const isProperExoticWeapon = (item, bucketHash) => {
  const weaponBuckets = [1498876634, 2465295065, 953998645]; // kinetic, energy, heavy
  return weaponBuckets.includes(bucketHash);
};

// Proper super identification
const isProperSuper = (item, categoryHashes, name, description) => {
  // Supers have specific category hashes and naming patterns
  const superNames = [
    'fists of havoc', 'ward of dawn', 'hammer of sol', 'burning maul', 'thundercrash',
    'golden gun', 'blade barrage', 'arc staff', 'spectral blades', 'shadowshot', 'silence and squall', 'gathering storm',
    'nova bomb', 'nova warp', 'chaos reach', 'well of radiance', 'dawnblade', 'winter\'s wrath', 'needlestorm'
  ];
  
  const lowerName = name.toLowerCase();
  return superNames.some(superName => lowerName.includes(superName)) ||
         (categoryHashes.includes(39) && description.toLowerCase().includes('super')); // Super category
};

// Proper aspect identification
const isProperAspect = (item, categoryHashes, name, description) => {
  return name.toLowerCase().includes('aspect') || 
         description.toLowerCase().includes('aspect') ||
         categoryHashes.includes(3124752623); // Aspect category hash (if it exists)
};

// Proper fragment identification  
const isProperFragment = (item, categoryHashes, name, description) => {
  const fragmentPrefixes = ['echo of', 'facet of', 'whisper of', 'spark of'];
  const lowerName = name.toLowerCase();
  return fragmentPrefixes.some(prefix => lowerName.startsWith(prefix)) ||
         name.toLowerCase().includes('fragment');
};

// Proper grenade identification
const isProperGrenade = (item, categoryHashes, name, description) => {
  const grenadeNames = [
    'frag grenade', 'pulse grenade', 'lightning grenade', 'flashbang grenade', 'suppressor grenade',
    'magnetic grenade', 'fusion grenade', 'thermite grenade', 'incendiary grenade', 'solar grenade',
    'tripmine grenade', 'swarm grenade', 'spike grenade', 'vortex grenade', 'axion bolt',
    'scatter grenade', 'void wall grenade', 'glacier grenade', 'duskfield grenade', 'coldsnap grenade',
    'threadling grenade', 'shackle grenade', 'grapple grenade'
  ];
  
  const lowerName = name.toLowerCase();
  return grenadeNames.some(grenadeName => lowerName === grenadeName);
};

// Proper melee identification
const isProperMelee = (item, categoryHashes, name, description) => {
  const meleeNames = [
    'seismic strike', 'shoulder charge', 'ballistic slam', 'throwing hammer', 'hammer strike',
    'combination blow', 'cross counter', 'tempest strike', 'weighted knife', 'proximity knife',
    'smoke bomb', 'snare bomb', 'grapple melee', 'pocket singularity', 'penumbral blast',
    'celestial fire', 'guiding flame', 'incinerator snap', 'chain lightning', 'ball lightning'
  ];
  
  const lowerName = name.toLowerCase();
  return meleeNames.some(meleeName => lowerName.includes(meleeName));
};

// Proper class ability identification
const isProperClassAbility = (item, categoryHashes, name, description) => {
  const classAbilities = [
    'healing rift', 'empowering rift', 'phoenix dive',
    'rally barricade', 'towering barricade', 'thruster',
    'marksman\'s dodge', 'gambler\'s dodge', 'acrobat\'s dodge'
  ];
  
  const lowerName = name.toLowerCase();
  return classAbilities.some(ability => lowerName.includes(ability));
};

// Proper movement ability identification
const isProperMovement = (item, categoryHashes, name, description) => {
  const movementAbilities = [
    'catapult lift', 'strafe lift', 'high lift',
    'triple jump', 'high jump', 'strafe jump',
    'burst glide', 'strafe glide', 'balanced glide'
  ];
  
  const lowerName = name.toLowerCase();
  return movementAbilities.some(movement => lowerName.includes(movement));
};

// Proper mod identification (excluding cosmetics)
const isProperMod = (item) => {
  return item.itemCategoryHashes?.includes(59) || // Mod category
         item.itemSubType === 20; // Mod subtype
};

const isCosmetic = (item, name, description) => {
  const cosmeticKeywords = [
    'ornament', 'tracker', 'emblem', 'shader', 'ship', 'sparrow', 'ghost shell',
    'finisher', 'emote', 'projection', 'transmat effect'
  ];
  
  const lowerName = name.toLowerCase();
  const lowerDesc = description.toLowerCase();
  
  return cosmeticKeywords.some(keyword => 
    lowerName.includes(keyword) || lowerDesc.includes(keyword)
  ) || item.itemCategoryHashes?.includes(41) || // Emblem category
       item.itemCategoryHashes?.includes(42) || // Shader category  
       item.itemCategoryHashes?.includes(43); // Ship category
};

const isProperArmorMod = (item, name, description) => {
  const armorModKeywords = ['armor', 'resistance', 'loader', 'targeting', 'dexterity', 'kickstart', 'distribution', 'dynamo'];
  const lowerName = name.toLowerCase();
  const lowerDesc = description.toLowerCase();
  
  return armorModKeywords.some(keyword => 
    lowerName.includes(keyword) || lowerDesc.includes(keyword)
  );
};

const isProperWeaponMod = (item, name, description) => {
  const weaponModKeywords = ['weapon', 'reload', 'magazine', 'targeting', 'counterbalance', 'backup mag'];
  const lowerName = name.toLowerCase();
  const lowerDesc = description.toLowerCase();
  
  return weaponModKeywords.some(keyword => 
    lowerName.includes(keyword) || lowerDesc.includes(keyword)
  );
};

const isProperGhostMod = (item, name, description) => {
  return description.toLowerCase().includes('ghost') || 
         name.toLowerCase().includes('ghost');
};

const isProperArtifactMod = (item, name, description) => {
  return description.toLowerCase().includes('artifact') ||
         description.toLowerCase().includes('seasonal');
};

// Class identification functions using specific ability names
const getClassFromSuper = (name, description) => {
  const titanSupers = ['fists of havoc', 'ward of dawn', 'hammer of sol', 'burning maul', 'thundercrash'];
  const hunterSupers = ['golden gun', 'blade barrage', 'arc staff', 'spectral blades', 'shadowshot', 'silence and squall', 'gathering storm'];
  const warlockSupers = ['nova bomb', 'nova warp', 'chaos reach', 'well of radiance', 'dawnblade', 'winter\'s wrath', 'needlestorm'];
  
  const lowerName = name.toLowerCase();
  
  if (titanSupers.some(s => lowerName.includes(s))) return 'Titan';
  if (hunterSupers.some(s => lowerName.includes(s))) return 'Hunter';
  if (warlockSupers.some(s => lowerName.includes(s))) return 'Warlock';
  
  return null;
};

const getDamageTypeFromSuper = (name, description) => {
  const lowerName = name.toLowerCase();
  const lowerDesc = description.toLowerCase();
  
  if (lowerName.includes('arc') || lowerDesc.includes('arc') || 
      lowerName.includes('thundercrash') || lowerName.includes('fists of havoc') ||
      lowerName.includes('arc staff') || lowerName.includes('chaos reach')) return 'Arc';
      
  if (lowerName.includes('solar') || lowerDesc.includes('solar') ||
      lowerName.includes('hammer') || lowerName.includes('golden gun') ||
      lowerName.includes('dawnblade') || lowerName.includes('well of radiance')) return 'Solar';
      
  if (lowerName.includes('void') || lowerDesc.includes('void') ||
      lowerName.includes('ward of dawn') || lowerName.includes('shadowshot') ||
      lowerName.includes('nova bomb') || lowerName.includes('spectral blades')) return 'Void';
      
  if (lowerName.includes('stasis') || lowerDesc.includes('stasis') ||
      lowerName.includes('silence and squall') || lowerName.includes('winter\'s wrath')) return 'Stasis';
      
  if (lowerName.includes('strand') || lowerDesc.includes('strand') ||
      lowerName.includes('gathering storm') || lowerName.includes('needlestorm')) return 'Strand';
      
  return 'Unknown';
};

const getClassFromAbilityName = (name, description) => {
  const lowerName = name.toLowerCase();
  const lowerDesc = description.toLowerCase();
  
  // Titan-specific terms
  if (lowerName.includes('titan') || lowerDesc.includes('titan') ||
      lowerName.includes('barricade') || lowerName.includes('lift')) return 'Titan';
      
  // Hunter-specific terms  
  if (lowerName.includes('hunter') || lowerDesc.includes('hunter') ||
      lowerName.includes('dodge') || lowerName.includes('jump')) return 'Hunter';
      
  // Warlock-specific terms
  if (lowerName.includes('warlock') || lowerDesc.includes('warlock') ||
      lowerName.includes('rift') || lowerName.includes('glide')) return 'Warlock';
      
  return null;
};

// Bucket hash to slot mapping
const getArmorSlotFromBucket = (bucketHash) => {
  const bucketMap = {
    3448274439: 'helmet',
    3551918588: 'arms', 
    14239492: 'chest',
    20886954: 'legs',
    1585787867: 'classItem'
  };
  return bucketMap[bucketHash] || 'unknown';
};

const getWeaponSlotFromBucket = (bucketHash) => {
  const bucketMap = {
    1498876634: 'kinetic',
    2465295065: 'energy', 
    953998645: 'heavy'
  };
  return bucketMap[bucketHash] || 'unknown';
};

const getClassFromExoticArmor = (item, name, description) => {
  // Use classType from item data if available
  if (item.classType !== undefined) {
    const classMap = { 0: 'Titan', 1: 'Hunter', 2: 'Warlock' };
    return classMap[item.classType];
  }
  
  // Fallback to name/description analysis
  return getClassFromAbilityName(name, description);
};

const getDamageTypeFromItem = (item) => {
  if (item.damageTypeHashes && item.damageTypeHashes.length > 0) {
    const damageMap = {
      1: 'Kinetic',
      2: 'Arc', 
      3: 'Solar',
      4: 'Void',
      6: 'Stasis',
      7: 'Strand'
    };
    return damageMap[item.damageTypeHashes[0]] || 'Unknown';
  }
  return 'Kinetic';
};

// Helper functions for other ability types
const getClassFromAspect = (name, description) => {
  return getClassFromAbilityName(name, description);
};

const getDamageTypeFromAspect = (name, description) => {
  return getDamageTypeFromSuper(name, description);
};

const getClassFromGrenade = (name, description) => {
  // Most grenades are cross-class, return null to add to all classes
  return null;
};

const getDamageTypeFromGrenade = (name, description) => {
  return getDamageTypeFromSuper(name, description);
};

const getClassFromMelee = (name, description) => {
  return getClassFromAbilityName(name, description);
};

const getDamageTypeFromMelee = (name, description) => {
  return getDamageTypeFromSuper(name, description);
};

const getClassFromClassAbility = (name, description) => {
  return getClassFromAbilityName(name, description);
};

const getClassFromMovement = (name, description) => {
  return getClassFromAbilityName(name, description);
};

const getDamageTypeFromFragment = (name, description) => {
  return getDamageTypeFromSuper(name, description);
};

// Basic helper functions for backwards compatibility
const isWeapon = (item) => {
  return item.itemCategoryHashes?.includes(1) || // Weapon category
         item.itemTypeDisplayName?.includes('Weapon');
};

const isArmor = (item) => {
  return item.itemCategoryHashes?.includes(20) || // Armor category
         item.itemTypeDisplayName?.includes('Armor');
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