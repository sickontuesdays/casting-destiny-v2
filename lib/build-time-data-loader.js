import fs from 'fs';
import path from 'path';

// Data file paths
const DATA_DIR = path.join(process.cwd(), 'data');
const MANIFEST_INFO_FILE = path.join(DATA_DIR, 'manifest-info.json');
const BUILD_DATA_FILE = path.join(DATA_DIR, 'build-essential-items.json');
const STATS_FILE = path.join(DATA_DIR, 'processing-stats.json');

// Cache for loaded data
let cachedManifestInfo = null;
let cachedBuildData = null;
let cachedStats = null;
let lastLoadTime = null;

// Cache duration (5 minutes for development, can be longer in production)
const CACHE_DURATION = 5 * 60 * 1000;

// Check if cache is still valid
const isCacheValid = () => {
  if (!lastLoadTime) return false;
  return (Date.now() - lastLoadTime) < CACHE_DURATION;
};

// Load manifest info
export const getManifestInfo = () => {
  try {
    if (cachedManifestInfo && isCacheValid()) {
      return { success: true, data: cachedManifestInfo };
    }

    if (!fs.existsSync(MANIFEST_INFO_FILE)) {
      return {
        success: false,
        error: 'Manifest info not found',
        fallback: {
          version: 'fallback-v1.0',
          downloadedAt: new Date().toISOString(),
          itemCount: 0,
          originalItemCount: 0,
          reductionPercentage: 0,
          categories: {}
        }
      };
    }

    const data = JSON.parse(fs.readFileSync(MANIFEST_INFO_FILE, 'utf8'));
    cachedManifestInfo = data;
    lastLoadTime = Date.now();

    return { success: true, data };
  } catch (error) {
    console.error('Error loading manifest info:', error);
    return {
      success: false,
      error: error.message,
      fallback: {
        version: 'error-fallback',
        downloadedAt: new Date().toISOString(),
        itemCount: 0,
        originalItemCount: 0,
        reductionPercentage: 0,
        categories: {}
      }
    };
  }
};

// Load build-essential items
export const getBuildEssentialItems = () => {
  try {
    if (cachedBuildData && isCacheValid()) {
      return { success: true, data: cachedBuildData };
    }

    if (!fs.existsSync(BUILD_DATA_FILE)) {
      // Return fallback data structure
      const fallbackData = {
        "12345": {
          hash: 12345,
          name: "Heart of Inmost Light",
          description: "Exotic Titan chest armor that enhances ability energy when abilities are used",
          tierType: 6,
          tierTypeName: "EXOTIC",
          classType: "Titan",
          damageType: "None",
          isExotic: true,
          buildReason: "exotic_armor",
          itemTypeDisplayName: "Chest Armor",
          createdAt: new Date().toISOString()
        },
        "12346": {
          hash: 12346,
          name: "Graviton Forfeit",
          description: "Exotic Hunter helmet that extends invisibility duration and improves recovery",
          tierType: 6,
          tierTypeName: "EXOTIC",
          classType: "Hunter",
          damageType: "Void",
          isExotic: true,
          buildReason: "exotic_armor",
          itemTypeDisplayName: "Helmet",
          createdAt: new Date().toISOString()
        },
        "12347": {
          hash: 12347,
          name: "Phoenix Protocol",
          description: "Exotic Warlock chest that generates super energy when standing in Well of Radiance",
          tierType: 6,
          tierTypeName: "EXOTIC",
          classType: "Warlock",
          damageType: "Solar",
          isExotic: true,
          buildReason: "exotic_armor",
          itemTypeDisplayName: "Chest Armor",
          createdAt: new Date().toISOString()
        },
        "12348": {
          hash: 12348,
          name: "Sunshot",
          description: "Exotic solar hand cannon that causes explosive rounds and chain reactions",
          tierType: 6,
          tierTypeName: "EXOTIC",
          classType: "Unknown",
          damageType: "Solar",
          isExotic: true,
          buildReason: "exotic_weapon",
          itemTypeDisplayName: "Hand Cannon",
          createdAt: new Date().toISOString()
        },
        "12349": {
          hash: 12349,
          name: "Grenade Kickstart",
          description: "Reduces grenade cooldown when taking damage while critically wounded",
          tierType: 3,
          tierTypeName: "RARE",
          classType: "Unknown",
          damageType: "None",
          isExotic: false,
          buildReason: "mod",
          itemTypeDisplayName: "Armor Mod",
          createdAt: new Date().toISOString()
        }
      };

      return {
        success: false,
        error: 'Build data not found, using fallback',
        data: fallbackData,
        fallback: true
      };
    }

    const data = JSON.parse(fs.readFileSync(BUILD_DATA_FILE, 'utf8'));
    cachedBuildData = data;
    lastLoadTime = Date.now();

    return { success: true, data };
  } catch (error) {
    console.error('Error loading build data:', error);
    return {
      success: false,
      error: error.message,
      data: {},
      fallback: true
    };
  }
};

