const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'quizzes.json');

// Initialize database with default quizzes
function initializeDb() {
  if (!fs.existsSync(dbPath)) {
    const defaultQuizzes = {
      quizzes: [
        {
          id: 1,
          name: '90s Pop Hits',
          songs: [
            { id: 0, title: 'Run the World (Girls)', artist: 'Beyoncé', buttonText: 'Girl Power', spotifyUri: 'spotify:track:1uXbwHHfgsXcUKfSZw5ZJ0', trackId: '1uXbwHHfgsXcUKfSZw5ZJ0', isDummy: false },
            { id: 1, title: 'Bitter Sweet Symphony', artist: 'The Verve', buttonText: 'Vertical Stripes', spotifyUri: 'spotify:track:0VjIjW4GlUZAMYd2vXMwbv', trackId: '0VjIjW4GlUZAMYd2vXMwbv', isDummy: false },
            { id: 2, title: 'Creep', artist: 'Radiohead', buttonText: 'Strange & Alone', spotifyUri: 'spotify:track:7qiZfU4dY1lsylvNEJsQBN', trackId: '7qiZfU4dY1lsylvNEJsQBN', isDummy: false },
            { id: 3, title: 'No Scrubs', artist: 'TLC', buttonText: 'No Time Wasters', spotifyUri: 'spotify:track:7vfY5bYw82h8wJvuLJ3u4A', trackId: '7vfY5bYw82h8wJvuLJ3u4A', isDummy: false },
            { id: 4, title: 'Sabotage', artist: 'Beastie Boys', buttonText: 'Beastie Chaos', spotifyUri: 'spotify:track:5E8zLLKmKVD0Ib7Zj0Yolw', trackId: '5E8zLLKmKVD0Ib7Zj0Yolw', isDummy: false },
            { id: 5, title: 'Zombie', artist: 'The Cranberries', buttonText: 'Irish Undead', spotifyUri: 'spotify:track:7qwnYvJn6K0f0d1FQHD5Q2', trackId: '7qwnYvJn6K0f0d1FQHD5Q2', isDummy: false },
            { id: 6, title: 'Dummy Track 1', artist: 'N/A', buttonText: 'Red Herring', spotifyUri: '', trackId: '', isDummy: true },
            { id: 7, title: 'Dummy Track 2', artist: 'N/A', buttonText: 'False Lead', spotifyUri: '', trackId: '', isDummy: true }
          ]
        },
        {
          id: 2,
          name: 'Taylor Swift Essentials',
          songs: [
            { id: 0, title: 'Shake It Off', artist: 'Taylor Swift', buttonText: 'Dance Move', spotifyUri: 'spotify:track:2takcwgKJJvtabVR4UJgPd', trackId: '2takcwgKJJvtabVR4UJgPd', isDummy: false },
            { id: 1, title: 'Love Story', artist: 'Taylor Swift', buttonText: 'Romeo & Juliet', spotifyUri: 'spotify:track:0DiWxABG7uwpf8Tn5pjnwJ', trackId: '0DiWxABG7uwpf8Tn5pjnwJ', isDummy: false },
            { id: 2, title: 'You Belong With Me', artist: 'Taylor Swift', buttonText: 'Country Love', spotifyUri: 'spotify:track:4cOdK2wGLETKBW3PvgPWqV', trackId: '4cOdK2wGLETKBW3PvgPWqV', isDummy: false },
            { id: 3, title: 'Blank Space', artist: 'Taylor Swift', buttonText: 'New Lover Lesson', spotifyUri: 'spotify:track:1301WleyT98MSxVHPZCA6M', trackId: '1301WleyT98MSxVHPZCA6M', isDummy: false },
            { id: 4, title: 'Anti-Hero', artist: 'Taylor Swift', buttonText: 'Self Reflection', spotifyUri: 'spotify:track:0VjIjW4GlUZAMYd2vXMwbv', trackId: '0VjIjW4GlUZAMYd2vXMwbv', isDummy: false },
            { id: 5, title: 'Look What You Made Me Do', artist: 'Taylor Swift', buttonText: 'Revenge Anthem', spotifyUri: 'spotify:track:2s0J3w47u6K0qJpHnFkRRa', trackId: '2s0J3w47u6K0qJpHnFkRRa', isDummy: false },
            { id: 6, title: 'Dummy Track 1', artist: 'N/A', buttonText: 'Red Herring', spotifyUri: '', trackId: '', isDummy: true },
            { id: 7, title: 'Dummy Track 2', artist: 'N/A', buttonText: 'False Lead', spotifyUri: '', trackId: '', isDummy: true }
          ]
        },
        {
          id: 3,
          name: 'Party Bangers',
          songs: [
            { id: 0, title: 'Blinding Lights', artist: 'The Weeknd', buttonText: 'Night Drive', spotifyUri: 'spotify:track:0VjIjW4GlUZAMYd2vXMwbv', trackId: '0VjIjW4GlUZAMYd2vXMwbv' },
            { id: 1, title: 'Don\'t Start Now', artist: 'Dua Lipa', buttonText: 'Disco Groove', spotifyUri: 'spotify:track:7qiZfU4dY1lsylvNEJsQBN', trackId: '7qiZfU4dY1lsylvNEJsQBN' },
            { id: 2, title: 'Levitating', artist: 'Dua Lipa', buttonText: 'Float Away', spotifyUri: 'spotify:track:3haSDcrQBJcFQlqTHMAx0b', trackId: '3haSDcrQBJcFQlqTHMAx0b' },
            { id: 3, title: 'Heat Waves', artist: 'Glass Animals', buttonText: 'Desert Mirage', spotifyUri: 'spotify:track:4cOdK2wGLETKBW3PvgPWqV', trackId: '4cOdK2wGLETKBW3PvgPWqV' },
            { id: 4, title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', buttonText: 'Retro Funk', spotifyUri: 'spotify:track:0DiWxABG7uwpf8Tn5pjnwJ', trackId: '0DiWxABG7uwpf8Tn5pjnwJ' },
            { id: 5, title: 'One Dance', artist: 'Drake ft. Wizkid & Kyla', buttonText: 'Two Step', spotifyUri: 'spotify:track:1301WleyT98MSxVHPZCA6M', trackId: '1301WleyT98MSxVHPZCA6M' },
            { id: 6, title: 'Dummy Track 1', artist: 'N/A', buttonText: 'Red Herring', spotifyUri: '', trackId: '', isDummy: true },
            { id: 7, title: 'Dummy Track 2', artist: 'N/A', buttonText: 'False Lead', spotifyUri: '', trackId: '', isDummy: true }
          ]
        }
      ],
      nextId: 4
    };
    fs.writeFileSync(dbPath, JSON.stringify(defaultQuizzes, null, 2));
  }
}

function readDb() {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database:', err);
    return { quizzes: [], nextId: 1 };
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing database:', err);
  }
}

