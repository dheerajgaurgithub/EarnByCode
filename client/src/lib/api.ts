import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

export type ApiResponse<T = any> = {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: AxiosRequestConfig;
};

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    console.log(`Making request to: ${config.baseURL}${config.url}`);
    console.log('Auth headers:', {
      'Content-Type': config.headers['Content-Type'],
      'Authorization': config.headers['Authorization'] ? 'Bearer [token]' : 'None'
    });
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    // Return full response for non-2xx status codes
    if (response.status < 200 || response.status >= 300) {
      return Promise.reject(response);
    }
    // For successful responses, return the data directly
    return response.data;
  },
  (error: AxiosError) => {
    console.error('Response error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper function to make API calls
export const apiService = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => 
    api.get<T>(url, config).then(response => response as unknown as T),
  
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => 
    api.post<T>(url, data, config).then(response => response as unknown as T),
    
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => 
    api.put<T>(url, data, config).then(response => response as unknown as T),
    
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => 
    api.delete<T>(url, config).then(response => response as unknown as T),
    
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => 
    api.patch<T>(url, data, config).then(response => response as unknown as T),
};

export default api;
