import React from 'react';
import { Bot, Send, X } from 'lucide-react';

// Reusable global chatbot widget for site-scoped Q&A
// - Responsive, floating bottom-right
// - Excludes problem-detail and contest pages by mounting conditions in App
// - Uses improved matching and backend logging

type Message = { role: 'user' | 'assistant'; text: string };

type KBItem = { title: string; content: string; href?: string; tags?: string[] };

const normalize = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9\s/.-]+/g, ' ').replace(/\s+/g, ' ').trim();

const getApiBase = () => {
  const raw = (import.meta as any)?.env?.VITE_API_URL as string;
  const base = raw || 'https://algobucks.onrender.com/api';
  return base.replace(/\/$/, '');
};

const useKnowledgeBase = (): KBItem[] => {
  // Centralized site-scoped knowledge
  return React.useMemo(
    () => [
      { title: 'Home', content: 'Landing page with overview and primary navigation to problems, contests, blog, community, help center.' , href: '/' },
      { title: 'Problems', content: 'Browse coding problems by difficulty and topic. Open a problem to see description, examples, constraints. Solve using the built-in editor and submit code.', href: '/problems', tags: ['practice','coding','editor','submit','examples','constraints'] },
      { title: 'Problem Detail & Submissions', content: 'On a problem page you can run code, run all tests, and submit. After Accepted, it counts toward your profile. Submissions history is available on the Submissions page and on your Profile.', href: '/problems', tags: ['submissions','accepted','run','tests','profile','history'] },
      { title: 'Contests', content: 'View and join coding contests. See status (upcoming, ongoing, completed), details, entry fee and prize (if any), participants, and problems. Enter a contest to compete and later see results.', href: '/contests', tags: ['compete','results','leaderboard','ranking','timer'] },
      { title: 'Discuss', content: 'Community discussions to ask questions and share insights.', href: '/discuss', tags: ['community','questions','answers','help'] },
      { title: 'Leaderboard', content: 'See rankings of users based on points or performance.', href: '/leaderboard', tags: ['rank','points','scores'] },
      { title: 'Submissions', content: 'List of your code submissions across problems with status, runtime, and details. You can view an individual submission.', href: '/submissions', tags: ['history','results','status'] },
      { title: 'Profile', content: 'Your user profile showing stats and solved problems.', href: '/profile', tags: ['user','stats'] },
      { title: 'Settings', content: 'Manage account preferences including UI options and other settings.', href: '/settings', tags: ['preferences','account'] },
      { title: 'Help Center', content: 'FAQs, search help articles, and contact support.', href: '/help', tags: ['help','faq','support'] },
      { title: 'Contact', content: 'Contact form for inquiries.', href: '/contact', tags: ['support','form','email','press'] },
      { title: 'Press', content: 'Press & Media page with live updates and SSE-powered feed.', href: '/press', tags: ['media','news','updates'] },
      { title: 'Company', content: 'About AlgoBucks and team members with roles and profile links.', href: '/company', tags: ['about','team','founder','ceo'] },
      { title: 'About', content: 'Overview of what AlgoBucks offers: challenges, community, contests, achievements.', href: '/about', tags: ['overview','features'] },
      { title: 'Blog', content: 'Articles with news, tutorials, and tips to get more out of AlgoBucks.', href: '/blog', tags: ['articles','tutorials','tips'] },
      { title: 'Privacy Policy', content: 'Learn how we handle your data and privacy.', href: '/privacy', tags: ['policy','privacy'] },
      { title: 'Terms of Service', content: 'Terms governing the use of AlgoBucks.', href: '/terms', tags: ['policy','terms'] },
      { title: 'Cookies Policy', content: 'Information about cookies used on the site.', href: '/cookies', tags: ['policy','cookies'] },
      { title: 'Support Email', content: 'You can email support at coder9265@gmail.com or use the Contact page form.', href: '/contact', tags: ['support','email'] },
    ],
    []
  );
};

const scoreItem = (item: KBItem, nq: string) => {
  // Improved scoring: unigram + bigram overlap + tag boosts + title boost
  const text = normalize(`${item.title} ${item.content} ${(item.tags||[]).join(' ')}`);
  const qWords = nq.split(' ').filter(Boolean);
  let score = 0;
  // unigram
  for (const w of qWords) { if (w.length >= 2 && text.includes(w)) score += 2; }
  // bigrams
  for (let i = 0; i < qWords.length - 1; i++) {
    const bg = `${qWords[i]} ${qWords[i+1]}`;
    if (text.includes(bg)) score += 3;
  }
  // tag hits heavier
  const tagText = normalize((item.tags || []).join(' '));
  for (const w of qWords) { if (w.length >= 2 && tagText.includes(w)) score += 2; }
  // title boost
  const nt = normalize(item.title);
  for (const w of qWords) if (nt.includes(w)) score += 1;
  return score;
};

