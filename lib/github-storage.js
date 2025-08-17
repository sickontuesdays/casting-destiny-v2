// lib/github-storage.js
// GitHub Storage Handler for Manifest Caching

class GitHubStorage {
  constructor() {
    // Using environment variables for GitHub configuration
    this.owner = process.env.GITHUB_OWNER || 'your-github-username'
    this.repo = process.env.GITHUB_REPO || 'casting-destiny-manifest'
    this.branch = process.env.GITHUB_BRANCH || 'main'
    this.token = process.env.GITHUB_TOKEN // Personal access token with repo permissions
    this.manifestPath = 'manifest.json'
    this.metadataPath = 'metadata.json'
  }

  /**
   * Get file content from GitHub
   */
  async getFile(path) {
    try {
      const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}?ref=${this.branch}`
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          ...(this.token && { 'Authorization': `Bearer ${this.token}` })
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null // File doesn't exist
        }
        throw new Error(`GitHub API error: ${response.status}`)
      }

      const data = await response.json()
      
      // Decode base64 content
      const content = Buffer.from(data.content, 'base64').toString('utf-8')
      
      return {
        content: JSON.parse(content),
        sha: data.sha,
        size: data.size
      }
    } catch (error) {
      console.error(`Error fetching ${path} from GitHub:`, error)
      throw error
    }
  }

  /**
   * Save file to GitHub
   */
  async saveFile(path, content, message = 'Update file') {
    if (!this.token) {
      throw new Error('GitHub token is required for saving files')
    }

    try {
      // Get current file (if exists) to get SHA - with fresh fetch
      let sha = null
      try {
        const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}?ref=${this.branch}`
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `Bearer ${this.token}`,
            'Cache-Control': 'no-cache'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          sha = data.sha
        }
      } catch (error) {
        // File doesn't exist, that's ok
        console.log(`File ${path} doesn't exist yet, will create new`)
      }

      const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`
      
      const body = {
        message,
        content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
        branch: this.branch
      }
      
      if (sha) {
        body.sha = sha // Required for updating existing files
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to save to GitHub: ${error}`)
      }

      const result = await response.json()
      console.log(`✅ Saved ${path} to GitHub`)
      
      return result
    } catch (error) {
      console.error(`Error saving ${path} to GitHub:`, error)
      throw error
    }
  }

  /**
   * Load manifest from GitHub
   */
  async loadManifest() {
    try {
      console.log('Loading manifest from GitHub...')
      
      // Try to load both manifest and metadata
      const [manifestData, metadataData] = await Promise.all([
        this.getFile(this.manifestPath),
        this.getFile(this.metadataPath).catch(() => null)
      ])

      if (!manifestData) {
        console.log('No manifest found in GitHub')
        return null
      }

      const manifest = manifestData.content
      const metadata = metadataData?.content || {}

      // Check if manifest is expired (older than 7 days)
      if (metadata.lastUpdated) {
        const age = Date.now() - new Date(metadata.lastUpdated).getTime()
        const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days
        
        if (age > maxAge) {
          console.warn('Manifest is older than 7 days')
          manifest.isStale = true
        }
      }

      console.log(`✅ Loaded manifest from GitHub (version: ${manifest.version})`)
      return manifest

    } catch (error) {
      console.error('Failed to load manifest from GitHub:', error)
      return null
    }
  }

  /**
   * Save manifest to GitHub
   */
  async saveManifest(manifest) {
    try {
      console.log('Saving manifest to GitHub...')
      
      // Save metadata
      const metadata = {
        version: manifest.version,
        lastUpdated: new Date().toISOString(),
        itemCount: manifest.metadata?.itemCount || 0,
        size: JSON.stringify(manifest).length
      }

      // Save both files
      await Promise.all([
        this.saveFile(
          this.manifestPath, 
          manifest, 
          `Update Destiny 2 manifest to version ${manifest.version}`
        ),
        this.saveFile(
          this.metadataPath, 
          metadata, 
          `Update manifest metadata`
        )
      ])

      console.log('✅ Manifest saved to GitHub successfully')
      return true

    } catch (error) {
      console.error('Failed to save manifest to GitHub:', error)
      throw error
    }
  }

  /**
   * Get manifest metadata without downloading full manifest
   */
  async getManifestMetadata() {
    try {
      const metadata = await this.getFile(this.metadataPath)
      return metadata?.content || null
    } catch (error) {
      console.error('Failed to get manifest metadata:', error)
      return null
    }
  }

  /**
   * Setup scheduled update (for automated Tuesday updates)
   */
  async scheduleUpdate() {
    // This would be called by a GitHub Action or external cron job
    // Scheduled for Tuesdays at 1:30 PM EST (18:30 UTC)
    console.log('Manifest update scheduled for Tuesdays at 1:30 PM EST')
    
    // Check if it's Tuesday and time to update
    const now = new Date()
    const day = now.getUTCDay()
    const hour = now.getUTCHours()
    const minute = now.getUTCMinutes()
    
    // Tuesday = 2, 18:30 UTC = 1:30 PM EST
    if (day === 2 && hour === 18 && minute >= 30 && minute < 40) {
      return true // Time to update
    }
    
    return false
  }
}

// Singleton instance
let githubStorage = null

export function getGitHubStorage() {
  if (!githubStorage) {
    githubStorage = new GitHubStorage()
  }
  return githubStorage
}

export default GitHubStorage