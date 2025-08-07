import { getSession } from 'next-auth/react'
import fs from 'fs'
import path from 'path'

const BUILDS_DIR = path.join(process.cwd(), 'data', 'builds')

// Ensure builds directory exists
if (!fs.existsSync(BUILDS_DIR)) {
  fs.mkdirSync(BUILDS_DIR, { recursive: true })
}

export default async function handler(req, res) {
  const session = await getSession({ req })
  
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const userId = session.bungieMembershipId
  const userBuildsFile = path.join(BUILDS_DIR, `${userId}.json`)

  if (req.method === 'GET') {
    try {
      if (fs.existsSync(userBuildsFile)) {
        const builds = JSON.parse(fs.readFileSync(userBuildsFile, 'utf8'))
        res.status(200).json(builds)
      } else {
        res.status(200).json([])
      }
    } catch (error) {
      console.error('Error loading builds:', error)
      res.status(500).json({ error: 'Failed to load builds' })
    }
  } else if (req.method === 'POST') {
    try {
      const { build, name, description } = req.body
      
      let builds = []
      if (fs.existsSync(userBuildsFile)) {
        builds = JSON.parse(fs.readFileSync(userBuildsFile, 'utf8'))
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
      fs.writeFileSync(userBuildsFile, JSON.stringify(builds, null, 2))
      
      res.status(201).json({ success: true, build: newBuild })
    } catch (error) {
      console.error('Error saving build:', error)
      res.status(500).json({ error: 'Failed to save build' })
    }
  } else if (req.method === 'DELETE') {
    try {
      const { buildId } = req.body
      
      if (!fs.existsSync(userBuildsFile)) {
        return res.status(404).json({ error: 'No builds found' })
      }

      let builds = JSON.parse(fs.readFileSync(userBuildsFile, 'utf8'))
      builds = builds.filter(build => build.id !== buildId)
      
      fs.writeFileSync(userBuildsFile, JSON.stringify(builds, null, 2))
      res.status(200).json({ success: true })
    } catch (error) {
      console.error('Error deleting build:', error)
      res.status(500).json({ error: 'Failed to delete build' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}