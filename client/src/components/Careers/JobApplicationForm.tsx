import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { Upload, X, Check, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiService } from '@/lib/api';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const educationLevels = [
  'High School',
  'Associate Degree',
  "Bachelor's Degree",
  "Master's Degree",
  'PhD',
  'Other'
];

const experienceLevels = [
  'Entry Level',
  '0-2 years',
  '2-5 years',
  '5-10 years',
  '10+ years',
  'Executive'
];

const noticePeriods = [
  'Immediately',
  '1 week',
  '2 weeks',
  '1 month',
  '2 months',
  '3 months+'
];

const applicationSchema = z.object({
  fullName: z.string().min(2, 'Full name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(6, 'Phone number is too short').max(20, 'Phone number is too long'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  country: z.string().min(2, 'Country is required'),
  education: z.string().min(1, 'Education level is required'),
  institution: z.string().min(2, 'Institution name is required'),
  degree: z.string().min(2, 'Degree name is required'),
  graduationYear: z.string().regex(/^\d{4}$/, 'Enter a valid year'),
  experience: z.string().min(1, 'Experience level is required'),
  currentCompany: z.string().optional(),
  currentPosition: z.string().optional(),
  skills: z.string().min(10, 'Please list your key skills'),
  coverLetter: z.string().min(50, 'Cover letter is too short').max(2000, 'Cover letter is too long'),
  resume: z.instanceof(File, { message: 'Resume is required' })
    .refine(file => file.size <= MAX_FILE_SIZE, 'File size must be less than 5MB')
    .refine(
      file => ALLOWED_FILE_TYPES.includes(file.type),
      'Only PDF, DOC, and DOCX files are allowed'
    ),
  linkedin: z.string().url('Invalid URL').or(z.literal('')).optional(),
  portfolio: z.string().url('Invalid URL').or(z.literal('')).optional(),
  salaryExpectation: z.string().min(1, 'Salary expectation is required'),
  noticePeriod: z.string().min(1, 'Notice period is required'),
  availableFrom: z.string().min(1, 'Available from date is required'),
  referenceName: z.string().optional(),
  referenceEmail: z.string().email('Invalid email').or(z.literal('')).optional(),
  referencePhone: z.string().optional(),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

export interface JobApplicationFormProps {
  jobId: string;
  jobTitle: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  onSubmitApplication: (formData: FormData) => Promise<void>;
}

export default function JobApplicationForm({
  jobId,
  jobTitle,
  onSuccess,
  onError,
  onCancel,
  isSubmitting = false,
  onSubmitApplication,
}: JobApplicationFormProps) {
  const { user } = useAuth();
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumePreview, setResumePreview] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      email: user?.email || '',
      fullName: user?.name || '',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      setValue('resume', file);
      setResumePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ApplicationFormData) => {
    if (!resumeFile) {
      toast.error('Resume is required. Please upload your resume');
      return;
    }

    setIsFormSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'resume' && value !== undefined && value !== '') {
          formData.append(key, value);
        }
      });

      await onSubmitApplication(formData);

      reset();
      setResumeFile(null);
      setResumePreview('');

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error submitting application:', error);
      if (onError) {
        onError(error as Error);
      } else {
        const errorMessage = (error as any)?.response?.data?.message || 'Failed to submit application';
        toast(errorMessage, {
          duration: 4000,
          position: 'bottom-right',
          style: {
            backgroundColor: '#EF4444',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            maxWidth: '400px',
          },
        });
      }
    } finally {
      setIsFormSubmitting(false);
    }
  };

  return (
    <div className="bg-white w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Apply for {jobTitle}</h2>
        
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-blue-700">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium text-gray-900">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                {...register('fullName')}
                placeholder="John Doe"
                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.fullName && (
                <p className="text-sm text-red-500">{errors.fullName.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-900">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="john@example.com"
                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-900">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                {...register('phone')}
                placeholder="+1 (555) 123-4567"
                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium text-gray-900">
                Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address"
                {...register('address')}
                placeholder="123 Main St, City, Country"
                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium text-gray-900">
                City <span className="text-red-500">*</span>
              </Label>
              <Input
                id="city"
                {...register('city')}
                placeholder="New York"
                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.city && (
                <p className="text-sm text-red-500">{errors.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium text-gray-900">
                Country <span className="text-red-500">*</span>
              </Label>
              <Input
                id="country"
                {...register('country')}
                placeholder="United States"
                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.country && (
                <p className="text-sm text-red-500">{errors.country.message}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Education */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-blue-700">Education</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="education" className="text-sm font-medium text-gray-900">
                Highest Education Level <span className="text-red-500">*</span>
              </Label>
              <select
                id="education"
                {...register('education')}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select education level</option>
                {educationLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
              {errors.education && (
                <p className="text-sm text-red-500">{errors.education.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="institution" className="text-sm font-medium text-gray-900">
                Institution <span className="text-red-500">*</span>
              </Label>
              <Input
                id="institution"
                {...register('institution')}
                placeholder="University of Example"
                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.institution && (
                <p className="text-sm text-red-500">{errors.institution.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="degree" className="text-sm font-medium text-gray-900">
                Degree <span className="text-red-500">*</span>
              </Label>
              <Input
                id="degree"
                {...register('degree')}
                placeholder="Bachelor of Science in Computer Science"
                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.degree && (
                <p className="text-sm text-red-500">{errors.degree.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="graduationYear" className="text-sm font-medium text-gray-900">
                Graduation Year <span className="text-red-500">*</span>
              </Label>
              <Input
                id="graduationYear"
                {...register('graduationYear')}
                placeholder="2023"
                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.graduationYear && (
                <p className="text-sm text-red-500">{errors.graduationYear.message}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Work Experience */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-blue-700">Work Experience</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="experience" className="text-sm font-medium text-gray-900">
                Years of Experience <span className="text-red-500">*</span>
              </Label>
              <select
                id="experience"
                {...register('experience')}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select years of experience</option>
                {experienceLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
              {errors.experience && (
                <p className="text-sm text-red-500">{errors.experience.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currentCompany" className="text-sm font-medium text-gray-900">
                Current/Most Recent Company
              </Label>
              <Input
                id="currentCompany"
                {...register('currentCompany')}
                placeholder="Acme Inc."
                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.currentCompany && (
                <p className="text-sm text-red-500">{errors.currentCompany.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currentPosition" className="text-sm font-medium text-gray-900">
                Current/Most Recent Position
              </Label>
              <Input
                id="currentPosition"
                {...register('currentPosition')}
                placeholder="Senior Software Engineer"
                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.currentPosition && (
                <p className="text-sm text-red-500">{errors.currentPosition.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="skills" className="text-sm font-medium text-gray-900">
                Key Skills <span className="text-red-500">*</span>
              </Label>
              <Input
                id="skills"
                {...register('skills')}
                placeholder="JavaScript, React, Node.js, etc."
                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.skills && (
                <p className="text-sm text-red-500">{errors.skills.message}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Resume */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-blue-700">
            Resume <span className="text-red-500">*</span>
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="resume-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-blue-500" />
                  <p className="mb-2 text-sm text-gray-700">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, DOCX (max. 5MB)
                  </p>
                </div>
                <input
                  id="resume-upload"
                  type="file"
                  className="hidden"
                  accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                />
              </label>
            </div>
            {resumeFile && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md border border-blue-200">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                    <Check className="w-4 h-4" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {resumeFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setResumeFile(null);
                    setResumePreview('');
                    setValue('resume', null as any);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            {errors.resume && (
              <p className="text-sm text-red-500">{errors.resume.message}</p>
            )}
          </div>
        </div>
        
        {/* Cover Letter */}
        <div className="space-y-2">
          <Label htmlFor="coverLetter" className="text-sm font-medium text-gray-900">
            Cover Letter <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="coverLetter"
            {...register('coverLetter')}
            placeholder="Write a cover letter explaining why you're a good fit for this position..."
            rows={6}
            className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.coverLetter && (
            <p className="text-sm text-red-500">{errors.coverLetter.message}</p>
          )}
        </div>
        
        {/* Additional Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-blue-700">Additional Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="linkedin" className="text-sm font-medium text-gray-900">
                LinkedIn Profile
              </Label>
              <Input
                id="linkedin"
                type="url"
                {...register('linkedin')}
                placeholder="https://linkedin.com/in/yourprofile"
                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.linkedin && (
                <p className="text-sm text-red-500">{errors.linkedin.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="portfolio" className="text-sm font-medium text-gray-900">
                Portfolio/Website
              </Label>
              <Input
                id="portfolio"
                type="url"
                {...register('portfolio')}
                placeholder="https://yourportfolio.com"
                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.portfolio && (
                <p className="text-sm text-red-500">{errors.portfolio.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="salaryExpectation" className="text-sm font-medium text-gray-900">
                Salary Expectation <span className="text-red-500">*</span>
              </Label>
              <Input
                id="salaryExpectation"
                {...register('salaryExpectation')}
                placeholder="e.g., $80,000 per year"
                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.salaryExpectation && (
                <p className="text-sm text-red-500">{errors.salaryExpectation.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="noticePeriod" className="text-sm font-medium text-gray-900">
                Notice Period <span className="text-red-500">*</span>
              </Label>
              <select
                id="noticePeriod"
                {...register('noticePeriod')}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select notice period</option>
                {noticePeriods.map((period) => (
                  <option key={period} value={period}>
                    {period}
                  </option>
                ))}
              </select>
              {errors.noticePeriod && (
                <p className="text-sm text-red-500">{errors.noticePeriod.message}</p>
              )}
            </div>
            
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="availableFrom" className="text-sm font-medium text-gray-900">
                Available From <span className="text-red-500">*</span>
              </Label>
              <Input
                id="availableFrom"
                type="date"
                {...register('availableFrom')}
                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:max-w-xs"
              />
              {errors.availableFrom && (
                <p className="text-sm text-red-500">{errors.availableFrom.message}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* References */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-blue-700">Reference</h3>
          <p className="text-sm text-gray-600">
            Please provide at least one professional reference.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="referenceName" className="text-sm font-medium text-gray-900">
                Reference Name
              </Label>
              <Input
                id="referenceName"
                {...register('referenceName')}
                placeholder="John Smith"
                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.referenceName && (
                <p className="text-sm text-red-500">{errors.referenceName.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="referenceEmail" className="text-sm font-medium text-gray-900">
                Reference Email
              </Label>
              <Input
                id="referenceEmail"
                type="email"
                {...register('referenceEmail')}
                placeholder="john.smith@example.com"
                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.referenceEmail && (
                <p className="text-sm text-red-500">{errors.referenceEmail.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="referencePhone" className="text-sm font-medium text-gray-900">
                Reference Phone
              </Label>
              <Input
                id="referencePhone"
                type="tel"
                {...register('referencePhone')}
                placeholder="+1 (555) 123-4567"
                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.referencePhone && (
                <p className="text-sm text-red-500">{errors.referencePhone.message}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || isFormSubmitting}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting || isFormSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Application'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}