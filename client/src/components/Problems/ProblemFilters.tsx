import React, { useState } from 'react';
import { Search, Filter, SortAsc, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProblemFiltersProps {
  search: string;
  setSearch: (search: string) => void;
  difficulty: string;
  setDifficulty: (difficulty: string) => void;
  category: string;
  setCategory: (category: string) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
}

export const ProblemFilters: React.FC<ProblemFiltersProps> = ({
  search,
  setSearch,
  difficulty,
  setDifficulty,
  category,
  setCategory,
  sortBy,
  setSortBy,
}) => {
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  
  const categories = ['All', 'Array', 'Linked List', 'String', 'Tree', 'Graph', 'Dynamic Programming'];
  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];
  const sortOptions = [
    { value: 'createdAt', label: 'Newest First' },
    { value: 'title', label: 'Title' },
    { value: 'difficulty', label: 'Difficulty' },
    { value: 'acceptance', label: 'Acceptance Rate' },
  ];

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy':
        return 'text-green-600 dark:text-green-400';
      case 'Medium':
        return 'text-orange-600 dark:text-orange-400';
      case 'Hard':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative bg-gradient-to-br from-white via-sky-50/60 to-white dark:from-black dark:via-gray-950/60 dark:to-black rounded-lg sm:rounded-xl border border-sky-200/70 dark:border-emerald-800/70 p-2.5 sm:p-3 md:p-4 mb-3 sm:mb-4 backdrop-blur-sm overflow-hidden shadow-sm hover:shadow-md hover:shadow-sky-100/60 dark:hover:shadow-emerald-900/30 transition-shadow duration-300"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-sky-500/8 via-transparent to-sky-600/8 dark:from-emerald-400/12 dark:via-transparent dark:to-emerald-500/12 opacity-50" />
      
      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-r from-sky-400/25 via-sky-500/25 to-sky-400/25 dark:from-emerald-600/35 dark:via-emerald-500/35 dark:to-emerald-600/35 opacity-0 hover:opacity-100 blur-sm transition-opacity duration-500 -z-10" />
  
      <div className="relative z-10">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center space-x-1.5 sm:space-x-2 mb-2 sm:mb-3"
        >
          <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-600 dark:text-emerald-400" />
          <h3 className="text-xs sm:text-sm md:text-base font-medium text-gray-800 dark:text-emerald-300">Filter & Search</h3>
        </motion.div>
  
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {/* Search Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="relative group"
          >
            <Search className={`absolute left-2 sm:left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-3.5 sm:w-3.5 transition-colors duration-200 ${
              focusedInput === 'search' ? 'text-sky-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Search problems..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setFocusedInput('search')}
              onBlur={() => setFocusedInput(null)}
              className="w-full pl-7 sm:pl-8 pr-2 sm:pr-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white/90 dark:bg-gray-900/90 border border-sky-200 dark:border-emerald-800 rounded-md text-gray-800 dark:text-emerald-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 dark:focus:ring-emerald-400/50 focus:border-sky-500 dark:focus:border-emerald-400 transition-all duration-200 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-900 hover:border-sky-300 dark:hover:border-emerald-700"
            />
            {focusedInput === 'search' && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-500 to-sky-700 dark:from-emerald-400 dark:to-emerald-600 rounded-full"
              />
            )}
          </motion.div>
  
          {/* Difficulty Filter */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="relative group"
          >
            <Filter className={`absolute left-2 sm:left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-3.5 sm:w-3.5 transition-colors duration-200 ${
              focusedInput === 'difficulty' ? 'text-sky-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'
            }`} />
            <ChevronDown className="absolute right-2 sm:right-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              onFocus={() => setFocusedInput('difficulty')}
              onBlur={() => setFocusedInput(null)}
              className="w-full pl-7 sm:pl-8 pr-6 sm:pr-8 py-1.5 sm:py-2 text-xs sm:text-sm bg-white/90 dark:bg-gray-900/90 border border-sky-200 dark:border-emerald-800 rounded-md text-gray-800 dark:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-sky-500/50 dark:focus:ring-emerald-400/50 focus:border-sky-500 dark:focus:border-emerald-400 appearance-none transition-all duration-200 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-900 hover:border-sky-300 dark:hover:border-emerald-700 cursor-pointer"
            >
              {difficulties.map((diff) => (
                <option key={diff} value={diff} className="bg-white dark:bg-gray-900 text-gray-800 dark:text-emerald-300">
                  {diff === 'All' ? 'All Difficulties' : diff}
                </option>
              ))}
            </select>
            {difficulty !== 'All' && (
              <div className={`absolute right-6 sm:right-8 top-1/2 transform -translate-y-1/2 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${
                difficulty === 'Easy' ? 'bg-emerald-500 dark:bg-emerald-400' : 
                difficulty === 'Medium' ? 'bg-orange-500 dark:bg-orange-400' : 'bg-red-500 dark:bg-red-400'
              } animate-pulse`} />
            )}
            {focusedInput === 'difficulty' && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-500 to-sky-700 dark:from-emerald-400 dark:to-emerald-600 rounded-full"
              />
            )}
          </motion.div>
  
          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="relative group"
          >
            <ChevronDown className="absolute right-2 sm:right-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onFocus={() => setFocusedInput('category')}
              onBlur={() => setFocusedInput(null)}
              className="w-full px-2 sm:px-3 pr-6 sm:pr-8 py-1.5 sm:py-2 text-xs sm:text-sm bg-white/90 dark:bg-gray-900/90 border border-sky-200 dark:border-emerald-800 rounded-md text-gray-800 dark:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-sky-500/50 dark:focus:ring-emerald-400/50 focus:border-sky-500 dark:focus:border-emerald-400 appearance-none transition-all duration-200 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-900 hover:border-sky-300 dark:hover:border-emerald-700 cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-white dark:bg-gray-900 text-gray-800 dark:text-emerald-300">
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
            {category !== 'All' && (
              <div className="absolute right-6 sm:right-8 top-1/2 transform -translate-y-1/2 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-sky-500 dark:bg-emerald-400 animate-pulse" />
            )}
            {focusedInput === 'category' && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-500 to-sky-700 dark:from-emerald-400 dark:to-emerald-600 rounded-full"
              />
            )}
          </motion.div>
  
          {/* Sort Filter */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="relative group"
          >
            <SortAsc className={`absolute left-2 sm:left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-3.5 sm:w-3.5 transition-colors duration-200 ${
              focusedInput === 'sort' ? 'text-sky-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'
            }`} />
            <ChevronDown className="absolute right-2 sm:right-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              onFocus={() => setFocusedInput('sort')}
              onBlur={() => setFocusedInput(null)}
              className="w-full pl-7 sm:pl-8 pr-6 sm:pr-8 py-1.5 sm:py-2 text-xs sm:text-sm bg-white/90 dark:bg-gray-900/90 border border-sky-200 dark:border-emerald-800 rounded-md text-gray-800 dark:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-sky-500/50 dark:focus:ring-emerald-400/50 focus:border-sky-500 dark:focus:border-emerald-400 appearance-none transition-all duration-200 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-900 hover:border-sky-300 dark:hover:border-emerald-700 cursor-pointer"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-white dark:bg-gray-900 text-gray-800 dark:text-emerald-300">
                  Sort by {option.label}
                </option>
              ))}
            </select>
            {focusedInput === 'sort' && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-500 to-sky-700 dark:from-emerald-400 dark:to-emerald-600 rounded-full"
              />
            )}
          </motion.div>
        </div>
  
        {/* Active Filters Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-2 sm:mt-3 flex flex-wrap gap-1 sm:gap-1.5"
        >
          {search && (
            <span className="px-1.5 sm:px-2 py-0.5 bg-sky-100 dark:bg-emerald-950/60 text-sky-700 dark:text-emerald-300 text-xs rounded border border-sky-200 dark:border-emerald-700">
              Search: "{search}"
            </span>
          )}
          {difficulty !== 'All' && (
            <span className={`px-1.5 sm:px-2 py-0.5 bg-gray-100 dark:bg-gray-800/60 text-xs rounded border border-gray-200 dark:border-gray-700 ${getDifficultyColor(difficulty)}`}>
              {difficulty}
            </span>
          )}
          {category !== 'All' && (
            <span className="px-1.5 sm:px-2 py-0.5 bg-sky-100 dark:bg-emerald-950/60 text-sky-700 dark:text-emerald-300 text-xs rounded border border-sky-200 dark:border-emerald-700">
              {category}
            </span>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}