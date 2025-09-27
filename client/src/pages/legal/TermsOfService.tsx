import React from 'react';
import { FileText } from 'lucide-react';

const TermsOfService = () => {
  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: 'By accessing or using AlgoBucks, you agree to be bound by these Terms of Service and our Privacy Policy.',
    },
    {
      title: '2. Account Registration',
      content: 'You must provide accurate and complete information when creating an account and are responsible for maintaining the security of your credentials.',
    },
    {
      title: '3. User Conduct',
      content: 'You agree not to engage in any activity that interferes with or disrupts the Services or the servers and networks connected to the Services.',
    },
    {
      title: '4. Intellectual Property',
      content: 'All content and materials available on AlgoBucks, including but not limited to text, graphics, and code, are the property of AlgoBucks and are protected by intellectual property laws.',
    },
    {
      title: '5. Termination',
      content: 'We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users of the Services.',
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
            <FileText className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-4">
            Terms of Service
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
                For any questions about these Terms, please contact us at replyearnbycode@gmail.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
