import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../components/ui/use-toast';
import { useAuth } from '../context/AuthContext';
import config from '@/lib/config';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Parse the URL hash to get the token and optional next path
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const token = params.get('token');
        const next = params.get('next');
        const welcome = params.get('welcome');

        if (!token) {
          throw new Error('No token found');
        }

        // Store the token
        localStorage.setItem('token', token);

        // Confirm verification on backend (works for welcome link and direct returns)
        try {
          await fetch(`${config.api.baseUrl}/auth/verify`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });
        } catch {}

        // Refresh user data
        await refreshUser();

        // Clear the URL hash
        window.history.replaceState({}, document.title, window.location.pathname);

        // Redirect to the intended page (if provided) or home
        const redirectTo = next ? decodeURIComponent(next) : '/';
        if (welcome === '1') {
          try {
            toast.success('Your email has been verified. Welcome to EarnByCode!');
          } catch {}
        }
        navigate(redirectTo);
      } catch (error) {
        console.error('Authentication error:', error);
        toast.error('There was an error during authentication. Please try again.');
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-700">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
