import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, X, Clock, AlertCircle, Code, Calendar, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiService } from '@/lib/api';
import { useI18n } from '@/context/I18nContext';

export const Submissions: React.FC = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [page, setPage] = useState<number>(parseInt(searchParams.get('page') || '1', 10));
  const [limit, setLimit] = useState<number>(parseInt(searchParams.get('limit') || '10', 10));
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort') || 'date_desc');

  useEffect(() => {
    if (!user) return;
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const params: Record<string, any> = { page, limit };
        if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
        if (sortBy) params.sort = sortBy;
        const data = await apiService.get<{ submissions: any[]; totalPages: number; currentPage: number; total: number }>(`/submissions`, { params } as any);
        const list = (data as any).submissions || (Array.isArray(data) ? data : []);
        setSubmissions(list);
        setTotalPages((data as any).totalPages || 1);
        setTotal((data as any).total || list.length || 0);
      } catch (error) {
        console.error('Error fetching submissions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, [user, statusFilter, page, limit, sortBy]);

  // Keep URL in sync with filters
  useEffect(() => {
    const next = new URLSearchParams();
    if (statusFilter && statusFilter !== 'all') next.set('status', statusFilter);
    if (page !== 1) next.set('page', String(page));
    if (limit !== 10) next.set('limit', String(limit));
    if (sortBy && sortBy !== 'date_desc') next.set('sort', sortBy);
    setSearchParams(next, { replace: true });
  }, [statusFilter, page, limit, sortBy, setSearchParams]);

  // Initialize from localStorage if URL doesn't specify
  useEffect(() => {
    if (!searchParams.get('status')) {
      const saved = localStorage.getItem('subs_status');
      if (saved) setStatusFilter(saved);
    }
    if (!searchParams.get('page')) {
      const saved = localStorage.getItem('subs_page');
      if (saved) setPage(parseInt(saved, 10) || 1);
    }
    if (!searchParams.get('limit')) {
      const saved = localStorage.getItem('subs_limit');
      if (saved) setLimit(parseInt(saved, 10) || 10);
    }
    if (!searchParams.get('sort')) {
      const saved = localStorage.getItem('subs_sort');
      if (saved) setSortBy(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('subs_status', statusFilter);
      localStorage.setItem('subs_page', String(page));
      localStorage.setItem('subs_limit', String(limit));
      localStorage.setItem('subs_sort', sortBy);
    } catch {}
  }, [statusFilter, page, limit, sortBy]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'accepted':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'wrong_answer':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'time_limit_exceeded':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'runtime_error':
        return 'text-purple-600 bg-purple-100 border-purple-200';
      case 'compilation_error':
        return 'text-pink-600 bg-pink-100 border-pink-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'wrong_answer':
        return <X className="h-4 w-4" />;
      case 'time_limit_exceeded':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };
  

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50 dark:from-gray-900 dark:to-gray-800 py-6 sm:py-8 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-700 p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white mb-3 flex items-center">
              <Code className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-sky-600 dark:text-emerald-400 mr-3 sm:mr-4" />
              {t('subs.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base lg:text-lg">
              {t('subs.subtitle')}
            </p>
          </div>
        </div>

        {/* Filter + Sorting + Pagination */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-slate-200 dark:border-gray-700 p-6 mb-8 transition-all duration-300">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            {/* Status Filter */}
            <div className="relative w-full sm:w-auto min-w-[200px]">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-12 pr-4 py-3 w-full bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-500 focus:border-transparent shadow-sm appearance-none text-sm sm:text-base transition-all duration-200"
              >
                <option value="all">{t('subs.filter.all')}</option>
                <option value="accepted">{t('subs.filter.accepted')}</option>
                <option value="wrong_answer">{t('subs.filter.wrong_answer')}</option>
                <option value="time_limit_exceeded">{t('subs.filter.tle')}</option>
                <option value="runtime_error">{t('subs.filter.runtime_error')}</option>
                <option value="compilation_error">{t('subs.filter.compilation_error')}</option>
              </select>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-3">
              <label className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200">{t('subs.sort.label')}</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="py-3 px-4 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-sm sm:text-base text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-500 transition-all duration-200"
              >
                <option value="date_desc">{t('subs.sort.date_desc')}</option>
                <option value="date_asc">{t('subs.sort.date_asc')}</option>
                <option value="status_asc">{t('subs.sort.status_asc')}</option>
                <option value="status_desc">{t('subs.sort.status_desc')}</option>
                <option value="lang_asc">{t('subs.sort.lang_asc')}</option>
                <option value="lang_desc">{t('subs.sort.lang_desc')}</option>
              </select>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-wrap items-center gap-3 ml-auto">
              <button
                className="px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-gray-600 transition-all duration-200"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
              >
                {t('subs.pagination.prev')}
              </button>
              <div className="text-sm sm:text-base text-gray-600 dark:text-gray-300 px-3">
                {t('subs.pagination.page_of').replace('{p}', String(page)).replace('{t}', String(totalPages))}
              </div>
              <button
                className="px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-gray-600 transition-all duration-200"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
              >
                {t('subs.pagination.next')}
              </button>
              <select
                value={limit}
                onChange={(e) => { setPage(1); setLimit(parseInt(e.target.value, 10)); }}
                className="py-3 px-4 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-sm sm:text-base text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-500 transition-all duration-200"
              >
                <option value={10}>{t('subs.pagination.per_page').replace('{n}', '10')}</option>
                <option value={20}>{t('subs.pagination.per_page').replace('{n}', '20')}</option>
                <option value={50}>{t('subs.pagination.per_page').replace('{n}', '50')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-700 overflow-hidden transition-all duration-300">
          {/* Header */}
          <div className="px-6 sm:px-8 py-6 border-b border-slate-200 dark:border-gray-600 bg-gradient-to-r from-sky-50 to-sky-100 dark:from-gray-700 dark:to-gray-600 flex items-center justify-between">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">{t('subs.list.title')}</h2>
            <span className="inline-flex items-center px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-sky-100 dark:bg-emerald-100 text-sky-700 dark:text-emerald-700 border border-sky-200 dark:border-emerald-200">
              {t('subs.list.total').replace('{n}', String(total))}
            </span>
          </div>

          {/* Submissions */}
          <div className="divide-y divide-slate-100 dark:divide-gray-700">
            {submissions.map((submission, index) => (
              <motion.div
                key={submission._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 sm:p-8 hover:bg-slate-50 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer group"
                onClick={() => setSelectedSubmission(submission)}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                    {/* Status Badge */}
                    <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl border font-semibold text-sm sm:text-base w-fit ${getStatusColor(submission.status)}`}>
                      {getStatusIcon(submission.status)}
                      <span>{submission.status}</span>
                    </div>
                    
                    {/* Problem Info */}
                    <div className="flex-1 space-y-3">
                      <Link
                        to={`/problems/${(submission.problem?._id) || submission.problem}`}
                        className="text-gray-800 dark:text-gray-200 font-semibold hover:text-sky-700 dark:hover:text-emerald-300 transition-colors text-base sm:text-lg block group-hover:text-sky-600 dark:group-hover:text-emerald-400"
                      >
                        {submission.problem?.title || `#${(submission.problem?._id) || submission.problem}`}
                      </Link>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Language:</span>
                          <span className="capitalize font-semibold text-sky-700 dark:text-emerald-300 text-sm sm:text-base">{submission.language}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Tests:</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm sm:text-base">
                            {submission.testsPassed}/{submission.totalTests}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <Calendar className="h-4 w-4" />
                          <span className="text-xs sm:text-sm">{new Date(submission.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:text-right lg:min-w-[120px]">
                    {submission.runtime && (
                      <div className="bg-slate-50 dark:bg-gray-700 rounded-lg px-3 py-2 border border-slate-200 dark:border-gray-600">
                        <div className="flex justify-between lg:justify-end items-center gap-2">
                          <span className="font-medium text-sky-600 dark:text-emerald-400 text-xs sm:text-sm">{t('subs.card.runtime')}</span>
                          <span className="font-bold text-gray-800 dark:text-gray-200 text-sm sm:text-base">{submission.runtime}</span>
                        </div>
                      </div>
                    )}
                    {submission.memory && (
                      <div className="bg-slate-50 dark:bg-gray-700 rounded-lg px-3 py-2 border border-slate-200 dark:border-gray-600">
                        <div className="flex justify-between lg:justify-end items-center gap-2">
                          <span className="font-medium text-sky-600 dark:text-emerald-400 text-xs sm:text-sm">{t('subs.card.memory')}</span>
                          <span className="font-bold text-gray-800 dark:text-gray-200 text-sm sm:text-base">{submission.memory}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          {submissions.length === 0 && (
            <div className="text-center py-20 px-6">
              <Code className="h-16 w-16 sm:h-20 sm:w-20 text-gray-400 dark:text-gray-500 mx-auto mb-6" />
              <p className="text-gray-700 dark:text-gray-200 text-lg sm:text-xl font-semibold mb-2">{t('subs.empty.title')}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base mb-8">{t('subs.empty.subtitle')}</p>
              <Link
                to="/problems"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-sky-500 to-sky-600 dark:from-emerald-500 dark:to-emerald-600 text-white rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 shadow-md font-medium text-sm sm:text-base"
              >
                {t('subs.empty.cta')}
              </Link>
            </div>
          )}
        </div>

        {/* Submission Detail Modal */}
        {selectedSubmission && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-gray-700 w-full max-w-5xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-200 dark:border-gray-600 bg-gradient-to-r from-sky-50 to-sky-100 dark:from-gray-700 dark:to-gray-600">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white truncate pr-4">
                  {t('subs.modal.title').replace('{title}', selectedSubmission.problem.title)}
                </h3>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors p-2 rounded-xl hover:bg-white/50 dark:hover:bg-gray-600/50"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 sm:p-8 space-y-8">
                {/* Status and Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center bg-slate-50 dark:bg-gray-700 rounded-xl p-4 border border-slate-200 dark:border-gray-600">
                    <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm font-medium mb-3">{t('subs.modal.status')}</p>
                    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border font-medium text-xs sm:text-sm ${getStatusColor(selectedSubmission.status)}`}>
                      {getStatusIcon(selectedSubmission.status)}
                      <span>{selectedSubmission.status}</span>
                    </div>
                  </div>

                  <div className="text-center bg-slate-50 dark:bg-gray-700 rounded-xl p-4 border border-slate-200 dark:border-gray-600">
                    <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm font-medium mb-3">{t('subs.modal.language')}</p>
                    <p className="text-gray-800 dark:text-gray-200 font-bold capitalize text-sm sm:text-base">{selectedSubmission.language}</p>
                  </div>

                  <div className="text-center bg-slate-50 dark:bg-gray-700 rounded-xl p-4 border border-slate-200 dark:border-gray-600">
                    <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm font-medium mb-3">{t('subs.modal.runtime')}</p>
                    <p className="text-gray-800 dark:text-gray-200 font-bold text-sm sm:text-base">{selectedSubmission.runtime}</p>
                  </div>

                  <div className="text-center bg-slate-50 dark:bg-gray-700 rounded-xl p-4 border border-slate-200 dark:border-gray-600">
                    <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm font-medium mb-3">{t('subs.modal.memory')}</p>
                    <p className="text-gray-800 dark:text-gray-200 font-bold text-sm sm:text-base">{selectedSubmission.memory}</p>
                  </div>
                </div>

                {/* Submitted Code */}
                <div className="border-t border-slate-200 dark:border-gray-600 pt-8">
                  <h4 className="text-gray-800 dark:text-gray-200 font-bold mb-4 text-base sm:text-lg flex items-center">
                    <Code className="h-5 w-5 sm:h-6 sm:w-6 mr-3 text-sky-600 dark:text-emerald-400" />
                    {t('subs.modal.submitted_code')}
                  </h4>
                  <div className="bg-slate-50 dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-600 overflow-hidden">
                    <div className="bg-slate-100 dark:bg-gray-800 px-4 py-3 border-b border-slate-200 dark:border-gray-600">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-2">
                          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                          <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        </div>
                        <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">{selectedSubmission.language}</span>
                      </div>
                    </div>
                    <div className="p-4 sm:p-6 max-h-80 overflow-auto">
                      <pre className="text-gray-800 dark:text-gray-200 font-mono text-xs sm:text-sm lg:text-base leading-relaxed whitespace-pre-wrap break-words">
                        {selectedSubmission.code}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Test Results Summary */}
                <div className="border-t border-slate-200 dark:border-gray-600 pt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-gray-800 dark:text-gray-200 font-bold text-base sm:text-lg">{t('subs.modal.test_results')}</h4>
                    <div className="text-right">
                      <span className="text-sky-600 dark:text-emerald-400 font-bold text-base sm:text-lg">
                        {selectedSubmission.testsPassed}/{selectedSubmission.totalTests}
                      </span>
                      <span className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm ml-2">{t('subs.modal.tests_passed')}</span>
                    </div>
                  </div>
                  <div className="bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-sky-500 to-sky-600 dark:from-emerald-500 dark:to-emerald-600 h-3 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(selectedSubmission.testsPassed / selectedSubmission.totalTests) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end pt-6 border-t border-slate-200 dark:border-gray-600">
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="px-8 py-4 bg-gradient-to-r from-sky-500 to-sky-600 dark:from-emerald-500 dark:to-emerald-600 text-white rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 shadow-md font-medium text-sm sm:text-base"
                  >
                    {t('subs.modal.close')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};