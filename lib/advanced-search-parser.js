export const parseAdvancedSearch = (input) => {
  const result = {
    includeKeywords: [],
    excludeKeywords: [],
    exactPhrases: [],
    originalInput: input.trim()
  };

  if (!input || input.trim().length === 0) {
    return result;
  }

  // Regular expression to match:
  // - Quoted phrases: "exact phrase"
  // - Excluded terms: -term
  // - Regular terms: term
  const searchPattern = /"([^"]+)"|(-\w+)|(\w+)/g;
  let match;

  while ((match = searchPattern.exec(input)) !== null) {
    if (match[1]) {
      // Quoted phrase
      result.exactPhrases.push(match[1].toLowerCase());
    } else if (match[2]) {
      // Excluded term (starts with -)
      const excludedTerm = match[2].substring(1).toLowerCase(); // Remove the -
      result.excludeKeywords.push(excludedTerm);
    } else if (match[3]) {
      // Regular term
      result.includeKeywords.push(match[3].toLowerCase());
    }
  }

  // Remove duplicates
  result.includeKeywords = [...new Set(result.includeKeywords)];
  result.excludeKeywords = [...new Set(result.excludeKeywords)];
  result.exactPhrases = [...new Set(result.exactPhrases)];

  return result;
};

// Enhanced keyword processing that respects the parsed search
export const processAdvancedKeywords = (parsedSearch) => {
  const expandedKeywords = new Set();
  
  // Process include keywords with existing expansion logic
  parsedSearch.includeKeywords.forEach(keyword => {
    expandedKeywords.add(keyword);
    
    // Check for exact matches in keyword mappings (from your existing code)
    Object.entries(KEYWORD_MAPPINGS).forEach(([key, values]) => {
      if (key.includes(keyword) || keyword.includes(key)) {
        values.forEach(value => expandedKeywords.add(value));
      }
    });
  });

  return {
    include: Array.from(expandedKeywords),
    exclude: parsedSearch.excludeKeywords,
    exactPhrases: parsedSearch.exactPhrases
  };
};

// Enhanced item matching function
export const findAdvancedSynergisticItems = (parsedKeywords, destinyData) => {
  const results = [];
  const { inventoryItems } = destinyData;
  
  Object.values(inventoryItems).forEach(item => {
    if (!item.displayProperties?.name || !item.displayProperties?.description) {
      return;
    }
    
    const itemName = item.displayProperties.name.toLowerCase();
    const itemDescription = item.displayProperties.description.toLowerCase();
    const itemText = `${itemName} ${itemDescription}`;
    
    // Check exclusions first - if any excluded term is found, skip this item
    const hasExcludedTerm = parsedKeywords.exclude.some(excludeKeyword => 
      itemText.includes(excludeKeyword)
    );
    
    if (hasExcludedTerm) {
      return; // Skip this item
    }
    
    // Check for exact phrases
    const exactPhraseMatches = parsedKeywords.exactPhrases.filter(phrase => 
      itemText.includes(phrase)
    );
    
    // Check for include keywords
    const keywordMatches = parsedKeywords.include.filter(keyword => 
      itemText.includes(keyword)
    );
    
    const totalMatches = [...exactPhraseMatches, ...keywordMatches];
    
    // Only include items that have at least one match (and no exclusions)
    if (totalMatches.length > 0) {
      // Determine item type (your existing logic)
      let itemType = 'Unknown';
      if (item.itemCategoryHashes) {
        if (item.itemCategoryHashes.includes(20)) itemType = 'Armor';
        if (item.itemCategoryHashes.includes(1)) itemType = 'Weapon';
        if (item.itemCategoryHashes.includes(59)) itemType = 'Mod';
      }
      
      if (item.inventory?.tierTypeName === 'Exotic' || item.itemTypeDisplayName === 'Exotic') {
        itemType = `Exotic ${itemType}`;
      }
      
      // Calculate enhanced synergy score
      let synergyScore = 0;
      
      // Exact phrases get higher weight
      synergyScore += exactPhraseMatches.length * 20;
      
      // Regular keyword matches
      synergyScore += keywordMatches.length * 10;
      
      // Bonus for multiple different types of matches
      if (exactPhraseMatches.length > 0 && keywordMatches.length > 0) {
        synergyScore += 15;
      }
      
      results.push({
        hash: item.hash,
        name: item.displayProperties.name,
        description: item.displayProperties.description,
        type: itemType,
        icon: item.displayProperties.icon,
        matchedKeywords: keywordMatches,
        matchedPhrases: exactPhraseMatches,
        synergyScore: Math.min(Math.round(synergyScore), 100),
        rarity: item.inventory?.tierTypeName || 'Common'
      });
    }
  });
  
  return results.sort((a, b) => b.synergyScore - a.synergyScore);
};

// Import your existing KEYWORD_MAPPINGS
const KEYWORD_MAPPINGS = {
  // Your existing keyword mappings from destiny-data.js
  'grenade': ['grenade', 'explosive', 'blast', 'throw'],
  'constant grenades': ['grenade', 'energy', 'recharge', 'cooldown', 'refresh'],
  'grenade energy': ['grenade', 'energy', 'recharge', 'ability'],
  'reload': ['reload', 'magazine', 'ammunition', 'rounds'],
  'never reload': ['reload', 'magazine', 'auto-loading', 'feeding', 'reserves'],
  'auto reload': ['auto-loading', 'feeding', 'reload'],
  'super': ['super', 'ultimate', 'light', 'darkness'],
  'fast super': ['super', 'energy', 'recharge', 'cooldown', 'intellect'],
  'super energy': ['super', 'energy', 'orbs', 'light'],
  'melee': ['melee', 'punch', 'strike', 'martial'],
  'melee damage': ['melee', 'damage', 'strength', 'martial'],
  'healing': ['healing', 'health', 'recovery', 'regeneration', 'restore'],
  'health': ['health', 'healing', 'recovery', 'life'],
  'recovery': ['recovery', 'healing', 'health', 'regeneration'],
  'invisibility': ['invisibility', 'stealth', 'vanish', 'cloak'],
  'stealth': ['stealth', 'invisibility', 'vanish', 'hidden'],
  'void': ['void', 'purple', 'darkness'],
  'solar': ['solar', 'fire', 'burn', 'ignite'],
  'arc': ['arc', 'electric', 'shock', 'lightning'],
  'stasis': ['stasis', 'freeze', 'slow', 'crystal'],
  'strand': ['strand', 'suspend', 'sever', 'unravel'],
  'auto rifle': ['auto', 'rifle', 'automatic'],
  'hand cannon': ['hand', 'cannon', 'pistol'],
  'scout rifle': ['scout', 'rifle'],
  'pulse rifle': ['pulse', 'rifle'],
  'shotgun': ['shotgun', 'close', 'spread'],
  'sniper': ['sniper', 'rifle', 'precision', 'long'],
  'rocket': ['rocket', 'launcher', 'explosive'],
  'sword': ['sword', 'blade', 'melee', 'heavy'],
};
