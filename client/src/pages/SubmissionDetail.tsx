import React, { useEffect, useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/lib/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, CheckCircle, X, Clock, AlertCircle, Code2 } from 'lucide-react';

type Submission = {
  _id: string;
  problem: { _id: string; title?: string } | string;
  language: string;
  status: string;
  code?: string;
  runtime?: string;
  memory?: string;
  testsPassed?: number;
  totalTests?: number;
  createdAt: string;
};

const SubmissionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    const fetchOne = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await apiService.get<{ submission: Submission }>(`/submissions/${id}`);
        const s = (data as any).submission || (data as any);
        setSubmission(s);
      } catch (e: any) {
        setError(e?.message || 'Failed to load submission');
      } finally {
        setLoading(false);
      }
    };
    fetchOne();
  }, [id]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'accepted') return 'text-green-700 bg-green-100 border-green-200';
    if (s === 'time limit exceeded') return 'text-orange-700 bg-orange-100 border-orange-200';
    if (s === 'runtime error' || s === 'compilation error') return 'text-purple-700 bg-purple-100 border-purple-200';
    if (s === 'wrong answer') return 'text-red-700 bg-red-100 border-red-200';
    return 'text-gray-700 bg-gray-100 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'accepted') return <CheckCircle className="h-4 w-4" />;
    if (s === 'wrong answer') return <X className="h-4 w-4" />;
    if (s === 'time limit exceeded') return <Clock className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-4 sm:py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <Link to="/submissions" className="inline-flex items-center text-blue-700 hover:text-blue-900">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Submissions
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{error}</div>
        ) : !submission ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg">Submission not found</div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-blue-100 bg-blue-50">
              <h1 className="text-lg sm:text-xl font-semibold text-blue-900 flex items-center">
                <Code2 className="h-5 w-5 mr-2 text-blue-600" />
                Submission Details
              </h1>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-blue-700">Problem</p>
                  <Link
                    to={`/problems/${typeof submission.problem === 'object' ? submission.problem._id : submission.problem}`}
                    className="text-blue-900 font-medium hover:text-blue-600"
                  >
                    {typeof submission.problem === 'object' && submission.problem.title
                      ? submission.problem.title
                      : `#${typeof submission.problem === 'object' ? submission.problem._id : submission.problem}`}
                  </Link>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-blue-700">Submitted</p>
                  <div className="flex items-center text-blue-900">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(submission.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-blue-700">Language</p>
                  <p className="capitalize text-blue-900 font-medium">{submission.language}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-blue-700">Status</p>
                  <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-lg border ${getStatusColor(submission.status)}`}>
                    {getStatusIcon(submission.status)}
                    <span className="font-medium text-sm">{submission.status}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {submission.runtime && (
                  <div className="text-center">
                    <p className="text-blue-700 text-xs">Runtime</p>
                    <p className="text-blue-900 font-medium">{submission.runtime}</p>
                  </div>
                )}
                {submission.memory && (
                  <div className="text-center">
                    <p className="text-blue-700 text-xs">Memory</p>
                    <p className="text-blue-900 font-medium">{submission.memory}</p>
                  </div>
                )}
                {typeof submission.testsPassed === 'number' && typeof submission.totalTests === 'number' && (
                  <div className="text-center col-span-2">
                    <p className="text-blue-700 text-xs">Tests Passed</p>
                    <p className="text-blue-900 font-medium">{submission.testsPassed}/{submission.totalTests}</p>
                  </div>
                )}
              </div>

              {submission.code && (
                <div>
                  <h3 className="text-blue-900 font-semibold mb-2">Submitted Code</h3>
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 sm:p-4 overflow-auto">
                    <pre className="text-gray-800 text-xs sm:text-sm whitespace-pre-wrap break-words">{submission.code}</pre>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SubmissionDetail;
