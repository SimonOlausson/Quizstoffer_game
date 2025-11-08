import { useEffect, useState, useRef } from 'react'

export function useWebSocket(url) {
  const [ws, setWs] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef(null)
  const websocketRef = useRef(null)

  const connect = () => {
    try {
      const websocket = new WebSocket(url)
      websocketRef.current = websocket

      websocket.onopen = () => {
        console.log('WebSocket connected')
        setWs(websocket)
        setIsConnected(true)
        reconnectAttemptsRef.current = 0 // Reset attempts on successful connection
      }

      websocket.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        setWs(null)
        attemptReconnect()
      }

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error)
        setIsConnected(false)
      }
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
      setIsConnected(false)
      attemptReconnect()
    }
  }

  const attemptReconnect = () => {
    if (reconnectAttemptsRef.current >= 10) {
      console.error('Max reconnection attempts reached')
      return
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, etc.
    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
    reconnectAttemptsRef.current += 1

    console.log(`Attempting to reconnect (attempt ${reconnectAttemptsRef.current}) in ${delay}ms`)

    reconnectTimeoutRef.current = setTimeout(() => {
      connect()
    }, delay)
  }

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (websocketRef.current?.readyState === WebSocket.OPEN) {
        websocketRef.current.close()
      }
    }
  }, [url])

  return ws
}
