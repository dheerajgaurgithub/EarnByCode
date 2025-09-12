import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { uploadFile, validateFile, createImagePreview } from '@/lib/fileUpload';
import { motion } from 'framer-motion';
import { Camera, Loader2, Pencil, X, Upload, Save, MapPin, Building, GraduationCap, Calendar, Globe, Github, Linkedin, Twitter, Target, TrendingUp, Trophy } from 'lucide-react';
import { Navigate } from 'react-router-dom';

// Helper function to get the full avatar URL
const getAvatarUrl = (avatarPath: string | undefined): string => {
  if (!avatarPath) return '';
  if (avatarPath.startsWith('http') || avatarPath.startsWith('blob:')) {
    return avatarPath;
  }
  
  // For relative paths, assume they're already full URLs from the server
  // If not, they should be handled by the server-side routing
  return avatarPath;
};

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

interface Submission {
  id: string;
  problemId: number;
  language: string;
  status: string;
  timestamp: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  bio?: string;
  location?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  company?: string;
  school?: string;
  avatar?: string;
  codecoins?: number;
  points?: number;
  ranking?: number;
  isAdmin?: boolean;
  createdAt?: string;
  solvedProblems?: any[];
  contestsParticipated?: any[];
  submissions?: Submission[];
}

export const Profile: React.FC = () => {
  const { user, updateUser, isLoading: isAuthLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const toast = useToast();
  const [isUploading, setIsUploading] = useState(false);
  
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 sm:p-12 max-w-sm w-full mx-4"
        >
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-blue-900 font-semibold text-lg">Loading Profile</p>
              <p className="text-blue-500 text-sm">Please wait a moment...</p>
            </div>
          </div>
        </motion.div>
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
          
          // Convert base64 to blob if needed
          if (avatarFile.startsWith('data:')) {
            const response = await fetch(avatarFile);
            const blob = await response.blob();
            formData.append('avatar', blob, 'avatar.jpg');
          } else {
            formData.append('avatar', avatarFile);
          }
          
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
            throw new Error(data.message || 'Failed to update avatar');
          }
          
          // Update the user with the new avatar URL
          if (data.avatar) {
            await updateUser({ avatar: data.avatar });
          }
        } catch (error) {
          console.error('Failed to update avatar:', error);
          showError('Profile updated, but there was an issue updating your avatar. You can try again later.');
        }
      }
      
      showSuccess('Your profile has been updated successfully.');
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
    setAvatarFile(null);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file
    const validation = validateFile(file, {
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      maxSizeMB: 5
    });

    if (!validation.valid) {
      showError(validation.error || 'Invalid file');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Create preview
      const previewUrl = await createImagePreview(file);
      setAvatarFile(previewUrl);
      
      // Upload file
      const result = await uploadFile({
        endpoint: '/upload/avatar',
        file,
        onProgress: (progress) => setUploadProgress(progress),
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Update user with new avatar URL
      if (result && result.url) {
        await updateUser({ avatar: result.url });
        showSuccess('Profile picture updated successfully!');
        setUploadProgress(100);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload avatar';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsUpdating(false);
      setIsUploading(false);
      
      setTimeout(() => {
        setUploadProgress(null);
      }, 1000);
      
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-xl shadow-sm"
          >
            <div className="flex">
              <div className="ml-3">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-blue-100 p-6 sm:p-8 lg:p-10 mb-8 backdrop-blur-sm"
        >
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between mb-8 gap-8">
            {/* Profile Image and Basic Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-6 sm:space-y-0 sm:space-x-8">
              <div className="relative group">
                <div className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-full overflow-hidden border-4 border-white shadow-2xl ring-4 ring-blue-100">
                  <img
                    src={avatarFile || getAvatarUrl(user.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.username)}&background=3b82f6&color=fff&size=300`}
                    alt={user.username}
                    className={`w-full h-full object-cover transition-all duration-300 ${isUploading ? 'opacity-70 blur-sm' : 'group-hover:scale-105'}`}
                  />
                  {/* Upload Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-full flex items-center justify-center transition-all duration-300">
                    <label className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {isUploading ? (
                        <div className="flex flex-col items-center text-white">
                          <Loader2 className="w-8 h-8 animate-spin mb-2" />
                          <span className="text-sm font-medium">{uploadProgress || 0}%</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-white">
                          <Camera className="w-8 h-8 mb-1" />
                          <span className="text-xs font-medium">Change Photo</span>
                        </div>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        disabled={isUpdating || isUploading}
                      />
                    </label>
                  </div>
                </div>
                {/* Upload Progress Ring */}
                {isUploading && uploadProgress !== null && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-full">
                    <div className="bg-blue-100 rounded-full h-2 shadow-inner">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300 ease-out shadow-sm"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-center sm:text-left space-y-2">
                {isEditing ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      placeholder="Full Name"
                      className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-xl text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-xl font-semibold transition-all duration-200"
                    />
                    <div className="space-y-1">
                      <p className="text-blue-600 font-medium">@{user.username}</p>
                      <p className="text-blue-500 text-sm">{user.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-900 leading-tight">
                      {user.fullName || user.username}
                    </h1>
                    <p className="text-blue-600 font-medium text-lg">@{user.username}</p>
                    <p className="text-blue-500">{user.email}</p>
                    {user.bio && !isEditing && (
                      <p className="text-blue-700 mt-4 text-lg max-w-md leading-relaxed">{user.bio}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isUpdating}
                    className="flex items-center justify-center space-x-3 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {isUpdating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    <span>{isUpdating ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isUpdating}
                    className="flex items-center justify-center space-x-3 px-6 py-3 bg-white border-2 border-blue-200 text-blue-700 rounded-xl hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                  >
                    <X className="w-5 h-5" />
                    <span>Cancel</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center justify-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Pencil className="w-5 h-5" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>

          {/* Profile Details */}
          {isEditing ? (
            <div className="space-y-8">
              {/* Bio and Basic Info */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-blue-800 mb-3">Bio</label>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-xl text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none transition-all duration-200"
                    />
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-blue-800 mb-3">Location</label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      placeholder="City, Country"
                      className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-xl text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-blue-800 mb-3">Company</label>
                    <input
                      type="text"
                      value={editForm.company}
                      onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                      placeholder="Your company"
                      className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-xl text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-blue-800 mb-3">School</label>
                    <input
                      type="text"
                      value={editForm.school}
                      onChange={(e) => setEditForm({ ...editForm, school: e.target.value })}
                      placeholder="Your school/university"
                      className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-xl text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div>
                <h3 className="text-xl font-semibold text-blue-900 mb-6">Social Links</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-blue-800 mb-3">Website</label>
                    <input
                      type="url"
                      value={editForm.website}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      placeholder="https://yourwebsite.com"
                      className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-xl text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-blue-800 mb-3">GitHub</label>
                    <input
                      type="text"
                      value={editForm.github}
                      onChange={(e) => setEditForm({ ...editForm, github: e.target.value })}
                      placeholder="github.com/username"
                      className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-xl text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-blue-800 mb-3">LinkedIn</label>
                    <input
                      type="text"
                      value={editForm.linkedin}
                      onChange={(e) => setEditForm({ ...editForm, linkedin: e.target.value })}
                      placeholder="linkedin.com/in/username"
                      className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-xl text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-blue-800 mb-3">Twitter</label>
                    <input
                      type="text"
                      value={editForm.twitter}
                      onChange={(e) => setEditForm({ ...editForm, twitter: e.target.value })}
                      placeholder="twitter.com/username"
                      className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-xl text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Info Tags */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {user.location && (
                  <div className="flex items-center bg-gradient-to-r from-blue-100 to-blue-50 px-4 py-2 rounded-full border border-blue-200 shadow-sm">
                    <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                    <span className="text-blue-800 font-medium">{user.location}</span>
                  </div>
                )}
                {user.company && (
                  <div className="flex items-center bg-gradient-to-r from-blue-100 to-blue-50 px-4 py-2 rounded-full border border-blue-200 shadow-sm">
                    <Building className="w-4 h-4 mr-2 text-blue-600" />
                    <span className="text-blue-800 font-medium">{user.company}</span>
                  </div>
                )}
                {user.school && (
                  <div className="flex items-center bg-gradient-to-r from-blue-100 to-blue-50 px-4 py-2 rounded-full border border-blue-200 shadow-sm">
                    <GraduationCap className="w-4 h-4 mr-2 text-blue-600" />
                    <span className="text-blue-800 font-medium">{user.school}</span>
                  </div>
                )}
                <div className="flex items-center bg-gradient-to-r from-blue-100 to-blue-50 px-4 py-2 rounded-full border border-blue-200 shadow-sm">
                  <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                  <span className="text-blue-800 font-medium">Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long'
                  }) : 'N/A'}</span>
                </div>
              </div>

              {/* Social Links */}
              {(user.website || user.github || user.linkedin || user.twitter) && (
                <div className="flex flex-wrap gap-3">
                  {user.website && (
                    <a
                      href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      <Globe className="w-4 h-4" />
                      <span className="font-medium">Website</span>
                    </a>
                  )}
                  {user.github && (
                    <a
                      href={user.github.startsWith('http') ? user.github : `https://${user.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      <Github className="w-4 h-4" />
                      <span className="font-medium">GitHub</span>
                    </a>
                  )}
                  {user.linkedin && (
                    <a
                      href={user.linkedin.startsWith('http') ? user.linkedin : `https://${user.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      <Linkedin className="w-4 h-4" />
                      <span className="font-medium">LinkedIn</span>
                    </a>
                  )}
                  {user.twitter && (
                    <a
                      href={user.twitter.startsWith('http') ? user.twitter : `https://${user.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-sky-400 to-sky-500 text-white rounded-xl hover:from-sky-500 hover:to-sky-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      <Twitter className="w-4 h-4" />
                      <span className="font-medium">Twitter</span>
                    </a>
                  )}
                </div>
              )}

              {/* Admin Welcome Message */}
              {user.isAdmin ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-indigo-50 to-blue-50 border-l-4 border-indigo-500 p-6 rounded-r-2xl shadow-lg"
                >
                  <h3 className="text-xl font-bold text-indigo-900 mb-2">Administrator Dashboard</h3>
                  <p className="text-indigo-700 leading-relaxed">Welcome to AlgoBucks! You have full administrative access to the platform.</p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center bg-gradient-to-br from-blue-50 to-blue-100 p-6 lg:p-8 rounded-2xl border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white font-bold text-lg">C</span>
                    </div>
                    <p className="text-3xl lg:text-4xl font-bold text-blue-700 mb-2">{user.codecoins || 0}</p>
                    <p className="text-blue-600 font-semibold">Codecoins</p>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center bg-gradient-to-br from-green-50 to-green-100 p-6 lg:p-8 rounded-2xl border-2 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-3xl lg:text-4xl font-bold text-green-700 mb-2">{user.solvedProblems?.length || 0}</p>
                    <p className="text-green-600 font-semibold">Problems Solved</p>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 lg:p-8 rounded-2xl border-2 border-yellow-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-3xl lg:text-4xl font-bold text-yellow-700 mb-2">{user.points || 0}</p>
                    <p className="text-yellow-600 font-semibold">Points</p>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-center bg-gradient-to-br from-purple-50 to-purple-100 p-6 lg:p-8 rounded-2xl border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-3xl lg:text-4xl font-bold text-purple-700 mb-2">
                      {user.ranking ? `#${user.ranking - 1}` : 'N/A'}
                    </p>
                    <p className="text-purple-600 font-semibold">Global Rank</p>
                  </motion.div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Achievements and Recent Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-xl border border-blue-100 p-6 sm:p-8 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-blue-900 flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                Achievements
              </h2>
            </div>
            
            <div className="space-y-4">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index + 1) }}
                  className={`flex items-center space-x-4 p-4 rounded-2xl transition-all duration-300 hover:shadow-lg ${
                    achievement.earned 
                      ? 'bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 border-2 border-yellow-200 shadow-md' 
                      : 'bg-gradient-to-r from-blue-50 via-slate-50 to-blue-50 border-2 border-blue-200 hover:border-blue-300'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                    achievement.earned 
                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg' 
                      : 'bg-gradient-to-br from-blue-300 to-blue-400'
                  }`}>
                    <Trophy className={`w-7 h-7 ${achievement.earned ? 'text-white' : 'text-blue-600'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`font-bold text-lg ${
                      achievement.earned ? 'text-yellow-800' : 'text-blue-800'
                    }`}>
                      {achievement.title}
                    </p>
                    <p className="text-blue-600 mt-1 leading-relaxed">{achievement.description}</p>
                  </div>
                  {achievement.earned && (
                    <div className="shrink-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity - Only show for non-admin users */}
          {!user.isAdmin && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-xl border border-blue-100 p-6 sm:p-8 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-blue-900 flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  Recent Submissions
                </h2>
              </div>
              
              {recentSubmissions.length > 0 ? (
                <div className="space-y-4">
                  {recentSubmissions.map((submission, index) => (
                    <motion.div 
                      key={submission.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * (index + 1) }}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 via-slate-50 to-blue-50 rounded-2xl border-2 border-blue-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-blue-900 font-bold text-lg truncate">
                          Problem #{submission.problemId}
                        </p>
                        <p className="text-blue-600 mt-1 capitalize font-medium">
                          {submission.language}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm ${
                          submission.status.toLowerCase() === 'accepted' 
                            ? 'text-green-800 bg-gradient-to-r from-green-100 to-green-200 border border-green-300' 
                            : 'text-red-800 bg-gradient-to-r from-red-100 to-red-200 border border-red-300'
                        }`}>
                          {submission.status}
                        </span>
                        <p className="text-blue-500 text-sm mt-2 font-medium">
                          {new Date(submission.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Target className="h-10 w-10 text-blue-500" />
                  </div>
                  <p className="text-blue-900 text-xl font-bold mb-2">No submissions yet</p>
                  <p className="text-blue-600 text-lg leading-relaxed">Start solving problems to see your progress here</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};