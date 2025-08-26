export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get access token
    const tokenResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/bungie/token`, {
      headers: {
        'X-API-Key': process.env.BUNGIE_API_KEY
      }
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get access token');
    }

    const { access_token } = await tokenResponse.json();

    // Get membership data first
    const membershipResponse = await fetch(`https://www.bungie.net/Platform/User/GetMembershipsForCurrentUser/`, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'X-API-Key': process.env.BUNGIE_API_KEY
      }
    });

    if (!membershipResponse.ok) {
      throw new Error('Failed to get membership data');
    }

    const membershipData = await membershipResponse.json();
    const destinyMembership = membershipData.Response.destinyMemberships[0];

    if (!destinyMembership) {
      throw new Error('No Destiny membership found');
    }

    // Get character profiles
    const profileResponse = await fetch(
      `https://www.bungie.net/Platform/Destiny2/${destinyMembership.membershipType}/Profile/${destinyMembership.membershipId}/?components=100,102,103,201,205,300,302,304,305,306,307,308,309,310`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'X-API-Key': process.env.BUNGIE_API_KEY
        }
      }
    );

    if (!profileResponse.ok) {
      throw new Error('Failed to get profile data');
    }

    const profileData = await profileResponse.json();

    // Get manifest data
    const manifestResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/bungie/manifest`);
    if (!manifestResponse.ok) {
      throw new Error('Failed to get manifest data');
    }
    const manifestData = await manifestResponse.json();

    // Extract exotic items from all characters and vault
    const exoticItems = [];

    // Process character inventories
    if (profileData.Response.characterInventories?.data) {
      Object.entries(profileData.Response.characterInventories.data).forEach(([characterId, inventory]) => {
        if (inventory.items) {
          inventory.items.forEach(item => {
            const itemDefinition = manifestData.DestinyInventoryItemDefinition[item.itemHash];
            if (itemDefinition && itemDefinition.inventory?.tierType === 6) {
              exoticItems.push({
                ...item,
                location: 'character',
                characterId,
                definition: itemDefinition
              });
            }
          });
        }
      });
    }

    // Process character equipment
    if (profileData.Response.characterEquipment?.data) {
      Object.entries(profileData.Response.characterEquipment.data).forEach(([characterId, equipment]) => {
        if (equipment.items) {
          equipment.items.forEach(item => {
            const itemDefinition = manifestData.DestinyInventoryItemDefinition[item.itemHash];
            if (itemDefinition && itemDefinition.inventory?.tierType === 6) {
              exoticItems.push({
                ...item,
                location: 'equipped',
                characterId,
                definition: itemDefinition
              });
            }
          });
        }
      });
    }

    // Process vault
    if (profileData.Response.profileInventory?.data?.items) {
      profileData.Response.profileInventory.data.items.forEach(item => {
        const itemDefinition = manifestData.DestinyInventoryItemDefinition[item.itemHash];
        if (itemDefinition && itemDefinition.inventory?.tierType === 6) {
          exoticItems.push({
            ...item,
            location: 'vault',
            definition: itemDefinition
          });
        }
      });
    }

    // Helper function to get proper Bungie icon
    const getItemIcon = (item) => {
      if (item.definition?.displayProperties?.icon) {
        return `https://www.bungie.net${item.definition.displayProperties.icon}`;
      }
      return `https://www.bungie.net/common/destiny2_content/icons/baf3919b265395ba482761e6fadb4b3d.png`; // Default empty socket icon from manifest
    };

    // Helper function to get element icon by name
    const getElementIcon = (elementName) => {
      const elementIcons = {
        'Solar': `https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_3454344768.png`,
        'Arc': `https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_2303181850.png`, 
        'Void': `https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_3373582085.png`,
        'Stasis': `https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_151347233.png`,
        'Strand': `https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_453755108.png`,
        'Prismatic': `https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_1847025511.png`,
        'Kinetic': `https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_3373582085.png`
      };
      return elementIcons[elementName] || elementIcons['Kinetic'];
    };

    // Helper function to get damage type name
    const getDamageTypeName = (damageTypeHash) => {
      const damageTypes = {
        1: 'Kinetic',
        2: 'Arc', 
        3: 'Solar',
        4: 'Void',
        6: 'Stasis',
        7: 'Strand',
        8: 'Prismatic'
      };
      return damageTypes[damageTypeHash] || 'Kinetic';
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

    // Format exotic items for response
    const formattedExotics = exoticItems.map(item => {
      const definition = item.definition;
      const isWeapon = definition.itemType === 3; // DestinyItemType.Weapon
      const isArmor = definition.itemType === 2;   // DestinyItemType.Armor

      let formattedItem = {
        itemHash: item.itemHash,
        itemInstanceId: item.itemInstanceId,
        quantity: item.quantity || 1,
        location: item.location,
        characterId: item.characterId,
        name: definition.displayProperties?.name || 'Unknown Exotic',
        description: definition.displayProperties?.description || '',
        icon: getItemIcon(item),
        tierType: definition.inventory?.tierType || 6,
        itemType: definition.itemType,
        itemSubType: definition.itemSubType,
        classType: definition.classType,
        bucketTypeHash: definition.inventory?.bucketTypeHash
      };

      if (isWeapon) {
        const damageTypeName = getDamageTypeName(definition.defaultDamageType);
        formattedItem = {
          ...formattedItem,
          type: 'weapon',
          weaponType: getWeaponTypeName(definition.itemSubType),
          damageType: definition.defaultDamageType,
          damageTypeName: damageTypeName,
          damageTypeIcon: getElementIcon(damageTypeName),
          ammoType: definition.equippingBlock?.ammoType,
          intrinsicHash: definition.sockets?.socketEntries?.[0]?.singleInitialItemHash,
          // Get weapon stats
          stats: definition.stats?.stats ? Object.entries(definition.stats.stats).map(([statHash, stat]) => ({
            hash: parseInt(statHash),
            name: manifestData.DestinyStatDefinition?.[statHash]?.displayProperties?.name || 'Unknown Stat',
            value: stat.value
          })) : []
        };

        // Add weapon slot information
        const bucketHash = definition.inventory?.bucketTypeHash;
        if (bucketHash === 1498876634) {
          formattedItem.slot = 'kinetic';
          formattedItem.slotName = 'Kinetic';
        } else if (bucketHash === 2465295065) {
          formattedItem.slot = 'energy'; 
          formattedItem.slotName = 'Energy';
        } else if (bucketHash === 953998645) {
          formattedItem.slot = 'power';
          formattedItem.slotName = 'Power';
        }

      } else if (isArmor) {
        formattedItem = {
          ...formattedItem,
          type: 'armor',
          armorType: getArmorTypeName(definition.itemSubType),
          // Get armor stats  
          stats: definition.stats?.stats ? Object.entries(definition.stats.stats).map(([statHash, stat]) => ({
            hash: parseInt(statHash),
            name: manifestData.DestinyStatDefinition?.[statHash]?.displayProperties?.name || 'Unknown Stat',
            value: stat.value
          })) : []
        };

        // Add armor slot information
        const bucketHash = definition.inventory?.bucketTypeHash;
        if (bucketHash === 3448274439) {
          formattedItem.slot = 'helmet';
          formattedItem.slotName = 'Helmet';
        } else if (bucketHash === 3551918588) {
          formattedItem.slot = 'arms';
          formattedItem.slotName = 'Arms';
        } else if (bucketHash === 14239492) {
          formattedItem.slot = 'chest';
          formattedItem.slotName = 'Chest';
        } else if (bucketHash === 20886954) {
          formattedItem.slot = 'legs';
          formattedItem.slotName = 'Legs';
        } else if (bucketHash === 1585787867) {
          formattedItem.slot = 'class';
          formattedItem.slotName = 'Class Item';
        }
      }

      return formattedItem;
    });

    // Group exotics by type
    const weapons = formattedExotics.filter(item => item.type === 'weapon');
    const armor = formattedExotics.filter(item => item.type === 'armor');

    // Sort weapons by slot and name
    weapons.sort((a, b) => {
      const slotOrder = { 'kinetic': 1, 'energy': 2, 'power': 3 };
      const slotDiff = (slotOrder[a.slot] || 999) - (slotOrder[b.slot] || 999);
      if (slotDiff !== 0) return slotDiff;
      return a.name.localeCompare(b.name);
    });

    // Sort armor by slot and name  
    armor.sort((a, b) => {
      const slotOrder = { 'helmet': 1, 'arms': 2, 'chest': 3, 'legs': 4, 'class': 5 };
      const slotDiff = (slotOrder[a.slot] || 999) - (slotOrder[b.slot] || 999);
      if (slotDiff !== 0) return slotDiff;
      return a.name.localeCompare(b.name);
    });

    const response = {
      success: true,
      data: {
        weapons,
        armor,
        total: formattedExotics.length,
        counts: {
          weapons: weapons.length,
          armor: armor.length
        }
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching exotic items:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      data: { weapons: [], armor: [], total: 0, counts: { weapons: 0, armor: 0 } }
    });
  }
}