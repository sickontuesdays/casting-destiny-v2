// lib/intelligent-manifest-processor.js
// Advanced manifest processing with intelligent categorization and analysis

export class IntelligentManifestProcessor {
  constructor() {
    this.isInitialized = false
    this.manifest = null
    this.version = '2.0.0'
    
    // Item type mappings for efficient categorization
    this.itemTypes = {
      WEAPON: 3,
      ARMOR: 2,
      SUBCLASS: 16,
      MOD: 19,
      GHOST: 24,
      EMBLEM: 14,
      SHADER: 41,
      ORNAMENT: 42
    }
    
    // Bucket type mappings for slot identification
    this.bucketTypes = {
      // Weapons
      KINETIC: 1498876634,
      ENERGY: 2465295065,
      POWER: 953998645,
      
      // Armor
      HELMET: 3448274439,
      ARMS: 3551918588,
      CHEST: 14239492,
      LEGS: 20886954,
      CLASS_ITEM: 1585787867
    }
    
    // Cache for processed data
    this.processedCache = new Map()
    this.lastProcessedHash = null
  }

  async initialize(manifestData) {
    try {
      console.log('🔄 Initializing Intelligent Manifest Processor...')
      
      if (!manifestData) {
        throw new Error('Manifest data is required')
      }

      this.manifest = manifestData
      this.isInitialized = true
      
      console.log('✅ Intelligent Manifest Processor initialized successfully')
      return true
      
    } catch (error) {
      console.error('❌ Failed to initialize Intelligent Manifest Processor:', error)
      this.isInitialized = false
      throw error
    }
  }

  /**
   * Process manifest into intelligently categorized data
   */
  async processManifest(manifestData, userSession = null) {
    const startTime = Date.now()
    
    try {
      console.log('🔄 Processing manifest with intelligent categorization...')
      
      // Check cache first
      const manifestHash = this.generateManifestHash(manifestData)
      if (this.processedCache.has(manifestHash)) {
        console.log('✅ Returning cached processed manifest')
        return this.processedCache.get(manifestHash)
      }

      const processed = {
        weapons: new Map(),
        armor: new Map(),
        mods: new Map(),
        subclasses: new Map(),
        exotics: new Map(),
        stats: {
          totalItems: 0,
          weapons: 0,
          armor: 0,
          mods: 0,
          subclasses: 0,
          exotics: 0
        },
        metadata: {
          processedAt: new Date().toISOString(),
          processingTime: 0,
          manifestVersion: manifestData.version || 'unknown',
          source: 'intelligent-processor'
        },
        categories: {
          byElement: new Map(),
          byClass: new Map(),
          byActivity: new Map(),
          byRarity: new Map()
        }
      }

      // Process item definitions
      if (manifestData.data?.DestinyInventoryItemDefinition) {
        await this.processItems(manifestData.data.DestinyInventoryItemDefinition, processed)
      }

      // Process stat definitions
      if (manifestData.data?.DestinyStatDefinition) {
        this.processStatDefinitions(manifestData.data.DestinyStatDefinition, processed)
      }

      // Calculate processing time
      processed.metadata.processingTime = Date.now() - startTime

      // Cache the result
      this.processedCache.set(manifestHash, processed)
      this.lastProcessedHash = manifestHash

      console.log(`✅ Manifest processed in ${processed.metadata.processingTime}ms`)
      console.log(`📊 Processed ${processed.stats.totalItems} items total`)
      
      return processed

    } catch (error) {
      console.error('❌ Error processing manifest:', error)
      throw error
    }
  }

  async processItems(itemDefinitions, processed) {
    let processedCount = 0

    for (const [itemHash, item] of Object.entries(itemDefinitions)) {
      if (!item || !item.displayProperties?.name) continue

      try {
        const processedItem = await this.processItem(item, itemHash)
        
        if (processedItem) {
          this.categorizeItem(processedItem, processed)
          processedCount++
        }
        
      } catch (error) {
        console.warn(`Failed to process item ${itemHash}:`, error.message)
      }
    }

    console.log(`✅ Processed ${processedCount} items successfully`)
  }

