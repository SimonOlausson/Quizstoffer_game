export default function ReconnectingScreen() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 80,
          marginBottom: 20,
          animation: 'spin 2s linear infinite',
        }}>
          🔄
        </div>
        <h1 style={{
          fontSize: 32,
          margin: '0 0 10px 0',
          color: '#fff',
          fontWeight: 'bold',
        }}>
          Reconnecting...
        </h1>
        <p style={{
          color: '#fff',
          fontSize: 16,
          opacity: 0.9,
          margin: 0,
        }}>
          Attempting to restore your game session
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
