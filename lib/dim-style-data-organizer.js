import manifestCache from './manifest-cache-manager';

// DIM-style item categorization constants
export const ITEM_TYPES = {
  WEAPON: 'weapon',
  ARMOR: 'armor',
  GHOST: 'ghost',
  SPARROW: 'sparrow',
  SHIP: 'ship',
  EMBLEM: 'emblem',
  SHADER: 'shader',
  EMOTE: 'emote',
  CONSUMABLE: 'consumable',
  MODIFICATION: 'modification',
  SUBCLASS: 'subclass'
};

export const WEAPON_SLOTS = {
  KINETIC: 'kinetic',
  ENERGY: 'energy',
  POWER: 'power'
};

export const ARMOR_SLOTS = {
  HELMET: 'helmet',
  GAUNTLETS: 'gauntlets',
  CHEST: 'chest',
  LEGS: 'legs',
  CLASS_ITEM: 'classItem'
};

export const DAMAGE_TYPES = {
  KINETIC: 1,
  ARC: 2,
  SOLAR: 3,
  VOID: 4,
  STASIS: 6,
  STRAND: 7
};

export const CLASS_TYPES = {
  TITAN: 0,
  HUNTER: 1,
  WARLOCK: 2,
  UNKNOWN: 3
};

export const TIER_TYPES = {
  BASIC: 2,
  COMMON: 3,
  RARE: 4,
  LEGENDARY: 5,
  EXOTIC: 6
};

// DIM-style bucket hash mappings
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
  
  // Other
  GHOST: 4023194814,
  SPARROW: 2025709351,
  SHIP: 284967655,
  EMBLEM: 4274335291,
  SUBCLASS: 3284755031
};

