import React from 'react';
import { Github, Twitter, Mail, ExternalLink, MessageCircle } from 'lucide-react';

export default function Footer() {
  const handleNavigation = (path: string) => {
    console.log(`Navigate to: ${path}`);
  };

  return (
    <footer className="bg-white border-t border-blue-200 py-3 sm:py-4 relative overflow-hidden">
      {/* Ethereal Background Effects */}
      <div className="absolute inset-0">
        {/* Primary glow orbs */}
        <div className="absolute top-5 left-[10%] w-32 sm:w-48 h-32 sm:h-48 bg-gradient-to-br from-blue-200/20 via-indigo-300/15 to-sky-200/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-5 right-[15%] w-36 sm:w-56 h-36 sm:h-56 bg-gradient-to-tl from-indigo-200/15 via-blue-300/10 to-sky-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 sm:w-64 h-40 sm:h-64 bg-gradient-to-r from-blue-100/8 via-indigo-100/5 to-sky-100/10 rounded-full blur-3xl animate-pulse delay-700"></div>

        {/* Floating particles */}
        <div className="absolute top-[20%] left-[70%] w-1 h-1 bg-blue-400/30 rounded-full animate-ping delay-300"></div>
        <div className="absolute top-[60%] left-[20%] w-0.5 h-0.5 bg-indigo-400/60 rounded-full animate-ping delay-1000"></div>
        <div className="absolute top-[40%] right-[25%] w-1 h-1 bg-sky-400/50 rounded-full animate-ping delay-500"></div>
      </div>

      {/* Sophisticated grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(59,130,246,0.3) 1px, transparent 0)`
        }}
      ></div>

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-blue-50/5 via-transparent to-white/20"></div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 relative z-20">
        {/* Premium Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Luxury Brand Section */}
          <div className="lg:col-span-6">
            <div className="space-y-4">
              {/* Premium Logo & Title */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 group cursor-pointer">
                  <div className="relative">
                    {/* Glowing backdrop */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 via-indigo-500/25 to-sky-500/20 rounded-lg blur-lg opacity-60 group-hover:opacity-100 transition-all duration-500"></div>
                    {/* Logo container */}
                    <div className="relative bg-gradient-to-br from-blue-50/80 via-white/60 to-blue-100/90 p-1.5 rounded-lg border border-blue-300/50 group-hover:border-blue-400/40 transition-all duration-500 backdrop-blur-sm">
                      <img
                        src="/logo.png"
                        alt="Logo"
                        className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                      />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                      <span className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 bg-clip-text text-transparent">
                        Algo
                      </span>
                      <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 bg-clip-text text-transparent">
                        Bucks
                      </span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium tracking-wide">
                      Think smart. Code harder. Earn more.
                    </p>
                  </div>
                </div>

                {/* Elegant Description */}
                <div className="space-y-2">
                  <p className="text-slate-700 text-xs sm:text-sm leading-relaxed font-light">
                    The ultimate algorithmic trading platform where elite developers
                    <span className="text-transparent bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text font-semibold">
                      {' '}compete
                    </span>, earn prestigious
                    <span className="text-transparent bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text font-semibold">
                      {' '}AlgoBucks
                    </span>, and claim
                    <span className="text-transparent bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text font-semibold">
                      {' '}real rewards
                    </span> through skill-based algorithmic mastery.
                  </p>
                </div>
              </div>

              {/* Sophisticated Social Links */}
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: Github, href: 'https://github.com/dheerajgaurgithub', gradient: 'from-slate-600 to-slate-800', hoverGradient: 'hover:from-slate-800 hover:to-slate-700' },
                  { icon: Twitter, href: 'https://www.instagram.com/mahirgaur.official/?locale=pt_BR&hl=af', gradient: 'from-blue-500 to-blue-700', hoverGradient: 'hover:from-blue-400 hover:to-blue-600' },
                  { icon: MessageCircle, href: '#', gradient: 'from-indigo-500 to-blue-600', hoverGradient: 'hover:from-indigo-400 hover:to-blue-500' },
                  { icon: Mail, href: '#', gradient: 'from-sky-500 to-blue-600', hoverGradient: 'hover:from-sky-400 hover:to-blue-500' }
                ].map((social, index) => (
                  <button
                    key={index}
                    onClick={() => handleNavigation(social.href)}
                    className="group relative p-2 bg-gradient-to-br from-blue-50/50 via-white/30 to-blue-100/70 rounded-lg border border-blue-200/60 hover:border-blue-300/80 transition-all duration-500 backdrop-blur-sm hover:scale-110"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${social.gradient} opacity-0 group-hover:opacity-20 rounded-lg transition-all duration-500`}></div>
                    <social.icon className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600 group-hover:text-slate-800 transition-colors duration-300 relative z-10" />
                  </button>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
                <p className="text-slate-700 text-xs font-light tracking-wide">
                  © 2025
                  <span className="text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 bg-clip-text font-bold mx-1">AlgoBucks</span>
                  All rights reserved.
                </p>

                <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-xs">
                  {['Terms', 'Privacy', 'Cookies'].map((link) => (
                    <button
                      key={link}
                      onClick={() => handleNavigation(`/${link.toLowerCase()}`)}
                      className="text-slate-500 hover:text-slate-700 transition-colors duration-300 font-medium tracking-wide py-1"
                    >
                      {link}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Refined Navigation Section */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              <div className="relative">
                <h3 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight mb-1">
                  <button onClick={() => handleNavigation('/company')}>
                    <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-600 bg-clip-text text-transparent cursor-pointer">
                      Company
                    </span>
                  </button>
                </h3>
                <div className="w-8 h-0.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-600 rounded-full"></div>
              </div>

              {/* Horizontal List */}
              <ul className="flex flex-wrap gap-3">
                {[
                  { name: "About", link: "/about" },
                  { name: "Careers", link: "/careers" },
                  { name: "Press", link: "/press" },
                  { name: "Contact", link: "/contact" },
                  { name: "Blog", link: "/blog" },
                  { name: "Help Center", link: "/help" },
                ].map((item) => (
                  <li key={item.name}>
                    <button
                      onClick={() => handleNavigation(item.link)}
                      className="group flex items-center gap-1 text-slate-600 hover:text-slate-800 transition-all duration-300 py-1 px-1 rounded-md hover:bg-blue-50/30"
                    >
                      <span className="font-medium tracking-wide group-hover:translate-x-1 transition-transform duration-300 text-xs">
                        {item.name}
                      </span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 text-slate-500 group-hover:text-blue-600" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter/Contact Section */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              <div className="relative">
                <h3 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight mb-1">
                  <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Stay Connected
                  </span>
                </h3>
                <div className="w-8 h-0.5 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 rounded-full"></div>
              </div>

              <div className="space-y-3">
                <p className="text-slate-600 text-xs leading-relaxed">
                  Join our community of algorithmic traders and stay updated with the latest features, contests, and opportunities.
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleNavigation('/newsletter')}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-md hover:from-blue-400 hover:to-indigo-500 transition-all duration-300 text-center text-xs font-medium"
                  >
                    Subscribe
                  </button>
                  <button
                    onClick={() => handleNavigation('/community')}
                    className="px-3 py-1.5 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 transition-all duration-300 text-center text-xs font-medium"
                  >
                    Join Community
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}