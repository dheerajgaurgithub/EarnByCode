import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@/types';

export interface AuthState {
  // Authentication status
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;

  // Authentication errors
  error: string | null;

  // Login/register state
  isLoggingIn: boolean;
  isRegistering: boolean;

  // Profile update state
  isUpdatingProfile: boolean;
  isUploadingAvatar: boolean;
  isChangingPassword: boolean;

  // Account management
  isDeletingAccount: boolean;

  // Token management
  token: string | null;

  // Session management
  lastActivity: string | null;
  sessionExpiry: string | null;

  // Authentication preferences
  rememberMe: boolean;
  stayLoggedIn: boolean;

  // Security state
  isBlocked: boolean;
  blockReason?: string;
  blockedUntil?: string | Date;

  // Verification state
  isVerified: boolean;
  emailVerificationSent: boolean;

  // Recovery state
  passwordResetSent: boolean;
  passwordResetToken: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,
  isLoggingIn: false,
  isRegistering: false,
  isUpdatingProfile: false,
  isUploadingAvatar: false,
  isChangingPassword: false,
  isDeletingAccount: false,
  token: null,
  lastActivity: null,
  sessionExpiry: null,
  rememberMe: false,
  stayLoggedIn: false,
  isBlocked: false,
  isVerified: false,
  emailVerificationSent: false,
  passwordResetSent: false,
  passwordResetToken: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Authentication state management
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      if (action.payload) {
        state.isVerified = action.payload.isVerified || false;
        state.isBlocked = action.payload.isBlocked || false;
        state.blockReason = action.payload.blockReason;
        state.blockedUntil = action.payload.blockedUntil;
      } else {
        state.isVerified = false;
        state.isBlocked = false;
        state.blockReason = undefined;
        state.blockedUntil = undefined;
      }
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Login/Register actions
    setLoggingIn: (state, action: PayloadAction<boolean>) => {
      state.isLoggingIn = action.payload;
      if (action.payload) {
        state.error = null; // Clear errors when starting login
      }
    },

    setRegistering: (state, action: PayloadAction<boolean>) => {
      state.isRegistering = action.payload;
      if (action.payload) {
        state.error = null; // Clear errors when starting registration
      }
    },

    // Profile update actions
    setUpdatingProfile: (state, action: PayloadAction<boolean>) => {
      state.isUpdatingProfile = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },

    setUploadingAvatar: (state, action: PayloadAction<boolean>) => {
      state.isUploadingAvatar = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },

    setChangingPassword: (state, action: PayloadAction<boolean>) => {
      state.isChangingPassword = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },

    setDeletingAccount: (state, action: PayloadAction<boolean>) => {
      state.isDeletingAccount = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },

