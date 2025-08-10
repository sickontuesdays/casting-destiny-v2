import { BuildIntelligence } from '../../lib/destiny-intelligence/build-intelligence'
import { IntelligentManifestProcessor } from '../../lib/intelligent-manifest-processor'
import { EnhancedBuildScorer } from '../../lib/enhanced-build-scorer'
import { getSessionFromRequest } from '../../lib/auth-config'

let buildIntelligence = null;
let manifestProcessor = null;
let buildScorer = null;

async function initializeIntelligence() {
  if (!buildIntelligence) {
    try {
      // Initialize manifest processor
      manifestProcessor = new IntelligentManifestProcessor();
      
      // Get manifest data (you may need to adjust this based on your manifest loading)
      const manifestResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/manifest`);
      const manifestData = await manifestResponse.json();
      
      // Process manifest with intelligence
      const processedManifest = await manifestProcessor.processManifest(manifestData, {
        categories: ['weapons', 'armor', 'mods', 'subclasses'],
        includeDescriptions: true
      });

      // Initialize build intelligence
      buildIntelligence = new BuildIntelligence();
      await buildIntelligence.initialize(processedManifest);

      // Initialize enhanced build scorer
      buildScorer = new EnhancedBuildScorer();
      await buildScorer.initialize(processedManifest, buildIntelligence);

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
    // Get user session
    const session = await getSessionFromRequest(req);
    
    // Initialize intelligence system if needed
    await initializeIntelligence();

    const { request, lockedExotic, useInventoryOnly, sessionId } = req.body;

    if (!request || typeof request !== 'string') {
      return res.status(400).json({ error: 'Build request is required' });
    }

    // Validate request length
    if (request.length > 1000) {
      return res.status(400).json({ error: 'Build request too long' });
    }

    // Generate intelligent build
    const startTime = Date.now();
    
    const buildOptions = {
      lockedExotic: lockedExotic || null,
      useInventoryOnly: useInventoryOnly || false,
      userSession: session,
      includeAnalysis: true,
      maxAlternatives: 3,
      optimizationLevel: 'comprehensive'
    };

    // Step 1: Analyze the request
    const requestAnalysis = await buildIntelligence.analyzeRequest(request, {
      includeKeywords: true,
      includeSynergies: true,
      includeStatPriorities: true,
      includeActivityType: true
    });

    // Step 2: Generate the optimal build
    const intelligentBuild = await buildIntelligence.generateOptimalBuild(request, buildOptions);

    // Step 3: Enhanced scoring and analysis
    const enhancedScore = await buildScorer.scoreBuild(intelligentBuild.build, {
      request: request,
      analysis: requestAnalysis,
      includeAlternatives: true,
      includeOptimizations: true
    });

    // Step 4: Generate build alternatives
    const alternatives = await buildIntelligence.generateBuildAlternatives(
      intelligentBuild.build, 
      requestAnalysis, 
      { maxAlternatives: 3 }
    );

    // Step 5: Compile comprehensive response
    const response = {
      success: true,
      build: intelligentBuild.build,
      analysis: {
        request: requestAnalysis,
        intelligence: intelligentBuild.analysis,
        scoring: enhancedScore,
        processingTime: Date.now() - startTime
      },
      alternatives: alternatives,
      metadata: {
        generatedAt: new Date().toISOString(),
        intelligenceVersion: '1.0.0',
        processingTime: Date.now() - startTime,
        optimizationLevel: buildOptions.optimizationLevel
      },
      recommendations: {
        improvements: enhancedScore.recommendations || [],
        synergies: requestAnalysis.detectedSynergies || [],
        warnings: enhancedScore.warnings || []
      }
    };

    // Log successful generation
    console.log(`Intelligent build generated successfully in ${Date.now() - startTime}ms`);
    console.log(`Request: "${request.substring(0, 50)}..."`);
    console.log(`Score: ${enhancedScore.totalScore}`);

    res.status(200).json(response);

  } catch (error) {
    console.error('Error generating intelligent build:', error);

    // Provide helpful error responses
    let errorMessage = 'Failed to generate build';
    let statusCode = 500;

    if (error.message.includes('manifest')) {
      errorMessage = 'Manifest data unavailable. Please try again later.';
      statusCode = 503;
    } else if (error.message.includes('parsing')) {
      errorMessage = 'Could not understand the build request. Please try rephrasing.';
      statusCode = 400;
    } else if (error.message.includes('items')) {
      errorMessage = 'Could not find suitable items for this build. Try a different approach.';
      statusCode = 404;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      suggestions: [
        'Try being more specific about the activity type (PVP, PVE, raids)',
        'Specify which exotic armor piece you want to use',
        'Mention specific stats you want to prioritize',
        'Include the subclass element you prefer'
      ]
    });
  }
}

// Helper function to warm up the intelligence system
export async function warmUpIntelligence() {
  try {
    await initializeIntelligence();
    return true;
  } catch (error) {
    console.error('Failed to warm up intelligence system:', error);
    return false;
  }
}

// Export the initialization function for use in other API routes
export { initializeIntelligence };