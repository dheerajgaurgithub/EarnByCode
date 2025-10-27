import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import { useTheme } from '@/context/ThemeContext';
import { I18nProvider } from '@/context/I18nContext';
import { useAppDispatch } from '@/store/hooks';
import { setCurrentRoute } from '@/store/routerSlice';
// Import types
import { Header } from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import ChatbotWidget from './components/ChatbotWidget';
import Home from './pages/Home';
import { Problems } from './pages/Problems';
import { Contests } from './pages/Contests';
import ContestProblemDetails from './pages/ContestProblemDetails';
import ContestResults from './pages/ContestResults';
const Wallet = React.lazy(() => import('./app/wallet/page'));
const Profile = React.lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const ProblemDetail = React.lazy(() => import('./pages/ProblemDetail'));
const AdminPanel = React.lazy(() => import('./pages/Admin/AdminPanel'));
import WalletDashboard from './pages/Admin/WalletDashboard';
const Leaderboard = React.lazy(() => import('./pages/Leaderboard').then(m => ({ default: m.Leaderboard })));
const Discuss = React.lazy(() => import('./pages/Discuss'));
import { Submissions } from './pages/Submissions';
import SubmissionDetail from './pages/SubmissionDetail';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import ForgotPasswordRequest from './pages/Auth/ForgotPasswordRequest';
import ForgotPasswordOtp from './pages/Auth/ForgotPasswordOtp';
import ForgotPasswordReset from './pages/Auth/ForgotPasswordReset';
import { Settings } from './pages/Settings';
import About from './pages/About';
import Company from './pages/Company';
import Careers from './pages/Careers';
import Press from './pages/Press';
import Contact from './pages/Contact';
const Blog = React.lazy(() => import('./pages/Blog'));
const Community = React.lazy(() => import('./pages/Community'));
const HelpCenter = React.lazy(() => import('./pages/HelpCenter'));
const JobDetail = React.lazy(() => import('./pages/JobDetail'));
import EmailVerified from './pages/EmailVerified.tsx';
import VerifyCheck from './pages/VerifyCheck';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import TermsOfService from './pages/legal/TermsOfService';
import CookiesPolicy from './pages/legal/CookiesPolicy';
import AuthCallback from './pages/AuthCallback';
import { TestConnectionPage } from './pages/TestConnectionPage';
import PublicProfile from './pages/PublicProfile';
import Welcome from './pages/Welcome';
import Notifications from './pages/Notifications';
const ContestPage = React.lazy(() => import('./pages/ContestPage'));
import ChatListPage from './pages/ChatListPage';
import ChatThreadPage from './pages/ChatThreadPage';

// Route tracking component
const RouteTracker = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();

  useEffect(() => {
    // Update router state when location changes
    dispatch(setCurrentRoute({
      path: location.pathname,
      search: location.search,
      hash: location.hash,
    }));
  }, [dispatch, location]);

  return null;
};

// Sync theme with user preferences globally (auto->system)
const ThemeSync = () => {
  const { user } = useAuth();
  const { setTheme } = useTheme();
  React.useEffect(() => {
    const pref = (user as any)?.preferences?.theme as 'light' | 'dark' | 'auto' | undefined;
    if (!pref) return; // ThemeProvider already restores last theme from localStorage
    const ui = pref === 'auto' ? 'system' : pref;
    try { setTheme(ui as any); } catch {}
  }, [user]);
  return null;
};

// Protected route component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading only if we're actually loading (not just checking existing auth state)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Public route component
const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (user && (location.pathname === '/login' || location.pathname === '/register')) {
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return children;
};

