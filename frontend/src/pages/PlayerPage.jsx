import { useState, useEffect } from 'react'

export default function PlayerPage({ ws, roomId, gameId, playerName, onGoHome }) {
  const [gameState, setGameState] = useState('waiting') // waiting, quiz_loaded, playing, guessed, round_end, game_ended
  const [score, setScore] = useState(0)
  const [quiz, setQuiz] = useState([])
  const [selectedGuess, setSelectedGuess] = useState(null)
  const [allPlayers, setAllPlayers] = useState([])
  const [timer, setTimer] = useState(null)
  const [countdownTimer, setCountdownTimer] = useState(null)
  const [roundResults, setRoundResults] = useState(null)
  const [myResult, setMyResult] = useState(null)
  const [globalScores, setGlobalScores] = useState({})
  const [usedButtons, setUsedButtons] = useState([])
  const [finalScoreboard, setFinalScoreboard] = useState(null)

  useEffect(() => {
    if (!ws) return

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case 'JOIN_ROOM_SUCCESS':
          setQuiz(data.quiz)
          setUsedButtons(data.usedButtons || [])
          setGameState('quiz_loaded')
          break
        case 'QUIZ_SELECTED':
          // Host selected a quiz, update player's quiz data
          setQuiz(data.quiz)
          setUsedButtons(data.usedButtons || [])
          setGameState('quiz_loaded')
          setSelectedGuess(null)
          setRoundResults(null)
          setMyResult(null)
          setTimer(null)
          setCountdownTimer(null)
          break
        case 'QUIZ_STARTED':
          setGameState('quiz_loaded')
          setQuiz(data.quiz)
          setSelectedGuess(null)
          setRoundResults(null)
          setMyResult(null)
          setTimer(null)
          setCountdownTimer(null)
          break
        case 'SONG_PLAYING':
          setSelectedGuess(null)
          setMyResult(null)
          // Start 3-second countdown before the actual 60 second timer
          setGameState('playing')
          setCountdownTimer(3)
          setTimer(null)
          break
        case 'GUESS_RECEIVED':
          setGameState('guessed')
          setMyResult({
            correct: data.correct,
            points: data.points,
          })
          setScore(prevScore => prevScore + data.points)
          break
        case 'SCORES_UPDATE':
          setGlobalScores(data.scores)
          break
        case 'ROUND_AUTO_ENDED':
          setGameState('round_end')
          setTimer(null)
          setCountdownTimer(null)
          setRoundResults(data.results)
          setUsedButtons(data.usedButtons || [])
          break
        case 'NEXT_ROUND_STARTED':
          // Reset for next round
          setGameState('quiz_loaded')
          setSelectedGuess(null)
          setMyResult(null)
          setTimer(null)
          setCountdownTimer(null)
          setRoundResults(null)
          setUsedButtons(data.usedButtons || [])
          setGlobalScores(data.scores || {})
          break
        case 'GAME_ENDED':
          setGameState('game_ended')
          setTimer(null)
          setCountdownTimer(null)
          setFinalScoreboard(data.finalScoreboard)
          setGlobalScores(data.scores || {})
          break
        case 'PLAYER_JOINED':
          setAllPlayers(data.players)
          break
      }
    }
  }, [ws])

  // Countdown timer before the main 60-second timer
  useEffect(() => {
    if (countdownTimer === null || countdownTimer === 0) return

    const interval = setInterval(() => {
      setCountdownTimer((t) => {
        if (t <= 1) {
          // Countdown finished, start the main 60-second timer
          setTimer(60)
          setGameState('playing')
          return null
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [countdownTimer])

  useEffect(() => {
    if (timer === null || timer === 0) return

    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          setGameState('round_end')
          return null
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timer])

  const handleGuess = (buttonIndex) => {
    if (gameState !== 'playing' || selectedGuess !== null) return

    setSelectedGuess(buttonIndex)

    if (ws) {
      ws.send(JSON.stringify({
        type: 'SUBMIT_GUESS',
        payload: { guess: buttonIndex }
      }))
    }
  }

  // Transform quiz data to match expected format
  const sampleQuiz = quiz.map((song) => ({
    ...song,
    label: song.title,
  }))

  return (
    <div className="container">
      <h1 style={{ fontSize: 24, margin: '0 0 20px 0' }}>🎵 Quiztopher</h1>
      <div style={{ marginBottom: 20, padding: 12, background: '#f0f0f0', borderRadius: 8 }}>
        <p style={{ color: '#666', fontSize: 12, margin: '0 0 4px 0' }}>Game ID</p>
        <p style={{ fontSize: 20, fontWeight: 'bold', letterSpacing: 2, textAlign: 'center', margin: 0 }}>{gameId}</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <p style={{ color: '#999', fontSize: 12, margin: '0 0 4px 0' }}>Player</p>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 'bold' }}>{playerName}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ color: '#999', fontSize: 12, margin: '0 0 4px 0' }}>Score</p>
          <p style={{ margin: 0, fontSize: 24, fontWeight: 'bold', color: '#667eea' }}>{score}</p>
        </div>
      </div>

      {gameState === 'waiting' && (
        <div className="message info">
          Waiting for the host to start the quiz...
        </div>
      )}

      {gameState === 'quiz_loaded' && (
        <>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: 20 }}>
            Get ready! Here are the hints:
          </p>

          <div className="button-grid">
            {sampleQuiz.map((song, idx) => {
              const isUsed = usedButtons.includes(idx);
              return (
                <button
                  key={idx}
                  className={`quiz-button no-hover ${isUsed ? 'disabled' : ''}`}
                  disabled={isUsed}
                  style={{ cursor: 'default' }}
                  title={isUsed ? 'Already used' : ''}
                >
                  {song.buttonText}
                </button>
              );
            })}
          </div>

          <p style={{ textAlign: 'center', color: '#999', marginTop: 20, fontSize: 14 }}>
            Waiting for the host to play a song...
          </p>
        </>
      )}

      {gameState === 'playing' && (
        <>
          {countdownTimer !== null && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 9999
            }}>
              <p style={{ color: '#fff', fontSize: 28, marginBottom: 40, textAlign: 'center', fontWeight: 'bold' }}>
                Host is starting the song...
              </p>
              <div style={{
                fontSize: 180,
                fontWeight: 'bold',
                color: '#FFD700',
                lineHeight: 1,
                textShadow: '0 0 20px rgba(255, 215, 0, 0.8)',
                animation: 'pulse 1s infinite'
              }}>
                {countdownTimer}
              </div>
            </div>
          )}

          {timer !== null && countdownTimer === null && (
            <div className={`timer ${timer < 10 ? 'warning' : ''}`}>
              {timer}s
            </div>
          )}

          <p style={{ textAlign: 'center', color: '#666', marginBottom: 20 }}>
            Which song is playing?
          </p>

          <div className="button-grid">
            {sampleQuiz.map((song, idx) => {
              const isUsed = usedButtons.includes(idx);
              const isSelected = selectedGuess === idx;
              const isOtherSelected = selectedGuess !== null && selectedGuess !== idx;
              return (
                <button
                  key={idx}
                  className={`quiz-button ${isSelected ? 'selected' : ''} ${isOtherSelected || isUsed ? 'disabled' : ''}`}
                  onClick={() => handleGuess(idx)}
                  disabled={isOtherSelected || isUsed || gameState !== 'playing' || countdownTimer !== null}
                  title={isUsed ? 'Already used' : ''}
                >
                  {song.buttonText}
                </button>
              );
            })}
          </div>
        </>
      )}

      {gameState === 'guessed' && (
        <div className="message info">
          Your guess has been submitted! Waiting for the round to end...
        </div>
      )}

      {gameState === 'round_end' && (
        <>
          {myResult && (
            <div className={`message ${myResult.correct ? '' : 'error'}`}>
              {myResult.correct ? '✓ Correct!' : '✗ Wrong answer'} {myResult.points > 0 ? `+${myResult.points} points` : ''}
            </div>
          )}

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
            <h3 style={{ marginTop: 0 }}>Current Scores</h3>
            {allPlayers.map((player, idx) => (
              <div key={idx} className="score-row">
                <span>{player.name}</span>
                <span>{player.score} pts</span>
              </div>
            ))}
          </div>

          <div className="message info">
            Waiting for the next round to start...
          </div>
        </>
      )}

      {gameState === 'game_ended' && (
        <>
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <h2 style={{ fontSize: 32, margin: '0 0 10px 0' }}>🎉 Game Over! 🎉</h2>
            <p style={{ color: '#666', fontSize: 16 }}>Final Results</p>
          </div>

          {finalScoreboard && finalScoreboard.length > 0 && (
            <div className="scoreboard" style={{ marginBottom: 30 }}>
              <h3 style={{ marginTop: 0, marginBottom: 20, textAlign: 'center' }}>Final Scoreboard</h3>
              {finalScoreboard.map((player, idx) => {
                const isWinner = idx === 0;
                const isCurrentPlayer = player.name === playerName;
                return (
                  <div
                    key={idx}
                    style={{
                      padding: 16,
                      marginBottom: 12,
                      background: isWinner ? '#fff3cd' : isCurrentPlayer ? '#e8f5e9' : '#f9f9f9',
                      border: isWinner ? '2px solid #ffc107' : isCurrentPlayer ? '2px solid #4caf50' : '1px solid #e0e0e0',
                      borderRadius: 12,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 24 }}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                      </span>
                      <div>
                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: 16 }}>
                          {player.name} {isCurrentPlayer && '(You)'}
                        </p>
                      </div>
                    </div>
                    <span style={{ fontSize: 20, fontWeight: 'bold', color: '#667eea' }}>
                      {player.score} pts
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <button className="button" onClick={onGoHome} style={{ width: '100%' }}>
            Back to Home
          </button>
        </>
      )}
    </div>
  )
}
