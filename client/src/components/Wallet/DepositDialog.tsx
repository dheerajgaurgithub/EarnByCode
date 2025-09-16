import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useWallet } from '@/context/WalletContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Skeleton } from '@/components/ui/skeleton';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

interface CheckoutFormProps {
  amount: number;
  onSuccess: () => void;
  onError: (message: string) => void;
  on3DSecureRequired: (paymentIntentId: string) => void;
}

interface DepositResult {
  clientSecret: string;
  transactionId: string;
  requiresAction?: boolean;
  paymentIntentId?: string;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  amount: initialAmount,
  onSuccess,
  onError,
  on3DSecureRequired
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);
  const { deposit } = useWallet();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements || !paymentMethodId) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await deposit(initialAmount, paymentMethodId) as DepositResult;
      
      // Handle 3D Secure flow if required
      if (result.requiresAction && result.paymentIntentId) {
        on3DSecureRequired(result.paymentIntentId);
        return;
      }
      
      // If no 3D Secure required, confirm the payment
      const { error: confirmError } = await stripe.confirmCardPayment(result.clientSecret, {
        payment_method: paymentMethodId,
      });

      if (confirmError) {
        throw new Error(confirmError.message || 'Payment failed');
      }

      onSuccess();
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      onError(errorMessage);
      
      // Error is handled by the parent component
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="card-element">Card Details</Label>
        <div className="border rounded-md p-3">
          <CardElement
            id="card-element"
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
            onChange={(event) => {
              setPaymentMethodId(event.complete ? 'pm_card_visa' : null); // In a real app, you would get this from the CardElement
            }}
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-2">
        <Button 
          type="submit" 
          disabled={!stripe || !paymentMethodId || isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? 'Processing...' : `Deposit $${initialAmount.toFixed(2)}`}
        </Button>
      </div>
    </form>
  );
};

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
  const [amount, setAmount] = useState('');
  const [isClient, setIsClient] = useState(false);
  const numericAmount = parseFloat(amount) || 0;
  const minDeposit = 1;
  const maxDeposit = 10000;

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSuccess = () => {
    console.log('Deposit successful');
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Funds to Wallet</DialogTitle>
          <DialogDescription>
            Deposit money to your wallet using your credit/debit card.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({'USD'})</Label>
            <Input
              id="amount"
              type="number"
              min={minDeposit}
              max={maxDeposit}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Enter amount (min $${minDeposit})`}
              className="text-base"
            />
            <div className="text-sm text-muted-foreground">
              <p>Minimum deposit: ${minDeposit}</p>
              <p>Maximum deposit: ${maxDeposit}</p>
            </div>
          </div>

          {numericAmount >= minDeposit && numericAmount <= maxDeposit && (
            <div className="border-t pt-4">
              {isClient ? (
                <Elements stripe={stripePromise}>
                  <CheckoutForm 
                    amount={numericAmount} 
                    onSuccess={handleSuccess} 
                    onError={(message) => {
                      console.error('Deposit error:', message);
                    }}
                    on3DSecureRequired={(paymentIntentId) => {
                      console.log('3D Secure required for payment intent:', paymentIntentId);
                    }}
                  />
                </Elements>
              ) : (
                <Skeleton className="h-24 w-full" />
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
