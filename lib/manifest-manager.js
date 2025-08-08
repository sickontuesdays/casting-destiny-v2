import fs from 'fs'
import path from 'path'
import BungieAPI from './bungie-api'

// Use /tmp directory in serverless environment, local data directory otherwise
const DATA_DIR = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'data')
const MANIFEST_FILE = path.join(DATA_DIR, 'manifest.json')

// Ensure data directory exists
function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
  } catch (error) {
    console.warn('Could not create data directory:', error.message)
  }
}

export async function getManifest() {
  try {
    ensureDataDir()
    
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
    // Return a basic manifest structure if file operations fail
    return {
      version: 'unavailable',
      lastUpdate: new Date().toISOString(),
      currentSeason: getCurrentSeason(),
      weapons: getSampleWeapons(),
      armor: getSampleArmor(),
      mods: getSampleMods(),
      subclasses: getSampleSubclasses(),
      seasonalArtifact: await getSeasonalArtifact(),
      itemCategories: {},
      stats: getSampleStats(),
      perks: {}
    }
  }
}

export async function updateManifest() {
  console.log('Updating Destiny 2 manifest...')
  
  try {
    ensureDataDir()
    
    const api = new BungieAPI()
    const manifestInfo = await api.getManifest()
    
    // Create a lightweight manifest with just essential structure
    const manifest = {
      version: manifestInfo.version,
      lastUpdate: new Date().toISOString(),
      currentSeason: getCurrentSeason(),
      // Instead of downloading massive item databases, use placeholder structures
      weapons: getSampleWeapons(),
      armor: getSampleArmor(),
      mods: getSampleMods(),
      subclasses: getSampleSubclasses(),
      seasonalArtifact: await getSeasonalArtifact(),
      itemCategories: {},
      stats: getSampleStats(),
      perks: {}
    }

    // Save to file (if possible)
    try {
      fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2))
      console.log('Manifest saved to file successfully!')
    } catch (error) {
      console.warn('Could not save manifest to file:', error.message)
      console.log('Manifest will be served from memory only')
    }
    
    return manifest
  } catch (error) {
    console.error('Error updating manifest:', error)
    throw error
  }
}

// Sample data functions to avoid downloading massive manifest files
function getSampleWeapons() {
  return {
    // Popular DPS weapons
    1363886209: {
      hash: 1363886209,
      displayProperties: {
        name: "Gjallarhorn",
        description: "Eyes up, Guardian.",
        icon: "/common/destiny2_content/icons/e7ee2173082b8e1067af35498b91aff5.jpg"
      },
      itemType: 'weapon',
      itemTypeDisplayName: 'Rocket Launcher',
      itemSubType: 'rocket_launcher',
      tierType: 6, // Exotic
      damageType: 1, // Solar
      itemCategoryHashes: [4],
      stats: { damage: 95, reload: 40, handling: 50 },
      perks: ['Wolfpack Rounds', 'Pack Hunter']
    },
    4019668921: {
      hash: 4019668921,
      displayProperties: {
        name: "Fatebringer (Timelost)",
        description: "Delivers the inevitable.",
        icon: "/common/destiny2_content/icons/hand_cannon.jpg"
      },
      itemType: 'weapon',
      itemTypeDisplayName: 'Hand Cannon',
      itemSubType: 'hand_cannon',
      tierType: 5, // Legendary
      damageType: 0, // Kinetic
      itemCategoryHashes: [1],
      stats: { damage: 85, reload: 70, handling: 60 },
      perks: ['Firefly', 'Explosive Payload']
    },
    3186018373: {
      hash: 3186018373,
      displayProperties: {
        name: "Osteo Striga",
        description: "Festering wounds fester.",
        icon: "/common/destiny2_content/icons/smg.jpg"
      },
      itemType: 'weapon',
      itemTypeDisplayName: 'Submachine Gun',
      itemSubType: 'submachine_gun',
      tierType: 6, // Exotic
      damageType: 1, // Kinetic
      itemCategoryHashes: [1],
      stats: { damage: 65, reload: 80, handling: 75 },
      perks: ['Toxic Overload']
    }
  }
}

function getSampleArmor() {
  return {
    // Popular exotic armor
    1096015929: {
      hash: 1096015929,
      displayProperties: {
        name: "Nezarec's Sin",
        description: "Abyssal extractors harvest Void traces from surrounding matter.",
        icon: "/common/destiny2_content/icons/warlock_helmet.jpg"
      },
      itemType: 'armor',
      itemTypeDisplayName: 'Helmet',
      classType: 2, // Warlock
      tierType: 6, // Exotic
      itemCategoryHashes: [45], // Helmet
      stats: { mobility: 10, resilience: 15, recovery: 20 }
    },
    1926771907: {
      hash: 1926771907,
      displayProperties: {
        name: "Orpheus Rig",
        description: "Beauty in destruction.",
        icon: "/common/destiny2_content/icons/hunter_legs.jpg"
      },
      itemType: 'armor',
      itemTypeDisplayName: 'Leg Armor',
      classType: 1, // Hunter
      tierType: 6, // Exotic
      itemCategoryHashes: [48], // Legs
      stats: { mobility: 20, resilience: 10, recovery: 15 }
    }
  }
}

function getSampleMods() {
  return {
    // Popular armor mods
    1484685885: {
      hash: 1484685885,
      displayProperties: {
        name: "Font of Might",
        description: "Picking up an elemental well that matches your subclass element grants a temporary bonus to weapon damage.",
        icon: "/common/destiny2_content/icons/mod.jpg"
      },
      itemType: 'mod',
      itemTypeDisplayName: 'Combat Mod',
      energy: 4
    }
  }
}

function getSampleSubclasses() {
  return {
    2453351420: {
      hash: 2453351420,
      displayProperties: {
        name: "Voidwalker",
        description: "Manipulate the forces of the Void.",
        icon: "/common/destiny2_content/icons/subclass_void.jpg"
      },
      damageType: 3, // Void
      classType: 2, // Warlock
      aspects: ['Feed the Void', 'Chaos Accelerant'],
      fragments: ['Echo of Starvation', 'Echo of Instability']
    }
  }
}

function getSampleStats() {
  return {
    392767087: {
      hash: 392767087,
      displayProperties: {
        name: "Resilience",
        description: "Reduces incoming damage from combatants and increases health."
      }
    },
    1943323491: {
      hash: 1943323491,
      displayProperties: {
        name: "Recovery",
        description: "Increases health and shield regeneration speed."
      }
    },
    2996146975: {
      hash: 2996146975,
      displayProperties: {
        name: "Mobility",
        description: "Increases walking speed and maximum jump height."
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