class DIMStyleDataOrganizer {
  constructor() {
    this.manifestData = null;
    this.organizedData = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      console.log('Initializing DIM-style data organizer...');
      
      // Initialize manifest cache
      await manifestCache.initialize();
      
      // Load manifest data
      this.manifestData = await manifestCache.getComponentData('DestinyInventoryItemDefinition');
      
      console.log(`Loaded ${Object.keys(this.manifestData).length} items from manifest`);
      
      // Organize the data
      this.organizedData = await this.organizeManifestData();
      
      this.isInitialized = true;
      console.log('DIM-style data organizer initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize data organizer:', error);
      throw error;
    }
  }

  async organizeManifestData() {
    console.log('Organizing manifest data DIM-style...');
    
    const organized = {
      weapons: {
        kinetic: [],
        energy: [],
        power: []
      },
      armor: {
        titan: { helmet: [], gauntlets: [], chest: [], legs: [], classItem: [] },
        hunter: { helmet: [], gauntlets: [], chest: [], legs: [], classItem: [] },
        warlock: { helmet: [], gauntlets: [], chest: [], legs: [], classItem: [] }
      },
      subclass: {
        titan: { arc: [], solar: [], void: [], stasis: [], strand: [] },
        hunter: { arc: [], solar: [], void: [], stasis: [], strand: [] },
        warlock: { arc: [], solar: [], void: [], stasis: [], strand: [] }
      },
      mods: {
        armor: [],
        weapon: [],
        ghost: []
      },
      cosmetics: {
        shaders: [],
        emblems: [],
        ships: [],
        sparrows: [],
        emotes: []
      },
      buildEssentials: {
        exoticWeapons: [],
        exoticArmor: [],
        aspects: [],
        fragments: [],
        abilities: []
      },
      metadata: {
        totalItems: 0,
        processedItems: 0,
        categories: {},
        lastOrganized: Date.now()
      }
    };

    let processedCount = 0;
    const totalItems = Object.keys(this.manifestData).length;

    // Process each item from the manifest
    for (const [hash, item] of Object.entries(this.manifestData)) {
      try {
        if (!item?.displayProperties?.name || !item.displayProperties.name.trim()) {
          continue; // Skip items without names
        }

        // Create enhanced item object (DIM-style)
        const enhancedItem = this.createEnhancedItem(item);
        
        // Skip filtered items (like test items, deprecated items)
        if (this.shouldFilterItem(enhancedItem)) {
          continue;
        }

        // Categorize the item
        this.categorizeItem(enhancedItem, organized);
        
        processedCount++;
        
        // Progress logging for large datasets
        if (processedCount % 5000 === 0) {
          console.log(`Processed ${processedCount}/${totalItems} items...`);
        }

      } catch (error) {
        console.warn(`Error processing item ${hash}:`, error);
      }
    }

    // Update metadata
    organized.metadata.totalItems = totalItems;
    organized.metadata.processedItems = processedCount;
    organized.metadata.categories = this.calculateCategoryStats(organized);

    console.log(`Data organization complete: ${processedCount}/${totalItems} items processed`);
    console.log('Category breakdown:', organized.metadata.categories);

    return organized;
  }

  createEnhancedItem(rawItem) {
    // DIM-style item enhancement with calculated properties
    const enhanced = {
      hash: rawItem.hash,
      name: rawItem.displayProperties?.name || '',
      description: rawItem.displayProperties?.description || '',
      icon: rawItem.displayProperties?.icon || '',
      
      // Basic properties
      itemType: this.determineItemType(rawItem),
      itemSubType: rawItem.itemSubType || 0,
      classType: rawItem.classType ?? CLASS_TYPES.UNKNOWN,
      tierType: rawItem.inventory?.tierType || TIER_TYPES.COMMON,
      
      // Weapon/Armor specific
      bucketTypeHash: rawItem.inventory?.bucketTypeHash,
      slot: this.determineSlot(rawItem),
      damageType: this.determineDamageType(rawItem),
      
      // Categorization helpers
      isExotic: rawItem.inventory?.tierType === TIER_TYPES.EXOTIC,
      isWeapon: this.isWeapon(rawItem),
      isArmor: this.isArmor(rawItem),
      isMod: this.isMod(rawItem),
      isSubclass: this.isSubclass(rawItem),
      
      // Build relevance
      isBuildRelevant: this.isBuildRelevant(rawItem),
      buildCategory: this.determineBuildCategory(rawItem),
      
      // Search indexing (DIM-style)
      searchTerms: this.generateSearchTerms(rawItem),
      
      // Original item reference
      originalItem: rawItem
    };

    return enhanced;
  }

  determineItemType(item) {
    // DIM-style item type determination
    if (this.isWeapon(item)) return ITEM_TYPES.WEAPON;
    if (this.isArmor(item)) return ITEM_TYPES.ARMOR;
    if (this.isSubclass(item)) return ITEM_TYPES.SUBCLASS;
    if (this.isMod(item)) return ITEM_TYPES.MODIFICATION;
    if (this.isGhost(item)) return ITEM_TYPES.GHOST;
    if (this.isShader(item)) return ITEM_TYPES.SHADER;
    if (this.isEmblem(item)) return ITEM_TYPES.EMBLEM;
    if (this.isSparrow(item)) return ITEM_TYPES.SPARROW;
    if (this.isShip(item)) return ITEM_TYPES.SHIP;
    if (this.isEmote(item)) return ITEM_TYPES.EMOTE;
    
    return ITEM_TYPES.CONSUMABLE; // Default fallback
  }

  determineSlot(item) {
    const bucketHash = item.inventory?.bucketTypeHash;
    
    // Weapon slots
    if (bucketHash === BUCKET_HASHES.KINETIC_WEAPONS) return WEAPON_SLOTS.KINETIC;
    if (bucketHash === BUCKET_HASHES.ENERGY_WEAPONS) return WEAPON_SLOTS.ENERGY;
    if (bucketHash === BUCKET_HASHES.POWER_WEAPONS) return WEAPON_SLOTS.POWER;
    
    // Armor slots
    if (bucketHash === BUCKET_HASHES.HELMET) return ARMOR_SLOTS.HELMET;
    if (bucketHash === BUCKET_HASHES.GAUNTLETS) return ARMOR_SLOTS.GAUNTLETS;
    if (bucketHash === BUCKET_HASHES.CHEST_ARMOR) return ARMOR_SLOTS.CHEST;
    if (bucketHash === BUCKET_HASHES.LEG_ARMOR) return ARMOR_SLOTS.LEGS;
    if (bucketHash === BUCKET_HASHES.CLASS_ITEM) return ARMOR_SLOTS.CLASS_ITEM;
    
    return 'unknown';
  }

  determineDamageType(item) {
    // Check multiple sources for damage type (DIM approach)
    const damageType = item.damageType || item.defaultDamageType || DAMAGE_TYPES.KINETIC;
    
    // Map to readable names
    switch (damageType) {
      case DAMAGE_TYPES.ARC: return 'Arc';
      case DAMAGE_TYPES.SOLAR: return 'Solar';
      case DAMAGE_TYPES.VOID: return 'Void';
      case DAMAGE_TYPES.STASIS: return 'Stasis';
      case DAMAGE_TYPES.STRAND: return 'Strand';
      default: return 'Kinetic';
    }
  }

  determineBuildCategory(item) {
    // DIM-style build categorization
    if (item.inventory?.tierType === TIER_TYPES.EXOTIC) {
      return this.isWeapon(item) ? 'exoticWeapon' : 'exoticArmor';
    }
    
    const name = item.displayProperties?.name?.toLowerCase() || '';
    const description = item.displayProperties?.description?.toLowerCase() || '';
    
    if (name.includes('aspect') || description.includes('aspect')) return 'aspect';
    if (name.includes('fragment') || description.includes('fragment')) return 'fragment';
    if (name.includes('grenade')) return 'grenade';
    if (name.includes('melee')) return 'melee';
    if (this.isSubclass(item)) return 'subclass';
    if (this.isMod(item)) return 'mod';
    
    return 'other';
  }

  categorizeItem(item, organized) {
    // DIM-style categorization into organized structure
    
    // Weapons
    if (item.isWeapon) {
      if (item.slot && organized.weapons[item.slot]) {
        organized.weapons[item.slot].push(item);
      }
    }
    
    // Armor
    else if (item.isArmor) {
      const className = this.getClassNameFromType(item.classType);
      if (className && item.slot && organized.armor[className]?.[item.slot]) {
        organized.armor[className][item.slot].push(item);
      }
    }
    
    // Subclass items
    else if (item.isSubclass) {
      const className = this.getClassNameFromType(item.classType);
      const damageType = item.damageType.toLowerCase();
      if (className && organized.subclass[className]?.[damageType]) {
        organized.subclass[className][damageType].push(item);
      }
    }
    
    // Mods
    else if (item.isMod) {
      if (item.name.toLowerCase().includes('weapon')) {
        organized.mods.weapon.push(item);
      } else if (item.name.toLowerCase().includes('ghost')) {
        organized.mods.ghost.push(item);
      } else {
        organized.mods.armor.push(item);
      }
    }
    
    // Build essentials
    if (item.isBuildRelevant) {
      switch (item.buildCategory) {
        case 'exoticWeapon':
          organized.buildEssentials.exoticWeapons.push(item);
          break;
        case 'exoticArmor':
          organized.buildEssentials.exoticArmor.push(item);
          break;
        case 'aspect':
          organized.buildEssentials.aspects.push(item);
          break;
        case 'fragment':
          organized.buildEssentials.fragments.push(item);
          break;
        case 'grenade':
        case 'melee':
          organized.buildEssentials.abilities.push(item);
          break;
      }
    }
    
    // Cosmetics
    if (item.itemType === ITEM_TYPES.SHADER) {
      organized.cosmetics.shaders.push(item);
    } else if (item.itemType === ITEM_TYPES.EMBLEM) {
      organized.cosmetics.emblems.push(item);
    } else if (item.itemType === ITEM_TYPES.SHIP) {
      organized.cosmetics.ships.push(item);
    } else if (item.itemType === ITEM_TYPES.SPARROW) {
      organized.cosmetics.sparrows.push(item);
    } else if (item.itemType === ITEM_TYPES.EMOTE) {
      organized.cosmetics.emotes.push(item);
    }
  }

  // Helper methods for item type detection (DIM-style)
  isWeapon(item) {
    return item.itemCategoryHashes?.includes(1) || false; // Weapon category
  }

  isArmor(item) {
    return item.itemCategoryHashes?.includes(20) || false; // Armor category
  }

  isMod(item) {
    return item.itemCategoryHashes?.includes(59) || false; // Modification category
  }

  isSubclass(item) {
    return item.inventory?.bucketTypeHash === BUCKET_HASHES.SUBCLASS;
  }

  isGhost(item) {
    return item.inventory?.bucketTypeHash === BUCKET_HASHES.GHOST;
  }

  isShader(item) {
    return item.itemCategoryHashes?.includes(42) || false;
  }

  isEmblem(item) {
    return item.itemCategoryHashes?.includes(41) || false;
  }

  isSparrow(item) {
    return item.itemCategoryHashes?.includes(44) || false;
  }

  isShip(item) {
    return item.itemCategoryHashes?.includes(43) || false;
  }

  isEmote(item) {
    return item.itemCategoryHashes?.includes(50) || false;
  }

  isBuildRelevant(item) {
    // DIM-style build relevance determination
    return item.inventory?.tierType === TIER_TYPES.EXOTIC ||
           this.isSubclass(item) ||
           this.isMod(item) ||
           item.displayProperties?.name?.toLowerCase().includes('aspect') ||
           item.displayProperties?.name?.toLowerCase().includes('fragment');
  }

  shouldFilterItem(item) {
    // DIM-style filtering of unwanted items
    const name = item.name.toLowerCase();
    
    // Filter test items, deprecated items, etc.
    if (name.includes('[test]') || 
        name.includes('[deprecated]') ||
        name.includes('test_') ||
        name.startsWith('deprecated') ||
        !name.trim()) {
      return true;
    }
    
    return false;
  }

  generateSearchTerms(item) {
    // DIM-style search term generation
    const terms = [
      item.displayProperties?.name || '',
      item.displayProperties?.description || '',
      item.itemTypeDisplayName || '',
      this.getClassNameFromType(item.classType),
      this.determineDamageType(item)
    ].filter(term => term && term.trim());
    
    return terms.join(' ').toLowerCase();
  }

  getClassNameFromType(classType) {
    switch (classType) {
      case CLASS_TYPES.TITAN: return 'titan';
      case CLASS_TYPES.HUNTER: return 'hunter';
      case CLASS_TYPES.WARLOCK: return 'warlock';
      default: return null;
    }
  }

  calculateCategoryStats(organized) {
    return {
      weapons: {
        kinetic: organized.weapons.kinetic.length,
        energy: organized.weapons.energy.length,
        power: organized.weapons.power.length
      },
      armor: {
        titan: Object.values(organized.armor.titan).reduce((sum, arr) => sum + arr.length, 0),
        hunter: Object.values(organized.armor.hunter).reduce((sum, arr) => sum + arr.length, 0),
        warlock: Object.values(organized.armor.warlock).reduce((sum, arr) => sum + arr.length, 0)
      },
      buildEssentials: {
        exoticWeapons: organized.buildEssentials.exoticWeapons.length,
        exoticArmor: organized.buildEssentials.exoticArmor.length,
        aspects: organized.buildEssentials.aspects.length,
        fragments: organized.buildEssentials.fragments.length,
        abilities: organized.buildEssentials.abilities.length
      },
      mods: {
        armor: organized.mods.armor.length,
        weapon: organized.mods.weapon.length,
        ghost: organized.mods.ghost.length
      }
    };
  }

  // Public API methods
  async getOrganizedData() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.organizedData;
  }

  async getBuildEssentials() {
    const data = await this.getOrganizedData();
    return data.buildEssentials;
  }

  async getWeaponsBySlot(slot) {
    const data = await this.getOrganizedData();
    return data.weapons[slot] || [];
  }

  async getArmorByClass(className) {
    const data = await this.getOrganizedData();
    return data.armor[className] || {};
  }

  async search(query) {
    // DIM-style search implementation
    const data = await this.getOrganizedData();
    const results = [];
    const searchTerms = query.toLowerCase().split(' ');
    
    // Search through all items
    const allItems = [
      ...Object.values(data.weapons).flat(),
      ...Object.values(data.armor).map(classArmor => Object.values(classArmor).flat()).flat(),
      ...data.buildEssentials.exoticWeapons,
      ...data.buildEssentials.exoticArmor,
      ...data.buildEssentials.aspects,
      ...data.buildEssentials.fragments
    ];
    
    for (const item of allItems) {
      const searchableText = item.searchTerms;
      const matches = searchTerms.every(term => searchableText.includes(term));
      
      if (matches) {
        results.push(item);
      }
    }
    
    return results;
  }
}

// Singleton instance
const dimStyleOrganizer = new DIMStyleDataOrganizer();

export default dimStyleOrganizer;