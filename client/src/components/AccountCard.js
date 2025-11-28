import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { CreditCard, Eye, EyeOff } from 'lucide-react';
export default function AccountCard({ account, transactions = [], showBalance = true, onToggleBalance, }) {
    const { userProfile } = useAuth();
    if (!account) {
        return (_jsx(Card, { className: "mb-4", children: _jsx(CardContent, { className: "p-6", children: _jsx("div", { className: "text-center text-gray-500", children: "Loading account information..." }) }) }));
    }
    const formatCurrency = (amount, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };
    const recentTransactions = transactions.slice(0, 3);
    return (_jsxs(Card, { className: "mb-4", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(CreditCard, { className: "w-5 h-5 text-blue-600" }), _jsx("span", { children: account.account_name || `${account.account_type} Account` })] }), _jsx(Badge, { variant: account.is_active ? 'default' : 'secondary', children: account.is_active ? 'Active' : 'Inactive' })] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Account Number" }), _jsxs("p", { className: "font-mono text-lg", children: ["****", account.account_number.slice(-4)] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Available Balance" }), _jsx("p", { className: "text-2xl font-bold text-green-600", children: showBalance
                                                ? formatCurrency(userProfile?.balance || account.balance, account.currency)
                                                : '••••••' })] }), onToggleBalance && (_jsx("button", { onClick: onToggleBalance, className: "p-2 hover:bg-gray-100 rounded-full", children: showBalance ? _jsx(EyeOff, { className: "w-4 h-4" }) : _jsx(Eye, { className: "w-4 h-4" }) }))] }), recentTransactions.length > 0 && (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600 mb-2", children: "Recent Transactions" }), _jsx("div", { className: "space-y-2", children: recentTransactions.map((transaction) => (_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-700", children: transaction.description }), _jsxs("span", { className: `font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`, children: [transaction.amount >= 0 ? '+' : '', formatCurrency(Math.abs(transaction.amount))] })] }, transaction.id))) })] }))] }) })] }));
}
