import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useEffect } from "react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
export default function AdminAccountManagement({ onBack }) {
    const { toast } = useToast();
    const [accounts, setAccounts] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [formData, setFormData] = useState({
        userId: 1, // Liu Wei's user ID
        accountType: 'checking',
        accountName: '',
        balance: '0.00',
        currency: 'USD'
    });
    useEffect(() => {
        fetchAccounts();
    }, []);
    const fetchAccounts = async () => {
        try {
            const { authenticatedFetch } = await import('@/lib/queryClient');
            const response = await authenticatedFetch('/api/accounts');
            if (response.ok) {
                const accountsData = await response.json();
                setAccounts(accountsData);
            }
        }
        catch (error) {
            // console.error('Error fetching accounts:', error);
        }
    };
    const generateAccountNumber = () => {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `4789-6523-${timestamp.slice(0, 4)}-${random}`;
    };
    const handleCreateAccount = async () => {
        try {
            const accountData = {
                ...formData,
                accountNumber: generateAccountNumber(),
                isActive: true
            };
            const { authenticatedFetch } = await import('@/lib/queryClient');
            const response = await authenticatedFetch('/api/admin/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(accountData)
            });
            if (response.ok) {
                const newAccount = await response.json();
                setAccounts(prev => [...prev, newAccount]);
                setShowCreateForm(false);
                setFormData({
                    userId: 1,
                    accountType: 'checking',
                    accountName: '',
                    balance: '0.00',
                    currency: 'USD'
                });
                toast({
                    title: 'Account Created',
                    description: 'New account has been created successfully.',
                });
            }
        }
        catch (error) {
            // console.error('Error creating account:', error);
            toast({
                title: 'Creation Failed',
                description: 'Failed to create account. Please try again.',
                variant: 'destructive',
            });
        }
    };
    const handleEditAccount = async () => {
        if (!editingAccount)
            return;
        try {
            const { authenticatedFetch } = await import('@/lib/queryClient');
            const response = await authenticatedFetch(`/api/admin/accounts/${editingAccount.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountName: editingAccount.accountName,
                    balance: editingAccount.balance,
                    isActive: editingAccount.isActive
                })
            });
            if (response.ok) {
                setAccounts(prev => prev.map(acc => acc.id === editingAccount.id ? editingAccount : acc));
                setEditingAccount(null);
                toast({
                    title: 'Account Updated',
                    description: 'Account information has been updated successfully.',
                });
            }
        }
        catch (error) {
            // console.error('Error updating account:', error);
            toast({
                title: 'Update Failed',
                description: 'Failed to update account. Please try again.',
                variant: 'destructive',
            });
        }
    };
    const handleDeleteAccount = async (accountId) => {
        if (!confirm('Are you sure you want to delete this account?'))
            return;
        try {
            const { authenticatedFetch } = await import('@/lib/queryClient');
            const response = await authenticatedFetch(`/api/admin/accounts/${accountId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setAccounts(prev => prev.filter(acc => acc.id !== accountId));
                toast({
                    title: 'Account Deleted',
                    description: 'Account has been deleted successfully.',
                });
            }
        }
        catch (error) {
            // console.error('Error deleting account:', error);
            toast({
                title: 'Deletion Failed',
                description: 'Failed to delete account. Please try again.',
                variant: 'destructive',
            });
        }
    };
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center gap-4 mb-6", children: [_jsxs(Button, { onClick: onBack, variant: "outline", size: "sm", children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }), "Back to Admin Dashboard"] }), _jsx("h1", { className: "text-2xl font-bold", children: "Account Management" })] }), _jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Customer Accounts" }), _jsxs(Button, { onClick: () => setShowCreateForm(true), className: "bg-blue-600 hover:bg-blue-700", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Create New Account"] })] }), _jsx("div", { className: "grid gap-4 mb-6", children: accounts.map((account) => (_jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold", children: account.accountName }), _jsxs("p", { className: "text-sm text-gray-600", children: [account.accountNumber, " \u2022 ", account.accountType.toUpperCase()] }), _jsxs("p", { className: "text-lg font-bold text-green-600", children: [account.currency, " ", parseFloat(account.balance).toLocaleString()] }), _jsx("span", { className: `text-xs px-2 py-1 rounded ${account.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`, children: account.isActive ? 'Active' : 'Inactive' })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { onClick: () => setEditingAccount(account), variant: "outline", size: "sm", children: _jsx(Edit, { className: "w-4 h-4" }) }), _jsx(Button, { onClick: () => handleDeleteAccount(account.id), variant: "outline", size: "sm", className: "text-red-600 hover:text-red-700", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] }) }) }, account.id))) }), showCreateForm && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs(Card, { className: "w-full max-w-md", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Create New Account" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "Account Type" }), _jsxs(Select, { value: formData.accountType, onValueChange: (value) => setFormData(prev => ({ ...prev, accountType: value })), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "checking", children: "Checking" }), _jsx(SelectItem, { value: "savings", children: "Savings" }), _jsx(SelectItem, { value: "investment", children: "Investment" })] })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Account Name" }), _jsx(Input, { value: formData.accountName, onChange: (e) => setFormData(prev => ({ ...prev, accountName: e.target.value })), placeholder: "e.g., Primary Checking" })] }), _jsxs("div", { children: [_jsx(Label, { children: "Initial Balance" }), _jsx(Input, { type: "number", step: "0.01", value: formData.balance, onChange: (e) => setFormData(prev => ({ ...prev, balance: e.target.value })) })] }), _jsxs("div", { className: "flex gap-2 pt-4", children: [_jsx(Button, { onClick: () => setShowCreateForm(false), variant: "outline", className: "flex-1", children: "Cancel" }), _jsx(Button, { onClick: handleCreateAccount, className: "flex-1 bg-blue-600 hover:bg-blue-700", children: "Create Account" })] })] })] }) })), editingAccount && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs(Card, { className: "w-full max-w-md", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Edit Account" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "Account Name" }), _jsx(Input, { value: editingAccount.accountName, onChange: (e) => setEditingAccount(prev => prev ?
                                                { ...prev, accountName: e.target.value } : null) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Balance" }), _jsx(Input, { type: "number", step: "0.01", value: editingAccount.balance, onChange: (e) => setEditingAccount(prev => prev ?
                                                { ...prev, balance: e.target.value } : null) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Status" }), _jsxs(Select, { value: editingAccount.isActive ? 'active' : 'inactive', onValueChange: (value) => setEditingAccount(prev => prev ?
                                                { ...prev, isActive: value === 'active' } : null), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "active", children: "Active" }), _jsx(SelectItem, { value: "inactive", children: "Inactive" })] })] })] }), _jsxs("div", { className: "flex gap-2 pt-4", children: [_jsx(Button, { onClick: () => setEditingAccount(null), variant: "outline", className: "flex-1", children: "Cancel" }), _jsx(Button, { onClick: handleEditAccount, className: "flex-1 bg-green-600 hover:bg-green-700", children: "Save Changes" })] })] })] }) }))] }));
}
