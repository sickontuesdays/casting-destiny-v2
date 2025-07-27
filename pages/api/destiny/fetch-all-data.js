import { fetchAllDestinyData } from '../../lib/bungie-data-fetcher';

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
    
    // Fetch fresh data
    const freshData = await fetchAllDestinyData();
    
    // Cache the data
    cachedData = freshData;
    cacheTimestamp = Date.now();
    
    console.log('Destiny data fetch complete, data cached');
    
    return res.status(200).json({
      success: true,
      data: freshData,
      cached: false,
      timestamp: cacheTimestamp
    });
    
  } catch (error) {
    console.error('Error in fetch-all-data API:', error);
    
    // If we have cached data and there's an error, return cached data as fallback
    if (cachedData) {
      console.log('API error, returning cached data as fallback');
      return res.status(200).json({
        success: true,
        data: cachedData,
        cached: true,
        fallback: true,
        error: 'Fresh data unavailable, using cached data'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch Destiny data',
      details: error.message
    });
  }
}