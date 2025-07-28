import { ManifestCacheManager } from '../../../lib/manifest-cache-manager';
import { DIMStyleDataOrganizer } from '../../../lib/dim-style-data-organizer';
import { findDynamicBuilds } from '../../../lib/dynamic-build-intelligence';

let cacheManager = null;
let dataOrganizer = null;

// Initialize cache manager
const getCacheManager = () => {
  if (!cacheManager) {
    cacheManager = new ManifestCacheManager();
  }
  return cacheManager;
};

// Initialize data organizer
const getDataOrganizer = () => {
  if (!dataOrganizer) {
    dataOrganizer = new DIMStyleDataOrganizer();
  }
  return dataOrganizer;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { query, filters = {}, searchType = 'builds' } = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please describe the build you want to create' 
      });
    }

    console.log(`Build search: "${query}" (${searchType})`);

    // Get cached manifest data
    const cache = getCacheManager();
    const organizer = getDataOrganizer();
    
    // Check if manifest is cached
    const manifestInfo = await cache.getManifestInfo();
    if (!manifestInfo.isCached) {
      // Trigger manifest download in background
      cache.downloadAndCacheManifest().catch(console.error);
      
      return res.status(202).json({
        success: false,
        error: 'Manifest not cached yet',
        message: 'Downloading latest Destiny data... Please try again in a moment.',
        needsRetry: true,
        retryAfter: 10
      });
    }

    // Get organized data from cache
    let organizedData;
    try {
      const manifestData = await cache.getCachedManifestData(['DestinyInventoryItemDefinition']);
      organizedData = await organizer.organizeManifestData(manifestData);
    } catch (error) {
      console.error('Failed to organize manifest data:', error);
      
      // Return fallback build suggestions
      return res.status(200).json({
        success: true,
        searchType: 'fallback',
        builds: generateFallbackBuilds(query),
        totalFound: 3,
        query,
        message: 'Using example builds - manifest data unavailable',
        fallback: true
      });
    }

    // Apply filters to organized data
    const filteredData = applySearchFilters(organizedData, filters);

    // Search based on type
    switch (searchType) {
      case 'builds':
        return await handleBuildSearch(query, filteredData, res);
      case 'items': 
        return await handleItemSearch(query, filteredData, res);
      default:
        return await handleBuildSearch(query, filteredData, res);
    }

  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Search service unavailable',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Handle build-focused searches
const handleBuildSearch = async (query, organizedData, res) => {
  try {
    // Use dynamic build intelligence to find complete builds
    const buildResults = findDynamicBuilds(query, {
      inventoryItems: organizedData.searchableItems
    });
    
    if (buildResults.builds.length > 0) {
      // Enhance builds with DIM-style data
      const enhancedBuilds = buildResults.builds.map(build => 
        enhanceBuildWithOrganizedData(build, organizedData)
      );
      
      return res.status(200).json({ 
        success: true,
        searchType: 'builds',
        builds: enhancedBuilds,
        totalFound: enhancedBuilds.length,
        query,
        sourceItems: buildResults.sourceItems,
        message: `Found ${enhancedBuilds.length} complete build${enhancedBuilds.length !== 1 ? 's' : ''} matching "${query}"`,
        dataInfo: {
          totalItems: Object.keys(organizedData.searchableItems).length,
          exoticCount: organizedData.categories.exoticGear.all.length,
          buildComponents: Object.keys(organizedData.buildComponents).length,
          cacheAge: Math.floor((Date.now() - organizedData.cacheTimestamp) / 60000) + ' minutes'
        }
      });
    }

    // If no complete builds, analyze available components
    const componentAnalysis = analyzeAvailableComponents(query, organizedData);
    
    if (componentAnalysis.relevantItems.length > 0) {
      return res.status(200).json({ 
        success: true,
        searchType: 'components',
        results: componentAnalysis.relevantItems.slice(0, 15),
        totalFound: componentAnalysis.relevantItems.length,
        query,
        componentAnalysis: componentAnalysis.analysis,
        suggestions: componentAnalysis.suggestions,
        message: `Found ${componentAnalysis.relevantItems.length} build components for "${query}". You may need additional items for a complete build.`
      });
    }

    // No relevant items found
    return res.status(200).json({
      success: true,
      searchType: 'no_match',
      results: [],
      totalFound: 0,
      query,
      message: `No build components found for "${query}".`,
      suggestions: [
        'Try broader terms like "damage", "healing", "invisibility", or "grenade"',
        'Search for specific exotic names like "Heart of Inmost Light" or "Orpheus Rig"',
        'Try build types like "grenade spam", "ability loop", or "weapon swap"'
      ],
      availableCategories: Object.keys(organizedData.categories)
    });

  } catch (error) {
    console.error('Build search error:', error);
    throw error;
  }
};

