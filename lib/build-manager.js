import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

class BuildManager {
  constructor() {
    this.buildsDir = process.env.VERCEL ? '/tmp/builds' : path.join(process.cwd(), 'data', 'builds')
    this.sharedBuildsDir = process.env.VERCEL ? '/tmp/shared-builds' : path.join(process.cwd(), 'data', 'shared-builds')
  }

  // Initialize directories
  async initialize() {
    try {
      if (!fs.existsSync(this.buildsDir)) {
        fs.mkdirSync(this.buildsDir, { recursive: true })
      }
      if (!fs.existsSync(this.sharedBuildsDir)) {
        fs.mkdirSync(this.sharedBuildsDir, { recursive: true })
      }
      return true
    } catch (error) {
      console.error('Failed to initialize build directories:', error)
      return false
    }
  }

  // Save a user's build
  async saveBuild(userId, build) {
    await this.initialize()
    
    const buildId = this.generateBuildId()
    const buildData = {
      id: buildId,
      userId,
      name: build.name || 'Unnamed Build',
      description: build.description || '',
      character: {
        classType: build.character?.classType,
        className: build.character?.className,
        characterId: build.character?.characterId
      },
      items: {
        kinetic: this.serializeItem(build.items?.kinetic),
        energy: this.serializeItem(build.items?.energy),
        power: this.serializeItem(build.items?.power),
        helmet: this.serializeItem(build.items?.helmet),
        gauntlets: this.serializeItem(build.items?.gauntlets),
        chest: this.serializeItem(build.items?.chest),
        legs: this.serializeItem(build.items?.legs),
        classItem: this.serializeItem(build.items?.classItem)
      },
      mods: build.mods || [],
      subclass: build.subclass || null,
      stats: build.stats || {},
      tags: build.tags || [],
      activity: build.activity || 'general',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '2.0.0'
    }

    try {
      const userBuildsFile = path.join(this.buildsDir, `${userId}.json`)
      let userBuilds = []
      
      if (fs.existsSync(userBuildsFile)) {
        const content = fs.readFileSync(userBuildsFile, 'utf-8')
        userBuilds = JSON.parse(content)
      }
      
      // Add new build
      userBuilds.push(buildData)
      
      // Limit to 100 builds per user
      if (userBuilds.length > 100) {
        userBuilds = userBuilds.slice(-100)
      }
      
      fs.writeFileSync(userBuildsFile, JSON.stringify(userBuilds, null, 2))
      
      return { success: true, buildId, build: buildData }
    } catch (error) {
      console.error('Failed to save build:', error)
      return { success: false, error: error.message }
    }
  }

  // Load user's builds
  async loadUserBuilds(userId) {
    await this.initialize()
    
    try {
      const userBuildsFile = path.join(this.buildsDir, `${userId}.json`)
      
      if (!fs.existsSync(userBuildsFile)) {
        return []
      }
      
      const content = fs.readFileSync(userBuildsFile, 'utf-8')
      return JSON.parse(content)
    } catch (error) {
      console.error('Failed to load user builds:', error)
      return []
    }
  }

  // Delete a build
  async deleteBuild(userId, buildId) {
    await this.initialize()
    
    try {
      const userBuildsFile = path.join(this.buildsDir, `${userId}.json`)
      
      if (!fs.existsSync(userBuildsFile)) {
        return { success: false, error: 'No builds found' }
      }
      
      const content = fs.readFileSync(userBuildsFile, 'utf-8')
      let userBuilds = JSON.parse(content)
      
      const initialLength = userBuilds.length
      userBuilds = userBuilds.filter(b => b.id !== buildId)
      
      if (userBuilds.length === initialLength) {
        return { success: false, error: 'Build not found' }
      }
      
      fs.writeFileSync(userBuildsFile, JSON.stringify(userBuilds, null, 2))
      
      return { success: true }
    } catch (error) {
      console.error('Failed to delete build:', error)
      return { success: false, error: error.message }
    }
  }

  // Share a build
  async shareBuild(userId, buildId, targetUserIds) {
    await this.initialize()
    
    // Load the build
    const userBuilds = await this.loadUserBuilds(userId)
    const build = userBuilds.find(b => b.id === buildId)
    
    if (!build) {
      return { success: false, error: 'Build not found' }
    }
    
    // Generate share link
    const shareId = this.generateShareId()
    const shareData = {
      shareId,
      build: {
        ...build,
        sharedBy: userId,
        sharedAt: new Date().toISOString()
      },
      targetUsers: targetUserIds || [],
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    }
    
    try {
      const shareFile = path.join(this.sharedBuildsDir, `${shareId}.json`)
      fs.writeFileSync(shareFile, JSON.stringify(shareData, null, 2))
      
      // If specific users are targeted, add to their pending shares
      if (targetUserIds && targetUserIds.length > 0) {
        for (const targetId of targetUserIds) {
          await this.addPendingShare(targetId, shareId, build.name, userId)
        }
      }
      
      return { 
        success: true, 
        shareId,
        shareUrl: `/builds/shared/${shareId}`
      }
    } catch (error) {
      console.error('Failed to share build:', error)
      return { success: false, error: error.message }
    }
  }

