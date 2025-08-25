// pages/api/builds/generate.js
// API endpoint for generating builds using the Enhanced Build Intelligence System

import { jwtVerify } from 'jose'
import EnhancedBuildIntelligence from '../../../lib/destiny-intelligence/enhanced-build-intelligence'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)

async function getSessionFromCookie(req) {
  try {
    const sessionCookie = req.cookies['bungie_session']
    if (!sessionCookie) return null

    const { payload } = await jwtVerify(sessionCookie, secret)
    
    if (payload.expiresAt && Date.now() > payload.expiresAt) {
      return null
    }

    return payload
  } catch (error) {
    console.error('Session verification failed:', error)
    return null
  }
}

// Initialize the build intelligence system (singleton)
let buildIntelligence = null

async function getBuildIntelligence(session) {
  if (!buildIntelligence) {
    buildIntelligence = new EnhancedBuildIntelligence()
    await buildIntelligence.initialize(session)
  } else if (!buildIntelligence.initialized) {
    await buildIntelligence.initialize(session)
  }
  return buildIntelligence
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get session
    const session = await getSessionFromCookie(req)
    
    if (!session?.user) {
      console.log('Build generation API: Authentication failed')
      return res.status(401).json({ error: 'Authentication required' })
    }

    const {
      request,
      useInventoryOnly = true,
      maxBuilds = 10,
      lockedExotic = null,
      preferredSubclass = null,
      activityType = 'general_pve',
      continuationToken = null
    } = req.body

    // Validate request
    if (!request || typeof request !== 'string' || request.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Build request description is required' 
      })
    }

    if (maxBuilds < 1 || maxBuilds > 20) {
      return res.status(400).json({ 
        error: 'Max builds must be between 1 and 20' 
      })
    }

    console.log(`Generating builds for user: ${session.user.displayName}`, {
      request: request.substring(0, 100),
      useInventoryOnly,
      maxBuilds,
      activityType,
      hasLockedExotic: !!lockedExotic,
      preferredSubclass
    })

    // Get or initialize the build intelligence system
    const bis = await getBuildIntelligence(session)

    // If useInventoryOnly is true, reload user inventory to ensure freshness
    if (useInventoryOnly) {
      await bis.loadUserInventory(session)
    }

    // Generate builds
    const builds = await bis.generateBuilds(request, {
      useInventoryOnly,
      maxBuilds,
      lockedExotic,
      preferredSubclass,
      activityType,
      session,
      continuationToken
    })

    // Validate builds were generated
    if (!builds || builds.length === 0) {
      return res.status(404).json({
        error: 'No builds could be generated with the specified criteria',
        suggestions: [
          'Try using less restrictive requirements',
          'Enable "Use all game items" if using inventory only',
          'Check that you have sufficient items in your inventory'
        ]
      })
    }

    // Generate continuation token for "Load More" functionality
    const newContinuationToken = Buffer.from(JSON.stringify({
      request,
      timestamp: Date.now(),
      offset: builds.length,
      seed: Math.random()
    })).toString('base64')

    // Prepare response
    const response = {
      success: true,
      builds: builds.map((build, index) => ({
        ...build,
        id: `${session.user.membershipId}_${Date.now()}_${index}`,
        generatedFor: session.user.displayName,
        canSave: true,
        canShare: true
      })),
      metadata: {
        totalGenerated: builds.length,
        request: request.substring(0, 200),
        activityType,
        useInventoryOnly,
        hasMoreBuilds: builds.length === maxBuilds,
        continuationToken: newContinuationToken,
        generatedAt: new Date().toISOString()
      },
      performance: {
        generationTimeMs: Date.now() - (req.startTime || Date.now()),
        intelligenceVersion: '2.0.0'
      }
    }

    // Cache for 1 minute to reduce repeated calculations
    res.setHeader('Cache-Control', 'private, max-age=60')
    
    console.log(`Successfully generated ${builds.length} builds for ${session.user.displayName}`)
    
    res.status(200).json(response)

  } catch (error) {
    console.error('Error generating builds:', error)
    
    // Provide specific error messages
    if (error.message?.includes('inventory')) {
      return res.status(503).json({ 
        error: 'Failed to load inventory. Please try again.',
        code: 'INVENTORY_ERROR'
      })
    }
    
    if (error.message?.includes('manifest')) {
      return res.status(503).json({ 
        error: 'Game data is currently unavailable. Please try again later.',
        code: 'MANIFEST_ERROR'
      })
    }
    
    res.status(500).json({ 
      error: 'Failed to generate builds',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'GENERATION_FAILED'
    })
  }
}

// Middleware to track request timing
export function middleware(req) {
  req.startTime = Date.now()
}