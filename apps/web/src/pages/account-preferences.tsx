import { useState, useEffect } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import { Settings, Bell, CreditCard, Shield, Globe, Smartphone, Mail, MessageSquare, DollarSign, Eye, EyeOff, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface UserPreferences {
  notificationPreferences?: Record<string, boolean>;
  privacyPreferences?: Record<string, boolean>;
  displayPreferences?: Record<string, boolean>;
  securityPreferences?: Record<string, boolean>;
}

interface UserData {
  preferences?: {
    notifications?: Record<string, boolean>;
    privacy?: Record<string, boolean>;
    display?: Record<string, boolean>;
    security?: Record<string, boolean>;
  };
  currency?: string;
  language?: string;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
  twoFactorEnabled?: boolean;
  showBalance?: boolean;
}

export default function AccountPreferences() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userData } = useQuery<UserData & UserPreferences>({
    queryKey: ['/api/user'],
    staleTime: 60000,
  });

  const [preferences, setPreferences] = useState({
    notifications: { email: true, sms: true, push: true, marketing: false },
    privacy: { showBalance: true, shareData: false, twoFactorAuth: true },
    display: { currency: 'USD', language: 'en', theme: 'light' },
    security: { sessionTimeout: 30, biometric: true, autoLogout: true }
  });

  useEffect(() => {
    if (!userData) return;
    const saved = userData.preferences;
    if (saved) {
      setPreferences(prev => ({
        notifications: { ...prev.notifications, ...(saved.notifications || {}) },
        privacy: { ...prev.privacy, ...(saved.privacy || {}) },
        display: { ...prev.display, ...(saved.display || {}) },
        security: { ...prev.security, ...(saved.security || {}) },
      }));
    } else {
      setPreferences(prev => ({
        ...prev,
        display: { ...prev.display, currency: userData.currency || prev.display.currency, language: userData.language || prev.display.language },
        notifications: { ...prev.notifications, email: userData.emailNotifications ?? prev.notifications.email, sms: userData.smsNotifications ?? prev.notifications.sms, push: userData.pushNotifications ?? prev.notifications.push },
        privacy: { ...prev.privacy, twoFactorAuth: userData.twoFactorEnabled ?? prev.privacy.twoFactorAuth, showBalance: userData.showBalance ?? prev.privacy.showBalance },
      }));
    }
  }, [userData]);

  const handleSave = async () => {
    const { authenticatedFetch } = await import('@/lib/queryClient');
    try {
      const response = await authenticatedFetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });
      if (response.ok) {
        toast({ title: 'Preferences Saved', description: t('preferences_saved') });
        queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] });
      } else {
        toast({ title: 'Save Failed', description: 'Failed to save preferences. Please try again.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error saving preferences. Please try again.', variant: 'destructive' });
    }
  };

  const togglePreference = (category: 'notifications' | 'privacy' | 'security', key: string) => {
    setPreferences(prev => {
      if (category === 'notifications') return { ...prev, notifications: { ...prev.notifications, [key]: !prev.notifications[key as keyof typeof prev.notifications] } };
      else if (category === 'privacy') return { ...prev, privacy: { ...prev.privacy, [key]: !prev.privacy[key as keyof typeof prev.privacy] } };
      else if (category === 'security') return { ...prev, security: { ...prev.security, [key]: !prev.security[key as keyof typeof prev.security] } };
      return prev;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header user={user as unknown as import("@packages/shared/schema").User || undefined} />
      <main className="pt-16 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('account_preferences')}</h1>
            <p className="text-gray-600">{t('manage_account_settings')}</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4"><Bell className="w-5 h-5 text-blue-600" /><h2 className="text-lg font-semibold text-gray-900">{t('notification_preferences')}</h2></div>
              <div className="space-y-4">
                <div className="flex items-center justify-between"><div className="flex items-center space-x-3"><Mail className="w-4 h-4 text-gray-400" /><span className="text-sm text-gray-700">{t('email_notifications')}</span></div><button onClick={() => togglePreference('notifications', 'email')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.notifications.email ? 'bg-blue-600' : 'bg-gray-200'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.notifications.email ? 'translate-x-6' : 'translate-x-1'}`} /></button></div>
                <div className="flex items-center justify-between"><div className="flex items-center space-x-3"><MessageSquare className="w-4 h-4 text-gray-400" /><span className="text-sm text-gray-700">{t('sms_notifications')}</span></div><button onClick={() => togglePreference('notifications', 'sms')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.notifications.sms ? 'bg-blue-600' : 'bg-gray-200'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.notifications.sms ? 'translate-x-6' : 'translate-x-1'}`} /></button></div>
                <div className="flex items-center justify-between"><div className="flex items-center space-x-3"><Smartphone className="w-4 h-4 text-gray-400" /><span className="text-sm text-gray-700">{t('push_notifications')}</span></div><button onClick={() => togglePreference('notifications', 'push')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.notifications.push ? 'bg-blue-600' : 'bg-gray-200'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.notifications.push ? 'translate-x-6' : 'translate-x-1'}`} /></button></div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4"><Shield className="w-5 h-5 text-blue-600" /><h2 className="text-lg font-semibold text-gray-900">{t('privacy_settings')}</h2></div>
              <div className="space-y-4">
                <div className="flex items-center justify-between"><div className="flex items-center space-x-3">{preferences.privacy.showBalance ? <Eye className="w-4 h-4 text-gray-400" /> : <EyeOff className="w-4 h-4 text-gray-400" />}<span className="text-sm text-gray-700">{t('show_balance')}</span></div><button onClick={() => togglePreference('privacy', 'showBalance')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.privacy.showBalance ? 'bg-blue-600' : 'bg-gray-200'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.privacy.showBalance ? 'translate-x-6' : 'translate-x-1'}`} /></button></div>
                <div className="flex items-center justify-between"><div className="flex items-center space-x-3"><Shield className="w-4 h-4 text-gray-400" /><span className="text-sm text-gray-700">{t('two_factor_auth')}</span></div><button onClick={() => togglePreference('privacy', 'twoFactorAuth')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.privacy.twoFactorAuth ? 'bg-blue-600' : 'bg-gray-200'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.privacy.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'}`} /></button></div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4"><Settings className="w-5 h-5 text-blue-600" /><h2 className="text-lg font-semibold text-gray-900">{t('display_preferences')}</h2></div>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('preferred_currency')}</label><select value={preferences.display.currency} onChange={(e) => setPreferences(prev => ({ ...prev, display: { ...prev.display, currency: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"><option value="USD">USD - US Dollar</option><option value="EUR">EUR - Euro</option><option value="GBP">GBP - British Pound</option><option value="CNY">CNY - Chinese Yuan</option><option value="JPY">JPY - Japanese Yen</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('language')}</label><select value={preferences.display.language} onChange={(e) => setPreferences(prev => ({ ...prev, display: { ...prev.display, language: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"><option value="en">English</option><option value="zh">中文 (Chinese)</option><option value="es">Español</option><option value="fr">Français</option></select></div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4"><Shield className="w-5 h-5 text-blue-600" /><h2 className="text-lg font-semibold text-gray-900">{t('security_settings')}</h2></div>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('session_timeout')}</label><select value={preferences.security.sessionTimeout} onChange={(e) => setPreferences(prev => ({ ...prev, security: { ...prev.security, sessionTimeout: parseInt(e.target.value) } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"><option value={15}>15 minutes</option><option value={30}>30 minutes</option><option value={60}>1 hour</option><option value={120}>2 hours</option></select></div>
                <div className="flex items-center justify-between"><div className="flex items-center space-x-3"><Smartphone className="w-4 h-4 text-gray-400" /><span className="text-sm text-gray-700">{t('biometric_auth')}</span></div><button onClick={() => togglePreference('security', 'biometric')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.security.biometric ? 'bg-blue-600' : 'bg-gray-200'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.security.biometric ? 'translate-x-6' : 'translate-x-1'}`} /></button></div>
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-end"><button onClick={handleSave} className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"><Save className="w-4 h-4" /><span>{t('save_preferences')}</span></button></div>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
}
