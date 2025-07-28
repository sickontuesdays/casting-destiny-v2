import React, { useState } from 'react';
import DIMStyleItemCard from './DIMStyleItemCard';

const DIMStyleBuildDisplay = ({ builds, searchQuery, totalFound, onApplyBuild }) => {
  const [expandedBuild, setExpandedBuild] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());

  if (!builds || builds.length === 0) {
    return (
      <div style={{
        background: '#1e1e20',
        border: '1px solid #464647',
        borderRadius: '8px',
        padding: '24px',
        textAlign: 'center',
        color: '#d4d4d4'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🔍</div>
        <h3 style={{ color: '#ffffff', marginBottom: '8px' }}>No builds found</h3>
        <p style={{ opacity: 0.7 }}>
          No builds found for "{searchQuery}". Try different keywords or check your inventory.
        </p>
      </div>
    );
  }

  const toggleExpanded = (index) => {
    setExpandedBuild(expandedBuild === index ? null : index);
  };

  const toggleItemSelection = (item) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(item.hash)) {
      newSelected.delete(item.hash);
    } else {
      newSelected.add(item.hash);
    }
    setSelectedItems(newSelected);
  };

  const getClassIcon = (classType) => {
    switch (classType) {
      case 0: return '🛡️'; // Titan
      case 1: return '🏹'; // Hunter  
      case 2: return '🔮'; // Warlock
      default: return '⚡';
    }
  };

  const getViabilityColor = (score) => {
    if (score >= 80) return '#4CAF50'; // Green
    if (score >= 60) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  return (
    <div style={{
      background: '#1e1e20',
      border: '1px solid #464647',
      borderRadius: '8px',
      padding: '16px'
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid #464647',
        paddingBottom: '12px',
        marginBottom: '16px'
      }}>
        <h2 style={{
          color: '#ffffff',
          fontSize: '18px',
          margin: '0 0 8px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🎯 Builds for "{searchQuery}"
        </h2>
        <div style={{
          color: '#d4d4d4',
          fontSize: '14px',
          opacity: 0.8
        }}>
          Found {totalFound} build{totalFound !== 1 ? 's' : ''} • Click to expand details
        </div>
      </div>

      {/* Build List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {builds.map((build, index) => (
          <div
            key={index}
            style={{
              background: '#2b2d35',
              border: '1px solid #464647',
              borderRadius: '8px',
              overflow: 'hidden',
              transition: 'all 0.2s ease'
            }}
          >
            {/* Build Header - Always Visible */}
            <div
              onClick={() => toggleExpanded(index)}
              style={{
                padding: '16px',
                cursor: 'pointer',
                background: expandedBuild === index ? '#323439' : '#2b2d35',
                borderBottom: expandedBuild === index ? '1px solid #464647' : 'none'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <h3 style={{
                  color: '#ffffff',
                  fontSize: '16px',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {build.components?.primaryExotic && getClassIcon(build.components.primaryExotic.classType)}
                  {build.name}
                </h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Viability Score */}
                  <div style={{
                    background: getViabilityColor(build.viability || 0),
                    color: '#ffffff',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {build.viability || 0}% Match
                  </div>
                  
                  {/* Expand Arrow */}
                  <div style={{
                    color: '#d4d4d4',
                    fontSize: '12px',
                    transform: expandedBuild === index ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}>
                    ▼
                  </div>
                </div>
              </div>
              
              {/* Build Description */}
              <p style={{
                color: '#d4d4d4',
                fontSize: '14px',
                margin: '0 0 12px 0',
                opacity: 0.8
              }}>
                {build.description}
              </p>

              {/* Quick Item Preview */}
              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}>
                {/* Primary Exotic Preview */}
                {build.components?.primaryExotic && (
                  <DIMStyleItemCard
                    item={build.components.primaryExotic}
                    showDetails={false}
                  />
                )}
                
                {/* Supporting Items Preview */}
                {build.components?.supportingItems?.slice(0, 3).map((item, i) => (
                  <DIMStyleItemCard
                    key={item.hash}
                    item={item}
                    showDetails={false}
                  />
                ))}
                
                {/* More Items Indicator */}
                {build.components?.supportingItems?.length > 3 && (
                  <div style={{
                    width: '100px',
                    height: '100px',
                    background: '#1e1e20',
                    border: '2px dashed #464647',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#d4d4d4',
                    fontSize: '12px'
                  }}>
                    +{build.components.supportingItems.length - 3} more
                  </div>
                )}
              </div>
            </div>

            {/* Expanded Build Details */}
            {expandedBuild === index && (
              <div style={{ padding: '16px' }}>
                {/* Loadout Grid - DIM Style */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '20px',
                  marginBottom: '20px'
                }}>
                  {/* Weapons Section */}
                  <div>
                    <h4 style={{
                      color: '#ffffff',
                      fontSize: '14px',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      ⚔️ Weapons
                    </h4>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px'
                    }}>
                      {['kinetic', 'energy', 'power'].map(slot => {
                        const weapon = build.components?.weapons?.[slot] || 
                                     (build.components?.primaryExotic?.slot === slot ? build.components.primaryExotic : null);
                        return (
                          <div key={slot} style={{
                            background: '#1e1e20',
                            border: '1px solid #464647',
                            borderRadius: '4px',
                            padding: '8px',
                            textAlign: 'center',
                            minHeight: '120px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <div style={{
                              color: '#d4d4d4',
                              fontSize: '10px',
                              marginBottom: '4px',
                              textTransform: 'uppercase'
                            }}>
                              {slot}
                            </div>
                            {weapon ? (
                              <DIMStyleItemCard
                                item={weapon}
                                onClick={() => toggleItemSelection(weapon)}
                                isSelected={selectedItems.has(weapon.hash)}
                              />
                            ) : (
                              <div style={{
                                width: '100px',
                                height: '100px',
                                border: '2px dashed #464647',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#666',
                                fontSize: '24px'
                              }}>
                                ?
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Armor Section */}
                  <div>
                    <h4 style={{
                      color: '#ffffff',
                      fontSize: '14px',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      🛡️ Armor
                    </h4>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(5, 1fr)',
                      gap: '8px'
                    }}>
                      {['helmet', 'gauntlets', 'chest', 'legs', 'classItem'].map(slot => {
                        const armor = build.components?.armor?.[slot] ||
                                    (build.components?.primaryExotic?.slot === slot ? build.components.primaryExotic : null);
                        return (
                          <div key={slot} style={{
                            background: '#1e1e20',
                            border: '1px solid #464647',
                            borderRadius: '4px',
                            padding: '8px',
                            textAlign: 'center',
                            minHeight: '120px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <div style={{
                              color: '#d4d4d4',
                              fontSize: '10px',
                              marginBottom: '4px',
                              textTransform: 'uppercase'
                            }}>
                              {slot.replace('classItem', 'class')}
                            </div>
                            {armor ? (
                              <DIMStyleItemCard
                                item={armor}
                                onClick={() => toggleItemSelection(armor)}
                                isSelected={selectedItems.has(armor.hash)}
                              />
                            ) : (
                              <div style={{
                                width: '100px',
                                height: '100px',
                                border: '2px dashed #464647',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#666',
                                fontSize: '24px'
                              }}>
                                ?
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Build Suggestions */}
                {build.suggestions && build.suggestions.length > 0 && (
                  <div style={{
                    background: '#1e1e20',
                    border: '1px solid #464647',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '16px'
                  }}>
                    <h4 style={{
                      color: '#ffffff',
                      fontSize: '14px',
                      marginBottom: '8px'
                    }}>
                      💡 Build Tips
                    </h4>
                    <ul style={{
                      margin: 0,
                      paddingLeft: '16px',
                      color: '#d4d4d4',
                      fontSize: '13px'
                    }}>
                      {build.suggestions.map((suggestion, i) => (
                        <li key={i} style={{ marginBottom: '4px' }}>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  paddingTop: '12px',
                  borderTop: '1px solid #464647'
                }}>
                  <button
                    onClick={() => onApplyBuild && onApplyBuild(build, Array.from(selectedItems))}
                    style={{
                      background: '#ceae33',
                      color: '#000000',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#e0c547';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#ceae33';
                    }}
                  >
                    📋 Apply Build ({selectedItems.size} items)
                  </button>
                  
                  <button
                    onClick={() => {
                      const buildText = `${build.name}\n${build.description}\nViability: ${build.viability}%`;
                      navigator.clipboard.writeText(buildText);
                    }}
                    style={{
                      background: 'transparent',
                      color: '#d4d4d4',
                      border: '1px solid #464647',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = '#ceae33';
                      e.target.style.color = '#ceae33';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = '#464647';
                      e.target.style.color = '#d4d4d4';
                    }}
                  >
                    🔗 Share Build
                  </button>
                  
                  <button
                    onClick={() => setSelectedItems(new Set())}
                    disabled={selectedItems.size === 0}
                    style={{
                      background: 'transparent',
                      color: selectedItems.size > 0 ? '#d4d4d4' : '#666',
                      border: '1px solid #464647',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      fontSize: '13px',
                      cursor: selectedItems.size > 0 ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    🔄 Clear Selection
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Tip */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: '#1e1e20',
        border: '1px solid #464647',
        borderRadius: '8px',
        textAlign: 'center',
        color: '#d4d4d4',
        fontSize: '12px',
        opacity: 0.7
      }}>
        💡 Click items to select them for your loadout • Use Apply Build to equip selected items
      </div>
    </div>
  );
};

export default DIMStyleBuildDisplay;