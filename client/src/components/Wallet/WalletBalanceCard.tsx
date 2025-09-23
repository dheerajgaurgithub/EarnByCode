import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWallet } from '@/context/WalletContext';
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Import dialogs directly for now
import { DepositDialog } from './DepositDialog';
import { WithdrawDialog } from './WithdrawDialog';
import { useI18n } from '@/context/I18nContext';

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
  const { t } = useI18n();

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
    <div className="w-full max-w-2xl mx-auto p-2 sm:p-4 bg-white dark:bg-black min-h-screen transition-colors duration-500">
      <Card className="bg-white dark:bg-gray-900 border border-blue-100 dark:border-gray-800 shadow-2xl dark:shadow-gray-900/50 rounded-2xl sm:rounded-3xl overflow-hidden transform transition-all duration-500 hover:shadow-3xl dark:hover:shadow-gray-800/60 hover:-translate-y-1">
        <CardHeader className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 dark:from-gray-800 dark:via-gray-900 dark:to-black text-white pb-4 sm:pb-6 pt-6 sm:pt-8 px-4 sm:px-8 transition-all duration-500">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-white/20 dark:bg-blue-500/20 rounded-xl sm:rounded-2xl backdrop-blur-sm transition-all duration-500">
                <Wallet className="h-5 w-5 sm:h-6 md:h-7 sm:w-6 md:w-7 text-white dark:text-blue-400" />
              </div>
              <span className="bg-gradient-to-r from-white to-blue-100 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent transition-all duration-500">
                {t('wallet.title')}
              </span>
            </CardTitle>
            <Button
              className="bg-white/20 hover:bg-white/30 dark:bg-blue-500/20 dark:hover:bg-blue-500/30 text-white dark:text-blue-300 border-white/30 hover:border-white/50 dark:border-blue-400/30 dark:hover:border-blue-400/50 backdrop-blur-sm rounded-lg sm:rounded-xl transition-all duration-500 transform hover:scale-105 shadow-lg text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              aria-label="Refresh balance"
            >
              <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 transition-transform duration-500 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="font-semibold">Refresh</span>
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 sm:p-8 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 dark:from-gray-900 dark:via-gray-950/50 dark:to-black transition-all duration-500">
          <div className="space-y-6 sm:space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-400 dark:via-blue-500 dark:to-blue-600 bg-clip-text text-transparent mb-2 transition-all duration-500">
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 border-3 sm:border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin transition-colors duration-500"></div>
                      <span className="text-blue-500 dark:text-blue-400 text-lg sm:text-2xl transition-colors duration-500">Loading...</span>
                    </div>
                  ) : (
                    formattedBalance
                  )}
                </div>
                
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-3 sm:p-4 mt-4 transition-all duration-500">
                    <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium flex items-center justify-center transition-colors duration-500">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Error: {error.message}
                    </p>
                  </div>
                )}
                
                {!isLoading && !error && (
                  <p className="text-blue-600 dark:text-blue-400 font-medium text-sm sm:text-base lg:text-lg transition-colors duration-500">
                    {t('wallet.available_balance')}
                  </p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
              <Button
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 dark:from-emerald-600 dark:to-emerald-700 dark:hover:from-emerald-700 dark:hover:to-emerald-800 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl dark:shadow-emerald-900/30 dark:hover:shadow-emerald-800/40 transition-all duration-500 transform hover:-translate-y-1 font-semibold text-sm sm:text-base border-0 min-h-[50px] sm:min-h-[60px]"
                onClick={() => setShowDepositDialog(true)}
                disabled={isLoading}
              >
                <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                  <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg">
                    <ArrowDownCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <span className="text-xs sm:text-sm md:text-base">{t('wallet.add_funds')}</span>
                </div>
              </Button>
              
              <Button
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl dark:shadow-blue-900/30 dark:hover:shadow-blue-800/40 transition-all duration-500 transform hover:-translate-y-1 font-semibold text-sm sm:text-base border-0 min-h-[50px] sm:min-h-[60px] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg"
                onClick={() => setShowWithdrawDialog(true)}
                disabled={isLoading || balance <= 0}
              >
                <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                  <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg">
                    <ArrowUpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <span className="text-xs sm:text-sm md:text-base">{t('wallet.withdraw_funds')}</span>
                </div>
              </Button>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4 border-t border-blue-100 dark:border-gray-700 transition-colors duration-500">
              <div className="text-center p-3 sm:p-4 bg-blue-50 dark:bg-gray-800/50 rounded-xl sm:rounded-2xl border border-blue-100 dark:border-gray-700 transition-all duration-500">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-700 dark:text-blue-400 transition-colors duration-500">
                  {currency}
                </div>
                <div className="text-xs text-blue-500 dark:text-blue-300 font-medium uppercase tracking-wide transition-colors duration-500">
                  Currency
                </div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-indigo-50 dark:bg-gray-800/50 rounded-xl sm:rounded-2xl border border-indigo-100 dark:border-gray-700 transition-all duration-500">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-indigo-700 dark:text-blue-400 transition-colors duration-500">
                  {balance > 0 ? 'Active' : 'Empty'}
                </div>
                <div className="text-xs text-indigo-500 dark:text-blue-300 font-medium uppercase tracking-wide transition-colors duration-500">
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