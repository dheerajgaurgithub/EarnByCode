import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { walletService, type Transaction } from '@/services/walletService';
import { Icons } from '../icons';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Fallback Input component if not available from UI library
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
const Input = ({ className = '', ...props }: InputProps) => (
  <input
    className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
    {...props}
  />
);

// Extend the Transaction interface to include any additional fields needed in the UI
interface ExtendedTransaction extends Transaction {
  // Add any UI-specific fields here if needed
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

// Type for the API response
interface WalletStatistics {
  totalDeposits: number;
  depositCount: number;
  totalWithdrawals: number;
  withdrawalCount: number;
  recentTransactions: Transaction[];
}

type TimeRange = '7d' | '30d' | '90d' | 'all';

export const WalletDashboard = () => {
  const toast = useToast();
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
      return 'text-green-600';
    }
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Wallet</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setActiveTab('deposit')}>
            Deposit
          </Button>
          <Button variant="outline" onClick={() => setActiveTab('withdraw')}>
            Withdraw
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="deposit">Deposit</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                <Icons.wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading.balance ? '...' : formatCurrency(balance)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loading.balance ? 'Loading...' : 'Available to use'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
                <Icons.arrowDown className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {loading.stats ? '...' : formatCurrency(stats.totalDeposits)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loading.stats ? 'Loading...' : `${stats.depositCount} transactions`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
                <Icons.arrowUp className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  {loading.stats ? '...' : `-${formatCurrency(stats.totalWithdrawals)}`}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loading.stats ? 'Loading...' : `${stats.withdrawalCount} transactions`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                <Icons.clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading.transactions ? '...' : transactions.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loading.transactions ? 'Loading...' : 'transactions this month'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your recent wallet activity</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading.transactions ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading transactions...
                      </TableCell>
                    </TableRow>
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx) => (
                      <TableRow key={tx._id}>
                        <TableCell>
                          {format(new Date(tx.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>{formatTransactionType(tx.type)}</TableCell>
                        <TableCell>{tx.description}</TableCell>
                        <TableCell 
                          className={`text-right font-medium ${getTransactionVariant(tx.type)}`}
                        >
                          {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tx.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : tx.status === 'failed' 
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {!loading.transactions && transactions.length > 0 && (
                <div className="mt-4 text-center">
                  <Button 
                    variant="ghost" 
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
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <div className="flex items-center space-x-2">
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
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
            <CardContent>
              {/* Transaction history table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading.transactions ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading transactions...
                      </TableCell>
                    </TableRow>
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx) => (
                      <TableRow key={tx._id}>
                        <TableCell>
                          {format(new Date(tx.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>{formatTransactionType(tx.type)}</TableCell>
                        <TableCell>{tx.description}</TableCell>
                        <TableCell 
                          className={`text-right font-medium ${getTransactionVariant(tx.type)}`}
                        >
                          {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tx.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : tx.status === 'failed' 
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deposit">
          <Card>
            <CardHeader>
              <CardTitle>Deposit Funds</CardTitle>
              <CardDescription>Add money to your wallet balance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  Amount ({currency})
                </label>
                <Input type="number" placeholder="Enter amount" min="1" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  Payment Method
                </label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="">Select payment method</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>
              <Button className="w-full">Deposit Funds</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdraw">
          <Card>
            <CardHeader>
              <CardTitle>Withdraw Funds</CardTitle>
              <CardDescription>Transfer money to your bank account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  Amount ({currency})
                </label>
                <Input 
                  type="number" 
                  placeholder={`Available: ${formatCurrency(balance)}`} 
                  min="1" 
                  max={balance}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  Bank Account
                </label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="">Select bank account</option>
                  {/* Bank accounts would be mapped here */}
                </select>
              </div>
              <Button className="w-full" disabled={balance <= 0}>
                Withdraw Funds
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WalletDashboard;
