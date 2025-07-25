import React from 'react';

const ResultsDisplay = ({ results, totalFound, processedKeywords }) => {
  if (!results || results.length === 0) {
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
          Enter keywords above to discover synergistic build components!
        </div>
      </div>
    );
  }

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
        fontSize: '1.3rem'
      }}>Your Casted Build Components</h2>
      
      {results.map((match, index) => (
        <div 
          key={index}
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '10px',
            padding: '20px',
            marginBottom: '20px',
            borderLeft: '4px solid #f4a724'
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <div style={{
              color: '#f4a724',
              fontWeight: 'bold',
              fontSize: '1.1rem'
            }}>{match.type}</div>
            <div style={{
              background: 'linear-gradient(45deg, #4CAF50, #8BC34A)',
              color: 'white',
              padding: '5px 12px',
              borderRadius: '15px',
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}>{match.synergyScore}% Match</div>
          </div>
          
          <div style={{
            color: '#e6e6e6',
            fontSize: '1.2rem',
            marginBottom: '10px'
          }}>{match.name}</div>
          
          <div style={{
            color: '#b3b3b3',
            lineHeight: '1.5',
            marginBottom: '10px'
          }}>{match.description}</div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {match.matchedKeywords.map((keyword, keyIndex) => (
              <span 
                key={keyIndex}
                style={{
                  background: 'rgba(76, 175, 80, 0.3)',
                  color: '#4CAF50',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  border: '1px solid rgba(76, 175, 80, 0.5)'
                }}
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResultsDisplay;
