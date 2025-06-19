import { useState } from 'react';
import { Link } from 'wouter';
import { Shield, Check, AlertCircle, Upload, FileText, CreditCard, User, Phone, Mail, Camera, Calendar, Globe, Building2, ArrowLeft, CheckCircle2, Clock, X } from 'lucide-react';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

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

export default function VerificationCenter() {
  const { userProfile } = useAuth();
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<string | null>(null);

  const verificationItems: VerificationItem[] = [
    {
      id: 'identity',
      title: t('identity_verification'),
      description: t('government_issued_id_verification'),
      status: 'verified',
      icon: User,
      lastUpdated: 'Dec 10, 2024',
      documents: ['National ID Card', 'Passport']
    },
    {
      id: 'email',
      title: t('email_verification'),
      description: t('confirm_email_address'),
      status: 'verified',
      icon: Mail,
      lastUpdated: 'Dec 15, 2024'
    },
    {
      id: 'phone',
      title: t('phone_verification'),
      description: t('verify_mobile_number'),
      status: 'verified',
      icon: Phone,
      lastUpdated: 'Dec 15, 2024'
    },
    {
      id: 'address',
      title: t('address_verification'),
      description: t('proof_of_residence_verification'),
      status: 'verified',
      icon: Building2,
      lastUpdated: 'Dec 5, 2024',
      documents: ['Utility Bill', 'Bank Statement']
    },
    {
      id: 'income',
      title: t('income_verification'),
      description: t('employment_and_income_proof'),
      status: 'verified',
      icon: FileText,
      lastUpdated: 'Nov 28, 2024',
      documents: ['Employment Letter', 'Salary Certificate']
    },
    {
      id: 'enhanced_due_diligence',
      title: t('enhanced_due_diligence'),
      description: t('additional_verification_high_value'),
      status: 'verified',
      icon: Shield,
      lastUpdated: 'Dec 1, 2024',
      documents: ['Source of Funds Declaration', 'Business Registration']
    },
    {
      id: 'biometric',
      title: t('biometric_verification'),
      description: t('facial_recognition_fingerprint'),
      status: 'pending',
      icon: Camera,
      lastUpdated: 'Pending submission'
    },
    {
      id: 'tax_compliance',
      title: t('tax_compliance'),
      description: t('tax_residency_status'),
      status: 'required',
      icon: Globe,
      expiryDate: 'Due: Jan 30, 2025'
    }
  ];

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
      <Header user={userProfile} />
      
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
                              <span key={index} className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
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
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{t('upload_verification_documents')}</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
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
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  {t('upload')}
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