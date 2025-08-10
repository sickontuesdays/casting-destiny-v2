import { BuildIntelligence } from '../../lib/destiny-intelligence/build-intelligence'
import { IntelligentManifestProcessor } from '../../lib/intelligent-manifest-processor'
import { EnhancedBuildScorer } from '../../lib/enhanced-build-scorer'

let buildIntelligence = null;
let manifestProcessor = null;
let buildScorer = null;

// Helper function to get session (adapt this to your auth system)
async function getSessionFromRequest(req) {
  try {
    // If you have a custom auth function, import and use it here
    // For now, return null and handle gracefully
    return null
  } catch (error) {
    console.warn('Could not get session:', error)
    return null
  }
}

async function initializeIntelligence() {
  if (!buildIntelligence) {
    try {
      // Initialize manifest processor
      manifestProcessor = new IntelligentManifestProcessor();
      
      // Get manifest data - use the manifest API endpoint
      const manifestResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/bungie/manifest`)
      if (!manifestResponse.ok) {
        throw new Error(`Failed to fetch manifest: ${manifestResponse.status}`)
      }
      const manifestData = await manifestResponse.json()
      
      // Initialize build intelligence
      buildIntelligence = new BuildIntelligence();
      await buildIntelligence.initialize(manifestData);

      // Initialize enhanced build scorer
      buildScorer = new EnhancedBuildScorer();
      await buildScorer.initialize(manifestData, buildIntelligence);

      console.log('Intelligence system initialized successfully');
    } catch (error) {
      console.error('Failed to initialize intelligence system:', error);
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

    const { input, preferences, constraints } = req.body;

    if (!input) {
      return res.status(400).json({ error: 'Build input is required' });
    }

    console.log('Generating intelligent build for input:', input);

    // Parse the user's natural language input
    const analysis = await buildIntelligence.analyzeRequest(input, {
      userPreferences: preferences,
      constraints: constraints
    });

    if (!analysis.success) {
      return res.status(400).json({ 
        error: 'Could not understand build request',
        details: analysis.error
      });
    }

    // Generate the intelligent build
    const buildResult = await buildIntelligence.generateBuild(analysis.parsedRequest, {
      includeAlternatives: true,
      detailedAnalysis: true,
      optimizationSuggestions: true
    });

    // Enhanced scoring and analysis
    const scoring = await buildScorer.scoreBuild(buildResult.build, {
      includeBreakdown: true,
      suggestOptimizations: true
    });

    // Compile comprehensive response
    const response = {
      success: true,
      analysis: {
        input: input,
        understood: analysis.parsedRequest,
        confidence: analysis.confidence
      },
      build: buildResult.build,
      intelligence: {
        synergies: buildResult.synergies,
        conflicts: buildResult.conflicts,
        optimization: buildResult.optimization,
        alternatives: buildResult.alternatives
      },
      scoring: {
        overall: scoring.totalScore,
        breakdown: scoring.breakdown,
        strengths: scoring.strengths,
        weaknesses: scoring.weaknesses,
        suggestions: scoring.suggestions
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        intelligenceVersion: buildIntelligence.getVersion(),
        userId: session?.user?.id || 'anonymous'
      }
    };

    console.log('Build generated successfully:', {
      score: scoring.totalScore,
      synergies: buildResult.synergies?.length || 0,
      alternatives: buildResult.alternatives?.length || 0
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error generating intelligent build:', error);
    
    res.status(500).json({ 
      error: 'Failed to generate intelligent build',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}