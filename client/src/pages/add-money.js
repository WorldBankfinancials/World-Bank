import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { CreditCard, Banknote, Building, Smartphone, Plus, Shield, Clock, Wallet, ArrowUpRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
export default function AddMoney() {
    const { t } = useLanguage();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { data: user, isLoading } = useQuery({
        queryKey: ['/api/user'],
    });
    const [selectedMethod, setSelectedMethod] = useState("");
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsx("div", { className: "text-gray-600", children: t('loading') }) }));
    }
    const quickAmounts = ["$50", "$100", "$250", "$500", "$1,000", "$2,500"];
    const addMoneyMethods = [
        {
            id: "debit_card",
            name: "Debit Card",
            description: "Instant transfer from your debit card",
            icon: CreditCard,
            fee: "Free",
            time: "Instant",
            color: "bg-blue-500"
        },
        {
            id: "bank_transfer",
            name: "Bank Transfer",
            description: "Transfer from your bank account",
            icon: Building,
            fee: "Free",
            time: "1-3 business days",
            color: "bg-green-500"
        },
        {
            id: "cash_deposit",
            name: "Cash Deposit",
            description: "Deposit cash at World Bank branches",
            icon: Banknote,
            fee: "Free",
            time: "Instant",
            color: "bg-yellow-500"
        },
        {
            id: "mobile_money",
            name: "Mobile Money",
            description: "Transfer from mobile money services",
            icon: Smartphone,
            fee: "1.5%",
            time: "Instant",
            color: "bg-purple-500"
        }
    ];
    const [recentTransactions, setRecentTransactions] = useState([]);
    useEffect(() => {
        async function fetchDeposits() {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (!authUser)
                    return;
                const { data: bankUser } = await supabase
                    .from('bank_users')
                    .select('id')
                    .eq('supabase_user_id', authUser.id)
                    .single();
                if (bankUser) {
                    const { data: accounts } = await supabase
                        .from('bank_accounts')
                        .select('id')
                        .eq('user_id', bankUser.id);
                    if (accounts && accounts.length > 0) {
                        const { data: deposits } = await supabase
                            .from('transactions')
                            .select('*')
                            .eq('to_account_id', accounts[0].id)
                            .eq('transaction_type', 'deposit')
                            .order('created_at', { ascending: false })
                            .limit(5);
                        setRecentTransactions(deposits?.map(d => ({
                            method: d.description || 'Debit Card',
                            amount: `$${parseFloat(d.amount || '0').toFixed(2)}`,
                            time: new Date(d.created_at).toLocaleDateString(),
                            status: d.status === 'completed' ? 'Completed' : 'Pending'
                        })) || []);
                    }
                }
            }
            catch (error) {
                console.error('Error fetching deposits:', error);
            }
        }
        fetchDeposits();
    }, []);
    const handleAddMoney = async () => {
        if (!selectedMethod || !amount) {
            toast({
                title: 'Missing Information',
                description: 'Please select a payment method and enter an amount.',
                variant: 'destructive',
            });
            return;
        }
        setLoading(true);
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser)
                throw new Error('Not authenticated');
            const { data: bankUser } = await supabase
                .from('bank_users')
                .select('id')
                .eq('supabase_user_id', authUser.id)
                .single();
            if (!bankUser)
                throw new Error('User not found');
            const { data: accounts } = await supabase
                .from('bank_accounts')
                .select('id')
                .eq('user_id', bankUser.id);
            if (!accounts || accounts.length === 0)
                throw new Error('No account found');
            await supabase
                .from('transactions')
                .insert({
                to_account_id: accounts[0].id,
                amount: parseFloat(amount),
                currency: 'USD',
                transaction_type: 'deposit',
                description: `Add Money via ${selectedMethod}`,
                status: 'completed'
            });
            toast({
                title: 'Money Added',
                description: `Successfully added $${amount} to your account!`,
            });
            setAmount("");
            setSelectedMethod("");
            // Invalidate queries to refetch fresh data instead of reloading
            await queryClient.invalidateQueries({ queryKey: ['/api/user'] });
            await queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
            await queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
        }
        catch (error) {
            toast({
                title: 'Operation Failed',
                description: error.message || 'Failed to add money. Please try again.',
                variant: 'destructive',
            });
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(Header, {}), _jsxs("div", { className: "px-4 py-6 pb-20", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold text-gray-900", children: "Add Money" }), _jsx("p", { className: "text-sm text-gray-600", children: "Fund your account instantly" })] }), _jsxs(Badge, { className: "bg-green-100 text-green-800", children: [_jsx(Shield, { className: "w-3 h-3 mr-1" }), "Secure"] })] }), _jsx(Card, { className: "mb-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white", children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-blue-100 text-sm", children: "Current Balance" }), _jsxs("p", { className: "text-2xl font-bold", children: ["$", user?.balance?.toLocaleString() || '0.00'] }), _jsx("p", { className: "text-blue-200 text-sm", children: "Account: 4789-6523-1087-9234" })] }), _jsx(Wallet, { className: "w-8 h-8 text-blue-200" })] }) }) }), _jsxs(Card, { className: "mb-6", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Enter Amount" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx(Input, { type: "number", placeholder: "0.00", value: amount, onChange: (e) => setAmount(e.target.value), className: "text-2xl text-center font-bold" }), _jsx("div", { className: "grid grid-cols-3 gap-2", children: quickAmounts.map((quickAmount, index) => (_jsx(Button, { variant: "outline", size: "sm", onClick: () => setAmount(quickAmount.replace('$', '')), className: "text-xs", children: quickAmount }, index))) })] })] }), _jsxs(Card, { className: "mb-6", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Choose Payment Method" }) }), _jsx(CardContent, { className: "space-y-3", children: addMoneyMethods.map((method) => (_jsx("div", { onClick: () => setSelectedMethod(method.name), className: `p-4 border rounded-lg cursor-pointer transition-colors ${selectedMethod === method.name
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'}`, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: `w-10 h-10 ${method.color} rounded-full flex items-center justify-center`, children: _jsx(method.icon, { className: "w-5 h-5 text-white" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: method.name }), _jsx("p", { className: "text-sm text-gray-600", children: method.description })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-sm font-medium text-green-600", children: method.fee }), _jsx("p", { className: "text-xs text-gray-500", children: method.time })] })] }) }, method.id))) })] }), _jsx(Button, { onClick: handleAddMoney, disabled: !selectedMethod || !amount || loading, className: "w-full bg-blue-600 text-white h-12 text-lg mb-6", children: loading ? (_jsxs(_Fragment, { children: [_jsx(Clock, { className: "w-5 h-5 mr-2 animate-spin" }), "Processing..."] })) : (_jsxs(_Fragment, { children: [_jsx(Plus, { className: "w-5 h-5 mr-2" }), "Add $", amount || "0.00"] })) }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Recent Add Money Transactions" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: recentTransactions && Array.isArray(recentTransactions) && recentTransactions.length > 0 ? recentTransactions.map((transaction, index) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-10 h-10 bg-green-100 rounded-full flex items-center justify-center", children: _jsx(ArrowUpRight, { className: "w-5 h-5 text-green-600" }) }), _jsxs("div", { children: [_jsxs("p", { className: "font-medium text-sm", children: ["Add Money via ", transaction.method] }), _jsx("p", { className: "text-xs text-gray-500", children: transaction.time })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "font-medium text-green-600", children: transaction.amount }), _jsx(Badge, { className: "bg-green-100 text-green-800 text-xs", children: transaction.status })] })] }, index))) : (_jsxs("div", { className: "text-center py-8 text-gray-500", children: [_jsx(Plus, { className: "w-12 h-12 mx-auto mb-4 text-gray-300" }), _jsx("p", { children: "No recent deposits available" })] })) }) })] })] }), _jsx(BottomNavigation, {})] }));
}
