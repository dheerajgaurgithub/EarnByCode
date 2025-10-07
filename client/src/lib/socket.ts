import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(baseUrl?: string) {
  if (socket && socket.connected) return socket;
  const url = baseUrl || (import.meta.env.VITE_API_BASE || '/');
  const token = (() => {
    try { return localStorage.getItem('token') || localStorage.getItem('accessToken') || undefined; } catch { return undefined; }
  })();
  socket = io(url.replace(/\/$/, ''), {
    path: '/socket.io',
    withCredentials: true,
    autoConnect: true,
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    auth: token ? { token } : {},
  });
  return socket;
}

export function startPresence(userId?: string) {
  const s = getSocket();
  s.emit('presence:identify', { userId });
  const interval = setInterval(() => {
    try { s.emit('presence:ping'); } catch {}
  }, 30000);
  s.on('disconnect', () => clearInterval(interval));
}

export function watchPresence(userIds: string[]) {
  const s = getSocket();
  s.emit('presence:watch', { userIds: Array.from(new Set(userIds.filter(Boolean))) });
}
