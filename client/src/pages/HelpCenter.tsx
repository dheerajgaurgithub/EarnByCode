import React, { useMemo, useState } from 'react';
import { Search, HelpCircle, MessageSquare, Mail, ChevronDown, ChevronUp, X, Send, Bot } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const HelpCenter = () => {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatOpen, setChatOpen] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    { role: 'assistant', text: 'Hi! I am the AlgoBucks Help Assistant. Ask me anything about this website—features, pages, navigation, submissions, contests, policies, or how to contact support.' },
  ]);
  const quickSuggestions = useMemo(
    () => [
      'Where can I see all my submissions?',
      'How do I join a contest?',
      'How to contact support?',
      'Where are the coding problems?',
      'What is the Press page?'
    ],
    []
  );

  // API base helper
  const getApiBase = () => {
    const raw = (import.meta as any)?.env?.VITE_API_URL as string;
    const base = raw || 'https://algobucks.onrender.com/api';
    return base.replace(/\/$/, '');
  };

  // FAQ categories and questions
  const faqCategories = [
    {
      id: 1,
      name: 'Getting Started',
      icon: '🚀',
      questions: [
        {
          id: 1,
          question: 'How do I create an account?',
          answer: 'To create an account, click on the "Sign Up" button in the top right corner and follow the registration process.'
        },
        {
          id: 2,
          question: 'Is there a free trial available?',
          answer: 'Yes, we offer a 14-day free trial for all new users to explore our platform.'
        },
        {
          id: 3,
          question: 'What are the system requirements?',
          answer: 'Our platform works on all modern web browsers. For the best experience, we recommend using the latest version of Chrome, Firefox, Safari, or Edge.'
        }
      ]
    },
    {
      id: 2,
      name: 'Account & Billing',
      icon: '💳',
      questions: [
        {
          id: 4,
          question: 'How do I update my payment method?',
          answer: 'You can update your payment method in the Billing section of your account settings.'
        },
        {
          id: 5,
          question: 'How do I cancel my subscription?',
          answer: 'You can cancel your subscription at any time in the Billing section of your account settings.'
        }
      ]
    },
    {
      id: 3,
      name: 'Trading & Algorithms',
      icon: '📊',
      questions: [
        {
          id: 6,
          question: 'How do I create a trading algorithm?',
          answer: 'Navigate to the Algorithms section and click "Create New Algorithm" to get started with our algorithm builder.'
        },
        {
          id: 7,
          question: 'What programming languages are supported?',
          answer: 'We currently support Python and JavaScript for algorithm development.'
        }
      ]
    },
    {
      id: 4,
      name: 'Troubleshooting',
      icon: '🔧',
      questions: [
        {
          id: 8,
          question: 'I forgot my password. How can I reset it?',
          answer: 'Click on "Forgot Password" on the login page and follow the instructions sent to your email.'
        },
        {
          id: 9,
          question: 'Why is my algorithm not executing?',
          answer: 'Check your algorithm for syntax errors and ensure all required parameters are set correctly.'
        }
      ]
    }
  ];

  // Filter questions based on search query
  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const toggleCategory = (categoryId: number) => {
    setActiveCategory(activeCategory === categoryId ? null : categoryId);
  };

  // Admin-only: Top Questions from localStorage
  const isAdmin = Boolean((user as any)?.role === 'admin' || (user as any)?.isAdmin === true);
  const [topFaqs, setTopFaqs] = useState<{ q: string; c: number }[]>([]);
  const [topFaqsVersion, setTopFaqsVersion] = useState(0);
  const [range, setRange] = useState<'all' | '7d' | '30d' | 'custom'>('all');
  const [fromISO, setFromISO] = useState<string>('');
  const [toISO, setToISO] = useState<string>('');
  const refreshTopFaqs = async () => {
    try {
      const params = new URLSearchParams();
      params.set('limit', '10');
      if (range === '7d') params.set('sinceDays', '7');
      else if (range === '30d') params.set('sinceDays', '30');
      else if (range === 'custom') {
        if (fromISO) params.set('from', fromISO);
        if (toISO) params.set('to', toISO);
      }
      const res = await fetch(`${getApiBase()}/analytics/faq/top?${params.toString()}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data?.ok && Array.isArray(data.items)) {
          setTopFaqs(data.items.map((it: any) => ({ q: String(it.question), c: Number(it.count || 0) })));
          return;
        }
      }
      // fallback to local
      const raw = localStorage.getItem('algobucks_help_faq_counts');
      if (raw) {
        const map: Record<string, number> = JSON.parse(raw);
        const arr = Object.entries(map).map(([q, c]) => ({ q, c: Number(c || 0) }))
          .sort((a, b) => b.c - a.c).slice(0, 10);
        setTopFaqs(arr);
      } else {
        setTopFaqs([]);
      }
    } catch {
      // fallback to local
      try {
        const raw = localStorage.getItem('algobucks_help_faq_counts');
        if (raw) {
          const map: Record<string, number> = JSON.parse(raw);
          const arr = Object.entries(map).map(([q, c]) => ({ q, c: Number(c || 0) }))
            .sort((a, b) => b.c - a.c).slice(0, 10);
          setTopFaqs(arr);
        } else {
          setTopFaqs([]);
        }
      } catch { setTopFaqs([]); }
    }
  };
  React.useEffect(() => { if (isAdmin) { refreshTopFaqs(); } }, [isAdmin, topFaqsVersion, range]);
  const clearTopFaqs = async () => {
    try { localStorage.removeItem('algobucks_help_faq_counts'); } catch {}
    setTopFaqsVersion(v => v + 1);
  };

  // --- Smart Chatbot: site-scoped knowledge base ---
  type KBItem = { title: string; content: string; href?: string; tags?: string[] };
  const knowledgeBase: KBItem[] = useMemo(() => [
    { title: 'Home', content: 'Landing page with overview and primary navigation to problems, contests, blog, community, help center.' , href: '/' },
    { title: 'Problems', content: 'Browse coding problems by difficulty and topic. Open a problem to see description, examples, constraints. Solve using the built-in editor and submit code.', href: '/problems', tags: ['practice','coding','editor','submit','examples','constraints'] },
    { title: 'Problem Detail & Submissions', content: 'On a problem page you can run code, run all tests, and submit. After Accepted, it counts toward your profile. Submissions history is available on the Submissions page and on your Profile.', href: '/problems', tags: ['submissions','accepted','run','tests','profile','history'] },
    { title: 'Contests', content: 'View and join coding contests. See status (upcoming, ongoing, completed), details, entry fee and prize (if any), participants, and problems. Enter a contest to compete and later see results.', href: '/contests', tags: ['compete','results','leaderboard'] },
    { title: 'Discuss', content: 'Community discussions to ask questions and share insights.', href: '/discuss', tags: ['community','questions','answers'] },
    { title: 'Leaderboard', content: 'See rankings of users based on points or performance.', href: '/leaderboard', tags: ['rank','points'] },
    { title: 'Submissions', content: 'List of your code submissions across problems with status, runtime, and details. You can view an individual submission.', href: '/submissions', tags: ['history','results','status'] },
    { title: 'Profile', content: 'Your user profile showing stats and solved problems. Submissions also appear here.', href: '/profile', tags: ['user','stats'] },
    { title: 'Settings', content: 'Manage account preferences including UI options and other settings.', href: '/settings', tags: ['preferences','account'] },
    { title: 'Help Center', content: 'FAQs, search help articles, and contact support.', href: '/help', tags: ['help','faq','support'] },
    { title: 'Contact', content: 'Contact form for inquiries.', href: '/contact', tags: ['support','form'] },
    { title: 'Press', content: 'Press & Media page with live updates and SSE-powered feed.', href: '/press', tags: ['media','news','updates'] },
    { title: 'Company', content: 'About AlgoBucks and team members with roles and profile links.', href: '/company', tags: ['about','team'] },
    { title: 'About', content: 'Overview of what AlgoBucks offers: challenges, community, contests, achievements.', href: '/about', tags: ['overview'] },
    { title: 'Blog', content: 'Articles with news, tutorials, and tips to get more out of AlgoBucks.', href: '/blog', tags: ['articles','tutorials','tips'] },
    { title: 'Privacy Policy', content: 'Learn how we handle your data and privacy.', href: '/privacy', tags: ['policy','privacy'] },
    { title: 'Terms of Service', content: 'Terms governing the use of AlgoBucks.', href: '/terms', tags: ['policy','terms'] },
    { title: 'Cookies Policy', content: 'Information about cookies used on the site.', href: '/cookies', tags: ['policy','cookies'] },
    // Targeted FAQs reflected in the app behavior
    { title: 'View all submissions', content: 'Use the Submissions page via the header or go to /submissions to view all your submissions and filter details.', href: '/submissions', tags: ['submissions','view all'] },
    { title: 'Contact support email', content: 'You can email support at coder9265@gmail.com or use the Contact page form.', href: '/contact', tags: ['support','email'] },
  ], []);

  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s/.-]+/g, ' ').replace(/\s+/g, ' ').trim();
  const answerQuestion = (q: string) => {
    const nq = normalize(q);
    // Out-of-scope guardrail: if user asks about unrelated topics, nudge back
    const siteKeywords = ['problem','problems','contest','discuss','discussion','leaderboard','submission','submissions','profile','settings','help','press','company','about','blog','privacy','terms','cookies','contact','pricing','price','support','login','register','signup','code','run','submit','timer'];
    const matchesSite = siteKeywords.some(k => nq.includes(k));

    // Quick navigational intents
    if (/pricing|price/.test(nq)) {
      return {
        text: 'We do not have a dedicated pricing page on this site. If you have billing or pricing questions, please reach out via the Contact page or email support at coder9265@gmail.com.',
        href: '/contact'
      };
    }

    if (/support|contact|help\s?(team|desk)?/.test(nq)) {
      return {
        text: 'You can contact support using the Contact page or by emailing coder9265@gmail.com.',
        href: '/contact'
      };
    }

    // Score knowledge base with simple keyword overlap
    const weights = (item: KBItem) => {
      const text = normalize(`${item.title} ${item.content} ${(item.tags||[]).join(' ')}`);
      let score = 0;
      const qWords = nq.split(' ').filter(Boolean);
      for (const w of qWords) {
        if (w.length < 2) continue;
        if (text.includes(w)) score += 2; // basic overlap
      }
      // small bonus for title hits
      const nt = normalize(item.title);
      for (const w of qWords) if (nt.includes(w)) score += 1;
      return score;
    };

    const ranked = knowledgeBase
      .map(item => ({ item, score: weights(item) }))
      .sort((a, b) => b.score - a.score);

    const top = ranked[0];
    if (top && top.score > 0) {
      const best = top.item;
      return {
        text: `${best.title}: ${best.content}` + (best.href ? ` (Go to ${best.href})` : ''),
        href: best.href
      };
    }

    // If not obviously site-related, respond with scope message
    if (!matchesSite) {
      return {
        text: 'I can help with AlgoBucks only (pages, features, navigation, and policies). Could you rephrase your question about this website?',
      };
    }

    return { text: 'I could not find an exact answer. Try asking about problems, submissions, contests, profile, or policies. You can also visit the Help Center categories above or the Contact page.' };
  };

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

  const sendMessage = () => {
    const q = chatInput.trim();
    if (!q) return;
    try {
      // anonymous FAQ logging in localStorage
      const KEY = 'algobucks_help_faq_counts';
      const raw = localStorage.getItem(KEY);
      const map: Record<string, number> = raw ? JSON.parse(raw) : {};
      const key = normalize(q).slice(0, 120) || 'unknown';
      map[key] = (map[key] || 0) + 1;
      localStorage.setItem(KEY, JSON.stringify(map));
    } catch {}
    // backend log
    logFaqToBackend(normalize(q));
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    const ans = answerQuestion(q);
    const reply = ans.href ? `${ans.text}` : ans.text;
    setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    setChatInput('');
  };

  const sendSuggestion = (s: string) => {
    setChatInput(s);
    // slight defer to ensure state updates before sending
    setTimeout(() => {
      const prev = s;
      if (!prev) return;
      try {
        const KEY = 'algobucks_help_faq_counts';
        const raw = localStorage.getItem(KEY);
        const map: Record<string, number> = raw ? JSON.parse(raw) : {};
        const key = normalize(prev).slice(0, 120) || 'unknown';
        map[key] = (map[key] || 0) + 1;
        localStorage.setItem(KEY, JSON.stringify(map));
      } catch {}
      // backend log
      logFaqToBackend(normalize(prev));
      setMessages(p => [...p, { role: 'user', text: prev }]);
      const ans = answerQuestion(prev);
      const reply = ans.href ? `${ans.text}` : ans.text;
      setMessages(p => [...p, { role: 'assistant', text: reply }]);
      setChatInput('');
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 sm:-top-40 -right-24 sm:-right-32 w-64 sm:w-80 h-64 sm:h-80 bg-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 sm:-bottom-40 -left-24 sm:-left-32 w-64 sm:w-80 h-64 sm:h-80 bg-indigo-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10 lg:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3 sm:mb-4 leading-tight">
            How can we help you?
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl lg:max-w-3xl mx-auto px-2">
            Find answers to common questions or get in touch with our support team.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-xl sm:max-w-2xl mx-auto mb-8 sm:mb-10 lg:mb-12 relative">
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search help articles..."
              className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 bg-white border-2 border-blue-100 rounded-xl sm:rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200 text-sm sm:text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-10 lg:mb-12">
          {filteredCategories.map((category) => (
            <div key={category.id} className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
              <button
                className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between text-left hover:bg-blue-50/50 transition-colors duration-200"
                onClick={() => toggleCategory(category.id)}
              >
                <div className="flex items-center min-w-0 flex-1">
                  <span className="text-xl sm:text-2xl mr-2 sm:mr-3 flex-shrink-0">{category.icon}</span>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{category.name}</h2>
                  <span className="ml-2 text-xs sm:text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium flex-shrink-0">
                    {category.questions.length}
                  </span>
                </div>
                <div className="ml-2 flex-shrink-0">
                  {activeCategory === category.id ? (
                    <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                  )}
                </div>
              </button>
              
              {activeCategory === category.id && (
                <div className="px-4 sm:px-6 pb-3 sm:pb-4 pt-0 sm:pt-2">
                  <div className="space-y-3 sm:space-y-4">
                    {category.questions.map((q) => (
                      <div key={q.id} className="border-l-3 border-l-4 border-blue-500 pl-3 sm:pl-4 py-2 bg-blue-50/30 rounded-r-lg">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base mb-1 sm:mb-2 leading-snug">{q.question}</h3>
                        <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{q.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* No results message */}
        {searchQuery && filteredCategories.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <Search className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
            </div>
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 text-sm sm:text-base mb-4">
              We couldn't find any help articles matching "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base"
            >
              Clear search and view all articles
            </button>
          </div>
        )}

        {/* Contact Support */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/20 backdrop-blur-sm mb-4 sm:mb-6">
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3">Still need help?</h2>
            <p className="text-blue-100 text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 max-w-xl lg:max-w-2xl mx-auto leading-relaxed px-2">
              Our support team is here to help you with any questions or issues you might have.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
              <a
                href="mailto:coder9265@gmail.com"
                className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-white text-blue-600 font-semibold rounded-xl sm:rounded-2xl hover:bg-blue-50 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base"
              >
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Email Support
              </a>
              <a
                href="/contact"
                className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-2 border-white/30 text-white font-semibold rounded-xl sm:rounded-2xl hover:bg-white/10 hover:border-white/50 transition-all duration-300 flex items-center justify-center backdrop-blur-sm text-sm sm:text-base"
              >
                <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Contact Form
              </a>
            </div>
          </div>
        </div>

        {/* Quick help links - Mobile optimized */}
        <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-blue-100 hover:border-blue-200 transition-colors">
            <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">📚</div>
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 sm:mb-2">Documentation</h3>
            <p className="text-gray-600 text-xs sm:text-sm">Comprehensive guides and API references</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-blue-100 hover:border-blue-200 transition-colors">
            <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">💬</div>
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 sm:mb-2">Community</h3>
            <p className="text-gray-600 text-xs sm:text-sm">Join discussions with other users</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-blue-100 hover:border-blue-200 transition-colors sm:col-span-2 lg:col-span-1">
            <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">🎥</div>
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 sm:mb-2">Video Tutorials</h3>
            <p className="text-gray-600 text-xs sm:text-sm">Step-by-step video guides</p>
          </div>
        </div>
      </div>
      {/* Floating Chatbot */}
      <div className="fixed bottom-4 right-4 z-40">
        {/* Toggle button on small screens */}
        {!chatOpen && (
          <button onClick={() => setChatOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-sky-600 text-white rounded-full shadow-lg">
            <Bot className="w-4 h-4" /> Chat
          </button>
        )}

        {chatOpen && (
          <div className="w-[92vw] max-w-md bg-white dark:bg-gray-900 border border-sky-200 dark:border-green-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-3 py-2 bg-sky-50 dark:bg-gray-800 border-b border-sky-200 dark:border-green-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-sky-600 dark:text-green-400" />
                <span className="text-sm font-semibold">AlgoBucks Help Assistant</span>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-slate-500 hover:text-slate-700 dark:text-green-300 dark:hover:text-green-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Quick suggestions */}
            <div className="px-3 py-2 flex flex-wrap gap-2 border-b border-sky-200 dark:border-green-800 bg-white dark:bg-gray-900">
              {quickSuggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => sendSuggestion(s)}
                  className="text-xs px-2 py-1 rounded-full bg-sky-100 hover:bg-sky-200 text-sky-700 dark:bg-green-900/40 dark:hover:bg-green-900/60 dark:text-green-300"
                  title={s}
                >
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
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
                placeholder="Ask about pages, submissions, contests, policies..."
                className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-sky-200 dark:border-green-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button onClick={sendMessage} className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm inline-flex items-center gap-1">
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="px-3 py-2 bg-slate-50 dark:bg-gray-800 text-[11px] text-slate-500 dark:text-green-300 border-t border-sky-200 dark:border-green-800">
              Responses are based only on AlgoBucks website content. For further help, see <a href="/contact" className="underline">/contact</a>.
            </div>
          </div>
        )}
      </div>
      {isAdmin && (
        <div className="fixed bottom-4 left-4 z-40 w-[92vw] max-w-md bg-white dark:bg-gray-900 border border-sky-200 dark:border-green-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-3 py-2 bg-slate-100 dark:bg-gray-800 border-b border-sky-200 dark:border-green-800 flex items-center justify-between">
            <span className="text-sm font-semibold">Top Questions (analytics)</span>
            <div className="flex items-center gap-2">
              <select value={range} onChange={(e)=>setRange(e.target.value as any)} className="text-xs border rounded px-1 py-0.5 bg-white dark:bg-gray-900 border-slate-300 dark:border-green-800">
                <option value="all">All time</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="custom">Custom</option>
              </select>
              {range === 'custom' && (
                <>
                  <input type="datetime-local" value={fromISO} onChange={(e)=>setFromISO(e.target.value)} className="text-xs border rounded px-1 py-0.5 bg-white dark:bg-gray-900 border-slate-300 dark:border-green-800" />
                  <input type="datetime-local" value={toISO} onChange={(e)=>setToISO(e.target.value)} className="text-xs border rounded px-1 py-0.5 bg-white dark:bg-gray-900 border-slate-300 dark:border-green-800" />
                  <button onClick={()=>setTopFaqsVersion(v=>v+1)} className="text-xs px-2 py-1 rounded bg-sky-600 text-white hover:bg-sky-700">Apply</button>
                </>
              )}
              <button onClick={clearTopFaqs} className="text-xs px-2 py-1 rounded bg-slate-600 text-white hover:bg-slate-700">Clear Local</button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto px-3 py-2">
            {topFaqs.length === 0 ? (
              <p className="text-xs text-slate-500">No data yet.</p>
            ) : (
              <ul className="space-y-2">
                {topFaqs.map((t, i) => (
                  <li key={i} className="text-xs"><span className="font-semibold mr-2">{t.c}×</span>{t.q}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="px-3 py-2 bg-slate-50 dark:bg-gray-800 text-[11px] text-slate-500 dark:text-green-300 border-t border-sky-200 dark:border-green-800">
            Visible to admins only; data is fetched from the analytics API. Local counters are used as fallback.
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpCenter;