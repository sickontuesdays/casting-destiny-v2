// lib/github-storage.js
// Service for storing build sharing data in GitHub repository

class GitHubStorageService {
  constructor() {
    this.owner = process.env.GITHUB_REPO_OWNER || 'your-username'
    this.repo = process.env.GITHUB_REPO_NAME || 'casting-destiny-v2' 
    this.token = process.env.GITHUB_TOKEN
    this.baseUrl = 'https://api.github.com'
    this.basePath = 'data/shared-builds'
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
          class: buildData.class || 'Unknown',
          subclass: buildData.subclass || '',
          activity: buildData.activity || 'General',
          tags: buildData.tags || [],
          score: buildData.score || 0
        },
        loadout: {
          // Store only item hashes - app will fetch details from Bungie API
          weapons: {
            kinetic: buildData.weapons?.kinetic?.itemHash || null,
            energy: buildData.weapons?.energy?.itemHash || null,
            heavy: buildData.weapons?.heavy?.itemHash || null
          },
          armor: {
            helmet: buildData.armor?.helmet?.itemHash || null,
            gauntlets: buildData.armor?.gauntlets?.itemHash || null,
            chest: buildData.armor?.chest?.itemHash || null,
            legs: buildData.armor?.legs?.itemHash || null,
            classItem: buildData.armor?.classItem?.itemHash || null
          },
          mods: buildData.mods?.map(mod => mod.itemHash).filter(Boolean) || [],
          exotics: {
            weapon: buildData.exotics?.weapon?.itemHash || null,
            armor: buildData.exotics?.armor?.itemHash || null
          }
        },
        sharing: {
          sharedBy: {
            membershipId: senderMembershipId,
            displayName: senderDisplayName
          },
          sharedWith: {
            membershipId: recipientMembershipId
          },
          sharedAt: timestamp,
          status: 'sent'
        }
      }

      // Save to recipient's received builds
      const receivedPath = `${this.basePath}/user-${recipientMembershipId}/received/${buildId}.json`
      await this.saveFile(
        receivedPath,
        sharedBuild,
        `Share build: ${buildData.name || 'Untitled'} from ${senderDisplayName}`
      )

      // Save to sender's sent builds (for tracking)
      const sentBuild = {
        ...sharedBuild,
        sharing: {
          ...sharedBuild.sharing,
          status: 'sent'
        }
      }
      
      const sentPath = `${this.basePath}/user-${senderMembershipId}/sent/${buildId}.json`
      await this.saveFile(
        sentPath,
        sentBuild,
        `Sent build: ${buildData.name || 'Untitled'} to recipient`
      )

      console.log(`Build shared successfully: ${buildId}`, {
        from: senderDisplayName,
        to: recipientMembershipId,
        buildName: buildData.name
      })

      return {
        success: true,
        buildId,
        sharedBuild,
        message: 'Build shared successfully'
      }

    } catch (error) {
      console.error('Error sharing build via GitHub:', error)
      throw new Error(`Failed to share build: ${error.message}`)
    }
  }

  /**
   * Get builds shared with user (received builds)
   */
  async getReceivedBuilds(membershipId) {
    try {
      const userPath = `${this.basePath}/user-${membershipId}/received`
      
      // Get directory listing
      const endpoint = `/repos/${this.owner}/${this.repo}/contents/${userPath}`
      
      let files = []
      try {
        const response = await this.makeRequest(endpoint)
        files = Array.isArray(response) ? response : []
      } catch (error) {
        if (error.message.includes('404')) {
          // Directory doesn't exist yet - user has no received builds
          return []
        }
        throw error
      }

      // Fetch all build files
      const builds = []
      for (const file of files) {
        if (file.name.endsWith('.json')) {
          try {
            const buildFile = await this.getFile(file.path)
            if (buildFile?.content) {
              builds.push(buildFile.content)
            }
          } catch (error) {
            console.warn(`Failed to load build file ${file.name}:`, error.message)
          }
        }
      }

      // Sort by shared date (newest first)
      builds.sort((a, b) => new Date(b.sharing.sharedAt) - new Date(a.sharing.sharedAt))

      console.log(`Loaded ${builds.length} received builds for user ${membershipId}`)
      return builds

    } catch (error) {
      console.error('Error loading received builds:', error)
      throw new Error(`Failed to load received builds: ${error.message}`)
    }
  }

  /**
   * Get builds sent by user 
   */
  async getSentBuilds(membershipId) {
    try {
      const userPath = `${this.basePath}/user-${membershipId}/sent`
      
      // Get directory listing
      const endpoint = `/repos/${this.owner}/${this.repo}/contents/${userPath}`
      
      let files = []
      try {
        const response = await this.makeRequest(endpoint)
        files = Array.isArray(response) ? response : []
      } catch (error) {
        if (error.message.includes('404')) {
          return []
        }
        throw error
      }

      // Fetch all build files
      const builds = []
      for (const file of files) {
        if (file.name.endsWith('.json')) {
          try {
            const buildFile = await this.getFile(file.path)
            if (buildFile?.content) {
              builds.push(buildFile.content)
            }
          } catch (error) {
            console.warn(`Failed to load sent build file ${file.name}:`, error.message)
          }
        }
      }

      // Sort by shared date (newest first)
      builds.sort((a, b) => new Date(b.sharing.sharedAt) - new Date(a.sharing.sharedAt))

      return builds

    } catch (error) {
      console.error('Error loading sent builds:', error)
      throw new Error(`Failed to load sent builds: ${error.message}`)
    }
  }

  /**
   * Mark received build as viewed
   */
  async markBuildAsViewed(membershipId, buildId) {
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

export default GitHubStorageService