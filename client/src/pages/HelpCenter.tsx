import React, { useState } from 'react';
import { Search, HelpCircle, MessageSquare, Mail, ChevronDown, ChevronUp, X } from 'lucide-react';

const HelpCenter = () => {
  const [activeCategory, setActiveCategory] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');

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
    </div>
  );
};

export default HelpCenter;