  async processItem(item, itemHash) {
    // Base item processing
    const processedItem = {
      hash: parseInt(itemHash),
      name: item.displayProperties?.name || 'Unknown Item',
      description: item.displayProperties?.description || '',
      icon: item.displayProperties?.icon ? `https://www.bungie.net${item.displayProperties.icon}` : null,
      screenshot: item.screenshot ? `https://www.bungie.net${item.screenshot}` : null,
      itemType: item.itemType,
      itemSubType: item.itemSubType,
      classType: item.classType,
      tierType: item.inventory?.tierType || 0,
      bucketHash: item.inventory?.bucketTypeHash,
      
      // Intelligence properties
      intelligence: {
        category: this.determineCategory(item),
        rarity: this.determineRarity(item),
        element: this.determineElement(item),
        slot: this.determineSlot(item),
        synergy: this.calculateSynergyPotential(item),
        isUseful: this.isItemUseful(item),
        tags: this.generateItemTags(item)
      }
    }

    // Add type-specific processing
    if (processedItem.itemType === this.itemTypes.WEAPON) {
      this.processWeapon(item, processedItem)
    } else if (processedItem.itemType === this.itemTypes.ARMOR) {
      this.processArmor(item, processedItem)
    } else if (processedItem.itemType === this.itemTypes.MOD) {
      this.processMod(item, processedItem)
    }

    return processedItem
  }

  processWeapon(item, processedItem) {
    processedItem.weapon = {
      damageType: item.defaultDamageType || 1,
      ammoType: item.equippingBlock?.ammoType || 1,
      stats: this.extractWeaponStats(item),
      perks: this.extractWeaponPerks(item),
      isExotic: processedItem.tierType === 6,
      slot: this.getWeaponSlot(processedItem.bucketHash)
    }

    // Weapon-specific intelligence
    processedItem.intelligence.weaponType = this.getWeaponTypeName(item.itemSubType)
    processedItem.intelligence.damageElement = this.getDamageTypeName(item.defaultDamageType)
    processedItem.intelligence.isMetaWeapon = this.isMetaWeapon(processedItem)
    processedItem.intelligence.activityFit = this.getWeaponActivityFit(processedItem)
  }

  processArmor(item, processedItem) {
    processedItem.armor = {
      stats: this.extractArmorStats(item),
      mods: this.extractArmorMods(item),
      isExotic: processedItem.tierType === 6,
      slot: this.getArmorSlot(processedItem.bucketHash),
      element: 'any' // Armor elements determined by mods
    }

    // Armor-specific intelligence
    processedItem.intelligence.armorType = this.getArmorTypeName(processedItem.bucketHash)
    processedItem.intelligence.statFocus = this.getArmorStatFocus(item)
    processedItem.intelligence.buildRole = this.getArmorBuildRole(processedItem)
  }

  processMod(item, processedItem) {
    processedItem.mod = {
      modType: this.getModType(item),
      cost: item.plug?.energyCost?.energyCost || 0,
      element: this.getModElement(item),
      effects: this.extractModEffects(item),
      slot: this.getModSlot(processedItem.bucketHash)
    }

    // Mod-specific intelligence
    processedItem.intelligence.modCategory = this.categorizeModByEffect(item)
    processedItem.intelligence.synergyPartners = this.findModSynergyPartners(item)
  }

  categorizeItem(item, processed) {
    const category = item.intelligence.category

    // Store in primary category
    switch (category) {
      case 'weapon':
        processed.weapons.set(item.hash, item)
        processed.stats.weapons++
        break
      case 'armor':
        processed.armor.set(item.hash, item)
        processed.stats.armor++
        break
      case 'mod':
        processed.mods.set(item.hash, item)
        processed.stats.mods++
        break
      case 'subclass':
        processed.subclasses.set(item.hash, item)
        processed.stats.subclasses++
        break
    }

    // Store exotics separately for easy access
    if (item.tierType === 6) {
      processed.exotics.set(item.hash, item)
      processed.stats.exotics++
    }

    // Categorize by various properties
    this.categorizeByElement(item, processed.categories.byElement)
    this.categorizeByClass(item, processed.categories.byClass)
    this.categorizeByRarity(item, processed.categories.byRarity)

    processed.stats.totalItems++
  }

  categorizeByElement(item, elementCategories) {
    const element = item.intelligence.element
    if (!elementCategories.has(element)) {
      elementCategories.set(element, [])
    }
    elementCategories.get(element).push(item.hash)
  }

  categorizeByClass(item, classCategories) {
    const className = this.getClassName(item.classType)
    if (!classCategories.has(className)) {
      classCategories.set(className, [])
    }
    classCategories.get(className).push(item.hash)
  }

