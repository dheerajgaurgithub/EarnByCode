import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import apiService from '@/services/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const ForgotPasswordOtp: React.FC = () => {
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp) return;
    try {
      setLoading(true);
      const res = await apiService.verifyPasswordOtp(email, otp);
      if (res.valid) {
        success({ title: 'Code verified', description: 'Enter a new password.' });
        navigate(`/forgot-password/reset?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`);
      } else {
        error({ title: 'Invalid code', description: res.message || 'Please try again.' });
      }
    } catch (e: any) {
      error({ title: 'Failed', description: e?.message || 'Could not verify code' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-slate-200 dark:border-gray-700 p-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Enter verification code</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">We've sent a 6-digit code to <b>{email || 'your email'}</b>.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">6-digit code</label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-sky-600 hover:bg-sky-700 text-white">
            {loading ? 'Verifying...' : 'Verify'}
          </Button>
        </form>
        <div className="mt-4 text-sm">
          <Link to={`/forgot-password?email=${encodeURIComponent(email)}`} className="text-sky-700 dark:text-emerald-400 underline">Back</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordOtp;
