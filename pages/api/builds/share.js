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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get session
    const session = await getSessionFromCookie(req)
    
    if (!session?.user) {
      console.log('Build share API: Authentication failed')
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { recipientMembershipId, recipientDisplayName, buildData } = req.body
    
    if (!recipientMembershipId || !buildData) {
      return res.status(400).json({ 
        error: 'Recipient membership ID and build data are required' 
      })
    }

    // Validate build data structure
    if (!buildData.name && !buildData.weapons && !buildData.armor) {
      return res.status(400).json({ 
        error: 'Build must contain at least a name or loadout items' 
      })
    }

    // Don't allow sharing with yourself
    if (session.user.membershipId === recipientMembershipId) {
      return res.status(400).json({ 
        error: 'Cannot share build with yourself' 
      })
    }

    console.log(`Sharing build from ${session.user.displayName} to ${recipientDisplayName}`, {
      buildName: buildData.name,
      sender: session.user.membershipId,
      recipient: recipientMembershipId
    })

    // Initialize GitHub storage service
    const githubStorage = new GitHubStorageService()
    
    // Share the build
    const result = await githubStorage.shareBuild(
      session.user.membershipId,
      session.user.displayName,
      recipientMembershipId,
      buildData
    )

    if (!result.success) {
      return res.status(500).json({ 
        error: 'Failed to share build',
        details: result.error 
      })
    }

    console.log(`Build shared successfully: ${result.buildId}`)

    res.status(200).json({
      success: true,
      buildId: result.buildId,
      message: `Build "${buildData.name || 'Untitled'}" shared with ${recipientDisplayName}`,
      sharedAt: result.sharedBuild.sharing.sharedAt,
      recipient: {
        membershipId: recipientMembershipId,
        displayName: recipientDisplayName
      }
    })

  } catch (error) {
    console.error('Error sharing build:', error)
    
    // Check for specific GitHub API errors
    if (error.message?.includes('GitHub token not configured')) {
      return res.status(500).json({ 
        error: 'Build sharing not configured. Please contact administrator.',
        code: 'GITHUB_NOT_CONFIGURED'
      })
    }
    
    if (error.message?.includes('API rate limit')) {
      return res.status(429).json({ 
        error: 'Too many build shares. Please try again later.',
        code: 'RATE_LIMITED'
      })
    }
    
    res.status(500).json({ 
      error: 'Failed to share build',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'SHARE_FAILED'
    })
  }
}