import React, { useState } from 'react';
import Head from 'next/head';
import BuildCreator from '../components/BuildCreator';
import ResultsDisplay from '../components/ResultsDisplay';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Home() {
  const [searchResults, setSearchResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (keywords) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/destiny/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keywords }),
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

  return (
    <>
      <Head>
        <title>Casting Destiny</title>
        <meta name="description" content="Search for keywords from everywhere in Destiny 2" />
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
              Search for keywords from everywhere in Destiny 2
            </p>
          </div>

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
            <ResultsDisplay 
              results={searchResults.results}
              totalFound={searchResults.totalFound}
              processedKeywords={searchResults.processedKeywords}
            />
          )}
        </div>
      </div>
    </>
  );
}
