import React, { useState } from 'react';

const BuildCreator = ({ onSearch, isLoading, playerData }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('builds'); // 'builds', 'items', 'player'
  const [classFilter, setClassFilter] = useState('any');
  const [damageFilter, setDamageFilter] = useState('any');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [buildFocus, setBuildFocus] = useState('any');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() || buildFocus !== 'any') {
      onSearch({
        query: searchQuery.trim() || buildFocus,
        mode: searchMode,
        filters: {
          class: classFilter,
          damage: damageFilter,
          focus: buildFocus
        }
      });
    }
  };

  const handleQuickSearch = (query) => {
    setSearchQuery(query);
    onSearch({
      query,
      mode: searchMode,
      filters: {
        class: classFilter,
        damage: damageFilter,
        focus: buildFocus
      }
    });
  };

  const quickSearchOptions = [
    { label: 'Grenade Spam', query: 'grenade energy constant', icon: '💥' },
    { label: 'Invisibility', query: 'invisible stealth void hunter', icon: '👻' },
    { label: 'Healing Support', query: 'healing well of radiance solar', icon: '💚' },
    { label: 'Never Reload', query: 'auto loading holster reload', icon: '🔄' },
    { label: 'Super Spam', query: 'super energy orbs intellect', icon: '⚡' },
    { label: 'Tank Build', query: 'resilience resist defensive', icon: '🛡️' },
    { label: 'Melee Focus', query: 'melee strength punch', icon: '👊' },
    { label: 'Speed Build', query: 'mobility movement speed', icon: '💨' }
  ];

  const buildFocusOptions = [
    { value: 'any', label: 'Any Focus' },
    { value: 'pve', label: 'PvE Content' },
    { value: 'pvp', label: 'PvP/Crucible' },
    { value: 'raid', label: 'Raids' },
    { value: 'dungeon', label: 'Dungeons' },
    { value: 'nightfall', label: 'Nightfalls' },
    { value: 'solo', label: 'Solo Content' },
    { value: 'endgame', label: 'Endgame' }
  ];

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(30, 30, 46, 0.95), rgba(22, 33, 62, 0.95))',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '20px',
      border: '1px solid rgba(79, 172, 254, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <h2 style={{
          color: '#4FACFE',
          fontSize: '1.4rem',
          margin: 0,
          fontWeight: '600'
        }}>
          🔮 Build Creator
        </h2>
        
        {playerData && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#B8BCC8',
            fontSize: '0.9rem'
          }}>
            <span>👤</span>
            <span>{playerData.displayName}</span>
            <span style={{
              background: 'rgba(79, 172, 254, 0.2)',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.8rem'
            }}>
              {playerData.itemCount} items
            </span>
          </div>
        )}
      </div>

      {/* Search Mode Selector */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '8px',
        padding: '4px'
      }}>
        {[
          { value: 'builds', label: '🎯 Find Builds', desc: 'Complete build recommendations' },
          { value: 'items', label: '🔍 Search Items', desc: 'Individual components' },
          ...(playerData ? [{ value: 'player', label: '🎒 My Inventory', desc: 'Your owned items only' }] : [])
        ].map((mode) => (
          <button
            key={mode.value}
            onClick={() => setSearchMode(mode.value)}
            style={{
              flex: 1,
              background: searchMode === mode.value ? 
                'linear-gradient(135deg, #4FACFE, #00F2FE)' : 
                'transparent',
              color: searchMode === mode.value ? '#1a1a2e' : '#B8BCC8',
              border: 'none',
              padding: '12px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '0.9rem',
              fontWeight: searchMode === mode.value ? '600' : '400'
            }}
            onMouseEnter={(e) => {
              if (searchMode !== mode.value) {
                e.target.style.background = 'rgba(79, 172, 254, 0.1)';
                e.target.style.color = '#4FACFE';
              }
            }}
            onMouseLeave={(e) => {
              if (searchMode !== mode.value) {
                e.target.style.background = 'transparent';
                e.target.style.color = '#B8BCC8';
              }
            }}
          >
            <div>{mode.label}</div>
            <div style={{ 
              fontSize: '0.7rem', 
              opacity: 0.8,
              marginTop: '2px'
            }}>
              {mode.desc}
            </div>
          </button>
        ))}
      </div>

      {/* Main Search Input */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              searchMode === 'builds' ? 'Describe your ideal playstyle (e.g., "constant grenades", "invisibility hunter")' :
              searchMode === 'items' ? 'Search for items, mods, or abilities' :
              'Search your inventory for builds you can make'
            }
            style={{
              width: '100%',
              padding: '16px 20px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '2px solid rgba(79, 172, 254, 0.3)',
              borderRadius: '10px',
              color: '#E5E7EB',
              fontSize: '1rem',
              outline: 'none',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#4FACFE';
              e.target.style.boxShadow = '0 0 20px rgba(79, 172, 254, 0.3)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(79, 172, 254, 0.3)';
              e.target.style.boxShadow = 'none';
            }}
          />
          
          <button
            type="submit"
            disabled={!searchQuery.trim() && buildFocus === 'any' || isLoading}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'linear-gradient(135deg, #4FACFE, #00F2FE)',
              color: '#1a1a2e',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: (!searchQuery.trim() && buildFocus === 'any') || isLoading ? 'not-allowed' : 'pointer',
              opacity: (!searchQuery.trim() && buildFocus === 'any') || isLoading ? 0.5 : 1,
              fontSize: '0.9rem',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (!isLoading && (searchQuery.trim() || buildFocus !== 'any')) {
                e.target.style.transform = 'translateY(-50%) scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            {isLoading ? '🔄' : '🔍'}
          </button>
        </div>
      </form>

      {/* Quick Search Options */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          color: '#B8BCC8',
          fontSize: '0.9rem',
          marginBottom: '12px',
          fontWeight: '500'
        }}>
          Quick Search:
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '8px'
        }}>
          {quickSearchOptions.map((option) => (
            <button
              key={option.query}
              onClick={() => handleQuickSearch(option.query)}
              style={{
                background: 'rgba(79, 172, 254, 0.1)',
                border: '1px solid rgba(79, 172, 254, 0.2)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#E5E7EB',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '0.9rem',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(79, 172, 254, 0.2)';
                e.target.style.borderColor = '#4FACFE';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(79, 172, 254, 0.1)';
                e.target.style.borderColor = 'rgba(79, 172, 254, 0.2)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <span style={{ marginRight: '8px' }}>{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Options Toggle */}
      <button
        onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
        style={{
          background: 'none',
          border: '1px solid rgba(79, 172, 254, 0.3)',
          color: '#4FACFE',
          padding: '8px 16px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '0.9rem',
          marginBottom: showAdvancedOptions ? '16px' : '0',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.borderColor = '#4FACFE';
          e.target.style.background = 'rgba(79, 172, 254, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = 'rgba(79, 172, 254, 0.3)';
          e.target.style.background = 'none';
        }}
      >
        {showAdvancedOptions ? '▼' : '▶'} Advanced Filters
      </button>

      {/* Advanced Options */}
      {showAdvancedOptions && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '8px',
          padding: '16px',
          border: '1px solid rgba(79, 172, 254, 0.2)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            {/* Class Filter */}
            <div>
              <label style={{
                display: 'block',
                color: '#B8BCC8',
                fontSize: '0.9rem',
                marginBottom: '8px',
                fontWeight: '500'
              }}>
                Class:
              </label>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(79, 172, 254, 0.3)',
                  borderRadius: '6px',
                  color: '#E5E7EB',
                  padding: '8px 12px',
                  fontSize: '0.9rem'
                }}
              >
                <option value="any">Any Class</option>
                <option value="titan">🛡️ Titan</option>
                <option value="hunter">🏹 Hunter</option>
                <option value="warlock">✨ Warlock</option>
              </select>
            </div>

            {/* Damage Type Filter */}
            <div>
              <label style={{
                display: 'block',
                color: '#B8BCC8',
                fontSize: '0.9rem',
                marginBottom: '8px',
                fontWeight: '500'
              }}>
                Element:
              </label>
              <select
                value={damageFilter}
                onChange={(e) => setDamageFilter(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(79, 172, 254, 0.3)',
                  borderRadius: '6px',
                  color: '#E5E7EB',
                  padding: '8px 12px',
                  fontSize: '0.9rem'
                }}
              >
                <option value="any">Any Element</option>
                <option value="solar">🔥 Solar</option>
                <option value="arc">⚡ Arc</option>
                <option value="void">🌌 Void</option>
                <option value="stasis">❄️ Stasis</option>
                <option value="strand">🕸️ Strand</option>
              </select>
            </div>

            {/* Build Focus */}
            <div>
              <label style={{
                display: 'block',
                color: '#B8BCC8',
                fontSize: '0.9rem',
                marginBottom: '8px',
                fontWeight: '500'
              }}>
                Activity Focus:
              </label>
              <select
                value={buildFocus}
                onChange={(e) => setBuildFocus(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(79, 172, 254, 0.3)',
                  borderRadius: '6px',
                  color: '#E5E7EB',
                  padding: '8px 12px',
                  fontSize: '0.9rem'
                }}
              >
                {buildFocusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Tips */}
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(79, 172, 254, 0.1)',
            borderRadius: '6px',
            border: '1px solid rgba(79, 172, 254, 0.2)'
          }}>
            <div style={{
              color: '#4FACFE',
              fontSize: '0.9rem',
              fontWeight: '500',
              marginBottom: '8px'
            }}>
              💡 Search Tips:
            </div>
            <div style={{
              color: '#B8BCC8',
              fontSize: '0.8rem',
              lineHeight: '1.4'
            }}>
              • Use quotes for exact phrases: "never reload"<br/>
              • Exclude terms with minus: grenade -warlock<br/>
              • Combine concepts: "invisible hunter" void<br/>
              • Try exotic names: "Heart of Inmost Light"
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildCreator;