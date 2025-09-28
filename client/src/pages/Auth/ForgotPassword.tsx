import React from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-black border border-sky-200 dark:border-green-800 rounded-2xl shadow-xl p-6 sm:p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold mb-1">Forgot Password</h1>
          <p className="text-sm text-slate-700 dark:text-green-300">Password reset via OTP has been disabled.</p>
          <p className="text-sm text-slate-600 dark:text-green-400">Please contact support or try logging in again.</p>
          <div className="pt-2">
            <Link to="/login" className="inline-block bg-sky-600 hover:bg-sky-700 text-white rounded-lg px-4 py-2 text-sm font-semibold">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