  categorizeByRarity(item, rarityCategories) {
    const rarity = item.intelligence.rarity
    if (!rarityCategories.has(rarity)) {
      rarityCategories.set(rarity, [])
    }
    rarityCategories.get(rarity).push(item.hash)
  }

  // Helper methods for item classification

  determineCategory(item) {
    if (item.itemType === this.itemTypes.WEAPON) return 'weapon'
    if (item.itemType === this.itemTypes.ARMOR) return 'armor'
    if (item.itemType === this.itemTypes.MOD) return 'mod'
    if (item.itemType === this.itemTypes.SUBCLASS) return 'subclass'
    return 'other'
  }

  determineRarity(item) {
    const tierType = item.inventory?.tierType || 0
    
    switch (tierType) {
      case 6: return 'exotic'
      case 5: return 'legendary'  
      case 4: return 'rare'
      case 3: return 'uncommon'
      case 2: return 'common'
      default: return 'unknown'
    }
  }

  determineElement(item) {
    if (item.itemType === this.itemTypes.WEAPON) {
      return this.getDamageTypeName(item.defaultDamageType)
    }
    
    // For armor, element is determined by equipped mods
    return 'any'
  }

  determineSlot(item) {
    const bucket = item.inventory?.bucketTypeHash
    
    // Weapon slots
    if (bucket === this.bucketTypes.KINETIC) return 'kinetic'
    if (bucket === this.bucketTypes.ENERGY) return 'energy'
    if (bucket === this.bucketTypes.POWER) return 'power'
    
    // Armor slots
    if (bucket === this.bucketTypes.HELMET) return 'helmet'
    if (bucket === this.bucketTypes.ARMS) return 'gauntlets'
    if (bucket === this.bucketTypes.CHEST) return 'chest'
    if (bucket === this.bucketTypes.LEGS) return 'legs'
    if (bucket === this.bucketTypes.CLASS_ITEM) return 'class'
    
    return 'unknown'
  }

  calculateSynergyPotential(item) {
    let potential = 0.5 // Base potential

    // Higher potential for exotics
    if (item.inventory?.tierType === 6) potential += 0.3

    // Higher potential for items with unique perks
    if (item.perks && item.perks.length > 0) potential += 0.1

    // Higher potential for elemental items
    if (item.defaultDamageType && item.defaultDamageType > 1) potential += 0.1

    return Math.min(1.0, potential)
  }

  isItemUseful(item) {
    // Determine if item is useful for builds
    
    // Always useful: weapons and armor
    if ([this.itemTypes.WEAPON, this.itemTypes.ARMOR].includes(item.itemType)) {
      return true
    }

    // Useful: mods that affect gameplay
    if (item.itemType === this.itemTypes.MOD) {
      return true
    }

    // Useful: exotic items of any type
    if (item.inventory?.tierType === 6) {
      return true
    }

    // Not useful: common consumables, materials, etc.
    return false
  }

  generateItemTags(item) {
    const tags = []

    // Rarity tags
    if (item.inventory?.tierType === 6) tags.push('exotic')
    if (item.inventory?.tierType === 5) tags.push('legendary')

    // Type tags
    if (item.itemType === this.itemTypes.WEAPON) {
      tags.push('weapon')
      tags.push(this.getWeaponTypeName(item.itemSubType))
    }
    if (item.itemType === this.itemTypes.ARMOR) {
      tags.push('armor')
      tags.push(this.getArmorTypeName(item.inventory?.bucketTypeHash))
    }

    // Element tags
    const element = this.determineElement(item)
    if (element && element !== 'kinetic' && element !== 'any') {
      tags.push(element)
    }

    // Activity tags based on item characteristics
    if (item.itemType === this.itemTypes.WEAPON) {
      const activityTags = this.getWeaponActivityTags(item)
      tags.push(...activityTags)
    }

    return tags
  }

  getWeaponActivityTags(item) {
    const tags = []
    const weaponType = this.getWeaponTypeName(item.itemSubType)
    
    // PvP weapons
    if (['hand cannon', 'pulse rifle', 'shotgun', 'sniper rifle'].includes(weaponType)) {
      tags.push('pvp')
    }
    
    // Raid weapons
    if (['linear fusion rifle', 'rocket launcher', 'machine gun'].includes(weaponType)) {
      tags.push('raid', 'boss-damage')
    }
    
    // General PvE
    if (['auto rifle', 'scout rifle', 'submachine gun'].includes(weaponType)) {
      tags.push('pve', 'add-clear')
    }

    return tags
  }

  // Data extraction methods

