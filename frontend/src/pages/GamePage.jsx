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

  // Reset reconnect flag when gameId changes (navigating to a new game)
  useEffect(() => {
    console.log('GamePage mounted/updated for gameId:', gameId)
    reconnectAttemptedRef.current = false
  }, [gameId])

  // Load saved state on mount and set role/roomId if available
  useEffect(() => {
    const savedState = localStorage.getItem('quiztopher_game_state')
    if (savedState) {
      const state = JSON.parse(savedState)
      console.log('Saved state:', state)
      if (state.playerName) {
        console.log('Setting playerName from saved state:', state.playerName)
        setPlayerName(state.playerName)
      }
      // ONLY restore role/roomId if we have a roomId (meaning we're reconnecting to an existing game)
      // If no roomId, we're joining a new game and should wait for server response
      if (state.gameId === gameId && state.roomId) {
        console.log('Restoring state from localStorage. isHost:', state.isHost)
        setRoomId(state.roomId)
        setRole(state.isHost ? 'host' : 'player')
      }
    }
  }, [gameId])

  // Auto-join/reconnect when WebSocket is ready
  useEffect(() => {
    if (!ws || !gameId || reconnectAttemptedRef.current) {
      console.log('Skipping auto-join. ws:', !!ws, 'gameId:', gameId, 'attempted:', reconnectAttemptedRef.current)
      return
    }

    console.log('Auto-join effect running for gameId:', gameId)
    const savedState = localStorage.getItem('quiztopher_game_state')
    const state = savedState ? JSON.parse(savedState) : {}

    // If we just created a room (isHost: true in saved state), don't send JOIN or RECONNECT
    // The CREATE_ROOM was already handled in App.jsx
    if (state.isHost && state.gameId === gameId) {
      console.log('Host room already created:', gameId)
      reconnectAttemptedRef.current = true
      return
    }

    // If we have saved state for this game WITH a roomId, try to reconnect
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
      console.log('Joining new game as player:', gameId, 'playerName:', playerName || 'Player')
      reconnectAttemptedRef.current = true
      ws.send(JSON.stringify({
        type: 'JOIN_ROOM',
        payload: {
          gameId: gameId,
          playerName: playerName || 'Player',
        }
      }))
    }
  }, [ws, gameId, playerName])

  // Handle WebSocket messages
  useEffect(() => {
    if (!ws) return

    const handleMessage = (event) => {
      const data = JSON.parse(event.data)
      console.log('GamePage received message:', data.type)

      switch (data.type) {
        case 'ROOM_CREATED':
          // Host created a room (this comes from App.jsx for new host)
          console.log('Setting role to host')
          setRoomId(data.roomId)
          setRole('host')
          setIsReconnecting(false)
          // Already saved in App.jsx, just update local state
          break

        case 'JOIN_ROOM_SUCCESS':
          // Player joined successfully
          console.log('Player joined successfully:', data.roomId)
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
          console.log('Reconnect successful')
          setRoomId(data.roomId)
          setRole(data.isHost ? 'host' : 'player')
          setIsReconnecting(false)
          console.log('Reconnected to game:', gameId)
          break

        case 'ERROR':
          // Handle errors
          console.error('Error from server:', data.message)
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
