import { findDynamicBuilds } from '../../../lib/dynamic-build-intelligence';
import { getOrganizedBuildData, getBuildDataStatus } from '../../../lib/build-time-data-loader';

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

    // Get build-time data status
    const dataStatus = getBuildDataStatus();
    console.log(`Data status - Has data: ${dataStatus.hasData}, Version: ${dataStatus.version}, Fallback: ${dataStatus.isFallback}`);

    // Load organized build data
    const organizedDataResult = getOrganizedBuildData();
    
    if (!organizedDataResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to load build data',
        details: 'Build-time manifest data is not available'
      });
    }

    const organizedData = organizedDataResult.data;
    
    // Apply filters to organized data
    const filteredData = applySearchFilters(organizedData, filters);

    // Try to find builds using dynamic build intelligence
    try {
      const buildResults = findDynamicBuilds(query, {
        inventoryItems: filteredData.searchableItems
      });

      if (buildResults.builds.length > 0) {
        // Enhance builds with organized data
        const enhancedBuilds = buildResults.builds.map(build => 
          enhanceBuildWithData(build, organizedData)
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
            version: organizedData.metadata.version,
            itemCount: organizedData.metadata.itemCount,
            isFallback: organizedData.metadata.isFallback,
            lastUpdate: organizedData.metadata.downloadedAt,
            exoticCount: organizedData.categories.exoticGear.all.length,
            buildComponentCount: Object.values(organizedData.categories.buildComponents).reduce((total, items) => total + items.length, 0)
          }
        });
      }
    } catch (buildError) {
      console.error('Build search error:', buildError);
    }

    // If no complete builds found, analyze available components
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
        message: `Found ${componentAnalysis.relevantItems.length} build components for "${query}". You may need additional items for a complete build.`,
        dataInfo: {
          version: organizedData.metadata.version,
          isFallback: organizedData.metadata.isFallback
        }
      });
    }

    // No builds found - return suggestions
    return res.status(200).json({
      success: true,
      searchType: 'no_match',
      results: [],
      totalFound: 0,
      query,
      message: `No builds found for "${query}". Try different keywords.`,
      suggestions: generateSearchSuggestions(query, organizedData),
      dataInfo: {
        version: organizedData.metadata.version,
        isFallback: organizedData.metadata.isFallback,
        availableCategories: Object.keys(organizedData.categories)
      }
    });

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

// Apply search filters to organized data
const applySearchFilters = (organizedData, filters) => {
  let filteredData = { ...organizedData };

  if (!filters || Object.keys(filters).length === 0) {
    return filteredData;
  }

  // Create a copy of searchable items for filtering
  const filteredItems = { ...organizedData.searchableItems };

  // Class filter
  if (filters.class && filters.class !== 'any') {
    const classMap = { titan: 'Titan', hunter: 'Hunter', warlock: 'Warlock' };
    const className = classMap[filters.class.toLowerCase()];
    
    if (className) {
      Object.keys(filteredItems).forEach(hash => {
        const item = filteredItems[hash];
        if (item.classType && item.classType !== 'Unknown' && item.classType !== className) {
          delete filteredItems[hash];
        }
      });
    }
  }

  // Damage type filter
  if (filters.damage && filters.damage !== 'any') {
    const damageType = filters.damage.charAt(0).toUpperCase() + filters.damage.slice(1).toLowerCase();
    
    Object.keys(filteredItems).forEach(hash => {
      const item = filteredItems[hash];
      if (item.damageType && item.damageType !== 'None' && item.damageType !== damageType) {
        delete filteredItems[hash];
      }
    });
  }

  // Update filtered data
  filteredData.searchableItems = filteredItems;
  filteredData.filteredBy = filters;

  return filteredData;
};

// Enhance builds with detailed organized data
const enhanceBuildWithData = (build, organizedData) => {
  const enhanced = { ...build };

  // Add detailed item information from organized data
  if (build.components) {
    enhanced.detailedComponents = {};
    
    Object.keys(build.components).forEach(componentType => {
      const items = build.components[componentType] || [];
      enhanced.detailedComponents[componentType] = items.map(item => {
        const detailedItem = organizedData.categories.byHash[item.hash];
        return detailedItem ? {
          ...item,
          ...detailedItem,
          category: componentType
        } : item;
      });
    });
  }

  // Add build recommendations based on available data
  enhanced.recommendations = generateBuildRecommendations(enhanced, organizedData);
  
  // Add alternative suggestions
  enhanced.alternatives = findBuildAlternatives(enhanced, organizedData);

  return enhanced;
};

