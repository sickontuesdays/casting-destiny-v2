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
            {build.components?.exoticArmor && build.components.exoticArmor.length > 0 && (
              <div style={{
                background: 'rgba(255, 215, 0, 0.2)',
                color: '#FFD700',
                padding: '5px 12px',
                borderRadius: '15px',
                fontSize: '0.85rem',
                border: '1px solid rgba(255, 215, 0, 0.3)'
              }}>
                🔥 {build.components.exoticArmor[0].name}
              </div>
            )}
            
            {build.components?.exoticWeapons && build.components.exoticWeapons.length > 0 && (
              <div style={{
                background: 'rgba(255, 215, 0, 0.2)',
                color: '#FFD700',
                padding: '5px 12px',
                borderRadius: '15px',
                fontSize: '0.85rem',
                border: '1px solid rgba(255, 215, 0, 0.3)'
              }}>
                ⚔️ {build.components.exoticWeapons[0].name}
              </div>
            )}

            <div style={{
              background: 'rgba(138, 43, 226, 0.2)',
              color: '#DA70D6',
              padding: '5px 12px',
              borderRadius: '15px',
              fontSize: '0.85rem',
              border: '1px solid rgba(138, 43, 226, 0.3)'
            }}>
              ⚡ {build.focus?.charAt(0).toUpperCase() + build.focus?.slice(1)} Focus
            </div>
          </div>

          {/* Expanded Details */}
          {expandedBuild === index && (
            <div style={{
              borderTop: '1px solid rgba(244, 167, 36, 0.2)',
              paddingTop: '20px'
            }}>
              {/* Complete Build Guide */}
              {build.buildGuide && (
                <div style={{ marginBottom: '25px' }}>
                  <h4 style={{ color: '#f4a724', marginBottom: '20px', fontSize: '1.2rem' }}>
                    📋 Complete Build Loadout
                  </h4>

                  {/* Subclass Setup */}
                  {build.buildGuide.subclass && (
                    <div style={{ marginBottom: '20px' }}>
                      <h5 style={{ color: '#DA70D6', marginBottom: '10px', fontSize: '1rem' }}>
                        🔮 Subclass Configuration
                      </h5>
                      <div style={{ 
                        background: 'rgba(138, 43, 226, 0.1)', 
                        borderRadius: '10px', 
                        padding: '15px',
                        border: '1px solid rgba(138, 43, 226, 0.2)'
                      }}>
                        {build.buildGuide.subclass.super && (
                          <div style={{ marginBottom: '10px' }}>
                            <strong style={{ color: '#DA70D6' }}>Super:</strong>
                            <span style={{ color: '#e6e6e6', marginLeft: '10px' }}>{build.buildGuide.subclass.super}</span>
                          </div>
                        )}
                        {build.buildGuide.subclass.abilities?.class && (
                          <div style={{ marginBottom: '10px' }}>
                            <strong style={{ color: '#DA70D6' }}>Class Ability:</strong>
                            <span style={{ color: '#e6e6e6', marginLeft: '10px' }}>{build.buildGuide.subclass.abilities.class}</span>
                          </div>
                        )}
                        {build.buildGuide.subclass.abilities?.movement && (
                          <div style={{ marginBottom: '10px' }}>
                            <strong style={{ color: '#DA70D6' }}>Movement:</strong>
                            <span style={{ color: '#e6e6e6', marginLeft: '10px' }}>{build.buildGuide.subclass.abilities.movement}</span>
                          </div>
                        )}
                        {build.buildGuide.subclass.abilities?.melee && (
                          <div style={{ marginBottom: '10px' }}>
                            <strong style={{ color: '#DA70D6' }}>Melee:</strong>
                            <span style={{ color: '#e6e6e6', marginLeft: '10px' }}>{build.buildGuide.subclass.abilities.melee}</span>
                          </div>
                        )}
                        
                        {/* Aspects */}
                        {build.buildGuide.subclass.aspects && build.buildGuide.subclass.aspects.length > 0 && (
                          <div style={{ marginTop: '15px' }}>
                            <strong style={{ color: '#DA70D6' }}>Aspects:</strong>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                              {build.buildGuide.subclass.aspects.map((aspect, i) => (
                                <span key={i} style={{
                                  background: 'rgba(138, 43, 226, 0.3)',
                                  color: '#DA70D6',
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontSize: '0.8rem'
                                }}>
                                  {aspect}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Fragments */}
                        {build.buildGuide.subclass.fragments && build.buildGuide.subclass.fragments.length > 0 && (
                          <div style={{ marginTop: '15px' }}>
                            <strong style={{ color: '#DA70D6' }}>Fragments:</strong>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                              {build.buildGuide.subclass.fragments.map((fragment, i) => (
                                <span key={i} style={{
                                  background: 'rgba(100, 149, 237, 0.2)',
                                  color: '#6495ED',
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontSize: '0.8rem'
                                }}>
                                  {fragment}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Weapons */}
                  {build.buildGuide.weapons && (
                    <div style={{ marginBottom: '20px' }}>
                      <h5 style={{ color: '#FFD700', marginBottom: '10px', fontSize: '1rem' }}>
                        ⚔️ Weapon Loadout
                      </h5>
                      <div style={{ 
                        background: 'rgba(255, 215, 0, 0.1)', 
                        borderRadius: '10px', 
                        padding: '15px',
                        border: '1px solid rgba(255, 215, 0, 0.2)'
                      }}>
                        {build.buildGuide.weapons.primary && (
                          <div style={{ marginBottom: '8px' }}>
                            <strong style={{ color: '#FFD700' }}>Kinetic:</strong>
                            <span style={{ color: '#e6e6e6', marginLeft: '10px' }}>{build.buildGuide.weapons.primary}</span>
                          </div>
                        )}
                        {build.buildGuide.weapons.secondary && (
                          <div style={{ marginBottom: '8px' }}>
                            <strong style={{ color: '#FFD700' }}>Energy:</strong>
                            <span style={{ color: '#e6e6e6', marginLeft: '10px' }}>{build.buildGuide.weapons.secondary}</span>
                          </div>
                        )}
                        {build.buildGuide.weapons.heavy && (
                          <div style={{ marginBottom: '8px' }}>
                            <strong style={{ color: '#FFD700' }}>Heavy:</strong>
                            <span style={{ color: '#e6e6e6', marginLeft: '10px' }}>{build.buildGuide.weapons.heavy}</span>
                          </div>
                        )}
                        {build.buildGuide.weapons.exotic && (
                          <div style={{ marginBottom: '15px' }}>
                            <strong style={{ color: '#FFD700' }}>🔥 Exotic:</strong>
                            <span style={{ color: '#FFD700', marginLeft: '10px', fontWeight: 'bold' }}>{build.buildGuide.weapons.exotic}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Armor */}
                  {build.buildGuide.armor && (
                    <div style={{ marginBottom: '20px' }}>
                      <h5 style={{ color: '#2196F3', marginBottom: '10px', fontSize: '1rem' }}>
                        🛡️ Armor Setup
                      </h5>
                      <div style={{ 
                        background: 'rgba(33, 150, 243, 0.1)', 
                        borderRadius: '10px', 
                        padding: '15px',
                        border: '1px solid rgba(33, 150, 243, 0.2)'
                      }}>
                        {build.buildGuide.armor.exotic && (
                          <div style={{ marginBottom: '15px' }}>
                            <strong style={{ color: '#2196F3' }}>🔥 Exotic Armor:</strong>
                            <span style={{ color: '#FFD700', marginLeft: '10px', fontWeight: 'bold' }}>{build.buildGuide.armor.exotic}</span>
                          </div>
                        )}
                        {build.buildGuide.armor.priority && (
                          <div style={{ marginBottom: '8px' }}>
                            <strong style={{ color: '#2196F3' }}>Priority:</strong>
                            <span style={{ color: '#e6e6e6', marginLeft: '10px' }}>{build.buildGuide.armor.priority}</span>
                          </div>
                        )}
                        {build.buildGuide.armor.stats && (
                          <div>
                            <strong style={{ color: '#2196F3' }}>Stat Focus:</strong>
                            <span style={{ color: '#e6e6e6', marginLeft: '10px' }}>{build.buildGuide.armor.stats}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mods */}
                  {build.buildGuide.mods && (
                    <div style={{ marginBottom: '20px' }}>
                      <h5 style={{ color: '#4CAF50', marginBottom: '10px', fontSize: '1rem' }}>
                        🛠️ Essential Mods
                      </h5>
                      <div style={{ 
                        background: 'rgba(76, 175, 80, 0.1)', 
                        borderRadius: '10px', 
                        padding: '15px',
                        border: '1px solid rgba(76, 175, 80, 0.2)'
                      }}>
                        {build.buildGuide.mods.essential && build.buildGuide.mods.essential.length > 0 && (
                          <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#4CAF50' }}>Essential Mods:</strong>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                              {build.buildGuide.mods.essential.map((mod, i) => (
                                <span key={i} style={{
                                  background: 'rgba(76, 175, 80, 0.2)',
                                  color: '#4CAF50',
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontSize: '0.8rem'
                                }}>
                                  {mod}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {build.buildGuide.mods.recommended && build.buildGuide.mods.recommended.length > 0 && (
                          <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#4CAF50' }}>Recommended:</strong>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                              {build.buildGuide.mods.recommended.slice(0, 8).map((mod, i) => (
                                <span key={i} style={{
                                  background: 'rgba(76, 175, 80, 0.15)',
                                  color: '#81C784',
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontSize: '0.8rem'
                                }}>
                                  {typeof mod === 'string' ? mod : mod.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {build.buildGuide.mods.priority && (
                          <div>
                            <strong style={{ color: '#4CAF50' }}>Priority:</strong>
                            <span style={{ color: '#e6e6e6', marginLeft: '10px', fontSize: '0.9rem' }}>{build.buildGuide.mods.priority}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Gameplay Guide */}
                  {build.buildGuide.gameplay && (
                    <div style={{ marginBottom: '20px' }}>
                      <h5 style={{ color: '#E91E63', marginBottom: '10px', fontSize: '1rem' }}>
                        🎮 Gameplay Strategy
                      </h5>
                      <div style={{ 
                        background: 'rgba(233, 30, 99, 0.1)', 
                        borderRadius: '10px', 
                        padding: '15px',
                        border: '1px solid rgba(233, 30, 99, 0.2)'
                      }}>
                        {build.buildGuide.gameplay.style && (
                          <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#E91E63' }}>Playstyle:</strong>
                            <span style={{ color: '#e6e6e6', marginLeft: '10px' }}>{build.buildGuide.gameplay.style}</span>
                          </div>
                        )}
                        {build.buildGuide.gameplay.activities && build.buildGuide.gameplay.activities.length > 0 && (
                          <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#E91E63' }}>Best Activities:</strong>
                            <div style={{ marginTop: '6px' }}>
                              {build.buildGuide.gameplay.activities.map((activity, i) => (
                                <span key={i} style={{
                                  background: 'rgba(233, 30, 99, 0.2)',
                                  color: '#EC407A',
                                  padding: '3px 8px',
                                  borderRadius: '10px',
                                  fontSize: '0.8rem',
                                  marginRight: '6px',
                                  marginBottom: '4px',
                                  display: 'inline-block'
                                }}>
                                  {activity}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {build.buildGuide.gameplay.tips && build.buildGuide.gameplay.tips.length > 0 && (
                          <div>
                            <strong style={{ color: '#E91E63' }}>Pro Tips:</strong>
                            <ul style={{
                              margin: '8px 0 0 0',
                              paddingLeft: '20px',
                              color: '#e6e6e6'
                            }}>
                              {build.buildGuide.gameplay.tips.slice(0, 4).map((tip, i) => (
                                <li key={i} style={{
                                  marginBottom: '6px',
                                  fontSize: '0.9rem',
                                  lineHeight: '1.4'
                                }}>
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Original Playstyle Info */}
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

              {/* Build Template Info */}
              {build.buildTemplate && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ color: '#00BCD4', marginBottom: '12px', fontSize: '1rem' }}>
                    📚 Build Template Information
                  </h4>
                  <div style={{
                    background: 'rgba(0, 188, 212, 0.1)',
                    borderRadius: '10px',
                    padding: '15px',
                    border: '1px solid rgba(0, 188, 212, 0.2)'
                  }}>
                    {build.buildTemplate.keyExotics && build.buildTemplate.keyExotics.length > 0 && (
                      <div style={{ marginBottom: '10px' }}>
                        <strong style={{ color: '#00BCD4' }}>Key Exotics:</strong>
                        <span style={{ color: '#e6e6e6', marginLeft: '10px' }}>
                          {build.buildTemplate.keyExotics.join(', ')}
                        </span>
                      </div>
                    )}
                    {build.buildTemplate.essentialMods && build.buildTemplate.essentialMods.length > 0 && (
                      <div style={{ marginBottom: '10px' }}>
                        <strong style={{ color: '#00BCD4' }}>Essential Mods:</strong>
                        <span style={{ color: '#e6e6e6', marginLeft: '10px' }}>
                          {build.buildTemplate.essentialMods.join(', ')}
                        </span>
                      </div>
                    )}
                    {build.buildTemplate.activities && build.buildTemplate.activities.length > 0 && (
                      <div>
                        <strong style={{ color: '#00BCD4' }}>Recommended Activities:</strong>
                        <span style={{ color: '#e6e6e6', marginLeft: '10px' }}>
                          {build.buildTemplate.activities.join(', ')}
                        </span>
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
                  // Create detailed build text for sharing
                  const buildText = `${build.name} - Destiny 2 Build Guide\n\n` +
                    `Focus: ${build.focus} build with ${build.synergyScore}% synergy match\n` +
                    (build.buildGuide?.armor?.exotic ? `Exotic: ${build.buildGuide.armor.exotic}\n` : '') +
                    (build.buildTemplate?.activities ? `Best for: ${build.buildTemplate.activities.join(', ')}\n` : '') +
                    `\nComplete guide: ${window.location.href}`;
                  
                  if (navigator.share) {
                    navigator.share({ text: buildText });
                  } else {
                    navigator.clipboard.writeText(buildText);
                    alert('Complete build guide copied to clipboard!');
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
        💡 Tip: Click on any build to see complete loadout details, mod placements, and gameplay rotation
      </div>
    </div>
  );
};

export default BuildDisplay;