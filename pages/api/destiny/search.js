// IMPROVED search API that uses the corrected data fetcher
import { fetchAllDestinyData } from '../../../lib/bungie-data-fetcher';
import { findDynamicBuilds } from '../../../lib/dynamic-build-intelligence';
import { parseAdvancedSearch, processAdvancedKeywords, findAdvancedSynergisticItems } from '../../../lib/advanced-search-parser';

let cachedBuildData = null;
let cacheTimestamp = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Load build-focused Destiny data
const loadBuildFocusedData = async () => {
  if (cachedBuildData && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    console.log('Using cached build data');
    return cachedBuildData;
  }

  try {
    console.log('Loading fresh build-focused data...');
    
    // Use our improved data fetcher that only gets build-essential items
    const buildData = await fetchAllDestinyData();
    
    // Transform the organized data into the format expected by search functions
    const searchableData = {
      inventoryItems: {}
    };
    
    // Convert organized build data back to searchable format
    const allBuildItems = [
      ...Object.values(buildData.buildComponents.abilities).flat(),
      ...Object.values(buildData.buildComponents.subclassModifiers).flat(),
      ...Object.values(buildData.buildComponents.gear).flat(),
      ...Object.values(buildData.buildComponents.mods).flat(),
      ...Object.values(buildData.exoticGear.armor).flat(),
      ...Object.values(buildData.exoticGear.weapons).flat()
    ];
    
    // Add subclass data
    Object.values(buildData.subclassData).forEach(classData => {
      Object.values(classData).forEach(damageData => {
        Object.values(damageData).forEach(items => {
          allBuildItems.push(...items);
        });
      });
    });
    
    // Add mod data
    Object.values(buildData.modData).forEach(items => {
      allBuildItems.push(...items);
    });
    
    // Create searchable inventory items structure
    allBuildItems.forEach(item => {
      if (item.hash) {
        searchableData.inventoryItems[item.hash] = {
          hash: item.hash,
          displayProperties: {
            name: item.name,
            description: item.description,
            icon: item.icon
          },
          inventory: {
            tierType: item.tierType,
            bucketTypeHash: item.bucketSlot
          },
          classType: item.className === 'Titan' ? 0 : item.className === 'Hunter' ? 1 : item.className === 'Warlock' ? 2 : 3,
          damageType: getDamageTypeNumber(item.damageType),
          itemCategoryHashes: determineCategories(item),
          buildReason: item.buildReason
        };
      }
    });
    
    cachedBuildData = {
      searchableData,
      organizedData: buildData
    };
    cacheTimestamp = Date.now();
    
    console.log(`Build-focused data loaded: ${Object.keys(searchableData.inventoryItems).length} essential items`);
    return cachedBuildData;
    
  } catch (error) {
    console.error('Error loading build-focused data:', error);
    throw error;
  }
};

// Convert damage type names back to numbers for compatibility
const getDamageTypeNumber = (damageTypeName) => {
  const typeMap = {
    'None': 0,
    'Kinetic': 1,
    'Arc': 2,
    'Solar': 3,
    'Void': 4,
    'Stasis': 6,
    'Strand': 7
  };
  return typeMap[damageTypeName] || 0;
};

