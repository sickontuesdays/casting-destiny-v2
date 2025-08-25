// lib/icon-utils.js
// Utility functions for handling icons from Bungie's API only

/**
 * Get a proper icon URL from Bungie, with fallbacks
 * @param {string} iconPath - The icon path from manifest (e.g. "/common/destiny2_content/icons/...")
 * @param {string} fallbackType - Type of fallback needed ('weapon', 'armor', 'element', 'empty')
 * @returns {string} Full Bungie CDN URL or CSS-based fallback
 */
export function getBungieIconUrl(iconPath, fallbackType = 'empty') {
  // If we have a proper icon path, use Bungie's CDN
  if (iconPath && iconPath.startsWith('/')) {
    return `https://www.bungie.net${iconPath}`
  }
  
  // Fallback to default Bungie icons for different types
  const fallbackIcons = {
    weapon: '/common/destiny2_content/icons/default_weapon_icon.png',
    armor: '/common/destiny2_content/icons/default_armor_icon.png', 
    kinetic: '/common/destiny2_content/icons/kinetic_damage_type.png',
    solar: '/common/destiny2_content/icons/solar_damage_type.png',
    arc: '/common/destiny2_content/icons/arc_damage_type.png',
    void: '/common/destiny2_content/icons/void_damage_type.png',
    stasis: '/common/destiny2_content/icons/stasis_damage_type.png',
    strand: '/common/destiny2_content/icons/strand_damage_type.png',
    prismatic: '/common/destiny2_content/icons/prismatic_damage_type.png',
    empty: '/common/destiny2_content/icons/empty_slot.png'
  }
  
  const fallbackPath = fallbackIcons[fallbackType] || fallbackIcons.empty
  return `https://www.bungie.net${fallbackPath}`
}

/**
 * Get element icon from damage type
 * @param {number} damageType - Damage type number from Bungie API
 * @returns {string} Element icon URL
 */
export function getElementIcon(damageType) {
  // Bungie damage type mappings
  const damageTypeMap = {
    1: 'kinetic',   // Kinetic
    2: 'arc',       // Arc  
    3: 'solar',     // Solar
    4: 'stasis',    // Stasis (was introduced later)
    5: 'strand',    // Strand
    6: 'void',      // Void
    7: 'prismatic'  // Prismatic (theoretical - might need verification)
  }
  
  const elementType = damageTypeMap[damageType] || 'kinetic'
  return getBungieIconUrl(null, elementType)
}

/**
 * Get weapon type icon fallback
 * @param {string} weaponType - Weapon type name
 * @returns {string} Weapon icon URL  
 */
export function getWeaponTypeIcon(weaponType) {
  // These would ideally come from manifest's DestinyInventoryItemDefinition
  // For now, use generic weapon icon
  return getBungieIconUrl(null, 'weapon')
}

/**
 * Get armor slot icon fallback  
 * @param {string} armorSlot - Armor slot name (helmet, arms, etc)
 * @returns {string} Armor icon URL
 */
export function getArmorSlotIcon(armorSlot) {
  // These would ideally come from manifest's bucket type definitions
  // For now, use generic armor icon  
  return getBungieIconUrl(null, 'armor')
}

/**
 * Create a CSS-based fallback icon (data URL)
 * @param {string} type - Icon type for styling
 * @param {string} text - Text to display in icon
 * @returns {string} Data URL for CSS icon
 */
export function createCSSIcon(type, text = '?') {
  const colors = {
    solar: '#FF6B35',
    arc: '#7EC8E3', 
    void: '#8E24AA',
    strand: '#1B5E20',
    stasis: '#37474F',
    prismatic: 'linear-gradient(45deg, #FF6B35, #7EC8E3, #8E24AA, #1B5E20)',
    kinetic: '#F5F5F5',
    empty: '#666666',
    weapon: '#FFA726',
    armor: '#66BB6A'
  }
  
  const bgColor = colors[type] || colors.empty
  const textColor = type === 'kinetic' ? '#333' : '#fff'
  
  // Create SVG data URL
  const svg = `
    <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${type === 'prismatic' ? `
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#FF6B35"/>
            <stop offset="33%" style="stop-color:#7EC8E3"/>
            <stop offset="66%" style="stop-color:#8E24AA"/>
            <stop offset="100%" style="stop-color:#1B5E20"/>
          </linearGradient>
        ` : ''}
      </defs>
      <rect width="64" height="64" rx="8" 
            fill="${type === 'prismatic' ? 'url(#grad)' : bgColor}" 
            stroke="#333" stroke-width="1"/>
      <text x="32" y="40" text-anchor="middle" 
            font-family="Arial, sans-serif" font-size="24" font-weight="bold" 
            fill="${textColor}">${text}</text>
    </svg>
  `.replace(/\s+/g, ' ').trim()
  
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

/**
 * Get element icon with proper fallback
 * @param {string} element - Element name (solar, arc, void, etc)
 * @returns {string} Icon URL
 */
export function getElementIconByName(element) {
  if (!element) return createCSSIcon('empty', '⭕')
  
  const elementLower = element.toLowerCase()
  
  // Try to use Bungie's element icons first
  const bungieIcon = getBungieIconUrl(null, elementLower)
  
  // If that fails, create CSS fallback
  const elementEmojis = {
    solar: '☀️',
    arc: '⚡',
    void: '🌌', 
    strand: '🕸️',
    stasis: '❄️',
    prismatic: '🔮',
    kinetic: '🎯'
  }
  
  const emoji = elementEmojis[elementLower] || '❓'
  return createCSSIcon(elementLower, emoji)
}

/**
 * Handle item icon with proper fallbacks
 * @param {object} item - Item object from manifest
 * @returns {string} Icon URL
 */
export function getItemIcon(item) {
  // First priority: Use item's display properties icon
  if (item?.displayProperties?.icon) {
    return getBungieIconUrl(item.displayProperties.icon)
  }
  
  // Second priority: Use damage type for weapons
  if (item?.defaultDamageType && item?.itemType === 3) {
    return getElementIcon(item.defaultDamageType)
  }
  
  // Third priority: Use item type fallbacks
  if (item?.itemType === 3) { // Weapon
    return getBungieIconUrl(null, 'weapon')
  }
  
  if (item?.itemType === 2) { // Armor  
    return getBungieIconUrl(null, 'armor')
  }
  
  // Final fallback: Empty slot
  return createCSSIcon('empty', '⭕')
}

/**
 * Preload critical icons to avoid 404s
 * @param {Array} iconPaths - Array of icon paths to preload
 */
export function preloadBungieIcons(iconPaths) {
  if (typeof window === 'undefined') return // Server-side
  
  iconPaths.forEach(iconPath => {
    if (!iconPath) return
    
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = getBungieIconUrl(iconPath)
    
    // Optional: Add to cache or handle errors
    img.onerror = () => {
      console.warn(`Failed to preload icon: ${iconPath}`)
    }
  })
}

/**
 * Get a complete set of element icons for preloading
 * @returns {Array} Array of element icon URLs
 */
export function getAllElementIcons() {
  const elements = ['solar', 'arc', 'void', 'strand', 'stasis', 'prismatic', 'kinetic']
  return elements.map(element => getElementIconByName(element))
}

// Export individual functions for specific use cases
export const IconUtils = {
  getBungieIconUrl,
  getElementIcon,
  getElementIconByName,
  getItemIcon,
  createCSSIcon,
  preloadBungieIcons,
  getAllElementIcons
}

export default IconUtils