import { fetchAllDestinyData } from '../../../lib/bungie-data-fetcher';

let cachedData = null;
let cacheTimestamp = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
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

    console.log('Fetching fresh Destiny data from Bungie API...');
    
    // Fetch fresh data (now optimized for size)
    const freshData = await fetchAllDestinyData();
    
    // Check data size before caching
    const dataSize = JSON.stringify(freshData).length;
    console.log(`Data size: ${Math.round(dataSize / 1024)} KB`);
    
    if (dataSize > 3 * 1024 * 1024) { // 3MB limit to be safe
      console.warn('Data size exceeds safe limit, further optimization needed');
      
      // Emergency size reduction - keep only most essential data
      const emergencyData = {
        classes: freshData.classes || {},
        exotics: {
          armor: freshData.exotics?.armor || {},
          weapons: freshData.exotics?.weapons || {}
        },
        mods: {
          armor: (freshData.mods?.armor || []).slice(0, 10),
          weapon: (freshData.mods?.weapon || []).slice(0, 10),
          combat: (freshData.mods?.combat || []).slice(0, 10)
        },
        artifacts: (freshData.artifacts || []).slice(0, 5),
        metadata: {
          ...freshData.metadata,
          emergencyReduction: true,
          originalSize: dataSize
        }
      };
      
      cachedData = emergencyData;
    } else {
      cachedData = freshData;
    }
    
    cacheTimestamp = Date.now();
    
    console.log('Destiny data fetch complete, data cached successfully');
    
    return res.status(200).json({
      success: true,
      data: cachedData,
      cached: false,
      timestamp: cacheTimestamp,
      dataSize: Math.round(JSON.stringify(cachedData).length / 1024) + ' KB'
    });
    
  } catch (error) {
    console.error('Error in fetch-all-data API:', error);
    
    // Enhanced error logging for debugging
    console.error('Error details:', {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'), // Limit stack trace
      name: error.name,
      timestamp: new Date().toISOString()
    });
    
    // If we have cached data and there's an error, return cached data as fallback
    if (cachedData) {
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
    
    // If no cached data available, return minimal error response
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch Destiny data',
      details: process.env.NODE_ENV === 'development' ? error.message : 'API temporarily unavailable',
      suggestion: 'This may be due to Bungie API changes or temporary service issues. Please try again later.',
      retryAfter: 300 // Suggest retry after 5 minutes
    });
  }
}