// Handle item-focused searches
const handleItemSearch = async (query, organizedData, res) => {
  try {
    const organizer = getDataOrganizer();
    const searchResults = organizer.searchItems(query, {
      includeCategories: ['weapons', 'armor', 'mods', 'abilities'],
      limit: 50,
      relevanceThreshold: 0.3
    });

    return res.status(200).json({
      success: true,
      searchType: 'items',
      results: searchResults.items,
      totalFound: searchResults.totalFound,
      query,
      searchStats: searchResults.stats,
      message: `Found ${searchResults.totalFound} items matching "${query}"`
    });

  } catch (error) {
    console.error('Item search error:', error);
    throw error;
  }
};

// Apply search filters to organized data
const applySearchFilters = (organizedData, filters) => {
  let filteredData = { ...organizedData };

  // Class filter
  if (filters.class && filters.class !== 'any') {
    const classMap = { titan: 'Titan', hunter: 'Hunter', warlock: 'Warlock' };
    const className = classMap[filters.class.toLowerCase()];
    
    if (className) {
      // Filter items by class
      Object.keys(filteredData.searchableItems).forEach(hash => {
        const item = filteredData.searchableItems[hash];
        if (item.classType !== undefined && item.classType !== className && item.classType !== 'Unknown') {
          delete filteredData.searchableItems[hash];
        }
      });
    }
  }

  // Damage type filter
  if (filters.damage && filters.damage !== 'any') {
    const damageType = filters.damage.charAt(0).toUpperCase() + filters.damage.slice(1).toLowerCase();
    
    Object.keys(filteredData.searchableItems).forEach(hash => {
      const item = filteredData.searchableItems[hash];
      if (item.damageType && item.damageType !== 'None' && item.damageType !== damageType) {
        delete filteredData.searchableItems[hash];
      }
    });
  }

  // Activity focus filter - enhance search query
  if (filters.focus && filters.focus !== 'any') {
    const focusKeywords = {
      'pve': ['add control', 'enemy density', 'crowd control'],
      'pvp': ['crucible', 'guardian', 'competitive'],
      'raid': ['boss damage', 'team coordination', 'dps'],
      'dungeon': ['solo viable', 'survivability'],
      'nightfall': ['champion', 'grandmaster', 'endgame'],
      'solo': ['self sufficient', 'healing', 'invisibility'],
      'endgame': ['master', 'grandmaster', 'contest']
    };
    
    // This will be used by the build intelligence system
    filteredData.activityFocus = filters.focus;
    filteredData.focusKeywords = focusKeywords[filters.focus] || [];
  }

  return filteredData;
};

// Enhance builds with DIM-style organized data
const enhanceBuildWithOrganizedData = (build, organizedData) => {
  const enhanced = { ...build };

  // Add detailed item information
  if (build.components) {
    enhanced.detailedComponents = {};
    
    Object.keys(build.components).forEach(componentType => {
      const items = build.components[componentType];
      enhanced.detailedComponents[componentType] = items.map(item => {
        const detailedItem = organizedData.searchableItems[item.hash];
        return detailedItem ? {
          ...item,
          ...detailedItem,
          category: componentType,
          dimData: organizedData.categories.byHash[item.hash]
        } : item;
      });
    });
  }

  // Add build optimization suggestions
  enhanced.optimizations = generateBuildOptimizations(enhanced, organizedData);
  
  // Add activity recommendations
  enhanced.activityRecommendations = generateActivityRecommendations(enhanced);
  
  // Add stat recommendations
  enhanced.statRecommendations = generateStatRecommendations(enhanced);

  return enhanced;
};

// Analyze available components for partial builds
const analyzeAvailableComponents = (query, organizedData) => {
  const organizer = getDataOrganizer();
  
  // Search for relevant items
  const searchResults = organizer.searchItems(query, {
    includeCategories: ['exoticGear', 'buildComponents', 'mods'],
    limit: 30,
    relevanceThreshold: 0.4
  });

  const relevantItems = searchResults.items;

  // Analyze what types of components were found
  const analysis = {
    exotics: relevantItems.filter(item => item.isExotic).length,
    mods: relevantItems.filter(item => item.category === 'mods').length,
    abilities: relevantItems.filter(item => 
      ['aspects', 'fragments', 'supers', 'grenades'].includes(item.category)
    ).length,
    weapons: relevantItems.filter(item => item.category === 'weapons').length,
    armor: relevantItems.filter(item => item.category === 'armor').length
  };

  // Generate suggestions based on what's missing
  const suggestions = [];
  if (analysis.exotics === 0) {
    suggestions.push('Look for exotic armor or weapons that synergize with your playstyle');
  }
  if (analysis.mods < 2) {
    suggestions.push('Acquire essential mods from vendors like Ada-1 and Banshee-44');
  }
  if (analysis.abilities < 2) {
    suggestions.push('Unlock more aspects and fragments for your chosen subclass');
  }

  if (suggestions.length === 0) {
    suggestions.push('Try combining these items with complementary gear for a complete build');
  }

  return {
    relevantItems,
    analysis,
    suggestions
  };
};

