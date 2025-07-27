import React from 'react';
import { useRouter } from 'next/router';

const TabNavigation = () => {
  const router = useRouter();
  const currentPath = router.pathname;

  const tabs = [
    { name: 'Casting Destiny', path: '/', icon: '🔮' },
    { name: 'Destiny Data', path: '/destiny-data', icon: '📊' }
  ];

  const handleTabClick = (path) => {
    router.push(path);
  };

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.3)',
      borderBottom: '1px solid rgba(244, 167, 36, 0.3)',
      padding: '0',
      marginBottom: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        gap: '0'
      }}>
        {tabs.map((tab, index) => {
          const isActive = currentPath === tab.path;
          
          return (
            <button
              key={index}
              onClick={() => handleTabClick(tab.path)}
              style={{
                background: isActive ? 
                  'linear-gradient(135deg, #1a1a2e, #16213e)' : 
                  'rgba(255, 255, 255, 0.05)',
                color: isActive ? '#f4a724' : '#b3b3b3',
                border: 'none',
                padding: '15px 25px',
                fontSize: '1rem',
                fontWeight: isActive ? 'bold' : 'normal',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                borderTopLeftRadius: index === 0 ? '10px' : '0',
                borderTopRightRadius: index === tabs.length - 1 ? '10px' : '0',
                borderBottom: isActive ? '3px solid #f4a724' : '3px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.color = '#e6e6e6';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.target.style.color = '#b3b3b3';
                }
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{tab.icon}</span>
              {tab.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabNavigation;