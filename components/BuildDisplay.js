// components/BuildDisplay.js
// Component for displaying generated builds

import { useState } from 'react'

export default function BuildDisplay({ build, onExoticLock, lockedExotic }) {
  const [expanded, setExpanded] = useState(true)
  
  if (!build) {
    return (
      <div className="build-display empty">
        <p>No build generated yet</p>
        <style jsx>{`
          .build-display.empty {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid #333;
            border-radius: 8px;
            padding: 40px;
            text-align: center;
            color: #666;
          }
        `}</style>
      </div>
    )
  }

  const { armor, stats, mods, exotic } = build

  return (
    <div className="build-display">
      <div className="build-header">
        <h3>Generated Build</h3>
        <button 
          className="expand-btn"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? '▼' : '▶'}
        </button>
      </div>

      {expanded && (
        <div className="build-content">
          {/* Exotic Display */}
          {exotic && (
            <div className="exotic-section">
              <h4>Exotic Armor</h4>
              <div className="exotic-item">
                <div className="item-icon">
                  {exotic.icon && <img src={exotic.icon} alt={exotic.name} />}
                </div>
                <div className="item-details">
                  <div className="item-name">{exotic.name}</div>
                  <div className="item-type">{exotic.type}</div>
                </div>
                <button 
                  className={`lock-btn ${lockedExotic === exotic.hash ? 'locked' : ''}`}
                  onClick={() => onExoticLock(lockedExotic === exotic.hash ? null : exotic.hash)}
                >
                  {lockedExotic === exotic.hash ? '🔒' : '🔓'}
                </button>
              </div>
            </div>
          )}

          {/* Stats Display */}
          <div className="stats-section">
            <h4>Optimized Stats</h4>
            <div className="stats-grid">
              {Object.entries(stats || {}).map(([stat, value]) => (
                <div key={stat} className="stat-item">
                  <div className="stat-name">{stat}</div>
                  <div className="stat-bar">
                    <div 
                      className="stat-fill"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <div className="stat-value">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Armor Pieces */}
          {armor && (
            <div className="armor-section">
              <h4>Armor Pieces</h4>
              <div className="armor-grid">
                {Object.entries(armor).map(([slot, item]) => (
                  <div key={slot} className="armor-item">
                    <div className="item-slot">{slot}</div>
                    <div className="item-name">{item?.name || 'Not selected'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mods */}
          {mods && mods.length > 0 && (
            <div className="mods-section">
              <h4>Recommended Mods</h4>
              <div className="mods-list">
                {mods.map((mod, index) => (
                  <div key={index} className="mod-item">
                    <span className="mod-name">{mod.name}</span>
                    <span className="mod-energy">{mod.energy} ⚡</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .build-display {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid #333;
          border-radius: 8px;
          overflow: hidden;
        }

        .build-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: rgba(0, 0, 0, 0.5);
          border-bottom: 1px solid #333;
        }

        .build-header h3 {
          margin: 0;
          color: #ff6b35;
        }

        .expand-btn {
          background: none;
          border: none;
          color: #999;
          font-size: 14px;
          cursor: pointer;
          padding: 4px 8px;
        }

        .build-content {
          padding: 20px;
        }

        .exotic-section, .stats-section, .armor-section, .mods-section {
          margin-bottom: 24px;
        }

        .exotic-section h4, .stats-section h4, .armor-section h4, .mods-section h4 {
          color: #999;
          font-size: 12px;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .exotic-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 107, 53, 0.1);
          border: 1px solid rgba(255, 107, 53, 0.3);
          border-radius: 4px;
        }

        .item-icon {
          width: 48px;
          height: 48px;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 4px;
        }

        .item-icon img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .item-details {
          flex: 1;
        }

        .item-name {
          font-weight: 600;
          color: #fff;
        }

        .item-type {
          font-size: 12px;
          color: #999;
        }

        .lock-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid #444;
          border-radius: 4px;
          padding: 8px;
          cursor: pointer;
          font-size: 18px;
        }

        .lock-btn.locked {
          background: rgba(255, 107, 53, 0.2);
          border-color: #ff6b35;
        }

        .stats-grid {
          display: grid;
          gap: 8px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .stat-name {
          width: 80px;
          font-size: 13px;
          color: #999;
          text-transform: capitalize;
        }

        .stat-bar {
          flex: 1;
          height: 20px;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 10px;
          overflow: hidden;
        }

        .stat-fill {
          height: 100%;
          background: linear-gradient(90deg, #ff6b35, #f7931e);
          transition: width 0.3s ease;
        }

        .stat-value {
          width: 30px;
          text-align: right;
          font-weight: 600;
          color: #fff;
        }

        .armor-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 8px;
        }

        .armor-item {
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid #333;
          border-radius: 4px;
        }

        .item-slot {
          font-size: 11px;
          color: #666;
          text-transform: uppercase;
        }

        .mods-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .mod-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid #333;
          border-radius: 20px;
          font-size: 13px;
        }

        .mod-name {
          color: #fff;
        }

        .mod-energy {
          color: #4fc3f7;
          font-size: 11px;
        }
      `}</style>
    </div>
  )
}