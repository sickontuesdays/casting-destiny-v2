import React from 'react';

const LoadingSpinner = () => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid rgba(244, 167, 36, 0.2)',
        borderTop: '4px solid #f4a724',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      <span style={{
        marginLeft: '15px',
        color: '#b3b3b3',
        fontSize: '1rem'
      }}>Casting your build...</span>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
