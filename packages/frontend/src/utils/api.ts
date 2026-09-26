/**
 * Axios instance with JWT auth header injection.
 * In production set VITE_API_URL to the backend origin (e.g. https://api.example.com).
 */
import axios from 'axios';

const TOKEN_KEY = 'matka_token';

const API_ORIGIN = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

const api = axios.create({
  baseURL: API_ORIGIN ? `${API_ORIGIN}/api` : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export default api;
