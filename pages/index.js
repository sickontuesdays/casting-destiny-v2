// pages/index.js
import React, { useState } from 'react';
import Head from 'next/head';
import { useAuth } from '../lib/useAuth';
import BuildCreator from '../components/BuildCreator';
import ResultsDisplay from '../components/ResultsDisplay';
import LoadingSpinner from '../components/LoadingSpinner';
import AuthButton from '../components/AuthButton';

export default function Home() {
  const { session } = useAuth();
  const [searchResults, setSearchResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useInventoryOnly, setUseInventoryOnly] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  const handleSearch = async (keywords) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let endpoint = '/api/destiny/search';
      let requestBody = { keywords };

      // If user is logged in and wants inventory-only search
      if (session && useInventoryOnly && selectedCharacter) {
        endpoint = '/api/destiny/search-inventory';
        requestBody = {
          keywords,
          membershipType: selectedCharacter.membershipType,
          membershipId: selectedCharacter.membershipId
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
        setSearchResults(data);
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

  // Set default character when session loads
  React.useEffect(() => {
    if (session?.user?.destinyMemberships && !selectedCharacter) {
      const primaryMembership = session.user.destinyMemberships.find(
        m => m.membershipType === 3 // Steam
      ) || session.user.destinyMemberships[0];
      
      if (primaryMembership) {
        setSelectedCharacter(primaryMembership);
      }
    }
  }, [session, selectedCharacter]);

  return (
    <>
      <Head>
        <title>Casting Destiny</title>
        <meta name="description" content="Cast your perfect Destiny 2 build based on your playstyle - discover synergistic components that work together" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        color: '#e6e6e6',
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{
              color: '#f4a724',
              fontSize: '2.5rem',
              marginBottom: '10px',
              textShadow: '0 0 10px rgba(244, 167, 36, 0.3)'
            }}>
              🔮 Casting Destiny
            </h1>
            <p style={{
              color: '#b3b3b3',
              fontSize: '1.1rem'
            }}>
              Cast your perfect Guardian build by describing your playstyle - discover the components that create perfect synergy
            </p>
          </div>

          {/* Auth Section */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <AuthButton />
          </div>

          {/* Search Options (only show when logged in) */}
          {session && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              padding: '20px',
              marginBottom: '20px',
              border: '1px solid rgba(244, 167, 36, 0.2)'
            }}>
              <h3 style={{
                color: '#f4a724',
                marginBottom: '15px',
                fontSize: '1.1rem'
              }}>Search Options</h3>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '15px',
                alignItems: 'flex-start'
              }}>
                {/* Search Type Toggle */}
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  color: '#e6e6e6'
                }}>
                  <input
                    type="checkbox"
                    checked={useInventoryOnly}
                    onChange={(e) => setUseInventoryOnly(e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: '#f4a724'
                    }}
                  />
                  <span>🎒 Only show builds I can make with my inventory</span>
                </label>

                {/* Character Selection (only show when inventory mode is on) */}
                {useInventoryOnly && session.user.destinyMemberships && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginLeft: '28px'
                  }}>
                    <span style={{ color: '#b3b3b3' }}>Platform:</span>
                    <select
                      value={selectedCharacter?.membershipId || ''}
                      onChange={(e) => {
                        const membership = session.user.destinyMemberships.find(
                          m => m.membershipId === e.target.value
                        );
                        setSelectedCharacter(membership);
                      }}
                      style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(244, 167, 36, 0.3)',
                        borderRadius: '5px',
                        color: '#e6e6e6',
                        padding: '5px 10px'
                      }}
                    >
                      {session.user.destinyMemberships.map((membership) => (
                        <option 
                          key={membership.membershipId} 
                          value={membership.membershipId}
                          style={{ background: '#1a1a2e' }}
                        >
                          {membership.displayName} ({
                            membership.membershipType === 1 ? 'Xbox' :
                            membership.membershipType === 2 ? 'PlayStation' :
                            membership.membershipType === 3 ? 'Steam' :
                            membership.membershipType === 4 ? 'Battle.net' :
                            membership.membershipType === 5 ? 'Stadia' :
                            membership.membershipType === 6 ? 'Epic Games' :
                            'Unknown'
                          })
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Search Mode Indicator */}
              <div style={{
                marginTop: '15px',
                padding: '10px',
                background: useInventoryOnly ? 
                  'rgba(76, 175, 80, 0.1)' : 
                  'rgba(244, 167, 36, 0.1)',
                borderRadius: '8px',
                border: `1px solid ${useInventoryOnly ? 
                  'rgba(76, 175, 80, 0.3)' : 
                  'rgba(244, 167, 36, 0.3)'}`,
                color: useInventoryOnly ? '#4CAF50' : '#f4a724'
              }}>
                {useInventoryOnly ? (
                  <span>🎯 Searching your inventory only - results will be builds you can make right now!</span>
                ) : (
                  <span>🌍 Searching all Destiny items - results may include gear you don't own</span>
                )}
              </div>
            </div>
          )}

          {/* Build Creator */}
          <BuildCreator onSearch={handleSearch} isLoading={isLoading} />

          {/* Loading */}
          {isLoading && <LoadingSpinner />}

          {/* Error Display */}
          {error && (
            <div style={{
              background: 'rgba(255, 0, 0, 0.1)',
              border: '1px solid rgba(255, 0, 0, 0.3)',
              borderRadius: '10px',
              padding: '15px',
              marginBottom: '20px',
              color: '#ff6b6b'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Results */}
          {searchResults && !isLoading && (
            <>
              {/* Search Summary */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
                padding: '15px',
                marginBottom: '20px',
                border: '1px solid rgba(244, 167, 36, 0.1)'
              }}>
                <div style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>
                  Found {searchResults.totalFound} matches
                  {searchResults.inventorySize && (
                    <span> from your {searchResults.inventorySize} owned items</span>
                  )}
                  {searchResults.searchBreakdown && (
                    <div style={{ marginTop: '5px' }}>
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

              <ResultsDisplay 
                results={searchResults.results}
                totalFound={searchResults.totalFound}
                processedKeywords={searchResults.processedKeywords}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
