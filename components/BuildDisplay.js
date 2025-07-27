import React, { useState } from 'react';

const BuildDisplay = ({ builds, searchQuery, totalFound }) => {
  const [expandedBuild, setExpandedBuild] = useState(null);

  if (!builds || builds.length === 0) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '15px',
        padding: '25px',
        border: '1px solid rgba(244, 167, 36, 0.2)',
        textAlign: 'center'
      }}>
        <div style={{ color: '#b3b3b3', fontStyle: 'italic', padding: '40px' }}>
          No builds found for "{searchQuery}". Try describing your playstyle differently!
        </div>
      </div>
    );
  }

  const toggleExpanded = (index) => {
    setExpandedBuild(expandedBuild === index ? null : index);
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '15px',
      padding: '25px',
      border: '1px solid rgba(244, 167, 36, 0.2)'
    }}>
      <h2 style={{
        color: '#f4a724',
        marginBottom: '20px',
        fontSize: '1.4rem',
        textAlign: 'center'
      }}>
        🎯 Perfect Builds for "{searchQuery}"
      </h2>
      
      <div style={{
        color: '#b3b3b3',
        fontSize: '0.9rem',
        textAlign: 'center',
        marginBottom: '25px'
      }}>
        Found {totalFound} complete build{totalFound !== 1 ? 's' : ''} matching your playstyle
      </div>
      
      {builds.map((build, index) => (
        <div 
          key={index}
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '15px',
            padding: '25px',
            marginBottom: '20px',
            border: '2px solid rgba(244, 167, 36, 0.3)',
            transition: 'all 0.3s ease'
          }}
        >
          {/* Build Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px',
            cursor: 'pointer'
          }}
          onClick={() => toggleExpanded(index)}
          >
            <div>
              <h3 style={{
                color: '#f4a724',
                fontSize: '1.3rem',
                margin: '0 0 5px 0'
              }}>
                {build.name}
              </h3>
              <p style={{
                color: '#b3b3b3',
                margin: 0,
                fontSize: '1rem'
              }}>
                {build.description}
              </p>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}>
              <div style={{
                background: `linear-gradient(45deg, 
                  ${build.synergyScore >= 90 ? '#4CAF50, #8BC34A' : 
                    build.synergyScore >= 80 ? '#FF9800, #FFC107' : 
                    '#FF5722, #FF7043'})`,
                color: 'white',
                padding: '8px 15px',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}>
                {build.synergyScore}% Match
              </div>
              
              <div style={{
                color: '#f4a724',
                fontSize: '1.2rem',
                transform: expandedBuild === index ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }}>
                ▼
              </div>
            </div>
          </div>

          {/* Quick Overview - Always Visible */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: expandedBuild === index ? '20px' : '0'
          }}>
            {build.components.exoticArmor && (
              <div style={{
                background: 'rgba(255, 215, 0, 0.2)',
                color: '#FFD700',
                padding: '5px 12px',
                borderRadius: '15px',
                fontSize: '0.85rem',
                border: '1px solid rgba(255, 215, 0, 0.3)'
              }}>
                🔥 {build.components.exoticArmor}
              </div>
            )}
            
            {build.components.exoticWeapon && (
              <div style={{
                background: 'rgba(255, 215, 0, 0.2)',
                color: '#FFD700',
                padding: '5px 12px',
                borderRadius: '15px',
                fontSize: '0.85rem',
                border: '1px solid rgba(255, 215, 0, 0.3)'
              }}>
                ⚔️ {build.components.exoticWeapon}
              </div>
            )}

            {build.components.subclass && (
              <div style={{
                background: 'rgba(138, 43, 226, 0.2)',
                color: '#DA70D6',
                padding: '5px 12px',
                borderRadius: '15px',
                fontSize: '0.85rem',
                border: '1px solid rgba(138, 43, 226, 0.3)'
              }}>
                ⚡ {build.components.subclass.subclass.charAt(0).toUpperCase() + build.components.subclass.subclass.slice(1)} {build.components.subclass.class.charAt(0).toUpperCase() + build.components.subclass.class.slice(1)}
              </div>
            )}
          </div>

          {/* Expanded Details */}
          {expandedBuild === index && (
            <div style={{
              borderTop: '1px solid rgba(244, 167, 36, 0.2)',
              paddingTop: '20px'
            }}>
              {/* Build Components from Real Destiny Data */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ color: '#f4a724', marginBottom: '15px', fontSize: '1rem' }}>
                  🔥 Build Components ({build.itemCount} synergistic items)
                </h4>
                
                {/* Exotic Armor */}
                {build.components.exoticArmor.length > 0 && (
                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ color: '#FFD700', fontSize: '0.9rem' }}>🛡️ Exotic Armor:</strong>
                    <div style={{ marginTop: '8px' }}>
                      {build.components.exoticArmor.map((item, i) => (
                        <div key={i} style={{
                          background: 'rgba(255, 215, 0, 0.1)',
                          border: '1px solid rgba(255, 215, 0, 0.3)',
                          borderRadius: '8px',
                          padding: '10px',
                          marginBottom: '8px'
                        }}>
                          <div style={{ color: '#FFD700', fontWeight: 'bold' }}>{item.name}</div>
                          <div style={{ color: '#b3b3b3', fontSize: '0.85rem', marginTop: '4px' }}>
                            {item.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Exotic Weapons */}
                {build.components.exoticWeapons.length > 0 && (
                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ color: '#FFD700', fontSize: '0.9rem' }}>⚔️ Exotic Weapons:</strong>
                    <div style={{ marginTop: '8px' }}>
                      {build.components.exoticWeapons.map((item, i) => (
                        <div key={i} style={{
                          background: 'rgba(255, 215, 0, 0.1)',
                          border: '1px solid rgba(255, 215, 0, 0.3)',
                          borderRadius: '8px',
                          padding: '10px',
                          marginBottom: '8px'
                        }}>
                          <div style={{ color: '#FFD700', fontWeight: 'bold' }}>{item.name}</div>
                          <div style={{ color: '#b3b3b3', fontSize: '0.85rem', marginTop: '4px' }}>
                            {item.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mods */}
                {build.components.mods.length > 0 && (
                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ color: '#4CAF50', fontSize: '0.9rem' }}>🛠️ Essential Mods:</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                      {build.components.mods.slice(0, 6).map((item, i) => (
                        <span key={i} style={{
                          background: 'rgba(76, 175, 80, 0.2)',
                          color: '#4CAF50',
                          padding: '6px 12px',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          border: '1px solid rgba(76, 175, 80, 0.3)'
                        }}>
                          {item.name}
                        </span>
                      ))}
                      {build.components.mods.length > 6 && (
                        <span style={{
                          color: '#b3b3b3',
                          fontSize: '0.85rem',
                          fontStyle: 'italic'
                        }}>
                          +{build.components.mods.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Legendary Weapons */}
                {build.components.legendaryWeapons.length > 0 && (
                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ color: '#9C27B0', fontSize: '0.9rem' }}>🔫 Recommended Weapons:</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                      {build.components.legendaryWeapons.slice(0, 4).map((item, i) => (
                        <span key={i} style={{
                          background: 'rgba(156, 39, 176, 0.2)',
                          color: '#9C27B0',
                          padding: '6px 12px',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          border: '1px solid rgba(156, 39, 176, 0.3)'
                        }}>
                          {item.name}
                        </span>
                      ))}
                      {build.components.legendaryWeapons.length > 4 && (
                        <span style={{
                          color: '#b3b3b3',
                          fontSize: '0.85rem',
                          fontStyle: 'italic'
                        }}>
                          +{build.components.legendaryWeapons.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Aspects & Fragments */}
                {(build.components.aspects.length > 0 || build.components.fragments.length > 0) && (
                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ color: '#DA70D6', fontSize: '0.9rem' }}>🔮 Subclass Components:</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                      {[...build.components.aspects, ...build.components.fragments].map((item, i) => (
                        <span key={i} style={{
                          background: 'rgba(138, 43, 226, 0.2)',
                          color: '#DA70D6',
                          padding: '6px 12px',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          border: '1px solid rgba(138, 43, 226, 0.3)'
                        }}>
                          {item.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Stats Priority */}
              {build.components.stats && Object.keys(build.components.stats).length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ color: '#f4a724', marginBottom: '10px', fontSize: '1rem' }}>
                    📊 Stat Priorities
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {Object.entries(build.components.stats).map(([stat, value]) => (
                      <div key={stat} style={{
                        background: 'rgba(33, 150, 243, 0.2)',
                        border: '1px solid rgba(33, 150, 243, 0.3)',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{ color: '#2196F3', fontWeight: 'bold', fontSize: '0.9rem' }}>
                          {stat.charAt(0).toUpperCase() + stat.slice(1)}:
                        </span>
                        <span style={{ color: '#e6e6e6', fontSize: '0.9rem' }}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Playstyle Info */}
              {build.playstyle && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '15px'
                  }}>
                    {/* Strengths */}
                    {build.playstyle.strengths && build.playstyle.strengths.length > 0 && (
                      <div>
                        <h4 style={{ color: '#4CAF50', marginBottom: '8px', fontSize: '0.9rem' }}>
                          ✅ Strengths
                        </h4>
                        <ul style={{
                          margin: 0,
                          paddingLeft: '15px',
                          color: '#b3b3b3',
                          fontSize: '0.85rem'
                        }}>
                          {build.playstyle.strengths.map((strength, i) => (
                            <li key={i}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Weaknesses */}
                    {build.playstyle.weaknesses && build.playstyle.weaknesses.length > 0 && (
                      <div>
                        <h4 style={{ color: '#FF9800', marginBottom: '8px', fontSize: '0.9rem' }}>
                          ⚠️ Considerations
                        </h4>
                        <ul style={{
                          margin: 0,
                          paddingLeft: '15px',
                          color: '#b3b3b3',
                          fontSize: '0.85rem'
                        }}>
                          {build.playstyle.weaknesses.map((weakness, i) => (
                            <li key={i}>{weakness}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Best Activities */}
                    {build.playstyle.bestActivities && build.playstyle.bestActivities.length > 0 && (
                      <div>
                        <h4 style={{ color: '#2196F3', marginBottom: '8px', fontSize: '0.9rem' }}>
                          🎮 Best For
                        </h4>
                        <ul style={{
                          margin: 0,
                          paddingLeft: '15px',
                          color: '#b3b3b3',
                          fontSize: '0.85rem'
                        }}>
                          {build.playstyle.bestActivities.map((activity, i) => (
                            <li key={i}>{activity}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '20px',
                paddingTop: '15px',
                borderTop: '1px solid rgba(244, 167, 36, 0.2)'
              }}>
                <button style={{
                  background: 'linear-gradient(45deg, #f4a724, #ff8c00)',
                  color: '#000',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(45deg, #ff8c00, #f4a724)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(45deg, #f4a724, #ff8c00)';
                  e.target.style.transform = 'translateY(0)';
                }}
                onClick={() => {
                  // Future: Save build functionality
                  alert('Save build feature coming soon!');
                }}
                >
                  💾 Save Build
                </button>

                <button style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#e6e6e6',
                  border: '1px solid rgba(244, 167, 36, 0.3)',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(244, 167, 36, 0.2)';
                  e.target.style.borderColor = '#f4a724';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.borderColor = 'rgba(244, 167, 36, 0.3)';
                }}
                onClick={() => {
                  // Future: Share build functionality
                  const shareText = `Check out this ${build.name} build for Destiny 2: ${build.description}`;
                  if (navigator.share) {
                    navigator.share({ text: shareText });
                  } else {
                    navigator.clipboard.writeText(shareText);
                    alert('Build description copied to clipboard!');
                  }
                }}
                >
                  🔗 Share Build
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Footer tip */}
      <div style={{
        textAlign: 'center',
        color: '#b3b3b3',
        fontSize: '0.85rem',
        fontStyle: 'italic',
        marginTop: '20px',
        padding: '15px',
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '10px'
      }}>
        💡 Tip: Click on any build to see detailed setup instructions and synergy explanations
      </div>
    </div>
  );
};

export default BuildDisplay;