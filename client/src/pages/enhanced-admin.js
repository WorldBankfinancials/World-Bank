import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Search, User, FileText, CheckCircle, XCircle, CreditCard, PiggyBank, TrendingUp, Eye, Edit, Plus } from 'lucide-react';
export default function EnhancedAdmin() {
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('accounts');
    const [customers] = useState([
        {
            id: 1,
            fullName: "Mr. Liu Wei",
            email: "liu.wei@oilrig.com",
            phone: "+86 138 0013 8000",
            profession: "Marine Engineer",
            isVerified: true,
            accounts: [
                {
                    id: 1,
                    accountNumber: "4789-6523-1087-9234",
                    accountName: "Primary Checking",
                    accountType: "checking",
                    balance: 1047832.15,
                    currency: "USD",
                    isActive: true,
                    minimumBalance: 100
                },
                {
                    id: 2,
                    accountNumber: "4789-6523-1087-9235",
                    accountName: "Emergency Savings",
                    accountType: "savings",
                    balance: 250000.00,
                    currency: "USD",
                    isActive: true,
                    interestRate: 2.5,
                    minimumBalance: 1000
                },
                {
                    id: 3,
                    accountNumber: "4789-6523-1087-9236",
                    accountName: "Investment Portfolio",
                    accountType: "investment",
                    balance: 850000.00,
                    currency: "USD",
                    isActive: true,
                    interestRate: 7.2
                }
            ],
            documents: [
                {
                    id: 1,
                    documentType: "passport",
                    documentName: "Passport_Liu_Wei.pdf",
                    isVerified: true,
                    verificationStatus: "approved",
                    uploadedAt: "2024-12-01T10:00:00Z",
                    verificationNotes: "Document verified and approved"
                },
                {
                    id: 2,
                    documentType: "proof_of_address",
                    documentName: "Utility_Bill_Dec2024.pdf",
                    isVerified: false,
                    verificationStatus: "pending",
                    uploadedAt: "2024-12-15T14:30:00Z"
                }
            ]
        }
    ]);
    const [formData, setFormData] = useState({
        accountType: 'checking',
        accountName: '',
        initialBalance: '',
        interestRate: '',
        minimumBalance: ''
    });
    const getAccountIcon = (type) => {
        switch (type) {
            case 'checking': return _jsx(CreditCard, { className: "w-5 h-5" });
            case 'savings': return _jsx(PiggyBank, { className: "w-5 h-5" });
            case 'investment': return _jsx(TrendingUp, { className: "w-5 h-5" });
            default: return _jsx(CreditCard, { className: "w-5 h-5" });
        }
    };
    const getAccountTypeColor = (type) => {
        switch (type) {
            case 'checking': return 'bg-blue-100 text-blue-800';
            case 'savings': return 'bg-green-100 text-green-800';
            case 'investment': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    const getVerificationStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'needs_review': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    const createNewAccount = () => {
        if (!selectedCustomer || !formData.accountName || !formData.initialBalance)
            return;
        const newAccount = {
            id: Date.now(),
            accountNumber: `4789-6523-1087-${Math.floor(Math.random() * 10000)}`,
            accountName: formData.accountName,
            accountType: formData.accountType,
            balance: parseFloat(formData.initialBalance),
            currency: "USD",
            isActive: true,
            interestRate: formData.interestRate ? parseFloat(formData.interestRate) : undefined,
            minimumBalance: formData.minimumBalance ? parseFloat(formData.minimumBalance) : undefined
        };
        // In a real app, this would be an API call
        selectedCustomer.accounts.push(newAccount);
        setFormData({
            accountType: 'checking',
            accountName: '',
            initialBalance: '',
            interestRate: '',
            minimumBalance: ''
        });
    };
    const topUpAccount = (accountId, amount) => {
        if (!selectedCustomer)
            return;
        const account = selectedCustomer.accounts.find(acc => acc.id === accountId);
        if (account) {
            account.balance += amount;
        }
    };
    const verifyDocument = (documentId, status, notes) => {
        if (!selectedCustomer)
            return;
        const document = selectedCustomer.documents.find(doc => doc.id === documentId);
        if (document) {
            document.verificationStatus = status;
            document.isVerified = status === 'approved';
            document.verificationNotes = notes;
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 p-6", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Enhanced Admin Dashboard" }), _jsx("p", { className: "text-gray-600", children: "Complete customer management with multi-account support" })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsx("div", { className: "lg:col-span-1", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(User, { className: "w-5 h-5" }), "Customer Search"] }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "relative mb-4", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx(Input, { placeholder: "Search customers...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "pl-10" })] }), _jsx("div", { className: "space-y-3", children: customers
                                                .filter(customer => customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
                                                .map(customer => (_jsx("div", { className: `p-3 rounded-lg border cursor-pointer transition-colors ${selectedCustomer?.id === customer.id
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'}`, onClick: () => setSelectedCustomer(customer), children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium", children: customer.fullName }), _jsx("p", { className: "text-sm text-gray-600", children: customer.email }), _jsxs("p", { className: "text-xs text-gray-500", children: [customer.accounts.length, " accounts"] })] }), customer.isVerified && (_jsx(CheckCircle, { className: "w-5 h-5 text-green-500" }))] }) }, customer.id))) })] })] }) }), _jsx("div", { className: "lg:col-span-2", children: selectedCustomer ? (_jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, children: [_jsxs(TabsList, { className: "grid w-full grid-cols-4", children: [_jsx(TabsTrigger, { value: "accounts", children: "Accounts" }), _jsx(TabsTrigger, { value: "documents", children: "Documents" }), _jsx(TabsTrigger, { value: "profile", children: "Profile" }), _jsx(TabsTrigger, { value: "new-account", children: "New Account" })] }), _jsx(TabsContent, { value: "accounts", className: "space-y-4", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Customer Accounts" }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Managing accounts for ", selectedCustomer.fullName] })] }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: selectedCustomer.accounts.map(account => (_jsxs("div", { className: "border rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [getAccountIcon(account.accountType), _jsxs("div", { children: [_jsx("h3", { className: "font-medium", children: account.accountName }), _jsx("p", { className: "text-sm text-gray-600", children: account.accountNumber })] })] }), _jsx(Badge, { className: getAccountTypeColor(account.accountType), children: account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Balance" }), _jsxs("p", { className: "text-xl font-bold text-green-600", children: ["$", account.balance.toLocaleString()] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Status" }), _jsx(Badge, { variant: account.isActive ? "default" : "secondary", children: account.isActive ? "Active" : "Inactive" })] })] }), account.interestRate && (_jsxs("div", { className: "mb-4", children: [_jsx("p", { className: "text-sm text-gray-600", children: "Interest Rate" }), _jsxs("p", { className: "font-medium", children: [account.interestRate, "% APY"] })] })), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { size: "sm", onClick: () => topUpAccount(account.id, 1000), className: "flex items-center gap-2", children: [_jsx(Plus, { className: "w-4 h-4" }), "Top Up $1,000"] }), _jsxs(Button, { size: "sm", variant: "outline", onClick: () => topUpAccount(account.id, 5000), className: "flex items-center gap-2", children: [_jsx(Plus, { className: "w-4 h-4" }), "Top Up $5,000"] }), _jsx(Button, { size: "sm", variant: "outline", children: _jsx(Edit, { className: "w-4 h-4" }) })] })] }, account.id))) }) })] }) }), _jsx(TabsContent, { value: "documents", className: "space-y-4", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Document Verification" }), _jsx("p", { className: "text-sm text-gray-600", children: "Review and verify customer documents" })] }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: selectedCustomer.documents.map(document => (_jsxs("div", { className: "border rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(FileText, { className: "w-5 h-5" }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium", children: document.documentName }), _jsx("p", { className: "text-sm text-gray-600 capitalize", children: document.documentType.replace('_', ' ') })] })] }), _jsx(Badge, { className: getVerificationStatusColor(document.verificationStatus), children: document.verificationStatus.replace('_', ' ') })] }), _jsxs("div", { className: "mb-4", children: [_jsx("p", { className: "text-sm text-gray-600", children: "Uploaded" }), _jsx("p", { className: "text-sm", children: new Date(document.uploadedAt).toLocaleDateString() })] }), document.verificationNotes && (_jsxs("div", { className: "mb-4", children: [_jsx("p", { className: "text-sm text-gray-600", children: "Notes" }), _jsx("p", { className: "text-sm", children: document.verificationNotes })] })), document.verificationStatus === 'pending' && (_jsxs("div", { className: "space-y-3", children: [_jsx(Textarea, { placeholder: "Add verification notes...", className: "w-full", id: `notes-${document.id}` }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { size: "sm", onClick: () => {
                                                                                    const notes = document.getElementById(`notes-${document.id}`)?.value || '';
                                                                                    verifyDocument(document.id, 'approved', notes);
                                                                                }, className: "flex items-center gap-2", children: [_jsx(CheckCircle, { className: "w-4 h-4" }), "Approve"] }), _jsxs(Button, { size: "sm", variant: "destructive", onClick: () => {
                                                                                    const notes = document.getElementById(`notes-${document.id}`)?.value || '';
                                                                                    verifyDocument(document.id, 'rejected', notes);
                                                                                }, className: "flex items-center gap-2", children: [_jsx(XCircle, { className: "w-4 h-4" }), "Reject"] }), _jsxs(Button, { size: "sm", variant: "outline", children: [_jsx(Eye, { className: "w-4 h-4" }), "View"] })] })] }))] }, document.id))) }) })] }) }), _jsx(TabsContent, { value: "profile", className: "space-y-4", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Customer Profile" }), _jsx("p", { className: "text-sm text-gray-600", children: "Edit customer information and settings" })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "fullName", children: "Full Name" }), _jsx(Input, { id: "fullName", defaultValue: selectedCustomer.fullName, className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "email", children: "Email" }), _jsx(Input, { id: "email", type: "email", defaultValue: selectedCustomer.email, className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "phone", children: "Phone" }), _jsx(Input, { id: "phone", defaultValue: selectedCustomer.phone, className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "profession", children: "Profession" }), _jsx(Input, { id: "profession", defaultValue: selectedCustomer.profession, className: "mt-1" })] }), _jsxs("div", { className: "col-span-2", children: [_jsx(Label, { htmlFor: "notes", children: "Admin Notes" }), _jsx(Textarea, { id: "notes", placeholder: "Add internal notes about this customer...", className: "mt-1" })] })] }), _jsx("div", { className: "flex justify-end mt-6", children: _jsx(Button, { children: "Save Changes" }) })] })] }) }), _jsx(TabsContent, { value: "new-account", className: "space-y-4", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Create New Account" }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Add a new account for ", selectedCustomer.fullName] })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "col-span-2", children: [_jsx(Label, { htmlFor: "accountType", children: "Account Type" }), _jsxs(Select, { value: formData.accountType, onValueChange: (value) => setFormData(prev => ({ ...prev, accountType: value })), children: [_jsx(SelectTrigger, { className: "mt-1", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "checking", children: "Checking Account" }), _jsx(SelectItem, { value: "savings", children: "Savings Account" }), _jsx(SelectItem, { value: "investment", children: "Investment Account" })] })] })] }), _jsxs("div", { className: "col-span-2", children: [_jsx(Label, { htmlFor: "accountName", children: "Account Name" }), _jsx(Input, { id: "accountName", placeholder: "e.g., Primary Checking, Emergency Savings", value: formData.accountName, onChange: (e) => setFormData(prev => ({ ...prev, accountName: e.target.value })), className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "initialBalance", children: "Initial Balance" }), _jsx(Input, { id: "initialBalance", type: "number", placeholder: "0.00", value: formData.initialBalance, onChange: (e) => setFormData(prev => ({ ...prev, initialBalance: e.target.value })), className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "minimumBalance", children: "Minimum Balance" }), _jsx(Input, { id: "minimumBalance", type: "number", placeholder: "100.00", value: formData.minimumBalance, onChange: (e) => setFormData(prev => ({ ...prev, minimumBalance: e.target.value })), className: "mt-1" })] }), (formData.accountType === 'savings' || formData.accountType === 'investment') && (_jsxs("div", { className: "col-span-2", children: [_jsx(Label, { htmlFor: "interestRate", children: "Interest Rate (%)" }), _jsx(Input, { id: "interestRate", type: "number", step: "0.1", placeholder: "2.5", value: formData.interestRate, onChange: (e) => setFormData(prev => ({ ...prev, interestRate: e.target.value })), className: "mt-1" })] }))] }), _jsx("div", { className: "flex justify-end mt-6", children: _jsx(Button, { onClick: createNewAccount, disabled: !formData.accountName || !formData.initialBalance, children: "Create Account" }) })] })] }) })] })) : (_jsx(Card, { children: _jsx(CardContent, { className: "flex items-center justify-center h-96", children: _jsxs("div", { className: "text-center", children: [_jsx(User, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "No Customer Selected" }), _jsx("p", { className: "text-gray-600", children: "Select a customer from the list to view and manage their accounts" })] }) }) })) })] })] }));
}