  extractWeaponStats(item) {
    const stats = {}
    
    if (item.stats?.stats) {
      for (const [statHash, stat] of Object.entries(item.stats.stats)) {
        const statName = this.getStatNameByHash(parseInt(statHash))
        if (statName) {
          stats[statName] = {
            value: stat.value || 0,
            hash: parseInt(statHash)
          }
        }
      }
    }

    return stats
  }

  extractArmorStats(item) {
    const stats = {}
    
    if (item.stats?.stats) {
      for (const [statHash, stat] of Object.entries(item.stats.stats)) {
        const statName = this.getStatNameByHash(parseInt(statHash))
        if (statName && this.isArmorStat(parseInt(statHash))) {
          stats[statName] = {
            value: stat.value || 0,
            hash: parseInt(statHash)
          }
        }
      }
    }

    return stats
  }

  extractWeaponPerks(item) {
    const perks = []
    
    // Extract from sockets if available
    if (item.sockets?.socketEntries) {
      for (const socket of item.sockets.socketEntries) {
        if (socket.reusablePlugItems) {
          for (const plug of socket.reusablePlugItems) {
            perks.push({
              hash: plug.plugItemHash,
              name: 'Perk', // Would need to look up from manifest
              description: 'Perk description' // Would need to look up
            })
          }
        }
      }
    }

    return perks
  }

  extractArmorMods(item) {
    const mods = []
    
    // Extract available mod sockets
    if (item.sockets?.socketEntries) {
      for (const socket of item.sockets.socketEntries) {
        if (socket.socketTypeHash) {
          mods.push({
            socketTypeHash: socket.socketTypeHash,
            category: this.getSocketCategory(socket.socketTypeHash)
          })
        }
      }
    }

    return mods
  }

  extractModEffects(item) {
    const effects = []
    
    // Parse mod description for effects
    const description = item.displayProperties?.description || ''
    
    // Look for stat modifications
    const statMatches = description.match(/([+-]\d+)\s+(\w+)/g)
    if (statMatches) {
      for (const match of statMatches) {
        const [, value, stat] = match.match(/([+-]\d+)\s+(\w+)/)
        effects.push({
          type: 'stat_modification',
          stat: stat.toLowerCase(),
          value: parseInt(value)
        })
      }
    }

    // Look for ability modifications
    if (description.includes('grenade')) effects.push({ type: 'grenade_enhancement' })
    if (description.includes('super')) effects.push({ type: 'super_enhancement' })
    if (description.includes('melee')) effects.push({ type: 'melee_enhancement' })

    return effects
  }

  processStatDefinitions(statDefinitions, processed) {
    processed.statDefinitions = new Map()
    
    for (const [statHash, stat] of Object.entries(statDefinitions)) {
      if (stat && stat.displayProperties?.name) {
        processed.statDefinitions.set(parseInt(statHash), {
          hash: parseInt(statHash),
          name: stat.displayProperties.name,
          description: stat.displayProperties.description || '',
          icon: stat.displayProperties.icon ? `https://www.bungie.net${stat.displayProperties.icon}` : null,
          
          intelligence: {
            isArmorStat: this.isArmorStat(parseInt(statHash)),
            isWeaponStat: this.isWeaponStat(parseInt(statHash)),
            category: this.getStatCategory(stat.displayProperties.name)
          }
        })
      }
    }

    console.log(`📈 Processed ${processed.statDefinitions.size} stat definitions`)
  }

  // Utility methods for classification

  getWeaponTypeName(itemSubType) {
    const weaponTypes = {
      6: 'auto rifle',
      7: 'shotgun', 
      8: 'machine gun',
      9: 'hand cannon',
      10: 'rocket launcher',
      11: 'fusion rifle',
      12: 'sniper rifle',
      13: 'pulse rifle',
      14: 'scout rifle',
      17: 'sidearm',
      18: 'sword',
      19: 'linear fusion rifle',
      22: 'grenade launcher',
      23: 'submachine gun',
      24: 'trace rifle',
      25: 'bow',
      33: 'glaive'
    }

    return weaponTypes[itemSubType] || 'unknown weapon'
  }

  getArmorTypeName(bucketHash) {
    if (bucketHash === this.bucketTypes.HELMET) return 'helmet'
    if (bucketHash === this.bucketTypes.ARMS) return 'gauntlets'
    if (bucketHash === this.bucketTypes.CHEST) return 'chest armor'
    if (bucketHash === this.bucketTypes.LEGS) return 'leg armor'
    if (bucketHash === this.bucketTypes.CLASS_ITEM) return 'class item'
    return 'unknown armor'
  }

