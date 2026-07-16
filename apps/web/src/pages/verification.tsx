import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Shield, CheckCircle, Clock, AlertCircle, Upload, FileText, Mail, Phone, MapPin, DollarSign, User as UserIcon } from 'lucide-react';
import Header from '@/components/Header';
import type { User } from '@packages/shared/schema';
import BottomNavigation from '@/components/BottomNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { authenticatedFetch } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface VerificationItem {
  id: string;
  name: string;
  status: 'verified' | 'pending' | 'required';
  completedAt?: string | null;
}

interface KycData {
  kycRecord: unknown;
  verificationItems: VerificationItem[];
  user: { isVerified: boolean; kycStatus: string };
}

export default function Verification() {
  const { userProfile } = useAuth();
  const { t } = useLanguage();
  const [documentType, setDocumentType] = useState('passport');
  const [fullName, setFullName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nationality, setNationality] = useState('');
  const [address, setAddress] = useState('');

  const { data: kycData, isLoading, error } = useQuery<KycData>({
    queryKey: ['/api/kyc/status'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/kyc/status');
      if (!response.ok) return { kycRecord: null, verificationItems: [], user: { isVerified: false, kycStatus: 'pending' } };
      return response.json();
    }
  });

  const { toast } = useToast();

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

  const handleSubmit = async () => {
    if (!documentType || !fullName) return;
    try {
      const response = await authenticatedFetch('/api/kyc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType, documentNumber, fullName, dateOfBirth, nationality, address })
      });
      if (response.ok) {
        setFullName('');
        setDocumentNumber('');
        setDateOfBirth('');
        setNationality('');
        setAddress('');
      }
    } catch (error) {
      console.error('KYC submission failed:', error);
    }
  };

  const items = kycData?.verificationItems || [];
  const verifiedCount = items.filter((item: VerificationItem) => item.status === 'verified').length;
  const totalCount = items.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={(userProfile as unknown as User) || undefined} />
      <main className="container mx-auto px-4 py-6 max-w-4xl pb-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('verification_center')}</h1>
        <p className="text-gray-600 mb-6">{t('manage_account_verification_status')}</p>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-lg font-semibold">{t('account_security_level')}</p>
              <p className="text-sm text-gray-500">{verifiedCount} of {totalCount} {t('all_verifications')}</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${totalCount > 0 ? (verifiedCount / totalCount) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {items.map((item: VerificationItem) => (
            <div key={item.id} className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {item.status === 'verified' ? <CheckCircle className="w-6 h-6 text-green-500" /> : item.status === 'pending' ? <Clock className="w-6 h-6 text-yellow-500" /> : <AlertCircle className="w-6 h-6 text-red-500" />}
                <span className="font-medium">{item.name}</span>
              </div>
              <span className={`text-sm ${item.status === 'verified' ? 'text-green-600' : item.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`}>
                {item.status === 'verified' ? t('verified') : item.status === 'pending' ? t('pending') : t('unverified')}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">{t('upload_documents')}</h2>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label><select value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg"><option value="passport">Passport</option><option value="id_card">National ID Card</option><option value="drivers_license">Driver's License</option></select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label><input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Document Number</label><input type="text" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} placeholder="Document number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label><input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label><input type="text" value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="Your nationality" className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Address</label><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Your address" className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
            <button onClick={handleSubmit} disabled={!fullName} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Submit for Verification</button>
          </div>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
}
