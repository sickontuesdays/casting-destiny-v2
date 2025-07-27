import { getManifestComponent } from '../../../lib/bungie-api';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const inventoryItems = await getManifestComponent('DestinyInventoryItemDefinition');
    
    // Sample 50 random items to understand the data structure
    const allItems = Object.values(inventoryItems);
    const sampleSize = 50;
    const sampleItems = [];
    
    for (let i = 0; i < sampleSize; i++) {
      const randomIndex = Math.floor(Math.random() * allItems.length);
      const item = allItems[randomIndex];
      
      if (item?.displayProperties?.name) {
        sampleItems.push({
          name: item.displayProperties.name,
          hash: item.hash,
          categories: item.itemCategoryHashes || [],
          tierType: item.inventory?.tierType,
          classType: item.classType,
          damageType: item.damageType,
          damageTypeHashes: item.damageTypeHashes,
          bucketHash: item.inventory?.bucketTypeHash,
          itemTypeDisplayName: item.itemTypeDisplayName,
          description: item.displayProperties.description?.substring(0, 100) + '...'
        });
      }
    }
    
    // Look for specific item types
    const exoticArmor = allItems.filter(item => 
      item?.inventory?.tierType === 6 && // Exotic
      item?.itemCategoryHashes?.includes(20) // Armor
    ).slice(0, 10).map(item => ({
      name: item.displayProperties?.name,
      classType: item.classType,
      categories: item.itemCategoryHashes
    }));
    
    const aspects = allItems.filter(item => {
      const name = item?.displayProperties?.name?.toLowerCase() || '';
      return name.includes('aspect') || 
             item?.itemCategoryHashes?.includes(3124752623) ||
             item?.itemCategoryHashes?.includes(1469714392);
    }).slice(0, 10).map(item => ({
      name: item.displayProperties?.name,
      categories: item.itemCategoryHashes,
      classType: item.classType,
      damageType: item.damageType
    }));
    
    const fragments = allItems.filter(item => {
      const name = item?.displayProperties?.name?.toLowerCase() || '';
      return name.includes('fragment') || 
             name.includes('echo of') ||
             name.includes('whisper of') ||
             name.includes('facet of') ||
             item?.itemCategoryHashes?.includes(3683254069);
    }).slice(0, 10).map(item => ({
      name: item.displayProperties?.name,
      categories: item.itemCategoryHashes,
      classType: item.classType,
      damageType: item.damageType
    }));
    
    // Category hash analysis
    const categoryFrequency = {};
    allItems.forEach(item => {
      if (item?.itemCategoryHashes) {
        item.itemCategoryHashes.forEach(hash => {
          categoryFrequency[hash] = (categoryFrequency[hash] || 0) + 1;
        });
      }
    });
    
    const topCategories = Object.entries(categoryFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([hash, count]) => ({ hash: parseInt(hash), count }));

    return res.status(200).json({
      success: true,
      data: {
        totalItems: allItems.length,
        sampleItems,
        exoticArmor,
        aspects,
        fragments,
        topCategories,
        bucketHashes: {
          kinetic: 1498876634,
          energy: 2465295065,
          power: 953998645,
          helmet: 3448274439,
          gauntlets: 3551918588,
          chest: 14239492,
          legs: 20886954,
          classItem: 1585787867
        }
      }
    });
    
  } catch (error) {
    console.error('Debug API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}