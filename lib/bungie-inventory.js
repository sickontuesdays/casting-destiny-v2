import axios from 'axios';

const BUNGIE_BASE_URL = 'https://www.bungie.net/Platform';

export const getUserInventory = async (membershipType, membershipId, characterId, accessToken) => {
  try {
    const response = await axios.get(
      `${BUNGIE_BASE_URL}/Destiny2/${membershipType}/Profile/${membershipId}/Character/${characterId}/`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-API-Key': process.env.BUNGIE_API_KEY,
        },
        params: {
          components: '201,205,300,302,304,305,306,307,308,309,310' // Inventory components
        }
      }
    );
    
    return response.data.Response;
  } catch (error) {
    console.error('Error fetching user inventory:', error);
    throw error;
  }
};

export const getUserProfile = async (membershipType, membershipId, accessToken) => {
  try {
    const response = await axios.get(
      `${BUNGIE_BASE_URL}/Destiny2/${membershipType}/Profile/${membershipId}/`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-API-Key': process.env.BUNGIE_API_KEY,
        },
        params: {
          components: '100,102,103,200,201,205,300,302,304,305,306,307,308,309,310'
        }
      }
    );
    
    return response.data.Response;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const getAllUserItems = async (membershipType, membershipId, accessToken) => {
  try {
    const profile = await getUserProfile(membershipType, membershipId, accessToken);
    const allItems = new Set();
    
    // Collect items from all sources
    const sources = [
      profile.profileInventory?.data?.items || [],
      profile.profilePlugSets?.data?.plugs || {},
      profile.characterInventories?.data || {},
      profile.characterEquipment?.data || {},
      profile.itemComponents?.instances?.data || {},
    ];
    
    // Character inventories and equipment
    Object.values(profile.characterInventories?.data || {}).forEach(charInventory => {
      charInventory.items?.forEach(item => allItems.add(item.itemHash));
    });
    
    Object.values(profile.characterEquipment?.data || {}).forEach(charEquipment => {
      charEquipment.items?.forEach(item => allItems.add(item.itemHash));
    });
    
    // Profile inventory (vault, etc.)
    profile.profileInventory?.data?.items?.forEach(item => {
      allItems.add(item.itemHash);
    });
    
    // Unlocked mods, aspects, fragments
    Object.values(profile.profilePlugSets?.data?.plugs || {}).forEach(plugSet => {
      Object.keys(plugSet).forEach(plugHash => {
        allItems.add(parseInt(plugHash));
      });
    });
    
    return Array.from(allItems);
  } catch (error) {
    console.error('Error collecting all user items:', error);
    throw error;
  }
};
