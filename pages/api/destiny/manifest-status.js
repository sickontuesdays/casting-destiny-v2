import manifestCache from '../../../lib/manifest-cache-manager';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      await manifestCache.initialize();
      const stats = await manifestCache.getManifestStats();
      
      return res.status(200).json({
        success: true,
        manifest: stats
      });
    } catch (error) {
      console.error('Manifest status error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get manifest status',
        details: error.message
      });
    }
  }
  
  if (req.method === 'POST') {
    const { action } = req.body;
    
    try {
      if (action === 'refresh') {
        // Force refresh manifest
        await manifestCache.clearCache();
        await manifestCache.initialize();
        
        return res.status(200).json({
          success: true,
          message: 'Manifest refreshed successfully'
        });
      }
      
      if (action === 'clear') {
        // Clear cache
        await manifestCache.clearCache();
        
        return res.status(200).json({
          success: true,
          message: 'Cache cleared successfully'
        });
      }
      
      return res.status(400).json({
        success: false,
        error: 'Invalid action'
      });
      
    } catch (error) {
      console.error('Manifest action error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to perform action',
        details: error.message
      });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
}

// pages/api/destiny/organized-data.js
// Main endpoint that replaces fetch-all-data with DIM-style organization

import dimStyleOrganizer from '../../../lib/dim-style-data-organizer';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('=== ORGANIZED DATA API START ===');
    
    // Initialize the DIM-style organizer
    await dimStyleOrganizer.initialize();
    
    // Get organized data
    const organizedData = await dimStyleOrganizer.getOrganizedData();
    
    // Calculate response size
    const responseSize = JSON.stringify(organizedData).length;
    console.log(`Organized data size: ${Math.round(responseSize / 1024)} KB`);
    
    // Return organized data with metadata
    return res.status(200).json({
      success: true,
      data: organizedData,
      metadata: {
        ...organizedData.metadata,
        responseSize: `${Math.round(responseSize / 1024)} KB`,
        apiVersion: '2.0-dim-style',
        cacheBased: true
      },
      message: 'Organized data loaded successfully from local cache'
    });
    
  } catch (error) {
    console.error('=== ORGANIZED DATA API ERROR ===');
    console.error('Error details:', {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
      name: error.name,
      timestamp: new Date().toISOString()
    });
    
    // Return fallback data structure
    const fallbackData = {
      weapons: { kinetic: [], energy: [], power: [] },
      armor: {
        titan: { helmet: [], gauntlets: [], chest: [], legs: [], classItem: [] },
        hunter: { helmet: [], gauntlets: [], chest: [], legs: [], classItem: [] },
        warlock: { helmet: [], gauntlets: [], chest: [], legs: [], classItem: [] }
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
        isFallback: true,
        error: error.message,
        lastOrganized: Date.now()
      }
    };
    
    return res.status(200).json({
      success: true,
      data: fallbackData,
      fallback: true,
      error: 'Using fallback data structure',
      originalError: error.message,
      suggestion: 'Try refreshing the manifest or check network connectivity'
    });
  }
}

// pages/api/destiny/search-items.js
// DIM-style search endpoint

import dimStyleOrganizer from '../../../lib/dim-style-data-organizer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { query, filters } = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    console.log(`DIM-style search for: "${query}"`);
    
    // Initialize organizer
    await dimStyleOrganizer.initialize();
    
    // Perform search
    let results = await dimStyleOrganizer.search(query);
    
    // Apply additional filters if provided
    if (filters) {
      results = applySearchFilters(results, filters);
    }
    
    // Limit results and add relevance scoring
    const scoredResults = results
      .map(item => ({
        ...item,
        relevanceScore: calculateRelevanceScore(item, query)
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 50); // Limit to top 50 results
    
    return res.status(200).json({
      success: true,
      results: scoredResults,
      totalFound: results.length,
      query: query,
      filters: filters || {},
      message: `Found ${results.length} items matching "${query}"`
    });
    
  } catch (error) {
    console.error('Search API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Search failed',
      details: error.message
    });
  }
}

