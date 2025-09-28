import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import GoogleOAuthButton from '../../components/Auth/GoogleOAuthButton';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { toast } from '../../components/ui/use-toast';
import apiService from '../../services/api';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, UserCheck } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

export function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // OTP flow removed
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // OTP flow removed
    
    // Basic validation
    if (!formData.fullName || !formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError(t('register.fill_all'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('register.passwords_no_match'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('register.password_short'));
      return;
    }

    setIsLoading(true);
    try {
      // Send registration request (direct create)
      const response: any = await apiService.register(
        formData.username,
        formData.email,
        formData.password,
        formData.fullName
      );

      if (response?.token) {
        localStorage.setItem('token', response.token);
        toast.success(t('register.success'));
        navigate('/dashboard');
        return;
      }

      throw new Error(response?.message || 'Registration failed');
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.message || 'Registration failed. Please try again.';
      
      // Handle specific error cases
      if (errorMessage.includes('email') || errorMessage.includes('Email')) {
        setError(t('register.email_exists'));
      } else if (errorMessage.includes('username') || errorMessage.includes('Username')) {
        setError(t('register.username_exists'));
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // OTP flow removed

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-gray-950 dark:via-black dark:to-green-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 transition-all duration-500">
      <div className="w-full max-w-lg mx-auto">
        {/* Main register card */}
        <div className="bg-white/90 dark:bg-black/90 border border-sky-100 dark:border-green-800/50 rounded-2xl shadow-2xl shadow-sky-500/10 dark:shadow-green-900/30 backdrop-blur-2xl p-6 sm:p-8 transition-all duration-500 hover:shadow-3xl hover:shadow-sky-500/20 dark:hover:shadow-green-900/40 hover:scale-[1.02] transform">
          
          {/* Header section */}
          <div className="text-center mb-8">
            {/* Logo with enhanced styling */}
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-sky-100 to-sky-200 dark:from-green-900/30 dark:to-green-800/20 rounded-2xl mb-4 transition-all duration-300 hover:scale-110">
              <img 
                src="/logo.png" 
                alt="EarnByCode Logo" 
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
              />
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 dark:from-green-400 dark:to-green-500 bg-clip-text text-transparent mb-3 tracking-tight">
              {t('register.title')}
            </h1>
            <p
              className="text-slate-600 dark:text-gray-300 text-sm sm:text-base font-medium leading-relaxed mb-4"
              dangerouslySetInnerHTML={{ 
                __html: t('register.subtitle')
                  .replace('<b>', '<span class="text-sky-600 dark:text-green-400 font-bold">')
                  .replace('</b>', '</span>') 
              }}
            />
            
            <p className="text-sm text-slate-600 dark:text-gray-300 font-medium">
              {t('register.have_account')}{' '}
              <Link
                to="/login"
                className="font-bold text-sky-600 dark:text-green-400 hover:text-sky-800 dark:hover:text-green-300 transition-all duration-200 underline-offset-4 hover:underline hover:scale-105 inline-block"
              >
                {t('register.sign_in_here')}
              </Link>
            </p>
          </div>

          {/* Error alert */}
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

          {/* Google OAuth with enhanced styling */}
          <div className="mb-6">
            <GoogleOAuthButton 
              isRegister={true}
              onSuccess={() => {
                toast.success(t('register.success'));
                navigate('/dashboard');
              }}
              onError={(error) => {
                setError(error || t('register.google_error'));
              }}
            />
          </div>

          {/* Divider with enhanced styling */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-sky-200/60 dark:border-green-800/40"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 py-2 bg-white/80 dark:bg-black/80 text-slate-600 dark:text-gray-300 font-medium rounded-xl border border-sky-200/60 dark:border-green-800/40 shadow-sm backdrop-blur-sm transition-all duration-300 hover:bg-white dark:hover:bg-black hover:scale-105">
                {t('register.or_email')}
              </span>
            </div>
          </div>

          {/* Registration Form (OTP removed) */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Full Name field */}
            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700 dark:text-gray-300 tracking-wide">
                {t('register.full_name')}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-300 group-focus-within:text-sky-500 dark:group-focus-within:text-green-500">
                  <User className="h-5 w-5 text-slate-400 dark:text-green-600 group-focus-within:text-sky-500 dark:group-focus-within:text-green-400 transition-colors" />
                </div>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 sm:py-4 bg-sky-50/50 dark:bg-green-950/20 border border-sky-200/60 dark:border-green-800/40 rounded-xl text-slate-800 dark:text-green-400 placeholder-slate-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:focus:ring-green-400/30 focus:border-sky-400 dark:focus:border-green-500 hover:border-sky-300 dark:hover:border-green-600 transition-all duration-300 font-medium text-sm sm:text-base backdrop-blur-sm hover:bg-sky-100/30 dark:hover:bg-green-950/30"
                  placeholder={t('register.placeholder.full_name')}
                />
              </div>
            </div>

            {/* Username field */}
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-semibold text-slate-700 dark:text-gray-300 tracking-wide">
                {t('register.username')}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-300 group-focus-within:text-sky-500 dark:group-focus-within:text-green-500">
                  <UserCheck className="h-5 w-5 text-slate-400 dark:text-green-600 group-focus-within:text-sky-500 dark:group-focus-within:text-green-400 transition-colors" />
                </div>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 sm:py-4 bg-sky-50/50 dark:bg-green-950/20 border border-sky-200/60 dark:border-green-800/40 rounded-xl text-slate-800 dark:text-green-400 placeholder-slate-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:focus:ring-green-400/30 focus:border-sky-400 dark:focus:border-green-500 hover:border-sky-300 dark:hover:border-green-600 transition-all duration-300 font-medium text-sm sm:text-base backdrop-blur-sm hover:bg-sky-100/30 dark:hover:bg-green-950/30"
                  placeholder={t('register.placeholder.username')}
                />
              </div>
            </div>

            {/* Email field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-gray-300 tracking-wide">
                {t('register.email')}
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
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 sm:py-4 bg-sky-50/50 dark:bg-green-950/20 border border-sky-200/60 dark:border-green-800/40 rounded-xl text-slate-800 dark:text-green-400 placeholder-slate-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:focus:ring-green-400/30 focus:border-sky-400 dark:focus:border-green-500 hover:border-sky-300 dark:hover:border-green-600 transition-all duration-300 font-medium text-sm sm:text-base backdrop-blur-sm hover:bg-sky-100/30 dark:hover:bg-green-950/30"
                  placeholder={t('register.placeholder.email')}
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-gray-300 tracking-wide">
                {t('register.password')}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-300 group-focus-within:text-sky-500 dark:group-focus-within:text-green-500">
                  <Lock className="h-5 w-5 text-slate-400 dark:text-green-600 group-focus-within:text-sky-500 dark:group-focus-within:text-green-400 transition-colors" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3 sm:py-4 bg-sky-50/50 dark:bg-green-950/20 border border-sky-200/60 dark:border-green-800/40 rounded-xl text-slate-800 dark:text-green-400 placeholder-slate-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:focus:ring-green-400/30 focus:border-sky-400 dark:focus:border-green-500 hover:border-sky-300 dark:hover:border-green-600 transition-all duration-300 font-medium text-sm sm:text-base backdrop-blur-sm hover:bg-sky-100/30 dark:hover:bg-green-950/30"
                  placeholder={t('register.placeholder.password')}
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

            {/* Confirm Password field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 dark:text-gray-300 tracking-wide">
                {t('register.confirm_password')}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-300 group-focus-within:text-sky-500 dark:group-focus-within:text-green-500">
                  <Lock className="h-5 w-5 text-slate-400 dark:text-green-600 group-focus-within:text-sky-500 dark:group-focus-within:text-green-400 transition-colors" />
                </div>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3 sm:py-4 bg-sky-50/50 dark:bg-green-950/20 border border-sky-200/60 dark:border-green-800/40 rounded-xl text-slate-800 dark:text-green-400 placeholder-slate-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:focus:ring-green-400/30 focus:border-sky-400 dark:focus:border-green-500 hover:border-sky-300 dark:hover:border-green-600 transition-all duration-300 font-medium text-sm sm:text-base backdrop-blur-sm hover:bg-sky-100/30 dark:hover:bg-green-950/30"
                  placeholder={t('register.placeholder.confirm_password')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-sky-100/40 dark:hover:bg-green-900/30 rounded-r-xl transition-all duration-200 group"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400 dark:text-green-600 group-hover:text-sky-600 dark:group-hover:text-green-400 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400 dark:text-green-600 group-hover:text-sky-600 dark:group-hover:text-green-400 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 dark:from-green-500 dark:via-green-600 dark:to-green-700 hover:from-sky-600 hover:via-sky-700 hover:to-blue-700 dark:hover:from-green-600 dark:hover:via-green-700 dark:hover:to-green-800 active:from-sky-700 active:to-blue-800 dark:active:from-green-700 dark:active:to-green-900 text-white font-bold py-3.5 sm:py-4 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base tracking-wide shadow-lg shadow-sky-500/30 dark:shadow-green-900/30 hover:shadow-xl hover:shadow-sky-500/40 dark:hover:shadow-green-900/40 transform hover:scale-[1.02] active:scale-[0.98] hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="font-semibold">{t('register.creating')}</span>
                  </div>
                ) : (
                  <span className="font-semibold tracking-wide">{t('register.submit')}</span>
                )}
              </button>
            </div>
          </form>
          

          {/* Terms and Privacy */}
          <div className="mt-6 pt-6 border-t border-sky-200/60 dark:border-green-800/40 transition-colors duration-300">
            <p className="text-sm text-slate-600 dark:text-gray-300 text-center leading-relaxed font-medium">
              {t('register.terms_prefix')}{' '}
              <a 
                href="/terms" 
                className="text-sky-600 dark:text-green-400 hover:text-sky-800 dark:hover:text-green-300 transition-all duration-200 underline-offset-4 hover:underline font-semibold hover:scale-105 inline-block"
              >
                {t('register.terms')}
              </a>{' '}
              and{' '}
              <a 
                href="/privacy" 
                className="text-sky-600 dark:text-green-400 hover:text-sky-800 dark:hover:text-green-300 transition-all duration-200 underline-offset-4 hover:underline font-semibold hover:scale-105 inline-block"
              >
                {t('register.privacy')}
              </a>
            </p>
          </div>
        </div>

        {/* Additional decorative elements */}
        <div className="absolute top-20 left-20 w-24 h-24 bg-sky-200/20 dark:bg-green-800/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-blue-200/20 dark:bg-green-900/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>
    </div>
  );
}