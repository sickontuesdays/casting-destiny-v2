import { jwtVerify } from 'jose';
import { getAllUserItems } from '../../../lib/bungie-inventory';
import { getManifestComponent } from '../../../lib/bungie-api';
import { findDynamicBuilds } from '../../../lib/dynamic-build-intelligence';
import { parseAdvancedSearch, processAdvancedKeywords, findAdvancedSynergisticItems } from '../../../lib/advanced-search-parser';

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

    const { keywords: rawKeywords, membershipType, membershipId } = req.body;
    
    if (!rawKeywords || rawKeywords.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please describe the build you want to create' 
      });
    }

    console.log(`Inventory search for: "${rawKeywords}"`);

    // Get user's inventory
    const userItemHashes = await getAllUserItems(
      membershipType, 
      membershipId, 
      session.accessToken
    );
    
    console.log(`User has ${userItemHashes.length} items in inventory`);
    
    // Get manifest data
    const inventoryItems = await getManifestComponent('DestinyInventoryItemDefinition');
    
    // Filter manifest to only include user's items
    const userInventoryItems = {};
    userItemHashes.forEach(hash => {
      if (inventoryItems[hash]) {
        userInventoryItems[hash] = inventoryItems[hash];
      }
    });
    
    console.log(`Found ${Object.keys(userInventoryItems).length} items in manifest matching user inventory`);
    
    // STEP 1: Try to find dynamic builds using user's inventory
    const buildResults = findDynamicBuilds(rawKeywords, {
      inventoryItems: userInventoryItems
    });
    
    if (buildResults.builds.length > 0) {
      // SUCCESS: Found builds from user's inventory
      console.log(`Found ${buildResults.builds.length} builds from user's ${buildResults.sourceItems} relevant items`);
      
      return res.status(200).json({ 
        success: true,
        searchType: 'builds',
        builds: buildResults.builds,
        totalFound: buildResults.totalFound,
        inventorySize: userItemHashes.length,
        query: rawKeywords,
        sourceItems: buildResults.sourceItems,
        message: `Found ${buildResults.builds.length} complete build${buildResults.builds.length !== 1 ? 's' : ''} you can make right now!`
      });
    }

    // STEP 2: Analyze what's missing to give helpful feedback
    console.log('No builds found in inventory, analyzing what\'s missing...');
    
    // Check what builds would be possible with all items
    const allItemsResult = findDynamicBuilds(rawKeywords, { inventoryItems });
    
    let missingAnalysis = {
      missingExotics: [],
      missingMods: [],
      missingSubclassItems: [],
      suggestions: []
    };
    
    if (allItemsResult.builds.length > 0) {
      // There are builds possible, but user doesn't have the items
      const optimalBuild = allItemsResult.builds[0];
      
      // Check what categories are missing
      const userCategories = {
        exoticArmor: buildResults.sourceItems > 0 ? findItemsByType(userInventoryItems, 'Exotic', 'Armor') : [],
        exoticWeapons: buildResults.sourceItems > 0 ? findItemsByType(userInventoryItems, 'Exotic', 'Weapon') : [],
        mods: buildResults.sourceItems > 0 ? findItemsByType(userInventoryItems, '', 'Mod') : []
      };
      
      // Analyze missing components
      if (optimalBuild.components.exoticArmor.length > 0 && userCategories.exoticArmor.length === 0) {
        missingAnalysis.missingExotics.push(`Exotic armor like ${optimalBuild.components.exoticArmor[0].name}`);
      }
      
      if (optimalBuild.components.exoticWeapons.length > 0 && userCategories.exoticWeapons.length === 0) {
        missingAnalysis.missingExotics.push(`Exotic weapons like ${optimalBuild.components.exoticWeapons[0].name}`);
      }
      
      if (optimalBuild.components.mods.length > 0 && userCategories.mods.length < 2) {
        missingAnalysis.missingMods.push(`Essential mods for ${optimalBuild.focus} builds`);
      }
      
      // Generate suggestions
      missingAnalysis.suggestions = generateMissingSuggestions(optimalBuild, missingAnalysis);
      
      return res.status(200).json({
        success: true,
        searchType: 'missing_items',
        builds: [],
        totalFound: 0,
        inventorySize: userItemHashes.length,
        query: rawKeywords,
        missingAnalysis,
        optimalBuild: {
          name: optimalBuild.name,
          description: optimalBuild.description,
          focus: optimalBuild.focus
        },
        message: `No complete ${optimalBuild.focus} builds found in your inventory. You're missing some key components.`
      });
    }
    
    // STEP 3: Fallback to showing what items they do have
    const parsedSearch = parseAdvancedSearch(rawKeywords);
    const processedKeywords = processAdvancedKeywords(parsedSearch);
    const availableItems = findAdvancedSynergisticItems(processedKeywords, {
      inventoryItems: userInventoryItems
    });
    
    if (availableItems.length > 0) {
      return res.status(200).json({ 
        success: true,
        searchType: 'partial_items',
        results: availableItems.slice(0, 10),
        totalFound: availableItems.length,
        inventorySize: userItemHashes.length,
        query: rawKeywords,
        message: `No complete builds found, but you have ${availableItems.length} related items. Try a different playstyle or acquire more gear!`,
        suggestions: [
          `Try searching for "${generateAlternativeSearch(rawKeywords)}"`,
          'Acquire more exotic armor pieces for better build synergy',
          'Collect mods from vendors like Ada-1 and Banshee-44'
        ]
      });
    }
    
    // STEP 4: No relevant items at all
    return res.status(200).json({
      success: true,
      searchType: 'no_items',
      builds: [],
      totalFound: 0,
      inventorySize: userItemHashes.length,
      query: rawKeywords,
      message: `No items found for "${rawKeywords}" in your inventory.`,
      suggestions: [
        `Try broader search terms like "damage", "ability", or "weapon"`,
        `Acquire gear from activities like raids, dungeons, and exotic quests`,
        `Visit vendors like Xur for exotic items`
      ]
    });
    
  } catch (error) {
    console.error('Inventory search API error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search inventory',
      details: error.message 
    });
  }
}

