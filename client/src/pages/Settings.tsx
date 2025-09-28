import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { 
  Settings as SettingsIcon, Bell, Shield, Palette, 
  Save, Mail, Lock, Info, ShieldAlert, Trash2, CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser, updatePreferences, changePassword, uploadAvatar, removeAvatar, deleteAccount } = useAuth();
  const { setTheme: setUiTheme } = useTheme();
  const { setLanguage, t } = useI18n();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'account' | 'notifications' | 'privacy' | 'preferences'>('account');
  const [isLoading, setIsLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Account settings
  const [accountForm, setAccountForm] = useState({
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  // OTP flow removed
  const [deleteText, setDeleteText] = useState('');
  const [emailUpdated, setEmailUpdated] = useState(false);
  
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
    theme: (user?.preferences?.theme as string) || 'auto',
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
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarRemoving, setAvatarRemoving] = useState(false);

  // Bank details state
  const [bankForm, setBankForm] = useState({
    bankAccountName: '',
    bankAccountNumber: '',
    ifsc: '',
    bankName: '',
    upiId: ''
  });
  const [bankVerified, setBankVerified] = useState<boolean>(false);
  const [bankLastUpdated, setBankLastUpdated] = useState<string | null>(null);
  const [savingBank, setSavingBank] = useState(false);
  // Bank OTP flow removed

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

  // List of IANA time zones for the Timezone dropdown
  const timezoneOptions = useMemo(() => {
    try {
      const tz = (Intl as any).supportedValuesOf?.('timeZone');
      if (Array.isArray(tz) && tz.length) return tz as string[];
    } catch {}
    // Fallback shortlist
    return [
      'UTC',
      'Asia/Kolkata',
      'Asia/Dubai',
      'Europe/London',
      'Europe/Berlin',
      'America/New_York',
      'America/Los_Angeles',
      'Australia/Sydney',
    ];
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
      theme: (user?.preferences?.theme as string) || 'auto',
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

    // Apply UI theme from user preference (auto -> system)
    const prefTheme = (user?.preferences?.theme as string) || 'auto';
    const uiTheme = prefTheme === 'auto' ? 'system' : (prefTheme as any);
    try { setUiTheme(uiTheme); } catch {}
    // Apply app language from user preference
    try { setLanguage((user?.preferences?.language as any) || 'en'); } catch {}
  }, [user]);

  // Load bank details
  useEffect(() => {
    const loadBankDetails = async () => {
      try {
        const resp = await api.get('/users/me/bank-details');
        const data = (resp as any)?.data || resp;
        if (data?.bankDetails) {
          setBankForm({
            bankAccountName: data.bankDetails.bankAccountName || '',
            bankAccountNumber: '', // do not prefill sensitive number
            ifsc: data.bankDetails.ifsc || '',
            bankName: data.bankDetails.bankName || '',
            upiId: data.bankDetails.upiId || ''
          });
          setBankVerified(!!data.bankDetails.verified);
          setBankLastUpdated(data.bankDetails.lastUpdatedAt || null);
        }
      } catch (e) {
        // Silently ignore if endpoint not ready
      }
    };
    loadBankDetails();
  }, []);

  // Bank OTP flow removed

  const saveBankDetails = async () => {
    // Basic IFSC validation
    const ifscOk = /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(bankForm.ifsc.trim());
    if (!ifscOk) {
      toast.error('Please enter a valid IFSC (e.g., HDFC0001234)');
      return;
    }
    if (!bankForm.bankAccountName) {
      toast.error('Account holder name is required');
      return;
    }
    if (!bankForm.bankAccountNumber && !bankForm.upiId) {
      toast.error('Provide either bank account number or UPI ID');
      return;
    }
    try {
      setSavingBank(true);
      const payload = {
        bankAccountName: bankForm.bankAccountName.trim(),
        bankAccountNumber: bankForm.bankAccountNumber.trim() || undefined,
        ifsc: bankForm.ifsc.trim().toUpperCase(),
        bankName: bankForm.bankName.trim() || undefined,
        upiId: bankForm.upiId.trim() || undefined
      };
      await api.patch('/users/me/bank-details', payload);
      toast.success('Bank details saved');
      setBankForm((p) => ({ ...p, bankAccountNumber: '' }));
      setBankLastUpdated(new Date().toISOString());
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save bank details');
    } finally {
      setSavingBank(false);
    }
  };

  const handleAccountUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const updates: any = {};
      // Direct email update (OTP removed)
      if (accountForm.email && accountForm.email !== user.email) {
        updates.email = accountForm.email;
      }
      
      if (accountForm.newPassword) {
        if (accountForm.newPassword !== accountForm.confirmPassword) {
          toast.error('New passwords do not match');
          return;
        }
        if (accountForm.newPassword.length < 6) {
          toast.error('Password must be at least 6 characters');
          return;
        }
        if (!accountForm.currentPassword) {
          toast.error('Please enter your current password');
          return;
        }
      }
      
      if (Object.keys(updates).length > 0) {
        await updateUser(updates);
        toast.success('Account settings updated successfully');
      }

      if (accountForm.newPassword) {
        await changePassword(accountForm.currentPassword, accountForm.newPassword);
        toast.success('Password updated successfully');
      }
      setAccountForm({ ...accountForm, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error('Failed to update account settings');
    } finally {
      setIsLoading(false);
    }
  };

  // OTP verify removed

  const onDeleteAccount = async () => {
    const phrase = 'delete earnbycode account';
    if (deleteText.trim().toLowerCase() !== phrase) {
      toast.error("Please type 'delete EarnByCode account' exactly to confirm.");
      return;
    }
    if (!confirm('This action is permanent. Are you sure you want to delete your account?')) return;
    try {
      setDeleting(true);
      const tid = toast.loading('Deleting your account…');
      await deleteAccount();
      toast.dismiss(tid);
      toast.success('Account deleted');
      // Redirect to home page after deletion
      navigate('/', { replace: true });
    } catch (err) {
      toast.error((err as Error)?.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  const handleNotificationUpdate = async () => {
    try {
      setSavingNotifications(true);
      await updatePreferences({ preferences: { notifications } });
      toast.success('Notification preferences updated');
    } catch (e) {
      toast.error('Failed to update notification settings');
    } finally {
      setSavingNotifications(false);
    }
  };

  const handlePrivacyUpdate = async () => {
    try {
      setSavingPrivacy(true);
      await updatePreferences({ preferences: { privacy } });
      toast.success('Privacy settings updated');
    } catch (e) {
      toast.error('Failed to update privacy settings');
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handlePreferenceUpdate = async () => {
    try {
      setSavingPrefs(true);
      const { theme, language, timezone, defaultCodeLanguage } = preferences;
      await updatePreferences({ preferences: { theme, language, timezone, defaultCodeLanguage, editor: editorPrefs, accessibility } });
      toast.success('Preferences updated');
      // Also apply UI theme immediately
      const uiTheme = (theme as any) === 'auto' ? 'system' : (theme as any);
      try { setUiTheme(uiTheme); } catch {}
      // Apply app language after saving preferences
      try { setLanguage(language as any); } catch {}
    } catch (e) {
      toast.error('Failed to update preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  const tabs = [
    { key: 'account', label: t('settings.tab.account'), icon: SettingsIcon },
    { key: 'notifications', label: t('settings.tab.notifications'), icon: Bell },
    { key: 'privacy', label: t('settings.tab.privacy'), icon: Shield },
    { key: 'preferences', label: t('settings.tab.preferences'), icon: Palette }
  ];

  return (
    <>
      <div className="min-h-screen py-6 sm:py-8 bg-gradient-to-br from-slate-50 to-sky-50 dark:from-gray-900 dark:to-gray-800 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 sm:mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-700 p-6 sm:p-8">
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 dark:text-white mb-3 flex items-center">
                <SettingsIcon className="h-7 w-7 sm:h-10 sm:w-10 text-sky-600 dark:text-emerald-400 mr-3 sm:mr-4" />
                {t('settings.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-lg">{t('settings.subtitle')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-700 p-4 sm:p-6 sticky top-4 transition-all duration-300">
                <nav className="space-y-2 sm:space-y-3">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`w-full flex items-center space-x-3 sm:space-x-4 px-4 sm:px-5 py-3 sm:py-4 text-left rounded-xl transition-all duration-200 text-sm sm:text-base font-medium ${
                        activeTab === tab.key
                          ? 'bg-gradient-to-r from-sky-500 to-sky-600 dark:from-emerald-500 dark:to-emerald-600 text-white shadow-lg transform scale-105'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-sky-50 dark:hover:bg-gray-700 hover:text-sky-700 dark:hover:text-emerald-300'
                      }`}
                    >
                      <tab.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-700 p-6 sm:p-8 transition-all duration-300">
                {activeTab === 'account' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    <h2 className="text-xl sm:text-3xl font-bold text-gray-800 dark:text-white border-b border-slate-200 dark:border-gray-600 pb-4">
                      Account Settings
                    </h2>
                    
                    <form onSubmit={handleAccountUpdate} className="space-y-8">
                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-200 mb-3">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                          <input
                            type="email"
                            value={accountForm.email}
                            onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                            className="pl-12 w-full px-4 py-4 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white text-sm sm:text-base placeholder:text-gray-400 dark:placeholder:text-gray-500"
                          />
                        </div>
                        {emailUpdated && (
                          <p className="text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm mt-2 inline-flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" /> Email updated
                          </p>
                        )}
                        {/* OTP flow removed */}
                      </div>

                      {/* Avatar management */}
                      <div className="mt-8">
                        <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-200 mb-4">
                          Profile Avatar
                        </label>
                        <div className="flex items-center gap-6">
                          {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full border-2 border-sky-200 dark:border-emerald-200 object-cover shadow-lg" />
                          ) : (
                            <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                              No Avatar
                            </div>
                          )}
                          <div className="flex flex-col sm:flex-row gap-3">
                            <label className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-sky-500 to-sky-600 dark:from-emerald-500 dark:to-emerald-600 text-white rounded-xl hover:shadow-lg cursor-pointer font-medium text-sm sm:text-base transition-all duration-200">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    setAvatarUploading(true);
                                    const tid = toast.loading('Uploading avatar…');
                                    await uploadAvatar(file);
                                    toast.dismiss(tid);
                                    toast.success('Avatar uploaded');
                                  } catch (err) {
                                    toast.error((err as Error)?.message || 'Failed to upload avatar');
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
                                    const tid = toast.loading('Removing avatar…');
                                    await removeAvatar();
                                    toast.dismiss(tid);
                                    toast.success('Avatar removed');
                                  } catch (err) {
                                    toast.error((err as Error)?.message || 'Failed to remove avatar');
                                  } finally {
                                    setAvatarRemoving(false);
                                  }
                                }}
                                className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-medium text-sm sm:text-base disabled:opacity-50 transition-all duration-200 hover:shadow-lg"
                              >
                                {avatarRemoving ? 'Removing…' : 'Remove'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">Affects how amounts are displayed in the UI.</p>

                      {/* Bank Details for Winnings */}
                      <div className="mt-8 border-t border-slate-200 dark:border-gray-600 pt-8">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-3">Bank Details (for Winnings)</h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6">We will pay your contest winnings to these details.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-200 mb-3">Account Holder Name</label>
                            <input
                              type="text"
                              value={bankForm.bankAccountName}
                              onChange={(e) => setBankForm({ ...bankForm, bankAccountName: e.target.value })}
                              className="w-full px-4 py-4 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white text-sm sm:text-base placeholder:text-gray-400 dark:placeholder:text-gray-500"
                              placeholder="e.g., Rahul Sharma"
                            />
                          </div>
                          <div>
                            <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-200 mb-3">IFSC Code</label>
                            <input
                              type="text"
                              value={bankForm.ifsc}
                              onChange={(e) => setBankForm({ ...bankForm, ifsc: e.target.value })}
                              className="w-full px-4 py-4 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white text-sm sm:text-base placeholder:text-gray-400 dark:placeholder:text-gray-500"
                              placeholder="e.g., HDFC0001234"
                            />
                          </div>
                          <div>
                            <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-200 mb-3">Bank Name (optional)</label>
                            <input
                              type="text"
                              value={bankForm.bankName}
                              onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                              className="w-full px-4 py-4 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white text-sm sm:text-base placeholder:text-gray-400 dark:placeholder:text-gray-500"
                              placeholder="e.g., HDFC Bank"
                            />
                          </div>
                          <div>
                            <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-200 mb-3">UPI ID (optional)</label>
                            <input
                              type="text"
                              value={bankForm.upiId}
                              onChange={(e) => setBankForm({ ...bankForm, upiId: e.target.value })}
                              className="w-full px-4 py-4 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white text-sm sm:text-base placeholder:text-gray-400 dark:placeholder:text-gray-500"
                              placeholder="e.g., rahul@okhdfcbank"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-200 mb-3">Bank Account Number (optional if UPI provided)</label>
                            <input
                              type="password"
                              value={bankForm.bankAccountNumber}
                              onChange={(e) => setBankForm({ ...bankForm, bankAccountNumber: e.target.value })}
                              className="w-full px-4 py-4 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white text-sm sm:text-base placeholder:text-gray-400 dark:placeholder:text-gray-500"
                              placeholder="Enter or update account number"
                            />
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">We don't display saved numbers. Enter again to update.</p>
                          </div>
                        </div>
                        <div className="mt-6 flex items-center gap-4">
                          <button
                            type="button"
                            onClick={saveBankDetails}
                            disabled={savingBank}
                            className="px-6 py-3 bg-gradient-to-r from-sky-500 to-sky-600 dark:from-emerald-500 dark:to-emerald-600 text-white rounded-xl disabled:opacity-60 font-medium text-sm sm:text-base transition-all duration-200 hover:shadow-lg"
                          >
                            {savingBank ? 'Saving…' : 'Save Bank Details'}
                          </button>
                          {bankVerified && (
                            <span className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-medium">Verified</span>
                          )}
                          {bankLastUpdated && (
                            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Last updated: {new Date(bankLastUpdated).toLocaleString()}</span>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-slate-200 dark:border-gray-600 pt-8">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-6">Change Password</h3>
                        
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-200 mb-3">
                              Current Password
                            </label>
                            <div className="relative">
                              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                              <input
                                type="password"
                                value={accountForm.currentPassword}
                                onChange={(e) => setAccountForm({ ...accountForm, currentPassword: e.target.value })}
                                className="pl-12 w-full px-4 py-4 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white text-sm sm:text-base placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                placeholder="Enter current password"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                New Password
                              </label>
                              <input
                                type="password"
                                value={accountForm.newPassword}
                                onChange={(e) => setAccountForm({ ...accountForm, newPassword: e.target.value })}
                                className="w-full px-4 py-4 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white text-sm sm:text-base placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                placeholder="Enter new password"
                              />
                            </div>

                            <div>
                              <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                Confirm New Password
                              </label>
                              <input
                                type="password"
                                value={accountForm.confirmPassword}
                                onChange={(e) => setAccountForm({ ...accountForm, confirmPassword: e.target.value })}
                                className="w-full px-4 py-4 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white text-sm sm:text-base placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                placeholder="Confirm new password"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center justify-center space-x-3 w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-sky-500 to-sky-600 dark:from-emerald-500 dark:to-emerald-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg font-medium text-sm sm:text-base transition-all duration-200 hover:shadow-xl"
                      >
                        <Save className="h-5 w-5" />
                        <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                    </form>

                    {/* Danger Zone */}
                    <div className="mt-12 border-t border-slate-200 dark:border-gray-600 pt-8">
                      <h3 className="text-lg sm:text-xl font-bold text-rose-600 dark:text-rose-400 flex items-center gap-3">
                        <ShieldAlert className="h-6 w-6" /> Danger Zone
                      </h3>
                      <div className="mt-6 p-6 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-900/20">
                        <h4 className="text-sm sm:text-base font-bold text-rose-700 dark:text-rose-300 mb-3">Delete My Account</h4>
                        <p className="text-xs sm:text-sm text-rose-700 dark:text-rose-300 mb-4">This will permanently delete your EarnByCode account and all associated data. This action cannot be undone.</p>
                        <label className="block text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-300 mb-2">Type "delete EarnByCode account" to confirm:</label>
                        <input
                          type="text"
                          value={deleteText}
                          onChange={(e) => setDeleteText(e.target.value)}
                          className="w-full sm:w-96 px-4 py-3 rounded-xl border border-rose-300 dark:border-rose-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base placeholder:text-gray-400 dark:placeholder:text-gray-500"
                          placeholder="delete EarnByCode account"
                        />
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={onDeleteAccount}
                            disabled={deleting || deleteText.trim().toLowerCase() !== 'delete earnbycode account'}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 font-medium text-sm sm:text-base transition-all duration-200"
                          >
                            <Trash2 className="h-4 w-4" /> {deleting ? 'Deleting…' : 'Delete Account'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'notifications' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    <h2 className="text-xl sm:text-3xl font-bold text-gray-800 dark:text-white border-b border-slate-200 dark:border-gray-600 pb-4">
                      Notification Settings
                    </h2>
                    
                    <div className="space-y-6">
                      {(['emailNotifications','contestReminders','submissionResults','weeklyDigest','marketingEmails'] as const).map((key) => (
                        <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-slate-50 dark:bg-gray-700 rounded-xl space-y-4 sm:space-y-0 transition-all duration-200 hover:bg-slate-100 dark:hover:bg-gray-600">
                          <div className="flex-1">
                            <h3 className="text-gray-800 dark:text-white font-semibold capitalize text-sm sm:text-base">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm mt-1">
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
                            <div className="w-14 h-7 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 dark:peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-sky-600 dark:peer-checked:bg-emerald-600"></div>
                          </label>
                        </div>
                      ))}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-200 mb-3">Notification Frequency</label>
                          <select
                            value={notifications.frequency}
                            onChange={(e) => setNotifications({ ...notifications, frequency: e.target.value })}
                            className="w-full px-4 py-4 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white text-sm sm:text-base"
                          >
                            <option value="immediate">Immediate</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="none">None</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-200 mb-3">Digest Time (HH:MM)</label>
                          <input
                            type="time"
                            value={notifications.digestTime}
                            onChange={(e) => setNotifications({ ...notifications, digestTime: e.target.value })}
                            className="w-full px-4 py-4 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white text-sm sm:text-base"
                          />
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">Applied in your timezone: {preferences.timezone}</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleNotificationUpdate}
                      disabled={savingNotifications}
                      className="flex items-center justify-center space-x-3 w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-sky-500 to-sky-600 dark:from-emerald-500 dark:to-emerald-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-500 focus:ring-offset-2 shadow-lg font-medium text-sm sm:text-base transition-all duration-200 hover:shadow-xl"
                    >
                      <Save className="h-5 w-5" />
                      <span>{savingNotifications ? 'Saving…' : 'Save Notification Settings'}</span>
                    </button>
                  </motion.div>
                )}

                {activeTab === 'privacy' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    <h2 className="text-xl sm:text-3xl font-bold text-gray-800 dark:text-white border-b border-slate-200 dark:border-gray-600 pb-4">
                      Privacy Settings
                    </h2>
                    
                    <div className="space-y-8">
                      <div>
                        <label className="flex items-center gap-3 text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-200 mb-3">
                          <span>Profile Visibility</span>
                          <span title="Control who can view your profile: Public (anyone), Registered users only, or Private (only you).">
                            <Info className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
                          </span>
                        </label>
                        <select
                          value={privacy.profileVisibility}
                          onChange={(e) => setPrivacy({ ...privacy, profileVisibility: e.target.value as 'public' | 'registered' | 'private' })}
                          className="w-full px-4 py-4 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white text-sm sm:text-base"
                        >
                          <option value="public">Public - Anyone can view</option>
                          <option value="registered">Registered Users Only</option>
                          <option value="private">Private - Only me</option>
                        </select>
                      </div>

                      <div className="space-y-6">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">Profile Information</h3>
                        
                        {Object.entries(privacy).slice(1).map(([key, value]) => (
                          <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-slate-50 dark:bg-gray-700 rounded-xl space-y-4 sm:space-y-0 transition-all duration-200 hover:bg-slate-100 dark:hover:bg-gray-600">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <h4 className="text-gray-800 dark:text-white font-semibold capitalize text-sm sm:text-base">
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
                                  <Info className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                </span>
                              </div>
                              <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm mt-1">
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
                              <div className="w-14 h-7 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 dark:peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-sky-600 dark:peer-checked:bg-emerald-600"></div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handlePrivacyUpdate}
                      disabled={savingPrivacy}
                      className="flex items-center justify-center space-x-3 w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-sky-500 to-sky-600 dark:from-emerald-500 dark:to-emerald-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-500 focus:ring-offset-2 shadow-lg font-medium text-sm sm:text-base transition-all duration-200 hover:shadow-xl"
                    >
                      <Save className="h-5 w-5" />
                      <span>{savingPrivacy ? 'Saving…' : 'Save Privacy Settings'}</span>
                    </button>
                  </motion.div>
                )}

                {activeTab === 'preferences' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    <h2 className="text-xl sm:text-3xl font-bold text-gray-800 dark:text-white border-b border-slate-200 dark:border-gray-600 pb-4">
                      Preferences
                    </h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-200 mb-3">
                          Theme
                        </label>
                        <select
                          value={preferences.theme}
                          onChange={(e) => {
                            const next = e.target.value as 'light' | 'dark' | 'auto';
                            setPreferences({ ...preferences, theme: next });
                            const uiTheme = next === 'auto' ? 'system' : next;
                            try { setUiTheme(uiTheme as any); } catch {}
                          }}
                          className="w-full px-4 py-4 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white text-sm sm:text-base"
                        >
                          <option value="light">Light Theme</option>
                          <option value="dark">Dark Theme</option>
                          <option value="auto">System (Auto)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-200 mb-3">
                          Default Code Language
                        </label>
                        <select
                          value={preferences.defaultCodeLanguage}
                          onChange={(e) => setPreferences({ ...preferences, defaultCodeLanguage: e.target.value })}
                          className="w-full px-4 py-4 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white text-sm sm:text-base"
                        >
                          <option value="javascript">JavaScript</option>
                          <option value="python">Python</option>
                          <option value="java">Java</option>
                          <option value="cpp">C++</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-200 mb-3">Editor Font Size</label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-gray-600 hover:bg-slate-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 transition-all duration-200"
                            disabled={(editorPrefs.fontSize ?? 14) <= 10}
                            onClick={() =>
                              setEditorPrefs((p) => ({ ...p, fontSize: Math.max(10, (p.fontSize ?? 14) - 1) }))
                            }
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={10}
                            max={24}
                            value={editorPrefs.fontSize}
                            onChange={(e) => setEditorPrefs({ ...editorPrefs, fontSize: Number(e.target.value) })}
                            className="w-24 px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-center text-gray-900 dark:text-white text-sm sm:text-base"
                          />
                          <button
                            type="button"
                            className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-gray-600 hover:bg-slate-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 transition-all duration-200"
                            disabled={(editorPrefs.fontSize ?? 14) >= 24}
                            onClick={() =>
                              setEditorPrefs((p) => ({ ...p, fontSize: Math.min(24, (p.fontSize ?? 14) + 1) }))
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-200 mb-3">Editor Tab Size</label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-gray-600 hover:bg-slate-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 transition-all duration-200"
                            disabled={[2,4,8].indexOf(editorPrefs.tabSize) <= 0}
                            onClick={() => {
                              const steps = [2, 4, 8];
                              const idx = Math.max(0, steps.indexOf(editorPrefs.tabSize) - 1);
                              setEditorPrefs({ ...editorPrefs, tabSize: steps[idx] });
                            }}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={8}
                            step={1}
                            value={editorPrefs.tabSize}
                            onChange={(e) => setEditorPrefs({ ...editorPrefs, tabSize: Math.min(8, Math.max(1, Number(e.target.value))) })}
                            className="w-24 px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-center text-gray-900 dark:text-white text-sm sm:text-base"
                          />
                          <button
                            type="button"
                            className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-gray-600 hover:bg-slate-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 transition-all duration-200"
                            disabled={[2,4,8].indexOf(editorPrefs.tabSize) >= 2}
                            onClick={() => {
                              const steps = [2, 4, 8];
                              const idx = Math.min(steps.length - 1, steps.indexOf(editorPrefs.tabSize) + 1);
                              setEditorPrefs({ ...editorPrefs, tabSize: steps[idx] });
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-200 mb-3">Editor Theme</label>
                        <select
                          value={editorPrefs.theme}
                          onChange={(e) => setEditorPrefs({ ...editorPrefs, theme: e.target.value as any })}
                          className="w-full px-4 py-4 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white text-sm sm:text-base"
                        >
                          <option value="light">Light</option>
                          <option value="vs-dark">Dark</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-200 mb-3">
                          Language
                        </label>
                        <select
                          value={preferences.language}
                          onChange={(e) => {
                            const next = e.target.value as any;
                            setPreferences({ ...preferences, language: next });
                          }}
                          className="w-full px-4 py-4 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white text-sm sm:text-base"
                        >
                          {languageOptions.map((opt) => (
                            <option key={opt.code} value={opt.code}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-200 mb-3">Timezone</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <select
                            value={preferences.timezone}
                            onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                            className="flex-1 px-4 py-4 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white text-sm sm:text-base"
                          >
                            {!timezoneOptions.includes(preferences.timezone) && (
                              <option value={preferences.timezone}>{preferences.timezone}</option>
                            )}
                            {timezoneOptions.map((tz) => (
                              <option key={tz} value={tz}>
                                {tz}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="px-6 py-4 bg-slate-100 dark:bg-gray-600 hover:bg-slate-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-xl transition-all duration-200 font-medium text-sm sm:text-base"
                            title="Detect from your system"
                            onClick={() => {
                              try {
                                const sysTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                                if (sysTz) setPreferences((p) => ({ ...p, timezone: sysTz }));
                              } catch {}
                            }}
                          >
                            Detect
                          </button>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">Used for digests and date displays.</p>
                      </div>
                    </div>

                    <button
                      onClick={handlePreferenceUpdate}
                      disabled={savingPrefs}
                      className="flex items-center justify-center space-x-3 w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-sky-500 to-sky-600 dark:from-emerald-500 dark:to-emerald-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-emerald-500 focus:ring-offset-2 shadow-lg font-medium text-sm sm:text-base transition-all duration-200 hover:shadow-xl"
                    >
                      <Save className="h-5 w-5" />
                      <span>{savingPrefs ? 'Saving…' : 'Save Preferences'}</span>
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}