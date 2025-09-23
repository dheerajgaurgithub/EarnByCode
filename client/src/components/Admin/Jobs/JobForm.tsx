import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
// UI components are used in the JSX but not directly in the component code
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label }  from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Job, Salary } from '@/types/job';
import * as jobService from '@/services/jobService';
const jobSchema = z.object({
  title: z.string().min(3, 'Title is required').max(100),
  department: z.string().min(2, 'Department is required'),
  location: z.string().min(2, 'Location is required'),
  type: z.enum(['Full-time', 'Part-time', 'Contract', 'Internship']).default('Full-time'),
  description: z.string().min(20, 'Description is required'),
  requirements: z.array(z.string()).min(1, 'At least one requirement is required'),
  responsibilities: z.array(z.string()).min(1, 'At least one responsibility is required'),
  salary: z.object({
    min: z.number().min(0, 'Minimum salary must be a positive number'),
    max: z.number().min(0, 'Maximum salary must be a positive number'),
    currency: z.string().min(1, 'Currency is required').default('INR'),
    period: z.enum(['year', 'month', 'hour']).default('year')
  }),
  isActive: z.boolean().default(true),
  slug: z.string().optional()
});

// Define the form data type that matches our form structure
interface JobFormData {
  title: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  description: string;
  requirements: string[];
  responsibilities: string[];
  salary: {
    min: number;
    max: number;
    currency: string;
    period: 'year' | 'month' | 'hour';
  };
  isActive: boolean;
  slug?: string;
}

interface JobFormProps {
  job?: Job;
  onSuccess: () => void;
  onCancel: () => void;
}

