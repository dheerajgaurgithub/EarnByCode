import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '@/services/api';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpValid, setOtpValid] = useState<boolean | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Cooldown tick
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => setCooldownSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    if (cooldownSeconds > 0) return;
    setLoading(true);
    try {
      const res = await api.requestPasswordOtp(email.trim());
      setOtpRequested(true);
      setCooldownSeconds(60);
      toast.success(res?.message || 'If the email exists, an OTP has been sent');
    } catch (err: any) {
      const msg = String(err?.message || 'Failed to request OTP');
      // If server signaled rate limit, start a shorter fallback cooldown
      if (/wait/i.test(msg) || /429/.test(msg)) {
        setCooldownSeconds((s) => (s > 0 ? s : 60));
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!email || !otp) return;
    setVerifying(true);
    try {
      const res = await api.verifyPasswordOtp(email.trim(), otp.trim());
      setOtpValid(res.valid);
      if (res.valid) toast.success('Code verified');
      else toast.error(res?.message || 'Invalid code');
    } catch (err: any) {
      setOtpValid(false);
      toast.error(err?.message || 'Failed to verify code');
    } finally {
      setVerifying(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp || !newPassword || !confirmPassword) {
      toast.error('Please fill all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await api.resetPasswordWithOtp(email.trim(), otp.trim(), newPassword);
      toast.success(res?.message || 'Password reset successful');
      navigate('/login');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-black border border-sky-200 dark:border-green-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-1">Forgot Password</h1>
            <p className="text-sm text-slate-600 dark:text-green-400">Enter your email to receive a 6-digit code.</p>
          </div>

          {/* Step 1: Request OTP */}
          <form onSubmit={handleRequestOtp} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="you@example.com"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || cooldownSeconds > 0}
              className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white rounded-lg px-4 py-2 text-sm font-semibold"
            >
              {loading
                ? 'Sending...'
                : cooldownSeconds > 0
                  ? `Resend in ${cooldownSeconds}s`
                  : (otpRequested ? 'Resend Code' : 'Send Code')}
            </button>
          </form>

          {/* Step 2: Enter OTP + New Password */}
          {otpRequested && (
            <form onSubmit={handleResetPassword} className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-sm font-medium mb-1">Verification code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\\d{6}"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value.replace(/[^0-9]/g, '')); setOtpValid(null); }}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 tracking-widest"
                    placeholder="123456"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={verifying || !otp || otp.length !== 6}
                    className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm disabled:opacity-60"
                  >
                    {verifying ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
                {otpValid === true && <p className="text-xs text-green-600 mt-1">Code verified</p>}
                {otpValid === false && <p className="text-xs text-red-600 mt-1">Invalid or expired code</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm new password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg px-4 py-2 text-sm font-semibold"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          <div className="flex items-center justify-between pt-2">
            <Link to="/login" className="text-sm text-sky-600 hover:text-sky-700">Back to Login</Link>
            <Link to="/register" className="text-sm text-slate-600 dark:text-slate-300 hover:underline">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
