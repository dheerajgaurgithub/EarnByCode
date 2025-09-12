import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Medal, Award, TrendingUp, Users, Crown, Search, X, Sparkles, Zap, Heart, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import apiService from '../services/api';

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
  avatar?: string;
  points: number;
  codecoins: number;
  ranking: number;
  solvedProblems: string[];
  totalSolved: number;
}

export const Leaderboard: React.FC = () => {
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
      
      const formattedUsers = data.map((user: any) => ({
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        points: user.points || 0,
        codecoins: user.codecoins || 0,
        ranking: user.ranking || 0,
        solvedProblems: user.solvedProblems || [],
        totalSolved: user.totalSolved || 0
      }));
      
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
        return <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />;
      case 3:
        return <Award className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />;
      default:
        return <span className="text-base sm:text-lg font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 shadow-sm';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 shadow-sm';
      case 3:
        return 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 shadow-sm';
      default:
        return 'bg-white border-gray-200 hover:bg-blue-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-blue-200 border-t-blue-600"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-blue-200 opacity-20"></div>
        </div>
        <p className="mt-4 sm:mt-6 text-gray-600 text-base sm:text-lg font-medium">Loading leaderboard...</p>
        <div className="mt-2 flex space-x-1">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce animation-delay-100"></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce animation-delay-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 lg:mb-12"
        >
          <div className="flex flex-col items-center space-y-4 mb-6 lg:mb-8">
            {/* Main Title */}
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="relative">
                <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-yellow-500" />
                <Sparkles className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 text-yellow-400" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent text-center">
                AlgoBucks Leaderboard
              </h1>
              <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
            </div>

            {/* Search Bar */}
            <div className="w-full max-w-lg mt-4 lg:mt-6 relative">
              <div className="relative group">
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-200" />
                <input
                  type="text"
                  placeholder="Search by username or name..."
                  className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                )}
                {isSearching && (
                  <div className="absolute right-10 sm:right-12 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-blue-200 border-t-blue-600"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Sort Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 lg:mt-6 justify-center">
              <button
                onClick={() => handleSortChange('username')}
                className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                  sortBy === 'username' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-300'
                }`}
              >
                <Users className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Name <SortIndicator field="username" />
              </button>
              <button
                onClick={() => handleSortChange('points')}
                className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                  sortBy === 'points' 
                    ? 'bg-yellow-500 text-white shadow-md' 
                    : 'bg-white text-gray-700 hover:bg-yellow-50 border border-gray-300'
                }`}
              >
                <Zap className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Points <SortIndicator field="points" />
              </button>
              <button
                onClick={() => handleSortChange('totalSolved')}
                className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                  sortBy === 'totalSolved' 
                    ? 'bg-green-600 text-white shadow-md' 
                    : 'bg-white text-gray-700 hover:bg-green-50 border border-gray-300'
                }`}
              >
                <Trophy className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Solved <SortIndicator field="totalSolved" />
              </button>
            </div>

            {/* Subtitle */}
            <div className="text-center mt-4 lg:mt-6">
              <p className="text-gray-700 text-base sm:text-lg font-medium">Top performers and their achievements</p>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Compete and climb the ranks to earn more AlgoBucks ✨
              </p>
            </div>
          </div>
        </motion.div>

        {/* Top 3 Podium */}
        {users.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8 lg:mb-12">
            {/* Second Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border-2 border-gray-200 rounded-2xl p-4 sm:p-6 text-center md:mt-6 lg:mt-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="relative mb-4 sm:mb-6">
                {users[1]?.avatar ? (
                  <img
                    src={users[1].avatar}
                    alt={users[1].username}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full mx-auto object-cover ring-4 ring-gray-200"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mx-auto flex items-center justify-center ring-4 ring-gray-200">
                    <Users className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
                  </div>
                )}
                <div className="absolute -top-2 -right-2 bg-gray-500 rounded-full p-1.5 sm:p-2 shadow-lg">
                  <span className="text-white font-bold text-xs sm:text-sm">2</span>
                </div>
                <div className="absolute -bottom-1 -right-1">
                  <Medal className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
                </div>
              </div>
              <h3 className="text-gray-900 font-bold text-base sm:text-lg truncate">{users[1]?.fullName || users[1]?.username}</h3>
              <p className="text-gray-600 text-sm mb-3 truncate">@{users[1]?.username}</p>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <p className="text-gray-900 font-bold text-lg sm:text-xl">{users[1]?.points} points</p>
                <p className="text-gray-600 text-xs sm:text-sm">Silver Champion</p>
              </div>
            </motion.div>

            {/* First Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-6 sm:p-8 text-center shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <div className="relative mb-4 sm:mb-6">
                {users[0]?.avatar ? (
                  <img
                    src={users[0].avatar}
                    alt={users[0].username}
                    className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full mx-auto object-cover ring-4 ring-yellow-300"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full mx-auto flex items-center justify-center ring-4 ring-yellow-300">
                    <Users className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-yellow-700" />
                  </div>
                )}
                <div className="absolute -top-2 sm:-top-3 -right-2 sm:-right-3 bg-yellow-500 rounded-full p-2 sm:p-3 shadow-xl">
                  <Crown className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <Star className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
                </div>
              </div>
              <h3 className="text-gray-900 font-bold text-lg sm:text-xl mb-1 truncate">{users[0]?.fullName || users[0]?.username}</h3>
              <p className="text-yellow-700 text-sm mb-4 truncate">@{users[0]?.username}</p>
              <div className="bg-yellow-100 rounded-xl p-3 sm:p-4 border border-yellow-200">
                <p className="text-yellow-800 font-bold text-xl sm:text-2xl">{users[0]?.points} points</p>
                <p className="text-yellow-700 text-xs sm:text-sm font-medium">👑 Champion</p>
              </div>
            </motion.div>

            {/* Third Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border-2 border-orange-200 rounded-2xl p-4 sm:p-6 text-center md:mt-6 lg:mt-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="relative mb-4 sm:mb-6">
                {users[2]?.avatar ? (
                  <img
                    src={users[2].avatar}
                    alt={users[2].username}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full mx-auto object-cover ring-4 ring-orange-200"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-full mx-auto flex items-center justify-center ring-4 ring-orange-200">
                    <Users className="w-6 h-6 sm:w-8 sm:h-8 text-orange-700" />
                  </div>
                )}
                <div className="absolute -top-2 -right-2 bg-orange-500 rounded-full p-1.5 sm:p-2 shadow-lg">
                  <span className="text-white font-bold text-xs sm:text-sm">3</span>
                </div>
                <div className="absolute -bottom-1 -right-1">
                  <Award className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                </div>
              </div>
              <h3 className="text-gray-900 font-bold text-base sm:text-lg truncate">{users[2]?.fullName || users[2]?.username}</h3>
              <p className="text-orange-700 text-sm mb-3 truncate">@{users[2]?.username}</p>
              <div className="bg-orange-50 rounded-xl p-3 border border-orange-200">
                <p className="text-orange-800 font-bold text-lg sm:text-xl">{users[2]?.points} points</p>
                <p className="text-orange-700 text-xs sm:text-sm">Bronze Star</p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Full Leaderboard */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg"
        >
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-blue-600" />
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Full Rankings
              </span>
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="mb-4">
                  <Search className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                </div>
                <p className="text-gray-600 text-lg sm:text-xl mb-6">No users found matching your search</p>
                <button
                  onClick={clearSearch}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              filteredUsers.map((user, index) => (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 lg:p-6 hover:shadow-sm transition-all duration-300 ${getRankBg(index + 1)} mx-2 my-1 rounded-lg`}
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-0">
                    <div className="flex items-center justify-center w-8 sm:w-12">
                      {getRankIcon(index + 1)}
                    </div>
                    
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                      <div className="relative flex-shrink-0">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.username}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center ring-2 ring-gray-200">
                            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                          </div>
                        )}
                        {index < 10 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <Star className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <p className="text-gray-900 font-bold text-sm sm:text-base lg:text-lg truncate">
                          {user.fullName || user.username}
                        </p>
                        <p className="text-gray-600 text-xs sm:text-sm truncate">@{user.username}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4 lg:space-x-6 text-sm">
                    <div className="text-center bg-gray-50 rounded-lg p-2 sm:p-3 min-w-[60px] sm:min-w-[80px] border border-gray-200">
                      <p className="text-gray-900 font-bold text-sm sm:text-base lg:text-lg">{user.points}</p>
                      <p className="text-gray-600 text-xs">Points</p>
                    </div>
                    <div className="text-center bg-yellow-50 rounded-lg p-2 sm:p-3 min-w-[60px] sm:min-w-[80px] border border-yellow-200">
                      <p className="text-yellow-700 font-bold text-sm sm:text-base lg:text-lg">{user.codecoins}</p>
                      <p className="text-yellow-600 text-xs">Coins</p>
                    </div>
                    <div className="text-center bg-green-50 rounded-lg p-2 sm:p-3 min-w-[60px] sm:min-w-[80px] border border-green-200">
                      <p className="text-green-700 font-bold text-sm sm:text-base lg:text-lg">{user.solvedProblems.length}</p>
                      <p className="text-green-600 text-xs">Solved</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Empty State */}
        {users.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 sm:py-16"
          >
            <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12">
              <Trophy className="h-20 w-20 sm:h-24 sm:w-24 text-gray-400 mx-auto mb-6" />
              <p className="text-gray-600 text-xl">No users found</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};