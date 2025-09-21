import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export type ApiResponse<T = any> = {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: AxiosRequestConfig;
};

import config from './config';

const api: AxiosInstance = axios.create({
  baseURL: config.api.baseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Application': `${config.app.name}/${config.app.version}`,
  },
  timeout: config.api.timeout,
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    // Skip logging for certain endpoints to reduce noise
    const skipLogging = ['/auth/refresh', '/auth/check'];
    const shouldLog = !skipLogging.some(endpoint => config.url?.includes(endpoint));
    
    if (shouldLog) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
        baseURL: config.baseURL,
        params: config.params,
        headers: {
          'Content-Type': config.headers['Content-Type'],
          'Authorization': config.headers['Authorization'] ? 'Bearer [token]' : 'None'
        }
      });
    }
    
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add a timestamp to prevent caching for GET requests
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV && !response.config.url?.includes('/auth/')) {
      console.log(`[API] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        data: response.data,
        headers: response.headers
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log error details in development
    if (import.meta.env.DEV) {
      console.error('[API Error]', {
        url: originalRequest?.url,
        method: originalRequest?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
      });
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network Error:', error.message);
      return Promise.reject({
        message: 'Network error. Please check your internet connection.',
        isNetworkError: true
      });
    }
    
    // Handle 401 Unauthorized (token expired or invalid)
    if (error.response.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Skip refresh for login/refresh endpoints to prevent loops
      if (originalRequest.url?.includes('/auth/')) {
        return Promise.reject(error);
      }
      
      try {
        // Try to refresh the token
        const response = await axios.post(
          `${config.api.baseUrl}/auth/refresh`,
          {},
          { 
            withCredentials: true,
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'Expires': '0',
            }
          }
        );
        
        const { token } = response.data;
        
        if (token) {
          // Store the new token
          localStorage.setItem('token', token);
          
          // Update the Authorization header
          originalRequest.headers.Authorization = `Bearer ${token}`;
          
          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Clear auth data and redirect to login
        localStorage.removeItem('token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?session=expired';
        }
        const error = new Error('Your session has expired. Please log in again.') as Error & { isAuthError: boolean };
        error.isAuthError = true;
        if (refreshError instanceof Error) {
          error.stack = refreshError.stack;
          error.name = refreshError.name || 'AuthError';
        }
        return Promise.reject(error);
      }
    }
    
    // Handle other error statuses
    const errorMessage = error.response?.data?.message || 
                        error.response?.statusText || 
                        'An error occurred. Please try again.';
    
    // Format error response consistently
    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
      isNetworkError: false,
      isAuthError: error.response?.status === 401 || error.response?.status === 403
    });
  }
);

// Helper function to make API calls
export const apiService = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => 
    api.get<T>(url, config).then(response => response.data as T),
  
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => 
    api.post<T>(url, data, config).then(response => response.data as T),
  
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => 
    api.put<T>(url, data, config).then(response => response.data as T),
    
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => 
    api.delete<T>(url, config).then(response => response.data as T),
    
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => 
    api.patch<T>(url, data, config).then(response => response.data as T),
};

export default api;
