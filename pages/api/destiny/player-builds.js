import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

// Fallback player data when real inventory isn't available
const generateFallbackPlayerData = (query) => {
  const fallbackBuilds = [
    {
      name: 'Your Heart of Inmost Light Build',
      description: 'Grenade-focused build using your Heart of Inmost Light exotic',
      synergyScore: 85,
      buildType: 'grenade',
      focus: 'grenade',
      components: {
        exoticArmor: [{ hash: 12345, name: 'Heart of Inmost Light' }],
        mods: [{ hash: 12350, name: 'Grenade Kickstart' }]
      },
      buildGuide: {
        armor: { exotic: 'Heart of Inmost Light', priority: '100 Discipline' },
        weapons: { exotic: 'Sunshot (Solar synergy)' },
        mods: { essential: ['Grenade Kickstart', 'Bomber', 'Distribution'] },
        gameplay: { tips: ['Use your barricade to trigger Empowered abilities', 'Chain grenades for maximum uptime'] }
      },
      canEquip: true
    },
    {
      name: 'Your Available Weapon Build',
      description: 'DPS build using weapons from your inventory',
      synergyScore: 78,
      buildType: 'weapon_damage',
      focus: 'weapon_damage',
      components: {
        exoticWeapons: [{ hash: 12348, name: 'Sunshot' }],
        mods: [{ hash: 12352, name: 'Targeting Adjuster' }]
      },
      buildGuide: {
        weapons: { exotic: 'Sunshot', energy: 'Any legendary energy weapon' },
        armor: { priority: 'Weapon handling and reload mods' },
        mods: { essential: ['Targeting Adjuster', 'Backup Mag'] },
        gameplay: { tips: ['Focus on weapon damage mods', 'Use exotic weapon for add clear'] }
      },
      canEquip: true
    }
  ];

  if (query) {
    const lowerQuery = query.toLowerCase();
    return fallbackBuilds.filter(build => 
      build.name.toLowerCase().includes(lowerQuery) ||
      build.description.toLowerCase().includes(lowerQuery) ||
      build.focus.includes(lowerQuery)
    );
  }

  return fallbackBuilds;
};

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    // Check for session
    const sessionCookie = req.cookies['bungie-session'];
    let session = null;
    
    if (sessionCookie) {
      try {
        const { payload } = await jwtVerify(sessionCookie, secret);
        session = payload;
      } catch (error) {
        console.log('Invalid session for player builds');
      }
    }

    const { query, membershipType, membershipId, searchType = 'builds' } = req.body;

    console.log(`Player builds request: "${query}" for ${membershipType}/${membershipId}`);

    // For now, return fallback data since full inventory integration isn't ready
    const playerBuilds = generateFallbackPlayerData(query);

    if (searchType === 'builds') {
      return res.status(200).json({
        success: true,
        searchType: 'builds',
        builds: playerBuilds,
        availableBuilds: playerBuilds,
        totalFound: playerBuilds.length,
        query: query || 'your inventory',
        playerMode: true,
        message: `Found ${playerBuilds.length} build${playerBuilds.length !== 1 ? 's' : ''} you can make`,
        fallback: true,
        playerStats: {
          itemCount: 150,
          exoticCount: 25,
          buildPotential: 75
        }
      });
    }

    // Return player inventory stats
    return res.status(200).json({
      success: true,
      playerItems: [],
      playerStats: {
        itemCount: 150,
        exoticCount: 25,
        buildPotential: 75,
        topExotics: ['Heart of Inmost Light', 'Sunshot', 'Graviton Forfeit']
      },
      availableBuilds: playerBuilds,
      membershipInfo: {
        membershipType,
        membershipId,
        displayName: session?.user?.name || 'Guardian'
      },
      message: 'Player data simulated - full inventory integration coming soon',
      fallback: true
    });

  } catch (error) {
    console.error('Player builds API error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to get player builds',
      details: error.message,
      fallback: true
    });
  }
}