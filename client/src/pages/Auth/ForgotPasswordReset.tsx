import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import apiService from '@/services/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ForgotPasswordReset: React.FC = () => {
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const otp = params.get('otp') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp) {
      error({ title: 'Missing data', description: 'Email or code missing. Restart the flow.' });
      navigate('/forgot-password');
      return;
    }
    if (!password || password.length < 6) {
      error({ title: 'Weak password', description: 'Use at least 6 characters.' });
      return;
    }
    if (password !== confirm) {
      error({ title: 'Mismatch', description: 'Passwords do not match.' });
      return;
    }
    try {
      setLoading(true);
      await apiService.resetPasswordWithOtp(email, otp, password);
      success({ title: 'Password reset', description: 'You can now log in with your new password.' });
      navigate('/login');
    } catch (e: any) {
      error({ title: 'Failed', description: e?.message || 'Could not reset password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-slate-200 dark:border-gray-700 p-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Set a new password</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Enter and confirm your new password for <b>{email || 'your account'}</b>.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">New password</label>
            <div className="relative mt-1">
              <Input
                type={show1 ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShow1(!show1)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                {show1 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Confirm password</label>
            <div className="relative mt-1">
              <Input
                type={show2 ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShow2(!show2)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                {show2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-sky-600 hover:bg-sky-700 text-white">
            {loading ? 'Saving...' : 'Reset password'}
          </Button>
        </form>
        <div className="mt-4 text-sm">
          <Link to={`/forgot-password/otp?email=${encodeURIComponent(email)}`} className="text-sky-700 dark:text-emerald-400 underline">Back</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordReset;
