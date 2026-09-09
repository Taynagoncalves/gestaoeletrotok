// Preencha com a URL pública do backend assim que ele estiver publicado
// (ex: 'https://gestaoeletrotok-backend.onrender.com/api').
const PRODUCTION_API_URL = 'https://SUBSTITUA-PELA-URL-DO-BACKEND.onrender.com/api';

const API_BASE_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : PRODUCTION_API_URL;

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error((data && data.erro) || 'Erro na requisição.');
  }

  return data;
}

const api = {
  get: (path) => apiRequest(path),
  post: (path, body) => apiRequest(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => apiRequest(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => apiRequest(path, { method: 'DELETE' }),
};
