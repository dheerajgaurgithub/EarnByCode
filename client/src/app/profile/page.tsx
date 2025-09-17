'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Loader2, Camera, X, Mail, Award, Coins } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Type for user data
type UserData = {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  avatar?: string;
  points?: number;
  codecoins?: number;
  createdAt?: string;
  [key: string]: any;
};

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(user || null);

  // Fetch user data if not available
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || isRefreshing) return;
      
      try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
          // Update the auth context with fresh data
          updateUser(data);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setIsRefreshing(false);
      }
    };

    if (!user) {
      router.push('/login');
    } else if (!userData) {
      fetchUserData();
    }
  }, [user, router, updateUser, isRefreshing]);

  const getAvatarUrl = (avatarPath: string | undefined): string => {
    if (!avatarPath) return '';
    if (avatarPath.startsWith('http') || avatarPath.startsWith('blob:')) {
      return avatarPath;
    }
    // If it's a relative path, prepend the API URL
    if (avatarPath.startsWith('/uploads/')) {
      return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${avatarPath}`;
    }
    return avatarPath;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Validate file type
    if (!file.type.match('image/.*')) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    try {
      setIsUploading(true);
      await uploadAvatar(file);
      // Refresh user data after successful upload
      setIsRefreshing(true);
      toast.success('Profile picture updated successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch('/api/users/me/avatar', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to upload avatar');
    }

    // Update local state with new avatar
    if (data.user) {
      setUserData(prev => prev ? { ...prev, avatar: data.user.avatar } : null);
      updateUser(data.user);
      return data.user;
    }
    
    throw new Error('Invalid response from server');
  };

  const removeAvatar = async () => {
    if (!userData?.avatar) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/users/me/avatar', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to remove avatar');
      }

      // Update local state
      if (data.user) {
        setUserData(prev => prev ? { ...prev, avatar: undefined } : null);
        updateUser(data.user);
        toast.success('Profile picture removed');
      }
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove avatar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!userData) return;
    
    const { name, value } = e.target;
    setUserData({
      ...userData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;
    
    setIsLoading(true);
    try {
      const { id, points, codecoins, createdAt, ...updateData } = userData;
      
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      // Update user context
      updateUser(data.user);
      setUserData(prev => ({
        ...prev!,
        ...data.user
      }));
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                  <AvatarImage 
                    src={getAvatarUrl(userData.avatar)} 
                    alt={userData.username}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-600 text-white text-2xl font-bold">
                    {userData.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <label 
                    htmlFor="avatar-upload" 
                    className="p-2 bg-white bg-opacity-80 rounded-full cursor-pointer hover:bg-opacity-100 transition-all"
                    title="Change photo"
                  >
                    <Camera className="h-5 w-5 text-gray-800" />
                    <input
                      id="avatar-upload"
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                  </label>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{userData.username}</h1>
                <p className="text-gray-600 flex items-center">
                  <Mail className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="truncate max-w-[200px]">{userData.email}</span>
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="inline-flex items-center text-sm text-gray-600">
                    <Award className="h-4 w-4 mr-1 text-amber-500 flex-shrink-0" />
                    {userData.points || 0} points
                  </span>
                  <span className="inline-flex items-center text-sm text-gray-600">
                    <Coins className="h-4 w-4 mr-1 text-yellow-500 flex-shrink-0" />
                    {userData.codecoins || 0} coins
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button 
                variant="outline" 
                className="bg-white hover:bg-gray-50 border-gray-300"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Change Photo'
                )}
              </Button>
              {userData.avatar && (
                <Button 
                  variant="ghost" 
                  className="ml-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={removeAvatar}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  <span className="ml-1">Remove</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <Input 
                  id="username" 
                  name="username"
                  value={userData?.username || ''} 
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input 
                  id="email" 
                  name="email"
                  type="email" 
                  value={userData?.email || ''} 
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <Input 
                  id="fullName" 
                  name="fullName"
                  value={userData?.fullName || ''} 
                  onChange={handleInputChange}
                  placeholder="Not set"
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="joined" className="block text-sm font-medium text-gray-700 mb-1">
                  Member Since
                </label>
                <Input 
                  id="joined" 
                  value={userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : ''} 
                  disabled 
                  className="mt-1 bg-gray-50"
                />
              </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h2>
            <div className="space-y-4">
              <Button variant="outline" className="w-full sm:w-auto">
                Change Password
              </Button>
              <Button variant="outline" className="w-full sm:w-auto ml-0 sm:ml-2">
                Email Preferences
              </Button>
              <Button variant="outline" className="w-full sm:w-auto ml-0 sm:ml-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
