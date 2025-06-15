const CLIENT_ID = '97c7bdaae3324bb3bad0b4cd3d48be8c';
const REDIRECT_URI = 'https://actofy.vercel.app/';
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const RESPONSE_TYPE = 'token';
const SCOPES = [
  'user-read-private',
  'playlist-read-private',
  'user-read-email',
  'streaming',
  'user-modify-playback-state'
].join('%20');

const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userSection = document.getElementById('user-section');
const usernameSpan = document.getElementById('username');
const userImg = document.getElementById('user-img');
const playlistsSection = document.getElementById('playlists');
const player = document.getElementById('player');
const trackImg = document.getElementById('track-img');
const trackName = document.getElementById('track-name');
const trackArtist = document.getElementById('track-artist');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

let accessToken = null;
let currentTrackUri = null;
let isPlaying = false;

function getTokenFromUrl() {
  return window.location.hash
    .substring(1)
    .split('&')
    .reduce((acc, item) => {
      if (item) {
        let parts = item.split('=');
        acc[parts[0]] = decodeURIComponent(parts[1]);
      }
      return acc;
    }, {});
}

function setToken(token) {
  localStorage.setItem('spotify_token', token);
}

function getToken() {
  return localStorage.getItem('spotify_token');
}

function logout() {
  localStorage.removeItem('spotify_token');
  window.location = REDIRECT_URI;
}

function updateUserInfo(user) {
  usernameSpan.textContent = user.display_name || user.id;
  userImg.src = user.images?.[0]?.url || 'https://via.placeholder.com/40';
  userSection.style.display = 'flex';
  loginBtn.style.display = 'none';
  player.style.display = 'flex';
}

async function fetchUserProfile(token) {
  const res = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

async function fetchUserPlaylists(token) {
  const res = await fetch('https://api.spotify.com/v1/me/playlists', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  playlistsSection.innerHTML = '';

  if (data.items) {
    data.items.forEach(playlist => {
      const card = document.createElement('div');
      card.className = 'playlist-card';
      card.innerHTML = `
        <img src="${playlist.images[0]?.url || 'https://via.placeholder.com/140'}" alt="${playlist.name}" />
        <div class="playlist-name">${playlist.name}</div>
      `;
      card.onclick = () => {
        loadPlaylistTracks(playlist.id);
      };
      playlistsSection.appendChild(card);
    });
  }
}

async function loadPlaylistTracks(playlistId) {
  const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data = await res.json();

  if (data.items && data.items.length > 0) {
    const firstTrack = data.items[0].track;
    playTrack(firstTrack.uri, firstTrack);
  }
}

function playTrack(uri, track) {
  // Exibir informações no player
  currentTrackUri = uri;
  trackImg.src = track.album.images[0]?.url || '';
  trackName.textContent = track.name;
  trackArtist.textContent = track.artists.map(a => a.name).join(', ');
  isPlaying = true;
  playBtn.textContent = '⏸';

  // Tocar via Spotify Web Playback SDK (mais complexo)
  // Aqui só vamos abrir o link do Spotify no navegador, porque tocar música direto precisa Web Playback SDK e token premium
  window.open(`https://open.spotify.com/track/${track.id}`, '_blank');
}

loginBtn.addEventListener('click', () => {
  const url = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_type=${RESPONSE_TYPE}&scope=${SCOPES}&show_dialog=true`;
  window.location = url;
});

logoutBtn.addEventListener('click', logout);

window.onload = async () => {
  const hash = getTokenFromUrl();
  if (hash.access_token) {
    setToken(hash.access_token);
    window.location.hash = '';
  }
  accessToken = getToken();
  if (accessToken) {
    const user = await fetchUserProfile(accessToken);
    updateUserInfo(user);
    await fetchUserPlaylists(accessToken);
  }
};
