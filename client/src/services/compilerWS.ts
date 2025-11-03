import { getSocket } from '@/lib/socket';

export type CompilerSessionEvent = {
  sessionId: string;
  status: 'queued' | 'running' | 'completed' | 'error';
  output?: string;
  error?: string;
  runtime?: string;
  memory?: string;
  progress?: { current: number; total: number };
  testsPassed?: number;
  totalTests?: number;
};

export function subscribeSession(sessionId: string, cb: (evt: CompilerSessionEvent) => void) {
  const socket = getSocket();
  const handler = (evt: CompilerSessionEvent) => {
    if (evt && evt.sessionId === sessionId) cb(evt);
  };
  socket.on('compiler:session:update', handler);
  return () => {
    try { socket.off('compiler:session:update', handler); } catch {}
  };
}

export function hasProgress(evt: CompilerSessionEvent): evt is CompilerSessionEvent & { progress: { current: number; total: number } } {
  return !!(evt && evt.progress && typeof evt.progress.current === 'number' && typeof evt.progress.total === 'number');
}
