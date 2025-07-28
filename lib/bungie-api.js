import axios from 'axios';

const BUNGIE_BASE_URL = 'https://www.bungie.net/Platform';
const API_KEY = process.env.BUNGIE_API_KEY;

// Enhanced axios instance with better error handling
const bungieApi = axios.create({
  baseURL: BUNGIE_BASE_URL,
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Add request interceptor for debugging
bungieApi.interceptors.request.use(
  (config) => {
    console.log(`Making Bungie API request to: ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
bungieApi.interceptors.response.use(
  (response) => {
    console.log(`Bungie API response from ${response.config.url}: Status ${response.status}`);
    return response;
  },
  (error) => {
    console.error('Response interceptor error:', {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

export const getManifest = async () => {
  try {
    console.log('Fetching Destiny manifest...');
    
    // Check if API key is available
    if (!API_KEY) {
      throw new Error('BUNGIE_API_KEY environment variable is not set');
    }
    
    const response = await bungieApi.get('/Destiny2/Manifest/');
    
    if (!response.data) {
      throw new Error('No data received from Bungie API');
    }
    
    if (response.data.ErrorCode && response.data.ErrorCode !== 1) {
      throw new Error(`Bungie API Error: ${response.data.Message} (Code: ${response.data.ErrorCode})`);
    }
    
    console.log('Manifest fetched successfully');
    return response.data;
    
  } catch (error) {
    console.error('Error fetching manifest:', error);
    
    // Enhanced error information
    if (error.response) {
      // Server responded with error status
      const errorDetails = {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url
      };
      
      console.error('Bungie API Response Error:', errorDetails);
      
      if (error.response.status === 401) {
        throw new Error('Invalid Bungie API key - check your BUNGIE_API_KEY environment variable');
      } else if (error.response.status === 429) {
        throw new Error('Rate limited by Bungie API - too many requests');
      } else if (error.response.status >= 500) {
        throw new Error('Bungie API server error - try again later');
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response from Bungie API:', error.request);
      throw new Error('Network error - unable to reach Bungie API');
    }
    
    throw error;
  }
};

export const getManifestComponent = async (tableName, language = 'en') => {
  try {
    console.log(`Fetching manifest component: ${tableName}`);
    
    const manifest = await getManifest();
    
    // Enhanced error checking
    if (!manifest || !manifest.Response) {
      throw new Error('Invalid manifest response structure');
    }
    
    if (!manifest.Response.jsonWorldComponentContentPaths) {
      throw new Error('Manifest missing jsonWorldComponentContentPaths');
    }
    
    if (!manifest.Response.jsonWorldComponentContentPaths[language]) {
      console.warn(`Language '${language}' not found, trying 'en'`);
      language = 'en';
    }
    
    const languagePaths = manifest.Response.jsonWorldComponentContentPaths[language];
    if (!languagePaths) {
      throw new Error(`No paths found for language: ${language}`);
    }
    
    const componentPath = languagePaths[tableName];
    if (!componentPath) {
      // List available components for debugging
      const availableComponents = Object.keys(languagePaths);
      console.error(`Available components: ${availableComponents.join(', ')}`);
      throw new Error(`Component '${tableName}' not found in manifest for language '${language}'`);
    }
    
    console.log(`Fetching component data from: ${componentPath}`);
    
    // Use the full bungie.net URL with enhanced error handling
    const fullUrl = `https://www.bungie.net${componentPath}`;
    
    const response = await axios.get(fullUrl, {
      timeout: 60000, // 60 second timeout for large data files
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Casting-Destiny-App/1.0'
      }
    });
    
    if (!response.data) {
      throw new Error(`No data received for component: ${tableName}`);
    }
    
    console.log(`Component ${tableName} fetched successfully`);
    return response.data;
    
  } catch (error) {
    console.error(`Error fetching ${tableName}:`, error);
    
    // Enhanced error information for component fetching
    if (error.response) {
      console.error(`Component fetch error details:`, {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        component: tableName
      });
      
      if (error.response.status === 404) {
        throw new Error(`Component '${tableName}' not found - may have been removed or renamed`);
      }
    }
    
    throw error;
  }
};

export const searchDestinyEntities = async (searchTerm, type) => {
  try {
    console.log(`Searching Destiny entities for: ${searchTerm}`);
    
    const response = await bungieApi.post('/Destiny2/Armory/Search/DestinyInventoryItemDefinition/0/', {
      searchTerm,
      page: 0
    });
    
    if (response.data.ErrorCode && response.data.ErrorCode !== 1) {
      throw new Error(`Search Error: ${response.data.Message} (Code: ${response.data.ErrorCode})`);
    }
    
    console.log('Entity search completed successfully');
    return response.data;
    
  } catch (error) {
    console.error('Error searching entities:', error);
    throw error;
  }
};

// New function to test API connectivity
export const testBungieApiConnection = async () => {
  try {
    console.log('Testing Bungie API connection...');
    
    // Check if API key exists
    if (!API_KEY) {
      return {
        success: false,
        error: 'BUNGIE_API_KEY environment variable is not set',
        details: 'Add your Bungie API key to your environment variables'
      };
    }
    
    // Test basic API endpoint
    const response = await bungieApi.get('/Destiny2/Manifest/', {
      timeout: 10000 // 10 second timeout for connection test
    });
    
    if (response.data.ErrorCode && response.data.ErrorCode !== 1) {
      return {
        success: false,
        error: `Bungie API Error: ${response.data.Message}`,
        details: `Error Code: ${response.data.ErrorCode}`
      };
    }
    
    return {
      success: true,
      message: 'Bungie API connection successful',
      apiKey: API_KEY ? `${API_KEY.substring(0, 8)}...` : 'Not set'
    };
    
  } catch (error) {
    console.error('API connection test failed:', error);
    
    let errorMessage = 'Unknown error';
    let details = error.message;
    
    if (error.code === 'ENOTFOUND') {
      errorMessage = 'DNS resolution failed - check internet connection';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection refused - Bungie API may be down';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Connection timeout - network or API issues';
    } else if (error.response) {
      errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
      details = error.response.data?.Message || error.response.data;
    }
    
    return {
      success: false,
      error: errorMessage,
      details: details
    };
  }
};