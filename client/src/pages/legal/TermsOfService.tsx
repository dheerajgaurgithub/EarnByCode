import React from 'react';
import { FileText } from 'lucide-react';

const TermsOfService = () => {
  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: 'By accessing or using EarnByCode, you agree to be bound by these Terms of Service and our Privacy Policy.',
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
      content: 'All content and materials available on EarnByCode, including but not limited to text, graphics, and code, are the property of EarnByCode and are protected by intellectual property laws.',
    },
    {
      title: '5. Termination',
      content: 'We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users of the Services.',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 transition-colors duration-300 mb-4">
            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400 transition-colors duration-300" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black dark:text-blue-500 transition-colors duration-300 mb-3 sm:mb-4 px-4">
            Terms of Service
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-blue-400/80 transition-colors duration-300">Last updated: September 1, 2025</p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-gray-200 dark:border-gray-800 transition-colors duration-300">
          <div className="prose prose-invert max-w-none">
            {sections.map((section, index) => (
              <section key={index} className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-blue-500 transition-colors duration-300 mb-3 sm:mb-4">
                  {section.title}
                </h2>
                <p className="text-sm sm:text-base text-gray-700 dark:text-blue-400/90 transition-colors duration-300 leading-relaxed">
                  {section.content}
                </p>
              </section>
            ))}

            <div className="mt-8 sm:mt-12 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700/50 transition-colors duration-300">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-blue-400/70 transition-colors duration-300 leading-relaxed">
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