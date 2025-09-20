import React from 'react';
import { Github, Twitter, Mail, ExternalLink, MessageCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();
  const handleNavigation = (path: string) => {
    if (/^https?:\/\//i.test(path)) {
      window.open(path, '_blank', 'noopener,noreferrer');
    } else {
      navigate(path);
    }
  };

  return (
    <footer className="bg-gray-100 dark:bg-gray-950 border-t border-blue-200 dark:border-gray-800 py-4 sm:py-6 lg:py-8 relative overflow-hidden transition-colors duration-300">
      {/* Enhanced Background Effects for Darker Theme */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Primary glow orbs - more visible on dark background */}
        <div className="absolute top-10 left-[5%] w-40 sm:w-64 lg:w-80 h-40 sm:h-64 lg:h-80 bg-gradient-to-br from-blue-600/30 via-indigo-500/20 to-purple-600/25 dark:from-blue-400/20 dark:via-indigo-400/15 dark:to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-[5%] w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 bg-gradient-to-tl from-indigo-600/25 via-blue-500/20 to-cyan-600/30 dark:from-indigo-400/15 dark:via-blue-400/12 dark:to-cyan-400/18 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-56 sm:w-80 lg:w-[28rem] h-56 sm:h-80 lg:h-[28rem] bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-purple-500/20 dark:from-blue-400/10 dark:via-indigo-400/8 dark:to-purple-400/12 rounded-full blur-3xl animate-pulse delay-700"></div>

        {/* Enhanced floating particles */}
        <div className="absolute top-[15%] right-[20%] w-2 h-2 bg-blue-500/60 dark:bg-blue-400/80 rounded-full animate-ping delay-300"></div>
        <div className="absolute top-[70%] left-[15%] w-1.5 h-1.5 bg-indigo-500/70 dark:bg-indigo-400/90 rounded-full animate-ping delay-1000"></div>
        <div className="absolute top-[30%] right-[35%] w-2 h-2 bg-purple-500/60 dark:bg-purple-400/80 rounded-full animate-ping delay-500"></div>
        <div className="absolute bottom-[20%] left-[30%] w-1 h-1 bg-cyan-500/80 dark:bg-cyan-400/90 rounded-full animate-ping delay-1500"></div>
      </div>

      {/* Enhanced grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(59,130,246,0.4) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      ></div>

      {/* Stronger radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-blue-100/8 via-transparent to-gray-200/15 dark:from-blue-800/10 dark:via-transparent dark:to-gray-950/30 pointer-events-none"></div>

      {/* Full Width Container */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 relative z-20">
        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Brand Section - Takes more space and positioned left */}
          <div className="sm:col-span-2 lg:col-span-2 xl:col-span-4">
            <div className="space-y-4">
              {/* Enhanced Logo & Brand */}
              <div className="space-y-3">
                <div className="flex items-start space-x-2 group cursor-pointer">
                  <div className="relative flex-shrink-0">
                    {/* Enhanced glowing backdrop */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/40 via-indigo-600/30 to-purple-600/35 dark:from-blue-400/30 dark:via-indigo-500/25 dark:to-purple-500/30 rounded-xl blur-lg opacity-70 group-hover:opacity-100 transition-all duration-700"></div>
                    {/* Logo container */}
                    <div className="relative bg-gradient-to-br from-white/90 via-blue-50/80 to-indigo-50/90 dark:from-gray-900/90 dark:via-gray-800/80 dark:to-gray-850/90 p-1.5 rounded-xl border border-blue-300/60 dark:border-gray-700/60 group-hover:border-blue-400/50 dark:group-hover:border-blue-500/50 transition-all duration-700 backdrop-blur-sm shadow-lg">
                      <img
                        src="/logo.png"
                        alt="Logo"
                        className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 object-contain"
                      />
                    </div>
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">
                      <span className="bg-gradient-to-r from-gray-800 via-gray-900 to-black dark:from-gray-100 dark:via-white dark:to-gray-200 bg-clip-text text-transparent">
                        Algo
                      </span>
                      <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-300 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                        Bucks
                      </span>
                    </h1>
                    <p className="text-xs sm:text-sm lg:text-base text-gray-700 dark:text-gray-300 font-semibold tracking-wide transition-colors duration-300">
                      Think smart. Code harder. Earn more.
                    </p>
                  </div>
                </div>

                {/* Enhanced Description */}
                <div className="space-y-2">
                  <p className="text-gray-800 dark:text-gray-200 text-xs sm:text-sm leading-relaxed font-medium transition-colors duration-300 max-w-md">
                    The ultimate algorithmic trading platform where elite developers
                    <span className="text-transparent bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-300 dark:to-blue-400 bg-clip-text font-bold">
                      {' '}compete
                    </span>, earn prestigious
                    <span className="text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-300 dark:to-purple-400 bg-clip-text font-bold">
                      {' '}AlgoBucks
                    </span>, and claim
                    <span className="text-transparent bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-300 bg-clip-text font-bold">
                      {' '}real rewards
                    </span> through skill-based algorithmic mastery.
                  </p>
                </div>
              </div>

              {/* Enhanced Social Links */}
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: Github, href: 'https://github.com/dheerajgaurgithub', gradient: 'from-gray-600 to-gray-800', hoverGradient: 'hover:from-gray-800 hover:to-black' },
                  { icon: Twitter, href: 'https://www.instagram.com/mahirgaur.official/?locale=pt_BR&hl=af', gradient: 'from-blue-500 to-blue-700', hoverGradient: 'hover:from-blue-400 hover:to-blue-600' },
                  { icon: MessageCircle, href: '#', gradient: 'from-indigo-500 to-purple-600', hoverGradient: 'hover:from-indigo-400 hover:to-purple-500' },
                  { icon: Mail, href: '#', gradient: 'from-cyan-500 to-blue-600', hoverGradient: 'hover:from-cyan-400 hover:to-blue-500' }
                ].map((social, index) => (
                  <button
                    key={index}
                    onClick={() => handleNavigation(social.href)}
                    className="group relative p-2 bg-gradient-to-br from-white/80 via-blue-50/60 to-indigo-50/80 dark:from-gray-800/80 dark:via-gray-750/60 dark:to-gray-800/80 rounded-xl border border-blue-200/70 dark:border-gray-600/70 hover:border-blue-300/90 dark:hover:border-blue-500/90 transition-all duration-500 backdrop-blur-sm hover:scale-110 hover:-translate-y-1 shadow-lg hover:shadow-xl"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${social.gradient} opacity-0 group-hover:opacity-25 rounded-xl transition-all duration-500`}></div>
                    <social.icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300 relative z-10" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Company Navigation - Positioned center-left */}
          <div className="lg:col-span-1 xl:col-span-3">
            <div className="space-y-4">
              <div className="relative">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-blue-300 tracking-tight mb-2 transition-colors duration-300">
                  <Link to="/company">
                    <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 dark:from-indigo-300 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent cursor-pointer hover:from-indigo-500 hover:via-blue-500 hover:to-purple-500 transition-all duration-300">
                      Company
                    </span>
                  </Link>
                </h3>
                <div className="w-8 h-0.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 dark:from-indigo-300 dark:via-blue-400 dark:to-purple-400 rounded-full"></div>
              </div>

              {/* Vertical List for better mobile layout */}
              <ul className="space-y-2">
                {[
                  { name: "About", link: "/about" },
                  { name: "Careers", link: "/careers" },
                  { name: "Press", link: "/press" },
                  { name: "Contact", link: "/contact" },
                  { name: "Blog", link: "/blog" },
                  { name: "Help Center", link: "/help" },
                ].map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.link}
                      className="group flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-300 py-1 px-2 rounded-lg hover:bg-blue-50/50 dark:hover:bg-gray-800/50 border border-transparent hover:border-blue-200/50 dark:hover:border-gray-600/50"
                    >
                      <span className="font-semibold tracking-wide group-hover:translate-x-1 transition-transform duration-300 text-xs sm:text-sm">
                        {item.name}
                      </span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all duration-300 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Community Section - Positioned center-right */}
          <div className="lg:col-span-1 xl:col-span-3">
            <div className="space-y-4">
              <div className="relative">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-purple-300 tracking-tight mb-2 transition-colors duration-300">
                  <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 dark:from-purple-300 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                    Stay Connected
                  </span>
                </h3>
                <div className="w-8 h-0.5 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 dark:from-purple-300 dark:via-blue-400 dark:to-indigo-400 rounded-full"></div>
              </div>

              <div className="space-y-3">
                <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm leading-relaxed transition-colors duration-300 font-medium">
                  Join our community of algorithmic traders and stay updated.
                </p>

                <div className="space-y-2">
                  <button
                    onClick={() => handleNavigation('/newsletter')}
                    className="w-full px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-600 text-white rounded-lg hover:from-blue-500 hover:to-indigo-500 dark:hover:from-blue-400 dark:hover:to-indigo-500 transition-all duration-300 text-xs sm:text-sm font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  >
                    Subscribe Newsletter
                  </button>
                  <button
                    onClick={() => handleNavigation('/community')}
                    className="w-full px-3 py-2 border-2 border-blue-400 dark:border-blue-500 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 text-xs sm:text-sm font-semibold hover:-translate-y-0.5"
                  >
                    Join Community
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Legal/Copyright Section - Positioned far right */}
          <div className="lg:col-span-2 xl:col-span-2">
            <div className="space-y-4">
              <div className="relative">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-cyan-300 tracking-tight mb-2 transition-colors duration-300">
                  <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 dark:from-cyan-300 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                    Legal
                  </span>
                </h3>
                <div className="w-8 h-0.5 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 dark:from-cyan-300 dark:via-blue-400 dark:to-indigo-400 rounded-full"></div>
              </div>

              <div className="space-y-3">
                <p className="text-gray-800 dark:text-gray-200 text-xs font-semibold tracking-wide transition-colors duration-300">
                  © 2025
                  <span className="text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-300 dark:via-indigo-400 dark:to-purple-400 bg-clip-text font-bold mx-1">AlgoBucks</span>
                  All rights reserved.
                </p>

                <div className="space-y-1">
                  {['Terms of Service', 'Privacy Policy', 'Cookie Policy'].map((name) => (
                    <Link
                      key={name}
                      to={`/${name.toLowerCase().replace(/\s+/g, '-')}`}
                      className="block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 font-medium tracking-wide py-0.5 px-1 rounded hover:bg-blue-50/30 dark:hover:bg-gray-800/50 text-xs"
                    >
                      {name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}