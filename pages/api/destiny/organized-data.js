import { findDynamicBuilds } from '../../../lib/dynamic-build-intelligence';

// Fallback organized data structure
const generateFallbackOrganizedData = () => ({
  searchableItems: {
    // Sample items for testing
    12345: {
      hash: 12345,
      displayProperties: { name: 'Heart of Inmost Light', description: 'Exotic Titan chest armor that enhances ability energy' },
      classType: 'Titan',
      damageType: 'None',
      isExotic: true,
      category: 'exoticArmor',
      tierType: 6
    },
    12346: {
      hash: 12346,
      displayProperties: { name: 'Graviton Forfeit', description: 'Exotic Hunter helmet that extends invisibility' },
      classType: 'Hunter', 
      damageType: 'Void',
      isExotic: true,
      category: 'exoticArmor',
      tierType: 6
    },
    12347: {
      hash: 12347,
      displayProperties: { name: 'Phoenix Protocol', description: 'Exotic Warlock chest that enhances Well of Radiance' },
      classType: 'Warlock',
      damageType: 'Solar',
      isExotic: true,
      category: 'exoticArmor', 
      tierType: 6
    }
  },
  categories: {
    exoticGear: {
      armor: [
        { hash: 12345, name: 'Heart of Inmost Light', classType: 'Titan' },
        { hash: 12346, name: 'Graviton Forfeit', classType: 'Hunter' },
        { hash: 12347, name: 'Phoenix Protocol', classType: 'Warlock' }
      ],
      weapons: [
        { hash: 12348, name: 'Sunshot', damageType: 'Solar' },
        { hash: 12349, name: 'Graviton Lance', damageType: 'Void' }
      ],
      all: []
    },
    mods: {
      armor: [
        { hash: 12350, name: 'Grenade Kickstart', description: 'Reduces grenade cooldown when critically wounded' },
        { hash: 12351, name: 'Distribution', description: 'Reduces all ability cooldowns when using class ability' }
      ],
      weapon: [
        { hash: 12352, name: 'Targeting Adjuster', description: 'Improves target acquisition' }
      ]
    },
    byHash: {}
  },
  buildComponents: {
    aspects: [
      { hash: 12353, name: 'Heart of Inmost Light', classType: 'Titan' },
      { hash: 12354, name: 'Vanishing Step', classType: 'Hunter', damageType: 'Void' }
    ],
    fragments: [
      { hash: 12355, name: 'Echo of Undermining', damageType: 'Void' },
      { hash: 12356, name: 'Ember of Torches', damageType: 'Solar' }
    ]
  },
  cacheTimestamp: Date.now(),
  cacheSize: 1024000
});

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { query, searchType = 'builds' } = req.body;

    console.log('=== ORGANIZED DATA API START ===');
    console.log(`Request: ${searchType} search for "${query}"`);

    // For now, use fallback data structure
    const organizedData = generateFallbackOrganizedData();

    if (searchType === 'builds' && query) {
      // Try to find builds using fallback data
      try {
        const buildResults = findDynamicBuilds(query, {
          inventoryItems: organizedData.searchableItems
        });

        if (buildResults.builds.length > 0) {
          return res.status(200).json({
            success: true,
            searchType: 'builds',
            builds: buildResults.builds,
            totalFound: buildResults.builds.length,
            query,
            organizedData,
            message: `Found ${buildResults.builds.length} build${buildResults.builds.length !== 1 ? 's' : ''} using fallback data`,
            fallback: true
          });
        }
      } catch (buildError) {
        console.error('Build search error:', buildError);
      }
    }

    // Return organized data structure
    return res.status(200).json({
      success: true,
      organizedData,
      searchType: 'data',
      totalItems: Object.keys(organizedData.searchableItems).length,
      message: 'Using fallback organized data structure',
      fallback: true,
      dataInfo: {
        exoticCount: organizedData.categories.exoticGear.armor.length + organizedData.categories.exoticGear.weapons.length,
        modCount: organizedData.categories.mods.armor.length + organizedData.categories.mods.weapon.length,
        buildComponentCount: organizedData.buildComponents.aspects.length + organizedData.buildComponents.fragments.length
      }
    });

  } catch (error) {
    console.error('=== ORGANIZED DATA API ERROR ===');
    console.error('Error details:', error);

    // Return minimal fallback response
    return res.status(200).json({
      success: true,
      organizedData: generateFallbackOrganizedData(),
      searchType: 'fallback',
      totalItems: 5,
      query: req.body.query || '',
      message: 'Using minimal fallback data due to errors',
      error: error.message,
      fallback: true
    });
  }
}