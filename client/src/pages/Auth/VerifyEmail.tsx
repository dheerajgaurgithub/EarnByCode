import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { toast } from '../../components/ui/use-toast';
import apiService from '../../services/api';
import { Mail, Loader2, CheckCircle } from 'lucide-react';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const query = useQuery();
  const initialEmail = query.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  
  useEffect(() => {
    if (!email && initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleVerify = async () => {
    if (!email || !otp) {
      setError('Please enter your email and the verification code');
      toast.error('Please enter your email and the verification code');
      return;
    }
    try {
      setVerifying(true);
      setError(null);
      const res = await apiService.post<{ token: string; user: any }>(
        '/auth/verify-email',
        { email, otp }
      );
      if (res?.token) {
        localStorage.setItem('token', res.token);
      }
      toast.success('Email verified successfully');
      setOtpVerified(true);
      setTimeout(() => setOtpVerified(false), 3000);
      navigate('/dashboard');
    } catch (e: any) {
      const msg = e?.message || 'Failed to verify email';
      setError(msg);
      toast.error(msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Please enter your email');
      toast.error('Please enter your email');
      return;
    }
    if (resendCooldown > 0) return;
    try {
      setError(null);
      await apiService.post('/auth/resend-verification', { email });
      toast.success('Verification code sent');
      setResendCooldown(60);
    } catch (e: any) {
      const msg = e?.message || 'Failed to resend verification email';
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-3">
      <div className="w-full max-w-sm mx-auto">
        <div className="bg-white/90 border border-blue-200/50 rounded-xl shadow-lg shadow-blue-500/10 backdrop-blur-lg p-4">
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-3 bg-gradient-to-br from-blue-100 to-blue-200/50 rounded-lg border border-blue-300/30 backdrop-blur-sm shadow-md">
              <img src="/logo.png" alt="AlgoBucks Logo" className="w-6 h-6 object-contain" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-1 tracking-tight">Verify your email</h1>
            <p className="text-gray-600 text-xs font-medium">We sent a 6-digit code to your email. Enter it below.</p>
          </div>

          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg backdrop-blur-sm">
              <p className="text-red-700 text-xs font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="h-3 w-3 text-blue-400 absolute left-2 top-1/2 -translate-y-1/2" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-7 pr-2 py-2 bg-blue-50/50 border border-blue-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 hover:border-blue-300 transition-all duration-300 font-medium text-xs backdrop-blur-sm"
                  ref={emailInputRef}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] text-gray-600">
                  Make sure this matches the inbox where you received the code.
                </span>
                <button
                  type="button"
                  className="text-[11px] text-blue-700 hover:text-blue-900 underline"
                  onClick={() => {
                    setEmail('');
                    setTimeout(() => emailInputRef.current?.focus(), 0);
                  }}
                >
                  Wrong email? Change
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Verification Code</label>
              <Input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter 6-digit code"
                className="w-full pr-2 py-2 bg-blue-50/50 border border-blue-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 hover:border-blue-300 transition-all duration-300 font-medium text-xs backdrop-blur-sm"
              />
              {otpVerified && (
                <p className="text-green-600 text-xs mt-1 inline-flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Verified
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                className="inline-flex items-center gap-2"
                disabled={verifying || !otp}
                onClick={handleVerify}
              >
                {verifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  'Verify Email'
                )}
              </Button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="text-xs text-blue-700 hover:text-blue-900 disabled:opacity-50"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>

            <p className="text-[11px] text-gray-600">Didn’t receive the email? Check your spam folder or try resending.</p>

            <div className="mt-3 text-center">
              <Link to="/login" className="text-xs text-blue-700 hover:text-blue-900 underline">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmailPage;