  getDamageTypeName(damageType) {
    const damageTypes = {
      1: 'kinetic',
      2: 'arc',
      3: 'solar', 
      4: 'void',
      6: 'stasis',
      7: 'strand'
    }

    return damageTypes[damageType] || 'unknown'
  }

  getClassName(classType) {
    const classes = {
      0: 'titan',
      1: 'hunter', 
      2: 'warlock',
      3: 'any'
    }

    return classes[classType] || 'unknown'
  }

  getWeaponSlot(bucketHash) {
    if (bucketHash === this.bucketTypes.KINETIC) return 'primary'
    if (bucketHash === this.bucketTypes.ENERGY) return 'secondary'  
    if (bucketHash === this.bucketTypes.POWER) return 'heavy'
    return 'unknown'
  }

  getArmorSlot(bucketHash) {
    return this.getArmorTypeName(bucketHash).replace(' ', '_')
  }

  isArmorStat(statHash) {
    const armorStats = [
      2996146975, // Mobility
      392767087,  // Resilience
      1943323491, // Recovery
      1735777505, // Discipline
      144602215,  // Intellect
      4244567218  // Strength
    ]
    return armorStats.includes(statHash)
  }

  isWeaponStat(statHash) {
    const weaponStats = [
      155624089,  // Stability
      943549884,  // Handling
      1345609583, // Aim Assistance
      4188031367, // Reload Speed
      1931675084  // Inventory Size
    ]
    return weaponStats.includes(statHash)
  }

  getStatNameByHash(statHash) {
    for (const [name, hash] of Object.entries(this.statHashes)) {
      if (hash === statHash) return name
    }
    return null
  }

  getStatCategory(statName) {
    const categories = {
      'Mobility': 'movement',
      'Resilience': 'survivability', 
      'Recovery': 'survivability',
      'Discipline': 'ability',
      'Intellect': 'ability',
      'Strength': 'ability'
    }

    return categories[statName] || 'other'
  }

  // Advanced analysis methods

  isMetaWeapon(weaponItem) {
    // Simple heuristic for meta weapons (would be enhanced with actual data)
    const weaponType = weaponItem.intelligence.weaponType
    const isExotic = weaponItem.tierType === 6
    
    const metaTypes = ['hand cannon', 'pulse rifle', 'auto rifle', 'shotgun', 'sniper rifle']
    
    return isExotic || metaTypes.includes(weaponType)
  }

  getWeaponActivityFit(weaponItem) {
    const weaponType = weaponItem.intelligence.weaponType
    const element = weaponItem.intelligence.damageElement
    
    const fits = []
    
    // PvP fit
    if (['hand cannon', 'pulse rifle', 'shotgun'].includes(weaponType)) {
      fits.push('pvp')
    }
    
    // Raid fit  
    if (['linear fusion rifle', 'sniper rifle', 'rocket launcher'].includes(weaponType)) {
      fits.push('raid')
    }
    
    // General PvE fit
    if (['auto rifle', 'scout rifle', 'machine gun'].includes(weaponType)) {
      fits.push('general_pve')
    }

    return fits
  }

  getArmorStatFocus(armorItem) {
    const stats = this.extractArmorStats(armorItem)
    let maxStat = null
    let maxValue = 0

    for (const [statName, statData] of Object.entries(stats)) {
      if (statData.value > maxValue) {
        maxValue = statData.value
        maxStat = statName
      }
    }

    return maxStat || 'balanced'
  }

  getArmorBuildRole(armorItem) {
    const statFocus = armorItem.intelligence.statFocus
    
    const roles = {
      'mobility': 'mobility',
      'resilience': 'tank',
      'recovery': 'survivability', 
      'discipline': 'ability_spam',
      'intellect': 'super_focus',
      'strength': 'melee_focus'
    }

    return roles[statFocus] || 'versatile'
  }

  // Search and query methods

  searchItems(processed, searchText, options = {}) {
    const results = []
    const searchLower = searchText.toLowerCase()
    
    const allItems = new Map([
      ...processed.weapons,
      ...processed.armor,
      ...processed.mods
    ])

    for (const [hash, item] of allItems) {
      // Search in name and description
      if (item.name.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower)) {
        results.push(item)
      }
      
      // Search in tags
      if (item.intelligence.tags.some(tag => tag.includes(searchLower))) {
        results.push(item)
      }
    }

