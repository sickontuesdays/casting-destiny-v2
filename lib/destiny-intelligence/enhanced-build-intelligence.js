import { StatCalculator } from './stat-calculator.js';
import { SynergyEngine } from './synergy-engine.js';

export class EnhancedBuildIntelligence {
  constructor(baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.statCalculator = new StatCalculator();
    this.synergyEngine = new SynergyEngine();
  }

  async generateBuild(request) {
    try {
      console.log('🎯 Enhanced Build Intelligence - Starting generation');
      console.log('📝 Request:', JSON.stringify(request, null, 2));

      // Get all necessary data from Bungie API only
      const [inventory, manifest, availableItems] = await Promise.all([
        this.fetchBungieInventory(),
        this.fetchBungieManifest(), 
        this.fetchAvailableItems()
      ]);

      if (!inventory || !manifest || !availableItems) {
        throw new Error('Failed to fetch required data from Bungie API');
      }

      // Parse the build request
      const buildRequest = this.parseBuildRequest(request);
      
      // Generate the intelligent build
      const build = await this.createIntelligentBuild(buildRequest, {
        inventory,
        manifest,
        availableItems
      });

      console.log('✅ Build generation successful');
      return build;

    } catch (error) {
      console.error('❌ Enhanced build intelligence error:', error);
      throw new Error(`Build generation failed: ${error.message}`);
    }
  }

  async fetchBungieInventory() {
    try {
      console.log('📦 Fetching Bungie inventory...');
      const response = await fetch(`${this.baseUrl}/api/bungie/inventory`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Inventory API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error('Invalid inventory data structure from Bungie API');
      }

      console.log('✅ Bungie inventory fetched successfully');
      return data.data;
    } catch (error) {
      console.error('❌ Failed to fetch Bungie inventory:', error);
      throw error;
    }
  }

  async fetchBungieManifest() {
    try {
      console.log('📋 Fetching Bungie manifest...');
      const response = await fetch(`${this.baseUrl}/api/bungie/manifest`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Manifest API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data || !data.DestinyInventoryItemDefinition) {
        throw new Error('Invalid manifest data structure from Bungie API');
      }

      console.log('✅ Bungie manifest fetched successfully');
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch Bungie manifest:', error);
      throw error;
    }
  }

  async fetchAvailableItems() {
    try {
      console.log('🔍 Fetching available items from Bungie...');
      const response = await fetch(`${this.baseUrl}/api/inventory/available-items`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Available items API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error('Invalid available items data structure from Bungie API');
      }

      console.log('✅ Available items fetched successfully');
      return data.data;
    } catch (error) {
      console.error('❌ Failed to fetch available items:', error);
      throw error;
    }
  }

  parseBuildRequest(request) {
    console.log('🔤 Parsing build request...');
    
    const buildRequest = {
      playstyle: request.playstyle || 'balanced',
      subclass: request.subclass || 'any',
      element: request.element || 'any',
      weaponPreferences: request.weaponPreferences || [],
      armorPreferences: request.armorPreferences || [],
      focusStats: request.focusStats || [],
      activities: request.activities || ['general'],
      constraints: request.constraints || {}
    };

    // Normalize element to include Prismatic
    const validElements = ['Solar', 'Arc', 'Void', 'Stasis', 'Strand', 'Prismatic'];
    if (buildRequest.element !== 'any' && !validElements.includes(buildRequest.element)) {
      console.log(`⚠️ Unknown element: ${buildRequest.element}, defaulting to 'any'`);
      buildRequest.element = 'any';
    }

    console.log('✅ Build request parsed:', JSON.stringify(buildRequest, null, 2));
    return buildRequest;
  }

  async createIntelligentBuild(buildRequest, gameData) {
    console.log('🧠 Creating intelligent build...');

    const { inventory, manifest, availableItems } = gameData;

    // Filter items based on request criteria
    const filteredItems = this.filterItemsByRequest(buildRequest, availableItems, manifest);
    
    // Generate base build structure
    const build = {
      metadata: {
        generated: new Date().toISOString(),
        playstyle: buildRequest.playstyle,
        subclass: buildRequest.subclass,
        element: buildRequest.element,
        focusStats: buildRequest.focusStats,
        activities: buildRequest.activities
      },
      subclass: this.selectOptimalSubclass(buildRequest, manifest),
      weapons: this.selectOptimalWeapons(buildRequest, filteredItems.weapons, manifest),
      armor: this.selectOptimalArmor(buildRequest, filteredItems.armor, manifest),
      stats: {},
      synergies: [],
      recommendations: []
    };

    // Calculate stats with the stat calculator
    build.stats = this.statCalculator.calculateBuildStats(build);

    // Generate synergies with the synergy engine  
    build.synergies = this.synergyEngine.analyzeBuildSynergies(build, manifest);

    // Generate recommendations
    build.recommendations = this.generateBuildRecommendations(build, buildRequest, manifest);

    console.log('✅ Intelligent build created successfully');
    return build;
  }

