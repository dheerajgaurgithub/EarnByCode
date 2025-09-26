import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

const Community = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-slate-900 dark:text-green-200 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sky-100 dark:bg-green-900/40 mb-3">
            <MessageCircle className="w-6 h-6 text-sky-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold">Community</h1>
          <p className="text-sm text-slate-600 dark:text-green-300 mt-2 max-w-2xl mx-auto">
            Discuss problems, share solutions, and participate in contests with fellow developers.
          </p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link to="/discuss" className="block p-4 rounded-lg border border-sky-200 dark:border-green-800 hover:bg-sky-50/70 dark:hover:bg-green-900/30 transition">
            <h3 className="font-semibold">Discussions</h3>
            <p className="text-xs text-slate-600 dark:text-green-400">Ask questions and help others.</p>
          </Link>
          <Link to="/contests" className="block p-4 rounded-lg border border-sky-200 dark:border-green-800 hover:bg-sky-50/70 dark:hover:bg-green-900/30 transition">
            <h3 className="font-semibold">Contests</h3>
            <p className="text-xs text-slate-600 dark:text-green-400">Compete and view results.</p>
          </Link>
          <Link to="/blog" className="block p-4 rounded-lg border border-sky-200 dark:border-green-800 hover:bg-sky-50/70 dark:hover:bg-green-900/30 transition">
            <h3 className="font-semibold">Blog</h3>
            <p className="text-xs text-slate-600 dark:text-green-400">Read platform tips and updates.</p>
          </Link>
          <Link to="/press" className="block p-4 rounded-lg border border-sky-200 dark:border-green-800 hover:bg-sky-50/70 dark:hover:bg-green-900/30 transition">
            <h3 className="font-semibold">Press & Updates</h3>
            <p className="text-xs text-slate-600 dark:text-green-400">See live mentions and news.</p>
          </Link>
        </section>
      </div>
    </div>
  );
};

export default Community;