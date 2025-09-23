import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { walletService, type Transaction } from '@/services/walletService';
import { Icons } from '../icons';
import RazorpayDeposit from './RazorpayDeposit';
import { useAuth } from '@/context/AuthContext';
import config from '@/lib/config';
import { formatInr } from '@/lib/currency';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Enhanced Input component with blue theme and dark mode support
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
const Input = ({ className = '', ...props }: InputProps) => (
  <input
    className={`flex h-10 sm:h-12 w-full rounded-lg sm:rounded-xl border-2 border-blue-100 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium shadow-sm transition-all duration-500 placeholder:text-blue-300 dark:placeholder:text-blue-400 hover:border-blue-200 dark:hover:border-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50 focus:border-blue-400 dark:focus:border-blue-400 text-gray-900 dark:text-blue-300 ${className}`}
    {...props}
  />
);

// Extend the Transaction interface to include any additional fields needed in the UI
interface ExtendedTransaction extends Transaction {
  formattedAmount?: string;
  formattedDate?: string;
}

// Type for the component's local state
interface WalletStats {
  totalDeposits: number;
  depositCount: number;
  totalWithdrawals: number;
  withdrawalCount: number;
  recentTransactions: Transaction[];
}

type TimeRange = '7d' | '30d' | '90d' | 'all';

export const WalletDashboard = () => {
  const toast = useToast();
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('INR');
  const [transactions, setTransactions] = useState<ExtendedTransaction[]>([]);
  const [loading, setLoading] = useState({
    balance: true,
    transactions: true,
    stats: true,
  });
  const [stats, setStats] = useState<WalletStats>({
    totalDeposits: 0,
    depositCount: 0,
    totalWithdrawals: 0,
    withdrawalCount: 0,
    recentTransactions: [],
  });
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [activeTab, setActiveTab] = useState('overview');
  // Action state
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [paymentMethodId, setPaymentMethodId] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<{ deposit: boolean }>({ deposit: false });
  const isStripeConfigured = false;
  // Admin-only: contest pool stats
  const [contestPool, setContestPool] = useState<{ totalAmount: number; totalParticipants: number } | null>(null);

  const fetchWalletData = async () => {
    try {
      setLoading(prev => ({ ...prev, balance: true }));
      const balanceData = await walletService.getBalance();
      setBalance(balanceData.balance);
      setCurrency(balanceData.currency);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      toast.error('Failed to fetch wallet balance');
    } finally {
      setLoading(prev => ({ ...prev, balance: false }));
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(prev => ({ ...prev, transactions: true }));
      const transactionsData = await walletService.getTransactionHistory(1, 10);
      const formattedTransactions = transactionsData.transactions.map(tx => ({
        ...tx,
        formattedAmount: formatInr(Math.abs(tx.amount)),
        formattedDate: format(new Date(tx.createdAt), 'MMM d, yyyy')
      }));
      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(prev => ({ ...prev, transactions: false }));
    }
  };

  const fetchWalletStats = async () => {
    try {
      setLoading(prev => ({ ...prev, stats: true }));
      const statsData = await walletService.getWalletStatistics();
      setStats({
        totalDeposits: statsData.totalDeposits,
        depositCount: statsData.depositCount,
        totalWithdrawals: Math.abs(statsData.totalWithdrawals),
        withdrawalCount: statsData.withdrawalCount,
        recentTransactions: statsData.recentTransactions,
      });
    } catch (error) {
      console.error('Error fetching wallet statistics:', error);
      toast.error('Failed to fetch wallet statistics');
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  };

  useEffect(() => {
    fetchWalletData();
    fetchTransactions();
    fetchWalletStats();
    if (user?.isAdmin) {
      fetchContestPool();
    } else {
      setContestPool(null);
    }
  }, [timeRange]);

  const formatCurrency = (amount: number) => formatInr(amount);

  const formatTransactionType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getTransactionVariant = (type: string) => {
    if (['deposit', 'contest_prize', 'refund'].includes(type)) {
      return 'text-emerald-600 dark:text-emerald-400 font-semibold';
    }
    return 'text-rose-600 dark:text-rose-400 font-semibold';
  };

  // Helpers to refresh and perform actions
  const refreshAll = async () => {
    await Promise.all([fetchWalletData(), fetchTransactions(), fetchWalletStats()]);
    if (user?.isAdmin) await fetchContestPool();
  };

  const fetchContestPool = async () => {
    try {
      const r = await fetch(`${config.api.baseUrl}/contests?status=all`);
      if (!r.ok) throw new Error('Failed to fetch contests');
      const data = await r.json();
      const contests: Array<{ entryFee?: number; participants?: any[]; status?: string }> = data?.contests || [];
      let totalAmount = 0;
      let totalParticipants = 0;
      for (const c of contests) {
        if (c.status && !['upcoming', 'ongoing'].includes(c.status)) continue;
        const fee = Number(c.entryFee || 0);
        const count = Array.isArray(c.participants) ? c.participants.length : 0;
        totalAmount += fee * count;
        totalParticipants += count;
      }
      setContestPool({ totalAmount, totalParticipants });
    } catch (e) {
      console.error('Failed to fetch contest pool:', e);
      setContestPool(null);
    }
  };

  const onDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (!amt || amt < 1) {
      toast.error('Minimum deposit amount is ₹1');
      return;
    }
    try {
      setActionLoading((s) => ({ ...s, deposit: true }));
      await walletService.deposit(amt, paymentMethodId || 'mock');
      toast.success('Deposit successful');
      setDepositAmount('');
      await refreshAll();
      setActiveTab('overview');
    } catch (e: any) {
      toast.error(e?.message || 'Deposit failed');
    } finally {
      setActionLoading((s) => ({ ...s, deposit: false }));
    }
  };

  // Withdrawals are disabled in the new flow.

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-black dark:via-gray-950 dark:to-black p-2 sm:p-4 md:p-6 lg:p-8 transition-all duration-500">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-xl dark:shadow-gray-900/50 border border-blue-100 dark:border-gray-800 transition-all duration-500">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent transition-all duration-500">
              My Wallet
            </h2>
            <p className="text-blue-500 dark:text-blue-400 mt-1 sm:mt-2 text-xs sm:text-sm md:text-base transition-colors duration-500">
              Manage your funds with ease
            </p>
          </div>
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 w-full lg:w-auto">
            {!user?.isAdmin && (
              <div className="flex-1 lg:flex-none lg:min-w-[300px] bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-blue-100 dark:border-gray-700 p-3 sm:p-4 space-y-2 sm:space-y-3 transition-all duration-500">
                <h3 className="text-base sm:text-lg font-semibold text-blue-900 dark:text-blue-300 transition-colors duration-500">
                  Add Funds
                </h3>
                <RazorpayDeposit onSuccess={refreshAll} />
                <p className="text-xs text-blue-600 dark:text-blue-400 transition-colors duration-500">
                  Minimum deposit: ₹1
                </p>
              </div>
            )}
            {/* Withdraw UI removed per new policy */}
          </div>
        </div>

        {/* Balance Overview Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="bg-white dark:bg-gray-900 border border-blue-100 dark:border-gray-800 shadow-lg dark:shadow-gray-900/50 rounded-xl sm:rounded-2xl transition-all duration-500">
            <CardHeader className="pb-2 sm:pb-4 pt-4 sm:pt-6 px-4 sm:px-6">
              <CardTitle className="text-lg sm:text-xl font-semibold text-blue-900 dark:text-blue-300 transition-colors duration-500">
                Current Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              {loading.balance ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin transition-colors duration-500"></div>
                  <span className="text-blue-500 dark:text-blue-400 text-sm sm:text-base transition-colors duration-500">Loading...</span>
                </div>
              ) : (
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent transition-all duration-500">
                  {formatCurrency(balance)}
                </div>
              )}
              <p className="text-xs sm:text-sm text-blue-500 dark:text-blue-400 mt-1 transition-colors duration-500">
                Available for contests
              </p>
            </CardContent>
          </Card>

        {/* Winnings / Earnings */}
        <Card className="bg-white dark:bg-gray-900 border border-emerald-100 dark:border-gray-800 shadow-lg dark:shadow-gray-900/50 rounded-xl sm:rounded-2xl transition-all duration-500">
          <CardHeader className="pb-4 sm:pb-6 pt-4 sm:pt-6 px-4 sm:px-6">
            <CardTitle className="text-xl sm:text-2xl font-semibold text-emerald-800 dark:text-emerald-400 transition-colors duration-500">
              Winnings / Earnings
            </CardTitle>
            <CardDescription className="text-sm text-emerald-700 dark:text-emerald-400 transition-colors duration-500">
              Contest prizes credited to your wallet
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            {loading.transactions ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-emerald-500 dark:border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">Loading winnings...</span>
                </div>
              </div>
            ) : (
              (() => {
                const winnings = transactions.filter(t => t.type === 'contest_prize');
                if (winnings.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <p className="text-emerald-700 dark:text-emerald-400 text-sm sm:text-base">No winnings yet. Join contests to win prizes!</p>
                    </div>
                  );
                }
                return (
                  <div className="space-y-3">
                    {winnings.map(win => (
                      <div key={win._id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-emerald-100 dark:border-gray-700 rounded-lg sm:rounded-xl">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">Contest Prize</div>
                          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{win.formattedDate}</div>
                          <div className="text-[11px] sm:text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                            You have to submit your bank account details in your profile card.
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-emerald-600 dark:text-emerald-400">{formatInr(win.amount)}</div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium mt-1 ${
                            win.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400' :
                            win.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                            'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                          }`}>
                            {win.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-center pt-2">
                      <a href="/settings" className="text-sm text-emerald-700 dark:text-emerald-400 underline">Go to Profile to add bank details</a>
                    </div>
                  </div>
                );
              })()
            )}
          </CardContent>
        </Card>

          <Card className="bg-white dark:bg-gray-900 border border-emerald-100 dark:border-gray-800 shadow-lg dark:shadow-gray-900/50 rounded-xl sm:rounded-2xl transition-all duration-500">
            <CardHeader className="pb-2 sm:pb-4 pt-4 sm:pt-6 px-4 sm:px-6">
              <CardTitle className="text-lg sm:text-xl font-semibold text-emerald-700 dark:text-emerald-400 transition-colors duration-500">
                Total Deposits
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              {loading.stats ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-emerald-500 dark:border-emerald-400 border-t-transparent rounded-full animate-spin transition-colors duration-500"></div>
                  <span className="text-emerald-500 dark:text-emerald-400 text-sm sm:text-base transition-colors duration-500">Loading...</span>
                </div>
              ) : (
                <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 transition-colors duration-500">
                  {formatCurrency(stats.totalDeposits)}
                </div>
              )}
              <p className="text-xs sm:text-sm text-emerald-500 dark:text-emerald-400 mt-1 transition-colors duration-500">
                {stats.depositCount} transactions
              </p>
            </CardContent>
          </Card>

          {/* Total Withdrawals card removed per new policy */}
        </div>

        {/* Recent Transactions */}
        <Card className="bg-white dark:bg-gray-900 border border-blue-100 dark:border-gray-800 shadow-lg dark:shadow-gray-900/50 rounded-xl sm:rounded-2xl transition-all duration-500">
          <CardHeader className="pb-4 sm:pb-6 pt-4 sm:pt-6 px-4 sm:px-6">
            <CardTitle className="text-xl sm:text-2xl font-semibold text-blue-900 dark:text-blue-300 transition-colors duration-500">
              Recent Transactions
            </CardTitle>
            <CardDescription className="text-sm text-blue-600 dark:text-blue-400 transition-colors duration-500">
              Your latest wallet activity
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            {loading.transactions ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin transition-colors duration-500"></div>
                  <span className="text-blue-500 dark:text-blue-400 text-sm sm:text-base transition-colors duration-500">Loading transactions...</span>
                </div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-blue-500 dark:text-blue-400 text-sm sm:text-base transition-colors duration-500">
                  No transactions yet. Start by adding funds to your wallet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-blue-100 dark:border-gray-700 hover:bg-blue-50/50 dark:hover:bg-gray-800/50 transition-all duration-300">
                      <TableHead className="text-blue-700 dark:text-blue-300 font-semibold text-xs sm:text-sm transition-colors duration-500">Type</TableHead>
                      <TableHead className="text-blue-700 dark:text-blue-300 font-semibold text-xs sm:text-sm transition-colors duration-500">Amount</TableHead>
                      <TableHead className="text-blue-700 dark:text-blue-300 font-semibold text-xs sm:text-sm transition-colors duration-500">Date</TableHead>
                      <TableHead className="text-blue-700 dark:text-blue-300 font-semibold text-xs sm:text-sm transition-colors duration-500">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow 
                        key={transaction._id} 
                        className="border-blue-50 dark:border-gray-800 hover:bg-blue-25 dark:hover:bg-gray-800/30 transition-all duration-300"
                      >
                        <TableCell className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-200 transition-colors duration-500">
                          {formatTransactionType(transaction.type)}
                        </TableCell>
                        <TableCell className={`text-xs sm:text-sm transition-colors duration-500 ${getTransactionVariant(transaction.type)}`}>
                          {['deposit', 'contest_prize', 'refund'].includes(transaction.type) ? '+' : '-'}
                          {transaction.formattedAmount}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 transition-colors duration-500">
                          {transaction.formattedDate}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm transition-colors duration-500">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors duration-500 ${
                            transaction.status === 'completed' 
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400' 
                              : transaction.status === 'pending'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                          }`}>
                            {transaction.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Contest Pool Stats */}
        {user?.isAdmin && contestPool && (
          <Card className="bg-white dark:bg-gray-900 border border-purple-100 dark:border-gray-800 shadow-lg dark:shadow-gray-900/50 rounded-xl sm:rounded-2xl transition-all duration-500">
            <CardHeader className="pb-4 sm:pb-6 pt-4 sm:pt-6 px-4 sm:px-6">
              <CardTitle className="text-xl sm:text-2xl font-semibold text-purple-700 dark:text-purple-400 transition-colors duration-500">
                Contest Pool Overview
              </CardTitle>
              <CardDescription className="text-sm text-purple-600 dark:text-purple-400 transition-colors duration-500">
                Active contest participation summary
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400 transition-colors duration-500">
                    {formatCurrency(contestPool.totalAmount)}
                  </div>
                  <p className="text-xs sm:text-sm text-purple-500 dark:text-purple-400 mt-1 transition-colors duration-500">
                    Total Pool Amount
                  </p>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400 transition-colors duration-500">
                    {contestPool.totalParticipants}
                  </div>
                  <p className="text-xs sm:text-sm text-purple-500 dark:text-purple-400 mt-1 transition-colors duration-500">
                    Active Participants
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WalletDashboard;