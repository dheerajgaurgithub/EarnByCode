import React, { useEffect, useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/ui/use-toast';
import { Button } from '../../components/ui/button';

interface GoogleOAuthButtonProps {
  isRegister?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  buttonText?: string;
}

const GoogleOAuthButton: React.FC<GoogleOAuthButtonProps> = ({ 
  isRegister = false, 
  onSuccess, 
  onError,
  className = '',
  buttonText = 'Continue with Google'
}) => {
  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
  const oauthUrl = API_URL.endsWith('/api') 
    ? `${API_URL}/oauth/google`
    : `${API_URL}/api/oauth/google`;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    const handleOAuthSuccess = async (authToken: string) => {
      try {
        setIsLoading(true);
        
        if (!authToken) {
          throw new Error('No authentication token received');
        }

        // Store the token
        localStorage.setItem('token', authToken);
        
        // The auth context will automatically fetch the user data
        // when the token is present in localStorage
        
        // Clean up URL
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        }
        
        // Show success message
        toast.success(isRegister ? 'Registration successful!' : 'Login successful!');
        
        // Redirect to home or intended page
        const redirectTo = localStorage.getItem('redirectAfterLogin') || '/';
        localStorage.removeItem('redirectAfterLogin');
        
        setTimeout(() => {
          navigate(redirectTo);
        }, 1000);
      } catch (err) {
        console.error('Error during OAuth success handling:', err);
        const errorMessage = 'Failed to complete authentication';
        if (onError) {
          onError(errorMessage);
        } else {
          toast.error(errorMessage);
          navigate(isRegister ? '/register' : '/login', { 
            state: { error: errorMessage } 
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      handleOAuthSuccess(token);
    } else if (error) {
      console.error('OAuth error:', error);
      const errorMessage = decodeURIComponent(error) || 'Authentication failed';
      if (onError) {
        onError(errorMessage);
      } else {
        toast.error(errorMessage);
      }
    }
  }, [navigate, isRegister, onSuccess, onError]);

  if (user) {
    return null; // Don't show the button if user is already logged in
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoading) {
      e.preventDefault();
      return;
    }
    
    setIsLoading(true);
    
    // Store the current path for redirect after login
    const currentPath = window.location.pathname + window.location.search;
    if (currentPath !== '/login' && currentPath !== '/register') {
      localStorage.setItem('redirectAfterLogin', currentPath);
    }
    // Build query with redirectTo and action for backend to form state
    const action = isRegister ? 'signup' : 'login';
    window.location.href = `${oauthUrl}?redirectTo=${encodeURIComponent(currentPath)}&action=${encodeURIComponent(action)}`;
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={isLoading}
      className={`w-full ${className}`}
    >
      <FcGoogle className="w-5 h-5 mr-2" />
      {isLoading ? 'Processing...' : buttonText}
    </Button>
  );
};

export default GoogleOAuthButton;
