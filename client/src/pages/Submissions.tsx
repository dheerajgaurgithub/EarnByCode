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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 flex items-center">
            <Code className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-2 sm:mr-3" />
            {t('subs.title')}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {t('subs.subtitle')}
          </p>
        </div>

        {/* Filter + Sorting + Pagination */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-4 mb-6">
          <div className="relative w-full sm:w-auto">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 w-full sm:w-auto bg-white border border-blue-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm appearance-none"
            >
              <option value="all">{t('subs.filter.all')}</option>
              <option value="accepted">{t('subs.filter.accepted')}</option>
              <option value="wrong_answer">{t('subs.filter.wrong_answer')}</option>
              <option value="time_limit_exceeded">{t('subs.filter.tle')}</option>
              <option value="runtime_error">{t('subs.filter.runtime_error')}</option>
              <option value="compilation_error">{t('subs.filter.compilation_error')}</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">{t('subs.sort.label')}</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-2 px-2 bg-white border border-blue-200 rounded-lg text-sm"
            >
              <option value="date_desc">{t('subs.sort.date_desc')}</option>
              <option value="date_asc">{t('subs.sort.date_asc')}</option>
              <option value="status_asc">{t('subs.sort.status_asc')}</option>
              <option value="status_desc">{t('subs.sort.status_desc')}</option>
              <option value="lang_asc">{t('subs.sort.lang_asc')}</option>
              <option value="lang_desc">{t('subs.sort.lang_desc')}</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <button
              className="px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
            >
              {t('subs.pagination.prev')}
            </button>
            <div className="text-sm text-gray-700">{t('subs.pagination.page_of').replace('{p}', String(page)).replace('{t}', String(totalPages))}</div>
            <button
              className="px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
            >
              {t('subs.pagination.next')}
            </button>
            <select
              value={limit}
              onChange={(e) => { setPage(1); setLimit(parseInt(e.target.value, 10)); }}
              className="ml-2 py-2 px-2 bg-white border border-blue-200 rounded-lg text-sm"
            >
              <option value={10}>{t('subs.pagination.per_page').replace('{n}', '10')}</option>
              <option value={20}>{t('subs.pagination.per_page').replace('{n}', '20')}</option>
              <option value={50}>{t('subs.pagination.per_page').replace('{n}', '50')}</option>
            </select>
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-blue-100 bg-blue-50 flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">{t('subs.list.title')}</h2>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">{t('subs.list.total').replace('{n}', String(total))}</span>
          </div>

          <div className="divide-y divide-blue-100">
            {submissions.map((submission, index) => (
              <motion.div
                key={submission._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 sm:p-6 hover:bg-blue-50/50 transition-colors cursor-pointer"
                onClick={() => setSelectedSubmission(submission)}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-lg border ${getStatusColor(submission.status)} w-fit`}>
                      {getStatusIcon(submission.status)}
                      <span className="font-medium text-xs sm:text-sm">{submission.status}</span>
                    </div>
                    
                    <div className="flex-1">
                      <Link
                        to={`/problems/${(submission.problem?._id) || submission.problem}`}
                        className="text-gray-800 font-medium hover:text-blue-600 transition-colors text-sm sm:text-base"
                      >
                        {submission.problem?.title || `#${(submission.problem?._id) || submission.problem}`}
                      </Link>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-1 text-xs sm:text-sm text-gray-600 space-y-1 sm:space-y-0">
                        <span className="capitalize font-medium">{submission.language}</span>
                        <span>{submission.testsPassed}/{submission.totalTests} {t('subs.card.tests_passed')}</span>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{new Date(submission.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-left lg:text-right">
                    {submission.runtime && (
                      <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                        <div className="flex lg:justify-end">
                          <span className="font-medium text-blue-600">{t('subs.card.runtime')}</span>
                          <span className="ml-2">{submission.runtime}</span>
                        </div>
                        <div className="flex lg:justify-end">
                          <span className="font-medium text-blue-600">{t('subs.card.memory')}</span>
                          <span className="ml-2">{submission.memory}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {submissions.length === 0 && (
            <div className="text-center py-16 px-4">
              <Code className="h-12 sm:h-16 w-12 sm:w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-base sm:text-lg font-medium">{t('subs.empty.title')}</p>
              <p className="text-gray-500 text-sm sm:text-base mt-1">{t('subs.empty.subtitle')}</p>
              <Link
                to="/problems"
                className="inline-block mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-md text-sm sm:text-base"
              >
                {t('subs.empty.cta')}
              </Link>
            </div>
          )}
        </div>

        {/* Submission Detail Modal */}
        {selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-2xl border border-blue-100 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-blue-100 bg-blue-50">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 truncate pr-4">
                  {t('subs.modal.title').replace('{title}', selectedSubmission.problem.title)}
                </h3>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-blue-100"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-gray-600 text-xs sm:text-sm mb-2">{t('subs.modal.status')}</p>
                    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-lg border ${getStatusColor(selectedSubmission.status)}`}>
                      {getStatusIcon(selectedSubmission.status)}
                      <span className="font-medium text-xs sm:text-sm">{selectedSubmission.status}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600 text-xs sm:text-sm mb-2">{t('subs.modal.language')}</p>
                    <p className="text-gray-800 font-medium capitalize text-sm sm:text-base">{selectedSubmission.language}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600 text-xs sm:text-sm mb-2">{t('subs.modal.runtime')}</p>
                    <p className="text-gray-800 font-medium text-sm sm:text-base">{selectedSubmission.runtime}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600 text-xs sm:text-sm mb-2">{t('subs.modal.memory')}</p>
                    <p className="text-gray-800 font-medium text-sm sm:text-base">{selectedSubmission.memory}</p>
                  </div>
                </div>

                <div className="border-t border-blue-100 pt-6">
                  <h4 className="text-gray-800 font-medium mb-3 text-sm sm:text-base">{t('subs.modal.submitted_code')}</h4>
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 sm:p-4">
                    <pre className="text-gray-700 font-mono text-xs sm:text-sm overflow-x-auto whitespace-pre-wrap break-words">
                      {selectedSubmission.code}
                    </pre>
                  </div>
                </div>

                {/* Test Results Summary */}
                <div className="border-t border-blue-100 pt-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-gray-800 font-medium text-sm sm:text-base">{t('subs.modal.test_results')}</h4>
                    <div className="text-right">
                      <span className="text-blue-600 font-medium text-sm sm:text-base">
                        {selectedSubmission.testsPassed}/{selectedSubmission.totalTests}
                      </span>
                      <span className="text-gray-600 text-xs sm:text-sm ml-2">{t('subs.modal.tests_passed')}</span>
                    </div>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(selectedSubmission.testsPassed / selectedSubmission.totalTests) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-blue-100">
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-md text-sm sm:text-base"
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