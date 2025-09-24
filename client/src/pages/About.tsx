import React from 'react';
import { Code, Users, Zap, Award, TrendingUp } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-100 dark:from-gray-950 dark:via-black dark:to-gray-900 text-sky-900 dark:text-green-300 transition-colors duration-300">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-sky-300/10 dark:bg-green-800/20 rounded-full blur-3xl animate-pulse transition-colors duration-300"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 bg-sky-400/10 dark:bg-green-700/15 rounded-full blur-3xl animate-pulse delay-1000 transition-colors duration-300"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 sm:w-48 sm:h-48 lg:w-56 lg:h-56 bg-sky-500/10 dark:bg-green-600/10 rounded-full blur-3xl animate-pulse delay-500 transition-colors duration-300"></div>
      </div>
  
      <div className="relative z-10 py-3 sm:py-4 lg:py-6 px-3 sm:px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-6 sm:mb-8 lg:mb-12">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 object-contain rounded-full mx-auto mb-3 sm:mb-4 shadow-lg"
            />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-sky-600 via-sky-500 to-sky-700 dark:from-green-400 dark:via-green-300 dark:to-green-500 bg-clip-text text-transparent leading-tight px-4">
              About AlgoBucks
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-sky-700 dark:text-green-300 max-w-4xl mx-auto px-4 transition-colors duration-300 font-medium">
              Empowering developers to reach their full potential through practice and competition.
            </p>
          </div>
  
          {/* Our Story */}
          <section className="mb-6 sm:mb-8 lg:mb-12">
            <div className="flex items-center mb-4 sm:mb-6 px-4 sm:px-0">
              <div className="h-1 w-6 sm:w-8 lg:w-12 bg-gradient-to-r from-sky-500 to-sky-600 dark:from-green-400 dark:to-green-500 mr-3 sm:mr-4 rounded-full transition-colors duration-300"></div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-sky-900 dark:text-green-400 transition-colors duration-300">Our Story</h2>
            </div>
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-sky-200/50 dark:border-green-800/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl dark:hover:shadow-gray-900/60 transition-all duration-300 mx-4 sm:mx-0 transform hover:-translate-y-1 hover:scale-105">
              <div className="space-y-3 sm:space-y-4 text-sky-700 dark:text-green-300 text-sm sm:text-base leading-relaxed transition-colors duration-300">
                <p className="hover:text-sky-900 dark:hover:text-green-200 transition-colors duration-300 font-medium">
                  Founded in 2025, AlgoBucks was born out of a simple idea: to create a platform where developers of all skill levels could come together to learn, practice, and compete in a supportive environment.
                </p>
                <p className="hover:text-sky-900 dark:hover:text-green-200 transition-colors duration-300 font-medium">
                  What started as a small project among friends has grown into a thriving community of passionate coders, problem solvers, and technology enthusiasts from around the world.
                </p>
                <p className="hover:text-sky-900 dark:hover:text-green-200 transition-colors duration-300 font-medium">
                  Today, we're proud to serve thousands of developers who use our platform to sharpen their skills, prepare for technical interviews, and connect with like-minded individuals.
                </p>
              </div>
            </div>
          </section>
  
          {/* What We Offer */}
          <section className="mb-6 sm:mb-8 lg:mb-12">
            <div className="flex items-center mb-4 sm:mb-6 px-4 sm:px-0">
              <div className="h-1 w-6 sm:w-8 lg:w-12 bg-gradient-to-r from-sky-600 to-sky-700 dark:from-green-400 dark:to-green-500 mr-3 sm:mr-4 rounded-full transition-colors duration-300"></div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-sky-900 dark:text-green-400 transition-colors duration-300">What We Offer</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-0">
              {[
                {
                  icon: <Code className="w-6 h-6 sm:w-8 sm:h-8 text-sky-600 dark:text-green-400 transition-colors duration-300" />,
                  title: 'Coding Challenges',
                  description: 'Hundreds of challenges across multiple difficulty levels and categories.',
                  gradient: 'from-sky-50/80 to-white/60 dark:from-gray-900/90 dark:to-gray-800/80',
                  border: 'border-sky-200/50 dark:border-green-800/30'
                },
                {
                  icon: <Users className="w-6 h-6 sm:w-8 sm:h-8 text-sky-500 dark:text-green-400 transition-colors duration-300" />,
                  title: 'Community',
                  description: 'Connect with developers worldwide and learn from each other.',
                  gradient: 'from-sky-100/80 to-white/60 dark:from-gray-900/90 dark:to-gray-800/80',
                  border: 'border-sky-300/50 dark:border-green-800/30'
                },
                {
                  icon: <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-sky-700 dark:text-green-400 transition-colors duration-300" />,
                  title: 'Real-time Contests',
                  description: 'Test your skills against others in timed competitions.',
                  gradient: 'from-sky-200/80 to-white/60 dark:from-gray-900/90 dark:to-gray-800/80',
                  border: 'border-sky-400/50 dark:border-green-800/30'
                },
                {
                  icon: <Award className="w-6 h-6 sm:w-8 sm:h-8 text-sky-800 dark:text-green-400 transition-colors duration-300" />,
                  title: 'Achievements',
                  description: 'Earn badges and recognition for your progress.',
                  gradient: 'from-sky-300/80 to-white/60 dark:from-gray-900/90 dark:to-gray-800/80',
                  border: 'border-sky-500/50 dark:border-green-800/30'
                },
              ].map((feature, index) => (
                <div 
                  key={index} 
                  className={`bg-gradient-to-br ${feature.gradient} backdrop-blur-sm border ${feature.border} rounded-2xl p-4 sm:p-6 lg:p-8 hover:scale-105 hover:-translate-y-2 transition-all duration-300 shadow-xl hover:shadow-2xl dark:hover:shadow-gray-900/60 group cursor-pointer`}
                >
                  <div className="mb-3 sm:mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 bg-gradient-to-br from-sky-100 to-sky-200 dark:from-green-900/50 dark:to-gray-800/50 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-lg">
                    {feature.icon}
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-2 sm:mb-3 text-sky-900 dark:text-green-400 group-hover:text-sky-800 dark:group-hover:text-green-300 transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-sky-700 dark:text-green-300 group-hover:text-sky-800 dark:group-hover:text-green-200 transition-colors duration-300 text-sm sm:text-base font-medium">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
  
          {/* Our Impact */}
          <section className="mb-6 sm:mb-8 lg:mb-12">
            <div className="bg-gradient-to-r from-white/90 via-sky-50/80 to-white/90 dark:from-gray-900/95 dark:via-gray-800/90 dark:to-gray-900/95 backdrop-blur-sm border border-sky-200/50 dark:border-green-800/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl dark:hover:shadow-gray-900/60 transition-all duration-300 mx-4 sm:mx-0 transform hover:-translate-y-1">
              <div className="flex items-center mb-4 sm:mb-6">
                <div className="h-1 w-6 sm:w-8 lg:w-12 bg-gradient-to-r from-sky-700 to-sky-800 dark:from-green-400 dark:to-green-500 mr-3 sm:mr-4 rounded-full transition-colors duration-300"></div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-sky-900 dark:text-green-400 transition-colors duration-300">Our Impact</h2>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-center">
                {[
                  { value: '10,000+', label: 'Active Users', color: 'text-sky-600 dark:text-green-400' },
                  { value: '500+', label: 'Coding Problems', color: 'text-sky-700 dark:text-green-400' },
                  { value: '50+', label: 'Contests Hosted', color: 'text-sky-800 dark:text-green-400' },
                  { value: '95%', label: 'Satisfaction Rate', color: 'text-sky-500 dark:text-green-400' }
                ].map((stat, index) => (
                  <div key={index} className="group hover:scale-110 hover:-translate-y-1 transition-all duration-300 cursor-pointer bg-white/50 dark:bg-gray-800/50 rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg hover:shadow-xl">
                    <div className={`text-xl sm:text-2xl lg:text-3xl font-bold ${stat.color} mb-2 group-hover:drop-shadow-lg transition-all duration-300`}>
                      {stat.value}
                    </div>
                    <div className="text-sky-700 dark:text-green-300 group-hover:text-sky-800 dark:group-hover:text-green-200 transition-colors duration-300 text-sm sm:text-base font-semibold">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
  
          {/* Join Us */}
          <section className="text-center px-4 sm:px-0">
            <div className="bg-gradient-to-r from-sky-50/90 via-white/80 to-sky-50/90 dark:from-gray-900/95 dark:via-gray-800/90 dark:to-gray-900/95 backdrop-blur-sm border border-sky-200/50 dark:border-green-800/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl dark:hover:shadow-gray-900/60 transition-all duration-300 transform hover:-translate-y-1">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-sky-600 via-sky-500 to-sky-700 dark:from-green-400 dark:via-green-300 dark:to-green-500 bg-clip-text text-transparent">
                Ready to Start Your Coding Journey?
              </h2>
              <p className="text-sky-700 dark:text-green-300 mb-4 sm:mb-6 max-w-4xl mx-auto text-sm sm:text-base lg:text-lg leading-relaxed transition-colors duration-300 font-medium">
                Join thousands of developers who are already improving their skills on AlgoBucks.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 lg:gap-6 max-w-md sm:max-w-none mx-auto">
                <a 
                  href="/register" 
                  className="bg-gradient-to-r from-sky-500 to-sky-600 dark:from-green-600 dark:to-green-700 hover:from-sky-600 hover:to-sky-700 dark:hover:from-green-700 dark:hover:to-green-800 text-white font-bold py-3 sm:py-3 lg:py-4 px-6 sm:px-8 lg:px-10 rounded-xl shadow-xl hover:shadow-2xl dark:hover:shadow-gray-900/60 transition-all duration-300 hover:scale-110 transform text-sm sm:text-base backdrop-blur-sm"
                >
                  Sign Up Free
                </a>
                <a 
                  href="/problems" 
                  className="bg-transparent hover:bg-sky-50 dark:hover:bg-gray-800/50 text-sky-600 dark:text-green-400 hover:text-sky-800 dark:hover:text-green-300 font-bold py-3 sm:py-3 lg:py-4 px-6 sm:px-8 lg:px-10 border-2 border-sky-500/50 dark:border-green-500/50 hover:border-sky-600/70 dark:hover:border-green-400/70 rounded-xl transition-all duration-300 hover:scale-110 transform backdrop-blur-sm text-sm sm:text-base shadow-lg hover:shadow-xl"
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
}

export default About;