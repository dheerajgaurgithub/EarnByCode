/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: {
          DEFAULT: '#3B82F6',
          light: '#60A5FA',
          dark: '#2563EB',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        // Secondary colors
        secondary: {
          DEFAULT: '#8B5CF6',
          light: '#A78BFA',
          dark: '#7C3AED',
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        // Background colors
        background: {
          light: '#FFFFFF',
          dark: '#0F172A',
          DEFAULT: 'var(--background)'
        },
        // Surface/container colors
        surface: {
          light: '#F8FAFC',
          dark: '#1E293B',
          DEFAULT: 'var(--surface)'
        },
        // Text colors
        text: {
          primary: {
            light: '#1E293B',
            dark: '#F1F5F9',
            DEFAULT: 'var(--text-primary)'
          },
          secondary: {
            light: '#64748B',
            dark: '#94A3B8',
            DEFAULT: 'var(--text-secondary)'
          },
        },
        // Error colors
        error: {
          light: '#FEE2E2',
          dark: '#B91C1C',
          DEFAULT: 'var(--error)'
        },
        // Success colors
        success: {
          light: '#D1FAE5',
          dark: '#065F46',
          DEFAULT: 'var(--success)'
        },
        // Warning colors
        warning: {
          light: '#FEF3C7',
          dark: '#92400E',
          DEFAULT: 'var(--warning)'
        },
      },
      // Add CSS variables for theming
      backgroundColor: {
        primary: 'var(--background)',
        secondary: 'var(--surface)'
      },
      textColor: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)'
      },
      // Add custom animations
      animation: {
        'fade-in': 'fadeIn 200ms ease-in-out',
        'slide-up': 'slideUp 200ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    function({ addBase, theme }) {
      // Add CSS variables for light theme
      addBase({
        ':root': {
          '--background': theme('colors.background.light'),
          '--surface': theme('colors.surface.light'),
          '--text-primary': theme('colors.text.primary.light'),
          '--text-secondary': theme('colors.text.secondary.light'),
          '--error': theme('colors.error.light'),
          '--success': theme('colors.success.light'),
          '--warning': theme('colors.warning.light'),
        },
        // Dark theme overrides
        '.dark': {
          '--background': theme('colors.background.dark'),
          '--surface': theme('colors.surface.dark'),
          '--text-primary': theme('colors.text.primary.dark'),
          '--text-secondary': theme('colors.text.secondary.dark'),
          '--error': theme('colors.error.dark'),
          '--success': theme('colors.success.dark'),
          '--warning': theme('colors.warning.dark'),
        },
      });
    },
  ],
};
