import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Code, ArrowRight, Trophy, Zap, Target, Users, DollarSign, Brain, Star, TrendingUp, Award, Rocket } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50/80 via-white/60 to-blue-100/80">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzMzMzMzMyIgZmlsbC1vcGFjaXR5PSIwLjEiLz4KPC9zdmc+')] opacity-30"></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="relative px-3 py-12 sm:px-4 sm:py-16 md:py-20 lg:py-24 xl:py-32 overflow-hidden">
          {/* Glowing orbs */}
          <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

          <div className="max-w-7xl mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="flex flex-col items-center">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                  <div className="relative">
                    <Code className="h-8 w-8 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800" />
                    <div className="absolute inset-0 h-8 w-8 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 bg-gradient-to-r from-blue-600 to-blue-800 blur-lg opacity-30"></div>
                  </div>
                  <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black bg-gradient-to-r from-blue-600 via-blue-700 to-blue-900 bg-clip-text text-transparent leading-tight">
                    AlgoBucks
                  </h1>
                </div>

                <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                  <p className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-blue-900 px-2">
                    Think smart. Code harder. Earn more.
                  </p>
                  <p className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 max-w-xs xs:max-w-sm sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-3 sm:px-4 leading-relaxed">
                    The ultimate platform for algorithmic traders to compete, earn, and grow their skills.
                    Develop winning strategies, earn AlgoBucks, and cash out your success.
                  </p>
                </div>
              </div>

              <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 md:gap-6 justify-center px-3 sm:px-4 max-w-xs xs:max-w-lg sm:max-w-xl md:max-w-2xl mx-auto">
                <Link to="/problems" className="inline-block w-full xs:w-auto">
                  <motion.div
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(37, 99, 235, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative inline-flex items-center justify-center w-full xs:w-auto px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-sm sm:text-base md:text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl overflow-hidden shadow-2xl hover:shadow-blue-500/50 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                    <span className="relative flex items-center whitespace-nowrap">
                      Start Coding
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </motion.div>
                </Link>

                <Link to="/contests" className="inline-block w-full xs:w-auto">
                  <motion.div
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(37, 99, 235, 0.4)" }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative inline-flex items-center justify-center w-full xs:w-auto px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-sm sm:text-base md:text-lg font-bold text-white bg-gradient-to-r from-blue-700 to-blue-800 rounded-xl overflow-hidden shadow-2xl hover:shadow-blue-600/50 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-800 to-blue-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                    <span className="relative flex items-center whitespace-nowrap">
                      <Trophy className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Join Contest
                    </span>
                  </motion.div>
                </Link>

                {!user && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative inline-flex items-center justify-center w-full xs:w-auto px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-sm sm:text-base md:text-lg font-bold text-blue-700 border-2 border-blue-300 bg-blue-50 rounded-xl backdrop-blur-sm hover:border-blue-500 hover:bg-blue-100 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 to-blue-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                    <Link to="/register" className="relative w-full h-full flex items-center justify-center whitespace-nowrap">Create Free Account</Link>
                  </motion.button>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="px-3 py-8 sm:px-4 sm:py-12 md:py-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-white/80 to-blue-50/80 backdrop-blur-sm"></div>
          <div className="max-w-7xl mx-auto relative">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group text-center bg-gradient-to-br from-white/90 to-blue-50/90 backdrop-blur-sm border border-blue-200/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 hover:border-blue-400/50 hover:shadow-lg transition-all duration-300"
                >
                  <div className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-1 sm:mb-2 group-hover:scale-110 transition-transform duration-300">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 text-xs sm:text-sm md:text-base font-medium leading-tight">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-3 py-12 sm:px-4 sm:py-16 md:py-20 lg:py-28 relative">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12 sm:mb-16 md:mb-20"
            >
              <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-gray-800 via-blue-700 to-blue-900 bg-clip-text text-transparent mb-4 sm:mb-6 leading-tight">
                Why Choose AlgoBucks?
              </h2>
              <p className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto px-3 sm:px-4 leading-relaxed">
                More than just coding practice - it's a complete ecosystem where your skills
                earn you real rewards and recognition.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative bg-gradient-to-br from-white/95 to-blue-50/95 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-blue-200/50 hover:border-blue-400/50 hover:shadow-xl transition-all duration-500 overflow-hidden"
                >
                  {/* Animated background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-blue-800/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="relative">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                      <feature.icon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
                    </div>

                    <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2 sm:mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-800 transition-all duration-300 leading-tight">
                      {feature.title}
                    </h3>

                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="px-3 py-12 sm:px-4 sm:py-16 md:py-20 lg:py-28 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-white/50 backdrop-blur-sm"></div>

          <div className="max-w-7xl mx-auto relative">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12 sm:mb-16 md:mb-20"
            >
              <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-gray-800 via-blue-700 to-blue-900 bg-clip-text text-transparent mb-4 sm:mb-6 leading-tight">
                How It Works
              </h2>
              <p className="text-base xs:text-lg sm:text-xl md:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 font-semibold">
                Simple steps to start earning
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12 lg:gap-16">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="group text-center relative"
              >
                <div className="relative mb-6 sm:mb-8">
                  <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <span className="text-2xl sm:text-3xl font-black text-white">1</span>
                  </div>
                  <div className="absolute inset-0 w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl sm:rounded-3xl mx-auto blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                </div>

                <h3 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-3 sm:mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-800 transition-all duration-300 leading-tight">
                  Solve Problems
                </h3>
                <p className="text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed group-hover:text-gray-700 transition-colors duration-300 px-2">
                  Complete coding challenges and earn 1 codecoin per solved problem
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="group text-center relative"
              >
                <div className="relative mb-6 sm:mb-8">
                  <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-600/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <span className="text-2xl sm:text-3xl font-black text-white">2</span>
                  </div>
                  <div className="absolute inset-0 w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl sm:rounded-3xl mx-auto blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                </div>

                <h3 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-3 sm:mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-800 transition-all duration-300 leading-tight">
                  Join Contests
                </h3>
                <p className="text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed group-hover:text-gray-700 transition-colors duration-300 px-2">
                  Participate in paid contests and compete for cash prizes
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="group text-center relative"
              >
                <div className="relative mb-6 sm:mb-8">
                  <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-700/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <span className="text-2xl sm:text-3xl font-black text-white">3</span>
                  </div>
                  <div className="absolute inset-0 w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl sm:rounded-3xl mx-auto blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                </div>

                <h3 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-3 sm:mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-blue-800 transition-all duration-300 leading-tight">
                  Win & Withdraw
                </h3>
                <p className="text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed group-hover:text-gray-700 transition-colors duration-300 px-2">
                  Win contests and withdraw your earnings to your bank account
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-3 py-12 sm:px-4 sm:py-16 md:py-20 lg:py-28 relative overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100/60 via-white/40 to-blue-50/60"></div>
          <div className="absolute top-0 left-1/4 w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

          <div className="max-w-7xl mx-auto text-center relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto"
            >
              <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-gray-800 via-blue-700 to-blue-900 bg-clip-text text-transparent mb-6 sm:mb-8 leading-tight">
                Ready to Start Earning with Code?
              </h2>
              <p className="text-base xs:text-lg sm:text-xl md:text-2xl text-gray-700 mb-8 sm:mb-10 md:mb-12 leading-relaxed px-2">
                Join thousands of developers who are already earning with AlgoBucks
              </p>

              <div className="flex flex-col xs:flex-row gap-4 sm:gap-6 justify-center max-w-xs xs:max-w-lg sm:max-w-xl md:max-w-2xl mx-auto">
                <Link to="/register" className="inline-block w-full xs:w-auto">
                  <motion.div
                    whileHover={{ scale: 1.05, boxShadow: "0 25px 50px rgba(37, 99, 235, 0.4)" }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative inline-flex items-center justify-center w-full xs:w-auto px-6 sm:px-8 md:px-10 py-4 sm:py-5 text-base sm:text-lg md:text-xl font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl hover:shadow-blue-500/50 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                    <span className="relative flex items-center whitespace-nowrap">
                      <Trophy className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                      Get Started Now
                    </span>
                  </motion.div>
                </Link>

                <Link to="/contests" className="inline-block w-full xs:w-auto">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative inline-flex items-center justify-center w-full xs:w-auto px-6 sm:px-8 md:px-10 py-4 sm:py-5 text-base sm:text-lg md:text-xl font-bold text-blue-700 border-2 border-blue-300 bg-blue-50 rounded-xl sm:rounded-2xl backdrop-blur-sm hover:border-blue-500 hover:bg-blue-100 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 to-blue-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl sm:rounded-2xl"></div>
                    <span className="relative whitespace-nowrap">Browse Contests</span>
                  </motion.div>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}