    // Apply filters if provided
    if (options.category) {
      return results.filter(item => item.intelligence.category === options.category)
    }

    if (options.element) {
      return results.filter(item => item.intelligence.element === options.element)
    }

    return results
  }

  getItemsByCategory(processed, category, filters = {}) {
    let items = null

    switch (category) {
      case 'weapons':
        items = Array.from(processed.weapons.values())
        break
      case 'armor':
        items = Array.from(processed.armor.values())
        break
      case 'mods':
        items = Array.from(processed.mods.values())
        break
      case 'exotics':
        items = Array.from(processed.exotics.values())
        break
      default:
        return []
    }

    // Apply filters
    if (filters.element) {
      items = items.filter(item => item.intelligence.element === filters.element)
    }
    
    if (filters.class !== undefined) {
      items = items.filter(item => item.classType === filters.class || item.classType === 3)
    }
    
    if (filters.slot) {
      items = items.filter(item => item.intelligence.slot === filters.slot)
    }

    return items
  }

  // Utility methods

  generateManifestHash(manifestData) {
    // Simple hash for caching based on manifest version and item count
    const version = manifestData.version || 'unknown'
    const itemCount = Object.keys(manifestData.data?.DestinyInventoryItemDefinition || {}).length
    const timestamp = manifestData.lastUpdated || Date.now()
    
    return `${version}-${itemCount}-${timestamp}`.replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)
  }

  getProcessingStats() {
    return {
      cacheSize: this.processedCache.size,
      lastProcessedHash: this.lastProcessedHash,
      isInitialized: this.isInitialized,
      version: this.version
    }
  }

  clearCache() {
    this.processedCache.clear()
    this.lastProcessedHash = null
    console.log('🧹 Manifest processor cache cleared')
  }

  // Helper method mappings

  getModType(item) {
    const name = item.displayProperties?.name || ''
    
    if (name.includes('Mod')) return 'armor_mod'
    if (name.includes('Spec')) return 'weapon_mod'
    if (item.plug?.energyCost) return 'energy_mod'
    
    return 'unknown_mod'
  }

  getModElement(item) {
    if (item.plug?.energyCost?.energyType) {
      const energyTypes = {
        1: 'arc',
        2: 'solar',
        3: 'void',
        4: 'any'
      }
      return energyTypes[item.plug.energyCost.energyType] || 'any'
    }
    
    return 'any'
  }

  getModSlot(bucketHash) {
    // Would map bucket hashes to mod slots
    return 'general_mod'
  }

  categorizeModByEffect(item) {
    const name = item.displayProperties?.name?.toLowerCase() || ''
    const description = item.displayProperties?.description?.toLowerCase() || ''
    
    if (name.includes('targeting') || name.includes('dexterity')) return 'weapon_handling'
    if (name.includes('mobility') || name.includes('recovery')) return 'stat_enhancement'
    if (name.includes('well') || name.includes('elemental')) return 'elemental_synergy'
    if (description.includes('damage')) return 'damage_enhancement'
    
    return 'utility'
  }

  findModSynergyPartners(item) {
    // Would identify mods that work well together
    const partners = []
    const category = this.categorizeModByEffect(item)
    
    if (category === 'elemental_synergy') {
      partners.push('matching_element_mods', 'elemental_well_generation')
    }
    
    if (category === 'stat_enhancement') {
      partners.push('complementary_stat_mods')
    }

    return partners
  }

  getSocketCategory(socketTypeHash) {
    // Simplified socket categorization
    return 'general'
  }

  getArmorStatFocus(item) {
    const stats = this.extractArmorStats(item)
    let maxStat = null
    let maxValue = 0

    for (const [statName, statData] of Object.entries(stats)) {
      if (statData.value > maxValue) {
        maxValue = statData.value
        maxStat = statName
      }
    }

    return maxStat || 'balanced'
  }
}

// Utility functions for external use
export async function processManifestData(manifestData, userSession = null) {
  const processor = new IntelligentManifestProcessor()
  await processor.initialize(manifestData)
  return processor.processManifest(manifestData, userSession)
}

export function searchManifestItems(processed, searchText, options = {}) {
  const processor = new IntelligentManifestProcessor()
  return processor.searchItems(processed, searchText, options)
}

export function getItemsByCategory(processed, category, filters = {}) {
  const processor = new IntelligentManifestProcessor()
  return processor.getItemsByCategory(processed, category, filters)
}