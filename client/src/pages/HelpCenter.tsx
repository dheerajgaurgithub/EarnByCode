import React, { useMemo, useState } from 'react';
import { Search, HelpCircle, MessageSquare, Mail, ChevronDown, ChevronUp, X, Send, Bot } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const HelpCenter = () => {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    { role: 'assistant', text: 'Hi! I am the EarnByCode Help Assistant. Ask me anything about this website—features, pages, navigation, submissions, contests, policies, or how to contact support.' },
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
    const base = raw || 'https://earnbycode-mfs3.onrender.com/api';
    return base.replace(/\/$/, '');
  };

  // FAQ categories and questions (focused on web application)
  const faqCategories = [
    {
      id: 1,
      name: 'Getting Started',
      icon: '🚀',
      questions: [
        {
          id: 1,
          question: 'How do I create an account?',
          answer: 'Click Sign Up in the header or go to /register, then confirm your email to get started.'
        },
        {
          id: 2,
          question: 'Where do I find coding problems?',
          answer: 'Go to the Problems page (/problems). Open any problem to see its description, examples, and constraints.'
        },
        {
          id: 3,
          question: 'What browsers are supported?',
          answer: 'EarnByCode works on modern browsers (Chrome, Firefox, Safari, Edge). Keep your browser updated for the best experience.'
        },
        {
          id: 11,
          question: 'How do I verify my email?',
          answer: 'After registering, check your inbox for a verification link. You can also visit /verify-email if prompted.'
        }
      ]
    },
    {
      id: 2,
      name: 'Problems & Submissions',
      icon: '💻',
      questions: [
        {
          id: 4,
          question: 'How do I submit a solution?',
          answer: 'Open a problem from /problems, write code in the editor, run tests, then click Submit. Accepted submissions count toward your profile.'
        },
        {
          id: 5,
          question: 'Where can I see all my submissions?',
          answer: 'Visit /submissions to view all your submissions with status and details. Recent submissions also appear on the problem page and on your Profile.'
        },
        {
          id: 12,
          question: 'Why is my submission failing hidden tests?',
          answer: 'Ensure you follow the exact input/output format, handle edge cases (empty arrays, large inputs), and respect constraints and time limits.'
        }
      ]
    },
    {
      id: 3,
      name: 'Contests',
      icon: '🏁',
      questions: [
        {
          id: 6,
          question: 'How do I join a contest?',
          answer: 'Go to /contests, open a contest, and click Join. During the contest, solve the listed problems and your ranking will appear in results.'
        },
        {
          id: 7,
          question: 'Where can I see contest results?',
          answer: 'After a contest ends, results are visible on the contest page and the leaderboard.'
        },
        {
          id: 13,
          question: 'Is there a contest timer?',
          answer: 'Contests display timers on their pages. Make sure to submit solutions before time runs out.'
        }
      ]
    },
    {
      id: 4,
      name: 'Account & Support',
      icon: '🛠️',
      questions: [
        {
          id: 8,
          question: 'How do I change my settings?',
          answer: 'Open /settings to update your preferences. Your profile stats are on /profile.'
        },
        {
          id: 15,
          question: 'How do I change my password?',
          answer: 'Go to /settings (Security section) to change your password. If you forgot it, use the Forgot Password link on the Login page.'
        },
        {
          id: 16,
          question: 'How do I delete my account?',
          answer: 'Request account deletion from /settings (Account section). Deletion may be irreversible and may remove submissions and contest history.'
        },
        {
          id: 9,
          question: 'How do I contact support?',
          answer: 'Use the Contact page (/contact) or email replyearnbycode@gmail.com.'
        },
        {
          id: 10,
          question: 'Where can I read your policies?',
          answer: 'See /privacy, /terms, and /cookies for our policies.'
        },
        {
          id: 14,
          question: 'How do I report a bug?',
          answer: 'Share details on the Contact page (/contact) or email replyearnbycode@gmail.com with steps to reproduce.'
        },
        {
          id: 17,
          question: 'How do I add or update my bank details?',
          answer: 'Go to /wallet to manage wallet and payouts. Add or update bank details in the Wallet/Bank section. Ensure IFSC/UPI are correct before saving.'
        },
        {
          id: 18,
          question: 'How do I update my profile?',
          answer: 'Open /profile to edit your bio, links, and other fields. Some fields are editable under /settings as well.'
        },
        {
          id: 19,
          question: 'How do I change preferences and theme?',
          answer: 'Go to /settings. Under Preferences, you can change language, timezone, editor options, and theme (light/dark/auto).'
        },
        {
          id: 20,
          question: 'How do I enable notifications?',
          answer: 'In /settings, enable email notifications such as contest reminders and submission results. Browser push notifications may also be available if prompted.'
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
    { title: 'Company', content: 'About EarnByCode and team members with roles and profile links.', href: '/company', tags: ['about','team'] },
    { title: 'About', content: 'Overview of what EarnByCode offers: challenges, community, contests, achievements.', href: '/about', tags: ['overview'] },
    { title: 'Blog', content: 'Articles with news, tutorials, and tips to get more out of EarnByCode.', href: '/blog', tags: ['articles','tutorials','tips'] },
    { title: 'Privacy Policy', content: 'Learn how we handle your data and privacy.', href: '/privacy', tags: ['policy','privacy'] },
    { title: 'Terms of Service', content: 'Terms governing the use of EarnByCode.', href: '/terms', tags: ['policy','terms'] },
    { title: 'Cookies Policy', content: 'Information about cookies used on the site.', href: '/cookies', tags: ['policy','cookies'] },
    // Targeted FAQs reflected in the app behavior
    { title: 'View all submissions', content: 'Use the Submissions page via the header or go to /submissions to view all your submissions and filter details.', href: '/submissions', tags: ['submissions','view all'] },
    { title: 'Contact support email', content: 'You can email support at replyearnbycode@gmail.com or use the Contact page form.', href: '/contact', tags: ['support','email'] },
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
        text: 'We do not have a dedicated pricing page on this site. If you have billing or pricing questions, please reach out via the Contact page or email support at replyearnbycode@gmail.com.',
        href: '/contact'
      };
    }

    if (/support|contact|help\s?(team|desk)?/.test(nq)) {
      return {
        text: 'You can contact support using the Contact page or by emailing replyearnbycode@gmail.com.',
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
        text: 'I can help with EarnByCode only (pages, features, navigation, and policies). Could you rephrase your question about this website?',
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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white dark:from-gray-950 dark:to-gray-900 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-sky-100 dark:bg-green-900/30 mb-4">
            <HelpCircle className="w-7 h-7 sm:w-8 sm:h-8 text-sky-600 dark:text-green-400" />
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-green-100 mb-2">
            Help Center
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-green-300 max-w-xl mx-auto leading-relaxed">
            Find answers about using EarnByCode, or contact our support team for assistance.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-lg sm:max-w-xl lg:max-w-2xl mx-auto mb-6 sm:mb-8 lg:mb-10">
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-sky-400 dark:text-green-500" />
            <input
              type="text"
              placeholder="Search help articles..."
              className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5 bg-white dark:bg-gray-900 border border-sky-200 dark:border-green-800 rounded-xl text-gray-900 dark:text-green-100 placeholder-sky-400 dark:placeholder-green-500 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-green-600 focus:border-sky-500 dark:focus:border-green-600 shadow-sm transition-all duration-200 text-xs sm:text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-sky-400 dark:text-green-500 hover:text-sky-600 dark:hover:text-green-400 transition-colors"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 lg:mb-10">
          {filteredCategories.map((category) => (
            <div key={category.id} className="bg-white dark:bg-gray-900 rounded-xl border border-sky-200 dark:border-green-800 shadow-sm hover:shadow-md dark:hover:shadow-green-900/20 transition-all duration-200 overflow-hidden">
              <button
                className="w-full px-4 sm:px-5 lg:px-6 py-3 sm:py-4 flex items-center justify-between text-left hover:bg-sky-50 dark:hover:bg-green-900/20 transition-colors duration-200"
                onClick={() => toggleCategory(category.id)}
              >
                <div className="flex items-center min-w-0 flex-1">
                  <span className="text-lg sm:text-xl mr-2 sm:mr-3 flex-shrink-0">{category.icon}</span>
                  <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-green-100 truncate">{category.name}</h2>
                  <span className="ml-2 text-xs bg-sky-100 dark:bg-green-900/40 text-sky-700 dark:text-green-300 px-2 py-1 rounded-full font-medium flex-shrink-0">
                    {category.questions.length}
                  </span>
                </div>
                <div className="ml-2 flex-shrink-0">
                  {activeCategory === category.id ? (
                    <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-sky-500 dark:text-green-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-sky-500 dark:text-green-400" />
                  )}
                </div>
              </button>
              
              {activeCategory === category.id && (
                <div className="px-4 sm:px-5 lg:px-6 pb-3 sm:pb-4 pt-1 sm:pt-2">
                  <div className="space-y-3 sm:space-y-4">
                    {category.questions.map((q) => (
                      <div key={q.id} className="border-l-4 border-sky-400 dark:border-green-500 pl-3 sm:pl-4 py-2 sm:py-3 bg-sky-50/50 dark:bg-green-900/10 rounded-r-lg">
                        <h3 className="font-medium text-gray-900 dark:text-green-100 text-xs sm:text-sm lg:text-base mb-1 sm:mb-2 leading-snug">{q.question}</h3>
                        <p className="text-gray-600 dark:text-green-300 text-xs sm:text-sm lg:text-base leading-relaxed">{q.answer}</p>
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
          <div className="text-center py-6 sm:py-8 lg:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mx-auto mb-4 bg-sky-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Search className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-sky-500 dark:text-green-400" />
            </div>
            <h3 className="text-base sm:text-lg lg:text-xl font-medium text-gray-900 dark:text-green-100 mb-2">No results found</h3>
            <p className="text-gray-600 dark:text-green-300 text-xs sm:text-sm lg:text-base mb-4">
              We couldn't find any help articles matching "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-sky-600 dark:text-green-400 hover:text-sky-700 dark:hover:text-green-300 font-medium text-xs sm:text-sm lg:text-base"
            >
              Clear search and view all articles
            </button>
          </div>
        )}

        {/* Contact Support */}
        <div className="rounded-xl p-4 sm:p-6 border border-sky-200 dark:border-green-800 bg-white dark:bg-gray-900">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-sky-100 dark:bg-green-900/30 mb-3 sm:mb-4">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 dark:text-green-400" />
            </div>
            <h2 className="text-base sm:text-lg lg:text-xl font-bold mb-2 text-gray-900 dark:text-green-100">Still need help?</h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-green-300 mb-4 max-w-lg mx-auto leading-relaxed">
              Our support team is here to help with any questions about using EarnByCode.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
              <a href="mailto:replyearnbycode@gmail.com" className="px-3 sm:px-4 py-2 bg-sky-600 dark:bg-green-700 text-white font-semibold rounded-lg hover:bg-sky-700 dark:hover:bg-green-600 inline-flex items-center justify-center text-xs sm:text-sm transition-colors">
                <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-2" /> Email Support
              </a>
              <a href="/contact" className="px-3 sm:px-4 py-2 border border-sky-300 dark:border-green-700 rounded-lg text-xs sm:text-sm inline-flex items-center justify-center hover:bg-sky-50 dark:hover:bg-green-900/20 text-gray-900 dark:text-green-100 transition-colors">
                <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2" /> Contact Form
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Chatbot */}
      <div className="fixed bottom-4 right-4 z-40">
        {/* Toggle button on small screens */}
        {!chatOpen && (
          <button onClick={() => setChatOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-sky-600 dark:bg-green-700 text-white rounded-full shadow-lg hover:bg-sky-700 dark:hover:bg-green-600 transition-colors">
            <Bot className="w-4 h-4" /> 
            <span className="text-sm">Chat</span>
          </button>
        )}

        {chatOpen && (
          <div className="w-[92vw] max-w-sm bg-white dark:bg-gray-900 border border-sky-200 dark:border-green-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-3 py-2 bg-sky-100 dark:bg-green-900/30 border-b border-sky-200 dark:border-green-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-sky-600 dark:text-green-400" />
                <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-green-100">EBC AI Help Assistant</span>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-gray-500 dark:text-green-400 hover:text-gray-700 dark:hover:text-green-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Quick suggestions */}
            <div className="px-3 py-2 flex flex-wrap gap-1.5 border-b border-sky-200 dark:border-green-800 bg-sky-50/50 dark:bg-green-900/10">
              {quickSuggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => sendSuggestion(s)}
                  className="text-xs px-2 py-1 rounded-full bg-sky-200 dark:bg-green-900/40 hover:bg-sky-300 dark:hover:bg-green-900/60 text-sky-800 dark:text-green-300 transition-colors"
                  title={s}
                >
                  {s}
                </button>
              ))}
            </div>
            
            <div className="h-56 overflow-y-auto px-3 py-3 space-y-2">
              {messages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                  <div className={`inline-block max-w-[85%] px-3 py-2 rounded-xl text-xs sm:text-sm ${m.role === 'user' ? 'bg-sky-600 dark:bg-green-700 text-white rounded-br-sm' : 'bg-sky-100 dark:bg-green-900/30 text-gray-800 dark:text-green-200 rounded-bl-sm'}`}>
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
                placeholder="Ask about pages, submissions, contests..."
                className="flex-1 px-3 py-2 rounded-lg bg-sky-50 dark:bg-gray-800 border border-sky-200 dark:border-green-800 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 dark:focus:ring-green-600 text-gray-900 dark:text-green-100 placeholder-gray-500 dark:placeholder-green-400"
              />
              <button onClick={sendMessage} className="px-3 py-2 bg-sky-600 dark:bg-green-700 hover:bg-sky-700 dark:hover:bg-green-600 text-white rounded-lg text-xs inline-flex items-center gap-1 transition-colors">
                <Send className="w-3 h-3" />
              </button>
            </div>
            
            <div className="px-3 py-2 bg-sky-50 dark:bg-green-900/20 text-xs text-gray-500 dark:text-green-400 border-t border-sky-200 dark:border-green-800">
              Responses are based on EarnByCode content. For more help, see <a href="/contact" className="underline text-sky-600 dark:text-green-300">/contact</a>.
            </div>
          </div>
        )}
      </div>

      {/* Admin Analytics Panel */}
      {isAdmin && (
        <div className="fixed bottom-4 left-4 z-40 w-[92vw] max-w-sm bg-white dark:bg-gray-900 border border-sky-200 dark:border-green-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-3 py-2 bg-sky-100 dark:bg-green-900/30 border-b border-sky-200 dark:border-green-800 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-green-100">Top Questions (analytics)</span>
            <div className="flex items-center gap-1 sm:gap-2">
              <select value={range} onChange={(e)=>setRange(e.target.value as any)} className="text-xs border rounded px-1 py-0.5 bg-white dark:bg-gray-800 border-sky-300 dark:border-green-700 text-gray-900 dark:text-green-100">
                <option value="all">All time</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="custom">Custom</option>
              </select>
              {range === 'custom' && (
                <>
                  <input type="datetime-local" value={fromISO} onChange={(e)=>setFromISO(e.target.value)} className="text-xs border rounded px-1 py-0.5 bg-white dark:bg-gray-800 border-sky-300 dark:border-green-700 text-gray-900 dark:text-green-100" />
                  <input type="datetime-local" value={toISO} onChange={(e)=>setToISO(e.target.value)} className="text-xs border rounded px-1 py-0.5 bg-white dark:bg-gray-800 border-sky-300 dark:border-green-700 text-gray-900 dark:text-green-100" />
                  <button onClick={()=>setTopFaqsVersion(v=>v+1)} className="text-xs px-2 py-1 rounded bg-sky-600 dark:bg-green-700 text-white hover:bg-sky-700 dark:hover:bg-green-600 transition-colors">Apply</button>
                </>
              )}
              <button onClick={clearTopFaqs} className="text-xs px-2 py-1 rounded bg-gray-500 dark:bg-gray-600 text-white hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors">Clear</button>
            </div>
          </div>
          
          <div className="max-h-56 overflow-y-auto px-3 py-2">
            {topFaqs.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-green-400">No data yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {topFaqs.map((t, i) => (
                  <li key={i} className="text-xs text-gray-700 dark:text-green-300">
                    <span className="font-semibold mr-2 text-sky-600 dark:text-green-400">{t.c}×</span>
                    {t.q}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="px-3 py-2 bg-sky-50 dark:bg-green-900/20 text-xs text-gray-500 dark:text-green-400 border-t border-sky-200 dark:border-green-800">
            Admin only: Analytics API data with local fallback.
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpCenter;