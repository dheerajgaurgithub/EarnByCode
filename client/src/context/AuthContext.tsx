import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import config from '@/lib/config';

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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = async (silent: boolean = false) => {
    if (!silent) setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        return;
      }

      const response = await fetch(`${config.api.baseUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.status === 401) {
        // Token is invalid or expired
        localStorage.removeItem('token');
        setUser(null);
        return;
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to fetch user data');
      }

      const data = await response.json();
      // If backend reports blocked, sign out locally
      if (data?.user?.blocked) {
        localStorage.removeItem('token');
        setUser(null);
        return;
      }
      setUser(data.user);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // OTP-based email change removed; email updates happen via updateUser()

  // Permanently delete account
  const deleteAccount = async (): Promise<void> => {
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
    // Clear local session
    localStorage.removeItem('token');
    setUser(null);
  };

  const updatePreferences = async (prefs: { preferredCurrency?: 'USD' | 'EUR' | 'GBP' | 'INR'; preferences?: any }) => {
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
    if (data.user) setUser(prev => prev ? { ...prev, ...data.user } : data.user);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
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
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
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
          throw new Error(`Your account is blocked by admin.${reason}${until}`.trim());
        }
        throw new Error(errorBody?.message || 'Login failed');
      }

      const data = await response.json();
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      // Re-throw to allow UI to show specific error message (e.g., blocked)
      throw error instanceof Error ? error : new Error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
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
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updates: Partial<User>): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
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
        setUser(prev => prev ? { ...prev, ...data.user } : null);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Update user error:', error);
      throw error instanceof Error ? error : new Error('Failed to update profile');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const uploadAvatar = async (file: File): Promise<void> => {
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
    if (data.user) setUser(prev => prev ? { ...prev, ...data.user } : data.user);
  };

  const removeAvatar = async (): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`${config.api.baseUrl}/users/me/avatar`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to remove avatar');
    if (data.user) setUser(prev => prev ? { ...prev, ...data.user } : data.user);
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