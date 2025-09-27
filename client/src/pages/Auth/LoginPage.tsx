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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-gray-950 dark:via-black dark:to-green-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 transition-all duration-500">
      <div className="w-full max-w-md mx-auto">
        {/* Main login card with enhanced styling */}
        <div className="bg-white/90 dark:bg-black/90 border border-sky-100 dark:border-green-800/50 rounded-2xl shadow-2xl shadow-sky-500/10 dark:shadow-green-900/30 backdrop-blur-2xl p-6 sm:p-8 transition-all duration-500 hover:shadow-3xl hover:shadow-sky-500/20 dark:hover:shadow-green-900/40 hover:scale-[1.02] transform">
          
          {/* Header section with enhanced spacing */}
          <div className="text-center mb-8">
            {/* Logo with enhanced styling */}
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-sky-100 to-sky-200 dark:from-green-900/30 dark:to-green-800/20 rounded-2xl mb-4 transition-all duration-300 hover:scale-110">
              <img
                src="/logo.png"
                alt="EarnByCode Logo"
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
              />
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 dark:from-green-400 dark:to-green-500 bg-clip-text text-transparent mb-2 tracking-tight">
              {t('login.title')}
            </h1>
            <p
              className="text-slate-600 dark:text-gray-300 text-sm sm:text-base font-medium leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: t('login.subtitle')
                  .replace('<b>', '<span class="text-sky-600 dark:text-green-400 font-bold">')
                  .replace('</b>', '</span>') 
              }}
            />
          </div>

          {/* Error alert with enhanced styling */}
          {error && (
            <div className="mb-6 p-4 bg-red-50/80 dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/40 rounded-xl backdrop-blur-sm transition-all duration-300 animate-in slide-in-from-top-2">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <p className="ml-3 text-red-700 dark:text-red-300 text-sm font-medium leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* Login form with enhanced spacing */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email field with modern styling */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-gray-300 tracking-wide">
                {t('login.email')}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-300 group-focus-within:text-sky-500 dark:group-focus-within:text-green-500">
                  <Mail className="h-5 w-5 text-slate-400 dark:text-green-600 group-focus-within:text-sky-500 dark:group-focus-within:text-green-400 transition-colors" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 sm:py-4 bg-sky-50/50 dark:bg-green-950/20 border border-sky-200/60 dark:border-green-800/40 rounded-xl text-slate-800 dark:text-green-400 placeholder-slate-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:focus:ring-green-400/30 focus:border-sky-400 dark:focus:border-green-500 hover:border-sky-300 dark:hover:border-green-600 transition-all duration-300 font-medium text-sm sm:text-base backdrop-blur-sm hover:bg-sky-100/30 dark:hover:bg-green-950/30"
                  placeholder={t('login.email')}
                />
              </div>
            </div>

            {/* Password field with modern styling */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-gray-300 tracking-wide">
                {t('login.password')}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-300 group-focus-within:text-sky-500 dark:group-focus-within:text-green-500">
                  <Lock className="h-5 w-5 text-slate-400 dark:text-green-600 group-focus-within:text-sky-500 dark:group-focus-within:text-green-400 transition-colors" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 sm:py-4 bg-sky-50/50 dark:bg-green-950/20 border border-sky-200/60 dark:border-green-800/40 rounded-xl text-slate-800 dark:text-green-400 placeholder-slate-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:focus:ring-green-400/30 focus:border-sky-400 dark:focus:border-green-500 hover:border-sky-300 dark:hover:border-green-600 transition-all duration-300 font-medium text-sm sm:text-base backdrop-blur-sm hover:bg-sky-100/30 dark:hover:bg-green-950/30"
                  placeholder={t('login.password')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-sky-100/40 dark:hover:bg-green-900/30 rounded-r-xl transition-all duration-200 group"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400 dark:text-green-600 group-hover:text-sky-600 dark:group-hover:text-green-400 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400 dark:text-green-600 group-hover:text-sky-600 dark:group-hover:text-green-400 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot password with enhanced styling */}
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pt-2">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-sky-600 dark:text-green-500 focus:ring-sky-500/30 dark:focus:ring-green-400/30 bg-sky-50 dark:bg-green-950 border-sky-300 dark:border-green-700 rounded transition-all duration-200 hover:scale-105"
                />
                <label htmlFor="remember-me" className="ml-3 block text-sm font-medium text-slate-600 dark:text-gray-300 hover:text-slate-800 dark:hover:text-gray-100 transition-colors cursor-pointer">
                  {t('login.remember')}
                </label>
              </div>

              <Link 
                to="/forgot-password" 
                className="text-sm font-semibold text-sky-600 dark:text-green-400 hover:text-sky-800 dark:hover:text-green-300 transition-all duration-200 underline-offset-4 hover:underline hover:scale-105 inline-block"
              >
                {t('login.forgot')}
              </Link>
            </div>

            {/* Submit button with enhanced styling */}
            <div className="space-y-4 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 dark:from-green-500 dark:via-green-600 dark:to-green-700 hover:from-sky-600 hover:via-sky-700 hover:to-blue-700 dark:hover:from-green-600 dark:hover:via-green-700 dark:hover:to-green-800 active:from-sky-700 active:to-blue-800 dark:active:from-green-700 dark:active:to-green-900 text-white font-bold py-3.5 sm:py-4 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base tracking-wide shadow-lg shadow-sky-500/30 dark:shadow-green-900/30 hover:shadow-xl hover:shadow-sky-500/40 dark:hover:shadow-green-900/40 transform hover:scale-[1.02] active:scale-[0.98] hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="font-semibold">{t('login.submit')}</span>
                  </div>
                ) : (
                  <span className="font-semibold tracking-wide">{t('login.submit')}</span>
                )}
              </button>
              
              {/* Divider with enhanced styling */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-sky-200/60 dark:border-green-800/40"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 py-2 bg-white/80 dark:bg-black/80 text-slate-600 dark:text-gray-300 font-medium rounded-xl border border-sky-200/60 dark:border-green-800/40 shadow-sm backdrop-blur-sm transition-all duration-300 hover:bg-white dark:hover:bg-black hover:scale-105">
                    {t('login.continue_with')}
                  </span>
                </div>
              </div>
              
              <GoogleOAuthButton />
            </div>
          </form>

          {/* Sign up link with enhanced styling */}
          <div className="mt-6 pt-6 border-t border-sky-200/60 dark:border-green-800/40 text-center">
            <p className="text-slate-600 dark:text-gray-300 text-sm font-medium leading-relaxed">
              {t('login.no_account')}{' '}
              <Link 
                to="/register" 
                className="font-bold text-sky-600 dark:text-green-400 hover:text-sky-800 dark:hover:text-green-300 transition-all duration-200 underline-offset-4 hover:underline hover:scale-105 inline-block"
              >
                {t('login.create_here')}
              </Link>
            </p>
          </div>
        </div>

        {/* Additional decorative elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-sky-200/20 dark:bg-green-800/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-blue-200/20 dark:bg-green-900/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>
    </div>
);
}