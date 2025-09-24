import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Navigate, Link } from 'react-router-dom';
import { 
  Trophy, Calendar, Target, TrendingUp, Edit3, Save, X, 
  MapPin, Building, GraduationCap, Globe, Github, Linkedin, Twitter, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import AvatarCropperModal from '@/components/Profile/AvatarCropperModal';
import ClampText from '@/components/common/ClampText';
import { apiService } from '@/lib/api';
import leaderboardApi from '../services/api';
import AchievementModal from '@/components/Profile/AchievementModal';
import SubmissionCalendar from '@/components/Profile/SubmissionCalendar';

interface EditFormData {
  fullName: string;
  bio: string;
  location: string;
  website: string;
  github: string;
  linkedin: string;
  twitter: string;
  company: string;
  school: string;
}

interface Achievement {
  title: string;
  description: string;
  earned: boolean;
}

export const Profile: React.FC = () => {
  const { user, updateUser, isLoading: isAuthLoading, refreshUser, uploadAvatar, removeAvatar } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewPublic, setPreviewPublic] = useState(false);
  
  // Privacy helpers
  const privacy = (user as any)?.preferences?.privacy || { profileVisibility: 'public', showEmail: false, showSolvedProblems: true, showContestHistory: true };
  const isPublicView = previewPublic;
  const canShowEmail = !isPublicView || !!privacy.showEmail;
  const canShowSolved = !isPublicView || !!privacy.showSolvedProblems;
  const canShowContestHistory = !isPublicView || !!privacy.showContestHistory;
  const canShowBio = !isPublicView || (privacy as any)?.showBio !== false;
  const canShowSocialLinks = !isPublicView || (privacy as any)?.showSocialLinks !== false;
  
  const toast = useToast();
  const [avatarShape, setAvatarShape] = useState<'round' | 'square'>(() => {
    if (typeof window === 'undefined') return 'round';
    return (localStorage.getItem('ab_avatar_shape') as 'round' | 'square') || 'round';
  });
  
  const showSuccess = (message: string) => {
    toast.success(message);
  };

  const handleCroppedAvatar = async (file: File) => {
    try {
      setIsUploadingAvatar(true);
      await uploadAvatar(file);
      await refreshUser(true);
      showSuccess('Profile picture updated');
    } catch (err: any) {
      showError(err?.message || 'Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };
  
  const showError = (message: string) => {
    toast.error(message);
  };
  
  const [editForm, setEditForm] = useState<EditFormData>({
    fullName: '',
    bio: '',
    location: '',
    website: '',
    github: '',
    linkedin: '',
    twitter: '',
    company: '',
    school: ''
  });

  // Avatar upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  // Leaderboard current rank
  const [currentRank, setCurrentRank] = useState<number | null>(null);
  // Streaks
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [streakMilestones, setStreakMilestones] = useState<{ d100: boolean; d500: boolean; d1000: boolean }>({ d100: false, d500: false, d1000: false });
  // Achievement modal
  const [showAchModal, setShowAchModal] = useState<boolean>(false);
  const [activeAchievement, setActiveAchievement] = useState<Achievement | null>(null);

  const onChooseAvatar = () => setShowCropper(true);
  const onAvatarSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      showError('Only JPG, PNG, WEBP or GIF images are allowed');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showError('Image must be 2MB or smaller');
      return;
    }
    try {
      setIsUploadingAvatar(true);
      await uploadAvatar(file);
      await refreshUser(true);
      showSuccess('Profile picture updated');
    } catch (err: any) {
      showError(err?.message || 'Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onRemoveAvatar = async () => {
    try {
      setIsUploadingAvatar(true);
      await removeAvatar();
      await refreshUser(true);
      showSuccess('Profile picture removed');
    } catch (err: any) {
      showError(err?.message || 'Failed to remove avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Initialize form with user data when user is loaded
  useEffect(() => {
    if (user) {
      setEditForm({
        fullName: user.fullName || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        github: user.github || '',
        linkedin: user.linkedin || '',
        twitter: user.twitter || '',
        company: user.company || '',
        school: user.school || ''
      });
    }
  }, [user]);

  // Fetch current leaderboard rank for the profile user
  useEffect(() => {
    const fetchRank = async () => {
      try {
        if (!user?._id) { setCurrentRank(null); return; }
        const { data } = await leaderboardApi.getUsersLeaderboard({ sortBy: 'points', limit: 1000, include: 'profile,solved' });
        if (!Array.isArray(data)) { setCurrentRank(null); return; }
        const idx = data.findIndex((u: any) => String(u?._id) === String(user._id));
        setCurrentRank(idx >= 0 ? idx + 1 : null);
      } catch {
        setCurrentRank(null);
      }
    };
    fetchRank();
  }, [user?._id]);

  // Fetch streaks (Accepted-per-day) for the profile user
  useEffect(() => {
    const fetchStreaks = async () => {
      try {
        const data = await apiService.get<any>('/users/me/streaks');
        const payload = (data?.data || data) as any;
        setCurrentStreak(payload?.currentStreak || 0);
        setMaxStreak(payload?.maxStreak || 0);
        setStreakMilestones({
          d100: !!payload?.milestones?.d100,
          d500: !!payload?.milestones?.d500,
          d1000: !!payload?.milestones?.d1000,
        });
      } catch {
        setCurrentStreak(0);
        setMaxStreak(0);
        setStreakMilestones({ d100: false, d500: false, d1000: false });
      }
    };
    fetchStreaks();
  }, []);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-black dark:to-gray-900">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8">
          <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: '/profile' }} replace />;
  }

  const toggleAvatarShape = () => {
    const next = avatarShape === 'round' ? 'square' : 'round';
    setAvatarShape(next);
    try { localStorage.setItem('ab_avatar_shape', next); } catch {}
  };

  const handleSave = async () => {
    setIsUpdating(true);
    setError(null);
    
    try {
      if (!editForm.fullName?.trim()) {
        throw new Error('Full name is required');
      }
      
      await updateUser(editForm);
      await refreshUser(true);
      showSuccess('Your profile has been updated successfully.');
      setIsEditing(false);
      
    } catch (error) {
      console.error('Failed to update profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setEditForm({
        fullName: user.fullName || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        github: user.github || '',
        linkedin: user.linkedin || '',
        twitter: user.twitter || '',
        company: user.company || '',
        school: user.school || ''
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const achievements: Achievement[] = [
    { 
      title: 'First Problem Solved', 
      description: 'Solved your first coding problem', 
      earned: (user.solvedProblems?.length || 0) > 0 
    },
    { 
      title: 'Contest Participant', 
      description: 'Participated in your first contest', 
      earned: (user.contestsParticipated?.length || 0) > 0 
    },
    { 
      title: 'Codecoin Collector', 
      description: 'Earned 5 codecoins', 
      earned: (user.codecoins || 0) >= 5 
    },
    { 
      title: 'Problem Solver', 
      description: 'Solved 10 problems', 
      earned: (user.solvedProblems?.length || 0) >= 10 
    },
    {
      title: 'AlgoBucks 1000 Points Certified',
      description: 'Reached 1000 points and earned your AlgoBucks certification',
      earned: (user.points || 0) >= 1000,
    },
    {
      title: '100-Day Streak Badge',
      description: 'Solved problems for 100 consecutive days',
      earned: streakMilestones.d100,
    },
    {
      title: '500-Day Streak Badge',
      description: 'Solved problems for 500 consecutive days',
      earned: streakMilestones.d500,
    },
    {
      title: '1000-Day Streak Badge',
      description: 'Solved problems for 1000 consecutive days — unlocks exclusive T‑shirt reward!',
      earned: streakMilestones.d1000,
    },
  ];

  const openAchievement = (a: Achievement) => {
    setActiveAchievement(a);
    setShowAchModal(true);
  };
  const closeAchievement = () => {
    setShowAchModal(false);
    setActiveAchievement(null);
  };

  type SubmissionItem = {
    _id: string;
    problem?: { _id: string; title?: string } | string;
    problemId?: string;
    language: string;
    status: string;
    createdAt: string;
  };

  const [recentSubmissions, setRecentSubmissions] = useState<SubmissionItem[]>([]);

  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        const data = await apiService.get<{ submissions: SubmissionItem[] }>(`/submissions`);
        const list = (data as any).submissions || (data as any) || [];
        setRecentSubmissions(list.slice(0, 5));
      } catch (e) {
        console.warn('Failed to load recent submissions');
      }
    };
    loadSubmissions();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-black dark:via-gray-900 dark:to-black py-4 sm:py-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm sm:text-base">
            {error}
          </div>
        )}
        
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-blue-200 dark:border-gray-700 p-3 sm:p-6 mb-6 sm:mb-8 transition-colors duration-300"
        >
          <div className="flex flex-col sm:flex-row items-start justify-between mb-6 gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 w-full sm:w-auto">
              <div onClick={() => user.avatarUrl && setShowPreview(true)} className={`relative ${avatarShape === 'round' ? 'rounded-full' : 'rounded-lg'} overflow-hidden border border-blue-200 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 cursor-${user.avatarUrl ? 'zoom-in' : 'default'} transition-colors duration-300`}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl font-bold">
                    {(user.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left w-full sm:w-auto min-w-0">
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      placeholder="Full Name"
                      className="w-full px-3 py-2 bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-600 rounded-lg text-blue-900 dark:text-blue-400 placeholder-blue-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm sm:text-base transition-colors duration-300"
                    />
                    <ClampText
                      text={`@${user.username}`}
                      lines={2}
                      title={`@${user.username}`}
                      className="text-blue-600 dark:text-blue-400 text-sm sm:text-base"
                    />
                    {canShowEmail && (
                      <ClampText
                        text={user.email}
                        lines={2}
                        title={user.email}
                        className="text-blue-500 dark:text-gray-400 text-xs sm:text-sm"
                      />
                    )}
                  </div>
                ) : (
                  <div>
                    <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-blue-900 dark:text-blue-400 mb-1 leading-tight break-words">
                      {user.fullName || user.username}
                    </h1>
                    <ClampText
                      text={`@${user.username}`}
                      lines={2}
                      title={`@${user.username}`}
                      className="text-blue-600 dark:text-blue-400 mb-1 text-sm sm:text-base"
                    />
                    {canShowEmail && (
                      <ClampText
                        text={user.email}
                        lines={2}
                        title={user.email}
                        className="text-blue-500 dark:text-gray-400 mb-3 text-xs sm:text-sm"
                      />
                    )}
                    {canShowBio && user.bio && (
                      <p className="text-blue-700 dark:text-blue-300 mb-3 text-sm sm:text-base break-words">{user.bio}</p>
                    )}
                    {isPublicView && !canShowBio && user.bio && (
                      <p className="text-xs text-blue-500 dark:text-gray-500 italic mb-3">Bio hidden due to your privacy settings.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="flex items-center justify-center space-x-2 px-3 py-2 sm:px-4 sm:py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors text-sm font-medium"
                  >
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{isUpdating ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center justify-center space-x-2 px-3 py-2 sm:px-4 sm:py-2 bg-blue-100 dark:bg-gray-700 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  {/* Avatar controls */}
                  <div className="flex items-center gap-2">
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarSelected} />
                    <button
                      onClick={onChooseAvatar}
                      className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-blue-50 dark:bg-gray-700 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-gray-600 border border-blue-200 dark:border-gray-600 text-xs sm:text-sm transition-colors duration-300"
                      disabled={isUploadingAvatar}
                    >
                      {isUploadingAvatar ? 'Uploading…' : (user.avatarUrl ? 'Change Photo' : 'Add Photo')}
                    </button>
                    {user.avatarUrl && (
                      <button
                        onClick={onRemoveAvatar}
                        className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 text-xs sm:text-sm transition-colors duration-300"
                        disabled={isUploadingAvatar}
                      >
                        Remove
                      </button>
                    )}
                    <button
                      onClick={toggleAvatarShape}
                      className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 text-xs sm:text-sm transition-colors duration-300"
                    >
                      {avatarShape === 'round' ? 'Square' : 'Round'}
                    </button>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center justify-center space-x-2 px-2.5 py-1.5 sm:px-4 sm:py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                  <label className="flex items-center gap-2 text-xs sm:text-sm text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-gray-700 border border-blue-200 dark:border-gray-600 px-3 py-2 rounded-lg cursor-pointer transition-colors duration-300">
                    <input type="checkbox" checked={previewPublic} onChange={(e) => setPreviewPublic(e.target.checked)} />
                    <span title="Preview how your profile looks to others based on your privacy settings">Preview as public</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Avatar Cropper Modal */}
          <AvatarCropperModal
            open={showCropper}
            onClose={() => setShowCropper(false)}
            onCropped={handleCroppedAvatar}
          />

          {/* Avatar Preview Modal */}
          {showPreview && user.avatarUrl && (
            <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-3" onClick={() => setShowPreview(false)}>
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-blue-200 dark:border-gray-700 overflow-hidden transition-colors duration-300" onClick={(e) => e.stopPropagation()}>
                <img src={user.avatarUrl} alt={user.username} className="max-h-[80vh] max-w-[90vw] object-contain" />
                <div className="p-2 text-center bg-blue-50 dark:bg-gray-800 text-blue-700 dark:text-blue-400 text-sm">Click outside to close</div>
              </div>
            </div>
          )}

          {/* Profile Details */}
          {isEditing ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className="w-full px-3 py-2 bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-600 rounded-lg text-blue-900 dark:text-blue-400 placeholder-blue-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none text-sm transition-colors duration-300"
                />
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="City, Country"
                    className="w-full px-3 py-2 bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-600 rounded-lg text-blue-900 dark:text-blue-400 placeholder-blue-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm transition-colors duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">Company</label>
                  <input
                    type="text"
                    value={editForm.company}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                    placeholder="Your company"
                    className="w-full px-3 py-2 bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-600 rounded-lg text-blue-900 dark:text-blue-400 placeholder-blue-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm transition-colors duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">School</label>
                  <input
                    type="text"
                    value={editForm.school}
                    onChange={(e) => setEditForm({ ...editForm, school: e.target.value })}
                    placeholder="Your school/university"
                    className="w-full px-3 py-2 bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-600 rounded-lg text-blue-900 dark:text-blue-400 placeholder-blue-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm transition-colors duration-300"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6 text-xs sm:text-sm text-blue-600 dark:text-blue-400">
              {user.location && (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{user.location}</span>
                </div>
              )}
              {user.company && (
                <div className="flex items-center">
                  <Building className="w-4 h-4 mr-1" />
                  <span>{user.company}</span>
                </div>
              )}
              {user.school && (
                <div className="flex items-center">
                  <GraduationCap className="w-4 h-4 mr-1" />
                  <span>{user.school}</span>
                </div>
              )}
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'N/A'}</span>
              </div>
            </div>
          )}

          {/* Social Links */}
          {isEditing ? (
            <div className="space-y-3 mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-blue-900 dark:text-blue-400">Social Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">Website</label>
                  <input
                    type="url"
                    value={editForm.website}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    placeholder="https://yourwebsite.com"
                    className="w-full px-3 py-2 bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-600 rounded-lg text-blue-900 dark:text-blue-400 placeholder-blue-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm transition-colors duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">GitHub</label>
                  <input
                    type="text"
                    value={editForm.github}
                    onChange={(e) => setEditForm({ ...editForm, github: e.target.value })}
                    placeholder="github.com/username"
                    className="w-full px-3 py-2 bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-600 rounded-lg text-blue-900 dark:text-blue-400 placeholder-blue-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm transition-colors duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">LinkedIn</label>
                  <input
                    type="text"
                    value={editForm.linkedin}
                    onChange={(e) => setEditForm({ ...editForm, linkedin: e.target.value })}
                    placeholder="linkedin.com/in/username"
                    className="w-full px-3 py-2 bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-600 rounded-lg text-blue-900 dark:text-blue-400 placeholder-blue-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm transition-colors duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">Twitter</label>
                  <input
                    type="text"
                    value={editForm.twitter}
                    onChange={(e) => setEditForm({ ...editForm, twitter: e.target.value })}
                    placeholder="twitter.com/username"
                    className="w-full px-3 py-2 bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-600 rounded-lg text-blue-900 dark:text-blue-400 placeholder-blue-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm transition-colors duration-300"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
              {canShowSocialLinks && user.website && (
                <a
                  href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-100 dark:bg-gray-700 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-gray-600 transition-colors text-sm"
                >
                  <Globe className="w-4 h-4" />
                  <span>Website</span>
                </a>
              )}
              {canShowSocialLinks && user.github && (
                <a
                  href={user.github.startsWith('http') ? user.github : `https://${user.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-100 dark:bg-gray-700 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-gray-600 transition-colors text-sm"
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                </a>
              )}
              {canShowSocialLinks && user.linkedin && (
                <a
                  href={user.linkedin.startsWith('http') ? user.linkedin : `https://${user.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-100 dark:bg-gray-700 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-gray-600 transition-colors text-sm"
                >
                  <Linkedin className="w-4 h-4" />
                  <span>LinkedIn</span>
                </a>
              )}
              {canShowSocialLinks && user.twitter && (
                <a
                  href={user.twitter.startsWith('http') ? user.twitter : `https://${user.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-100 dark:bg-gray-700 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-gray-600 transition-colors text-sm"
                >
                  <Twitter className="w-4 h-4" />
                  <span>Twitter</span>
                </a>
              )}
              {isPublicView && !canShowSocialLinks && (user.website || user.github || user.linkedin || user.twitter) && (
                <span className="text-xs text-blue-500 dark:text-gray-500 italic">Social links hidden due to your privacy settings.</span>
              )}
            </div>
          )}

          {/* Admin Welcome Message */}
          {user.isAdmin ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-3 sm:p-4 mb-6 rounded-r-lg transition-colors duration-300">
              <h3 className="text-lg font-medium text-blue-800 dark:text-blue-400">Welcome to the profile of Administrator of AlgoBucks</h3>
              <p className="text-blue-600 dark:text-blue-300 text-sm mt-1">You have full administrative access to the platform.</p>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="text-center bg-blue-50 dark:bg-gray-800 p-2.5 sm:p-4 rounded-lg border border-blue-200 dark:border-gray-600 transition-colors duration-300">
                <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{user.codecoins || 0}</p>
                <p className="text-blue-500 dark:text-blue-400 text-xs sm:text-sm">Codecoins</p>
              </div>
              {canShowSolved && (
                <div className="text-center bg-green-50 dark:bg-green-900/20 p-2.5 sm:p-4 rounded-lg border border-green-200 dark:border-green-800 transition-colors duration-300">
                  <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{user.solvedProblems?.length || 0}</p>
                  <p className="text-green-500 dark:text-green-400 text-xs sm:text-sm">Problems Solved</p>
                </div>
              )}
              <div className="text-center bg-yellow-50 dark:bg-yellow-900/20 p-2.5 sm:p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 transition-colors duration-300">
                <p className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{user.points || 0}</p>
                <p className="text-yellow-500 dark:text-yellow-400 text-xs sm:text-sm">Points</p>
              </div>
              <div className="text-center bg-purple-50 dark:bg-purple-900/20 p-2.5 sm:p-4 rounded-lg border border-purple-200 dark:border-purple-800 transition-colors duration-300">
                <p className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {typeof currentRank === 'number' ? `#${currentRank}` : 'N/A'}
                </p>
                <p className="text-purple-500 dark:text-purple-400 text-xs sm:text-sm">Leaderboard Rank</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
              <div className="text-center bg-orange-50 dark:bg-orange-900/20 p-2.5 sm:p-4 rounded-lg border border-orange-200 dark:border-orange-800 transition-colors duration-300">
                <p className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-300">{currentStreak}</p>
                <p className="text-orange-500 dark:text-orange-300 text-xs sm:text-sm">Current Streak (days)</p>
              </div>
              <div className="text-center bg-teal-50 dark:bg-teal-900/20 p-2.5 sm:p-4 rounded-lg border border-teal-200 dark:border-teal-800 transition-colors duration-300">
                <p className="text-xl sm:text-2xl font-bold text-teal-600 dark:text-teal-300">{maxStreak}</p>
                <p className="text-teal-500 dark:text-teal-300 text-xs sm:text-sm">Max Streak (days)</p>
              </div>
            </div>

            {/* Activity Calendar */}
            <div className="mb-6">
              <SubmissionCalendar days={365} />
            </div>
            </>
          )}
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-8">
          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-blue-200 dark:border-gray-700 p-3 sm:p-6 transition-colors duration-300"
          >
            <h2 className="text-lg sm:text-xl font-semibold text-blue-900 dark:text-blue-400 mb-4 flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-yellow-500 dark:text-yellow-400" />
              Achievements
            </h2>
            
            <div className="space-y-3">
              {achievements.map((achievement, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() => achievement.earned && openAchievement(achievement)}
                  disabled={!achievement.earned}
                  title={achievement.earned ? 'View achievement' : 'Locked — keep going!'}
                  className={`w-full text-left flex items-center space-x-3 p-2.5 sm:p-3 rounded-lg transition-colors duration-300 focus:outline-none ${
                    achievement.earned
                      ? 'focus:ring-2 focus:ring-blue-400 cursor-pointer'
                      : 'opacity-60 cursor-not-allowed'
                  } ${
                    achievement.earned ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' : 'bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-600'
                  }`}
                >
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
                    achievement.earned ? 'bg-yellow-500 dark:bg-yellow-600' : 'bg-blue-300 dark:bg-gray-600'
                  }`}>
                    <Trophy className={`w-4 h-4 sm:w-5 sm:h-5 ${achievement.earned ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium text-sm sm:text-base transition-colors duration-300 ${achievement.earned ? 'text-yellow-700 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'}`}>
                      {achievement.title}
                    </p>
                    <p className="text-blue-500 dark:text-gray-400 text-xs sm:text-sm truncate" title={achievement.description}>{achievement.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity - Show if allowed by privacy settings (also for admins) */}
          {canShowContestHistory && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-blue-200 dark:border-gray-700 p-3 sm:p-6 transition-colors duration-300"
            >
              <h2 className="text-lg sm:text-xl font-semibold text-blue-900 dark:text-blue-400 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-500 dark:text-green-400" />
                Recent Submissions
              </h2>
              
              {recentSubmissions.length > 0 ? (
                <div className="space-y-3">
                  {recentSubmissions.map((submission) => {
                    const id = (submission as any)._id || (submission as any).id;
                    const problem = submission.problem as any;
                    const problemTitle = typeof problem === 'object' && problem?.title ? problem.title : undefined;
                    const problemIdText = typeof problem === 'object' && problem?._id ? problem._id : (submission.problemId || '');
                    return (
                      <Link key={id} to={`/submissions/${id}`} className="flex items-center justify-between p-2.5 sm:p-3 bg-blue-50 dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-gray-600 hover:bg-blue-100 dark:hover:bg-gray-700 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-blue-900 dark:text-blue-400 font-medium text-sm sm:text-base truncate">
                            {problemTitle || `Problem #${problemIdText}`}
                          </p>
                          <p className="text-blue-600 dark:text-blue-400 text-xs sm:text-sm capitalize">{submission.language}</p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            (submission.status || '').toLowerCase() === 'accepted' ? 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/20' : 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/20'
                          }`}>
                            {submission.status}
                          </span>
                          <p className="text-blue-500 dark:text-gray-400 text-xs mt-1">
                            {new Date((submission as any).createdAt || (submission as any).timestamp || Date.now()).toLocaleDateString()}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                  <div className="pt-1 text-right">
                    <Link to="/submissions" className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-sm font-medium underline transition-colors">
                      View all submissions
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-10 w-10 sm:h-12 sm:w-12 text-blue-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-blue-600 dark:text-blue-400 text-sm sm:text-base">No submissions yet</p>
                  <p className="text-blue-500 dark:text-gray-500 text-xs sm:text-sm">Start solving problems to see your progress here</p>
                  <div className="mt-3">
                    <Link to="/submissions" className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-sm font-medium underline transition-colors">
                      View all submissions
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
      <AchievementModal open={showAchModal} onClose={closeAchievement} achievement={activeAchievement} />
    </div>
  );
}