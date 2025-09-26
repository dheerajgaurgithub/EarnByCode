import React, { useEffect, useState } from 'react';
import { Newspaper, Mic, Tv, Award as AwardIcon, Download, Activity, Radio } from 'lucide-react';

type PressItem = {
  id: string;
  title: string;
  source: string;
  date: string;
  type: 'article' | 'podcast' | 'video' | 'award';
  url: string;
  excerpt: string;
};

const pressItems: PressItem[] = [
  {
    id: '1',
    title: 'CodeArena Raises $10M Series A to Expand Coding Competition Platform',
    source: 'TechCrunch',
    date: 'June 15, 2023',
    type: 'article',
    url: 'https://techcrunch.com/codearena-series-a',
    excerpt: 'CodeArena, the popular platform for coding competitions, has raised $10 million in Series A funding led by Sequoia Capital to expand its developer tools and global reach.'
  },
  {
    id: '2',
    title: 'How CodeArena is Revolutionizing Technical Hiring',
    source: 'The Verge',
    date: 'April 2, 2023',
    type: 'article',
    url: 'https://theverge.com/codearena-hiring',
    excerpt: 'With its unique approach to assessing coding skills through real-world challenges, CodeArena is changing how companies identify and hire top technical talent.'
  },
  {
    id: '3',
    title: 'The Future of Coding Education: Interview with CodeArena CEO',
    source: 'Software Engineering Daily',
    date: 'March 18, 2023',
    type: 'podcast',
    url: 'https://softwareengineeringdaily.com/codearena-interview',
    excerpt: 'In this episode, we sit down with the CEO of CodeArena to discuss the future of coding education and how competitive programming is evolving.'
  },
  {
    id: '4',
    title: 'CodeArena Wins 2023 Best Educational Platform Award',
    source: 'EdTech Breakthrough',
    date: 'February 5, 2023',
    type: 'award',
    url: 'https://edtechbreakthrough.com/winners/codearena-2023',
    excerpt: 'CodeArena has been recognized as the Best Educational Platform in the 2023 EdTech Breakthrough Awards for its innovative approach to coding education.'
  },
  {
    id: '5',
    title: 'How CodeArena is Helping Developers Land Their Dream Jobs',
    source: 'Forbes',
    date: 'January 22, 2023',
    type: 'article',
    url: 'https://forbes.com/codearena-careers',
    excerpt: 'With its unique blend of learning and competition, CodeArena is helping developers at all levels improve their skills and connect with top tech companies.'
  },
  {
    id: '6',
    title: 'CodeArena Featured on Tech Today',
    source: 'CNBC',
    date: 'December 10, 2022',
    type: 'video',
    url: 'https://cnbc.com/techtoday/codearena-feature',
    excerpt: 'CNBC takes a closer look at how CodeArena is transforming the way developers learn and compete in the tech industry.'
  }
];

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

const getIconForType = (type: PressItem['type']) => {
  switch (type) {
    case 'article':
      return <Newspaper className="w-4 h-4 sm:w-5 sm:h-5" />;
    case 'podcast':
      return <Mic className="w-4 h-4 sm:w-5 sm:h-5" />;
    case 'video':
      return <Tv className="w-4 h-4 sm:w-5 sm:h-5" />;
    case 'award':
      return <AwardIcon className="w-4 h-4 sm:w-5 sm:h-5" />;
    default:
      return <Newspaper className="w-4 h-4 sm:w-5 sm:h-5" />;
  }
};

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
    <div className="min-h-screen bg-gray-50 text-gray-900 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900">Press & Media</h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Latest news, press releases, and media resources about CodeArena.
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
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {liveItems.length === 0 ? (
              <div className="p-4 sm:p-6 text-sm text-gray-500 flex items-center">
                <Radio className="w-4 h-4 mr-2 text-gray-400" /> Waiting for updates…
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
                              <a href={item.url} target="_blank" rel="noreferrer" className="hover:text-blue-600">
                                {item.title}
                              </a>
                            ) : item.title}
                          </h3>
                        )}
                        <p className="text-xs sm:text-sm text-gray-700 mt-0.5 break-words">{item.message}</p>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
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

        {/* Press Kit */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg sm:rounded-xl p-6 sm:p-8 mb-12 sm:mb-16 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-white">Press Kit</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 sm:p-6 rounded-lg border border-white border-opacity-20">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">Brand Assets</h3>
                <p className="text-blue-100 text-sm sm:text-base mb-3 sm:mb-4">Download our logos and brand guidelines for media use.</p>
                <div className="space-y-2">
                  <a 
                    href="/press/codearena-brand-assets.zip" 
                    className="flex items-center text-blue-200 hover:text-white transition-colors text-sm sm:text-base"
                    download
                  >
                    <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>Download Brand Assets (ZIP)</span>
                  </a>
                </div>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 sm:p-6 rounded-lg border border-white border-opacity-20">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">Media Inquiries</h3>
                <p className="text-blue-100 text-sm sm:text-base mb-3 sm:mb-4">
                  For press inquiries, please contact our media relations team at:
                </p>
                <a 
                  href="mailto:press@algobucks.com" 
                  className="text-blue-200 hover:text-white transition-colors text-sm sm:text-base break-all"
                >
                  press@algobucks.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Press Releases */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-gray-900">Press Releases</h2>
          <div className="space-y-4 sm:space-y-6">
            {pressItems
              .filter(item => item.type === 'article' || item.type === 'award')
              .map((item) => (
                <a 
                  key={item.id} 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <div className="bg-white rounded-lg p-4 sm:p-6 hover:bg-blue-50 transition-colors border border-gray-200 shadow-sm hover:shadow-md">
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="text-blue-600 mt-1 flex-shrink-0">
                        {getIconForType(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 mb-2">
                          <span className="font-medium">{item.source}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{item.date}</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors leading-tight">
                          {item.title}
                        </h3>
                        <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{item.excerpt}</p>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
          </div>
        </div>

        {/* Media Appearances */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-gray-900">Media Appearances</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {pressItems
              .filter(item => item.type === 'podcast' || item.type === 'video')
              .map((item) => (
                <a 
                  key={item.id} 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <div className="bg-white rounded-lg p-4 sm:p-6 h-full hover:bg-blue-50 transition-colors border border-gray-200 shadow-sm hover:shadow-md">
                    <div className="flex items-center mb-3 space-x-3">
                      <div className="text-blue-600 flex-shrink-0">
                        {getIconForType(item.type)}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 min-w-0">
                        <span className="font-medium">{item.source}</span>
                        <span className="mx-1">•</span>
                        <span>{item.date}</span>
                      </div>
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{item.excerpt}</p>
                  </div>
                </a>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Press;