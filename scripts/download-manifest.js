#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const { promisify } = require('util');

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, '..', 'data');
const MANIFEST_INFO_FILE = path.join(DATA_DIR, 'manifest-info.json');
const BUILD_DATA_FILE = path.join(DATA_DIR, 'build-essential-items.json');
const STATS_FILE = path.join(DATA_DIR, 'processing-stats.json');

// Bungie API configuration
const BUNGIE_API_KEY = process.env.BUNGIE_API_KEY;
const BUNGIE_BASE_URL = 'https://www.bungie.net/Platform';

if (!BUNGIE_API_KEY) {
  console.error('❌ BUNGIE_API_KEY environment variable is required');
  process.exit(1);
}

// HTTP request helper
const httpsGet = (url, headers = {}) => {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Casting-Destiny-Manifest-Updater/1.0',
        ...headers
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
      
    }).on('error', reject);
  });
};

// Download and parse JSON
const fetchJson = async (url, headers = {}) => {
  const data = await httpsGet(url, headers);
  return JSON.parse(data);
};

// Build-essential item filtering logic
const ESSENTIAL_CATEGORIES = {
  // Exotic gear
  EXOTIC_ARMOR: 20,
  EXOTIC_WEAPONS: 1, // + tierType === 6
  
  // Subclass components  
  ASPECTS: 3124752623,
  FRAGMENTS: 3683254069,
  SUPERS: 39,
  GRENADES: 23,
  MELEE_ABILITIES: 24,
  CLASS_ABILITIES: 25,
  
  // Essential mods
  ARMOR_MODS: 59,
  
  // Filter out cosmetics
  EXCLUDE: [41, 42, 43, 44, 81, 50, 51] // Emblems, shaders, ships, etc.
};

const TIER_TYPES = {
  BASIC: 2,
  COMMON: 3,
  RARE: 4, 
  LEGENDARY: 5,
  EXOTIC: 6
};

const CLASS_TYPES = {
  0: 'Titan',
  1: 'Hunter',
  2: 'Warlock',
  3: 'Unknown'
};

const DAMAGE_TYPES = {
  0: 'None',
  1: 'Kinetic',
  2: 'Arc',
  3: 'Solar', 
  4: 'Void',
  6: 'Stasis',
  7: 'Strand'
};

// Check if item should be excluded
const shouldExcludeItem = (item) => {
  if (!item?.itemCategoryHashes) return true;
  
  // Exclude cosmetic items
  const hasExcludedCategory = item.itemCategoryHashes.some(hash => 
    ESSENTIAL_CATEGORIES.EXCLUDE.includes(hash)
  );
  
  if (hasExcludedCategory) return true;
  
  // Exclude items without proper names
  if (!item.displayProperties?.name || item.displayProperties.name.length < 2) return true;
  
  // Exclude test/debug items
  const name = item.displayProperties.name.toLowerCase();
  if (name.includes('[test]') || name.includes('debug') || name.includes('placeholder')) return true;
  
  return false;
};

// Check if item is build-essential
const isBuildEssential = (item) => {
  if (shouldExcludeItem(item)) return false;
  
  const categories = item.itemCategoryHashes || [];
  const tierType = item.inventory?.tierType;
  
  // Exotic gear (any exotic armor or weapon)
  if (tierType === TIER_TYPES.EXOTIC) {
    const isArmor = categories.includes(ESSENTIAL_CATEGORIES.EXOTIC_ARMOR);
    const isWeapon = categories.includes(ESSENTIAL_CATEGORIES.EXOTIC_WEAPONS);
    if (isArmor || isWeapon) return true;
  }
  
  // Subclass components
  const subclassCategories = [
    ESSENTIAL_CATEGORIES.ASPECTS,
    ESSENTIAL_CATEGORIES.FRAGMENTS, 
    ESSENTIAL_CATEGORIES.SUPERS,
    ESSENTIAL_CATEGORIES.GRENADES,
    ESSENTIAL_CATEGORIES.MELEE_ABILITIES,
    ESSENTIAL_CATEGORIES.CLASS_ABILITIES
  ];
  
  if (categories.some(cat => subclassCategories.includes(cat))) return true;
  
  // Essential mods (only those that affect gameplay)
  if (categories.includes(ESSENTIAL_CATEGORIES.ARMOR_MODS)) {
    const description = item.displayProperties.description?.toLowerCase() || '';
    const name = item.displayProperties.name.toLowerCase();
    
    const gameplayKeywords = [
      'damage', 'energy', 'ability', 'weapon', 'armor', 'resist', 'reload', 
      'kickstart', 'well', 'surge', 'ordnance', 'bomber', 'distribution'
    ];
    
    return gameplayKeywords.some(keyword => 
      description.includes(keyword) || name.includes(keyword)
    );
  }
  
  return false;
};

