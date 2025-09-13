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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-3">
      <div className="w-full max-w-sm mx-auto">
        {/* Main register card */}
        <div className="bg-white/90 border border-blue-200/50 rounded-xl shadow-lg shadow-blue-500/10 backdrop-blur-lg p-4">
          {/* Header section */}
          <div className="text-center mb-4">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-12 h-12 mb-3 bg-gradient-to-br from-blue-100 to-blue-200/50 rounded-lg border border-blue-300/30 backdrop-blur-sm shadow-md">
              <img 
                src="/logo.png" 
                alt="AlgoBucks Logo" 
                className="w-6 h-6 object-contain"
              />
            </div>
            
            <h1 className="text-xl font-bold text-gray-800 mb-1 tracking-tight">
              Join AlgoBucks
            </h1>
            <p className="text-gray-600 text-xs font-medium">
              Create your <span className="text-blue-600 font-bold">AlgoBucks</span> account
            </p>
            
            <p className="mt-2 text-xs text-gray-600 font-medium">
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
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg backdrop-blur-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-3 w-3 text-red-500 mt-0.5" />
                </div>
                <p className="ml-2 text-red-700 text-xs font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Google OAuth */}
          <div className="mb-3">
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
          <div className="relative mb-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-blue-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 py-1 bg-white text-gray-600 font-medium rounded-full border border-blue-200 shadow-sm">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-xs font-semibold text-gray-700 mb-1 tracking-wide">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <User className="h-3 w-3 text-blue-400" />
                </div>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-7 pr-2 py-2 bg-blue-50/50 border border-blue-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 hover:border-blue-300 transition-all duration-300 font-medium text-xs backdrop-blur-sm"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-gray-700 mb-1 tracking-wide">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <UserCheck className="h-3 w-3 text-blue-400" />
                </div>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-7 pr-2 py-2 bg-blue-50/50 border border-blue-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 hover:border-blue-300 transition-all duration-300 font-medium text-xs backdrop-blur-sm"
                  placeholder="Choose a unique username"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1 tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <Mail className="h-3 w-3 text-blue-400" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-7 pr-2 py-2 bg-blue-50/50 border border-blue-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 hover:border-blue-300 transition-all duration-300 font-medium text-xs backdrop-blur-sm"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-700 mb-1 tracking-wide">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <Lock className="h-3 w-3 text-blue-400" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-7 pr-8 py-2 bg-blue-50/50 border border-blue-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 hover:border-blue-300 transition-all duration-300 font-medium text-xs backdrop-blur-sm"
                  placeholder="Create a strong password (min 6 chars)"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-2 flex items-center hover:bg-blue-50 rounded-r-lg transition-colors duration-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-3 w-3 text-blue-400 hover:text-blue-600 transition-colors" />
                  ) : (
                    <Eye className="h-3 w-3 text-blue-400 hover:text-blue-600 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-700 mb-1 tracking-wide">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <Lock className="h-3 w-3 text-blue-400" />
                </div>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-7 pr-8 py-2 bg-blue-50/50 border border-blue-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 hover:border-blue-300 transition-all duration-300 font-medium text-xs backdrop-blur-sm"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-2 flex items-center hover:bg-blue-50 rounded-r-lg transition-colors duration-200"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-3 w-3 text-blue-400 hover:text-blue-600 transition-colors" />
                  ) : (
                    <Eye className="h-3 w-3 text-blue-400 hover:text-blue-600 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 text-white font-bold py-2 px-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs tracking-wide shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="font-semibold text-xs">Creating your account...</span>
                  </div>
                ) : (
                  'Create AlgoBucks Account'
                )}
              </button>
            </div>
          </form>

          {/* Terms and Privacy */}
          <div className="mt-4 pt-3 border-t border-blue-200">
            <p className="text-xs text-gray-600 text-center leading-relaxed font-medium">
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