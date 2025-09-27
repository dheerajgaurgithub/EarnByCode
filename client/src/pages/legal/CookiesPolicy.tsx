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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/10 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 mb-4">
            <Cookie className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-4">
            Cookies Policy
          </h1>
          <p className="text-slate-400">Last updated: September 1, 2025</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-slate-700/50">
          <div className="prose prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">What are cookies?</h2>
              <p className="text-slate-300 mb-6">
                Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide information to the site owners.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">How We Use Cookies</h2>
              <p className="text-slate-300 mb-6">
                We use different types of cookies for various purposes, including:
              </p>
              <div className="grid gap-6 md:grid-cols-2">
                {cookieTypes.map((type, index) => (
                  <div key={index} className="bg-slate-700/30 p-4 rounded-lg border border-slate-700/50">
                    <h3 className="text-lg font-semibold text-white mb-2">{type.name}</h3>
                    <p className="text-slate-300 text-sm mb-3">{type.purpose}</p>
                    <div className="text-sm text-slate-400">
                      <span className="font-medium">Examples:</span>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        {type.examples.map((example, i) => (
                          <li key={i}>{example}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Managing Cookies</h2>
              <p className="text-slate-300 mb-4">
                You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from being placed.
              </p>
              <p className="text-slate-300">
                For more information about cookies, including how to see what cookies have been set and how to manage and delete them, visit <a href="https://www.aboutcookies.org" className="text-purple-400 hover:underline">www.aboutcookies.org</a>.
              </p>
            </section>

            <div className="mt-12 pt-6 border-t border-slate-700/50">
              <p className="text-slate-400 text-sm">
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
