import React, { useState } from 'react';
import { X, CreditCard, Smartphone, Building, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import apiService from '../../services/api';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key');

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentIntentId: string) => void;
  amount: number;
}

const PaymentForm: React.FC<{ 
  amount: number; 
  onSuccess: (paymentIntentId: string) => void; 
  onClose: () => void 
}> = ({
  amount,
  onSuccess,
  onClose
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError('');

    try {
      // Create payment intent
      const { clientSecret } = await apiService.createPaymentIntent(amount);

      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
      } else if (paymentIntent.status === 'succeeded') {
        // Notify parent component about successful payment
        onSuccess(paymentIntent.id);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#1e3a8a',
                fontFamily: 'system-ui, sans-serif',
                '::placeholder': {
                  color: '#60a5fa',
                },
              },
            },
          }}
        />
      </div>

      {error && (
        <div className="text-red-700 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full flex items-center justify-center space-x-2 px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base shadow-lg hover:shadow-xl"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Pay ${amount}</span>
          </>
        )}
      </button>
    </form>
  );
};

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking'>('card');

  const paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, description: 'Visa, Mastercard, Amex' },
    { id: 'upi', name: 'UPI', icon: Smartphone, description: 'PhonePe, GPay, Paytm' },
    { id: 'netbanking', name: 'Net Banking', icon: Building, description: 'All major banks' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-blue-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-2xl border border-blue-200 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-blue-100 shrink-0">
              <h3 className="text-lg sm:text-xl font-semibold text-blue-900">
                Add Money to Wallet
              </h3>
              <button
                onClick={onClose}
                className="text-blue-400 hover:text-blue-600 transition-colors p-1 hover:bg-blue-100 rounded-lg"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="overflow-y-auto flex-1">
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    Amount (USD)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400" />
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      min="1"
                      step="0.01"
                      className="pl-10 w-full px-3 py-3 sm:px-4 sm:py-4 border border-blue-200 bg-blue-50 text-blue-900 placeholder-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-base font-medium"
                    />
                  </div>
                  
                  {/* Quick Amount Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                    {[10, 25, 50, 100].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmount(preset.toString())}
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium border border-blue-200 hover:border-blue-300"
                      >
                        ${preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-3">
                    Payment Method
                  </label>
                  <div className="space-y-2 sm:space-y-3">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`w-full flex items-center space-x-3 p-3 sm:p-4 rounded-lg border transition-all duration-200 ${
                          paymentMethod === method.id
                            ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-100'
                            : 'border-blue-200 bg-white hover:bg-blue-50 hover:border-blue-300'
                        }`}
                      >
                        <method.icon className={`h-5 w-5 ${
                          paymentMethod === method.id ? 'text-blue-600' : 'text-blue-400'
                        }`} />
                        <div className="text-left flex-1 min-w-0">
                          <p className={`font-medium text-sm sm:text-base ${
                            paymentMethod === method.id ? 'text-blue-900' : 'text-blue-800'
                          }`}>
                            {method.name}
                          </p>
                          <p className="text-blue-500 text-xs sm:text-sm truncate">
                            {method.description}
                          </p>
                        </div>
                        {paymentMethod === method.id && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full shrink-0"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Form */}
                {amount && parseFloat(amount) >= 1 && (
                  <div className="border-t border-blue-100 pt-4 sm:pt-6">
                    <Elements stripe={stripePromise}>
                      <PaymentForm
                        amount={parseFloat(amount)}
                        onSuccess={onSuccess}
                        onClose={onClose}
                      />
                    </Elements>
                  </div>
                )}

                {/* Security Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start space-x-2">
                    <div className="w-4 h-4 bg-blue-400 rounded-full mt-0.5 shrink-0 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-blue-700 text-xs sm:text-sm font-medium mb-1">
                        Secure Payment
                      </p>
                      <p className="text-blue-600 text-xs">
                        Your payment information is encrypted and secure. We never store your card details.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};