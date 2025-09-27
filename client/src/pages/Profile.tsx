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
      title: 'EarnByCode 1000 Points Certified',
      description: 'Reached 1000 points and earned your EarnByCode certification',
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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-100 dark:from-gray-950 dark:via-black dark:to-gray-900 py-2 sm:py-4 transition-all duration-300">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-5">
        {error && (
          <div className="mb-2 sm:mb-3 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-xs">
            {error}
          </div>
        )}
        
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-lg border border-sky-100 dark:border-green-800 p-3 sm:p-4 mb-3 sm:mb-4 transition-all duration-300 hover:shadow-xl"
        >
          <div className="flex flex-col lg:flex-row items-start justify-between mb-3 gap-3">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-2 sm:space-y-0 sm:space-x-4 w-full lg:w-auto">
              <div onClick={() => user.avatarUrl && setShowPreview(true)} className={`relative ${avatarShape === 'round' ? 'rounded-full' : 'rounded-lg'} overflow-hidden border-2 border-sky-200 dark:border-green-600 bg-white dark:bg-gray-800 flex items-center justify-center w-16 h-16 sm:w-18 sm:h-18 cursor-${user.avatarUrl ? 'zoom-in' : 'default'} transition-all duration-300 hover:scale-105 hover:border-sky-300 dark:hover:border-green-500`}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sky-600 dark:text-green-400 text-lg font-bold">
                    {(user.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left w-full sm:w-auto min-w-0">
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      placeholder="Full Name"
                      className="w-full px-2 py-1.5 bg-sky-50 dark:bg-gray-800 border border-sky-200 dark:border-green-600 rounded-md text-sky-900 dark:text-green-300 placeholder-sky-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:focus:ring-green-500 focus:border-transparent text-xs transition-all duration-300"
                    />
                    <ClampText
                      text={`@${user.username}`}
                      lines={2}
                      title={`@${user.username}`}
                      className="text-sky-600 dark:text-green-400 text-xs"
                    />
                    {canShowEmail && (
                      <ClampText
                        text={user.email}
                        lines={2}
                        title={user.email}
                        className="text-sky-500 dark:text-gray-400 text-xs"
                      />
                    )}
                  </div>
                ) : (
                  <div>
                    <h1 className="text-base sm:text-lg lg:text-xl font-bold text-sky-900 dark:text-green-300 mb-0.5 leading-tight break-words">
                      {user.fullName || user.username}
                    </h1>
                    <ClampText
                      text={`@${user.username}`}
                      lines={2}
                      title={`@${user.username}`}
                      className="text-sky-600 dark:text-green-400 mb-0.5 text-xs"
                    />
                    {canShowEmail && (
                      <ClampText
                        text={user.email}
                        lines={2}
                        title={user.email}
                        className="text-sky-500 dark:text-gray-400 mb-1 text-xs"
                      />
                    )}
                    {canShowBio && user.bio && (
                      <p className="text-sky-700 dark:text-green-300 mb-1 text-xs break-words">{user.bio}</p>
                    )}
                    {isPublicView && !canShowBio && user.bio && (
                      <p className="text-xs text-sky-500 dark:text-gray-500 italic mb-1">Bio hidden due to your privacy settings.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-1.5 sm:space-y-0 sm:space-x-1.5 w-full lg:w-auto">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-green-600 dark:to-green-700 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 dark:hover:from-green-500 dark:hover:to-green-600 transition-all duration-300 text-xs font-medium shadow-md hover:shadow-lg"
                  >
                    {isUpdating ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}
                    <span>{isUpdating ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 text-xs font-medium shadow-sm hover:shadow-md"
                  >
                    <X className="w-3 h-3" />
                    <span>Cancel</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5 justify-center lg:justify-end">
                  {/* Avatar controls */}
                  <div className="flex items-center gap-1.5">
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarSelected} />
                    <button
                      onClick={onChooseAvatar}
                      className="px-2 py-1.5 bg-sky-100 dark:bg-gray-700 text-sky-700 dark:text-green-400 rounded-lg hover:bg-sky-200 dark:hover:bg-gray-600 border border-sky-200 dark:border-green-600 text-xs font-medium transition-all duration-300 shadow-sm hover:shadow-md"
                      disabled={isUploadingAvatar}
                    >
                      {isUploadingAvatar ? 'Uploading…' : (user.avatarUrl ? 'Change' : 'Add Photo')}
                    </button>
                    {user.avatarUrl && (
                      <button
                        onClick={onRemoveAvatar}
                        className="px-2 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-700 text-xs font-medium transition-all duration-300 shadow-sm hover:shadow-md"
                        disabled={isUploadingAvatar}
                      >
                        Remove
                      </button>
                    )}
                    <button
                      onClick={toggleAvatarShape}
                      className="px-2 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 text-xs font-medium transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      {avatarShape === 'round' ? 'Square' : 'Round'}
                    </button>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-500 to-sky-600 dark:from-green-600 dark:to-green-700 text-white rounded-lg hover:from-sky-600 hover:to-sky-700 dark:hover:from-green-500 dark:hover:to-green-600 transition-all duration-300 text-xs font-medium shadow-md hover:shadow-lg"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit Profile</span>
                  </button>
                  <label className="flex items-center gap-1.5 text-xs text-sky-700 dark:text-green-400 bg-sky-50 dark:bg-gray-700 border border-sky-200 dark:border-green-600 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-300 hover:bg-sky-100 dark:hover:bg-gray-600">
                    <input type="checkbox" checked={previewPublic} onChange={(e) => setPreviewPublic(e.target.checked)} />
                    <span title="Preview how your profile looks to others based on your privacy settings">Preview Public</span>
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
            <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-3" onClick={() => setShowPreview(false)}>
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-sky-200 dark:border-green-700 overflow-hidden transition-all duration-300" onClick={(e) => e.stopPropagation()}>
                <img src={user.avatarUrl} alt={user.username} className="max-h-[80vh] max-w-[90vw] object-contain" />
                <div className="p-2 text-center bg-sky-50 dark:bg-gray-800 text-sky-700 dark:text-green-400 text-xs">Click outside to close</div>
              </div>
            </div>
          )}

          {/* Profile Details */}
          {isEditing ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-sky-700 dark:text-green-400 mb-1">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={2}
                  className="w-full px-2 py-1.5 bg-sky-50 dark:bg-gray-800 border border-sky-200 dark:border-green-600 rounded-lg text-sky-900 dark:text-green-300 placeholder-sky-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:focus:ring-green-500 focus:border-transparent resize-none text-xs transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-sky-700 dark:text-green-400 mb-1">Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="City, Country"
                    className="w-full px-2 py-1.5 bg-sky-50 dark:bg-gray-800 border border-sky-200 dark:border-green-600 rounded-lg text-sky-900 dark:text-green-300 placeholder-sky-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:focus:ring-green-500 focus:border-transparent text-xs transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-sky-700 dark:text-green-400 mb-1">Company</label>
                  <input
                    type="text"
                    value={editForm.company}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                    placeholder="Your company"
                    className="w-full px-2 py-1.5 bg-sky-50 dark:bg-gray-800 border border-sky-200 dark:border-green-600 rounded-lg text-sky-900 dark:text-green-300 placeholder-sky-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:focus:ring-green-500 focus:border-transparent text-xs transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-sky-700 dark:text-green-400 mb-1">School</label>
                  <input
                    type="text"
                    value={editForm.school}
                    onChange={(e) => setEditForm({ ...editForm, school: e.target.value })}
                    placeholder="Your school/university"
                    className="w-full px-2 py-1.5 bg-sky-50 dark:bg-gray-800 border border-sky-200 dark:border-green-600 rounded-lg text-sky-900 dark:text-green-300 placeholder-sky-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:focus:ring-green-500 focus:border-transparent text-xs transition-all duration-300"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-sky-600 dark:text-green-400">
              {user.location && (
                <div className="flex items-center bg-sky-50 dark:bg-gray-800 px-2 py-1 rounded-md border border-sky-200 dark:border-green-600">
                  <MapPin className="w-3 h-3 mr-1" />
                  <span>{user.location}</span>
                </div>
              )}
              {user.company && (
                <div className="flex items-center bg-sky-50 dark:bg-gray-800 px-2 py-1 rounded-md border border-sky-200 dark:border-green-600">
                  <Building className="w-3 h-3 mr-1" />
                  <span>{user.company}</span>
                </div>
              )}
              {user.school && (
                <div className="flex items-center bg-sky-50 dark:bg-gray-800 px-2 py-1 rounded-md border border-sky-200 dark:border-green-600">
                  <GraduationCap className="w-3 h-3 mr-1" />
                  <span>{user.school}</span>
                </div>
              )}
              <div className="flex items-center bg-sky-50 dark:bg-gray-800 px-2 py-1 rounded-md border border-sky-200 dark:border-green-600">
                <Calendar className="w-3 h-3 mr-1" />
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
            <div className="space-y-3 mb-3">
              <h3 className="text-sm font-semibold text-sky-900 dark:text-green-300">Social Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-sky-700 dark:text-green-400 mb-1">Website</label>
                  <input
                    type="url"
                    value={editForm.website}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    placeholder="https://yourwebsite.com"
                    className="w-full px-2 py-1.5 bg-sky-50 dark:bg-gray-800 border border-sky-200 dark:border-green-600 rounded-lg text-sky-900 dark:text-green-300 placeholder-sky-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:focus:ring-green-500 focus:border-transparent text-xs transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-sky-700 dark:text-green-400 mb-1">GitHub</label>
                  <input
                    type="text"
                    value={editForm.github}
                    onChange={(e) => setEditForm({ ...editForm, github: e.target.value })}
                    placeholder="github.com/username"
                    className="w-full px-2 py-1.5 bg-sky-50 dark:bg-gray-800 border border-sky-200 dark:border-green-600 rounded-lg text-sky-900 dark:text-green-300 placeholder-sky-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:focus:ring-green-500 focus:border-transparent text-xs transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-sky-700 dark:text-green-400 mb-1">LinkedIn</label>
                  <input
                    type="text"
                    value={editForm.linkedin}
                    onChange={(e) => setEditForm({ ...editForm, linkedin: e.target.value })}
                    placeholder="linkedin.com/in/username"
                    className="w-full px-2 py-1.5 bg-sky-50 dark:bg-gray-800 border border-sky-200 dark:border-green-600 rounded-lg text-sky-900 dark:text-green-300 placeholder-sky-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:focus:ring-green-500 focus:border-transparent text-xs transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-sky-700 dark:text-green-400 mb-1">Twitter</label>
                  <input
                    type="text"
                    value={editForm.twitter}
                    onChange={(e) => setEditForm({ ...editForm, twitter: e.target.value })}
                    placeholder="twitter.com/username"
                    className="w-full px-2 py-1.5 bg-sky-50 dark:bg-gray-800 border border-sky-200 dark:border-green-600 rounded-lg text-sky-900 dark:text-green-300 placeholder-sky-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:focus:ring-green-500 focus:border-transparent text-xs transition-all duration-300"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {canShowSocialLinks && user.website && (
                <a
                  href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 px-2 py-1.5 bg-sky-100 dark:bg-gray-700 text-sky-700 dark:text-green-400 rounded-lg hover:bg-sky-200 dark:hover:bg-gray-600 transition-all duration-300 text-xs shadow-sm hover:shadow-md"
                >
                  <Globe className="w-3 h-3" />
                  <span>Website</span>
                </a>
              )}
              {canShowSocialLinks && user.github && (
                <a
                  href={user.github.startsWith('http') ? user.github : `https://${user.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 px-2 py-1.5 bg-sky-100 dark:bg-gray-700 text-sky-700 dark:text-green-400 rounded-lg hover:bg-sky-200 dark:hover:bg-gray-600 transition-all duration-300 text-xs shadow-sm hover:shadow-md"
                >
                  <Github className="w-3 h-3" />
                  <span>GitHub</span>
                </a>
              )}
              {canShowSocialLinks && user.linkedin && (
                <a
                  href={user.linkedin.startsWith('http') ? user.linkedin : `https://${user.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 px-2 py-1.5 bg-sky-100 dark:bg-gray-700 text-sky-700 dark:text-green-400 rounded-lg hover:bg-sky-200 dark:hover:bg-gray-600 transition-all duration-300 text-xs shadow-sm hover:shadow-md"
                >
                  <Linkedin className="w-3 h-3" />
                  <span>LinkedIn</span>
                </a>
              )}
              {canShowSocialLinks && user.twitter && (
                <a
                  href={user.twitter.startsWith('http') ? user.twitter : `https://${user.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 px-2 py-1.5 bg-sky-100 dark:bg-gray-700 text-sky-700 dark:text-green-400 rounded-lg hover:bg-sky-200 dark:hover:bg-gray-600 transition-all duration-300 text-xs shadow-sm hover:shadow-md"
                >
                  <Twitter className="w-3 h-3" />
                  <span>Twitter</span>
                </a>
              )}
              {isPublicView && !canShowSocialLinks && (user.website || user.github || user.linkedin || user.twitter) && (
                <span className="text-xs text-sky-500 dark:text-gray-500 italic px-2 py-1.5 bg-sky-50 dark:bg-gray-800 rounded-lg">Social links hidden due to your privacy settings.</span>
              )}
            </div>
          )}

          {/* Admin Welcome Message */}
          {user.isAdmin ? (
            <div className="bg-gradient-to-r from-sky-50 to-sky-100 dark:from-green-900/20 dark:to-green-800/20 border-l-4 border-sky-500 dark:border-green-400 p-3 mb-3 rounded-r-lg transition-all duration-300 shadow-inner">
              <h3 className="text-sm font-medium text-sky-800 dark:text-green-300">Welcome to the profile of Administrator of EarnByCode</h3>
              <p className="text-sky-600 dark:text-green-400 text-xs mt-0.5">You have full administrative access to the platform.</p>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
              <div className="text-center bg-gradient-to-br from-sky-50 to-sky-100 dark:from-gray-800 dark:to-gray-700 p-2 sm:p-3 rounded-lg border border-sky-200 dark:border-green-600 transition-all duration-300 hover:scale-105 hover:shadow-md">
                <p className="text-base sm:text-lg font-bold text-sky-600 dark:text-green-400">{user.codecoins || 0}</p>
                <p className="text-sky-500 dark:text-green-500 text-xs font-medium">Codecoins</p>
              </div>
              {canShowSolved && (
                <div className="text-center bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-green-900/20 dark:to-green-800/20 p-2 sm:p-3 rounded-lg border border-emerald-200 dark:border-green-700 transition-all duration-300 hover:scale-105 hover:shadow-md">
                  <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-green-400">{user.solvedProblems?.length || 0}</p>
                  <p className="text-emerald-500 dark:text-green-500 text-xs font-medium">Problems Solved</p>
                </div>
              )}
              <div className="text-center bg-gradient-to-br from-amber-50 to-amber-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-2 sm:p-3 rounded-lg border border-amber-200 dark:border-yellow-700 transition-all duration-300 hover:scale-105 hover:shadow-md">
                <p className="text-base sm:text-lg font-bold text-amber-600 dark:text-yellow-400">{user.points || 0}</p>
                <p className="text-amber-500 dark:text-yellow-500 text-xs font-medium">Points</p>
              </div>
              <div className="text-center bg-gradient-to-br from-violet-50 to-violet-100 dark:from-purple-900/20 dark:to-purple-800/20 p-2 sm:p-3 rounded-lg border border-violet-200 dark:border-purple-700 transition-all duration-300 hover:scale-105 hover:shadow-md">
                <p className="text-base sm:text-lg font-bold text-violet-600 dark:text-purple-400">
                  {typeof currentRank === 'number' ? `#${currentRank}` : 'N/A'}
                </p>
                <p className="text-violet-500 dark:text-purple-500 text-xs font-medium">Leaderboard Rank</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="text-center bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-2 sm:p-3 rounded-lg border border-orange-200 dark:border-orange-700 transition-all duration-300 hover:scale-105 hover:shadow-md">
                <p className="text-base sm:text-lg font-bold text-orange-600 dark:text-orange-400">{currentStreak}</p>
                <p className="text-orange-500 dark:text-orange-500 text-xs font-medium">Current Streak (days)</p>
              </div>
              <div className="text-center bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 p-2 sm:p-3 rounded-lg border border-teal-200 dark:border-teal-700 transition-all duration-300 hover:scale-105 hover:shadow-md">
                <p className="text-base sm:text-lg font-bold text-teal-600 dark:text-teal-400">{maxStreak}</p>
                <p className="text-teal-500 dark:text-teal-500 text-xs font-medium">Max Streak (days)</p>
              </div>
            </div>

            {/* Activity Calendar */}
            <div className="mb-3">
              <SubmissionCalendar days={365} />
            </div>
            </>
          )}
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-lg border border-sky-100 dark:border-green-700 p-3 sm:p-4 transition-all duration-300"
          >
            <h2 className="text-sm sm:text-base font-semibold text-sky-900 dark:text-green-300 mb-3 flex items-center">
              <Trophy className="w-4 h-4 mr-1.5 text-amber-500 dark:text-yellow-400" />
              Achievements
            </h2>
            
            <div className="space-y-2">
              {achievements.map((achievement, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() => achievement.earned && openAchievement(achievement)}
                  disabled={!achievement.earned}
                  title={achievement.earned ? 'View achievement' : 'Locked — keep going!'}
                  className={`w-full text-left flex items-center space-x-2 p-2 rounded-lg transition-all duration-300 focus:outline-none ${
                    achievement.earned
                      ? 'focus:ring-2 focus:ring-sky-400 dark:focus:ring-green-500 cursor-pointer hover:scale-102'
                      : 'opacity-60 cursor-not-allowed'
                  } ${
                    achievement.earned ? 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-amber-200 dark:border-yellow-700 shadow-sm hover:shadow-md' : 'bg-sky-50 dark:bg-gray-800 border border-sky-200 dark:border-green-600'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                    achievement.earned ? 'bg-gradient-to-br from-amber-500 to-yellow-600 dark:from-yellow-600 dark:to-amber-700 shadow-md' : 'bg-sky-300 dark:bg-gray-600'
                  }`}>
                    <Trophy className={`w-4 h-4 ${achievement.earned ? 'text-white' : 'text-sky-600 dark:text-green-400'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium text-xs transition-all duration-300 ${achievement.earned ? 'text-amber-800 dark:text-yellow-300' : 'text-sky-600 dark:text-green-400'}`}>
                      {achievement.title}
                    </p>
                    <p className="text-sky-500 dark:text-gray-400 text-xs truncate" title={achievement.description}>{achievement.description}</p>
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
              className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-lg border border-sky-100 dark:border-green-700 p-3 sm:p-4 transition-all duration-300"
            >
              <h2 className="text-sm sm:text-base font-semibold text-sky-900 dark:text-green-300 mb-3 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1.5 text-emerald-500 dark:text-green-400" />
                Recent Submissions
              </h2>
              
              {recentSubmissions.length > 0 ? (
                <div className="space-y-2">
                  {recentSubmissions.map((submission) => {
                    const id = (submission as any)._id || (submission as any).id;
                    const problem = submission.problem as any;
                    const problemTitle = typeof problem === 'object' && problem?.title ? problem.title : undefined;
                    const problemIdText = typeof problem === 'object' && problem?._id ? problem._id : (submission.problemId || '');
                    return (
                      <Link key={id} to={`/submissions/${id}`} className="flex items-center justify-between p-2 bg-gradient-to-r from-sky-50 to-sky-100 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-sky-200 dark:border-green-600 hover:from-sky-100 hover:to-sky-200 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 hover:scale-102 hover:shadow-md">
                        <div className="min-w-0 flex-1">
                          <p className="text-sky-900 dark:text-green-300 font-medium text-xs truncate">
                            {problemTitle || `Problem #${problemIdText}`}
                          </p>
                          <p className="text-sky-600 dark:text-green-400 text-xs capitalize">{submission.language}</p>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <span className={`px-1.5 py-0.5 rounded-md text-xs font-medium ${
                            (submission.status || '').toLowerCase() === 'accepted' ? 'text-emerald-700 dark:text-green-400 bg-emerald-100 dark:bg-green-900/20' : 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/20'
                          }`}>
                            {submission.status}
                          </span>
                          <p className="text-sky-500 dark:text-gray-400 text-xs mt-0.5">
                            {new Date((submission as any).createdAt || (submission as any).timestamp || Date.now()).toLocaleDateString()}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                  <div className="pt-1 text-right">
                    <Link to="/submissions" className="text-sky-700 dark:text-green-400 hover:text-sky-900 dark:hover:text-green-300 text-xs font-medium underline transition-all duration-300 hover:no-underline">
                      View all submissions
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Target className="h-10 w-10 text-sky-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sky-600 dark:text-green-400 text-xs">No submissions yet</p>
                  <p className="text-sky-500 dark:text-gray-500 text-xs">Start solving problems to see your progress here</p>
                  <div className="mt-2">
                    <Link to="/submissions" className="text-sky-700 dark:text-green-400 hover:text-sky-900 dark:hover:text-green-300 text-xs font-medium underline transition-all duration-300 hover:no-underline">
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