import React from 'react';

const MissingItemsDisplay = ({ searchResults }) => {
  const { missingAnalysis, optimalBuild, suggestions } = searchResults;

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '15px',
      padding: '25px',
      border: '1px solid rgba(255, 152, 0, 0.3)'
    }}>
      <h2 style={{
        color: '#FF9800',
        marginBottom: '20px',
        fontSize: '1.4rem',
        textAlign: 'center'
      }}>
        🔍 Build Analysis for "{searchResults.query}"
      </h2>
      
      {/* Optimal Build Info */}
      {optimalBuild && (
        <div style={{
          background: 'rgba(255, 152, 0, 0.1)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '25px',
          border: '1px solid rgba(255, 152, 0, 0.2)'
        }}>
          <h3 style={{
            color: '#FF9800',
            fontSize: '1.2rem',
            marginBottom: '10px'
          }}>
            🎯 Perfect Build Found: {optimalBuild.name}
          </h3>
          <p style={{
            color: '#e6e6e6',
            marginBottom: '15px',
            fontSize: '1rem'
          }}>
            {optimalBuild.description}
          </p>
          <div style={{
            background: 'rgba(255, 152, 0, 0.2)',
            color: '#FF9800',
            padding: '10px 15px',
            borderRadius: '20px',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            ⚠️ You're missing some key components to make this build
          </div>
        </div>
      )}

      {/* Missing Items Analysis */}
      {missingAnalysis && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '25px'
        }}>
          <h4 style={{
            color: '#f4a724',
            marginBottom: '15px',
            fontSize: '1.1rem'
          }}>
            🚫 Missing Components
          </h4>

          {/* Missing Exotics */}
          {missingAnalysis.missingExotics && missingAnalysis.missingExotics.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <strong style={{ color: '#FFD700', fontSize: '0.9rem' }}>🔥 Missing Exotic Gear:</strong>
              <ul style={{
                margin: '8px 0 0 0',
                paddingLeft: '20px',
                color: '#b3b3b3'
              }}>
                {missingAnalysis.missingExotics.map((item, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing Mods */}
          {missingAnalysis.missingMods && missingAnalysis.missingMods.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <strong style={{ color: '#4CAF50', fontSize: '0.9rem' }}>🛠️ Missing Mods:</strong>
              <ul style={{
                margin: '8px 0 0 0',
                paddingLeft: '20px',
                color: '#b3b3b3'
              }}>
                {missingAnalysis.missingMods.map((item, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing Subclass Items */}
          {missingAnalysis.missingSubclassItems && missingAnalysis.missingSubclassItems.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <strong style={{ color: '#DA70D6', fontSize: '0.9rem' }}>🔮 Missing Subclass Items:</strong>
              <ul style={{
                margin: '8px 0 0 0',
                paddingLeft: '20px',
                color: '#b3b3b3'
              }}>
                {missingAnalysis.missingSubclassItems.map((item, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div style={{
          background: 'rgba(76, 175, 80, 0.1)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid rgba(76, 175, 80, 0.2)'
        }}>
          <h4 style={{
            color: '#4CAF50',
            marginBottom: '15px',
            fontSize: '1.1rem'
          }}>
            💡 How to Complete This Build
          </h4>
          <ul style={{
            margin: '0',
            paddingLeft: '20px',
            color: '#e6e6e6'
          }}>
            {suggestions.map((suggestion, i) => (
              <li key={i} style={{
                marginBottom: '8px',
                fontSize: '0.9rem',
                lineHeight: '1.4'
              }}>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* General Suggestions for Fallback Cases */}
      {searchResults.searchType === 'partial_items' && (
        <div style={{
          background: 'rgba(33, 150, 243, 0.1)',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid rgba(33, 150, 243, 0.2)'
        }}>
          <h4 style={{
            color: '#2196F3',
            marginBottom: '15px',
            fontSize: '1.1rem'
          }}>
            🎮 Alternative Suggestions
          </h4>
          <ul style={{
            margin: '0',
            paddingLeft: '20px',
            color: '#e6e6e6'
          }}>
            {searchResults.suggestions?.map((suggestion, i) => (
              <li key={i} style={{
                marginBottom: '8px',
                fontSize: '0.9rem',
                lineHeight: '1.4'
              }}>
                {suggestion}
              </li>
            )) || []}
          </ul>
        </div>
      )}

      {/* No Items Found */}
      {searchResults.searchType === 'no_items' && (
        <div style={{
          background: 'rgba(255, 87, 34, 0.1)',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid rgba(255, 87, 34, 0.2)',
          textAlign: 'center'
        }}>
          <div style={{
            color: '#FF5722',
            fontSize: '3rem',
            marginBottom: '15px'
          }}>
            🎒
          </div>
          <h4 style={{
            color: '#FF5722',
            marginBottom: '15px',
            fontSize: '1.1rem'
          }}>
            No Related Items in Your Inventory
          </h4>
          <p style={{
            color: '#b3b3b3',
            marginBottom: '15px'
          }}>
            Your inventory doesn't contain items matching "{searchResults.query}"
          </p>
          <ul style={{
            margin: '0',
            paddingLeft: '0',
            listStyle: 'none',
            color: '#e6e6e6'
          }}>
            {searchResults.suggestions?.map((suggestion, i) => (
              <li key={i} style={{
                marginBottom: '8px',
                fontSize: '0.9rem',
                padding: '8px 15px',
                background: 'rgba(255, 87, 34, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 87, 34, 0.2)'
              }}>
                💡 {suggestion}
              </li>
            )) || []}
          </ul>
        </div>
      )}

      {/* Action Button */}
      <div style={{
        textAlign: 'center',
        marginTop: '25px'
      }}>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: 'linear-gradient(45deg, #FF9800, #FFC107)',
            color: '#000',
            border: 'none',
            padding: '12px 25px',
            borderRadius: '10px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'linear-gradient(45deg, #FFC107, #FF9800)';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'linear-gradient(45deg, #FF9800, #FFC107)';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          🔄 Try Different Search Terms
        </button>
      </div>
    </div>
  );
};

export default MissingItemsDisplay;