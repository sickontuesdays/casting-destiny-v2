import { EnhancedBuildIntelligence } from '../../../lib/destiny-intelligence/enhanced-build-intelligence.js';

let buildIntelligenceInstance = null;

// Initialize the Enhanced Build Intelligence system once
async function getIntelligenceInstance() {
  if (!buildIntelligenceInstance) {
    console.log('🧠 Initializing Enhanced Build Intelligence...');
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    buildIntelligenceInstance = new EnhancedBuildIntelligence(baseUrl);
    console.log('✅ Enhanced Build Intelligence initialized');
  }
  return buildIntelligenceInstance;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const intelligence = await getIntelligenceInstance();
    
    // Extract build request parameters
    const {
      userInput,
      playstyle = 'balanced',
      subclass = 'any',
      element = 'any',
      weaponPreferences = [],
      armorPreferences = [],
      focusStats = [],
      activities = ['general'],
      constraints = {}
    } = req.body;

    // Validate required input
    if (!userInput) {
      return res.status(400).json({ 
        success: false,
        error: 'User input is required for build generation',
        example: 'Try: "solar warlock build for raids with high recovery"'
      });
    }

    console.log('🏗️ Generating build for input:', userInput);
    console.log('🎯 Parameters:', {
      playstyle,
      element,
      activities: activities.join(', '),
      focusStats: focusStats.join(', ')
    });

    // Create comprehensive build request
    const buildRequest = {
      userInput,
      playstyle,
      subclass,
      element,
      weaponPreferences,
      armorPreferences,
      focusStats,
      activities,
      constraints: {
        useInventoryOnly: constraints.useInventoryOnly || false,
        lockedExotic: constraints.lockedExotic || null,
        maxTierType: constraints.maxTierType || 6, // Allow up to Exotic
        minTierType: constraints.minTierType || 3, // Minimum Rare
        ...constraints
      }
    };

    // Generate the build using Enhanced Build Intelligence
    const buildResult = await intelligence.generateBuild(buildRequest);

    if (!buildResult) {
      throw new Error('Build generation returned empty result');
    }

    // Calculate additional metrics
    const buildMetrics = calculateBuildMetrics(buildResult);
    
    // Generate comprehensive response
    const response = {
      success: true,
      data: {
        build: buildResult,
        metrics: buildMetrics,
        request: {
          input: userInput,
          parsedParameters: {
            playstyle,
            element,
            activities,
            focusStats
          }
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          version: '2.0-enhanced',
          source: 'bungie-api-only',
          processingTime: buildMetrics.processingTime || 'unknown'
        }
      }
    };

    console.log('✅ Build generated successfully:', {
      hasWeapons: !!(buildResult.weapons?.kinetic || buildResult.weapons?.energy || buildResult.weapons?.power),
      hasArmor: !!(buildResult.armor?.helmet || buildResult.armor?.arms || buildResult.armor?.chest),
      hasSubclass: !!buildResult.subclass,
      synergies: buildResult.synergies?.length || 0,
      recommendations: buildResult.recommendations?.length || 0,
      score: buildMetrics.overallScore
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Error in build generation:', error);
    
    // Detailed error response for debugging
    const errorResponse = {
      success: false,
      error: 'Build generation failed',
      details: {
        message: error.message,
        type: error.name || 'UnknownError',
        timestamp: new Date().toISOString()
      }
    };

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details.stack = error.stack;
    }

    // Return appropriate status code based on error type
    let statusCode = 500;
    if (error.message.includes('manifest') || error.message.includes('inventory')) {
      statusCode = 503; // Service unavailable
    } else if (error.message.includes('invalid') || error.message.includes('required')) {
      statusCode = 400; // Bad request
    }

    res.status(statusCode).json(errorResponse);
  }
}

