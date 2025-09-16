export interface Transaction {
  _id: string;
  type: 'deposit' | 'withdrawal' | 'contest_prize' | 'contest_entry' | 'purchase' | 'refund' | 'reward';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface WalletBalance {
  available: number;
  pending: number;
  currency: string;
}
