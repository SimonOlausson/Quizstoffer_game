import { useState, useEffect } from 'react'
import axios from 'axios'

export default function HostPage({ ws, roomId, gameId, onGoHome }) {
  const [gameState, setGameState] = useState('quiz_selection') // quiz_selection, waiting, playing, round_end, game_ended
  const [showQuizModal, setShowQuizModal] = useState(false)
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [players, setPlayers] = useState([])
  const [scores, setScores] = useState({})
  const [guesses, setGuesses] = useState([])
  const [currentRound, setCurrentRound] = useState(0)
  const [selectedButton, setSelectedButton] = useState(null)
  const [roundResults, setRoundResults] = useState(null)
  const [usedButtons, setUsedButtons] = useState([])
  const [retryPopup, setRetryPopup] = useState(null)
  const [allQuizzes, setAllQuizzes] = useState([])
  const [loadingQuizzes, setLoadingQuizzes] = useState(true)
  const [finalScoreboard, setFinalScoreboard] = useState(null)

  const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://qvisser.onrender.com'
    : (import.meta.env.VITE_API_URL || 'http://localhost:3001')

  const handleGoHomeWithConfirm = () => {
    // Confirm if mid-game
    if (gameState === 'playing' || gameState === 'round_end') {
      if (!window.confirm('Are you sure you want to leave? The game will end for all players.')) {
        return
      }
    }
    onGoHome()
  }

  // Load quizzes on mount
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/quizzes`)
        setAllQuizzes(response.data)
      } catch (err) {
        console.error('Failed to load quizzes:', err)
      } finally {
        setLoadingQuizzes(false)
      }
    }
    fetchQuizzes()
  }, [])

  // Get the currently selected quiz songs
  const sampleQuiz = selectedQuiz?.songs || []

  useEffect(() => {
    if (!ws) return

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case 'PLAYER_JOINED':
          setPlayers(data.players)
          break
        case 'QUIZ_SELECTED':
          // Players receive quiz when selected
          break
        case 'GUESSES_UPDATE':
          setGuesses(data.guesses)
          setScores(data.scores)
          break
        case 'ROUND_AUTO_ENDED':
          setRoundResults(data.results)
          setScores(data.scores)
          setUsedButtons(data.usedButtons || [])
          setRetryPopup(null)
          setGameState('round_end')
          break
        case 'NEXT_ROUND_STARTED':
          // Reset for next round
          setRoundResults(null)
          setGuesses([])
          setSelectedButton(null)
          setRetryPopup(null)
          setScores(data.scores)
          setUsedButtons(data.usedButtons || [])
          setGameState('playing')
          break
        case 'GAME_ENDED':
          setRoundResults(data.results)
          setScores(data.scores)
          setUsedButtons(data.usedButtons || [])
          setFinalScoreboard(data.finalScoreboard)
          setRetryPopup(null)
          setGameState('game_ended')
          break
        case 'RECONNECT_SUCCESS':
          // Restore full game state from reconnection
          setPlayers(data.players || [])
          setScores(data.scores || {})
          setUsedButtons(data.usedButtons || [])
          setCurrentRound(data.currentRound || 0)
          setSelectedButton(data.currentButton !== null && data.currentButton !== undefined ? data.currentButton : null)
          setGameState(data.gameState || 'waiting')
          console.log('Host reconnected successfully - restored game state')
          break
        case 'PLAYER_LEFT':
          // Handle player disconnect
          break
        case 'HOST_MIGRATED':
          // This host is no longer the host - if we're the new host, stay, otherwise redirect
          console.log(`Host migrated: ${data.newHostName} is now the host`)
          break
        case 'PLAYER_DISCONNECTED':
          console.log(`Player disconnected: ${data.playerName}`)
          break
      }
    }
  }, [ws])

  const handleSelectQuiz = (quiz) => {
    // Store the full quiz object with songs data
    setSelectedQuiz(quiz)
    setShowQuizModal(false)
    setGameState('waiting')

    // Send quiz selection to backend
    if (ws) {
      ws.send(JSON.stringify({
        type: 'SELECT_QUIZ',
        payload: {
          quizId: quiz.id
        }
      }))
    }
  }

  const handleStartQuiz = () => {
    if (ws) {
      ws.send(JSON.stringify({
        type: 'START_QUIZ',
        payload: {}
      }))
      setGameState('playing')
    }
  }

  const handlePlaySong = (buttonIndex) => {
    // Prevent clicking if a song is already playing
    if (selectedButton !== null) return

    const song = sampleQuiz[buttonIndex]

    // Open song in Spotify app
    window.location.href = song.spotifyUri

    // Show retry popup at bottom of screen
    setRetryPopup({
      title: song.title,
      artist: song.artist,
      spotifyUri: song.spotifyUri
    })

    setSelectedButton(buttonIndex)
    setGuesses([])

    if (ws) {
      ws.send(JSON.stringify({
        type: 'PLAY_SONG',
        payload: {
          buttonIndex: buttonIndex,
          songUri: song.spotifyUri,
          title: song.title,
          artist: song.artist
        }
      }))
    }

    // Clear popup after 60 seconds (song duration) when round ends
    setTimeout(() => {
      setRetryPopup(null)
    }, 60000)
  }

  const handleNextRound = () => {
    if (ws) {
      ws.send(JSON.stringify({
        type: 'NEXT_ROUND',
        payload: {}
      }))
      setSelectedButton(null)
      setGuesses([])
      setGameState('playing')
      setCurrentRound(currentRound + 1)
    }
  }

  return (
    <div className="container">
      <h1>🎵 Quiztopher</h1>

      <div style={{ marginBottom: 20, padding: 12, background: '#f0f0f0', borderRadius: 8 }}>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 4 }}>Game ID</p>
        <p style={{ fontSize: 24, fontWeight: 'bold', letterSpacing: 4, textAlign: 'center' }}>{gameId}</p>
      </div>

      <div className="players-list">
        <h2 style={{ marginTop: 0 }}>Players ({players.length})</h2>
        {players.length === 0 ? (
          <p style={{ color: '#999' }}>Waiting for players to join...</p>
        ) : (
          players.map((player, idx) => (
            <div key={idx} className="player-item">
              <span>{player.name}</span>
              <span style={{ fontWeight: 'bold' }}>{player.score} pts</span>
            </div>
          ))
        )}
      </div>

      {gameState === 'quiz_selection' && (
        <>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: 20 }}>
            First, choose a quiz to play
          </p>
          <button className="button" onClick={() => setShowQuizModal(true)} style={{ width: '100%' }}>
            Choose Quiz
          </button>
        </>
      )}

      {gameState === 'waiting' && (
        <>
          {selectedQuiz && (
            <div style={{ marginBottom: 20, padding: 16, background: '#f0f0f0', borderRadius: 8 }}>
              <p style={{ color: '#666', fontSize: 12, margin: '0 0 4px 0' }}>Current Quiz</p>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 'bold' }}>{selectedQuiz.name}</p>
            </div>
          )}
          {players.length === 0 && (
            <div style={{
              padding: 12,
              background: '#fff3e0',
              border: '1px solid #ffb74d',
              borderRadius: 8,
              color: '#e65100',
              marginBottom: 20,
              fontSize: 14,
              fontWeight: 500,
            }}>
              ⚠️ Waiting for players to join before you can start
            </div>
          )}
          <button
            className="button"
            onClick={handleStartQuiz}
            disabled={players.length === 0 || !selectedQuiz}
            style={{ width: '100%', opacity: players.length === 0 || !selectedQuiz ? 0.5 : 1 }}
          >
            Start Quiz
          </button>
        </>
      )}

      {gameState === 'playing' && (
        <>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: 20 }}>
            Round {currentRound + 1} - Select a song to play
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sampleQuiz.map((song, idx) => {
              const isUsed = usedButtons.includes(idx);
              const isSelected = selectedButton === idx;
              return (
                <div
                  key={idx}
                  style={{
                    padding: 16,
                    background: isSelected ? '#e3f2fd' : isUsed ? '#f5f5f5' : 'white',
                    border: isSelected ? '2px solid #2196f3' : isUsed ? '1px solid #ccc' : '1px solid #e0e0e0',
                    borderRadius: 12,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    opacity: isUsed ? 0.6 : 1,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', fontSize: 16 }}>
                      {song.title}
                    </p>
                    <p style={{ margin: '0 0 4px 0', color: '#666', fontSize: 14 }}>
                      {song.artist}
                    </p>
                    <p style={{ margin: 0, color: '#999', fontSize: 12, fontStyle: 'italic' }}>
                      Hint: {song.buttonText}
                    </p>
                  </div>
                  <button
                    onClick={() => handlePlaySong(idx)}
                    disabled={isUsed || selectedButton !== null}
                    style={{
                      padding: '10px 20px',
                      marginLeft: 16,
                      background: isUsed ? '#ccc' : '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      cursor: isUsed || selectedButton !== null ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: 14,
                      opacity: isUsed || (selectedButton !== null && !isSelected) ? 0.5 : 1,
                    }}
                  >
                    {isUsed ? '✓ Used' : 'Play'}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {gameState === 'round_end' && (
        <>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: 20 }}>
            Current answer: <strong>{sampleQuiz[selectedButton]?.label}</strong>
          </p>

          {roundResults && roundResults.length > 0 && (
            <div className="scoreboard">
              <h3 style={{ marginTop: 0 }}>Round Results</h3>
              {roundResults.map((result, idx) => (
                <div key={idx} style={{ padding: 8, borderBottom: '1px solid #e0e0e0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 'bold' }}>{result.playerName}</span>
                    <span style={{ color: result.correct ? '#2e7d32' : '#c62828' }}>
                      {result.correct ? '✓' : '✗'} +{result.points}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="scoreboard">
            <h3 style={{ marginTop: 0 }}>Updated Scores</h3>
            {Object.entries(scores).length === 0 ? (
              <p style={{ color: '#999' }}>No scores yet</p>
            ) : (
              Object.entries(scores).map(([playerId, score]) => {
                const player = Array.from(players).find(p => p.playerId === playerId)
                const playerName = player?.name || `Player ${playerId}`
                return (
                  <div key={playerId} className="score-row">
                    <span>{playerName}</span>
                    <span>{score} pts</span>
                  </div>
                )
              })
            )}
          </div>

          {usedButtons.length < sampleQuiz.length ? (
            <button className="button" onClick={handleNextRound} style={{ width: '100%' }}>
              Next Round
            </button>
          ) : (
            <div style={{
              padding: 16,
              background: '#e8f5e9',
              border: '2px solid #4caf50',
              borderRadius: 12,
              textAlign: 'center',
              color: '#2e7d32',
              fontWeight: 'bold',
              fontSize: 16
            }}>
              All songs played! Game will end...
            </div>
          )}
        </>
      )}

      {gameState === 'game_ended' && (
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
          padding: 20,
          overflow: 'auto'
        }}>
          <div style={{ textAlign: 'center', marginBottom: 40, animation: 'bounce 1s infinite' }}>
            <div style={{ fontSize: 80, marginBottom: 20 }}>🎉</div>
            <h1 style={{ fontSize: 56, margin: '0 0 10px 0', color: '#fff', fontWeight: 'bold', textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)' }}>Game Over!</h1>
            <p style={{ color: '#fff', fontSize: 20, margin: 0, opacity: 0.95 }}>Here are the final results</p>
          </div>

          {finalScoreboard && finalScoreboard.length > 0 && (
            <div style={{ width: '100%', maxWidth: 500, marginBottom: 40 }}>
              {finalScoreboard.map((player, idx) => {
                const isWinner = idx === 0;
                const colors = ['#FFD700', '#C0C0C0', '#CD7F32'];
                return (
                  <div
                    key={idx}
                    style={{
                      padding: 20,
                      marginBottom: 16,
                      background: isWinner ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.85)',
                      borderRadius: 16,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      boxShadow: isWinner ? '0 10px 30px rgba(0, 0, 0, 0.4)' : '0 4px 15px rgba(0, 0, 0, 0.2)',
                      transform: isWinner ? 'scale(1.05)' : 'scale(1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{
                        fontSize: idx < 3 ? 48 : 32,
                        width: 70,
                        textAlign: 'center'
                      }}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: 20, color: '#333' }}>
                          {player.name}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: 28, fontWeight: 'bold', color: colors[idx] || '#667eea' }}>
                        {player.score}
                      </p>
                      <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#999' }}>points</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button className="button" onClick={handleGoHomeWithConfirm} style={{ width: '100%', maxWidth: 500, fontSize: 18, padding: '16px 24px' }}>
            Back to Home
          </button>
        </div>
      )}

      {showQuizModal && (
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
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: 24 }}>Choose a Quiz</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loadingQuizzes ? (
                <p>Loading quizzes...</p>
              ) : allQuizzes.length === 0 ? (
                <p>No quizzes available. Create one in the Admin Dashboard.</p>
              ) : (
                allQuizzes.map((quiz) => (
                  <button
                    key={quiz.id}
                    onClick={() => handleSelectQuiz(quiz)}
                    style={{
                      padding: 16,
                      border: '2px solid #e0e0e0',
                      borderRadius: 12,
                      background: 'white',
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = '#667eea'
                      e.target.style.background = '#f5f5f5'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = '#e0e0e0'
                      e.target.style.background = 'white'
                    }}
                  >
                    {quiz.name}
                  </button>
                ))
              )}
            </div>

            <button
              className="button button-secondary"
              onClick={() => setShowQuizModal(false)}
              style={{ width: '100%', marginTop: 20 }}
            >
              Back
            </button>
          </div>
        </div>
      )}

      {retryPopup && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          left: 20,
          right: 20,
          background: 'white',
          borderRadius: 12,
          padding: 16,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 999,
          maxWidth: 400,
          margin: '0 auto',
        }}>
          <div style={{ marginBottom: 12 }}>
            <p style={{ margin: '0 0 4px 0', color: '#666', fontSize: 12 }}>Now Playing</p>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 'bold' }}>{retryPopup.title}</p>
            <p style={{ margin: '4px 0 0 0', color: '#999', fontSize: 13 }}>{retryPopup.artist}</p>
          </div>
          <button
            onClick={() => window.location.href = retryPopup.spotifyUri}
            style={{
              width: '100%',
              padding: 10,
              background: '#1DB954',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.3s',
            }}
            onMouseEnter={(e) => e.target.style.background = '#1ed760'}
            onMouseLeave={(e) => e.target.style.background = '#1DB954'}
          >
            Open in Spotify
          </button>
          <button
            onClick={() => setRetryPopup(null)}
            style={{
              width: '100%',
              padding: 8,
              background: 'transparent',
              color: '#666',
              border: 'none',
              borderRadius: 8,
              fontSize: 12,
              cursor: 'pointer',
              marginTop: 8,
            }}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}
