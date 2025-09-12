import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PaymentModal } from '../components/Payment/PaymentModal';
import apiService from '../services/api';
import { Wallet as WalletIcon, Plus, Minus, CreditCard, DollarSign, TrendingUp, History } from 'lucide-react';
import { motion } from 'framer-motion';

interface Transaction {
  _id: string;
  type: 'deposit' | 'withdrawal' | 'contest_entry' | 'contest_prize' | 'contest_refund';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  createdAt: string;
}

export const Wallet: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw' | 'history'>('overview');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const showMessage = (message: string, isError = false) => {
    if (isError) {
      setError(message);
      setTimeout(() => setError(null), 5000);
    } else {
      setSuccess(message);
      setTimeout(() => setSuccess(null), 5000);
    }
  };

  if (!user) {
    return <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-gray-600">Please login to access your wallet</p>
    </div>;
  }

  const handleDeposit = async () => {
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount < 1) {
      showMessage('Please enter a valid amount (minimum $1)', true);
      return;
    }
    
    try {
      setIsProcessing(true);
      await apiService.createPaymentIntent(depositAmount);
      setShowPaymentModal(true);
      // The PaymentModal will handle the actual payment confirmation
    } catch (error: any) {
      showMessage(error.message || 'Failed to initiate deposit', true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount < 10) {
      showMessage('Minimum withdrawal amount is $10', true);
      return;
    }

    if (withdrawAmount > (user.walletBalance || 0)) {
      showMessage('Insufficient balance', true);
      return;
    }

    if (!confirm(`Are you sure you want to withdraw $${withdrawAmount.toFixed(2)}?`)) {
      return;
    }

    setIsProcessing(true);
    
    try {
      await apiService.withdraw(withdrawAmount);
      showMessage('Withdrawal request submitted successfully');
      setAmount('');
      await refreshUser();
      await fetchTransactions();
    } catch (error: any) {
      showMessage(error.message || 'Withdrawal failed', true);
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await apiService.getTransactions();
      setTransactions(response.data || []);
    } catch (error: any) {
      console.error('Failed to fetch transactions:', error);
      showMessage('Failed to load transaction history', true);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'history') {
      fetchTransactions();
    }
  }, [activeTab]);

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      setIsProcessing(true);
      await apiService.confirmPayment(paymentIntentId);
      await refreshUser();
      await fetchTransactions();
      showMessage('Payment successful! Your wallet has been updated.');
    } catch (error: any) {
      console.error('Payment confirmation error:', error);
      showMessage(error.message || 'Failed to confirm payment', true);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Wallet</h1>
          <p className="text-gray-600 text-sm sm:text-base">Manage your funds and track transactions</p>
        </div>

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs sm:text-sm">Available Balance</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">${user.walletBalance.toFixed(2)}</p>
            </div>
            <WalletIcon className="h-8 w-8 sm:h-12 sm:w-12 text-blue-200" />
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm">Total Earned</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">$500.00</p>
              </div>
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm">Contest Entries</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-600">{user.contestsParticipated.length}</p>
              </div>
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm">Codecoins</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{user.codecoins}</p>
              </div>
              <WalletIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap sm:flex-nowrap gap-1 mb-6 sm:mb-8 bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
          {[
            { key: 'overview', label: 'Overview', icon: WalletIcon },
            { key: 'deposit', label: 'Deposit', icon: Plus },
            { key: 'withdraw', label: 'Withdraw', icon: Minus },
            { key: 'history', label: 'History', icon: History }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors flex-1 ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.charAt(0)}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Wallet Overview</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-base sm:text-lg font-medium text-gray-900">Quick Actions</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveTab('deposit')}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Funds</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('withdraw')}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                    >
                      <Minus className="h-4 w-4" />
                      <span>Withdraw Funds</span>
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-base sm:text-lg font-medium text-gray-900">Recent Activity</h4>
                  <div className="space-y-2">
                    {transactions.slice(0, 3).map((transaction) => (
                      <div key={transaction._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 text-sm truncate">{transaction.description}</p>
                          <p className="text-gray-500 text-xs">{new Date(transaction.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`font-medium text-sm ml-2 ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {transactions.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-gray-500 text-sm">No recent transactions</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'deposit' && (
            <div className="space-y-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Deposit Funds</h3>
              <div className="text-center py-6 sm:py-8">
                <CreditCard className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-900 text-base sm:text-lg mb-4 font-medium">Add money to your wallet</p>
                <p className="text-gray-600 mb-6 text-sm sm:text-base px-4">
                  Use UPI, Credit/Debit Cards, or Net Banking to add funds securely
                </p>
                <button
                  onClick={handleDeposit}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm sm:text-base"
                >
                  Add Money
                </button>
              </div>
            </div>
          )}

          {activeTab === 'withdraw' && (
            <div className="space-y-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Withdraw Funds</h3>
              <div className="max-w-md mx-auto sm:mx-0">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (USD)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        max={user.walletBalance}
                        className="pl-10 w-full px-3 py-3 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-gray-600 text-sm mt-1">
                      Available: ${user.walletBalance.toFixed(2)}
                    </p>
                  </div>

                  <button
                    onClick={handleWithdraw}
                    disabled={isProcessing || !amount || parseFloat(amount) > user.walletBalance}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    <Minus className="h-4 w-4" />
                    <span>{isProcessing ? 'Processing...' : 'Withdraw Funds'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Transaction History</h3>
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        transaction.type === 'deposit' ? 'bg-green-100 text-green-600' :
                        transaction.type === 'withdrawal' ? 'bg-blue-100 text-blue-600' :
                        transaction.type === 'contest_prize' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {transaction.type === 'deposit' && <Plus className="h-3 w-3 sm:h-4 sm:w-4" />}
                        {transaction.type === 'withdrawal' && <Minus className="h-3 w-3 sm:h-4 sm:w-4" />}
                        {transaction.type === 'contest_prize' && <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />}
                        {transaction.type === 'contest_entry' && <Minus className="h-3 w-3 sm:h-4 sm:w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-medium text-sm sm:text-base truncate">{transaction.description}</p>
                        <p className="text-gray-500 text-xs sm:text-sm">{new Date(transaction.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <span className={`font-medium text-sm sm:text-base ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                      </span>
                      <p className="text-gray-500 text-xs sm:text-sm capitalize">{transaction.status}</p>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <div className="text-center py-8">
                    <History className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No transactions yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {error && (
          <div className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 max-w-xs text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 max-w-xs text-sm">
            {success}
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <PaymentModal 
            isOpen={showPaymentModal} 
            onClose={() => setShowPaymentModal(false)}
            onSuccess={handlePaymentSuccess}
            amount={parseFloat(amount) || 0}
          />
        )}
      </div>
    </div>
  );
};