// Helper function to calculate build metrics and scores
function calculateBuildMetrics(build) {
  const startTime = Date.now();
  
  let overallScore = 0;
  const categoryScores = {};
  const strengths = [];
  const weaknesses = [];
  const suggestions = [];

  // Weapons scoring (35% of total)
  const weaponScore = scoreWeapons(build.weapons);
  categoryScores.weapons = weaponScore.score;
  overallScore += weaponScore.score * 0.35;
  strengths.push(...weaponScore.strengths);
  weaknesses.push(...weaponScore.weaknesses);
  suggestions.push(...weaponScore.suggestions);

  // Armor scoring (35% of total)
  const armorScore = scoreArmor(build.armor);
  categoryScores.armor = armorScore.score;
  overallScore += armorScore.score * 0.35;
  strengths.push(...armorScore.strengths);
  weaknesses.push(...armorScore.weaknesses);
  suggestions.push(...armorScore.suggestions);

  // Subclass scoring (20% of total)
  const subclassScore = scoreSubclass(build.subclass);
  categoryScores.subclass = subclassScore.score;
  overallScore += subclassScore.score * 0.20;
  strengths.push(...subclassScore.strengths);
  weaknesses.push(...subclassScore.weaknesses);
  suggestions.push(...subclassScore.suggestions);

  // Synergy bonus (10% of total)
  const synergyScore = scoreSynergies(build.synergies);
  categoryScores.synergies = synergyScore.score;
  overallScore += synergyScore.score * 0.10;
  strengths.push(...synergyScore.strengths);
  suggestions.push(...synergyScore.suggestions);

  // Stats analysis
  const statsAnalysis = analyzeStats(build.stats);
  
  const processingTime = Date.now() - startTime;

  return {
    overallScore: Math.min(Math.max(Math.round(overallScore), 0), 100),
    categoryScores,
    strengths,
    weaknesses,
    suggestions,
    statsAnalysis,
    processingTime: `${processingTime}ms`,
    completeness: calculateCompleteness(build)
  };
}

function scoreWeapons(weapons) {
  let score = 0;
  const strengths = [];
  const weaknesses = [];
  const suggestions = [];

  if (!weapons) {
    return {
      score: 0,
      strengths: [],
      weaknesses: ['No weapon data available'],
      suggestions: ['Equip weapons to improve build effectiveness']
    };
  }

  const weaponSlots = ['kinetic', 'energy', 'power'];
  let equippedCount = 0;
  let exoticCount = 0;
  let elementCoverage = new Set();

  weaponSlots.forEach(slot => {
    const weapon = weapons[slot];
    if (weapon) {
      equippedCount++;
      score += 20; // Base score for having a weapon
      
      // Bonus for tier
      if (weapon.tier === 6) { // Exotic
        score += 10;
        exoticCount++;
      } else if (weapon.tier === 5) { // Legendary
        score += 5;
      }
      
      // Track element coverage
      if (weapon.element && weapon.element !== 'Kinetic') {
        elementCoverage.add(weapon.element);
      }
    }
  });

  // Completeness bonus
  if (equippedCount === 3) {
    score += 20;
    strengths.push('Complete weapon loadout');
  } else {
    weaknesses.push(`Missing ${3 - equippedCount} weapon slot(s)`);
    suggestions.push('Fill all weapon slots for optimal performance');
  }

  // Element coverage bonus
  if (elementCoverage.size >= 2) {
    score += 10;
    strengths.push('Good elemental coverage');
  } else if (elementCoverage.size === 1) {
    suggestions.push('Consider adding weapons with different elements');
  }

  // Exotic weapon bonus/warning
  if (exoticCount === 1) {
    strengths.push('One exotic weapon equipped');
  } else if (exoticCount > 1) {
    weaknesses.push('Cannot equip multiple exotic weapons');
    suggestions.push('Choose one exotic weapon and replace others with legendary alternatives');
    score -= 20; // Penalty for impossible loadout
  }

  return {
    score: Math.min(Math.max(score, 0), 100),
    strengths,
    weaknesses,
    suggestions
  };
}

