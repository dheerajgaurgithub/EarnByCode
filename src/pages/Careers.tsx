import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { getJobs, applyForJob } from '@/services/jobService';
import { Loader2, Briefcase, Mail, MapPin, DollarSign, Clock, Users, BarChart2, RefreshCw } from 'lucide-react';
import type { Job } from '@/services/jobService';
import { ApplicationModal } from '@/components/Careers/ApplicationModal';
import { formatDistanceToNow } from 'date-fns';

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex justify-center items-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg border border-blue-100">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Loading Opportunities</h2>
          <p className="text-slate-600">Finding amazing job opportunities for you...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
        <div className="container mx-auto max-w-2xl pt-20">
          <div className="bg-white border border-red-200 text-red-700 px-6 py-8 rounded-xl shadow-lg text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold mb-3">Oops! Something went wrong</h2>
            <p className="mb-6">{error}</p>
            <Button 
              onClick={fetchJobs}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
        <div className="container mx-auto max-w-4xl pt-20">
          <div className="text-center bg-white p-12 rounded-2xl shadow-lg border border-blue-100">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Briefcase className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-4">No Open Positions</h2>
            <p className="text-slate-600 text-lg mb-8 max-w-md mx-auto">
              We don't have any open positions at the moment. Please check back later!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={fetchJobs} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh Jobs
              </Button>
              <Button 
                onClick={() => window.location.href = 'mailto:careers@example.com'}
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <Mail className="mr-2 h-4 w-4" /> Contact Us
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 sm:p-12 rounded-2xl shadow-xl mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Join Our Team</h1>
            <p className="text-lg sm:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              We're looking for talented individuals who are passionate about creating amazing products and experiences.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Job Listings Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Open Positions ({jobs.length})
                </h2>
              </div>
              
              <div className="p-2">
                {jobs.length > 0 ? (
                  <div className="space-y-2">
                    {jobs.map((job) => (
                      <div
                        key={job._id}
                        className={`p-4 rounded-lg cursor-pointer transition-all duration-300 ${
                          selectedJob?._id === job._id 
                            ? 'bg-blue-600 text-white shadow-lg transform scale-[1.02]' 
                            : 'bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:shadow-md'
                        }`}
                        onClick={() => setSelectedJob(job)}
                      >
                        <h3 className={`font-semibold ${selectedJob?._id === job._id ? 'text-white' : 'text-slate-800'}`}>
                          {job.title}
                        </h3>
                        <div className="flex flex-col gap-1 mt-2">
                          <p className={`text-sm ${selectedJob?._id === job._id ? 'text-blue-100' : 'text-slate-600'}`}>
                            {job.type} • {job.location}
                          </p>
                          <p className={`text-sm font-medium ${selectedJob?._id === job._id ? 'text-blue-100' : 'text-blue-600'}`}>
                          {job.salary ? formatSalary(job) : 'Competitive Salary'}
                        </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Briefcase className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-700 mb-2">No Open Positions</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                      We don't have any open positions at the moment, but we're always looking for talented people.
                    </p>
                    <Button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white">
                      <Mail className="mr-2 h-4 w-4" />
                      Contact Us
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Job Details Main Content */}
          <div className="lg:col-span-2">
            {selectedJob ? (
              <div className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden">
                {/* Job Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 sm:px-8 py-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="text-white">
                      <h2 className="text-2xl sm:text-3xl font-bold mb-3">{selectedJob.title}</h2>
                      <div className="flex flex-wrap items-center gap-4 text-blue-100">
                        <span className="flex items-center bg-blue-500/30 px-3 py-1 rounded-full text-sm font-medium">
                          {selectedJob.type}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {selectedJob.location}
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {selectedJob.salary ? formatSalary(selectedJob) : 'Competitive Salary'}
                        </span>
                      </div>
                    </div>
                    <Button 
                      className="bg-white text-blue-600 hover:bg-blue-50 border border-blue-200 shadow-lg font-semibold whitespace-nowrap"
                      onClick={() => handleApplyClick(selectedJob)}
                    >
                      Apply Now
                    </Button>
                  </div>
                </div>

                {/* Job Content */}
                <div className="p-6 sm:p-8 space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                      <div className="w-2 h-6 bg-blue-600 rounded mr-3"></div>
                      Job Description
                    </h3>
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <p className="text-slate-700 leading-relaxed">{selectedJob.description}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                      <div className="w-2 h-6 bg-blue-600 rounded mr-3"></div>
                      Requirements
                    </h3>
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <ul className="space-y-3">
                        {selectedJob.requirements.map((req, i) => (
                          <li key={i} className="flex items-start">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <span className="text-slate-700">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                      <div className="w-2 h-6 bg-blue-600 rounded mr-3"></div>
                      Responsibilities
                    </h3>
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <ul className="space-y-3">
                        {selectedJob.responsibilities.map((resp, i) => (
                          <li key={i} className="flex items-start">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <span className="text-slate-700">{resp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Benefits Section */}
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-6 flex items-center">
                      <div className="w-2 h-6 bg-blue-600 rounded mr-3"></div>
                      Why Join Us?
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {benefits.map((benefit, i) => (
                        <div 
                          key={i}
                          className="p-6 rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-all duration-300 hover:scale-105"
                        >
                          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-4 shadow-md">
                            <span className="text-blue-600">{benefit.icon}</span>
                          </div>
                          <h4 className="font-semibold text-slate-800 mb-2">{benefit.title}</h4>
                          <p className="text-sm text-slate-600">{benefit.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Apply Button */}
                  <div className="pt-6 border-t border-blue-100">
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto px-8 py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      onClick={() => handleApplyClick(selectedJob)}
                    >
                      Apply for this Position
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-12 text-center h-full flex flex-col items-center justify-center min-h-[600px]">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                  <Briefcase className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-slate-800">
                  Select a Position
                </h3>
                <p className="text-slate-600 max-w-md leading-relaxed">
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