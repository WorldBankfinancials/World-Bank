import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Download, ArrowUpRight, ArrowDownRight, Calendar, FileText, TrendingUp, RefreshCw, Plus, DollarSign, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
export default function TransactionHistory() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [user, setUser] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        async function fetchData() {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (!authUser)
                    return;
                const { data: bankUser } = await supabase
                    .from('bank_users')
                    .select('*')
                    .eq('supabase_user_id', authUser.id)
                    .single();
                setUser(bankUser);
                if (bankUser) {
                    const { data: accounts } = await supabase
                        .from('bank_accounts')
                        .select('id')
                        .eq('user_id', bankUser.id);
                    if (accounts && accounts.length > 0) {
                        const { data: txns } = await supabase
                            .from('transactions')
                            .select('*')
                            .or(`from_account_id.eq.${accounts[0].id},to_account_id.eq.${accounts[0].id}`)
                            .order('created_at', { ascending: false });
                        setTransactions(txns || []);
                    }
                }
            }
            catch (error) {
                console.error('Error fetching data:', error);
            }
            finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);
    // Real-time subscription for transaction updates (row-level filtered)
    useEffect(() => {
        if (!user)
            return;
        // Fetch account IDs first to set up row-level filter
        async function setupRealtimeWithFilter() {
            const { data: accounts } = await supabase
                .from('bank_accounts')
                .select('id')
                .eq('user_id', user.id);
            if (!accounts || accounts.length === 0)
                return;
            const accountId = accounts[0].id;
            // Subscribe with row-level filter to only receive updates for this user's transactions
            const channel = supabase
                .channel(`transaction-updates-${accountId}`)
                .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'transactions',
                filter: `from_account_id=eq.${accountId}`
            }, () => {
                console.log('🔄 Transaction data changed, refreshing...');
                // Refetch data when transactions change
                async function refetchData() {
                    try {
                        const { data: { user: authUser } } = await supabase.auth.getUser();
                        if (!authUser)
                            return;
                        const { data: bankUser } = await supabase
                            .from('bank_users')
                            .select('*')
                            .eq('supabase_user_id', authUser.id)
                            .single();
                        if (bankUser) {
                            const { data: accounts } = await supabase
                                .from('bank_accounts')
                                .select('id')
                                .eq('user_id', bankUser.id);
                            if (accounts && accounts.length > 0) {
                                const { data: txns } = await supabase
                                    .from('transactions')
                                    .select('*')
                                    .or(`from_account_id.eq.${accounts[0].id},to_account_id.eq.${accounts[0].id}`)
                                    .order('created_at', { ascending: false });
                                setTransactions(txns || []);
                            }
                        }
                    }
                    catch (error) {
                        console.error('Error refetching transactions:', error);
                    }
                }
                refetchData();
            })
                .subscribe();
            return () => {
                channel.unsubscribe();
            };
        }
        const cleanup = setupRealtimeWithFilter();
        return () => {
            cleanup.then(cleanupFn => cleanupFn?.());
        };
    }, [user]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        amount: '',
        type: 'credit',
        description: '',
        category: 'general',
        adminNotes: ''
    });
    const createTransactionMutation = useMutation({
        mutationFn: async (data) => {
            const { authenticatedFetch } = await import('@/lib/queryClient');
            const response = await authenticatedFetch('/api/admin/create-transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    accountId: 1,
                    amount: parseFloat(data.amount),
                    type: data.type,
                    description: data.description,
                    category: data.category,
                    adminNotes: data.adminNotes,
                    status: 'completed'
                }),
            });
            if (!response.ok)
                throw new Error('Failed to create transaction');
            return response.json();
        },
        onSuccess: () => {
            toast({
                title: "Transaction Created",
                description: "Transaction has been successfully created and processed.",
            });
            setIsCreateDialogOpen(false);
            setFormData({
                amount: '',
                type: 'credit',
                description: '',
                category: 'general',
                adminNotes: ''
            });
            refetchTransactions();
            queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to create transaction. Please try again.",
                variant: "destructive",
            });
        },
    });
    const exportTransactions = () => {
        if (!transactions || transactions.length === 0) {
            toast({
                title: "No Data",
                description: "No transactions available to export.",
                variant: "destructive",
            });
            return;
        }
        const csvContent = [
            ['Date', 'Description', 'Category', 'Type', 'Amount', 'Status'].join(','),
            ...transactions.map(t => [
                new Date(t.createdAt || new Date()).toLocaleDateString(),
                `"${t.description || ''}"`,
                t.category || 'General',
                t.type === 'credit' ? 'Credit' : 'Debit',
                String(t.amount || '0'),
                t.status || 'pending'
            ].join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({
            title: "Export Complete",
            description: "Transaction history has been exported successfully.",
        });
    };
    const filteredTransactions = transactions?.filter(transaction => {
        const matchesSearch = (transaction.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (transaction.category || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === "all" || transaction.type === filterType;
        const matchesStatus = filterStatus === "all" || (transaction.status || '').toLowerCase() === filterStatus;
        return matchesSearch && matchesType && matchesStatus;
    }) || [];
    const getStatusIcon = (status) => {
        const statusLower = (status || '').toLowerCase();
        switch (statusLower) {
            case 'completed': return _jsx(CheckCircle, { className: "w-4 h-4 text-green-600" });
            case 'pending': return _jsx(Clock, { className: "w-4 h-4 text-yellow-600" });
            case 'failed': return _jsx(XCircle, { className: "w-4 h-4 text-red-600" });
            default: return _jsx(AlertCircle, { className: "w-4 h-4 text-gray-600" });
        }
    };
    const getStatusColor = (status) => {
        const statusLower = (status || '').toLowerCase();
        switch (statusLower) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'failed': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    const formatAmount = (amount, type) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
        const formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(Math.abs(numAmount));
        return type === 'credit' ? `+${formatted}` : `-${formatted}`;
    };
    const calculateTotals = () => {
        const credits = filteredTransactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + parseFloat(String(t.amount || '0')), 0);
        const debits = filteredTransactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + parseFloat(String(t.amount || '0')), 0);
        return { credits, debits, net: credits - debits };
    };
    const totals = calculateTotals();
    const refetchTransactions = async () => {
        setLoading(true);
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser)
                return;
            const { data: bankUser } = await supabase
                .from('bank_users')
                .select('*')
                .eq('supabase_user_id', authUser.id)
                .single();
            if (bankUser) {
                const { data: accounts } = await supabase
                    .from('bank_accounts')
                    .select('id')
                    .eq('user_id', bankUser.id);
                if (accounts && accounts.length > 0) {
                    const { data: txns } = await supabase
                        .from('transactions')
                        .select('*')
                        .or(`from_account_id.eq.${accounts[0].id},to_account_id.eq.${accounts[0].id}`)
                        .order('created_at', { ascending: false });
                    setTransactions(txns || []);
                }
            }
        }
        finally {
            setLoading(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(RefreshCw, { className: "w-5 h-5 animate-spin text-blue-600" }), _jsx("span", { className: "text-gray-600", children: "Loading transaction history..." })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(Header, { user: user }), _jsxs("div", { className: "px-4 py-6 pb-20", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Transaction History" }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Comprehensive transaction management and reporting" })] }), _jsxs("div", { className: "flex space-x-2", children: [user?.role === 'admin' && (_jsxs(Dialog, { open: isCreateDialogOpen, onOpenChange: setIsCreateDialogOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { size: "sm", className: "bg-blue-600 hover:bg-blue-700", children: [_jsx(Plus, { className: "w-4 h-4 mr-1" }), "Create Transaction"] }) }), _jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Create New Transaction" }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Amount" }), _jsx(Input, { type: "number", step: "0.01", placeholder: "0.00", value: formData.amount, onChange: (e) => setFormData(prev => ({ ...prev, amount: e.target.value })) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Type" }), _jsxs(Select, { value: formData.type, onValueChange: (value) => setFormData(prev => ({ ...prev, type: value })), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "credit", children: "Credit (+)" }), _jsx(SelectItem, { value: "debit", children: "Debit (-)" })] })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Description" }), _jsx(Input, { placeholder: "Transaction description", value: formData.description, onChange: (e) => setFormData(prev => ({ ...prev, description: e.target.value })) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Category" }), _jsxs(Select, { value: formData.category, onValueChange: (value) => setFormData(prev => ({ ...prev, category: value })), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "general", children: "General" }), _jsx(SelectItem, { value: "salary", children: "Salary" }), _jsx(SelectItem, { value: "transfer", children: "Transfer" }), _jsx(SelectItem, { value: "investment", children: "Investment" }), _jsx(SelectItem, { value: "fees", children: "Fees" }), _jsx(SelectItem, { value: "bonus", children: "Bonus" }), _jsx(SelectItem, { value: "withdrawal", children: "Withdrawal" }), _jsx(SelectItem, { value: "deposit", children: "Deposit" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Admin Notes" }), _jsx(Textarea, { placeholder: "Internal notes (optional)", value: formData.adminNotes, onChange: (e) => setFormData(prev => ({ ...prev, adminNotes: e.target.value })), rows: 3 })] }), _jsxs("div", { className: "flex justify-end space-x-2 pt-4", children: [_jsx(Button, { variant: "outline", onClick: () => setIsCreateDialogOpen(false), children: "Cancel" }), _jsx(Button, { onClick: () => createTransactionMutation.mutate(formData), disabled: !formData.amount || !formData.description || createTransactionMutation.isPending, className: "bg-blue-600 hover:bg-blue-700", children: createTransactionMutation.isPending ? 'Creating...' : 'Create Transaction' })] })] })] })] })), _jsxs(Button, { size: "sm", variant: "outline", onClick: exportTransactions, children: [_jsx(Download, { className: "w-4 h-4 mr-1" }), "Export"] }), _jsxs(Button, { size: "sm", variant: "outline", onClick: () => refetchTransactions(), children: [_jsx(RefreshCw, { className: "w-4 h-4 mr-1" }), "Refresh"] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 mb-6", children: [_jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Total Transactions" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: filteredTransactions.length })] }), _jsx(FileText, { className: "w-8 h-8 text-blue-600" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Total Credits" }), _jsxs("p", { className: "text-2xl font-bold text-green-600", children: ["$", totals.credits.toLocaleString()] })] }), _jsx(TrendingUp, { className: "w-8 h-8 text-green-600" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Total Debits" }), _jsxs("p", { className: "text-2xl font-bold text-red-600", children: ["$", totals.debits.toLocaleString()] })] }), _jsx(ArrowUpRight, { className: "w-8 h-8 text-red-600" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Net Balance" }), _jsxs("p", { className: "text-2xl font-bold text-blue-600", children: ["$", totals.net.toLocaleString()] })] }), _jsx(DollarSign, { className: "w-8 h-8 text-blue-600" })] }) }) })] }), _jsxs(Card, { className: "mb-6", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: "Filter Transactions" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Search" }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx(Input, { placeholder: "Search transactions...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "pl-10" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Type" }), _jsxs(Select, { value: filterType, onValueChange: setFilterType, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Types" }), _jsx(SelectItem, { value: "credit", children: "Credits" }), _jsx(SelectItem, { value: "debit", children: "Debits" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Status" }), _jsxs(Select, { value: filterStatus, onValueChange: setFilterStatus, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Status" }), _jsx(SelectItem, { value: "completed", children: "Completed" }), _jsx(SelectItem, { value: "pending", children: "Pending" }), _jsx(SelectItem, { value: "failed", children: "Failed" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Date Range" }), _jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(Calendar, { className: "w-4 h-4 mr-2" }), "Last 30 Days"] })] })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: "Transaction Details" }) }), _jsx(CardContent, { children: filteredTransactions.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(FileText, { className: "mx-auto h-12 w-12 text-gray-400" }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "No transactions found" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: searchTerm || filterType !== 'all' || filterStatus !== 'all'
                                                ? 'Try adjusting your search criteria.'
                                                : 'No transactions have been recorded yet.' })] })) : (_jsx("div", { className: "space-y-4", children: filteredTransactions.map((transaction, index) => (_jsx("div", { className: "border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: `w-12 h-12 rounded-full flex items-center justify-center ${transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'}`, children: transaction.type === 'credit' ? (_jsx(ArrowDownRight, { className: "w-6 h-6 text-green-600" })) : (_jsx(ArrowUpRight, { className: "w-6 h-6 text-red-600" })) }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-semibold text-gray-900", children: transaction.description }), _jsxs("div", { className: "flex items-center space-x-2 mt-1", children: [_jsx(Badge, { variant: "outline", children: transaction.category || 'General' }), _jsxs("div", { className: "flex items-center space-x-1", children: [getStatusIcon(transaction.status || ''), _jsx(Badge, { className: getStatusColor(transaction.status || ''), children: (transaction.status || 'pending').charAt(0).toUpperCase() + (transaction.status || 'pending').slice(1) })] })] }), _jsxs("p", { className: "text-sm text-gray-500 flex items-center mt-1", children: [_jsx(Clock, { className: "w-3 h-3 mr-1" }), new Date(transaction.createdAt || new Date()).toLocaleDateString('en-US', {
                                                                            year: 'numeric',
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        })] })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: `text-xl font-bold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`, children: formatAmount(transaction.amount || '0', transaction.type) }), _jsx("p", { className: "text-sm text-gray-500", children: transaction.type === 'credit' ? 'Credit' : 'Debit' })] })] }) }, transaction.id || index))) })) })] })] }), _jsx(BottomNavigation, {})] }));
}
