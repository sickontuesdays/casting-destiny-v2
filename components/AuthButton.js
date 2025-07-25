import { useAuth } from '../lib/useAuth';

const AuthButton = () => {
  const { session, loading, signIn, signOut } = useAuth();

  if (loading) return <p>Loading...</p>;

  if (session) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '10px 15px',
        borderRadius: '10px',
        border: '1px solid rgba(244, 167, 36, 0.2)'
      }}>
        <img 
          src={session.user.image} 
          alt="Profile"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%'
          }}
        />
        <div>
          <div style={{ color: '#f4a724', fontWeight: 'bold' }}>
            {session.user.name}
          </div>
          <div style={{ color: '#b3b3b3', fontSize: '0.8rem' }}>
            Connected to Bungie
          </div>
        </div>
        <button
          onClick={signOut}
          style={{
            background: 'rgba(255, 0, 0, 0.2)',
            border: '1px solid rgba(255, 0, 0, 0.3)',
            color: '#ff6b6b',
            padding: '5px 10px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signIn}
      style={{
        background: 'linear-gradient(45deg, #f4a724, #ff8c00)',
        color: '#000',
        border: 'none',
        padding: '12px 20px',
        borderRadius: '10px',
        fontSize: '1rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
      }}
    >
      🔗 Connect Your Bungie Account
    </button>
  );
};

export default AuthButton;
