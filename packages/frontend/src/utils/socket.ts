/**
 * Socket.IO client singleton.
 * Connects with the JWT from localStorage.
 * In production set VITE_API_URL (or VITE_SOCKET_URL) to the backend origin.
 */
import { io, Socket } from 'socket.io-client';

const TOKEN_KEY = 'matka_token';

const SOCKET_URL =
  (import.meta.env.VITE_SOCKET_URL as string | undefined)?.replace(/\/$/, '') ??
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ??
  '/';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = localStorage.getItem(TOKEN_KEY) ?? '';
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
