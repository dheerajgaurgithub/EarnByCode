import React, { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Toaster } from './components/ui/toaster';
import App from './App';
import { Provider } from 'react-redux';
import { store } from './store';
import { startSocketListeners } from '@/socketListener';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/authSlice';
import './index.css';
import { initializeRouteState, clearSavedRoute } from '@/store/routerSlice';

// Add global window type declaration
declare global {
  interface Window {
    resetAppState: () => void;
  }
}

// Component to handle route restoration
const RouteRestorer: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Initialize router state from localStorage
    try {
      dispatch(initializeRouteState());
    } catch (error) {
      console.error('RouteRestorer: Failed to initialize route state:', error);
      // Clear corrupted state
      dispatch(clearSavedRoute());
    }

    // Wait for authentication to complete before trying to restore routes
    if (!isLoading) {
      // Get saved route from Redux state
      const state = store.getState();
      const savedRoute = state.router.savedRoute;

      console.log('RouteRestorer: Auth loaded, checking route restoration', {
        isLoading,
        currentPath: location.pathname,
        savedRoute,
        user: user ? 'authenticated' : 'not authenticated',
        authState: {
          token: !!localStorage.getItem('token'),
          userId: user?.id,
          isLoading: state.auth.isLoading
        }
      });

      // If we're on the root path and there's a saved route, navigate to it
      // But don't restore auth routes if user is already authenticated
      if (location.pathname === '/' && savedRoute && savedRoute !== '/') {
        const authRoutes = ['/login', '/register', '/forgot-password'];
        const shouldRestore = !user || !authRoutes.some(route => savedRoute.startsWith(route));

        if (shouldRestore) {
          console.log('RouteRestorer: Restoring route to', savedRoute);

          // Validate that the saved route is a valid path
          const validRoutes = [
            '/problems', '/contests', '/leaderboard', '/discuss', '/submissions',
            '/settings', '/profile', '/wallet', '/admin', '/about', '/company',
            '/careers', '/press', '/contact', '/blog', '/community', '/help',
            '/notifications', '/chat'
          ];

          const isValidRoute = validRoutes.some(route =>
            savedRoute === route || savedRoute.startsWith(route + '/')
          ) || savedRoute.startsWith('/problems/') ||
              savedRoute.startsWith('/contests/') ||
              savedRoute.startsWith('/submissions/') ||
              savedRoute.startsWith('/chat/') ||
              savedRoute.startsWith('/u/');

          if (isValidRoute) {
            // Use setTimeout to avoid navigation during initial render
            setTimeout(() => {
              try {
                navigate(savedRoute, { replace: true });
                console.log('RouteRestorer: Successfully navigated to', savedRoute);
              } catch (error) {
                console.error('RouteRestorer: Failed to navigate to saved route:', error);
                // Clear the invalid saved route
                dispatch(clearSavedRoute());
                // If navigation fails, might be auth issue, try to reset auth state
                const errorMessage = error instanceof Error ? error.message : String(error);
                if (errorMessage.includes('auth') || errorMessage.includes('user')) {
                  console.log('RouteRestorer: Auth-related navigation error, clearing auth state');
                  localStorage.removeItem('token');
                  dispatch(logout());
                }
              }
            }, 100);
          } else {
            console.log('RouteRestorer: Invalid saved route, clearing:', savedRoute);
            dispatch(clearSavedRoute());
          }
        } else {
          console.log('RouteRestorer: Not restoring route - auth route or user authenticated');
        }
      } else {
        console.log('RouteRestorer: No route restoration needed');
      }
    } else {
      console.log('RouteRestorer: Waiting for authentication to complete...');
    }
  }, [dispatch, navigate, location.pathname, user, isLoading]);

  return null;
};

// Component to initialize socket listeners after Redux is available
const SocketInitializer: React.FC = () => {
  useEffect(() => {
    // Initialize socket listeners after Redux store is available
    startSocketListeners(store);
  }, []);

  return null;
};

// Add global reset function for debugging
window.resetAppState = () => {
  console.log('Resetting app state...');
  localStorage.clear();
  sessionStorage.clear();
  // Force page reload to clear all state
  window.location.href = '/';
};

// Add to console for debugging
console.log('🔧 App loaded. If you experience loading issues, run resetAppState() in console to clear all cached state.');

// Get the base URL from environment variables or use root
const basename = import.meta.env.BASE_URL || '/';

// Error Boundary Component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Routing Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-200">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Something went wrong</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">We're having trouble loading this page. Please try again later.</p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <ErrorBoundary>
        <ThemeProvider>
          <Provider store={store}>
            <AuthProvider>
              <SocketInitializer />
              <RouteRestorer />
              <App />
            </AuthProvider>
            {/* Vercel Speed Insights */}
            <SpeedInsights />
            <Toaster />
          </Provider>
        </ThemeProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>
);