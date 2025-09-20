import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { 
  Settings as SettingsIcon, Bell, Shield, Palette, 
  Save, Mail, Lock, Info
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Settings: React.FC = () => {
  const { user, updateUser, updatePreferences, changePassword, uploadAvatar, removeAvatar } = useAuth();
  const [activeTab, setActiveTab] = useState<'account' | 'notifications' | 'privacy' | 'preferences'>('account');
  const [isLoading, setIsLoading] = useState(false);
  
  // Account settings
  const [accountForm, setAccountForm] = useState({
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: user?.preferences?.notifications?.emailNotifications ?? true,
    contestReminders: user?.preferences?.notifications?.contestReminders ?? true,
    submissionResults: user?.preferences?.notifications?.submissionResults ?? true,
    weeklyDigest: user?.preferences?.notifications?.weeklyDigest ?? false,
    marketingEmails: user?.preferences?.notifications?.marketingEmails ?? false,
    frequency: (user?.preferences?.notifications as any)?.frequency || 'immediate',
    digestTime: (user?.preferences?.notifications as any)?.digestTime || '09:00'
  });
  
  // Privacy settings
  const [privacy, setPrivacy] = useState({
    profileVisibility: user?.preferences?.privacy?.profileVisibility || 'public',
    showEmail: user?.preferences?.privacy?.showEmail ?? false,
    showSolvedProblems: user?.preferences?.privacy?.showSolvedProblems ?? true,
    showContestHistory: user?.preferences?.privacy?.showContestHistory ?? true,
    showBio: (user?.preferences?.privacy as any)?.showBio ?? true,
    showSocialLinks: (user?.preferences?.privacy as any)?.showSocialLinks ?? true
  });
  
  // Preference settings
  const [preferences, setPreferences] = useState({
    theme: (user?.preferences?.theme as string) || 'light',
    language: user?.preferences?.language || 'en',
    timezone: user?.preferences?.timezone || 'UTC',
    defaultCodeLanguage: (user?.preferences?.defaultCodeLanguage as string) || 'javascript',
    preferredCurrency: (user?.preferredCurrency as any) || 'INR'
  });
  const [editorPrefs, setEditorPrefs] = useState({
    fontSize: (user?.preferences as any)?.editor?.fontSize || 14,
    tabSize: (user?.preferences as any)?.editor?.tabSize || 2,
    theme: (user?.preferences as any)?.editor?.theme || 'light'
  });
  const [accessibility, setAccessibility] = useState({
    reducedMotion: (user?.preferences as any)?.accessibility?.reducedMotion ?? false,
    highContrast: (user?.preferences as any)?.accessibility?.highContrast ?? false
  });
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarRemoving, setAvatarRemoving] = useState(false);

  const languageOptions = useMemo(() => {
    try {
      const fallbacks = ['en', 'hi', 'es', 'fr', 'de', 'zh', 'ja'];
      const langs = Array.from(new Set([...(navigator.languages || []), ...fallbacks]))
        .map((s) => s.toLowerCase().split('-')[0])
        .filter(Boolean);
      const uniq = Array.from(new Set(langs));
      const dn = new (Intl as any).DisplayNames(['en'], { type: 'language' });
      return uniq.map((code) => ({ code, label: (dn?.of?.(code) as string) || code.toUpperCase() }));
    } catch {
      return [
        { code: 'en', label: 'English' },
        { code: 'hi', label: 'Hindi' },
        { code: 'es', label: 'Spanish' },
        { code: 'fr', label: 'French' },
        { code: 'de', label: 'German' },
        { code: 'zh', label: 'Chinese' },
        { code: 'ja', label: 'Japanese' },
      ];
    }
  }, []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Keep local state in sync with latest user data (after save or refresh)
  useEffect(() => {
    if (!user) return;
    setNotifications({
      emailNotifications: user?.preferences?.notifications?.emailNotifications ?? true,
      contestReminders: user?.preferences?.notifications?.contestReminders ?? true,
      submissionResults: user?.preferences?.notifications?.submissionResults ?? true,
      weeklyDigest: user?.preferences?.notifications?.weeklyDigest ?? false,
      marketingEmails: user?.preferences?.notifications?.marketingEmails ?? false,
      frequency: (user?.preferences?.notifications as any)?.frequency || 'immediate',
      digestTime: (user?.preferences?.notifications as any)?.digestTime || '09:00'
    });
    setPrivacy({
      profileVisibility: user?.preferences?.privacy?.profileVisibility || 'public',
      showEmail: user?.preferences?.privacy?.showEmail ?? false,
      showSolvedProblems: user?.preferences?.privacy?.showSolvedProblems ?? true,
      showContestHistory: user?.preferences?.privacy?.showContestHistory ?? true,
      showBio: (user?.preferences?.privacy as any)?.showBio ?? true,
      showSocialLinks: (user?.preferences?.privacy as any)?.showSocialLinks ?? true
    });
    setPreferences({
      theme: (user?.preferences?.theme as string) || 'light',
      language: user?.preferences?.language || 'en',
      timezone: user?.preferences?.timezone || 'UTC',
      defaultCodeLanguage: (user?.preferences?.defaultCodeLanguage as string) || 'javascript',
      preferredCurrency: (user?.preferredCurrency as any) || 'INR'
    });
    setEditorPrefs({
      fontSize: (user?.preferences as any)?.editor?.fontSize || 14,
      tabSize: (user?.preferences as any)?.editor?.tabSize || 2,
      theme: (user?.preferences as any)?.editor?.theme || 'light'
    });
    setAccessibility({
      reducedMotion: (user?.preferences as any)?.accessibility?.reducedMotion ?? false,
      highContrast: (user?.preferences as any)?.accessibility?.highContrast ?? false
    });
    setAccountForm((prev) => ({ ...prev, email: user.email || '' }));
  }, [user]);

  const handleAccountUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const updates: any = {};
      
      if (accountForm.email !== user.email) {
        updates.email = accountForm.email;
      }
      
      if (accountForm.newPassword) {
        if (accountForm.newPassword !== accountForm.confirmPassword) {
          alert('New passwords do not match');
          return;
        }
        if (accountForm.newPassword.length < 6) {
          alert('Password must be at least 6 characters');
          return;
        }
        if (!accountForm.currentPassword) {
          alert('Please enter your current password');
          return;
        }
      }
      
      if (Object.keys(updates).length > 0) {
        await updateUser(updates);
        alert('Account settings updated successfully');
      }

      if (accountForm.newPassword) {
        await changePassword(accountForm.currentPassword, accountForm.newPassword);
        alert('Password updated successfully');
      }
      setAccountForm({ ...accountForm, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      alert('Failed to update account settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    try {
      setSavingNotifications(true);
      await updatePreferences({ preferences: { notifications } });
      alert('Notification preferences updated');
    } catch (e) {
      alert('Failed to update notification settings');
    } finally {
      setSavingNotifications(false);
    }
  };

  const handlePrivacyUpdate = async () => {
    try {
      setSavingPrivacy(true);
      await updatePreferences({ preferences: { privacy } });
      alert('Privacy settings updated');
    } catch (e) {
      alert('Failed to update privacy settings');
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handlePreferenceUpdate = async () => {
    try {
      setSavingPrefs(true);
      const { theme, language, timezone, defaultCodeLanguage } = preferences;
      await updatePreferences({ preferences: { theme, language, timezone, defaultCodeLanguage, editor: editorPrefs, accessibility } });
      alert('Preferences updated');
    } catch (e) {
      alert('Failed to update preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  const tabs = [
    { key: 'account', label: 'Account', icon: SettingsIcon },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'privacy', label: 'Privacy', icon: Shield },
    { key: 'preferences', label: 'Preferences', icon: Palette }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 flex items-center">
            <SettingsIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-2 sm:mr-3" />
            Settings
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">Manage your account and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-4 sm:p-6 sticky top-4">
              <nav className="space-y-1 sm:space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`w-full flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 text-left rounded-lg transition-all duration-200 text-sm sm:text-base ${
                      activeTab === tab.key
                        ? 'bg-blue-600 text-white shadow-md transform scale-105'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <tab.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-4 sm:p-6">
              {activeTab === 'account' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 border-b border-blue-100 pb-4">
                    Account Settings
                  </h2>
                  
                  <form onSubmit={handleAccountUpdate} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          value={accountForm.email}
                          onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                          className="pl-10 w-full px-3 py-3 bg-blue-50 border border-blue-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>

                    {/* Avatar management */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Profile Avatar
                      </label>
                      <div className="flex items-center gap-4">
                        {user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full border border-blue-200 object-cover" />
                        ) : (
                          <div className="w-16 h-16 rounded-full border border-dashed border-blue-200 flex items-center justify-center text-blue-400 text-xs">
                            No Avatar
                          </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-3">
                          <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer text-sm">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  setAvatarUploading(true);
                                  await uploadAvatar(file);
                                  alert('Avatar uploaded');
                                } catch (err) {
                                  alert((err as Error)?.message || 'Failed to upload avatar');
                                } finally {
                                  setAvatarUploading(false);
                                  e.currentTarget.value = '';
                                }
                              }}
                            />
                            {avatarUploading ? 'Uploading…' : 'Upload New'}
                          </label>
                          {user?.avatarUrl && (
                            <button
                              type="button"
                              disabled={avatarRemoving}
                              onClick={async () => {
                                try {
                                  setAvatarRemoving(true);
                                  await removeAvatar();
                                  alert('Avatar removed');
                                } catch (err) {
                                  alert((err as Error)?.message || 'Failed to remove avatar');
                                } finally {
                                  setAvatarRemoving(false);
                                }
                              }}
                              className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm disabled:opacity-50"
                            >
                              {avatarRemoving ? 'Removing…' : 'Remove'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Currency
                      </label>
                      <div className="flex items-center space-x-3">
                        <select
                          value={preferences.preferredCurrency}
                          onChange={async (e) => {
                            const next = e.target.value as 'INR' | 'USD' | 'EUR' | 'GBP';
                            setPreferences((p) => ({ ...p, preferredCurrency: next }));
                            try {
                              setSavingCurrency(true);
                              await updatePreferences({ preferredCurrency: next });
                            } catch (err) {
                              alert((err as Error)?.message || 'Failed to update currency');
                            } finally {
                              setSavingCurrency(false);
                            }
                          }}
                          className="w-full px-3 py-3 bg-blue-50 border border-blue-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="INR">INR (₹)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                        {savingCurrency && (
                          <span className="text-xs text-blue-600">Saving…</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Affects how amounts are displayed in the UI.</p>
                    </div>
                    </div>

                    <div className="border-t border-blue-100 pt-6">
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Change Password</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Password
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                              type="password"
                              value={accountForm.currentPassword}
                              onChange={(e) => setAccountForm({ ...accountForm, currentPassword: e.target.value })}
                              className="pl-10 w-full px-3 py-3 bg-blue-50 border border-blue-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              placeholder="Enter current password"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              New Password
                            </label>
                            <input
                              type="password"
                              value={accountForm.newPassword}
                              onChange={(e) => setAccountForm({ ...accountForm, newPassword: e.target.value })}
                              className="w-full px-3 py-3 bg-blue-50 border border-blue-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              placeholder="Enter new password"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Confirm New Password
                            </label>
                            <input
                              type="password"
                              value={accountForm.confirmPassword}
                              onChange={(e) => setAccountForm({ ...accountForm, confirmPassword: e.target.value })}
                              className="w-full px-3 py-3 bg-blue-50 border border-blue-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              placeholder="Confirm new password"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center justify-center space-x-2 w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                      <Save className="h-4 w-4" />
                      <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </form>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 border-b border-blue-100 pb-4">
                    Notification Settings
                  </h2>
                  
                  <div className="space-y-4">
                    {(['emailNotifications','contestReminders','submissionResults','weeklyDigest','marketingEmails'] as const).map((key) => (
                      <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3 sm:space-y-0">
                        <div className="flex-1">
                          <h3 className="text-gray-800 font-medium capitalize text-sm sm:text-base">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </h3>
                          <p className="text-gray-600 text-xs sm:text-sm">
                            {key === 'emailNotifications' && 'Receive email notifications for important updates'}
                            {key === 'contestReminders' && 'Get reminded about upcoming contests'}
                            {key === 'submissionResults' && 'Notifications when your submissions are judged'}
                            {key === 'weeklyDigest' && 'Weekly summary of your progress'}
                            {key === 'marketingEmails' && 'Promotional emails and platform updates'}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications[key] as boolean}
                            onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notification Frequency</label>
                        <select
                          value={notifications.frequency}
                          onChange={(e) => setNotifications({ ...notifications, frequency: e.target.value })}
                          className="w-full px-3 py-3 bg-blue-50 border border-blue-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="immediate">Immediate</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="none">None</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Digest Time (HH:MM)</label>
                        <input
                          type="time"
                          value={notifications.digestTime}
                          onChange={(e) => setNotifications({ ...notifications, digestTime: e.target.value })}
                          className="w-full px-3 py-3 bg-blue-50 border border-blue-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                        <p className="text-xs text-gray-500 mt-1">Applied in your timezone: {preferences.timezone}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleNotificationUpdate}
                    disabled={savingNotifications}
                    className="flex items-center justify-center space-x-2 w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-md"
                  >
                    <Save className="h-4 w-4" />
                    <span>{savingNotifications ? 'Saving…' : 'Save Notification Settings'}</span>
                  </button>
                </motion.div>
              )}

              {activeTab === 'privacy' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 border-b border-blue-100 pb-4">
                    Privacy Settings
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <span>Profile Visibility</span>
                        <span title="Control who can view your profile: Public (anyone), Registered users only, or Private (only you).">
                          <Info className="w-4 h-4 text-gray-400" />
                        </span>
                      </label>
                      <select
                        value={privacy.profileVisibility}
                        onChange={(e) => setPrivacy({ ...privacy, profileVisibility: e.target.value as 'public' | 'registered' | 'private' })}
                        className="w-full px-3 py-3 bg-blue-50 border border-blue-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="public">Public - Anyone can view</option>
                        <option value="registered">Registered Users Only</option>
                        <option value="private">Private - Only me</option>
                      </select>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-800">Profile Information</h3>
                      
                      {Object.entries(privacy).slice(1).map(([key, value]) => (
                        <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3 sm:space-y-0">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-gray-800 font-medium capitalize text-sm sm:text-base">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </h4>
                              <span
                                title={
                                  key === 'showEmail'
                                    ? 'Display email address on profile'
                                    : key === 'showSolvedProblems'
                                    ? 'Show solved problems count'
                                    : key === 'showContestHistory'
                                    ? 'Display contest participation history'
                                    : key === 'showBio'
                                    ? 'Display your bio on profile'
                                    : key === 'showSocialLinks'
                                    ? 'Display your social links (website, GitHub, LinkedIn, Twitter)'
                                    : ''
                                }
                              >
                                <Info className="w-4 h-4 text-gray-400" />
                              </span>
                            </div>
                            <p className="text-gray-600 text-xs sm:text-sm">
                              {key === 'showEmail' && 'Display email address on profile'}
                              {key === 'showSolvedProblems' && 'Show solved problems count'}
                              {key === 'showContestHistory' && 'Display contest participation history'}
                              {key === 'showBio' && 'Display your bio on profile'}
                              {key === 'showSocialLinks' && 'Display your social links (website, GitHub, LinkedIn, Twitter)'}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value as boolean}
                              onChange={(e) => setPrivacy({ ...privacy, [key]: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handlePrivacyUpdate}
                    disabled={savingPrivacy}
                    className="flex items-center justify-center space-x-2 w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-md"
                  >
                    <Save className="h-4 w-4" />
                    <span>{savingPrivacy ? 'Saving…' : 'Save Privacy Settings'}</span>
                  </button>
                </motion.div>
              )}

              {activeTab === 'preferences' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 border-b border-blue-100 pb-4">
                    Preferences
                  </h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Theme
                      </label>
                      <select
                        value={preferences.theme}
                        onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                        className="w-full px-3 py-3 bg-blue-50 border border-blue-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="light">Light Theme</option>
                        <option value="dark">Dark Theme</option>
                        <option value="auto">Auto (System)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Code Language
                      </label>
                      <select
                        value={preferences.defaultCodeLanguage}
                        onChange={(e) => setPreferences({ ...preferences, defaultCodeLanguage: e.target.value })}
                        className="w-full px-3 py-3 bg-blue-50 border border-blue-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Editor Font Size</label>
                      <input
                        type="number"
                        min={10}
                        max={24}
                        value={editorPrefs.fontSize}
                        onChange={(e) => setEditorPrefs({ ...editorPrefs, fontSize: Number(e.target.value) })}
                        className="w-full px-3 py-3 bg-blue-50 border border-blue-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Editor Tab Size</label>
                      <select
                        value={editorPrefs.tabSize}
                        onChange={(e) => setEditorPrefs({ ...editorPrefs, tabSize: Number(e.target.value) })}
                        className="w-full px-3 py-3 bg-blue-50 border border-blue-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value={2}>2</option>
                        <option value={4}>4</option>
                        <option value={8}>8</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Editor Theme</label>
                      <select
                        value={editorPrefs.theme}
                        onChange={(e) => setEditorPrefs({ ...editorPrefs, theme: e.target.value as any })}
                        className="w-full px-3 py-3 bg-blue-50 border border-blue-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="light">Light</option>
                        <option value="vs-dark">Dark</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <select
                        value={preferences.language}
                        onChange={async (e) => {
                          const next = e.target.value;
                          setPreferences({ ...preferences, language: next });
                          try {
                            setSavingPrefs(true);
                            await updatePreferences({ preferences: { language: next } });
                          } catch (err) {
                            alert((err as Error)?.message || 'Failed to update language');
                          } finally {
                            setSavingPrefs(false);
                          }
                        }}
                        className="w-full px-3 py-3 bg-blue-50 border border-blue-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        {languageOptions.map(({ code, label }) => (
                          <option key={code} value={code}>
                            {label} ({code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <select
                        value={preferences.timezone}
                        onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                        className="w-full px-3 py-3 bg-blue-50 border border-blue-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Europe/London">London</option>
                        <option value="Asia/Tokyo">Tokyo</option>
                        <option value="Asia/Kolkata">India</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handlePreferenceUpdate}
                    disabled={savingPrefs}
                    className="flex items-center justify-center space-x-2 w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-md"
                  >
                    <Save className="h-4 w-4" />
                    <span>{savingPrefs ? 'Saving…' : 'Save Preferences'}</span>
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};