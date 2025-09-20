import React from 'react';
import { Code, Users, Zap, Award, TrendingUp } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-950 dark:via-black dark:to-gray-950 text-gray-800 dark:text-blue-300 transition-colors duration-200">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 sm:w-48 sm:h-48 lg:w-72 lg:h-72 bg-blue-300/10 dark:bg-blue-800/30 rounded-full blur-3xl animate-pulse transition-colors duration-200"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 sm:w-64 sm:h-64 lg:w-96 lg:h-96 bg-blue-400/10 dark:bg-blue-700/25 rounded-full blur-3xl animate-pulse delay-1000 transition-colors duration-200"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-blue-500/10 dark:bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-500 transition-colors duration-200"></div>
      </div>

      <div className="relative z-10 py-4 sm:py-6 md:py-8 lg:py-10 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12">
            <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-6 h-6 sm:w-8 sm:h-8 object-contain rounded-full mx-auto mb-2"
          />
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold mb-2 sm:mb-3 md:mb-4 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 dark:from-blue-400 dark:via-blue-500 dark:to-blue-600 bg-clip-text text-transparent leading-tight px-4">
              About AlgoBucks
            </h1>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-600 dark:text-blue-400 max-w-3xl mx-auto px-4 transition-colors duration-200">
              Empowering developers to reach their full potential through practice and competition.
            </p>
          </div>

          {/* Our Story */}
          <section className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
            <div className="flex items-center mb-3 sm:mb-4 md:mb-5 lg:mb-6 px-4 sm:px-0">
              <div className="h-1 w-4 sm:w-6 md:w-8 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 mr-2 sm:mr-3 rounded-full transition-colors duration-200"></div>
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 dark:text-blue-300 transition-colors duration-200">Our Story</h2>
            </div>
            <div className="bg-white/80 dark:bg-gray-950/90 backdrop-blur-sm border border-blue-200/50 dark:border-gray-800/60 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 shadow-xl shadow-blue-500/10 dark:shadow-gray-900/40 hover:shadow-blue-500/15 dark:hover:shadow-gray-900/60 transition-all duration-500 mx-4 sm:mx-0">
              <div className="space-y-2 sm:space-y-3 md:space-y-4 text-gray-600 dark:text-blue-400 text-xs sm:text-sm md:text-base leading-relaxed transition-colors duration-200">
                <p className="hover:text-gray-800 dark:hover:text-blue-300 transition-colors duration-300">
                  Founded in 2025, AlgoBucks was born out of a simple idea: to create a platform where developers of all skill levels could come together to learn, practice, and compete in a supportive environment.
                </p>
                <p className="hover:text-gray-800 dark:hover:text-blue-300 transition-colors duration-300">
                  What started as a small project among friends has grown into a thriving community of passionate coders, problem solvers, and technology enthusiasts from around the world.
                </p>
                <p className="hover:text-gray-800 dark:hover:text-blue-300 transition-colors duration-300">
                  Today, we're proud to serve thousands of developers who use our platform to sharpen their skills, prepare for technical interviews, and connect with like-minded individuals.
                </p>
              </div>
            </div>
          </section>

          {/* What We Offer */}
          <section className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
            <div className="flex items-center mb-3 sm:mb-4 md:mb-5 lg:mb-6 px-4 sm:px-0">
              <div className="h-1 w-4 sm:w-6 md:w-8 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 mr-2 sm:mr-3 rounded-full transition-colors duration-200"></div>
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 dark:text-blue-300 transition-colors duration-200">What We Offer</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6 px-4 sm:px-0">
              {[
                {
                  icon: <Code className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-300 transition-colors duration-200" />,
                  title: 'Coding Challenges',
                  description: 'Hundreds of challenges across multiple difficulty levels and categories.',
                  gradient: 'from-blue-50/80 to-white/60 dark:from-gray-950/90 dark:to-gray-900/80',
                  border: 'border-blue-200/50 dark:border-gray-800/60',
                  shadow: 'hover:shadow-blue-500/15 dark:hover:shadow-gray-900/60'
                },
                {
                  icon: <Users className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-500 dark:text-blue-300 transition-colors duration-200" />,
                  title: 'Community',
                  description: 'Connect with developers worldwide and learn from each other.',
                  gradient: 'from-blue-100/80 to-white/60 dark:from-gray-950/90 dark:to-gray-900/80',
                  border: 'border-blue-300/50 dark:border-gray-800/60',
                  shadow: 'hover:shadow-blue-500/15 dark:hover:shadow-gray-900/60'
                },
                {
                  icon: <Zap className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-700 dark:text-blue-300 transition-colors duration-200" />,
                  title: 'Real-time Contests',
                  description: 'Test your skills against others in timed competitions.',
                  gradient: 'from-blue-200/80 to-white/60 dark:from-gray-950/90 dark:to-gray-900/80',
                  border: 'border-blue-400/50 dark:border-gray-800/60',
                  shadow: 'hover:shadow-blue-500/15 dark:hover:shadow-gray-900/60'
                },
                {
                  icon: <Award className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-800 dark:text-blue-300 transition-colors duration-200" />,
                  title: 'Achievements',
                  description: 'Earn badges and recognition for your progress.',
                  gradient: 'from-blue-300/80 to-white/60 dark:from-gray-950/90 dark:to-gray-900/80',
                  border: 'border-blue-500/50 dark:border-gray-800/60',
                  shadow: 'hover:shadow-blue-500/15 dark:hover:shadow-gray-900/60'
                },
              ].map((feature, index) => (
                <div 
                  key={index} 
                  className={`bg-gradient-to-br ${feature.gradient} backdrop-blur-sm border ${feature.border} rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 hover:scale-105 transition-all duration-500 ${feature.shadow} shadow-lg group cursor-pointer`}
                >
                  <div className="mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-1 sm:mb-2 text-gray-800 dark:text-blue-300 group-hover:text-blue-700 dark:group-hover:text-blue-200 transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-blue-400 group-hover:text-gray-700 dark:group-hover:text-blue-300 transition-colors duration-300 text-xs sm:text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Our Impact */}
          <section className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
            <div className="bg-gradient-to-r from-white/90 via-blue-50/80 to-white/90 dark:from-gray-950/95 dark:via-gray-900/90 dark:to-gray-950/95 backdrop-blur-sm border border-blue-200/50 dark:border-gray-800/60 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 shadow-xl shadow-blue-500/10 dark:shadow-gray-900/40 hover:shadow-blue-500/15 dark:hover:shadow-gray-900/60 transition-all duration-500 mx-4 sm:mx-0">
              <div className="flex items-center mb-3 sm:mb-4 md:mb-5 lg:mb-6">
                <div className="h-1 w-4 sm:w-6 md:w-8 bg-gradient-to-r from-blue-700 to-blue-800 dark:from-blue-400 dark:to-blue-500 mr-2 sm:mr-3 rounded-full transition-colors duration-200"></div>
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 dark:text-blue-300 transition-colors duration-200">Our Impact</h2>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 text-center">
                {[
                  { value: '10,000+', label: 'Active Users', color: 'text-blue-600 dark:text-blue-300' },
                  { value: '500+', label: 'Coding Problems', color: 'text-blue-700 dark:text-blue-300' },
                  { value: '50+', label: 'Contests Hosted', color: 'text-blue-800 dark:text-blue-300' },
                  { value: '95%', label: 'Satisfaction Rate', color: 'text-blue-500 dark:text-blue-300' }
                ].map((stat, index) => (
                  <div key={index} className="group hover:scale-110 transition-transform duration-300 cursor-pointer">
                    <div className={`text-base sm:text-lg md:text-xl lg:text-2xl font-bold ${stat.color} mb-1 group-hover:drop-shadow-lg transition-colors duration-200`}>
                      {stat.value}
                    </div>
                    <div className="text-gray-600 dark:text-blue-400 group-hover:text-gray-700 dark:group-hover:text-blue-300 transition-colors duration-300 text-xs sm:text-sm">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Join Us */}
          <section className="text-center px-4 sm:px-0">
            <div className="bg-gradient-to-r from-blue-50/90 via-white/80 to-blue-50/90 dark:from-gray-950/95 dark:via-gray-900/90 dark:to-gray-950/95 backdrop-blur-sm border border-blue-200/50 dark:border-gray-800/60 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 shadow-xl shadow-blue-500/10 dark:shadow-gray-900/40 transition-colors duration-200">
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 md:mb-4 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 dark:from-blue-400 dark:via-blue-500 dark:to-blue-600 bg-clip-text text-transparent">
                Ready to Start Your Coding Journey?
              </h2>
              <p className="text-gray-600 dark:text-blue-400 mb-3 sm:mb-4 md:mb-6 max-w-3xl mx-auto text-xs sm:text-sm md:text-base leading-relaxed transition-colors duration-200">
                Join thousands of developers who are already improving their skills on AlgoBucks.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 md:gap-4 max-w-md sm:max-w-none mx-auto">
                <a 
                  href="/register" 
                  className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-400 dark:hover:to-blue-500 text-white font-semibold py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 md:px-6 rounded-lg shadow-lg shadow-blue-500/25 dark:shadow-gray-900/40 hover:shadow-blue-500/30 dark:hover:shadow-gray-900/60 transition-all duration-300 hover:scale-105 transform text-xs sm:text-sm"
                >
                  Sign Up Free
                </a>
                <a 
                  href="/problems" 
                  className="bg-transparent hover:bg-blue-50 dark:hover:bg-gray-900/50 text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 font-semibold py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 md:px-6 border-2 border-blue-500/30 dark:border-blue-400/40 hover:border-blue-600/50 dark:hover:border-blue-300/60 rounded-lg transition-all duration-300 hover:scale-105 transform backdrop-blur-sm text-xs sm:text-sm"
                >
                  View Challenges
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;