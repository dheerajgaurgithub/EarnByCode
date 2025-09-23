import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import { Switch } from '@headlessui/react';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { cn } from '../../../lib/utils';
import apiService from '../../../services/api';
import { useToast } from '../../../components/ui/use-toast';

const jobTypes = [
  'Full-time',
  'Part-time',
  'Contract',
  'Internship',
  'Temporary'
];

const formSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  department: z.string().min(1, 'Department is required'),
  location: z.string().min(1, 'Location is required'),
  type: z.string().min(1, 'Job type is required'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  requirements: z.array(z.string().min(10, 'Requirement must be at least 10 characters')).min(1, 'At least one requirement is required'),
  responsibilities: z.array(z.string().min(10, 'Responsibility must be at least 10 characters')).min(1, 'At least one responsibility is required'),
  skills: z.array(z.string()).optional(),
  experience: z.object({
    min: z.number().min(0, 'Minimum experience must be 0 or more'),
    max: z.number().min(0, 'Maximum experience must be 0 or more')
  }),
  salary: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string().default('INR').optional(),
    isDisclosed: z.boolean().default(false).optional()
  }).optional(),
  isActive: z.boolean().default(true).optional(),
  applicationDeadline: z.date().optional()
});

type FormValues = z.infer<typeof formSchema>;

interface CareerResponse extends Omit<FormValues, 'applicationDeadline'> {
  _id: string;
  createdAt: string;
  updatedAt: string;
  applicationDeadline?: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  experience: {
    min: number;
    max: number;
  };
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
    isDisclosed?: boolean;
  };
  isActive: boolean;
}

// Extended Input component props to include error
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

