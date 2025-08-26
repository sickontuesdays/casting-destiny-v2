// pages/api/builds/generate.js
// API endpoint for build generation - handles both local and remote generation

import { getSessionFromRequest } from '../../../lib/session-utils'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('📝 Build generation API called')
    console.log('Request body:', req.body)

    // Get user session (optional - build generation can work without auth)
    let session = null
    try {
      session = await getSessionFromRequest(req)
    } catch (error) {
      console.log('No valid session, proceeding with public build generation')
    }

    // Handle different input formats from frontend
    let userInput = null
    let buildOptions = {}

    // Check various possible input formats
    if (typeof req.body === 'string') {
      // Direct string input
      userInput = req.body
    } else if (req.body.userInput) {
      // Structured input with userInput field
      userInput = req.body.userInput
      buildOptions = req.body.buildOptions || req.body.options || {}
    } else if (req.body.input) {
      // Alternative structure with input field
      userInput = req.body.input
      buildOptions = req.body.preferences || req.body.options || {}
    } else if (req.body.buildRequest) {
      // BuildCreator format
      userInput = req.body.buildRequest
      buildOptions = req.body.buildOptions || {}
    } else {
      // Try to extract from any field that looks like user input
      const possibleInputs = [req.body.description, req.body.request, req.body.query, req.body.text]
      userInput = possibleInputs.find(input => input && typeof input === 'string')
    }

    if (!userInput || typeof userInput !== 'string') {
      console.log('❌ No valid user input found in request')
      return res.status(400).json({ 
        error: 'User input is required for build generation',
        receivedBody: process.env.NODE_ENV === 'development' ? req.body : undefined,
        expectedFormat: 'String input or object with userInput/input/buildRequest field'
      })
    }

    console.log(`🏗️ Generating build for: "${userInput}"`)
    console.log('Build options:', buildOptions)

    // Load manifest from GitHub cache (same as frontend does)
    let manifest = null
    try {
      const manifestResponse = await fetch(`${req.headers.origin}/api/github/get-manifest`)
      if (manifestResponse.ok) {
        manifest = await manifestResponse.json()
        console.log('✅ Loaded manifest from GitHub cache')
      } else {
        throw new Error('GitHub manifest not available')
      }
    } catch (manifestError) {
      console.log('⚠️ Could not load GitHub manifest, using minimal fallback')
      // Proceed without manifest - will generate basic build
    }

    // Import and initialize build intelligence
    const { EnhancedBuildIntelligence } = await import('../../../lib/destiny-intelligence/enhanced-build-intelligence')
    
    const buildIntelligence = new EnhancedBuildIntelligence()
    
    if (manifest) {
      await buildIntelligence.initialize(manifest)
    } else {
      // Initialize with minimal data structure
      await buildIntelligence.initialize({
        data: {
          DestinyInventoryItemDefinition: {},
          DestinyStatDefinition: {},
          DestinyClassDefinition: {},
          DestinyDamageTypeDefinition: {}
        },
        version: 'fallback',
        metadata: { source: 'fallback' }
      })
    }

    // Generate the build
    const result = await buildIntelligence.generateBuild(userInput, {
      includeAlternatives: buildOptions.includeAlternatives !== false,
      detailedAnalysis: buildOptions.detailedAnalysis !== false,
      optimizationSuggestions: buildOptions.optimizationSuggestions !== false,
      useInventoryOnly: buildOptions.useInventoryOnly === true,
      lockedExotic: buildOptions.lockedExotic || null,
      userSession: session // Pass session for inventory access if needed
    })

    if (!result || result.error) {
      console.log('❌ Build generation failed:', result?.error)
      return res.status(400).json({
        error: result?.error || 'Build generation failed',
        input: userInput
      })
    }

    console.log('✅ Build generated successfully')

    // Add metadata about generation
    const responseData = {
      ...result,
      metadata: {
        ...result.metadata,
        generatedAt: new Date().toISOString(),
        userInput,
        buildOptions,
        hasManifest: !!manifest,
        authenticated: !!session?.user
      }
    }

    // Don't cache build generations as they can be personalized
    res.setHeader('Cache-Control', 'private, no-cache')
    
    res.status(200).json(responseData)

  } catch (error) {
    console.error('❌ Build generation API error:', error)
    
    res.status(500).json({
      error: 'Internal server error during build generation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    })
  }
}