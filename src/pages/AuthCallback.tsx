import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../components/ui/use-toast';
import { useAuth } from '../context/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Parse the URL hash to get the access token
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        
        if (!accessToken) {
          throw new Error('No access token found');
        }

        // Store the token
        localStorage.setItem('token', accessToken);
        
        // Refresh user data
        await refreshUser();

        // Redirect to the intended URL or home
        const state = params.get('state');
        let redirectTo = '/';
        
        if (state) {
          try {
            const parsedState = JSON.parse(decodeURIComponent(state));
            if (parsedState.redirectTo) {
              redirectTo = parsedState.redirectTo;
            }
          } catch (e) {
            console.error('Error parsing state:', e);
          }
        }

        // Clear the URL hash
        window.history.replaceState({}, document.title, window.location.pathname);

        // Redirect to the intended page
        navigate(redirectTo);
        
      } catch (error) {
        console.error('Authentication error:', error);
        // Use toast.error instead of toast with variant
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
