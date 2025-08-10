import { TextParser } from './destiny-intelligence/text-parser.js'
import { StatCalculator } from './destiny-intelligence/stat-calculator.js'

export class IntelligentManifestProcessor {
  constructor() {
    this.textParser = new TextParser()
    this.statCalculator = new StatCalculator()
    
    // Item type mappings for efficient categorization
    this.itemTypes = {
      WEAPON: 3,
      ARMOR: 2,
      SUBCLASS: 16,
      MOD: 19,
      GHOST: 1
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
      CLASS_ITEM: 1585787867,
      
      // Mods
      HELMET_MOD: 3876796314,
      ARMS_MOD: 2422292810,
      CHEST_MOD: 1526202480,
      LEGS_MOD: 2111701510,
      CLASS_MOD: 1585787867
    }
    
    // Cache for processed data
    this.processedCache = new Map()
    this.lastProcessedHash = null
  }

  /**
   * Load and intelligently process the full manifest
   * @param {Object} manifestData - Raw manifest data from Bungie API
   * @param {Object} userSession - User session for API calls
   * @returns {Object} Categorized and processed item data
   */
  async processManifest(manifestData, userSession = null) {
    const startTime = performance.now()
    
    // Check cache first
    const manifestHash = this.generateManifestHash(manifestData)
    if (this.processedCache.has(manifestHash)) {
      console.log('Returning cached processed manifest')
      return this.processedCache.get(manifestHash)
    }
    
    const processed = {
      weapons: new Map(),
      armor: new Map(),
      mods: new Map(),
      subclasses: new Map(),
      exotic_perks: new Map(),
      stats: {
        totalItems: 0,
        weapons: 0,
        armor: 0,
        mods: 0,
        subclasses: 0,
        exotic_perks: 0
      },
      metadata: {
        processedAt: new Date().toISOString(),
        processingTime: 0,
        manifestHash
      }
    }
    
    // Process inventory items
    if (manifestData.DestinyInventoryItemDefinition) {
      await this.processInventoryItems(manifestData.DestinyInventoryItemDefinition, processed)
    }
    
    // Process stat definitions
    if (manifestData.DestinyStatDefinition) {
      this.processStatDefinitions(manifestData.DestinyStatDefinition, processed)
    }
    
    // Process perk definitions
    if (manifestData.DestinyPerkDefinition) {
      this.processPerkDefinitions(manifestData.DestinyPerkDefinition, processed)
    }
    
    // Calculate processing time
    processed.metadata.processingTime = performance.now() - startTime
    
    // Cache the result
    this.processedCache.set(manifestHash, processed)
    this.lastProcessedHash = manifestHash
    
    console.log(`Processed manifest in ${processed.metadata.processingTime.toFixed(2)}ms`)
    console.log(`Items processed: ${processed.stats.totalItems}`)
    
    return processed
  }