function applySearchFilters(results, filters) {
  let filtered = [...results];
  
  // Filter by item type
  if (filters.itemType) {
    filtered = filtered.filter(item => item.itemType === filters.itemType);
  }
  
  // Filter by class
  if (filters.classType !== undefined) {
    filtered = filtered.filter(item => 
      item.classType === filters.classType || item.classType === 3 // Include universal items
    );
  }
  
  // Filter by slot
  if (filters.slot) {
    filtered = filtered.filter(item => item.slot === filters.slot);
  }
  
  // Filter by damage type
  if (filters.damageType) {
    filtered = filtered.filter(item => item.damageType === filters.damageType);
  }
  
  // Filter by rarity
  if (filters.isExotic !== undefined) {
    filtered = filtered.filter(item => item.isExotic === filters.isExotic);
  }
  
  // Filter by build relevance
  if (filters.buildRelevant !== undefined) {
    filtered = filtered.filter(item => item.isBuildRelevant === filters.buildRelevant);
  }
  
  return filtered;
}

function calculateRelevanceScore(item, query) {
  const queryLower = query.toLowerCase();
  let score = 0;
  
  // Exact name match gets highest score
  if (item.name.toLowerCase() === queryLower) {
    score += 100;
  }
  
  // Name starts with query
  if (item.name.toLowerCase().startsWith(queryLower)) {
    score += 50;
  }
  
  // Name contains query
  if (item.name.toLowerCase().includes(queryLower)) {
    score += 25;
  }
  
  // Description contains query
  if (item.description.toLowerCase().includes(queryLower)) {
    score += 10;
  }
  
  // Boost for build-relevant items
  if (item.isBuildRelevant) {
    score += 20;
  }
  
  // Boost for exotic items
  if (item.isExotic) {
    score += 15;
  }
  
  return score;
}

// pages/api/destiny/build-essentials.js
// Endpoint specifically for build-relevant items

import dimStyleOrganizer from '../../../lib/dim-style-data-organizer';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Fetching build essentials...');
    
    // Initialize organizer
    await dimStyleOrganizer.initialize();
    
    // Get build essentials
    const buildEssentials = await dimStyleOrganizer.getBuildEssentials();
    
    // Get organized data for additional context
    const organizedData = await dimStyleOrganizer.getOrganizedData();
    
    // Create enhanced build essentials response
    const response = {
      exotics: {
        weapons: buildEssentials.exoticWeapons.map(item => ({
          hash: item.hash,
          name: item.name,
          description: item.description,
          icon: item.icon,
          slot: item.slot,
          damageType: item.damageType,
          searchTerms: item.searchTerms
        })),
        armor: buildEssentials.exoticArmor.map(item => ({
          hash: item.hash,
          name: item.name,
          description: item.description,
          icon: item.icon,
          slot: item.slot,
          classType: item.classType,
          searchTerms: item.searchTerms
        }))
      },
      subclass: {
        aspects: buildEssentials.aspects.map(item => ({
          hash: item.hash,
          name: item.name,
          description: item.description,
          damageType: item.damageType,
          classType: item.classType
        })),
        fragments: buildEssentials.fragments.map(item => ({
          hash: item.hash,
          name: item.name,
          description: item.description,
          damageType: item.damageType
        })),
        abilities: buildEssentials.abilities.map(item => ({
          hash: item.hash,
          name: item.name,
          description: item.description,
          buildCategory: item.buildCategory,
          classType: item.classType
        }))
      },
      mods: {
        armor: organizedData.mods.armor.slice(0, 100), // Limit for performance
        weapon: organizedData.mods.weapon.slice(0, 100),
        ghost: organizedData.mods.ghost.slice(0, 50)
      },
      stats: {
        totalExoticWeapons: buildEssentials.exoticWeapons.length,
        totalExoticArmor: buildEssentials.exoticArmor.length,
        totalAspects: buildEssentials.aspects.length,
        totalFragments: buildEssentials.fragments.length,
        totalAbilities: buildEssentials.abilities.length,
        armorModsCount: organizedData.mods.armor.length,
        weaponModsCount: organizedData.mods.weapon.length
      }
    };
    
    return res.status(200).json({
      success: true,
      data: response,
      message: 'Build essentials loaded successfully'
    });
    
  } catch (error) {
    console.error('Build essentials API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load build essentials',
      details: error.message
    });
  }
}

