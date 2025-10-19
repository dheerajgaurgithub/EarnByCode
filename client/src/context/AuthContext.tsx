import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import config from '@/lib/config';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import apiService from '@/services/api';
import {
  setUser,
  setLoading,
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
  setBlocked,
  setVerified,
  loginSuccess,
  registerSuccess,
  logout as logoutAction,
  authError,
  profileUpdateSuccess,
  avatarUploadSuccess,
  passwordChangeSuccess,
  accountDeletionSuccess,
  emailVerificationSuccess,
  passwordResetSuccess,
  clearErrors,
  updateUserProfile,
  updateUserPreferences,
  handleUserBlocked,
  handleUserUnblocked,
  initializeAuth,
} from '@/store/authSlice';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isLoading: boolean;
  refreshUser: (silent?: boolean) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
  updatePreferences: (prefs: { preferredCurrency?: 'USD' | 'EUR' | 'GBP' | 'INR'; preferences?: any }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();

  // Get auth state from Redux
  const reduxUser = useAppSelector((state) => state.auth.user);
  const reduxLoading = useAppSelector((state) => state.auth.isLoading);
  const reduxError = useAppSelector((state) => state.auth.error);
  const reduxLoggingIn = useAppSelector((state) => state.auth.isLoggingIn);
  const reduxRegistering = useAppSelector((state) => state.auth.isRegistering);
  const reduxUpdatingProfile = useAppSelector((state) => state.auth.isUpdatingProfile);
  const reduxUploadingAvatar = useAppSelector((state) => state.auth.isUploadingAvatar);
  const reduxChangingPassword = useAppSelector((state) => state.auth.isChangingPassword);
  const reduxDeletingAccount = useAppSelector((state) => state.auth.isDeletingAccount);
  const reduxToken = useAppSelector((state) => state.auth.token);
  const reduxIsBlocked = useAppSelector((state) => state.auth.isBlocked);

  // Local state for compatibility (will sync with Redux)
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoadingState] = useState(true);

  // Initialize Redux auth state on mount and refresh user data
  useEffect(() => {
    dispatch(initializeAuth());

    // After Redux initialization, refresh user data if token exists
    const token = localStorage.getItem('token');
    if (token) {
      // Small delay to ensure Redux state is updated first
      setTimeout(() => {
        refreshUser(true); // Silent refresh
      }, 100);
    } else {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  // Sync Redux state with local state for backward compatibility
  useEffect(() => {
    setUserState(reduxUser);
  }, [reduxUser]);

  useEffect(() => {
    setIsLoadingState(reduxLoading);
  }, [reduxLoading]);

  // Sync Redux loading states with local state
  useEffect(() => {
    if (reduxLoggingIn || reduxRegistering) {
      setIsLoadingState(true);
    }
  }, [reduxLoggingIn, reduxRegistering]);

  const refreshUser = async (silent: boolean = false) => {
    if (!silent) dispatch(setLoading(true));
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        dispatch(setUser(null));
        return;
      }

      // Use apiService to get current user
      const data = await apiService.getCurrentUser();

      // If backend reports blocked, sign out locally
      if (data?.isBlocked) {
        dispatch(handleUserBlocked({
          reason: data.blockReason,
          until: data.blockedUntil
        }));
        return;
      }

      dispatch(setUser(data));
      dispatch(updateLastActivity());
      dispatch(setSessionExpiry(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())); // 24 hours
    } catch (error) {
      console.error('Failed to refresh user:', error);
      dispatch(logoutAction());
    } finally {
      if (!silent) dispatch(setLoading(false));
    }
  };

  // Permanently delete account
  const deleteAccount = async (): Promise<void> => {
    dispatch(setDeletingAccount(true));
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${config.api.baseUrl}/users/me`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to delete account');
      }

      // Dispatch Redux action
      dispatch(accountDeletionSuccess());
    } catch (error) {
      dispatch(authError(error instanceof Error ? error.message : 'Failed to delete account'));
      throw error;
    } finally {
      dispatch(setDeletingAccount(false));
    }
  };

  const updatePreferences = async (prefs: { preferredCurrency?: 'USD' | 'EUR' | 'GBP' | 'INR'; preferences?: any }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${config.api.baseUrl}/users/me/preferences`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(prefs),
        credentials: 'include'
      });
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update preferences');

      if (data.user) {
        dispatch(updateUserProfile(data.user));
      }
    } catch (error) {
      dispatch(authError(error instanceof Error ? error.message : 'Failed to update preferences'));
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    dispatch(setChangingPassword(true));
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${config.api.baseUrl}/users/me/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: 'include'
      });
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update password');

      dispatch(passwordChangeSuccess());
    } catch (error) {
      dispatch(authError(error instanceof Error ? error.message : 'Failed to update password'));
      throw error;
    } finally {
      dispatch(setChangingPassword(false));
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch(setLoggingIn(true));
    dispatch(clearErrors());

    try {
      const response = await fetch(`${config.api.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      if (!response.ok) {
        let errorBody: any = {};
        try { errorBody = await response.json(); } catch {}
        if (response.status === 403 && (errorBody?.blocked || errorBody?.message)) {
          const reason = errorBody?.reason ? ` Reason: ${errorBody.reason}.` : '';
          const until = errorBody?.blockedUntil ? ` Until: ${new Date(errorBody.blockedUntil).toLocaleString()}.` : '';
          dispatch(handleUserBlocked({
            reason: errorBody.reason,
            until: errorBody.blockedUntil
          }));
          throw new Error(`Your account is blocked by admin.${reason}${until}`.trim());
        }
        throw new Error(errorBody?.message || 'Login failed');
      }

      const data = await response.json();

      if (data.token) {
        // Dispatch Redux actions
        dispatch(loginSuccess({ user: data.user, token: data.token }));
        dispatch(updateLastActivity());
        dispatch(setSessionExpiry(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      dispatch(authError(error instanceof Error ? error.message : 'Login failed'));
      // Re-throw to allow UI to show specific error message (e.g., blocked)
      throw error instanceof Error ? error : new Error('Login failed');
    } finally {
      dispatch(setLoggingIn(false));
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    dispatch(setRegistering(true));
    dispatch(clearErrors());

    try {
      const response = await fetch(`${config.api.baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Registration failed');
      }

      const data = await response.json();

      if (data.token) {
        // Dispatch Redux actions
        dispatch(registerSuccess({ user: data.user, token: data.token }));
        dispatch(updateLastActivity());
        dispatch(setSessionExpiry(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Registration error:', error);
      dispatch(authError(error instanceof Error ? error.message : 'Registration failed'));
      return false;
    } finally {
      dispatch(setRegistering(false));
    }
  };

  const updateUser = async (updates: Partial<User>): Promise<void> => {
    dispatch(setUpdatingProfile(true));
    dispatch(clearErrors());

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${config.api.baseUrl}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      if (data.success && data.user) {
        dispatch(profileUpdateSuccess(data.user));
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Update user error:', error);
      dispatch(authError(error instanceof Error ? error.message : 'Failed to update profile'));
      throw error instanceof Error ? error : new Error('Failed to update profile');
    } finally {
      dispatch(setUpdatingProfile(false));
    }
  };

  const logout = () => {
    dispatch(logoutAction());
  };

  const uploadAvatar = async (file: File): Promise<void> => {
    dispatch(setUploadingAvatar(true));
    dispatch(clearErrors());

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const form = new FormData();
      form.append('avatar', file);

      const res = await fetch(`${config.api.baseUrl}/users/me/avatar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form,
        credentials: 'include'
      });
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to upload avatar');

      if (data.user) {
        dispatch(avatarUploadSuccess(data.user));
      }
    } catch (error) {
      dispatch(authError(error instanceof Error ? error.message : 'Failed to upload avatar'));
      throw error;
    } finally {
      dispatch(setUploadingAvatar(false));
    }
  };

  const removeAvatar = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${config.api.baseUrl}/users/me/avatar`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      });
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to remove avatar');

      if (data.user) {
        dispatch(updateUserProfile(data.user));
      }
    } catch (error) {
      dispatch(authError(error instanceof Error ? error.message : 'Failed to remove avatar'));
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      updateUser,
      isLoading,
      refreshUser,
      uploadAvatar,
      removeAvatar,
      updatePreferences,
      changePassword,
      deleteAccount
    }}>
      {children}
    </AuthContext.Provider>
  );
};