import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  User, 
  LogOut, 
  Settings, 
  Award, 
  Wallet, 
  Trophy, 
  Shield, 
  Menu, 
  X, 
  Code2,
  MessageSquare,
  Users,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Helper function to get the full avatar URL
const getAvatarUrl = (avatarPath: string | undefined): string => {
  if (!avatarPath) return '/default-avatar.png';
  
  // If it's already a full URL, return as is
  if (avatarPath.startsWith('http')) {
    return avatarPath;
  }
  
  // Clean up the path
  let cleanPath = avatarPath.replace(/^\/+|\/+$/g, ''); // Trim slashes
  
  // Remove any duplicate path segments
  if (cleanPath.startsWith('uploads/avatars/')) {
    cleanPath = cleanPath.replace('uploads/avatars/', '');
  } else if (cleanPath.startsWith('avatars/')) {
    cleanPath = cleanPath.replace('avatars/', '');
  }
  
  // Return the full URL
  return `${window.location.origin}/avatars/${cleanPath}`;
};

type NavItem = {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  hoverGradient: string;
};

// Navigation items with blue theme gradients
const NAV_ITEMS: NavItem[] = [
  { 
    name: 'Problems', 
    path: '/problems', 
    icon: Code2,
    gradient: 'from-blue-500 to-indigo-600',
    hoverGradient: 'from-blue-500 to-indigo-600'
  },
  { 
    name: 'Contests', 
    path: '/contests', 
    icon: Trophy,
    gradient: 'from-blue-400 to-blue-600',
    hoverGradient: 'from-blue-400 to-blue-600'
  },
  { 
    name: 'Discuss', 
    path: '/discuss', 
    icon: MessageSquare,
    gradient: 'from-indigo-500 to-blue-600',
    hoverGradient: 'from-indigo-500 to-blue-600'
  },
  { 
    name: 'Leaderboard', 
    path: '/leaderboard', 
    icon: Users,
    gradient: 'from-sky-500 to-blue-600',
    hoverGradient: 'from-sky-500 to-blue-600'
  },
];

