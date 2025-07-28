// This is a simplified version if you want the separate component
// Otherwise, the troubleshooting is built into the DestinyDataViewer

import React, { useState } from 'react';

const ApiTroubleshooter = () => {
  const [debugResults, setDebugResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setDebugResults(null);

    try {
      const response = await fetch('/api/destiny/debug');
      const results = await response.json();
      setDebugResults(results);
    } catch (error) {
      setDebugResults({
        success: false,
        error: 'Failed to run diagnostics',
        details: error.message
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '15px',
      padding: '25px',
      border: '1px solid rgba(244, 167, 36, 0.2)'
    }}>
      <h3 style={{
        color: '#f4a724',
        marginBottom: '20px',
        fontSize: '1.2rem'
      }}>
        🔧 Advanced Diagnostics
      </h3>

      <button
        onClick={runDiagnostics}
        disabled={isRunning}
        style={{
          background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
          color: 'white',
          border: 'none',
          padding: '12px 20px',
          borderRadius: '8px',
          cursor: isRunning ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          opacity: isRunning ? 0.6 : 1,
          marginBottom: '20px'
        }}
      >
        {isRunning ? '🔄 Running...' : '🔍 Run Advanced Diagnostics'}
      </button>

      {debugResults && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '10px',
          padding: '20px'
        }}>
          <h4 style={{
            color: debugResults.success ? '#4CAF50' : '#FF5722',
            marginBottom: '15px'
          }}>
            {debugResults.success ? '✅ Diagnostics Results' : '❌ Issues Found'}
          </h4>

          <pre style={{
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '10px',
            borderRadius: '5px',
            overflow: 'auto',
            fontSize: '0.8rem',
            color: '#e6e6e6'
          }}>
            {JSON.stringify(debugResults, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ApiTroubleshooter;