// pages/api/destiny/player-builds.js
// Enhanced endpoint for player inventory-based builds

import dimStyleOrganizer from '../../../lib/dim-style-data-organizer';
import { getAllUserItems } from '../../../lib/bungie-inventory';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get session from cookie
    const sessionCookie = req.cookies['bungie-session'];
    
    if (!sessionCookie) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    let session;
    try {
      const { payload } = await jwtVerify(sessionCookie, secret);
      session = payload;
    } catch (error) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid session' 
      });
    }

    const { keywords, membershipType, membershipId, buildPreferences } = req.body;
    
    if (!keywords || keywords.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please describe the build you want to create' 
      });
    }

    console.log(`Player build search for: "${keywords}"`);

    // Initialize DIM-style organizer
    await dimStyleOrganizer.initialize();

    // Get user's inventory
    const userItemHashes = await getAllUserItems(
      membershipType, 
      membershipId, 
      session.accessToken
    );
    
    console.log(`User has ${userItemHashes.length} items in inventory`);
    
    // Get organized data
    const organizedData = await dimStyleOrganizer.getOrganizedData();
    
    // Filter organized data to only include user's items
    const userFilteredData = filterDataByUserItems(organizedData, userItemHashes);
    
    // Search within user's items using DIM-style search
    const searchResults = await searchUserItems(userFilteredData, keywords);
    
    // Analyze build possibilities
    const buildAnalysis = analyzeBuildPossibilities(searchResults, keywords, buildPreferences);
    
    return res.status(200).json({
      success: true,
      searchType: buildAnalysis.type,
      builds: buildAnalysis.builds || [],
      availableItems: buildAnalysis.availableItems || [],
      missingItems: buildAnalysis.missingItems || [],
      suggestions: buildAnalysis.suggestions || [],
      totalFound: buildAnalysis.builds?.length || buildAnalysis.availableItems?.length || 0,
      inventorySize: userItemHashes.length,
      query: keywords,
      message: buildAnalysis.message
    });
    
  } catch (error) {
    console.error('Player builds API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to analyze player builds',
      details: error.message 
    });
  }
}

function filterDataByUserItems(organizedData, userItemHashes) {
  const userItemSet = new Set(userItemHashes.map(hash => hash.toString()));
  
  const filtered = {
    weapons: {
      kinetic: organizedData.weapons.kinetic.filter(item => userItemSet.has(item.hash.toString())),
      energy: organizedData.weapons.energy.filter(item => userItemSet.has(item.hash.toString())),
      power: organizedData.weapons.power.filter(item => userItemSet.has(item.hash.toString()))
    },
    armor: {},
    buildEssentials: {
      exoticWeapons: organizedData.buildEssentials.exoticWeapons.filter(item => userItemSet.has(item.hash.toString())),
      exoticArmor: organizedData.buildEssentials.exoticArmor.filter(item => userItemSet.has(item.hash.toString())),
      aspects: organizedData.buildEssentials.aspects.filter(item => userItemSet.has(item.hash.toString())),
      fragments: organizedData.buildEssentials.fragments.filter(item => userItemSet.has(item.hash.toString())),
      abilities: organizedData.buildEssentials.abilities.filter(item => userItemSet.has(item.hash.toString()))
    }
  };
  
  // Filter armor by class
  ['titan', 'hunter', 'warlock'].forEach(className => {
    filtered.armor[className] = {};
    ['helmet', 'gauntlets', 'chest', 'legs', 'classItem'].forEach(slot => {
      filtered.armor[className][slot] = organizedData.armor[className][slot].filter(
        item => userItemSet.has(item.hash.toString())
      );
    });
  });
  
  return filtered;
}

