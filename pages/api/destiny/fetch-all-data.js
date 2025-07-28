import { fetchAllDestinyData } from '../../../lib/bungie-data-fetcher';
import { testBungieApiConnection } from '../../../lib/bungie-api';

let cachedData = null;
let cacheTimestamp = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache

// Fallback data structure for when API is unavailable
const generateFallbackData = () => ({
  buildComponents: {
    abilities: {
      supers: [
        { hash: 1, name: 'Golden Gun', description: 'Solar super for Hunters', damageType: 'Solar', className: 'Hunter' },
        { hash: 2, name: 'Nova Bomb', description: 'Void super for Warlocks', damageType: 'Void', className: 'Warlock' },
        { hash: 3, name: 'Fist of Havoc', description: 'Arc super for Titans', damageType: 'Arc', className: 'Titan' }
      ],
      grenades: [
        { hash: 4, name: 'Solar Grenade', description: 'Area denial solar grenade', damageType: 'Solar' },
        { hash: 5, name: 'Vortex Grenade', description: 'Void grenade that pulls enemies', damageType: 'Void' },
        { hash: 6, name: 'Pulse Grenade', description: 'Arc grenade with multiple pulses', damageType: 'Arc' }
      ],
      melees: [
        { hash: 7, name: 'Throwing Knife', description: 'Ranged solar melee', damageType: 'Solar', className: 'Hunter' },
        { hash: 8, name: 'Energy Drain', description: 'Void melee that drains enemy energy', damageType: 'Void', className: 'Warlock' }
      ],
      classAbilities: [
        { hash: 9, name: 'Marksman\'s Dodge', description: 'Hunter dodge that reloads weapon', className: 'Hunter' },
        { hash: 10, name: 'Healing Rift', description: 'Warlock rift that heals allies', className: 'Warlock' },
        { hash: 11, name: 'Rally Barricade', description: 'Titan barricade that boosts reload', className: 'Titan' }
      ]
    },
    subclassModifiers: {
      aspects: [
        { hash: 12, name: 'Way of the Sharpshooter', description: 'Solar Hunter aspect', damageType: 'Solar', className: 'Hunter' },
        { hash: 13, name: 'Chaos Accelerant', description: 'Void Warlock aspect', damageType: 'Void', className: 'Warlock' }
      ],
      fragments: [
        { hash: 14, name: 'Ember of Torches', description: 'Solar fragment for ability energy', damageType: 'Solar' },
        { hash: 15, name: 'Echo of Undermining', description: 'Void fragment for weakening', damageType: 'Void' }
      ]
    },
    gear: {
      exoticArmor: [
        { hash: 16, name: 'Celestial Nighthawk', description: 'Exotic Hunter helmet for Golden Gun', className: 'Hunter', isExotic: true },
        { hash: 17, name: 'Skull of Dire Ahamkara', description: 'Exotic Warlock helmet for Nova Bomb', className: 'Warlock', isExotic: true },
        { hash: 18, name: 'Heart of Inmost Light', description: 'Exotic Titan chest for ability energy', className: 'Titan', isExotic: true }
      ],
      exoticWeapons: [
        { hash: 19, name: 'Sunshot', description: 'Exotic solar hand cannon', damageType: 'Solar', isExotic: true },
        { hash: 20, name: 'Graviton Lance', description: 'Exotic void pulse rifle', damageType: 'Void', isExotic: true },
        { hash: 21, name: 'Riskrunner', description: 'Exotic arc submachine gun', damageType: 'Arc', isExotic: true }
      ]
    },
    mods: {
      armor: [
        { hash: 22, name: 'Grenade Kickstart', description: 'Reduces grenade cooldown when critically wounded' },
        { hash: 23, name: 'Melee Kickstart', description: 'Reduces melee cooldown when critically wounded' }
      ],
      weapon: [
        { hash: 24, name: 'Targeting Adjuster', description: 'Improves target acquisition' },
        { hash: 25, name: 'Backup Mag', description: 'Increases magazine size' }
      ],
      combat: [
        { hash: 26, name: 'Elemental Resistance', description: 'Reduces elemental damage taken' },
        { hash: 27, name: 'Concussive Dampener', description: 'Reduces explosive damage taken' }
      ]
    }
  },
  exoticGear: {
    armor: {
      Hunter: [
        { hash: 16, name: 'Celestial Nighthawk', description: 'Exotic Hunter helmet for Golden Gun', className: 'Hunter', isExotic: true },
        { hash: 28, name: 'Orpheus Rig', description: 'Exotic Hunter legs for Shadowshot', className: 'Hunter', isExotic: true }
      ],
      Warlock: [
        { hash: 17, name: 'Skull of Dire Ahamkara', description: 'Exotic Warlock helmet for Nova Bomb', className: 'Warlock', isExotic: true },
        { hash: 29, name: 'Phoenix Protocol', description: 'Exotic Warlock chest for Well of Radiance', className: 'Warlock', isExotic: true }
      ],
      Titan: [
        { hash: 18, name: 'Heart of Inmost Light', description: 'Exotic Titan chest for ability energy', className: 'Titan', isExotic: true },
        { hash: 30, name: 'Helm of Saint-14', description: 'Exotic Titan helmet for Ward of Dawn', className: 'Titan', isExotic: true }
      ]
    },
    weapons: {
      kinetic: [
        { hash: 31, name: 'Ace of Spades', description: 'Exotic kinetic hand cannon', damageType: 'Kinetic', isExotic: true }
      ],
      energy: [
        { hash: 19, name: 'Sunshot', description: 'Exotic solar hand cannon', damageType: 'Solar', isExotic: true },
        { hash: 20, name: 'Graviton Lance', description: 'Exotic void pulse rifle', damageType: 'Void', isExotic: true },
        { hash: 21, name: 'Riskrunner', description: 'Exotic arc submachine gun', damageType: 'Arc', isExotic: true }
      ],
      power: [
        { hash: 32, name: 'Wardcliff Coil', description: 'Exotic arc rocket launcher', damageType: 'Arc', isExotic: true }
      ]
    }
  },
  subclassData: {
    Hunter: {
      Solar: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [] },
      Arc: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [] },
      Void: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [] },
      Stasis: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [] },
      Strand: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [] }
    },
    Warlock: {
      Solar: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [] },
      Arc: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [] },
      Void: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [] },
      Stasis: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [] },
      Strand: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [] }
    },
    Titan: {
      Solar: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [] },
      Arc: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [] },
      Void: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [] },
      Stasis: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [] },
      Strand: { supers: [], aspects: [], fragments: [], grenades: [], melees: [], classAbilities: [] }
    }
  },
  modData: {
    armor: [],
    weapon: [],
    combat: [],
    utility: []
  },
  metadata: {
    totalOriginalItems: 500,
    buildEssentialItems: 50,
    lastUpdated: Date.now(),
    version: '3.0-fallback',
    isFallback: true,
    fallbackReason: 'Bungie API unavailable'
  }
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('=== FETCH ALL DATA API START ===');
    
    // Check if we have valid cached data
    if (cachedData && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
      console.log('Returning cached Destiny data');
      return res.status(200).json({
        success: true,
        data: cachedData,
        cached: true,
        cacheAge: Math.floor((Date.now() - cacheTimestamp) / 1000)
      });
    }

    // Test API connection first
    console.log('Testing Bungie API connection...');
    const connectionTest = await testBungieApiConnection();
    
    if (!connectionTest.success) {
      console.warn('API connection failed, using fallback data:', connectionTest.error);
      
      const fallbackData = generateFallbackData();
      
      return res.status(200).json({
        success: true,
        data: fallbackData,
        cached: false,
        fallback: true,
        fallbackReason: connectionTest.error,
        message: 'Using fallback data due to API connectivity issues'
      });
    }

    console.log('API connection successful, fetching fresh data...');
    
    // Attempt to fetch fresh data with timeout
    const fetchPromise = fetchAllDestinyData();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Data fetch timeout')), 120000) // 2 minute timeout
    );
    
    let freshData;
    try {
      freshData = await Promise.race([fetchPromise, timeoutPromise]);
    } catch (timeoutError) {
      console.warn('Data fetch timed out, using fallback data');
      
      const fallbackData = generateFallbackData();
      fallbackData.metadata.fallbackReason = 'Fetch timeout';
      
      return res.status(200).json({
        success: true,
        data: fallbackData,
        cached: false,
        fallback: true,
        fallbackReason: 'Data fetch timeout',
        message: 'Using fallback data due to fetch timeout'
      });
    }
    
    // Validate fetched data
    if (!freshData || !freshData.buildComponents) {
      console.warn('Invalid data structure received, using fallback');
      
      const fallbackData = generateFallbackData();
      fallbackData.metadata.fallbackReason = 'Invalid data structure';
      
      return res.status(200).json({
        success: true,
        data: fallbackData,
        cached: false,
        fallback: true,
        fallbackReason: 'Invalid data structure',
        message: 'Using fallback data due to invalid API response'
      });
    }
    
    // Check data size and optimize if needed
    const dataSize = JSON.stringify(freshData).length;
    console.log(`Fresh data size: ${Math.round(dataSize / 1024)} KB`);
    
    if (dataSize > 5 * 1024 * 1024) { // 5MB limit
      console.warn('Data size too large, applying emergency optimization');
      
      // Emergency size reduction
      const optimizedData = {
        buildComponents: {
          abilities: {
            supers: (freshData.buildComponents?.abilities?.supers || []).slice(0, 10),
            grenades: (freshData.buildComponents?.abilities?.grenades || []).slice(0, 10),
            melees: (freshData.buildComponents?.abilities?.melees || []).slice(0, 10),
            classAbilities: (freshData.buildComponents?.abilities?.classAbilities || []).slice(0, 10)
          },
          subclassModifiers: {
            aspects: (freshData.buildComponents?.subclassModifiers?.aspects || []).slice(0, 20),
            fragments: (freshData.buildComponents?.subclassModifiers?.fragments || []).slice(0, 20)
          },
          gear: {
            exoticArmor: (freshData.buildComponents?.gear?.exoticArmor || []).slice(0, 50),
            exoticWeapons: (freshData.buildComponents?.gear?.exoticWeapons || []).slice(0, 50)
          },
          mods: {
            armor: (freshData.buildComponents?.mods?.armor || []).slice(0, 30),
            weapon: (freshData.buildComponents?.mods?.weapon || []).slice(0, 30),
            combat: (freshData.buildComponents?.mods?.combat || []).slice(0, 30)
          }
        },
        exoticGear: freshData.exoticGear || {},
        subclassData: freshData.subclassData || {},
        modData: {
          armor: (freshData.modData?.armor || []).slice(0, 20),
          weapon: (freshData.modData?.weapon || []).slice(0, 20),
          combat: (freshData.modData?.combat || []).slice(0, 20),
          utility: (freshData.modData?.utility || []).slice(0, 20)
        },
        metadata: {
          ...freshData.metadata,
          optimized: true,
          originalSize: dataSize,
          optimizedSize: 0 // Will be calculated below
        }
      };
      
      optimizedData.metadata.optimizedSize = JSON.stringify(optimizedData).length;
      cachedData = optimizedData;
    } else {
      cachedData = freshData;
    }
    
    cacheTimestamp = Date.now();
    
    console.log('=== FETCH ALL DATA API SUCCESS ===');
    
    return res.status(200).json({
      success: true,
      data: cachedData,
      cached: false,
      timestamp: cacheTimestamp,
      dataSize: Math.round(JSON.stringify(cachedData).length / 1024) + ' KB',
      message: 'Fresh Destiny data loaded successfully'
    });
    
  } catch (error) {
    console.error('=== FETCH ALL DATA API ERROR ===');
    console.error('Error details:', {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
      name: error.name,
      timestamp: new Date().toISOString()
    });
    
    // If we have cached data and there's an error, return cached data as fallback
    if (cachedData && cacheTimestamp) {
      console.log('API error, returning cached data as fallback');
      return res.status(200).json({
        success: true,
        data: cachedData,
        cached: true,
        fallback: true,
        error: 'Fresh data unavailable, using cached data',
        originalError: error.message,
        cacheAge: cacheTimestamp ? Math.floor((Date.now() - cacheTimestamp) / 1000) : 'unknown'
      });
    }
    
    // If no cached data available, return fallback data structure
    console.log('No cached data available, generating fallback data');
    const fallbackData = generateFallbackData();
    fallbackData.metadata.fallbackReason = error.message;
    
    return res.status(200).json({
      success: true,
      data: fallbackData,
      cached: false,
      fallback: true,
      error: 'Bungie API unavailable, using fallback data',
      originalError: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : 'Check server logs for details',
      suggestion: 'This may be due to Bungie API maintenance, network issues, or missing API key. The app will work with limited functionality.',
      retryAfter: 300 // Suggest retry after 5 minutes
    });
  }
}