// Extended Textarea component props to include error
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const CareerForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [requirement, setRequirement] = useState('');
  const [responsibility, setResponsibility] = useState('');
  const [skill, setSkill] = useState('');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    control
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      department: '',
      location: '',
      type: '',
      description: '',
      requirements: [],
      responsibilities: [],
      skills: [],
      experience: { min: 0, max: 5 },
      salary: {
        currency: 'INR',
        isDisclosed: false,
        min: undefined,
        max: undefined
      },
      isActive: true,
      applicationDeadline: undefined
    }
  });

  useEffect(() => {
    if (id) {
      fetchCareer();
      setIsEditing(true);
    }
  }, [id]);

  const fetchCareer = async (): Promise<void> => {
    try {
      setLoading(true);
      const career = await apiService.get<CareerResponse>(`/careers/${id}`);
      
      // Format the data for the form
      const formData: Partial<FormValues> = {
        ...career,
        applicationDeadline: career.applicationDeadline ? new Date(career.applicationDeadline) : undefined,
        requirements: career.requirements || [],
        responsibilities: career.responsibilities || [],
        skills: career.skills || [],
        experience: career.experience || { min: 0, max: 5 },
        salary: career.salary || {
          min: undefined,
          max: undefined,
          currency: 'INR',
          isDisclosed: false
        }
      };
      
      reset(formData);
    } catch (error) {
      console.error('Error fetching career:', error);
      toast.error('Failed to fetch career details');
      navigate('/admin/careers');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      setLoading(true);
      
      if (isEditing) {
        await apiService.put(`/careers/${id}`, data);
        toast.success('Job updated successfully');
      } else {
        await apiService.post('/careers', data);
        toast.success('Job created successfully');
      }
      
      navigate('/admin/careers');
    } catch (error) {
      console.error('Error saving career:', error);
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} job`);
    } finally {
      setLoading(false);
    }
  };

  const addRequirement = (): void => {
    if (requirement.trim()) {
      const currentRequirements = watch('requirements') || [];
      setValue('requirements', [...currentRequirements, requirement]);
      setRequirement('');
    }
  };

  const removeRequirement = (index: number): void => {
    const currentRequirements = watch('requirements') || [];
    setValue('requirements', currentRequirements.filter((_, i) => i !== index));
  };

  const addResponsibility = (): void => {
    if (responsibility.trim()) {
      const currentResponsibilities = watch('responsibilities') || [];
      setValue('responsibilities', [...currentResponsibilities, responsibility]);
      setResponsibility('');
    }
  };

  const removeResponsibility = (index: number): void => {
    const currentResponsibilities = watch('responsibilities') || [];
    setValue('responsibilities', currentResponsibilities.filter((_, i) => i !== index));
  };

  const addSkill = (): void => {
    if (skill.trim()) {
      const currentSkills = watch('skills') || [];
      setValue('skills', [...currentSkills, skill]);
      setSkill('');
    }
  };

  const removeSkill = (index: number): void => {
    const currentSkills = watch('skills') || [];
    setValue('skills', currentSkills.filter((_, i) => i !== index));
  };

  // Custom Input component that handles error prop
  const CustomInput: React.FC<InputProps> = ({ error, className, ...props }) => (
    <div>
      <Input className={className} {...props} />
      {error && (
        <p className="text-sm font-medium text-destructive mt-1">{error}</p>
      )}
    </div>
  );

  // Custom Textarea component that handles error prop
  const CustomTextarea: React.FC<TextareaProps> = ({ error, className, ...props }) => (
    <div>
      <Textarea className={className} {...props} />
      {error && (
        <p className="text-sm font-medium text-destructive mt-1">{error}</p>
      )}
    </div>
  );

  if (loading && isEditing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? 'Edit Job Posting' : 'Create New Job Posting'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Update the job details below' : 'Fill in the details below to create a new job posting'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="title">Job Title *</Label>
            <CustomInput
              id="title"
              placeholder="e.g. Senior Software Engineer"
              {...register('title')}
              error={errors.title?.message}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department *</Label>
            <CustomInput
              id="department"
              placeholder="e.g. Engineering"
              {...register('department')}
              error={errors.department?.message}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <CustomInput
              id="location"
              placeholder="e.g. San Francisco, CA or Remote"
              {...register('location')}
              error={errors.location?.message}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Job Type *</Label>
            <select
              id="type"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register('type')}
            >
              <option value="">Select job type</option>
              {jobTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.type?.message && (
              <p className="text-sm font-medium text-destructive">{errors.type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Experience (years) *</Label>
            <div className="flex gap-2">
              <CustomInput
                type="number"
                placeholder="Min"
                {...register('experience.min', { valueAsNumber: true })}
                error={errors.experience?.min?.message}
              />
              <span className="flex items-center">to</span>
              <CustomInput
                type="number"
                placeholder="Max"
                {...register('experience.max', { valueAsNumber: true })}
                error={errors.experience?.max?.message}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Application Deadline</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !watch('applicationDeadline') && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watch('applicationDeadline') ? (
                    format(watch('applicationDeadline') as Date, 'PPP')
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={watch('applicationDeadline')}
                  onSelect={(date: Date | undefined) => setValue('applicationDeadline', date || undefined)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Salary (optional)</Label>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="salary-disclosed"
                  checked={watch('salary')?.isDisclosed || false}
                  onChange={(checked: boolean) =>
                    setValue('salary.isDisclosed', checked, { shouldValidate: true })
                  }
                />
                <Label htmlFor="salary-disclosed">Disclose salary?</Label>
              </div>
              
              {watch('salary')?.isDisclosed && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="number"
                      placeholder="Min"
                      {...register('salary.min', { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Max"
                      {...register('salary.max', { valueAsNumber: true })}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Job Description *</Label>
          <CustomTextarea
            id="description"
            placeholder="Describe the job in detail..."
            rows={6}
            {...register('description')}
            error={errors.description?.message}
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Requirements *</Label>
              <span className="text-sm text-muted-foreground">
                {watch('requirements')?.length || 0} requirements added
              </span>
            </div>
            <div className="flex gap-2">
              <Input
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                placeholder="Add a requirement..."
                className="flex-1"
              />
              <Button type="button" onClick={addRequirement}>
                Add
              </Button>
            </div>
            {errors.requirements?.message && (
              <p className="text-sm font-medium text-destructive">
                {errors.requirements.message}
              </p>
            )}
            <div className="space-y-2 mt-2">
              {watch('requirements')?.map((req, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span>{req}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRequirement(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Responsibilities *</Label>
              <span className="text-sm text-muted-foreground">
                {watch('responsibilities')?.length || 0} responsibilities added
              </span>
            </div>
            <div className="flex gap-2">
              <Input
                value={responsibility}
                onChange={(e) => setResponsibility(e.target.value)}
                placeholder="Add a responsibility..."
                className="flex-1"
              />
              <Button type="button" onClick={addResponsibility}>
                Add
              </Button>
            </div>
            {errors.responsibilities?.message && (
              <p className="text-sm font-medium text-destructive">
                {errors.responsibilities.message}
              </p>
            )}
            <div className="space-y-2 mt-2">
              {watch('responsibilities')?.map((resp, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span>{resp}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeResponsibility(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Skills (optional)</Label>
              <span className="text-sm text-muted-foreground">
                {watch('skills')?.length || 0} skills added
              </span>
            </div>
            <div className="flex gap-2">
              <Input
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                placeholder="Add a skill..."
                className="flex-1"
              />
              <Button type="button" onClick={addSkill}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {watch('skills')?.map((s, index) => (
                <div
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary"
                >
                  {s}
                  <button
                    type="button"
                    className="ml-2 text-muted-foreground hover:text-foreground"
                    onClick={() => removeSkill(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={watch('isActive') || false}
              onChange={(checked: boolean) => setValue('isActive', checked)}
            />
            <Label htmlFor="isActive">
              {watch('isActive') ? 'Active' : 'Inactive'}
            </Label>
          </div>
          <div className="space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/careers')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEditing ? 'Update Job' : 'Create Job'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};