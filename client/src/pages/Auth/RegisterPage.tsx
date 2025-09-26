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
      // Send registration request
      const response: any = await apiService.register(
        formData.username,
        formData.email,
        formData.password,
        formData.fullName
      );

      // If server requires email verification via OTP, route to verify page
      if (response?.requiresVerification) {
        toast.success(t('verify.sent'));
        navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
        return;
      }

      // Otherwise, proceed with token login
      if (response?.token) {
        localStorage.setItem('token', response.token);
        toast.success(t('register.success'));
        navigate('/dashboard');
      } else {
        throw new Error('No authentication token received');
      }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-100 dark:from-black dark:via-gray-950 dark:to-green-950 flex items-center justify-center p-2 sm:p-4 lg:p-6">
      <div className="w-full max-w-sm mx-auto">
        {/* Main register card */}
        <div className="bg-white/95 dark:bg-black/95 border border-sky-200 dark:border-green-800 rounded-xl shadow-xl shadow-sky-500/10 dark:shadow-green-900/20 backdrop-blur-xl p-4 sm:p-5 transition-all duration-300 hover:shadow-2xl hover:shadow-sky-500/15 dark:hover:shadow-green-900/25">
          {/* Header section */}
          <div className="text-center mb-4">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-12 h-12 mb-3 bg-gradient-to-br from-sky-100 to-sky-200 dark:from-green-900/50 dark:to-green-800/50 rounded-lg border border-sky-300/30 dark:border-green-700/30 backdrop-blur-sm shadow-md transition-all duration-300 hover:scale-105">
              <img 
                src="/logo.png" 
                alt="AlgoBucks Logo" 
                className="w-6 h-6 object-contain"
              />
            </div>
            
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-green-400 mb-1 tracking-tight transition-colors duration-300">
              {t('register.title')}
            </h1>
            <p
              className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm font-medium transition-colors duration-300 mb-2"
              dangerouslySetInnerHTML={{ __html: t('register.subtitle').replace('<b>', '<span class=\"text-sky-600 dark:text-green-400 font-bold\">').replace('</b>', '</span>') }}
            />
            
            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium transition-colors duration-300">
              {t('register.have_account')}{' '}
              <Link
                to="/login"
                className="font-bold text-sky-600 dark:text-green-400 hover:text-sky-800 dark:hover:text-green-300 transition-colors duration-200 underline-offset-4 hover:underline"
              >
                {t('register.sign_in_here')}
              </Link>
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="mb-3 p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg backdrop-blur-sm transition-colors duration-300">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 mt-0.5" />
                </div>
                <p className="ml-2 text-red-700 dark:text-red-300 text-xs font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Google OAuth */}
          <div className="mb-3">
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

          {/* Divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-sky-200 dark:border-green-800"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 py-1.5 bg-white dark:bg-black text-gray-600 dark:text-gray-300 font-medium rounded-full border border-sky-200 dark:border-green-800 shadow-sm transition-colors duration-300">
                {t('register.or_email')}
              </span>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 tracking-wide transition-colors duration-300">
                {t('register.full_name')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-sky-400 dark:text-green-500" />
                </div>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2.5 bg-sky-50/50 dark:bg-green-950/30 border border-sky-200 dark:border-green-800 rounded-lg text-gray-800 dark:text-green-400 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 dark:focus:ring-green-400/50 focus:border-sky-400 dark:focus:border-green-500 hover:border-sky-300 dark:hover:border-green-700 transition-all duration-300 font-medium text-sm backdrop-blur-sm"
                  placeholder={t('register.placeholder.full_name')}
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 tracking-wide transition-colors duration-300">
                {t('register.username')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <UserCheck className="h-4 w-4 text-sky-400 dark:text-green-500" />
                </div>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2.5 bg-sky-50/50 dark:bg-green-950/30 border border-sky-200 dark:border-green-800 rounded-lg text-gray-800 dark:text-green-400 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 dark:focus:ring-green-400/50 focus:border-sky-400 dark:focus:border-green-500 hover:border-sky-300 dark:hover:border-green-700 transition-all duration-300 font-medium text-sm backdrop-blur-sm"
                  placeholder={t('register.placeholder.username')}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 tracking-wide transition-colors duration-300">
                {t('register.email')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-sky-400 dark:text-green-500" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2.5 bg-sky-50/50 dark:bg-green-950/30 border border-sky-200 dark:border-green-800 rounded-lg text-gray-800 dark:text-green-400 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 dark:focus:ring-green-400/50 focus:border-sky-400 dark:focus:border-green-500 hover:border-sky-300 dark:hover:border-green-700 transition-all duration-300 font-medium text-sm backdrop-blur-sm"
                  placeholder={t('register.placeholder.email')}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 tracking-wide transition-colors duration-300">
                {t('register.password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-sky-400 dark:text-green-500" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-9 pr-10 py-2.5 bg-sky-50/50 dark:bg-green-950/30 border border-sky-200 dark:border-green-800 rounded-lg text-gray-800 dark:text-green-400 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 dark:focus:ring-green-400/50 focus:border-sky-400 dark:focus:border-green-500 hover:border-sky-300 dark:hover:border-green-700 transition-all duration-300 font-medium text-sm backdrop-blur-sm"
                  placeholder={t('register.placeholder.password')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center hover:bg-sky-50 dark:hover:bg-green-900/30 rounded-r-lg transition-colors duration-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-sky-400 dark:text-green-500 hover:text-sky-600 dark:hover:text-green-400 transition-colors" />
                  ) : (
                    <Eye className="h-4 w-4 text-sky-400 dark:text-green-500 hover:text-sky-600 dark:hover:text-green-400 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 tracking-wide transition-colors duration-300">
                {t('register.confirm_password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-sky-400 dark:text-green-500" />
                </div>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-9 pr-10 py-2.5 bg-sky-50/50 dark:bg-green-950/30 border border-sky-200 dark:border-green-800 rounded-lg text-gray-800 dark:text-green-400 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 dark:focus:ring-green-400/50 focus:border-sky-400 dark:focus:border-green-500 hover:border-sky-300 dark:hover:border-green-700 transition-all duration-300 font-medium text-sm backdrop-blur-sm"
                  placeholder={t('register.placeholder.confirm_password')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center hover:bg-sky-50 dark:hover:bg-green-900/30 rounded-r-lg transition-colors duration-200"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-sky-400 dark:text-green-500 hover:text-sky-600 dark:hover:text-green-400 transition-colors" />
                  ) : (
                    <Eye className="h-4 w-4 text-sky-400 dark:text-green-500 hover:text-sky-600 dark:hover:text-green-400 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-sky-500 to-sky-600 dark:from-green-500 dark:to-green-600 hover:from-sky-600 hover:to-sky-700 dark:hover:from-green-600 dark:hover:to-green-700 active:from-sky-700 active:to-sky-800 dark:active:from-green-700 dark:active:to-green-800 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide shadow-lg shadow-sky-500/25 dark:shadow-green-900/25 hover:shadow-xl hover:shadow-sky-500/30 dark:hover:shadow-green-900/30 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="font-semibold text-sm">{t('register.creating')}</span>
                  </div>
                ) : (
                  <span className="text-sm font-semibold">{t('register.submit')}</span>
                )}
              </button>
            </div>
          </form>

          {/* Terms and Privacy */}
          <div className="mt-4 pt-3 border-t border-sky-200 dark:border-green-800 transition-colors duration-300">
            <p className="text-xs text-gray-600 dark:text-gray-300 text-center leading-relaxed font-medium transition-colors duration-300">
              {t('register.terms_prefix')}{' '}
              <a 
                href="/terms" 
                className="text-sky-600 dark:text-green-400 hover:text-sky-800 dark:hover:text-green-300 transition-colors duration-200 underline-offset-4 hover:underline font-semibold"
              >
                {t('register.terms')}
              </a>{' '}
              and{' '}
              <a 
                href="/privacy" 
                className="text-sky-600 dark:text-green-400 hover:text-sky-800 dark:hover:text-green-300 transition-colors duration-200 underline-offset-4 hover:underline font-semibold"
              >
                {t('register.privacy')}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}