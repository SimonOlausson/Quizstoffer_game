const quizzes = {
  1: {
    name: '90s Pop Hits',
    songs: [
      { id: 0, title: 'Run the World (Girls)', artist: 'Beyoncé', buttonText: 'Girl Power', spotifyUri: 'spotify:track:1uXbwHHfgsXcUKfSZw5ZJ0', trackId: '1uXbwHHfgsXcUKfSZw5ZJ0' },
      { id: 1, title: 'Bitter Sweet Symphony', artist: 'The Verve', buttonText: 'Vertical Stripes', spotifyUri: 'spotify:track:0VjIjW4GlUZAMYd2vXMwbv', trackId: '0VjIjW4GlUZAMYd2vXMwbv' },
      { id: 2, title: 'Creep', artist: 'Radiohead', buttonText: 'Strange & Alone', spotifyUri: 'spotify:track:7qiZfU4dY1lsylvNEJsQBN', trackId: '7qiZfU4dY1lsylvNEJsQBN' },
      { id: 3, title: 'No Scrubs', artist: 'TLC', buttonText: 'No Time Wasters', spotifyUri: 'spotify:track:7vfY5bYw82h8wJvuLJ3u4A', trackId: '7vfY5bYw82h8wJvuLJ3u4A' },
      { id: 4, title: 'Sabotage', artist: 'Beastie Boys', buttonText: 'Beastie Chaos', spotifyUri: 'spotify:track:5E8zLLKmKVD0Ib7Zj0Yolw', trackId: '5E8zLLKmKVD0Ib7Zj0Yolw' },
      { id: 5, title: 'Zombie', artist: 'The Cranberries', buttonText: 'Irish Undead', spotifyUri: 'spotify:track:7qwnYvJn6K0f0d1FQHD5Q2', trackId: '7qwnYvJn6K0f0d1FQHD5Q2' },
      { id: 6, title: 'Wonderwall', artist: 'Oasis', buttonText: 'Britpop Wonder', spotifyUri: 'spotify:track:3haSDcrQBJcFQlqTHMAx0b', trackId: '3haSDcrQBJcFQlqTHMAx0b' },
      { id: 7, title: 'Where Do You Go', artist: 'Black Eyed Peas', buttonText: 'E.N.D. Mystery', spotifyUri: 'spotify:track:0tMCMrr5crMc3Ll9YHN7gH', trackId: '0tMCMrr5crMc3Ll9YHN7gH' }
    ]
  },
  2: {
    name: 'Taylor Swift Essentials',
    songs: [
      { id: 0, title: 'Shake It Off', artist: 'Taylor Swift', buttonText: 'Dance Move', spotifyUri: 'spotify:track:2takcwgKJJvtabVR4UJgPd', trackId: '2takcwgKJJvtabVR4UJgPd' },
      { id: 1, title: 'Love Story', artist: 'Taylor Swift', buttonText: 'Romeo & Juliet', spotifyUri: 'spotify:track:0DiWxABG7uwpf8Tn5pjnwJ', trackId: '0DiWxABG7uwpf8Tn5pjnwJ' },
      { id: 2, title: 'You Belong With Me', artist: 'Taylor Swift', buttonText: 'Country Love', spotifyUri: 'spotify:track:4cOdK2wGLETKBW3PvgPWqV', trackId: '4cOdK2wGLETKBW3PvgPWqV' },
      { id: 3, title: 'Blank Space', artist: 'Taylor Swift', buttonText: 'New Lover Lesson', spotifyUri: 'spotify:track:1301WleyT98MSxVHPZCA6M', trackId: '1301WleyT98MSxVHPZCA6M' },
      { id: 4, title: 'Anti-Hero', artist: 'Taylor Swift', buttonText: 'Self Reflection', spotifyUri: 'spotify:track:0VjIjW4GlUZAMYd2vXMwbv', trackId: '0VjIjW4GlUZAMYd2vXMwbv' },
      { id: 5, title: 'Look What You Made Me Do', artist: 'Taylor Swift', buttonText: 'Revenge Anthem', spotifyUri: 'spotify:track:2s0J3w47u6K0qJpHnFkRRa', trackId: '2s0J3w47u6K0qJpHnFkRRa' },
      { id: 6, title: 'Delicate', artist: 'Taylor Swift', buttonText: 'New Beginning', spotifyUri: 'spotify:track:0VjIjW4GlUZAMYd2vXMwbv', trackId: '0VjIjW4GlUZAMYd2vXMwbv' },
      { id: 7, title: 'Cruel Summer', artist: 'Taylor Swift', buttonText: 'Sad Memory', spotifyUri: 'spotify:track:4Uc8kxMckVJ5iBEDJy4Lnr', trackId: '4Uc8kxMckVJ5iBEDJy4Lnr' }
    ]
  },
  3: {
    name: 'Party Bangers',
    songs: [
      { id: 0, title: 'Blinding Lights', artist: 'The Weeknd', buttonText: 'Night Drive', spotifyUri: 'spotify:track:0VjIjW4GlUZAMYd2vXMwbv', trackId: '0VjIjW4GlUZAMYd2vXMwbv' },
      { id: 1, title: 'Don\'t Start Now', artist: 'Dua Lipa', buttonText: 'Disco Groove', spotifyUri: 'spotify:track:7qiZfU4dY1lsylvNEJsQBN', trackId: '7qiZfU4dY1lsylvNEJsQBN' },
      { id: 2, title: 'Levitating', artist: 'Dua Lipa', buttonText: 'Float Away', spotifyUri: 'spotify:track:3haSDcrQBJcFQlqTHMAx0b', trackId: '3haSDcrQBJcFQlqTHMAx0b' },
      { id: 3, title: 'Heat Waves', artist: 'Glass Animals', buttonText: 'Desert Mirage', spotifyUri: 'spotify:track:4cOdK2wGLETKBW3PvgPWqV', trackId: '4cOdK2wGLETKBW3PvgPWqV' },
      { id: 4, title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', buttonText: 'Retro Funk', spotifyUri: 'spotify:track:0DiWxABG7uwpf8Tn5pjnwJ', trackId: '0DiWxABG7uwpf8Tn5pjnwJ' },
      { id: 5, title: 'One Dance', artist: 'Drake ft. Wizkid & Kyla', buttonText: 'Two Step', spotifyUri: 'spotify:track:1301WleyT98MSxVHPZCA6M', trackId: '1301WleyT98MSxVHPZCA6M' },
      { id: 6, title: 'Good as Hell', artist: 'Lizzo', buttonText: 'Positive Vibes', spotifyUri: 'spotify:track:2s0J3w47u6K0qJpHnFkRRa', trackId: '2s0J3w47u6K0qJpHnFkRRa' },
      { id: 7, title: 'Shut Up and Dance', artist: 'Walk the Moon', buttonText: 'Dance Moves', spotifyUri: 'spotify:track:3qeNvLiblimlF3aJrXSHze', trackId: '3qeNvLiblimlF3aJrXSHze' }
    ]
  }
};

module.exports = quizzes;
