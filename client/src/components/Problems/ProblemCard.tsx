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
        y: -4,
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className="relative bg-gradient-to-br from-white via-blue-50/50 to-white dark:from-black dark:via-gray-950/50 dark:to-black rounded-lg border border-blue-200/60 dark:border-blue-800/60 hover:border-blue-400/80 dark:hover:border-blue-600/80 hover:shadow-lg hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20 transition-all duration-300 overflow-hidden group cursor-pointer backdrop-blur-sm"
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-600/5 dark:from-blue-400/10 dark:via-transparent dark:to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400/20 via-blue-500/20 to-blue-400/20 dark:from-blue-600/30 dark:via-blue-500/30 dark:to-blue-600/30 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300 -z-10" />

      <div className="relative p-3 sm:p-4">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            {isSolved ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, delay: 0.2 }}
              >
                <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 flex-shrink-0 drop-shadow-sm" />
              </motion.div>
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0 group-hover:border-blue-400 dark:group-hover:border-blue-500 transition-colors duration-200" />
            )}
            
            <div className="min-w-0 flex-1">
              <Link
                to={`/problems/${problem._id}`}
                className="block text-gray-800 dark:text-blue-400 font-medium text-sm hover:text-blue-600 dark:hover:text-blue-300 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-300 duration-200 truncate"
              >
                {problem.title}
              </Link>
              
              <div className="flex items-center space-x-1.5 mt-1 flex-wrap gap-y-1">
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium border backdrop-blur-sm ${getDifficultyColor(problem.difficulty)} transition-all duration-200`}>
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
          <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-2 sm:mb-3">
            {problem.tags?.slice(0, 3).map((tag: string) => (
              <motion.span
                key={tag}
                whileHover={{ scale: 1.05 }}
                className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs rounded border border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 backdrop-blur-sm"
              >
                {tag}
              </motion.span>
            ))}
            {problem.tags?.length > 3 && (
              <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 text-xs rounded border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                +{problem.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed line-clamp-2 mb-2 sm:mb-3">
          {problem.description?.split('\n')[0]}
        </p>

        {/* Footer Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-t border-blue-200/50 dark:border-blue-800/50 pt-2">
          <span className="flex items-center space-x-1">
            <span className="w-1 h-1 bg-blue-400 dark:bg-blue-500 rounded-full"></span>
            <span>{problem.submissions || 0} submissions</span>
          </span>
          <span className="text-right truncate ml-2">
            {problem.category}
          </span>
        </div>

        {/* Mobile acceptance rate */}
        <div className="sm:hidden mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          {problem.acceptance}% Acceptance Rate
        </div>
      </div>

      {/* Solved indicator overlay */}
      {isSolved && (
        <div className="absolute top-2 right-2">
          <div className="w-1.5 h-1.5 bg-green-500 dark:bg-green-400 rounded-full animate-pulse shadow-sm"></div>
        </div>
      )}
    </motion.div>
  );
};