// Generate build optimization suggestions
const generateBuildOptimizations = (build, organizedData) => {
  const optimizations = [];

  // Check for better exotic alternatives
  if (build.detailedComponents?.exoticArmor?.length > 0) {
    const currentExotic = build.detailedComponents.exoticArmor[0];
    const alternatives = findExoticAlternatives(currentExotic, organizedData);
    
    if (alternatives.length > 0) {
      optimizations.push({
        type: 'exotic_alternative',
        current: currentExotic.name,
        alternatives: alternatives.slice(0, 2),
        reason: 'Similar functionality with different benefits'
      });
    }
  }

  // Check for missing essential mods
  const essentialMods = identifyMissingEssentialMods(build, organizedData);
  if (essentialMods.length > 0) {
    optimizations.push({
      type: 'missing_mods',
      mods: essentialMods,
      reason: 'These mods would significantly enhance the build'
    });
  }

  // Check for stat optimization
  const statOptimizations = identifyStatOptimizations(build);
  if (statOptimizations.length > 0) {
    optimizations.push({
      type: 'stat_optimization',
      recommendations: statOptimizations,
      reason: 'Optimize stat distribution for better performance'
    });
  }

  return optimizations;
};

// Generate activity recommendations
const generateActivityRecommendations = (build) => {
  const recommendations = {
    excellent: [],
    good: [],
    notRecommended: []
  };

  const buildType = build.buildType || build.focus;
  
  // Activity recommendations based on build type
  const activityMap = {
    'grenade': {
      excellent: ['Strikes', 'Lost Sectors', 'Patrol'],
      good: ['Dungeons', 'Raids (Add Control)'],
      notRecommended: ['Crucible', 'Trials']
    },
    'stealth': {
      excellent: ['Solo Lost Sectors', 'Grandmaster Nightfalls', 'Dungeons'],
      good: ['Raids (Support Role)', 'Regular Nightfalls'],
      notRecommended: ['Crucible (6v6)', 'Gambit']
    },
    'healing': {
      excellent: ['Raids', 'Dungeons', 'Grandmaster Nightfalls'],
      good: ['Regular Nightfalls', 'Trials (Support)'],
      notRecommended: ['Solo Content', 'Patrol']
    },
    'weapon_damage': {
      excellent: ['Raids (DPS)', 'Dungeons', 'Boss Encounters'],
      good: ['Nightfalls', 'Gambit'],
      notRecommended: ['Patrol', 'Low-level content']
    }
  };

  const mapping = activityMap[buildType] || {
    excellent: ['General PvE Content'],
    good: ['Most Activities'],
    notRecommended: []
  };

  return {
    ...mapping,
    buildType
  };
};

// Generate stat recommendations
const generateStatRecommendations = (build) => {
  const buildType = build.buildType || build.focus;
  
  const statPriorities = {
    'grenade': {
      primary: 'Discipline',
      secondary: 'Resilience',
      tertiary: 'Recovery',
      target: { discipline: 100, resilience: 80, recovery: 60 }
    },
    'stealth': {
      primary: 'Mobility',
      secondary: 'Strength',
      tertiary: 'Discipline',
      target: { mobility: 100, strength: 80, discipline: 60 }
    },
    'healing': {
      primary: 'Recovery',
      secondary: 'Discipline',
      tertiary: 'Resilience',
      target: { recovery: 100, discipline: 80, resilience: 70 }
    },
    'super': {
      primary: 'Intellect',
      secondary: 'Discipline',
      tertiary: 'Strength',
      target: { intellect: 100, discipline: 70, strength: 70 }
    },
    'melee': {
      primary: 'Strength',
      secondary: 'Resilience', 
      tertiary: 'Recovery',
      target: { strength: 100, resilience: 80, recovery: 60 }
    }
  };

  return statPriorities[buildType] || {
    primary: 'Resilience',
    secondary: 'Recovery',
    tertiary: 'Discipline',
    target: { resilience: 100, recovery: 80, discipline: 60 }
  };
};

