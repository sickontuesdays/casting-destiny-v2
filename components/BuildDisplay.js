import { useState } from 'react'
import ItemAcquisition from './ItemAcquisition'

export default function BuildDisplay({ build, onNewSearch, useInventoryOnly, session }) {
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [buildName, setBuildName] = useState('')
  const [buildDescription, setBuildDescription] = useState('')
  const [showAcquisition, setShowAcquisition] = useState({})

  const saveBuild = async () => {
    try {
      const response = await fetch('/api/builds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          build,
          name: buildName,
          description: buildDescription
        })
      })

      if (response.ok) {
        setShowSaveDialog(false)
        setBuildName('')
        setBuildDescription('')
        // Show success notification
      }
    } catch (error) {
      console.error('Error saving build:', error)
    }
  }

  const applyBuild = async () => {
    // This would integrate with Bungie API to actually equip items
    // For now, just show a notification
    alert('Build application feature coming soon! You can manually equip these items for now.')
  }

  const shareBuild = () => {
    const buildUrl = `${window.location.origin}/shared-build/${btoa(JSON.stringify(build))}`
    navigator.clipboard.writeText(buildUrl)
    alert('Build link copied to clipboard!')
  }

  const toggleAcquisition = (itemHash) => {
    setShowAcquisition(prev => ({
      ...prev,
      [itemHash]: !prev[itemHash]
    }))
  }

  const renderWeapon = (weapon, slot) => (
    <div key={`${slot}-${weapon.hash}`} className="weapon-slot">
      <div className="slot-header">{slot}</div>
      <div className="weapon-card">
        <div className="weapon-icon">
          <img 
            src={`https://www.bungie.net${weapon.displayProperties.icon}`}
            alt={weapon.displayProperties.name}
          />
        </div>
        <div className="weapon-info">
          <h4>{weapon.displayProperties.name}</h4>
          <p className="weapon-type">{weapon.itemTypeDisplayName}</p>
          {weapon.recommendedPerks && (
            <div className="recommended-perks">
              <strong>Recommended Perks:</strong>
              <ul>
                {weapon.recommendedPerks.map((perk, index) => (
                  <li key={index}>{perk}</li>
                ))}
              </ul>
            </div>
          )}
          {!weapon.inInventory && !useInventoryOnly && (
            <button 
              className="acquisition-btn"
              onClick={() => toggleAcquisition(weapon.hash)}
            >
              Where to get this?
            </button>
          )}
        </div>
      </div>
      {showAcquisition[weapon.hash] && (
        <ItemAcquisition item={weapon} />
      )}
    </div>
  )

  const renderArmor = (armor, slot) => (
    <div key={`${slot}-${armor.hash}`} className="armor-slot">
      <div className="slot-header">{slot}</div>
      <div className="armor-card">
        <div className="armor-icon">
          <img 
            src={`https://www.bungie.net${armor.displayProperties.icon}`}
            alt={armor.displayProperties.name}
          />
        </div>
        <div className="armor-info">
          <h4>{armor.displayProperties.name}</h4>
          {armor.recommendedStats && (
            <div className="recommended-stats">
              <strong>Focus Stats:</strong>
              <div className="stat-bars">
                {Object.entries(armor.recommendedStats).map(([stat, value]) => (
                  <div key={stat} className="stat-bar">
                    <span className="stat-name">{stat}</span>
                    <div className="stat-value">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {armor.recommendedMods && (
            <div className="recommended-mods">
              <strong>Recommended Mods:</strong>
              <ul>
                {armor.recommendedMods.map((mod, index) => (
                  <li key={index}>{mod}</li>
                ))}
              </ul>
            </div>
          )}
          {!armor.inInventory && !useInventoryOnly && (
            <button 
              className="acquisition-btn"
              onClick={() => toggleAcquisition(armor.hash)}
            >
              Where to get this?
            </button>
          )}
        </div>
      </div>
      {showAcquisition[armor.hash] && (
        <ItemAcquisition item={armor} />
      )}
    </div>
  )

  return (
    <div className="build-display">
      <div className="build-header">
        <div className="build-title">
          <h2>{build.name || 'Generated Build'}</h2>
          <p className="build-score">Build Score: {build.score}/100</p>
        </div>
        <div className="build-actions">
          <button className="action-btn secondary" onClick={onNewSearch}>
            New Search
          </button>
          <button className="action-btn primary" onClick={() => setShowSaveDialog(true)}>
            Save Build
          </button>
          <button className="action-btn primary" onClick={shareBuild}>
            Share Build
          </button>
          <button className="action-btn apply" onClick={applyBuild}>
            Apply Build
          </button>
        </div>
      </div>

      <div className="build-summary">
        <p>{build.description}</p>
        {build.playstyle && (
          <div className="playstyle-tags">
            {build.playstyle.map((style, index) => (
              <span key={index} className="playstyle-tag">{style}</span>
            ))}
          </div>
        )}
      </div>

      <div className="build-content">
        <div className="weapons-section">
          <h3>Weapons</h3>
          <div className="weapons-grid">
            {build.weapons?.kinetic && renderWeapon(build.weapons.kinetic, 'Kinetic')}
            {build.weapons?.energy && renderWeapon(build.weapons.energy, 'Energy')}
            {build.weapons?.power && renderWeapon(build.weapons.power, 'Power')}
          </div>
        </div>

        <div className="armor-section">
          <h3>Armor</h3>
          <div className="armor-grid">
            {build.armor?.helmet && renderArmor(build.armor.helmet, 'Helmet')}
            {build.armor?.arms && renderArmor(build.armor.arms, 'Arms')}
            {build.armor?.chest && renderArmor(build.armor.chest, 'Chest')}
            {build.armor?.legs && renderArmor(build.armor.legs, 'Legs')}
            {build.armor?.classItem && renderArmor(build.armor.classItem, 'Class Item')}
          </div>
        </div>

        {build.subclass && (
          <div className="subclass-section">
            <h3>Subclass</h3>
            <div className="subclass-card">
              <div className="subclass-icon">
                <img 
                  src={`https://www.bungie.net${build.subclass.displayProperties.icon}`}
                  alt={build.subclass.displayProperties.name}
                />
              </div>
              <div className="subclass-info">
                <h4>{build.subclass.displayProperties.name}</h4>
                {build.subclass.recommendedAspects && (
                  <div className="aspects">
                    <strong>Aspects:</strong>
                    <ul>
                      {build.subclass.recommendedAspects.map((aspect, index) => (
                        <li key={index}>{aspect}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {build.subclass.recommendedFragments && (
                  <div className="fragments">
                    <strong>Fragments:</strong>
                    <ul>
                      {build.subclass.recommendedFragments.map((fragment, index) => (
                        <li key={index}>{fragment}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {build.seasonalArtifact && (
          <div className="artifact-section">
            <h3>Seasonal Artifact</h3>
            <div className="artifact-mods">
              {build.seasonalArtifact.recommendedMods?.map((mod, index) => (
                <div key={index} className="artifact-mod">
                  <span className="mod-name">{mod}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showSaveDialog && (
        <div className="save-dialog-overlay">
          <div className="save-dialog">
            <h3>Save Build</h3>
            <div className="form-group">
              <label>Build Name:</label>
              <input
                type="text"
                value={buildName}
                onChange={(e) => setBuildName(e.target.value)}
                placeholder="Enter a name for your build"
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <textarea
                value={buildDescription}
                onChange={(e) => setBuildDescription(e.target.value)}
                placeholder="Describe when to use this build"
                rows={3}
              />
            </div>
            <div className="dialog-actions">
              <button onClick={() => setShowSaveDialog(false)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={saveBuild} className="save-btn" disabled={!buildName.trim()}>
                Save Build
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}