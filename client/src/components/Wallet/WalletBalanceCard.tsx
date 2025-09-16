import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWallet } from '@/context/WalletContext';
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, Wallet as WalletIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Import dialogs directly for now
import { DepositDialog } from './DepositDialog';
import { WithdrawDialog } from './WithdrawDialog';

export const WalletBalanceCard: React.FC = () => {
  const { 
    balance, 
    currency, 
    isLoading, 
    error,
    refreshBalance,
    formatCurrency 
  } = useWallet();
  
  const [showDepositDialog, setShowDepositDialog] = React.useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = React.useState(false);

  const formattedBalance = formatCurrency(balance, currency);

  const handleRefresh = async () => {
    try {
      await refreshBalance();
      // No need to show success toast as the context already handles it
    } catch (error) {
      // Error is already handled in the context
      console.error('Refresh error:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <WalletIcon className="h-6 w-6 text-primary" />
            Wallet Balance
          </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              aria-label="Refresh balance"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="text-4xl font-bold">
              {isLoading ? 'Loading...' : formattedBalance}
            </div>
            {error && (
              <p className="text-sm text-red-500">
                Error: {error.message}
              </p>
            )}
          </div>
          
          <div className="flex flex-wrap gap-4 pt-4">
            <Button
              className="flex-1 min-w-[120px]"
              onClick={() => setShowDepositDialog(true)}
              disabled={isLoading}
            >
              <ArrowDownCircle className="mr-2 h-4 w-4" />
              Deposit
            </Button>
            <Button
              variant="outline"
              className="flex-1 min-w-[120px]"
              onClick={() => setShowWithdrawDialog(true)}
              disabled={isLoading || balance <= 0}
            >
              <ArrowUpCircle className="mr-2 h-4 w-4" />
              Withdraw
            </Button>
          </div>
        </div>
      </CardContent>

      <DepositDialog 
        open={showDepositDialog} 
        onOpenChange={setShowDepositDialog} 
        onSuccess={() => {
          setShowDepositDialog(false);
          refreshBalance();
        }} 
      />
      
      <WithdrawDialog 
        open={showWithdrawDialog} 
        onOpenChange={setShowWithdrawDialog} 
        onSuccess={() => {
          setShowWithdrawDialog(false);
          refreshBalance();
        }} 
        maxAmount={balance}
        currency={currency}
      />
    </Card>
  );
};
