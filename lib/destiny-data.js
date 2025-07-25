export const KEYWORD_MAPPINGS = {
  // Grenade related
  'grenade': ['grenade', 'explosive', 'blast', 'throw'],
  'constant grenades': ['grenade', 'energy', 'recharge', 'cooldown', 'refresh'],
  'grenade energy': ['grenade', 'energy', 'recharge', 'ability'],
  
  // Reload related
  'reload': ['reload', 'magazine', 'ammunition', 'rounds'],
  'never reload': ['reload', 'magazine', 'auto-loading', 'feeding', 'reserves'],
  'auto reload': ['auto-loading', 'feeding', 'reload'],
  
  // Super related
  'super': ['super', 'ultimate', 'light', 'darkness'],
  'fast super': ['super', 'energy', 'recharge', 'cooldown', 'intellect'],
  'super energy': ['super', 'energy', 'orbs', 'light'],
  
  // Melee related
  'melee': ['melee', 'punch', 'strike', 'martial'],
  'melee damage': ['melee', 'damage', 'strength', 'martial'],
  
  // Healing/Recovery
  'healing': ['healing', 'health', 'recovery', 'regeneration', 'restore'],
  'health': ['health', 'healing', 'recovery', 'life'],
  'recovery': ['recovery', 'healing', 'health', 'regeneration'],
  
  // Invisibility
  'invisibility': ['invisibility', 'stealth', 'vanish', 'cloak'],
  'stealth': ['stealth', 'invisibility', 'vanish', 'hidden'],
  
  // Damage types
  'void': ['void', 'purple', 'darkness'],
  'solar': ['solar', 'fire', 'burn', 'ignite'],
  'arc': ['arc', 'electric', 'shock', 'lightning'],
  'stasis': ['stasis', 'freeze', 'slow', 'crystal'],
  'strand': ['strand', 'suspend', 'sever', 'unravel'],
  
  // Weapon types
  'auto rifle': ['auto', 'rifle', 'automatic'],
  'hand cannon': ['hand', 'cannon', 'pistol'],
  'scout rifle': ['scout', 'rifle'],
  'pulse rifle': ['pulse', 'rifle'],
  'shotgun': ['shotgun', 'close', 'spread'],
  'sniper': ['sniper', 'rifle', 'precision', 'long'],
  'rocket': ['rocket', 'launcher', 'explosive'],
  'sword': ['sword', 'blade', 'melee', 'heavy'],
};

export const processKeywords = (input) => {
  const keywords = input.toLowerCase().split(/[,\s]+/).filter(k => k.length > 2);
  const expandedKeywords = new Set();
  
  keywords.forEach(keyword => {
    expandedKeywords.add(keyword);
    
    // Check for exact matches in keyword mappings
    Object.entries(KEYWORD_MAPPINGS).forEach(([key, values]) => {
      if (key.includes(keyword) || keyword.includes(key)) {
        values.forEach(value => expandedKeywords.add(value));
      }
    });
  });
  
  return Array.from(expandedKeywords);
};
