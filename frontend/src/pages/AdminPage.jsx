import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function AdminPage() {
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    songs: Array(8).fill(null).map(() => ({
      title: '',
      artist: '',
      buttonText: '',
      spotifyUri: ''
    }))
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const API_URL = 'http://localhost:3001'

  // Load quizzes on mount
  useEffect(() => {
    loadQuizzes()
  }, [])

  const loadQuizzes = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/quizzes`)
      setQuizzes(response.data)
      setError(null)
    } catch (err) {
      setError('Failed to load quizzes')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditQuiz = async (quiz) => {
    setEditingId(quiz.id)
    setFormData({
      name: quiz.name,
      songs: quiz.songs.map(s => ({
        title: s.title,
        artist: s.artist,
        buttonText: s.buttonText,
        spotifyUri: s.spotifyUri
      }))
    })
    setShowForm(true)
  }

  const handleDeleteQuiz = async (id) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      try {
        await axios.delete(`${API_URL}/api/quizzes/${id}`)
        loadQuizzes()
      } catch (err) {
        setError('Failed to delete quiz')
        console.error(err)
      }
    }
  }

  const handleSaveQuiz = async () => {
    if (!formData.name.trim()) {
      setError('Quiz name is required')
      return
    }

    if (formData.songs.some(s => !s.title || !s.artist || !s.buttonText || !s.spotifyUri)) {
      setError('All song fields are required')
      return
    }

    try {
      if (editingId) {
        await axios.put(`${API_URL}/api/quizzes/${editingId}`, formData)
      } else {
        await axios.post(`${API_URL}/api/quizzes`, formData)
      }
      loadQuizzes()
      setShowForm(false)
      setEditingId(null)
      setFormData({
        name: '',
        songs: Array(8).fill(null).map(() => ({
          title: '',
          artist: '',
          buttonText: '',
          spotifyUri: ''
        }))
      })
    } catch (err) {
      setError('Failed to save quiz')
      console.error(err)
    }
  }

  const handleSongChange = (index, field, value) => {
    const newSongs = [...formData.songs]
    newSongs[index] = { ...newSongs[index], [field]: value }
    setFormData({ ...formData, songs: newSongs })
  }

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
        <button
          className="button button-secondary"
          onClick={() => navigate('/')}
          style={{ fontSize: 14, padding: '10px 16px' }}
        >
          ← Back to Home
        </button>
      </div>

      {error && (
        <div className="message error" style={{ marginBottom: 20 }}>
          {error}
        </div>
      )}

      {!showForm ? (
        <>
          <button
            className="button"
            onClick={() => {
              setShowForm(true)
              setEditingId(null)
            }}
            style={{ marginBottom: 30 }}
          >
            + Create New Quiz
          </button>

          {loading ? (
            <p>Loading quizzes...</p>
          ) : quizzes.length === 0 ? (
            <p>No quizzes yet. Create one to get started!</p>
          ) : (
            <div style={{ display: 'grid', gap: 20 }}>
              {quizzes.map(quiz => (
                <div
                  key={quiz.id}
                  style={{
                    border: '2px solid #e0e0e0',
                    borderRadius: 12,
                    padding: 20,
                    background: '#f9f9f9'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 15 }}>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0' }}>{quiz.name}</h3>
                      <p style={{ margin: 0, color: '#999', fontSize: 14 }}>
                        {quiz.songs.length} songs
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={() => handleEditQuiz(quiz)}
                        style={{
                          padding: '8px 16px',
                          background: '#667eea',
                          color: 'white',
                          border: 'none',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontSize: 14,
                          fontWeight: 600
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        style={{
                          padding: '8px 16px',
                          background: '#ff6e7f',
                          color: 'white',
                          border: 'none',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontSize: 14,
                          fontWeight: 600
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    {quiz.songs.map((song, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: 10,
                          background: 'white',
                          borderRadius: 8,
                          border: '1px solid #e0e0e0',
                          fontSize: 12
                        }}
                      >
                        <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: '#333' }}>
                          {song.buttonText}
                        </p>
                        <p style={{ margin: '0 0 3px 0', color: '#666', fontSize: 11 }}>
                          {song.title}
                        </p>
                        <p style={{ margin: 0, color: '#999', fontSize: 10 }}>
                          {song.artist}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ background: '#f9f9f9', padding: 30, borderRadius: 12 }}>
          <h2>{editingId ? 'Edit Quiz' : 'Create New Quiz'}</h2>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
              Quiz Name
            </label>
            <input
              type="text"
              className="input-field"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., 90s Pop Hits"
            />
          </div>

          <h3 style={{ marginTop: 30, marginBottom: 20 }}>Songs (Must add exactly 8 songs)</h3>

          <div style={{ display: 'grid', gap: 20 }}>
            {formData.songs.map((song, idx) => (
              <div
                key={idx}
                style={{
                  background: 'white',
                  padding: 15,
                  borderRadius: 8,
                  border: '1px solid #e0e0e0'
                }}
              >
                <h4 style={{ margin: '0 0 15px 0', fontSize: 14, color: '#333' }}>
                  Song {idx + 1}
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 5, fontSize: 12, fontWeight: 600 }}>
                      Title
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={song.title}
                      onChange={(e) => handleSongChange(idx, 'title', e.target.value)}
                      placeholder="Song title"
                      style={{ marginBottom: 0 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 5, fontSize: 12, fontWeight: 600 }}>
                      Artist
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={song.artist}
                      onChange={(e) => handleSongChange(idx, 'artist', e.target.value)}
                      placeholder="Artist name"
                      style={{ marginBottom: 0 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 5, fontSize: 12, fontWeight: 600 }}>
                      Button Hint
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={song.buttonText}
                      onChange={(e) => handleSongChange(idx, 'buttonText', e.target.value)}
                      placeholder="Hint for button"
                      style={{ marginBottom: 0 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 5, fontSize: 12, fontWeight: 600 }}>
                      Spotify URI
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={song.spotifyUri}
                      onChange={(e) => handleSongChange(idx, 'spotifyUri', e.target.value)}
                      placeholder="spotify:track:..."
                      style={{ marginBottom: 0, fontSize: 11 }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 30 }}>
            <button
              className="button"
              onClick={handleSaveQuiz}
              style={{ flex: 1 }}
            >
              Save Quiz
            </button>
            <button
              className="button button-secondary"
              onClick={() => {
                setShowForm(false)
                setEditingId(null)
              }}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
