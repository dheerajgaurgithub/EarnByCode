import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Welcome: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [processing, setProcessing] = useState(true);
  const [status, setStatus] = useState<'success' | 'already' | 'error'>('success');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const verified = params.get('verified') as 'success' | 'already' | 'error' | null;
    if (verified) setStatus(verified);

    (async () => {
      try {
        if (token) {
          localStorage.setItem('token', token);
          await refreshUser(true);
        }
      } catch (e) {
        console.error('Welcome refresh error:', e);
        setStatus('error');
      } finally {
        setProcessing(false);
      }
    })();
  }, [location.search]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center border border-slate-200 dark:border-gray-700">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className={`h-12 w-12 ${status === 'error' ? 'text-rose-500' : 'text-emerald-500'}`} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900 dark:text-white">
          {status === 'success' && 'Registration Completed'}
          {status === 'already' && 'Already Verified'}
          {status === 'error' && 'Verification Error'}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {status === 'success' && 'Welcome to see you in EarnByCode! Your email has been verified and your session is ready.'}
          {status === 'already' && 'Your email was already verified. You are ready to continue.'}
          {status === 'error' && 'We could not verify your account from this link. Please try logging in or request a new verification link.'}
        </p>
        <button
          type="button"
          disabled={processing}
          onClick={() => navigate('/', { replace: true })}
          className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-60 shadow"
        >
          {processing ? 'Preparing your session…' : 'Go to Home'}
        </button>
      </div>
    </div>
  );
};

export default Welcome;
