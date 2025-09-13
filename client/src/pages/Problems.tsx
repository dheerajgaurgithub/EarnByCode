import React, { useState, useEffect, useCallback } from 'react';
import { ProblemCard } from '../components/Problems/ProblemCard';
import { ProblemFilters } from '../components/Problems/ProblemFilters';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Code2, Target, Sparkles, Search } from 'lucide-react';

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
      <div className="min-h-screen bg-white relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-blue-100/30"></div>
        
        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            animate={{ 
              y: [0, -20, 0],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-20 left-10 w-32 h-32 bg-blue-200/20 rounded-full blur-xl"
          />
          <motion.div 
            animate={{ 
              y: [0, 20, 0],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            className="absolute top-40 right-20 w-48 h-48 bg-blue-300/15 rounded-full blur-2xl"
          />
          <motion.div 
            animate={{ 
              y: [0, -15, 0],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ duration: 6, repeat: Infinity, delay: 2 }}
            className="absolute bottom-32 left-1/3 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"
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
            <div className="relative mb-6">
              <div className="w-16 h-16 mx-auto">
                <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 border-r-blue-400 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-2 border-blue-200 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl md:text-2xl font-bold text-blue-900 mb-3"
            >
              Loading Problems
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-blue-600 text-sm mb-4"
            >
              Preparing your coding challenges...
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
                  className="w-2 h-2 bg-blue-500 rounded-full"
                />
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative">
      {/* Enhanced background with subtle patterns */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-blue-100/20"></div>
        
        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.3)_1px,transparent_1px)] bg-[length:60px_60px]"></div>
        </div>
        
        {/* Floating background elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-100/10 to-blue-200/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-32 right-20 w-96 h-96 bg-gradient-to-l from-blue-200/8 to-blue-300/4 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-50/5 to-transparent rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 lg:mb-10"
          >
            <div className="relative inline-block mb-4">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent leading-tight">
                AlgoBucks Problems
              </h1>
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, duration: 0.6, type: "spring" }}
                className="absolute -top-2 -right-2 lg:-top-3 lg:-right-3"
              >
                <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-blue-500 animate-pulse" />
              </motion.div>
            </div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-sm sm:text-base text-blue-700 mb-6 max-w-2xl mx-auto leading-relaxed"
            >
              Master your coding skills with our curated collection of programming challenges
            </motion.p>
            
            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6"
            >
              <div className="bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-xl px-4 py-3 shadow-lg shadow-blue-100/20 hover:shadow-blue-200/30 transition-all duration-300">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <Target className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold text-blue-900">{filteredProblems.length}</div>
                    <div className="text-xs text-blue-600">Problems</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-xl px-4 py-3 shadow-lg shadow-blue-100/20 hover:shadow-blue-200/30 transition-all duration-300">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <Code2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold text-blue-900">∞</div>
                    <div className="text-xs text-blue-600">Learning</div>
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
            className="mb-6 lg:mb-8"
          >
            <div className="bg-white/60 backdrop-blur-sm border border-blue-200/40 rounded-2xl p-4 lg:p-6 shadow-xl shadow-blue-100/10">
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
                className="mt-4 bg-white/40 backdrop-blur-sm border border-blue-200/30 rounded-xl p-3 lg:p-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                  <div className="flex items-center text-blue-800 font-medium text-sm">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                    Active Filters:
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {search && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-blue-100/80 text-blue-800 px-3 py-1.5 rounded-lg flex items-center border border-blue-200/50 shadow-sm text-sm"
                      >
                        <Search className="w-3 h-3 mr-1.5" />
                        <span className="font-medium mr-1.5">Search:</span>
                        <span className="text-blue-700 max-w-32 truncate">{search}</span>
                        <button 
                          onClick={() => setSearch('')}
                          className="ml-1.5 text-blue-600 hover:text-blue-800 transition-colors p-0.5 hover:bg-blue-200/50 rounded-full"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </motion.div>
                    )}
                    
                    {difficulty !== 'All' && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-blue-100/80 text-blue-800 px-3 py-1.5 rounded-lg flex items-center border border-blue-200/50 shadow-sm text-sm"
                      >
                        <span className="font-medium mr-1.5">Level:</span>
                        <span className="text-blue-700">{difficulty}</span>
                        <button 
                          onClick={() => setDifficulty('All')}
                          className="ml-1.5 text-blue-600 hover:text-blue-800 transition-colors p-0.5 hover:bg-blue-200/50 rounded-full"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </motion.div>
                    )}
                    
                    {category !== 'All' && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-blue-100/80 text-blue-800 px-3 py-1.5 rounded-lg flex items-center border border-blue-200/50 shadow-sm text-sm"
                      >
                        <span className="font-medium mr-1.5">Topic:</span>
                        <span className="text-blue-700 max-w-24 truncate">{category}</span>
                        <button 
                          onClick={() => setCategory('All')}
                          className="ml-1.5 text-blue-600 hover:text-blue-800 transition-colors p-0.5 hover:bg-blue-200/50 rounded-full"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </motion.div>
                    )}
                  </div>
                  
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={clearFilters}
                    className="self-start lg:self-center text-blue-600 hover:text-blue-700 font-medium transition-all duration-300 px-3 py-1.5 rounded-lg hover:bg-blue-100/50 border border-transparent hover:border-blue-200/50 text-sm"
                  >
                    Clear All
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Loading State for Searching */}
          {isSearching ? (
            <div className="flex justify-center py-16">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <div className="relative mb-4">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
                  <div className="absolute inset-0 h-8 w-8 mx-auto border-2 border-blue-200 rounded-full animate-pulse"></div>
                </div>
                <p className="text-blue-600 text-sm font-medium">Searching challenges...</p>
              </motion.div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {filteredProblems.map((problem, index) => (
                  <motion.div
                    key={problem._id}
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.98 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: index * 0.05,
                      type: "spring",
                      stiffness: 100
                    }}
                    className="transform hover:scale-[1.01] transition-all duration-300"
                  >
                    <div className="bg-white/70 backdrop-blur-sm border border-blue-200/40 rounded-xl lg:rounded-2xl shadow-lg shadow-blue-100/20 hover:shadow-blue-200/30 hover:border-blue-300/50 transition-all duration-300">
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
              className="text-center py-16 lg:py-20"
            >
              <div className="max-w-2xl mx-auto">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="relative mb-6"
                >
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-50 to-white rounded-2xl flex items-center justify-center border border-blue-200/50 shadow-xl shadow-blue-100/30">
                    <Search className="w-12 h-12 text-blue-300" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-200/20 via-blue-300/15 to-blue-200/20 rounded-2xl blur-xl animate-pulse"></div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="text-xl lg:text-2xl font-bold text-blue-900 mb-3">No Problems Found</h3>
                  <p className="text-blue-600 mb-6 text-sm leading-relaxed max-w-lg mx-auto">
                    We couldn't find any problems matching your current filters. 
                    Try adjusting your search criteria to discover more challenges.
                  </p>
                  
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={clearFilters}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:shadow-xl hover:shadow-blue-200/40 transition-all duration-300 text-sm border border-blue-500/30"
                  >
                    Reset All Filters
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};