async function searchUserItems(userFilteredData, keywords) {
  const allUserItems = [
    ...Object.values(userFilteredData.weapons).flat(),
    ...Object.values(userFilteredData.armor).map(classArmor => Object.values(classArmor).flat()).flat(),
    ...userFilteredData.buildEssentials.exoticWeapons,
    ...userFilteredData.buildEssentials.exoticArmor,
    ...userFilteredData.buildEssentials.aspects,
    ...userFilteredData.buildEssentials.fragments,
    ...userFilteredData.buildEssentials.abilities
  ];
  
  const queryLower = keywords.toLowerCase();
  const searchTerms = queryLower.split(' ');
  
  return allUserItems.filter(item => {
    const searchableText = item.searchTerms || `${item.name} ${item.description}`.toLowerCase();
    return searchTerms.some(term => searchableText.includes(term));
  });
}

function analyzeBuildPossibilities(userItems, keywords, preferences) {
  // Analyze what builds are possible with user's items
  const exoticCount = userItems.filter(item => item.isExotic).length;
  const buildRelevantCount = userItems.filter(item => item.isBuildRelevant).length;
  
  if (buildRelevantCount >= 3 && exoticCount >= 1) {
    // User has enough items for a basic build
    return {
      type: 'possible_builds',
      builds: createBasicBuildsFromItems(userItems, keywords),
      message: `Found ${buildRelevantCount} build-relevant items in your inventory`
    };
  } else if (userItems.length > 0) {
    // User has some relevant items but not enough for a complete build
    return {
      type: 'partial_build',
      availableItems: userItems,
      missingItems: generateMissingItemSuggestions(keywords, userItems),
      suggestions: generateAcquisitionSuggestions(keywords),
      message: `Found ${userItems.length} relevant items, but need more for a complete build`
    };
  } else {
    // User has no relevant items
    return {
      type: 'no_items',
      availableItems: [],
      suggestions: generateAcquisitionSuggestions(keywords),
      message: `No items found for "${keywords}" in your inventory`
    };
  }
}

function createBasicBuildsFromItems(items, keywords) {
  // Simple build creation logic - can be enhanced later
  const exotics = items.filter(item => item.isExotic);
  const primaryExotic = exotics[0];
  
  if (!primaryExotic) return [];
  
  return [{
    name: `${primaryExotic.name} Build`,
    description: `Build centered around ${primaryExotic.name}`,
    components: {
      primaryExotic: primaryExotic,
      supportingItems: items.filter(item => item.hash !== primaryExotic.hash).slice(0, 5)
    },
    viability: calculateBuildViability(items),
    suggestions: [`Focus on mods that enhance ${primaryExotic.name}'s capabilities`]
  }];
}

function calculateBuildViability(items) {
  const exoticCount = items.filter(item => item.isExotic).length;
  const aspectCount = items.filter(item => item.buildCategory === 'aspect').length;
  const fragmentCount = items.filter(item => item.buildCategory === 'fragment').length;
  
  let viability = 0;
  viability += exoticCount * 30;
  viability += aspectCount * 20;
  viability += fragmentCount * 10;
  viability += Math.min(items.length * 5, 40); // Bonus for having more items
  
  return Math.min(viability, 100);
}

function generateMissingItemSuggestions(keywords, userItems) {
  // Analyze what's missing based on keywords
  const missing = [];
  
  if (keywords.includes('grenade') && !userItems.some(item => item.name.toLowerCase().includes('grenade'))) {
    missing.push('Grenade-enhancing exotic armor or mods');
  }
  
  if (keywords.includes('healing') && !userItems.some(item => item.name.toLowerCase().includes('heal'))) {
    missing.push('Healing-focused exotic gear or Solar subclass items');
  }
  
  // Add generic suggestions if no specific ones
  if (missing.length === 0) {
    missing.push('More exotic gear relevant to your playstyle');
    missing.push('Subclass aspects and fragments');
    missing.push('Armor mods from vendors');
  }
  
  return missing;
}

function generateAcquisitionSuggestions(keywords) {
  return [
    'Check Xur\'s weekly inventory for exotic items',
    'Complete lost sectors for exotic armor drops',
    'Visit Ada-1 and Banshee-44 for armor and weapon mods',
    'Complete seasonal activities for latest gear',
    'Run raids and dungeons for unique exotic drops'
  ];
}