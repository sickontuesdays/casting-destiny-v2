import { EnhancedBuildIntelligence } from '../../lib/destiny-intelligence/enhanced-build-intelligence.js';

let buildIntelligence = null;

// Helper function to get session (adapt this to your auth system)
async function getSessionFromRequest(req) {
  try {
    // If you have a custom auth function, import and use it here
    // For now, return null and handle gracefully
    return null;
  } catch (error) {
    console.warn('Could not get session:', error);
    return null;
  }
}

async function initializeIntelligence() {
  if (!buildIntelligence) {
    try {
      console.log('🧠 Initializing Enhanced Build Intelligence...');
      
      // Initialize with base URL for server-side calls
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      buildIntelligence = new EnhancedBuildIntelligence(baseUrl);
      
      console.log('✅ Enhanced Build Intelligence initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Build Intelligence:', error);
      throw error;
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user session (optional - will work without authentication)
    const session = await getSessionFromRequest(req);
    
    // Initialize intelligence systems if needed
    await initializeIntelligence();

    const { input, preferences = {}, constraints = {} } = req.body;

    if (!input) {
      return res.status(400).json({ error: 'Build input is required' });
    }

    console.log('🏗️ Generating intelligent build for input:', input);
    console.log('📋 Preferences:', preferences);
    console.log('🔒 Constraints:', constraints);

    // Create build request from input and options
    const buildRequest = {
      userInput: input,
      playstyle: preferences.playstyle || 'balanced',
      subclass: preferences.subclass || 'any',
      element: preferences.element || 'any',
      weaponPreferences: preferences.weaponPreferences || [],
      armorPreferences: preferences.armorPreferences || [],
      focusStats: preferences.focusStats || [],
      activities: preferences.activities || ['general'],
      constraints: {
        useInventoryOnly: constraints.useInventoryOnly || false,
        lockedExotic: constraints.lockedExotic || null,
        ...constraints
      }
    };

    // Generate the intelligent build using Enhanced Build Intelligence
    const buildResult = await buildIntelligence.generateBuild(buildRequest);

    if (!buildResult) {
      throw new Error('Build generation returned no result');
    }

    // Calculate build score
    const buildScore = calculateBuildScore(buildResult);

    // Generate recommendations
    const recommendations = generateRecommendations(buildResult, buildRequest);

    // Compile comprehensive response
    const response = {
      success: true,
      analysis: {
        input: input,
        understood: buildRequest,
        confidence: 0.85 // Enhanced system has high confidence
      },
      build: buildResult,
      intelligence: {
        synergies: buildResult.synergies || [],
        conflicts: [], // Enhanced system handles conflicts internally
        optimization: buildResult.recommendations || [],
        alternatives: [] // Could be added in future
      },
      scoring: buildScore,
      recommendations: recommendations,
      metadata: {
        generatedAt: new Date().toISOString(),
        intelligenceVersion: 'Enhanced v2.0',
        userId: session?.user?.id || 'anonymous',
        source: 'bungie-api-only'
      }
    };

    console.log('✅ Build generated successfully:', {
      score: buildScore.overall,
      synergies: buildResult.synergies?.length || 0,
      hasWeapons: !!buildResult.weapons,
      hasArmor: !!buildResult.armor,
      hasSubclass: !!buildResult.subclass
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Error generating intelligent build:', error);
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate intelligent build',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      build: null,
      intelligence: {
        synergies: [],
        conflicts: [],
        optimization: [],
        alternatives: []
      },
      scoring: {
        overall: 0,
        breakdown: {},
        strengths: [],
        weaknesses: [],
        suggestions: []
      }
    });
  }
}

// Helper function to calculate build score
function calculateBuildScore(build) {
  let totalScore = 0;
  const breakdown = {};
  const strengths = [];
  const weaknesses = [];
  const suggestions = [];

  // Score weapons (30% of total)
  let weaponScore = 0;
  let weaponCount = 0;
  
  if (build.weapons) {
    Object.values(build.weapons).forEach(weapon => {
      if (weapon) {
        weaponCount++;
        if (weapon.tier === 6) weaponScore += 25; // Exotic
        else if (weapon.tier === 5) weaponScore += 20; // Legendary
        else weaponScore += 15;
      }
    });
  }
  
  if (weaponCount > 0) {
    weaponScore = (weaponScore / weaponCount) * 0.3;
    breakdown.weapons = weaponScore;
    totalScore += weaponScore;
    
    if (weaponCount === 3) {
      strengths.push('Complete weapon loadout');
    } else {
      weaknesses.push('Missing weapon slots');
      suggestions.push('Consider filling all weapon slots for optimal performance');
    }
  } else {
    breakdown.weapons = 0;
    weaknesses.push('No weapons equipped');
    suggestions.push('Equip weapons to improve build effectiveness');
  }

  // Score armor (40% of total)
  let armorScore = 0;
  let armorCount = 0;
  
  if (build.armor) {
    Object.values(build.armor).forEach(armor => {
      if (armor) {
        armorCount++;
        if (armor.tier === 6) armorScore += 25; // Exotic
        else if (armor.tier === 5) armorScore += 20; // Legendary
        else armorScore += 15;
      }
    });
  }
  
  if (armorCount > 0) {
    armorScore = (armorScore / armorCount) * 0.4;
    breakdown.armor = armorScore;
    totalScore += armorScore;
    
    if (armorCount === 5) {
      strengths.push('Complete armor set');
    } else {
      weaknesses.push('Missing armor pieces');
      suggestions.push('Complete your armor set for better stat distribution');
    }
  } else {
    breakdown.armor = 0;
    weaknesses.push('No armor equipped');
    suggestions.push('Equip armor pieces to improve survivability and stats');
  }

  // Score subclass (20% of total)
  let subclassScore = 0;
  if (build.subclass) {
    subclassScore = 20;
    breakdown.subclass = subclassScore;
    totalScore += subclassScore;
    strengths.push(`${build.subclass.element} subclass configured`);
    
    // Special bonus for Prismatic
    if (build.subclass.element === 'Prismatic') {
      totalScore += 5;
      strengths.push('Using versatile Prismatic subclass');
    }
  } else {
    breakdown.subclass = 0;
    weaknesses.push('No subclass selected');
    suggestions.push('Select a subclass to define your Guardian\'s abilities');
  }

  // Score synergies (10% of total)
  let synergyScore = 0;
  if (build.synergies && build.synergies.length > 0) {
    synergyScore = Math.min(build.synergies.length * 2, 10);
    breakdown.synergies = synergyScore;
    totalScore += synergyScore;
    strengths.push(`${build.synergies.length} synergies identified`);
  } else {
    breakdown.synergies = 0;
    suggestions.push('Look for gear that synergizes with your playstyle');
  }

  // Ensure total score is within 0-100 range
  totalScore = Math.min(Math.max(totalScore, 0), 100);

  return {
    overall: Math.round(totalScore),
    breakdown,
    strengths,
    weaknesses,
    suggestions
  };
}

// Helper function to generate recommendations
function generateRecommendations(build, request) {
  const recommendations = [];

  // Activity-specific recommendations
  if (request.activities.includes('raid')) {
    recommendations.push({
      type: 'tip',
      title: 'Raid Optimization',
      description: 'Consider team synergy, DPS phases, and encounter-specific mechanics',
      priority: 'high'
    });
  }

  if (request.activities.includes('pvp')) {
    recommendations.push({
      type: 'tip',
      title: 'PvP Focus',
      description: 'Prioritize mobility and recovery stats, use weapons with good handling and stability',
      priority: 'high'  
    });
  }

  if (request.activities.includes('grandmaster')) {
    recommendations.push({
      type: 'warning',
      title: 'Grandmaster Nightfall',
      description: 'Focus on survivability, champion mods, and elemental shield coverage',
      priority: 'critical'
    });
  }

  // Element-specific recommendations
  if (build.subclass?.element === 'Prismatic') {
    recommendations.push({
      type: 'tip',
      title: 'Prismatic Mastery',
      description: 'Balance Light and Dark abilities for maximum versatility. Time your Transcendence activation carefully.',
      priority: 'medium'
    });
  }

  // Stat recommendations
  if (request.focusStats?.includes('resilience')) {
    recommendations.push({
      type: 'info',
      title: 'Resilience Focus',
      description: 'High resilience provides damage reduction and faster health regeneration. Aim for 100 resilience in endgame content.',
      priority: 'medium'
    });
  }

  // General build advice
  if (!build.weapons?.kinetic && !build.weapons?.energy) {
    recommendations.push({
      type: 'warning',
      title: 'Missing Primary Weapons',
      description: 'Equip kinetic and energy weapons for consistent damage output',
      priority: 'high'
    });
  }

  return recommendations;
}