// Helper functions for optimization
const findExoticAlternatives = (currentExotic, organizedData) => {
  // Find exotics with similar keywords or functionality
  const currentKeywords = currentExotic.description?.toLowerCase().split(' ') || [];
  const alternatives = [];

  organizedData.categories.exoticGear.armor.forEach(exotic => {
    if (exotic.hash === currentExotic.hash) return;
    if (exotic.classType !== currentExotic.classType) return;

    const exoticKeywords = exotic.description?.toLowerCase().split(' ') || [];
    const commonKeywords = currentKeywords.filter(keyword => 
      exoticKeywords.includes(keyword) && keyword.length > 3
    );

    if (commonKeywords.length >= 2) {
      alternatives.push({
        name: exotic.name,
        reason: `Shares functionality: ${commonKeywords.slice(0, 2).join(', ')}`
      });
    }
  });

  return alternatives;
};

const identifyMissingEssentialMods = (build, organizedData) => {
  const buildType = build.buildType || build.focus;
  const currentMods = build.detailedComponents?.mods?.map(mod => mod.name.toLowerCase()) || [];
  
  const essentialModsByType = {
    'grenade': ['grenade kickstart', 'bomber', 'distribution'],
    'stealth': ['utility kickstart', 'distribution', 'dynamo'],
    'healing': ['well of life', 'recuperation', 'better already'],
    'weapon_damage': ['font of might', 'high-energy fire', 'elemental time dilation'],
    'super': ['hands-on', 'ashes to assets', 'distribution']
  };

  const essentialMods = essentialModsByType[buildType] || [];
  const missingMods = essentialMods.filter(mod => 
    !currentMods.some(currentMod => currentMod.includes(mod.replace(' ', '')))
  );

  return missingMods;
};

const identifyStatOptimizations = (build) => {
  const optimizations = [];
  const buildType = build.buildType || build.focus;

  // General optimization advice based on build type
  const advice = {
    'grenade': 'Aim for 100 Discipline for maximum grenade uptime',
    'stealth': 'Prioritize 100 Mobility for faster dodge cooldown and better invisibility uptime',
    'healing': 'Focus on 100 Recovery for faster health regeneration and enhanced healing abilities',
    'super': 'Target 100 Intellect for faster super generation',
    'melee': 'Maximize Strength for constant melee ability availability'
  };

  if (advice[buildType]) {
    optimizations.push(advice[buildType]);
  }

  optimizations.push('Maintain at least 100 Resilience for damage reduction in endgame content');

  return optimizations;
};

// Generate fallback builds when manifest is unavailable
const generateFallbackBuilds = (query) => {
  const lowerQuery = query.toLowerCase();
  
  const fallbackBuilds = [
    {
      name: 'Heart of Inmost Light Grenade Build',
      description: 'Constant grenade spam using Heart of Inmost Light exotic chest',
      synergyScore: 95,
      buildType: 'grenade',
      focus: 'grenade',
      buildGuide: {
        armor: { exotic: 'Heart of Inmost Light', priority: '100 Discipline' },
        weapons: { exotic: 'Sunshot or Graviton Lance' },
        mods: { essential: ['Grenade Kickstart', 'Bomber', 'Distribution'] }
      }
    },
    {
      name: 'Graviton Forfeit Invisibility Build',
      description: 'Void Hunter invisibility build with extended stealth duration',
      synergyScore: 92,
      buildType: 'stealth',
      focus: 'stealth',
      buildGuide: {
        armor: { exotic: 'Graviton Forfeit', priority: '100 Mobility' },
        weapons: { exotic: 'Le Monarque or Graviton Lance' },
        subclass: { aspects: ['Vanishing Step', 'Trapper\'s Ambush'] }
      }
    },
    {
      name: 'Phoenix Protocol Support Build',
      description: 'Solar Warlock healing and support using Well of Radiance',
      synergyScore: 90,
      buildType: 'healing',
      focus: 'healing',
      buildGuide: {
        armor: { exotic: 'Phoenix Protocol', priority: '100 Recovery' },
        weapons: { exotic: 'Sunshot or Polaris Lance' },
        subclass: { super: 'Well of Radiance', aspects: ['Touch of Flame', 'Heat Rises'] }
      }
    }
  ];

  // Filter based on query keywords
  if (lowerQuery.includes('grenade')) return [fallbackBuilds[0]];
  if (lowerQuery.includes('invisible') || lowerQuery.includes('stealth')) return [fallbackBuilds[1]];
  if (lowerQuery.includes('heal') || lowerQuery.includes('support')) return [fallbackBuilds[2]];

  return fallbackBuilds;
};