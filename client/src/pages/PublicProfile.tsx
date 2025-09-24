import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '@/lib/api';
import { Loader2, MapPin, Trophy, Award } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';

interface PublicUser {
  _id: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  website?: string;
  points?: number;
  codecoins?: number;
  ranking?: number;
  totalSolved?: number;
  solvedProblems?: Array<{ _id: string; title: string; difficulty: string }>;
  contestsParticipated?: Array<{ _id: string; title: string; status: string }>;
  message?: string; // privacy messages
}

const PublicProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = React.useState<PublicUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { t } = useI18n();

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiService.get<{ user: PublicUser }>(`/users/username/${username}`);
        if (!mounted) return;
        setUser(res.user);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load user');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [username]);

  // Loading State
if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-100 dark:from-gray-950 dark:via-black dark:to-gray-900">
      <div className="bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl shadow-xl border border-sky-200/50 dark:border-green-800/30 p-8">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-sky-600 dark:text-green-400" />
          <p className="text-sm sm:text-base text-sky-700 dark:text-green-300 font-medium">Loading profile...</p>
        </div>
      </div>
    </div>
  );
}

// Error State
if (error || !user) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-100 dark:from-gray-950 dark:via-black dark:to-gray-900 px-4">
      <div className="bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl shadow-xl border border-sky-200/50 dark:border-green-800/30 p-6 sm:p-8 text-center max-w-md w-full">
        <div className="bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/50 dark:to-gray-800/50 w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center">
          <span className="text-red-600 dark:text-red-400 font-bold text-2xl">!</span>
        </div>
        <p className="text-sky-800 dark:text-green-400 font-semibold text-sm sm:text-base mb-4">
          {error || t('profile.user_not_found')}
        </p>
        <Link 
          to="/leaderboard" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 dark:bg-green-600 hover:bg-sky-700 dark:hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors duration-200"
        >
          {t('profile.back_to_leaderboard')}
        </Link>
      </div>
    </div>
  );
}

