const BUNGIE_BASE_URL = 'https://www.bungie.net/Platform'

class BungieAPI {
  constructor() {
    this.apiKey = process.env.BUNGIE_API_KEY
  }

  async makeRequest(endpoint, accessToken = null) {
    const headers = {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json'
    }

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }

    const response = await fetch(`${BUNGIE_BASE_URL}${endpoint}`, { headers })
    const data = await response.json()

    if (data.ErrorCode !== 1) {
      throw new Error(`Bungie API Error: ${data.Message}`)
    }

    return data.Response
  }

  async getManifest() {
    return this.makeRequest('/Destiny2/Manifest/')
  }

  async getManifestComponent(componentUrl) {
    const response = await fetch(`https://www.bungie.net${componentUrl}`)
    return response.json()
  }

  async getUserProfile(accessToken, membershipType, membershipId) {
    return this.makeRequest(
      `/Destiny2/${membershipType}/Profile/${membershipId}/?components=100,102,103,201,205,300,302,304,305`,
      accessToken
    )
  }

  async getCharacterInventory(accessToken, membershipType, membershipId, characterId) {
    return this.makeRequest(
      `/Destiny2/${membershipType}/Profile/${membershipId}/Character/${characterId}/?components=201,205,300,302`,
      accessToken
    )
  }

  async getVaultInventory(accessToken, membershipType, membershipId) {
    return this.makeRequest(
      `/Destiny2/${membershipType}/Profile/${membershipId}/?components=102`,
      accessToken
    )
  }

  async getFriends(accessToken, membershipId) {
    return this.makeRequest(
      `/Social/Friends/`,
      accessToken
    )
  }

  async getClanInfo(accessToken, membershipType, membershipId) {
    return this.makeRequest(
      `/GroupV2/User/${membershipType}/${membershipId}/0/1/`,
      accessToken
    )
  }

  async getClanMembers(accessToken, clanId) {
    return this.makeRequest(
      `/GroupV2/${clanId}/Members/`,
      accessToken
    )
  }

  async equipItem(accessToken, membershipType, itemInstanceId, characterId) {
    return this.makeRequest(
      `/Destiny2/Actions/Items/EquipItem/`,
      accessToken,
      'POST',
      {
        itemId: itemInstanceId,
        characterId: characterId,
        membershipType: membershipType
      }
    )
  }
}

// Utility functions for the components
export async function getUserInventory(accessToken, membershipType, membershipId) {
  const api = new BungieAPI()
  
  try {
    const profile = await api.getUserProfile(accessToken, membershipType, membershipId)
    
    const inventory = {
      characters: [],
      vault: { items: [] }
    }

    // Process characters
    if (profile.characters && profile.characters.data) {
      for (const [characterId, character] of Object.entries(profile.characters.data)) {
        const characterData = {
          id: characterId,
          class: getClassName(character.classType),
          light: character.light,
          items: []
        }

        // Get character inventory
        if (profile.characterInventories && profile.characterInventories.data[characterId]) {
          const items = profile.characterInventories.data[characterId].items
          characterData.items = await processInventoryItems(items)
        }

        // Get equipped items
        if (profile.characterEquipment && profile.characterEquipment.data[characterId]) {
          const equippedItems = profile.characterEquipment.data[characterId].items
          const processedEquipped = await processInventoryItems(equippedItems)
          characterData.items.push(...processedEquipped)
        }

        inventory.characters.push(characterData)
      }
    }

    // Process vault
    if (profile.profileInventory && profile.profileInventory.data) {
      const vaultItems = profile.profileInventory.data.items
      inventory.vault.items = await processInventoryItems(vaultItems)
    }

    return inventory
  } catch (error) {
    console.error('Error fetching user inventory:', error)
    throw error
  }
}

export async function getBungieFriends(accessToken, membershipId) {
  const api = new BungieAPI()
  
  try {
    const friends = await api.getFriends(accessToken, membershipId)
    
    return friends.map(friend => ({
      membershipId: friend.bungieNetUser.membershipId,
      displayName: friend.bungieNetUser.displayName,
      profilePicture: friend.bungieNetUser.profilePicture,
      isOnline: friend.onlineStatus === 1,
      lastSeen: friend.dateLastSeen,
      hasUsedApp: false // This would need to be checked against user database
    }))
  } catch (error) {
    console.error('Error fetching Bungie friends:', error)
    return []
  }
}

export async function getClanMembers(accessToken, destinyMemberships) {
  const api = new BungieAPI()
  
  try {
    if (!destinyMemberships || destinyMemberships.length === 0) {
      return []
    }

    const membership = destinyMemberships[0]
    const clanInfo = await api.getClanInfo(accessToken, membership.membershipType, membership.membershipId)
    
    if (!clanInfo.results || clanInfo.results.length === 0) {
      return []
    }

    const clan = clanInfo.results[0].group
    const members = await api.getClanMembers(accessToken, clan.groupId)
    
    return members.results.map(member => ({
      membershipId: member.bungieNetUserInfo.membershipId,
      displayName: member.bungieNetUserInfo.displayName,
      profilePicture: member.bungieNetUserInfo.profilePicture,
      isOnline: member.isOnline,
      lastSeen: member.dateLastSeen,
      clanRank: member.memberType,
      hasUsedApp: false // This would need to be checked against user database
    }))
  } catch (error) {
    console.error('Error fetching clan members:', error)
    return []
  }
}

// Helper functions
function getClassName(classType) {
  switch (classType) {
    case 0: return 'Titan'
    case 1: return 'Hunter'
    case 2: return 'Warlock'
    default: return 'Unknown'
  }
}

async function processInventoryItems(items) {
  // This would normally resolve item definitions from the manifest
  // For now, returning simplified structure
  return items.map(item => ({
    hash: item.itemHash,
    instanceId: item.itemInstanceId,
    quantity: item.quantity,
    bindStatus: item.bindStatus,
    location: item.location,
    bucketHash: item.bucketHash,
    transferStatus: item.transferStatus,
    lockable: item.lockable,
    state: item.state,
    // These would be resolved from manifest
    displayProperties: {
      name: 'Loading...',
      description: '',
      icon: '/common/destiny2_content/icons/default.jpg'
    },
    itemType: 'unknown',
    itemTypeDisplayName: 'Unknown',
    tierType: 0,
    powerLevel: item.overrideStyleItemHash || 0
  }))
}

export default BungieAPI