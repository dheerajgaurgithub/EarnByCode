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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-blue-800 p-6 text-center">
          <p className="text-gray-800 dark:text-blue-400 font-semibold">{error || t('profile.user_not_found')}</p>
          <Link to="/leaderboard" className="inline-block mt-3 text-blue-600 dark:text-blue-400 hover:underline">{t('profile.back_to_leaderboard')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-black dark:via-gray-900 dark:to-black py-4 sm:py-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-blue-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-blue-200 dark:ring-blue-700 bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl font-bold">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                (user.username || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-400 break-words">{user.fullName || user.username}</h1>
              <div className="text-blue-600 dark:text-blue-400">@{user.username}</div>
              {user.location && (
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-300 flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {user.location}
                </div>
              )}
              {user.message && (
                <div className="mt-2 text-xs text-blue-500 dark:text-gray-400">{user.message}</div>
              )}
            </div>
          </div>
          {user.bio && (
            <p className="mt-4 text-blue-700 dark:text-blue-300 text-sm whitespace-pre-line">{user.bio}</p>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="text-center bg-blue-50 dark:bg-gray-800 p-3 rounded-lg border border-blue-200 dark:border-gray-600">
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{user.codecoins ?? 0}</p>
            <p className="text-blue-500 dark:text-blue-400 text-xs">{t('profile.codecoins')}</p>
          </div>
          <div className="text-center bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{user.points ?? 0}</p>
            <p className="text-yellow-500 dark:text-yellow-400 text-xs">{t('profile.points')}</p>
          </div>
          <div className="text-center bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{typeof user.ranking === 'number' && user.ranking > 0 ? `#${user.ranking}` : 'N/A'}</p>
            <p className="text-purple-500 dark:text-purple-400 text-xs">{t('profile.rank')}</p>
          </div>
          <div className="text-center bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-xl font-bold text-green-600 dark:text-green-400">{user.totalSolved ?? (user.solvedProblems?.length ?? 0)}</p>
            <p className="text-green-500 dark:text-green-400 text-xs">{t('profile.solved')}</p>
          </div>
        </div>

        {/* Recent sections (optional, only if present) */}
        {Array.isArray(user.solvedProblems) && user.solvedProblems.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-blue-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-400 mb-3 flex items-center gap-2"><Trophy className="w-5 h-5"/>{t('profile.recent_solved')}</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm text-blue-800 dark:text-blue-300">
              {user.solvedProblems.slice(0, 10).map(p => (
                <li key={p._id}>{p.title} <span className="text-xs opacity-70">({p.difficulty})</span></li>
              ))}
            </ul>
          </div>
        )}

        {Array.isArray(user.contestsParticipated) && user.contestsParticipated.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-blue-200 dark:border-gray-700 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-400 mb-3 flex items-center gap-2"><Award className="w-5 h-5"/>{t('profile.recent_contests')}</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm text-blue-800 dark:text-blue-300">
              {user.contestsParticipated.slice(0, 10).map(c => (
                <li key={c._id}>{c.title} <span className="text-xs opacity-70">({c.status})</span></li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfile;
