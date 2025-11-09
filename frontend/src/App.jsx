import { useState, useEffect, useRef } from 'react'
import './App.css'
import HomePage from './pages/HomePage'
import HostPage from './pages/HostPage'
import PlayerPage from './pages/PlayerPage'
import AdminPage from './pages/AdminPage'
import ReconnectingScreen from './components/ReconnectingScreen'
import { useWebSocket } from './hooks/useWebSocket'

export default function App() {
  const [page, setPage] = useState('home') // home, host, player, admin
  const [roomId, setRoomId] = useState(null)
  const [gameId, setGameId] = useState(null)
  const [playerName, setPlayerName] = useState(null)
  const [isHost, setIsHost] = useState(false)
  const [playerId, setPlayerId] = useState(null)
  const [joinError, setJoinError] = useState(null)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const playerIdRef = useRef(null)
  const reconnectAttemptedRef = useRef(false)
  const WS_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'wss://qvisser.onrender.com'
    : (import.meta.env.VITE_WS_URL || 'ws://localhost:3001')
  const ws = useWebSocket(WS_URL)

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('quiztopher_game_state')
    if (savedState) {
      const state = JSON.parse(savedState)
      if (state.playerId) {
        playerIdRef.current = state.playerId
        setPlayerId(state.playerId)
      }
    }
  }, [])

  // Handle reconnection when WebSocket connects and we have saved state
  useEffect(() => {
    if (!ws) return

    const savedState = localStorage.getItem('quiztopher_game_state')
    if (savedState && !roomId && !reconnectAttemptedRef.current) {
      const state = JSON.parse(savedState)
      if (state.roomId && state.playerId && state.gameId) {
        // Try to reconnect to the game
        console.log('Attempting to reconnect to game')
        reconnectAttemptedRef.current = true
        setIsReconnecting(true)
        ws.send(JSON.stringify({
          type: 'RECONNECT',
          payload: {
            roomId: state.roomId,
            playerId: state.playerId,
            playerName: state.playerName,
          }
        }))
      }
    }
  }, [ws, roomId])

  const handleCreateRoom = () => {
    if (ws) {
      ws.send(JSON.stringify({
        type: 'CREATE_ROOM',
        payload: {}
      }))
    }
  }

  const handleJoinRoom = (gameId, name) => {
    if (ws) {
      ws.send(JSON.stringify({
        type: 'JOIN_ROOM',
        payload: { gameId, playerName: name }
      }))
      setPlayerName(name)
    }
  }

  const handleGoHome = () => {
    setPage('home')
    setRoomId(null)
    setGameId(null)
    setPlayerName(null)
    setIsHost(false)
    // Clear saved game state
    localStorage.removeItem('quiztopher_game_state')
  }

  useEffect(() => {
    if (!ws) return

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case 'ROOM_CREATED':
          const newPlayerId = Math.random().toString(36).substring(7)
          setPlayerId(newPlayerId)
          playerIdRef.current = newPlayerId
          setRoomId(data.roomId)
          setGameId(data.gameId)
          setIsHost(true)
          setPage('host')
          // Save to localStorage
          localStorage.setItem('quiztopher_game_state', JSON.stringify({
            playerId: newPlayerId,
            roomId: data.roomId,
            gameId: data.gameId,
            isHost: true,
          }))
          break
        case 'JOIN_ROOM_SUCCESS':
          setRoomId(data.roomId)
          setGameId(data.gameId)
          setIsHost(false)
          setPage('player')
          // Save to localStorage
          localStorage.setItem('quiztopher_game_state', JSON.stringify({
            playerId: playerId || playerIdRef.current,
            roomId: data.roomId,
            gameId: data.gameId,
            isHost: false,
            playerName: playerName,
          }))
          break
        case 'RECONNECT_SUCCESS':
          setRoomId(data.roomId)
          setGameId(data.gameId)
          setIsHost(data.isHost)
          setPage(data.isHost ? 'host' : 'player')
          setIsReconnecting(false)
          console.log('Reconnection successful!')
          break
        case 'ERROR':
          // If room not found, clear saved state and go home
          if (data.message === 'Room not found') {
            localStorage.removeItem('quiztopher_game_state')
            setPage('home')
            setRoomId(null)
            setGameId(null)
            setIsReconnecting(false)
            reconnectAttemptedRef.current = false
            console.log('Room not found - cleared saved state')
          } else if (page === 'home' || isReconnecting) {
            // Show join errors on home page or clear reconnecting on failure
            if (isReconnecting) {
              setIsReconnecting(false)
              reconnectAttemptedRef.current = false
              alert('Failed to reconnect: ' + data.message)
            } else {
              setJoinError(data.message)
            }
          } else {
            alert(data.message)
          }
          break
      }
    }
  }, [ws, playerName])

  return (
    <div className="app">
      {isReconnecting && <ReconnectingScreen />}
      {page === 'home' && (
        <HomePage onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} setPage={setPage} joinError={joinError} setJoinError={setJoinError} />
      )}
      {page === 'host' && roomId && gameId && (
        <HostPage ws={ws} roomId={roomId} gameId={gameId} onGoHome={handleGoHome} />
      )}
      {page === 'player' && roomId && gameId && (
        <PlayerPage ws={ws} roomId={roomId} gameId={gameId} playerName={playerName} onGoHome={handleGoHome} />
      )}
      {page === 'admin' && (
        <AdminPage />
      )}
    </div>
  )
}
