import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Navigate } from 'react-router-dom';
import { 
  User as UserIcon, Trophy, Calendar, Target, TrendingUp, Edit3, Save, X, 
  Camera, MapPin, Building, GraduationCap, Globe, Github, Linkedin, Twitter, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';

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

// Removed unused Submission interface

export const Profile: React.FC = () => {
  const { user, updateUser, isLoading: isAuthLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const toast = useToast();
  
  const showSuccess = (message: string) => {
    toast.success(message);
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

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: '/profile' }} replace />;
  }

  const handleSave = async () => {
    setIsUpdating(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!editForm.fullName?.trim()) {
        throw new Error('Full name is required');
      }
      
      // Update profile information
      await updateUser(editForm);
      
      // If there's a new avatar, update it
      if (avatarFile) {
        try {
          const formData = new FormData();
          formData.append('avatar', avatarFile);
          
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/me/avatar`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData,
            credentials: 'include' // Important for cookies/auth
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.message || 'Failed to update avatar');
          }
          
          // Update the user with the new avatar URL
          if (data.avatar) {
            await updateUser({ avatar: data.avatar });
          }
        } catch (error) {
          console.error('Failed to update avatar:', error);
          // Continue with success but show warning about avatar
          showError('Profile updated, but there was an issue updating your avatar. You can try again later.');
        }
      }
      
      // Only show success if we got this far without throwing
      showSuccess('Your profile has been updated successfully.');
      
      // Reset form state
      setIsEditing(false);
      setAvatarFile(null);
      
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, or GIF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/me/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload avatar');
      }
      
      // Update the user with the new avatar URL
      if (data.avatar) {
        await updateUser({ avatar: data.avatar });
        showSuccess('Profile picture updated successfully!');
      }
      
    } catch (error: any) {
      console.error('Failed to update avatar:', error);
      setError(error.message || 'Failed to update avatar. Please try again.');
      showError(error.message || 'Failed to update avatar. Please try again.');
    } finally {
      setIsUpdating(false);
      // Reset the file input
      if (e.target) {
        e.target.value = '';
      }
    }
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
  ];

  const recentSubmissions = (user.submissions || []).slice(-5).reverse();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm sm:text-base">
            {error}
          </div>
        )}
        
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border border-blue-200 p-4 sm:p-6 mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start justify-between mb-6 gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 w-full sm:w-auto">
              <div className="relative mx-auto sm:mx-0">
                {user.avatar ? (
                  <img
                    src={user.avatar.startsWith('http') ? user.avatar : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.avatar}`}
                    alt={user.username}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-blue-200"
                    onError={(e) => {
                      // If image fails to load, use a default avatar
                      const target = e.target as HTMLImageElement;
                      target.src = '/default-avatar.png';
                    }}
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200">
                    <UserIcon className="w-10 h-10 sm:w-12 sm:h-12 text-blue-400" />
                  </div>
                )}
                <label className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-blue-600 rounded-full p-1.5 sm:p-2 cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                  <Camera className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>
              
              <div className="flex-1 text-center sm:text-left w-full sm:w-auto">
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      placeholder="Full Name"
                      className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm sm:text-base"
                    />
                    <p className="text-blue-600 text-sm sm:text-base">@{user.username}</p>
                    <p className="text-blue-500 text-xs sm:text-sm">{user.email}</p>
                  </div>
                ) : (
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-1">
                      {user.fullName || user.username}
                    </h1>
                    <p className="text-blue-600 mb-1 text-sm sm:text-base">@{user.username}</p>
                    <p className="text-blue-500 mb-3 text-xs sm:text-sm">{user.email}</p>
                    {user.bio && (
                      <p className="text-blue-700 mb-3 text-sm sm:text-base">{user.bio}</p>
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
                    className="flex items-center justify-center space-x-2 px-3 py-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
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
                    className="flex items-center justify-center space-x-2 px-3 py-2 sm:px-4 sm:py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center justify-center space-x-2 px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>

          {/* Profile Details */}
          {isEditing ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none text-sm"
                />
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="City, Country"
                    className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={editForm.company}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                    placeholder="Your company"
                    className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">School</label>
                  <input
                    type="text"
                    value={editForm.school}
                    onChange={(e) => setEditForm({ ...editForm, school: e.target.value })}
                    placeholder="Your school/university"
                    className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6 text-xs sm:text-sm text-blue-600">
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
              <h3 className="text-base sm:text-lg font-semibold text-blue-900">Social Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={editForm.website}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    placeholder="https://yourwebsite.com"
                    className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">GitHub</label>
                  <input
                    type="text"
                    value={editForm.github}
                    onChange={(e) => setEditForm({ ...editForm, github: e.target.value })}
                    placeholder="github.com/username"
                    className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">LinkedIn</label>
                  <input
                    type="text"
                    value={editForm.linkedin}
                    onChange={(e) => setEditForm({ ...editForm, linkedin: e.target.value })}
                    placeholder="linkedin.com/in/username"
                    className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Twitter</label>
                  <input
                    type="text"
                    value={editForm.twitter}
                    onChange={(e) => setEditForm({ ...editForm, twitter: e.target.value })}
                    placeholder="twitter.com/username"
                    className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
              {user.website && (
                <a
                  href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                >
                  <Globe className="w-4 h-4" />
                  <span>Website</span>
                </a>
              )}
              {user.github && (
                <a
                  href={user.github.startsWith('http') ? user.github : `https://${user.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                </a>
              )}
              {user.linkedin && (
                <a
                  href={user.linkedin.startsWith('http') ? user.linkedin : `https://${user.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                >
                  <Linkedin className="w-4 h-4" />
                  <span>LinkedIn</span>
                </a>
              )}
              {user.twitter && (
                <a
                  href={user.twitter.startsWith('http') ? user.twitter : `https://${user.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                >
                  <Twitter className="w-4 h-4" />
                  <span>Twitter</span>
                </a>
              )}
            </div>
          )}

          {/* Admin Welcome Message */}
          {user.isAdmin ? (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
              <h3 className="text-lg font-medium text-blue-800">Welcome to the profile of Administrator of AlgoBucks</h3>
              <p className="text-blue-600 text-sm mt-1">You have full administrative access to the platform.</p>
              
              {/* Admin Stats - No rank */}
              {/* <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-4">
                <div className="text-center bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">{user.codecoins || 0}</p>
                  <p className="text-blue-500 text-xs sm:text-sm">Codecoins</p>
                </div>
                <div className="text-center bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{user.solvedProblems?.length || 0}</p>
                  <p className="text-green-500 text-xs sm:text-sm">Problems</p>
                </div>
                <div className="text-center bg-yellow-50 p-3 sm:p-4 rounded-lg border border-yellow-200">
                  <p className="text-xl sm:text-2xl font-bold text-yellow-600">{user.points || 0}</p>
                  <p className="text-yellow-500 text-xs sm:text-sm">Points</p>
                </div>
              </div> */}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="text-center bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{user.codecoins || 0}</p>
                <p className="text-blue-500 text-xs sm:text-sm">Codecoins</p>
              </div>
              <div className="text-center bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
                <p className="text-xl sm:text-2xl font-bold text-green-600">{user.solvedProblems?.length || 0}</p>
                <p className="text-green-500 text-xs sm:text-sm">Problems Solved</p>
              </div>
              <div className="text-center bg-yellow-50 p-3 sm:p-4 rounded-lg border border-yellow-200">
                <p className="text-xl sm:text-2xl font-bold text-yellow-600">{user.points || 0}</p>
                <p className="text-yellow-500 text-xs sm:text-sm">Points</p>
              </div>
              <div className="text-center bg-purple-50 p-3 sm:p-4 rounded-lg border border-purple-200">
                <p className="text-xl sm:text-2xl font-bold text-purple-600">
                  {user.ranking ? `#${user.ranking-1}` : 'N/A'}
                </p>
                <p className="text-purple-500 text-xs sm:text-sm">Global Rank</p>
              </div>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg border border-blue-200 p-4 sm:p-6"
          >
            <h2 className="text-lg sm:text-xl font-semibold text-blue-900 mb-4 flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
              Achievements
            </h2>
            
            <div className="space-y-3">
              {achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      achievement.earned ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'
                    }`}
                  >
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${
                      achievement.earned ? 'bg-yellow-500' : 'bg-blue-300'
                    }`}>
                      <Trophy className={`w-4 h-4 sm:w-5 sm:h-5 ${achievement.earned ? 'text-white' : 'text-blue-600'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium text-sm sm:text-base ${achievement.earned ? 'text-yellow-700' : 'text-blue-600'}`}>
                        {achievement.title}
                      </p>
                      <p className="text-blue-500 text-xs sm:text-sm">{achievement.description}</p>
                    </div>
                  </div>
                ))}
              </div>
          </motion.div>

          {/* Recent Activity - Only show for non-admin users */}
          {!user.isAdmin && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg border border-blue-200 p-4 sm:p-6"
            >
              <h2 className="text-lg sm:text-xl font-semibold text-blue-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                Recent Submissions
              </h2>
              
              {recentSubmissions.length > 0 ? (
                <div className="space-y-3">
                  {recentSubmissions.map((submission) => (
                    <div key={submission.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="min-w-0 flex-1">
                        <p className="text-blue-900 font-medium text-sm sm:text-base truncate">Problem #{submission.problemId}</p>
                        <p className="text-blue-600 text-xs sm:text-sm">{submission.language}</p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          submission.status.toLowerCase() === 'accepted' ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
                        }`}>
                          {submission.status}
                        </span>
                        <p className="text-blue-500 text-xs mt-1">
                          {new Date(submission.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-10 w-10 sm:h-12 sm:w-12 text-blue-300 mx-auto mb-3" />
                  <p className="text-blue-600 text-sm sm:text-base">No submissions yet</p>
                  <p className="text-blue-500 text-xs sm:text-sm">Start solving problems to see your progress here</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};