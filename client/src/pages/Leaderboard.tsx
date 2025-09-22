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
  const [sortBy, setSortBy] = useState<'points' | 'totalSolved' | 'username'>('points');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isSearching, setIsSearching] = useState(false);

  // Fetch leaderboard on initial load
  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Apply filters and sorting when search term, sortBy, or sortOrder changes
  useEffect(() => {
    filterAndSortUsers(users, debouncedSearchTerm, sortBy, sortOrder);
  }, [debouncedSearchTerm, sortBy, sortOrder, users]);

  const filterAndSortUsers = useCallback(
    (
      userList: LeaderboardUser[],
      search: string,
      sortField: 'points' | 'totalSolved' | 'username',
      order: 'asc' | 'desc'
    ) => {
      setIsSearching(true);
      
      setTimeout(() => {
        try {
          let result = [...userList];
          
          if (search) {
            const searchLower = search.trim().toLowerCase();
            result = result.filter(user => 
              user.username.toLowerCase().includes(searchLower) ||
              (user.fullName?.toLowerCase().includes(searchLower) ?? false)
            );
          }

          result.sort((a, b) => {
            let comparison = 0;
            
            if (sortField === 'username') {
              comparison = a.username.localeCompare(b.username);
            } else {
              comparison = (a[sortField] || 0) - (b[sortField] || 0);
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

  const handleSortChange = (field: 'points' | 'totalSolved' | 'username') => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col items-center justify-center px-4 transition-colors duration-300">
        <div className="relative">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-10 w-10 border-4 border-blue-200 dark:border-blue-800 opacity-20"></div>
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-300 text-sm font-medium transition-colors duration-300">Loading leaderboard...</p>
        <div className="mt-2 flex space-x-1">
          <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"></div>
          <div className="w-1.5 h-1.5 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce animation-delay-100"></div>
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce animation-delay-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black py-3 sm:py-4 px-3 sm:px-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="flex flex-col items-center space-y-3 mb-5">
            {/* Main Title */}
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="relative">
                <Trophy className="h-6 w-6 text-yellow-500 dark:text-yellow-400" />
                <Sparkles className="absolute -top-1 -right-1 h-2.5 w-2.5 text-yellow-400" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 dark:from-blue-400 dark:via-blue-500 dark:to-blue-600 bg-clip-text text-transparent text-center">
                {t('leaderboard.title')}
              </h1>
              <Heart className="h-4 w-4 text-red-500 dark:text-red-400" />
            </div>

            {/* Search Bar */}
            <div className="w-full max-w-lg mt-3 relative">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors duration-200" />
                <input
                  type="text"
                  placeholder={t('leaderboard.search_placeholder')}
                  className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-gray-300 dark:border-blue-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-blue-400 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-sm"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {isSearching && (
                  <div className="absolute right-9 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Sort Buttons */}
            <div className="flex flex-wrap gap-2 mt-3 justify-center">
              <button
                onClick={() => handleSortChange('username')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-200 text-sm ${
                  sortBy === 'username' 
                    ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md' 
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-800 border border-gray-300 dark:border-blue-800'
                }`}
              >
                <Users className="inline h-3 w-3 mr-1" />
                {t('leaderboard.sort_name')} <SortIndicator field="username" />
              </button>
              <button
                onClick={() => handleSortChange('points')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-200 text-sm ${
                  sortBy === 'points' 
                    ? 'bg-yellow-500 dark:bg-yellow-600 text-white shadow-md' 
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-gray-800 border border-gray-300 dark:border-blue-800'
                }`}
              >
                <Zap className="inline h-3 w-3 mr-1" />
                {t('stats.points')} <SortIndicator field="points" />
              </button>
              <button
                onClick={() => handleSortChange('totalSolved')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-200 text-sm ${
                  sortBy === 'totalSolved' 
                    ? 'bg-green-600 dark:bg-green-500 text-white shadow-md' 
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-gray-800 border border-gray-300 dark:border-blue-800'
                }`}
              >
                <Trophy className="inline h-3 w-3 mr-1" />
                {t('leaderboard.solved')} <SortIndicator field="totalSolved" />
              </button>
            </div>

            {/* Subtitle */}
            <div className="text-center mt-3">
              <p className="text-gray-700 dark:text-blue-400 text-sm font-medium transition-colors duration-300">{t('leaderboard.subtitle')}</p>
              <p className="text-gray-600 dark:text-gray-300 mt-1 text-xs transition-colors duration-300">
                {t('leaderboard.subtitle2')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Top 3 Podium */}
        {users.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {/* Second Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 sm:p-4 text-center md:mt-4 shadow-lg hover:shadow-xl dark:shadow-gray-900/20 dark:hover:shadow-gray-900/40 transition-all duration-300 transform hover:scale-105"
            >
              <div className="relative mb-3">
                <Link to={`/u/${users[1]?.username}`} className="block">
                  <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center ring-4 ring-gray-200 dark:ring-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-700">
                    {users[1]?.avatarUrl ? (
                      <img src={users[1]?.avatarUrl} alt={users[1]?.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-700 dark:text-gray-300 font-bold text-sm">{users[1]?.username?.[0]?.toUpperCase() || 'U'}</span>
                    )}
                  </div>
                </Link>
                <div className="absolute -top-1 -right-1 bg-gray-500 dark:bg-gray-400 rounded-full p-1 shadow-lg">
                  <span className="text-white dark:text-gray-900 font-bold text-xs">2</span>
                </div>
                <div className="absolute -bottom-1 -right-1">
                  <Medal className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
              </div>
              <h3 className="text-gray-900 dark:text-blue-400 font-bold text-sm truncate transition-colors duration-300">
                <Link to={`/u/${users[1]?.username}`}>{users[1]?.fullName || users[1]?.username}</Link>
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-xs mb-2 truncate transition-colors duration-300">
                <Link to={`/u/${users[1]?.username}`}>@{users[1]?.username}</Link>
              </p>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
                <p className="text-gray-900 dark:text-blue-400 font-bold text-sm transition-colors duration-300">{users[1]?.points} points</p>
                <p className="text-gray-600 dark:text-gray-300 text-xs transition-colors duration-300">Silver Champion</p>
              </div>
            </motion.div>

            {/* First Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 border-2 border-yellow-300 dark:border-yellow-600 rounded-xl p-4 text-center shadow-xl hover:shadow-2xl dark:shadow-yellow-900/20 dark:hover:shadow-yellow-900/40 transform hover:scale-105 transition-all duration-300"
            >
              <div className="relative mb-3">
                <Link to={`/u/${users[0]?.username}`} className="block">
                  <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center ring-4 ring-yellow-300 dark:ring-yellow-600 overflow-hidden bg-yellow-100 dark:bg-yellow-700">
                    {users[0]?.avatarUrl ? (
                      <img src={users[0]?.avatarUrl} alt={users[0]?.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-yellow-800 dark:text-yellow-200 font-extrabold text-base">{users[0]?.username?.[0]?.toUpperCase() || 'U'}</span>
                    )}
                  </div>
                </Link>
                <div className="absolute -top-2 -right-2 bg-yellow-500 dark:bg-yellow-600 rounded-full p-1.5 shadow-xl">
                  <Crown className="w-3 h-3 text-white" />
                </div>
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                  <Star className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                </div>
              </div>
              <h3 className="text-gray-900 dark:text-blue-400 font-bold text-sm mb-1 truncate transition-colors duration-300">
                <Link to={`/u/${users[0]?.username}`}>{users[0]?.fullName || users[0]?.username}</Link>
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300 text-xs mb-3 truncate transition-colors duration-300">
                <Link to={`/u/${users[0]?.username}`}>@{users[0]?.username}</Link>
              </p>
              <div className="bg-yellow-100 dark:bg-yellow-900/50 rounded-lg p-2 border border-yellow-200 dark:border-yellow-700 transition-colors duration-300">
                <p className="text-yellow-800 dark:text-yellow-200 font-bold text-sm transition-colors duration-300">{users[0]?.points} points</p>
                <p className="text-yellow-700 dark:text-yellow-300 text-xs font-medium transition-colors duration-300">Champion</p>
              </div>
            </motion.div>

            {/* Third Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-900 border-2 border-orange-200 dark:border-orange-700 rounded-xl p-3 sm:p-4 text-center md:mt-4 shadow-lg hover:shadow-xl dark:shadow-gray-900/20 dark:hover:shadow-gray-900/40 transition-all duration-300 transform hover:scale-105"
            >
              <div className="relative mb-3">
                <Link to={`/u/${users[2]?.username}`} className="block">
                  <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center ring-4 ring-orange-200 dark:ring-orange-700 overflow-hidden bg-orange-100 dark:bg-orange-800">
                    {users[2]?.avatarUrl ? (
                      <img src={users[2]?.avatarUrl} alt={users[2]?.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-orange-800 dark:text-orange-200 font-bold text-sm">{users[2]?.username?.[0]?.toUpperCase() || 'U'}</span>
                    )}
                  </div>
                </Link>
                <div className="absolute -top-1 -right-1 bg-orange-500 dark:bg-orange-600 rounded-full p-1 shadow-lg">
                  <span className="text-white font-bold text-xs">3</span>
                </div>
                <div className="absolute -bottom-1 -right-1">
                  <Award className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                </div>
              </div>
              <h3 className="text-gray-900 dark:text-blue-400 font-bold text-sm truncate transition-colors duration-300">
                <Link to={`/u/${users[2]?.username}`}>{users[2]?.fullName || users[2]?.username}</Link>
              </h3>
              <p className="text-orange-700 dark:text-orange-300 text-xs mb-2 truncate transition-colors duration-300">
                <Link to={`/u/${users[2]?.username}`}>@{users[2]?.username}</Link>
              </p>
              <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-2 border border-orange-200 dark:border-orange-700 transition-colors duration-300">
                <p className="text-orange-800 dark:text-orange-200 font-bold text-sm transition-colors duration-300">{users[2]?.points} points</p>
                <p className="text-orange-700 dark:text-orange-300 text-xs transition-colors duration-300">Bronze Star</p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Full Leaderboard */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-blue-800 overflow-hidden shadow-lg dark:shadow-gray-900/20 transition-colors duration-300"
        >
          <div className="px-4 py-3 border-b border-gray-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 transition-colors duration-300">
            <h2 className="text-sm font-bold text-gray-900 dark:text-blue-400 flex items-center transition-colors duration-300">
              <TrendingUp className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
                {t('leaderboard.full_rankings')}
              </span>
            </h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-blue-800">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <div className="mb-3">
                  <Search className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 transition-colors duration-300">{t('leaderboard.no_users')}</p>
                <button
                  onClick={clearSearch}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 text-sm"
                >
                  {t('leaderboard.clear_search')}
                </button>
              </div>
            ) : (
              // Exclude top 3 (shown in podium) and list from rank 4 onward
              filteredUsers.slice(3).map((user, idx) => {
                const rank = idx + 4;
                return (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 hover:shadow-sm dark:hover:shadow-gray-800/20 transition-all duration-300 ${getRankBg(rank)} mx-1 my-1 rounded-lg`}
                >
                  <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                    <div className="flex items-center justify-center w-6">
                      {getRankIcon(rank)}
                    </div>
                    
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="relative flex-shrink-0">
                        <Link to={`/u/${user.username}`} className="block">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center ring-2 ring-gray-200 dark:ring-blue-700 transition-colors duration-300 overflow-hidden bg-blue-100 dark:bg-blue-900">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-blue-700 dark:text-blue-300 font-bold text-xs">{user.username?.[0]?.toUpperCase() || 'U'}</span>
                            )}
                          </div>
                        </Link>
                        {rank <= 10 && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center">
                            <Star className="w-1.5 h-1.5 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <p className="text-gray-900 dark:text-blue-400 font-bold text-sm truncate transition-colors duration-300">
                          <Link to={`/u/${user.username}`}>{user.fullName || user.username}</Link>
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 text-xs truncate transition-colors duration-300">
                          <Link to={`/u/${user.username}`}>@{user.username}</Link>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-2 text-xs">
                    <div className="text-center bg-gray-50 dark:bg-gray-800 rounded-lg p-1.5 min-w-[50px] border border-gray-200 dark:border-gray-700 transition-colors duration-300">
                      <p className="text-gray-900 dark:text-blue-400 font-bold text-xs transition-colors duration-300">{user.points}</p>
                      <p className="text-gray-600 dark:text-gray-300 text-xs transition-colors duration-300">{t('stats.points')}</p>
                    </div>
                    <div className="text-center bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-1.5 min-w-[50px] border border-yellow-200 dark:border-yellow-700 transition-colors duration-300">
                      <p className="text-yellow-700 dark:text-yellow-300 font-bold text-xs transition-colors duration-300">{user.codecoins}</p>
                      <p className="text-yellow-600 dark:text-yellow-400 text-xs transition-colors duration-300">{t('stats.coins')}</p>
                    </div>
                    <div className="text-center bg-green-50 dark:bg-green-900/30 rounded-lg p-1.5 min-w-[50px] border border-green-200 dark:border-green-700 transition-colors duration-300">
                      <p className="text-green-700 dark:text-green-300 font-bold text-xs transition-colors duration-300">{user.solvedProblems.length}</p>
                      <p className="text-green-600 dark:text-green-400 text-xs transition-colors duration-300">{t('leaderboard.solved')}</p>
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
            className="text-center py-8"
          >
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-blue-800 p-6 transition-colors duration-300">
              <Trophy className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300 text-sm transition-colors duration-300">No users found</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};