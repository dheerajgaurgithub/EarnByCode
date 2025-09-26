import React, { useState, useEffect, useCallback } from 'react';
import { ProblemCard } from '../components/Problems/ProblemCard';
import { ProblemFilters } from '../components/Problems/ProblemFilters';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Code2, Target, Sparkles, Search } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';

// Debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const Problems: React.FC = () => {
  const { t } = useI18n();
  interface Problem {
    _id?: string;
    id?: number;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category: string;
    tags?: string[];
    description: string;
    examples?: Array<{ input: string; output: string; explanation?: string }>;
    constraints?: string[];
    starterCode?: Record<string, string>;
    solution?: string;
    testCases?: Array<{ input: string; expectedOutput: string; hidden?: boolean }>;
    acceptance?: number;
    submissions?: number;
    createdBy?: string;
    createdAt?: string;
  }

  const [problems, setProblems] = useState<NormalizedProblem[]>([]);
  const [filteredProblems, setFilteredProblems] = useState<NormalizedProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [difficulty, setDifficulty] = useState('All');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('createdAt');
  const [isSearching, setIsSearching] = useState(false);

  // Initial fetch
  useEffect(() => {
    fetchProblems();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [debouncedSearch, difficulty, category, sortBy, problems]);

   interface NormalizedProblem extends Omit<Problem, 'testCases' | 'examples' | 'constraints' | 'starterCode' | 'acceptance' | 'submissions'> {
    testCases: Array<{ input: string; expectedOutput: string }>;
    examples: Array<{ input: string; output: string; explanation?: string }>;
    constraints: string[];
    starterCode: Record<string, string>;
    acceptance: number;
    submissions: number;
  }

  const fetchProblems = async () => {
    try {
      setLoading(true);
      // Use fetch directly to avoid authentication requirements
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/problems`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();
      
      // Extract problems array from response
      let problemsData: Problem[] = [];
      if (Array.isArray(responseData)) {
        problemsData = responseData;
      } else if (responseData?.problems && Array.isArray(responseData.problems)) {
        problemsData = responseData.problems;
      } else if (responseData?.data && Array.isArray(responseData.data)) {
        problemsData = responseData.data;
      }
      
      // Normalize the data to ensure all required fields are present
      const normalizedProblems = problemsData.map((problem): NormalizedProblem => ({
        ...problem,
        id: problem.id || (problem._id ? parseInt(problem._id, 10) : 0),
        category: problem.category || 'Uncategorized',
        tags: problem.tags || [],
        description: problem.description || '',
        difficulty: problem.difficulty || 'Medium',
        title: problem.title || 'Untitled Problem',
        // Ensure we have default values for required fields
        examples: problem.examples || [],
        constraints: problem.constraints || [],
        starterCode: problem.starterCode || {
          javascript: '// Your JavaScript code here',
          python: '# Your Python code here',
          java: '// Your Java code here',
          cpp: '// Your C++ code here'
        },
        testCases: problem.testCases || [],
        acceptance: problem.acceptance || 0,
        submissions: problem.submissions || 0
      }));
      
      setProblems(normalizedProblems);
      setFilteredProblems(normalizedProblems);
    } catch (error) {
      console.error('Failed to fetch problems:', error);
      // Set empty arrays in case of error to prevent undefined issues
      setProblems([]);
      setFilteredProblems([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    setIsSearching(true);
    
    try {
      let results = [...problems];
      
      // Apply search filter
      if (debouncedSearch) {
        const searchTerm = debouncedSearch.toLowerCase().trim();
        results = results.filter(problem => 
          problem.title.toLowerCase().includes(searchTerm) ||
          (problem.description?.toLowerCase() || '').includes(searchTerm) ||
          (problem.tags?.some((tag: string) => 
            tag.toLowerCase().includes(searchTerm)
          ) || false)
        );
      }
      
      // Apply difficulty filter
      if (difficulty !== 'All') {
        results = results.filter(problem => 
          problem.difficulty?.toLowerCase() === difficulty.toLowerCase()
        );
      }
      
      // Apply category filter
      if (category !== 'All') {
        results = results.filter(problem => 
          problem.tags?.includes(category) ||
          problem.category?.toLowerCase() === category.toLowerCase()
        );
      }
      
      // Apply sorting
      results.sort((a, b) => {
        switch (sortBy) {
          case 'title':
            return a.title.localeCompare(b.title);
          case 'difficulty':
            const difficulties = { 'easy': 1, 'medium': 2, 'hard': 3 };
            return (difficulties[a.difficulty?.toLowerCase() as keyof typeof difficulties] || 0) - 
                   (difficulties[b.difficulty?.toLowerCase() as keyof typeof difficulties] || 0);
          case 'acceptance':
            return (b.acceptance || 0) - (a.acceptance || 0);
          case 'createdAt':
          default:
            return new Date(b.createdAt ?? new Date()).getTime() - new Date(a.createdAt ?? new Date()).getTime();
        }
      });
      
      setFilteredProblems(results);
    } catch (error) {
      console.error('Error applying filters:', error);
      setFilteredProblems(problems);
    } finally {
      setIsSearching(false);
    }
  }, [debouncedSearch, difficulty, category, sortBy, problems]);
  
  const clearFilters = () => {
    setSearch('');
    setDifficulty('All');
    setCategory('All');
    setSortBy('createdAt');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-sky-100 dark:from-gray-950 dark:via-black dark:to-emerald-950 relative overflow-hidden transition-all duration-300">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50/80 via-white/90 to-sky-100/70 dark:from-gray-950/90 dark:via-black/95 dark:to-emerald-950/80 transition-all duration-300"></div>
        
        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            animate={{ 
              y: [0, -20, 0],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-20 left-10 w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-sky-200/30 dark:bg-emerald-900/50 rounded-full blur-xl transition-colors duration-300"
          />
          <motion.div 
            animate={{ 
              y: [0, 20, 0],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            className="absolute top-40 right-20 w-28 h-28 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-sky-300/20 dark:bg-emerald-800/35 rounded-full blur-2xl transition-colors duration-300"
          />
          <motion.div 
            animate={{ 
              y: [0, -15, 0],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ duration: 6, repeat: Infinity, delay: 2 }}
            className="absolute bottom-32 left-1/3 w-40 h-40 sm:w-48 sm:h-48 lg:w-56 lg:h-56 bg-sky-400/15 dark:bg-emerald-700/25 rounded-full blur-3xl transition-colors duration-300"
          />
        </div>
  
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Loading spinner */}
            <div className="relative mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 mx-auto">
                <div className="absolute inset-0 border-2 sm:border-3 border-sky-100 dark:border-gray-700 rounded-full transition-colors duration-300"></div>
                <div className="absolute inset-0 border-2 sm:border-3 border-transparent border-t-sky-500 border-r-sky-400 dark:border-t-emerald-400 dark:border-r-emerald-300 rounded-full animate-spin transition-colors duration-300"></div>
                <div className="absolute inset-1 sm:inset-2 border-2 border-sky-200 dark:border-gray-700 rounded-full animate-pulse transition-colors duration-300"></div>
              </div>
            </div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-base sm:text-lg lg:text-xl font-bold text-sky-900 dark:text-emerald-300 mb-2 transition-colors duration-300"
            >
              {t('problems.loading.title')}
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sky-600 dark:text-emerald-400 text-xs sm:text-sm mb-3 transition-colors duration-300"
            >
              {t('problems.loading.subtitle')}
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex justify-center space-x-2"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                  className="w-1.5 h-1.5 bg-sky-500 dark:bg-emerald-400 rounded-full transition-colors duration-300"
                />
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-sky-100 dark:from-gray-950 dark:via-black dark:to-emerald-950 relative transition-all duration-300">
      {/* Enhanced background with subtle patterns */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50/80 via-white/90 to-sky-100/70 dark:from-gray-950/90 dark:via-black/95 dark:to-emerald-950/80 transition-all duration-300"></div>
        
        {/* Geometric pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08] transition-opacity duration-300">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(14,165,233,0.4)_1px,transparent_1px)] dark:bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.6)_1px,transparent_1px)] bg-[length:40px_40px]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(14,165,233,0.2)_1px,transparent_1px)] dark:bg-[radial-gradient(circle_at_70%_70%,rgba(16,185,129,0.4)_1px,transparent_1px)] bg-[length:60px_60px]"></div>
        </div>
        
        {/* Floating background elements */}
        <div className="absolute top-20 left-10 w-36 h-36 md:w-48 md:h-48 lg:w-60 lg:h-60 bg-gradient-to-r from-sky-200/30 to-sky-300/20 dark:from-emerald-900/40 dark:to-emerald-800/25 rounded-full blur-3xl animate-pulse transition-all duration-300"></div>
        <div className="absolute bottom-32 right-20 w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 bg-gradient-to-l from-sky-300/25 to-sky-400/15 dark:from-emerald-800/35 dark:to-emerald-700/20 rounded-full blur-3xl animate-pulse transition-all duration-300" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 md:w-96 md:h-96 lg:w-[420px] lg:h-[420px] bg-gradient-to-br from-sky-100/20 to-transparent dark:from-emerald-900/25 dark:to-transparent rounded-full blur-3xl transition-all duration-300"></div>
      </div>
      
      <div className="relative z-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-4 lg:py-6">
          {/* Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-4 sm:mb-6 lg:mb-8"
          >
            <div className="relative inline-block mb-2 sm:mb-3">
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black bg-gradient-to-r from-sky-600 via-sky-700 to-sky-800 dark:from-emerald-400 dark:via-emerald-500 dark:to-emerald-600 bg-clip-text text-transparent leading-tight transition-all duration-300">
                {t('problems.title')}
              </h1>
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, duration: 0.6, type: "spring" }}
                className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2"
              >
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-sky-500 dark:text-emerald-400 animate-pulse transition-colors duration-300" />
              </motion.div>
            </div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-xs sm:text-sm text-sky-700 dark:text-emerald-400 mb-3 sm:mb-4 max-w-2xl mx-auto leading-relaxed transition-colors duration-300"
            >
              {t('problems.subtitle')}
            </motion.p>
            
            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 md:gap-4"
            >
              <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-sky-200/60 dark:border-emerald-800/60 rounded-lg px-2.5 sm:px-3 py-2 shadow-lg shadow-sky-100/30 dark:shadow-emerald-900/40 hover:shadow-sky-200/40 dark:hover:shadow-emerald-900/60 transition-all duration-300 w-full sm:w-auto">
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <div className="p-1 bg-sky-100 dark:bg-emerald-900/60 rounded-md transition-colors duration-300">
                    <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-600 dark:text-emerald-300 transition-colors duration-300" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm sm:text-base font-bold text-sky-900 dark:text-emerald-300 transition-colors duration-300">{filteredProblems.length}</div>
                    <div className="text-xs text-sky-600 dark:text-emerald-400 transition-colors duration-300">{t('problems.stats.count')}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-sky-200/60 dark:border-emerald-800/60 rounded-lg px-2.5 sm:px-3 py-2 shadow-lg shadow-sky-100/30 dark:shadow-emerald-900/40 hover:shadow-sky-200/40 dark:hover:shadow-emerald-900/60 transition-all duration-300 w-full sm:w-auto">
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <div className="p-1 bg-sky-100 dark:bg-emerald-900/60 rounded-md transition-colors duration-300">
                    <Code2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-600 dark:text-emerald-300 transition-colors duration-300" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm sm:text-base font-bold text-sky-900 dark:text-emerald-300 transition-colors duration-300">∞</div>
                    <div className="text-xs text-sky-600 dark:text-emerald-400 transition-colors duration-300">{t('problems.stats.learning')}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
  
          {/* Filters Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mb-3 sm:mb-4 lg:mb-6"
          >
            <div className="bg-white/80 dark:bg-gray-900/90 backdrop-blur-sm border border-sky-200/50 dark:border-emerald-800/60 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-xl shadow-sky-100/20 dark:shadow-emerald-900/30 transition-all duration-300">
              <ProblemFilters
                search={search}
                setSearch={setSearch}
                difficulty={difficulty}
                setDifficulty={setDifficulty}
                category={category}
                setCategory={setCategory}
                sortBy={sortBy}
                setSortBy={setSortBy}
              />
            </div>
            
            {/* Active Filters Display */}
            {(search || difficulty !== 'All' || category !== 'All') && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-2 sm:mt-3 bg-white/70 dark:bg-gray-900/80 backdrop-blur-sm border border-sky-200/40 dark:border-emerald-800/50 rounded-lg p-2 sm:p-3 transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center text-sky-800 dark:text-emerald-300 font-medium text-xs transition-colors duration-300">
                    <div className="w-1 h-1 bg-sky-500 dark:bg-emerald-400 rounded-full mr-2 animate-pulse transition-colors duration-300"></div>
                    {t('problems.active_filters')}
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {search && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-sky-100/90 dark:bg-gray-800/90 text-sky-800 dark:text-emerald-300 px-2 py-1 rounded-md flex items-center border border-sky-200/60 dark:border-emerald-700/60 shadow-sm text-xs transition-all duration-300"
                      >
                        <Search className="w-2.5 h-2.5 mr-1" />
                        <span className="font-medium mr-1">{t('problems.filter.search')}</span>
                        <span className="text-sky-700 dark:text-emerald-400 max-w-20 truncate transition-colors duration-300">{search}</span>
                        <button 
                          onClick={() => setSearch('')}
                          className="ml-1 text-sky-600 dark:text-emerald-400 hover:text-sky-800 dark:hover:text-emerald-200 transition-colors p-0.5 hover:bg-sky-200/50 dark:hover:bg-emerald-800/50 rounded-full"
                        >
                          <X className="h-2 w-2" />
                        </button>
                      </motion.div>
                    )}
                    
                    {difficulty !== 'All' && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-sky-100/90 dark:bg-emerald-900/70 text-sky-800 dark:text-emerald-200 px-2 py-1 rounded-md flex items-center border border-sky-200/60 dark:border-emerald-700/60 shadow-sm text-xs transition-all duration-300"
                      >
                        <span className="font-medium mr-1">{t('problems.filter.level')}</span>
                        <span className="text-sky-700 dark:text-emerald-300 transition-colors duration-300">{difficulty}</span>
                        <button 
                          onClick={() => setDifficulty('All')}
                          className="ml-1 text-sky-600 dark:text-emerald-400 hover:text-sky-800 dark:hover:text-emerald-200 transition-colors p-0.5 hover:bg-sky-200/50 dark:hover:bg-emerald-800/50 rounded-full"
                        >
                          <X className="h-2 w-2" />
                        </button>
                      </motion.div>
                    )}
                    
                    {category !== 'All' && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-sky-100/90 dark:bg-emerald-900/70 text-sky-800 dark:text-emerald-200 px-2 py-1 rounded-md flex items-center border border-sky-200/60 dark:border-emerald-700/60 shadow-sm text-xs transition-all duration-300"
                      >
                        <span className="font-medium mr-1">{t('problems.filter.topic')}</span>
                        <span className="text-sky-700 dark:text-emerald-300 max-w-16 truncate transition-colors duration-300">{category}</span>
                        <button 
                          onClick={() => setCategory('All')}
                          className="ml-1 text-sky-600 dark:text-emerald-400 hover:text-sky-800 dark:hover:text-emerald-200 transition-colors p-0.5 hover:bg-sky-200/50 dark:hover:bg-emerald-800/50 rounded-full"
                        >
                          <X className="h-2 w-2" />
                        </button>
                      </motion.div>
                    )}
                  </div>
                  
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={clearFilters}
                    className="self-start sm:self-center text-sky-600 dark:text-emerald-400 hover:text-sky-700 dark:hover:text-emerald-300 font-medium transition-all duration-300 px-2 py-1 rounded-md hover:bg-sky-100/60 dark:hover:bg-emerald-900/60 border border-transparent hover:border-sky-200/60 dark:hover:border-emerald-700/60 text-xs"
                  >
                    {t('problems.clear_all')}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>
  
          {/* Loading State for Searching */}
          {isSearching ? (
            <div className="flex justify-center py-8 sm:py-12">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <div className="relative mb-2 sm:mb-3">
                  <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-sky-500 dark:text-emerald-400 mx-auto transition-colors duration-300" />
                  <div className="absolute inset-0 h-5 w-5 sm:h-6 sm:w-6 mx-auto border-2 border-sky-200 dark:border-emerald-700 rounded-full animate-pulse transition-colors duration-300"></div>
                </div>
                <p className="text-sky-600 dark:text-emerald-300 text-xs sm:text-sm font-medium transition-colors duration-300">{t('problems.searching')}</p>
              </motion.div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2 sm:space-y-3"
              >
                {filteredProblems.map((problem, index) => (
                  <motion.div
                    key={problem._id}
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.98 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: index * 0.03,
                      type: "spring",
                      stiffness: 120
                    }}
                    className="transform hover:scale-[1.005] sm:hover:scale-[1.01] transition-all duration-300"
                  >
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-sky-200/50 dark:border-emerald-700/50 rounded-lg sm:rounded-xl shadow-lg shadow-sky-100/25 dark:shadow-emerald-900/25 hover:shadow-sky-200/40 dark:hover:shadow-emerald-800/40 hover:border-sky-300/60 dark:hover:border-emerald-600/60 transition-all duration-300">
                      <ProblemCard problem={problem} index={index} />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
  
          {/* No Results State */}
          {filteredProblems.length === 0 && !loading && !isSearching && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center py-8 sm:py-12 lg:py-16"
            >
              <div className="max-w-xl mx-auto">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="relative mb-3 sm:mb-4"
                >
                  <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto bg-gradient-to-br from-sky-50 to-white dark:from-gray-800 dark:to-gray-700 rounded-lg sm:rounded-xl flex items-center justify-center border border-sky-200/60 dark:border-emerald-700/60 shadow-xl shadow-sky-100/40 dark:shadow-emerald-900/40 transition-all duration-300">
                    <Search className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-sky-400 dark:text-emerald-500 transition-colors duration-300" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-200/30 via-sky-300/20 to-sky-200/30 dark:from-emerald-800/30 dark:via-emerald-700/20 dark:to-emerald-800/30 rounded-lg sm:rounded-xl blur-xl animate-pulse transition-all duration-300"></div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-sky-900 dark:text-emerald-100 mb-2 transition-colors duration-300">{t('problems.empty.title')}</h3>
                  <p className="text-sky-600 dark:text-emerald-300 mb-3 sm:mb-4 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto transition-colors duration-300" dangerouslySetInnerHTML={{ __html: t('problems.empty.desc').replace('\n', '<br/>') }} />
                  
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={clearFilters}
                    className="px-3 sm:px-4 py-2 bg-gradient-to-r from-sky-600 to-sky-700 dark:from-emerald-500 dark:to-emerald-600 text-white font-medium rounded-lg hover:shadow-xl hover:shadow-sky-200/50 dark:hover:shadow-emerald-900/50 transition-all duration-300 text-xs sm:text-sm border border-sky-500/40 dark:border-emerald-400/40"
                  >
                    {t('problems.empty.reset')}
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}