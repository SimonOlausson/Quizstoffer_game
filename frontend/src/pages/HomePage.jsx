import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function HomePage({ ws, onCreateRoom }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState(null) // null, create, join
  const [gameIdDigits, setGameIdDigits] = useState(['', '', '', '', '', ''])
  const [playerName, setPlayerName] = useState('')
  const [showHostModal, setShowHostModal] = useState(false)
  const [localError, setLocalError] = useState(null)
  const gameIdInputs = useRef([])

  const error = localError

  const handleGameIdChange = (index, value) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return

    const newDigits = [...gameIdDigits]
    newDigits[index] = value

    setGameIdDigits(newDigits)

    // Auto-focus to next input if a digit was entered
    if (value && index < 5) {
      gameIdInputs.current[index + 1]?.focus()
    }
  }

  const handleGameIdKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !gameIdDigits[index] && index > 0) {
      gameIdInputs.current[index - 1]?.focus()
    }
  }

  const handleJoinRoom = () => {
    const gameId = gameIdDigits.join('')
    if (gameId.length === 6 && playerName.trim()) {
      setLocalError(null)
      // Save player state to localStorage before navigating
      // Clear any previous host state for this new game
      localStorage.setItem('quiztopher_game_state', JSON.stringify({
        playerId: localStorage.getItem('quiztopher_game_state')
          ? JSON.parse(localStorage.getItem('quiztopher_game_state')).playerId
          : undefined,
        playerName: playerName,
        gameId: gameId,
        // NOT setting isHost or roomId - let server decide
      }))
      navigate(`/game/${gameId}`)
    } else {
      setLocalError('Please enter a 6-digit game ID and player name')
    }
  }

  const handleCreateRoom = () => {
    onCreateRoom()
  }

  return (
    <div className="container">
      <h1>🎵 Quiztopher</h1>

      {mode === null && (
        <>
          <p style={{ textAlign: 'center', marginBottom: 30, fontSize: 16, color: '#666' }}>
            A multiplayer music guessing game
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button className="button" onClick={() => setShowHostModal(true)}>
              Create Room (Host)
            </button>
            <button className="button button-secondary" onClick={() => setMode('join')}>
              Join Room (Player)
            </button>
            <button
              className="button button-secondary"
              onClick={() => navigate('/admin')}
              style={{ fontSize: 14 }}
            >
              Admin Dashboard
            </button>
          </div>
        </>
      )}


      {mode === 'join' && (
        <>
          {error && (
            <div style={{
              padding: 12,
              background: '#ffebee',
              border: '1px solid #ef5350',
              borderRadius: 8,
              color: '#c62828',
              marginBottom: 20,
              fontSize: 14,
              fontWeight: 500,
            }}>
              {error}
            </div>
          )}
          <div className="form-group">
            <label>Game ID</label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
              {gameIdDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => gameIdInputs.current[idx] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleGameIdChange(idx, e.target.value)}
                  onKeyDown={(e) => handleGameIdKeyDown(idx, e)}
                  style={{
                    width: 50,
                    height: 50,
                    fontSize: 24,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    border: '2px solid #e0e0e0',
                    borderRadius: 8,
                    transition: 'border-color 0.3s',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0'
                  }}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Your Name</label>
            <input
              type="text"
              className="input-field"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
          </div>

          <button
            className="button"
            onClick={handleJoinRoom}
            style={{ width: '100%' }}
            disabled={gameIdDigits.join('').length !== 6 || !playerName.trim()}
          >
            Join Room
          </button>
          <button
            className="button button-secondary"
            onClick={() => {
              setMode(null)
              setGameIdDigits(['', '', '', '', '', ''])
              setPlayerName('')
              setLocalError(null)
            }}
            style={{ width: '100%', marginTop: 10 }}
          >
            Back
          </button>
        </>
      )}

      {showHostModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: 30,
            maxWidth: 500,
            width: 'calc(100% - 40px)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: 24 }}>🎮 You are the Game Master</h2>
            <p style={{ color: '#666', marginBottom: 25, fontSize: 14 }}>
              You are in control of this game. Check these items before you start:
            </p>

            <div style={{ marginBottom: 25 }}>
              <div style={{ display: 'flex', gap: 15, marginBottom: 20, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 28 }}>🎵</span>
                <div>
                  <p style={{ margin: '0 0 5px 0', fontWeight: 600, fontSize: 16 }}>Spotify</p>
                  <p style={{ margin: 0, color: '#666', fontSize: 14 }}>Make sure to be logged in to Spotify</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 15, marginBottom: 20, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 28 }}>🔊</span>
                <div>
                  <p style={{ margin: '0 0 5px 0', fontWeight: 600, fontSize: 16 }}>Speaker</p>
                  <p style={{ margin: 0, color: '#666', fontSize: 14 }}>Connect your device to a speaker (Spotify Connect works)</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 15, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 28 }}>🔉</span>
                <div>
                  <p style={{ margin: '0 0 5px 0', fontWeight: 600, fontSize: 16 }}>Volume</p>
                  <p style={{ margin: 0, color: '#666', fontSize: 14 }}>Adjust the speaker volume</p>
                </div>
              </div>
            </div>

            <button
              className="button"
              onClick={() => {
                setShowHostModal(false)
                handleCreateRoom()
              }}
              style={{ width: '100%' }}
            >
              Ready, Let's Go!
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
