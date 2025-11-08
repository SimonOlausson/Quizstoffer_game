import { useEffect, useState } from 'react'

export function useWebSocket(url) {
  const [ws, setWs] = useState(null)

  useEffect(() => {
    try {
      const websocket = new WebSocket(url)

      websocket.onopen = () => {
        console.log('WebSocket connected')
        setWs(websocket)
      }

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      return () => {
        if (websocket.readyState === WebSocket.OPEN) {
          websocket.close()
        }
      }
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
    }
  }, [url])

  return ws
}