function getAllQuizzes() {
  const db = readDb();
  return db.quizzes;
}

function getQuizById(id) {
  const db = readDb();
  return db.quizzes.find(q => q.id === parseInt(id));
}

function createQuiz(name, songs) {
  const db = readDb();
  const newQuiz = {
    id: db.nextId,
    name,
    songs: songs.map((song, idx) => ({
      id: idx,
      ...song
    }))
  };
  db.quizzes.push(newQuiz);
  db.nextId++;
  writeDb(db);
  return newQuiz;
}

function updateQuiz(id, name, songs) {
  const db = readDb();
  const quizIndex = db.quizzes.findIndex(q => q.id === parseInt(id));
  if (quizIndex === -1) return null;

  db.quizzes[quizIndex] = {
    id: parseInt(id),
    name,
    songs: songs.map((song, idx) => ({
      id: idx,
      ...song
    }))
  };
  writeDb(db);
  return db.quizzes[quizIndex];
}

function deleteQuiz(id) {
  const db = readDb();
  const quizIndex = db.quizzes.findIndex(q => q.id === parseInt(id));
  if (quizIndex === -1) return false;

  db.quizzes.splice(quizIndex, 1);
  writeDb(db);
  return true;
}

module.exports = {
  initializeDb,
  getAllQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz
};
