import api from '../lib/api';
import type { Job as JobType } from '../types/job';

const API_URL = '/jobs';

// Helper to extract data from API response
const getData = <T>(response: any): T => {
  // If response is already the data we need, return it
  if (Array.isArray(response) || (response && typeof response === 'object' && !('data' in response))) {
    return response as T;
  }
  // Otherwise, try to get data from response.data
  return response?.data as T;
};

// Using JobType and Salary from '../types/job' for type safety
export const getJobs = async (): Promise<JobType[]> => {
  try {
    console.log('Fetching jobs from:', API_URL);
    const response = await api.get<JobType[]>(API_URL);
    console.log('Raw API response:', response);
    const data = getData<JobType[]>(response);
    console.log('Processed jobs data:', data);
    
    // Log the structure of the first job's salary data if it exists
    if (Array.isArray(data) && data.length > 0) {
      console.log('First job salary data:', {
        hasSalary: !!data[0].salary,
        salaryKeys: data[0].salary ? Object.keys(data[0].salary) : [],
        salaryValue: data[0].salary
      });
    }
    
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error in getJobs:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};

export const getJobById = async (id: string): Promise<JobType> => {
  try {
    const response = await api.get<{ data: JobType }>(`${API_URL}/${id}`);
    return getData<JobType>(response);
  } catch (error) {
    console.error(`Error fetching job ${id}:`, error);
    throw error;
  }
};

export const createJob = async (jobData: Omit<JobType, '_id' | 'createdAt' | 'updatedAt' | 'applications'>): Promise<JobType> => {
  try {
    const response = await api.post<{ data: JobType }>(API_URL, jobData);
    return getData<JobType>(response);
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
};

/**
 * Format the job data before sending to the API
 */
const prepareJobData = (jobData: Partial<JobType>): Partial<JobType> => {
  const data = { ...jobData };
  
  // Log the incoming data for debugging
  console.debug('Preparing job data:', JSON.stringify(data, null, 2));
  
  // Format salary if it exists
  if (data.salary) {
    console.debug('Processing salary data:', {
      before: data.salary,
      types: {
        min: typeof data.salary.min,
        max: typeof data.salary.max,
        currency: typeof data.salary?.currency,
        period: typeof data.salary?.period
      }
    });
    
    // Ensure salary object has all required fields with defaults
    const salary = {
      min: typeof data.salary.min === 'number' ? data.salary.min : 
           typeof data.salary.min === 'string' ? Number(data.salary.min) || 0 : 0,
      max: typeof data.salary.max === 'number' ? data.salary.max : 
           typeof data.salary.max === 'string' ? Number(data.salary.max) || 0 : 0,
      currency: data.salary.currency || 'INR',
      period: (data.salary.period === 'year' || 
              data.salary.period === 'month' || 
              data.salary.period === 'hour') ? 
              data.salary.period : 'year'
    };
    
    // Validate min <= max
    if (salary.min > salary.max) {
      salary.max = salary.min;
    }
    
    console.debug('Processed salary:', salary);
    data.salary = salary;
  }
  
  // Remove any undefined or null values
  Object.keys(data).forEach(key => {
    if (data[key as keyof JobType] === undefined || data[key as keyof JobType] === null) {
      delete data[key as keyof JobType];
    }
  });
  
  console.debug('Final prepared data:', JSON.stringify(data, null, 2));
  return data;
};

export const updateJob = async (id: string, jobData: Partial<JobType>): Promise<JobType> => {
  try {
    const dataToSend = prepareJobData(jobData);
    
    // Log the request for debugging
    console.debug('Updating job:', { id, data: dataToSend });
    
    const response = await api.put<{ data: JobType }>(`${API_URL}/${id}`, dataToSend);
    const updatedJob = getData<JobType>(response);
    
    // Log the successful update
    console.info('Job updated successfully:', {
      id,
      updatedAt: new Date().toISOString(),
      updatedFields: Object.keys(jobData),
      salary: updatedJob?.salary
    });
    
    if (!updatedJob) {
      throw new Error('Failed to update job: No data returned from server');
    }
    
    return updatedJob;
  } catch (error: any) {
    console.error('Full error object:', JSON.stringify(error, null, 2));
    console.error('Error response data:', error.response?.data);
    
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      validationErrors: error.response?.data?.errors,
      requestData: jobData,
      timestamp: new Date().toISOString()
    };
    
    console.error(`Error updating job ${id}:`, JSON.stringify(errorDetails, null, 2));
    
    // Handle different types of errors
    if (error.response?.data?.errors) {
      // Handle validation errors
      const validationErrors = error.response.data.errors;
      let errorMessage = 'Validation failed:\n';
      
      console.debug('Raw validation errors:', validationErrors);
      
      if (Array.isArray(validationErrors)) {
        // Handle array of error messages
        errorMessage += validationErrors.map(err => {
          if (typeof err === 'string') return err;
          if (err.message) return err.message;
          return JSON.stringify(err);
        }).join('\n');
      } else if (typeof validationErrors === 'object') {
        // Handle object with field names as keys
        errorMessage += Object.entries(validationErrors)
          .map(([field, messages]) => {
            if (Array.isArray(messages)) {
              return `${field}: ${messages.join(', ')}`;
            } else if (messages && typeof messages === 'object') {
              return `${field}: ${JSON.stringify(messages)}`;
            }
            return `${field}: ${String(messages)}`;
          })
          .join('\n');
      } else {
        // Fallback for other error formats
        errorMessage += String(validationErrors);
      }
      
      console.error('Validation error details:', errorMessage);
      throw new Error(errorMessage);
    } else if (error.response?.data?.message) {
      // Server-provided error message
      throw new Error(error.response.data.message);
    } else if (error.response?.status === 401) {
      // Authentication error
      throw new Error('Your session has expired. Please log in again.');
    } else if (error.response?.status === 403) {
      // Permission error
      throw new Error('You do not have permission to update this job.');
    } else if (error.response?.status === 404) {
      // Not found error
      throw new Error('The requested job could not be found.');
    } else if (error.response?.status === 400) {
      // Validation error
      const errors = error.response.data?.errors || [];
      throw new Error(
        `Validation failed: ${errors.join(', ') || 'Invalid data provided'}`
      );
    } else if (!navigator.onLine) {
      // Offline error
      throw new Error('You are currently offline. Please check your connection.');
    } else {
      // Generic error
      throw new Error('Failed to update job. Please try again later.');
    }
  }
};

export const deleteJob = async (id: string): Promise<void> => {
  try {
    await api.delete<{ success: boolean }>(`${API_URL}/${id}`);
  } catch (error) {
    console.error(`Error deleting job ${id}:`, error);
    throw error;
  }
};

export const applyForJob = async (jobId: string, applicationData: FormData): Promise<{ message: string }> => {
  try {
    const response = await api.post<{ message: string }>(
      `${API_URL}/${jobId}/apply`,
      applicationData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return getData(response);
  } catch (error) {
    console.error(`Error applying for job ${jobId}:`, error);
    throw error;
  }
};

interface JobApplication {
  _id: string;
  userId: string;
  status: string;
  appliedAt: string;
  resume: string;
  coverLetter?: string;
  // Add other application fields as needed
}

export const getJobApplications = async (jobId: string): Promise<JobApplication[]> => {
  try {
    const response = await api.get<JobApplication[]>(`${API_URL}/${jobId}/applications`);
    const data = getData(response);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Error fetching applications for job ${jobId}:`, error);
    throw error;
  }
};

interface ApplicationStatusUpdate {
  status: string;
  updatedAt: string;
}

export const updateApplicationStatus = async (
  jobId: string, 
  applicationId: string, 
  status: string
): Promise<ApplicationStatusUpdate> => {
  try {
    const response = await api.put<ApplicationStatusUpdate>(
      `${API_URL}/${jobId}/applications/${applicationId}/status`,
      { status }
    );
    return getData(response);
  } catch (error) {
    console.error(`Error updating application status for ${applicationId}:`, error);
    throw error;
  }
};
