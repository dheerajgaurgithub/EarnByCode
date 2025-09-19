import React from 'react';
import { Code, ArrowRight, Trophy, Zap, Target, Users, DollarSign, Brain, Star, TrendingUp, Award, Rocket } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
// Mock data for the component
const stats = [
  { label: "Active Coders", value: "50K+" },
  { label: "Problems Solved", value: "2M+" },
  { label: "Total Prizes Won", value: "$1M+" },
  { label: "Live Contests", value: "24/7" }
];

const features = [
  {
    icon: Zap,
    title: "Real-time Coding",
    description: "Code in your browser with instant feedback and lightning-fast execution"
  },
  {
    icon: DollarSign,
    title: "Earn Real Money",
    description: "Convert your coding skills into cash rewards through contests and challenges"
  },
  {
    icon: Target,
    title: "Skill-based Matching",
    description: "Compete against developers of similar skill levels for fair competition"
  },
  {
    icon: Brain,
    title: "AI-Powered Learning",
    description: "Get personalized problem recommendations based on your coding patterns"
  }
];

export default function Home() {
  const user = null; // Mock user state

  const handleNavigation = (path: string) => {
    console.log(`Navigate to: ${path}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50/80 via-white/60 to-blue-100/80">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzMzMzMzMyIgZmlsbC1vcGFjaXR5PSIwLjEiLz4KPC9zdmc+')] opacity-30"></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="relative px-3 py-8 sm:px-4 sm:py-12 overflow-hidden">
          {/* Glowing orbs */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 sm:w-48 sm:h-48 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-32 h-32 sm:w-48 sm:h-48 bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1000ms' }}></div>

          <div className="max-w-6xl mx-auto relative">
            <div className="text-center">
              <div className="flex flex-col items-center">
                <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                  <div className="relative">
                    <Code className="h-6 w-6 sm:h-8 sm:w-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800" />
                    <div className="absolute inset-0 h-6 w-6 sm:h-8 sm:w-8 bg-gradient-to-r from-blue-600 to-blue-800 blur-lg opacity-30"></div>
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-600 via-blue-700 to-blue-900 bg-clip-text text-transparent leading-tight">
                    AlgoBucks
                  </h1>
                </div>

                <div className="space-y-2 mb-4 sm:mb-6">
                  <p className="text-sm sm:text-base md:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-blue-900 px-2">
                    Think smart. Code harder. Earn more.
                  </p>
                  <p className="text-xs sm:text-sm md:text-base text-gray-700 max-w-md sm:max-w-lg mx-auto px-3 leading-relaxed">
                    The ultimate platform for algorithmic traders to compete, earn, and grow their skills.
                    Develop winning strategies, earn AlgoBucks, and cash out your success.
                  </p>
                </div>
              </div>

              <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 justify-center px-3 max-w-sm sm:max-w-md mx-auto">
                <button
                  onClick={() => handleNavigation('/problems')}
                  className="group relative inline-flex items-center justify-center w-full xs:w-auto px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg overflow-hidden shadow-xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                  <a href="/problems" className="relative flex items-center whitespace-nowrap">
                    Start Coding
                    <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
                  </a>

                </button>

                <button
                  onClick={() => handleNavigation('/contests')}
                  className="group relative inline-flex items-center justify-center w-full xs:w-auto px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-700 to-blue-800 rounded-lg overflow-hidden shadow-xl hover:shadow-blue-600/50 transition-all duration-300 hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-800 to-blue-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                  <a href="/contests" className="relative flex items-center whitespace-nowrap">
                    <Trophy className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                    Join Contest
                  </a>

                </button>

                {!user && (
                  <button
                    onClick={() => handleNavigation('/register')}
                    className="group relative inline-flex items-center justify-center w-full xs:w-auto px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold text-blue-700 border border-blue-300 bg-blue-50 rounded-lg backdrop-blur-sm hover:border-blue-500 hover:bg-blue-100 transition-all duration-300 hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 to-blue-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                    <span className="relative w-full h-full flex items-center justify-center whitespace-nowrap">Create Free Account</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="px-3 py-6 sm:px-4 sm:py-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-white/80 to-blue-50/80 backdrop-blur-sm"></div>
          <div className="max-w-5xl mx-auto relative">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="group text-center bg-gradient-to-br from-white/90 to-blue-50/90 backdrop-blur-sm border border-blue-200/50 rounded-lg p-2 sm:p-3 hover:border-blue-400/50 hover:shadow-lg transition-all duration-300"
                >
                  <div className="text-base sm:text-lg md:text-xl font-black bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-1 group-hover:scale-110 transition-transform duration-300">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 text-xs font-medium leading-tight">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-3 py-8 sm:px-4 sm:py-12 relative">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-lg sm:text-xl md:text-2xl font-black bg-gradient-to-r from-gray-800 via-blue-700 to-blue-900 bg-clip-text text-transparent mb-3 sm:mb-4 leading-tight">
                Why Choose AlgoBucks?
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 max-w-md sm:max-w-lg mx-auto px-3 leading-relaxed">
                More than just coding practice - it's a complete ecosystem where your skills
                earn you real rewards and recognition.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="group relative bg-gradient-to-br from-white/95 to-blue-50/95 backdrop-blur-sm p-3 sm:p-4 rounded-lg sm:rounded-xl border border-blue-200/50 hover:border-blue-400/50 hover:shadow-xl transition-all duration-500 overflow-hidden"
                >
                  {/* Animated background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-blue-800/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="relative">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                      <feature.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-800 transition-all duration-300 leading-tight">
                      {feature.title}
                    </h3>

                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="px-3 py-8 sm:px-4 sm:py-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-white/50 backdrop-blur-sm"></div>

          <div className="max-w-5xl mx-auto relative">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-lg sm:text-xl md:text-2xl font-black bg-gradient-to-r from-gray-800 via-blue-700 to-blue-900 bg-clip-text text-transparent mb-3 sm:mb-4 leading-tight">
                How It Works
              </h2>
              <p className="text-sm sm:text-base text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 font-semibold">
                Simple steps to start earning
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="group text-center relative">
                <div className="relative mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center mx-auto shadow-xl shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <span className="text-lg sm:text-xl font-black text-white">1</span>
                  </div>
                  <div className="absolute inset-0 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl mx-auto blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-800 transition-all duration-300 leading-tight">
                  Solve Problems
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed group-hover:text-gray-700 transition-colors duration-300 px-2">
                  Complete coding challenges and earn 1 codecoin per solved problem
                </p>
              </div>

              <div className="group text-center relative">
                <div className="relative mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center mx-auto shadow-xl shadow-blue-600/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <span className="text-lg sm:text-xl font-black text-white">2</span>
                  </div>
                  <div className="absolute inset-0 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl mx-auto blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-800 transition-all duration-300 leading-tight">
                  Join Contests
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed group-hover:text-gray-700 transition-colors duration-300 px-2">
                  Participate in paid contests and compete for cash prizes
                </p>
              </div>

              <div className="group text-center relative">
                <div className="relative mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-700 to-blue-900 rounded-xl flex items-center justify-center mx-auto shadow-xl shadow-blue-700/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <span className="text-lg sm:text-xl font-black text-white">3</span>
                  </div>
                  <div className="absolute inset-0 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-700 to-blue-900 rounded-xl mx-auto blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-800 transition-all duration-300 leading-tight">
                  Win & Withdraw
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed group-hover:text-gray-700 transition-colors duration-300 px-2">
                  Win contests and withdraw your earnings to your bank account
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-3 py-8 sm:px-4 sm:py-12 relative overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100/60 via-white/40 to-blue-50/60"></div>
          <div className="absolute top-0 left-1/4 w-32 h-32 sm:w-48 sm:h-48 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-32 h-32 sm:w-48 sm:h-48 bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1000ms' }}></div>

          <div className="max-w-4xl mx-auto text-center relative">
            <div className="max-w-sm sm:max-w-md md:max-w-lg mx-auto">
              <h2 className="text-lg sm:text-xl md:text-2xl font-black bg-gradient-to-r from-gray-800 via-blue-700 to-blue-900 bg-clip-text text-transparent mb-4 sm:mb-6 leading-tight">
                Ready to Start Earning with Code?
              </h2>
              <p className="text-xs sm:text-sm text-gray-700 mb-6 sm:mb-8 leading-relaxed px-2">
                Join thousands of developers who are already earning with AlgoBucks
              </p>

              <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 justify-center max-w-sm sm:max-w-md mx-auto">
                <button
                  onClick={() => handleNavigation('/register')}
                  className="group relative inline-flex items-center justify-center w-full xs:w-auto px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg overflow-hidden shadow-xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                  <span className="relative flex items-center whitespace-nowrap">
                    <Trophy className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Get Started Now
                  </span>
                </button>

                <button
                  onClick={() => handleNavigation('/contests')}
                  className="group relative inline-flex items-center justify-center w-full xs:w-auto px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-bold text-blue-700 border border-blue-300 bg-blue-50 rounded-lg backdrop-blur-sm hover:border-blue-500 hover:bg-blue-100 transition-all duration-300 hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 to-blue-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                  <span className="relative whitespace-nowrap">Browse Contests</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}