import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getJobs, applyForJob } from '@/services/jobService';
import { Loader2, Briefcase, Mail, MapPin, DollarSign, Clock, Users, BarChart2, RefreshCw } from 'lucide-react';
import type { Job } from '@/types/job';
import { ApplicationModal } from '@/components/Careers/ApplicationModal';
//

const benefits = [
  {
    icon: <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: 'Competitive Salary',
    description: 'We offer competitive salaries and equity packages.',
    color: 'from-blue-50 to-blue-100',
    border: 'border-blue-200',
    iconColor: 'text-blue-600'
  },
  {
    icon: <Clock className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: 'Flexible Hours',
    description: 'Flexible working hours and remote work options.',
    color: 'from-blue-50 to-blue-100',
    border: 'border-blue-200',
    iconColor: 'text-blue-600'
  },
  {
    icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: 'Great Team',
    description: 'Work with talented and passionate people.',
    color: 'from-blue-50 to-blue-100',
    border: 'border-blue-200',
    iconColor: 'text-blue-600'
  },
  {
    icon: <BarChart2 className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: 'Career Growth',
    description: 'Clear career paths and mentorship opportunities.',
    color: 'from-blue-50 to-blue-100',
    border: 'border-blue-200',
    iconColor: 'text-blue-600'
  }
] as const;

