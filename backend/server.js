const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

// Initialize database
db.initializeDb();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

// In-memory game state
const rooms = new Map();
let roomIdCounter = 1000;

// WebSocket connection handler
wss.on('connection', (ws) => {
  ws.playerId = Math.random().toString(36).substring(7);
  console.log(`Player connected: ${ws.playerId}`);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleMessage(ws, data);
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log(`Player disconnected: ${ws.playerId}`);
    handlePlayerDisconnect(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Message handler
function handleMessage(ws, data) {
  const { type, payload } = data;

  switch (type) {
    case 'CREATE_ROOM':
      handleCreateRoom(ws, payload);
      break;
    case 'SELECT_QUIZ':
      handleSelectQuiz(ws, payload);
      break;
    case 'JOIN_ROOM':
      handleJoinRoom(ws, payload);
      break;
    case 'START_QUIZ':
      handleStartQuiz(ws, payload);
      break;
    case 'PLAY_SONG':
      handlePlaySong(ws, payload);
      break;
    case 'SUBMIT_GUESS':
      handleSubmitGuess(ws, payload);
      break;
    case 'NEXT_ROUND':
      handleNextRound(ws, payload);
      break;
    case 'RECONNECT':
      handleReconnect(ws, payload);
      break;
    default:
      console.log('Unknown message type:', type);
  }
}

// Generate 6-digit game ID
function generateGameId() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Room creation
function handleCreateRoom(ws, payload) {
  const roomId = `room_${roomIdCounter++}`;
  const gameId = generateGameId();

  const room = {
    id: roomId,
    gameId: gameId,
    host: ws,
    players: new Map(),
    state: 'waiting', // waiting, playing, ended
    currentRound: 0,
    quizId: null,
    quiz: [],
    scores: {},
    guesses: new Map(),
    roundPoints: new Map(), // Store points earned in current round
    usedButtons: [],
  };

  rooms.set(roomId, room);
  ws.roomId = roomId;
  ws.isHost = true;

  ws.send(JSON.stringify({
    type: 'ROOM_CREATED',
    roomId: roomId,
    gameId: gameId,
  }));

  console.log(`Room created: ${roomId} with game ID: ${gameId}`);
}

// Player joins room by gameId
function handleJoinRoom(ws, payload) {
  try {
    const { gameId, playerName } = payload;

    console.log(`Attempting to join game: ${gameId} with player: ${playerName}`);
    console.log(`Available rooms:`, Array.from(rooms.values()).map(r => ({ gameId: r.gameId, playersCount: r.players.size })));

    // Find room by gameId
    let room = null;
    let roomId = null;

    for (const [rid, r] of rooms.entries()) {
      if (r.gameId === gameId) {
        room = r;
        roomId = rid;
        break;
      }
    }

    if (!room) {
      console.error(`Room not found for gameId: ${gameId}`);
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Game not found',
      }));
      return;
    }

    room.players.set(ws.playerId, {
      ws: ws,
      name: playerName,
      score: 0,
    });

    ws.roomId = roomId;
    ws.isHost = false;
    room.scores[ws.playerId] = 0;

    // Notify all players in room
    broadcastToRoom(roomId, {
      type: 'PLAYER_JOINED',
      playerId: ws.playerId,
      playerName: playerName,
      players: Array.from(room.players.entries()).map(([pid, p]) => ({
        playerId: pid,
        name: p.name,
        score: p.score,
      })),
    });

    ws.send(JSON.stringify({
      type: 'JOIN_ROOM_SUCCESS',
      roomId: roomId,
      gameId: room.gameId,
      quiz: room.quiz,
      usedButtons: room.usedButtons,
    }));

    console.log(`Player joined game: ${playerName} in game ID: ${gameId}`);
  } catch (error) {
    console.error('Error in handleJoinRoom:', error);
    ws.send(JSON.stringify({
      type: 'ERROR',
      message: 'An error occurred while joining the room',
    }));
  }
}

// Helper to find room by gameId
function findRoomByGameId(gameId) {
  for (const [rid, r] of rooms.entries()) {
    if (r.gameId === gameId) {
      return { room: r, roomId: rid };
    }
  }
  return { room: null, roomId: null };
}

// Select quiz
function handleSelectQuiz(ws, payload) {
  try {
    const room = rooms.get(ws.roomId);
    if (!room || !ws.isHost) return;

    const quizId = payload.quizId;
    const quiz = db.getQuizById(quizId);
    const quizData = quiz ? quiz.songs : [];

    room.quizId = quizId;
    room.quiz = quizData;

    // Broadcast quiz selection to all players in the room
    broadcastToRoom(ws.roomId, {
      type: 'QUIZ_SELECTED',
      quiz: quizData,
      usedButtons: room.usedButtons,
    });

    console.log(`Quiz selected in room ${ws.roomId}: quiz ${quizId}`);
  } catch (error) {
    console.error('Error in handleSelectQuiz:', error);
  }
}

