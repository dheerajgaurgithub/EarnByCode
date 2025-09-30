import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import apiService from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

const VerifyCheck: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const emailFromQuery = params.get('email') || '';
  const [email, setEmail] = useState(emailFromQuery);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const resend = async () => {
    if (!email) return;
    try {
      setLoading(true);
      await apiService.post('/auth/resend-verification', { email });
      success({ title: 'Verification code sent', description: 'Check your inbox for the new code.' });
    } catch (e: any) {
      error({ title: 'Failed to send code', description: e?.message || 'Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp) return;
    try {
      setLoading(true);
      const res: any = await apiService.post('/auth/verify-email', { email, otp });
      success({ title: 'Email verified', description: 'You can now sign in.' });
      navigate('/verify/success?next=/login');
    } catch (e: any) {
      error({ title: 'Invalid code', description: e?.message || 'Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verify your email</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Enter the 6-digit code we sent to your email. You can also resend a new code.</p>

        <form onSubmit={verify} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Verification code</label>
            <Input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} required />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1 bg-sky-600 hover:bg-sky-700 text-white">Verify</Button>
            <Button type="button" onClick={resend} disabled={loading || !email} variant="outline" className="flex-1">Resend code</Button>
          </div>
        </form>

        <div className="mt-4 text-sm">
          <Link to="/login" className="text-sky-700 dark:text-emerald-400 underline">Back to login</Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyCheck;
