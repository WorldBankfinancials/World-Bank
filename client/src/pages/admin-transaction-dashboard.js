import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Plus, DollarSign, ArrowUpRight, ArrowDownLeft, RefreshCw, Filter, Search, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
export default function AdminTransactionDashboard() {
    const { toast } = useToast();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newTransaction, setNewTransaction] = useState({
        customer_id: '',
        amount: '',
        description: '',
        type: 'credit',
        category: 'deposit'
    });
    const fetchTransactions = async () => {
        const { authenticatedFetch } = await import('@/lib/queryClient');
        setLoading(true);
        try {
            const response = await authenticatedFetch('/api/admin/transactions');
            if (response.ok) {
                const data = await response.json();
                setTransactions(data);
            }
            else {
                console.error('Failed to fetch transactions:', await response.text());
                toast({
                    title: 'Error loading transactions',
                    description: 'Unable to load transactions. Please try again.',
                    variant: 'destructive',
                });
            }
        }
        catch (error) {
            console.error('Failed to fetch transactions:', error);
            toast({
                title: 'Network error',
                description: 'Unable to connect to the server. Please check your connection.',
                variant: 'destructive',
            });
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchTransactions();
    }, []);
    const createTransaction = async () => {
        const { authenticatedFetch } = await import('@/lib/queryClient');
        try {
            const response = await authenticatedFetch('/api/admin/create-transaction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...newTransaction,
                    amount: parseFloat(newTransaction.amount)
                }),
            });
            if (response.ok) {
                setNewTransaction({
                    customer_id: '',
                    amount: '',
                    description: '',
                    type: 'credit',
                    category: 'deposit'
                });
                setShowCreateForm(false);
                fetchTransactions();
                toast({
                    title: 'Transaction created',
                    description: 'The transaction has been created successfully.',
                });
            }
            else {
                const errorText = await response.text();
                console.error('Failed to create transaction:', errorText);
                throw new Error(errorText || 'Failed to create transaction');
            }
        }
        catch (error) {
            console.error('Failed to create transaction:', error);
            toast({
                title: 'Transaction failed',
                description: error instanceof Error ? error.message : 'Failed to create transaction. Please try again.',
                variant: 'destructive',
            });
        }
    };
    const formatAmount = (amount, type) => {
        const formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(Math.abs(amount));
        return type === 'credit' ? `+${formatted}` : `-${formatted}`;
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-100';
            case 'pending': return 'text-yellow-600 bg-yellow-100';
            case 'failed': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Transaction Management Dashboard" }), _jsx("p", { className: "text-gray-600", children: "Manage customer transactions and account activities" })] }), _jsx("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6", children: _jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("button", { onClick: () => setShowCreateForm(true), className: "flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: [_jsx(Plus, { className: "w-4 h-4" }), _jsx("span", { children: "Create Transaction" })] }), _jsxs("button", { onClick: fetchTransactions, disabled: loading, className: "flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors", children: [_jsx(RefreshCw, { className: `w-4 h-4 ${loading ? 'animate-spin' : ''}` }), _jsx("span", { children: "Refresh" })] })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx("input", { type: "text", placeholder: "Search transactions...", className: "pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("button", { className: "flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50", children: [_jsx(Filter, { className: "w-4 h-4" }), _jsx("span", { children: "Filter" })] })] })] }) }), showCreateForm && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-xl p-6 max-w-md w-full mx-4", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Create New Transaction" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Customer ID" }), _jsx("input", { type: "text", value: newTransaction.customer_id, onChange: (e) => setNewTransaction({ ...newTransaction, customer_id: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", placeholder: "Enter customer ID (e.g., 1)" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Amount" }), _jsx("input", { type: "number", value: newTransaction.amount, onChange: (e) => setNewTransaction({ ...newTransaction, amount: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", placeholder: "0.00", step: "0.01" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Type" }), _jsxs("select", { value: newTransaction.type, onChange: (e) => setNewTransaction({ ...newTransaction, type: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "credit", children: "Credit (Add Money)" }), _jsx("option", { value: "debit", children: "Debit (Remove Money)" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Category" }), _jsxs("select", { value: newTransaction.category, onChange: (e) => setNewTransaction({ ...newTransaction, category: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "deposit", children: "Deposit" }), _jsx("option", { value: "withdrawal", children: "Withdrawal" }), _jsx("option", { value: "transfer", children: "Transfer" }), _jsx("option", { value: "fee", children: "Fee" }), _jsx("option", { value: "interest", children: "Interest" }), _jsx("option", { value: "adjustment", children: "Adjustment" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Description" }), _jsx("input", { type: "text", value: newTransaction.description, onChange: (e) => setNewTransaction({ ...newTransaction, description: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", placeholder: "Transaction description" })] })] }), _jsxs("div", { className: "flex justify-end space-x-3 mt-6", children: [_jsx("button", { onClick: () => setShowCreateForm(false), className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50", children: "Cancel" }), _jsx("button", { onClick: createTransaction, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: "Create Transaction" })] })] }) })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-6", children: [_jsx("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Total Transactions" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: transactions.length })] }), _jsx("div", { className: "p-3 bg-blue-100 rounded-full", children: _jsx(DollarSign, { className: "w-6 h-6 text-blue-600" }) })] }) }), _jsx("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Credits Today" }), _jsx("p", { className: "text-2xl font-bold text-green-600", children: transactions.filter(t => t.type === 'credit').length })] }), _jsx("div", { className: "p-3 bg-green-100 rounded-full", children: _jsx(ArrowUpRight, { className: "w-6 h-6 text-green-600" }) })] }) }), _jsx("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Debits Today" }), _jsx("p", { className: "text-2xl font-bold text-red-600", children: transactions.filter(t => t.type === 'debit').length })] }), _jsx("div", { className: "p-3 bg-red-100 rounded-full", children: _jsx(ArrowDownLeft, { className: "w-6 h-6 text-red-600" }) })] }) }), _jsx("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Pending" }), _jsx("p", { className: "text-2xl font-bold text-yellow-600", children: transactions.filter(t => t.status === 'pending').length })] }), _jsx("div", { className: "p-3 bg-yellow-100 rounded-full", children: _jsx(Calendar, { className: "w-6 h-6 text-yellow-600" }) })] }) })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-200", children: _jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Recent Transactions" }) }), _jsxs("div", { className: "overflow-x-auto", children: [_jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Transaction" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Customer" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Amount" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Date" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: transactions.map((transaction) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: `p-2 rounded-full mr-3 ${transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'}`, children: transaction.type === 'credit' ? (_jsx(ArrowUpRight, { className: "w-4 h-4 text-green-600" })) : (_jsx(ArrowDownLeft, { className: "w-4 h-4 text-red-600" })) }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: transaction.description }), _jsx("div", { className: "text-sm text-gray-500", children: transaction.category })] })] }) }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap", children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: transaction.customer_name || 'N/A' }), _jsx("div", { className: "text-sm text-gray-500", children: transaction.account_number || 'N/A' })] }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: `text-sm font-medium ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`, children: formatAmount(transaction.amount, transaction.type) }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`, children: transaction.status }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: new Date(transaction.created_at).toLocaleDateString() })] }, transaction.id))) })] }), transactions.length === 0 && (_jsxs("div", { className: "text-center py-12", children: [_jsx(DollarSign, { className: "mx-auto h-12 w-12 text-gray-400" }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "No transactions" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Get started by creating a new transaction." })] }))] })] })] }) }));
}
