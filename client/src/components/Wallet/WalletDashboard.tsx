import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { walletService, type Transaction } from '@/services/walletService';
import { Icons } from '../icons';
import RazorpayDeposit from './RazorpayDeposit';
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
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [bankAccountId, setBankAccountId] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<{ deposit: boolean; withdraw: boolean }>({ deposit: false, withdraw: false });
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
    const cur = (user?.preferredCurrency as any) || currency || 'INR';
    const locale = cur === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: cur,
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

  const onWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt < 10) {
      toast.error('Minimum withdrawal amount is ₹10');
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
          <div className="flex flex-col lg:flex-row gap-4 w-full">
            {!user?.isAdmin && (
              <div className="flex-1 bg-white rounded-2xl border border-blue-100 p-4 space-y-3">
                <h3 className="text-lg font-semibold text-blue-900">Add Funds</h3>
                <RazorpayDeposit onSuccess={refreshAll} />
                <p className="text-xs text-blue-600">Minimum deposit: ₹1</p>
              </div>
            )}
            {!user?.isAdmin && (
              <div className="flex-1 bg-white rounded-2xl border border-blue-100 p-4 space-y-3">
                <h3 className="text-lg font-semibold text-blue-900">Withdraw</h3>
                <div className="flex flex-col items-stretch gap-3 w-full">
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
                      💳 <strong>Available Balance:</strong> {formatCurrency(balance)} • Minimum withdrawal: ₹10
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletDashboard;

