const CLIENT_ID = '97c7bdaae3324bb3bad0b4cd3d48be8c'; // coloque seu Client ID aqui
const REDIRECT_URI = 'https://actofy.vercel.app/'; // seu domínio no Vercel
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const RESPONSE_TYPE = 'token';
const SCOPES = [
  'user-read-private',
  'playlist-read-private'
].join('%20');

const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfoDiv = document.getElementById('user-info');
const usernameSpan = document.getElementById('username');
const playlistsUl = document.getElementById('playlists');
const playerDiv = document.getElementById('player');

function getTokenFromUrl() {
  return window.location.hash
    .substring(1)
    .split('&')
    .reduce((initial, item) => {
      if (item) {
        let parts = item.split('=');
        initial[parts[0]] = decodeURIComponent(parts[1]);
      }
      return initial;
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

function showUserInfo(user) {
  usernameSpan.textContent = user.display_name || user.id;
  userInfoDiv.style.display = 'block';
  loginBtn.style.display = 'none';
  playerDiv.style.display = 'block';
}

async function fetchUserProfile(token) {
  const res = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

async function fetchPlaylists(token) {
  const res = await fetch('https://api.spotify.com/v1/me/playlists', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  playlistsUl.innerHTML = '';
  if (data.items) {
    data.items.forEach(playlist => {
      const li = document.createElement('li');
      li.textContent = playlist.name;
      playlistsUl.appendChild(li);
    });
  }
}

loginBtn.addEventListener('click', () => {
  const authUrl = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_type=${RESPONSE_TYPE}&scope=${SCOPES}&show_dialog=true`;
  window.location = authUrl;
});

logoutBtn.addEventListener('click', () => {
  logout();
});

// Ao carregar a página:
window.onload = async () => {
  const hash = getTokenFromUrl();
  if (hash.access_token) {
    setToken(hash.access_token);
    // Limpa o token da URL para não ficar visível
    window.location.hash = '';
  }

  const token = getToken();
  if (token) {
    try {
      const user = await fetchUserProfile(token);
      showUserInfo(user);
      await fetchPlaylists(token);
    } catch (e) {
      console.error(e);
      logout();
    }
  }
};
