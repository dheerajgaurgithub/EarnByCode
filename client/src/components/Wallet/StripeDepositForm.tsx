import React, { useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { walletService } from '@/services/walletService';

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

const cardStyle = {
  style: {
    base: {
      color: '#1f2937',
      fontSize: '16px',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#ef4444' },
  },
} as any;

const InnerForm: React.FC = () => {
  const stripe = useStripe();
  const elements = useElements();
  const toast = useToast();
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 1) {
      toast.error('Minimum deposit amount is ₹1');
      return;
    }
    if (!stripe || !elements) return;

    try {
      setLoading(true);
      const card = elements.getElement(CardElement);
      if (!card) throw new Error('Card element not found');

      const pmRes = await stripe.createPaymentMethod({ type: 'card', card });
      if (pmRes.error || !pmRes.paymentMethod) {
        throw new Error(pmRes.error?.message || 'Failed to create payment method');
      }

      // Call backend deposit with created payment method id
      const res = await walletService.deposit(amt, pmRes.paymentMethod.id);

      // If backend indicates 3DS required, confirm on client, then notify server
      // Note: walletService.deposit may return requiresAction info when wired to do so.
      // Our current service returns raw server json; we handle 402 in interceptor.
      // In our server, we respond with 402 and { requiresAction, paymentIntentId, clientSecret }
      // The interceptor will throw; so handle3DS flow should be triggered by a 402 path in UI if needed.

      toast.success('Deposit successful');
      setAmount('');
    } catch (err: any) {
      // Try to handle 3DS via walletService.handle3DSecure if server provided info
      const data = err?.data;
      if (data?.requiresAction && data?.clientSecret) {
        try {
          const result = await stripe.confirmCardPayment(data.clientSecret);
          if (result.error) throw result.error;
          // Let server finalize and credit wallet
          await walletService.handle3DSecure(data.paymentIntentId);
          toast.success('Deposit successful');
          setAmount('');
          return;
        } catch (scaErr: any) {
          toast.error(scaErr?.message || '3D Secure confirmation failed');
          return;
        }
      }
      toast.error(err?.message || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">Amount (INR)</label>
        <input
          type="number"
          min={1}
          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">Card</label>
        <div className="rounded-md border border-gray-300 p-3 bg-white">
          <CardElement options={cardStyle} />
        </div>
      </div>
      <Button className="w-full" onClick={onSubmit} disabled={loading || !stripe}>
        {loading ? 'Processing…' : 'Deposit Funds'}
      </Button>
    </div>
  );
};

const StripeDepositForm: React.FC = () => {
  const stripePromise = useMemo(() => (stripeKey ? loadStripe(stripeKey) : null), []);
  if (!stripeKey || !stripePromise) {
    return (
      <div className="text-sm text-red-600">
        Stripe is not configured. Please set VITE_STRIPE_PUBLISHABLE_KEY in the frontend environment.
      </div>
    );
  }
  return (
    <Elements stripe={stripePromise}>
      <InnerForm />
    </Elements>
  );
};

export default StripeDepositForm;
