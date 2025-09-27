// React import not required with automatic JSX runtime
import { Github, Twitter, Mail, ExternalLink, MessageCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '@/context/I18nContext';
// config import removed (unused)

export default function Footer() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const buildTime = (import.meta as any)?.env?.VITE_BUILD_TIME as string | undefined;
  // OTP dev badge and debug button removed
  const handleNavigation = (path: string) => {
    if (/^https?:\/\//i.test(path)) {
      window.open(path, '_blank', 'noopener,noreferrer');
    } else {
      navigate(path);
    }
  };

  return (
    <footer className="bg-white dark:bg-gray-950 border-t border-sky-100 dark:border-green-900 py-3 sm:py-4 md:py-6 lg:py-8 relative overflow-hidden transition-colors duration-300">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Primary glow orbs */}
        <div className="absolute top-8 left-[5%] w-24 sm:w-32 md:w-48 lg:w-64 h-24 sm:h-32 md:h-48 lg:h-64 bg-gradient-to-br from-sky-200/40 via-sky-100/30 to-blue-200/35 dark:from-green-400/20 dark:via-green-300/15 dark:to-emerald-400/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-8 right-[5%] w-28 sm:w-36 md:w-52 lg:w-72 h-28 sm:h-36 md:h-52 lg:h-72 bg-gradient-to-tl from-blue-200/35 via-sky-100/25 to-cyan-200/40 dark:from-emerald-400/15 dark:via-green-300/12 dark:to-green-400/18 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 sm:w-44 md:w-60 lg:w-80 h-32 sm:h-44 md:h-60 lg:h-80 bg-gradient-to-r from-sky-100/25 via-blue-100/20 to-cyan-100/30 dark:from-green-300/10 dark:via-emerald-300/8 dark:to-green-400/12 rounded-full blur-2xl animate-pulse delay-700"></div>

        {/* Floating particles */}
        <div className="absolute top-[15%] right-[20%] w-1 h-1 sm:w-1.5 sm:h-1.5 bg-sky-400/60 dark:bg-green-400/80 rounded-full animate-ping delay-300"></div>
        <div className="absolute top-[70%] left-[15%] w-1 h-1 bg-blue-400/70 dark:bg-emerald-400/90 rounded-full animate-ping delay-1000"></div>
        <div className="absolute top-[30%] right-[35%] w-1 h-1 sm:w-1.5 sm:h-1.5 bg-cyan-400/60 dark:bg-green-300/80 rounded-full animate-ping delay-500"></div>
        <div className="absolute bottom-[20%] left-[30%] w-0.5 h-0.5 sm:w-1 sm:h-1 bg-sky-500/80 dark:bg-emerald-300/90 rounded-full animate-ping delay-1500"></div>
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(14,165,233,0.3) 1px, transparent 0)`,
          backgroundSize: '30px 30px'
        }}
      ></div>

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-sky-50/10 via-transparent to-white/20 dark:from-green-900/10 dark:via-transparent dark:to-gray-950/30 pointer-events-none"></div>

      {/* Container */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 relative z-20">
        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-12 gap-4 sm:gap-5 lg:gap-6">
          
          {/* Brand Section */}
          <div className="sm:col-span-2 lg:col-span-2 xl:col-span-4">
            <div className="space-y-3 sm:space-y-4">
              {/* Logo & Brand */}
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-start space-x-2 group cursor-pointer">
                  <img
                    src="/logo.png"
                    alt="EarnByCode Logo"
                    className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 object-contain flex-shrink-0"
                  />
                  <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                    <h1 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-3xl font-black tracking-tight">
                      <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-600 dark:from-green-400 dark:via-emerald-400 dark:to-green-300 bg-clip-text text-transparent">
                        EarnByCode
                      </span>
                    </h1>
                    <p className="text-xs sm:text-sm md:text-sm text-gray-600 dark:text-green-300 font-medium tracking-wide transition-colors duration-300">
                      {t('brand.tagline')}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1 sm:space-y-2">
                  <p className="text-gray-700 dark:text-green-200 text-xs sm:text-sm md:text-sm leading-relaxed font-medium transition-colors duration-300 max-w-md">
                    {t('brand.description')}
                  </p>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {[
                  { icon: Github, href: 'https://github.com/dheerajgaurgithub', gradient: 'from-gray-500 to-gray-700', hoverGradient: 'hover:from-gray-700 hover:to-gray-900' },
                  { icon: Twitter, href: 'https://www.instagram.com/mahirgaur.official/?locale=pt_BR&hl=af', gradient: 'from-sky-500 to-blue-600', hoverGradient: 'hover:from-sky-400 hover:to-blue-500' },
                  { icon: MessageCircle, href: '#', gradient: 'from-blue-500 to-cyan-600', hoverGradient: 'hover:from-blue-400 hover:to-cyan-500' },
                  { icon: Mail, href: '#', gradient: 'from-cyan-500 to-sky-600', hoverGradient: 'hover:from-cyan-400 hover:to-sky-500' }
                ].map((social, index) => (
                  <button
                    key={index}
                    onClick={() => handleNavigation(social.href)}
                    className="group relative p-1.5 sm:p-2 bg-gradient-to-br from-white/90 via-sky-50/70 to-blue-50/90 dark:from-gray-800/90 dark:via-gray-750/70 dark:to-green-900/90 rounded-lg border border-sky-200/60 dark:border-green-600/60 hover:border-sky-300/80 dark:hover:border-green-500/80 transition-all duration-400 backdrop-blur-sm hover:scale-105 hover:-translate-y-0.5 shadow-md hover:shadow-lg"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${social.gradient} dark:from-green-500 dark:to-emerald-600 opacity-0 group-hover:opacity-20 rounded-lg transition-all duration-400`}></div>
                    <social.icon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-green-300 group-hover:text-gray-800 dark:group-hover:text-green-100 transition-colors duration-300 relative z-10" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Company Navigation */}
          <div className="lg:col-span-1 xl:col-span-3">
            <div className="space-y-3 sm:space-y-4">
              <div className="relative">
                <h3 className="text-sm sm:text-base md:text-base font-bold text-gray-800 dark:text-green-300 tracking-tight mb-2 transition-colors duration-300">
                  <Link to="/company">
                    <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-600 dark:from-green-400 dark:via-emerald-400 dark:to-green-300 bg-clip-text text-transparent cursor-pointer hover:from-sky-500 hover:via-blue-500 hover:to-cyan-500 transition-all duration-300">
                      {t('common.company')}
                    </span>
                  </Link>
                </h3>
                <div className="w-6 sm:w-8 h-0.5 bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-600 dark:from-green-400 dark:via-emerald-400 dark:to-green-300 rounded-full"></div>
              </div>

              <ul className="space-y-1 sm:space-y-2">
                {[
                  { nameKey: 'common.about', link: '/about' },
                  { nameKey: 'common.careers', link: '/careers' },
                  { nameKey: 'common.press', link: '/press' },
                  { nameKey: 'common.contact', link: '/contact' },
                  { nameKey: 'common.blog', link: '/blog' },
                  { nameKey: 'common.help_center', link: '/help' },
                ].map((item) => (
                  <li key={item.link}>
                    <Link
                      to={item.link}
                      className="group flex items-center gap-1 text-gray-600 dark:text-green-300 hover:text-gray-800 dark:hover:text-green-100 transition-all duration-300 py-1 px-2 rounded-md hover:bg-sky-50/60 dark:hover:bg-green-900/30 border border-transparent hover:border-sky-200/50 dark:hover:border-green-600/50"
                    >
                      <span className="font-medium tracking-wide group-hover:translate-x-1 transition-transform duration-300 text-xs sm:text-sm md:text-sm">
                        {t(item.nameKey as any)}
                      </span>
                      <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-0 group-hover:opacity-100 transition-all duration-300 text-gray-400 dark:text-green-400 group-hover:text-sky-600 dark:group-hover:text-green-200" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Community Section */}
          <div className="lg:col-span-1 xl:col-span-3">
            <div className="space-y-3 sm:space-y-4">
              <div className="relative">
                <h3 className="text-sm sm:text-base md:text-base font-bold text-gray-800 dark:text-emerald-300 tracking-tight mb-2 transition-colors duration-300">
                  <span className="bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 dark:from-emerald-400 dark:via-green-400 dark:to-green-300 bg-clip-text text-transparent">
                    {t('common.stay_connected')}
                  </span>
                </h3>
                <div className="w-6 sm:w-8 h-0.5 bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 dark:from-emerald-400 dark:via-green-400 dark:to-green-300 rounded-full"></div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <p className="text-gray-600 dark:text-green-300 text-xs sm:text-sm md:text-sm leading-relaxed transition-colors duration-300 font-medium">
                  {t('common.stay_connected')}
                </p>

                <div className="space-y-1.5 sm:space-y-2">
                  <button
                    onClick={() => handleNavigation('/newsletter')}
                    className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-sky-600 to-blue-600 dark:from-green-600 dark:to-emerald-600 text-white rounded-md hover:from-sky-500 hover:to-blue-500 dark:hover:from-green-500 dark:hover:to-emerald-500 transition-all duration-300 text-xs sm:text-sm md:text-sm font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  >
                    {t('common.subscribe_newsletter')}
                  </button>
                  <button
                    onClick={() => handleNavigation('/community')}
                    className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 border-2 border-sky-400 dark:border-green-500 text-sky-700 dark:text-green-400 rounded-md hover:bg-sky-50 dark:hover:bg-green-900/30 hover:border-sky-500 dark:hover:border-green-400 transition-all duration-300 text-xs sm:text-sm md:text-sm font-medium hover:-translate-y-0.5"
                  >
                    {t('common.join_community')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Legal/Copyright Section */}
          <div className="lg:col-span-2 xl:col-span-2">
            <div className="space-y-3 sm:space-y-4">
              <div className="relative">
                <h3 className="text-sm sm:text-base md:text-base font-bold text-gray-800 dark:text-green-300 tracking-tight mb-2 transition-colors duration-300">
                  <span className="bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 dark:from-green-400 dark:via-emerald-400 dark:to-green-300 bg-clip-text text-transparent">
                    {t('common.legal')}
                  </span>
                </h3>
                <div className="w-6 sm:w-8 h-0.5 bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 dark:from-green-400 dark:via-emerald-400 dark:to-green-300 rounded-full"></div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <p className="text-gray-700 dark:text-green-200 text-xs sm:text-sm md:text-sm font-medium tracking-wide transition-colors duration-300">
                  © 2025
                  <span className="text-transparent bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-600 dark:from-green-400 dark:via-emerald-400 dark:to-green-300 bg-clip-text font-bold mx-1">EarnByCode</span>
                  {t('common.all_rights_reserved')}
                </p>

                <div className="space-y-0.5 sm:space-y-1">
                  <Link
                    to="/terms-of-service"
                    className="block text-gray-600 dark:text-green-400 hover:text-gray-800 dark:hover:text-green-200 transition-colors duration-300 font-medium tracking-wide py-0.5 px-1 rounded hover:bg-sky-50/40 dark:hover:bg-green-900/30 text-xs sm:text-sm md:text-sm"
                  >
                    {t('common.terms')}
                  </Link>
                  <Link
                    to="/privacy-policy"
                    className="block text-gray-600 dark:text-green-400 hover:text-gray-800 dark:hover:text-green-200 transition-colors duration-300 font-medium tracking-wide py-0.5 px-1 rounded hover:bg-sky-50/40 dark:hover:bg-green-900/30 text-xs sm:text-sm md:text-sm"
                  >
                    {t('common.privacy')}
                  </Link>
                  <Link
                    to="/cookie-policy"
                    className="block text-gray-600 dark:text-green-400 hover:text-gray-800 dark:hover:text-green-200 transition-colors duration-300 font-medium tracking-wide py-0.5 px-1 rounded hover:bg-sky-50/40 dark:hover:bg-green-900/30 text-xs sm:text-sm md:text-sm"
                  >
                    {t('common.cookies')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {buildTime && (
        <div className="absolute bottom-1 right-2 sm:bottom-2 sm:right-3 z-30">
          {buildTime && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] md:text-xs font-medium border bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-sky-200 dark:border-green-700 text-sky-700 dark:text-green-300 shadow-sm"
              title={`Build time: ${buildTime}`}
            >
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-sky-500 dark:bg-green-500 animate-pulse"></span>
              Build: {buildTime}
            </span>
          )}
        </div>
      )}
    </footer>
  );
}