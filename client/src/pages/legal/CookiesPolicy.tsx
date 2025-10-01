import React from 'react';
import { Cookie } from 'lucide-react';

const CookiesPolicy = () => {
  const cookieTypes = [
    {
      name: 'Essential Cookies',
      purpose: 'These cookies are necessary for the website to function and cannot be switched off.',
      examples: ['User authentication', 'Security features', 'Session management']
    },
    {
      name: 'Analytics Cookies',
      purpose: 'These cookies help us understand how visitors interact with our website.',
      examples: ['Page visits', 'Traffic sources', 'User behavior']
    },
    {
      name: 'Preference Cookies',
      purpose: 'These cookies allow the website to remember choices you make.',
      examples: ['Language preferences', 'Font size', 'Region settings']
    },
    {
      name: 'Marketing Cookies',
      purpose: 'These cookies are used to track visitors across websites.',
      examples: ['Ad personalization', 'Campaign performance']
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 transition-colors duration-300 mb-4">
            <Cookie className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400 transition-colors duration-300" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black dark:text-blue-500 transition-colors duration-300 mb-3 sm:mb-4 px-4">
            Cookies Policy
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-blue-400/80 transition-colors duration-300">Last updated: September 1, 2025</p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-gray-200 dark:border-gray-800 transition-colors duration-300">
          <div className="prose prose-invert max-w-none">
            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-blue-500 transition-colors duration-300 mb-3 sm:mb-4">What are cookies?</h2>
              <p className="text-sm sm:text-base text-gray-700 dark:text-blue-400/90 transition-colors duration-300 mb-4 sm:mb-6 leading-relaxed">
                Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide information to the site owners.
              </p>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-blue-500 transition-colors duration-300 mb-3 sm:mb-4">How We Use Cookies</h2>
              <p className="text-sm sm:text-base text-gray-700 dark:text-blue-400/90 transition-colors duration-300 mb-4 sm:mb-6 leading-relaxed">
                We use different types of cookies for various purposes, including:
              </p>
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                {cookieTypes.map((type, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800/50 p-4 sm:p-5 rounded-lg border border-gray-200 dark:border-gray-700/50 transition-colors duration-300 hover:shadow-md dark:hover:shadow-blue-900/20">
                    <h3 className="text-base sm:text-lg font-semibold text-black dark:text-blue-500 transition-colors duration-300 mb-2">
                      {type.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-700 dark:text-blue-400/80 transition-colors duration-300 mb-3 leading-relaxed">
                      {type.purpose}
                    </p>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-blue-400/70 transition-colors duration-300">
                      <span className="font-medium text-gray-800 dark:text-blue-500">Examples:</span>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        {type.examples.map((example, i) => (
                          <li key={i} className="leading-relaxed">{example}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-blue-500 transition-colors duration-300 mb-3 sm:mb-4">Managing Cookies</h2>
              <p className="text-sm sm:text-base text-gray-700 dark:text-blue-400/90 transition-colors duration-300 mb-3 sm:mb-4 leading-relaxed">
                You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from being placed.
              </p>
              <p className="text-sm sm:text-base text-gray-700 dark:text-blue-400/90 transition-colors duration-300 leading-relaxed">
                For more information about cookies, including how to see what cookies have been set and how to manage and delete them, visit <a href="https://www.aboutcookies.org" className="text-blue-600 dark:text-blue-400 hover:underline transition-colors duration-300 font-medium">www.aboutcookies.org</a>.
              </p>
            </section>

            <div className="mt-8 sm:mt-12 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700/50 transition-colors duration-300">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-blue-400/70 transition-colors duration-300 leading-relaxed">
                For any questions about our use of cookies, please contact us at replyearnbycode@gmail.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiesPolicy;