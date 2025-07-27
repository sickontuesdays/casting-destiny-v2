import axios from 'axios';

const BUNGIE_BASE_URL = 'https://www.bungie.net/Platform';
const API_KEY = process.env.BUNGIE_API_KEY;

const bungieApi = axios.create({
  baseURL: BUNGIE_BASE_URL,
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json',
  },
});

export const getManifest = async () => {
  try {
    const response = await bungieApi.get('/Destiny2/Manifest/');
    return response.data;
  } catch (error) {
    console.error('Error fetching manifest:', error);
    throw error;
  }
};

export const getManifestComponent = async (tableName, language = 'en') => {
  try {
    const manifest = await getManifest();
    
    // Add comprehensive error checking
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
      throw new Error(`Component '${tableName}' not found in manifest for language '${language}'. Available components: ${Object.keys(languagePaths).join(', ')}`);
    }
    
    console.log(`Fetching component: ${tableName} from path: ${componentPath}`);
    
    // Use the full bungie.net URL
    const fullUrl = `https://www.bungie.net${componentPath}`;
    console.log(`Full URL: ${fullUrl}`);
    
    const response = await axios.get(fullUrl);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${tableName}:`, error);
    throw error;
  }
};

export const searchDestinyEntities = async (searchTerm, type) => {
  try {
    const response = await bungieApi.post('/Destiny2/Armory/Search/DestinyInventoryItemDefinition/0/', {
      searchTerm,
      page: 0
    });
    return response.data;
  } catch (error) {
    console.error('Error searching entities:', error);
    throw error;
  }
};