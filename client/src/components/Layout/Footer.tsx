import React from 'react';
import { Heart, Github, Twitter, Mail, ExternalLink, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-blue-200 py-4 sm:py-6 lg:py-8 relative overflow-hidden">
      {/* Ethereal Background Effects */}
      <div className="absolute inset-0">
        {/* Primary glow orbs */}
        <div className="absolute top-10 left-[10%] w-64 sm:w-80 lg:w-96 h-64 sm:h-80 lg:h-96 bg-gradient-to-br from-blue-200/20 via-indigo-300/15 to-sky-200/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-[15%] w-72 sm:w-96 lg:w-[28rem] h-72 sm:h-96 lg:h-[28rem] bg-gradient-to-tl from-indigo-200/15 via-blue-300/10 to-sky-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 lg:w-[32rem] h-80 sm:h-96 lg:h-[32rem] bg-gradient-to-r from-blue-100/8 via-indigo-100/5 to-sky-100/10 rounded-full blur-3xl animate-pulse delay-700"></div>

        {/* Floating particles */}
        <div className="absolute top-[20%] left-[70%] w-2 h-2 bg-blue-400/30 rounded-full animate-ping delay-300"></div>
        <div className="absolute top-[60%] left-[20%] w-1 h-1 bg-indigo-400/60 rounded-full animate-ping delay-1000"></div>
        <div className="absolute top-[40%] right-[25%] w-1.5 h-1.5 bg-sky-400/50 rounded-full animate-ping delay-500"></div>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        {/* Premium Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Luxury Brand Section */}
          <div className="lg:col-span-6">
            <div className="space-y-8">
              {/* Premium Logo & Title */}
              <div className="space-y-6">
                <div className="flex items-center space-x-4 group cursor-pointer">
                  <div className="relative">
                    {/* Glowing backdrop */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 via-indigo-500/25 to-sky-500/20 rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-all duration-500"></div>
                    {/* Logo container */}
                    <div className="relative bg-gradient-to-br from-blue-50/80 via-white/60 to-blue-100/90 p-2 rounded-2xl border border-blue-300/50 group-hover:border-blue-400/40 transition-all duration-500 backdrop-blur-sm">
                      <img
                        src="/logo.png"
                        alt="Logo"
                        className="w-16 h-16 sm:w-18 sm:h-18 object-contain"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
                      <span className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 bg-clip-text text-transparent">
                        Algo
                      </span>
                      <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 bg-clip-text text-transparent">
                        Bucks
                      </span>
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600 font-medium tracking-wide">
                      Think smart. Code harder. Earn more.
                    </p>
                  </div>
                </div>

                {/* Elegant Description */}
                <div className="space-y-4">
                  <p className="text-slate-700 text-base sm:text-lg lg:text-xl leading-relaxed font-light">
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
              <div className="flex flex-wrap gap-3 sm:gap-4">
                {[
                  { icon: Github, href: 'https://github.com/dheerajgaurgithub', gradient: 'from-slate-600 to-slate-800', hoverGradient: 'hover:from-slate-800 hover:to-slate-700' },
                  { icon: Twitter, href: 'https://www.instagram.com/mahirgaur.official/?locale=pt_BR&hl=af', gradient: 'from-blue-500 to-blue-700', hoverGradient: 'hover:from-blue-400 hover:to-blue-600' },
                  { icon: MessageCircle, href: '/contact', gradient: 'from-indigo-500 to-blue-600', hoverGradient: 'hover:from-indigo-400 hover:to-blue-500' },
                  { icon: Mail, href: '/contact', gradient: 'from-sky-500 to-blue-600', hoverGradient: 'hover:from-sky-400 hover:to-blue-500' }
                ].map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    className="group relative p-3 bg-gradient-to-br from-blue-50/50 via-white/30 to-blue-100/70 rounded-2xl border border-blue-200/60 hover:border-blue-300/80 transition-all duration-500 backdrop-blur-sm hover:scale-110"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${social.gradient} opacity-0 group-hover:opacity-20 rounded-2xl transition-all duration-500`}></div>
                    <social.icon className="w-5 h-5 text-slate-600 group-hover:text-slate-800 transition-colors duration-300 relative z-10" />
                  </a>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 text-center sm:text-left">
                <p className="text-slate-700 text-sm sm:text-base font-light tracking-wide">
                  © 2025
                  <span className="text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 bg-clip-text font-bold mx-2">AlgoBucks</span>
                  All rights reserved.
                </p>

                <div className="flex flex-wrap justify-center sm:justify-start gap-6 text-sm">
                  {['Terms', 'Privacy', 'Cookies'].map((link) => (
                    <Link
                      key={link}
                      to={`/${link.toLowerCase()}`}
                      className="text-slate-500 hover:text-slate-700 transition-colors duration-300 font-medium tracking-wide py-2"
                    >
                      {link}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Refined Navigation Section */}
          <div className="lg:col-span-3">
            <div className="space-y-8">
              <div className="relative">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight mb-2">
                  <Link to="/company">
                    <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-600 bg-clip-text text-transparent cursor-pointer">
                      Company
                    </span>
                  </Link>
                </h3>
                <div className="w-16 h-0.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-600 rounded-full"></div>
              </div>

              {/* Horizontal List */}
              <ul className="flex flex-wrap gap-6">
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
                      className="group flex items-center gap-1 text-slate-600 hover:text-slate-800 transition-all duration-300 py-2 px-1 rounded-lg hover:bg-blue-50/30"
                    >
                      <span className="font-medium tracking-wide group-hover:translate-x-1 transition-transform duration-300">
                        {item.name}
                      </span>
                      <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-300 text-slate-500 group-hover:text-blue-600" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter/Contact Section */}
          <div className="lg:col-span-3">
            <div className="space-y-8">
              <div className="relative">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight mb-2">
                  <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Stay Connected
                  </span>
                </h3>
                <div className="w-16 h-0.5 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 rounded-full"></div>
              </div>

              <div className="space-y-4">
                <p className="text-slate-600 text-sm leading-relaxed">
                  Join our community of algorithmic traders and stay updated with the latest features, contests, and opportunities.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/newsletter"
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-400 hover:to-indigo-500 transition-all duration-300 text-center text-sm font-medium"
                  >
                    Subscribe
                  </Link>
                  <Link
                    to="/community"
                    className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-all duration-300 text-center text-sm font-medium"
                  >
                    Join Community
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
