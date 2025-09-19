import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { walletService, type Transaction } from '@/services/walletService';
import { Icons } from '../icons';
import StripeDepositForm from './StripeDepositForm';
import { useAuth } from '@/context/AuthContext';
import config from '@/lib/config';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Enhanced Input component with blue theme
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
const Input = ({ className = '', ...props }: InputProps) => (
  <input
    className={`flex h-12 w-full rounded-xl border-2 border-blue-100 bg-white px-4 py-3 text-sm font-medium shadow-sm transition-all duration-200 placeholder:text-blue-300 hover:border-blue-200 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 ${className}`}
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
  const [currency, setCurrency] = useState<string>('USD');
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
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [bankAccountId, setBankAccountId] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<{ deposit: boolean; withdraw: boolean }>({ deposit: false, withdraw: false });
  const isStripeConfigured = Boolean(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
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
        formattedAmount: walletService.formatCurrency(Math.abs(tx.amount), currency),
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const formatTransactionType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getTransactionVariant = (type: string) => {
    if (['deposit', 'contest_prize', 'refund'].includes(type)) {
      return 'text-emerald-600 font-semibold';
    }
    return 'text-rose-600 font-semibold';
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
      toast.error('Minimum deposit amount is $1');
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

  const onWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt < 10) {
      toast.error('Minimum withdrawal amount is $10');
      return;
    }
    if (amt > balance) {
      toast.error('Insufficient balance');
      return;
    }
    try {
      setActionLoading((s) => ({ ...s, withdraw: true }));
      await walletService.withdraw(amt, bankAccountId || 'mock');
      toast.success('Withdrawal requested');
      setWithdrawAmount('');
      await refreshAll();
      setActiveTab('overview');
    } catch (e: any) {
      toast.error(e?.message || 'Withdrawal failed');
    } finally {
      setActionLoading((s) => ({ ...s, withdraw: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-white rounded-2xl shadow-xl border border-blue-100">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              My Wallet
            </h2>
            <p className="text-blue-500 mt-2 text-sm sm:text-base">Manage your funds with ease</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {!user?.isAdmin && (
              <Button 
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 font-semibold"
                onClick={() => setActiveTab('deposit')}
              >
                <Icons.wallet className="w-4 h-4 mr-2" />
                Deposit
              </Button>
            )}
            <Button 
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 font-semibold"
              onClick={() => setActiveTab('withdraw')}
            >
              <Icons.arrowUp className="w-4 h-4 mr-2" />
              Withdraw
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-white p-2 rounded-2xl shadow-lg border border-blue-100">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 bg-transparent p-0">
              <TabsTrigger 
                value="overview" 
                className="rounded-xl py-3 px-4 font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-blue-50 transition-all duration-300"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="transactions" 
                className="rounded-xl py-3 px-4 font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-blue-50 transition-all duration-300"
              >
                Transactions
              </TabsTrigger>
              {!user?.isAdmin && (
                <TabsTrigger 
                  value="deposit" 
                  className="rounded-xl py-3 px-4 font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-blue-50 transition-all duration-300"
                >
                  Deposit
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="withdraw" 
                className="rounded-xl py-3 px-4 font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-blue-50 transition-all duration-300"
              >
                Withdraw
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold opacity-90">Current Balance</CardTitle>
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Icons.wallet className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold mb-1">
                    {loading.balance ? '...' : formatCurrency(balance)}
                  </div>
                  <p className="text-xs opacity-80">
                    {loading.balance ? 'Loading...' : 'Available to use'}
                  </p>
                </CardContent>
              </Card>

              {!user?.isAdmin && (
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold opacity-90">Total Deposits</CardTitle>
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Icons.arrowDown className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold mb-1">
                      {loading.stats ? '...' : formatCurrency(stats.totalDeposits)}
                    </div>
                    <p className="text-xs opacity-80">
                      {loading.stats ? 'Loading...' : `${stats.depositCount} transactions`}
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-gradient-to-br from-rose-500 to-rose-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold opacity-90">Total Withdrawals</CardTitle>
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Icons.arrowUp className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold mb-1">
                    {loading.stats ? '...' : `-${formatCurrency(stats.totalWithdrawals)}`}
                  </div>
                  <p className="text-xs opacity-80">
                    {loading.stats ? 'Loading...' : `${stats.withdrawalCount} transactions`}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold opacity-90">{user?.isAdmin ? 'Contest Pool' : 'Recent Activity'}</CardTitle>
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Icons.clock className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  {user?.isAdmin ? (
                    <>
                      <div className="text-2xl sm:text-3xl font-bold mb-1">
                        {contestPool
                          ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(contestPool.totalAmount)
                          : '...'}
                      </div>
                      <p className="text-xs opacity-80">
                        {contestPool ? `${contestPool.totalParticipants} total contestants × entry fee` : 'Loading contest stats...'}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl sm:text-3xl font-bold mb-1">
                        {loading.transactions ? '...' : transactions.length}
                      </div>
                      <p className="text-xs opacity-80">
                        {loading.transactions ? 'Loading...' : 'transactions this month'}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card className="bg-white border border-blue-100 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 p-6">
                <CardTitle className="text-xl font-bold text-blue-800">Recent Transactions</CardTitle>
                <CardDescription className="text-blue-600">Your recent wallet activity</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-50/50 hover:bg-blue-50/70">
                        <TableHead className="font-semibold text-blue-800 py-4">Date</TableHead>
                        <TableHead className="font-semibold text-blue-800">Type</TableHead>
                        <TableHead className="font-semibold text-blue-800">Description</TableHead>
                        <TableHead className="text-right font-semibold text-blue-800">Amount</TableHead>
                        <TableHead className="font-semibold text-blue-800">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading.transactions ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12">
                            <div className="flex items-center justify-center space-x-2 text-blue-500">
                              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                              <span>Loading transactions...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-blue-400">
                            No transactions found
                          </TableCell>
                        </TableRow>
                      ) : (
                        transactions.map((tx) => (
                          <TableRow key={tx._id} className="hover:bg-blue-50/30 transition-colors duration-200">
                            <TableCell className="font-medium text-blue-700 py-4">
                              {format(new Date(tx.createdAt), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell className="font-medium text-blue-600">{formatTransactionType(tx.type)}</TableCell>
                            <TableCell className="text-blue-600">{tx.description}</TableCell>
                            <TableCell className={`text-right font-bold ${getTransactionVariant(tx.type)}`}>
                              {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                tx.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : tx.status === 'failed'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                              }`}>
                                {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {!loading.transactions && transactions.length > 0 && (
                  <div className="p-6 text-center border-t border-blue-100 bg-blue-50/20">
                    <Button 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 font-semibold"
                      onClick={() => setActiveTab('transactions')}
                    >
                      View all transactions
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card className="bg-white border border-blue-100 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl font-bold text-blue-800">Transaction History</CardTitle>
                    <CardDescription className="text-blue-600 mt-1">Complete record of all your transactions</CardDescription>
                  </div>
                  <select
                    className="h-10 rounded-xl border-2 border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm hover:border-blue-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="all">All time</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-50/50 hover:bg-blue-50/70">
                        <TableHead className="font-semibold text-blue-800 py-4">Date</TableHead>
                        <TableHead className="font-semibold text-blue-800">Type</TableHead>
                        <TableHead className="font-semibold text-blue-800">Description</TableHead>
                        <TableHead className="text-right font-semibold text-blue-800">Amount</TableHead>
                        <TableHead className="font-semibold text-blue-800">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading.transactions ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12">
                            <div className="flex items-center justify-center space-x-2 text-blue-500">
                              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                              <span>Loading transactions...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-blue-400">
                            No transactions found
                          </TableCell>
                        </TableRow>
                      ) : (
                        transactions.map((tx) => (
                          <TableRow key={tx._id} className="hover:bg-blue-50/30 transition-colors duration-200">
                            <TableCell className="font-medium text-blue-700 py-4">
                              {format(new Date(tx.createdAt), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell className="font-medium text-blue-600">{formatTransactionType(tx.type)}</TableCell>
                            <TableCell className="text-blue-600">{tx.description}</TableCell>
                            <TableCell className={`text-right font-bold ${getTransactionVariant(tx.type)}`}>
                              {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                tx.status === 'completed' 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : tx.status === 'failed' 
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                              }`}>
                                {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {!user?.isAdmin && (
            <TabsContent value="deposit">
              <Card className="bg-white border border-blue-100 shadow-xl rounded-2xl overflow-hidden max-w-2xl mx-auto">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-blue-100 p-6">
                  <CardTitle className="text-xl font-bold text-emerald-800 flex items-center gap-2">
                    <Icons.arrowDown className="w-5 h-5" />
                    Deposit Funds
                  </CardTitle>
                  <CardDescription className="text-emerald-600">Add money to your wallet balance</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {isStripeConfigured ? (
                    <StripeDepositForm />
                  ) : (
                    <>
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-blue-800 block">
                          Amount ({currency})
                        </label>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          min="1"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-blue-800 block">
                          Payment Method
                        </label>
                        <Input
                          type="text"
                          placeholder="Payment method ID (leave empty for mock)"
                          value={paymentMethodId}
                          onChange={(e) => setPaymentMethodId(e.target.value)}
                        />
                      </div>
                      <Button 
                        className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 font-semibold text-base" 
                        onClick={onDeposit} 
                        disabled={actionLoading.deposit}
                      >
                        {actionLoading.deposit ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          'Deposit Funds'
                        )}
                      </Button>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-xs text-blue-600 leading-relaxed">
                          💡 <strong>Tip:</strong> For production card payments, set VITE_STRIPE_PUBLISHABLE_KEY and Stripe keys on the server to enable card form.
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="withdraw">
            <Card className="bg-white border border-blue-100 shadow-xl rounded-2xl overflow-hidden max-w-2xl mx-auto">
              <CardHeader className="bg-gradient-to-r from-rose-50 to-red-50 border-b border-blue-100 p-6">
                <CardTitle className="text-xl font-bold text-rose-800 flex items-center gap-2">
                  <Icons.arrowUp className="w-5 h-5" />
                  Withdraw Funds
                </CardTitle>
                <CardDescription className="text-rose-600">Transfer money to your bank account</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-blue-800 block">
                    Amount ({currency})
                  </label>
                  <Input
                    type="number"
                    placeholder={`Available: ${formatCurrency(balance)}`}
                    min="1"
                    max={balance}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-blue-800 block">
                    Bank Account
                  </label>
                  <Input
                    type="text"
                    placeholder="Bank account ID (or 'mock')"
                    value={bankAccountId}
                    onChange={(e) => setBankAccountId(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
                  disabled={balance <= 0 || actionLoading.withdraw} 
                  onClick={onWithdraw}
                >
                  {actionLoading.withdraw ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    'Withdraw Funds'
                  )}
                </Button>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-xs text-blue-600 leading-relaxed">
                    💳 <strong>Available Balance:</strong> {formatCurrency(balance)} • Minimum withdrawal: $10
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WalletDashboard;