// Analyze available components for partial builds
const analyzeAvailableComponents = (query, organizedData) => {
  const lowerQuery = query.toLowerCase();
  const relevantItems = [];

  // Search through all items for relevance
  Object.values(organizedData.searchableItems).forEach(item => {
    const itemText = `${item.name} ${item.description}`.toLowerCase();
    let relevanceScore = 0;

    // Check for direct keyword matches
    const queryWords = lowerQuery.split(' ').filter(word => word.length > 2);
    queryWords.forEach(word => {
      if (itemText.includes(word)) {
        relevanceScore += 10;
      }
    });

    // Boost score for exotic items
    if (item.isExotic) {
      relevanceScore += 15;
    }

    // Boost score for build-essential categories
    if (['exotic_armor', 'exotic_weapon', 'aspect', 'fragment'].includes(item.buildReason)) {
      relevanceScore += 10;
    }

    if (relevanceScore > 0) {
      relevantItems.push({
        ...item,
        relevanceScore,
        type: item.buildReason,
        matchReason: `Matched "${query}" with score ${relevanceScore}`
      });
    }
  });

  // Sort by relevance score
  relevantItems.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Analyze what types of components were found
  const analysis = {
    exotics: relevantItems.filter(item => item.isExotic).length,
    mods: relevantItems.filter(item => item.buildReason === 'mod').length,
    abilities: relevantItems.filter(item => 
      ['aspect', 'fragment', 'super', 'grenade', 'melee'].includes(item.buildReason)
    ).length,
    weapons: relevantItems.filter(item => item.buildReason === 'exotic_weapon').length,
    armor: relevantItems.filter(item => item.buildReason === 'exotic_armor').length
  };

  // Generate suggestions based on what's available
  const suggestions = [];
  if (analysis.exotics > 0) {
    suggestions.push(`Found ${analysis.exotics} exotic item${analysis.exotics !== 1 ? 's' : ''} - these are great build anchors`);
  }
  if (analysis.abilities > 0) {
    suggestions.push(`Found ${analysis.abilities} subclass component${analysis.abilities !== 1 ? 's' : ''} - combine with exotic gear`);
  }
  if (analysis.mods > 0) {
    suggestions.push(`Found ${analysis.mods} mod${analysis.mods !== 1 ? 's' : ''} - essential for build optimization`);
  }

  if (suggestions.length === 0) {
    suggestions.push('Try broader search terms like "damage", "ability", or specific exotic names');
  }

  return {
    relevantItems,
    analysis,
    suggestions
  };
};

// Generate build recommendations
const generateBuildRecommendations = (build, organizedData) => {
  const recommendations = [];

  // Recommend complementary exotics
  if (build.detailedComponents?.exoticArmor?.length > 0) {
    const currentExotic = build.detailedComponents.exoticArmor[0];
    const sameClassExotics = organizedData.categories.exoticGear.armor.filter(
      exotic => exotic.classType === currentExotic.classType && exotic.hash !== currentExotic.hash
    );

    if (sameClassExotics.length > 0) {
      recommendations.push({
        type: 'alternative_exotic',
        suggestion: `Try ${sameClassExotics[0].name} for a different ${currentExotic.classType} build`,
        items: sameClassExotics.slice(0, 2)
      });
    }
  }

  // Recommend missing subclass components
  const hasAspects = build.detailedComponents?.aspects?.length > 0;
  const hasFragments = build.detailedComponents?.fragments?.length > 0;

  if (!hasAspects && organizedData.categories.buildComponents.aspects.length > 0) {
    recommendations.push({
      type: 'missing_aspects',
      suggestion: 'Add aspects to enhance your subclass abilities',
      items: organizedData.categories.buildComponents.aspects.slice(0, 3)
    });
  }

  if (!hasFragments && organizedData.categories.buildComponents.fragments.length > 0) {
    recommendations.push({
      type: 'missing_fragments',
      suggestion: 'Add fragments for additional passive benefits',
      items: organizedData.categories.buildComponents.fragments.slice(0, 3)
    });
  }

  return recommendations;
};

// Find build alternatives
const findBuildAlternatives = (build, organizedData) => {
  const alternatives = [];
  const buildType = build.buildType || build.focus;

  // Find exotics that could create similar builds
  if (buildType === 'grenade') {
    const grenadeExotics = organizedData.categories.exoticGear.armor.filter(exotic =>
      exotic.description.toLowerCase().includes('grenade') ||
      exotic.description.toLowerCase().includes('ability')
    );
    
    if (grenadeExotics.length > 0) {
      alternatives.push({
        type: 'similar_build',
        name: 'Alternative Grenade Builds',
        items: grenadeExotics.slice(0, 2)
      });
    }
  }

  return alternatives;
};

// Generate search suggestions based on available data
const generateSearchSuggestions = (query, organizedData) => {
  const suggestions = [
    'Try broader terms like "damage", "healing", "invisibility", or "grenade"',
    'Search for specific exotic names from your collection',
    'Use build types like "grenade spam", "ability loop", or "weapon swap"'
  ];

  // Add suggestions based on available exotics
  if (organizedData.categories.exoticGear.all.length > 0) {
    const randomExotic = organizedData.categories.exoticGear.all[
      Math.floor(Math.random() * organizedData.categories.exoticGear.all.length)
    ];
    suggestions.push(`Try searching for "${randomExotic.name}" to see specific builds`);
  }

  return suggestions;
};