    // Token management
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
      // Update localStorage when token changes
      if (action.payload) {
        localStorage.setItem('token', action.payload);
      } else {
        localStorage.removeItem('token');
      }
    },

    // Session management
    updateLastActivity: (state) => {
      state.lastActivity = new Date().toISOString();
    },

    setSessionExpiry: (state, action: PayloadAction<string | null>) => {
      state.sessionExpiry = action.payload;
    },

    // Authentication preferences
    setRememberMe: (state, action: PayloadAction<boolean>) => {
      state.rememberMe = action.payload;
    },

    setStayLoggedIn: (state, action: PayloadAction<boolean>) => {
      state.stayLoggedIn = action.payload;
    },

    // Security state
    setBlocked: (state, action: PayloadAction<{ blocked: boolean; reason?: string; until?: string | Date }>) => {
      state.isBlocked = action.payload.blocked;
      state.blockReason = action.payload.reason;
      state.blockedUntil = action.payload.until;
    },

    setVerified: (state, action: PayloadAction<boolean>) => {
      state.isVerified = action.payload;
      if (state.user) {
        state.user.isVerified = action.payload;
      }
    },

    // Recovery state
    setEmailVerificationSent: (state, action: PayloadAction<boolean>) => {
      state.emailVerificationSent = action.payload;
    },

    setPasswordResetSent: (state, action: PayloadAction<boolean>) => {
      state.passwordResetSent = action.payload;
    },

    setPasswordResetToken: (state, action: PayloadAction<string | null>) => {
      state.passwordResetToken = action.payload;
    },

    // User profile updates
    updateUserProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },

    updateUserPreferences: (state, action: PayloadAction<Partial<User['preferences']>>) => {
      if (state.user?.preferences) {
        state.user.preferences = { ...state.user.preferences, ...action.payload };
      } else if (state.user) {
        state.user.preferences = action.payload;
      }
    },

    // Complete auth state reset (logout)
    resetAuthState: (state) => {
      return {
        ...initialState,
        isLoading: false, // Don't show loading after logout
      };
    },

    // Initialize auth state from localStorage
    initializeAuth: (state) => {
      const token = localStorage.getItem('token');
      if (token) {
        state.token = token;
        state.isAuthenticated = true;
        // Note: User data will be fetched by AuthContext refreshUser function
      }
    },

    // Handle successful login
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
      state.isLoggingIn = false;
      state.lastActivity = new Date().toISOString();

      // Update localStorage
      localStorage.setItem('token', action.payload.token);
    },

    // Handle successful registration
    registerSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
      state.isRegistering = false;
      state.lastActivity = new Date().toISOString();

      // Update localStorage
      localStorage.setItem('token', action.payload.token);
    },

    // Handle logout
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      state.lastActivity = null;
      state.sessionExpiry = null;

      // Clear localStorage
      localStorage.removeItem('token');
    },

    // Handle authentication errors
    authError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
      state.isLoggingIn = false;
      state.isRegistering = false;
      state.isUpdatingProfile = false;
      state.isUploadingAvatar = false;
      state.isChangingPassword = false;
      state.isDeletingAccount = false;
    },

    // Handle successful profile update
    profileUpdateSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.error = null;
      state.isUpdatingProfile = false;
    },

    // Handle successful avatar upload
    avatarUploadSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.error = null;
      state.isUploadingAvatar = false;
    },

    // Handle successful password change
    passwordChangeSuccess: (state) => {
      state.error = null;
      state.isChangingPassword = false;
    },

    // Handle successful account deletion
    accountDeletionSuccess: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isDeletingAccount = false;
      state.lastActivity = null;
      state.sessionExpiry = null;

      // Clear localStorage
      localStorage.removeItem('token');
    },

    // Handle successful email verification
    emailVerificationSuccess: (state) => {
      state.emailVerificationSent = true;
      state.error = null;
    },

    // Handle successful password reset request
    passwordResetSuccess: (state, action: PayloadAction<string>) => {
      state.passwordResetSent = true;
      state.passwordResetToken = action.payload;
      state.error = null;
    },

    // Clear all error states
    clearErrors: (state) => {
      state.error = null;
    },

    // Update session expiry based on token
    updateSessionExpiry: (state) => {
      if (state.token) {
        // Set session expiry to 24 hours from now (can be customized)
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 24);
        state.sessionExpiry = expiry.toISOString();
      }
    },

    // Handle user blocking
    handleUserBlocked: (state, action: PayloadAction<{ reason?: string; until?: string | Date }>) => {
      state.isBlocked = true;
      state.blockReason = action.payload.reason;
      state.blockedUntil = action.payload.until;
      state.isAuthenticated = false;

      // Clear token if user is blocked
      state.token = null;
      localStorage.removeItem('token');
    },

    // Handle user unblocking
    handleUserUnblocked: (state) => {
      state.isBlocked = false;
      state.blockReason = undefined;
      state.blockedUntil = undefined;
    },
  },
});

export const {
  setAuthenticated,
  setLoading,
  setUser,
  setError,
  setLoggingIn,
  setRegistering,
  setUpdatingProfile,
  setUploadingAvatar,
  setChangingPassword,
  setDeletingAccount,
  setToken,
  updateLastActivity,
  setSessionExpiry,
  setRememberMe,
  setStayLoggedIn,
  setBlocked,
  setVerified,
  setEmailVerificationSent,
  setPasswordResetSent,
  setPasswordResetToken,
  updateUserProfile,
  updateUserPreferences,
  resetAuthState,
  initializeAuth,
  loginSuccess,
  registerSuccess,
  logout,
  authError,
  profileUpdateSuccess,
  avatarUploadSuccess,
  passwordChangeSuccess,
  accountDeletionSuccess,
  emailVerificationSuccess,
  passwordResetSuccess,
  clearErrors,
  updateSessionExpiry,
  handleUserBlocked,
  handleUserUnblocked,
} = authSlice.actions;

export const authReducer = authSlice.reducer;
