import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trophy, Clock, Users, DollarSign, Calendar, Award, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import apiService, { type IContest } from '../services/api';

export const Contests: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [contests, setContests] = useState<IContest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'all' | 'upcoming' | 'live' | 'ended'>('all');

  useEffect(() => {
    fetchContests();
  }, [selectedTab]);

  const fetchContests = async () => {
    try {
      setLoading(true);
      console.log('Fetching public contests...');
      const response = await apiService.getPublicContests();
      console.log('Contests API response:', response);
      
      if (!Array.isArray(response)) {
        console.error('Expected an array of contests but got:', response);
        setContests([]);
        return;
      }
      
      // Log each contest's status
      response.forEach((contest, index) => {
        console.log(`Contest ${index + 1}:`, {
          title: contest.title,
          status: contest.status,
          startTime: contest.startTime,
          endTime: contest.endTime,
          participants: contest.participants?.length || 0
        });
      });
      
      // Filter by selected tab (backend already filters for isPublic)
      const filteredContests = response.filter((contest: IContest) => {
        if (selectedTab === 'upcoming') return contest.status === 'upcoming';
        if (selectedTab === 'live') return contest.status === 'ongoing';
        if (selectedTab === 'ended') return contest.status === 'completed';
        return true; // 'all' tab
      });
      
      console.log('Filtered contests:', filteredContests);
      setContests(filteredContests);
    } catch (error) {
      console.error('Failed to fetch contests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinContest = async (contestId: string) => {
    if (!user) return;

    const contest = contests.find(c => c._id === contestId);
    if (!contest) return;

    if ((user.walletBalance ?? 0) < contest.entryFee) {
      alert('Insufficient wallet balance! Please add funds to your wallet.');
      return;
    }

    try {
      await apiService.joinContest(contestId);
      await refreshUser();
      await fetchContests();
      alert('Successfully registered for the contest!');
    } catch (error: any) {
      alert(error.message || 'Failed to join contest');
    }
  };

  const getStatusColor = (status: string = '') => {
    switch (status.toLowerCase()) {
      case 'upcoming':
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700';
      case 'ongoing':
      case 'live':
        return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700';
      case 'completed':
      case 'ended':
        return 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600';
      default:
        return 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600';
    }
  };

  const getStatusDisplay = (status: string = '') => {
    switch (status.toLowerCase()) {
      case 'upcoming':
        return 'Upcoming';
      case 'ongoing':
      case 'live':
        return 'Live';
      case 'completed':
      case 'ended':
        return 'Ended';
      default:
        return status || 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUserRegistered = (contest: IContest) => {
    return contest.participants?.some((p: any) => 
      (typeof p.user === 'string' ? p.user : p.user._id) === user?._id
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center px-3">
        <div className="flex flex-col items-center space-y-2">
          <div className="relative">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 dark:border-gray-700"></div>
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-blue-600 dark:border-t-blue-400 absolute top-0"></div>
          </div>
          <p className="text-blue-600 dark:text-blue-400 font-medium text-xs">Loading contests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-2 sm:py-3 lg:py-4">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Header */}
        <div className="mb-4 lg:mb-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-2">
              AlgoBucks Contests
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Compete with developers worldwide and win cash prizes! Test your skills and climb the leaderboard.
            </p>
          </motion.div>
        </div>

        {/* Tabs */}
        <motion.div 
          className="mb-4 lg:mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="flex justify-center">
            <div className="inline-flex p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 max-w-full overflow-x-auto">
              {[
                { key: 'all', label: 'All', icon: Trophy },
                { key: 'upcoming', label: 'Upcoming', icon: Calendar },
                { key: 'live', label: 'Live', icon: Clock },
                { key: 'ended', label: 'Ended', icon: Award }
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedTab(tab.key as any)}
                    className={`relative flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                      selectedTab === tab.key
                        ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <IconComponent className="h-3 w-3" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Contest Cards */}
        <div className="space-y-3 lg:space-y-4">
          {contests.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center"
            >
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">No contests found</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    {selectedTab === 'all' 
                      ? 'There are currently no contests available. New exciting contests are coming soon!'
                      : `There are no ${selectedTab} contests at the moment.`}
                  </p>
                </div>
                {selectedTab !== 'all' && (
                  <button
                    onClick={() => setSelectedTab('all')}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200"
                  >
                    View all contests
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="grid gap-3 lg:gap-4">
              {contests.map((contest, index) => (
                <motion.div
                  key={contest._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className="group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg dark:hover:shadow-gray-900/20 transition-all duration-300 overflow-hidden"
                >
                  <div className="p-3 sm:p-4">
                    {/* Contest Header */}
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-3 space-y-2 lg:space-y-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200">
                            {contest.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize border ${getStatusColor(contest.status)}`}>
                              {getStatusDisplay(contest.status)}
                            </span>
                            {contest.status === 'ongoing' && (
                              <div className="flex items-center space-x-1 px-2 py-0.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-full">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-semibold text-red-600 dark:text-red-400">LIVE</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                          {contest.description}
                        </p>
                      </div>
                    </div>

                    {/* Contest Details Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
                      <div className="flex items-center space-x-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800">
                        <div className="p-1 bg-blue-500 dark:bg-blue-600 rounded-md">
                          <Calendar className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Start</p>
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">
                            {formatDate(contest.startTime)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-md border border-purple-100 dark:border-purple-800">
                        <div className="p-1 bg-purple-500 dark:bg-purple-600 rounded-md">
                          <Clock className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Duration</p>
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">{contest.duration} min</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-md border border-emerald-100 dark:border-emerald-800">
                        <div className="p-1 bg-emerald-500 dark:bg-emerald-600 rounded-md">
                          <DollarSign className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Fee</p>
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">${contest.entryFee}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-100 dark:border-amber-800">
                        <div className="p-1 bg-amber-500 dark:bg-amber-600 rounded-md">
                          <Trophy className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Prize</p>
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">${contest.prizePool}</p>
                        </div>
                      </div>
                    </div>

                    {/* Contest Stats and Actions */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                        <div className="flex items-center space-x-1.5 p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800">
                          <Users className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {contest.participants?.length || 0}/{contest.maxParticipants}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 p-1.5 bg-violet-50 dark:bg-violet-900/20 rounded-md border border-violet-100 dark:border-violet-800">
                          <Award className="h-3 w-3 text-violet-500 dark:text-violet-400" />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{contest.problems?.length || 0} problems</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {contest.status === 'completed' ? (
                          <Link
                            to={`/contests/${contest._id}/results`}
                            className="w-full sm:w-auto px-3 py-1.5 text-xs bg-gray-600 dark:bg-gray-500 text-white font-medium rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200 text-center"
                          >
                            View Results
                          </Link>
                        ) : contest.status === 'ongoing' ? (
                          isUserRegistered(contest) ? (
                            <Link
                              to={`/contests/${contest._id}`}
                              className="w-full sm:w-auto px-3 py-1.5 text-xs bg-emerald-600 dark:bg-emerald-500 text-white font-medium rounded-md hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors duration-200 text-center"
                            >
                              Enter Contest
                            </Link>
                          ) : (
                            <span className="w-full sm:w-auto px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium rounded-md text-center border border-gray-200 dark:border-gray-600">
                              Registration Closed
                            </span>
                          )
                        ) : (
                          <>
                            {isUserRegistered(contest) ? (
                              <span className="w-full sm:w-auto px-3 py-1.5 text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-medium rounded-md text-center border border-emerald-200 dark:border-emerald-700">
                                ✓ Registered
                              </span>
                            ) : (
                              <button
                                onClick={() => handleJoinContest(contest._id)}
                                disabled={!user}
                                className="w-full sm:w-auto px-3 py-1.5 text-xs bg-blue-600 dark:bg-blue-500 text-white font-medium rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Join Contest
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Login Alert */}
                    {!user && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-3 flex items-start space-x-2 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md p-2.5"
                      >
                        <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium">Login Required</p>
                          <p className="text-xs">Please login to participate in contests and compete for prizes.</p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contests;