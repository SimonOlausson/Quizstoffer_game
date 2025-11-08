import { useState, useEffect } from 'react'
import axios from 'axios'

export default function HostPage({ ws, roomId, gameId }) {
  const [gameState, setGameState] = useState('quiz_selection') // quiz_selection, waiting, playing, round_end
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

  const API_URL = 'http://localhost:3001'

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
        case 'PLAYER_LEFT':
          // Handle player disconnect
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

    // Clear popup after 30 seconds (song duration) when round ends
    setTimeout(() => {
      setRetryPopup(null)
    }, 30000)
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
          <button className="button" onClick={handleStartQuiz} style={{ width: '100%' }}>
            Start Quiz
          </button>
        </>
      )}

      {gameState === 'playing' && (
        <>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: 20 }}>
            Round {currentRound + 1} - Select a song to play
          </p>
          <div className="button-grid">
            {sampleQuiz.map((song, idx) => {
              const isUsed = usedButtons.includes(idx);
              const isSelected = selectedButton === idx;
              const isOtherSelected = selectedButton !== null && selectedButton !== idx;
              return (
                <button
                  key={idx}
                  className={`quiz-button ${isSelected ? 'selected' : ''} ${isOtherSelected || isUsed ? 'disabled' : ''}`}
                  onClick={() => handlePlaySong(idx)}
                  disabled={isOtherSelected || isUsed}
                  title={isUsed ? 'Already used' : ''}
                >
                  {song.buttonText}
                </button>
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
                const playerName = players.find(p => p.name) ? players[0].name : `Player ${playerId}`
                return (
                  <div key={playerId} className="score-row">
                    <span>{playerName}</span>
                    <span>{score} pts</span>
                  </div>
                )
              })
            )}
          </div>

          <button className="button" onClick={handleNextRound} style={{ width: '100%' }}>
            Next Round
          </button>
        </>
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
