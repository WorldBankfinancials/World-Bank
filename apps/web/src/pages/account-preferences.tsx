import { useState, useEffect } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import { Settings, Bell, CreditCard, Shield, Globe, Smartphone, Mail, MessageSquare, DollarSign, Eye, EyeOff, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authenticatedFetch } from '@/lib/queryClient';

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

  const { data: userData, isLoading, error: queryError } = useQuery<UserData & UserPreferences>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/user');
      if (!response.ok) throw new Error('Failed to fetch user preferences');
      return response.json();
    },
    staleTime: 60000,
  });

  useEffect(() => {
    if (queryError) {
      toast({ title: 'Error loading preferences', variant: 'destructive' });
    }
  }, [queryError, toast]);

  const [preferences, setPreferences] = useState({
    notifications: { email: true, sms: true, push: true, marketing: false },
    privacy: { showBalance: true, shareData: false, twoFactorAuth: true },
    display: { currency: 'USD', language: 'en', theme: 'light' },
    security: { sessionTimeout: 30, biometric: true, autoLogout: true }
  });

  useEffect(() => {
    if (userData?.preferences) {
      setPreferences({
        notifications: { ...preferences.notifications, ...userData.preferences.notifications },
        privacy: { ...preferences.privacy, ...userData.preferences.privacy },
        display: { ...preferences.display, ...userData.preferences.display },
        security: { ...preferences.security, ...userData.preferences.security },
      });
    }
  }, [userData]);

  const handleSave = async () => {
    try {
      const response = await authenticatedFetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences })
      });
      if (!response.ok) throw new Error('Failed to save');
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({ title: 'Preferences saved successfully' });
    } catch {
      toast({ title: 'Failed to save preferences', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user as any} />
      <div className="container mx-auto px-4 py-6 max-w-3xl pb-20">
        <h1 className="text-2xl font-bold mb-6">{t('account_preferences') || 'Account Preferences'}</h1>

        <div className="bg-white rounded-xl shadow p-6 mb-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Bell className="w-5 h-5" /> Notifications</h2>
          <div className="space-y-3">
            {Object.entries(preferences.notifications).map(([key, value]) => (
              <label key={key} className="flex items-center justify-between">
                <span className="capitalize">{key}</span>
                <input type="checkbox" checked={value} onChange={(e) => setPreferences({ ...preferences, notifications: { ...preferences.notifications, [key]: e.target.checked } })} />
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Shield className="w-5 h-5" /> Privacy & Security</h2>
          <div className="space-y-3">
            {Object.entries(preferences.privacy).map(([key, value]) => (
              <label key={key} className="flex items-center justify-between">
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <input type="checkbox" checked={value} onChange={(e) => setPreferences({ ...preferences, privacy: { ...preferences.privacy, [key]: e.target.checked } })} />
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Globe className="w-5 h-5" /> Display</h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span>Currency</span>
              <select value={preferences.display.currency} onChange={(e) => setPreferences({ ...preferences, display: { ...preferences.display, currency: e.target.value } })}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CNY">CNY</option>
              </select>
            </label>
            <label className="flex items-center justify-between">
              <span>Language</span>
              <select value={preferences.display.language} onChange={(e) => setPreferences({ ...preferences, display: { ...preferences.display, language: e.target.value } })}>
                <option value="en">English</option>
                <option value="zh">中文</option>
              </select>
            </label>
          </div>
        </div>

        <button onClick={handleSave} className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2">
          <Save className="w-4 h-4" />
          {t('save_preferences') || 'Save Preferences'}
        </button>
      </div>
      <BottomNavigation />
    </div>
  );
}
