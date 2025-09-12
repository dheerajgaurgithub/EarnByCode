import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import GoogleOAuthButton from '../../components/Auth/GoogleOAuthButton';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { toast } from '../../components/ui/use-toast';
import apiService from '../../services/api';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, UserCheck } from 'lucide-react';

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
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      // Send registration request with skipVerification flag
      const response = await apiService.register(
        formData.username,
        formData.email,
        formData.password,
        formData.fullName
      );

      // Store the token and redirect to dashboard
      if (response.token) {
        localStorage.setItem('token', response.token);
        toast.success('Registration successful! Welcome to AlgoBucks.');
        navigate('/dashboard');
      } else {
        throw new Error('No authentication token received');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.message || 'Registration failed. Please try again.';
      
      // Handle specific error cases
      if (errorMessage.includes('email') || errorMessage.includes('Email')) {
        setError('Email is already registered');
      } else if (errorMessage.includes('username') || errorMessage.includes('Username')) {
        setError('Username is already taken');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto">
        {/* Main register card */}
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
              Join AlgoBucks
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-medium">
              Create your <span className="text-blue-600 font-bold">AlgoBucks</span> account
            </p>
            
            <p className="mt-3 sm:mt-4 md:mt-6 text-xs sm:text-sm md:text-base text-gray-600 font-medium">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-bold text-blue-600 hover:text-blue-800 transition-colors duration-200 underline-offset-4 hover:underline"
              >
                Sign in here
              </Link>
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

          {/* Google OAuth */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <GoogleOAuthButton 
              isRegister={true}
              onSuccess={() => {
                toast.success('Registration successful! Welcome to AlgoBucks.');
                navigate('/dashboard');
              }}
              onError={(error) => {
                setError(error || 'Failed to register with Google');
              }}
            />
          </div>

          {/* Divider */}
          <div className="relative mb-4 sm:mb-6 md:mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-blue-200"></div>
            </div>
            <div className="relative flex justify-center text-xs sm:text-sm">
              <span className="px-4 sm:px-6 py-1 sm:py-2 bg-white text-gray-600 font-medium rounded-full border border-blue-200 shadow-sm">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-xs sm:text-sm md:text-base font-semibold text-gray-700 mb-2 sm:mb-3 tracking-wide">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                </div>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 md:py-5 bg-blue-50/50 border border-blue-200 rounded-xl sm:rounded-2xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 hover:border-blue-300 transition-all duration-300 font-medium text-sm sm:text-base backdrop-blur-sm"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-xs sm:text-sm md:text-base font-semibold text-gray-700 mb-2 sm:mb-3 tracking-wide">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                  <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                </div>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 md:py-5 bg-blue-50/50 border border-blue-200 rounded-xl sm:rounded-2xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 hover:border-blue-300 transition-all duration-300 font-medium text-sm sm:text-base backdrop-blur-sm"
                  placeholder="Choose a unique username"
                />
              </div>
            </div>

            {/* Email */}
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
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 md:py-5 bg-blue-50/50 border border-blue-200 rounded-xl sm:rounded-2xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 hover:border-blue-300 transition-all duration-300 font-medium text-sm sm:text-base backdrop-blur-sm"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            {/* Password */}
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
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 md:py-5 bg-blue-50/50 border border-blue-200 rounded-xl sm:rounded-2xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 hover:border-blue-300 transition-all duration-300 font-medium text-sm sm:text-base backdrop-blur-sm"
                  placeholder="Create a strong password (min 6 chars)"
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs sm:text-sm md:text-base font-semibold text-gray-700 mb-2 sm:mb-3 tracking-wide">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                </div>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 md:py-5 bg-blue-50/50 border border-blue-200 rounded-xl sm:rounded-2xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 hover:border-blue-300 transition-all duration-300 font-medium text-sm sm:text-base backdrop-blur-sm"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center hover:bg-blue-50 rounded-r-xl sm:rounded-r-2xl transition-colors duration-200"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 hover:text-blue-600 transition-colors" />
                  ) : (
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 hover:text-blue-600 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3 sm:pt-4 md:pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 text-white font-bold py-3 sm:py-4 md:py-5 px-4 sm:px-6 rounded-xl sm:rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base md:text-lg tracking-wide shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="font-semibold text-sm sm:text-base">Creating your account...</span>
                  </div>
                ) : (
                  'Create AlgoBucks Account'
                )}
              </button>
            </div>
          </form>

          {/* Terms and Privacy */}
          <div className="mt-6 sm:mt-8 md:mt-10 pt-4 sm:pt-6 md:pt-8 border-t border-blue-200">
            <p className="text-xs sm:text-sm text-gray-600 text-center leading-relaxed font-medium">
              By creating an account, you agree to our{' '}
              <a 
                href="/terms" 
                className="text-blue-600 hover:text-blue-800 transition-colors duration-200 underline-offset-4 hover:underline font-semibold"
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a 
                href="/privacy" 
                className="text-blue-600 hover:text-blue-800 transition-colors duration-200 underline-offset-4 hover:underline font-semibold"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}