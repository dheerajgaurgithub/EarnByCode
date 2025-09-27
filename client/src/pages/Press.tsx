import React, { useEffect, useState } from 'react';
import { Activity, Radio, Mail } from 'lucide-react';

// Removed static press items to keep the page focused on live updates and contact

// Helper to resolve API base URL similar to other pages
const getApiBase = () => {
  const raw = (import.meta as any)?.env?.VITE_API_URL as string;
  const base = raw || 'https://algobucks.onrender.com/api';
  return base.replace(/\/$/, '');
};

type LiveItem = {
  id: string;
  type: 'press' | 'tweet' | 'mention' | 'article' | 'status';
  title?: string;
  message: string;
  source?: string;
  url?: string;
  timestamp: string | number;
};

const formatTime = (ts: string | number) => {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleString();
};

// Removed type icon helper since we're not rendering curated press lists

const Press: React.FC = () => {
  const [liveItems, setLiveItems] = useState<LiveItem[]>([]);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);

  // Initial fetch and SSE subscription with polling fallback
  useEffect(() => {
    let es: EventSource | null = null;
    let pollTimer: number | null = null;
    let stopped = false;

    const base = getApiBase();

    const loadInitial = async () => {
      try {
        const res = await fetch(`${base}/press`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setLiveItems(data.slice(0, 50));
          }
        }
      } catch {}
    };

    const startPolling = () => {
      if (pollTimer) return;
      pollTimer = window.setInterval(async () => {
        try {
          const res = await fetch(`${base}/press?since=${encodeURIComponent(liveItems[0]?.timestamp || '')}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length) {
              setLiveItems(prev => {
                const merged = [...data, ...prev];
                return merged.slice(0, 50);
              });
            }
          }
        } catch {}
      }, 15000);
    };

    const startSSE = () => {
      try {
        es = new EventSource(`${base}/press/stream`);
        es.onopen = () => { setConnected(true); setConnecting(false); };
        es.onerror = () => {
          setConnected(false);
          setConnecting(false);
          // fallback to polling if SSE errors
          if (!stopped) startPolling();
        };
        es.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data) as LiveItem | LiveItem[];
            const arr = Array.isArray(msg) ? msg : [msg];
            if (arr.length) {
              setLiveItems(prev => {
                const merged = [...arr, ...prev];
                return merged.slice(0, 50);
              });
            }
          } catch {}
        };
      } catch {
        // If constructing EventSource fails (older browsers), fallback
        startPolling();
        setConnecting(false);
      }
    };

    loadInitial();
    startSSE();

    return () => {
      stopped = true;
      if (es) es.close();
      if (pollTimer) window.clearInterval(pollTimer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-slate-900 dark:text-green-200 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">Press</h1>
          <p className="text-sm sm:text-base text-slate-700 dark:text-green-300 max-w-2xl mx-auto px-4">
            Live updates and media contact for EarnByCode.
          </p>
        </div>

        {/* Live Updates */}
        <div className="mb-12 sm:mb-16">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2" /> Live Updates
            </h2>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${connected ? 'text-green-700 bg-green-50 border-green-200' : connecting ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-red-700 bg-red-50 border-red-200'}`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${connected ? 'bg-green-500 animate-pulse' : connecting ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`}></span>
              {connected ? 'Connected' : connecting ? 'Connecting…' : 'Offline'}
            </span>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-sky-200 dark:border-green-800 shadow-sm">
            {liveItems.length === 0 ? (
              <div className="p-4 sm:p-6 text-sm text-slate-600 dark:text-green-300 flex items-center">
                <Radio className="w-4 h-4 mr-2 text-slate-400" /> Waiting for updates…
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {liveItems.map(item => (
                  <li key={item.id} className="p-4 sm:p-5 hover:bg-blue-50/30 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {item.title && (
                          <h3 className="text-sm sm:text-base font-semibold text-gray-900 leading-snug">
                            {item.url ? (
                              <a href={item.url} target="_blank" rel="noreferrer" className="hover:text-blue-600 dark:hover:text-green-300">
                                {item.title}
                              </a>
                            ) : item.title}
                          </h3>
                        )}
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-green-300 mt-0.5 break-words">{item.message}</p>
                        <div className="text-xs text-slate-500 dark:text-green-400 mt-1 flex items-center gap-2">
                          {item.source && <span className="font-medium">{item.source}</span>}
                          <span>•</span>
                          <span>{formatTime(item.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {/* Media Contact (minimal) */}
        <div className="max-w-3xl mx-auto mt-12">
          <div className="rounded-lg border border-sky-200 dark:border-green-800 p-4 sm:p-6 bg-white dark:bg-gray-900">
            <h2 className="text-lg font-semibold mb-2">Media contact</h2>
            <p className="text-sm text-slate-700 dark:text-green-300 mb-3">For press or media inquiries, please reach out to our team.</p>
            <a href="mailto:replyearnbycode@gmail.com" className="inline-flex items-center text-sm text-sky-700 dark:text-green-300 underline">
              <Mail className="w-4 h-4 mr-1" /> replyearnbycode@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Press;