import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/auth.store';

const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000').replace('/api', '');

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = useAuthStore.getState().accessToken;
    socket = io(API_URL, {
      auth: { token },
      transports: ['websocket'],
    });
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
