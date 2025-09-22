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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('wallet.withdraw_funds')}</DialogTitle>
          <DialogDescription>
            {t('wallet.minimum_withdrawal')}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({currency})</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
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
                className="pl-7 text-base"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {t('wallet.available_balance')} {currency} {maxAmount.toFixed(2)}
            </p>
            {amount && !isValidAmount && (
              <p className="text-sm text-red-500">
                Amount must be between {currency} {minWithdrawal.toFixed(2)} and {currency} {maxWithdrawal.toFixed(2)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank-account">Bank Account</Label>
            <Select value={bankAccount} onValueChange={setBankAccount}>
              <SelectTrigger id="bank-account">
                <SelectValue placeholder="Select a bank account" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.bankName} (••••{account.last4})
                  </SelectItem>
                ))}
                <div className="p-2 pt-1">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start text-sm text-primary"
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
            <div className="bg-muted/50 p-4 rounded-md space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount to withdraw:</span>
                <span className="font-medium">{currency} {numericAmount.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Processing fee:</span>
                <span>Free</span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                <span>Total:</span>
                <span>{currency} {numericAmount.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!isValidForm || isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? 'Processing...' : t('wallet.withdraw')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
