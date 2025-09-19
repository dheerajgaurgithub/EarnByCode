'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Mail, Award, Coins } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Type for user data
type UserData = {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  // avatar removed
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

  // avatar features removed

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
              <div className="h-24 w-24 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-700">
                  {userData.username?.[0]?.toUpperCase() || 'U'}
                </span>
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
            <div className="mt-4 sm:mt-0" />
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