export const JobForm = ({ job, onSuccess, onCancel }: JobFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requirements, setRequirements] = useState<string[]>(job?.requirements || []);
  const [responsibilities, setResponsibilities] = useState<string[]>(job?.responsibilities || []);
  const [requirementInput, setRequirementInput] = useState('');
  const [responsibilityInput, setResponsibilityInput] = useState('');

  const { success, error } = useToast();

  // Debug log the job data
  useEffect(() => {
    console.log('Job data received:', JSON.stringify(job, null, 2));
    if (job?.salary) {
      console.log('Salary data from API:', {
        min: job.salary.min,
        max: job.salary.max,
        currency: job.salary.currency,
        period: job.salary.period,
        type: {
          min: typeof job.salary.min,
          max: typeof job.salary.max,
          currency: typeof job.salary.currency,
          period: typeof job.salary.period
        }
      });
    }
  }, [job]);

  const defaultValues = {
    title: job?.title || '',
    department: job?.department || '',
    location: job?.location || '',
    type: (job?.type as 'Full-time' | 'Part-time' | 'Contract' | 'Internship') || 'Full-time',
    description: job?.description || '',
    requirements: job?.requirements || [],
    responsibilities: job?.responsibilities || [],
    salary: {
      min: typeof job?.salary?.min === 'number' ? job.salary.min : 0,
      max: typeof job?.salary?.max === 'number' ? job.salary.max : 0,
      currency: job?.salary?.currency || 'INR',
      period: (job?.salary?.period as 'year' | 'month' | 'hour') || 'year',
    },
    isActive: job?.status === 'open' || false,
    slug: job?.slug || ''
  };

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema) as any, // Type assertion to fix the type error
    defaultValues,
    mode: 'onChange'
  });

  useEffect(() => {
    reset(defaultValues);
    setRequirements(job?.requirements || []);
    setResponsibilities(job?.responsibilities || []);
  }, [job, reset]);

  const addRequirement = () => {
    if (requirementInput.trim()) {
      const newRequirements = [...requirements, requirementInput.trim()];
      setRequirements(newRequirements);
      setValue('requirements', newRequirements, { shouldValidate: true });
      setRequirementInput('');
    }
  };

  const removeRequirement = (index: number) => {
    const newRequirements = requirements.filter((_, i) => i !== index);
    setRequirements(newRequirements);
    setValue('requirements', newRequirements, { shouldValidate: true });
  };

  const addResponsibility = () => {
    if (responsibilityInput.trim()) {
      const newResponsibilities = [...responsibilities, responsibilityInput.trim()];
      setResponsibilities(newResponsibilities);
      setValue('responsibilities', newResponsibilities, { shouldValidate: true });
      setResponsibilityInput('');
    }
  };

  const removeResponsibility = (index: number) => {
    const newResponsibilities = responsibilities.filter((_, i) => i !== index);
    setResponsibilities(newResponsibilities);
    setValue('responsibilities', newResponsibilities, { shouldValidate: true });
  };

  const onSubmit = handleSubmit(async (formData: JobFormData) => {
    try {
      setIsSubmitting(true);
      
      // Validate required fields
      if (!formData.title?.trim()) throw new Error('Job title is required');
      if (!formData.department?.trim()) throw new Error('Department is required');
      if (!formData.location?.trim()) throw new Error('Location is required');
      if (!formData.description?.trim()) throw new Error('Job description is required');
      
      const requirements = formData.requirements.filter(Boolean).map(r => r.trim());
      const responsibilities = formData.responsibilities.filter(Boolean).map(r => r.trim());
      
      if (requirements.length === 0) throw new Error('At least one requirement is required');
      if (responsibilities.length === 0) throw new Error('At least one responsibility is required');
      
      // Prepare job data according to the server's expected format
      const status: 'open' | 'draft' | 'closed' = formData.isActive ? 'open' : 'draft';
      
      // Prepare salary data with proper number conversion
      const salaryMin = Number(formData.salary?.min) || 0;
      const salaryMax = Number(formData.salary?.max) || 0;
      const salaryCurrency = 'INR';
      const salaryPeriod = (formData.salary?.period?.toLowerCase() as 'year' | 'month' | 'hour') || 'year';
      
      console.log('Form salary data:', {
        min: { value: formData.salary?.min, type: typeof formData.salary?.min },
        max: { value: formData.salary?.max, type: typeof formData.salary?.max },
        currency: salaryCurrency,
        period: salaryPeriod,
        converted: { min: salaryMin, max: salaryMax }
      });

      // Create the job data with proper typing
      interface JobFormData extends Omit<Job, '_id' | 'createdAt' | 'updatedAt' | 'applications'> {
        salary: Salary;
      }
      
      const jobData: JobFormData = {
        ...formData,
        salary: {
          min: formData.salary.min,
          max: formData.salary.max,
          currency: salaryCurrency,
          period: salaryPeriod
        },
        status,
        slug: formData.slug || formData.title.toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w-]+/g, '')
      };

      // Additional validation
      if (jobData.salary.min < 0) throw new Error('Minimum salary cannot be negative');
      if (jobData.salary.max < 0) throw new Error('Maximum salary cannot be negative');
      if (jobData.salary.max < jobData.salary.min) {
        throw new Error('Maximum salary must be greater than or equal to minimum salary');
      }

      // Log the data being sent for debugging
      console.log('Submitting job data:', JSON.stringify(jobData, null, 2));

      if (job?._id) {
        await jobService.updateJob(job._id, jobData);
        success('Job updated successfully');
      } else {
        await jobService.createJob(jobData);
        success('Job created successfully');
      }
      reset();
      setRequirements([]);
      setResponsibilities([]);
      setRequirementInput('');
      setResponsibilityInput('');
      
      onSuccess();
    } catch (err: any) {
      console.error('Error submitting form:', err);
      
      // Log full error details for debugging
      console.error('Full error details:', {
        message: err.message,
        response: err.response?.data,
        stack: err.stack
      });
      
      // Extract error message
      let errorMessage = 'Failed to save job. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Handle specific error cases
      if (errorMessage.includes('Cannot read properties of undefined')) {
        errorMessage = 'There was an issue with the form data. Please check all fields and try again.';
      } else if (errorMessage.includes('Validation failed')) {
        errorMessage = `Validation error: ${errorMessage.split('Validation failed:')[1]?.trim() || 'Please check all fields'}`;
      }
      
      error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  });

  // Blue & White theme input classes
  const inputClass = (hasError?: boolean) =>
    `w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-white text-slate-700 border-2 
     ${hasError 
       ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
       : 'border-blue-300 focus:border-blue-500 focus:ring-blue-200'
     } 
     rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 
     transition-all duration-200 hover:border-blue-400 text-sm sm:text-base`;

  const buttonClass = {
    primary: `bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 sm:px-6 sm:py-2.5 
              rounded-lg font-medium transition-colors duration-200 
              disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base
              shadow-md hover:shadow-lg`,
    outline: `border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 
              sm:px-6 sm:py-2.5 rounded-lg font-medium transition-all duration-200 
              disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base
              hover:border-blue-700 hover:text-blue-700`,
    danger: `text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full 
             transition-all duration-200 text-lg font-bold min-w-[32px] h-8 
             flex items-center justify-center`
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl border border-blue-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 sm:px-8 sm:py-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {job ? 'Edit Job Position' : 'Create New Job Position'}
            </h1>
            <p className="text-blue-100 mt-2 text-sm sm:text-base">
              Fill in the details below to {job ? 'update' : 'create'} the job posting
            </p>
          </div>

  {/* Form Container */}
          <div className="p-6 sm:p-8">
            <form onSubmit={onSubmit} className="space-y-6 sm:space-y-8">
              
              {/* Basic Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Job Title *</Label>
                      <Input
                        id="title"
                        {...register('title')}
                        placeholder="e.g. Senior Software Engineer"
                        className={errors.title ? 'border-red-500' : ''}
                      />
                      {errors.title && (
                        <p className="text-sm text-red-500">{errors.title.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="department">Department *</Label>
                      <Input
                        id="department"
                        {...register('department')}
                        placeholder="e.g. Engineering"
                        className={errors.department ? 'border-red-500' : ''}
                      />
                      {errors.department && (
                        <p className="text-sm text-red-500">{errors.department.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        {...register('location')}
                        placeholder="e.g. San Francisco, CA"
                        className={errors.location ? 'border-red-500' : ''}
                      />
                      {errors.location && (
                        <p className="text-sm text-red-500">{errors.location.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="space-y-4">
                    <div>
                      <Label>Salary Range</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Input
                            type="number"
                            {...register('salary.min', { valueAsNumber: true })}
                            placeholder="Min"
                            className={errors.salary?.min ? 'border-red-500' : ''}
                          />
                          {errors.salary?.min && (
                            <p className="text-sm text-red-500">{errors.salary.min.message}</p>
                          )}
                        </div>
                        <div>
                          <Input
                            type="number"
                            {...register('salary.max', { valueAsNumber: true })}
                            placeholder="Max"
                            className={errors.salary?.max ? 'border-red-500' : ''}
                          />
                          {errors.salary?.max && (
                            <p className="text-sm text-red-500">{errors.salary.max.message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Job Description */}
              <div className="space-y-2">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="description">Job Description *</Label>
                    <Textarea
                      id="description"
                      {...register('description')}
                      placeholder="Provide a detailed job description..."
                      rows={6}
                      className={errors.description ? 'border-red-500' : ''}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-500">{errors.description.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Requirements Section */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label>Requirements</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={requirementInput}
                          onChange={(e) => setRequirementInput(e.target.value)}
                          placeholder="Add a requirement"
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                        />
                        <Button type="button" onClick={addRequirement}>
                          Add
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {requirements.map((req, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span>• {req}</span>
                            <button
                              type="button"
                              onClick={() => removeRequirement(i)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      {errors.requirements && (
                        <p className="text-sm text-red-500">
                          {errors.requirements.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Responsibilities Section */}
                <div className="space-y-3">
                  <div>
                    <Label>Responsibilities</Label>
                    <div className="space-y-2">
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={responsibilityInput}
                            onChange={(e) => setResponsibilityInput(e.target.value)}
                            placeholder="Add a responsibility"
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addResponsibility())}
                          />
                          <Button type="button" onClick={addResponsibility}>
                            Add
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {responsibilities.map((resp, index) => (
                            <div key={index} className="flex items-start justify-between p-3 sm:p-4 
                                                  bg-blue-50 border border-blue-200 rounded-lg 
                                                  hover:bg-blue-100 transition-colors">
                              <span className="text-slate-700 text-sm sm:text-base flex-1 mr-2">
                                {resp}
                              </span>
                              <button 
                                type="button" 
                                onClick={() => removeResponsibility(index)}
                                className="text-red-600 hover:text-red-800"
                                title="Remove responsibility"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                        {errors.responsibilities && (
                          <p className="text-sm text-red-500">
                            {errors.responsibilities.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Status */}
              <div className="bg-blue-50 p-4 sm:p-6 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    id="isActive" 
                    {...register('isActive')}
                    className="h-5 w-5 rounded border-2 border-blue-300 text-blue-600 
                             focus:ring-blue-500 focus:ring-2" 
                  />
                  <Label 
                    htmlFor="isActive" 
                    className="text-slate-700 font-semibold text-sm sm:text-base cursor-pointer"
                  >
                    Active Job Posting
                  </Label>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 ml-8">
                  Check this box to make the job posting visible to applicants
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6 
                            border-t border-blue-100">
                <Button 
                  type="button" 
                  onClick={onCancel} 
                  disabled={isSubmitting}
                  className={`${buttonClass.outline} order-2 sm:order-1`}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`${buttonClass.primary} order-1 sm:order-2`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent 
                                    rounded-full animate-spin"></div>
                      Saving...
                    </span>
                  ) : (
                    job ? 'Update Job' : 'Create Job'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};