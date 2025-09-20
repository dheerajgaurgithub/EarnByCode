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
        return 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 shadow-sm';
      case 'ongoing':
      case 'live':
        return 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200 shadow-sm';
      case 'completed':
      case 'ended':
        return 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-600 border-gray-200 shadow-sm';
      default:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-600 border-gray-200 shadow-sm';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4">
        <div className="flex flex-col items-center space-y-3">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-blue-600 absolute top-0"></div>
          </div>
          <p className="text-blue-600 font-medium text-sm">Loading contests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-3 sm:py-4 lg:py-6">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Header */}
        <div className="mb-6 lg:mb-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 bg-clip-text text-transparent mb-3">
              AlgoBucks Contests
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
              Compete with developers worldwide and win cash prizes! Test your skills and climb the leaderboard.
            </p>
          </motion.div>
        </div>

        {/* Tabs */}
        <motion.div 
          className="mb-6 lg:mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="flex justify-center">
            <div className="inline-flex p-1 bg-white/70 backdrop-blur-sm rounded-xl border border-blue-100 shadow-md max-w-full overflow-x-auto">
              {[
                { key: 'all', label: 'All Contests', icon: Trophy },
                { key: 'upcoming', label: 'Upcoming', icon: Calendar },
                { key: 'live', label: 'Live', icon: Clock },
                { key: 'ended', label: 'Ended', icon: Award }
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedTab(tab.key as any)}
                    className={`relative flex items-center space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-300 whitespace-nowrap ${
                      selectedTab === tab.key
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md transform scale-105'
                        : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50/50'
                    }`}
                  >
                    <IconComponent className="h-3 w-3" />
                    <span>{tab.label}</span>
                    {selectedTab === tab.key && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg -z-10"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Contest Cards */}
        <div className="space-y-4 lg:space-y-6">
          {contests.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100 p-8 text-center shadow-lg"
            >
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                  <Trophy className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">No contests found</h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    {selectedTab === 'all' 
                      ? 'There are currently no contests available. New exciting contests are coming soon!'
                      : `There are no ${selectedTab} contests at the moment.`}
                  </p>
                </div>
                {selectedTab !== 'all' && (
                  <button
                    onClick={() => setSelectedTab('all')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
                  >
                    View all contests
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="grid gap-4 lg:gap-6">
              {contests.map((contest, index) => (
                <motion.div
                  key={contest._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className="group bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
                >
                  <div className="p-4 sm:p-6">
                    {/* Contest Header */}
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4 space-y-3 lg:space-y-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                          <h3 className="text-lg sm:text-xl font-bold text-slate-800 group-hover:text-blue-700 transition-colors duration-200">
                            {contest.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize border ${getStatusColor(contest.status)}`}>
                              {getStatusDisplay(contest.status)}
                            </span>
                            {contest.status === 'ongoing' && (
                              <div className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-full">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-bold text-red-600">LIVE NOW</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                          {contest.description}
                        </p>
                      </div>
                    </div>

                    {/* Contest Details Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                      <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                        <div className="p-1.5 bg-blue-500 rounded-lg">
                          <Calendar className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Start Time</p>
                          <p className="text-xs font-semibold text-slate-800">
                            {formatDate(contest.startTime)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
                        <div className="p-1.5 bg-purple-500 rounded-lg">
                          <Clock className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Duration</p>
                          <p className="text-xs font-semibold text-slate-800">{contest.duration} min</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-100">
                        <div className="p-1.5 bg-emerald-500 rounded-lg">
                          <DollarSign className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Entry Fee</p>
                          <p className="text-xs font-semibold text-slate-800">${contest.entryFee}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-100">
                        <div className="p-1.5 bg-amber-500 rounded-lg">
                          <Trophy className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Prize Pool</p>
                          <p className="text-xs font-semibold text-slate-800">${contest.prizePool}</p>
                        </div>
                      </div>
                    </div>

                    {/* Contest Stats and Actions */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                        <div className="flex items-center space-x-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                          <Users className="h-4 w-4 text-blue-500" />
                          <span className="text-xs font-semibold text-slate-700">
                            {contest.participants?.length || 0}/{contest.maxParticipants} participants
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 p-2 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg border border-violet-100">
                          <Award className="h-4 w-4 text-violet-500" />
                          <span className="text-xs font-semibold text-slate-700">{contest.problems?.length || 0} problems</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {contest.status === 'completed' ? (
                          <Link
                            to={`/contests/${contest._id}/results`}
                            className="w-full sm:w-auto px-4 py-2 text-sm bg-gradient-to-r from-slate-500 to-gray-600 text-white font-semibold rounded-lg hover:from-slate-600 hover:to-gray-700 transition-all duration-200 text-center transform hover:scale-105 shadow-md"
                          >
                            View Results
                          </Link>
                        ) : contest.status === 'ongoing' ? (
                          isUserRegistered(contest) ? (
                            <Link
                              to={`/contests/${contest._id}`}
                              className="w-full sm:w-auto px-4 py-2 text-sm bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-200 text-center transform hover:scale-105 shadow-md"
                            >
                              Enter Contest
                            </Link>
                          ) : (
                            <span className="w-full sm:w-auto px-4 py-2 text-sm bg-gradient-to-r from-gray-100 to-slate-100 text-slate-500 font-semibold rounded-lg text-center border border-gray-200 shadow-sm">
                              Registration Closed
                            </span>
                          )
                        ) : (
                          <>
                            {isUserRegistered(contest) ? (
                              <span className="w-full sm:w-auto px-4 py-2 text-sm bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 font-semibold rounded-lg text-center border border-emerald-200 shadow-sm">
                                ✓ Registered
                              </span>
                            ) : (
                              <button
                                onClick={() => handleJoinContest(contest._id)}
                                disabled={!user}
                                className="w-full sm:w-auto px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-500 disabled:hover:to-indigo-600 transform hover:scale-105 shadow-md"
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
                        className="mt-4 flex items-start space-x-2 text-amber-700 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-3"
                      >
                        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold">Login Required</p>
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