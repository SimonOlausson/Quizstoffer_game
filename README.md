# Quiztopher Clone

A multiplayer music guessing game built with React and Express. One person hosts and plays songs, while other players try to guess which button corresponds to the song they're hearing.

## Features

- **Multiplayer Real-time Gameplay**: WebSocket-based communication for instant updates
- **Host Controls**: Host selects songs and manages the quiz flow
- **Player Interface**: Players see 8 buttons and submit guesses with a timer
- **Scoring System**: Track player scores throughout the game
- **Room Management**: Create and join rooms with unique IDs

## Project Structure

```
quiztopher-clone/
├── backend/
│   ├── server.js           # Express WebSocket server
│   ├── package.json        # Backend dependencies
│   └── .env               # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main React app
│   │   ├── App.css        # Global styles
│   │   ├── main.jsx       # React entry point
│   │   ├── hooks/
│   │   │   └── useWebSocket.js  # WebSocket hook
│   │   └── pages/
│   │       ├── HomePage.jsx     # Home/login page
│   │       ├── HostPage.jsx     # Host interface
│   │       └── PlayerPage.jsx   # Player interface
│   ├── index.html         # HTML template
│   ├── package.json       # Frontend dependencies
│   └── vite.config.js     # Vite configuration
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 14+ and npm

### Installation

1. **Install Backend Dependencies**
```bash
cd backend
npm install
```

2. **Install Frontend Dependencies**
```bash
cd ../frontend
npm install
```

### Running the Application

1. **Start the Backend**
```bash
cd backend
npm run dev
```
The backend server will run on `http://localhost:3001`

2. **Start the Frontend** (in a new terminal)
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:3000`

3. **Open in Browser**
Navigate to `http://localhost:3000` in your browser

## How to Play

### As a Host
1. Click "Create Room (Host)"
2. Share the Room ID with other players
3. Wait for players to join
4. Click "Start Quiz"
5. Select a song button to play
6. See player guesses in real-time

### As a Player
1. Click "Join Room (Player)"
2. Enter the Room ID and your name
3. Wait for the host to start the quiz
4. Listen to the song and click the button you think matches
5. See your score update after each round

## WebSocket Events

### Client → Server
- `CREATE_ROOM` - Create a new game room
- `JOIN_ROOM` - Join an existing room
- `START_QUIZ` - Start the quiz
- `PLAY_SONG` - Host plays a song
- `SUBMIT_GUESS` - Player submits a guess
- `NEXT_ROUND` - Move to next round

### Server → Client
- `ROOM_CREATED` - Room successfully created
- `JOIN_ROOM_SUCCESS` - Successfully joined room
- `PLAYER_JOINED` - A new player joined
- `QUIZ_STARTED` - Quiz has started
- `SONG_PLAYING` - A song is now playing
- `GUESS_RECEIVED` - Guess processed
- `ROUND_ENDED` - Round has ended

## Next Steps / TODO

- Integrate with Spotify API for real song playback
- Add authentication and user accounts
- Implement persistent storage for quiz data
- Add more quiz categories
- Mobile-responsive design improvements
- Host migration (if host disconnects)
- Chat functionality between players
- Replay functionality

## Technologies Used

- **Frontend**: React 18, Vite, CSS
- **Backend**: Express.js, WebSocket (ws)
- **Communication**: JSON over WebSocket
- **Build Tool**: Vite

## License

MIT
