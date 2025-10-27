// Chat service: API wrappers for chat threads, messages, and requests
import { getApiBase } from "./config";
export type ChatThread = {
  threadId: string;
  otherUser: { id: string; username: string; fullName?: string; avatarUrl?: string; avatar?: string };
  otherUserIsOnline?: boolean;
  otherUserLastSeen?: string | null;
  lastMessage?: { id: string; text: string; createdAt: string };
  unread?: number;
};

export type ChatMessage = {
  id: string;
  threadId: string;
  fromUserId: string;
  text: string;
  createdAt: string;
};

const api = () => getApiBase();
const authHeaders = () => {
  const token =
    (typeof localStorage !== 'undefined' && (localStorage.getItem('token') || localStorage.getItem('accessToken'))) ||
    undefined;

  console.log('Chat API Debug:', {
    hasToken: !!token,
    tokenLength: token?.length,
    tokenPrefix: token?.substring(0, 20),
    timestamp: new Date().toISOString()
  });

  return token ? { Authorization: `Bearer ${token}` } : undefined as any;
};

export async function listThreads(): Promise<ChatThread[]> {
  console.log('Chat: Fetching threads...');
  const res = await fetch(`${api()}/chat/threads`, {
    credentials: 'include',
    headers: authHeaders(),
  } as RequestInit);

  console.log('Chat: Response status:', res.status, res.statusText);

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Chat: Failed to fetch threads:', {
      status: res.status,
      statusText: res.statusText,
      errorText: errorText.substring(0, 200)
    });
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  console.log('Chat: Successfully fetched', data.length || 0, 'threads');
  return data;
}

export async function getMessages(threadId: string, cursor?: string, limit = 50): Promise<ChatMessage[]> {
  const q: string[] = [];
  if (cursor) q.push(`cursor=${encodeURIComponent(cursor)}`);
  if (limit) q.push(`limit=${limit}`);
  const qs = q.length ? `?${q.join('&')}` : '';
  const res = await fetch(`${api()}/chat/threads/${threadId}/messages${qs}`, {
    credentials: 'include',
    headers: authHeaders(),
  } as RequestInit);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function sendMessage(threadId: string, text: string): Promise<{ id: string }>{
  const res = await fetch(`${api()}/chat/threads/${threadId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(authHeaders() || {}) },
    credentials: 'include',
    body: JSON.stringify({ text })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function startOrGetThread(otherUserId: string): Promise<{ threadId: string; approvalStatus?: 'pending'|'approved'|'declined' }>{
  const res = await fetch(`${api()}/chat/start`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(authHeaders() || {}) }, credentials: 'include',
    body: JSON.stringify({ otherUserId })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function createRequest(recipientId: string, firstMessage?: string): Promise<{ requestId: string; status: 'pending'|'approved'|'declined' }>{
  const res = await fetch(`${api()}/chat/requests`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(authHeaders() || {}) }, credentials: 'include',
    body: JSON.stringify({ recipientId, firstMessage })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function approveRequest(requestId: string): Promise<{ success: boolean; threadId?: string }>{
  const res = await fetch(`${api()}/chat/requests/${requestId}/approve`, { method: 'POST', credentials: 'include', headers: authHeaders() } as RequestInit);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function declineRequest(requestId: string): Promise<{ success: boolean }>{
  const res = await fetch(`${api()}/chat/requests/${requestId}/decline`, { method: 'POST', credentials: 'include', headers: authHeaders() } as RequestInit);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function retryRequest(requestId: string): Promise<{ success: boolean }>{
  const res = await fetch(`${api()}/chat/requests/${requestId}/retry`, { method: 'POST', credentials: 'include', headers: authHeaders() } as RequestInit);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function markThreadRead(threadId: string): Promise<{ success: boolean }>{
  const res = await fetch(`${api()}/chat/threads/${threadId}/read`, { method: 'POST', credentials: 'include', headers: authHeaders() } as RequestInit);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}
