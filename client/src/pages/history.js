import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, Download, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
export default function History() {
    const { t } = useLanguage();
    const { toast } = useToast();
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAccount, setSelectedAccount] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const fetchAccounts = async () => {
        try {
            const { authenticatedFetch } = await import('@/lib/queryClient');
            const response = await authenticatedFetch('/api/accounts');
            if (response.ok) {
                const data = await response.json();
                setAccounts(data);
            }
            else {
                toast({
                    title: 'Error loading accounts',
                    description: 'Unable to load your accounts. Please try again.',
                    variant: 'destructive',
                });
            }
        }
        catch (error) {
            toast({
                title: 'Network error',
                description: 'Unable to connect to the server. Please check your connection.',
                variant: 'destructive',
            });
        }
    };
    const fetchAllTransactions = async () => {
        try {
            setLoading(true);
            const { authenticatedFetch } = await import('@/lib/queryClient');
            const accountPromises = accounts.map(account => authenticatedFetch(`/api/accounts/${account.id}/transactions`).then(async (res) => {
                if (!res.ok)
                    throw new Error(`Failed to fetch transactions for account ${account.id}`);
                return res.json();
            }));
            const allTransactionArrays = await Promise.all(accountPromises);
            const allTransactions = allTransactionArrays.flat();
            // Sort by date (newest first)
            allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setTransactions(allTransactions);
        }
        catch (error) {
            toast({
                title: 'Error loading transactions',
                description: 'Unable to load transaction history. Please try again.',
                variant: 'destructive',
            });
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchAccounts();
    }, []);
    useEffect(() => {
        if (accounts.length > 0) {
            fetchAllTransactions();
        }
    }, [accounts]);
    const filteredTransactions = transactions.filter(transaction => {
        const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.amount.includes(searchTerm) ||
            (transaction.recipientName && transaction.recipientName.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesAccount = selectedAccount === 'all' || transaction.accountId.toString() === selectedAccount;
        const matchesCategory = selectedCategory === 'all' || transaction.category === selectedCategory;
        return matchesSearch && matchesAccount && matchesCategory;
    });
    const getAccountName = (accountId) => {
        const account = accounts.find(acc => acc.id === accountId);
        return account ? account.accountName : `Account ${accountId}`;
    };
    const formatAmount = (amount, type) => {
        const numAmount = parseFloat(amount);
        const sign = type === 'credit' ? '+' : '-';
        return `${sign}$${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };
    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'failed': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    const getCategoryColor = (category) => {
        switch (category.toLowerCase()) {
            case 'transfer': return 'bg-blue-100 text-blue-800';
            case 'admin': return 'bg-purple-100 text-purple-800';
            case 'dividend': return 'bg-green-100 text-green-800';
            case 'fee': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    const categories = ['all', ...Array.from(new Set(transactions.map(t => t.category)))];
    return (_jsx("div", { className: "min-h-screen bg-gray-50 p-4", children: _jsxs("div", { className: "max-w-6xl mx-auto space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: t('transaction_history') }), _jsx("p", { className: "text-gray-600 mt-1", children: t('view_all_transactions') })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { onClick: fetchAllTransactions, variant: "outline", size: "sm", children: [_jsx(RefreshCw, { className: "w-4 h-4 mr-2" }), t('refresh')] }), _jsxs(Button, { variant: "outline", size: "sm", children: [_jsx(Download, { className: "w-4 h-4 mr-2" }), t('export')] })] })] }), _jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-3 h-4 w-4 text-gray-400" }), _jsx(Input, { placeholder: t('search_transactions'), value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "pl-10" })] }), _jsxs("select", { value: selectedAccount, onChange: (e) => setSelectedAccount(e.target.value), className: "px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "all", children: t('all_accounts') }), accounts.map(account => (_jsxs("option", { value: account.id.toString(), children: [account.accountName, " (****", account.accountNumber.slice(-4), ")"] }, account.id)))] }), _jsxs("select", { value: selectedCategory, onChange: (e) => setSelectedCategory(e.target.value), className: "px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "all", children: t('all_categories') }), categories.filter(cat => cat !== 'all').map(category => (_jsx("option", { value: category, children: category.charAt(0).toUpperCase() + category.slice(1) }, category)))] }), _jsxs(Button, { variant: "outline", className: "w-full", children: [_jsx(Calendar, { className: "w-4 h-4 mr-2" }), t('date_range')] })] }) }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsx(Card, { children: _jsxs(CardContent, { className: "p-4", children: [_jsx("div", { className: "text-sm text-gray-600", children: t('total_transactions') }), _jsx("div", { className: "text-2xl font-bold", children: filteredTransactions.length })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-4", children: [_jsx("div", { className: "text-sm text-gray-600", children: t('total_credits') }), _jsxs("div", { className: "text-2xl font-bold text-green-600", children: ["$", filteredTransactions
                                                .filter(t => t.type === 'credit')
                                                .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                                                .toLocaleString('en-US', { minimumFractionDigits: 2 })] })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-4", children: [_jsx("div", { className: "text-sm text-gray-600", children: t('total_debits') }), _jsxs("div", { className: "text-2xl font-bold text-red-600", children: ["$", filteredTransactions
                                                .filter(t => t.type === 'debit')
                                                .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                                                .toLocaleString('en-US', { minimumFractionDigits: 2 })] })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center justify-between", children: [_jsx("span", { children: t('recent_transactions') }), _jsxs(Badge, { variant: "outline", children: [filteredTransactions.length, " ", t('transactions')] })] }) }), _jsx(CardContent, { children: loading ? (_jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" }), _jsx("p", { className: "mt-2 text-gray-600", children: t('loading_transactions') })] })) : filteredTransactions.length === 0 ? (_jsx("div", { className: "text-center py-8 text-gray-500", children: _jsx("p", { children: t('no_transactions_found') }) })) : (_jsx("div", { className: "space-y-3", children: filteredTransactions.map((transaction) => (_jsx("div", { className: "border rounded-lg p-4 hover:bg-gray-50 transition-colors", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("h3", { className: "font-medium text-gray-900", children: transaction.description }), _jsx(Badge, { className: getCategoryColor(transaction.category), children: transaction.category }), _jsx(Badge, { className: getStatusColor(transaction.status), children: transaction.status })] }), _jsxs("div", { className: "text-sm text-gray-600 space-y-1", children: [_jsxs("p", { children: [t('account'), ": ", getAccountName(transaction.accountId)] }), _jsxs("p", { children: [t('date'), ": ", new Date(transaction.date).toLocaleDateString()] }), transaction.recipientName && (_jsxs("p", { children: [t('recipient'), ": ", transaction.recipientName] })), transaction.bankName && (_jsxs("p", { children: [t('bank'), ": ", transaction.bankName] }))] })] }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: `text-lg font-semibold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`, children: formatAmount(transaction.amount, transaction.type) }), _jsxs("div", { className: "text-xs text-gray-500", children: ["ID: ", transaction.id] })] })] }) }, transaction.id))) })) })] })] }) }));
}