type UserDisplayInfo = {
  username: string;
  email?: string;
  avatar?: string;
  isAdmin?: boolean;
  codecoins?: number;
  walletBalance?: number;
  points?: number;
};

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
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

  const isActive = (path: string) => location.pathname === path;

  return (
    <header 
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-500',
        'bg-white/95 backdrop-blur-2xl',
        scrolled 
          ? 'border-b border-blue-200/60 shadow-lg shadow-blue-500/10' 
          : 'border-b border-blue-100/50',
        'supports-[backdrop-filter]:bg-white/90'
      )}
    >
      {/* Elegant top border gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
      
      <div className="container mx-auto px-2">
        <div className="flex justify-between items-center h-12">
          {/* Logo Section */}
          <div className="flex items-center space-x-2 min-w-0 flex-shrink-0">
            <Link 
              to="/" 
              className="flex items-center space-x-2 group transition-all duration-300 min-w-0"
              aria-label="Home"
            >
              <div className="relative flex-shrink-0">
                <div className="h-6 w-6 flex items-center justify-center relative">
                  <img 
                    src="/logo.png" 
                    alt="AlgoBucks Logo" 
                    className="h-full w-full object-contain transition-all duration-500 group-hover:scale-110 drop-shadow-lg" 
                  />
                  {/* Elegant glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-indigo-500/30 to-blue-600/30 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-all duration-700 -z-10 scale-150" />
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 bg-clip-text text-transparent tracking-tight truncate">
                  AlgoBucks
                </span>
                <span className="text-xs text-slate-600 hidden sm:block font-medium tracking-wide truncate">
                  Think smart. Code harder.
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1 ml-3">
              {NAV_ITEMS.map((item) => {
                const isItemActive = isActive(item.path);
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-300',
                      'group relative overflow-hidden',
                      'hover:bg-blue-50 hover:shadow-md hover:shadow-blue-500/10',
                      isItemActive 
                        ? 'text-blue-700 bg-blue-50 shadow-inner shadow-blue-200/50 border border-blue-200/50' 
                        : 'text-slate-700 hover:text-blue-700'
                    )}
                  >
                    {/* Background gradient on hover */}
                    <div className={cn(
                      'absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity duration-300',
                      item.gradient
                    )} />
                    
                    <Icon className={cn(
                      'h-3 w-3 mr-1.5 transition-colors duration-300',
                      isItemActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-blue-600'
                    )} />
                    <span className="relative z-10 whitespace-nowrap">{item.name}</span>
                    
                    {/* Active indicator */}
                    {isItemActive && (
                      <div className={cn(
                        'absolute bottom-0 left-1/2 w-4 h-0.5 bg-gradient-to-r rounded-full',
                        item.gradient,
                        'transform -translate-x-1/2 shadow-md'
                      )} />
                    )}
                  </Link>
                );
              })}

              {/* Company Dropdown */}
              <div className="relative group ml-1">
                <button className="flex items-center px-2 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition-all duration-300 group whitespace-nowrap">
                  <span>Company</span>
                  <ChevronDown className="w-3 h-3 ml-1 transition-transform group-hover:rotate-180 duration-300" />
                </button>
                <div className="absolute left-0 mt-1 w-36 bg-white/95 backdrop-blur-2xl border border-blue-200/60 rounded-lg shadow-lg shadow-blue-500/10 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 z-50">
                  <Link 
                    to="/about" 
                    className="flex items-center px-3 py-2 text-xs text-slate-600 hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-indigo-500/5 hover:text-blue-700 transition-all duration-200"
                  >
                    About Us
                  </Link>
                  <Link 
                    to="/careers" 
                    className="flex items-center px-3 py-2 text-xs text-slate-600 hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-sky-500/5 hover:text-blue-700 transition-all duration-200"
                  >
                    Careers
                  </Link>
                  <Link 
                    to="/press" 
                    className="flex items-center px-3 py-2 text-xs text-slate-600 hover:bg-gradient-to-r hover:from-indigo-500/5 hover:to-blue-500/5 hover:text-blue-700 transition-all duration-200"
                  >
                    Press
                  </Link>
                </div>
              </div>
              
              {/* Contact Link */}
              <Link 
                to="/contact" 
                className="flex items-center px-2 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition-all duration-300 group relative ml-1 whitespace-nowrap"
              >
                <span className="relative z-10">Contact</span>
                <span className="absolute -bottom-0.5 left-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 group-hover:w-[calc(100%-0.5rem)] transition-all duration-300 transform -translate-x-1/2"></span>
              </Link>
            </nav>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* Mobile menu button */}
            <button
              type="button"
              className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-300 lg:hidden border border-blue-200/50 hover:border-blue-300/50"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-expanded={showMobileMenu}
              aria-label={showMobileMenu ? 'Close menu' : 'Open menu'}
            >
              {showMobileMenu ? (
                <X className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Menu className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            {/* User menu */}
            {userInfo ? (
              <div className="relative ml-1">
                <button
                  type="button"
                  className="flex items-center space-x-2 rounded-lg bg-blue-50 border border-blue-200/60 px-2 py-1.5 text-xs hover:bg-blue-100 hover:border-blue-300/60 transition-all duration-300 group shadow-md shadow-blue-500/5"
                  id="user-menu-button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  aria-expanded={showDropdown}
                  aria-haspopup="true"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="relative flex-shrink-0">
                    {userInfo.avatar ? (
                      <div className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-400 via-indigo-500 to-blue-600 p-0.5">
                        <img 
                          src={userInfo.avatar.startsWith('http') || userInfo.avatar.startsWith('blob:') 
                            ? userInfo.avatar 
                            : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${userInfo.avatar.startsWith('/') ? '' : '/'}${userInfo.avatar}`} 
                          alt={userInfo.username}
                          className="h-full w-full rounded-full object-cover bg-white"
                          onError={(e) => {
                            // If image fails to load, fall back to initials
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const fallback = document.createElement('div');
                              fallback.className = 'h-full w-full rounded-full bg-white flex items-center justify-center';
                              fallback.innerHTML = `<span class="text-blue-700 font-semibold text-xs">${userInfo.username?.[0]?.toUpperCase() || 'U'}</span>`;
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-400 via-indigo-500 to-blue-600 p-0.5">
                        <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                          <span className="text-blue-700 font-semibold text-xs">
                            {userInfo.username?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      </div>
                    )}
                    {/* Online indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-blue-400 rounded-full border border-white shadow-sm" />
                  </div>
                  
                  <div className="hidden sm:block min-w-0">
                    <div className="flex flex-col items-start">
                      <span className="text-slate-800 font-medium text-xs truncate max-w-20">{userInfo.username}</span>
                      {userInfo.isAdmin && (
                        <span className="text-blue-600 text-xs font-medium flex items-center">
                          <Shield className="w-2 h-2 mr-0.5" />
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <ChevronDown className="h-3 w-3 text-slate-500 group-hover:text-blue-600 transition-colors duration-300 flex-shrink-0" />
                </button>

                {/* Dropdown menu */}
                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute right-0 mt-2 w-48 rounded-lg bg-white/95 backdrop-blur-2xl py-1 shadow-lg shadow-blue-500/10 border border-blue-200/60 z-50"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="user-menu-button"
                      tabIndex={-1}
                    >
                      {/* User info header */}
                      <div className="px-3 py-2 border-b border-blue-200/50">
                        <div className="flex items-center space-x-2">
                          {userInfo.avatar ? (
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-400 via-indigo-500 to-blue-600 p-0.5 flex-shrink-0">
                              <img 
                                src={getAvatarUrl(userInfo.avatar)} 
                                alt={userInfo.username}
                                className="h-full w-full rounded-lg object-cover bg-white"
                                onError={(e) => {
                                  // Fallback to default avatar if image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = '/default-avatar.png';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-400 via-indigo-500 to-blue-600 p-0.5 flex-shrink-0">
                              <div className="h-full w-full rounded-lg bg-white flex items-center justify-center">
                                <span className="text-blue-700 font-bold text-xs">
                                  {userInfo.username?.[0]?.toUpperCase() || 'U'}
                                </span>
                              </div>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-slate-800 font-semibold truncate text-xs">{userInfo.username}</p>
                            {userInfo.email && (
                              <p className="text-slate-600 text-xs truncate">{userInfo.email}</p>
                            )}
                            {userInfo.isAdmin && (
                              <span className="inline-flex items-center text-blue-600 text-xs font-medium mt-0.5">
                                <Shield className="w-2 h-2 mr-0.5" />
                                Administrator
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stats section */}
                      <div className="px-3 py-2 border-b border-blue-200/50">
                        <div className="grid grid-cols-3 gap-1 text-xs">
                          <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-md p-1.5 border border-blue-500/20">
                            <Award className="w-3 h-3 text-blue-500 mb-0.5" />
                            <div className="text-blue-700 font-semibold text-xs">{userInfo.codecoins || 0}</div>
                            <div className="text-slate-600 text-xs">Coins</div>
                          </div>
                          <div className="bg-gradient-to-br from-sky-500/10 to-blue-500/10 rounded-md p-1.5 border border-sky-500/20">
                            <Wallet className="w-3 h-3 text-sky-500 mb-0.5" />
                            <div className="text-sky-700 font-semibold text-xs">${(userInfo.walletBalance || 0).toFixed(0)}</div>
                            <div className="text-slate-600 text-xs">Wallet</div>
                          </div>
                          <div className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-md p-1.5 border border-indigo-500/20">
                            <Trophy className="w-3 h-3 text-indigo-500 mb-0.5" />
                            <div className="text-indigo-700 font-semibold text-xs">{userInfo.points || 0}</div>
                            <div className="text-slate-600 text-xs">Points</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Menu items */}
                      <div className="py-1">
                        <Link
                          to="/profile"
                          className="flex items-center px-3 py-2 text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 group text-xs"
                          role="menuitem"
                          onClick={() => setShowDropdown(false)}
                        >
                          <User className="mr-2 h-3 w-3 text-slate-500 group-hover:text-blue-500 transition-colors" />
                          <span>Your Profile</span>
                        </Link>
                        
                        <Link
                          to="/wallet"
                          className="flex items-center px-3 py-2 text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 group text-xs"
                          role="menuitem"
                          onClick={() => setShowDropdown(false)}
                        >
                          <Wallet className="mr-2 h-3 w-3 text-slate-500 group-hover:text-sky-500 transition-colors" />
                          <span>Wallet</span>
                          <span className="ml-auto text-sky-600 text-xs font-semibold">${(userInfo.walletBalance || 0).toFixed(2)}</span>
                        </Link>
                        
                        <Link
                          to="/settings"
                          className="flex items-center px-3 py-2 text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 group text-xs"
                          role="menuitem"
                          onClick={() => setShowDropdown(false)}
                        >
                          <Settings className="mr-2 h-3 w-3 text-slate-500 group-hover:text-indigo-500 transition-colors" />
                          <span>Settings</span>
                        </Link>

                        {userInfo.isAdmin && (
                          <Link
                            to="/admin"
                            className="flex items-center px-3 py-2 text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 group text-xs"
                            role="menuitem"
                            onClick={() => setShowDropdown(false)}
                          >
                            <Shield className="mr-2 h-3 w-3 text-slate-500 group-hover:text-purple-500 transition-colors" />
                            <span>Admin Panel</span>
                            <span className="ml-auto bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs px-1.5 py-0.5 rounded-full">Admin</span>
                          </Link>
                        )}
                        
                        <div className="border-t border-blue-200/50 mt-1 pt-1">
                          <button
                            onClick={() => {
                              logout();
                              setShowDropdown(false);
                            }}
                            className="flex w-full items-center px-3 py-2 text-slate-600 hover:bg-red-500/5 hover:text-red-600 transition-all duration-200 group text-xs"
                            role="menuitem"
                          >
                            <LogOut className="mr-2 h-3 w-3 text-slate-500 group-hover:text-red-500 transition-colors" />
                            <span>Sign out</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden lg:flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-slate-700 hover:text-blue-700 transition-all duration-300 font-medium relative group whitespace-nowrap text-xs"
                >
                  <span className="relative z-10">Log in</span>
                  <div className="absolute inset-0 bg-blue-50 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300" />
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-md hover:from-blue-400 hover:to-indigo-500 transition-all duration-300 font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-105 transform whitespace-nowrap text-xs"
                >
                  Sign up
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
              className="lg:hidden border-t border-blue-200/50 py-3 overflow-hidden"
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
                        'flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 group',
                        isItemActive 
                          ? 'bg-blue-50 text-blue-700 shadow-inner border border-blue-200/50' 
                          : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/50'
                      )}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <div className={cn(
                        'w-6 h-6 rounded-md flex items-center justify-center mr-2 transition-colors duration-300',
                        isItemActive ? 'bg-blue-100/70' : 'bg-blue-50/50 group-hover:bg-blue-100/50'
                      )}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <span>{item.name}</span>
                      {isItemActive && (
                        <div className={cn(
                          'ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-r',
                          item.gradient
                        )} />
                      )}
                    </Link>
                  );
                })}

                {/* Mobile Company Section */}
                <div className="pt-3 mt-3 border-t border-blue-200/50">
                  <div className="text-slate-500 text-xs font-medium mb-2 px-3">Company</div>
                  <Link
                    to="/about"
                    className="flex items-center px-3 py-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50/50 transition-all duration-300 text-xs rounded-md mx-2"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    About Us
                  </Link>
                  <Link
                    to="/careers"
                    className="flex items-center px-3 py-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50/50 transition-all duration-300 text-xs rounded-md mx-2"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Careers
                  </Link>
                  <Link
                    to="/press"
                    className="flex items-center px-3 py-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50/50 transition-all duration-300 text-xs rounded-md mx-2"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Press
                  </Link>
                </div>
                
                {/* Mobile Contact */}
                <Link
                  to="/contact"
                  className="flex items-center px-3 py-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50/50 transition-all duration-300 font-medium rounded-md text-xs"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Contact
                </Link>
                
                {/* Mobile auth buttons */}
                {!userInfo && (
                  <div className="pt-3 mt-3 border-t border-blue-200/50 space-y-2">
                    <Link
                      to="/login"
                      className="flex items-center justify-center w-full px-3 py-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-all duration-300 text-xs"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Log in
                    </Link>
                    <Link
                      to="/register"
                      className="flex items-center justify-center w-full px-3 py-2 text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-md hover:from-blue-400 hover:to-indigo-500 transition-all duration-300 shadow-md text-xs"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Sign up
                    </Link>
                  </div>
                )}
                
                {/* Mobile user stats */}
                {userInfo && (
                  <div className="pt-3 mt-3 border-t border-blue-200/50">
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-lg p-2 border border-blue-500/20 text-center">
                        <Award className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                        <div className="text-blue-700 font-bold text-xs">{userInfo.codecoins || 0}</div>
                        <div className="text-slate-600 text-xs">Coins</div>
                      </div>
                      <div className="bg-gradient-to-br from-sky-500/10 to-blue-500/10 rounded-lg p-2 border border-sky-500/20 text-center">
                        <Wallet className="w-4 h-4 text-sky-500 mx-auto mb-1" />
                        <div className="text-sky-700 font-bold text-xs">${(userInfo.walletBalance || 0).toFixed(0)}</div>
                        <div className="text-slate-600 text-xs">Wallet</div>
                      </div>
                      <div className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-lg p-2 border border-indigo-500/20 text-center">
                        <Trophy className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
                        <div className="text-indigo-700 font-bold text-xs">{userInfo.points || 0}</div>
                        <div className="text-slate-600 text-xs">Points</div>
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
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-300/40 to-transparent" />
    </header>
  );
};