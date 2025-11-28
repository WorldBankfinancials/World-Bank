import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Smartphone, QrCode, Globe, Plus, Send, Eye, EyeOff, History, ArrowUpRight, ArrowDownRight, Scan } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
export default function DigitalWallet() {
    const { t } = useLanguage();
    const { toast } = useToast();
    const { data: user, isLoading } = useQuery({
        queryKey: ['/api/user'],
    });
    const [showBalance, setShowBalance] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsx("div", { className: "text-gray-600", children: t('loading') }) }));
    }
    // Fetch real wallet data from Supabase
    const { data: walletData } = useQuery({
        queryKey: ['/api/wallet-balance'],
        enabled: !!user,
        staleTime: 30000
    });
    const { data: recentTransactions } = useQuery({
        queryKey: ['/api/wallet-transactions'],
        enabled: !!user,
        staleTime: 30000
    });
    const walletBalance = walletData?.balance || user?.balance || 0;
    const quickActions = [
        { icon: Send, label: "Send Money", action: () => window.location.href = "/transfer" },
        { icon: QrCode, label: "QR Pay", action: () => window.location.href = "/mobile-pay" },
        { icon: Plus, label: "Add Funds", action: () => window.location.href = "/add-money" },
        { icon: History, label: "History", action: () => window.location.href = "/history" }
    ];
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(Header, {}), _jsxs("div", { className: "px-4 py-6 pb-20", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold text-gray-900", children: "Digital Wallet" }), _jsx("p", { className: "text-sm text-gray-600", children: "Secure digital payments" })] }), _jsxs(Button, { onClick: () => toast({ title: 'Add Funds', description: 'Redirecting to add funds page...' }), className: "bg-blue-600 text-white", children: [_jsx(Plus, { className: "w-4 h-4 mr-1" }), "Add Funds"] })] }), _jsxs(Card, { className: "mb-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white", children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx(CardTitle, { className: "text-xl mb-2", children: "World Bank Digital Wallet" }), _jsx("p", { className: "text-blue-100", children: "Available Balance" })] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => setShowBalance(!showBalance), className: "text-white hover:bg-blue-700", children: showBalance ? _jsx(EyeOff, { className: "w-4 h-4" }) : _jsx(Eye, { className: "w-4 h-4" }) })] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "mb-6", children: [_jsx("div", { className: "text-3xl font-bold mb-2", children: showBalance ? `$${walletBalance.toLocaleString()}` : "••••••" }), _jsxs("div", { className: "flex items-center space-x-4 text-blue-100", children: [_jsxs("span", { children: ["Account: ", user?.accountNumber || t('loading')] }), _jsx(Badge, { className: "bg-green-500 text-white", children: user?.isActive ? 'Active' : 'Inactive' })] })] }) })] }), _jsxs(Card, { className: "mb-6", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Quick Actions" }) }), _jsx(CardContent, { children: _jsx("div", { className: "grid grid-cols-4 gap-3", children: quickActions.map((action, index) => (_jsxs(Button, { variant: "outline", onClick: action.action, className: "h-16 flex flex-col items-center space-y-2", children: [_jsx(action.icon, { className: "w-5 h-5" }), _jsx("span", { className: "text-xs", children: action.label })] }, index))) }) })] }), _jsxs(Card, { className: "mb-6", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Recent Transactions" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: recentTransactions?.map((transaction, index) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: `w-10 h-10 rounded-full flex items-center justify-center ${transaction.type === 'received' ? 'bg-green-100' : 'bg-red-100'}`, children: transaction.type === 'received' ? (_jsx(ArrowDownRight, { className: "w-5 h-5 text-green-600" })) : (_jsx(ArrowUpRight, { className: "w-5 h-5 text-red-600" })) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-sm", children: transaction.type === 'received' ? `From ${transaction.from}` : `To ${transaction.to}` }), _jsx("p", { className: "text-xs text-gray-500", children: transaction.time })] })] }), _jsx("span", { className: `font-medium ${transaction.type === 'received' ? 'text-green-600' : 'text-red-600'}`, children: transaction.amount })] }, index))) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Payment Methods" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border rounded-lg", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(QrCode, { className: "w-6 h-6 text-blue-600" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: "QR Code Payments" }), _jsx("p", { className: "text-sm text-gray-600", children: "Scan to pay instantly" })] })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => toast({ title: 'QR Scanner', description: 'Opening QR code scanner...' }), children: [_jsx(Scan, { className: "w-4 h-4 mr-1" }), "Scan"] })] }), _jsxs("div", { className: "flex items-center justify-between p-4 border rounded-lg", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(Smartphone, { className: "w-6 h-6 text-green-600" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: "Mobile Transfers" }), _jsx("p", { className: "text-sm text-gray-600", children: "Send to phone numbers" })] })] }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => toast({ title: 'Mobile Transfer', description: 'Opening mobile transfer feature...' }), children: "Send" })] }), _jsxs("div", { className: "flex items-center justify-between p-4 border rounded-lg", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(Globe, { className: "w-6 h-6 text-purple-600" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: "International Payments" }), _jsx("p", { className: "text-sm text-gray-600", children: "Send money worldwide" })] })] }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => toast({ title: 'International Payment', description: 'Opening international transfer feature...' }), children: "Transfer" })] })] }) })] })] }), _jsx(BottomNavigation, {})] }));
}
