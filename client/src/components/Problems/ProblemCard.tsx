import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

interface ProblemCardProps {
  problem: any;
  index: number;
}

export const ProblemCard: React.FC<ProblemCardProps> = ({ problem, index }) => {
  const { user } = useAuth();
  const isSolved = user?.solvedProblems?.some((p: any) => 
    (typeof p === 'string' ? p : p._id) === problem._id
  ) || false;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-green-600 dark:text-green-400 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700';
      case 'Medium':
        return 'text-orange-600 dark:text-orange-400 bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 border-orange-300 dark:border-orange-700';
      case 'Hard':
        return 'text-red-600 dark:text-red-400 bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20 border-red-300 dark:border-red-700';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-800/20 dark:to-slate-800/20 border-gray-300 dark:border-gray-700';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.08,
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      whileHover={{ 
        y: -2,
        scale: 1.01,
        transition: { duration: 0.2 }
      }}
      className="relative bg-gradient-to-br from-white via-sky-50/60 to-white dark:from-black dark:via-gray-950/60 dark:to-black rounded-lg sm:rounded-xl border border-sky-200/70 dark:border-emerald-800/70 hover:border-sky-400/90 dark:hover:border-emerald-600/90 hover:shadow-lg hover:shadow-sky-100/60 dark:hover:shadow-emerald-900/30 transition-all duration-300 overflow-hidden group cursor-pointer backdrop-blur-sm"
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500/8 via-transparent to-sky-600/8 dark:from-emerald-400/12 dark:via-transparent dark:to-emerald-500/12 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-r from-sky-400/25 via-sky-500/25 to-sky-400/25 dark:from-emerald-600/35 dark:via-emerald-500/35 dark:to-emerald-600/35 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300 -z-10" />
  
      <div className="relative p-2.5 sm:p-3 md:p-4">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-1.5 sm:mb-2 md:mb-3">
          <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0 flex-1">
            {isSolved ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, delay: 0.2 }}
              >
                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0 drop-shadow-sm" />
              </motion.div>
            ) : (
              <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0 group-hover:border-sky-400 dark:group-hover:border-emerald-500 transition-colors duration-200" />
            )}
            
            <div className="min-w-0 flex-1">
              <Link
                to={`/problems/${problem._id}`}
                className="block text-gray-800 dark:text-emerald-300 font-medium text-xs sm:text-sm md:text-base hover:text-sky-600 dark:hover:text-emerald-200 transition-colors group-hover:text-sky-600 dark:group-hover:text-emerald-200 duration-200 truncate leading-tight"
              >
                {problem.title}
              </Link>
              
              <div className="flex items-center space-x-1 sm:space-x-1.5 mt-0.5 sm:mt-1 flex-wrap gap-y-0.5 sm:gap-y-1">
                <span className={`px-1 sm:px-1.5 py-0.5 rounded text-xs font-medium border backdrop-blur-sm ${getDifficultyColor(problem.difficulty)} transition-all duration-200`}>
                  {problem.difficulty}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-xs hidden sm:inline">
                  {problem.acceptance}% Accepted
                </span>
              </div>
            </div>
          </div>
        </div>
  
        {/* Tags Section */}
        {problem.tags && problem.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-1.5 sm:mb-2 md:mb-3">
            {problem.tags?.slice(0, 3).map((tag: string) => (
              <motion.span
                key={tag}
                whileHover={{ scale: 1.05 }}
                className="px-1 sm:px-1.5 py-0.5 bg-sky-50 dark:bg-emerald-950/60 hover:bg-sky-100 dark:hover:bg-emerald-900/60 text-sky-700 dark:text-emerald-300 text-xs rounded border border-sky-200 dark:border-emerald-700 hover:border-sky-300 dark:hover:border-emerald-600 transition-all duration-200 backdrop-blur-sm"
              >
                {tag}
              </motion.span>
            ))}
            {problem.tags?.length > 3 && (
              <span className="px-1 sm:px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 text-xs rounded border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                +{problem.tags.length - 3}
              </span>
            )}
          </div>
        )}
  
        {/* Description */}
        <p className="text-gray-600 dark:text-emerald-200/80 text-xs sm:text-sm leading-relaxed line-clamp-2 mb-1.5 sm:mb-2 md:mb-3">
          {problem.description?.split('\n')[0]}
        </p>
  
        {/* Footer Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-emerald-300/70 border-t border-sky-200/60 dark:border-emerald-800/60 pt-1.5 sm:pt-2">
          <span className="flex items-center space-x-1">
            <span className="w-1 h-1 bg-sky-400 dark:bg-emerald-500 rounded-full"></span>
            <span>{problem.submissions || 0} submissions</span>
          </span>
          <span className="text-right truncate ml-2">
            {problem.category}
          </span>
        </div>
  
        {/* Mobile acceptance rate */}
        <div className="sm:hidden mt-1 text-xs text-gray-500 dark:text-emerald-300/70">
          {problem.acceptance}% Acceptance Rate
        </div>
      </div>
  
      {/* Solved indicator overlay */}
      {isSolved && (
        <div className="absolute top-2 right-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse shadow-sm"></div>
        </div>
      )}
    </motion.div>
  );
}