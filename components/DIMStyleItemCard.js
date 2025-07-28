import React from 'react';

const DIMStyleItemCard = ({ item, onClick, isSelected, showDetails = true }) => {
  const getBorderColor = () => {
    switch (item.tierType) {
      case 6: return '#ceae33'; // Exotic - gold
      case 5: return '#522f65'; // Legendary - purple
      case 4: return '#365f9c'; // Rare - blue
      case 3: return '#366a3c'; // Uncommon - green
      default: return '#464647'; // Common - gray
    }
  };

  const getDamageTypeColor = () => {
    switch (item.damageType) {
      case 'Arc': return '#79C7E3';
      case 'Solar': return '#F2721B';
      case 'Void': return '#B184C5';
      case 'Stasis': return '#4D88CC';
      case 'Strand': return '#00C851';
      default: return '#ffffff';
    }
  };

  const getSlotIcon = () => {
    if (item.isWeapon) {
      switch (item.slot) {
        case 'kinetic': return '🔫';
        case 'energy': return '⚡';
        case 'power': return '💥';
        default: return '⚔️';
      }
    }
    if (item.isArmor) {
      switch (item.slot) {
        case 'helmet': return '🪖';
        case 'gauntlets': return '🧤';
        case 'chest': return '🦺';
        case 'legs': return '👖';
        case 'classItem': return '🎗️';
        default: return '🛡️';
      }
    }
    return '📦';
  };

  return (
    <div
      onClick={() => onClick && onClick(item)}
      style={{
        position: 'relative',
        width: '100px',
        height: '100px',
        background: '#2b2d35',
        border: `2px solid ${getBorderColor()}`,
        borderRadius: '8px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isSelected ? 0.6 : 1,
        transform: isSelected ? 'scale(0.95)' : 'scale(1)',
        boxShadow: item.isExotic ? '0 0 10px rgba(206, 174, 51, 0.3)' : 'none'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.target.style.transform = 'scale(1.05)';
          e.target.style.boxShadow = `0 4px 12px ${getBorderColor()}40`;
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.target.style.transform = isSelected ? 'scale(0.95)' : 'scale(1)';
          e.target.style.boxShadow = item.isExotic ? '0 0 10px rgba(206, 174, 51, 0.3)' : 'none';
        }
      }}
    >
      {/* Item Icon Background */}
      {item.icon && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            right: '8px',
            bottom: '8px',
            backgroundImage: `url(https://bungie.net${item.icon})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.8,
            borderRadius: '4px'
          }}
        />
      )}
      
      {/* Fallback Icon */}
      {!item.icon && (
        <div style={{
          fontSize: '2rem',
          opacity: 0.6
        }}>
          {getSlotIcon()}
        </div>
      )}

      {/* Damage Type Indicator */}
      {item.damageType && item.damageType !== 'Kinetic' && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: getDamageTypeColor(),
            border: '1px solid #000',
            boxShadow: '0 0 4px rgba(0,0,0,0.5)'
          }}
        />
      )}

      {/* Exotic Indicator */}
      {item.isExotic && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            left: '4px',
            fontSize: '10px',
            color: '#ceae33',
            fontWeight: 'bold',
            textShadow: '0 0 2px #000'
          }}
        >
          ★
        </div>
      )}

      {/* Power Level (if available) */}
      {item.powerLevel && (
        <div
          style={{
            position: 'absolute',
            bottom: '4px',
            right: '4px',
            fontSize: '10px',
            color: '#ffffff',
            fontWeight: 'bold',
            background: 'rgba(0,0,0,0.7)',
            padding: '1px 3px',
            borderRadius: '2px'
          }}
        >
          {item.powerLevel}
        </div>
      )}

      {/* Item Name Overlay (on hover) */}
      {showDetails && (
        <div
          className="item-tooltip"
          style={{
            position: 'absolute',
            bottom: '-30px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.9)',
            color: '#ffffff',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            whiteSpace: 'nowrap',
            opacity: '0',
            transition: 'opacity 0.2s ease',
            pointerEvents: 'none',
            zIndex: 10,
            maxWidth: '150px',
            textAlign: 'center'
          }}
        >
          {item.name}
        </div>
      )}
      
      <style jsx>{`
        div:hover .item-tooltip {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default DIMStyleItemCard;