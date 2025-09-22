import api from '@/lib/api';
import { AxiosError } from 'axios';

export type TransactionType = 
  | 'deposit' 
  | 'withdrawal' 
  | 'transfer' 
  | 'contest_entry' 
  | 'contest_prize' 
  | 'refund' 
  | 'purchase' 
  | 'reward' 
  | 'adjustment';

export type TransactionStatus = 
  | 'pending' 
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'refunded' 
  | 'disputed'
  | 'processing';

export type WalletStatus = 'active' | 'suspended' | 'restricted';

export interface Transaction {
  _id: string;
  user: string;
  type: TransactionType;
  amount: number;
  netAmount: number;
  fee: number;
  currency: string;
  description: string;
  status: TransactionStatus;
  referenceId?: string;
  metadata?: Record<string, unknown>;
  relatedTransaction?: string;
  balanceAfter: number;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  formattedAmount?: string;
}

export interface WalletBalance {
  balance: number;
  currency: string;
  status: WalletStatus;
  lastUpdated: string;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export interface WalletStatistics {
  totalDeposits: number;
  depositCount: number;
  totalWithdrawals: number;
  withdrawalCount: number;
  recentTransactions: Transaction[];
}

export interface AdminWalletListResponse {
  wallets: Array<{
    _id: string;
    username: string;
    email: string;
    walletBalance: number;
    walletCurrency: string;
    walletStatus: WalletStatus;
    lastWalletActivity?: string;
  }>;
  totalBalance: number;
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export interface DepositResponse {
  clientSecret: string;
  transactionId: string;
  requiresAction?: boolean;
  paymentIntentId?: string;
}

export interface WithdrawResponse {
  transactionId: string;
  newBalance: number;
}

export interface WalletError {
  message: string;
  code?: string;
  details?: unknown;
}

const handleApiError = (error: unknown): never => {
  if (error instanceof AxiosError) {
    const errorData = error.response?.data as 
      | { message: string; code?: string; details?: unknown }
      | undefined;
    
    throw {
      message: errorData?.message || error.message || 'An unknown error occurred',
      code: errorData?.code || error.code,
      details: errorData?.details
    } as WalletError;
  }
  
  throw {
    message: error instanceof Error ? error.message : 'An unknown error occurred',
    details: error
  } as WalletError;
};

export const walletService = {
  /**
   * Get current wallet balance and status
   */
  async getBalance(): Promise<WalletBalance> {
    try {
      const response = await api.get('/wallet/balance');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Create Razorpay order for a wallet deposit
   */
  async createRazorpayOrder(amount: number): Promise<{ orderId: string; amount: number; currency: string; keyId: string; }> {
    try {
      const response = await api.post('/payments/razorpay/order', { amount });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Verify Razorpay payment after Checkout success
   */
  async verifyRazorpayPayment(payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; amount: number; }): Promise<{ success: boolean; balance: number; transactionId: string; }> {
    try {
      const response = await api.post('/payments/razorpay/verify', payload);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Get wallet statistics and recent activity
   */
  async getWalletStatistics(): Promise<WalletStatistics> {
    try {
      const response = await api.get('/wallet/statistics');
      return response.data.stats;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Get transaction history with pagination
   */
  async getTransactionHistory(
    page = 1, 
    limit = 10,
    type?: string,
    status?: string
  ): Promise<TransactionListResponse> {
    try {
      const response = await api.get('/wallet/transactions', {
        params: { page, limit, type, status }
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Admin: Get all wallets with pagination
   */
  async adminGetAllWallets(
    page = 1,
    limit = 20,
    status?: string
  ): Promise<AdminWalletListResponse> {
    try {
      const response = await api.get('/wallet/admin/wallets', {
        params: { page, limit, status }
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Admin: Get wallet transactions for a specific user
   */
  async adminGetUserTransactions(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<TransactionListResponse> {
    try {
      const response = await api.get(`/wallet/admin/wallets/${userId}/transactions`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Deposit funds into wallet
   */
  async deposit(
    amount: number,
    paymentMethodId?: string,
    method?: 'card' | 'upi' | 'bank',
    details?: Record<string, unknown>
  ): Promise<any> {
    try {
      const response = await api.post('/payments/deposit', {
        amount,
        paymentMethodId,
        method,
        details,
      });
      return response.data as any;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Withdraw funds from wallet
   */
  async withdraw(
    amount: number, 
    bankAccountId: string
  ): Promise<WithdrawResponse> {
    try {
      const response = await api.post<WithdrawResponse>('/payments/withdraw', { 
        amount, 
        bankAccountId 
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Get transaction details by ID
   */
  async getTransaction(transactionId: string): Promise<Transaction> {
    try {
      const response = await api.get<{ transaction: Transaction }>(
        `/payments/transactions/${transactionId}`
      );
      return response.data.transaction;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Handle 3D Secure authentication for payments
   */
  async handle3DSecure(
    paymentIntentId: string
  ): Promise<{ status: string }> {
    try {
      const response = await api.post<{ status: string }>(
        '/payments/confirm-3d-secure', 
        { paymentIntentId }
      );
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Format currency amount with proper localization
   */
  formatCurrency(amount: number, currency = 'INR'): string {
    try {
      const locale = currency === 'INR' ? 'en-IN' : 'en-US';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      console.error('Error formatting currency:', error);
      return `${currency} ${amount.toFixed(2)}`;
    }
  },

  /**
   * Get human-readable transaction type
   */
  formatTransactionType(type: TransactionType): string {
    const types: Record<TransactionType, string> = {
      deposit: 'Deposit',
      withdrawal: 'Withdrawal',
      transfer: 'Transfer',
      contest_entry: 'Contest Entry',
      contest_prize: 'Contest Prize',
      refund: 'Refund',
      purchase: 'Purchase',
      reward: 'Reward',
      adjustment: 'Adjustment',
    };
    return types[type] || type;
  },
  isCredit(transaction: Pick<Transaction, 'amount' | 'type'>): boolean {
    const creditTypes: TransactionType[] = [
      'deposit',
      'contest_prize',
      'refund',
      'reward',
      'adjustment'
    ];
    return creditTypes.includes(transaction.type) || transaction.amount >= 0;
  },
  
  /**
   * Get Tailwind CSS classes for transaction status
   */
  getStatusColor(status: TransactionStatus): string {
    const statusColors: Record<TransactionStatus, string> = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      refunded: 'bg-blue-100 text-blue-800',
      disputed: 'bg-purple-100 text-purple-800',
      processing: 'bg-blue-100 text-blue-800',
    };
    
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  }
};
