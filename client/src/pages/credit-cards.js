import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Plus, Eye, EyeOff, Settings, MoreHorizontal, Lock, Smartphone, DollarSign } from "lucide-react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
export default function CreditCards() {
    const { t } = useLanguage();
    // CRITICAL FIX: Move ALL hooks before ANY conditional returns
    // Prevents "Rendered more hooks than during the previous render" error
    const { data: user, isLoading } = useQuery({
        queryKey: ['/api/user'],
    });
    const { data: creditCards } = useQuery({
        queryKey: ['/api/cards'],
        staleTime: 30000
    });
    const { data: recentTransactions } = useQuery({
        queryKey: ['/api/card-transactions'],
        staleTime: 30000
    });
    const [showCardNumbers, setShowCardNumbers] = useState(false);
    const [selectedCard, setSelectedCard] = useState(0);
    const [showTransactions, setShowTransactions] = useState(true);
    // NOW safe to return early - all hooks are called
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsx("div", { className: "text-gray-600", children: t('loading') }) }));
    }
    const quickActions = [
        { icon: Lock, label: t('lock_card'), action: () => console.log("Card locked") },
        { icon: Smartphone, label: t('mobile_pay'), action: () => console.log("Mobile pay activated") },
        { icon: DollarSign, label: t('pay_bill'), action: () => console.log("Redirecting to payment") },
        { icon: Settings, label: t('settings'), action: () => console.log("Card settings opened") }
    ];
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(Header, {}), _jsxs("div", { className: "px-4 py-6 pb-20", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h1", { className: "text-xl font-semibold text-gray-900", children: t('my_cards') }), _jsxs(Button, { size: "sm", className: "bg-blue-600 text-white", children: [_jsx(Plus, { className: "w-4 h-4 mr-1" }), t('add_card')] })] }), _jsx("div", { className: "space-y-4", children: creditCards && Array.isArray(creditCards) && creditCards.length > 0 ? creditCards.map((card) => (_jsx(Card, { className: `bg-gradient-to-r ${card.color} text-white relative overflow-hidden`, children: _jsxs(CardContent, { className: "p-6", children: [_jsxs("div", { className: "flex items-start justify-between mb-6", children: [_jsxs("div", { children: [_jsx("p", { className: "text-blue-100 text-sm mb-1", children: card.name }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "text-lg font-mono", children: showCardNumbers ? card.number : card.maskedNumber }), _jsx("button", { onClick: () => setShowCardNumbers(!showCardNumbers), className: "text-blue-100 hover:text-white", children: showCardNumbers ? _jsx(EyeOff, { className: "w-4 h-4" }) : _jsx(Eye, { className: "w-4 h-4" }) })] })] }), _jsx(MoreHorizontal, { className: "w-5 h-5 text-blue-100" })] }), _jsxs("div", { className: "flex items-end justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-blue-100 text-xs", children: "Valid Thru" }), _jsx("p", { className: "text-sm font-medium", children: card.expiry })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-blue-100 text-xs", children: "Available Credit" }), _jsxs("p", { className: "text-lg font-semibold", children: ["$", parseFloat(card.availableCredit).toLocaleString()] })] })] }), _jsxs("div", { className: "mt-4", children: [_jsxs("div", { className: "flex justify-between text-xs text-blue-100 mb-1", children: [_jsxs("span", { children: ["Used: $", parseFloat(card.balance).toLocaleString()] }), _jsxs("span", { children: ["Limit: $", parseFloat(card.limit).toLocaleString()] })] }), _jsx("div", { className: "w-full bg-blue-800 rounded-full h-2", children: _jsx("div", { className: "bg-white rounded-full h-2", style: { width: `${(parseFloat(card.balance) / parseFloat(card.limit)) * 100}%` } }) })] })] }) }, card.id))) : (_jsxs("div", { className: "text-center py-12", children: [_jsx(CreditCard, { className: "w-16 h-16 mx-auto mb-4 text-gray-300" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: t('no_credit_cards') }), _jsx("p", { className: "text-gray-500 mb-6", children: t('you_dont_have_any_credit_cards_yet') }), _jsxs(Button, { className: "bg-blue-600 text-white", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), t('apply_for_card')] })] })) }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: t('quick_actions') }) }), _jsx(CardContent, { children: _jsx("div", { className: "grid grid-cols-4 gap-3", children: quickActions.map((action, index) => (_jsxs(Button, { variant: "outline", onClick: action.action, className: "h-16 flex flex-col items-center space-y-2", children: [_jsx(action.icon, { className: "w-5 h-5" }), _jsx("span", { className: "text-xs", children: action.label })] }, index))) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: t('recent_transactions') }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: recentTransactions && Array.isArray(recentTransactions) && recentTransactions.length > 0 ? recentTransactions.map((transaction, index) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center", children: _jsx(CreditCard, { className: "w-5 h-5 text-gray-600" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-sm", children: transaction.description }), _jsxs("p", { className: "text-xs text-gray-500", children: [transaction.category, " \u2022 ", transaction.date] })] })] }), _jsxs("span", { className: "font-medium text-red-600", children: ["-$", transaction.amount] })] }, index))) : (_jsxs("div", { className: "text-center py-8 text-gray-500", children: [_jsx(CreditCard, { className: "w-12 h-12 mx-auto mb-4 text-gray-300" }), _jsx("p", { children: t('no_recent_transactions_available') })] })) }) })] })] }), _jsx(BottomNavigation, {})] }));
}
