import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '../icons';
import { format } from 'date-fns';
import { walletService, type Transaction, type TransactionStatus } from '@/services/walletService';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusVariant = 'default' | 'destructive' | 'secondary' | 'outline';

const getStatusVariant = (status: TransactionStatus): StatusVariant => {
  switch (status) {
    case 'completed':
    case 'refunded':
    case 'disputed':
      return 'default';
    case 'pending':
    case 'processing':
      return 'secondary';
    case 'failed':
    case 'cancelled':
      return 'destructive';
    default:
      return 'default';
  }
};

const getStatusIcon = (transaction: Transaction) => {
  const status = transaction.status;
  const baseClass = 'h-5 w-5';
  
  switch (status) {
    case 'completed':
      return <Icons.checkCircle className={cn(baseClass, 'text-green-500')} />;
    case 'pending':
    case 'processing':
      return <Icons.clock className={cn(baseClass, 'text-yellow-500')} />;
    case 'failed':
      return <Icons.xCircle className={cn(baseClass, 'text-red-500')} />;
    case 'cancelled':
      return <Icons.x className={cn(baseClass, 'text-gray-500')} />;
    case 'refunded':
      return <Icons.repeat className={cn(baseClass, 'text-blue-500')} />;
    case 'disputed':
      return <Icons.alertTriangle className={cn(baseClass, 'text-purple-500')} />;
    default:
      return <Icons.info className={cn(baseClass, 'text-blue-500')} />;
  }
};

export const TransactionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (!id) {
      setError('Transaction ID is required');
      setLoading(false);
      return;
    }

    const fetchTransaction = async () => {
      try {
        setLoading(true);
        const data = await walletService.getTransaction(id);
        setTransaction(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching transaction:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transaction details';
        setError(errorMessage);
        toast.error({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [id, toast]);

  const formatCurrency = (amount: number, currencyCode: string = 'INR') => {
    try {
      const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      console.error('Error formatting currency:', error);
      const locale = 'en-IN';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'INR',
      }).format(amount);
    }
  };

  const formatTransactionType = (type: string) => {
    try {
      return type
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    } catch (error) {
      console.error('Error formatting transaction type:', error);
      return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>The requested transaction could not be found.</p>
          <Button className="mt-4" onClick={() => window.history.back()}>
            Back to Transactions
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Transaction Details</h2>
        <Button variant="outline" onClick={() => window.history.back()}>
          <Icons.arrowLeft className="mr-2 h-4 w-4" />
          Back to Transactions
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {formatTransactionType(transaction.type)}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {format(new Date(transaction.createdAt), 'MMMM d, yyyy h:mm a')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(transaction)}
              <Badge variant={getStatusVariant(transaction.status)}>
                {transaction.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Amount</h3>
              <p className={`text-2xl font-bold ${
                ['withdrawal','contest_entry','purchase'].includes(transaction.type)
                  ? 'text-red-600' : 'text-green-600'
              }`}>
                {['withdrawal','contest_entry','purchase'].includes(transaction.type) ? '-' : '+'}
                {formatCurrency(transaction.amount, transaction.currency || 'INR')}
              </p>
              {transaction.fee > 0 && (
                <p className="text-sm text-muted-foreground">
                  Fee: {formatCurrency(transaction.fee, transaction.currency || 'INR')}
                </p>
              )}
              {transaction.netAmount !== undefined && transaction.netAmount !== transaction.amount && (
                <p className="text-sm text-muted-foreground">
                  Net: {formatCurrency(transaction.netAmount, transaction.currency || 'INR')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Transaction ID</h3>
              <p className="font-mono text-sm">{transaction._id}</p>
              {transaction.referenceId && (
                <>
                  <h3 className="mt-4 text-sm font-medium text-muted-foreground">
                    Reference ID
                  </h3>
                  <p className="font-mono text-sm">{transaction.referenceId}</p>
                </>
              )}
            </div>
          </div>

          {transaction.description && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                Description
              </h3>
              <p className="text-sm">{transaction.description}</p>
            </div>
          )}

          {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                Additional Information
              </h3>
              <div className="rounded-md border">
                <table className="w-full">
                  <tbody className="divide-y">
                    {Object.entries(transaction.metadata).map(([key, value]) => (
                      <tr key={key} className="text-sm">
                        <td className="w-1/3 px-4 py-2 font-medium text-muted-foreground">
                          {key.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </td>
                        <td className="px-4 py-2">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            {transaction.status === 'pending' && (
              <>
                <Button variant="outline" disabled={loading}>
                  <Icons.x className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button disabled={loading}>
                  <Icons.refreshCw className="mr-2 h-4 w-4" />
                  Refresh Status
                </Button>
              </>
            )}
            {transaction.status === 'failed' && (
              <Button>
                <Icons.repeat className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionDetails;
