import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'https://eventapp-production-9af6.up.railway.app';

let socket: Socket | null = null;

export function connectSocket(userId: string): Socket {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    query: { userId },
    transports: ['polling', 'websocket'],
    reconnectionAttempts: 3,
    reconnectionDelay: 5000,
    timeout: 10000,
  });

  socket.on('connect', () => {
    socket?.emit('register', userId);
  });

  socket.on('disconnect', () => {});

  socket.on('connect_error', (err) => {
    console.warn('Socket connection error:', err.message);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}
