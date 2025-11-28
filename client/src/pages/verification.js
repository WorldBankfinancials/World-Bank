import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'wouter';
import { Shield, Check, AlertCircle, Upload, FileText, User, Phone, Mail, Camera, Calendar, Globe, Building2, ArrowLeft, CheckCircle2, Clock, X } from 'lucide-react';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
export default function VerificationCenter() {
    const { userProfile } = useAuth();
    const { t } = useLanguage();
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedVerification, setSelectedVerification] = useState(null);
    const verificationItems = [
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
    const getStatusColor = (status) => {
        switch (status) {
            case 'verified': return 'text-green-600 bg-green-50 border-green-200';
            case 'pending': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'required': return 'text-red-600 bg-red-50 border-red-200';
            case 'expired': return 'text-gray-600 bg-gray-50 border-gray-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'verified': return _jsx(CheckCircle2, { className: "w-5 h-5 text-green-600" });
            case 'pending': return _jsx(Clock, { className: "w-5 h-5 text-orange-600" });
            case 'required': return _jsx(AlertCircle, { className: "w-5 h-5 text-red-600" });
            case 'expired': return _jsx(X, { className: "w-5 h-5 text-gray-600" });
            default: return _jsx(Clock, { className: "w-5 h-5 text-gray-600" });
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
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(Header, { user: userProfile }), _jsxs("div", { className: "max-w-6xl mx-auto p-6 pt-24", children: [_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx(Link, { href: "/dashboard", children: _jsx("button", { className: "p-2 hover:bg-gray-100 rounded-lg transition-colors", children: _jsx(ArrowLeft, { className: "w-5 h-5 text-gray-600" }) }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: t('verification_center') }), _jsx("p", { className: "text-gray-600 mt-1", children: t('manage_account_verification_status') })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Shield, { className: "w-8 h-8 text-blue-600" }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: t('account_security_level') }), _jsx("div", { className: "text-sm text-green-600 font-semibold", children: t('fully_verified') })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8", children: [_jsx("div", { className: "bg-white rounded-lg p-6 border border-gray-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: t('total_verifications') }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: verificationStats.total })] }), _jsx(Shield, { className: "w-8 h-8 text-blue-600" })] }) }), _jsx("div", { className: "bg-white rounded-lg p-6 border border-gray-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: t('verified') }), _jsx("p", { className: "text-2xl font-bold text-green-600", children: verificationStats.verified })] }), _jsx(CheckCircle2, { className: "w-8 h-8 text-green-600" })] }) }), _jsx("div", { className: "bg-white rounded-lg p-6 border border-gray-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: t('pending') }), _jsx("p", { className: "text-2xl font-bold text-orange-600", children: verificationStats.pending })] }), _jsx(Clock, { className: "w-8 h-8 text-orange-600" })] }) }), _jsx("div", { className: "bg-white rounded-lg p-6 border border-gray-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: t('action_required') }), _jsx("p", { className: "text-2xl font-bold text-red-600", children: verificationStats.required })] }), _jsx(AlertCircle, { className: "w-8 h-8 text-red-600" })] }) })] }), _jsxs("div", { className: "bg-white rounded-lg border border-gray-200 mb-6", children: [_jsx("div", { className: "p-6 border-b border-gray-200", children: _jsx("div", { className: "flex space-x-1", children: [
                                        { key: 'all', label: t('all_verifications') },
                                        { key: 'verified', label: t('verified') },
                                        { key: 'pending', label: t('pending') },
                                        { key: 'required', label: t('required') }
                                    ].map((tab) => (_jsx("button", { onClick: () => setSelectedCategory(tab.key), className: `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === tab.key
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`, children: tab.label }, tab.key))) }) }), _jsx("div", { className: "divide-y divide-gray-200", children: filteredItems.map((item) => (_jsx("div", { className: "p-6 hover:bg-gray-50 transition-colors", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-start space-x-4", children: [_jsx("div", { className: "p-3 bg-blue-50 rounded-lg", children: _jsx(item.icon, { className: "w-6 h-6 text-blue-600" }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-2", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: item.title }), _jsxs("div", { className: `inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`, children: [getStatusIcon(item.status), _jsx("span", { className: "capitalize", children: t(item.status) })] })] }), _jsx("p", { className: "text-gray-600 mb-3", children: item.description }), item.documents && (_jsxs("div", { className: "mb-3", children: [_jsxs("p", { className: "text-sm font-medium text-gray-700 mb-2", children: [t('submitted_documents'), ":"] }), _jsx("div", { className: "flex flex-wrap gap-2", children: item.documents.map((doc, index) => (_jsxs("span", { className: "inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded", children: [_jsx(FileText, { className: "w-3 h-3" }), _jsx("span", { children: doc })] }, index))) })] })), _jsxs("div", { className: "flex items-center space-x-4 text-sm text-gray-500", children: [item.lastUpdated && (_jsxs("div", { className: "flex items-center space-x-1", children: [_jsx(Calendar, { className: "w-4 h-4" }), _jsxs("span", { children: [t('last_updated'), ": ", item.lastUpdated] })] })), item.expiryDate && (_jsxs("div", { className: "flex items-center space-x-1 text-red-600", children: [_jsx(AlertCircle, { className: "w-4 h-4" }), _jsx("span", { children: item.expiryDate })] }))] })] })] }), _jsxs("div", { className: "flex space-x-2", children: [item.status === 'required' && (_jsxs("button", { onClick: () => {
                                                            setSelectedVerification(item.id);
                                                            setShowUploadModal(true);
                                                        }, className: "px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2", children: [_jsx(Upload, { className: "w-4 h-4" }), _jsx("span", { children: t('upload_documents') })] })), item.status === 'pending' && (_jsx("button", { className: "px-4 py-2 bg-orange-100 text-orange-700 text-sm font-medium rounded-lg", children: t('under_review') })), item.status === 'verified' && (_jsxs("button", { className: "px-4 py-2 bg-green-100 text-green-700 text-sm font-medium rounded-lg flex items-center space-x-2", children: [_jsx(Check, { className: "w-4 h-4" }), _jsx("span", { children: t('verified') })] }))] })] }) }, item.id))) })] }), showUploadModal && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", children: _jsxs("div", { className: "bg-white rounded-lg max-w-md w-full p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: t('upload_verification_documents') }), _jsx("button", { onClick: () => setShowUploadModal(false), className: "p-1 hover:bg-gray-100 rounded", children: _jsx(X, { className: "w-5 h-5 text-gray-500" }) })] }), _jsxs("div", { className: "border-2 border-dashed border-gray-300 rounded-lg p-8 text-center", children: [_jsx(Upload, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600 mb-2", children: t('drag_drop_files_here') }), _jsx("p", { className: "text-sm text-gray-500 mb-4", children: t('or_click_to_browse') }), _jsx("button", { className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: t('select_files') })] }), _jsxs("div", { className: "mt-4 text-xs text-gray-500", children: [_jsxs("p", { children: [t('accepted_formats'), ": PDF, JPG, PNG"] }), _jsxs("p", { children: [t('max_file_size'), ": 10MB"] })] }), _jsxs("div", { className: "flex space-x-3 mt-6", children: [_jsx("button", { onClick: () => setShowUploadModal(false), className: "flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors", children: t('cancel') }), _jsx("button", { className: "flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: t('upload') })] })] }) })), _jsx("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-6", children: _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx(Shield, { className: "w-6 h-6 text-blue-600 mt-0.5" }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-blue-900 mb-2", children: t('regulatory_compliance') }), _jsx("p", { className: "text-blue-800 mb-3", children: t('verification_compliance_description') }), _jsxs("ul", { className: "text-sm text-blue-700 space-y-1", children: [_jsxs("li", { children: ["\u2022 ", t('know_your_customer_kyc')] }), _jsxs("li", { children: ["\u2022 ", t('anti_money_laundering_aml')] }), _jsxs("li", { children: ["\u2022 ", t('combating_financing_terrorism_cft')] }), _jsxs("li", { children: ["\u2022 ", t('international_banking_regulations')] })] })] })] }) })] })] }));
}
