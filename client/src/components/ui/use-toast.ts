import { toast as hotToast, ToastOptions } from 'react-hot-toast';
import * as React from 'react';

// Toast style configuration
const toastStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 500,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  maxWidth: '400px',
  width: 'auto',
  margin: '8px',
};

const successStyle: React.CSSProperties = {
  ...toastStyle,
  backgroundColor: '#10B981',
  color: 'white',
};

const errorStyle: React.CSSProperties = {
  ...toastStyle,
  backgroundColor: '#EF4444',
  color: 'white',
};

const loadingStyle: React.CSSProperties = {
  ...toastStyle,
  backgroundColor: '#3B82F6',
  color: 'white',
};

// ✅ Fixed: ToastOptions expects only real props, so we removed invalid defaults
const commonOptions: ToastOptions = {
  position: 'bottom-right',
  duration: 4000,
  ariaProps: {
    role: 'status',
    'aria-live': 'polite',
  },
};

// Extended options with custom fields
interface ToastContent {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  message?: string;
}

type ToastOptionsWithVariant = (ToastContent & Omit<ToastOptions, 'style'>) | string;

type ToastFunction = (options: string | ToastOptionsWithVariant) => string | undefined;

export const toast = {
  success: ((options: string | ToastOptionsWithVariant) => {
    if (typeof options === 'string') {
      return hotToast.success(options, {
        ...commonOptions,
        style: successStyle,
        iconTheme: {
          primary: '#10B981',
          secondary: '#fff',
        },
      });
    }

    const { title, description, message, ...restOptions } = options as ToastContent;
    const content = React.createElement(
      'div',
      null,
      title && React.createElement('div', { style: { fontWeight: 600 } }, title),
      description && React.createElement('div', { style: { fontSize: '0.875rem', opacity: 0.9 } }, description),
      !title && !description && message
    );

    return hotToast.success(content, {
      ...commonOptions,
      ...restOptions,
      style: successStyle,
      iconTheme: {
        primary: '#10B981',
        secondary: '#fff',
      },
    });
  }) as ToastFunction,

  error: ((options: string | ToastOptionsWithVariant) => {
    if (typeof options === 'string') {
      return hotToast.error(options, {
        ...commonOptions,
        style: errorStyle,
        iconTheme: {
          primary: '#EF4444',
          secondary: '#fff',
        },
      });
    }

    const { title, description, message, ...restOptions } = options as ToastContent;
    const content = React.createElement(
      'div',
      null,
      title && React.createElement('div', { style: { fontWeight: 600 } }, title),
      description && React.createElement('div', { style: { fontSize: '0.875rem', opacity: 0.9 } }, description),
      !title && !description && message
    );

    return hotToast.error(content, {
      ...commonOptions,
      ...restOptions,
      style: errorStyle,
      iconTheme: {
        primary: '#EF4444',
        secondary: '#fff',
      },
    });
  }) as ToastFunction,

  loading: ((message: string) => {
    return hotToast.loading(message, {
      ...commonOptions,
      style: loadingStyle,
      iconTheme: {
        primary: '#3B82F6',
        secondary: '#fff',
      },
    });
  }) as ToastFunction,

  dismiss: (toastId?: string) => hotToast.dismiss(toastId),
};

export const useToast = (): typeof toast => toast;
