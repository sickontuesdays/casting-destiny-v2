import React, { useState, useEffect } from 'react';

const DestinyDataViewer = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDestinyData();
  }, []);

  const fetchDestinyData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/destiny/fetch-all-data');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        color: '#f4a724'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(244, 167, 36, 0.2)',
            borderTop: '4px solid #f4a724',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <div>Loading Destiny data from Bungie API...</div>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: 'rgba(255, 0, 0, 0.1)',
        border: '1px solid rgba(255, 0, 0, 0.3)',
        borderRadius: '10px',
        padding: '20px',
        color: '#ff6b6b',
        textAlign: 'center'
      }}>
        <h3>Error Loading Data</h3>
        <p>{error}</p>
        <button
          onClick={fetchDestinyData}
          style={{
            background: '#f4a724',
            color: '#000',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '15px',
      padding: '25px',
      border: '1px solid rgba(244, 167, 36, 0.2)'
    }}>
      <h1 style={{
        color: '#f4a724',
        textAlign: 'center',
        marginBottom: '30px',
        fontSize: '2rem'
      }}>
        📊 Destiny 2 API Data
      </h1>

      {/* Class Data Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        marginBottom: '40px'
      }}>
        {Object.entries(data.classes).map(([className, classData]) => (
          <div key={className} style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '10px',
            padding: '20px',
            border: '1px solid rgba(244, 167, 36, 0.3)'
          }}>
            <h2 style={{
              color: '#f4a724',
              textAlign: 'center',
              marginBottom: '20px',
              fontSize: '1.5rem'
            }}>
              {getClassIcon(className)} {className}
            </h2>

            {/* Subclasses */}
            {Object.entries(classData).map(([damageType, subclassData]) => (
              <div key={damageType} style={{
                marginBottom: '25px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '15px'
              }}>
                <h3 style={{
                  color: getDamageTypeColor(damageType),
                  marginBottom: '15px',
                  fontSize: '1.2rem',
                  textAlign: 'center'
                }}>
                  {getDamageTypeIcon(damageType)} {damageType}
                </h3>

                {/* Supers */}
                <SubclassDataSection 
                  title="Supers" 
                  items={subclassData.supers} 
                  color="#DA70D6"
                  maxHeight="100px"
                />

                {/* Aspects */}
                <SubclassDataSection 
                  title="Aspects" 
                  items={subclassData.aspects} 
                  color="#9C27B0"
                  maxHeight="80px"
                />

                {/* Fragments */}
                <SubclassDataSection 
                  title="Fragments" 
                  items={subclassData.fragments} 
                  color="#6495ED"
                  maxHeight="80px"
                />

                {/* Grenades */}
                <SubclassDataSection 
                  title="Grenades" 
                  items={subclassData.grenades} 
                  color="#FF5722"
                  maxHeight="80px"
                />

                {/* Melees */}
                <SubclassDataSection 
                  title="Melees" 
                  items={subclassData.melees} 
                  color="#FF9800"
                  maxHeight="80px"
                />

                {/* Class Abilities */}
                <SubclassDataSection 
                  title="Class Abilities" 
                  items={subclassData.classAbilities} 
                  color="#4CAF50"
                  maxHeight="60px"
                />

                {/* Movement */}
                <SubclassDataSection 
                  title="Movement" 
                  items={subclassData.movement} 
                  color="#2196F3"
                  maxHeight="60px"
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Exotic Armor */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{
          color: '#f4a724',
          marginBottom: '20px',
          fontSize: '1.5rem'
        }}>
          🔥 Exotic Armor
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px'
        }}>
          {Object.entries(data.exotics.armor).map(([className, items]) => (
            <div key={className} style={{
              background: 'rgba(255, 215, 0, 0.1)',
              borderRadius: '10px',
              padding: '15px',
              border: '1px solid rgba(255, 215, 0, 0.3)'
            }}>
              <h3 style={{ color: '#FFD700', marginBottom: '15px' }}>
                {className}
              </h3>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {items.map((item, index) => (
                  <div key={index} style={{
                    color: '#e6e6e6',
                    fontSize: '0.9rem',
                    marginBottom: '5px',
                    padding: '5px',
                    background: 'rgba(255, 215, 0, 0.1)',
                    borderRadius: '4px'
                  }}>
                    {item.name} {item.slot && `(${item.slot})`}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Exotic Weapons */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{
          color: '#f4a724',
          marginBottom: '20px',
          fontSize: '1.5rem'
        }}>
          ⚔️ Exotic Weapons
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px'
        }}>
          {Object.entries(data.exotics.weapons).map(([slot, items]) => (
            <div key={slot} style={{
              background: 'rgba(255, 215, 0, 0.1)',
              borderRadius: '10px',
              padding: '15px',
              border: '1px solid rgba(255, 215, 0, 0.3)'
            }}>
              <h3 style={{ color: '#FFD700', marginBottom: '15px' }}>
                {slot.charAt(0).toUpperCase() + slot.slice(1)} Slot
              </h3>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {items.map((item, index) => (
                  <div key={index} style={{
                    color: '#e6e6e6',
                    fontSize: '0.9rem',
                    marginBottom: '5px',
                    padding: '5px',
                    background: 'rgba(255, 215, 0, 0.1)',
                    borderRadius: '4px'
                  }}>
                    {item.name}
                    {item.weaponType && (
                      <span style={{ color: '#b3b3b3', fontSize: '0.8rem' }}>
                        {' '}({item.weaponType})
                      </span>
                    )}
                    {item.damageType && item.damageType !== 'Kinetic' && (
                      <span style={{ 
                        color: getDamageTypeColor(item.damageType),
                        fontSize: '0.8rem',
                        marginLeft: '5px'
                      }}>
                        {item.damageType}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Regular Weapons */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{
          color: '#f4a724',
          marginBottom: '20px',
          fontSize: '1.5rem'
        }}>
          🗡️ Weapons
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px'
        }}>
          {Object.entries(data.weapons).map(([slot, items]) => (
            <div key={slot} style={{
              background: 'rgba(156, 39, 176, 0.1)',
              borderRadius: '10px',
              padding: '15px',
              border: '1px solid rgba(156, 39, 176, 0.3)',
              maxHeight: '300px'
            }}>
              <h3 style={{ color: '#9C27B0', marginBottom: '15px' }}>
                {slot.charAt(0).toUpperCase() + slot.slice(1)} ({items.length})
              </h3>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {items.slice(0, 20).map((item, index) => (
                  <div key={index} style={{
                    color: '#e6e6e6',
                    fontSize: '0.85rem',
                    marginBottom: '3px',
                    padding: '3px',
                    background: 'rgba(156, 39, 176, 0.1)',
                    borderRadius: '3px'
                  }}>
                    {item.name}
                  </div>
                ))}
                {items.length > 20 && (
                  <div style={{ color: '#b3b3b3', fontSize: '0.8rem', fontStyle: 'italic' }}>
                    +{items.length - 20} more...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Armor */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{
          color: '#f4a724',
          marginBottom: '20px',
          fontSize: '1.5rem'
        }}>
          🛡️ Armor
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px'
        }}>
          {Object.entries(data.armor).map(([className, classArmor]) => (
            <div key={className} style={{
              background: 'rgba(33, 150, 243, 0.1)',
              borderRadius: '10px',
              padding: '15px',
              border: '1px solid rgba(33, 150, 243, 0.3)'
            }}>
              <h3 style={{ color: '#2196F3', marginBottom: '15px' }}>
                {className}
              </h3>
              {Object.entries(classArmor).map(([slot, pieces]) => (
                <div key={slot} style={{ marginBottom: '10px' }}>
                  <div style={{ 
                    color: '#2196F3', 
                    fontSize: '0.9rem', 
                    fontWeight: 'bold',
                    marginBottom: '5px'
                  }}>
                    {slot.charAt(0).toUpperCase() + slot.slice(1)} ({pieces.length})
                  </div>
                  <div style={{ 
                    maxHeight: '80px', 
                    overflowY: 'auto',
                    fontSize: '0.8rem'
                  }}>
                    {pieces.slice(0, 5).map((piece, index) => (
                      <div key={index} style={{
                        color: '#b3b3b3',
                        marginBottom: '2px'
                      }}>
                        {piece.name}
                      </div>
                    ))}
                    {pieces.length > 5 && (
                      <div style={{ color: '#888', fontStyle: 'italic' }}>
                        +{pieces.length - 5} more...
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Mods */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{
          color: '#f4a724',
          marginBottom: '20px',
          fontSize: '1.5rem'
        }}>
          🛠️ Mods
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px'
        }}>
          {Object.entries(data.mods).map(([category, items]) => (
            <div key={category} style={{
              background: 'rgba(76, 175, 80, 0.1)',
              borderRadius: '10px',
              padding: '15px',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              maxHeight: '300px'
            }}>
              <h3 style={{ color: '#4CAF50', marginBottom: '15px' }}>
                {category.charAt(0).toUpperCase() + category.slice(1)} Mods ({items.length})
              </h3>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {items.slice(0, 15).map((item, index) => (
                  <div key={index} style={{
                    color: '#e6e6e6',
                    fontSize: '0.85rem',
                    marginBottom: '5px',
                    padding: '5px',
                    background: 'rgba(76, 175, 80, 0.1)',
                    borderRadius: '4px'
                  }}>
                    {item.name}
                  </div>
                ))}
                {items.length > 15 && (
                  <div style={{ color: '#b3b3b3', fontSize: '0.8rem', fontStyle: 'italic' }}>
                    +{items.length - 15} more...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seasonal Artifacts */}
      {data.artifacts.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{
            color: '#f4a724',
            marginBottom: '20px',
            fontSize: '1.5rem'
          }}>
            ⭐ Seasonal Artifacts
          </h2>
          <div style={{
            background: 'rgba(255, 152, 0, 0.1)',
            borderRadius: '10px',
            padding: '15px',
            border: '1px solid rgba(255, 152, 0, 0.3)'
          }}>
            {data.artifacts.map((artifact, index) => (
              <div key={index} style={{
                color: '#e6e6e6',
                fontSize: '0.9rem',
                marginBottom: '10px',
                padding: '10px',
                background: 'rgba(255, 152, 0, 0.1)',
                borderRadius: '6px'
              }}>
                <div style={{ color: '#FF9800', fontWeight: 'bold' }}>
                  {artifact.name}
                </div>
                {artifact.description && (
                  <div style={{ color: '#b3b3b3', fontSize: '0.8rem', marginTop: '5px' }}>
                    {artifact.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Data */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{
          color: '#f4a724',
          marginBottom: '20px',
          fontSize: '1.5rem'
        }}>
          📦 Other Items
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px'
        }}>
          {Object.entries(data.other).map(([category, items]) => (
            <div key={category} style={{
              background: 'rgba(158, 158, 158, 0.1)',
              borderRadius: '10px',
              padding: '15px',
              border: '1px solid rgba(158, 158, 158, 0.3)',
              maxHeight: '200px'
            }}>
              <h3 style={{ color: '#9E9E9E', marginBottom: '15px' }}>
                {category.charAt(0).toUpperCase() + category.slice(1)} ({items.length})
              </h3>
              <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                {items.slice(0, 10).map((item, index) => (
                  <div key={index} style={{
                    color: '#b3b3b3',
                    fontSize: '0.8rem',
                    marginBottom: '3px'
                  }}>
                    {item.name}
                  </div>
                ))}
                {items.length > 10 && (
                  <div style={{ color: '#888', fontSize: '0.7rem', fontStyle: 'italic' }}>
                    +{items.length - 10} more...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Summary */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '10px',
        padding: '20px',
        border: '1px solid rgba(244, 167, 36, 0.3)',
        textAlign: 'center'
      }}>
        <h3 style={{ color: '#f4a724', marginBottom: '15px' }}>
          📈 Data Summary
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '15px',
          color: '#e6e6e6'
        }}>
          <div>
            <div style={{ color: '#FFD700', fontWeight: 'bold' }}>Exotic Armor</div>
            <div>{Object.values(data.exotics.armor).reduce((total, items) => total + items.length, 0)}</div>
          </div>
          <div>
            <div style={{ color: '#FFD700', fontWeight: 'bold' }}>Exotic Weapons</div>
            <div>{Object.values(data.exotics.weapons).reduce((total, items) => total + items.length, 0)}</div>
          </div>
          <div>
            <div style={{ color: '#9C27B0', fontWeight: 'bold' }}>Total Weapons</div>
            <div>{Object.values(data.weapons).reduce((total, items) => total + items.length, 0)}</div>
          </div>
          <div>
            <div style={{ color: '#4CAF50', fontWeight: 'bold' }}>Total Mods</div>
            <div>{Object.values(data.mods).reduce((total, items) => total + items.length, 0)}</div>
          </div>
          <div>
            <div style={{ color: '#FF9800', fontWeight: 'bold' }}>Artifacts</div>
            <div>{data.artifacts.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for displaying data sections
const DataSection = ({ title, items, color, showDamageType, showType }) => (
  <div style={{ marginBottom: '20px' }}>
    <h4 style={{ 
      color: color, 
      marginBottom: '10px',
      fontSize: '1rem'
    }}>
      {title} ({items.length})
    </h4>
    <div style={{ 
      maxHeight: '120px', 
      overflowY: 'auto',
      fontSize: '0.85rem'
    }}>
      {items.map((item, index) => (
        <div key={index} style={{
          color: '#e6e6e6',
          marginBottom: '5px',
          padding: '5px',
          background: `${color}20`,
          borderRadius: '4px',
          lineHeight: '1.3'
        }}>
          {item.name}
          {showDamageType && item.damageType && item.damageType !== 'Kinetic' && (
            <span style={{ 
              color: getDamageTypeColor(item.damageType),
              fontSize: '0.8rem',
              marginLeft: '8px'
            }}>
              ({item.damageType})
            </span>
          )}
          {showType && item.type && (
            <span style={{ 
              color: '#b3b3b3',
              fontSize: '0.8rem',
              marginLeft: '8px'
            }}>
              ({item.type})
            </span>
          )}
        </div>
      ))}
    </div>
  </div>
);

// Helper functions
const getClassIcon = (className) => {
  const icons = {
    'Titan': '🛡️',
    'Hunter': '🏹',
    'Warlock': '🔮'
  };
  return icons[className] || '⚡';
};

const getDamageTypeColor = (damageType) => {
  const colors = {
    'Arc': '#79C7E3',
    'Solar': '#F2721B', 
    'Void': '#B184C5',
    'Stasis': '#4D88CC',
    'Strand': '#00C851'
  };
  return colors[damageType] || '#e6e6e6';
};

export default DestinyDataViewer;