// Main Profile Content
return (
  <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-100 dark:from-gray-950 dark:via-black dark:to-gray-900 py-3 sm:py-6 lg:py-8 transition-colors duration-300">
    <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
      {/* Profile Header Card */}
      <div className="bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl shadow-xl border border-sky-200/50 dark:border-green-800/30 p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 hover:shadow-2xl transition-all duration-300">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-2xl overflow-hidden ring-4 ring-sky-200/60 dark:ring-green-600/40 bg-gradient-to-br from-sky-100 to-sky-200 dark:from-green-900 dark:to-gray-800 flex items-center justify-center text-sky-600 dark:text-green-400 text-lg sm:text-xl lg:text-2xl font-bold shadow-lg">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              (user.username || 'U').charAt(0).toUpperCase()
            )}
          </div>
          
          {/* User Info */}
          <div className="flex-1 min-w-0 w-full sm:w-auto">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-sky-800 dark:text-green-400 break-words mb-1">
              {user.fullName || user.username}
            </h1>
            <div className="text-sm sm:text-base text-sky-600 dark:text-green-300 mb-2">
              @{user.username}
            </div>
            
            {/* Location */}
            {user.location && (
              <div className="flex items-center gap-1 text-xs sm:text-sm text-sky-700 dark:text-green-300 mb-2">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{user.location}</span>
              </div>
            )}
            
            {/* Message */}
            {user.message && (
              <div className="text-xs sm:text-sm text-sky-500 dark:text-gray-400 bg-sky-50 dark:bg-gray-800 px-3 py-1 rounded-lg inline-block">
                {user.message}
              </div>
            )}
          </div>
        </div>
        
        {/* Bio */}
        {user.bio && (
          <div className="mt-4 sm:mt-6">
            <p className="text-xs sm:text-sm lg:text-base text-sky-700 dark:text-green-300 whitespace-pre-line bg-sky-50/50 dark:bg-gray-800/50 p-3 sm:p-4 rounded-xl border border-sky-100 dark:border-gray-700">
              {user.bio}
            </p>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
        {/* CodeCoins */}
        <div className="bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl border border-sky-200/50 dark:border-green-800/30 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
          <div className="bg-gradient-to-br from-sky-100 to-sky-200 dark:from-green-900/50 dark:to-gray-800/50 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg mx-auto mb-2 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <span className="text-sky-600 dark:text-green-400 font-bold text-sm sm:text-base lg:text-lg">₹</span>
          </div>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-sky-600 dark:text-green-400 mb-1">
            {user.codecoins ?? 0}
          </p>
          <p className="text-xs sm:text-sm text-sky-500 dark:text-green-300 font-medium">
            {t('profile.codecoins')}
          </p>
        </div>

        {/* Points */}
        <div className="bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl border border-amber-200/50 dark:border-green-800/30 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
          <div className="bg-gradient-to-br from-amber-100 to-amber-200 dark:from-green-900/50 dark:to-gray-800/50 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg mx-auto mb-2 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <span className="text-amber-600 dark:text-green-400 font-bold text-sm sm:text-base lg:text-lg">★</span>
          </div>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-amber-600 dark:text-green-400 mb-1">
            {user.points ?? 0}
          </p>
          <p className="text-xs sm:text-sm text-amber-500 dark:text-green-300 font-medium">
            {t('profile.points')}
          </p>
        </div>

        {/* Rank */}
        <div className="bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl border border-purple-200/50 dark:border-green-800/30 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
          <div className="bg-gradient-to-br from-purple-100 to-purple-200 dark:from-green-900/50 dark:to-gray-800/50 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg mx-auto mb-2 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <span className="text-purple-600 dark:text-green-400 font-bold text-sm sm:text-base lg:text-lg">#</span>
          </div>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600 dark:text-green-400 mb-1">
            {typeof user.ranking === 'number' && user.ranking > 0 ? `${user.ranking}` : 'N/A'}
          </p>
          <p className="text-xs sm:text-sm text-purple-500 dark:text-green-300 font-medium">
            {t('profile.rank')}
          </p>
        </div>

        {/* Solved */}
        <div className="bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl border border-emerald-200/50 dark:border-green-800/30 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
          <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-green-900/50 dark:to-gray-800/50 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg mx-auto mb-2 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <span className="text-emerald-600 dark:text-green-400 font-bold text-sm sm:text-base lg:text-lg">✓</span>
          </div>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-600 dark:text-green-400 mb-1">
            {user.totalSolved ?? (user.solvedProblems?.length ?? 0)}
          </p>
          <p className="text-xs sm:text-sm text-emerald-500 dark:text-green-300 font-medium">
            {t('profile.solved')}
          </p>
        </div>
      </div>

      {/* Recent Solved Problems */}
      {Array.isArray(user.solvedProblems) && user.solvedProblems.length > 0 && (
        <div className="bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl shadow-xl border border-sky-200/50 dark:border-green-800/30 p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 lg:mb-6">
            <div className="bg-gradient-to-br from-sky-100 to-sky-200 dark:from-green-900/50 dark:to-gray-800/50 p-2 sm:p-2.5 rounded-lg">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-sky-600 dark:text-green-400" />
            </div>
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-sky-800 dark:text-green-400">
              {t('profile.recent_solved')}
            </h2>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {user.solvedProblems.slice(0, 10).map((p, index) => (
              <div key={p._id} className="flex items-center justify-between p-2 sm:p-3 bg-sky-50/50 dark:bg-gray-800/50 rounded-lg hover:bg-sky-100/50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-sky-600 dark:text-green-400 bg-sky-100 dark:bg-green-900/30 px-2 py-1 rounded-full flex-shrink-0">
                    #{index + 1}
                  </span>
                  <span className="text-xs sm:text-sm lg:text-base text-sky-800 dark:text-green-300 font-medium truncate">
                    {p.title}
                  </span>
                </div>
                <span className="text-xs text-sky-500 dark:text-green-400 bg-white dark:bg-gray-700 px-2 py-1 rounded-full font-medium flex-shrink-0">
                  {p.difficulty}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Contests */}
      {Array.isArray(user.contestsParticipated) && user.contestsParticipated.length > 0 && (
        <div className="bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl shadow-xl border border-sky-200/50 dark:border-green-800/30 p-4 sm:p-6 lg:p-8 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 lg:mb-6">
            <div className="bg-gradient-to-br from-sky-100 to-sky-200 dark:from-green-900/50 dark:to-gray-800/50 p-2 sm:p-2.5 rounded-lg">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-sky-600 dark:text-green-400" />
            </div>
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-sky-800 dark:text-green-400">
              {t('profile.recent_contests')}
            </h2>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {user.contestsParticipated.slice(0, 10).map((c, index) => (
              <div key={c._id} className="flex items-center justify-between p-2 sm:p-3 bg-sky-50/50 dark:bg-gray-800/50 rounded-lg hover:bg-sky-100/50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-sky-600 dark:text-green-400 bg-sky-100 dark:bg-green-900/30 px-2 py-1 rounded-full flex-shrink-0">
                    #{index + 1}
                  </span>
                  <span className="text-xs sm:text-sm lg:text-base text-sky-800 dark:text-green-300 font-medium truncate">
                    {c.title}
                  </span>
                </div>
                <span className="text-xs text-sky-500 dark:text-green-400 bg-white dark:bg-gray-700 px-2 py-1 rounded-full font-medium flex-shrink-0">
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);
};

export default PublicProfile;