  filterItemsByRequest(request, availableItems, manifest) {
    console.log('🔍 Filtering items by request criteria...');

    const filtered = {
      weapons: [],
      armor: []
    };

    // Filter weapons
    if (availableItems.weapons) {
      filtered.weapons = availableItems.weapons.filter(weapon => {
        // Element filter (including Prismatic)
        if (request.element !== 'any') {
          const weaponElement = this.getWeaponElement(weapon, manifest);
          if (weaponElement !== request.element && weaponElement !== 'Kinetic') {
            return false;
          }
        }

        // Weapon type preferences
        if (request.weaponPreferences.length > 0) {
          const weaponType = this.getWeaponType(weapon, manifest);
          if (!request.weaponPreferences.some(pref => 
            weaponType.toLowerCase().includes(pref.toLowerCase())
          )) {
            return false;
          }
        }

        return true;
      });
    }

    // Filter armor
    if (availableItems.armor) {
      filtered.armor = availableItems.armor.filter(armor => {
        // Armor type preferences
        if (request.armorPreferences.length > 0) {
          const armorType = this.getArmorType(armor, manifest);
          if (!request.armorPreferences.some(pref =>
            armorType.toLowerCase().includes(pref.toLowerCase())
          )) {
            return false;
          }
        }

        return true;
      });
    }

    console.log(`✅ Filtered to ${filtered.weapons.length} weapons, ${filtered.armor.length} armor pieces`);
    return filtered;
  }

  selectOptimalSubclass(request, manifest) {
    console.log('🏛️ Selecting optimal subclass...');

    // Map of elements to representative subclass info
    const subclassOptions = {
      'Solar': {
        element: 'Solar',
        name: 'Solar Subclass',
        description: 'Harness the power of Solar Light for burning damage and ability regeneration',
        icon: 'https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_3454344768.png',
        abilities: ['Solar Grenade', 'Solar Melee', 'Solar Super'],
        aspects: ['Solar Aspect 1', 'Solar Aspect 2'],
        fragments: ['Solar Fragment 1', 'Solar Fragment 2', 'Solar Fragment 3']
      },
      'Arc': {
        element: 'Arc',
        name: 'Arc Subclass', 
        description: 'Channel Arc energy for chain lightning and enhanced mobility',
        icon: 'https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_2303181850.png',
        abilities: ['Arc Grenade', 'Arc Melee', 'Arc Super'],
        aspects: ['Arc Aspect 1', 'Arc Aspect 2'],
        fragments: ['Arc Fragment 1', 'Arc Fragment 2', 'Arc Fragment 3']
      },
      'Void': {
        element: 'Void',
        name: 'Void Subclass',
        description: 'Manipulate Void energy for suppression and devour effects', 
        icon: 'https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_3373582085.png',
        abilities: ['Void Grenade', 'Void Melee', 'Void Super'],
        aspects: ['Void Aspect 1', 'Void Aspect 2'], 
        fragments: ['Void Fragment 1', 'Void Fragment 2', 'Void Fragment 3']
      },
      'Stasis': {
        element: 'Stasis',
        name: 'Stasis Subclass',
        description: 'Wield Stasis crystals for crowd control and area denial',
        icon: 'https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_151347233.png', 
        abilities: ['Stasis Grenade', 'Stasis Melee', 'Stasis Super'],
        aspects: ['Stasis Aspect 1', 'Stasis Aspect 2'],
        fragments: ['Stasis Fragment 1', 'Stasis Fragment 2', 'Stasis Fragment 3']
      },
      'Strand': {
        element: 'Strand',
        name: 'Strand Subclass',
        description: 'Manipulate the weave of reality with Strand for grappling and unraveling',
        icon: 'https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_453755108.png',
        abilities: ['Strand Grenade', 'Strand Melee', 'Strand Super'],
        aspects: ['Strand Aspect 1', 'Strand Aspect 2'],
        fragments: ['Strand Fragment 1', 'Strand Fragment 2', 'Strand Fragment 3']
      },
      'Prismatic': {
        element: 'Prismatic', 
        name: 'Prismatic Subclass',
        description: 'Combine Light and Dark powers for ultimate versatility and transcendence',
        icon: 'https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_1847025511.png',
        abilities: ['Prismatic Grenade', 'Prismatic Melee', 'Prismatic Super'],
        aspects: ['Light Aspect', 'Dark Aspect'],
        fragments: ['Prismatic Fragment 1', 'Prismatic Fragment 2', 'Transcendence Fragment']
      }
    };

    // Select based on request or default to Solar
    let selectedElement = request.element;
    if (selectedElement === 'any' || !subclassOptions[selectedElement]) {
      selectedElement = 'Solar';
    }

    const selectedSubclass = subclassOptions[selectedElement];
    console.log(`✅ Selected ${selectedElement} subclass`);
    return selectedSubclass;
  }

