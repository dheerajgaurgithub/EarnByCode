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
import { initializeRouteState, clearSavedRoute } from '@/store/routerSlice';
import './index.css';

// Component to handle route restoration
const RouteRestorer = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Initialize router state from localStorage
    dispatch(initializeRouteState());

    // Wait for authentication to complete before trying to restore routes
    if (!isLoading) {
      // Get saved route from Redux state
      const savedRoute = store.getState().router.savedRoute;

      console.log('RouteRestorer: Auth loaded, checking route restoration', {
        isLoading,
        currentPath: location.pathname,
        savedRoute,
        user: user ? 'authenticated' : 'not authenticated'
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
            '/careers', '/press', '/contact', '/blog', '/community', '/help'
          ];

          const isValidRoute = validRoutes.some(route =>
            savedRoute === route || savedRoute.startsWith(route + '/')
          );

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
const SocketInitializer = () => {
  useEffect(() => {
    // Initialize socket listeners after Redux store is available
    startSocketListeners(store);
  }, []);

  return null;
};

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