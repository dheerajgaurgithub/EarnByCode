import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trophy, Clock, Users, DollarSign, Calendar, Award, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import apiService, { type IContest } from '../services/api';
import { walletService } from '../services/walletService';

export const Contests: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
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

  // Lazy load Razorpay checkout script
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleTopUpWithRazorpay = async (required: number, onSuccess: () => Promise<void>) => {
    const ok = await loadRazorpayScript();
    if (!ok) {
      alert('Unable to load Razorpay');
      return;
    }
    // Create order for the shortfall
    const order = await walletService.createRazorpayOrder(required);
    const options: any = {
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: 'AlgoBucks',
      description: 'Contest entry top-up',
      order_id: order.orderId,
      handler: async (response: any) => {
        await walletService.verifyRazorpayPayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          amount: required,
        });
        await onSuccess();
      },
      theme: { color: '#2563eb' },
    };
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  const handleJoinContest = async (contestId: string) => {
    if (!user) return;

    const contest = contests.find(c => c._id === contestId);
    if (!contest) return;

    // Fetch latest wallet balance to avoid stale client values
    let latestBalance = user.walletBalance ?? 0;
    try {
      const balanceData = await walletService.getBalance();
      latestBalance = balanceData.balance ?? latestBalance;
    } catch (e) {
      // Non-blocking: fall back to local state if API fails
      console.warn('Could not refresh wallet balance, using cached value.', e);
    }

    if (latestBalance < contest.entryFee) {
      const balance = latestBalance;
      const shortfall = Math.max(0, contest.entryFee - balance);
      // Offer Razorpay top-up inline
      const viaRzp = window.confirm(
        `Insufficient wallet balance.\n\n` +
        `Entry fee: ₹${contest.entryFee}\n` +
        `Your balance: ₹${balance}\n` +
        `You need to add: ₹${shortfall}.\n\n` +
        `Click OK to pay now with Razorpay, or Cancel to open your Wallet.`
      );
      if (viaRzp) {
        await handleTopUpWithRazorpay(shortfall, async () => {
          // refresh user and try joining again
          try { await refreshUser(); } catch {}
          await apiService.joinContest(contestId);
          await refreshUser();
          await fetchContests();
          alert('Successfully registered for the contest!');
        });
      } else {
        navigate(`/wallet?topup=${shortfall}`);
      }
      return;
    }

    try {
      await apiService.joinContest(contestId);
      await refreshUser();
      await fetchContests();
      alert('Successfully registered for the contest!');
    } catch (error: any) {
      const msg = String(error?.message || 'Failed to join contest');
      // Heuristic: if server enforces balance and returns an error, guide the user
      if (/insufficient|low balance|not enough|wallet/i.test(msg)) {
        // If we still have the contest record, compute shortfall again
        const current = contests.find(c => c._id === contestId);
        const balance = user.walletBalance ?? 0;
        const fee = current?.entryFee ?? 0;
        const shortfall = Math.max(0, fee - balance);
        const goToWallet = window.confirm(
          `${msg}\n\n` +
          (fee > 0
            ? `Entry fee: ${fee}\nYour balance: ${balance}\nYou need to add: ${shortfall}.\n\n`
            : '') +
          `Would you like to go to your wallet to add funds now?`
        );
        if (goToWallet) {
          navigate(`/wallet?topup=${shortfall || ''}`);
        }
      } else {
        alert(msg);
      }
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
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-100 dark:from-gray-950 dark:via-black dark:to-gray-900 flex items-center justify-center px-3 transition-colors duration-300">
        <div className="flex flex-col items-center space-y-3">
          <div className="relative">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 border-3 border-sky-200/50 dark:border-green-800/30"></div>
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 border-3 border-t-sky-600 dark:border-t-green-400 absolute top-0"></div>
          </div>
          <p className="text-sky-700 dark:text-green-300 font-semibold text-sm">Loading contests...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-100 dark:from-gray-950 dark:via-black dark:to-gray-900 py-3 sm:py-4 lg:py-5 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-5">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-sky-900 dark:text-green-400 mb-2 sm:mb-3">
              AlgoBucks Contests
            </h1>
            <p className="text-sm sm:text-base text-sky-700 dark:text-green-300 max-w-xl mx-auto font-medium">
              Compete with developers worldwide and win cash prizes! Test your skills and climb the leaderboard.
            </p>
          </motion.div>
        </div>
  
        {/* Tabs */}
        <motion.div 
          className="mb-4 sm:mb-6 lg:mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="flex justify-center">
            <div className="inline-flex p-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl border border-sky-200/50 dark:border-green-800/30 shadow-lg max-w-full overflow-x-auto">
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
                    className={`relative flex items-center space-x-2 px-3 sm:px-4 lg:px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-300 whitespace-nowrap transform hover:scale-105 ${
                      selectedTab === tab.key
                        ? 'bg-gradient-to-r from-sky-500 to-sky-600 dark:from-green-600 dark:to-green-700 text-white shadow-lg'
                        : 'text-sky-700 dark:text-green-300 hover:text-sky-900 dark:hover:text-green-200 hover:bg-sky-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
  
        {/* Contest Cards */}
        <div className="space-y-3 sm:space-y-4 lg:space-y-5">
          {contests.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-sky-200/50 dark:border-green-800/30 p-4 sm:p-6 lg:p-8 text-center shadow-lg hover:shadow-xl dark:hover:shadow-gray-900/60 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-sky-100 to-sky-200 dark:from-green-900/50 dark:to-gray-800/50 rounded-2xl flex items-center justify-center shadow-lg">
                  <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-sky-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-sky-900 dark:text-green-400 mb-2">No contests found</h3>
                  <p className="text-sm text-sky-700 dark:text-green-300 max-w-md mx-auto font-medium">
                    {selectedTab === 'all' 
                      ? 'There are currently no contests available. New exciting contests are coming soon!'
                      : `There are no ${selectedTab} contests at the moment.`}
                  </p>
                </div>
                {selectedTab !== 'all' && (
                  <button
                    onClick={() => setSelectedTab('all')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-sky-500 to-sky-600 dark:from-green-600 dark:to-green-700 hover:from-sky-600 hover:to-sky-700 dark:hover:from-green-700 dark:hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    View all contests
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {contests.map((contest, index) => (
                <motion.div
                  key={contest._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className="group bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-sky-200/50 dark:border-green-800/30 hover:border-sky-300/70 dark:hover:border-green-700/50 hover:shadow-xl dark:hover:shadow-gray-900/60 transition-all duration-300 overflow-hidden transform hover:-translate-y-1 hover:scale-[1.02]"
                >
                  <div className="p-3 sm:p-4 lg:p-5">
                    {/* Contest Header */}
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-3 sm:mb-4 space-y-2 lg:space-y-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                          <h3 className="text-base sm:text-lg lg:text-xl font-bold text-sky-900 dark:text-green-400 group-hover:text-sky-700 dark:group-hover:text-green-300 transition-colors duration-300">
                            {contest.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold capitalize border ${getStatusColor(contest.status)}`}>
                              {getStatusDisplay(contest.status)}
                            </span>
                            {contest.status === 'ongoing' && (
                              <div className="flex items-center space-x-1 px-2 py-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-bold text-red-600 dark:text-red-400">LIVE</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-sky-700 dark:text-green-300 mb-3 leading-relaxed font-medium">
                          {contest.description}
                        </p>
                      </div>
                    </div>
  
                    {/* Contest Details Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="flex items-center space-x-2 p-2 sm:p-3 bg-sky-50/80 dark:bg-green-900/20 rounded-lg border border-sky-200/50 dark:border-green-800/30 hover:scale-105 transition-all duration-300">
                        <div className="p-1.5 bg-gradient-to-br from-sky-500 to-sky-600 dark:from-green-600 dark:to-green-700 rounded-lg shadow-lg">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-sky-600 dark:text-green-300 font-semibold">Start</p>
                          <p className="text-sm font-bold text-sky-900 dark:text-green-400">
                            {formatDate(contest.startTime)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 p-2 sm:p-3 bg-purple-50/80 dark:bg-green-900/20 rounded-lg border border-purple-200/50 dark:border-green-800/30 hover:scale-105 transition-all duration-300">
                        <div className="p-1.5 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-green-600 dark:to-green-700 rounded-lg shadow-lg">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-purple-600 dark:text-green-300 font-semibold">Duration</p>
                          <p className="text-sm font-bold text-purple-900 dark:text-green-400">{contest.duration} min</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 p-2 sm:p-3 bg-emerald-50/80 dark:bg-green-900/20 rounded-lg border border-emerald-200/50 dark:border-green-800/30 hover:scale-105 transition-all duration-300">
                        <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-green-600 dark:to-green-700 rounded-lg shadow-lg">
                          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-emerald-600 dark:text-green-300 font-semibold">Fee</p>
                          <p className="text-sm font-bold text-emerald-900 dark:text-green-400">{walletService.formatCurrency(contest.entryFee, 'INR')}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 p-2 sm:p-3 bg-amber-50/80 dark:bg-green-900/20 rounded-lg border border-amber-200/50 dark:border-green-800/30 hover:scale-105 transition-all duration-300">
                        <div className="p-1.5 bg-gradient-to-br from-amber-500 to-amber-600 dark:from-green-600 dark:to-green-700 rounded-lg shadow-lg">
                          <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-amber-600 dark:text-green-300 font-semibold">Prize</p>
                          <p className="text-sm font-bold text-amber-900 dark:text-green-400">{walletService.formatCurrency(contest.prizePool, 'INR')}</p>
                        </div>
                      </div>
                    </div>
  
                    {/* Contest Stats and Actions */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                        <div className="flex items-center space-x-2 p-2 bg-sky-50/80 dark:bg-green-900/20 rounded-lg border border-sky-200/50 dark:border-green-800/30">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4 text-sky-600 dark:text-green-400" />
                          <span className="text-sm font-semibold text-sky-700 dark:text-green-300">
                            {contest.participants?.length || 0}/{contest.maxParticipants}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 p-2 bg-violet-50/80 dark:bg-green-900/20 rounded-lg border border-violet-200/50 dark:border-green-800/30">
                          <Award className="h-3 w-3 sm:h-4 sm:w-4 text-violet-600 dark:text-green-400" />
                          <span className="text-sm font-semibold text-violet-700 dark:text-green-300">{contest.problems?.length || 0} problems</span>
                        </div>
                      </div>
  
                      <div className="flex items-center space-x-2">
                        {contest.status === 'completed' ? (
                          <Link
                            to={`/contests/${contest._id}/results`}
                            className="w-full sm:w-auto px-3 py-2 text-sm bg-gradient-to-r from-gray-500 to-gray-600 dark:from-green-600 dark:to-green-700 text-white font-semibold rounded-lg hover:from-gray-600 hover:to-gray-700 dark:hover:from-green-700 dark:hover:to-green-800 transition-all duration-300 text-center shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            View Results
                          </Link>
                        ) : contest.status === 'ongoing' ? (
                          isUserRegistered(contest) ? (
                            <Link
                              to={`/contests/${contest._id}`}
                              className="w-full sm:w-auto px-3 py-2 text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-green-600 dark:to-green-700 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-emerald-700 dark:hover:from-green-700 dark:hover:to-green-800 transition-all duration-300 text-center shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                              Enter Contest
                            </Link>
                          ) : (
                            <span className="w-full sm:w-auto px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-semibold rounded-lg text-center border border-gray-200 dark:border-gray-600">
                              Registration Closed
                            </span>
                          )
                        ) : (
                          <>
                            {isUserRegistered(contest) ? (
                              <span className="w-full sm:w-auto px-3 py-2 text-sm bg-emerald-50 dark:bg-green-900/20 text-emerald-700 dark:text-green-300 font-semibold rounded-lg text-center border border-emerald-200 dark:border-green-700">
                                ✓ Registered
                              </span>
                            ) : (
                              <button
                                onClick={() => handleJoinContest(contest._id)}
                                disabled={!user}
                                className="w-full sm:w-auto px-3 py-2 text-sm bg-gradient-to-r from-sky-500 to-sky-600 dark:from-green-600 dark:to-green-700 text-white font-semibold rounded-lg hover:from-sky-600 hover:to-sky-700 dark:hover:from-green-700 dark:hover:to-green-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
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
                        className="mt-3 flex items-start space-x-2 text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3"
                      >
                        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold">Login Required</p>
                          <p className="text-sm">Please login to participate in contests and compete for prizes.</p>
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
}

export default Contests;