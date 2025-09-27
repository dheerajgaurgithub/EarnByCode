import React from 'react';
import { ShieldCheck } from 'lucide-react';

const PrivacyPolicy = () => {
  const sections = [
    {
      title: '1. Introduction',
      content: 'Welcome to AlgoBucks. We respect your privacy and are committed to protecting your personal data.',
    },
    {
      title: '2. Information We Collect',
      content: 'We collect personal data including identity, contact, financial, technical, and usage data to provide and improve our services.',
    },
    {
      title: '3. How We Use Your Data',
      content: 'Your data is used to register accounts, process transactions, manage relationships, and improve our services.',
    },
    {
      title: '4. Data Security',
      content: 'We implement appropriate security measures to protect your personal data from unauthorized access and disclosure.',
    },
    {
      title: '5. Your Rights',
      content: 'You have rights to access, correct, or delete your personal data. Contact us to exercise these rights.',
    },
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
            <ShieldCheck className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-4">
            Privacy Policy
          </h1>
          <p className="text-slate-400">Last updated: September 1, 2025</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-slate-700/50">
          <div className="prose prose-invert max-w-none">
            {sections.map((section, index) => (
              <section key={index} className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">{section.title}</h2>
                <p className="text-slate-300">{section.content}</p>
              </section>
            ))}
            <div className="mt-12 pt-6 border-t border-slate-700/50">
              <p className="text-slate-400 text-sm">
                For any questions about this Privacy Policy, please contact us at replyearnbycode@gmail.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
