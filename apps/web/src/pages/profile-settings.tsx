import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authenticatedFetch } from '@/lib/queryClient';
import { useState, useEffect } from 'react';
import { User as UserIcon, Mail, Phone, MapPin, Shield, Lock, Bell, Save, Key } from 'lucide-react';
import type { User } from '@packages/shared/schema';

interface UserProfile {
  id: string | number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  profession: string;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  accountNumber: string;
  balance: string;
  isVerified: boolean;
  role: string;
}

export default function ProfileSettings() {
  const { userProfile } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery<UserProfile>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/user');
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    }
  });

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phone: '', profession: '', address: '', city: '', state: '', postalCode: '', country: ''
  });

  // Initialize form data from profile
  useState(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        profession: profile.profession || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        postalCode: profile.postalCode || '',
        country: profile.country || ''
      });
    }
  });

  const handleSave = async () => {
    // Validate form
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast({ title: 'Validation Error', description: 'First and last name are required', variant: 'destructive' });
      return;
    }
    if (formData.phone && !/^[+]?[\d\s\-()]{7,20}$/.test(formData.phone)) {
      toast({ title: 'Validation Error', description: 'Please enter a valid phone number', variant: 'destructive' });
      return;
    }

    try {
      const response = await authenticatedFetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        toast({ title: 'Success', description: 'Profile updated successfully' });
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        setEditing(false);
      } else {
        toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
    }
  };

  const displayProfile = profile || userProfile as UserProfile;

  useEffect(() => {
    if (error) {
      toast({ title: 'Error loading data', variant: 'destructive' });
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={(displayProfile as unknown as User) || undefined} />
      <main className="container mx-auto px-4 py-6 max-w-4xl pb-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('profile_settings')}</h1>
        <p className="text-gray-600 mb-6">{t('view_your_profile_information_and_account_details')}</p>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-center gap-3 mb-4"><UserIcon className="w-6 h-6 text-blue-600" /><h2 className="text-lg font-semibold">{t('profile_information')}</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('full_name')}</label>{editing ? <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /> : <p className="text-gray-900">{displayProfile?.firstName} {displayProfile?.lastName}</p>}</div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label><p className="text-gray-900">{displayProfile?.email}</p></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>{editing ? <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /> : <p className="text-gray-900">{displayProfile?.phone || 'N/A'}</p>}</div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('profession')}</label>{editing ? <input type="text" value={formData.profession} onChange={(e) => setFormData({ ...formData, profession: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /> : <p className="text-gray-900">{displayProfile?.profession || 'N/A'}</p>}</div>
          </div>
          {editing && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('address')}</label><input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('city')}</label><input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('postal_code')}</label><input type="text" value={formData.postalCode} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('country')}</label><input type="text" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
            </div>
          )}
          <div className="mt-4 flex gap-2">
            {editing ? (
              <><button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"><Save className="w-4 h-4" />{t('save_changes')}</button><button onClick={() => setEditing(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">{t('cancel')}</button></>
            ) : (
              <button onClick={() => setEditing(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t('edit')}</button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-center gap-3 mb-4"><Shield className="w-6 h-6 text-blue-600" /><h2 className="text-lg font-semibold">{t('secure_profile')}</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('verified')}</label><p className="text-gray-900">{displayProfile?.isVerified ? t('verified') : t('unverified')}</p></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label><p className="text-gray-900 font-mono">{displayProfile?.accountNumber || 'N/A'}</p></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-4"><Lock className="w-6 h-6 text-blue-600" /><h2 className="text-lg font-semibold">{t('transfer_pin_settings')}</h2></div>
          <p className="text-sm text-gray-600 mb-4">{t('contact_customer_support_to_request_pin_changes')}</p>
          <p className="text-sm text-gray-500">{t('admin_only')}</p>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
}
