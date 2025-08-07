import fs from 'fs'
import path from 'path'

// Use /tmp directory in serverless environment, local data directory otherwise
const BUILDS_DIR = process.env.VERCEL ? '/tmp/builds' : path.join(process.cwd(), 'data', 'builds')

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

// Helper function to get session from cookie
function getSessionFromCookie(req) {
  try {
    const cookies = req.headers.cookie || ''
    const sessionCookie = cookies.split(';').find(cookie => cookie.trim().startsWith('bungie_session='))
    
    if (!sessionCookie) return null
    
    const sessionData = sessionCookie.split('=')[1]
    const decodedSession = JSON.parse(Buffer.from(sessionData, 'base64').toString())
    
    // Check if session is still valid
    if (decodedSession.expiresAt > Date.now()) {
      return decodedSession
    }
    
    return null
  } catch (error) {
    console.error('Error parsing session cookie:', error)
    return null
  }
}

export default async function handler(req, res) {
  const session = getSessionFromCookie(req)
  
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const userId = session.user.bungieMembershipId
  const userBuildsFile = path.join(BUILDS_DIR, `${userId}.json`)

  if (req.method === 'GET') {
    try {
      ensureBuildsDir()
      
      if (fs.existsSync(userBuildsFile)) {
        const builds = JSON.parse(fs.readFileSync(userBuildsFile, 'utf8'))
        res.status(200).json(builds)
      } else {
        res.status(200).json([])
      }
    } catch (error) {
      console.error('Error loading builds:', error)
      // Return empty array if file operations fail
      res.status(200).json([])
    }
  } else if (req.method === 'POST') {
    try {
      ensureBuildsDir()
      
      const { build, name, description } = req.body
      
      let builds = []
      try {
        if (fs.existsSync(userBuildsFile)) {
          builds = JSON.parse(fs.readFileSync(userBuildsFile, 'utf8'))
        }
      } catch (error) {
        console.warn('Could not read existing builds:', error.message)
        builds = []
      }

      const newBuild = {
        id: Date.now().toString(),
        name,
        description,
        build,
        createdAt: new Date().toISOString(),
        season: build.seasonalArtifact?.season || 'Unknown'
      }

      builds.push(newBuild)
      
      try {
        fs.writeFileSync(userBuildsFile, JSON.stringify(builds, null, 2))
      } catch (error) {
        console.warn('Could not save build to file:', error.message)
        // In serverless environment, we can't persist data between requests
        // So we'll just return success but note that it won't persist
      }
      
      res.status(201).json({ 
        success: true, 
        build: newBuild,
        note: process.env.VERCEL ? 'Build saved temporarily (will not persist between sessions)' : undefined
      })
    } catch (error) {
      console.error('Error saving build:', error)
      res.status(500).json({ error: 'Failed to save build' })
    }
  } else if (req.method === 'DELETE') {
    try {
      ensureBuildsDir()
      
      const { buildId } = req.body
      
      if (!fs.existsSync(userBuildsFile)) {
        return res.status(404).json({ error: 'No builds found' })
      }

      try {
        let builds = JSON.parse(fs.readFileSync(userBuildsFile, 'utf8'))
        builds = builds.filter(build => build.id !== buildId)
        
        fs.writeFileSync(userBuildsFile, JSON.stringify(builds, null, 2))
        res.status(200).json({ success: true })
      } catch (error) {
        console.warn('Could not delete build from file:', error.message)
        res.status(200).json({ 
          success: true,
          note: 'Build deletion may not persist between sessions'
        })
      }
    } catch (error) {
      console.error('Error deleting build:', error)
      res.status(500).json({ error: 'Failed to delete build' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}