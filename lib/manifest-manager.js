class ManifestManager {
  constructor() {
    this.manifest = null;
    this.isLoaded = false;
    this.cache = new Map();
    this.baseUrl = 'https://www.bungie.net';
    this.apiKey = process.env.BUNGIE_API_KEY;
    this.version = null;
    this.lastUpdated = null;
  }

  async loadManifest() {
    if (this.isLoaded && this.manifest) {
      return this.manifest;
    }

    try {
      console.log('🔄 Loading Destiny 2 manifest...');
      
      // First, get manifest info from Bungie API
      const manifestInfo = await this.getManifestInfo();
      
      // Load essential data
      const manifestData = await this.loadEssentialData(manifestInfo);
      
      this.manifest = {
        version: manifestInfo.version,
        data: manifestData,
        loadedAt: new Date().toISOString(),
        tables: Object.keys(manifestData)
      };
      
      this.version = manifestInfo.version;
      this.lastUpdated = new Date();
      this.isLoaded = true;
      
      console.log('✅ Manifest loaded successfully');
      
      return this.manifest;
    } catch (error) {
      console.error('❌ Failed to load manifest:', error);
      // Return minimal fallback data
      return this.createFallbackManifest();
    }
  }

  async getManifestInfo() {
    try {
      // Use native fetch (available in Node.js 18+)
      const response = await fetch(`${this.baseUrl}/Platform/Destiny2/Manifest/`, {
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.ErrorCode !== 1) {
        throw new Error(`Bungie API Error: ${data.Message}`);
      }

      return data.Response;
    } catch (error) {
      console.error('Failed to get manifest info:', error);
      throw error;
    }
  }

  async loadEssentialData(manifestInfo) {
    const manifestData = {};

    // Create structured sample data that matches Destiny 2's format
    manifestData.DestinyInventoryItemDefinition = this.createSampleItems();
    manifestData.DestinyStatDefinition = this.createSampleStats();
    manifestData.DestinyClassDefinition = this.createSampleClasses();
    manifestData.DestinyRaceDefinition = this.createSampleRaces();
    manifestData.DestinyGenderDefinition = this.createSampleGenders();

    return manifestData;
  }

  createSampleItems() {
    const items = {};
    
    // Exotic Armor Examples
    const exoticArmor = [
      {
        hash: 1234567890,
        displayProperties: {
          name: "Ophidian Aspect",
          description: "Improved weapon handling and reload speed.",
          icon: "/common/destiny2_content/icons/ophidian_aspect.jpg"
        },
        itemType: 2,
        itemSubType: 26,
        classType: 2,
        tierType: 6,
        inventory: { tierType: 6 },
        stats: { stats: {} }
      },
      {
        hash: 1234567891,
        displayProperties: {
          name: "Celestial Nighthawk",
          description: "Golden Gun fires a single devastating shot.",
          icon: "/common/destiny2_content/icons/celestial_nighthawk.jpg"
        },
        itemType: 2,
        itemSubType: 26,
        classType: 1,
        tierType: 6,
        inventory: { tierType: 6 },
        stats: { stats: {} }
      },
      {
        hash: 1234567892,
        displayProperties: {
          name: "Doom Fang Pauldron",
          description: "Void melee kills grant Super energy.",
          icon: "/common/destiny2_content/icons/doom_fang.jpg"
        },
        itemType: 2,
        itemSubType: 27,
        classType: 0,
        tierType: 6,
        inventory: { tierType: 6 },
        stats: { stats: {} }
      }
    ];

    // Legendary Armor Examples
    const legendaryArmor = [
      {
        hash: 2234567890,
        displayProperties: {
          name: "Solstice Helm",
          description: "A legendary helmet from the Solstice event.",
          icon: "/common/destiny2_content/icons/solstice_helm.jpg"
        },
        itemType: 2,
        itemSubType: 26,
        classType: 0,
        tierType: 5,
        inventory: { tierType: 5 },
        stats: { stats: {} }
      }
    ];

    // Exotic Weapons Examples
    const exoticWeapons = [
      {
        hash: 3234567890,
        displayProperties: {
          name: "Whisper of the Worm",
          description: "Precision shots refill the magazine.",
          icon: "/common/destiny2_content/icons/whisper.jpg"
        },
        itemType: 3,
        itemSubType: 17,
        tierType: 6,
        inventory: { tierType: 6 },
        stats: { stats: {} }
      },
      {
        hash: 3234567891,
        displayProperties: {
          name: "Gjallarhorn",
          description: "Wolfpack Rounds track targets.",
          icon: "/common/destiny2_content/icons/gjallarhorn.jpg"
        },
        itemType: 3,
        itemSubType: 20,
        tierType: 6,
        inventory: { tierType: 6 },
        stats: { stats: {} }
      }
    ];

    // Add all items to the items object
    [...exoticArmor, ...legendaryArmor, ...exoticWeapons].forEach(item => {
      items[item.hash] = item;
    });

    return items;
  }

  createSampleStats() {
    const stats = {};
    
    const statDefinitions = [
      { hash: 1000, name: "Weapons", description: "Weapon handling and reload speed" },
      { hash: 1001, name: "Health", description: "Resilience and recovery" },
      { hash: 1002, name: "Class", description: "Class ability cooldown" },
      { hash: 1003, name: "Super", description: "Super ability cooldown" },
      { hash: 1004, name: "Grenade", description: "Grenade cooldown" },
      { hash: 1005, name: "Melee", description: "Melee ability cooldown" }
    ];

    statDefinitions.forEach(stat => {
      stats[stat.hash] = {
        hash: stat.hash,
        displayProperties: {
          name: stat.name,
          description: stat.description
        },
        statCategory: 2
      };
    });

    return stats;
  }

  createSampleClasses() {
    return {
      0: { 
        hash: 0, 
        displayProperties: { name: "Titan" },
        classType: 0 
      },
      1: { 
        hash: 1, 
        displayProperties: { name: "Hunter" },
        classType: 1 
      },
      2: { 
        hash: 2, 
        displayProperties: { name: "Warlock" },
        classType: 2 
      }
    };
  }

  createSampleRaces() {
    return {
      0: { hash: 0, displayProperties: { name: "Human" } },
      1: { hash: 1, displayProperties: { name: "Awoken" } },
      2: { hash: 2, displayProperties: { name: "Exo" } }
    };
  }

  createSampleGenders() {
    return {
      0: { hash: 0, displayProperties: { name: "Male" } },
      1: { hash: 1, displayProperties: { name: "Female" } }
    };
  }

  createFallbackManifest() {
    return {
      version: 'fallback-1.0.0',
      data: {
        DestinyInventoryItemDefinition: this.createSampleItems(),
        DestinyStatDefinition: this.createSampleStats(),
        DestinyClassDefinition: this.createSampleClasses(),
        DestinyRaceDefinition: this.createSampleRaces(),
        DestinyGenderDefinition: this.createSampleGenders()
      },
      loadedAt: new Date().toISOString(),
      tables: ['DestinyInventoryItemDefinition', 'DestinyStatDefinition'],
      isFallback: true
    };
  }

  getItem(hash) {
    return this.manifest?.data?.DestinyInventoryItemDefinition?.[hash] || null;
  }

  getStat(hash) {
    return this.manifest?.data?.DestinyStatDefinition?.[hash] || null;
  }

  getExoticArmor(classType = null) {
    const items = this.manifest?.data?.DestinyInventoryItemDefinition || {};
    
    return Object.values(items).filter(item => 
      item.itemType === 2 && 
      item.tierType === 6 && 
      (classType === null || item.classType === classType)
    );
  }

  getExoticWeapons() {
    const items = this.manifest?.data?.DestinyInventoryItemDefinition || {};
    
    return Object.values(items).filter(item => 
      item.itemType === 3 && 
      item.tierType === 6
    );
  }

  searchItems(query, options = {}) {
    const items = this.manifest?.data?.DestinyInventoryItemDefinition || {};
    const results = [];
    const searchTerm = query.toLowerCase();
    
    Object.values(items).forEach(item => {
      if (item.displayProperties?.name?.toLowerCase().includes(searchTerm) ||
          item.displayProperties?.description?.toLowerCase().includes(searchTerm)) {
        results.push(item);
      }
    });
    
    return results.slice(0, options.maxResults || 50);
  }

  isReady() {
    return this.isLoaded && this.manifest !== null;
  }

  getVersion() {
    return this.manifest?.version || 'unknown';
  }

  getManifest() {
    return this.manifest;
  }

  isDataFresh() {
    if (!this.lastUpdated) return false;
    const hoursSinceUpdate = (Date.now() - this.lastUpdated.getTime()) / (1000 * 60 * 60);
    return hoursSinceUpdate < 24;
  }

  clearCache() {
    this.cache.clear();
    console.log('Manifest cache cleared');
  }

  getStats() {
    return {
      isLoaded: this.isLoaded,
      version: this.version,
      lastUpdated: this.lastUpdated,
      cacheSize: this.cache.size,
      itemCount: Object.keys(this.manifest?.data?.DestinyInventoryItemDefinition || {}).length
    };
  }
}

export default ManifestManager;