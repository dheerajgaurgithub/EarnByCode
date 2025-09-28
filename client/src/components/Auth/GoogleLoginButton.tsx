import React from 'react';
import { FcGoogle } from 'react-icons/fc';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

interface GoogleLoginButtonProps {
  isRegister?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function GoogleLoginButton({ isRegister = false, onSuccess, onError }: GoogleLoginButtonProps) {
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    try {
      // Get the current path for redirect after login
      const currentPath = window.location.pathname;
      const action = isRegister ? 'signup' : 'login';
      // Construct the OAuth URL without duplicating /api
      const oauthUrl = API_URL.endsWith('/api') 
        ? `${API_URL}/oauth/google`
        : `${API_URL}/api/oauth/google`;
      
      // Redirect to backend OAuth endpoint with redirect path
      window.location.href = `${oauthUrl}?redirectTo=${encodeURIComponent(currentPath)}&action=${encodeURIComponent(action)}`;
    } catch (error: any) {
      console.error('Error initiating Google OAuth:', error);
      const errorMessage = 'Failed to initiate Google login';
      toast.error(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      className="w-full bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/20 hover:border-white/30 text-white font-semibold py-4 sm:py-5 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 backdrop-blur-sm group"
    >
      <div className="flex items-center justify-center w-6 h-6 bg-white rounded-full group-hover:scale-110 transition-transform duration-200">
        <FcGoogle className="w-5 h-5" />
      </div>
      <span className="text-base sm:text-lg tracking-wide">
        {isRegister ? 'Continue with Google' : 'Sign in with Google'}
      </span>
    </button>
  );
}

// Export as default for backward compatibility
export default GoogleLoginButton;