import { useState, useEffect } from 'react'

export default function ItemAcquisition({ item }) {
  const [acquisitionInfo, setAcquisitionInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAcquisitionInfo()
  }, [item])

  const getAcquisitionInfo = () => {
    // This would normally query a database or API for acquisition info
    // For now, using simplified logic based on item properties
    
    let info = {
      sources: [],
      location: '',
      activity: '',
      rotational: false,
      nextAvailable: null,
      difficulty: '',
      requirements: []
    }

    // Determine source based on item hash, name, or other properties
    if (item.displayProperties.name.includes('Raid')) {
      info.sources = ['Raid']
      info.activity = determineRaidSource(item)
      info.location = 'Various Raid Locations'
      info.difficulty = 'Raid'
    } else if (item.displayProperties.name.includes('Trials')) {
      info.sources = ['Trials of Osiris']
      info.activity = 'Trials of Osiris'
      info.location = 'Crucible'
      info.rotational = true
      info.nextAvailable = getNextTrialsDate()
      info.requirements = ['Trials Access', '3-Player Fireteam']
    } else if (item.displayProperties.name.includes('Nightfall') || item.displayProperties.name.includes('GM')) {
      info.sources = ['Nightfall']
      info.activity = 'Nightfall: The Ordeal'
      info.location = 'Vanguard Strikes'
      info.rotational = true
      info.nextAvailable = getNextNightfallRotation()
    } else if (item.tierType === 6) { // Exotic
      info = getExoticAcquisition(item)
    } else {
      info = getGeneralAcquisition(item)
    }

    setAcquisitionInfo(info)
    setLoading(false)
  }

  const determineRaidSource = (item) => {
    const name = item.displayProperties.name.toLowerCase()
    if (name.includes('fatebringer') || name.includes('vex') || name.includes('vision')) {
      return 'Vault of Glass'
    } else if (name.includes('insidious') || name.includes('lubrae')) {
      return 'Vow of the Disciple'
    } else if (name.includes('deliverance') || name.includes('submission')) {
      return 'Vow of the Disciple'
    }
    return 'Various Raids'
  }

  const getExoticAcquisition = (item) => {
    const name = item.displayProperties.name.toLowerCase()
    
    // Check for quest exotics
    if (name.includes('whisper') || name.includes('outbreak')) {
      return {
        sources: ['Exotic Quest'],
        activity: 'Exotic Mission',
        location: 'Various Locations',
        rotational: false,
        requirements: ['Complete Quest Steps']
      }
    }
    
    // Check for seasonal exotics
    if (name.includes('osteo') || name.includes('glaive')) {
      return {
        sources: ['Season Pass', 'Exotic Cipher'],
        activity: 'Season Pass Reward / Monument to Lost Lights',
        location: 'Tower',
        rotational: false,
        requirements: ['Season Pass Level 35 or Exotic Cipher']
      }
    }

    // Default exotic acquisition
    return {
      sources: ['Random Drop', 'Xur', 'Exotic Engram'],
      activity: 'Any Activity',
      location: 'Any Location',
      rotational: false,
      requirements: ['RNG or Weekly Xur Visit']
    }
  }

  const getGeneralAcquisition = (item) => {
    return {
      sources: ['World Drop', 'Vendors', 'Activities'],
      activity: 'Various Activities',
      location: 'Any Location',
      rotational: false,
      requirements: ['Play Destiny 2']
    }
  }

  const getNextTrialsDate = () => {
    // Calculate next Friday
    const now = new Date()
    const friday = new Date()
    friday.setDate(now.getDate() + (5 - now.getDay() + 7) % 7)
    friday.setHours(17, 0, 0, 0) // 5 PM EST
    return friday
  }

  const getNextNightfallRotation = () => {
    // Calculate next Tuesday
    const now = new Date()
    const tuesday = new Date()
    tuesday.setDate(now.getDate() + (2 - now.getDay() + 7) % 7)
    tuesday.setHours(17, 0, 0, 0) // 5 PM EST
    return tuesday
  }

  if (loading) {
    return <div className="acquisition-loading">Loading acquisition info...</div>
  }

  return (
    <div className="item-acquisition">
      <div className="acquisition-header">
        <h4>How to Obtain</h4>
      </div>
      
      <div className="acquisition-content">
        <div className="sources">
          <strong>Sources:</strong>
          <div className="source-tags">
            {acquisitionInfo.sources.map((source, index) => (
              <span key={index} className="source-tag">{source}</span>
            ))}
          </div>
        </div>

        <div className="location-info">
          <div className="info-row">
            <strong>Location:</strong> {acquisitionInfo.location}
          </div>
          <div className="info-row">
            <strong>Activity:</strong> {acquisitionInfo.activity}
          </div>
          {acquisitionInfo.difficulty && (
            <div className="info-row">
              <strong>Difficulty:</strong> {acquisitionInfo.difficulty}
            </div>
          )}
        </div>

        {acquisitionInfo.rotational && acquisitionInfo.nextAvailable && (
          <div className="rotation-info">
            <strong>Next Available:</strong> 
            <span className="next-date">
              {acquisitionInfo.nextAvailable.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
        )}

        {acquisitionInfo.requirements.length > 0 && (
          <div className="requirements">
            <strong>Requirements:</strong>
            <ul>
              {acquisitionInfo.requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="acquisition-tips">
          <strong>Tips:</strong>
          <ul>
            {acquisitionInfo.sources.includes('Raid') && (
              <li>Use LFG tools like Discord or the Bungie app to find raid teams</li>
            )}
            {acquisitionInfo.sources.includes('Trials of Osiris') && (
              <li>Practice in Elimination playlist before attempting Trials</li>
            )}
            {acquisitionInfo.sources.includes('Nightfall') && (
              <li>Higher difficulty Nightfalls have better drop rates</li>
            )}
            {acquisitionInfo.sources.includes('Random Drop') && (
              <li>Higher level activities generally have better exotic drop rates</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}