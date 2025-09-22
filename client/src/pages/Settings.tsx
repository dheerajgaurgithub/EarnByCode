import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { 
  Settings as SettingsIcon, Bell, Shield, Palette, 
  Save, Mail, Lock, Info, ShieldAlert, Trash2, CheckCircle, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { useToast } from '@/components/ui/use-toast';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser, updatePreferences, changePassword, uploadAvatar, removeAvatar, requestEmailChangeOtp, verifyEmailChangeOtp, deleteAccount } = useAuth();
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
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [deleteText, setDeleteText] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
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

  const handleAccountUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const updates: any = {};
      
      // Email change is handled via OTP flow; trigger OTP if email changed and OTP not yet sent/verified
      if (accountForm.email !== user.email) {
        if (!emailOtpSent) {
          await requestEmailChangeOtp(accountForm.email);
          setEmailOtpSent(true);
          setPendingEmail(accountForm.email);
          toast.success('Verification code sent to the new email. Please enter the code below to confirm change.');
          setResendCooldown(60);
          setOtpError(null);
          return; // stop here; user must verify before other updates
        }
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

  // Resend cooldown ticker
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleVerifyEmailOtp = async () => {
    if (!pendingEmail || !emailOtp) {
      toast.error('Please enter the verification code');
      return;
    }
    try {
      setVerifyingOtp(true);
      setOtpError(null);
      await verifyEmailChangeOtp(pendingEmail, emailOtp);
      toast.success('Email updated successfully');
      setEmailOtp('');
      setEmailOtpSent(false);
      setPendingEmail('');
      setOtpError(null);
      setOtpVerified(true);
      setEmailUpdated(true);
      setResendCooldown(0);
      // Auto-hide the verified tick after a few seconds
      setTimeout(() => setOtpVerified(false), 3000);
      setTimeout(() => setEmailUpdated(false), 4000);
    } catch (err) {
      const msg = (err as Error)?.message || 'Failed to verify code';
      setOtpError(msg);
      toast.error(msg);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const onDeleteAccount = async () => {
    const phrase = 'delete algobucks account';
    if (deleteText.trim().toLowerCase() !== phrase) {
      toast.error("Please type 'delete AlgoBucks account' exactly to confirm.");
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
      <style>
        {`
          @media (prefers-color-scheme: light) {
            .adaptive-bg {
              background: linear-gradient(to bottom right, #dbeafe, #ffffff, #dbeafe);
            }
            .adaptive-card {
              background: #ffffff;
              color: #000000;
              border: 1px solid #dbeafe;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }
            .adaptive-text {
              color: #000000;
            }
            .adaptive-text-secondary {
              color: #4b5563;
            }
            .adaptive-text-muted {
              color: #6b7280;
            }
            .adaptive-input {
              background: #dbeafe;
              border: 1px solid #dbeafe;
              color: #000000;
            }
            .adaptive-input:focus {
              border-color: #2563eb;
              box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
            }
            .adaptive-accent {
              background: #dbeafe;
              border: 1px solid #dbeafe;
            }
            .adaptive-button {
              background: #2563eb;
            }
            .adaptive-button:hover {
              background: #1d4ed8;
            }
            .tab-active {
              background: #2563eb !important;
              color: white !important;
            }
            .tab-inactive {
              color: #4b5563;
            }
            .tab-inactive:hover {
              color: #2563eb;
              background: #dbeafe;
            }
            .adaptive-border {
              border-color: #dbeafe;
            }
            .adaptive-icon-muted {
              color: #6b7280;
            }
            .adaptive-icon-primary {
              color: #2563eb;
            }
          }
          
          @media (prefers-color-scheme: dark) {
            .adaptive-bg {
              background: #000000;
            }
            .adaptive-card {
              background: #1a1a1a;
              color: #1E90FF;
              border: 1px solid #333333;
              box-shadow: 0 10px 15px -3px rgba(30, 144, 255, 0.1);
            }
            .adaptive-text {
              color: #1E90FF;
            }
            .adaptive-text-secondary {
              color: #87ceeb;
            }
            .adaptive-text-muted {
              color: #5f9ea0;
            }
            .adaptive-input {
              background: #1a1a1a;
              border: 1px solid #333333;
              color: #1E90FF;
            }
            .adaptive-input:focus {
              border-color: #1E90FF;
              box-shadow: 0 0 0 2px rgba(30, 144, 255, 0.2);
            }
            .adaptive-accent {
              background: #2a2a2a;
              border: 1px solid #333333;
            }
            .adaptive-button {
              background: #1E90FF;
            }
            .adaptive-button:hover {
              background: #4169E1;
            }
            .tab-active {
              background: #1E90FF !important;
              color: white !important;
            }
            .tab-inactive {
              color: #87ceeb;
            }
            .tab-inactive:hover {
              color: #1E90FF;
              background: #2a2a2a;
            }
            .adaptive-border {
              border-color: #333333;
            }
            .adaptive-icon-muted {
              color: #5f9ea0;
            }
            .adaptive-icon-primary {
              color: #1E90FF;
            }
          }
          
          .adaptive-transition {
            transition: all 0.3s ease;
          }
        `}
      </style>
      
      <div className="min-h-screen py-4 sm:py-8 adaptive-bg adaptive-transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold adaptive-text mb-2 flex items-center">
              <SettingsIcon className="h-6 w-6 sm:h-8 sm:w-8 adaptive-icon-primary mr-2 sm:mr-3" />
              {t('settings.title')}
            </h1>
            <p className="adaptive-text-secondary text-sm sm:text-base">{t('settings.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="adaptive-card rounded-xl p-4 sm:p-6 sticky top-4 adaptive-transition">
                <nav className="space-y-1 sm:space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`w-full flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 text-left rounded-lg transition-all duration-200 text-sm sm:text-base font-medium ${
                        activeTab === tab.key
                          ? 'tab-active shadow-md transform scale-105'
                          : 'tab-inactive'
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
              <div className="adaptive-card rounded-xl p-4 sm:p-6 adaptive-transition">
                {activeTab === 'account' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl sm:text-2xl font-semibold adaptive-text border-b adaptive-border pb-4">
                      Account Settings
                    </h2>
                    
                    <form onSubmit={handleAccountUpdate} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium adaptive-text mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 adaptive-icon-muted" />
                          <input
                            type="email"
                            value={accountForm.email}
                            onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                            className="pl-10 w-full px-3 py-3 adaptive-input rounded-lg focus:outline-none adaptive-transition"
                          />
                        </div>
                        {emailUpdated && (
                          <p className="text-green-600 text-xs mt-1 inline-flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Email updated
                          </p>
                        )}
                        {accountForm.email !== user.email && (
                          <div className="mt-2 flex flex-col sm:flex-row gap-2">
                            {!emailOtpSent ? (
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await requestEmailChangeOtp(accountForm.email);
                                    setEmailOtpSent(true);
                                    setPendingEmail(accountForm.email);
                                    toast.success('Verification code sent to the new email.');
                                    setResendCooldown(60);
                                    setOtpError(null);
                                  } catch (err) {
                                    const msg = (err as Error)?.message || '';
                                    // Fallback: if endpoint not found, update email directly
                                    if (/endpoint not found/i.test(msg)) {
                                      try {
                                        await updateUser({ email: accountForm.email });
                                        toast.success('Email updated (OTP not required on this server)');
                                        setEmailOtpSent(false);
                                        setPendingEmail('');
                                        setOtpError(null);
                                      } catch (e2) {
                                        const m2 = (e2 as Error)?.message || 'Failed to update email';
                                        setOtpError(m2);
                                        toast.error(m2);
                                      }
                                    } else {
                                      const finalMsg = msg || 'Failed to send verification code';
                                      setOtpError(finalMsg);
                                      toast.error(finalMsg);
                                    }
                                  }
                                }}
                                className="px-4 py-2 adaptive-button text-white rounded-lg disabled:opacity-60"
                                disabled={resendCooldown > 0 || verifyingOtp}
                              >
                                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Send OTP'}
                              </button>
                            ) : (
                              <div className="w-full flex flex-col sm:flex-row gap-2">
                                <input
                                  type="text"
                                  value={emailOtp}
                                  onChange={(e) => {
                                    setEmailOtp(e.target.value);
                                    if (otpError) setOtpError(null);
                                  }}
                                  placeholder="Enter OTP"
                                  className="w-full sm:w-48 px-3 py-2 adaptive-input rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await handleVerifyEmailOtp();
                                    } catch (err) {
                                      const msg = (err as Error)?.message || '';
                                      if (/endpoint not found/i.test(msg)) {
                                        try {
                                          await updateUser({ email: accountForm.email });
                                          toast.success('Email updated (OTP not required on this server)');
                                          setEmailOtp('');
                                          setEmailOtpSent(false);
                                          setPendingEmail('');
                                          setOtpError(null);
                                        } catch (e2) {
                                          const m2 = (e2 as Error)?.message || 'Failed to update email';
                                          setOtpError(m2);
                                          toast.error(m2);
                                        }
                                      } else {
                                        const finalMsg = msg || 'Failed to verify code';
                                        setOtpError(finalMsg);
                                        toast.error(finalMsg);
                                      }
                                    }
                                  }}
                                  className="px-4 py-2 adaptive-button text-white rounded-lg inline-flex items-center gap-2 disabled:opacity-60"
                                  disabled={verifyingOtp || !emailOtp}
                                >
                                  {verifyingOtp ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      Verifying…
                                    </>
                                  ) : (
                                    'Verify & Update Email'
                                  )}
                                </button>
                                {otpVerified && (
                                  <span className="inline-flex items-center gap-1 text-green-600 text-xs mt-1 sm:mt-0">
                                    <CheckCircle className="h-4 w-4" /> Verified
                                  </span>
                                )}
                                {otpError && (
                                  <div className="flex items-center gap-2 mt-1 sm:mt-0 sm:ml-2">
                                    <p className="text-rose-600 text-xs">{otpError}</p>
                                    <button
                                      type="button"
                                      className="text-xs text-rose-600 hover:text-rose-700 underline"
                                      onClick={() => setOtpError(null)}
                                    >
                                      Clear
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                            {emailOtpSent && pendingEmail && (
                              <p className="text-xs text-slate-600 dark:text-gray-300 mt-1">Code sent to <span className="font-medium">{pendingEmail}</span></p>
                            )}
                            <p className="text-xs adaptive-text-muted">We will send a one-time code to the new email to confirm this change.</p>
                          </div>
                        )}

                      {/* Avatar management */}
                      <div className="mt-6">
                        <label className="block text-sm font-medium adaptive-text mb-2">
                          Profile Avatar
                        </label>
                        <div className="flex items-center gap-4">
                          {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full border adaptive-border object-cover" />
                          ) : (
                            <div className="w-16 h-16 rounded-full border border-dashed adaptive-border flex items-center justify-center adaptive-text-secondary text-xs">
                              No Avatar
                            </div>
                          )}
                          <div className="flex flex-col sm:flex-row gap-3">
                            <label className="inline-flex items-center px-4 py-2 adaptive-button text-white rounded-lg hover:adaptive-button cursor-pointer text-sm adaptive-transition">
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
                                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm disabled:opacity-50 adaptive-transition"
                              >
                                {avatarRemoving ? 'Removing…' : 'Remove'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium adaptive-text mb-2">
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
                            className="w-full px-3 py-3 adaptive-input rounded-lg focus:outline-none adaptive-transition"
                          >
                            <option value="INR">INR (₹)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                          </select>
                          {savingCurrency && (
                            <span className="text-xs adaptive-icon-primary">Saving…</span>
                          )}
                        </div>
                        <p className="text-xs adaptive-text-muted mt-1">Affects how amounts are displayed in the UI.</p>
                      </div>
                      </div>

                      <div className="border-t adaptive-border pt-6">
                        <h3 className="text-lg font-medium adaptive-text mb-4">Change Password</h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium adaptive-text mb-2">
                              Current Password
                            </label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 adaptive-icon-muted" />
                              <input
                                type="password"
                                value={accountForm.currentPassword}
                                onChange={(e) => setAccountForm({ ...accountForm, currentPassword: e.target.value })}
                                className="pl-10 w-full px-3 py-3 adaptive-input rounded-lg focus:outline-none adaptive-transition"
                                placeholder="Enter current password"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium adaptive-text mb-2">
                                New Password
                              </label>
                              <input
                                type="password"
                                value={accountForm.newPassword}
                                onChange={(e) => setAccountForm({ ...accountForm, newPassword: e.target.value })}
                                className="w-full px-3 py-3 adaptive-input rounded-lg focus:outline-none adaptive-transition"
                                placeholder="Enter new password"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium adaptive-text mb-2">
                                Confirm New Password
                              </label>
                              <input
                                type="password"
                                value={accountForm.confirmPassword}
                                onChange={(e) => setAccountForm({ ...accountForm, confirmPassword: e.target.value })}
                                className="w-full px-3 py-3 adaptive-input rounded-lg focus:outline-none adaptive-transition"
                                placeholder="Confirm new password"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center justify-center space-x-2 w-full sm:w-auto px-6 py-3 adaptive-button text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md adaptive-transition"
                      >
                        <Save className="h-4 w-4" />
                        <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                    </form>

                    {/* Danger Zone */}
                    <div className="mt-8 border-t adaptive-border pt-6">
                      <h3 className="text-lg font-semibold text-rose-600 flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5" /> Danger Zone
                      </h3>
                      <div className="mt-4 p-4 rounded-lg border adaptive-border bg-red-50/50">
                        <h4 className="text-sm font-medium text-rose-700 mb-2">Delete My Account</h4>
                        <p className="text-xs text-rose-700 mb-3">This will permanently delete your AlgoBucks account and all associated data. This action cannot be undone.</p>
                        <label className="block text-xs font-medium text-rose-700 mb-1">Type "delete AlgoBucks account" to confirm:</label>
                        <input
                          type="text"
                          value={deleteText}
                          onChange={(e) => setDeleteText(e.target.value)}
                          className="w-full sm:w-96 px-3 py-2 rounded-lg border adaptive-border"
                          placeholder="delete AlgoBucks account"
                        />
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={onDeleteAccount}
                            disabled={deleting || deleteText.trim().toLowerCase() !== 'delete algobucks account'}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
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
                    className="space-y-6"
                  >
                    <h2 className="text-xl sm:text-2xl font-semibold adaptive-text border-b adaptive-border pb-4">
                      Notification Settings
                    </h2>
                    
                    <div className="space-y-4">
                      {(['emailNotifications','contestReminders','submissionResults','weeklyDigest','marketingEmails'] as const).map((key) => (
                        <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 adaptive-accent rounded-lg space-y-3 sm:space-y-0 adaptive-transition">
                          <div className="flex-1">
                            <h3 className="adaptive-text font-medium capitalize text-sm sm:text-base">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </h3>
                            <p className="adaptive-text-secondary text-xs sm:text-sm">
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
                          <label className="block text-sm font-medium adaptive-text mb-2">Notification Frequency</label>
                          <select
                            value={notifications.frequency}
                            onChange={(e) => setNotifications({ ...notifications, frequency: e.target.value })}
                            className="w-full px-3 py-3 adaptive-input rounded-lg focus:outline-none adaptive-transition"
                          >
                            <option value="immediate">Immediate</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="none">None</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium adaptive-text mb-2">Digest Time (HH:MM)</label>
                          <input
                            type="time"
                            value={notifications.digestTime}
                            onChange={(e) => setNotifications({ ...notifications, digestTime: e.target.value })}
                            className="w-full px-3 py-3 adaptive-input rounded-lg focus:outline-none adaptive-transition"
                          />
                          <p className="text-xs adaptive-text-muted mt-1">Applied in your timezone: {preferences.timezone}</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleNotificationUpdate}
                      disabled={savingNotifications}
                      className="flex items-center justify-center space-x-2 w-full sm:w-auto px-6 py-3 adaptive-button text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md adaptive-transition"
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
                    <h2 className="text-xl sm:text-2xl font-semibold adaptive-text border-b adaptive-border pb-4">
                      Privacy Settings
                    </h2>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium adaptive-text mb-2">
                          <span>Profile Visibility</span>
                          <span title="Control who can view your profile: Public (anyone), Registered users only, or Private (only you).">
                            <Info className="w-4 h-4 adaptive-icon-muted" />
                          </span>
                        </label>
                        <select
                          value={privacy.profileVisibility}
                          onChange={(e) => setPrivacy({ ...privacy, profileVisibility: e.target.value as 'public' | 'registered' | 'private' })}
                          className="w-full px-3 py-3 adaptive-input rounded-lg focus:outline-none adaptive-transition"
                        >
                          <option value="public">Public - Anyone can view</option>
                          <option value="registered">Registered Users Only</option>
                          <option value="private">Private - Only me</option>
                        </select>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium adaptive-text">Profile Information</h3>
                        
                        {Object.entries(privacy).slice(1).map(([key, value]) => (
                          <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 adaptive-accent rounded-lg space-y-3 sm:space-y-0 adaptive-transition">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="adaptive-text font-medium capitalize text-sm sm:text-base">
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
                                  <Info className="w-4 h-4 adaptive-icon-muted" />
                                </span>
                              </div>
                              <p className="adaptive-text-secondary text-xs sm:text-sm">
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
                      className="flex items-center justify-center space-x-2 w-full sm:w-auto px-6 py-3 adaptive-button text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md adaptive-transition"
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
                    <h2 className="text-xl sm:text-2xl font-semibold adaptive-text border-b adaptive-border pb-4">
                      Preferences
                    </h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium adaptive-text mb-2">
                          Theme
                        </label>
                        <select
                          value={preferences.theme}
                          onChange={(e) => {
                            const next = e.target.value as 'light' | 'dark' | 'auto';
                            setPreferences({ ...preferences, theme: next });
                            // Apply UI theme immediately for instant preview
                            const uiTheme = next === 'auto' ? 'system' : next;
                            try { setUiTheme(uiTheme as any); } catch {}
                          }}
                          className="w-full px-3 py-3 adaptive-input rounded-lg focus:outline-none adaptive-transition"
                        >
                          <option value="light">Light Theme</option>
                          <option value="dark">Dark Theme</option>
                          <option value="auto">System (Auto)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium adaptive-text mb-2">
                          Default Code Language
                        </label>
                        <select
                          value={preferences.defaultCodeLanguage}
                          onChange={(e) => setPreferences({ ...preferences, defaultCodeLanguage: e.target.value })}
                          className="w-full px-3 py-3 adaptive-input rounded-lg focus:outline-none adaptive-transition"
                        >
                          <option value="javascript">JavaScript</option>
                          <option value="python">Python</option>
                          <option value="java">Java</option>
                          <option value="cpp">C++</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium adaptive-text mb-2">Editor Font Size</label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="px-3 py-2 rounded-lg adaptive-accent hover:opacity-90"
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
                            className="w-24 px-3 py-3 adaptive-input rounded-lg focus:outline-none adaptive-transition text-center"
                          />
                          <button
                            type="button"
                            className="px-3 py-2 rounded-lg adaptive-accent hover:opacity-90"
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
                        <label className="block text-sm font-medium adaptive-text mb-2">Editor Tab Size</label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="px-3 py-2 rounded-lg adaptive-accent hover:opacity-90"
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
                            className="w-24 px-3 py-3 adaptive-input rounded-lg focus:outline-none adaptive-transition text-center"
                          />
                          <button
                            type="button"
                            className="px-3 py-2 rounded-lg adaptive-accent hover:opacity-90"
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
                        <label className="block text-sm font-medium adaptive-text mb-2">Editor Theme</label>
                        <select
                          value={editorPrefs.theme}
                          onChange={(e) => setEditorPrefs({ ...editorPrefs, theme: e.target.value as any })}
                          className="w-full px-3 py-3 adaptive-input rounded-lg focus:outline-none adaptive-transition"
                        >
                          <option value="light">Light</option>
                          <option value="vs-dark">Dark</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium adaptive-text mb-2">
                          Language
                        </label>
                        <select
                          value={preferences.language}
                          onChange={(e) => {
                            const next = e.target.value as any;
                            // Only update the selected language in local state so the displayed name updates.
                            // Do NOT apply app-wide language or persist yet; that will happen on Save Preferences.
                            setPreferences({ ...preferences, language: next });
                          }}
                          className="w-full px-3 py-3 adaptive-input rounded-lg focus:outline-none adaptive-transition"
                        >
                          {languageOptions.map((opt) => (
                            <option key={opt.code} value={opt.code}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Timezone */}
                      <div>
                        <label className="block text-sm font-medium adaptive-text mb-2">Timezone</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <select
                            value={preferences.timezone}
                            onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                            className="w-full px-3 py-3 adaptive-input rounded-lg focus:outline-none adaptive-transition"
                          >
                            {/* Ensure current value is present */}
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
                            className="px-4 py-3 adaptive-accent rounded-lg"
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
                        <p className="text-xs adaptive-text-muted mt-1">Used for digests and date displays.</p>
                      </div>
                    </div>

                    <button
                      onClick={handlePreferenceUpdate}
                      disabled={savingPrefs}
                      className="flex items-center justify-center space-x-2 w-full sm:w-auto px-6 py-3 adaptive-button text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md adaptive-transition"
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
    </>
  );
};