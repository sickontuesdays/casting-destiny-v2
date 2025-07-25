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
    const componentPath = manifest.Response.jsonWorldComponentContentPaths[language][tableName];
    
    const response = await axios.get(`https://www.bungie.net${componentPath}`);
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
