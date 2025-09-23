import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  walletService, 
  Transaction, 
  TransactionType, 
  TransactionStatus,
  WalletBalance,
  WalletError
} from '@/services/walletService';
import { useAuth } from './AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface WalletContextType {
  // Current wallet state
  balance: number;
  currency: string;
  isLoading: boolean;
  transactions: Transaction[];
  error: WalletError | null;
  
  // Wallet actions
  refreshBalance: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  deposit: (amount: number, paymentMethodId: string) => Promise<{
    clientSecret: string;
    transactionId: string;
    requiresAction?: boolean;
    paymentIntentId?: string;
  }>;
  withdraw: (amount: number, bankAccountId: string) => Promise<{
    transactionId: string;
    newBalance: number;
  }>;
  
  // Helper functions
  formatCurrency: (amount: number, currency?: string) => string;
  formatTransactionType: (type: TransactionType) => string;
  getStatusColor: (status: TransactionStatus) => string;
  isCredit: (transaction: Pick<Transaction, 'amount' | 'type'>) => boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Wallet state
  const [balance, setBalance] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('INR');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<WalletError | null>(null);
  
  // Hooks
  const { user } = useAuth();
  const toast = useToast();

  const fetchBalance = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { balance: newBalance, currency: newCurrency } = await walletService.getBalance();
      setBalance(newBalance);
      setCurrency(newCurrency);
    } catch (err) {
      const error = err as WalletError;
      console.error('Failed to fetch wallet balance:', error);
      setError(error);
      
      toast.error({
        title: 'Error',
        description: error.message || 'Failed to load wallet balance',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { transactions: newTransactions } = await walletService.getTransactionHistory(1, 10);
      setTransactions(newTransactions);
    } catch (err) {
      const error = err as WalletError;
      console.error('Failed to fetch transactions:', error);
      setError(error);
      
      toast.error({
        title: 'Error',
        description: error.message || 'Failed to load transaction history',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      Promise.all([fetchBalance(), fetchTransactions()]);
    } else {
      setIsLoading(false);
    }
  }, [user, fetchBalance, fetchTransactions]);

  const deposit = useCallback(async (amount: number, paymentMethodId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await walletService.deposit(amount, paymentMethodId);
      
      // Only refresh if it's not a 3D Secure flow
      if (!result.requiresAction) {
        await Promise.all([fetchBalance(), fetchTransactions()]);
      }
      
      return result;
    } catch (err) {
      const error = err as WalletError;
      console.error('Deposit failed:', error);
      setError(error);
      
      toast.error({
        title: 'Deposit Failed',
        description: error.message || 'Failed to process deposit',
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchBalance, fetchTransactions, toast]);

  const withdraw = useCallback(async (amount: number, bankAccountId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await walletService.withdraw(amount, bankAccountId);
      
      // Update local state with the new balance from the response
      setBalance(result.newBalance);
      
      // Refresh transactions to show the new withdrawal
      await fetchTransactions();
      
      toast.success({
        title: 'Withdrawal Successful',
        description: 'Your withdrawal request has been submitted',
      });
      
      return result;
    } catch (err) {
      const error = err as WalletError;
      console.error('Withdrawal failed:', error);
      setError(error);
      
      toast.error({
        title: 'Withdrawal Failed',
        description: error.message || 'Failed to process withdrawal',
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchTransactions, toast]);

  // Expose wallet service helpers
  const formatCurrency = walletService.formatCurrency;
  const formatTransactionType = walletService.formatTransactionType;
  const getStatusColor = walletService.getStatusColor;
  const isCredit = walletService.isCredit;

  return (
    <WalletContext.Provider
      value={{
        // State
        balance,
        currency,
        isLoading,
        transactions,
        error,
        
        // Actions
        refreshBalance: fetchBalance,
        refreshTransactions: fetchTransactions,
        deposit,
        withdraw,
        
        // Helpers
        formatCurrency,
        formatTransactionType,
        getStatusColor,
        isCredit,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
