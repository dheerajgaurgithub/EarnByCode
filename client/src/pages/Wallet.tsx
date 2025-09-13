import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { PaymentModal } from '../components/Payment/PaymentModal';
import apiService from '../services/api';
import { Wallet as WalletIcon, Plus, Minus, CreditCard, DollarSign, TrendingUp, History, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

import { WalletTransaction } from '../types';

export const Wallet: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw' | 'history'>('overview');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalEarned, setTotalEarned] = useState(0);

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
      <p className="text-gray-600 text-sm">Please login to access your wallet</p>
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

  const calculateTotalEarned = useCallback((transactions: WalletTransaction[]) => {
    return transactions
      .filter(tx => tx.amount > 0 && tx.status === 'completed')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getTransactions();
      // Ensure we have an array of transactions with required fields
      const transactions = (Array.isArray(response) ? response : []).map(tx => ({
        id: tx._id || tx.id || Math.random().toString(36).substr(2, 9),
        userId: tx.userId || 'unknown',
        type: tx.type || 'deposit',
        amount: Number(tx.amount) || 0,
        description: tx.description || 'Transaction',
        timestamp: tx.timestamp || new Date().toISOString(),
        status: tx.status || 'completed'
      }));
      
      setTransactions(transactions);
      setTotalEarned(calculateTotalEarned(transactions));
    } catch (error: any) {
      console.error('Failed to fetch transactions:', error);
      showMessage('Failed to load transaction history', true);
    } finally {
      setIsLoading(false);
    }
  }, [calculateTotalEarned]);

  React.useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      setIsProcessing(true);
      await apiService.confirmPayment(paymentIntentId);
      await refreshUser();
      await fetchTransactions();
      showMessage('Payment successful! Your wallet has been updated.');
      setShowPaymentModal(false);
      setAmount('');
    } catch (error: any) {
      console.error('Payment confirmation error:', error);
      showMessage(error.message || 'Failed to confirm payment', true);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-3 sm:py-4">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Wallet</h1>
          <p className="text-gray-600 text-xs sm:text-sm">Manage your funds and track transactions</p>
        </div>

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-4 mb-4 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs">Available Balance</p>
              <p className="text-xl sm:text-2xl font-bold text-white">${user.walletBalance.toFixed(2)}</p>
            </div>
            <WalletIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-200" />
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs">Total Earned</p>
                <p className="text-lg font-bold text-green-600">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  ) : (
                    `$${totalEarned.toFixed(2)}`
                  )}
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs">Contest Entries</p>
                <p className="text-lg font-bold text-yellow-600">
                  {user.contestsParticipated?.length || 0}
                </p>
              </div>
              <DollarSign className="h-5 w-5 text-yellow-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs">Codecoins</p>
                <p className="text-lg font-bold text-blue-600">{user.codecoins}</p>
              </div>
              <WalletIcon className="h-5 w-5 text-blue-600" />
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap sm:flex-nowrap gap-1 mb-4 bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
          {[
            { key: 'overview', label: 'Overview', icon: WalletIcon },
            { key: 'deposit', label: 'Deposit', icon: Plus },
            { key: 'withdraw', label: 'Withdraw', icon: Minus },
            { key: 'history', label: 'History', icon: History }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center justify-center space-x-1 px-2 sm:px-3 py-2 text-xs font-medium rounded-lg transition-colors flex-1 ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="h-3 w-3" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.charAt(0)}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Wallet Overview</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-900">Quick Actions</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveTab('deposit')}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add Funds</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('withdraw')}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Minus className="h-3 w-3" />
                      <span>Withdraw Funds</span>
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-900">Recent Activity</h4>
                  <div className="space-y-2">
                    {transactions.slice(0, 3).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 text-xs truncate">{transaction.description}</p>
                          <p className="text-gray-500 text-xs">{new Date(transaction.timestamp).toLocaleDateString()}</p>
                        </div>
                        <span className={`font-medium text-xs ml-2 ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {transactions.length === 0 && (
                      <div className="text-center py-3">
                        <p className="text-gray-500 text-xs">No recent transactions</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'deposit' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Deposit Funds</h3>
              <div className="text-center py-4">
                <CreditCard className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-900 text-sm mb-3 font-medium">Add money to your wallet</p>
                <p className="text-gray-600 mb-4 text-xs px-4">
                  Use UPI, Credit/Debit Cards, or Net Banking to add funds securely
                </p>
                <button
                  onClick={handleDeposit}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                >
                  Add Money
                </button>
              </div>
            </div>
          )}

          {activeTab === 'withdraw' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Withdraw Funds</h3>
              <div className="max-w-md mx-auto sm:mx-0">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Amount (USD)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        max={user.walletBalance}
                        className="pl-8 w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <p className="text-gray-600 text-xs mt-1">
                      Available: ${user.walletBalance.toFixed(2)}
                    </p>
                  </div>

                  <button
                    onClick={handleWithdraw}
                    disabled={isProcessing || !amount || parseFloat(amount) > user.walletBalance}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <Minus className="h-3 w-3" />
                    <span>{isProcessing ? 'Processing...' : 'Withdraw Funds'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        transaction.type === 'deposit' ? 'bg-green-100 text-green-600' :
                        transaction.type === 'withdrawal' ? 'bg-blue-100 text-blue-600' :
                        transaction.type === 'contest_prize' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {transaction.type === 'deposit' && <Plus className="h-3 w-3" />}
                        {transaction.type === 'withdrawal' && <Minus className="h-3 w-3" />}
                        {transaction.type === 'contest_prize' && <DollarSign className="h-3 w-3" />}
                        {transaction.type === 'contest_entry' && <Minus className="h-3 w-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-medium text-xs truncate">{transaction.description}</p>
                        <p className="text-gray-500 text-xs">{new Date(transaction.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <span className={`font-medium text-xs ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                      </span>
                      <p className="text-gray-500 text-xs capitalize">{transaction.status}</p>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <div className="text-center py-6">
                    <History className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No transactions yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {error && (
          <div className="fixed top-4 right-4 bg-red-600 text-white px-3 py-2 rounded-lg shadow-lg z-50 max-w-xs text-xs">
            {error}
          </div>
        )}
        {success && (
          <div className="fixed top-4 right-4 bg-green-600 text-white px-3 py-2 rounded-lg shadow-lg z-50 max-w-xs text-xs">
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