// Determine build reason for categorization
const determineBuildReason = (item) => {
  const categories = item.itemCategoryHashes || [];
  const tierType = item.inventory?.tierType;
  
  if (tierType === TIER_TYPES.EXOTIC) {
    if (categories.includes(ESSENTIAL_CATEGORIES.EXOTIC_ARMOR)) return 'exotic_armor';
    if (categories.includes(ESSENTIAL_CATEGORIES.EXOTIC_WEAPONS)) return 'exotic_weapon';
  }
  
  if (categories.includes(ESSENTIAL_CATEGORIES.ASPECTS)) return 'aspect';
  if (categories.includes(ESSENTIAL_CATEGORIES.FRAGMENTS)) return 'fragment';
  if (categories.includes(ESSENTIAL_CATEGORIES.SUPERS)) return 'super';
  if (categories.includes(ESSENTIAL_CATEGORIES.GRENADES)) return 'grenade';
  if (categories.includes(ESSENTIAL_CATEGORIES.MELEE_ABILITIES)) return 'melee';
  if (categories.includes(ESSENTIAL_CATEGORIES.CLASS_ABILITIES)) return 'class_ability';
  if (categories.includes(ESSENTIAL_CATEGORIES.ARMOR_MODS)) return 'mod';
  
  return 'other';
};

// Create enhanced item summary
const createItemSummary = (item) => ({
  hash: item.hash,
  name: item.displayProperties?.name || 'Unknown',
  description: item.displayProperties?.description || '',
  icon: item.displayProperties?.icon,
  tierType: item.inventory?.tierType || 0,
  tierTypeName: Object.entries(TIER_TYPES).find(([name, value]) => value === item.inventory?.tierType)?.[0] || 'Unknown',
  classType: CLASS_TYPES[item.classType] || 'Unknown',
  damageType: DAMAGE_TYPES[item.damageType] || DAMAGE_TYPES[item.defaultDamageType] || 'None',
  isExotic: item.inventory?.tierType === TIER_TYPES.EXOTIC,
  bucketTypeHash: item.inventory?.bucketTypeHash,
  itemCategoryHashes: item.itemCategoryHashes || [],
  buildReason: determineBuildReason(item),
  itemTypeDisplayName: item.itemTypeDisplayName,
  createdAt: new Date().toISOString()
});

