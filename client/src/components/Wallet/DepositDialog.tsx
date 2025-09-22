import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import RazorpayDeposit from './RazorpayDeposit';
import { useI18n } from '@/context/I18nContext';

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const DepositDialog: React.FC<DepositDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const handleSuccess = () => onSuccess();
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('wallet.add_funds')}</DialogTitle>
          <DialogDescription>
            {t('wallet.add_funds_desc')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <RazorpayDeposit onSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
