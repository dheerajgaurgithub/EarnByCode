import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWallet } from '@/context/WalletContext';
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, Wallet } from 'lucide-react';
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
    <div className="w-full max-w-2xl mx-auto p-4">
      <Card className="bg-white border border-blue-100 shadow-2xl rounded-3xl overflow-hidden transform transition-all duration-300 hover:shadow-3xl hover:-translate-y-1">
        <CardHeader className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white pb-6 pt-8 px-8">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Wallet className="h-7 w-7 text-white" />
              </div>
              <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Wallet Balance
              </span>
            </CardTitle>
            <Button
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50 backdrop-blur-sm rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              aria-label="Refresh balance"
            >
              <RefreshCw className={`h-4 w-4 mr-2 transition-transform duration-500 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="font-semibold">Refresh</span>
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-8 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-5xl sm:text-6xl font-bold bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 bg-clip-text text-transparent mb-2">
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-blue-500 text-2xl">Loading...</span>
                    </div>
                  ) : (
                    formattedBalance
                  )}
                </div>
                
                {error && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mt-4">
                    <p className="text-sm text-red-600 font-medium flex items-center justify-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Error: {error.message}
                    </p>
                  </div>
                )}
                
                {!isLoading && !error && (
                  <p className="text-blue-600 font-medium text-lg">
                    Available Balance
                  </p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Button
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 font-semibold text-base border-0 min-h-[60px]"
                onClick={() => setShowDepositDialog(true)}
                disabled={isLoading}
              >
                <div className="flex items-center justify-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <ArrowDownCircle className="h-5 w-5" />
                  </div>
                  <span>Deposit Funds</span>
                </div>
              </Button>
              
              <Button
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 font-semibold text-base border-0 min-h-[60px] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg"
                onClick={() => setShowWithdrawDialog(true)}
                disabled={isLoading || balance <= 0}
              >
                <div className="flex items-center justify-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <ArrowUpCircle className="h-5 w-5" />
                  </div>
                  <span>Withdraw Funds</span>
                </div>
              </Button>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-blue-100">
              <div className="text-center p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="text-2xl font-bold text-blue-700">
                  {currency}
                </div>
                <div className="text-xs text-blue-500 font-medium uppercase tracking-wide">
                  Currency
                </div>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <div className="text-2xl font-bold text-indigo-700">
                  {balance > 0 ? 'Active' : 'Empty'}
                </div>
                <div className="text-xs text-indigo-500 font-medium uppercase tracking-wide">
                  Status
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
};