// Start quiz
function handleStartQuiz(ws, payload) {
  const room = rooms.get(ws.roomId);
  if (!room || !ws.isHost) return;

  room.state = 'playing';
  room.currentRound = 0;

  broadcastToRoom(ws.roomId, {
    type: 'QUIZ_STARTED',
    quiz: room.quiz,
  });
}

// Play song
function handlePlaySong(ws, payload) {
  const { buttonIndex, songUri } = payload;
  const room = rooms.get(ws.roomId);
  if (!room || !ws.isHost) return;

  room.currentButton = buttonIndex;
  room.guesses.clear();
  room.roundPoints.clear(); // Reset round points for new song
  room.songStartTime = Date.now(); // Track song start time for speed-based scoring

  broadcastToRoom(ws.roomId, {
    type: 'SONG_PLAYING',
    buttonIndex: buttonIndex,
    songUri: songUri,
  });

  console.log(`Song playing in room ${ws.roomId}: button ${buttonIndex}`);
}

// Check if all players have guessed
function checkAllPlayersGuessed(room) {
  if (room.players.size === 0) return false;
  return room.guesses.size === room.players.size;
}

// Submit guess
function handleSubmitGuess(ws, payload) {
  const { guess } = payload;
  const room = rooms.get(ws.roomId);
  if (!room || ws.isHost) return;

  // Only accept one guess per player per round
  if (room.guesses.has(ws.playerId)) {
    return;
  }

  room.guesses.set(ws.playerId, guess);

  const isCorrect = guess === room.currentButton;
  let points = 0;

  if (isCorrect) {
    // Calculate speed-based points: faster answers get more points (max 100)
    // 60 seconds total, formula: 100 * (60 - secondsElapsed) / 60
    const timeElapsed = (Date.now() - room.songStartTime) / 1000; // Convert to seconds
    const maxTime = 60;
    points = Math.max(0, Math.round(100 * (maxTime - timeElapsed) / maxTime));
    room.scores[ws.playerId] = (room.scores[ws.playerId] || 0) + points;
  }

  // Store points earned in this round for results display
  room.roundPoints.set(ws.playerId, points);

  // Send feedback to the player who guessed
  ws.send(JSON.stringify({
    type: 'GUESS_RECEIVED',
    correct: isCorrect,
    points: points,
  }));

  // Broadcast updated scores to all players
  broadcastToRoom(ws.roomId, {
    type: 'SCORES_UPDATE',
    scores: room.scores,
  });

  // Notify host of all guesses
  if (room.host && room.host.readyState === WebSocket.OPEN) {
    room.host.send(JSON.stringify({
      type: 'GUESSES_UPDATE',
      guesses: Array.from(room.guesses.entries()),
      scores: room.scores,
    }));
  }

  // Check if all players have guessed
  if (checkAllPlayersGuessed(room)) {
    // Auto-finish round
    finishRound(room);
  }

  console.log(`Guess submitted in room ${ws.roomId}`);
}

// Finish round automatically
function finishRound(room) {
  // Create results showing who was correct
  const results = [];

  // Include all players in results (whether they guessed or not)
  room.players.forEach((player, playerId) => {
    const guess = room.guesses.get(playerId);
    const playerName = player.name || 'Unknown Player';
    const isCorrect = guess === room.currentButton;

    // Use points stored when guess was submitted (not recalculated)
    const points = room.roundPoints.get(playerId) || 0;

    results.push({
      playerId,
      playerName,
      guess: guess !== undefined ? guess : null,
      correct: isCorrect,
      correctAnswer: room.currentButton,
      points: points,
    });
  });

  // Add button to used list
  room.usedButtons.push(room.currentButton);

  // Check if all songs have been played (8 total)
  if (room.usedButtons.length >= room.quiz.length) {
    // Game ended - send final scoreboard
    const finalScoreboard = Array.from(room.players.entries())
      .map(([playerId, player]) => ({
        name: player.name,
        score: room.scores[playerId] || 0
      }))
      .sort((a, b) => b.score - a.score);

    broadcastToRoom(room.id, {
      type: 'GAME_ENDED',
      scores: room.scores,
      results: results,
      correctAnswer: room.currentButton,
      usedButtons: room.usedButtons,
      finalScoreboard: finalScoreboard,
    });
  } else {
    // Game continues
    broadcastToRoom(room.id, {
      type: 'ROUND_AUTO_ENDED',
      scores: room.scores,
      results: results,
      correctAnswer: room.currentButton,
      usedButtons: room.usedButtons,
    });
  }
}

// Next round
function handleNextRound(ws, payload) {
  const room = rooms.get(ws.roomId);
  if (!room || !ws.isHost) return;

  room.currentRound++;
  room.currentButton = null;
  room.guesses.clear();

  broadcastToRoom(ws.roomId, {
    type: 'NEXT_ROUND_STARTED',
    scores: room.scores,
    nextRound: room.currentRound,
    usedButtons: room.usedButtons,
    quiz: room.quiz,
  });
}

