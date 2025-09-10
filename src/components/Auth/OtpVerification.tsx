import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from '../../components/ui/use-toast';
import apiService from '../../services/api';

export function OtpVerification() {
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get email from location state or redirect
    if (location.state?.email) {
      setEmail(location.state.email);
    } else {
      // Optionally redirect to login if no email is found
      navigate('/login');
    }
  }, [location, navigate]);

  useEffect(() => {
    // Countdown timer for resend OTP
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading('Verifying OTP...');
    
    try {
      const response = await apiService.verifyEmail({ email, otp });
      
      if (response.token) {
        // Store the token and redirect
        localStorage.setItem('token', response.token);
        toast.dismiss(loadingToast);
        toast.success('Email verified successfully!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const loadingToast = toast.loading('Resending OTP...');
      await apiService.resendVerificationEmail({ email });
      setCountdown(60);
      setCanResend(false);
      toast.dismiss(loadingToast);
      toast.success('OTP has been resent to your email');
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || 'Failed to resend OTP');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Verify Your Email</h1>
          <p className="text-gray-600 dark:text-gray-400">
            We've sent a 6-digit code to {email}
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="otp" className="text-sm font-medium">
              Enter OTP
            </label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setOtp(value.slice(0, 6));
              }}
              className="text-center text-xl tracking-widest h-14"
              placeholder="000000"
              autoComplete="one-time-code"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </Button>

          <div className="text-center text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              Didn't receive the code?{' '}
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={!canResend || isLoading}
                className={`font-medium ${
                  canResend
                    ? 'text-primary hover:underline'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                {canResend ? 'Resend OTP' : `Resend in ${countdown}s`}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
