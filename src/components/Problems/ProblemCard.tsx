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
        return 'text-green-600 bg-gradient-to-r from-green-100 to-emerald-100 border-green-300';
      case 'Medium':
        return 'text-orange-600 bg-gradient-to-r from-orange-100 to-yellow-100 border-orange-300';
      case 'Hard':
        return 'text-red-600 bg-gradient-to-r from-red-100 to-pink-100 border-red-300';
      default:
        return 'text-gray-600 bg-gradient-to-r from-gray-100 to-slate-100 border-gray-300';
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
      className="relative bg-gradient-to-br from-white via-blue-50/50 to-white rounded-xl border border-blue-200/60 hover:border-blue-400/80 hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-300 overflow-hidden group cursor-pointer backdrop-blur-sm"
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/20 via-blue-500/20 to-blue-400/20 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300 -z-10" />

      <div className="relative p-4 sm:p-5 lg:p-6">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {isSolved ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, delay: 0.2 }}
              >
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 drop-shadow-sm" />
              </motion.div>
            ) : (
              <div className="h-5 w-5 rounded-full border-2 border-gray-300 flex-shrink-0 group-hover:border-blue-400 transition-colors duration-200" />
            )}
            
            <div className="min-w-0 flex-1">
              <Link
                to={`/problems/${problem._id}`}
                className="block text-gray-800 font-semibold text-sm sm:text-base hover:text-blue-600 transition-colors group-hover:text-blue-600 duration-200 truncate"
              >
                {problem.title}
              </Link>
              
              <div className="flex items-center space-x-2 mt-1 flex-wrap gap-y-1">
                <span className={`px-2 py-1 rounded-md text-xs font-medium border backdrop-blur-sm ${getDifficultyColor(problem.difficulty)} transition-all duration-200`}>
                  {problem.difficulty}
                </span>
                <span className="text-gray-500 text-xs hidden sm:inline">
                  {problem.acceptance}% Accepted
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tags Section */}
        {problem.tags && problem.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            {problem.tags?.slice(0, 3).map((tag: string) => (
              <motion.span
                key={tag}
                whileHover={{ scale: 1.05 }}
                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs rounded-md border border-blue-200 hover:border-blue-300 transition-all duration-200 backdrop-blur-sm"
              >
                {tag}
              </motion.span>
            ))}
            {problem.tags?.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md border border-gray-200 backdrop-blur-sm">
                +{problem.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-3 sm:mb-4">
          {problem.description?.split('\n')[0]}
        </p>

        {/* Footer Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 border-t border-blue-200/50 pt-3">
          <span className="flex items-center space-x-1">
            <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
            <span>{problem.submissions || 0} submissions</span>
          </span>
          <span className="text-right truncate ml-2">
            {problem.category}
          </span>
        </div>

        {/* Mobile acceptance rate */}
        <div className="sm:hidden mt-2 text-xs text-gray-500">
          {problem.acceptance}% Acceptance Rate
        </div>
      </div>

      {/* Solved indicator overlay */}
      {isSolved && (
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
        </div>
      )}
    </motion.div>
  );
};