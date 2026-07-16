import { useState } from 'react';
import { Link } from 'wouter';
import { Shield, Check, AlertCircle, Upload, FileText, CreditCard, User, Phone, Mail, Camera, Calendar, Globe, Building2, ArrowLeft, CheckCircle2, Clock, X } from 'lucide-react';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface VerificationItem {
  id: string;
  title: string;
  description: string;
  status: 'verified' | 'pending' | 'required' | 'expired';
  icon: any;
  lastUpdated?: string;
  expiryDate?: string;
  documents?: string[];
}

const iconMap: Record<string, any> = {
  identity: User,
  email: Mail,
  phone: Phone,
  address: Building2,
  income: FileText,
  enhanced_due_diligence: Shield,
  biometric: Camera,
  tax_compliance: Globe,
};

export default function VerificationCenter() {
  const { userProfile } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<string | null>(null);

  // KYC form state
  const [kycForm, setKycForm] = useState({
    documentType: 'national_id',
    fullName: '',
    dateOfBirth: '',
    nationality: '',
    address: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch KYC status from API
  const { data: kycData, isLoading: kycLoading } = useQuery<any>({
    queryKey: ['/api/kyc/status'],
    queryFn: async () => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const res = await authenticatedFetch('/api/kyc/status');
      if (!res.ok) return null;
      return res.json();
    }
  });

  // Build verification items from API response, fall back to empty array
  const verificationItems: VerificationItem[] = (kycData?.verificationItems || []).map((item: any) => ({
    id: item.id,
    title: item.title || t(`${item.id}_verification`) || item.id,
    description: item.description || '',
    status: item.status || 'required',
    icon: iconMap[item.id] || Shield,
    lastUpdated: item.lastUpdated,
    expiryDate: item.expiryDate,
    documents: item.documents,
  }));

  if (kycLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-50 border-green-200';
      case 'pending': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'required': return 'text-red-600 bg-red-50 border-red-200';
      case 'expired': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'pending': return <Clock className="w-5 h-5 text-orange-600" />;
      case 'required': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'expired': return <X className="w-5 h-5 text-gray-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const filteredItems = selectedCategory === 'all' 
    ? verificationItems 
    : verificationItems.filter(item => item.status === selectedCategory);

  const verificationStats = {
    total: verificationItems.length,
    verified: verificationItems.filter(item => item.status === 'verified').length,
    pending: verificationItems.filter(item => item.status === 'pending').length,
    required: verificationItems.filter(item => item.status === 'required').length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-6xl mx-auto p-6 pt-24">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('verification_center')}</h1>
              <p className="text-gray-600 mt-1">{t('manage_account_verification_status')}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{t('account_security_level')}</div>
              <div className="text-sm text-green-600 font-semibold">{t('fully_verified')}</div>
            </div>
          </div>
        </div>

        {/* Verification Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('total_verifications')}</p>
                <p className="text-2xl font-bold text-gray-900">{verificationStats.total}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('verified')}</p>
                <p className="text-2xl font-bold text-green-600">{verificationStats.verified}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('pending')}</p>
                <p className="text-2xl font-bold text-orange-600">{verificationStats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('action_required')}</p>
                <p className="text-2xl font-bold text-red-600">{verificationStats.required}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex space-x-1">
              {[
                { key: 'all', label: t('all_verifications') },
                { key: 'verified', label: t('verified') },
                { key: 'pending', label: t('pending') },
                { key: 'required', label: t('required') }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedCategory(tab.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === tab.key
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Verification Items */}
          <div className="divide-y divide-gray-200">
            {filteredItems.map((item) => (
              <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <item.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                        <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          <span className="capitalize">{t(item.status)}</span>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-3">{item.description}</p>
                      
                      {item.documents && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">{t('submitted_documents')}:</p>
                          <div className="flex flex-wrap gap-2">
                            {item.documents.map((doc, index) => (
                              <span key={`item-${index}`} className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                <FileText className="w-3 h-3" />
                                <span>{doc}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {item.lastUpdated && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{t('last_updated')}: {item.lastUpdated}</span>
                          </div>
                        )}
                        {item.expiryDate && (
                          <div className="flex items-center space-x-1 text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            <span>{item.expiryDate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {item.status === 'required' && (
                      <button
                        onClick={() => {
                          setSelectedVerification(item.id);
                          setShowUploadModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{t('upload_documents')}</span>
                      </button>
                    )}
                    {item.status === 'pending' && (
                      <button className="px-4 py-2 bg-orange-100 text-orange-700 text-sm font-medium rounded-lg">
                        {t('under_review')}
                      </button>
                    )}
                    {item.status === 'verified' && (
                      <button className="px-4 py-2 bg-green-100 text-green-700 text-sm font-medium rounded-lg flex items-center space-x-2">
                        <Check className="w-4 h-4" />
                        <span>{t('verified')}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{t('upload_verification_documents')}</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* KYC Form Fields */}
              <div className="space-y-4 mb-4">
                <div>
                  <Label className="mb-1.5 block">Document Type</Label>
                  <select
                    value={kycForm.documentType}
                    onChange={(e) => setKycForm({ ...kycForm, documentType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white"
                  >
                    <option value="national_id">National ID</option>
                    <option value="passport">Passport</option>
                    <option value="drivers_license">Driver's License</option>
                    <option value="residence_permit">Residence Permit</option>
                  </select>
                </div>
                <div>
                  <Label className="mb-1.5 block">Full Name</Label>
                  <Input
                    value={kycForm.fullName}
                    onChange={(e) => setKycForm({ ...kycForm, fullName: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block">Date of Birth</Label>
                  <Input
                    type="date"
                    value={kycForm.dateOfBirth}
                    onChange={(e) => setKycForm({ ...kycForm, dateOfBirth: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block">Nationality</Label>
                  <Input
                    value={kycForm.nationality}
                    onChange={(e) => setKycForm({ ...kycForm, nationality: e.target.value })}
                    placeholder="Enter your nationality"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block">Address</Label>
                  <Input
                    value={kycForm.address}
                    onChange={(e) => setKycForm({ ...kycForm, address: e.target.value })}
                    placeholder="Enter your address"
                  />
                </div>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">{t('drag_drop_files_here')}</p>
                <p className="text-sm text-gray-500 mb-4">{t('or_click_to_browse')}</p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  {t('select_files')}
                </button>
              </div>
              
              <div className="mt-4 text-xs text-gray-500">
                <p>{t('accepted_formats')}: PDF, JPG, PNG</p>
                <p>{t('max_file_size')}: 10MB</p>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  disabled={submitting}
                  onClick={async () => {
                    setSubmitting(true);
                    try {
                      const { authenticatedFetch } = await import('@/lib/queryClient');
                      const res = await authenticatedFetch('/api/kyc/submit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          verificationType: selectedVerification,
                          ...kycForm,
                        })
                      });
                      if (!res.ok) {
                        const data = await res.json().catch(() => ({}));
                        throw new Error(data.error || 'Failed to submit verification');
                      }
                      toast({ title: 'Success', description: 'Verification documents submitted' });
                      queryClient.invalidateQueries({ queryKey: ['/api/kyc/status'] });
                      setShowUploadModal(false);
                      setKycForm({ documentType: 'national_id', fullName: '', dateOfBirth: '', nationality: '', address: '' });
                    } catch (err) {
                      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to submit', variant: 'destructive' });
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : t('upload')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Compliance Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Shield className="w-6 h-6 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">{t('regulatory_compliance')}</h3>
              <p className="text-blue-800 mb-3">
                {t('verification_compliance_description')}
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• {t('know_your_customer_kyc')}</li>
                <li>• {t('anti_money_laundering_aml')}</li>
                <li>• {t('combating_financing_terrorism_cft')}</li>
                <li>• {t('international_banking_regulations')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}