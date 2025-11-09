import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import HostPage from './HostPage'
import PlayerPage from './PlayerPage'
import ReconnectingScreen from '../components/ReconnectingScreen'

export default function GamePage({ ws, playerId, playerIdRef }) {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const [role, setRole] = useState(null) // 'host' or 'player'
  const [roomId, setRoomId] = useState(null)
  const [playerName, setPlayerName] = useState(null)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const reconnectAttemptedRef = useRef(false)

  // Load saved state on mount
  useEffect(() => {
    const savedState = localStorage.getItem('quiztopher_game_state')
    if (savedState) {
      const state = JSON.parse(savedState)
      if (state.playerName) {
        setPlayerName(state.playerName)
      }
    }
  }, [])

  // Auto-join/reconnect when WebSocket is ready
  useEffect(() => {
    if (!ws || !gameId || !playerId || !playerIdRef.current || reconnectAttemptedRef.current) return

    const savedState = localStorage.getItem('quiztopher_game_state')
    const state = savedState ? JSON.parse(savedState) : {}

    // If we have saved state for this game, try to reconnect
    if (state.gameId === gameId && state.roomId) {
      console.log('Attempting to reconnect to game:', gameId)
      reconnectAttemptedRef.current = true
      setIsReconnecting(true)

      ws.send(JSON.stringify({
        type: 'RECONNECT',
        payload: {
          roomId: state.roomId,
          playerId: playerIdRef.current,
          playerName: state.playerName || playerName,
        }
      }))
    } else {
      // New game - join as player
      console.log('Joining new game:', gameId)
      reconnectAttemptedRef.current = true
      ws.send(JSON.stringify({
        type: 'JOIN_ROOM',
        payload: {
          gameId: gameId,
          playerName: playerName || 'Player',
        }
      }))
    }
  }, [ws, gameId, playerId, playerIdRef])

  // Handle WebSocket messages
  useEffect(() => {
    if (!ws) return

    const handleMessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case 'ROOM_CREATED':
          // Host created a room
          setRoomId(data.roomId)
          setRole('host')
          setIsReconnecting(false)
          localStorage.setItem('quiztopher_game_state', JSON.stringify({
            playerId: playerIdRef.current,
            roomId: data.roomId,
            gameId: data.gameId,
            isHost: true,
          }))
          break

        case 'JOIN_ROOM_SUCCESS':
          // Player joined successfully
          setRoomId(data.roomId)
          setRole('player')
          setIsReconnecting(false)
          localStorage.setItem('quiztopher_game_state', JSON.stringify({
            playerId: playerIdRef.current,
            roomId: data.roomId,
            gameId: gameId,
            isHost: false,
            playerName: playerName,
          }))
          break

        case 'RECONNECT_SUCCESS':
          // Reconnection successful
          setRoomId(data.roomId)
          setRole(data.isHost ? 'host' : 'player')
          setIsReconnecting(false)
          console.log('Reconnected to game:', gameId)
          break

        case 'ERROR':
          // Handle errors
          if (data.message === 'Room not found') {
            localStorage.removeItem('quiztopher_game_state')
            navigate('/')
          } else if (isReconnecting) {
            setIsReconnecting(false)
            reconnectAttemptedRef.current = false
            alert('Failed to reconnect: ' + data.message)
          }
          break
      }
    }

    ws.addEventListener('message', handleMessage)
    return () => ws.removeEventListener('message', handleMessage)
  }, [ws, gameId, isReconnecting, playerName, playerIdRef, navigate])

  const handleGoHome = () => {
    localStorage.removeItem('quiztopher_game_state')
    navigate('/')
  }

  if (isReconnecting) {
    return <ReconnectingScreen />
  }

  if (!role || !roomId) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: 50 }}>
        <p>Loading game...</p>
      </div>
    )
  }

  return (
    <>
      {role === 'host' && (
        <HostPage ws={ws} roomId={roomId} gameId={gameId} onGoHome={handleGoHome} />
      )}
      {role === 'player' && (
        <PlayerPage ws={ws} roomId={roomId} gameId={gameId} playerName={playerName} onGoHome={handleGoHome} />
      )}
    </>
  )
}
