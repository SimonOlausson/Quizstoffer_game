import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import './App.css'
import HomePage from './pages/HomePage'
import GamePage from './pages/GamePage'
import AdminPage from './pages/AdminPage'
import { useWebSocket } from './hooks/useWebSocket'

function AppRoutes() {
  const navigate = useNavigate()
  const [playerId, setPlayerId] = useState(null)
  const playerIdRef = useRef(null)
  const WS_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'wss://qvisser.onrender.com'
    : (import.meta.env.VITE_WS_URL || 'ws://localhost:3001')
  const ws = useWebSocket(WS_URL)

  // Initialize playerId from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('quiztopher_game_state')
    if (savedState) {
      const state = JSON.parse(savedState)
      if (state.playerId) {
        playerIdRef.current = state.playerId
        setPlayerId(state.playerId)
      }
    } else {
      // Generate new playerId if none exists
      const newPlayerId = Math.random().toString(36).substring(7)
      playerIdRef.current = newPlayerId
      setPlayerId(newPlayerId)
    }
  }, [])

  const handleCreateRoom = () => {
    if (!ws) {
      console.error('WebSocket not connected')
      alert('Connection not ready. Please try again.')
      return
    }

    console.log('Creating room...')

    // Set up listener BEFORE sending message to ensure we catch response
    const tempHandler = (event) => {
      const data = JSON.parse(event.data)
      console.log('Received message:', data.type)
      if (data.type === 'ROOM_CREATED') {
        console.log('Room created:', data.gameId)
        // Save state and navigate - GamePage will handle the rest
        localStorage.setItem('quiztopher_game_state', JSON.stringify({
          playerId: playerIdRef.current,
          roomId: data.roomId,
          gameId: data.gameId,
          isHost: true,
        }))
        ws.removeEventListener('message', tempHandler)
        navigate(`/game/${data.gameId}`)
      }
    }

    ws.addEventListener('message', tempHandler)

    // Send CREATE_ROOM message
    ws.send(JSON.stringify({
      type: 'CREATE_ROOM',
      payload: {}
    }))
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage ws={ws} onCreateRoom={handleCreateRoom} />} />
      <Route path="/game/:gameId" element={<GamePage ws={ws} playerId={playerId} playerIdRef={playerIdRef} />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  )
}
