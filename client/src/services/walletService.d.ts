declare module '@/services/walletService' {
  export interface Transaction {
    _id: string;
    type: string;
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    description: string;
    createdAt: string;
    fee?: number;
    netAmount?: number;
    metadata?: Record<string, unknown>;
  }

  export interface WalletBalance {
    balance: number;
    currency: string;
  }

  export interface WalletStatistics {
    totalDeposits: number;
    depositCount: number;
    totalWithdrawals: number;
    withdrawalCount: number;
    recentTransactions: Transaction[];
  }

  export interface TransactionHistoryResponse {
    transactions: Transaction[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }

  export const walletService: {
    getBalance(): Promise<WalletBalance>;
    getTransactionHistory(page: number, limit: number): Promise<TransactionHistoryResponse>;
    getWalletStatistics(): Promise<WalletStatistics>;
    getTransaction(id: string): Promise<Transaction>;
    deposit(amount: number, paymentMethodId: string): Promise<{
      clientSecret: string;
      transactionId: string;
      requiresAction?: boolean;
      paymentIntentId?: string;
    }>;
    withdraw(amount: number, bankAccountId: string): Promise<{
      transactionId: string;
      newBalance: number;
    }>;
  };
}