function scoreArmor(armor) {
  let score = 0;
  const strengths = [];
  const weaknesses = [];
  const suggestions = [];

  if (!armor) {
    return {
      score: 0,
      strengths: [],
      weaknesses: ['No armor data available'],
      suggestions: ['Equip armor pieces to improve survivability']
    };
  }

  const armorSlots = ['helmet', 'arms', 'chest', 'legs', 'class'];
  let equippedCount = 0;
  let exoticCount = 0;
  let totalStats = 0;

  armorSlots.forEach(slot => {
    const piece = armor[slot];
    if (piece) {
      equippedCount++;
      score += 15; // Base score for having armor
      
      // Bonus for tier
      if (piece.tier === 6) { // Exotic
        score += 10;
        exoticCount++;
      } else if (piece.tier === 5) { // Legendary
        score += 5;
      }
      
      // Add stats if available
      if (piece.stats) {
        const pieceStats = piece.stats.reduce((sum, stat) => sum + (stat.value || 0), 0);
        totalStats += pieceStats;
      }
    }
  });

  // Completeness bonus
  if (equippedCount === 5) {
    score += 25;
    strengths.push('Complete armor set');
  } else {
    weaknesses.push(`Missing ${5 - equippedCount} armor piece(s)`);
    suggestions.push('Complete armor set for better stats and protection');
  }

  // Stats bonus
  if (totalStats > 300) {
    score += 15;
    strengths.push('High stat total');
  } else if (totalStats > 200) {
    score += 10;
    strengths.push('Good stat total');
  }

  // Exotic armor bonus/warning
  if (exoticCount === 1) {
    strengths.push('One exotic armor piece equipped');
  } else if (exoticCount > 1) {
    weaknesses.push('Cannot equip multiple exotic armor pieces');
    suggestions.push('Choose one exotic armor piece and replace others with legendary alternatives');
    score -= 25; // Penalty for impossible loadout
  }

  return {
    score: Math.min(Math.max(score, 0), 100),
    strengths,
    weaknesses,
    suggestions
  };
}

function scoreSubclass(subclass) {
  let score = 0;
  const strengths = [];
  const weaknesses = [];
  const suggestions = [];

  if (!subclass) {
    return {
      score: 0,
      strengths: [],
      weaknesses: ['No subclass selected'],
      suggestions: ['Select a subclass to define your abilities and playstyle']
    };
  }

  // Base score for having a subclass
  score += 60;
  
  if (subclass.element) {
    score += 20;
    strengths.push(`${subclass.element} subclass selected`);
    
    // Special bonus for Prismatic
    if (subclass.element === 'Prismatic') {
      score += 20;
      strengths.push('Using versatile Prismatic subclass');
      suggestions.push('Balance Light and Dark abilities for maximum effectiveness');
    }
  }

  // Bonus for having abilities defined
  if (subclass.abilities && subclass.abilities.length > 0) {
    score += 20;
    strengths.push('Subclass abilities configured');
  }

  return {
    score: Math.min(Math.max(score, 0), 100),
    strengths,
    weaknesses,
    suggestions
  };
}

function scoreSynergies(synergies) {
  let score = 0;
  const strengths = [];
  const suggestions = [];

  if (!synergies || synergies.length === 0) {
    return {
      score: 0,
      strengths: [],
      suggestions: ['Look for gear combinations that work well together']
    };
  }

  // Score based on number of synergies
  score = Math.min(synergies.length * 15, 100);
  
  if (synergies.length >= 3) {
    strengths.push(`${synergies.length} powerful synergies identified`);
  } else if (synergies.length >= 1) {
    strengths.push(`${synergies.length} synergy identified`);
    suggestions.push('Look for additional gear that complements your current setup');
  }

  return {
    score,
    strengths,
    suggestions
  };
}

function analyzeStats(stats) {
  if (!stats) {
    return {
      summary: 'No stat data available',
      highStats: [],
      lowStats: [],
      recommendations: []
    };
  }

  const highStats = [];
  const lowStats = [];
  const recommendations = [];

  // Analyze each stat (this would need to be adapted based on actual stats structure)
  Object.entries(stats).forEach(([statName, value]) => {
    if (typeof value === 'number') {
      if (value >= 80) {
        highStats.push(statName);
      } else if (value <= 30) {
        lowStats.push(statName);
        recommendations.push(`Consider improving ${statName} for better performance`);
      }
    }
  });

  return {
    summary: `${highStats.length} high stats, ${lowStats.length} low stats`,
    highStats,
    lowStats,
    recommendations
  };
}

function calculateCompleteness(build) {
  let totalSlots = 0;
  let filledSlots = 0;

  // Count weapon slots
  const weaponSlots = ['kinetic', 'energy', 'power'];
  totalSlots += weaponSlots.length;
  if (build.weapons) {
    filledSlots += weaponSlots.filter(slot => build.weapons[slot]).length;
  }

  // Count armor slots
  const armorSlots = ['helmet', 'arms', 'chest', 'legs', 'class'];
  totalSlots += armorSlots.length;
  if (build.armor) {
    filledSlots += armorSlots.filter(slot => build.armor[slot]).length;
  }

  // Add subclass
  totalSlots += 1;
  if (build.subclass) {
    filledSlots += 1;
  }

  const percentage = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

  return {
    percentage,
    filledSlots,
    totalSlots,
    missing: totalSlots - filledSlots
  };
}