  // Get shared build
  async getSharedBuild(shareId) {
    await this.initialize()
    
    try {
      const shareFile = path.join(this.sharedBuildsDir, `${shareId}.json`)
      
      if (!fs.existsSync(shareFile)) {
        return null
      }
      
      const content = fs.readFileSync(shareFile, 'utf-8')
      const shareData = JSON.parse(content)
      
      // Check if expired
      if (shareData.expiresAt && new Date(shareData.expiresAt) < new Date()) {
        fs.unlinkSync(shareFile)
        return null
      }
      
      return shareData
    } catch (error) {
      console.error('Failed to get shared build:', error)
      return null
    }
  }

  // Add pending share notification
  async addPendingShare(userId, shareId, buildName, sharedBy) {
    try {
      const pendingFile = path.join(this.buildsDir, `${userId}-pending.json`)
      let pendingShares = []
      
      if (fs.existsSync(pendingFile)) {
        const content = fs.readFileSync(pendingFile, 'utf-8')
        pendingShares = JSON.parse(content)
      }
      
      pendingShares.push({
        shareId,
        buildName,
        sharedBy,
        sharedAt: new Date().toISOString(),
        viewed: false
      })
      
      // Limit to 50 pending shares
      if (pendingShares.length > 50) {
        pendingShares = pendingShares.slice(-50)
      }
      
      fs.writeFileSync(pendingFile, JSON.stringify(pendingShares, null, 2))
      
      return true
    } catch (error) {
      console.error('Failed to add pending share:', error)
      return false
    }
  }

  // Get pending shares for a user
  async getPendingShares(userId) {
    try {
      const pendingFile = path.join(this.buildsDir, `${userId}-pending.json`)
      
      if (!fs.existsSync(pendingFile)) {
        return []
      }
      
      const content = fs.readFileSync(pendingFile, 'utf-8')
      return JSON.parse(content)
    } catch (error) {
      console.error('Failed to get pending shares:', error)
      return []
    }
  }

  // Apply build to character (prepare for Bungie API)
  async prepareBuildApplication(build, character) {
    const operations = []
    
    // For each item in the build, prepare transfer/equip operations
    Object.entries(build.items).forEach(([slot, item]) => {
      if (!item) return
      
      // Check if item needs to be transferred from vault
      if (item.location === 'vault') {
        operations.push({
          type: 'transfer',
          item: {
            itemReferenceHash: item.itemHash,
            itemId: item.itemInstanceId,
            characterId: character.characterId,
            membershipType: character.membershipType,
            transferToVault: false
          }
        })
      }
      
      // Equip the item
      operations.push({
        type: 'equip',
        item: {
          itemId: item.itemInstanceId,
          characterId: character.characterId,
          membershipType: character.membershipType
        }
      })
    })
    
    return operations
  }

  // Helper methods
  generateBuildId() {
    return `build_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
  }

  generateShareId() {
    return crypto.randomBytes(16).toString('hex')
  }

  serializeItem(item) {
    if (!item) return null
    
    return {
      itemHash: item.itemHash,
      itemInstanceId: item.itemInstanceId,
      name: item.displayProperties?.name,
      icon: item.displayProperties?.icon,
      tierType: item.tierType,
      isExotic: item.isExotic,
      powerLevel: item.powerLevel,
      stats: item.stats,
      perks: item.perks?.map(p => ({
        hash: p.plugHash,
        name: p.name,
        description: p.description
      })),
      mods: item.mods?.map(m => ({
        hash: m.plugHash,
        name: m.name,
        description: m.description
      }))
    }
  }

  // Search builds
  async searchBuilds(userId, query) {
    const userBuilds = await this.loadUserBuilds(userId)
    
    if (!query) return userBuilds
    
    const searchTerm = query.toLowerCase()
    
    return userBuilds.filter(build => {
      return (
        build.name?.toLowerCase().includes(searchTerm) ||
        build.description?.toLowerCase().includes(searchTerm) ||
        build.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        build.activity?.toLowerCase().includes(searchTerm)
      )
    })
  }

  // Get build statistics
  async getBuildStats(userId) {
    const userBuilds = await this.loadUserBuilds(userId)
    
    const stats = {
      total: userBuilds.length,
      byClass: {},
      byActivity: {},
      recentBuilds: [],
      mostUsedItems: {}
    }
    
    userBuilds.forEach(build => {
      // By class
      const className = build.character?.className || 'Unknown'
      stats.byClass[className] = (stats.byClass[className] || 0) + 1
      
      // By activity
      const activity = build.activity || 'General'
      stats.byActivity[activity] = (stats.byActivity[activity] || 0) + 1
      
      // Track item usage
      Object.values(build.items).forEach(item => {
        if (item?.itemHash) {
          if (!stats.mostUsedItems[item.itemHash]) {
            stats.mostUsedItems[item.itemHash] = {
              count: 0,
              name: item.name,
              icon: item.icon
            }
          }
          stats.mostUsedItems[item.itemHash].count++
        }
      })
    })
    
    // Get 5 most recent builds
    stats.recentBuilds = userBuilds
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(b => ({
        id: b.id,
        name: b.name,
        createdAt: b.createdAt
      }))
    
    // Get top 10 most used items
    stats.mostUsedItems = Object.values(stats.mostUsedItems)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    
    return stats
  }
}

export default BuildManager