// Main processing function
const processManifestData = (inventoryItems) => {
  console.log('🔄 Processing manifest data...');
  
  const stats = {
    totalItems: Object.keys(inventoryItems).length,
    processedItems: 0,
    buildEssentialItems: 0,
    excludedItems: 0,
    categories: {
      exoticArmor: 0,
      exoticWeapons: 0,
      aspects: 0,
      fragments: 0,
      supers: 0,
      grenades: 0,
      melees: 0,
      classAbilities: 0,
      mods: 0
    }
  };
  
  const buildEssentialItems = {};
  
  // Process each item
  Object.entries(inventoryItems).forEach(([hash, item]) => {
    stats.processedItems++;
    
    if (isBuildEssential(item)) {
      const itemSummary = createItemSummary(item);
      buildEssentialItems[hash] = itemSummary;
      stats.buildEssentialItems++;
      
      // Count by category
      switch (itemSummary.buildReason) {
        case 'exotic_armor': stats.categories.exoticArmor++; break;
        case 'exotic_weapon': stats.categories.exoticWeapons++; break;
        case 'aspect': stats.categories.aspects++; break;
        case 'fragment': stats.categories.fragments++; break;
        case 'super': stats.categories.supers++; break;
        case 'grenade': stats.categories.grenades++; break;
        case 'melee': stats.categories.melees++; break;
        case 'class_ability': stats.categories.classAbilities++; break;
        case 'mod': stats.categories.mods++; break;
      }
    } else {
      stats.excludedItems++;
    }
  });
  
  console.log(`✅ Processing complete:`);
  console.log(`   📊 Total items: ${stats.totalItems.toLocaleString()}`);
  console.log(`   🎯 Build-essential: ${stats.buildEssentialItems.toLocaleString()}`);
  console.log(`   🗑️ Excluded: ${stats.excludedItems.toLocaleString()}`);
  console.log(`   📈 Reduction: ${Math.round((1 - stats.buildEssentialItems / stats.totalItems) * 100)}%`);
  
  return { buildEssentialItems, stats };
};

// Main execution
const main = async () => {
  try {
    console.log('🚀 Starting Destiny manifest download and processing...');
    console.log(`📅 Started at: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} EST`);
    
    // Ensure data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Step 1: Get manifest info
    console.log('📋 Fetching manifest information...');
    const manifestResponse = await fetchJson(`${BUNGIE_BASE_URL}/Destiny2/Manifest/`, {
      'X-API-Key': BUNGIE_API_KEY
    });
    
    if (!manifestResponse.Response) {
      throw new Error('Invalid manifest response from Bungie API');
    }
    
    const manifestInfo = manifestResponse.Response;
    console.log(`📦 Manifest version: ${manifestInfo.version}`);
    
    // Step 2: Get inventory items component URL
    const englishPaths = manifestInfo.jsonWorldComponentContentPaths?.en;
    if (!englishPaths) {
      throw new Error('English manifest paths not found');
    }
    
    const inventoryItemsPath = englishPaths.DestinyInventoryItemDefinition;
    if (!inventoryItemsPath) {
      throw new Error('DestinyInventoryItemDefinition path not found');
    }
    
    console.log('📥 Downloading inventory items...');
    const inventoryItemsUrl = `https://www.bungie.net${inventoryItemsPath}`;
    const inventoryItems = await fetchJson(inventoryItemsUrl);
    
    console.log(`📊 Downloaded ${Object.keys(inventoryItems).length.toLocaleString()} items`);
    
    // Step 3: Process and filter data
    const { buildEssentialItems, stats } = processManifestData(inventoryItems);
    
    // Step 4: Save processed data
    console.log('💾 Saving processed data...');
    
    const manifestInfoToSave = {
      version: manifestInfo.version,
      downloadedAt: new Date().toISOString(),
      itemCount: stats.buildEssentialItems,
      originalItemCount: stats.totalItems,
      reductionPercentage: Math.round((1 - stats.buildEssentialItems / stats.totalItems) * 100),
      categories: stats.categories
    };
    
    // Save files
    await fs.writeFile(MANIFEST_INFO_FILE, JSON.stringify(manifestInfoToSave, null, 2));
    await fs.writeFile(BUILD_DATA_FILE, JSON.stringify(buildEssentialItems, null, 2));
    await fs.writeFile(STATS_FILE, JSON.stringify(stats, null, 2));
    
    console.log('✅ All files saved successfully!');
    console.log(`📁 Data directory: ${DATA_DIR}`);
    console.log(`📋 Manifest info: manifest-info.json`);
    console.log(`🎯 Build data: build-essential-items.json`);
    console.log(`📊 Stats: processing-stats.json`);
    
    // Step 5: Summary
    const endTime = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    console.log(`🏁 Completed at: ${endTime} EST`);
    console.log(`🎉 Successfully processed Destiny manifest version ${manifestInfo.version}`);
    
  } catch (error) {
    console.error('❌ Error during manifest processing:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  main();
}