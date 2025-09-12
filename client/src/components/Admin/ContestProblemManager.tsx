import React, { useState, useEffect, Fragment } from 'react';
import { Plus, X, Search, Loader2 } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import apiService from '../../services/api';
import { useAuth } from '../../context/AuthContext';
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: {
    problems?: T[];
    problem?: T;
  };
  problems?: T[];
  problem?: T;
}

interface ApiError {
  message: string;
  response?: {
    data?: {
      message?: string;
    };
  };
  status?: number;
}

export interface Problem {
  _id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'easy' | 'medium' | 'hard';
  category: string;
  tags: string[];
  testCases: Array<{ input: string; output: string }>;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

interface ContestProblemManagerProps {
  contestId: string;
  isOpen: boolean;
  onClose: () => void;
  onProblemsUpdated: () => void;
}

const ContestProblemManager: React.FC<ContestProblemManagerProps> = ({
  contestId,
  isOpen,
  onClose,
  onProblemsUpdated
}) => {
  const { user } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [contestProblems, setContestProblems] = useState<Problem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all problems and contest problems
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchData = async () => {
      if (!user?.isAdmin) return;
      
      setIsLoading(true);
      setError('');
      
      try {
        const [allProblemsRes, contestProblemsRes] = await Promise.all([
          apiService.get<ApiResponse<Problem[]>>(`/problems?search=${searchTerm}`),
          apiService.get<ApiResponse<Problem[]>>(`/contest-problems/${contestId}`)
        ]);
        
        // Handle both response formats
        setProblems(
          (allProblemsRes as any)?.data?.data?.problems || 
          (allProblemsRes as any)?.data?.problems || 
          (allProblemsRes as any)?.problems || 
          []
        );
        
        setContestProblems(
          (contestProblemsRes as any)?.data?.data?.problems || 
          (contestProblemsRes as any)?.data?.problems || 
          (contestProblemsRes as any)?.problems || 
          []
        );
      } catch (err) {
        const error = err as ApiError;
        console.error('Error fetching problems:', error);
        setError(error.response?.data?.message || error.message || 'Failed to fetch problems');
      } finally {
        setIsLoading(false);
      }
    };
    
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [contestId, isOpen, searchTerm, user?.isAdmin]);

  const handleAddProblem = async (problemId: string) => {
    if (!user?.isAdmin) return;
    
    try {
      await apiService.post(`/contest-problems/${contestId}`, { problemId });
      
      // Refresh the problem lists
      const [allProblemsRes, contestProblemsRes] = await Promise.all([
        apiService.get(`/problems?search=${searchTerm}`),
        apiService.get(`/contest-problems/${contestId}`)
      ]);
      
      setProblems(
        (allProblemsRes as any)?.data?.data?.problems || 
        (allProblemsRes as any)?.data?.problems || 
        (allProblemsRes as any)?.problems || 
        []
      );
      
      setContestProblems(
        (contestProblemsRes as any)?.data?.data?.problems || 
        (contestProblemsRes as any)?.data?.problems || 
        (contestProblemsRes as any)?.problems || 
        []
      );
      
      onProblemsUpdated();
    } catch (err) {
      const error = err as ApiError;
      console.error('Error adding problem to contest:', error);
      setError(error.response?.data?.message || error.message || 'Failed to add problem to contest');
    }
  };

  const handleRemoveProblem = async (problemId: string) => {
    if (!user?.isAdmin) return;
    
    try {
      // Use the request method directly with the correct endpoint
      await (apiService as any).request('DELETE', `/admin/contests/${contestId}/problems/${problemId}`);
      
      // Refresh the problem lists
      const [allProblemsRes, contestProblemsRes] = await Promise.all([
        apiService.get<ApiResponse<Problem[]>>(`/problems?search=${searchTerm}`),
        apiService.get<ApiResponse<Problem[]>>(`/admin/contests/${contestId}/problems`)
      ]);
      
      setProblems(
        (allProblemsRes as any)?.data?.data?.problems || 
        (allProblemsRes as any)?.data?.problems || 
        (allProblemsRes as any)?.problems || 
        []
      );
      
      setContestProblems(
        (contestProblemsRes as any)?.data?.data?.problems || 
        (contestProblemsRes as any)?.data?.problems || 
        (contestProblemsRes as any)?.problems || 
        []
      );
      
      onProblemsUpdated();
    } catch (err) {
      const error = err as ApiError;
      console.error('Error removing problem from contest:', error);
      setError(error.response?.data?.message || error.message || 'Failed to remove problem from contest');
    }
  };

  // Check if a problem is already added to the contest
  const isProblemInContest = (problemId: string) => {
    return contestProblems.some(p => p._id === problemId);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Manage Contest Problems
                </Dialog.Title>
                
                {error && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
                    {error}
                  </div>
                )}
                
                <div className="mt-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search problems..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Problems in Contest</h4>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                    {isLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      </div>
                    ) : contestProblems.length === 0 ? (
                      <p className="text-sm text-gray-500">No problems added to this contest yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {contestProblems.map((problem) => (
                          <li key={problem._id} className="flex justify-between items-center p-2 bg-white rounded border border-gray-200">
                            <div>
                              <span className="font-medium">{problem.title}</span>
                              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                                {problem.difficulty}
                              </span>
                            </div>
                            <button
                              onClick={() => handleRemoveProblem(problem._id)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Remove from contest"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Available Problems</h4>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                    {isLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      </div>
                    ) : problems.length === 0 ? (
                      <p className="text-sm text-gray-500">No problems found.</p>
                    ) : (
                      <ul className="space-y-2">
                        {problems
                          .filter(p => !contestProblems.some(cp => cp._id === p._id))
                          .map((problem) => (
                            <li key={problem._id} className="flex justify-between items-center p-2 bg-white rounded border border-gray-200">
                              <div>
                                <span className="font-medium">{problem.title}</span>
                                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                                  {problem.difficulty}
                                </span>
                              </div>
                              <button
                                onClick={() => handleAddProblem(problem._id)}
                                className="text-green-600 hover:text-green-800 p-1"
                                title="Add to contest"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ContestProblemManager;