import React from 'react';
import { MessageCircle, Users, Code, Trophy, Calendar, BookOpen, Github, Twitter, Linkedin, Youtube, CheckCircle, Shield, Archive, AlertTriangle } from 'lucide-react';

const Community = () => {
  const stats = [
    { value: '15,000+', label: 'Active Members', icon: Users },
    { value: '750+', label: 'Open Source Projects', icon: Code },
    { value: '150+', label: 'Monthly Hackathons', icon: Trophy },
    { value: '24/7', label: 'Active Discussions', icon: MessageCircle },
  ];

  const events = [
    {
      id: 1,
      title: 'Weekly Algorithm Challenge',
      date: 'Every Monday',
      time: '6:00 PM IST',
      description: 'Join our weekly coding challenges and compete with developers worldwide.',
      icon: Code,
      status: 'recurring'
    },
    {
      id: 2,
      title: 'Tech Talk: Advanced Dynamic Programming',
      date: 'September 18, 2025',
      time: '7:30 PM IST',
      description: 'Deep dive into advanced DP techniques with industry experts.',
      icon: BookOpen,
      status: 'upcoming'
    },
    {
      id: 3,
      title: 'Community Hackathon: AI & ML',
      date: 'October 5-7, 2025',
      time: 'All Day',
      description: '72-hour hackathon focused on artificial intelligence and machine learning.',
      icon: Trophy,
      status: 'upcoming'
    },
    {
      id: 4,
      title: 'Open Source Contribution Workshop',
      date: 'September 22, 2025',
      time: '4:00 PM IST',
      description: 'Learn how to contribute to open source projects effectively.',
      icon: Github,
      status: 'upcoming'
    },
    {
      id: 5,
      title: 'Career Guidance Session',
      date: 'September 25, 2025',
      time: '8:00 PM IST',
      description: 'Get career advice from senior developers and industry leaders.',
      icon: Users,
      status: 'upcoming'
    },
    {
      id: 6,
      title: 'Code Review Masterclass',
      date: 'September 30, 2025',
      time: '6:30 PM IST',
      description: 'Master the art of code reviews and improve code quality.',
      icon: CheckCircle,
      status: 'upcoming'
    }
  ];

  const guidelines = [
    {
      icon: CheckCircle,
      title: 'Be Respectful',
      description: 'Treat all community members with respect and kindness. No harassment, hate speech, or discrimination will be tolerated.'
    },
    {
      icon: Shield,
      title: 'Keep It Clean',
      description: 'No NSFW content, spam, or excessive self-promotion. Keep discussions relevant to the community\'s purpose.'
    },
    {
      icon: Archive,
      title: 'Share Knowledge',
      description: 'Help others by sharing your knowledge and experience. We\'re all here to learn and grow together.'
    },
    {
      icon: AlertTriangle,
      title: 'Report Issues',
      description: 'See something that violates our guidelines? Report it to the moderators for immediate review.'
    }
  ];

  const socialLinks = [
    { icon: Github, href: 'https://github.com/algobucks', label: 'GitHub' },
    { icon: Twitter, href: 'https://twitter.com/algobucks', label: 'Twitter' },
    { icon: Linkedin, href: 'https://linkedin.com/company/algobucks', label: 'LinkedIn' },
    { icon: Youtube, href: 'https://youtube.com/@algobucks', label: 'YouTube' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-slate-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4yIj48cGF0aCBkPSJNMjEgMTljMCAyLjIwOS0xLjc5MSA0LTQgNHMtNC0xLjc5MS00LTRzMS43OTEtNCA0LTRzNCAxLjc5MSA0IDR6Ii8+PC9nPjwvZz48L3N2Zz4=')]"></div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="max-w-7xl mx-auto px-3 py-10 sm:py-12 lg:py-16 sm:px-4 lg:px-6 relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/10 backdrop-blur-sm mb-4 shadow-lg">
            <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-4 leading-tight">
            Join Our Community
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-blue-100 max-w-3xl mx-auto mb-6 leading-relaxed">
            Connect with fellow developers, participate in challenges, and grow your skills in a supportive environment where innovation meets collaboration.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto sm:max-w-none">
            <a
              href="https://discord.gg/algobucks"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 sm:px-6 py-2 sm:py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 text-xs sm:text-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.105 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.8 8.18 1.8 12.062 0a.074.074 0 01.078.01c.12.098.246.192.373.292a.077.077 0 01-.006.127 12.305 12.305 0 01-1.873.892.077.077 0 00-.041.104c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.84 19.84 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.945-2.42 2.157-2.42 1.211 0 2.19 1.087 2.157 2.42 0 1.334-.946 2.42-2.157 2.42zm7.975 0c-1.213 0-2.2-1.086-2.2-2.42 0-1.333.966-2.42 2.2-2.42 1.213 0 2.19 1.087 2.19 2.42 0 1.334-.977 2.42-2.19 2.42z" />
              </svg>
              Join Discord Server
            </a>
            <a
              href="https://github.com/algobucks/community"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 sm:px-6 py-2 sm:py-3 bg-white/10 backdrop-blur-sm text-white font-medium rounded-lg hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2 border border-white/20 text-xs sm:text-sm"
            >
              <Github className="w-4 h-4" />
              View on GitHub
            </a>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-8 sm:py-10 lg:py-12">
        <div className="text-center mb-8">
          <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-900 to-indigo-600 bg-clip-text text-transparent mb-3">
            Community at a Glance
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto">
            Join thousands of developers in our thriving community
          </p>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white/70 backdrop-blur-sm p-4 sm:p-6 rounded-lg sm:rounded-xl border border-blue-100 text-center hover:shadow-xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-1 group">
              <div className="mx-auto flex items-center justify-center h-8 w-8 sm:h-12 sm:w-12 rounded-full bg-blue-100 text-blue-600 mb-3 group-hover:bg-blue-200 transition-colors duration-300">
                <stat.icon className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <p className="text-lg sm:text-xl font-bold text-slate-800 mb-1">{stat.value}</p>
              <p className="text-xs sm:text-sm font-medium text-slate-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white/50 backdrop-blur-sm py-8 sm:py-10 lg:py-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="text-center mb-8">
            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-800 mb-3">
              Upcoming Events
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-3xl mx-auto">
              Join our community events, workshops, and challenges to enhance your skills and network with fellow developers
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <div key={event.id} className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-md overflow-hidden border border-blue-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-1 group">
                <div className="p-4 sm:p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-blue-100 rounded-lg p-2 group-hover:bg-blue-200 transition-colors duration-300">
                      <event.icon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm sm:text-base font-bold text-slate-800 leading-tight">{event.title}</h3>
                        {event.status === 'recurring' && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Recurring</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{event.date} • {event.time}</p>
                      <p className="text-xs sm:text-sm text-slate-600 mb-3 leading-relaxed">{event.description}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button className="w-full flex justify-center items-center px-3 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl">
                      Learn More & Register
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Community Guidelines */}
      <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 py-8 sm:py-10 lg:py-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-800 mb-3">
              Community Guidelines
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-3xl mx-auto">
              Help us maintain a positive and welcoming community where everyone can learn and grow together
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
            {guidelines.map((guideline, index) => (
              <div key={index} className="flex items-start group">
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <guideline.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="ml-4 sm:ml-6">
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-2">{guideline.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {guideline.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white/80 backdrop-blur-sm py-8 sm:py-10 lg:py-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-xl sm:rounded-2xl px-4 sm:px-8 py-8 sm:py-12 text-center text-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative z-10">
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-3 sm:mb-4">
                Ready to join our community?
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-blue-100 mb-6 sm:mb-8 max-w-3xl mx-auto">
                Start your journey today and become part of a thriving community of developers, innovators, and problem-solvers.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto sm:max-w-none">
                <a
                  href="https://discord.gg/algobucks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-xs sm:text-sm font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Join Discord Community
                </a>
                <button className="inline-flex items-center justify-center px-6 py-3 border border-white/30 text-xs sm:text-sm font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 transition-all duration-300 backdrop-blur-sm">
                  Explore Features
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;