const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-modify-playback-state',
  'user-read-playback-state',
];

export function getAuthUrl() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES.join(' '),
  });

  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

export function getAuthTokenFromCode(code) {
  return fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || '',
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.access_token) {
        localStorage.setItem('spotify_access_token', data.access_token);
        localStorage.setItem('spotify_refresh_token', data.refresh_token);
        localStorage.setItem('spotify_token_expires', Date.now() + data.expires_in * 1000);
        return data.access_token;
      }
      throw new Error(data.error_description || 'Failed to get token');
    });
}

export function getAccessToken() {
  return localStorage.getItem('spotify_access_token');
}

export function isAccessTokenExpired() {
  const expiresAt = localStorage.getItem('spotify_token_expires');
  return !expiresAt || Date.now() > parseInt(expiresAt);
}

export async function playTrack(deviceId, trackUri) {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Not authenticated with Spotify');
  }

  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/play', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_id: deviceId,
        uris: [trackUri],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to play track: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error playing track:', error);
    throw error;
  }
}

export async function pausePlayback() {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Not authenticated with Spotify');
  }

  try {
    await fetch('https://api.spotify.com/v1/me/player/pause', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Error pausing playback:', error);
  }
}

export function loadSpotifySDK() {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      resolve();
    };
  });
}
