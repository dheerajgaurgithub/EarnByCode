import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJobById, applyForJob } from '@/services/jobService';
import type { Job } from '@/types/job';
import { Loader2, MapPin, DollarSign, Clock, Users, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApplicationModal } from '@/components/Careers/ApplicationModal';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const JobDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const fetchJob = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getJobById(id);
      setJob(data);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load job');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const onApplyClick = () => {
    if (!user) {
      navigate('/login', { state: { from: `/jobs/${id}` } });
      return;
    }
    setIsApplicationModalOpen(true);
  };

  const handleApplicationSubmit = async (formData: FormData) => {
    if (!id) return;
    try {
      setIsApplying(true);
      await applyForJob(id, formData);
      toast.success({ title: 'Application Submitted', description: 'Your application has been submitted successfully!' });
      setIsApplicationModalOpen(false);
    } catch (e: any) {
      toast.error({ title: 'Error', description: e?.message || 'Failed to submit application' });
    } finally {
      setIsApplying(false);
    }
  };

  const salaryText = useMemo(() => {
    if (!job?.salary) return 'Competitive salary';
    const { min, max, currency, period } = job.salary;
    const fmt = (v: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(v);
    if (min === max) return `${currency} ${fmt(min)} per ${period}`;
    return `${currency} ${fmt(min)} - ${currency} ${fmt(max)} per ${period}`;
  }, [job]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-sky-600 dark:text-emerald-400" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800 p-6">
            <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Job not found'}</p>
            <Button onClick={() => navigate('/careers')} className="bg-sky-600 hover:bg-sky-700 text-white">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Careers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
        <div className="mb-4">
          <Button onClick={() => navigate('/careers')} variant="outline" className="border-slate-300 dark:border-gray-700">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Careers
          </Button>
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-sky-500 to-sky-600 dark:from-gray-700 dark:to-green-800 text-white rounded-2xl shadow-xl p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sky-100">
                <span className="flex items-center bg-sky-400/30 px-3 py-1 rounded-full text-sm font-medium">
                  <Clock className="h-4 w-4 mr-2" /> {job.type}
                </span>
                <span className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-1" /> {job.location}
                </span>
                <span className="flex items-center text-sm">
                  <DollarSign className="h-4 w-4 mr-1" /> {salaryText}
                </span>
              </div>
            </div>
            <Button onClick={onApplyClick} className="bg-white text-sky-600 hover:bg-sky-50 dark:bg-gray-100 dark:text-green-700 dark:hover:bg-gray-200">
              Apply Now
            </Button>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-slate-200 dark:border-gray-700 p-6 sm:p-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">About the role</h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{job.description}</p>
          </section>

          {Array.isArray(job.requirements) && job.requirements.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">Requirements</h2>
              <ul className="list-disc ml-5 space-y-2 text-gray-700 dark:text-gray-300">
                {job.requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </section>
          )}

          {Array.isArray(job.responsibilities) && job.responsibilities.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">Responsibilities</h2>
              <ul className="list-disc ml-5 space-y-2 text-gray-700 dark:text-gray-300">
                {job.responsibilities.map((resp, i) => (
                  <li key={i}>{resp}</li>
                ))}
              </ul>
            </section>
          )}

          <div className="pt-4 border-t border-slate-200 dark:border-gray-700">
            <Button onClick={onApplyClick} className="bg-sky-600 hover:bg-sky-700 text-white">
              Apply for this Position
            </Button>
          </div>
        </div>
      </div>

      {job && (
        <ApplicationModal
          isOpen={isApplicationModalOpen}
          onClose={() => setIsApplicationModalOpen(false)}
          jobId={job._id}
          jobTitle={job.title}
          onSubmit={handleApplicationSubmit}
          onError={(e: Error) => toast.error({ title: 'Error', description: e.message })}
          isSubmitting={isApplying}
        />
      )}
    </div>
  );
};

export default JobDetail;
