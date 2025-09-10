import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = Exclude<Theme, 'system'>;

type ThemeContextType = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDarkMode: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Get system color scheme preference
const getSystemTheme = (): ResolvedTheme => {
  if (!isBrowser) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Get saved theme from localStorage or system preference
const getInitialTheme = (): Theme => {
  if (!isBrowser) return 'system';
  
  const savedTheme = localStorage.getItem('theme') as Theme | null;
  return savedTheme || 'system';
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [mounted, setMounted] = useState(false);

  // Resolve the actual theme to apply (handles 'system' theme)
  const resolveTheme = useCallback((theme: Theme): ResolvedTheme => {
    return theme === 'system' ? getSystemTheme() : theme;
  }, []);

  // Initialize theme
  useEffect(() => {
    const initialTheme = getInitialTheme();
    setThemeState(initialTheme);
    setResolvedTheme(resolveTheme(initialTheme));
    setMounted(true);
  }, [resolveTheme]);

  // Handle system theme changes
  useEffect(() => {
    if (theme !== 'system' || !isBrowser) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      const newResolvedTheme = resolveTheme('system');
      setResolvedTheme(newResolvedTheme);
      updateDocumentTheme(newResolvedTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, resolveTheme]);

  // Update document theme class and save to localStorage
  const updateDocumentTheme = useCallback((theme: ResolvedTheme) => {
    if (!isBrowser) return;
    
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Update meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute(
        'content',
        theme === 'dark' ? '#0F172A' : '#FFFFFF'
      );
    }
  }, []);

  // Apply theme changes
  useEffect(() => {
    if (!mounted) return;
    
    const newResolvedTheme = resolveTheme(theme);
    setResolvedTheme(newResolvedTheme);
    updateDocumentTheme(newResolvedTheme);
    
    // Save to localStorage if not in SSR
    if (isBrowser) {
      try {
        localStorage.setItem('theme', theme);
      } catch (e) {
        console.warn('Failed to save theme preference:', e);
      }
    }
  }, [theme, mounted, resolveTheme, updateDocumentTheme]);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      if (prev === 'system') return 'dark';
      if (prev === 'dark') return 'light';
      return 'system';
    });
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  // Don't render anything until we know the theme to prevent flash of wrong theme
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        resolvedTheme,
        toggleTheme, 
        setTheme,
        isDarkMode: resolvedTheme === 'dark'
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper hook to get the current theme
// Use this when you need to conditionally render based on theme
// but want to avoid hydration mismatches
export const useThemeWithSsr = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    return {
      theme: 'light',
      resolvedTheme: 'light',
      isDarkMode: false,
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return context;
};
