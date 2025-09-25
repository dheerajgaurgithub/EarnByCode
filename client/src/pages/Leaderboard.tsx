import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Medal, Award, TrendingUp, Users, Crown, Search, X, Sparkles, Zap, Heart, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import apiService from '../services/api';
import { Link } from 'react-router-dom';
import { useI18n } from '@/context/I18nContext';
import { useAuth } from '@/context/AuthContext';

// Debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

interface LeaderboardUser {
  _id: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  points: number;
  codecoins: number;
  ranking: number;
  solvedProblems: string[];
  totalSolved: number;
}

export const Leaderboard: React.FC = () => {
  const { t } = useI18n();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [sortBy, setSortBy] = useState<'points' | 'totalSolved' | 'username' | 'codecoins'>('points');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isSearching, setIsSearching] = useState(false);

  // Fetch leaderboard on initial load
  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Apply filters and sorting when inputs change
  useEffect(() => {
    filterAndSortUsers(users, debouncedSearchTerm, sortBy, sortOrder);
  }, [debouncedSearchTerm, sortBy, sortOrder, users]);

  const filterAndSortUsers = useCallback(
    (
      userList: LeaderboardUser[],
      search: string,
      sortField: 'points' | 'totalSolved' | 'username' | 'codecoins',
      order: 'asc' | 'desc'
    ) => {
      setIsSearching(true);
      
      setTimeout(() => {
        try {
          let result = [...userList];
          
          if (search) {
            const raw = search.trim();
            const searchLower = raw.toLowerCase();
            const numeric = /^\d+$/.test(raw) ? Number(raw) : null;
            result = result.filter(user => {
              const nameHit = user.username.toLowerCase().includes(searchLower) || (user.fullName?.toLowerCase().includes(searchLower) ?? false);
              const pointsHit = String(user.points ?? '').includes(searchLower);
              const solvedHit = String(user.totalSolved ?? user.solvedProblems?.length ?? '').includes(searchLower);
              const numericHit = numeric != null && ((user.points ?? 0) === numeric || (user.totalSolved ?? user.solvedProblems?.length ?? 0) === numeric);
              return nameHit || pointsHit || solvedHit || numericHit;
            });
          }

          result.sort((a, b) => {
            let comparison = 0;
            
            if (sortField === 'username') {
              comparison = a.username.localeCompare(b.username);
            } else {
              let av = 0; let bv = 0;
              if (sortField === 'totalSolved') {
                av = (a.totalSolved ?? a.solvedProblems?.length ?? 0);
                bv = (b.totalSolved ?? b.solvedProblems?.length ?? 0);
              } else if (sortField === 'points') {
                av = (a.points ?? 0);
                bv = (b.points ?? 0);
              } else if (sortField === 'codecoins') {
                av = (a.codecoins ?? 0);
                bv = (b.codecoins ?? 0);
              }
              comparison = av - bv;
            }
            
            return order === 'asc' ? comparison : -comparison;
          });
          
          setFilteredUsers(result);
        } catch (error) {
          console.error('Error filtering/sorting users:', error);
          setFilteredUsers(userList);
        } finally {
          setIsSearching(false);
        }
      }, 0);
    },
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleSortChange = (field: 'points' | 'totalSolved' | 'username' | 'codecoins') => {
    const newSortOrder = sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(field);
    setSortOrder(newSortOrder);
    filterAndSortUsers(users, searchTerm, field, newSortOrder);
  };

  const SortIndicator = ({ field }: { field: string }) => {
    if (sortBy !== field) return null;
    return (
      <span className="ml-1">
        {sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const { data } = await apiService.getUsersLeaderboard({ 
        sortBy: 'points',
        limit: 100,
        include: 'profile,solved'
      });
      
      // Debug a couple of users to verify payload structure (field names for avatar)
      if (Array.isArray(data) && data.length > 0) {
        console.debug('[Leaderboard] Sample user payload:', {
          keys: Object.keys(data[0] || {}),
          avatarUrl: (data[0] as any)?.avatarUrl,
          profile: (data[0] as any)?.profile,
          avatar: (data[0] as any)?.avatar,
          avatarPublicId: (data[0] as any)?.avatarPublicId,
          image: (data[0] as any)?.image,
          picture: (data[0] as any)?.picture,
        });
      }

      const formattedUsers = data.map((u: any) => {
        // Helper to build Cloudinary URL
        const cloudName = (import.meta as any)?.env?.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
        const fetchBase = (import.meta as any)?.env?.VITE_CLOUDINARY_FETCH_BASE as string | undefined;
        const buildCloudinaryUrl = (publicId?: string) => {
          if (!publicId) return '';
          if (fetchBase) return `${fetchBase}/${publicId}`;
          if (cloudName) return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
          return '';
        };

        // Try various common fields for avatar
        let resolvedAvatar = (
          u.avatarUrl ||
          u.profile?.avatarUrl ||
          (typeof u.avatar === 'string' ? u.avatar : u.avatar?.url) ||
          u.photoURL ||
          u.image ||
          u.picture ||
          buildCloudinaryUrl(u.avatarPublicId || u.profile?.avatarPublicId)
        ) as string | undefined;

        // If backend gives relative path like /uploads/..., prefix server origin
        if (resolvedAvatar && resolvedAvatar.startsWith('/')) {
          const apiUrl = (import.meta as any)?.env?.VITE_API_URL as string | undefined;
          try {
            const origin = apiUrl ? new URL(apiUrl).origin : window.location.origin;
            resolvedAvatar = `${origin}${resolvedAvatar}`;
          } catch {
            resolvedAvatar = `${window.location.origin}${resolvedAvatar}`;
          }
        }

        // Final fallback: generate a placeholder avatar using ui-avatars
        if (!resolvedAvatar) {
          const display = (u.fullName || u.username || 'User').toString();
          const bg = 'random';
          const size = 128;
          resolvedAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(display)}&background=${bg}&size=${size}`;
        }

        return {
          _id: u._id,
          username: u.username,
          fullName: u.fullName,
          avatarUrl: resolvedAvatar || '',
          points: u.points || 0,
          codecoins: u.codecoins || 0,
          ranking: u.ranking || 0,
          solvedProblems: u.solvedProblems || [],
          totalSolved: u.totalSolved || 0
        } as LeaderboardUser;
      });
      
      setUsers(formattedUsers);
      setFilteredUsers(formattedUsers);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-500 dark:text-gray-400" />;
      case 3:
        return <Award className="h-4 w-4 text-orange-500 dark:text-orange-400" />;
      default:
        return <span className="text-sm font-bold text-gray-600 dark:text-gray-400">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-700 shadow-sm';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 border-gray-200 dark:border-gray-700 shadow-sm';
      case 3:
        return 'bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-700 shadow-sm';
      default:
        return 'bg-white dark:bg-gray-900 border-gray-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-gray-800';
    }
  };

  // Derive podium and remainder from filtered results so filters/sorts apply everywhere
  const podium = filteredUsers.slice(0, 3);
  const remainder = filteredUsers.length >= 3 ? filteredUsers.slice(3) : filteredUsers;

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center px-4 transition-colors duration-300">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-100 dark:border-green-800 border-t-sky-500 dark:border-t-green-400"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-4 border-sky-200 dark:border-green-700 opacity-30"></div>
        </div>
        <p className="mt-6 text-slate-600 dark:text-green-300 text-base font-medium">Loading leaderboard...</p>
        <div className="mt-3 flex space-x-2">
          <div className="w-2 h-2 bg-sky-500 dark:bg-green-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-sky-400 dark:bg-green-400 rounded-full animate-bounce animation-delay-100"></div>
          <div className="w-2 h-2 bg-sky-300 dark:bg-green-400 rounded-full animate-bounce animation-delay-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-sky-50 dark:bg-gradient-to-br dark:from-black dark:to-gray-900 py-4 sm:py-8 px-4 sm:px-6 transition-all duration-300">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="flex flex-col items-center space-y-4 sm:space-y-6 mb-8">
            {/* Main Title */}
            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <div className="relative">
                <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-amber-500 dark:text-green-400" />
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-amber-400 dark:text-green-300" />
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-sky-600 via-sky-700 to-sky-800 dark:from-green-400 dark:via-green-500 dark:to-green-600 bg-clip-text text-transparent text-center leading-tight">
                {t('leaderboard.title')}
              </h1>
              <Heart className="h-6 w-6 sm:h-7 sm:w-7 text-rose-500 dark:text-green-400" />
            </div>

            {/* Search Bar */}
            <div className="w-full max-w-2xl mt-6 relative">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-green-500 group-focus-within:text-sky-600 dark:group-focus-within:text-green-400 transition-colors duration-200" />
                <input
                  type="text"
                  placeholder={t('leaderboard.search_placeholder')}
                  className="w-full pl-12 pr-12 py-4 rounded-2xl border-2 border-sky-200 dark:border-green-800 bg-white/80 dark:bg-gray-900/80 text-slate-800 dark:text-green-100 placeholder-slate-500 dark:placeholder-green-400 focus:outline-none focus:ring-4 focus:ring-sky-200 dark:focus:ring-green-400/20 focus:border-sky-500 dark:focus:border-green-500 transition-all duration-200 text-base backdrop-blur-sm"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-green-500 hover:text-slate-600 dark:hover:text-green-300 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
                {isSearching && (
                  <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-sky-200 dark:border-green-800 border-t-sky-600 dark:border-t-green-400"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Sort Buttons */}
            <div className="flex flex-wrap gap-3 mt-6 justify-center">
              <button
                onClick={() => handleSortChange('username')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 text-base flex items-center space-x-2 ${
                  sortBy === 'username' 
                    ? 'bg-sky-600 dark:bg-green-600 text-white shadow-lg shadow-sky-200 dark:shadow-green-900/50 transform scale-105' 
                    : 'bg-white dark:bg-gray-900 text-slate-700 dark:text-green-300 hover:bg-sky-50 dark:hover:bg-gray-800 border-2 border-sky-200 dark:border-green-800 hover:border-sky-300 dark:hover:border-green-600'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>{t('leaderboard.sort_name')} <SortIndicator field="username" /></span>
              </button>
              <button
                onClick={() => handleSortChange('points')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 text-base flex items-center space-x-2 ${
                  sortBy === 'points' 
                    ? 'bg-amber-500 dark:bg-green-600 text-white shadow-lg shadow-amber-200 dark:shadow-green-900/50 transform scale-105' 
                    : 'bg-white dark:bg-gray-900 text-slate-700 dark:text-green-300 hover:bg-amber-50 dark:hover:bg-gray-800 border-2 border-sky-200 dark:border-green-800 hover:border-amber-300 dark:hover:border-green-600'
                }`}
              >
                <Zap className="h-4 w-4" />
                <span>{t('stats.points')} <SortIndicator field="points" /></span>
              </button>
              <button
                onClick={() => handleSortChange('totalSolved')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 text-base flex items-center space-x-2 ${
                  sortBy === 'totalSolved' 
                    ? 'bg-emerald-600 dark:bg-green-600 text-white shadow-lg shadow-emerald-200 dark:shadow-green-900/50 transform scale-105' 
                    : 'bg-white dark:bg-gray-900 text-slate-700 dark:text-green-300 hover:bg-emerald-50 dark:hover:bg-gray-800 border-2 border-sky-200 dark:border-green-800 hover:border-emerald-300 dark:hover:border-green-600'
                }`}
              >
                <Trophy className="h-4 w-4" />
                <span>{t('leaderboard.solved')} <SortIndicator field="totalSolved" /></span>
              </button>
              <button
                onClick={() => handleSortChange('codecoins')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 text-base flex items-center space-x-2 ${
                  sortBy === 'codecoins' 
                    ? 'bg-violet-600 dark:bg-green-600 text-white shadow-lg shadow-violet-200 dark:shadow-green-900/50 transform scale-105' 
                    : 'bg-white dark:bg-gray-900 text-slate-700 dark:text-green-300 hover:bg-violet-50 dark:hover:bg-gray-800 border-2 border-sky-200 dark:border-green-800 hover:border-violet-300 dark:hover:border-green-600'
                }`}
              >
                <Award className="h-4 w-4" />
                <span>{t('stats.coins')} <SortIndicator field="codecoins" /></span>
              </button>
            </div>

            {/* Subtitle */}
            <div className="text-center mt-6">
              <p className="text-slate-700 dark:text-green-300 text-lg sm:text-xl font-semibold">{t('leaderboard.subtitle')}</p>
              <p className="text-slate-600 dark:text-green-400 mt-2 text-base">
                {t('leaderboard.subtitle2')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Top 3 Podium (uses filtered users) */}
        {podium.length === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Second Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-2 border-slate-200 dark:border-green-800 rounded-3xl p-6 text-center md:mt-6 shadow-xl shadow-slate-200/50 dark:shadow-green-900/20 hover:shadow-2xl hover:shadow-slate-300/50 dark:hover:shadow-green-900/40 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2"
            >
              <div className="relative mb-4">
                <Link to={`/u/${podium[1]?.username}`} className="block">
                  <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center ring-4 ring-slate-300 dark:ring-green-700 overflow-hidden bg-slate-100 dark:bg-green-900">
                    {podium[1]?.avatarUrl ? (
                      <img src={podium[1]?.avatarUrl} alt={podium[1]?.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-slate-700 dark:text-green-200 font-bold text-xl">{podium[1]?.username?.[0]?.toUpperCase() || 'U'}</span>
                    )}
                  </div>
                </Link>
                <div className="absolute -top-2 -right-2 bg-slate-500 dark:bg-green-600 rounded-full p-2 shadow-lg">
                  <span className="text-white font-bold text-base">2</span>
                </div>
                <div className="absolute -bottom-2 -right-2">
                  <Medal className="h-6 w-6 text-slate-500 dark:text-green-400" />
                </div>
              </div>
              <h3 className="text-slate-900 dark:text-green-100 font-bold text-lg truncate mb-1">
                <Link to={`/u/${podium[1]?.username}`}>{podium[1]?.fullName || podium[1]?.username}</Link>
              </h3>
              <p className="text-slate-600 dark:text-green-300 text-base mb-4 truncate">
                <Link to={`/u/${podium[1]?.username}`}>@{podium[1]?.username}</Link>
              </p>
              <div className="bg-slate-50 dark:bg-green-900/30 rounded-2xl p-4 border-2 border-slate-200 dark:border-green-800">
                <p className="text-slate-900 dark:text-green-100 font-bold text-xl">{podium[1]?.points} points</p>
                <p className="text-slate-600 dark:text-green-300 text-base font-medium">Silver Champion</p>
              </div>
            </motion.div>

            {/* First Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-green-950 dark:to-green-900 border-3 border-amber-300 dark:border-green-600 rounded-3xl p-8 text-center shadow-2xl shadow-amber-300/50 dark:shadow-green-900/40 hover:shadow-3xl hover:shadow-amber-400/60 dark:hover:shadow-green-900/60 transform hover:scale-110 hover:-translate-y-3 transition-all duration-300"
            >
              <div className="relative mb-6">
                <Link to={`/u/${podium[0]?.username}`} className="block">
                  <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center ring-4 ring-amber-300 dark:ring-green-500 overflow-hidden bg-amber-100 dark:bg-green-800">
                    {podium[0]?.avatarUrl ? (
                      <img src={podium[0]?.avatarUrl} alt={podium[0]?.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-amber-800 dark:text-green-100 font-extrabold text-2xl">{podium[0]?.username?.[0]?.toUpperCase() || 'U'}</span>
                    )}
                  </div>
                </Link>
                <div className="absolute -top-3 -right-3 bg-amber-500 dark:bg-green-600 rounded-full p-3 shadow-xl">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <Star className="h-8 w-8 text-amber-500 dark:text-green-400" />
                </div>
              </div>
              <h3 className="text-slate-900 dark:text-green-100 font-black text-xl mb-2 truncate">
                <Link to={`/u/${podium[0]?.username}`}>{podium[0]?.fullName || podium[0]?.username}</Link>
              </h3>
              <p className="text-amber-700 dark:text-green-300 text-lg mb-6 truncate">
                <Link to={`/u/${podium[0]?.username}`}>@{podium[0]?.username}</Link>
              </p>
              <div className="bg-amber-100 dark:bg-green-900/50 rounded-2xl p-4 border-2 border-amber-200 dark:border-green-700">
                <p className="text-amber-800 dark:text-green-100 font-black text-2xl">{podium[0]?.points} points</p>
                <p className="text-amber-700 dark:text-green-300 text-lg font-bold">🏆 Champion</p>
              </div>
            </motion.div>

            {/* Third Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-2 border-orange-200 dark:border-green-800 rounded-3xl p-6 text-center md:mt-6 shadow-xl shadow-orange-200/50 dark:shadow-green-900/20 hover:shadow-2xl hover:shadow-orange-300/50 dark:hover:shadow-green-900/40 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2"
            >
              <div className="relative mb-4">
                <Link to={`/u/${podium[2]?.username}`} className="block">
                  <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center ring-4 ring-orange-200 dark:ring-green-700 overflow-hidden bg-orange-100 dark:bg-green-900">
                    {podium[2]?.avatarUrl ? (
                      <img src={podium[2]?.avatarUrl} alt={podium[2]?.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-orange-800 dark:text-green-200 font-bold text-xl">{podium[2]?.username?.[0]?.toUpperCase() || 'U'}</span>
                    )}
                  </div>
                </Link>
                <div className="absolute -top-2 -right-2 bg-orange-500 dark:bg-green-600 rounded-full p-2 shadow-lg">
                  <span className="text-white font-bold text-base">3</span>
                </div>
                <div className="absolute -bottom-2 -right-2">
                  <Award className="h-6 w-6 text-orange-500 dark:text-green-400" />
                </div>
              </div>
              <h3 className="text-slate-900 dark:text-green-100 font-bold text-lg truncate mb-1">
                <Link to={`/u/${podium[2]?.username}`}>{podium[2]?.fullName || podium[2]?.username}</Link>
              </h3>
              <p className="text-orange-700 dark:text-green-300 text-base mb-4 truncate">
                <Link to={`/u/${podium[2]?.username}`}>@{podium[2]?.username}</Link>
              </p>
              <div className="bg-orange-50 dark:bg-green-900/30 rounded-2xl p-4 border-2 border-orange-200 dark:border-green-800">
                <p className="text-orange-800 dark:text-green-100 font-bold text-xl">{podium[2]?.points} points</p>
                <p className="text-orange-700 dark:text-green-300 text-base font-medium">Bronze Star</p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Full Leaderboard */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-3xl border-2 border-sky-200 dark:border-green-800 overflow-hidden shadow-2xl shadow-sky-200/50 dark:shadow-green-900/30"
        >
          <div className="px-6 py-5 border-b-2 border-sky-200 dark:border-green-800 bg-gradient-to-r from-sky-50 to-sky-100 dark:from-green-950/80 dark:to-green-900/80">
            <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-green-100 flex items-center">
              <TrendingUp className="h-6 w-6 mr-3 text-sky-600 dark:text-green-400" />
              <span className="bg-gradient-to-r from-sky-600 to-sky-800 dark:from-green-400 dark:to-green-600 bg-clip-text text-transparent">
                {t('leaderboard.full_rankings')}
              </span>
            </h2>
          </div>

          <div className="divide-y-2 divide-sky-100 dark:divide-green-800">
            {remainder.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-6">
                  <Search className="h-16 w-16 text-slate-400 dark:text-green-500 mx-auto mb-4" />
                </div>
                <p className="text-slate-600 dark:text-green-300 text-lg mb-6">{t('leaderboard.no_users')}</p>
                <button
                  onClick={clearSearch}
                  className="px-8 py-4 bg-sky-600 dark:bg-green-600 text-white rounded-2xl font-bold hover:bg-sky-700 dark:hover:bg-green-700 transition-all duration-200 text-base shadow-lg"
                >
                  {t('leaderboard.clear_search')}
                </button>
              </div>
            ) : (
              // If we showed a podium, list from rank 4; otherwise start at rank 1
              remainder.map((user, idx) => {
                const rank = podium.length === 3 ? idx + 4 : idx + 1;
                return (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 hover:bg-sky-50/50 dark:hover:bg-green-900/30 hover:shadow-lg transition-all duration-300 ${getRankBg(rank)} mx-2 my-1 rounded-2xl`}
                >
                  <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                    <div className="flex items-center justify-center w-8 text-lg font-bold">
                      {getRankIcon(rank)}
                    </div>
                    
                    <div className="flex items-center space-x-4 min-w-0 flex-1">
                      <div className="relative flex-shrink-0">
                        <Link to={`/u/${user.username}`} className="block">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center ring-3 ring-sky-200 dark:ring-green-700 overflow-hidden bg-sky-100 dark:bg-green-900 hover:ring-sky-400 dark:hover:ring-green-500 transition-all duration-300">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sky-700 dark:text-green-200 font-bold text-lg">{user.username?.[0]?.toUpperCase() || 'U'}</span>
                            )}
                          </div>
                        </Link>
                        {rank <= 10 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-sky-600 dark:bg-green-600 rounded-full flex items-center justify-center">
                            <Star className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <p className="text-slate-900 dark:text-green-100 font-bold text-base sm:text-lg truncate">
                          <Link to={`/u/${user.username}`} className="hover:text-sky-600 dark:hover:text-green-400 transition-colors">
                            {user.fullName || user.username}
                          </Link>
                        </p>
                        <p className="text-slate-600 dark:text-green-300 text-sm sm:text-base truncate">
                          <Link to={`/u/${user.username}`} className="hover:text-sky-600 dark:hover:text-green-400 transition-colors">
                            @{user.username}
                          </Link>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-3 text-sm">
                    <div className="text-center bg-sky-50 dark:bg-green-900/40 rounded-xl p-3 min-w-[70px] border-2 border-sky-200 dark:border-green-800">
                      <p className="text-slate-900 dark:text-green-100 font-bold text-base">{user.points}</p>
                      <p className="text-slate-600 dark:text-green-300 text-sm">{t('stats.points')}</p>
                    </div>
                    <div className="text-center bg-amber-50 dark:bg-green-900/40 rounded-xl p-3 min-w-[70px] border-2 border-amber-200 dark:border-green-800">
                      <p className="text-amber-700 dark:text-green-200 font-bold text-base">{user.codecoins}</p>
                      <p className="text-amber-600 dark:text-green-300 text-sm">{t('stats.coins')}</p>
                    </div>
                    <div className="text-center bg-emerald-50 dark:bg-green-900/40 rounded-xl p-3 min-w-[70px] border-2 border-emerald-200 dark:border-green-800">
                      <p className="text-emerald-700 dark:text-green-200 font-bold text-base">{user.solvedProblems.length}</p>
                      <p className="text-emerald-600 dark:text-green-300 text-sm">{t('leaderboard.solved')}</p>
                    </div>
                  </div>
                </motion.div>
              );
              })
            )}
          </div>
        </motion.div>

        {/* Empty State */}
        {users.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-3xl border-2 border-sky-200 dark:border-green-800 p-12 shadow-xl">
              <Trophy className="h-20 w-20 text-slate-400 dark:text-green-500 mx-auto mb-6" />
              <p className="text-slate-600 dark:text-green-300 text-lg">No users found</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}