// Load processing stats
export const getProcessingStats = () => {
  try {
    if (cachedStats && isCacheValid()) {
      return { success: true, data: cachedStats };
    }

    if (!fs.existsSync(STATS_FILE)) {
      return {
        success: false,
        error: 'Stats not found',
        fallback: {
          totalItems: 0,
          processedItems: 0,
          buildEssentialItems: 0,
          excludedItems: 0,
          categories: {
            exoticArmor: 3,
            exoticWeapons: 1,
            aspects: 0,
            fragments: 0,
            supers: 0,
            grenades: 0,
            melees: 0,
            classAbilities: 0,
            mods: 1
          }
        }
      };
    }

    const data = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
    cachedStats = data;
    lastLoadTime = Date.now();

    return { success: true, data };
  } catch (error) {
    console.error('Error loading stats:', error);
    return {
      success: false,
      error: error.message,
      fallback: {
        totalItems: 0,
        processedItems: 0,
        buildEssentialItems: 0,
        excludedItems: 0,
        categories: {}
      }
    };
  }
};

// Get organized data for search functions
export const getOrganizedBuildData = () => {
  const buildDataResult = getBuildEssentialItems();
  const manifestInfoResult = getManifestInfo();
  const statsResult = getProcessingStats();

  const buildData = buildDataResult.data || {};
  const manifestInfo = manifestInfoResult.data || {};
  const stats = statsResult.data || {};

  // Organize data into categories for easy access
  const organizedData = {
    searchableItems: buildData,
    categories: {
      exoticGear: {
        armor: [],
        weapons: [],
        all: []
      },
      mods: {
        armor: [],
        weapon: [],
        combat: [],
        utility: []
      },
      buildComponents: {
        aspects: [],
        fragments: [],
        supers: [],
        grenades: [],
        melees: [],
        classAbilities: []
      },
      byHash: {}
    },
    metadata: {
      version: manifestInfo.version || 'unknown',
      itemCount: manifestInfo.itemCount || Object.keys(buildData).length,
      downloadedAt: manifestInfo.downloadedAt,
      categories: stats.categories || {},
      isFallback: buildDataResult.fallback || false
    },
    cacheTimestamp: lastLoadTime || Date.now()
  };

  // Organize items into categories
  Object.values(buildData).forEach(item => {
    // Add to hash lookup
    organizedData.categories.byHash[item.hash] = item;

    // Categorize by build reason
    switch (item.buildReason) {
      case 'exotic_armor':
        organizedData.categories.exoticGear.armor.push(item);
        organizedData.categories.exoticGear.all.push(item);
        break;
      case 'exotic_weapon':
        organizedData.categories.exoticGear.weapons.push(item);
        organizedData.categories.exoticGear.all.push(item);
        break;
      case 'aspect':
        organizedData.categories.buildComponents.aspects.push(item);
        break;
      case 'fragment':
        organizedData.categories.buildComponents.fragments.push(item);
        break;
      case 'super':
        organizedData.categories.buildComponents.supers.push(item);
        break;
      case 'grenade':
        organizedData.categories.buildComponents.grenades.push(item);
        break;
      case 'melee':
        organizedData.categories.buildComponents.melees.push(item);
        break;
      case 'class_ability':
        organizedData.categories.buildComponents.classAbilities.push(item);
        break;
      case 'mod':
        categorizeModByFunction(item, organizedData.categories.mods);
        break;
    }
  });

  return {
    success: true,
    data: organizedData,
    fallback: buildDataResult.fallback
  };
};

// Helper function to categorize mods by their function
const categorizeModByFunction = (item, modsObject) => {
  const name = item.name.toLowerCase();
  const description = item.description?.toLowerCase() || '';

  // Ensure all categories exist
  if (!modsObject.weapon) modsObject.weapon = [];
  if (!modsObject.combat) modsObject.combat = [];
  if (!modsObject.utility) modsObject.utility = [];
  if (!modsObject.armor) modsObject.armor = [];

  // Categorize by function
  if (name.includes('weapon') || description.includes('weapon') || 
      name.includes('targeting') || name.includes('reload') || name.includes('reserves')) {
    modsObject.weapon.push(item);
  } else if (name.includes('resist') || description.includes('resist') || 
             name.includes('surge') || description.includes('damage')) {
    modsObject.combat.push(item);
  } else if (name.includes('utility') || name.includes('kickstart') || 
             description.includes('ability') || description.includes('energy')) {
    modsObject.utility.push(item);
  } else {
    modsObject.armor.push(item);
  }
};

// Check if build-time data is available
export const hasValidBuildData = () => {
  try {
    return fs.existsSync(BUILD_DATA_FILE) && fs.existsSync(MANIFEST_INFO_FILE);
  } catch {
    return false;
  }
};

// Get data status for API responses
export const getBuildDataStatus = () => {
  const hasData = hasValidBuildData();
  const manifestInfo = getManifestInfo();
  const stats = getProcessingStats();

  return {
    hasData,
    manifestInfo: manifestInfo.data,
    stats: stats.data,
    isFallback: !hasData || manifestInfo.fallback || stats.fallback,
    lastUpdate: manifestInfo.data?.downloadedAt,
    version: manifestInfo.data?.version || 'unknown'
  };
};

// Clear cache (useful for development)
export const clearCache = () => {
  cachedManifestInfo = null;
  cachedBuildData = null;
  cachedStats = null;
  lastLoadTime = null;
  console.log('Build-time data cache cleared');
};

// Export data file paths for other modules
export const DATA_FILES = {
  MANIFEST_INFO: MANIFEST_INFO_FILE,
  BUILD_DATA: BUILD_DATA_FILE,
  STATS: STATS_FILE,
  DATA_DIR
};