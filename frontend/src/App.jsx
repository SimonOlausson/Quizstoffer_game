import { useState, useEffect, useRef } from 'react'
import './App.css'
import HomePage from './pages/HomePage'
import HostPage from './pages/HostPage'
import PlayerPage from './pages/PlayerPage'
import AdminPage from './pages/AdminPage'
import { useWebSocket } from './hooks/useWebSocket'

export default function App() {
  const [page, setPage] = useState('home') // home, host, player, admin
  const [roomId, setRoomId] = useState(null)
  const [gameId, setGameId] = useState(null)
  const [playerName, setPlayerName] = useState(null)
  const [isHost, setIsHost] = useState(false)
  const [playerId, setPlayerId] = useState(null)
  const playerIdRef = useRef(null)
  const ws = useWebSocket('ws://localhost:3001')

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
    if (savedState && !roomId) {
      const state = JSON.parse(savedState)
      if (state.roomId && state.playerId && state.gameId) {
        // Try to reconnect to the game
        console.log('Attempting to reconnect to game')
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
          break
        case 'ERROR':
          // If room not found, clear saved state and go home
          if (data.message === 'Room not found') {
            localStorage.removeItem('quiztopher_game_state')
            setPage('home')
            setRoomId(null)
            setGameId(null)
            console.log('Room not found - cleared saved state')
          } else {
            alert(data.message)
          }
          break
      }
    }
  }, [ws, playerName])

  return (
    <div className="app">
      {page === 'home' && (
        <HomePage onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} setPage={setPage} />
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