export default function Careers() {
  const toast = useToast();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const { user } = useAuth();

  // Safe selected job with fallback
  const safeSelectedJob = selectedJob || {
    _id: '',
    title: 'Select a job',
    department: '',
    location: '',
    type: '',
    description: '',
    requirements: [],
    responsibilities: [],
    salary: { min: 0, max: 0, currency: 'USD', period: 'year' },
    isActive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const getCurrencySymbol = (currencyCode: string) => {
    const formatter = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      currencyDisplay: 'symbol'
    });
    
    // Extract the currency symbol
    const parts = formatter.formatToParts(0);
    const currencyPart = parts.find(part => part.type === 'currency');
    return currencyPart?.value || currencyCode;
  };

  const formatSalary = (job: Job) => {
    if (!job.salary) return 'Salary not specified';
    const { min, max, currency, period } = job.salary;
    const currencySymbol = getCurrencySymbol(currency);
    
    const formatValue = (value: number) => {
      return new Intl.NumberFormat(undefined, {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    };

    if (min === max) {
      return `${currencySymbol}${formatValue(min)} per ${period}`;
    }
    return `${currencySymbol}${formatValue(min)} - ${currencySymbol}${formatValue(max)} per ${period}`;
  };

  const handleApplyClick = useCallback((job: Job) => {
    if (!user) {
      navigate('/login', { state: { from: '/careers' } });
      return;
    }
    setSelectedJob(job);
    setIsApplicationModalOpen(true);
  }, [user, navigate]);

  const handleApplicationSubmit = async (formData: FormData) => {
    if (!selectedJob) return;
    
    try {
      setIsApplying(true);
      await applyForJob(selectedJob._id, formData);
      toast.success({
        title: 'Application Submitted',
        description: 'Your application has been submitted successfully!',
      });
      setIsApplicationModalOpen(false);
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error({
        title: 'Error',
        description: 'Failed to submit application. Please try again.',
      });
    } finally {
      setIsApplying(false);
    }
  };

  const fetchJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getJobs();
      setJobs(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load jobs. Please try again later.';
      setError(errorMessage);
      toast.error({
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleApplicationError = useCallback((error: Error) => {
    console.error('Application error:', error);
    toast.error({
      title: 'Error',
      description: error.message || 'An error occurred while processing your application.',
    });
  }, [toast]);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    const trackView = async (jobId: string) => {
      try {
        // Track job view if needed - function not currently in jobService
      } catch (err) {
        console.error('Error tracking job view:', err);
      }
    };

    if (selectedJob?._id) {
      trackView(selectedJob._id);
    }
  }, [selectedJob]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex justify-center items-center transition-colors duration-300">
        <div className="text-center bg-white dark:bg-gray-800 p-6 lg:p-8 rounded-2xl shadow-lg border border-sky-100 dark:border-gray-700">
          <div className="w-12 h-12 lg:w-16 lg:h-16 bg-sky-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6">
            <Loader2 className="h-6 w-6 lg:h-8 lg:w-8 animate-spin text-sky-600 dark:text-green-500" />
          </div>
          <h2 className="text-lg lg:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Loading Opportunities</h2>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">Finding amazing job opportunities for you...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 p-4 lg:p-6 transition-colors duration-300">
        <div className="container mx-auto max-w-2xl pt-16 lg:pt-20">
          <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 lg:px-6 py-6 lg:py-8 rounded-xl shadow-lg text-center">
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-4">
              <RefreshCw className="w-6 h-6 lg:w-8 lg:h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-lg lg:text-xl font-semibold mb-2 lg:mb-3">Oops! Something went wrong</h2>
            <p className="text-sm lg:text-base mb-4 lg:mb-6">{error}</p>
            <Button 
              onClick={fetchJobs}
              className="bg-sky-600 hover:bg-sky-700 dark:bg-green-600 dark:hover:bg-green-700 text-white px-4 lg:px-6 py-2 lg:py-2 text-sm lg:text-base rounded-lg font-medium transition-colors"
            >
              <RefreshCw className="mr-2 h-3 w-3 lg:h-4 lg:w-4" />
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  if (jobs.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 p-4 lg:p-6 transition-colors duration-300">
        <div className="container mx-auto max-w-4xl pt-16 lg:pt-20">
          <div className="text-center bg-white dark:bg-gray-800 p-8 lg:p-12 rounded-2xl shadow-lg border border-sky-100 dark:border-gray-700">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-sky-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6">
              <Briefcase className="h-8 w-8 lg:h-10 lg:w-10 text-sky-600 dark:text-green-500" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-3 lg:mb-4">No Open Positions</h2>
            <p className="text-gray-600 dark:text-gray-400 text-base lg:text-lg mb-6 lg:mb-8 max-w-md mx-auto">
              We don't have any open positions at the moment. Please check back later!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 justify-center">
              <Button 
                onClick={fetchJobs} 
                className="bg-sky-600 hover:bg-sky-700 dark:bg-green-600 dark:hover:bg-green-700 text-white px-4 lg:px-6 py-2 lg:py-3 text-sm lg:text-base rounded-lg font-medium transition-colors"
              >
                <RefreshCw className="mr-2 h-3 w-3 lg:h-4 lg:w-4" /> Refresh Jobs
              </Button>
              <Button 
                onClick={() => window.location.href = 'mailto:replyearnbycode@gmail.com'}
                className="border-2 border-sky-600 dark:border-green-600 text-sky-600 dark:text-green-600 hover:bg-sky-50 dark:hover:bg-gray-700 px-4 lg:px-6 py-2 lg:py-3 text-sm lg:text-base rounded-lg font-medium transition-colors"
              >
                <Mail className="mr-2 h-3 w-3 lg:h-4 lg:w-4" /> Contact Us
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
        {/* Header Section */}
        <div className="text-center mb-8 lg:mb-12">
          <div className="bg-gradient-to-r from-sky-500 to-sky-600 dark:from-gray-800 dark:to-green-900 text-white p-6 sm:p-8 lg:p-10 rounded-2xl shadow-xl mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 lg:mb-4">Join Our Team</h1>
            <p className="text-sm sm:text-base lg:text-lg text-sky-100 dark:text-green-100 max-w-2xl mx-auto leading-relaxed">
              We're looking for talented individuals who are passionate about creating amazing products and experiences.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
          {/* Job Listings Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-sky-100 dark:border-gray-700 overflow-hidden sticky top-6">
              <div className="bg-gradient-to-r from-sky-500 to-sky-600 dark:from-gray-700 dark:to-green-800 px-4 lg:px-6 py-3 lg:py-4">
                <h2 className="text-base lg:text-lg font-semibold text-white flex items-center">
                  <Briefcase className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                  Open Positions ({jobs.length})
                </h2>
              </div>
              
              <div className="p-2 lg:p-3 max-h-96 lg:max-h-[32rem] overflow-y-auto">
                {jobs.length > 0 ? (
                  <div className="space-y-2 lg:space-y-3">
                    {jobs.map((job) => (
                      <div
                        key={job._id}
                        className={`p-3 lg:p-4 rounded-lg cursor-pointer transition-all duration-300 ${
                          selectedJob?._id === job._id 
                            ? 'bg-sky-500 dark:bg-green-700 text-white shadow-lg transform scale-[1.02]' 
                            : 'bg-sky-50 dark:bg-gray-700 hover:bg-sky-100 dark:hover:bg-gray-600 border border-sky-200 dark:border-gray-600 hover:shadow-md'
                        }`}
                        onClick={() => setSelectedJob(job)}
                      >
                        <h3 className={`text-sm lg:text-base font-semibold ${selectedJob?._id === job._id ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                          {job.title}
                        </h3>
                        <div className="flex flex-col gap-1 mt-2">
                          <p className={`text-xs lg:text-sm ${selectedJob?._id === job._id ? 'text-sky-100 dark:text-green-100' : 'text-gray-600 dark:text-gray-400'}`}>
                            {job.type} • {job.location}
                          </p>
                          <p className={`text-xs lg:text-sm font-medium ${selectedJob?._id === job._id ? 'text-sky-100 dark:text-green-100' : 'text-sky-600 dark:text-green-500'}`}>
                            {job.salary ? formatSalary(job) : 'Competitive Salary'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 lg:py-12">
                    <Briefcase className="w-12 h-12 lg:w-16 lg:h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-base lg:text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No Open Positions</h3>
                    <p className="text-sm lg:text-base text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                      We don't have any open positions at the moment, but we're always looking for talented people.
                    </p>
                    <Button className="mt-4 lg:mt-6 bg-sky-500 hover:bg-sky-600 dark:bg-green-600 dark:hover:bg-green-700 text-white text-sm lg:text-base">
                      <Mail className="mr-2 h-3 w-3 lg:h-4 lg:w-4" />
                      Contact Us
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Job Details Main Content */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            {selectedJob ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-sky-100 dark:border-gray-700 overflow-hidden">
                {/* Job Header */}
                <div className="bg-gradient-to-r from-sky-500 to-sky-600 dark:from-gray-700 dark:to-green-800 px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="text-white">
                      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 lg:mb-3">{selectedJob.title}</h2>
                      <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-sky-100 dark:text-green-100">
                        <span className="flex items-center bg-sky-400/30 dark:bg-green-600/30 px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm font-medium">
                          {selectedJob.type}
                        </span>
                        <span className="flex items-center text-xs lg:text-sm">
                          <MapPin className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                          {selectedJob.location}
                        </span>
                        <span className="flex items-center text-xs lg:text-sm">
                          <DollarSign className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                          {selectedJob.salary ? formatSalary(selectedJob) : 'Competitive Salary'}
                        </span>
                      </div>
                    </div>
                    <Button 
                      className="bg-white text-sky-600 hover:bg-sky-50 dark:bg-gray-100 dark:text-green-700 dark:hover:bg-gray-200 border border-sky-200 dark:border-green-200 shadow-lg font-semibold whitespace-nowrap text-sm lg:text-base"
                      onClick={() => handleApplyClick(selectedJob)}
                    >
                      Apply Now
                    </Button>
                  </div>
                </div>

                {/* Job Content */}
                <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
                  <div>
                    <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 lg:mb-4 flex items-center">
                      <div className="w-2 h-4 lg:h-6 bg-sky-500 dark:bg-green-600 rounded mr-3"></div>
                      Job Description
                    </h3>
                    <div className="bg-sky-50 dark:bg-gray-700 p-4 lg:p-6 rounded-lg border border-sky-200 dark:border-gray-600">
                      <p className="text-sm lg:text-base text-gray-700 dark:text-gray-300 leading-relaxed">{selectedJob.description}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 lg:mb-4 flex items-center">
                      <div className="w-2 h-4 lg:h-6 bg-sky-500 dark:bg-green-600 rounded mr-3"></div>
                      Requirements
                    </h3>
                    <div className="bg-sky-50 dark:bg-gray-700 p-4 lg:p-6 rounded-lg border border-sky-200 dark:border-gray-600">
                      <ul className="space-y-2 lg:space-y-3">
                        {selectedJob.requirements.map((req: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <div className="w-2 h-2 bg-sky-500 dark:bg-green-600 rounded-full mt-1.5 lg:mt-2 mr-3 flex-shrink-0"></div>
                            <span className="text-sm lg:text-base text-gray-700 dark:text-gray-300">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 lg:mb-4 flex items-center">
                      <div className="w-2 h-4 lg:h-6 bg-sky-500 dark:bg-green-600 rounded mr-3"></div>
                      Responsibilities
                    </h3>
                    <div className="bg-sky-50 dark:bg-gray-700 p-4 lg:p-6 rounded-lg border border-sky-200 dark:border-gray-600">
                      <ul className="space-y-2 lg:space-y-3">
                        {selectedJob.responsibilities.map((resp: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <div className="w-2 h-2 bg-sky-500 dark:bg-green-600 rounded-full mt-1.5 lg:mt-2 mr-3 flex-shrink-0"></div>
                            <span className="text-sm lg:text-base text-gray-700 dark:text-gray-300">{resp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Benefits Section */}
                  <div>
                    <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 lg:mb-6 flex items-center">
                      <div className="w-2 h-4 lg:h-6 bg-sky-500 dark:bg-green-600 rounded mr-3"></div>
                      Why Join Us?
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                      {benefits.map((benefit, i) => (
                        <div 
                          key={i}
                          className="p-4 lg:p-6 rounded-lg border border-sky-200 dark:border-gray-600 bg-gradient-to-br from-sky-50 to-sky-100 dark:from-gray-700 dark:to-gray-600 hover:shadow-lg transition-all duration-300 hover:scale-105"
                        >
                          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center mb-3 lg:mb-4 shadow-md">
                            <span className="text-sky-600 dark:text-green-500">{benefit.icon}</span>
                          </div>
                          <h4 className="text-sm lg:text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">{benefit.title}</h4>
                          <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">{benefit.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Apply Button */}
                  <div className="pt-4 lg:pt-6 border-t border-sky-100 dark:border-gray-700">
                    <Button 
                      className="bg-sky-500 hover:bg-sky-600 dark:bg-green-600 dark:hover:bg-green-700 text-white w-full sm:w-auto px-6 lg:px-8 py-2 lg:py-3 text-sm lg:text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      onClick={() => handleApplyClick(selectedJob)}
                    >
                      Apply for this Position
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-sky-100 dark:border-gray-700 p-8 lg:p-12 text-center h-full flex flex-col items-center justify-center min-h-[400px] lg:min-h-[600px]">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-sky-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 lg:mb-6">
                  <Briefcase className="w-8 h-8 lg:w-10 lg:h-10 text-sky-600 dark:text-green-500" />
                </div>
                <h3 className="text-xl lg:text-2xl font-semibold mb-3 lg:mb-4 text-gray-900 dark:text-gray-100">
                  Select a Position
                </h3>
                <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 max-w-md leading-relaxed">
                  Choose a job opening from the list to view its details, requirements, and apply.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Application Modal */}
        {selectedJob && (
          <ApplicationModal
            isOpen={isApplicationModalOpen}
            onClose={() => setIsApplicationModalOpen(false)}
            jobId={selectedJob._id}
            jobTitle={selectedJob.title}
            onSubmit={handleApplicationSubmit}
            onError={handleApplicationError}
            isSubmitting={isApplying}
          />
        )}
      </div>
    </div>
  );
}