import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

const EmailVerified: React.FC = () => {
  const [params] = useSearchParams();
  const next = params.get('next') || '/login';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-700 p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Email Verified</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Your email has been successfully verified. You can now sign in and start using the platform.
        </p>
        <Link
          to={next}
          className="inline-flex items-center px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-md"
        >
          Continue <ArrowRight className="h-4 w-4 ml-2" />
        </Link>
        <div className="mt-4">
          <Link to="/" className="text-sky-700 dark:text-emerald-400 underline">
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmailVerified;
