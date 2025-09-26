import React from 'react';
import { Code, Users, Zap, Award } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white dark:from-gray-950 dark:to-gray-900 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-6 sm:mb-8 lg:mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-sky-100 dark:bg-green-900/30 mb-3 sm:mb-4 shadow-sm">
            <span className="text-xl sm:text-2xl">💻</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-green-100 mb-2">About AlgoBucks</h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-green-300 mt-2 max-w-2xl mx-auto leading-relaxed px-2">
            AlgoBucks helps you practice coding, compete in contests, and improve with detailed submissions and leaderboards.
          </p>
        </header>

        <section className="mb-6 sm:mb-8 lg:mb-10">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-sky-200 dark:border-green-800 p-4 sm:p-6 shadow-sm">
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold mb-4 sm:mb-6 text-gray-900 dark:text-green-100 flex items-center gap-2">
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-sky-100 dark:bg-green-900/30 flex items-center justify-center">
                <span className="text-sm sm:text-base">⭐</span>
              </span>
              What we offer
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <li className="group flex items-start gap-3 p-3 sm:p-4 bg-sky-50/50 dark:bg-green-900/10 border border-sky-200 dark:border-green-800 rounded-xl hover:border-sky-300 dark:hover:border-green-700 hover:shadow-sm transition-all duration-200">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-sky-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-200 dark:group-hover:bg-green-900/50 transition-colors">
                  <Code className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-xs sm:text-sm lg:text-base text-gray-900 dark:text-green-100 mb-1">Coding Challenges</p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-green-400 leading-relaxed">Curated problems with examples and constraints.</p>
                </div>
              </li>
              <li className="group flex items-start gap-3 p-3 sm:p-4 bg-sky-50/50 dark:bg-green-900/10 border border-sky-200 dark:border-green-800 rounded-xl hover:border-sky-300 dark:hover:border-green-700 hover:shadow-sm transition-all duration-200">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-sky-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-200 dark:group-hover:bg-green-900/50 transition-colors">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-xs sm:text-sm lg:text-base text-gray-900 dark:text-green-100 mb-1">Community</p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-green-400 leading-relaxed">Discuss problems and share solutions.</p>
                </div>
              </li>
              <li className="group flex items-start gap-3 p-3 sm:p-4 bg-sky-50/50 dark:bg-green-900/10 border border-sky-200 dark:border-green-800 rounded-xl hover:border-sky-300 dark:hover:border-green-700 hover:shadow-sm transition-all duration-200">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-sky-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-200 dark:group-hover:bg-green-900/50 transition-colors">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-xs sm:text-sm lg:text-base text-gray-900 dark:text-green-100 mb-1">Contests</p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-green-400 leading-relaxed">Compete in timed contests with rankings.</p>
                </div>
              </li>
              <li className="group flex items-start gap-3 p-3 sm:p-4 bg-sky-50/50 dark:bg-green-900/10 border border-sky-200 dark:border-green-800 rounded-xl hover:border-sky-300 dark:hover:border-green-700 hover:shadow-sm transition-all duration-200">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-sky-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-200 dark:group-hover:bg-green-900/50 transition-colors">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-xs sm:text-sm lg:text-base text-gray-900 dark:text-green-100 mb-1">Progress & Achievements</p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-green-400 leading-relaxed">Track submissions and earn points.</p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-900 rounded-xl border border-sky-200 dark:border-green-800 p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <a href="/register" className="group inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-sky-600 dark:bg-green-700 text-white text-xs sm:text-sm lg:text-base font-semibold hover:bg-sky-700 dark:hover:bg-green-600 transition-all duration-200 shadow-sm hover:shadow-md">
              <span className="mr-2">🚀</span>
              Sign Up Free
            </a>
            <a href="/problems" className="group inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl border-2 border-sky-300 dark:border-green-700 text-xs sm:text-sm lg:text-base font-semibold text-gray-900 dark:text-green-100 hover:bg-sky-50 dark:hover:bg-green-900/20 hover:border-sky-400 dark:hover:border-green-600 transition-all duration-200">
              <span className="mr-2">💡</span>
              View Challenges
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

export default About;