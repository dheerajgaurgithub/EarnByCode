import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiService from '@/services/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ForgotPasswordRequest: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      setLoading(true);
      await apiService.requestPasswordOtp(email);
      success({ title: 'OTP sent', description: 'Check your email for the verification code.' });
      navigate(`/forgot-password/otp?email=${encodeURIComponent(email)}`);
    } catch (e: any) {
      error({ title: 'Failed', description: e?.message || 'Could not send OTP' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-slate-200 dark:border-gray-700 p-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Forgot password</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Enter your email. We'll send a 6-digit code to reset your password.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-sky-600 hover:bg-sky-700 text-white">
            {loading ? 'Sending...' : 'Send code'}
          </Button>
        </form>
        <div className="mt-4 text-sm">
          <Link to="/login" className="text-sky-700 dark:text-emerald-400 underline">Back to login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordRequest;
