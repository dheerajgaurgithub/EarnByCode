import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let heartbeat: number | null = null;
let latestUserId: string | undefined;

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
    // Allow polling fallback for hosts like Render
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    auth: token ? { token } : {},
  });

  // Basic visibility logs (can be removed later)
  socket.on('connect', () => {
    try {
      if (latestUserId) socket!.emit('presence:identify', { userId: latestUserId });
      if (heartbeat) window.clearInterval(heartbeat);
      heartbeat = window.setInterval(() => {
        try { socket!.emit('presence:ping'); } catch {}
      }, 30000) as unknown as number;
    } catch {}
  });
  socket.on('disconnect', () => {
    if (heartbeat) { window.clearInterval(heartbeat); heartbeat = null; }
  });
  return socket;
}

export function startPresence(userId?: string) {
  const s = getSocket();
  latestUserId = userId || latestUserId;
  try { s.emit('presence:identify', { userId: latestUserId }); } catch {}
  if (heartbeat) { window.clearInterval(heartbeat); heartbeat = null; }
  heartbeat = window.setInterval(() => {
    try { s.emit('presence:ping'); } catch {}
  }, 30000) as unknown as number;
  s.on('disconnect', () => { if (heartbeat) { window.clearInterval(heartbeat); heartbeat = null; } });
}

export function watchPresence(userIds: string[]) {
  const s = getSocket();
  s.emit('presence:watch', { userIds: Array.from(new Set(userIds.filter(Boolean))) });
}
