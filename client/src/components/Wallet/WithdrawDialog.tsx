import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useWallet } from '@/context/WalletContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/context/I18nContext';

export const WithdrawDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  maxAmount: number;
  currency: string;
}> = ({ open, onOpenChange, onSuccess, maxAmount, currency }) => {
  const [amount, setAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { withdraw, refreshBalance } = useWallet();
  const { t } = useI18n();

  // In a real app, you would fetch this from your API
  const bankAccounts = [
    { id: 'ba_1', last4: '4242', bankName: 'Stripe Test Bank' },
    { id: 'ba_2', last4: '5555', bankName: 'Chase' },
  ];

  const numericAmount = parseFloat(amount) || 0;
  const minWithdrawal = 10;
  const maxWithdrawal = maxAmount;
  const isValidAmount = numericAmount >= minWithdrawal && numericAmount <= maxWithdrawal;
  const isValidForm = isValidAmount && bankAccount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidForm) return;

    setIsLoading(true);
    try {
      await withdraw(numericAmount, bankAccount);
      await refreshBalance();
      
      onSuccess();
      onOpenChange(false);
      setAmount('');
      setBankAccount('');
    } catch (error) {
      console.error('Withdrawal error:', error);
      // Error is handled by the wallet context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-900 border border-blue-100 dark:border-gray-800 shadow-2xl dark:shadow-gray-900/50 transition-all duration-500">
        <DialogHeader className="space-y-2 sm:space-y-3 pb-2">
          <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent transition-all duration-500">
            {t('wallet.withdraw_funds')}
          </DialogTitle>
          <DialogDescription className="text-sm text-blue-600 dark:text-blue-400 transition-colors duration-500">
            {t('wallet.minimum_withdrawal')}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-semibold text-gray-900 dark:text-blue-300 transition-colors duration-500">
              Amount ({currency})
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 dark:text-blue-400 text-sm transition-colors duration-500">$</span>
              </div>
              <Input
                id="amount"
                type="number"
                min={minWithdrawal}
                max={maxWithdrawal}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`0.00 (max ${currency} ${maxWithdrawal.toFixed(2)})`}
                className="pl-7 text-sm sm:text-base bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-gray-600 text-gray-900 dark:text-blue-300 placeholder:text-gray-400 dark:placeholder:text-blue-400 focus:border-blue-400 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50 rounded-lg transition-all duration-500"
              />
            </div>
            <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 transition-colors duration-500">
              {t('wallet.available_balance')} {currency} {maxAmount.toFixed(2)}
            </p>
            {amount && !isValidAmount && (
              <p className="text-xs sm:text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-md border border-red-200 dark:border-red-800 transition-all duration-500">
                Amount must be between {currency} {minWithdrawal.toFixed(2)} and {currency} {maxWithdrawal.toFixed(2)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank-account" className="text-sm font-semibold text-gray-900 dark:text-blue-300 transition-colors duration-500">
              Bank Account
            </Label>
            <Select value={bankAccount} onValueChange={setBankAccount}>
              <SelectTrigger 
                id="bank-account"
                className="bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-gray-600 text-gray-900 dark:text-blue-300 focus:border-blue-400 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50 rounded-lg transition-all duration-500"
              >
                <SelectValue placeholder="Select a bank account" className="text-gray-400 dark:text-blue-400" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border border-blue-100 dark:border-gray-600 shadow-xl dark:shadow-gray-900/50 rounded-lg transition-all duration-500">
                {bankAccounts.map((account) => (
                  <SelectItem 
                    key={account.id} 
                    value={account.id}
                    className="text-gray-900 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-gray-700 focus:bg-blue-100 dark:focus:bg-gray-700 transition-colors duration-300"
                  >
                    {account.bankName} (••••{account.last4})
                  </SelectItem>
                ))}
                <div className="p-2 pt-1">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-300"
                    onClick={() => {
                      // In a real app, this would open a bank account linking flow
                      onSuccess();
                    }}
                  >
                    + Add new bank account
                  </Button>
                </div>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2">
            <div className="bg-blue-50 dark:bg-gray-800/50 border border-blue-100 dark:border-gray-700 p-3 sm:p-4 rounded-lg sm:rounded-xl space-y-2 transition-all duration-500">
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 transition-colors duration-500">
                  Amount to withdraw:
                </span>
                <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-blue-300 transition-colors duration-500">
                  {currency} {numericAmount.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm text-blue-500 dark:text-blue-400 transition-colors duration-500">
                <span>Processing fee:</span>
                <span>Free</span>
              </div>
              <div className="border-t border-blue-200 dark:border-gray-600 pt-2 mt-2 flex justify-between items-center font-semibold text-sm sm:text-base transition-colors duration-500">
                <span className="text-gray-900 dark:text-blue-300">Total:</span>
                <span className="text-gray-900 dark:text-blue-300">{currency} {numericAmount.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="w-full sm:w-auto bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-300 text-sm font-medium px-4 py-2"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!isValidForm || isLoading}
              className="w-full sm:w-auto min-w-[120px] bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white shadow-lg hover:shadow-xl dark:shadow-blue-900/30 dark:hover:shadow-blue-800/40 transition-all duration-500 transform hover:-translate-y-0.5 font-semibold text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                t('wallet.withdraw')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};