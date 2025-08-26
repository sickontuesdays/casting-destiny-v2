export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get manifest data from Bungie API only
    const manifestResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/bungie/manifest`);
    if (!manifestResponse.ok) {
      throw new Error('Failed to get manifest data from Bungie API');
    }
    const manifestData = await manifestResponse.json();

    // Extract query parameters for filtering
    const { 
      search = '', 
      itemType = '', 
      classType = '', 
      slot = '', 
      tierType = '', 
      damageType = '',
      limit = '50' 
    } = req.query;

    // Helper function to get proper Bungie icon - never use local files
    const getItemIcon = (item) => {
      if (item.displayProperties?.icon) {
        return `https://www.bungie.net${item.displayProperties.icon}`;
      }
      // Use empty socket icon from manifest as fallback - never local files
      return `https://www.bungie.net/common/destiny2_content/icons/baf3919b265395ba482761e6fadb4b3d.png`;
    };

    // Helper function to get damage type name including Prismatic
    const getDamageTypeName = (damageTypeHash) => {
      const damageTypes = {
        1: 'Kinetic',
        2: 'Arc', 
        3: 'Solar',
        4: 'Void',
        6: 'Stasis',
        7: 'Strand',
        8: 'Prismatic' // Include Prismatic as found in manifest data
      };
      return damageTypes[damageTypeHash] || 'Kinetic';
    };

    // Helper function to get damage type icon from Bungie
    const getDamageTypeIcon = (damageTypeHash) => {
      const damageTypeIcons = {
        1: 'https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_3373582085.png', // Kinetic
        2: 'https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_2303181850.png', // Arc
        3: 'https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_3454344768.png', // Solar
        4: 'https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_3373582085.png', // Void
        6: 'https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_151347233.png', // Stasis
        7: 'https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_453755108.png', // Strand
        8: 'https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_1847025511.png'  // Prismatic
      };
      return damageTypeIcons[damageTypeHash] || damageTypeIcons[1]; // Default to Kinetic
    };

    // Helper function to get weapon type name
    const getWeaponTypeName = (itemSubType) => {
      const weaponTypes = {
        0: 'Unknown',
        1: 'Auto Rifle',
        2: 'Shotgun', 
        3: 'Machine Gun',
        4: 'Hand Cannon',
        5: 'Rocket Launcher',
        6: 'Fusion Rifle',
        7: 'Sniper Rifle',
        8: 'Pulse Rifle',
        9: 'Scout Rifle',
        10: 'Sidearm',
        11: 'Sword',
        12: 'Linear Fusion Rifle',
        13: 'Grenade Launcher',
        14: 'Submachine Gun',
        15: 'Trace Rifle',
        16: 'Bow',
        17: 'Glaive'
      };
      return weaponTypes[itemSubType] || 'Unknown';
    };

    // Helper function to get armor type name
    const getArmorTypeName = (itemSubType) => {
      const armorTypes = {
        0: 'Unknown',
        1: 'Helmet',
        2: 'Arms', 
        3: 'Chest',
        4: 'Legs',
        5: 'Class Item'
      };
      return armorTypes[itemSubType] || 'Unknown';
    };

    // Helper function to get weapon slot
    const getWeaponSlot = (bucketTypeHash) => {
      if (bucketTypeHash === 1498876634) return 'kinetic';
      if (bucketTypeHash === 2465295065) return 'energy';
      if (bucketTypeHash === 953998645) return 'power';
      return 'unknown';
    };

    // Helper function to get armor slot
    const getArmorSlot = (bucketTypeHash) => {
      if (bucketTypeHash === 3448274439) return 'helmet';
      if (bucketTypeHash === 3551918588) return 'arms';
      if (bucketTypeHash === 14239492) return 'chest';
      if (bucketTypeHash === 20886954) return 'legs';
      if (bucketTypeHash === 1585787867) return 'class';
      return 'unknown';
    };

    // Filter items from manifest based on search criteria
    const filteredItems = [];
    const searchTerm = search.toLowerCase();
    const maxResults = parseInt(limit) || 50;

    // Search through DestinyInventoryItemDefinition from Bungie manifest
    const inventoryItems = manifestData.DestinyInventoryItemDefinition || {};
    
    for (const [itemHash, item] of Object.entries(inventoryItems)) {
      // Skip items without display properties
      if (!item.displayProperties?.name) continue;
      
      // Skip if item name doesn't match search
      if (searchTerm && !item.displayProperties.name.toLowerCase().includes(searchTerm)) continue;
      
      // Skip non-transferable items unless they're armor/weapons
      if (item.nonTransferrable && item.itemType !== 2 && item.itemType !== 3) continue;
      
      // Filter by item type (2 = Armor, 3 = Weapon)
      if (itemType) {
        const requestedType = parseInt(itemType);
        if (item.itemType !== requestedType) continue;
      }
      
      // Filter by class type (0 = Any, 1 = Warlock, 2 = Hunter, 3 = Titan)
      if (classType) {
        const requestedClass = parseInt(classType);
        if (requestedClass !== 0 && item.classType !== requestedClass && item.classType !== 0) continue;
      }
      
      // Filter by tier type (3 = Rare, 4 = Legendary, 6 = Exotic)
      if (tierType) {
        const requestedTier = parseInt(tierType);
        if (item.inventory?.tierType !== requestedTier) continue;
      }
      
      // Filter by damage type for weapons
      if (damageType && item.itemType === 3) {
        const requestedDamage = parseInt(damageType);
        if (item.defaultDamageType !== requestedDamage) continue;
      }
      
      // Filter by slot
      if (slot) {
        const bucketHash = item.inventory?.bucketTypeHash;
        let itemSlot = 'unknown';
        
        if (item.itemType === 3) { // Weapon
          itemSlot = getWeaponSlot(bucketHash);
        } else if (item.itemType === 2) { // Armor
          itemSlot = getArmorSlot(bucketHash);
        }
        
        if (itemSlot !== slot) continue;
      }

      // Format item data using only Bungie resources
      const formattedItem = {
        itemHash: parseInt(itemHash),
        name: item.displayProperties.name,
        description: item.displayProperties.description || '',
        icon: getItemIcon(item), // Always Bungie icon, never local
        itemType: item.itemType,
        itemSubType: item.itemSubType,
        classType: item.classType,
        tierType: item.inventory?.tierType || 0,
        bucketTypeHash: item.inventory?.bucketTypeHash
      };

      // Add weapon-specific data
      if (item.itemType === 3) { // Weapon
        const damageTypeName = getDamageTypeName(item.defaultDamageType);
        formattedItem.weaponType = getWeaponTypeName(item.itemSubType);
        formattedItem.damageType = item.defaultDamageType;
        formattedItem.damageTypeName = damageTypeName;
        formattedItem.damageTypeIcon = getDamageTypeIcon(item.defaultDamageType);
        formattedItem.slot = getWeaponSlot(item.inventory?.bucketTypeHash);
        formattedItem.ammoType = item.equippingBlock?.ammoType;
        
        // Get weapon stats from manifest
        if (item.stats?.stats) {
          formattedItem.stats = Object.entries(item.stats.stats).map(([statHash, stat]) => ({
            hash: parseInt(statHash),
            name: manifestData.DestinyStatDefinition?.[statHash]?.displayProperties?.name || 'Unknown Stat',
            value: stat.value
          }));
        }
      }

      // Add armor-specific data
      if (item.itemType === 2) { // Armor
        formattedItem.armorType = getArmorTypeName(item.itemSubType);
        formattedItem.slot = getArmorSlot(item.inventory?.bucketTypeHash);
        
        // Get armor stats from manifest
        if (item.stats?.stats) {
          formattedItem.stats = Object.entries(item.stats.stats).map(([statHash, stat]) => ({
            hash: parseInt(statHash),
            name: manifestData.DestinyStatDefinition?.[statHash]?.displayProperties?.name || 'Unknown Stat',
            value: stat.value
          }));
        }
      }

      filteredItems.push(formattedItem);
      
      // Limit results to prevent huge responses
      if (filteredItems.length >= maxResults) break;
    }

    // Sort items by tier (Exotic first) then by name
    filteredItems.sort((a, b) => {
      const tierDiff = (b.tierType || 0) - (a.tierType || 0);
      if (tierDiff !== 0) return tierDiff;
      return a.name.localeCompare(b.name);
    });

    // Group items by category for easier consumption
    const weapons = filteredItems.filter(item => item.itemType === 3);
    const armor = filteredItems.filter(item => item.itemType === 2);
    const other = filteredItems.filter(item => item.itemType !== 2 && item.itemType !== 3);

    const response = {
      success: true,
      data: {
        items: filteredItems,
        weapons,
        armor,
        other,
        total: filteredItems.length,
        searchTerm: search,
        filters: {
          itemType: itemType || 'all',
          classType: classType || 'all',
          slot: slot || 'all',
          tierType: tierType || 'all',
          damageType: damageType || 'all'
        }
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching available items:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      data: { items: [], weapons: [], armor: [], other: [], total: 0 }
    });
  }
}