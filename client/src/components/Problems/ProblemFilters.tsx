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
        return 'text-green-600';
      case 'Medium':
        return 'text-orange-600';
      case 'Hard':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative bg-gradient-to-br from-white via-blue-50/50 to-white rounded-lg border border-blue-200/60 p-3 sm:p-4 mb-4 backdrop-blur-sm overflow-hidden shadow-sm hover:shadow-md hover:shadow-blue-100/50 transition-shadow duration-300"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-blue-600/5 opacity-50" />
      
      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400/20 via-blue-500/20 to-blue-400/20 opacity-0 hover:opacity-100 blur-sm transition-opacity duration-500 -z-10" />

      <div className="relative z-10">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center space-x-2 mb-3"
        >
          <Filter className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-medium text-gray-800">Filter & Search</h3>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="relative group"
          >
            <Search className={`absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 transition-colors duration-200 ${
              focusedInput === 'search' ? 'text-blue-600' : 'text-gray-400'
            }`} />
            <input
              type="text"
              placeholder="Search problems..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setFocusedInput('search')}
              onBlur={() => setFocusedInput(null)}
              className="w-full pl-8 pr-3 py-2 text-sm bg-white/80 border border-blue-200 rounded-md text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 backdrop-blur-sm hover:bg-white hover:border-blue-300"
            />
            {focusedInput === 'search' && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full"
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
            <Filter className={`absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 transition-colors duration-200 ${
              focusedInput === 'difficulty' ? 'text-blue-600' : 'text-gray-400'
            }`} />
            <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              onFocus={() => setFocusedInput('difficulty')}
              onBlur={() => setFocusedInput(null)}
              className="w-full pl-8 pr-8 py-2 text-sm bg-white/80 border border-blue-200 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 appearance-none transition-all duration-200 backdrop-blur-sm hover:bg-white hover:border-blue-300 cursor-pointer"
            >
              {difficulties.map((diff) => (
                <option key={diff} value={diff} className="bg-white text-gray-800">
                  {diff === 'All' ? 'All Difficulties' : diff}
                </option>
              ))}
            </select>
            {difficulty !== 'All' && (
              <div className={`absolute right-8 top-1/2 transform -translate-y-1/2 w-1.5 h-1.5 rounded-full ${
                difficulty === 'Easy' ? 'bg-green-500' : 
                difficulty === 'Medium' ? 'bg-orange-500' : 'bg-red-500'
              } animate-pulse`} />
            )}
            {focusedInput === 'difficulty' && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full"
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
            <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onFocus={() => setFocusedInput('category')}
              onBlur={() => setFocusedInput(null)}
              className="w-full px-3 pr-8 py-2 text-sm bg-white/80 border border-blue-200 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 appearance-none transition-all duration-200 backdrop-blur-sm hover:bg-white hover:border-blue-300 cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-white text-gray-800">
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
            {category !== 'All' && (
              <div className="absolute right-8 top-1/2 transform -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            )}
            {focusedInput === 'category' && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full"
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
            <SortAsc className={`absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 transition-colors duration-200 ${
              focusedInput === 'sort' ? 'text-blue-600' : 'text-gray-400'
            }`} />
            <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              onFocus={() => setFocusedInput('sort')}
              onBlur={() => setFocusedInput(null)}
              className="w-full pl-8 pr-8 py-2 text-sm bg-white/80 border border-blue-200 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 appearance-none transition-all duration-200 backdrop-blur-sm hover:bg-white hover:border-blue-300 cursor-pointer"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-white text-gray-800">
                  Sort by {option.label}
                </option>
              ))}
            </select>
            {focusedInput === 'sort' && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full"
              />
            )}
          </motion.div>
        </div>

        {/* Active Filters Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-3 flex flex-wrap gap-1.5"
        >
          {search && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded border border-blue-200">
              Search: "{search}"
            </span>
          )}
          {difficulty !== 'All' && (
            <span className={`px-2 py-0.5 bg-gray-100 text-xs rounded border border-gray-200 ${getDifficultyColor(difficulty)}`}>
              {difficulty}
            </span>
          )}
          {category !== 'All' && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded border border-blue-200">
              {category}
            </span>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};