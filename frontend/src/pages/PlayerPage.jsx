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
          // Start guessing immediately - no countdown
          setGameState('playing')
          setTimer(60)
          setCountdownTimer(null)
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
          {timer !== null && (
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
                  disabled={isOtherSelected || isUsed || gameState !== 'playing'}
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
                const isCurrentPlayer = player.name === playerName;
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
                      border: isCurrentPlayer ? '3px solid #fff' : 'none',
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
                        {isCurrentPlayer && <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#667eea', fontWeight: 600 }}>You!</p>}
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

          <button className="button" onClick={onGoHome} style={{ width: '100%', maxWidth: 500, fontSize: 18, padding: '16px 24px' }}>
            Back to Home
          </button>
        </div>
      )}
    </div>
  )
}
