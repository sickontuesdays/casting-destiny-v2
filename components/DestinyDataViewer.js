import React, { useState, useEffect } from 'react';

const DestinyDataViewer = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataInfo, setDataInfo] = useState(null);
  const [showTroubleshooter, setShowTroubleshooter] = useState(false);

  useEffect(() => {
    fetchDestinyData();
  }, []);

  const fetchDestinyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/destiny/fetch-all-data');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        
        setDataInfo({
          cached: result.cached,
          fallback: result.fallback,
          timestamp: result.timestamp,
          cacheAge: result.cacheAge,
          error: result.error,
          dataSize: result.dataSize,
          optimized: result.data?.metadata?.optimized
        });
        
        if (result.fallback) {
          console.warn('Using fallback data due to API issues:', result.error);
          setError(`Using fallback data: ${result.fallbackReason || result.error}`);
        }
        if (result.cached) {
          console.log('Using cached data, cache age:', result.cacheAge || 'unknown');
        }
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Define renderDataContent function BEFORE it's used
  const renderDataContent = () => {
    if (!data) return null;

    return (
      <div>
        <h1 style={{
          color: '#f4a724',
          textAlign: 'center',
          marginBottom: '30px',
          fontSize: '2rem'
        }}>
          📊 Destiny 2 Build Data
        </h1>

        {/* Data Source Info */}
        {dataInfo && (dataInfo.cached || dataInfo.fallback || dataInfo.optimized) && (
          <div style={{
            background: dataInfo.fallback ? 
              'rgba(255, 152, 0, 0.1)' : 
              dataInfo.optimized ?
              'rgba(138, 43, 226, 0.1)' :
              'rgba(33, 150, 243, 0.1)',
            border: `1px solid ${dataInfo.fallback ? 
              'rgba(255, 152, 0, 0.3)' : 
              dataInfo.optimized ?
              'rgba(138, 43, 226, 0.3)' :
              'rgba(33, 150, 243, 0.3)'}`,
            borderRadius: '10px',
            padding: '15px',
            marginBottom: '25px',
            color: dataInfo.fallback ? '#FF9800' : dataInfo.optimized ? '#8A2BE2' : '#2196F3',
            textAlign: 'center'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
              {dataInfo.fallback ? '⚠️ Using Fallback Data' : 
               dataInfo.optimized ? '🔧 Optimized Data' :
               'ℹ️ Cached Data'}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#b3b3b3' }}>
              {dataInfo.fallback && (
                <div>Limited functionality - API unavailable</div>
              )}
              {dataInfo.optimized && (
                <div>Data optimized for performance</div>
              )}
              {dataInfo.dataSize && (
                <div>Data size: {dataInfo.dataSize}</div>
              )}
              {dataInfo.cacheAge && (
                <div>Cache age: {Math.floor(dataInfo.cacheAge / 60)} minutes</div>
              )}
            </div>
          </div>
        )}

        {/* Build Components Overview */}
        {data.buildComponents && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{
              color: '#f4a724',
              marginBottom: '20px',
              fontSize: '1.5rem'
            }}>
              🎯 Build Components
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px'
            }}>
              {/* Abilities */}
              {data.buildComponents.abilities && (
                <div style={{
                  background: 'rgba(138, 43, 226, 0.1)',
                  borderRadius: '10px',
                  padding: '15px',
                  border: '1px solid rgba(138, 43, 226, 0.3)'
                }}>
                  <h3 style={{ color: '#8A2BE2', marginBottom: '15px' }}>⚡ Abilities</h3>
                  {Object.entries(data.buildComponents.abilities).map(([type, items]) => (
                    <div key={type} style={{ marginBottom: '10px' }}>
                      <div style={{ color: '#DA70D6', fontSize: '0.9rem', fontWeight: 'bold' }}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}: {items.length}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Exotic Gear */}
              {data.exoticGear && (
                <div style={{
                  background: 'rgba(255, 215, 0, 0.1)',
                  borderRadius: '10px',
                  padding: '15px',
                  border: '1px solid rgba(255, 215, 0, 0.3)'
                }}>
                  <h3 style={{ color: '#FFD700', marginBottom: '15px' }}>🔥 Exotic Gear</h3>
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ color: '#FFD700', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      Armor: {Object.values(data.exoticGear.armor || {}).reduce((total, items) => total + items.length, 0)}
                    </div>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ color: '#FFD700', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      Weapons: {Object.values(data.exoticGear.weapons || {}).reduce((total, items) => total + items.length, 0)}
                    </div>
                  </div>
                </div>
              )}

              {/* Mods */}
              {data.buildComponents?.mods && (
                <div style={{
                  background: 'rgba(76, 175, 80, 0.1)',
                  borderRadius: '10px',
                  padding: '15px',
                  border: '1px solid rgba(76, 175, 80, 0.3)'
                }}>
                  <h3 style={{ color: '#4CAF50', marginBottom: '15px' }}>🛠️ Mods</h3>
                  {Object.entries(data.buildComponents.mods).map(([type, items]) => (
                    <div key={type} style={{ marginBottom: '10px' }}>
                      <div style={{ color: '#4CAF50', fontSize: '0.9rem', fontWeight: 'bold' }}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}: {items.length}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sample Exotic Items */}
        {data.exoticGear && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{
              color: '#f4a724',
              marginBottom: '20px',
              fontSize: '1.5rem'
            }}>
              🔥 Sample Exotic Items
            </h2>
            
            {/* Exotic Armor by Class */}
            {data.exoticGear.armor && Object.keys(data.exoticGear.armor).length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ color: '#FFD700', marginBottom: '15px' }}>Exotic Armor</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '20px'
                }}>
                  {Object.entries(data.exoticGear.armor).map(([className, items]) => (
                    <div key={className} style={{
                      background: 'rgba(255, 215, 0, 0.1)',
                      borderRadius: '10px',
                      padding: '15px',
                      border: '1px solid rgba(255, 215, 0, 0.3)'
                    }}>
                      <h4 style={{ color: '#FFD700', marginBottom: '15px' }}>
                        {className}
                      </h4>
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {items && items.length > 0 ? items.slice(0, 10).map((item, index) => (
                          <div key={index} style={{
                            color: '#e6e6e6',
                            fontSize: '0.9rem',
                            marginBottom: '8px',
                            padding: '8px',
                            background: 'rgba(255, 215, 0, 0.1)',
                            borderRadius: '4px'
                          }}>
                            <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#b3b3b3' }}>
                              {item.description?.substring(0, 100)}...
                            </div>
                          </div>
                        )) : (
                          <div style={{ color: '#888', fontStyle: 'italic' }}>
                            No exotic armor found for {className}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exotic Weapons */}
            {data.exoticGear.weapons && Object.keys(data.exoticGear.weapons).length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ color: '#FFD700', marginBottom: '15px' }}>Exotic Weapons</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '20px'
                }}>
                  {Object.entries(data.exoticGear.weapons).map(([slot, items]) => (
                    <div key={slot} style={{
                      background: 'rgba(255, 215, 0, 0.1)',
                      borderRadius: '10px',
                      padding: '15px',
                      border: '1px solid rgba(255, 215, 0, 0.3)'
                    }}>
                      <h4 style={{ color: '#FFD700', marginBottom: '15px' }}>
                        {slot.charAt(0).toUpperCase() + slot.slice(1)} Slot
                      </h4>
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {items && items.length > 0 ? items.slice(0, 10).map((item, index) => (
                          <div key={index} style={{
                            color: '#e6e6e6',
                            fontSize: '0.9rem',
                            marginBottom: '8px',
                            padding: '8px',
                            background: 'rgba(255, 215, 0, 0.1)',
                            borderRadius: '4px'
                          }}>
                            <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#b3b3b3' }}>
                              {item.damageType && item.damageType !== 'None' && (
                                <span style={{ 
                                  color: item.damageType === 'Solar' ? '#F2721B' :
                                        item.damageType === 'Arc' ? '#79C7E3' :
                                        item.damageType === 'Void' ? '#B184C5' :
                                        item.damageType === 'Stasis' ? '#4D88CC' :
                                        item.damageType === 'Strand' ? '#00C851' : '#e6e6e6',
                                  marginRight: '8px'
                                }}>
                                  {item.damageType}
                                </span>
                              )}
                              {item.description?.substring(0, 80)}...
                            </div>
                          </div>
                        )) : (
                          <div style={{ color: '#888', fontStyle: 'italic' }}>
                            No exotic weapons found for {slot} slot
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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
          {data.metadata && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '15px',
              color: '#e6e6e6'
            }}>
              <div>
                <div style={{ color: '#FFD700', fontWeight: 'bold' }}>Build Items</div>
                <div>{data.metadata.buildEssentialItems || 'N/A'}</div>
              </div>
              <div>
                <div style={{ color: '#2196F3', fontWeight: 'bold' }}>Data Version</div>
                <div>{data.metadata.version || 'N/A'}</div>
              </div>
              <div>
                <div style={{ color: '#4CAF50', fontWeight: 'bold' }}>Status</div>
                <div>{data.metadata.isFallback ? 'Fallback' : 'Live'}</div>
              </div>
              {data.metadata.totalOriginalItems && (
                <div>
                  <div style={{ color: '#FF9800', fontWeight: 'bold' }}>Original Items</div>
                  <div>{data.metadata.totalOriginalItems.toLocaleString()}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Loading state
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
          <div style={{ marginBottom: '10px' }}>Loading Destiny data from Bungie API...</div>
          <div style={{ 
            color: '#b3b3b3', 
            fontSize: '0.9rem',
            maxWidth: '400px',
            lineHeight: '1.4'
          }}>
            This may take a moment as we fetch the latest game data. 
            If this is taking longer than expected, there may be temporary Bungie API issues.
          </div>
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

  // Error state
  if (error) {
    return (
      <div>
        <div style={{
          background: 'rgba(255, 152, 0, 0.1)',
          border: '1px solid rgba(255, 152, 0, 0.3)',
          borderRadius: '10px',
          padding: '20px',
          color: '#FF9800',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginBottom: '15px' }}>⚠️ API Connection Issue</h3>
          <p style={{ marginBottom: '15px' }}>{error}</p>
          
          {/* Quick Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <button
              onClick={fetchDestinyData}
              style={{
                background: '#f4a724',
                color: '#000',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'background 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#ff8c00';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#f4a724';
              }}
            >
              🔄 Try Again
            </button>
            
            <button
              onClick={() => setShowTroubleshooter(!showTroubleshooter)}
              style={{
                background: 'rgba(33, 150, 243, 0.2)',
                color: '#2196F3',
                border: '1px solid rgba(33, 150, 243, 0.3)',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(33, 150, 243, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(33, 150, 243, 0.2)';
              }}
            >
              🔧 {showTroubleshooter ? 'Hide' : 'Show'} Troubleshooter
            </button>
          </div>

          {/* Common Issues */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px',
            color: '#e6e6e6',
            textAlign: 'left'
          }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem' }}>
              <strong>Most common causes:</strong>
            </p>
            <ul style={{ 
              margin: '0',
              paddingLeft: '20px',
              fontSize: '0.85rem',
              lineHeight: '1.4'
            }}>
              <li>Missing or invalid Bungie API key</li>
              <li>Bungie API maintenance or temporary outage</li>
              <li>Network connectivity issues</li>
              <li>Rate limiting (too many requests)</li>
            </ul>
          </div>
        </div>

        {/* Troubleshooter Component */}
        {showTroubleshooter && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '15px',
            padding: '25px',
            margin: '20px 0',
            border: '1px solid rgba(244, 167, 36, 0.2)'
          }}>
            <h2 style={{
              color: '#f4a724',
              marginBottom: '20px',
              fontSize: '1.4rem'
            }}>
              🔧 Troubleshooting Guide
            </h2>
            
            <div style={{
              background: 'rgba(255, 152, 0, 0.1)',
              border: '1px solid rgba(255, 152, 0, 0.3)',
              borderRadius: '10px',
              padding: '20px',
              marginTop: '20px'
            }}>
              <h4 style={{ color: '#FF9800', marginBottom: '15px' }}>Manual Steps:</h4>
              <ol style={{ color: '#e6e6e6', paddingLeft: '20px' }}>
                <li style={{ marginBottom: '10px' }}>
                  <strong>Check API Key:</strong> Make sure you have a valid Bungie API key in your <code>.env.local</code> file:
                  <br />
                  <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '3px' }}>
                    BUNGIE_API_KEY=your_api_key_here
                  </code>
                </li>
                <li style={{ marginBottom: '10px' }}>
                  <strong>Get API Key:</strong> If you don't have one, get it from{' '}
                  <a href="https://www.bungie.net/en/Application" target="_blank" rel="noopener noreferrer" 
                     style={{ color: '#f4a724' }}>
                    Bungie.net Application Portal
                  </a>
                </li>
                <li style={{ marginBottom: '10px' }}>
                  <strong>Restart Server:</strong> After adding the API key, restart your development server
                </li>
                <li style={{ marginBottom: '10px' }}>
                  <strong>Check Network:</strong> Ensure you can access bungie.net from your network
                </li>
                <li>
                  <strong>Check Bungie Status:</strong> Visit{' '}
                  <a href="https://help.bungie.net/" target="_blank" rel="noopener noreferrer"
                     style={{ color: '#f4a724' }}>
                    Bungie Help
                  </a>{' '}
                  for API status updates
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Show fallback data if available */}
        {data && (
          <div style={{ marginTop: '20px' }}>
            <div style={{
              background: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              borderRadius: '10px',
              padding: '15px',
              marginBottom: '20px',
              color: '#4CAF50',
              textAlign: 'center'
            }}>
              📊 Showing limited data from fallback/cache. Some features may not work fully.
            </div>
            {renderDataContent()}
          </div>
        )}
      </div>
    );
  }

  // SUCCESS: Return the main data content
  return renderDataContent();
};

export default DestinyDataViewer;