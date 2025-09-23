import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react';
import { Transaction } from '../../types/wallet';

interface TransactionsListProps {
  transactions: Transaction[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  className?: string;
}

export const TransactionsList: React.FC<TransactionsListProps> = ({
  transactions,
  isLoading,
  onRefresh,
  className = '',
}) => {
  const handleRefresh = async () => {
    try {
      await onRefresh();
    } catch (error) {
      console.error('Failed to refresh transactions:', error);
    }
  };
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    // Show exact local date-time with timezone abbreviation where available
    const exact = d.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    const rel = formatDistanceToNow(d, { addSuffix: true });
    return `${exact} (${rel})`;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'contest_prize':
      case 'refund':
      case 'reward':
        return <ArrowDownCircle className="h-5 w-5 text-green-500" />;
      case 'withdrawal':
      case 'contest_entry':
      case 'purchase':
        return <ArrowUpCircle className="h-5 w-5 text-red-500" />;
      default:
        return <div className="h-5 w-5 rounded-full bg-gray-200" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      case 'disputed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading && (!transactions || transactions.length === 0)) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-12 h-12 mx-auto"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
        </div>
        <p className="text-muted-foreground">No transactions found</p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Recent Transactions</h2>
        <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <div className="space-y-3">
        {transactions?.map((transaction: Transaction) => (
          <div
            key={transaction._id}
            className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-full bg-gray-50">
                {getTransactionIcon(transaction.type)}
              </div>
              <div>
                <div className="font-medium">
                  {transaction.description}
                </div>
                <div className="text-sm text-gray-500">
                  {formatDate(transaction.createdAt)}
                </div>
                {transaction.metadata?.referenceId && (
                  <div className="text-xs text-gray-400 mt-1">
                    Ref: {transaction.metadata.referenceId}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className={`font-semibold ${
                ['withdrawal','contest_entry','purchase'].includes(transaction.type)
                  ? 'text-rose-600'
                  : 'text-emerald-600'
              }`}>
                {['withdrawal','contest_entry','purchase'].includes(transaction.type) ? '-' : '+'}
                {transaction.amount.toFixed(2)} {transaction.currency}
              </div>
              <Badge variant="outline" className={`mt-1 ${getStatusVariant(transaction.status)}`}>
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </Badge>
              {transaction.status === 'pending' && (
                <div className="text-[11px] text-yellow-700 mt-1">
                  Awaiting manual payout processing.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {transactions.length > 0 && (
        <div className="flex justify-center pt-2">
          <Button variant="ghost" size="sm">
            View all transactions
          </Button>
        </div>
      )}
    </div>
  );
};
