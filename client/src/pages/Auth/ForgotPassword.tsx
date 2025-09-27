import React from 'react';
import { Input } from '@/components/ui/input';
import { Mail, Lock, Hash, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const getApiBase = () => {
  // Same pattern used elsewhere
  const raw = (import.meta as any)?.env?.VITE_API_URL as string;
  const base = raw || 'https://algobucks.onrender.com/api';
  return base.replace(/\/$/, '');
};

const ForgotPassword: React.FC = () => {
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [email, setEmail] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [testOtp, setTestOtp] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const requestOtp = async () => {
    setError(''); setMessage(''); setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/auth/forgot-password/request`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage('If an account exists, an OTP has been sent to your email.');
        setStep(2);
        if (data?.testOtp) setTestOtp(String(data.testOtp)); else setTestOtp(null);
      } else {
        setError(data?.message || 'Failed to request OTP');
      }
    } catch (e:any) {
      setError(e?.message || 'Network error');
    } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    setError(''); setMessage(''); setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/auth/forgot-password/verify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      if (res.ok) {
        setMessage('OTP verified. You can set a new password now.');
        setStep(3);
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d?.message || 'Invalid or expired OTP');
      }
    } catch (e:any) {
      setError(e?.message || 'Network error');
    } finally { setLoading(false); }
  };

  const resetPassword = async () => {
    setError(''); setMessage(''); setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/auth/forgot-password/reset`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      if (res.ok) {
        setMessage('Password reset successfully. Redirecting to login...');
        setTimeout(() => navigate('/login'), 1200);
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d?.message || 'Failed to reset password');
      }
    } catch (e:any) {
      setError(e?.message || 'Network error');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-black border border-sky-200 dark:border-green-800 rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="mb-4">
            <Link to="/login" className="inline-flex items-center text-sm text-slate-600 dark:text-green-300 hover:underline">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to login
            </Link>
          </div>
          <h1 className="text-2xl font-bold mb-1">Forgot Password</h1>
          <p className="text-sm text-slate-600 dark:text-green-300 mb-5">Verify your email with OTP, then set a new password.</p>

          {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
          {message && <div className="mb-3 text-sm text-green-600">{message}</div>}

          {step === 1 && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" className="pl-9" />
              </div>
              <button disabled={loading || !email} onClick={requestOtp} className="w-full mt-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50">
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Enter OTP</label>
              <div className="relative">
                <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input type="text" value={otp} onChange={(e)=>setOtp(e.target.value)} placeholder="6-digit code" className="pl-9" />
              </div>
              {testOtp && (
                <p className="text-xs text-amber-600">Dev test OTP: <code>{testOtp}</code></p>
              )}
              <button disabled={loading || !otp} onClick={verifyOtp} className="w-full mt-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50">
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <label className="text-sm font-medium">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} placeholder="••••••••" className="pl-9" />
              </div>
              <button disabled={loading || !newPassword} onClick={resetPassword} className="w-full mt-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50">
                {loading ? 'Saving...' : 'Reset Password'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
