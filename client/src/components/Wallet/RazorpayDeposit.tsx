import React, { useState } from 'react';
import { walletService } from '@/services/walletService';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/context/I18nContext';
import { useToast } from '@/components/ui/use-toast';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

async function loadRazorpayScript(): Promise<boolean> {
  if (window.Razorpay) return true;
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export const RazorpayDeposit: React.FC<{ onSuccess?: () => void } > = ({ onSuccess }) => {
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();
  const toast = useToast();

  const handleDeposit = async () => {
    const amt = Number(amount);
    if (!amt || amt < 1) return;
    try {
      setLoading(true);
      const ok = await loadRazorpayScript();
      if (!ok) throw new Error('Unable to load Razorpay');

      // Create order on server
      const order = await walletService.createRazorpayOrder(amt);

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'AlgoBucks',
        description: 'Wallet Top-up',
        order_id: order.orderId,
        handler: async function (response: any) {
          // Verify on server and credit wallet
          const result = await walletService.verifyRazorpayPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            amount: amt,
          });
          setAmount('');
          try { toast.success('Deposit successful'); } catch {}
          onSuccess?.();
        },
        prefill: {},
        theme: { color: '#2563eb' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e: any) {
      console.error(e);
      try { toast.error(e?.message || 'Deposit failed'); } catch {}
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      <input
        type="number"
        min={1}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder={t('wallet.minimum_deposit')}
        className="flex h-12 w-full rounded-xl border-2 border-blue-100 bg-white px-4 py-3 text-sm font-medium shadow-sm transition-all duration-200 placeholder:text-blue-300 hover:border-blue-200 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400"
      />
      <Button onClick={handleDeposit} disabled={loading || !amount} className="h-12">
        {loading ? 'Processing...' : t('wallet.add_funds')}
      </Button>
    </div>
  );
};

export default RazorpayDeposit;
