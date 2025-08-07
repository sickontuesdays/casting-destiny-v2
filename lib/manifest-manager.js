import fs from 'fs'
import path from 'path'
import BungieAPI from './bungie-api'

const DATA_DIR = path.join(process.cwd(), 'data')
const MANIFEST_FILE = path.join(DATA_DIR, 'manifest.json')

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

export async function getManifest() {
  try {
    if (fs.existsSync(MANIFEST_FILE)) {
      const manifestData = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'))
      
      // Check if manifest is recent (within 24 hours for development)
      const lastUpdate = new Date(manifestData.lastUpdate)
      const now = new Date()
      const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60)
      
      if (hoursSinceUpdate < 24) {
        return manifestData
      }
    }
    
    // If no manifest or too old, fetch new one
    return await updateManifest()
  } catch (error) {
    console.error('Error loading manifest:', error)
    return null
  }
}

export async function updateManifest() {
  console.log('Updating Destiny 2 manifest...')
  
  try {
    const api = new BungieAPI()
    const manifestInfo = await api.getManifest()
    
    const manifest = {
      version: manifestInfo.version,
      lastUpdate: new Date().toISOString(),
      currentSeason: getCurrentSeason(),
      weapons: {},
      armor: {},
      mods: {},
      subclasses: {},
      seasonalArtifact: await getSeasonalArtifact(),
      itemCategories: {},
      stats: {},
      perks: {}
    }

    // Download and process weapon definitions
    console.log('Processing weapons...')
    const weaponDefs = await api.getManifestComponent(manifestInfo.jsonWorldComponentContentPaths.en.DestinyInventoryItemDefinition)
    manifest.weapons = processWeapons(weaponDefs)

    // Download and process armor definitions
    console.log('Processing armor...')
    manifest.armor = processArmor(weaponDefs) // Same endpoint contains armor

    // Download and process mods
    console.log('Processing mods...')
    manifest.mods = processMods(weaponDefs) // Same endpoint contains mods

    // Download and process subclasses
    console.log('Processing subclasses...')
    const subclassDefs = await api.getManifestComponent(manifestInfo.jsonWorldComponentContentPaths.en.DestinySubclassDefinition)
    manifest.subclasses = processSubclasses(subclassDefs)

    // Download and process stats
    console.log('Processing stats...')
    const statDefs = await api.getManifestComponent(manifestInfo.jsonWorldComponentContentPaths.en.DestinyStatDefinition)
    manifest.stats = processStats(statDefs)

    // Save to file
    fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2))
    console.log('Manifest updated successfully!')
    
    return manifest
  } catch (error) {
    console.error('Error updating manifest:', error)
    throw error
  }
}

function processWeapons(itemDefs) {
  const weapons = {}
  
  for (const [hash, item] of Object.entries(itemDefs)) {
    if (!item || !item.displayProperties || !item.displayProperties.name) continue
    
    // Filter for weapons only
    if (item.itemType === 3 && item.itemCategoryHashes) {
      const isWeapon = item.itemCategoryHashes.some(categoryHash => 
        [1, 2, 3, 4].includes(categoryHash) // Weapon category hashes
      )
      
      if (isWeapon) {
        weapons[hash] = {
          hash: parseInt(hash),
          displayProperties: {
            name: item.displayProperties.name,
            description: item.displayProperties.description,
            icon: item.displayProperties.icon
          },
          itemType: 'weapon',
          itemTypeDisplayName: item.itemTypeDisplayName,
          itemSubType: getWeaponSubType(item),
          tierType: item.inventory?.tierType || 0,
          damageType: item.defaultDamageType || 0,
          ammoType: item.equippingBlock?.ammoType || 0,
          itemCategoryHashes: item.itemCategoryHashes,
          stats: processItemStats(item.stats),
          sockets: processItemSockets(item.sockets),
          perks: extractWeaponPerks(item),
          crafted: item.inventory?.recipeItemHash ? true : false,
          powerCap: item.quality?.versions?.[0]?.powerCapHash || null
        }
      }
    }
  }
  
  return weapons
}

function processArmor(itemDefs) {
  const armor = {}
  
  for (const [hash, item] of Object.entries(itemDefs)) {
    if (!item || !item.displayProperties || !item.displayProperties.name) continue
    
    // Filter for armor only
    if (item.itemType === 2) {
      armor[hash] = {
        hash: parseInt(hash),
        displayProperties: {
          name: item.displayProperties.name,
          description: item.displayProperties.description,
          icon: item.displayProperties.icon
        },
        itemType: 'armor',
        itemTypeDisplayName: item.itemTypeDisplayName,
        classType: item.classType,
        tierType: item.inventory?.tierType || 0,
        itemCategoryHashes: item.itemCategoryHashes,
        stats: processItemStats(item.stats),
        sockets: processItemSockets(item.sockets),
        energyType: item.energy?.energyType || 0,
        energyCapacity: item.energy?.energyCapacity || 0
      }
    }
  }
  
  return armor
}

