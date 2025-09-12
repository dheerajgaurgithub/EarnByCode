import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { toast } from '../../components/ui/use-toast';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Code2 } from 'lucide-react';
import GoogleOAuthButton from '../../components/Auth/GoogleOAuthButton';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(email, password);
      
      if (success) {
        toast.success('You have been successfully logged in.');
        navigate('/dashboard');
      } else {
        setError('Invalid email or password');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto">
        {/* Main login card */}
        <div className="bg-white/90 border border-blue-200/50 rounded-2xl sm:rounded-3xl shadow-xl shadow-blue-500/10 backdrop-blur-lg p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12">
          {/* Header section */}
          <div className="text-center mb-6 sm:mb-8 md:mb-10">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 lg:w-24 lg:h-24 mb-4 sm:mb-6 md:mb-8 bg-gradient-to-br from-blue-100 to-blue-200/50 rounded-xl sm:rounded-2xl border border-blue-300/30 backdrop-blur-sm shadow-lg">
              <img 
                src="/src/data/logo.png" 
                alt="AlgoBucks Logo" 
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 object-contain"
              />
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-800 mb-1 sm:mb-2 md:mb-3 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-medium">
              Sign in to <span className="text-blue-600 font-bold">AlgoBucks</span>
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="mb-4 sm:mb-6 md:mb-8 p-3 sm:p-4 md:p-5 bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl backdrop-blur-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mt-0.5" />
                </div>
                <p className="ml-2 sm:ml-3 text-red-700 text-xs sm:text-sm md:text-base font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm md:text-base font-semibold text-gray-700 mb-2 sm:mb-3 tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 md:py-5 bg-blue-50/50 border border-blue-200 rounded-xl sm:rounded-2xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 hover:border-blue-300 transition-all duration-300 font-medium text-sm sm:text-base backdrop-blur-sm"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm md:text-base font-semibold text-gray-700 mb-2 sm:mb-3 tracking-wide">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 md:py-5 bg-blue-50/50 border border-blue-200 rounded-xl sm:rounded-2xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 hover:border-blue-300 transition-all duration-300 font-medium text-sm sm:text-base backdrop-blur-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center hover:bg-blue-50 rounded-r-xl sm:rounded-r-2xl transition-colors duration-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 hover:text-blue-600 transition-colors" />
                  ) : (
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 hover:text-blue-600 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex flex-col space-y-3 sm:space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between pt-2">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 focus:ring-blue-500 bg-blue-50 border-blue-300 rounded transition-all duration-200"
                />
                <label htmlFor="remember-me" className="ml-2 sm:ml-3 block text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">
                  Remember me
                </label>
              </div>

              <Link 
                to="/forgot-password" 
                className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors duration-200 underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit button */}
            <div className="space-y-4 sm:space-y-6 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 text-white font-bold py-3 sm:py-4 md:py-5 px-4 sm:px-6 rounded-xl sm:rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base md:text-lg tracking-wide shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="font-semibold text-sm sm:text-base">Signing you in...</span>
                  </div>
                ) : (
                  'Sign In to AlgoBucks'
                )}
              </button>
              
              {/* Divider */}
              <div className="relative my-6 sm:my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-blue-200"></div>
                </div>
                <div className="relative flex justify-center text-xs sm:text-sm">
                  <span className="px-4 sm:px-6 py-1 sm:py-2 bg-white text-gray-600 font-medium rounded-full border border-blue-200 shadow-sm">
                    Or continue with
                  </span>
                </div>
              </div>
              
              <GoogleOAuthButton />
            </div>
          </form>

          {/* Sign up link */}
          <div className="mt-6 sm:mt-8 md:mt-10 pt-6 sm:pt-8 border-t border-blue-200 text-center">
            <p className="text-gray-600 text-xs sm:text-sm md:text-base font-medium">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="font-bold text-blue-600 hover:text-blue-800 transition-colors duration-200 underline-offset-4 hover:underline"
              >
                Create one here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}