const ChatbotWidget: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<Message[]>([
    { role: 'assistant', text: 'Hi! I can help with AlgoBucks pages, features, navigation, submissions, contests, and policies. Ask me a question.' },
  ]);
  const kb = useKnowledgeBase();

  const quick = React.useMemo(() => [
    'Where are the problems?',
    'How do I see my submissions?',
    'How to join contests?',
    'How to contact support?',
  ], []);

  const logFaqToBackend = async (q: string) => {
    try {
      await fetch(`${getApiBase()}/analytics/faq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
        credentials: 'include',
      });
    } catch {}
  };

  const answer = (q: string) => {
    const nq = normalize(q);
    // guardrails: site scope only
    const siteKeywords = ['problem','contest','discuss','leaderboard','submission','profile','settings','help','press','company','about','blog','privacy','terms','cookies','contact','pricing','price','support','login','register','signup','code','run','submit','timer','wallet'];
    const matchesSite = siteKeywords.some(k => nq.includes(k));

    // navigational quick answers
    if (/pricing|price/.test(nq)) {
      return { text: 'We do not have a dedicated pricing page. For billing or pricing questions, please contact us via the Contact page or email coder9265@gmail.com.', href: '/contact' };
    }
    if (/support|contact|help\s?(team|desk)?/.test(nq)) {
      return { text: 'You can contact support on the Contact page or via email at coder9265@gmail.com.', href: '/contact' };
    }
    if (/submissions?/.test(nq) && /where|view|see|find/.test(nq)) {
      return { text: 'See all your submissions on the Submissions page. Each problem page also shows your recent submissions.', href: '/submissions' };
    }

    // KB ranking
    const ranked = kb.map(i => ({ i, s: scoreItem(i, nq) })).sort((a, b) => b.s - a.s);
    const top = ranked[0];
    if (top && top.s > 0) {
      return { text: `${top.i.title}: ${top.i.content}` + (top.i.href ? ` (Go to ${top.i.href})` : ''), href: top.i.href };
    }

    if (!matchesSite) {
      return { text: 'I can help with AlgoBucks only. Please ask about our pages, features, navigation, submissions, contests, or policies.' };
    }

    return { text: 'I could not find an exact answer. Try asking about problems, submissions, contests, profile, or policies, or visit the Help Center.' };
  };

  const send = (qRaw?: string) => {
    const q = (qRaw ?? input).trim();
    if (!q) return;
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    const ans = answer(q);
    setMessages(prev => [...prev, { role: 'assistant', text: ans.text }]);
    setInput('');
    // log
    logFaqToBackend(normalize(q));
  };

  return (
    <div className="fixed z-40 right-4 bottom-4">
      {!open && (
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-sky-600 text-white rounded-full shadow-lg">
          <Bot className="w-4 h-4" /> Chat
        </button>
      )}
      {open && (
        <div className="w-[92vw] max-w-md bg-white dark:bg-gray-900 border border-sky-200 dark:border-green-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-3 py-2 bg-sky-50 dark:bg-gray-800 border-b border-sky-200 dark:border-green-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-sky-600 dark:text-green-400" />
              <span className="text-sm font-semibold">AlgoBucks Assistant</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-700 dark:text-green-300 dark:hover:text-green-100">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-3 py-2 flex flex-wrap gap-2 border-b border-sky-200 dark:border-green-800 bg-white dark:bg-gray-900">
            {quick.map((s, idx) => (
              <button key={idx} onClick={() => send(s)} className="text-xs px-2 py-1 rounded-full bg-sky-100 hover:bg-sky-200 text-sky-700 dark:bg-green-900/40 dark:hover:bg-green-900/60 dark:text-green-300">
                {s}
              </button>
            ))}
          </div>
          <div className="h-64 overflow-y-auto px-3 py-3 space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <div className={`inline-block max-w-[85%] px-3 py-2 rounded-xl text-sm ${m.role === 'user' ? 'bg-sky-600 text-white rounded-br-sm' : 'bg-slate-100 dark:bg-gray-800 text-slate-800 dark:text-green-200 rounded-bl-sm'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-2 border-t border-sky-200 dark:border-green-800 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              placeholder="Ask about pages, submissions, contests, policies..."
              className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-sky-200 dark:border-green-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button onClick={() => send()} className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm inline-flex items-center gap-1">
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="px-3 py-2 bg-slate-50 dark:bg-gray-800 text-[11px] text-slate-500 dark:text-green-300 border-t border-sky-200 dark:border-green-800">
            Answers are based only on AlgoBucks content. For more help see /help or /contact.
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;
