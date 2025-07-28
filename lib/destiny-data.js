import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import TabNavigation from '../components/TabNavigation';

export default function DestinyDataPage() {
  const [manifestStatus, setManifestStatus] = useState(null);
  const [organizedData, setOrganizedData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('status');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDataStatus();
  }, []);

  const loadDataStatus = async () => {
    try {
      setIsLoading(true);
      
      // Get manifest status
      const statusResponse = await fetch('/api/destiny/manifest-status');
      const status = await statusResponse.json();
      setManifestStatus(status);

      // Get organized data if manifest is cached
      if (status.isCached) {
        const dataResponse = await fetch('/api/destiny/organized-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'overview', searchType: 'data' })
        });
        const data = await dataResponse.json();
        
        if (data.success) {
          setOrganizedData(data.organizedData);
        }
      }
    } catch (err) {
      setError('Failed to load Destiny data status: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManifestAction = async (action) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/destiny/manifest-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTimeout(loadDataStatus, 2000); // Reload status after action
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Action failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderManifestStatus = () => (
    <div style={{
      background: 'linear-gradient(135deg, rgba(30, 30, 46, 0.95), rgba(22, 33, 62, 0.95))',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid rgba(79, 172, 254, 0.2)',
      marginBottom: '20px'
    }}>
      <h2 style={{
        color: '#4FACFE',
        marginBottom: '20px',
        fontSize: '1.4rem',
        fontWeight: '600'
      }}>
        📊 Manifest Status
      </h2>

      {manifestStatus && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* Cache Status */}
          <div style={{
            background: manifestStatus.isCached ? 
              'rgba(34, 197, 94, 0.1)' : 
              'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${manifestStatus.isCached ? 
              'rgba(34, 197, 94, 0.3)' : 
              'rgba(239, 68, 68, 0.3)'}`,
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{
              color: manifestStatus.isCached ? '#22C55E' : '#EF4444',
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              {manifestStatus.isCached ? '✅ Cached' : '❌ Not Cached'}
            </div>
            <div style={{ color: '#B8BCC8', fontSize: '0.9rem' }}>
              {manifestStatus.isCached ? 
                `Local manifest available (${Math.round(manifestStatus.cacheSize / 1024 / 1024)}MB)` :
                'Manifest needs to be downloaded'
              }
            </div>
          </div>

          {/* Version Info */}
          <div style={{
            background: 'rgba(79, 172, 254, 0.1)',
            border: '1px solid rgba(79, 172, 254, 0.3)',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{
              color: '#4FACFE',
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              📋 Version
            </div>
            <div style={{ color: '#B8BCC8', fontSize: '0.9rem' }}>
              {manifestStatus.currentVersion || 'Unknown'}
            </div>
            {manifestStatus.needsUpdate && (
              <div style={{ color: '#F59E0B', fontSize: '0.8rem', marginTop: '4px' }}>
                ⚠️ Update available
              </div>
            )}
          </div>

          {/* Last Updated */}
          <div style={{
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{
              color: '#8B5CF6',
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              🕐 Last Updated
            </div>
            <div style={{ color: '#B8BCC8', fontSize: '0.9rem' }}>
              {manifestStatus.lastUpdated ? 
                new Date(manifestStatus.lastUpdated).toLocaleString() :
                'Never'
              }
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => handleManifestAction('update')}
          disabled={isLoading}
          style={{
            background: 'linear-gradient(135deg, #4FACFE, #00F2FE)',
            color: '#1a1a2e',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          {isLoading ? '🔄 Updating...' : '📥 Update Manifest'}
        </button>

        <button
          onClick={() => handleManifestAction('clear')}
          disabled={isLoading}
          style={{
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#EF4444',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '0.9rem',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          🗑️ Clear Cache
        </button>

        <button
          onClick={loadDataStatus}
          disabled={isLoading}
          style={{
            background: 'rgba(79, 172, 254, 0.1)',
            color: '#4FACFE',
            border: '1px solid rgba(79, 172, 254, 0.3)',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '0.9rem',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          🔄 Refresh Status
        </button>
      </div>
    </div>
  );

  const renderDataOverview = () => {
    if (!organizedData) {
      return (
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 30, 46, 0.95), rgba(22, 33, 62, 0.95))',
          borderRadius: '12px',
          padding: '32px',
          textAlign: 'center',
          color: '#B8BCC8'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📊</div>
          <div>No organized data available. Please update the manifest first.</div>
        </div>
      );
    }

    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 30, 46, 0.95), rgba(22, 33, 62, 0.95))',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid rgba(79, 172, 254, 0.2)'
      }}>
        <h2 style={{
          color: '#4FACFE',
          marginBottom: '20px',
          fontSize: '1.4rem',
          fontWeight: '600'
        }}>
          🎯 Organized Data Overview
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* Exotic Gear */}
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{
              color: '#F59E0B',
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              🔥 Exotic Gear
            </div>
            <div style={{ color: '#B8BCC8', fontSize: '0.9rem' }}>
              Armor: {organizedData.categories?.exoticGear?.armor?.length || 0}
            </div>
            <div style={{ color: '#B8BCC8', fontSize: '0.9rem' }}>
              Weapons: {organizedData.categories?.exoticGear?.weapons?.length || 0}
            </div>
          </div>

          {/* Build Components */}
          <div style={{
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{
              color: '#8B5CF6',
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              🔮 Subclass Items
            </div>
            <div style={{ color: '#B8BCC8', fontSize: '0.9rem' }}>
              Aspects: {organizedData.buildComponents?.aspects?.length || 0}
            </div>
            <div style={{ color: '#B8BCC8', fontSize: '0.9rem' }}>
              Fragments: {organizedData.buildComponents?.fragments?.length || 0}
            </div>
          </div>

          {/* Mods */}
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{
              color: '#22C55E',
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              🛠️ Mods
            </div>
            <div style={{ color: '#B8BCC8', fontSize: '0.9rem' }}>
              Armor: {organizedData.categories?.mods?.armor?.length || 0}
            </div>
            <div style={{ color: '#B8BCC8', fontSize: '0.9rem' }}>
              Weapon: {organizedData.categories?.mods?.weapon?.length || 0}
            </div>
          </div>

          {/* Total Items */}
          <div style={{
            background: 'rgba(79, 172, 254, 0.1)',
            border: '1px solid rgba(79, 172, 254, 0.3)',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{
              color: '#4FACFE',
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              📋 Total Items
            </div>
            <div style={{ color: '#B8BCC8', fontSize: '0.9rem' }}>
              Build Essential: {Object.keys(organizedData.searchableItems || {}).length}
            </div>
            <div style={{ color: '#B8BCC8', fontSize: '0.9rem' }}>
              Cache Size: {Math.round((organizedData.cacheSize || 0) / 1024)}KB
            </div>
          </div>
        </div>

        {/* Data Categories */}
        <div style={{ marginTop: '20px' }}>
          <h3 style={{
            color: '#4FACFE',
            marginBottom: '16px',
            fontSize: '1.2rem',
            fontWeight: '600'
          }}>
            📚 Available Categories
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '8px'
          }}>
            {organizedData.categories && Object.keys(organizedData.categories).map(category => (
              <div
                key={category}
                style={{
                  background: 'rgba(79, 172, 254, 0.1)',
                  border: '1px solid rgba(79, 172, 254, 0.2)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: '#4FACFE',
                  fontSize: '0.8rem',
                  textAlign: 'center'
                }}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDataExplorer = () => {
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    const handleSearch = async () => {
      if (!searchTerm.trim()) return;

      setSearchLoading(true);
      try {
        const response = await fetch('/api/destiny/search-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: searchTerm,
            limit: 20
          })
        });
        
        const data = await response.json();
        if (data.success) {
          setSearchResults(data.results || []);
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setSearchLoading(false);
      }
    };

    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 30, 46, 0.95), rgba(22, 33, 62, 0.95))',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid rgba(79, 172, 254, 0.2)'
      }}>
        <h2 style={{
          color: '#4FACFE',
          marginBottom: '20px',
          fontSize: '1.4rem',
          fontWeight: '600'
        }}>
          🔍 Data Explorer
        </h2>

        {/* Search Interface */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search items, mods, abilities..."
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(79, 172, 254, 0.3)',
              borderRadius: '8px',
              color: '#E5E7EB',
              fontSize: '0.9rem'
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={searchLoading || !searchTerm.trim()}
            style={{
              background: 'linear-gradient(135deg, #4FACFE, #00F2FE)',
              color: '#1a1a2e',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: (!searchTerm.trim() || searchLoading) ? 'not-allowed' : 'pointer',
              opacity: (!searchTerm.trim() || searchLoading) ? 0.6 : 1
            }}
          >
            {searchLoading ? '🔄' : '🔍'}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            padding: '16px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            <h3 style={{
              color: '#4FACFE',
              marginBottom: '12px',
              fontSize: '1rem'
            }}>
              Search Results ({searchResults.length})
            </h3>
            
            {searchResults.map((item, index) => (
              <div
                key={item.hash || index}
                style={{
                  background: 'rgba(79, 172, 254, 0.05)',
                  border: '1px solid rgba(79, 172, 254, 0.2)',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '8px'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '6px'
                }}>
                  <div style={{
                    color: '#E5E7EB',
                    fontSize: '0.95rem',
                    fontWeight: '600'
                  }}>
                    {item.name}
                  </div>
                  <div style={{
                    background: item.isExotic ? 
                      'rgba(245, 158, 11, 0.2)' : 
                      'rgba(79, 172, 254, 0.2)',
                    color: item.isExotic ? '#F59E0B' : '#4FACFE',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: '600'
                  }}>
                    {item.category || item.type}
                  </div>
                </div>
                
                <div style={{
                  color: '#B8BCC8',
                  fontSize: '0.8rem',
                  lineHeight: '1.3'
                }}>
                  {item.description?.substring(0, 120)}
                  {item.description?.length > 120 && '...'}
                </div>
                
                <div style={{
                  marginTop: '6px',
                  fontSize: '0.7rem',
                  color: '#6B7280'
                }}>
                  Hash: {item.hash} | Class: {item.classType || 'Any'} | Tier: {item.tierType}
                </div>
              </div>
            ))}
          </div>
        )}

        {searchResults.length === 0 && searchTerm && !searchLoading && (
          <div style={{
            textAlign: 'center',
            color: '#B8BCC8',
            padding: '40px',
            fontStyle: 'italic'
          }}>
            No items found for "{searchTerm}"
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Destiny Data Manager - Casting Destiny</title>
        <meta name="description" content="Manage and explore Destiny 2 manifest data" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        color: '#E5E7EB'
      }}>
        <TabNavigation />
        
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '20px'
        }}>
          {/* Header */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '32px',
            padding: '20px'
          }}>
            <h1 style={{
              background: 'linear-gradient(135deg, #4FACFE, #00F2FE)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              fontSize: '2.5rem',
              marginBottom: '12px',
              fontWeight: '700'
            }}>
              📊 Destiny Data Manager
            </h1>
            <p style={{
              color: '#B8BCC8',
              fontSize: '1.1rem',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Manage manifest cache, explore organized data, and monitor system status
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              color: '#FCA5A5',
              textAlign: 'center'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            gap: '4px',
            marginBottom: '20px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            padding: '4px'
          }}>
            {[
              { id: 'status', label: '📊 Status', desc: 'Manifest and cache status' },
              { id: 'overview', label: '🎯 Overview', desc: 'Organized data summary' },
              { id: 'explorer', label: '🔍 Explorer', desc: 'Search and explore data' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  background: activeTab === tab.id ? 
                    'linear-gradient(135deg, #4FACFE, #00F2FE)' : 
                    'transparent',
                  color: activeTab === tab.id ? '#1a1a2e' : '#B8BCC8',
                  border: 'none',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontSize: '0.9rem',
                  fontWeight: activeTab === tab.id ? '600' : '400'
                }}
              >
                <div>{tab.label}</div>
                <div style={{ 
                  fontSize: '0.7rem', 
                  opacity: 0.8,
                  marginTop: '2px'
                }}>
                  {tab.desc}
                </div>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {isLoading && activeTab === 'status' ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '300px',
              color: '#4FACFE'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid rgba(79, 172, 254, 0.2)',
                  borderTop: '4px solid #4FACFE',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px'
                }}></div>
                <div>Loading Destiny data status...</div>
                <style jsx>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'status' && renderManifestStatus()}
              {activeTab === 'overview' && renderDataOverview()}
              {activeTab === 'explorer' && renderDataExplorer()}
            </>
          )}
        </div>
      </div>
    </>
  );
}