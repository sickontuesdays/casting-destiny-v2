<Head>
  <title>Casting Destiny - Build Creator</title>
  <meta name="description" content="Create perfect Destiny 2 builds with AI-powered recommendations" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" href="/favicon.ico" />
  <link rel="icon" type="image/png" sizes="32x32" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔮</text></svg>" />
</Head>

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '../lib/useAuth';
import TabNavigation from '../components/TabNavigation';
import BuildCreator from '../components/BuildCreator';
import BuildDisplay from '../components/BuildDisplay';
import MissingItemsDisplay from '../components/MissingItemsDisplay';
import ResultsDisplay from '../components/ResultsDisplay';
import LoadingSpinner from '../components/LoadingSpinner';
import AuthButton from '../components/AuthButton';

export default function Home() {
  const { session, isAuthenticated } = useAuth();
  const [searchResults, setSearchResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [manifestStatus, setManifestStatus] = useState(null);
  const [playerData, setPlayerData] = useState(null);
  const [searchConfig, setSearchConfig] = useState({
    mode: 'builds',
    useInventoryOnly: false,
    selectedCharacter: null
  });

  // Check manifest status on load
  useEffect(() => {
    checkManifestStatus();
  }, []);

  // Load player data when authenticated
  useEffect(() => {
    if (isAuthenticated && session?.user?.destinyMemberships) {
      loadPlayerData();
    }
  }, [isAuthenticated, session]);

  // Set default character selection
  useEffect(() => {
    if (session?.user?.destinyMemberships && !searchConfig.selectedCharacter) {
      const primaryMembership = session.user.destinyMemberships.find(
        m => m.isPrimary || m.membershipType === 3 // Prefer Steam
      ) || session.user.destinyMemberships[0];
      
      setSearchConfig(prev => ({
        ...prev,
        selectedCharacter: primaryMembership
      }));
    }
  }, [session, searchConfig.selectedCharacter]);

  const checkManifestStatus = async () => {
    try {
      const response = await fetch('/api/destiny/manifest-status');
      const status = await response.json();
      setManifestStatus(status);
      
      // If manifest needs update, trigger it
      if (status.needsUpdate) {
        console.log('Manifest needs update, triggering download...');
        await fetch('/api/destiny/manifest-status', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update' })
        });
      }
    } catch (error) {
      console.error('Failed to check manifest status:', error);
    }
  };

  const loadPlayerData = async () => {
    if (!searchConfig.selectedCharacter) return;
    
    try {
      const response = await fetch('/api/destiny/player-builds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipType: searchConfig.selectedCharacter.membershipType,
          membershipId: searchConfig.selectedCharacter.membershipId
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setPlayerData({
          displayName: searchConfig.selectedCharacter.displayName,
          itemCount: data.playerItems?.length || 0,
          builds: data.availableBuilds || [],
          exoticCount: data.playerStats?.exoticCount || 0,
          buildPotential: data.playerStats?.buildPotential || 0
        });
      }
    } catch (error) {
      console.error('Failed to load player data:', error);
    }
  };

  const handleSearch = async (searchParams) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let endpoint;
      let requestBody;

      // Determine which API endpoint to use based on search mode
      switch (searchParams.mode) {
        case 'builds':
          endpoint = searchConfig.useInventoryOnly ? 
            '/api/destiny/player-builds' : 
            '/api/destiny/organized-data';
          break;
        case 'items':
          endpoint = '/api/destiny/search-items';
          break;
        case 'player':
          endpoint = '/api/destiny/player-builds';
          break;
        default:
          endpoint = '/api/destiny/organized-data';
      }

      // Prepare request body based on search type
      if (searchParams.mode === 'player' || searchConfig.useInventoryOnly) {
        requestBody = {
          query: searchParams.query,
          filters: searchParams.filters,
          membershipType: searchConfig.selectedCharacter?.membershipType,
          membershipId: searchConfig.selectedCharacter?.membershipId,
          searchType: 'builds'
        };
      } else if (searchParams.mode === 'items') {
        requestBody = {
          query: searchParams.query,
          filters: searchParams.filters,
          itemTypes: ['weapons', 'armor', 'mods', 'abilities'],
          limit: 50
        };
      } else {
        requestBody = {
          query: searchParams.query,
          filters: searchParams.filters,
          searchType: 'builds'
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSearchResults({
          ...data,
          searchMode: searchParams.mode,
          playerMode: searchParams.mode === 'player' || searchConfig.useInventoryOnly
        });
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (err) {
      setError('Failed to connect to search service');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchConfigChange = (key, value) => {
    setSearchConfig(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Reload player data if character changed
    if (key === 'selectedCharacter' || key === 'useInventoryOnly') {
      if (value && isAuthenticated) {
        loadPlayerData();
      }
    }
  };

  return (
    <>
      <Head>
        <title>Casting Destiny - Build Creator</title>
        <meta name="description" content="Create perfect Destiny 2 builds with AI-powered recommendations" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔮</text></svg>" />
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
            padding: '40px 20px'
          }}>
            <h1 style={{
              background: 'linear-gradient(135deg, #4FACFE, #00F2FE)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              fontSize: '3rem',
              marginBottom: '16px',
              fontWeight: '700',
              textShadow: '0 0 30px rgba(79, 172, 254, 0.3)'
            }}>
              🔮 Casting Destiny
            </h1>
            <p style={{
              color: '#B8BCC8',
              fontSize: '1.2rem',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.5'
            }}>
              Discover and create perfect Destiny 2 builds with intelligent recommendations
              {isAuthenticated && playerData && (
                <span style={{ 
                  display: 'block',
                  marginTop: '8px',
                  color: '#4FACFE',
                  fontSize: '1rem'
                }}>
                  ✨ Personalized for {playerData.displayName} with {playerData.itemCount} items
                </span>
              )}
            </p>
          </div>

          {/* Manifest Status */}
          {manifestStatus && (
            <div style={{
              background: manifestStatus.isCached ? 
                'rgba(34, 197, 94, 0.1)' : 
                'rgba(245, 158, 11, 0.1)',
              border: `1px solid ${manifestStatus.isCached ? 
                'rgba(34, 197, 94, 0.3)' : 
                'rgba(245, 158, 11, 0.3)'}`,
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                color: manifestStatus.isCached ? '#22C55E' : '#F59E0B',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                {manifestStatus.isCached ? '✅' : '⏳'} 
                {manifestStatus.isCached ? 
                  ` Manifest cached (${Math.round(manifestStatus.cacheSize / 1024 / 1024)}MB) - Fast searches enabled` :
                  ' Downloading latest Destiny data...'
                }
              </div>
            </div>
          )}

          {/* Auth Section */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginBottom: '32px' 
          }}>
            <AuthButton />
          </div>

          {/* Search Configuration */}
          {isAuthenticated && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 30, 46, 0.95), rgba(22, 33, 62, 0.95))',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px',
              border: '1px solid rgba(79, 172, 254, 0.2)'
            }}>
              <h3 style={{
                color: '#4FACFE',
                marginBottom: '16px',
                fontSize: '1.1rem',
                fontWeight: '600'
              }}>
                🎯 Search Configuration
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '16px',
                alignItems: 'start'
              }}>
                {/* Inventory Mode Toggle */}
                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    color: '#E5E7EB',
                    padding: '12px',
                    background: searchConfig.useInventoryOnly ? 
                      'rgba(34, 197, 94, 0.1)' : 
                      'rgba(79, 172, 254, 0.05)',
                    borderRadius: '8px',
                    border: `1px solid ${searchConfig.useInventoryOnly ? 
                      'rgba(34, 197, 94, 0.3)' : 
                      'rgba(79, 172, 254, 0.2)'}`,
                    transition: 'all 0.3s ease'
                  }}>
                    <input
                      type="checkbox"
                      checked={searchConfig.useInventoryOnly}
                      onChange={(e) => handleSearchConfigChange('useInventoryOnly', e.target.checked)}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: '#4FACFE'
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: '600' }}>
                        🎒 Use My Inventory Only
                      </div>
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: '#B8BCC8',
                        marginTop: '2px'
                      }}>
                        Show only builds you can make right now
                      </div>
                    </div>
                  </label>
                </div>

                {/* Character Selection */}
                {session?.user?.destinyMemberships && searchConfig.useInventoryOnly && (
                  <div>
                    <label style={{
                      display: 'block',
                      color: '#B8BCC8',
                      fontSize: '0.9rem',
                      marginBottom: '8px',
                      fontWeight: '500'
                    }}>
                      Platform:
                    </label>
                    <select
                      value={searchConfig.selectedCharacter?.membershipId || ''}
                      onChange={(e) => {
                        const membership = session.user.destinyMemberships.find(
                          m => m.membershipId === e.target.value
                        );
                        handleSearchConfigChange('selectedCharacter', membership);
                      }}
                      style={{
                        width: '100%',
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(79, 172, 254, 0.3)',
                        borderRadius: '8px',
                        color: '#E5E7EB',
                        padding: '12px 16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      {session.user.destinyMemberships.map((membership) => (
                        <option 
                          key={membership.membershipId} 
                          value={membership.membershipId}
                          style={{ background: '#1a1a2e' }}
                        >
                          {membership.displayName} ({membership.platformName})
                          {membership.isPrimary && ' • Primary'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Player Stats */}
                {playerData && searchConfig.useInventoryOnly && (
                  <div style={{
                    background: 'rgba(79, 172, 254, 0.05)',
                    borderRadius: '8px',
                    padding: '12px',
                    border: '1px solid rgba(79, 172, 254, 0.2)'
                  }}>
                    <div style={{
                      color: '#4FACFE',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      marginBottom: '8px'
                    }}>
                      📊 Your Arsenal
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px',
                      fontSize: '0.8rem'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#F59E0B', fontWeight: '600' }}>
                          {playerData.itemCount}
                        </div>
                        <div style={{ color: '#B8BCC8' }}>Items</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#10B981', fontWeight: '600' }}>
                          {playerData.exoticCount}
                        </div>
                        <div style={{ color: '#B8BCC8' }}>Exotics</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#8B5CF6', fontWeight: '600' }}>
                          {playerData.buildPotential}%
                        </div>
                        <div style={{ color: '#B8BCC8' }}>Potential</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mode Explanation */}
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: searchConfig.useInventoryOnly ? 
                  'rgba(34, 197, 94, 0.1)' : 
                  'rgba(79, 172, 254, 0.1)',
                borderRadius: '8px',
                border: `1px solid ${searchConfig.useInventoryOnly ? 
                  'rgba(34, 197, 94, 0.2)' : 
                  'rgba(79, 172, 254, 0.2)'}`,
                color: searchConfig.useInventoryOnly ? '#22C55E' : '#4FACFE',
                fontSize: '0.9rem',
                textAlign: 'center'
              }}>
                {searchConfig.useInventoryOnly ? (
                  <span>🎯 Searching your inventory - results show builds you can equip immediately!</span>
                ) : (
                  <span>🌍 Searching all Destiny items - results show optimal builds regardless of ownership</span>
                )}
              </div>
            </div>
          )}

          {/* Build Creator */}
          <BuildCreator 
            onSearch={handleSearch} 
            isLoading={isLoading}
            playerData={playerData}
          />

          {/* Loading State */}
          {isLoading && <LoadingSpinner />}

          {/* Error State */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px',
              color: '#FCA5A5',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚠️</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '4px' }}>
                Search Error
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                {error}
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchResults && !isLoading && (
            <>
              {/* Results Summary */}
              <div style={{
                background: 'rgba(79, 172, 254, 0.05)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px',
                border: '1px solid rgba(79, 172, 254, 0.2)'
              }}>
                <div style={{ 
                  color: '#4FACFE', 
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  textAlign: 'center'
                }}>
                  {searchResults.message || `Found ${searchResults.totalFound} results`}
                  {searchResults.playerMode && (
                    <span style={{ color: '#22C55E' }}> • From your inventory</span>
                  )}
                  {searchResults.searchBreakdown && (
                    <div style={{ 
                      marginTop: '8px',
                      fontSize: '0.8rem',
                      color: '#B8BCC8'
                    }}>
                      {searchResults.searchBreakdown.included?.length > 0 && (
                        <span>Including: <em>{searchResults.searchBreakdown.included.join(', ')}</em></span>
                      )}
                      {searchResults.searchBreakdown.excluded?.length > 0 && (
                        <span> | Excluding: <em>{searchResults.searchBreakdown.excluded.join(', ')}</em></span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Display Results Based on Type */}
              {searchResults.searchType === 'builds' || searchResults.builds ? (
                <BuildDisplay 
                  builds={searchResults.builds || searchResults.availableBuilds}
                  searchQuery={searchResults.query}
                  totalFound={searchResults.totalFound}
                  playerMode={searchResults.playerMode}
                />
              ) : searchResults.searchType === 'missing_items' || 
                  searchResults.searchType === 'partial_items' || 
                  searchResults.searchType === 'no_items' ? (
                <MissingItemsDisplay searchResults={searchResults} />
              ) : (
                <ResultsDisplay 
                  results={searchResults.results || searchResults.items}
                  totalFound={searchResults.totalFound}
                  processedKeywords={searchResults.processedKeywords}
                />
              )}
            </>
          )}

          {/* Getting Started Guide */}
          {!searchResults && !isLoading && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 30, 46, 0.95), rgba(22, 33, 62, 0.95))',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '32px',
              border: '1px solid rgba(79, 172, 254, 0.2)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🚀</div>
              <h2 style={{
                color: '#4FACFE',
                fontSize: '1.5rem',
                marginBottom: '16px',
                fontWeight: '600'
              }}>
                Ready to Create Amazing Builds?
              </h2>
              <div style={{
                color: '#B8BCC8',
                fontSize: '1rem',
                marginBottom: '24px',
                maxWidth: '600px',
                margin: '0 auto 24px',
                lineHeight: '1.5'
              }}>
                Describe your ideal playstyle and discover builds that work perfectly together.
                {isAuthenticated && ' Connect your Bungie account to see builds you can make right now!'}
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '16px',
                maxWidth: '800px',
                margin: '0 auto'
              }}>
                <div style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💥</div>
                  <div style={{ color: '#22C55E', fontWeight: '600', marginBottom: '4px' }}>
                    Powerful Synergies
                  </div>
                  <div style={{ color: '#B8BCC8', fontSize: '0.9rem' }}>
                    Exotic armor, mods, and subclass abilities that work together
                  </div>
                </div>
                
                <div style={{
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎯</div>
                  <div style={{ color: '#8B5CF6', fontWeight: '600', marginBottom: '4px' }}>
                    Smart Recommendations
                  </div>
                  <div style={{ color: '#B8BCC8', fontSize: '0.9rem' }}>
                    AI-powered suggestions based on your playstyle preferences
                  </div>
                </div>
                
                <div style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚡</div>
                  <div style={{ color: '#F59E0B', fontWeight: '600', marginBottom: '4px' }}>
                    Instant Results
                  </div>
                  <div style={{ color: '#B8BCC8', fontSize: '0.9rem' }}>
                    Get complete build guides with loadouts and gameplay tips
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}