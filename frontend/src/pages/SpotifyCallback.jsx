import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAuthTokenFromCode } from '../utils/spotify'

export default function SpotifyCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')

    if (error) {
      alert('Spotify authorization failed: ' + error)
      navigate('/')
      return
    }

    if (code) {
      getAuthTokenFromCode(code)
        .then(() => {
          navigate('/')
        })
        .catch((err) => {
          alert('Failed to authenticate with Spotify: ' + err.message)
          navigate('/')
        })
    }
  }, [navigate])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontSize: 18,
      color: '#666'
    }}>
      Authenticating with Spotify...
    </div>
  )
}