function processMods(itemDefs) {
  const mods = {}
  
  for (const [hash, item] of Object.entries(itemDefs)) {
    if (!item || !item.displayProperties || !item.displayProperties.name) continue
    
    // Filter for mods (armor mods, weapon mods, etc.)
    if (item.itemType === 19 || item.itemType === 20) {
      mods[hash] = {
        hash: parseInt(hash),
        displayProperties: {
          name: item.displayProperties.name,
          description: item.displayProperties.description,
          icon: item.displayProperties.icon
        },
        itemType: 'mod',
        itemTypeDisplayName: item.itemTypeDisplayName,
        plug: item.plug,
        energy: item.plug?.energyCost,
        socketType: item.plug?.plugCategoryHash
      }
    }
  }
  
  return mods
}

function processSubclasses(subclassDefs) {
  const subclasses = {}
  
  for (const [hash, subclass] of Object.entries(subclassDefs)) {
    if (!subclass || !subclass.displayProperties) continue
    
    subclasses[hash] = {
      hash: parseInt(hash),
      displayProperties: {
        name: subclass.displayProperties.name,
        description: subclass.displayProperties.description,
        icon: subclass.displayProperties.icon
      },
      damageType: subclass.damageType,
      classType: subclass.classType,
      aspects: subclass.talentGrid?.talentGridItems || [],
      fragments: subclass.talentGrid?.talentGridItems || []
    }
  }
  
  return subclasses
}

function processStats(statDefs) {
  const stats = {}
  
  for (const [hash, stat] of Object.entries(statDefs)) {
    if (!stat || !stat.displayProperties) continue
    
    stats[hash] = {
      hash: parseInt(hash),
      displayProperties: {
        name: stat.displayProperties.name,
        description: stat.displayProperties.description,
        icon: stat.displayProperties.icon
      },
      aggregationType: stat.aggregationType,
      hasComputedBlock: stat.hasComputedBlock,
      statCategory: stat.statCategory
    }
  }
  
  return stats
}

function processItemStats(statsBlock) {
  if (!statsBlock || !statsBlock.stats) return {}
  
  const stats = {}
  for (const [statHash, statValue] of Object.entries(statsBlock.stats)) {
    stats[statHash] = {
      hash: parseInt(statHash),
      value: statValue.value || 0,
      minimum: statValue.minimum || 0,
      maximum: statValue.maximum || 100
    }
  }
  
  return stats
}

function processItemSockets(socketsBlock) {
  if (!socketsBlock || !socketsBlock.socketEntries) return []
  
  return socketsBlock.socketEntries.map(socket => ({
    socketTypeHash: socket.socketTypeHash,
    singleInitialItemHash: socket.singleInitialItemHash,
    reusablePlugItems: socket.reusablePlugItems || [],
    preventInitialization: socket.preventInitialization
  }))
}

function getWeaponSubType(item) {
  // Map item sub types to readable names
  const subTypeMap = {
    6: 'auto_rifle',
    7: 'shotgun',
    8: 'machine_gun',
    9: 'hand_cannon',
    10: 'rocket_launcher',
    11: 'fusion_rifle',
    12: 'sniper_rifle',
    13: 'pulse_rifle',
    14: 'scout_rifle',
    17: 'sidearm',
    18: 'sword',
    19: 'linear_fusion_rifle',
    22: 'grenade_launcher',
    24: 'submachine_gun',
    25: 'trace_rifle',
    26: 'bow',
    27: 'glaive'
  }
  
  return subTypeMap[item.itemSubType] || 'unknown'
}

function extractWeaponPerks(item) {
  const perks = []
  
  if (item.sockets && item.sockets.socketEntries) {
    item.sockets.socketEntries.forEach(socket => {
      if (socket.reusablePlugItems) {
        socket.reusablePlugItems.forEach(plug => {
          perks.push({
            hash: plug.plugItemHash,
            socketIndex: socket.socketTypeHash
          })
        })
      }
    })
  }
  
  return perks
}

async function getSeasonalArtifact() {
  // This would normally fetch current seasonal artifact data
  // For now, return a placeholder structure
  return {
    season: getCurrentSeason(),
    name: 'Seasonal Artifact',
    mods: {
      // This would be populated with actual artifact mod data
      '1234567': {
        hash: 1234567,
        displayProperties: {
          name: 'Anti-Barrier Rounds',
          description: 'Your equipped Primary weapons pierce Barrier Champion defenses.',
          icon: '/common/destiny2_content/icons/artifact_mod.jpg'
        },
        tier: 1,
        cost: 1
      }
    }
  }
}

function getCurrentSeason() {
  // Calculate current season based on date
  // Season 1 started September 6, 2017
  const seasonStart = new Date('2017-09-06')
  const now = new Date()
  const daysSinceStart = Math.floor((now - seasonStart) / (1000 * 60 * 60 * 24))
  
  // Approximate season calculation (seasons are roughly 90-120 days)
  const approximateSeason = Math.floor(daysSinceStart / 100) + 1
  
  return Math.max(1, approximateSeason)
}

// Schedule automatic updates
export function scheduleManifestUpdates() {
  if (typeof window === 'undefined') { // Server-side only
    const cron = require('node-cron')
    
    // Schedule update every Tuesday at 1:30 PM EST (18:30 UTC)
    cron.schedule('30 18 * * 2', async () => {
      console.log('Running scheduled manifest update...')
      try {
        await updateManifest()
        console.log('Scheduled manifest update completed successfully')
      } catch (error) {
        console.error('Scheduled manifest update failed:', error)
      }
    }, {
      timezone: 'America/New_York'
    })
    
    console.log('Manifest update scheduler initialized')
  }
}