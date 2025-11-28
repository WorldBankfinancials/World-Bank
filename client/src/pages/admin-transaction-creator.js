import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, DollarSign, FileText, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
export default function AdminTransactionCreator() {
    const { t } = useLanguage();
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [accounts, setAccounts] = useState([]);
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [transactionType, setTransactionType] = useState('credit');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('admin');
    const [recipientName, setRecipientName] = useState('');
    const [bankName, setBankName] = useState('');
    const [reference, setReference] = useState('');
    const [redirectPage, setRedirectPage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const fetchAccounts = async () => {
        const { authenticatedFetch } = await import('@/lib/queryClient');
        try {
            const response = await authenticatedFetch('/api/accounts');
            if (response.ok) {
                const data = await response.json();
                setAccounts(data);
            }
            else {
                console.error('Failed to fetch accounts:', await response.text());
                toast({
                    title: 'Error loading accounts',
                    description: 'Unable to load accounts. Please try again.',
                    variant: 'destructive',
                });
            }
        }
        catch (error) {
            console.error('Failed to fetch accounts:', error);
            toast({
                title: 'Error loading accounts',
                description: 'Network error. Please check your connection.',
                variant: 'destructive',
            });
        }
    };
    useEffect(() => {
        fetchAccounts();
    }, []);
    const handleCreateTransaction = async () => {
        if (!selectedAccountId || !amount || !description) {
            console.warn('Missing required fields for transaction creation');
            toast({
                title: 'Missing information',
                description: 'Please fill in all required fields.',
                variant: 'destructive',
            });
            return;
        }
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            console.warn('Invalid amount for transaction');
            toast({
                title: 'Invalid amount',
                description: 'Please enter a valid amount greater than zero.',
                variant: 'destructive',
            });
            return;
        }
        setIsProcessing(true);
        try {
            // Create transaction using account-specific endpoint
            const { authenticatedFetch } = await import('@/lib/queryClient');
            const response = await authenticatedFetch(`/api/admin/accounts/${selectedAccountId}/balance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: numAmount.toString(),
                    description: description,
                    type: transactionType
                })
            });
            if (response.ok) {
                const result = await response.json();
                console.log(`Transaction created successfully: ${transactionType.toUpperCase()} $${numAmount.toLocaleString()}`);
                toast({
                    title: 'Transaction created',
                    description: `${transactionType.toUpperCase()} of $${numAmount.toLocaleString()} completed successfully.`,
                });
                // Reset form
                setSelectedAccountId('');
                setAmount('');
                setDescription('');
                setRecipientName('');
                setBankName('');
                setReference('');
                // Navigate to specified page if selected
                if (redirectPage) {
                    setTimeout(() => {
                        setLocation(redirectPage);
                    }, 1500); // Brief delay to show success message
                }
                // Refresh accounts to show updated balances
                fetchAccounts();
            }
            else {
                const errorText = await response.text();
                console.error('Failed to create transaction:', errorText);
                throw new Error(errorText || 'Failed to create transaction');
            }
        }
        catch (error) {
            console.error('Transaction creation error:', error);
            toast({
                title: 'Transaction failed',
                description: error instanceof Error ? error.message : 'Failed to create transaction. Please try again.',
                variant: 'destructive',
            });
        }
        finally {
            setIsProcessing(false);
        }
    };
    const selectedAccount = accounts.find(acc => acc.id.toString() === selectedAccountId);
    const categories = [
        { value: 'admin', label: 'Admin Adjustment' },
        { value: 'transfer', label: 'Transfer' },
        { value: 'deposit', label: 'Deposit' },
        { value: 'withdrawal', label: 'Withdrawal' },
        { value: 'fee', label: 'Fee' },
        { value: 'dividend', label: 'Dividend' },
        { value: 'interest', label: 'Interest' },
        { value: 'bonus', label: 'Bonus' },
        { value: 'refund', label: 'Refund' },
        { value: 'correction', label: 'Correction' }
    ];
    const redirectOptions = [
        { value: '', label: 'Stay on this page' },
        { value: '/dashboard', label: 'Customer Dashboard' },
        { value: '/history', label: 'Transaction History' },
        { value: '/cards', label: 'Cards Page' },
        { value: '/transfer', label: 'Transfer Page' },
        { value: '/simple-admin', label: 'Admin Panel' },
        { value: '/profile-settings', label: 'Profile Settings' },
        { value: '/accounts', label: 'Account Management' },
        { value: '/statements-reports', label: 'Statements & Reports' },
        { value: '/investment-portfolio', label: 'Investment Portfolio' },
        { value: '/banking-services', label: 'Banking Services' }
    ];
    return (_jsx("div", { className: "min-h-screen bg-gray-50 p-4", children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Transaction Creator" }), _jsx("p", { className: "text-gray-600 mt-1", children: "Create transactions for specific customer accounts" })] }), _jsx(Badge, { variant: "outline", className: "bg-purple-50", children: "Admin Tool" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: accounts.map(account => (_jsx(Card, { className: `cursor-pointer transition-all ${selectedAccountId === account.id.toString() ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`, children: _jsxs(CardContent, { className: "p-4", children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: account.accountName }), _jsxs("div", { className: "text-xs text-gray-500 mb-2", children: ["****", account.accountNumber.slice(-4)] }), _jsxs("div", { className: "text-lg font-bold text-green-600", children: ["$", parseFloat(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })] }), _jsx("div", { className: "text-xs text-gray-500 capitalize", children: account.accountType })] }) }, account.id))) }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(PlusCircle, { className: "w-5 h-5 mr-2" }), "Create New Transaction"] }) }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "account", children: "Target Account *" }), _jsxs("select", { id: "account", value: selectedAccountId, onChange: (e) => setSelectedAccountId(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-1", children: [_jsx("option", { value: "", children: "Select Account" }), accounts.map(account => (_jsxs("option", { value: account.id.toString(), children: [account.accountName, " - ****", account.accountNumber.slice(-4), " ($", parseFloat(account.balance).toLocaleString(), ")"] }, account.id)))] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "type", children: "Transaction Type *" }), _jsxs("select", { id: "type", value: transactionType, onChange: (e) => setTransactionType(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-1", children: [_jsx("option", { value: "credit", children: "Credit (Add Money)" }), _jsx("option", { value: "debit", children: "Debit (Remove Money)" })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "amount", children: "Amount (USD) *" }), _jsxs("div", { className: "relative mt-1", children: [_jsx(DollarSign, { className: "absolute left-3 top-3 h-4 w-4 text-gray-400" }), _jsx(Input, { id: "amount", type: "number", step: "0.01", placeholder: "0.00", value: amount, onChange: (e) => setAmount(e.target.value), className: "pl-10" })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "category", children: "Category" }), _jsx("select", { id: "category", value: category, onChange: (e) => setCategory(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-1", children: categories.map(cat => (_jsx("option", { value: cat.value, children: cat.label }, cat.value))) })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "description", children: "Description *" }), _jsx(Input, { id: "description", placeholder: "Transaction description", value: description, onChange: (e) => setDescription(e.target.value), className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "recipient", children: "Recipient Name (Optional)" }), _jsx(Input, { id: "recipient", placeholder: "Recipient name", value: recipientName, onChange: (e) => setRecipientName(e.target.value), className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "bank", children: "Bank Name (Optional)" }), _jsx(Input, { id: "bank", placeholder: "Bank name", value: bankName, onChange: (e) => setBankName(e.target.value), className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "reference", children: "Reference Number (Optional)" }), _jsx(Input, { id: "reference", placeholder: "REF-", value: reference, onChange: (e) => setReference(e.target.value), className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "redirect", children: "Navigate to Page After Transaction" }), _jsx("select", { id: "redirect", value: redirectPage, onChange: (e) => setRedirectPage(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-1", children: redirectOptions.map(option => (_jsx("option", { value: option.value, children: option.label }, option.value))) }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Choose where to navigate after the transaction is created" })] })] })] }), selectedAccount && amount && description && (_jsxs("div", { className: "bg-gray-50 p-4 rounded-lg border", children: [_jsx("h3", { className: "font-medium mb-3", children: "Transaction Preview" }), _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Account:" }), _jsx("p", { className: "font-medium", children: selectedAccount.accountName })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Current Balance:" }), _jsxs("p", { className: "font-medium", children: ["$", parseFloat(selectedAccount.balance).toLocaleString()] })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Transaction:" }), _jsxs("p", { className: `font-medium ${transactionType === 'credit' ? 'text-green-600' : 'text-red-600'}`, children: [transactionType === 'credit' ? '+' : '-', "$", parseFloat(amount || '0').toLocaleString()] })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "New Balance:" }), _jsxs("p", { className: "font-medium text-blue-600", children: ["$", (parseFloat(selectedAccount.balance) + (transactionType === 'credit' ? parseFloat(amount || '0') : -parseFloat(amount || '0'))).toLocaleString()] })] })] })] })), _jsx("div", { className: "flex gap-3 pt-4", children: _jsx(Button, { onClick: handleCreateTransaction, disabled: !selectedAccountId || !amount || !description || isProcessing, className: "flex-1", children: isProcessing ? (_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" }), "Processing..."] })) : (_jsxs("div", { className: "flex items-center", children: [_jsx(FileText, { className: "w-4 h-4 mr-2" }), "Create Transaction", _jsx(ArrowRight, { className: "w-4 h-4 ml-2" })] })) }) })] })] })] }) }));
}
