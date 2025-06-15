// Configurações Spotify
const CLIENT_ID = '97c7bdaae3324bb3bad0b4cd3d48be8c'; // Coloque seu Client ID aqui
const REDIRECT_URI = 'https://actofy.vercel.app/';
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const RESPONSE_TYPE = 'token';
const SCOPES = [
  'user-read-private',
  'playlist-read-private',
  'user-read-email'
].join('%20');

// DOM
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userSection = document.getElementById('user-section');
const usernameSpan = document.getElementById('username');
const userImg = document.getElementById('user-img');
const playlistsSection = document.getElementById('playlists');

let accessToken = null;

// Pega token do hash da URL
function getTokenFromUrl() {
  return window.location.hash
    .substring(1)
    .split('&')
    .reduce((acc, item) => {
      if (item) {
        const parts = item.split('=');
        acc[parts[0]] = decodeURIComponent(parts[1]);
      }
      return acc;
    }, {});
}

// Salva token no localStorage
function setToken(token) {
  localStorage.setItem('spotify_token', token);
}

// Pega token do localStorage
function getToken() {
  return localStorage.getItem('spotify_token');
}

// Logout - limpa token e recarrega
function logout() {
  localStorage.removeItem('spotify_token');
  window.location.href = REDIRECT_URI;
}

// Atualiza UI com usuário
function updateUserInfo(user) {
  usernameSpan.textContent = user.display_name || user.id;
  userImg.src = user.images?.[0]?.url || 'https://via.placeholder.com/40';
  userSection.style.display = 'flex';
  loginBtn.style.display = 'none';
  logoutBtn.style.display = 'inline-block';
}

// Busca perfil
async function fetchUserProfile(token) {
  const res = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    logout();
    return null;
  }
  return res.json();
}

// Busca playlists
async function fetchUserPlaylists(token) {
  const res = await fetch('https://api.spotify.com/v1/me/playlists', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    return;
  }
  const data = await res.json();

  playlistsSection.innerHTML = '';

  if (data.items) {
    data.items.forEach(pl => {
      const card = document.createElement('div');
      card.className = 'playlist-card';
      card.innerHTML = `
        <img src="${pl.images[0]?.url || 'https://via.placeholder.com/140'}" alt="${pl.name}" />
        <div class="playlist-name">${pl.name}</div>
      `;
      playlistsSection.appendChild(card);
    });
  }
}

// Login
loginBtn.addEventListener('click', () => {
  const url = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_type=${RESPONSE_TYPE}&scope=${SCOPES}&show_dialog=true`;
  window.location = url;
});

// Logout
logoutBtn.addEventListener('click', logout);

// On load
window.onload = async () => {
  const hash = getTokenFromUrl();

  if (hash.access_token) {
    setToken(hash.access_token);
    window.location.hash = '';
  }

  accessToken = getToken();

  if (accessToken) {
    const user = await fetchUserProfile(accessToken);
    if (user) {
      updateUserInfo(user);
      await fetchUserPlaylists(accessToken);
    }
  }
};
