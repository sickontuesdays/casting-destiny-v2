import React, { useState } from 'react';

const BuildDisplay = ({ builds, searchQuery, totalFound, playerMode = false }) => {
  const [expandedBuild, setExpandedBuild] = useState(null);
  const [selectedLoadout, setSelectedLoadout] = useState(null);

  if (!builds || builds.length === 0) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 30, 46, 0.95), rgba(22, 33, 62, 0.95))',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        padding: '32px',
        border: '1px solid rgba(79, 172, 254, 0.2)',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '3rem',
          marginBottom: '16px'
        }}>🎯</div>
        <div style={{ 
          color: '#B8BCC8', 
          fontSize: '1.1rem',
          marginBottom: '8px'
        }}>
          No builds found for "{searchQuery}"
        </div>
        <div style={{ 
          color: '#6B7280', 
          fontSize: '0.9rem'
        }}>
          Try different keywords or check our quick search options
        </div>
      </div>
    );
  }

  const toggleExpanded = (index) => {
    setExpandedBuild(expandedBuild === index ? null : index);
  };

  const handleLoadoutSelect = (build) => {
    setSelectedLoadout(build);
    // TODO: Implement loadout transfer logic
    console.log('Selected loadout:', build);
  };

  const getBuildTypeIcon = (buildType) => {
    const icons = {
      'grenade': '💥',
      'ability': '⚡',
      'weapon': '🔫',
      'stealth': '👻',
      'healing': '💚',
      'super': '✨',
      'melee': '👊',
      'defense': '🛡️',
      'movement': '💨'
    };
    return icons[buildType] || '🎯';
  };

  const getMatchScoreColor = (score) => {
    if (score >= 90) return '#10B981'; // Green
    if (score >= 80) return '#F59E0B'; // Amber
    if (score >= 70) return '#EF4444'; // Red
    return '#6B7280'; // Gray
  };

  const getDamageTypeColor = (damageType) => {
    const colors = {
      'Solar': '#F97316',
      'Arc': '#3B82F6', 
      'Void': '#8B5CF6',
      'Stasis': '#06B6D4',
      'Strand': '#10B981',
      'Kinetic': '#9CA3AF'
    };
    return colors[damageType] || '#9CA3AF';
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(30, 30, 46, 0.95), rgba(22, 33, 62, 0.95))',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid rgba(79, 172, 254, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{
            color: '#4FACFE',
            fontSize: '1.5rem',
            margin: '0 0 4px 0',
            fontWeight: '600'
          }}>
            🎯 Build Results
          </h2>
          <div style={{
            color: '#B8BCC8',
            fontSize: '0.9rem'
          }}>
            Found {totalFound} build{totalFound !== 1 ? 's' : ''} for "{searchQuery}"
            {playerMode && <span style={{ color: '#10B981' }}> • From your inventory</span>}
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          <button style={{
            background: 'rgba(79, 172, 254, 0.1)',
            border: '1px solid rgba(79, 172, 254, 0.3)',
            color: '#4FACFE',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}>
            📊 Compare All
          </button>
          <button style={{
            background: 'rgba(79, 172, 254, 0.1)', 
            border: '1px solid rgba(79, 172, 254, 0.3)',
            color: '#4FACFE',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}>
            💾 Save Collection
          </button>
        </div>
      </div>

      {/* Build Cards */}
      {builds.map((build, index) => (
        <div 
          key={index}
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
            marginBottom: '16px',
            border: `2px solid ${expandedBuild === index ? '#4FACFE' : 'rgba(79, 172, 254, 0.2)'}`,
            transition: 'all 0.3s ease',
            overflow: 'hidden'
          }}
        >
          {/* Build Header */}
          <div 
            style={{
              padding: '20px',
              cursor: 'pointer',
              background: expandedBuild === index ? 'rgba(79, 172, 254, 0.05)' : 'transparent'
            }}
            onClick={() => toggleExpanded(index)}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              {/* Build Info */}
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>
                    {getBuildTypeIcon(build.buildType || build.focus)}
                  </span>
                  <h3 style={{
                    color: '#E5E7EB',
                    fontSize: '1.3rem',
                    margin: 0,
                    fontWeight: '600'
                  }}>
                    {build.name}
                  </h3>
                  
                  {/* Build Tags */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {build.buildTemplate?.keyExotics?.slice(0, 1).map((exotic, i) => (
                      <span key={i} style={{
                        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                        color: '#000',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: '600'
                      }}>
                        🔥 {exotic}
                      </span>
                    ))}
                    
                    {build.focus && (
                      <span style={{
                        background: getDamageTypeColor(build.components?.exoticArmor?.[0]?.damageType || 'Kinetic'),
                        color: '#000',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: '600'
                      }}>
                        {build.focus.charAt(0).toUpperCase() + build.focus.slice(1)}
                      </span>
                    )}
                  </div>
                </div>

                <p style={{
                  color: '#B8BCC8',
                  margin: '0 0 12px 0',
                  fontSize: '0.95rem',
                  lineHeight: '1.4'
                }}>
                  {build.description}
                </p>

                {/* Quick Stats */}
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}>
                  {build.buildGuide?.armor?.stats && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#9CA3AF',
                      fontSize: '0.8rem'
                    }}>
                      <span>📊</span>
                      <span>{build.buildGuide.armor.stats}</span>
                    </div>
                  )}
                  
                  {build.buildTemplate?.activities && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#9CA3AF',
                      fontSize: '0.8rem'
                    }}>
                      <span>🎮</span>
                      <span>{build.buildTemplate.activities.slice(0, 2).join(', ')}</span>
                    </div>
                  )}
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#9CA3AF',
                    fontSize: '0.8rem'
                  }}>
                    <span>🔧</span>
                    <span>{(build.allItems || []).length} components</span>
                  </div>
                </div>
              </div>

              {/* Score and Actions */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                {/* Match Score */}
                <div style={{
                  background: `linear-gradient(135deg, ${getMatchScoreColor(build.synergyScore)}, ${getMatchScoreColor(build.synergyScore)}CC)`,
                  color: '#000',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  minWidth: '80px'
                }}>
                  <div style={{
                    fontSize: '1.2rem',
                    fontWeight: '700',
                    lineHeight: '1'
                  }}>
                    {build.synergyScore}%
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    opacity: 0.8
                  }}>
                    MATCH
                  </div>
                </div>

                {/* Quick Actions */}
                {playerMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLoadoutSelect(build);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #10B981, #059669)',
                      color: '#000',
                      border: 'none',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)';
                    }}
                  >
                    📦 Equip Build
                  </button>
                )}

                {/* Expand Arrow */}
                <div style={{
                  color: '#4FACFE',
                  fontSize: '1.2rem',
                  transform: expandedBuild === index ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }}>
                  ▼
                </div>
              </div>
            </div>
          </div>

          {/* Expanded Details */}
          {expandedBuild === index && (
            <div style={{
              borderTop: '1px solid rgba(79, 172, 254, 0.2)',
              background: 'rgba(0, 0, 0, 0.2)'
            }}>
              {/* Loadout Overview */}
              <div style={{ padding: '20px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '20px'
                }}>
                  {/* Weapons Section */}
                  {build.buildGuide?.weapons && (
                    <div style={{
                      background: 'rgba(79, 172, 254, 0.05)',
                      borderRadius: '8px',
                      padding: '16px',
                      border: '1px solid rgba(79, 172, 254, 0.1)'
                    }}>
                      <h4 style={{
                        color: '#4FACFE',
                        margin: '0 0 12px 0',
                        fontSize: '1rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        ⚔️ Weapons
                      </h4>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {build.buildGuide.weapons.kinetic && (
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '6px 0'
                          }}>
                            <span style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Kinetic:</span>
                            <span style={{ color: '#E5E7EB', fontSize: '0.9rem' }}>
                              {build.buildGuide.weapons.kinetic}
                            </span>
                          </div>
                        )}
                        
                        {build.buildGuide.weapons.energy && (
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '6px 0'
                          }}>
                            <span style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Energy:</span>
                            <span style={{ color: '#E5E7EB', fontSize: '0.9rem' }}>
                              {build.buildGuide.weapons.energy}
                            </span>
                          </div>
                        )}
                        
                        {build.buildGuide.weapons.heavy && (
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '6px 0'
                          }}>
                            <span style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Heavy:</span>
                            <span style={{ color: '#E5E7EB', fontSize: '0.9rem' }}>
                              {build.buildGuide.weapons.heavy}
                            </span>
                          </div>
                        )}
                        
                        {build.buildGuide.weapons.exotic && (
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '6px 0',
                            marginTop: '8px',
                            borderTop: '1px solid rgba(79, 172, 254, 0.2)'
                          }}>
                            <span style={{ color: '#F59E0B', fontSize: '0.8rem', fontWeight: '600' }}>🔥 Exotic:</span>
                            <span style={{ color: '#F59E0B', fontSize: '0.9rem', fontWeight: '600' }}>
                              {build.buildGuide.weapons.exotic}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Armor Section */}
                  {build.buildGuide?.armor && (
                    <div style={{
                      background: 'rgba(34, 197, 94, 0.05)',
                      borderRadius: '8px',
                      padding: '16px',
                      border: '1px solid rgba(34, 197, 94, 0.1)'
                    }}>
                      <h4 style={{
                        color: '#22C55E',
                        margin: '0 0 12px 0',
                        fontSize: '1rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        🛡️ Armor Setup
                      </h4>
                      
                      {build.buildGuide.armor.exotic && (
                        <div style={{
                          background: 'rgba(245, 158, 11, 0.1)',
                          border: '1px solid rgba(245, 158, 11, 0.2)',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          marginBottom: '12px'
                        }}>
                          <div style={{
                            color: '#F59E0B',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            marginBottom: '4px'
                          }}>
                            🔥 Exotic Armor
                          </div>
                          <div style={{
                            color: '#E5E7EB',
                            fontSize: '0.9rem',
                            fontWeight: '600'
                          }}>
                            {build.buildGuide.armor.exotic}
                          </div>
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {build.buildGuide.armor.priority && (
                          <div>
                            <span style={{ color: '#22C55E', fontSize: '0.8rem', fontWeight: '600' }}>
                              Priority: 
                            </span>
                            <span style={{ color: '#E5E7EB', fontSize: '0.9rem', marginLeft: '8px' }}>
                              {build.buildGuide.armor.priority}
                            </span>
                          </div>
                        )}
                        
                        {build.buildGuide.armor.stats && (
                          <div>
                            <span style={{ color: '#22C55E', fontSize: '0.8rem', fontWeight: '600' }}>
                              Stats: 
                            </span>
                            <span style={{ color: '#E5E7EB', fontSize: '0.9rem', marginLeft: '8px' }}>
                              {build.buildGuide.armor.stats}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Subclass Section */}
                  {build.buildGuide?.subclass && (
                    <div style={{
                      background: 'rgba(139, 92, 246, 0.05)',
                      borderRadius: '8px',
                      padding: '16px',
                      border: '1px solid rgba(139, 92, 246, 0.1)'
                    }}>
                      <h4 style={{
                        color: '#8B5CF6',
                        margin: '0 0 12px 0',
                        fontSize: '1rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        🔮 Subclass
                      </h4>
                      
                      {build.buildGuide.subclass.super && (
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ color: '#8B5CF6', fontSize: '0.8rem', fontWeight: '600' }}>
                            Super: 
                          </span>
                          <span style={{ color: '#E5E7EB', fontSize: '0.9rem', marginLeft: '8px' }}>
                            {build.buildGuide.subclass.super}
                          </span>
                        </div>
                      )}
                      
                      {build.buildGuide.subclass.aspects && (
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ color: '#8B5CF6', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                            Aspects:
                          </div>
                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px'
                          }}>
                            {build.buildGuide.subclass.aspects.slice(0, 3).map((aspect, i) => (
                              <span key={i} style={{
                                background: 'rgba(139, 92, 246, 0.2)',
                                color: '#C4B5FD',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.7rem'
                              }}>
                                {aspect}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {build.buildGuide.subclass.fragments && (
                        <div>
                          <div style={{ color: '#8B5CF6', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                            Fragments:
                          </div>
                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px'
                          }}>
                            {build.buildGuide.subclass.fragments.slice(0, 4).map((fragment, i) => (
                              <span key={i} style={{
                                background: 'rgba(59, 130, 246, 0.2)',
                                color: '#93C5FD',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.7rem'
                              }}>
                                {fragment}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Mods and Gameplay */}
                <div style={{
                  marginTop: '20px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px'
                }}>
                  {/* Essential Mods */}
                  {build.buildGuide?.mods?.essential && (
                    <div style={{
                      background: 'rgba(34, 197, 94, 0.05)',
                      borderRadius: '8px',
                      padding: '16px',
                      border: '1px solid rgba(34, 197, 94, 0.1)'
                    }}>
                      <h4 style={{
                        color: '#22C55E',
                        margin: '0 0 12px 0',
                        fontSize: '1rem',
                        fontWeight: '600'
                      }}>
                        🛠️ Essential Mods
                      </h4>
                      
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px'
                      }}>
                        {build.buildGuide.mods.essential.slice(0, 6).map((mod, i) => (
                          <span key={i} style={{
                            background: 'rgba(34, 197, 94, 0.2)',
                            color: '#86EFAC',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: '500'
                          }}>
                            {mod}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Gameplay Tips */}
                  {build.buildGuide?.gameplay?.tips && (
                    <div style={{
                      background: 'rgba(245, 158, 11, 0.05)',
                      borderRadius: '8px',
                      padding: '16px',
                      border: '1px solid rgba(245, 158, 11, 0.1)'
                    }}>
                      <h4 style={{
                        color: '#F59E0B',
                        margin: '0 0 12px 0',
                        fontSize: '1rem',
                        fontWeight: '600'
                      }}>
                        💡 Pro Tips
                      </h4>
                      
                      <ul style={{
                        margin: 0,
                        paddingLeft: '16px',
                        color: '#E5E7EB',
                        fontSize: '0.85rem',
                        lineHeight: '1.4'
                      }}>
                        {build.buildGuide.gameplay.tips.slice(0, 3).map((tip, i) => (
                          <li key={i} style={{ marginBottom: '4px' }}>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{
                  marginTop: '20px',
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'center',
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(79, 172, 254, 0.2)'
                }}>
                  <button style={{
                    background: 'linear-gradient(135deg, #4FACFE, #00F2FE)',
                    color: '#1a1a2e',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}>
                    💾 Save Build
                  </button>

                  <button style={{
                    background: 'rgba(79, 172, 254, 0.1)',
                    color: '#4FACFE',
                    border: '1px solid rgba(79, 172, 254, 0.3)',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}>
                    🔗 Share Build
                  </button>

                  <button style={{
                    background: 'rgba(79, 172, 254, 0.1)',
                    color: '#4FACFE',
                    border: '1px solid rgba(79, 172, 254, 0.3)',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}>
                    🔍 View Similar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Footer Stats */}
      <div style={{
        marginTop: '20px',
        padding: '16px',
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '8px',
        border: '1px solid rgba(79, 172, 254, 0.1)',
        textAlign: 'center'
      }}>
        <div style={{
          color: '#B8BCC8',
          fontSize: '0.9rem'
        }}>
          💡 <strong>Tip:</strong> Click on builds to see complete loadout details and mod recommendations
        </div>
      </div>
    </div>
  );
};

export default BuildDisplay;