// Admin route component
const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has admin privileges (either role === 'admin' or isAdmin === true)
  const isAdmin = user.role === 'admin' || user.isAdmin === true;
  
  if (!isAdmin) {
    console.log('User is not an admin, redirecting to home');
    console.log('User object:', user);
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const location = useLocation();
  const pathname = location.pathname;
  // theme is managed via ThemeSync and CSS class; no need to read here
  
  // Footer visibility logic
  const footerHiddenPrefixes = ['/problems', '/contests'];
  const footerHiddenExact = ['/leaderboard', '/discuss', '/wallet', '/profile', '/submissions', '/settings', '/admin'];
  const hideFooter =
    footerHiddenPrefixes.some((p) => pathname.startsWith(p)) ||
    footerHiddenExact.includes(pathname);

  // Header visibility logic
  const headerHiddenPrefixes = ['/submissions/'];
  const headerHiddenExact = ['/submissions'];
  const hideHeader =
    headerHiddenPrefixes.some((p) => pathname.startsWith(p)) ||
    headerHiddenExact.includes(pathname);

  // Show chatbot widget on all pages except problem details and contest pages
  const chatbotHiddenPrefixes = ['/problems/', '/contests/'];
  const hideChatbot = chatbotHiddenPrefixes.some((p) => pathname.startsWith(p))
    || pathname === '/contests';

  // Enhanced toast configuration with better dark mode support
  const getToastOptions = () => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    return {
      duration: 4000,
      style: {
        background: isDarkMode ? '#1F2937' : '#FFFFFF',
        color: isDarkMode ? '#FFFFFF' : '#1F2937',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: isDarkMode 
          ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
          : '0 4px 12px rgba(0, 0, 0, 0.15)',
        maxWidth: '400px',
        margin: '8px',
        border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB',
      },
      success: { 
        style: { 
          background: '#10B981',
          color: '#FFFFFF'
        } 
      },
      error: { 
        style: { 
          background: '#EF4444',
          color: '#FFFFFF'
        } 
      },
      loading: { 
        style: { 
          background: '#3B82F6',
          color: '#FFFFFF'
        } 
      },
    };
  };

  const { user } = useAuth();
  return (
    <WalletProvider>
      <I18nProvider initialLang={(user?.preferences?.language as any) || 'en'}>
      <ThemeSync />
      <RouteTracker />
      <div className="min-h-screen flex flex-col transition-colors duration-200">
        {/* Reserve space for toasts (fixed placeholder to avoid any potential reflow) */}
        <div
          aria-hidden
          className="fixed bottom-2 right-2 w-[360px] h-[64px] pointer-events-none z-40"
        />
        <Toaster
          position="bottom-right"
          toastOptions={getToastOptions()}
        />
        
        {/* Main app container with enhanced dark mode classes */}
        <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
          {!hideHeader && <Header />}
          
          <main className="flex-grow">
            <Routes>
              {/* Auth routes */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                }
              />
              {/* Register OTP flow removed; Forgot Password remains */}
              <Route
                  path="/forgot-password"
                  element={
                    <PublicRoute>
                      <ForgotPasswordRequest />
                    </PublicRoute>
                  }
                />
              <Route
                  path="/forgot-password/otp"
                  element={
                    <PublicRoute>
                      <ForgotPasswordOtp />
                    </PublicRoute>
                  }
                />
              <Route
                  path="/forgot-password/reset"
                  element={
                    <PublicRoute>
                      <ForgotPasswordReset />
                    </PublicRoute>
                  }
                />

              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/company" element={<Company />} />
              <Route path="/careers" element={<Careers />} />
              <Route 
                path="/jobs/:id" 
                element={
                  <Suspense fallback={
                    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
                    </div>
                  }>
                    <JobDetail />
                  </Suspense>
                } 
              />
              <Route path="/press" element={<Press />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/blog" element={<Blog />} />
              <Route 
                path="/community" 
                element={
                  <Suspense fallback={
                    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
                    </div>
                  }>
                    <Community />
                  </Suspense>
                } 
              />
              <Route 
                path="/help" 
                element={
                  <Suspense fallback={
                    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
                    </div>
                  }>
                    <HelpCenter />
                  </Suspense>
                } 
              />
              <Route path="/verify/check" element={<VerifyCheck />} />
              <Route path="/verify/success" element={<EmailVerified />} />
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/cookie-policy" element={<CookiesPolicy />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/test-connection" element={<TestConnectionPage />} />
              <Route path="/u/:username" element={<PublicProfile />} />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />

              {/* Public problem routes */}
              <Route path="/problems" element={<Problems />} />
              <Route 
                path="/problems/:id" 
                element={
                  <Suspense fallback={
                    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
                    </div>
                  }>
                    <ProblemDetail />
                  </Suspense>
                } 
              />
              <Route path="/contests" element={<Contests />} />
              <Route
                path="/contests/:contestId/problems/:problemId"
                element={
                  <ProtectedRoute>
                    <ContestProblemDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contests/:contestId/results"
                element={
                  <ProtectedRoute>
                    <ContestResults />
                  </ProtectedRoute>
                }
              />
              
              <Route 
                path="/contests/:contestId"
                element={
                  <Suspense fallback={
                    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
                    </div>
                  }>
                    <ProtectedRoute>
                      <ContestPage />
                    </ProtectedRoute>
                  </Suspense>
                }
              />

              {/* Protected routes */}
              <Route
                path="/wallet"
                element={
                  <ProtectedRoute>
                    <Wallet />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <Suspense fallback={
                    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
                    </div>
                  }>
                    <AdminRoute>
                      <AdminPanel />
                    </AdminRoute>
                  </Suspense>
                }
              />
              <Route
                path="/admin/wallet"
                element={
                  <AdminRoute>
                    <WalletDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute>
                    <Leaderboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/discuss"
                element={
                  <ProtectedRoute>
                    <Discuss />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/submissions"
                element={
                  <ProtectedRoute>
                    <Submissions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/submissions/:id"
                element={
                  <ProtectedRoute>
                    <SubmissionDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />

              {/* Chat routes */}
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <ChatListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat/:threadId"
                element={
                  <ProtectedRoute>
                    <ChatThreadPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          
          {!hideFooter && <Footer />}
          {!hideChatbot && <ChatbotWidget />}
        </div>
      </div>
      </I18nProvider>
    </WalletProvider>
  );
}

export default App;