// lib/github-storage.js
// Service for storing build sharing data and manifest caching in GitHub repository

class GitHubStorageService {
  constructor() {
    this.owner = process.env.GITHUB_REPO_OWNER || 'your-username'
    this.repo = process.env.GITHUB_REPO_NAME || 'casting-destiny-v2' 
    this.token = process.env.GITHUB_TOKEN
    this.baseUrl = 'https://api.github.com'
    this.basePath = 'data/shared-builds'
    this.manifestPath = 'data/manifest'
  }

  /**
   * Make authenticated request to GitHub API
   */
  async makeRequest(endpoint, method = 'GET', body = null) {
    if (!this.token) {
      throw new Error('GitHub token not configured')
    }

    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Casting-Destiny-v2'
    }

    const options = {
      method,
      headers
    }

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, options)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`GitHub API Error ${response.status}: ${errorData.message || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('GitHub API Request Failed:', error)
      throw error
    }
  }

  /**
   * Get file from repository
   */
  async getFile(filePath) {
    try {
      const endpoint = `/repos/${this.owner}/${this.repo}/contents/${filePath}`
      const response = await this.makeRequest(endpoint)
      
      // Decode base64 content
      const content = Buffer.from(response.content, 'base64').toString('utf8')
      return {
        content: JSON.parse(content),
        sha: response.sha
      }
    } catch (error) {
      if (error.message.includes('404')) {
        return null // File doesn't exist
      }
      throw error
    }
  }

  /**
   * Create or update file in repository
   */
  async saveFile(filePath, content, message, sha = null) {
    try {
      const endpoint = `/repos/${this.owner}/${this.repo}/contents/${filePath}`
      
      const body = {
        message,
        content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
        branch: 'main'
      }

      if (sha) {
        body.sha = sha // Required for updates
      }

      return await this.makeRequest(endpoint, 'PUT', body)
    } catch (error) {
      console.error(`Failed to save file ${filePath}:`, error)
      throw error
    }
  }

  /**
   * Load manifest from GitHub storage
   */
  async loadManifest() {
    try {
      console.log('Loading manifest from GitHub storage...')
      const manifestFile = await this.getFile(`${this.manifestPath}/manifest.json`)
      
      if (!manifestFile) {
        console.log('No manifest found in GitHub storage')
        return null
      }

      const manifest = manifestFile.content
      
      // Check if manifest is stale (older than 24 hours)
      const lastUpdated = new Date(manifest.lastUpdated || 0)
      const age = Date.now() - lastUpdated.getTime()
      const isStale = age > (24 * 60 * 60 * 1000) // 24 hours
      
      if (isStale) {
        console.warn('Manifest in GitHub storage is stale')
        manifest.isStale = true
      }

      console.log(`✅ Loaded manifest from GitHub (version: ${manifest.version})`)
      return manifest

    } catch (error) {
      console.error('Error loading manifest from GitHub:', error)
      return null
    }
  }

  /**
   * Save manifest to GitHub storage
   */
  async saveManifest(manifest) {
    try {
      console.log('Saving manifest to GitHub storage...')
      
      // Get existing file to get SHA for update
      const existingFile = await this.getFile(`${this.manifestPath}/manifest.json`)
      const sha = existingFile?.sha

      // Save manifest
      const result = await this.saveFile(
        `${this.manifestPath}/manifest.json`,
        manifest,
        `Update manifest to version ${manifest.version}`,
        sha
      )

      console.log('✅ Manifest saved to GitHub storage successfully')
      return result

    } catch (error) {
      console.error('Error saving manifest to GitHub:', error)
      throw error
    }
  }

  /**
   * Share build with a friend
   */
  async shareBuild(senderMembershipId, senderDisplayName, recipientMembershipId, buildData) {
    try {
      const buildId = `build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const timestamp = new Date().toISOString()
      
      // Create minimal build structure with just essential data
      const sharedBuild = {
        id: buildId,
        metadata: {
          name: buildData.name || 'Shared Build',
          description: buildData.description || '',
          class: buildData.class,
          subclass: buildData.subclass,
          createdAt: timestamp,
          sender: {
            membershipId: senderMembershipId,
            displayName: senderDisplayName
          },
          recipient: {
            membershipId: recipientMembershipId
          }
        },
        loadout: buildData.loadout,
        sharing: {
          status: 'sent',
          sharedAt: timestamp,
          expiresAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString() // 7 days
        }
      }

      // Save to sent folder for sender
      const senderPath = `${this.basePath}/user-${senderMembershipId}/sent/${buildId}.json`
      await this.saveFile(senderPath, sharedBuild, `Share build to ${recipientMembershipId}`)

      // Save to received folder for recipient  
      const recipientPath = `${this.basePath}/user-${recipientMembershipId}/received/${buildId}.json`
      await this.saveFile(recipientPath, sharedBuild, `Receive build from ${senderMembershipId}`)

      return {
        success: true,
        buildId,
        message: 'Build shared successfully'
      }

    } catch (error) {
      console.error('Error sharing build:', error)
      throw new Error(`Failed to share build: ${error.message}`)
    }
  }

  /**
   * Get shared builds for a user
   */
  async getUserBuilds(membershipId, type = 'received') {
    try {
      const basePath = `${this.basePath}/user-${membershipId}/${type}`
      
      let files = []
      try {
        const endpoint = `/repos/${this.owner}/${this.repo}/contents/${basePath}`
        const response = await this.makeRequest(endpoint)
        files = Array.isArray(response) ? response : []
      } catch (error) {
        if (error.message.includes('404')) {
          return [] // No builds folder exists yet
        }
        throw error
      }

      // Load each build file
      const builds = []
      for (const file of files) {
        if (file.name.endsWith('.json')) {
          try {
            const buildFile = await this.getFile(`${basePath}/${file.name}`)
            if (buildFile) {
              builds.push(buildFile.content)
            }
          } catch (error) {
            console.error(`Error loading build ${file.name}:`, error)
          }
        }
      }

      return builds
    } catch (error) {
      console.error('Error getting user builds:', error)
      return []
    }
  }

  /**
   * Mark build as viewed
   */
  async markBuildViewed(membershipId, buildId) {
    try {
      const filePath = `${this.basePath}/user-${membershipId}/received/${buildId}.json`
      const buildFile = await this.getFile(filePath)
      
      if (!buildFile) {
        throw new Error('Build not found')
      }

      // Update status
      const updatedBuild = {
        ...buildFile.content,
        sharing: {
          ...buildFile.content.sharing,
          status: 'viewed',
          viewedAt: new Date().toISOString()
        }
      }

      await this.saveFile(
        filePath,
        updatedBuild,
        `Mark build as viewed: ${buildFile.content.metadata.name}`,
        buildFile.sha
      )

      return {
        success: true,
        message: 'Build marked as viewed'
      }

    } catch (error) {
      console.error('Error marking build as viewed:', error)
      throw new Error(`Failed to mark build as viewed: ${error.message}`)
    }
  }

  /**
   * Delete shared build
   */
  async deleteBuild(membershipId, buildId, type = 'received') {
    try {
      const filePath = `${this.basePath}/user-${membershipId}/${type}/${buildId}.json`
      
      const endpoint = `/repos/${this.owner}/${this.repo}/contents/${filePath}`
      const fileData = await this.makeRequest(endpoint)
      
      // Delete file
      await this.makeRequest(endpoint, 'DELETE', {
        message: `Delete ${type} build: ${buildId}`,
        sha: fileData.sha,
        branch: 'main'
      })

      return {
        success: true,
        message: 'Build deleted successfully'
      }

    } catch (error) {
      console.error('Error deleting build:', error)
      throw new Error(`Failed to delete build: ${error.message}`)
    }
  }

  /**
   * Get repository statistics
   */
  async getStats() {
    try {
      // This would be used for admin purposes to see sharing activity
      const endpoint = `/repos/${this.owner}/${this.repo}/contents/${this.basePath}`
      
      let userDirs = []
      try {
        const response = await this.makeRequest(endpoint)
        userDirs = Array.isArray(response) ? response.filter(item => item.type === 'dir') : []
      } catch (error) {
        if (error.message.includes('404')) {
          return { totalUsers: 0, totalBuilds: 0 }
        }
        throw error
      }

      return {
        totalUsers: userDirs.length,
        lastUpdated: new Date().toISOString()
      }

    } catch (error) {
      console.error('Error getting repository stats:', error)
      return { totalUsers: 0, totalBuilds: 0, error: error.message }
    }
  }
}

// Singleton instance
let githubStorageInstance = null

/**
 * Get GitHub storage instance (singleton)
 * This is the function that other files are trying to import
 */
export function getGitHubStorage() {
  if (!githubStorageInstance) {
    githubStorageInstance = new GitHubStorageService()
  }
  return githubStorageInstance
}

// Also export the class as default for backwards compatibility
export default GitHubStorageService