  selectOptimalWeapons(request, availableWeapons, manifest) {
    console.log('🔫 Selecting optimal weapons...');

    const weapons = {
      kinetic: null,
      energy: null, 
      power: null
    };

    // Group weapons by slot
    const weaponsBySlot = {
      kinetic: availableWeapons.filter(w => this.getWeaponSlot(w, manifest) === 'kinetic'),
      energy: availableWeapons.filter(w => this.getWeaponSlot(w, manifest) === 'energy'),
      power: availableWeapons.filter(w => this.getWeaponSlot(w, manifest) === 'power')
    };

    // Select best weapon for each slot
    Object.keys(weapons).forEach(slot => {
      const slotWeapons = weaponsBySlot[slot];
      if (slotWeapons.length > 0) {
        // Sort by preference - exotics first, then by name
        slotWeapons.sort((a, b) => {
          const aTier = this.getItemTier(a, manifest);
          const bTier = this.getItemTier(b, manifest);
          if (aTier !== bTier) return bTier - aTier; // Higher tier first
          return a.name?.localeCompare(b.name) || 0;
        });
        
        weapons[slot] = this.formatWeaponForBuild(slotWeapons[0], manifest);
      }
    });

    console.log('✅ Optimal weapons selected');
    return weapons;
  }

  selectOptimalArmor(request, availableArmor, manifest) {
    console.log('🛡️ Selecting optimal armor...');

    const armor = {
      helmet: null,
      arms: null,
      chest: null, 
      legs: null,
      class: null
    };

    // Group armor by slot
    const armorBySlot = {
      helmet: availableArmor.filter(a => this.getArmorSlot(a, manifest) === 'helmet'),
      arms: availableArmor.filter(a => this.getArmorSlot(a, manifest) === 'arms'),
      chest: availableArmor.filter(a => this.getArmorSlot(a, manifest) === 'chest'),
      legs: availableArmor.filter(a => this.getArmorSlot(a, manifest) === 'legs'),
      class: availableArmor.filter(a => this.getArmorSlot(a, manifest) === 'class')
    };

    // Select best armor for each slot
    Object.keys(armor).forEach(slot => {
      const slotArmor = armorBySlot[slot];
      if (slotArmor.length > 0) {
        // Sort by preference - exotics first, then by name
        slotArmor.sort((a, b) => {
          const aTier = this.getItemTier(a, manifest);
          const bTier = this.getItemTier(b, manifest);
          if (aTier !== bTier) return bTier - aTier; // Higher tier first
          return a.name?.localeCompare(b.name) || 0;
        });
        
        armor[slot] = this.formatArmorForBuild(slotArmor[0], manifest);
      }
    });

    console.log('✅ Optimal armor selected');
    return armor;
  }

  // Helper methods for item analysis
  getWeaponElement(weapon, manifest) {
    const definition = manifest.DestinyInventoryItemDefinition?.[weapon.itemHash];
    const damageType = definition?.defaultDamageType;
    
    const damageTypes = {
      1: 'Kinetic',
      2: 'Arc',
      3: 'Solar', 
      4: 'Void',
      6: 'Stasis',
      7: 'Strand',
      8: 'Prismatic'
    };
    
    return damageTypes[damageType] || 'Kinetic';
  }

  getWeaponType(weapon, manifest) {
    const definition = manifest.DestinyInventoryItemDefinition?.[weapon.itemHash];
    const itemSubType = definition?.itemSubType;
    
    const weaponTypes = {
      1: 'Auto Rifle',
      2: 'Shotgun',
      3: 'Machine Gun', 
      4: 'Hand Cannon',
      5: 'Rocket Launcher',
      6: 'Fusion Rifle',
      7: 'Sniper Rifle',
      8: 'Pulse Rifle',
      9: 'Scout Rifle',
      10: 'Sidearm',
      11: 'Sword',
      12: 'Linear Fusion Rifle',
      13: 'Grenade Launcher',
      14: 'Submachine Gun',
      15: 'Trace Rifle',
      16: 'Bow',
      17: 'Glaive'
    };
    
    return weaponTypes[itemSubType] || 'Unknown';
  }

