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

  const tryFetchData = async () => {
    setIsRunning(true);
    
    try {
      const response = await fetch('/api/destiny/fetch-all-data');
      const results = await response.json();
      
      if (results.success) {
        alert('✅ Data fetch successful! The app should work now.');
      } else {
        alert(`❌ Data fetch failed: ${results.error}`);
      }
    } catch (error) {
      alert(`❌ Network error: ${error.message}`);
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
      margin: '20px',
      border: '1px solid rgba(244, 167, 36, 0.2)'
    }}>
      <h2 style={{
        color: '#f4a724',
        marginBottom: '20px',
        fontSize: '1.4rem'
      }}>
        🔧 API Troubleshooter
      </h2>

      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px'
      }}>
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
            opacity: isRunning ? 0.6 : 1
          }}
        >
          {isRunning ? '🔄 Running...' : '🔍 Run Diagnostics'}
        </button>

        <button
          onClick={tryFetchData}
          disabled={isRunning}
          style={{
            background: 'linear-gradient(45deg, #4CAF50, #45A049)',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '8px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            opacity: isRunning ? 0.6 : 1
          }}
        >
          {isRunning ? '🔄 Testing...' : '🚀 Test Data Fetch'}
        </button>
      </div>

      {debugResults && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '10px',
          padding: '20px',
          marginTop: '20px'
        }}>
          <h3 style={{
            color: debugResults.success ? '#4CAF50' : '#FF5722',
            marginBottom: '15px'
          }}>
            {debugResults.success ? '✅ Diagnostics Results' : '❌ Issues Found'}
          </h3>

          {/* Environment Info */}
          {debugResults.debug?.environment && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#f4a724', marginBottom: '10px' }}>Environment:</h4>
              <div style={{ color: '#e6e6e6', fontSize: '0.9rem' }}>
                <div>API Key: {debugResults.debug.environment.hasApiKey ? '✅ Present' : '❌ Missing'}</div>
                <div>API Key Preview: {debugResults.debug.environment.apiKeyPreview}</div>
                <div>Environment: {debugResults.debug.environment.nodeEnv}</div>
              </div>
            </div>
          )}

          {/* Test Results */}
          {debugResults.debug?.tests && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#f4a724', marginBottom: '10px' }}>Test Results:</h4>
              {Object.entries(debugResults.debug.tests).map(([testName, result]) => (
                <div key={testName} style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '10px',
                  borderRadius: '5px',
                  marginBottom: '10px'
                }}>
                  <div style={{
                    color: result.success ? '#4CAF50' : '#FF5722',
                    fontWeight: 'bold',
                    marginBottom: '5px'
                  }}>
                    {result.success ? '✅' : '❌'} {testName.charAt(0).toUpperCase() + testName.slice(1)}
                  </div>
                  {result.error && (
                    <div style={{ color: '#FF9800', fontSize: '0.9rem' }}>
                      Error: {result.error}
                    </div>
                  )}
                  {result.message && (
                    <div style={{ color: '#e6e6e6', fontSize: '0.9rem' }}>
                      {result.message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {debugResults.recommendations && (
            <div>
              <h4 style={{ color: '#f4a724', marginBottom: '10px' }}>Recommendations:</h4>
              {debugResults.recommendations.map((rec, index) => (
                <div key={index} style={{
                  background: rec.type === 'critical' ? 'rgba(244, 67, 54, 0.1)' :
                            rec.type === 'warning' ? 'rgba(255, 152, 0, 0.1)' :
                            rec.type === 'error' ? 'rgba(244, 67, 54, 0.1)' :
                            'rgba(76, 175, 80, 0.1)',
                  border: `1px solid ${rec.type === 'critical' ? '#F44336' :
                                     rec.type === 'warning' ? '#FF9800' :
                                     rec.type === 'error' ? '#F44336' :
                                     '#4CAF50'}`,
                  borderRadius: '5px',
                  padding: '15px',
                  marginBottom: '10px'
                }}>
                  <div style={{
                    color: rec.type === 'critical' ? '#F44336' :
                           rec.type === 'warning' ? '#FF9800' :
                           rec.type === 'error' ? '#F44336' :
                           '#4CAF50',
                    fontWeight: 'bold',
                    marginBottom: '5px'
                  }}>
                    {rec.message}
                  </div>
                  <div style={{ color: '#e6e6e6', fontSize: '0.9rem' }}>
                    {rec.action}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Raw Debug Data (for development) */}
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '20px' }}>
              <summary style={{ color: '#f4a724', cursor: 'pointer' }}>
                Raw Debug Data (Development)
              </summary>
              <pre style={{
                background: 'rgba(0, 0, 0, 0.5)',
                padding: '10px',
                borderRadius: '5px',
                overflow: 'auto',
                fontSize: '0.8rem',
                color: '#e6e6e6',
                marginTop: '10px'
              }}>
                {JSON.stringify(debugResults, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Manual Steps */}
      <div style={{
        background: 'rgba(255, 152, 0, 0.1)',
        border: '1px solid rgba(255, 152, 0, 0.3)',
        borderRadius: '10px',
        padding: '20px',
        marginTop: '20px'
      }}>
        <h4 style={{ color: '#FF9800', marginBottom: '15px' }}>Manual Troubleshooting Steps:</h4>
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
  );
};

export default ApiTroubleshooter;