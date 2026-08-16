import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [commentReply, setCommentReply] = useState(true);
  const [messengerReply, setMessengerReply] = useState(true);

  if (!user) return <p style={{color:'white'}}>Please login</p>;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#06070a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        background: '#12141c',
        border: '1px solid #262a38',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '480px',
        color: 'white'
      }}>
        <h1 style={{color: '#7c5cff', marginBottom: '8px'}}>
          Welcome to Automorai
        </h1>
        <p style={{color: '#8b90a3', marginBottom: '32px'}}>
          Hello, {user.email}! Manage your Facebook Page automation here.
        </p>

        <button style={{
          width: '100%',
          padding: '14px',
          background: '#7c5cff',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: 'pointer',
          marginBottom: '16px'
        }}>
          Connect Facebook Page
        </button>

        {/* Comment Reply Toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#181b26',
          border: '1px solid #262a38',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '12px'
        }}>
          <div>
            <p style={{margin: 0, fontWeight: '600'}}>Comment Auto-Reply</p>
            <p style={{margin: 0, color: '#8b90a3', fontSize: '0.85rem'}}>
              Auto-reply to Facebook comments
            </p>
          </div>
          <div
            onClick={() => setCommentReply(!commentReply)}
            style={{
              width: '48px',
              height: '26px',
              borderRadius: '13px',
              background: commentReply ? '#7c5cff' : '#262a38',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '3px',
              left: commentReply ? '24px' : '3px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'white',
              transition: 'left 0.2s'
            }} />
          </div>
        </div>

        {/* Messenger Reply Toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#181b26',
          border: '1px solid #262a38',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div>
            <p style={{margin: 0, fontWeight: '600'}}>Messenger Auto-Reply</p>
            <p style={{margin: 0, color: '#8b90a3', fontSize: '0.85rem'}}>
              Auto-reply to Messenger messages
            </p>
          </div>
          <div
            onClick={() => setMessengerReply(!messengerReply)}
            style={{
              width: '48px',
              height: '26px',
              borderRadius: '13px',
              background: messengerReply ? '#7c5cff' : '#262a38',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '3px',
              left: messengerReply ? '24px' : '3px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'white',
              transition: 'left 0.2s'
            }} />
          </div>
        </div>

        <button
          onClick={logout}
          style={{
            width: '100%',
            padding: '14px',
            background: 'transparent',
            color: '#8b90a3',
            border: '1px solid #262a38',
            borderRadius: '10px',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;