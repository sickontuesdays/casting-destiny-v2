import { jwtVerify } from 'jose'
import BuildManager from '../../../lib/build-manager'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)

async function getSessionFromCookie(req) {
  try {
    // Use correct cookie name (bungie_session with underscore)
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get session
    const session = await getSessionFromCookie(req)
    
    if (!session?.user) {
      console.log('Build save API: Authentication failed - no session or user')
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { build } = req.body
    
    if (!build) {
      return res.status(400).json({ error: 'Build data is required' })
    }

    // Validate build structure
    if (!build.items || typeof build.items !== 'object') {
      return res.status(400).json({ error: 'Invalid build structure: items required' })
    }

    const userId = session.user.membershipId
    const buildManager = new BuildManager()
    
    // Save the build
    const result = await buildManager.saveBuild(userId, build)
    
    if (!result.success) {
      return res.status(500).json({ 
        error: 'Failed to save build',
        details: result.error 
      })
    }

    console.log(`Build saved successfully: ${result.buildId} for user ${session.user.displayName}`)

    res.status(200).json({
      success: true,
      buildId: result.buildId,
      build: result.build,
      message: 'Build saved successfully'
    })

  } catch (error) {
    console.error('Error saving build:', error)
    res.status(500).json({ 
      error: 'Failed to save build',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}