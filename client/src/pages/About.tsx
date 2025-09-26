import React from 'react';
import { Code, Users, Zap, Award } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-slate-900 dark:text-green-200 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-2xl font-bold">About AlgoBucks</h1>
          <p className="text-sm text-slate-600 dark:text-green-300 mt-2 max-w-2xl mx-auto">
            AlgoBucks helps you practice coding, compete in contests, and improve with detailed submissions and leaderboards.
          </p>
        </header>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-2">What we offer</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <li className="flex items-start gap-2 p-3 border rounded-lg border-sky-200 dark:border-green-800">
              <Code className="w-4 h-4 text-sky-600 dark:text-green-400 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Coding Challenges</p>
                <p className="text-xs text-slate-600 dark:text-green-400">Curated problems with examples and constraints.</p>
              </div>
            </li>
            <li className="flex items-start gap-2 p-3 border rounded-lg border-sky-200 dark:border-green-800">
              <Users className="w-4 h-4 text-sky-600 dark:text-green-400 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Community</p>
                <p className="text-xs text-slate-600 dark:text-green-400">Discuss problems and share solutions.</p>
              </div>
            </li>
            <li className="flex items-start gap-2 p-3 border rounded-lg border-sky-200 dark:border-green-800">
              <Zap className="w-4 h-4 text-sky-600 dark:text-green-400 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Contests</p>
                <p className="text-xs text-slate-600 dark:text-green-400">Compete in timed contests with rankings.</p>
              </div>
            </li>
            <li className="flex items-start gap-2 p-3 border rounded-lg border-sky-200 dark:border-green-800">
              <Award className="w-4 h-4 text-sky-600 dark:text-green-400 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Progress & Achievements</p>
                <p className="text-xs text-slate-600 dark:text-green-400">Track submissions and earn points.</p>
              </div>
            </li>
          </ul>
        </section>

        <section className="flex flex-col sm:flex-row gap-3">
          <a href="/register" className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 transition">
            Sign Up Free
          </a>
          <a href="/problems" className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-sky-300 dark:border-green-800 text-sm font-semibold hover:bg-sky-50/70 dark:hover:bg-green-900/30 transition">
            View Challenges
          </a>
        </section>
      </div>
    </div>
  );
}

export default About;