  getWeaponSlot(weapon, manifest) {
    const definition = manifest.DestinyInventoryItemDefinition?.[weapon.itemHash];
    const bucketHash = definition?.inventory?.bucketTypeHash;
    
    if (bucketHash === 1498876634) return 'kinetic';
    if (bucketHash === 2465295065) return 'energy';  
    if (bucketHash === 953998645) return 'power';
    
    return 'unknown';
  }

  getArmorType(armor, manifest) {
    const definition = manifest.DestinyInventoryItemDefinition?.[armor.itemHash];
    const itemSubType = definition?.itemSubType;
    
    const armorTypes = {
      1: 'Helmet',
      2: 'Arms',
      3: 'Chest',
      4: 'Legs', 
      5: 'Class Item'
    };
    
    return armorTypes[itemSubType] || 'Unknown';
  }

  getArmorSlot(armor, manifest) {
    const definition = manifest.DestinyInventoryItemDefinition?.[armor.itemHash];
    const bucketHash = definition?.inventory?.bucketTypeHash;
    
    if (bucketHash === 3448274439) return 'helmet';
    if (bucketHash === 3551918588) return 'arms';
    if (bucketHash === 14239492) return 'chest'; 
    if (bucketHash === 20886954) return 'legs';
    if (bucketHash === 1585787867) return 'class';
    
    return 'unknown';
  }

  getItemTier(item, manifest) {
    const definition = manifest.DestinyInventoryItemDefinition?.[item.itemHash];
    return definition?.inventory?.tierType || 0;
  }

  formatWeaponForBuild(weapon, manifest) {
    const element = this.getWeaponElement(weapon, manifest);
    return {
      itemHash: weapon.itemHash,
      name: weapon.name,
      type: this.getWeaponType(weapon, manifest),
      slot: this.getWeaponSlot(weapon, manifest),
      element: element,
      elementIcon: this.getElementIcon(element),
      icon: weapon.icon,
      tier: this.getItemTier(weapon, manifest),
      description: weapon.description || ''
    };
  }

  formatArmorForBuild(armor, manifest) {
    return {
      itemHash: armor.itemHash,
      name: armor.name,
      type: this.getArmorType(armor, manifest),
      slot: this.getArmorSlot(armor, manifest), 
      icon: armor.icon,
      tier: this.getItemTier(armor, manifest),
      description: armor.description || '',
      stats: armor.stats || []
    };
  }

  getElementIcon(elementName) {
    const elementIcons = {
      'Solar': 'https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_3454344768.png',
      'Arc': 'https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_2303181850.png',
      'Void': 'https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_3373582085.png',
      'Stasis': 'https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_151347233.png',
      'Strand': 'https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_453755108.png', 
      'Prismatic': 'https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_1847025511.png',
      'Kinetic': 'https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_3373582085.png'
    };
    return elementIcons[elementName] || elementIcons['Kinetic'];
  }

  generateBuildRecommendations(build, request, manifest) {
    console.log('💡 Generating build recommendations...');
    
    const recommendations = [];

    // Analyze current build for improvement suggestions
    if (!build.weapons.kinetic) {
      recommendations.push({
        type: 'warning',
        title: 'Missing Kinetic Weapon',
        description: 'Consider equipping a kinetic weapon for better loadout balance'
      });
    }

    if (!build.weapons.energy) {
      recommendations.push({
        type: 'warning', 
        title: 'Missing Energy Weapon',
        description: 'An energy weapon would provide elemental damage options'
      });
    }

    if (!build.weapons.power) {
      recommendations.push({
        type: 'info',
        title: 'Missing Power Weapon',
        description: 'A power weapon could provide heavy damage for tough enemies'
      });
    }

    // Subclass synergy recommendations
    if (build.subclass.element === 'Prismatic') {
      recommendations.push({
        type: 'tip',
        title: 'Prismatic Synergy',
        description: 'Mix Light and Dark abilities for maximum versatility. Focus on Transcendence timing.'
      });
    } else {
      recommendations.push({
        type: 'tip', 
        title: `${build.subclass.element} Mastery`,
        description: `Focus on ${build.subclass.element.toLowerCase()} weapon synergies and elemental well generation.`
      });
    }

    // Activity-specific recommendations
    if (request.activities.includes('raid')) {
      recommendations.push({
        type: 'tip',
        title: 'Raid Optimization',
        description: 'Consider team coordination, DPS phases, and role-specific gear'
      });
    }

    if (request.activities.includes('pvp')) {
      recommendations.push({
        type: 'tip',
        title: 'PvP Focus',
        description: 'Prioritize mobility, recovery stats and quick-handling weapons'
      });
    }

    console.log(`✅ Generated ${recommendations.length} recommendations`);
    return recommendations;
  }
}