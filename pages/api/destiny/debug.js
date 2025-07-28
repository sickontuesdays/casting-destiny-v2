import { testBungieApiConnection, getManifest } from '../../../lib/bungie-api';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('=== DESTINY API DEBUG START ===');
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasApiKey: !!process.env.BUNGIE_API_KEY,
        apiKeyLength: process.env.BUNGIE_API_KEY?.length || 0,
        apiKeyPreview: process.env.BUNGIE_API_KEY ? 
          `${process.env.BUNGIE_API_KEY.substring(0, 8)}...` : 'Not set'
      },
      tests: {}
    };

    // Test 1: Basic API connection
    console.log('Testing basic API connection...');
    const connectionTest = await testBungieApiConnection();
    debugInfo.tests.connection = connectionTest;

    if (!connectionTest.success) {
      console.log('=== DESTINY API DEBUG END (Connection Failed) ===');
      return res.status(200).json({
        success: false,
        error: 'API connection failed',
        debug: debugInfo
      });
    }

    // Test 2: Manifest fetch
    console.log('Testing manifest fetch...');
    try {
      const manifest = await getManifest();
      debugInfo.tests.manifest = {
        success: true,
        hasResponse: !!manifest.Response,
        hasContentPaths: !!manifest.Response?.jsonWorldComponentContentPaths,
        availableLanguages: manifest.Response?.jsonWorldComponentContentPaths ? 
          Object.keys(manifest.Response.jsonWorldComponentContentPaths) : [],
        version: manifest.Response?.version
      };

      // Test 3: Available components
      if (manifest.Response?.jsonWorldComponentContentPaths?.en) {
        const components = Object.keys(manifest.Response.jsonWorldComponentContentPaths.en);
        debugInfo.tests.components = {
          success: true,
          total: components.length,
          available: components.slice(0, 10), // First 10 for preview
          hasInventoryItems: components.includes('DestinyInventoryItemDefinition')
        };
      }

    } catch (manifestError) {
      console.error('Manifest test failed:', manifestError);
      debugInfo.tests.manifest = {
        success: false,
        error: manifestError.message
      };
    }

    // Test 4: Small component fetch test
    console.log('Testing small component fetch...');
    try {
      // Try to fetch a small component first
      const settingsResponse = await fetch('https://www.bungie.net/Platform/Settings/', {
        headers: {
          'X-API-Key': process.env.BUNGIE_API_KEY
        }
      });
      
      debugInfo.tests.smallFetch = {
        success: settingsResponse.ok,
        status: settingsResponse.status,
        statusText: settingsResponse.statusText
      };

    } catch (fetchError) {
      debugInfo.tests.smallFetch = {
        success: false,
        error: fetchError.message
      };
    }

    console.log('=== DESTINY API DEBUG END (Success) ===');
    
    return res.status(200).json({
      success: true,
      message: 'Debug completed successfully',
      debug: debugInfo,
      recommendations: generateRecommendations(debugInfo)
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Debug test failed',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

function generateRecommendations(debugInfo) {
  const recommendations = [];

  if (!debugInfo.environment.hasApiKey) {
    recommendations.push({
      type: 'critical',
      message: 'Missing Bungie API Key',
      action: 'Add BUNGIE_API_KEY to your environment variables. Get one from https://www.bungie.net/en/Application'
    });
  }

  if (debugInfo.environment.apiKeyLength < 20) {
    recommendations.push({
      type: 'warning', 
      message: 'API key seems too short',
      action: 'Verify your API key is complete and correct'
    });
  }

  if (!debugInfo.tests.connection?.success) {
    recommendations.push({
      type: 'error',
      message: 'Cannot connect to Bungie API',
      action: 'Check internet connection and Bungie API status'
    });
  }

  if (!debugInfo.tests.manifest?.success) {
    recommendations.push({
      type: 'error',
      message: 'Cannot fetch manifest',
      action: 'Verify API key permissions and Bungie API status'
    });
  }

  if (!debugInfo.tests.components?.hasInventoryItems) {
    recommendations.push({
      type: 'warning',
      message: 'DestinyInventoryItemDefinition not found',
      action: 'This component is essential for the app to work'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: 'success',
      message: 'All tests passed!',
      action: 'Your Bungie API setup appears to be working correctly'
    });
  }

  return recommendations;
}