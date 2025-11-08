import { useState, useEffect } from 'react'
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
  const ws = useWebSocket('ws://localhost:3001')

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
  }

  useEffect(() => {
    if (!ws) return

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case 'ROOM_CREATED':
          setRoomId(data.roomId)
          setGameId(data.gameId)
          setIsHost(true)
          setPage('host')
          break
        case 'JOIN_ROOM_SUCCESS':
          setRoomId(data.roomId)
          setGameId(data.gameId)
          setIsHost(false)
          setPage('player')
          break
        case 'ERROR':
          alert(data.message)
          break
      }
    }
  }, [ws])

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