// Determine item categories based on build reason and type
const determineCategories = (item) => {
  const categories = [];
  
  switch (item.buildReason) {
    case 'exotic_armor':
      categories.push(20, 6); // Armor + Exotic indicator
      break;
    case 'exotic_weapon':
      categories.push(1, 6); // Weapon + Exotic indicator
      break;
    case 'aspect':
      categories.push(3124752623);
      break;
    case 'fragment':
      categories.push(3683254069);
      break;
    case 'grenade':
      categories.push(23);
      break;
    case 'melee':
      categories.push(24);
      break;
    case 'super':
      categories.push(39);
      break;
    case 'class_ability':
      categories.push(25);
      break;
    case 'mod':
      categories.push(59);
      break;
    default:
      categories.push(1); // Default to weapon category
  }
  
  return categories;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { keywords: rawKeywords } = req.body;
    
    if (!rawKeywords || rawKeywords.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please describe the build you want to create' 
      });
    }

    console.log(`Build search for: "${rawKeywords}"`);

    // Load build-focused Destiny data
    const { searchableData, organizedData } = await loadBuildFocusedData();
    
    // STEP 1: Try to find complete builds using improved archetype system
    const buildResults = findDynamicBuilds(rawKeywords, searchableData);
    
    if (buildResults.builds.length > 0) {
      // SUCCESS: Found complete builds
      console.log(`Found ${buildResults.builds.length} complete builds from ${buildResults.sourceItems} relevant items`);
      
      return res.status(200).json({ 
        success: true,
        searchType: 'builds',
        builds: buildResults.builds,
        totalFound: buildResults.totalFound,
        query: rawKeywords,
        sourceItems: buildResults.sourceItems,
        message: `Found ${buildResults.builds.length} complete build${buildResults.builds.length !== 1 ? 's' : ''} matching "${rawKeywords}"!`,
        dataInfo: {
          totalBuildItems: Object.keys(searchableData.inventoryItems).length,
          buildArchetypes: 'Using real Destiny 2 build archetypes',
          dataFreshness: Math.floor((Date.now() - cacheTimestamp) / 60000) + ' minutes old'
        }
      });
    }

    // STEP 2: If no complete builds, show component analysis
    console.log('No complete builds found, analyzing available components...');
    
    const parsedSearch = parseAdvancedSearch(rawKeywords);
    const processedKeywords = processAdvancedKeywords(parsedSearch);
    const componentResults = findAdvancedSynergisticItems(processedKeywords, searchableData);
    
    if (componentResults.length > 0) {
      // Analyze what type of components were found
      const componentAnalysis = analyzeFoundComponents(componentResults);
      
      return res.status(200).json({ 
        success: true,
        searchType: 'components',
        results: componentResults.slice(0, 15),
        totalFound: componentResults.length,
        processedKeywords: processedKeywords.include,
        query: rawKeywords,
        componentAnalysis,
        searchBreakdown: {
          included: processedKeywords.include,
          excluded: processedKeywords.exclude,
          exactPhrases: processedKeywords.exactPhrases
        },
        message: `Found ${componentResults.length} build components for "${rawKeywords}". You may need additional items for a complete build.`,
        suggestions: generateBuildSuggestions(rawKeywords, componentAnalysis)
      });
    }
    
    // STEP 3: No relevant components found
    return res.status(200).json({
      success: true,
      searchType: 'no_match',
      results: [],
      totalFound: 0,
      query: rawKeywords,
      message: `No build components found for "${rawKeywords}".`,
      suggestions: [
        'Try broader terms like "damage", "healing", "invisibility", or "grenade"',
        'Search for specific exotic names like "Heart of Inmost Light" or "Orpheus Rig"',
        'Try build types like "grenade spam", "ability loop", or "weapon swap"'
      ],
      availableArchetypes: Object.keys(require('../../../lib/dynamic-build-intelligence').DESTINY_BUILD_ARCHETYPES)
    });
    
  } catch (error) {
    console.error('Build search API error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search for builds',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Analyze what types of components were found
const analyzeFoundComponents = (components) => {
  const analysis = {
    exotics: components.filter(item => item.isExotic).length,
    mods: components.filter(item => item.type.includes('Mod')).length,
    abilities: components.filter(item => 
      item.type.includes('Grenade') || 
      item.type.includes('Melee') || 
      item.type.includes('Super') ||
      item.type.includes('Aspect') ||
      item.type.includes('Fragment')
    ).length,
    weapons: components.filter(item => item.type.includes('Weapon')).length,
    armor: components.filter(item => item.type.includes('Armor')).length
  };
  
  // Determine what's missing for a complete build
  analysis.missingForBuild = [];
  if (analysis.exotics === 0) analysis.missingForBuild.push('exotic gear');
  if (analysis.mods < 2) analysis.missingForBuild.push('essential mods');
  if (analysis.abilities < 2) analysis.missingForBuild.push('subclass synergies');
  
  return analysis;
};

// Generate suggestions based on search and found components
const generateBuildSuggestions = (searchQuery, analysis) => {
  const suggestions = [];
  const lowerQuery = searchQuery.toLowerCase();
  
  // Specific suggestions based on search terms
  if (lowerQuery.includes('grenade')) {
    suggestions.push('Look for "Heart of Inmost Light", "Contraverse Hold", or "Armamentarium" exotics');
    suggestions.push('Search for "Grenade Kickstart" and "Bomber" mods');
  } else if (lowerQuery.includes('invisible') || lowerQuery.includes('stealth')) {
    suggestions.push('Try "Graviton Forfeit", "Omnioculus", or "Gyrfalcon\'s Hauberk"');
    suggestions.push('Look for void Hunter aspects and fragments');
  } else if (lowerQuery.includes('heal') || lowerQuery.includes('support')) {
    suggestions.push('Search for "Phoenix Protocol", "Boots of the Assembler", or "Well of Radiance"');
    suggestions.push('Look for solar Warlock abilities and mods');
  }
  
  // General suggestions based on missing components
  if (analysis.missingForBuild.includes('exotic gear')) {
    suggestions.push('Acquire exotic armor or weapons that synergize with your playstyle');
    suggestions.push('Check Xur\'s weekly inventory or complete exotic quests');
  }
  
  if (analysis.missingForBuild.includes('essential mods')) {
    suggestions.push('Visit Ada-1 and Banshee-44 daily for armor and weapon mods');
    suggestions.push('Look for kickstart, well, and elemental mods');
  }
  
  if (analysis.missingForBuild.includes('subclass synergies')) {
    suggestions.push('Unlock more aspects and fragments for your chosen subclass');
    suggestions.push('Complete subclass quests and meditation activities');
  }
  
  // Fallback suggestions
  if (suggestions.length === 0) {
    suggestions.push('Try searching for specific exotic names or build archetypes');
    suggestions.push('Use terms like "grenade spam", "invisibility", "healing", or "DPS"');
    suggestions.push('Acquire more gear through raids, dungeons, and exotic quests');
  }
  
  return suggestions;
};