// Helper function to find items by type
const findItemsByType = (items, rarity, itemType) => {
  return Object.values(items).filter(item => {
    if (!item.displayProperties?.name) return false;
    
    const matchesRarity = !rarity || item.inventory?.tierTypeName === rarity || item.itemTypeDisplayName === rarity;
    const matchesType = !itemType || item.itemTypeDisplayName?.includes(itemType) || 
                       (item.itemCategoryHashes && (
                         (itemType === 'Armor' && item.itemCategoryHashes.includes(20)) ||
                         (itemType === 'Weapon' && item.itemCategoryHashes.includes(1)) ||
                         (itemType === 'Mod' && item.itemCategoryHashes.includes(59))
                       ));
    
    return matchesRarity && matchesType;
  });
};

// Generate suggestions for missing items
const generateMissingSuggestions = (optimalBuild, missingAnalysis) => {
  const suggestions = [];
  
  if (missingAnalysis.missingExotics.length > 0) {
    suggestions.push(`Acquire exotic gear: ${missingAnalysis.missingExotics.join(', ')}`);
    suggestions.push('Check Xur\'s weekly inventory for exotic items');
    suggestions.push('Complete exotic quests and lost sectors for armor');
  }
  
  if (missingAnalysis.missingMods.length > 0) {
    suggestions.push('Visit Ada-1 and Banshee-44 daily for essential mods');
    suggestions.push(`Focus on ${optimalBuild.focus}-related mods`);
  }
  
  suggestions.push(`Try activities that reward ${optimalBuild.focus} gear`);
  
  return suggestions;
};

// Generate alternative search suggestions
const generateAlternativeSearch = (originalSearch) => {
  const alternatives = {
    'grenade': 'ability energy',
    'reload': 'weapon damage', 
    'super': 'orb generation',
    'healing': 'recovery',
    'invisibility': 'void',
    'melee': 'strength'
  };
  
  const lowerSearch = originalSearch.toLowerCase();
  for (const [key, alt] of Object.entries(alternatives)) {
    if (lowerSearch.includes(key)) {
      return alt;
    }
  }
  
  return 'damage boost';
};