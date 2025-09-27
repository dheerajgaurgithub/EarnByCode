import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import {
  User,
  LogOut,
  Settings,
  Award,
  Wallet as WalletIcon,
  Trophy,
  Shield,
  Menu,
  X,
  Code2,
  MessageSquare,
  Users,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import config from '@/lib/config';

type NavItem = {
  nameKey: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  hoverGradient: string;
};

// Navigation items with blue theme gradients
const NAV_ITEMS: NavItem[] = [
  {
    nameKey: 'nav.wallet',
    path: '/wallet',
    icon: WalletIcon,
    gradient: 'from-blue-400 to-blue-600',
    hoverGradient: 'from-blue-400 to-blue-600'
  },
  {
    nameKey: 'nav.problems',
    path: '/problems',
    icon: Code2,
    gradient: 'from-blue-500 to-indigo-600',
    hoverGradient: 'from-blue-500 to-indigo-600'
  },
  {
    nameKey: 'nav.contests',
    path: '/contests',
    icon: Trophy,
    gradient: 'from-blue-400 to-blue-600',
    hoverGradient: 'from-blue-400 to-blue-600'
  },
  {
    nameKey: 'nav.discuss',
    path: '/discuss',
    icon: MessageSquare,
    gradient: 'from-indigo-500 to-blue-600',
    hoverGradient: 'from-indigo-500 to-blue-600'
  },
  {
    nameKey: 'nav.leaderboard',
    path: '/leaderboard',
    icon: Users,
    gradient: 'from-sky-500 to-blue-600',
    hoverGradient: 'from-sky-500 to-blue-600'
  },
];

type UserDisplayInfo = {
  username: string;
  email?: string;
  isAdmin?: boolean;
  codecoins?: number;
  walletBalance?: number;
  points?: number;
  avatarUrl?: string;
};

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  // OTP dev badge removed

  const userInfo = user as UserDisplayInfo | null;

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  // Close mobile menu when route changes
  useEffect(() => {
    setShowMobileMenu(false);
  }, [location.pathname]);

  // OTP flags removed

  // Close user dropdown on outside click and Escape
  useEffect(() => {
    if (!showDropdown) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const el = dropdownRef.current;
      if (el && !el.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowDropdown(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown, { passive: true });
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown as any);
      document.removeEventListener('keydown', onKey);
    };
  }, [showDropdown]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-500 overflow-visible',
        'bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl',
        scrolled
          ? 'border-b border-sky-200/60 dark:border-green-800/60 shadow-lg shadow-sky-500/10 dark:shadow-green-900/20'
          : 'border-b border-sky-100/50 dark:border-green-900/50',
        'supports-[backdrop-filter]:bg-white/90 dark:supports-[backdrop-filter]:bg-gray-950/90'
      )}
    >
      {/* Top border gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-400/30 dark:via-green-500/40 to-transparent pointer-events-none" />

      <div className="container mx-auto px-2 sm:px-3 md:px-4">
        <div className="flex justify-between items-center h-10 sm:h-12">
          {/* Logo Section */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0 flex-shrink-0">
            <Link
              to="/"
              className="flex items-center space-x-1.5 sm:space-x-2 group transition-all duration-300 min-w-0"
              aria-label="Home"
            >
              <div className="relative flex-shrink-0">
                <div className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-12 lg:w-12 flex items-center justify-center relative">
                  <img
                    src="/logo.png"
                    alt="EarnByCode Logo"
                    className="h-full w-full object-contain transition-all duration-500 group-hover:scale-110 drop-shadow-md"
                  />
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-500/30 via-blue-500/30 to-cyan-600/30 dark:from-green-400/40 dark:via-emerald-500/40 dark:to-green-600/40 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-all duration-700 -z-10 scale-150" />
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="leading-none text-sm sm:text-base md:text-lg font-bold bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 dark:from-green-400 dark:via-emerald-500 dark:to-green-400 bg-clip-text text-transparent tracking-tight truncate">
                  EarnByCode
                </span>
                <span className="leading-tight text-xs sm:text-sm text-gray-600 dark:text-green-300 hidden sm:block font-medium tracking-wide truncate transition-colors duration-300">
                  Code Your Way to Earnings
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1 ml-2 sm:ml-3">
              {NAV_ITEMS.map((item) => {
                const isItemActive = isActive(item.path);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all duration-300',
                      'group relative overflow-hidden',
                      'hover:bg-sky-50 dark:hover:bg-green-900/30 hover:shadow-sm hover:shadow-sky-500/10 dark:hover:shadow-green-900/20',
                      isItemActive
                        ? 'text-sky-700 dark:text-green-400 bg-sky-50 dark:bg-green-900/40 shadow-inner shadow-sky-200/50 dark:shadow-green-800/50 border border-sky-200/50 dark:border-green-700/50'
                        : 'text-gray-700 dark:text-green-300 hover:text-sky-700 dark:hover:text-green-400'
                    )}
                  >
                    {/* Background gradient on hover */}
                    <div className={cn(
                      'absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity duration-300',
                      item.gradient
                    )} />

                    <Icon className={cn(
                      'h-3 w-3 mr-1 sm:mr-1.5 transition-colors duration-300',
                      isItemActive ? 'text-sky-600 dark:text-green-400' : 'text-gray-500 dark:text-green-400 group-hover:text-sky-600 dark:group-hover:text-green-400'
                    )} />
                    <span className="relative z-10 whitespace-nowrap">{t(item.nameKey)}</span>

                    {/* Active indicator */}
                    {isItemActive && (
                      <div className={cn(
                        'absolute bottom-0 left-1/2 w-3 sm:w-4 h-0.5 bg-gradient-to-r rounded-full',
                        'from-sky-500 to-blue-500 dark:from-green-400 dark:to-emerald-500',
                        'transform -translate-x-1/2 shadow-sm'
                      )} />
                    )}
                  </Link>
                );
              })}

              {/* Company Dropdown */}
              <div className="relative group ml-1">
                <Link
                  to="/company"
                  className="flex items-center px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium text-gray-700 dark:text-green-300 hover:text-sky-700 dark:hover:text-green-400 hover:bg-sky-50 dark:hover:bg-green-900/30 transition-all duration-300 group whitespace-nowrap"
                >
                  <span className="px-2 sm:px-3 py-1 sm:py-2">{t('common.company')}</span>
                  <ChevronDown className="w-3 h-3 ml-1 transition-transform group-hover:rotate-180 duration-300" />
                </Link>
                <div className="absolute left-0 mt-1 w-32 sm:w-36 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-sky-200/60 dark:border-green-800/60 rounded-lg shadow-lg shadow-sky-500/10 dark:shadow-green-900/20 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 z-50">
                  <Link
                    to="/about"
                    className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 dark:text-green-300 hover:bg-gradient-to-r hover:from-sky-500/5 hover:to-blue-500/5 dark:hover:from-green-500/10 dark:hover:to-emerald-500/10 hover:text-sky-700 dark:hover:text-green-400 transition-all duration-200"
                  >
                    {t('common.about_us')}
                  </Link>
                  <Link
                    to="/careers"
                    className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 dark:text-green-300 hover:bg-gradient-to-r hover:from-sky-500/5 hover:to-cyan-500/5 dark:hover:from-green-500/10 dark:hover:to-green-500/10 hover:text-sky-700 dark:hover:text-green-400 transition-all duration-200"
                  >
                    {t('common.careers')}
                  </Link>
                  <Link
                    to="/press"
                    className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 dark:text-green-300 hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-sky-500/5 dark:hover:from-emerald-500/10 dark:hover:to-green-500/10 hover:text-sky-700 dark:hover:text-green-400 transition-all duration-200"
                  >
                    {t('common.press')}
                  </Link>
                </div>
              </div>

              {/* Contact Link */}
              <Link
                to="/contact"
                className="flex items-center px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium text-gray-700 dark:text-green-300 hover:text-sky-700 dark:hover:text-green-400 hover:bg-sky-50 dark:hover:bg-green-900/30 transition-all duration-300 group relative ml-1 whitespace-nowrap"
              >
                <span className="relative z-10">{t('common.contact')}</span>
                <span className="absolute -bottom-0.5 left-1/2 w-0 h-0.5 bg-gradient-to-r from-sky-500 to-blue-500 dark:from-green-500 dark:to-emerald-500 group-hover:w-[calc(100%-0.5rem)] transition-all duration-300 transform -translate-x-1/2"></span>
              </Link>
            </nav>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
            {/* OTP dev badge removed */}
            {/* Mobile menu button */}
            <button
              type="button"
              className="inline-flex items-center justify-center p-1 sm:p-1.5 rounded-md text-gray-600 dark:text-green-300 hover:text-sky-700 dark:hover:text-green-400 hover:bg-sky-50 dark:hover:bg-green-900/30 transition-all duration-300 lg:hidden border border-sky-200/50 dark:border-green-800/50 hover:border-sky-300/50 dark:hover:border-green-700/50"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-expanded={showMobileMenu}
              aria-label={showMobileMenu ? 'Close menu' : 'Open menu'}
            >
              {showMobileMenu ? (
                <X className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
              ) : (
                <Menu className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
              )}
            </button>

            {/* User menu */}
            {userInfo ? (
              <div className="relative ml-1" ref={dropdownRef}>
                <button
                  type="button"
                  className="flex items-center space-x-1 sm:space-x-2 rounded-md bg-sky-50 dark:bg-green-900/50 border border-sky-200/60 dark:border-green-800/60 px-1.5 sm:px-2 py-1 sm:py-1.5 text-xs sm:text-sm hover:bg-sky-100 dark:hover:bg-green-900/70 hover:border-sky-300/60 dark:hover:border-green-700/60 transition-all duration-300 group shadow-sm shadow-sky-500/5 dark:shadow-green-900/10"
                  id="user-menu-button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  aria-expanded={showDropdown}
                  aria-haspopup="true"
                >
                  <span className="sr-only">{t('user.open_menu')}</span>
                  <div className="relative flex-shrink-0">
                    {userInfo.avatarUrl ? (
                      <img src={userInfo.avatarUrl} alt={userInfo.username} className="h-4 w-4 sm:h-5 sm:w-5 rounded-full object-cover border border-sky-200 dark:border-green-700" />
                    ) : (
                      <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center border border-sky-200 dark:border-green-700">
                        <span className="text-sky-700 dark:text-green-400 font-semibold text-xs">
                          {userInfo.username?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="hidden sm:block min-w-0">
                    <div className="flex flex-col items-start">
                      <span className="text-gray-800 dark:text-green-400 font-medium text-xs truncate max-w-16 sm:max-w-20 transition-colors duration-300">{userInfo.username}</span>
                      {userInfo.isAdmin && (
                        <span className="text-sky-600 dark:text-green-400 text-xs font-medium flex items-center">
                          <Shield className="w-2 h-2 mr-0.5" />
                          {t('user.admin')}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-500 dark:text-green-400 group-hover:text-sky-600 dark:group-hover:text-green-400 transition-colors duration-300 flex-shrink-0" />
                </button>

                {/* Dropdown menu */}
                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute right-0 mt-2 w-44 sm:w-48 rounded-lg bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl py-1 shadow-lg shadow-sky-500/10 dark:shadow-green-900/20 border border-sky-200/60 dark:border-green-800/60 z-50"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="user-menu-button"
                      tabIndex={-1}
                    >
                      {/* User info header */}
                      <div className="px-2 sm:px-3 py-2 border-b border-sky-200/50 dark:border-green-800/50">
                        <div className="flex items-center space-x-2">
                          {userInfo.avatarUrl ? (
                            <img src={userInfo.avatarUrl} alt={userInfo.username} className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg object-cover border border-sky-200 dark:border-green-700 flex-shrink-0" />
                          ) : (
                            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center border border-sky-200 dark:border-green-700 flex-shrink-0">
                              <span className="text-sky-700 dark:text-green-400 font-bold text-xs sm:text-sm">
                                {userInfo.username?.[0]?.toUpperCase() || 'U'}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-gray-800 dark:text-green-400 font-semibold truncate text-xs sm:text-sm transition-colors duration-300">{userInfo.username}</p>
                            {userInfo.email && (
                              <p className="text-gray-600 dark:text-green-300 text-xs truncate transition-colors duration-300">{userInfo.email}</p>
                            )}
                            {userInfo.isAdmin && (
                              <span className="inline-flex items-center text-sky-600 dark:text-green-400 text-xs font-medium mt-0.5">
                                <Shield className="w-2 h-2 mr-0.5" />
                                {t('user.admin')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stats section */}
                      <div className="px-2 sm:px-3 py-2 border-b border-sky-200/50 dark:border-green-800/50">
                        <div className="grid grid-cols-3 gap-1 text-xs">
                          <div className="bg-gradient-to-br from-sky-500/10 to-blue-500/10 dark:from-green-500/20 dark:to-emerald-500/20 rounded-md p-1.5 border border-sky-500/20 dark:border-green-500/30">
                            <Award className="w-3 h-3 text-sky-500 dark:text-green-400 mb-0.5" />
                            <div className="text-sky-700 dark:text-green-300 font-semibold text-xs">{userInfo.codecoins || 0}</div>
                            <div className="text-gray-600 dark:text-green-400 text-xs">{t('stats.coins')}</div>
                          </div>
                          <div className="bg-gradient-to-br from-cyan-500/10 to-sky-500/10 dark:from-emerald-500/20 dark:to-green-500/20 rounded-md p-1.5 border border-cyan-500/20 dark:border-emerald-500/30">
                            <WalletIcon className="w-3 h-3 text-cyan-500 dark:text-emerald-400 mb-0.5" />
                            <div className="text-cyan-700 dark:text-emerald-300 font-semibold text-xs">${(userInfo.walletBalance || 0).toFixed(0)}</div>
                            <div className="text-gray-600 dark:text-green-400 text-xs">{t('stats.wallet')}</div>
                          </div>
                          <div className="bg-gradient-to-br from-blue-500/10 to-sky-500/10 dark:from-green-500/20 dark:to-green-500/20 rounded-md p-1.5 border border-blue-500/20 dark:border-green-500/30">
                            <Trophy className="w-3 h-3 text-blue-500 dark:text-green-400 mb-0.5" />
                            <div className="text-blue-700 dark:text-green-300 font-semibold text-xs">{userInfo.points || 0}</div>
                            <div className="text-gray-600 dark:text-green-400 text-xs">{t('stats.points')}</div>
                          </div>
                        </div>
                      </div>

                      {/* Menu items */}
                      <div className="py-1">
                        <Link
                          to="/profile"
                          className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-gray-600 dark:text-green-300 hover:bg-sky-50 dark:hover:bg-green-900/30 hover:text-sky-700 dark:hover:text-green-400 transition-all duration-200 group text-xs sm:text-sm"
                          role="menuitem"
                          onClick={() => setShowDropdown(false)}
                        >
                          <User className="mr-2 h-3 w-3 text-gray-500 dark:text-green-400 group-hover:text-sky-500 dark:group-hover:text-green-400 transition-colors" />
                          <span>{t('user.your_profile')}</span>
                        </Link>

                        <Link
                          to="/wallet"
                          className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-gray-600 dark:text-green-300 hover:bg-sky-50 dark:hover:bg-green-900/30 hover:text-sky-700 dark:hover:text-green-400 transition-all duration-200 group text-xs sm:text-sm"
                          role="menuitem"
                          onClick={() => setShowDropdown(false)}
                        >
                          <WalletIcon className="mr-2 h-3 w-3 text-gray-500 dark:text-green-400 group-hover:text-cyan-500 dark:group-hover:text-emerald-400 transition-colors" />
                          <span>{t('stats.wallet')}</span>
                          <span className="ml-auto text-cyan-600 dark:text-emerald-400 text-xs font-semibold">${(userInfo.walletBalance || 0).toFixed(2)}</span>
                        </Link>

                        <Link
                          to="/settings"
                          className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-gray-600 dark:text-green-300 hover:bg-sky-50 dark:hover:bg-green-900/30 hover:text-sky-700 dark:hover:text-green-400 transition-all duration-200 group text-xs sm:text-sm"
                          role="menuitem"
                          onClick={() => setShowDropdown(false)}
                        >
                          <Settings className="mr-2 h-3 w-3 text-gray-500 dark:text-green-400 group-hover:text-blue-500 dark:group-hover:text-green-400 transition-colors" />
                          <span>{t('user.settings')}</span>
                        </Link>

                        {userInfo.isAdmin && (
                          <Link
                            to="/admin"
                            className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-gray-600 dark:text-green-300 hover:bg-sky-50 dark:hover:bg-green-900/30 hover:text-sky-700 dark:hover:text-green-400 transition-all duration-200 group text-xs sm:text-sm"
                            role="menuitem"
                            onClick={() => setShowDropdown(false)}
                          >
                            <Shield className="mr-2 h-3 w-3 text-gray-500 dark:text-green-400 group-hover:text-green-500 dark:group-hover:text-green-400 transition-colors" />
                            <span>{t('user.admin_panel')}</span>
                            <span className="ml-auto bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-400 dark:to-emerald-400 text-white dark:text-gray-900 text-xs px-1.5 py-0.5 rounded-full">{t('user.admin')}</span>
                          </Link>
                        )}

                        <div className="border-t border-sky-200/50 dark:border-green-800/50 mt-1 pt-1">
                          <button
                            onClick={() => {
                              logout();
                              setShowDropdown(false);
                            }}
                            className="flex w-full items-center px-2 sm:px-3 py-1.5 sm:py-2 text-gray-600 dark:text-green-300 hover:bg-red-500/5 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 group text-xs sm:text-sm"
                            role="menuitem"
                          >
                            <LogOut className="mr-2 h-3 w-3 text-gray-500 dark:text-green-400 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors" />
                            <span>{t('user.sign_out')}</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden lg:flex items-center space-x-1.5 sm:space-x-2">
                <Link
                  to="/login"
                  className="px-2 sm:px-3 py-1 sm:py-1.5 text-white bg-gradient-to-r from-sky-500 to-blue-600 dark:from-green-600 dark:to-emerald-700 rounded-md hover:from-sky-400 hover:to-blue-500 dark:hover:from-green-500 dark:hover:to-emerald-600 transition-all duration-300 font-medium shadow-md shadow-sky-500/20 dark:shadow-green-900/20 hover:shadow-sky-500/30 dark:hover:shadow-green-900/30 hover:scale-105 transform whitespace-nowrap text-xs sm:text-sm"
                >
                  <span className="relative z-10">{t('auth.login')}</span>
                </Link>
                <Link
                  to="/register"
                  className="px-2 sm:px-3 py-1 sm:py-1.5 text-white bg-gradient-to-r from-sky-500 to-blue-600 dark:from-green-600 dark:to-emerald-700 rounded-md hover:from-sky-400 hover:to-blue-500 dark:hover:from-green-500 dark:hover:to-emerald-600 transition-all duration-300 font-medium shadow-md shadow-sky-500/20 dark:shadow-green-900/20 hover:shadow-sky-500/30 dark:hover:shadow-green-900/30 hover:scale-105 transform whitespace-nowrap text-xs sm:text-sm"
                >
                  {t('auth.signup')}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="lg:hidden border-t border-sky-200/50 dark:border-green-800/50 py-2 sm:py-3 overflow-hidden"
            >
              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isItemActive = isActive(item.path);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        'flex items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-300 group',
                        isItemActive
                          ? 'bg-sky-50 dark:bg-green-900/40 text-sky-700 dark:text-green-400 shadow-inner border border-sky-200/50 dark:border-green-700/50'
                          : 'text-gray-600 dark:text-green-300 hover:text-sky-700 dark:hover:text-green-400 hover:bg-sky-50/50 dark:hover:bg-green-900/30'
                      )}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <div className={cn(
                        'w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center mr-2 transition-colors duration-300',
                        isItemActive ? 'bg-sky-100/70 dark:bg-green-800/50' : 'bg-sky-50/50 dark:bg-green-900/30 group-hover:bg-sky-100/50 dark:group-hover:bg-green-800/40'
                      )}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <span>{t(item.nameKey)}</span>
                      {isItemActive && (
                        <div className={cn(
                          'ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-r',
                          'from-sky-500 to-blue-500 dark:from-green-400 dark:to-emerald-500'
                        )} />
                      )}
                    </Link>
                  );
                })}

                {/* Mobile Company Section */}
                <div className="pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-sky-200/50 dark:border-green-800/50">
                  <div className="text-gray-500 dark:text-green-400 text-xs font-medium mb-2 px-2 sm:px-3">{t('common.company')}</div>
                  <Link
                    to="/company"
                    className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-gray-600 dark:text-green-300 hover:text-sky-700 dark:hover:text-green-400 hover:bg-sky-50/50 dark:hover:bg-green-900/30 transition-all duration-300 text-xs sm:text-sm rounded-md mx-2"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {t('common.company')}
                  </Link>
                  <Link
                    to="/about"
                    className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-gray-600 dark:text-green-300 hover:text-sky-700 dark:hover:text-green-400 hover:bg-sky-50/50 dark:hover:bg-green-900/30 transition-all duration-300 text-xs sm:text-sm rounded-md mx-2"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {t('common.about_us')}
                  </Link>
                  <Link
                    to="/careers"
                    className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-gray-600 dark:text-green-300 hover:text-sky-700 dark:hover:text-green-400 hover:bg-sky-50/50 dark:hover:bg-green-900/30 transition-all duration-300 text-xs sm:text-sm rounded-md mx-2"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {t('common.careers')}
                  </Link>
                  <Link
                    to="/press"
                    className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-gray-600 dark:text-green-300 hover:text-sky-700 dark:hover:text-green-400 hover:bg-sky-50/50 dark:hover:bg-green-900/30 transition-all duration-300 text-xs sm:text-sm rounded-md mx-2"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {t('common.press')}
                  </Link>
                </div>

                {/* Mobile Contact */}
                <Link
                  to="/contact"
                  className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-gray-600 dark:text-green-300 hover:text-sky-700 dark:hover:text-green-400 hover:bg-sky-50/50 dark:hover:bg-green-900/30 transition-all duration-300 font-medium rounded-md text-xs sm:text-sm"
                  onClick={() => setShowMobileMenu(false)}
                >
                  {t('common.contact')}
                </Link>

                {/* Mobile auth buttons */}
                {!userInfo && (
                  <div className="pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-sky-200/50 dark:border-green-800/50 space-y-2">
                    <Link
                      to="/login"
                      className="flex items-center justify-center w-full px-2 sm:px-3 py-1.5 sm:py-2 text-gray-600 dark:text-green-300 hover:text-sky-700 dark:hover:text-green-400 hover:bg-sky-50 dark:hover:bg-green-900/30 rounded-md transition-all duration-300 text-xs sm:text-sm"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      {t('auth.login')}
                    </Link>
                    <Link
                      to="/register"
                      className="flex items-center justify-center w-full px-2 sm:px-3 py-1.5 sm:py-2 text-white bg-gradient-to-r from-sky-500 to-blue-600 dark:from-green-600 dark:to-emerald-700 rounded-md hover:from-sky-400 hover:to-blue-500 dark:hover:from-green-500 dark:hover:to-emerald-600 transition-all duration-300 shadow-md text-xs sm:text-sm"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      {t('auth.create_free_account')}
                    </Link>
                  </div>
                )}

                {/* Mobile user stats */}
                {userInfo && (
                  <div className="pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-sky-200/50 dark:border-green-800/50">
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-gradient-to-br from-sky-500/10 to-blue-500/10 dark:from-green-500/20 dark:to-emerald-500/20 rounded-lg p-2 border border-sky-500/20 dark:border-green-500/30 text-center">
                        <Award className="w-4 h-4 text-sky-500 dark:text-green-400 mx-auto mb-1" />
                        <div className="text-sky-700 dark:text-green-300 font-bold text-xs">{userInfo.codecoins || 0}</div>
                        <div className="text-gray-600 dark:text-green-400 text-xs">{t('stats.coins')}</div>
                      </div>
                      <div className="bg-gradient-to-br from-cyan-500/10 to-sky-500/10 dark:from-emerald-500/20 dark:to-green-500/20 rounded-lg p-2 border border-cyan-500/20 dark:border-emerald-500/30 text-center">
                        <WalletIcon className="w-4 h-4 text-cyan-500 dark:text-emerald-400 mx-auto mb-1" />
                        <div className="text-cyan-700 dark:text-emerald-300 font-bold text-xs">${(userInfo.walletBalance || 0).toFixed(0)}</div>
                        <div className="text-gray-600 dark:text-green-400 text-xs">{t('stats.wallet')}</div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-500/10 to-sky-500/10 dark:from-green-500/20 dark:to-green-500/20 rounded-lg p-2 border border-blue-500/20 dark:border-green-500/30 text-center">
                        <Trophy className="w-4 h-4 text-blue-500 dark:text-green-400 mx-auto mb-1" />
                        <div className="text-blue-700 dark:text-green-300 font-bold text-xs">{userInfo.points || 0}</div>
                        <div className="text-gray-600 dark:text-green-400 text-xs">{t('stats.points')}</div>
                      </div>
                    </div>
                  </div>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom gradient accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-300/40 dark:via-green-500/50 to-transparent" />
    </header>
  );
}