import io from 'socket.io-client';
import { Socket } from 'socket.io-client';

let socket: Socket | null = null;

const SOCKET_URL = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function initSocket(token?: string) {
  if (typeof window === 'undefined') return null;
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: false,
  });

  socket.on('connect', () => {
    if (token) socket?.emit('auth', token);
  });

  socket.on('connect_error', (err: any) => {
    console.warn('Socket connect_error', err);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (!socket) return;
  try {
    socket.disconnect();
  } catch (e) {
    // ignore
  }
  socket = null;
}

export default {
  initSocket,
  getSocket,
  disconnectSocket,
};
