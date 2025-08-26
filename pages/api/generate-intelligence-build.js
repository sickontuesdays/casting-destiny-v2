// pages/api/generate-intelligence-build.js
// Updated API endpoint using Enhanced Build Intelligence system with GitHub cached manifest

import { getSessionFromRequest } from '../../lib/session-utils'

let buildIntelligence = null
let lastManifestVersion = null

async function initializeIntelligence(manifest) {
  // Only reinitialize if manifest version changed or not initialized
  if (!buildIntelligence || lastManifestVersion !== manifest.version) {
    try {
      console.log('🧠 Initializing Enhanced Build Intelligence...')
      
      // Import the enhanced system
      const { EnhancedBuildIntelligence } = await import('../../lib/destiny-intelligence/enhanced-build-intelligence')
      
      // Create new instance
      buildIntelligence = new EnhancedBuildIntelligence()
      
      // Initialize with manifest data
      await buildIntelligence.initialize(manifest)
      
      lastManifestVersion = manifest.version
      
      console.log('✅ Enhanced Build Intelligence initialized successfully')
      return true
      
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Build Intelligence:', error)
      buildIntelligence = null
      lastManifestVersion = null
      throw error
    }
  }
  
  return true
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get user session (optional - will work without authentication)
    let session = null
    try {
      session = await getSessionFromRequest(req)
    } catch (authError) {
      console.log('No valid session, proceeding with public build generation')
    }
    
    // Load manifest from GitHub cache
    let manifest = null
    try {
      const manifestUrl = `${req.headers.origin || process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/github/get-manifest`
      const manifestResponse = await fetch(manifestUrl)
      
      if (manifestResponse.ok) {
        manifest = await manifestResponse.json()
        console.log('✅ Loaded manifest from GitHub cache')
      } else {
        throw new Error(`GitHub manifest API returned ${manifestResponse.status}`)
      }
    } catch (manifestError) {
      console.error('Failed to load manifest from GitHub:', manifestError.message)
      return res.status(503).json({ 
        error: 'Manifest not available',
        message: 'Please wait for manifest to load or try refreshing the page',
        details: process.env.NODE_ENV === 'development' ? manifestError.message : undefined
      })
    }

    // Initialize intelligence systems with loaded manifest
    await initializeIntelligence(manifest)

    // Extract input data from request
    const { input, preferences, constraints, buildOptions } = req.body

    if (!input || typeof input !== 'string') {
      return res.status(400).json({ 
        error: 'Build input is required',
        receivedKeys: Object.keys(req.body || {}),
        expectedFormat: 'Object with "input" field containing build description'
      })
    }

    console.log(`🏗️ Generating intelligent build for: "${input}"`)

    // Parse the user's natural language input using enhanced system
    let analysis = null
    try {
      analysis = await buildIntelligence.analyzeRequest(input, {
        userPreferences: preferences || {},
        constraints: constraints || {},
        userSession: session
      })
    } catch (parseError) {
      console.error('Request analysis failed:', parseError)
      return res.status(400).json({ 
        error: 'Could not understand build request',
        input,
        details: parseError.message
      })
    }

    if (!analysis || !analysis.success) {
      return res.status(400).json({ 
        error: 'Could not parse build request',
        input,
        analysis: analysis?.error || 'Unknown parsing error'
      })
    }

    console.log('🔍 Request analysis completed:', {
      class: analysis.parsedRequest?.class,
      activity: analysis.parsedRequest?.activity,
      element: analysis.parsedRequest?.element
    })

    // Generate the intelligent build using enhanced system
    const buildResult = await buildIntelligence.generateBuild(analysis.parsedRequest, {
      includeAlternatives: buildOptions?.includeAlternatives !== false,
      detailedAnalysis: buildOptions?.detailedAnalysis !== false,
      optimizationSuggestions: buildOptions?.optimizationSuggestions !== false,
      useInventoryOnly: buildOptions?.useInventoryOnly === true,
      lockedExotic: buildOptions?.lockedExotic || null,
      userSession: session
    })

    if (!buildResult || buildResult.error) {
      console.log('❌ Build generation failed:', buildResult?.error)
      return res.status(400).json({
        error: buildResult?.error || 'Build generation failed',
        input,
        analysis: analysis.parsedRequest
      })
    }

    console.log('✅ Enhanced build generated successfully')

    // Prepare response with enhanced metadata
    const response = {
      success: true,
      build: buildResult,
      analysis: {
        originalInput: input,
        parsedRequest: analysis.parsedRequest,
        confidence: analysis.confidence || 0.8
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        manifestVersion: manifest.version,
        intelligenceVersion: buildIntelligence.version || '2.0.0',
        authenticated: !!session?.user,
        processingTime: Date.now() // Will be updated at end
      }
    }

    // Calculate processing time
    response.metadata.processingTime = `${Date.now() - response.metadata.processingTime}ms`

    // Don't cache personalized builds
    res.setHeader('Cache-Control', 'private, no-cache')
    
    res.status(200).json(response)

  } catch (error) {
    console.error('❌ Intelligence build API error:', error)
    
    res.status(500).json({
      error: 'Internal server error during intelligent build generation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    })
  }
}