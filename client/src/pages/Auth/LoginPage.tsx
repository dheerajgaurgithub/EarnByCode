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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-black dark:via-gray-950 dark:to-black flex items-center justify-center p-3 transition-colors duration-300">
      <div className="w-full max-w-sm mx-auto">
        {/* Main login card */}
        <div className="bg-white/90 dark:bg-gray-900/90 border border-blue-200/50 dark:border-blue-800/50 rounded-xl shadow-lg shadow-blue-500/10 dark:shadow-blue-900/20 backdrop-blur-lg p-4 transition-colors duration-300">
          {/* Header section */}
          <div className="text-center mb-4">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-12 h-12 mb-3 bg-gradient-to-br from-blue-100 to-blue-200/50 dark:from-blue-900/50 dark:to-blue-800/50 rounded-lg border border-blue-300/30 dark:border-blue-700/30 backdrop-blur-sm shadow-md transition-colors duration-300">
              <img 
                src="/logo.png" 
                alt="AlgoBucks Logo" 
                className="w-6 h-6 object-contain"
              />
            </div>
            
            <h1 className="text-xl font-bold text-gray-800 dark:text-blue-400 mb-1 tracking-tight transition-colors duration-300">
              {t('login.title')}
            </h1>
            <p
              className="text-gray-600 dark:text-gray-300 text-xs font-medium transition-colors duration-300"
              dangerouslySetInnerHTML={{ __html: t('login.subtitle').replace('<b>', '<span class="text-blue-600 dark:text-blue-400 font-bold">').replace('</b>', '</span>') }}
            />
          </div>

          {/* Error alert */}
          {error && (
            <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg backdrop-blur-sm transition-colors duration-300">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-3 w-3 text-red-500 dark:text-red-400 mt-0.5" />
                </div>
                <p className="ml-2 text-red-700 dark:text-red-300 text-xs font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 tracking-wide transition-colors duration-300">
                {t('login.email')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <Mail className="h-3 w-3 text-blue-400 dark:text-blue-500" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-7 pr-2 py-2 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-gray-800 dark:text-blue-400 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 focus:border-blue-400 dark:focus:border-blue-500 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 font-medium text-xs backdrop-blur-sm"
                  placeholder={t('login.email')}
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 tracking-wide transition-colors duration-300">
                {t('login.password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <Lock className="h-3 w-3 text-blue-400 dark:text-blue-500" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-7 pr-8 py-2 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-gray-800 dark:text-blue-400 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 focus:border-blue-400 dark:focus:border-blue-500 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 font-medium text-xs backdrop-blur-sm"
                  placeholder={t('login.password')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-2 flex items-center hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-r-lg transition-colors duration-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-3 w-3 text-blue-400 dark:text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" />
                  ) : (
                    <Eye className="h-3 w-3 text-blue-400 dark:text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 pt-1">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-3 w-3 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 rounded transition-all duration-200"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors">
                  {t('login.remember')}
                </label>
              </div>

              <Link 
                to="/forgot-password" 
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 underline-offset-4 hover:underline"
              >
                {t('login.forgot')}
              </Link>
            </div>

            {/* Submit button */}
            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 active:from-blue-800 active:to-blue-900 dark:active:from-blue-700 dark:active:to-blue-800 text-white font-bold py-2 px-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs tracking-wide shadow-lg shadow-blue-500/25 dark:shadow-blue-900/25 hover:shadow-xl hover:shadow-blue-500/30 dark:hover:shadow-blue-900/30 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="font-semibold text-xs">{t('login.submit')}</span>
                  </div>
                ) : (
                  t('login.submit')
                )}
              </button>
              
              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-blue-200 dark:border-blue-800"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 py-1 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 font-medium rounded-full border border-blue-200 dark:border-blue-800 shadow-sm transition-colors duration-300">
                    {t('login.continue_with')}
                  </span>
                </div>
              </div>
              
              <GoogleOAuthButton />
            </div>
          </form>

          {/* Sign up link */}
          <div className="mt-4 pt-3 border-t border-blue-200 dark:border-blue-800 text-center transition-colors duration-300">
            <p className="text-gray-600 dark:text-gray-300 text-xs font-medium transition-colors duration-300">
              {t('login.no_account')}{' '}
              <Link 
                to="/register" 
                className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 underline-offset-4 hover:underline"
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