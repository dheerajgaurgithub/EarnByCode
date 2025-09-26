import React, { useEffect, useState } from 'react';
import { useParams, Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/lib/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, CheckCircle, X, Clock, AlertCircle, Code2 } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';

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
  const navigate = useNavigate();
  const { t } = useI18n();
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
        setError(e?.message || t('subs.detail.not_found'));
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
    if (s === 'wrong answer') return 'text-red-800 bg-red-100 border-red-300 dark:text-red-200 dark:bg-red-900/30 dark:border-red-700';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50 dark:from-gray-900 dark:to-gray-800 py-6 sm:py-8 transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6 sm:mb-8">
          <button
            type="button"
            onClick={() => {
              // Prefer history back; fallback to submissions if there's no prior entry
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/submissions', { replace: true });
              }
            }}
            className="inline-flex items-center px-4 py-2 text-sky-700 dark:text-emerald-300 hover:text-sky-900 dark:hover:text-emerald-100 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-slate-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 text-sm sm:text-base font-medium"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-2" /> {t('subs.detail.back')}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-200 dark:border-emerald-200 border-t-sky-600 dark:border-t-emerald-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 p-6 rounded-xl shadow-lg text-sm sm:text-base">{error}</div>
        ) : !submission ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 p-6 rounded-xl shadow-lg text-sm sm:text-base">{t('subs.detail.not_found')}</div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-700 overflow-hidden transition-all duration-300"
          >
            {/* Header */}
            <div className="px-6 sm:px-8 py-6 border-b border-slate-200 dark:border-gray-600 bg-gradient-to-r from-sky-50 to-sky-100 dark:from-gray-700 dark:to-gray-600">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white flex items-center">
                <Code2 className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 mr-3 text-sky-600 dark:text-emerald-400" />
                {t('subs.detail.title')}
              </h1>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
              {/* Main Information Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-3">
                  <p className="text-sm sm:text-base font-semibold text-gray-600 dark:text-gray-300">{t('subs.detail.problem')}</p>
                  <Link
                    to={`/problems/${typeof submission.problem === 'object' ? submission.problem._id : submission.problem}`}
                    className="inline-flex items-center text-sky-700 dark:text-emerald-300 font-semibold hover:text-sky-900 dark:hover:text-emerald-100 text-base sm:text-lg transition-all duration-200 hover:underline"
                  >
                    {typeof submission.problem === 'object' && submission.problem.title
                      ? submission.problem.title
                      : `#${typeof submission.problem === 'object' ? submission.problem._id : submission.problem}`}
                  </Link>
                </div>

                <div className="space-y-3">
                  <p className="text-sm sm:text-base font-semibold text-gray-600 dark:text-gray-300">{t('subs.detail.submitted')}</p>
                  <div className="flex items-center text-gray-800 dark:text-gray-200 text-sm sm:text-base">
                    <Calendar className="h-5 w-5 mr-3 text-sky-600 dark:text-emerald-400" />
                    {new Date(submission.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm sm:text-base font-semibold text-gray-600 dark:text-gray-300">{t('subs.detail.language')}</p>
                  <p className="capitalize text-gray-800 dark:text-gray-200 font-semibold text-base sm:text-lg">{submission.language}</p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm sm:text-base font-semibold text-gray-600 dark:text-gray-300">{t('subs.detail.status')}</p>
                  <div className={`inline-flex items-center space-x-3 px-4 py-2 rounded-xl border font-medium text-sm sm:text-base ${getStatusColor(submission.status)}`}>
                    {getStatusIcon(submission.status)}
                    <span>{submission.status}</span>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-slate-50 dark:bg-gray-700 rounded-xl p-6 border border-slate-200 dark:border-gray-600">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-6">Performance Metrics</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {submission.runtime && (
                    <div className="text-center bg-white dark:bg-gray-800 rounded-xl p-4 border border-slate-200 dark:border-gray-600 shadow-sm">
                      <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm font-medium mb-2">{t('subs.detail.runtime')}</p>
                      <p className="text-gray-900 dark:text-white font-bold text-lg sm:text-xl">{submission.runtime}</p>
                    </div>
                  )}
                  {submission.memory && (
                    <div className="text-center bg-white dark:bg-gray-800 rounded-xl p-4 border border-slate-200 dark:border-gray-600 shadow-sm">
                      <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm font-medium mb-2">{t('subs.detail.memory')}</p>
                      <p className="text-gray-900 dark:text-white font-bold text-lg sm:text-xl">{submission.memory}</p>
                    </div>
                  )}
                  {typeof submission.testsPassed === 'number' && typeof submission.totalTests === 'number' && (
                    <div className="text-center bg-white dark:bg-gray-800 rounded-xl p-4 border border-slate-200 dark:border-gray-600 shadow-sm sm:col-span-2 lg:col-span-2">
                      <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm font-medium mb-2">{t('subs.detail.tests_passed')}</p>
                      <p className="text-gray-900 dark:text-white font-bold text-lg sm:text-xl">{submission.testsPassed}/{submission.totalTests}</p>
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-sky-500 to-sky-600 dark:from-emerald-500 dark:to-emerald-600 h-2 rounded-full transition-all duration-300" 
                            style={{width: `${(submission.testsPassed / submission.totalTests) * 100}%`}}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submitted Code */}
              {submission.code && (
                <div className="space-y-4">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white flex items-center">
                    <Code2 className="h-5 w-5 sm:h-6 sm:w-6 mr-3 text-sky-600 dark:text-emerald-400" />
                    {t('subs.detail.submitted_code')}
                  </h3>
                  <div className="bg-slate-50 dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-600 overflow-hidden">
                    <div className="bg-slate-100 dark:bg-gray-800 px-4 py-3 border-b border-slate-200 dark:border-gray-600">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        </div>
                        <span className="text-gray-600 dark:text-gray-300 text-sm font-medium ml-4">{submission.language}</span>
                      </div>
                    </div>
                    <div className="p-4 sm:p-6 overflow-auto max-h-96">
                      <pre className="text-gray-800 dark:text-gray-200 text-xs sm:text-sm lg:text-base leading-relaxed whitespace-pre-wrap break-words font-mono">{submission.code}</pre>
                    </div>
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