import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Toaster } from './components/ui/toaster';
import App from './App';
import './index.css';

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

// Initialize the application with providers
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <App />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>
);