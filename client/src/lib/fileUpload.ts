import axios from 'axios';
import config from './config';

export interface UploadResponse {
  success: boolean;
  message?: string;
  url?: string;
  path?: string;
  avatar?: string;
  user?: {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
    [key: string]: any;
  };
  [key: string]: any; // Allow for additional properties
}

interface UploadOptions {
  endpoint: string;
  fieldName?: string;
  file: File;
  onProgress?: (progress: number) => void;
  additionalData?: Record<string, any>;
  headers?: Record<string, string>;
}

/**
 * Handles file uploads with progress tracking and error handling
 */
export const uploadFile = async ({
  endpoint,
  fieldName = 'file',
  file,
  onProgress,
  additionalData = {},
  headers = {}
}: UploadOptions): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append(fieldName, file);
  
  // Append additional data if provided
  Object.entries(additionalData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });

  try {
    const response = await axios.post(
      `${config.api.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...headers,
        },
        withCredentials: true,
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      }
    );

    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Failed to upload file';
    throw new Error(errorMessage);
  }
};

/**
 * Validates a file before upload
 */
export const validateFile = (file: File, options: {
  allowedTypes?: string[];
  maxSizeMB?: number;
} = {}): { valid: boolean; error?: string } => {
  const {
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSizeMB = 5,
  } = options;

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  // Check file size (in bytes)
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File is too large. Maximum size is ${maxSizeMB}MB`
    };
  }

  return { valid: true };
};

/**
 * Creates a preview URL for an image file
 */
export const createImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to create image preview'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsDataURL(file);
  });
};
