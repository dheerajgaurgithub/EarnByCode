import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { toast } from '../../components/ui/use-toast';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Code2 } from 'lucide-react';
import GoogleOAuthButton from '../../components/Auth/GoogleOAuthButton';
import { useI18n } from '../../context/I18nContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError(t('login.error.fill_all'));
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(email, password);
      
      if (success) {
        toast.success(t('login.success'));
        navigate('/dashboard');
      } else {
        setError(t('login.error.invalid'));
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || t('login.error.invalid'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-100 dark:from-black dark:via-gray-950 dark:to-green-950 flex items-center justify-center p-3 sm:p-4 lg:p-6 transition-colors duration-300">
      <div className="w-full max-w-sm mx-auto">
        {/* Main login card */}
        <div className="bg-white/95 dark:bg-black/95 border border-sky-200 dark:border-green-800 rounded-xl shadow-xl shadow-sky-500/10 dark:shadow-green-900/20 backdrop-blur-xl p-4 sm:p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-sky-500/15 dark:hover:shadow-green-900/25">
          {/* Header section */}
          <div className="text-center mb-4">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-12 h-12 mb-3 bg-gradient-to-br from-sky-100 to-sky-200 dark:from-green-900/50 dark:to-green-800/50 rounded-lg border border-sky-300/30 dark:border-green-700/30 backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-105">
              <img 
                src="/logo.png" 
                alt="AlgoBucks Logo" 
                className="w-6 h-6 object-contain"
              />
            </div>
            
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-green-400 mb-1 tracking-tight transition-colors duration-300">
              {t('login.title')}
            </h1>
            <p
              className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm font-medium transition-colors duration-300"
              dangerouslySetInnerHTML={{ __html: t('login.subtitle').replace('<b>', '<span class="text-sky-600 dark:text-green-400 font-bold">').replace('</b>', '</span>') }}
            />
          </div>

          {/* Error alert */}
          {error && (
            <div className="mb-3 p-2.5 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg backdrop-blur-sm transition-colors duration-300">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 dark:text-red-400 mt-0.5" />
                </div>
                <p className="ml-2 text-red-700 dark:text-red-300 text-xs sm:text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 tracking-wide transition-colors duration-300">
                {t('login.email')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-400 dark:text-green-500" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 sm:pl-9 pr-3 py-2 sm:py-2.5 bg-sky-50/50 dark:bg-green-950/30 border border-sky-200 dark:border-green-800 rounded-lg text-gray-800 dark:text-green-400 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 dark:focus:ring-green-400/50 focus:border-sky-400 dark:focus:border-green-500 hover:border-sky-300 dark:hover:border-green-700 transition-all duration-300 font-medium text-xs sm:text-sm backdrop-blur-sm"
                  placeholder={t('login.email')}
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 tracking-wide transition-colors duration-300">
                {t('login.password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-400 dark:text-green-500" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 sm:pl-9 pr-10 py-2 sm:py-2.5 bg-sky-50/50 dark:bg-green-950/30 border border-sky-200 dark:border-green-800 rounded-lg text-gray-800 dark:text-green-400 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 dark:focus:ring-green-400/50 focus:border-sky-400 dark:focus:border-green-500 hover:border-sky-300 dark:hover:border-green-700 transition-all duration-300 font-medium text-xs sm:text-sm backdrop-blur-sm"
                  placeholder={t('login.password')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center hover:bg-sky-50 dark:hover:bg-green-900/30 rounded-r-lg transition-colors duration-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-400 dark:text-green-500 hover:text-sky-600 dark:hover:text-green-400 transition-colors" />
                  ) : (
                    <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-400 dark:text-green-500 hover:text-sky-600 dark:hover:text-green-400 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pt-0.5">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-3.5 w-3.5 text-sky-600 dark:text-green-500 focus:ring-sky-500 dark:focus:ring-green-400 bg-sky-50 dark:bg-green-950 border-sky-300 dark:border-green-700 rounded transition-all duration-200"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors">
                  {t('login.remember')}
                </label>
              </div>

              <Link 
                to="/forgot-password" 
                className="text-xs font-semibold text-sky-600 dark:text-green-400 hover:text-sky-800 dark:hover:text-green-300 transition-colors duration-200 underline-offset-4 hover:underline"
              >
                {t('login.forgot')}
              </Link>
            </div>

            {/* Submit button */}
            <div className="space-y-3 pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-sky-500 to-sky-600 dark:from-green-500 dark:to-green-600 hover:from-sky-600 hover:to-sky-700 dark:hover:from-green-600 dark:hover:to-green-700 active:from-sky-700 active:to-sky-800 dark:active:from-green-700 dark:active:to-green-800 text-white font-bold py-2.5 sm:py-3 px-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm tracking-wide shadow-lg shadow-sky-500/25 dark:shadow-green-900/25 hover:shadow-xl hover:shadow-sky-500/30 dark:hover:shadow-green-900/30 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="font-semibold text-xs sm:text-sm">{t('login.submit')}</span>
                  </div>
                ) : (
                  <span className="text-xs sm:text-sm font-semibold">{t('login.submit')}</span>
                )}
              </button>
              
              {/* Divider */}
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-sky-200 dark:border-green-800"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 py-1.5 bg-white dark:bg-black text-gray-600 dark:text-gray-300 font-medium rounded-full border border-sky-200 dark:border-green-800 shadow-sm transition-colors duration-300">
                    {t('login.continue_with')}
                  </span>
                </div>
              </div>
              
              <GoogleOAuthButton />
            </div>
          </form>

          {/* Sign up link */}
          <div className="mt-4 pt-3 border-t border-sky-200 dark:border-green-800 text-center transition-colors duration-300">
            <p className="text-gray-600 dark:text-gray-300 text-xs font-medium transition-colors duration-300">
              {t('login.no_account')}{' '}
              <Link 
                to="/register" 
                className="font-bold text-sky-600 dark:text-green-400 hover:text-sky-800 dark:hover:text-green-300 transition-colors duration-200 underline-offset-4 hover:underline"
              >
                {t('login.create_here')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}