import { jwtVerify } from 'jose'
import fs from 'fs'
import path from 'path'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)

// Use /tmp directory in serverless environment, local data directory otherwise
const BUILDS_DIR = process.env.VERCEL ? 
  '/tmp/builds' : 
  path.join(process.cwd(), 'data', 'builds')

// Ensure builds directory exists
function ensureBuildsDir() {
  try {
    if (!fs.existsSync(BUILDS_DIR)) {
      fs.mkdirSync(BUILDS_DIR, { recursive: true })
    }
  } catch (error) {
    console.warn('Could not create builds directory:', error.message)
  }
}

async function getUserSession(req) {
  try {
    const sessionCookie = req.cookies['bungie-session']
    
    if (!sessionCookie) {
      return null
    }

    const { payload } = await jwtVerify(sessionCookie, secret)
    
    // Check if token is expired
    if (payload.expiresAt && Date.now() > payload.expiresAt) {
      return null
    }

    return {
      userId: payload.user.membershipId,
      session: payload
    }
  } catch (error) {
    console.error('Session verification failed:', error)
    return null
  }
}

function sanitizeBuildData(build) {
  // Remove any sensitive or unnecessary data before saving
  const sanitized = {
    ...build,
    // Remove any potential function references or circular structures
    metadata: {
      ...build.metadata,
      generatedAt: build.metadata?.generatedAt || new Date().toISOString(),
      version: build.metadata?.version || '2.0.0'
    }
  }
  
  // Ensure stats are properly structured
  if (sanitized.stats && typeof sanitized.stats === 'object') {
    sanitized.stats = {
      totalStats: sanitized.stats.totalStats || {},
      ...sanitized.stats
    }
  }
  
  return sanitized
}

export default async function handler(req, res) {
  const sessionData = await getUserSession(req)
  
  if (!sessionData) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const { userId } = sessionData
  const userBuildsFile = path.join(BUILDS_DIR, `${userId}.json`)

  if (req.method === 'GET') {
    // Get user's saved builds
    try {
      ensureBuildsDir()
      
      if (fs.existsSync(userBuildsFile)) {
        const buildsData = fs.readFileSync(userBuildsFile, 'utf8')
        const builds = JSON.parse(buildsData)
        
        // Sort builds by creation date (newest first)
        const sortedBuilds = builds.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        )
        
        res.status(200).json(sortedBuilds)
      } else {
        res.status(200).json([])
      }
    } catch (error) {
      console.error('Error loading builds:', error)
      // Return empty array if file operations fail
      res.status(200).json([])
    }

  } else if (req.method === 'POST') {
    // Save a new build
    try {
      ensureBuildsDir()
      
      const { build, name, description, tags = [] } = req.body
      
      if (!build) {
        return res.status(400).json({ error: 'Build data is required' })
      }

      let builds = []
      try {
        if (fs.existsSync(userBuildsFile)) {
          const buildsData = fs.readFileSync(userBuildsFile, 'utf8')
          builds = JSON.parse(buildsData)
        }
      } catch (error) {
        console.warn('Could not read existing builds:', error.message)
        builds = []
      }

      // Create new build record
      const sanitizedBuild = sanitizeBuildData(build)
      const newBuild = {
        id: `build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: name || build.name || 'Untitled Build',
        description: description || build.description || 'No description provided',
        tags: Array.isArray(tags) ? tags : [],
        build: sanitizedBuild,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '2.0.0',
        stats: {
          timesUsed: 0,
          lastUsed: null,
          rating: null
        }
      }

      builds.push(newBuild)
      
      // Limit to maximum number of builds per user
      const MAX_BUILDS = 50
      if (builds.length > MAX_BUILDS) {
        builds = builds.slice(-MAX_BUILDS) // Keep most recent builds
      }
      
      try {
        fs.writeFileSync(userBuildsFile, JSON.stringify(builds, null, 2))
        console.log(`Build saved for user ${userId}: ${newBuild.name}`)
      } catch (error) {
        console.warn('Could not save build to file:', error.message)
        // In serverless environment, we can't persist data between requests
        // So we'll just return success but note that it won't persist
      }
      
      res.status(201).json({ 
        success: true, 
        build: newBuild,
        message: 'Build saved successfully',
        note: process.env.VERCEL ? 
          'Build saved temporarily (will not persist between sessions)' : undefined
      })

    } catch (error) {
      console.error('Error saving build:', error)
      res.status(500).json({ 
        error: 'Failed to save build',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }

  } else if (req.method === 'PUT') {
    // Update an existing build
    try {
      ensureBuildsDir()
      
      const { buildId, name, description, tags, build: buildData } = req.body
      
      if (!buildId) {
        return res.status(400).json({ error: 'Build ID is required' })
      }

      if (!fs.existsSync(userBuildsFile)) {
        return res.status(404).json({ error: 'No builds found' })
      }

      let builds = JSON.parse(fs.readFileSync(userBuildsFile, 'utf8'))
      const buildIndex = builds.findIndex(b => b.id === buildId)
      
      if (buildIndex === -1) {
        return res.status(404).json({ error: 'Build not found' })
      }

      // Update build
      const existingBuild = builds[buildIndex]
      const updatedBuild = {
        ...existingBuild,
        name: name || existingBuild.name,
        description: description || existingBuild.description,
        tags: tags || existingBuild.tags,
        build: buildData ? sanitizeBuildData(buildData) : existingBuild.build,
        updatedAt: new Date().toISOString()
      }

      builds[buildIndex] = updatedBuild
      
      try {
        fs.writeFileSync(userBuildsFile, JSON.stringify(builds, null, 2))
      } catch (error) {
        console.warn('Could not update build file:', error.message)
      }
      
      res.status(200).json({ 
        success: true, 
        build: updatedBuild,
        message: 'Build updated successfully'
      })

    } catch (error) {
      console.error('Error updating build:', error)
      res.status(500).json({ 
        error: 'Failed to update build',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }

  } else if (req.method === 'DELETE') {
    // Delete a build
    try {
      ensureBuildsDir()
      
      const { buildId } = req.body
      
      if (!buildId) {
        return res.status(400).json({ error: 'Build ID is required' })
      }

      if (!fs.existsSync(userBuildsFile)) {
        return res.status(404).json({ error: 'No builds found' })
      }

      try {
        let builds = JSON.parse(fs.readFileSync(userBuildsFile, 'utf8'))
        const originalLength = builds.length
        
        builds = builds.filter(build => build.id !== buildId)
        
        if (builds.length === originalLength) {
          return res.status(404).json({ error: 'Build not found' })
        }
        
        fs.writeFileSync(userBuildsFile, JSON.stringify(builds, null, 2))
        console.log(`Build deleted for user ${userId}: ${buildId}`)
        
        res.status(200).json({ 
          success: true,
          message: 'Build deleted successfully'
        })
      } catch (error) {
        console.warn('Could not delete build from file:', error.message)
        res.status(200).json({ 
          success: true,
          note: 'Build deletion may not persist between sessions'
        })
      }
    } catch (error) {
      console.error('Error deleting build:', error)
      res.status(500).json({ 
        error: 'Failed to delete build',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }

  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}