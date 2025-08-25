// pages/api/inventory/exotics.js
// Get exotic items from Bungie API only - no local fallbacks

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { class: classType, type } = req.query
    
    console.log('Loading exotic items from Bungie API:', {
      classType,
      type
    })

    // Get absolute URL for server-side API calls  
    const baseUrl = req.headers['x-forwarded-host']
      ? `https://${req.headers['x-forwarded-host']}`
      : process.env.NEXTAUTH_URL || 'http://localhost:3000'

    // Load manifest from Bungie API
    const manifestResponse = await fetch(`${baseUrl}/api/bungie/manifest`, {
      headers: {
        'X-API-Key': process.env.BUNGIE_API_KEY
      }
    })

    if (!manifestResponse.ok) {
      throw new Error(`Failed to load manifest: ${manifestResponse.status}`)
    }

    const manifest = await manifestResponse.json()
    const items = manifest.data?.DestinyInventoryItemDefinition || {}

    if (!items || Object.keys(items).length === 0) {
      console.warn('No items found in manifest')
      return res.status(200).json({
        weapons: [],
        armor: []
      })
    }

    // Filter for exotic items only
    const exotics = Object.values(items).filter(item => {
      if (!item || !item.displayProperties?.name) return false
      if (item.redacted) return false
      if (item.inventory?.tierType !== 6) return false // 6 = Exotic

      // Filter by item type (armor or weapons)
      const isArmor = item.itemType === 2
      const isWeapon = item.itemType === 3
      
      if (type === 'armor' && !isArmor) return false
      if (type === 'weapons' && !isWeapon) return false
      if (!isArmor && !isWeapon) return false

      // Filter by class type for armor
      if (isArmor && classType && classType !== 'any') {
        const classMapping = {
          'titan': 0,
          'hunter': 1, 
          'warlock': 2
        }
        
        // Class type 3 means "any class can use"
        if (item.classType !== 3 && item.classType !== classMapping[classType]) {
          return false
        }
      }

      return true
    })

    // Separate into armor and weapons
    const exoticArmor = exotics.filter(item => item.itemType === 2)
    const exoticWeapons = exotics.filter(item => item.itemType === 3)

    // Format exotic armor by slot
    const armorBySlot = {
      helmet: [],
      arms: [],
      chest: [],
      legs: [],
      classItem: []
    }

    const bucketToSlot = {
      3448274439: 'helmet',
      3551918588: 'arms',
      14239492: 'chest',
      20886954: 'legs',
      1585787867: 'classItem'
    }

    exoticArmor.forEach(armor => {
      const slot = bucketToSlot[armor.inventory?.bucketTypeHash]
      if (slot) {
        armorBySlot[slot].push({
          hash: armor.hash,
          name: armor.displayProperties.name,
          description: armor.displayProperties.description || '',
          icon: armor.displayProperties.icon ? `https://www.bungie.net${armor.displayProperties.icon}` : null,
          classType: armor.classType,
          classTypeName: armor.classType === 0 ? 'Titan' : armor.classType === 1 ? 'Hunter' : armor.classType === 2 ? 'Warlock' : 'Any',
          slot: slot,
          bucketTypeHash: armor.inventory.bucketTypeHash,
          intrinsicPerk: armor.perks?.[0] || null,
          stats: armor.investmentStats?.reduce((acc, stat) => {
            acc[stat.statTypeHash] = stat.value
            return acc
          }, {}) || {}
        })
      }
    })

    // Format exotic weapons by damage type and slot
    const weaponsBySlot = {
      kinetic: [],
      energy: [],
      power: []
    }

    const bucketToWeaponSlot = {
      1498876634: 'kinetic',
      2465295065: 'energy', 
      953998645: 'power'
    }

    exoticWeapons.forEach(weapon => {
      const slot = bucketToWeaponSlot[weapon.inventory?.bucketTypeHash]
      if (slot) {
        weaponsBySlot[slot].push({
          hash: weapon.hash,
          name: weapon.displayProperties.name,
          description: weapon.displayProperties.description || '',
          icon: weapon.displayProperties.icon ? `https://www.bungie.net${weapon.displayProperties.icon}` : null,
          slot: slot,
          bucketTypeHash: weapon.inventory.bucketTypeHash,
          weaponType: weapon.itemSubType,
          damageType: weapon.defaultDamageType,
          damageTypeName: weapon.defaultDamageType === 1 ? 'Kinetic' : weapon.defaultDamageType === 2 ? 'Arc' : weapon.defaultDamageType === 3 ? 'Solar' : weapon.defaultDamageType === 6 ? 'Void' : weapon.defaultDamageType === 4 ? 'Stasis' : weapon.defaultDamageType === 5 ? 'Strand' : 'Unknown',
          intrinsicPerk: weapon.perks?.[0] || null,
          stats: weapon.investmentStats?.reduce((acc, stat) => {
            acc[stat.statTypeHash] = stat.value
            return acc
          }, {}) || {}
        })
      }
    })

    const response = {
      armor: armorBySlot,
      weapons: weaponsBySlot,
      totals: {
        armor: exoticArmor.length,
        weapons: exoticWeapons.length,
        total: exotics.length
      },
      classFilter: classType || 'all',
      typeFilter: type || 'all',
      source: 'bungie-api'
    }

    console.log(`Found ${response.totals.total} exotic items from Bungie manifest:`, {
      armor: response.totals.armor,
      weapons: response.totals.weapons,
      classFilter: classType,
      typeFilter: type
    })

    // Cache for 1 hour
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.status(200).json(response)

  } catch (error) {
    console.error('Error loading exotics:', error)
    res.status(500).json({ 
      error: 'Failed to load exotic items from Bungie API',
      details: error.message,
      note: 'This endpoint only uses Bungie API data - no local fallbacks'
    })
  }
}