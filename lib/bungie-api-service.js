class BungieAPIService {
  constructor() {
    this.apiKey = process.env.BUNGIE_API_KEY
    this.baseURL = 'https://www.bungie.net/Platform'
  }

  // Make authenticated API request
  async makeRequest(endpoint, accessToken = null, method = 'GET', body = null) {
    const headers = {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json'
    }

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }

    const options = {
      method,
      headers
    }

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, options)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(`Bungie API Error: ${data.Message || response.statusText}`)
      }

      if (data.ErrorCode !== 1) {
        throw new Error(`Bungie Error ${data.ErrorCode}: ${data.Message}`)
      }

      return data.Response
    } catch (error) {
      console.error('Bungie API Request Failed:', error)
      throw error
    }
  }

  // Get user's Destiny memberships
  async getDestinyMemberships(accessToken) {
    const userInfo = await this.makeRequest('/User/GetMembershipsForCurrentUser/', accessToken)
    
    // Get primary membership or first Destiny membership
    const destinyMemberships = userInfo.destinyMemberships || []
    const primaryMembershipId = userInfo.primaryMembershipId
    
    let selectedMembership = destinyMemberships.find(m => m.membershipId === primaryMembershipId)
    if (!selectedMembership && destinyMemberships.length > 0) {
      selectedMembership = destinyMemberships[0]
    }

    return {
      userInfo,
      destinyMemberships,
      primaryMembership: selectedMembership
    }
  }

  // Get complete character and vault inventory
  async getCompleteInventory(membershipType, destinyMembershipId, accessToken) {
    // Components: 
    // 102 = Profile Inventory (Vault)
    // 103 = Profile Currencies
    // 200 = Characters
    // 201 = Character Inventory
    // 205 = Character Equipment
    // 300 = Item Instances
    // 302 = Item Stats
    // 304 = Item Sockets
    // 305 = Item Talent Grids
    // 310 = Item Plug States
    const components = '102,103,200,201,205,300,302,304,305,310'
    
    const profile = await this.makeRequest(
      `/Destiny2/${membershipType}/Profile/${destinyMembershipId}/?components=${components}`,
      accessToken
    )

    // Process character data
    const characters = []
    if (profile.characters && profile.characters.data) {
      for (const [characterId, characterData] of Object.entries(profile.characters.data)) {
        const character = {
          characterId,
          ...characterData,
          className: this.getClassName(characterData.classType),
          raceName: this.getRaceName(characterData.raceType),
          genderName: this.getGenderName(characterData.genderType),
          equipment: [],
          inventory: []
        }

        // Add equipped items
        if (profile.characterEquipment && profile.characterEquipment.data[characterId]) {
          character.equipment = profile.characterEquipment.data[characterId].items
        }

        // Add character inventory
        if (profile.characterInventories && profile.characterInventories.data[characterId]) {
          character.inventory = profile.characterInventories.data[characterId].items
        }

        characters.push(character)
      }
    }

    // Process vault items
    const vault = {
      items: profile.profileInventory?.data?.items || [],
      currencies: profile.profileCurrencies?.data?.items || []
    }

    // Process item instances for additional details
    const itemInstances = profile.itemComponents?.instances?.data || {}
    const itemStats = profile.itemComponents?.stats?.data || {}
    const itemSockets = profile.itemComponents?.sockets?.data || {}
    const itemPlugStates = profile.itemComponents?.plugStates?.data || {}

    return {
      characters,
      vault,
      itemComponents: {
        instances: itemInstances,
        stats: itemStats,
        sockets: itemSockets,
        plugStates: itemPlugStates
      },
      profile: {
        membershipType,
        membershipId: destinyMembershipId
      }
    }
  }

  // Transfer item between characters or vault
  async transferItem(itemData, accessToken) {
    const { itemReferenceHash, stackSize = 1, transferToVault, itemId, characterId, membershipType } = itemData
    
    const endpoint = '/Destiny2/Actions/Items/TransferItem/'
    const body = {
      itemReferenceHash,
      stackSize,
      transferToVault,
      itemId,
      characterId,
      membershipType
    }

    return await this.makeRequest(endpoint, accessToken, 'POST', body)
  }

  // Equip item on character
  async equipItem(itemData, accessToken) {
    const { itemId, characterId, membershipType } = itemData
    
    const endpoint = '/Destiny2/Actions/Items/EquipItem/'
    const body = {
      itemId,
      characterId,
      membershipType
    }

    return await this.makeRequest(endpoint, accessToken, 'POST', body)
  }

  // Equip multiple items at once
  async equipItems(itemIds, characterId, membershipType, accessToken) {
    const endpoint = '/Destiny2/Actions/Items/EquipItems/'
    const body = {
      itemIds,
      characterId,
      membershipType
    }

    return await this.makeRequest(endpoint, accessToken, 'POST', body)
  }

  // Get friends list from Bungie
  async getBungieFriends(accessToken) {
    try {
      const friends = await this.makeRequest('/Social/Friends/', accessToken)
      
      return friends.friends?.map(friend => ({
        membershipId: friend.bungieNetUser?.membershipId,
        displayName: friend.bungieNetUser?.uniqueName || friend.bungieNetUser?.displayName,
        displayNameCode: friend.bungieNetUser?.displayNameCode,
        profilePicturePath: friend.bungieNetUser?.profilePicturePath,
        isOnline: friend.onlineStatus === 1,
        lastOnlineStatusChange: friend.lastOnlineStatusChange,
        relationship: friend.relationship
      })) || []
    } catch (error) {
      console.error('Error fetching Bungie friends:', error)
      return []
    }
  }

  // Get clan members
  async getClanMembers(membershipType, destinyMembershipId, accessToken) {
    try {
      // First get the user's clan
      const groupsForMember = await this.makeRequest(
        `/GroupV2/User/${membershipType}/${destinyMembershipId}/0/1/`,
        accessToken
      )

      if (!groupsForMember?.results?.[0]?.group) {
        return []
      }

      const groupId = groupsForMember.results[0].group.groupId
      
      // Get clan members
      const clanMembers = await this.makeRequest(
        `/GroupV2/${groupId}/Members/`,
        accessToken
      )

      return clanMembers.results?.map(member => ({
        membershipId: member.bungieNetUserInfo?.membershipId,
        destinyMembershipId: member.destinyUserInfo?.membershipId,
        displayName: member.destinyUserInfo?.displayName || member.bungieNetUserInfo?.displayName,
        membershipType: member.destinyUserInfo?.membershipType,
        isOnline: member.isOnline,
        lastOnlineStatusChange: member.lastOnlineStatusChange,
        joinDate: member.joinDate
      })) || []
    } catch (error) {
      console.error('Error fetching clan members:', error)
      return []
    }
  }

  // Helper methods
  getClassName(classType) {
    const classes = ['Titan', 'Hunter', 'Warlock']
    return classes[classType] || 'Unknown'
  }

  getRaceName(raceType) {
    const races = ['Human', 'Awoken', 'Exo']
    return races[raceType] || 'Unknown'
  }

  getGenderName(genderType) {
    const genders = ['Male', 'Female']
    return genders[genderType] || 'Unknown'
  }

  getItemTypeName(itemType) {
    const types = {
      0: 'None',
      1: 'Currency',
      2: 'Armor',
      3: 'Weapon',
      7: 'Message',
      8: 'Engram',
      9: 'Consumable',
      10: 'ExchangeMaterial',
      11: 'MissionReward',
      12: 'QuestStep',
      13: 'QuestStepComplete',
      14: 'Emblem',
      15: 'Quest',
      16: 'Subclass',
      17: 'ClanBanner',
      18: 'Aura',
      19: 'Mod',
      20: 'Dummy',
      21: 'Ship',
      22: 'Vehicle',
      23: 'Emote',
      24: 'Ghost',
      25: 'Package',
      26: 'Bounty',
      27: 'Wrapper',
      28: 'SeasonalArtifact',
      29: 'Finisher'
    }
    return types[itemType] || 'Unknown'
  }
}

export default BungieAPIService