// Handle player reconnection
function handleReconnect(ws, payload) {
  const { roomId, playerId, playerName } = payload;

  // Find the room
  const room = rooms.get(roomId);
  if (!room) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      message: 'Room not found',
    }));
    return;
  }

  // Check if player already exists in the room
  const existingPlayer = room.players.get(playerId);
  if (existingPlayer) {
    // Clear the grace period timeout since player reconnected
    if (existingPlayer.disconnectTimeoutId) {
      clearTimeout(existingPlayer.disconnectTimeoutId);
      existingPlayer.disconnectTimeoutId = null;
    }

    // Update the WebSocket connection for the player
    existingPlayer.ws = ws;
    existingPlayer.connected = true;
    ws.playerId = playerId;
    ws.roomId = roomId;
    ws.isHost = room.host.playerId === playerId;

    console.log(`Player reconnected: ${playerId} in room ${roomId}`);

    // Send the current game state to the reconnected player
    ws.send(JSON.stringify({
      type: 'RECONNECT_SUCCESS',
      roomId: roomId,
      gameId: room.gameId,
      quiz: room.quiz,
      usedButtons: room.usedButtons,
      scores: room.scores,
      gameState: room.state,
      isHost: ws.isHost,
    }));

    // Notify other players that this player rejoined
    broadcastToRoom(roomId, {
      type: 'PLAYER_JOINED',
      players: Array.from(room.players.entries()).map(([pid, p]) => ({
        playerId: pid,
        name: p.name,
        score: p.score,
      })),
    });
  } else {
    ws.send(JSON.stringify({
      type: 'ERROR',
      message: 'Player not found in this room',
    }));
  }
}

// Player disconnect handler
function handlePlayerDisconnect(ws) {
  const roomId = ws.roomId;
  if (roomId) {
    const room = rooms.get(roomId);
    if (room) {
      const player = room.players.get(ws.playerId);
      if (player) {
        player.connected = false;
        console.log(`Player disconnected: ${ws.playerId} in room ${roomId}`);

        // Notify other players that this player disconnected
        broadcastToRoom(roomId, {
          type: 'PLAYER_DISCONNECTED',
          playerId: ws.playerId,
          playerName: player.name,
        });

        // For hosts, wait indefinitely for reconnection - no removal
        // For regular players, set a 30-second grace period
        if (!ws.isHost) {
          const gracePeriodTimeout = setTimeout(() => {
            const stillDisconnected = room.players.get(ws.playerId);
            if (stillDisconnected && !stillDisconnected.connected) {
              room.players.delete(ws.playerId);
              console.log(`Player removed after grace period: ${ws.playerId} in room ${roomId}`);

              // Notify other players that this player left
              broadcastToRoom(roomId, {
                type: 'PLAYER_LEFT',
                playerId: ws.playerId,
              });

              // If no players left and host is gone, delete room
              if (room.players.size === 0) {
                rooms.delete(roomId);
                console.log(`Room deleted: ${roomId}`);
              }
            }
          }, 30000); // 30 second grace period for regular players

          player.disconnectTimeoutId = gracePeriodTimeout;
        } else {
          console.log(`Host ${ws.playerId} disconnected - waiting for reconnection indefinitely`);
        }
      }
    }
  }
}

// Broadcast to all players in room
function broadcastToRoom(roomId, message) {
  const room = rooms.get(roomId);
  if (!room) return;

  const messageStr = JSON.stringify(message);

  if (room.host && room.host.readyState === WebSocket.OPEN) {
    room.host.send(messageStr);
  }

  room.players.forEach(player => {
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(messageStr);
    }
  });
}

// REST API endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/rooms', (req, res) => {
  const roomList = Array.from(rooms.values()).map(room => ({
    id: room.id,
    players: room.players.size,
    state: room.state,
  }));
  res.json(roomList);
});

// Admin API endpoints
app.get('/api/quizzes', (req, res) => {
  const quizzes = db.getAllQuizzes();
  res.json(quizzes);
});

app.get('/api/quizzes/:id', (req, res) => {
  const quiz = db.getQuizById(req.params.id);
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }
  res.json(quiz);
});

app.post('/api/quizzes', express.json(), (req, res) => {
  const { name, songs } = req.body;
  if (!name || !songs || songs.length !== 8) {
    return res.status(400).json({ error: 'Quiz must have a name and exactly 8 songs' });
  }
  const newQuiz = db.createQuiz(name, songs);
  res.status(201).json(newQuiz);
});

app.put('/api/quizzes/:id', express.json(), (req, res) => {
  const { name, songs } = req.body;
  if (!name || !songs || songs.length !== 8) {
    return res.status(400).json({ error: 'Quiz must have a name and exactly 8 songs' });
  }
  const updatedQuiz = db.updateQuiz(req.params.id, name, songs);
  if (!updatedQuiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }
  res.json(updatedQuiz);
});

app.delete('/api/quizzes/:id', (req, res) => {
  const deleted = db.deleteQuiz(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Quiz not found' });
  }
  res.json({ success: true });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