  /**
   * Process inventory items (weapons, armor, mods, etc.)
   */
  async processInventoryItems(inventoryItems, processed) {
    const batchSize = 100
    const items = Object.values(inventoryItems)
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      await this.processBatch(batch, processed)
      
      // Yield control periodically for better performance
      if (i % 500 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0))
      }
    }
  }

  /**
   * Process a batch of items efficiently
   */
  async processBatch(items, processed) {
    for (const item of items) {
      if (!this.isValidItem(item)) continue
      
      const categorized = this.categorizeItem(item)
      if (!categorized) continue
      
      // Parse item description for intelligence
      const parsed = this.textParser.parseDescription(
        item.displayProperties?.description || '',
        item
      )
      
      // Enhanced item with intelligence data
      const enhancedItem = {
        ...item,
        parsed,
        category: categorized.category,
        slot: categorized.slot,
        intelligence: this.generateIntelligenceMetadata(item, parsed)
      }
      
      // Store in appropriate category
      this.storeItem(enhancedItem, processed)
    }
  }

  /**
   * Check if item is valid for processing
   */
  isValidItem(item) {
    return item && 
           !item.redacted && 
           !item.blacklisted &&
           item.displayProperties?.name &&
           item.hash
  }

  /**
   * Categorize item by type and slot
   */
  categorizeItem(item) {
    const itemType = item.itemType
    const bucketHash = item.inventory?.bucketTypeHash
    
    // Weapons
    if (itemType === this.itemTypes.WEAPON) {
      let slot = 'unknown'
      if (bucketHash === this.bucketTypes.KINETIC) slot = 'kinetic'
      else if (bucketHash === this.bucketTypes.ENERGY) slot = 'energy'
      else if (bucketHash === this.bucketTypes.POWER) slot = 'power'
      
      return { category: 'weapons', slot }
    }
    
    // Armor
    if (itemType === this.itemTypes.ARMOR) {
      let slot = 'unknown'
      if (bucketHash === this.bucketTypes.HELMET) slot = 'helmet'
      else if (bucketHash === this.bucketTypes.ARMS) slot = 'arms'
      else if (bucketHash === this.bucketTypes.CHEST) slot = 'chest'
      else if (bucketHash === this.bucketTypes.LEGS) slot = 'legs'
      else if (bucketHash === this.bucketTypes.CLASS_ITEM) slot = 'classItem'
      
      return { category: 'armor', slot }
    }
    
    // Mods
    if (itemType === this.itemTypes.MOD) {
      let slot = 'general'
      if (bucketHash === this.bucketTypes.ARMS_MOD) slot = 'arms'
      else if (bucketHash === this.bucketTypes.CHEST_MOD) slot = 'chest'
      // Add more mod slot detection as needed
      
      return { category: 'mods', slot }
    }
    
    // Subclasses
    if (itemType === this.itemTypes.SUBCLASS) {
      return { category: 'subclasses', slot: 'subclass' }
    }
    
    return null
  }

  /**
   * Generate intelligence metadata for items
   */
  generateIntelligenceMetadata(item, parsed) {
    return {
      complexity: this.calculateComplexity(item, parsed),
      synergyPotential: this.calculateSynergyPotential(parsed),
      isExotic: item.inventory?.tierType === 6,
      energyCost: item.plug?.energyCost?.energyCost || 0,
      hasConditionalEffects: parsed.triggers.length > 0,
      hasMathematicalEffects: parsed.mathematical.length > 0,
      confidence: parsed.confidence,
      searchableText: this.generateSearchableText(item, parsed)
    }
  }

  /**
   * Calculate item complexity score
   */
  calculateComplexity(item, parsed) {
    let complexity = 0.1 // Base complexity
    
    complexity += parsed.triggers.length * 0.2
    complexity += parsed.effects.length * 0.15
    complexity += parsed.mathematical.length * 0.25
    
    if (item.inventory?.tierType === 6) complexity += 0.3 // Exotic bonus
    if (item.sockets?.socketEntries?.length > 5) complexity += 0.2 // Many sockets
    
    return Math.min(1.0, complexity)
  }

  /**
   * Calculate synergy potential score
   */
  calculateSynergyPotential(parsed) {
    let potential = 0.1 // Base potential
    
    potential += parsed.triggers.length * 0.3
    potential += parsed.effects.length * 0.2
    potential += parsed.confidence * 0.4
    
    // Bonus for specific high-synergy triggers
    const highSynergyTriggers = ['weapon_kill', 'ability_kill', 'orb_collection', 'precision_kill']
    const matchingTriggers = parsed.triggers.filter(t => 
      highSynergyTriggers.includes(t.normalizedCondition)
    ).length
    
    potential += matchingTriggers * 0.15
    
    return Math.min(1.0, potential)
  }

  /**
   * Generate searchable text for items
   */
  generateSearchableText(item, parsed) {
    const textParts = [
      item.displayProperties?.name || '',
      item.displayProperties?.description || '',
      item.flavorText || ''
    ]
    
    // Add trigger and effect text
    parsed.triggers.forEach(trigger => {
      textParts.push(trigger.condition)
    })
    
    parsed.effects.forEach(effect => {
      textParts.push(effect.context)
    })
    
    return textParts.join(' ').toLowerCase()
  }

  /**
   * Store item in processed data structure
   */
  storeItem(item, processed) {
    const { category } = item
    
    if (processed[category]) {
      processed[category].set(item.hash, item)
      processed.stats[category]++
      processed.stats.totalItems++
    }
  }

  /**
   * Process stat definitions for the new system
   */
  processStatDefinitions(statDefinitions, processed) {
    processed.statDefinitions = new Map()
    
    Object.values(statDefinitions).forEach(stat => {
      if (stat && stat.displayProperties?.name) {
        // Map old stat hashes to new system
        const mappedStat = this.statCalculator.convertOldStatToNew(stat.displayProperties.name)
        
        processed.statDefinitions.set(stat.hash, {
          ...stat,
          mappedName: mappedStat,
          intelligence: {
            isArmorStat: this.isArmorStat(stat.hash),
            isWeaponStat: this.isWeaponStat(stat.hash)
          }
        })
      }
    })
  }

  /**
   * Process perk definitions for synergy analysis
   */
  processPerkDefinitions(perkDefinitions, processed) {
    processed.perkDefinitions = new Map()
    
    Object.values(perkDefinitions).forEach(perk => {
      if (perk && perk.displayProperties?.name) {
        const parsed = this.textParser.parseDescription(
          perk.displayProperties?.description || '',
          perk
        )
        
        processed.perkDefinitions.set(perk.hash, {
          ...perk,
          parsed,
          intelligence: {
            synergyPotential: this.calculateSynergyPotential(parsed),
            isConditional: parsed.triggers.length > 0,
            isMathematical: parsed.mathematical.length > 0
          }
        })
      }
    })
  }

  /**
   * Get items by category and filters
   */
  getItemsByCategory(processedData, category, filters = {}) {
    const items = processedData[category]
    if (!items) return []
    
    let filtered = Array.from(items.values())
    
    // Apply filters
    if (filters.slot) {
      filtered = filtered.filter(item => item.slot === filters.slot)
    }
    
    if (filters.isExotic !== undefined) {
      filtered = filtered.filter(item => item.intelligence.isExotic === filters.isExotic)
    }
    
    if (filters.minSynergyPotential) {
      filtered = filtered.filter(item => 
        item.intelligence.synergyPotential >= filters.minSynergyPotential
      )
    }
    
    if (filters.hasConditionalEffects) {
      filtered = filtered.filter(item => item.intelligence.hasConditionalEffects)
    }
    
    return filtered
  }

  /**
   * Search items by text
   */
  searchItems(processedData, searchText, options = {}) {
    const { categories = ['weapons', 'armor', 'mods'], limit = 50 } = options
    const results = []
    const searchLower = searchText.toLowerCase()
    
    for (const category of categories) {
      const items = processedData[category]
      if (!items) continue
      
      for (const item of items.values()) {
        if (item.intelligence.searchableText.includes(searchLower)) {
          results.push({
            ...item,
            category,
            relevanceScore: this.calculateRelevanceScore(item, searchText)
          })
        }
        
        if (results.length >= limit) break
      }
      
      if (results.length >= limit) break
    }
    
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  /**
   * Calculate search relevance score
   */
  calculateRelevanceScore(item, searchText) {
    const name = item.displayProperties?.name?.toLowerCase() || ''
    const description = item.displayProperties?.description?.toLowerCase() || ''
    const searchLower = searchText.toLowerCase()
    
    let score = 0
    
    // Exact name match
    if (name === searchLower) score += 100
    // Name contains search
    else if (name.includes(searchLower)) score += 50
    // Description contains search
    else if (description.includes(searchLower)) score += 25
    
    // Bonus for exotic items
    if (item.intelligence.isExotic) score += 10
    
    // Bonus for high synergy potential
    score += item.intelligence.synergyPotential * 20
    
    return score
  }

  /**
   * Generate manifest hash for caching
   */
  generateManifestHash(manifestData) {
    // Simple hash based on object keys and length
    const keys = Object.keys(manifestData).sort().join(',')
    const lengths = Object.values(manifestData).map(obj => 
      Object.keys(obj || {}).length
    ).join(',')
    
    return `${keys}-${lengths}`.replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)
  }

  /**
   * Helper methods for stat classification
   */
  isArmorStat(statHash) {
    // Map of armor stat hashes (would need to be populated with actual values)
    const armorStats = [2996146975, 392767087, 1943323491, 1735777505, 144602215, 4244567218]
    return armorStats.includes(statHash)
  }

  isWeaponStat(statHash) {
    // Map of weapon stat hashes (would need to be populated with actual values)
    const weaponStats = [155624089, 943549884, 1345609583, 4188031367, 1931675084]
    return weaponStats.includes(statHash)
  }

  /**
   * Get processing statistics
   */
  getProcessingStats() {
    return {
      cacheSize: this.processedCache.size,
      lastProcessedHash: this.lastProcessedHash,
      memoryUsage: this.estimateMemoryUsage()
    }
  }

  /**
   * Estimate memory usage of cached data
   */
  estimateMemoryUsage() {
    let totalSize = 0
    for (const [key, value] of this.processedCache) {
      totalSize += JSON.stringify(value).length
    }
    return `${(totalSize / 1024 / 1024).toFixed(2)} MB`
  }

  /**
   * Clear cache to free memory
   */
  clearCache() {
    this.processedCache.clear()
    this.lastProcessedHash = null
  }
}

// Utility functions for external use
export async function processManifestData(manifestData, userSession = null) {
  const processor = new IntelligentManifestProcessor()
  return processor.processManifest(manifestData, userSession)
}

export function searchManifestItems(processedData, searchText, options = {}) {
  const processor = new IntelligentManifestProcessor()
  return processor.searchItems(processedData, searchText, options)
}

export function getItemsByCategory(processedData, category, filters = {}) {
  const processor = new IntelligentManifestProcessor()
  return processor.getItemsByCategory(processedData, category, filters)
}