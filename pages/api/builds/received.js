import { jwtVerify } from 'jose'
import GitHubStorageService from '../../../lib/github-storage'

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

export default async function handler(req, res) {
  try {
    // Get session
    const session = await getSessionFromCookie(req)
    
    if (!session?.user) {
      console.log('Received builds API: Authentication failed')
      return res.status(401).json({ error: 'Authentication required' })
    }

    const membershipId = session.user.membershipId

    if (req.method === 'GET') {
      // Get all received builds
      console.log(`Loading received builds for user: ${session.user.displayName}`)

      // Initialize GitHub storage service
      const githubStorage = new GitHubStorageService()
      
      // Get received builds
      const receivedBuilds = await githubStorage.getReceivedBuilds(membershipId)

      // Categorize builds
      const newBuilds = receivedBuilds.filter(build => build.sharing.status === 'sent')
      const viewedBuilds = receivedBuilds.filter(build => build.sharing.status === 'viewed')

      console.log(`Loaded builds for ${session.user.displayName}:`, {
        total: receivedBuilds.length,
        new: newBuilds.length,
        viewed: viewedBuilds.length
      })

      res.status(200).json({
        success: true,
        builds: receivedBuilds,
        summary: {
          total: receivedBuilds.length,
          new: newBuilds.length,
          viewed: viewedBuilds.length
        },
        lastUpdated: new Date().toISOString()
      })

    } else if (req.method === 'POST') {
      // Mark build as viewed or perform other actions
      const { action, buildId } = req.body

      if (!action || !buildId) {
        return res.status(400).json({ 
          error: 'Action and build ID are required' 
        })
      }

      const githubStorage = new GitHubStorageService()

      switch (action) {
        case 'markViewed':
          console.log(`Marking build as viewed: ${buildId} for user ${session.user.displayName}`)
          
          const viewResult = await githubStorage.markBuildAsViewed(membershipId, buildId)
          
          if (!viewResult.success) {
            return res.status(500).json({ 
              error: 'Failed to mark build as viewed',
              details: viewResult.error 
            })
          }

          res.status(200).json({
            success: true,
            message: 'Build marked as viewed',
            buildId
          })
          break

        case 'delete':
          console.log(`Deleting received build: ${buildId} for user ${session.user.displayName}`)
          
          const deleteResult = await githubStorage.deleteBuild(membershipId, buildId, 'received')
          
          if (!deleteResult.success) {
            return res.status(500).json({ 
              error: 'Failed to delete build',
              details: deleteResult.error 
            })
          }

          res.status(200).json({
            success: true,
            message: 'Build deleted successfully',
            buildId
          })
          break

        default:
          return res.status(400).json({ 
            error: `Unknown action: ${action}` 
          })
      }

    } else {
      return res.status(405).json({ error: 'Method not allowed' })
    }

  } catch (error) {
    console.error('Error handling received builds:', error)
    
    // Check for specific GitHub API errors
    if (error.message?.includes('GitHub token not configured')) {
      return res.status(500).json({ 
        error: 'Build sharing not configured. Please contact administrator.',
        code: 'GITHUB_NOT_CONFIGURED'
      })
    }
    
    if (error.message?.includes('API rate limit')) {
      return res.status(429).json({ 
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMITED'
      })
    }
    
    res.status(500).json({ 
      error: 'Failed to load received builds',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'RECEIVED_BUILDS_FAILED'
    })
  }
}