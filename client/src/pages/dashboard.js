import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import BottomNavigation from "@/components/BottomNavigation";
import { Avatar } from "@/components/Avatar";
import LiveChat from "@/components/LiveChat";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePresence } from "@/hooks/usePresence";
import { Eye, EyeOff, ArrowUpRight, ArrowDownRight, Plus, Send, Download, Bell, Settings, LogOut, CreditCard, Shield, HelpCircle, UserCircle, Globe, Check, Building2, TrendingUp, Wallet, RotateCcw, QrCode, Copy, Clock, CheckCircle, Smartphone, Banknote } from "lucide-react";
import { Link, useLocation } from "wouter";
// Transfer Section Component
function TransferSection() {
    const { t } = useLanguage();
    const [transferAmount, setTransferAmount] = useState("");
    const [recipient, setRecipient] = useState("");
    const [transferType, setTransferType] = useState("quick");
    const [isProcessing, setIsProcessing] = useState(false);
    const handleTransfer = async () => {
        if (!transferAmount || !recipient) {
            return;
        }
        setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setTransferAmount("");
        setRecipient("");
        setIsProcessing(false);
    };
    return (_jsx("div", { className: "px-4 mb-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center space-x-2", children: [_jsx(Send, { className: "w-5 h-5 text-blue-600" }), _jsx("span", { children: t('transfer_money') })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "transfer-amount", children: t('amount') }), _jsx(Input, { id: "transfer-amount", type: "number", placeholder: "0.00", value: transferAmount, onChange: (e) => setTransferAmount(e.target.value) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "recipient", children: t('send_to') }), _jsx(Input, { id: "recipient", placeholder: t('account_email_phone_placeholder'), value: recipient, onChange: (e) => setRecipient(e.target.value) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "transfer-type", children: t('transfer_type') }), _jsxs(Select, { value: transferType, onValueChange: setTransferType, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: t('select_transfer_type') }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "quick", children: t('quick_send') }), _jsx(SelectItem, { value: "international", children: t('international') }), _jsx(SelectItem, { value: "bank", children: t('bank_transfer') }), _jsx(SelectItem, { value: "mobile", children: t('mobile_money') })] })] })] }), _jsx(Button, { onClick: handleTransfer, disabled: !transferAmount || !recipient || isProcessing, className: "w-full bg-blue-600 text-white", children: isProcessing ? (_jsxs(_Fragment, { children: [_jsx(Clock, { className: "w-4 h-4 mr-2 animate-spin" }), t('processing_transfer')] })) : (_jsxs(_Fragment, { children: [_jsx(Send, { className: "w-4 h-4 mr-2" }), t('send_amount'), " $", transferAmount || "0.00"] })) })] })] }) }));
}
// Receive Section Component
function ReceiveSection() {
    const { t } = useLanguage();
    const { data: user } = useQuery({
        queryKey: ['/api/user'],
    });
    const [requestAmount, setRequestAmount] = useState("");
    const [showQR, setShowQR] = useState(false);
    const [copied, setCopied] = useState(false);
    const accountDetails = {
        name: user?.fullName || "Account Holder",
        accountNumber: user?.accountNumber || t('loading'),
        accountId: user?.accountId || t('loading')
    };
    const handleCopyDetails = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    const handleRequestMoney = () => {
        if (!requestAmount) {
            return;
        }
        setRequestAmount("");
    };
    return (_jsx("div", { className: "px-4 mb-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center space-x-2", children: [_jsx(ArrowDownRight, { className: "w-5 h-5 text-green-600" }), _jsx("span", { children: "Receive Money" })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "flex space-x-2", children: [_jsx(Input, { type: "number", placeholder: "Request amount", value: requestAmount, onChange: (e) => setRequestAmount(e.target.value), className: "flex-1" }), _jsx(Button, { onClick: handleRequestMoney, className: "bg-green-600 text-white", children: "Request" })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsxs(Button, { onClick: () => setShowQR(!showQR), variant: "outline", className: "flex-1", children: [_jsx(QrCode, { className: "w-4 h-4 mr-2" }), "QR Code"] }), _jsxs(Button, { onClick: () => handleCopyDetails(accountDetails.accountNumber), variant: "outline", className: "flex-1", children: [copied ? _jsx(CheckCircle, { className: "w-4 h-4 mr-2" }) : _jsx(Copy, { className: "w-4 h-4 mr-2" }), copied ? "Copied!" : "Copy Details"] })] }), showQR && (_jsxs("div", { className: "text-center p-4 bg-gray-50 rounded-lg", children: [_jsx("div", { className: "w-32 h-32 bg-gray-200 mx-auto mb-2 rounded-lg flex items-center justify-center", children: _jsx(QrCode, { className: "w-16 h-16 text-gray-400" }) }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Scan to send money to ", accountDetails.name] })] })), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between items-center p-2 bg-gray-50 rounded", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Account Number" }), _jsx("span", { className: "text-sm font-medium", children: accountDetails.accountNumber })] }), _jsxs("div", { className: "flex justify-between items-center p-2 bg-gray-50 rounded", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Account ID" }), _jsx("span", { className: "text-sm font-medium", children: accountDetails.accountId })] })] })] })] }) }));
}
// Add Money Section Component
function AddMoneySection() {
    const { toast } = useToast();
    const [addAmount, setAddAmount] = useState("");
    const [selectedMethod, setSelectedMethod] = useState("");
    const [loading, setLoading] = useState(false);
    const quickAmounts = ["50", "100", "250", "500", "1000"];
    const addMoneyMethods = [
        { id: "debit_card", name: "Debit Card", icon: CreditCard, fee: "Free", time: "Instant" },
        { id: "bank_transfer", name: "Bank Transfer", icon: Building2, fee: "Free", time: "1-3 days" },
        { id: "cash_deposit", name: "Cash Deposit", icon: Banknote, fee: "Free", time: "Instant" },
        { id: "mobile_money", name: "Mobile Money", icon: Smartphone, fee: "1.5%", time: "Instant" }
    ];
    const handleAddMoney = async () => {
        if (!selectedMethod || !addAmount) {
            toast({
                title: 'Missing Information',
                description: 'Please select a payment method and enter an amount.',
                variant: 'destructive',
            });
            return;
        }
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        toast({
            title: 'Money Added',
            description: `Successfully added $${addAmount} via ${selectedMethod}.`,
        });
        setAddAmount("");
        setSelectedMethod("");
        setLoading(false);
    };
    return (_jsx("div", { className: "px-4 mb-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center space-x-2", children: [_jsx(Plus, { className: "w-5 h-5 text-purple-600" }), _jsx("span", { children: "Add Money" })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "add-amount", children: "Amount" }), _jsx(Input, { id: "add-amount", type: "number", placeholder: "0.00", value: addAmount, onChange: (e) => setAddAmount(e.target.value) })] }), _jsx("div", { className: "grid grid-cols-5 gap-2", children: quickAmounts.map((amount) => (_jsxs(Button, { variant: "outline", size: "sm", onClick: () => setAddAmount(amount), className: "text-xs", children: ["$", amount] }, amount))) }), _jsxs("div", { children: [_jsx(Label, { children: "Payment Method" }), _jsx("div", { className: "space-y-2 mt-2", children: addMoneyMethods.map((method) => (_jsx("div", { onClick: () => setSelectedMethod(method.name), className: `p-3 border rounded-lg cursor-pointer transition-colors ${selectedMethod === method.name
                                            ? 'border-purple-500 bg-purple-50'
                                            : 'border-gray-200 hover:border-gray-300'}`, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(method.icon, { className: "w-4 h-4" }), _jsx("span", { className: "text-sm font-medium", children: method.name })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-xs text-green-600", children: method.fee }), _jsx("p", { className: "text-xs text-gray-500", children: method.time })] })] }) }, method.id))) })] }), _jsx(Button, { onClick: handleAddMoney, disabled: !selectedMethod || !addAmount || loading, className: "w-full bg-purple-600 text-white", children: loading ? (_jsxs(_Fragment, { children: [_jsx(Clock, { className: "w-4 h-4 mr-2 animate-spin" }), "Processing..."] })) : (_jsxs(_Fragment, { children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Add $", addAmount || "0.00"] })) })] })] }) }));
}
// Alerts Section Component
function AlertsSection() {
    const [notifications, setNotifications] = useState({
        transactions: true,
        security: true,
        statements: true,
        marketing: false
    });
    const alerts = [
        {
            id: 1,
            title: "Payment Received",
            message: "You received $250.00 from John Smith",
            time: "2 hours ago",
            icon: ArrowDownRight,
            color: "text-green-600",
            bgColor: "bg-green-100",
            read: false
        },
        {
            id: 2,
            title: "Security Alert",
            message: "New device login detected",
            time: "4 hours ago",
            icon: Shield,
            color: "text-orange-600",
            bgColor: "bg-orange-100",
            read: false
        },
        {
            id: 3,
            title: "Monthly Statement",
            message: "Your December statement is ready",
            time: "2 days ago",
            icon: CheckCircle,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
            read: true
        }
    ];
    const handleNotificationToggle = (key) => {
        setNotifications(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };
    const markAsRead = (alertId) => {
        // Mark alert as read in system
    };
    const unreadCount = alerts.filter(alert => !alert.read).length;
    return (_jsx("div", { className: "px-4 mb-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Bell, { className: "w-5 h-5 text-orange-600" }), _jsx("span", { children: "Alerts & Notifications" })] }), _jsxs(Badge, { className: "bg-orange-100 text-orange-800", children: [unreadCount, " unread"] })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx("div", { className: "space-y-3", children: alerts.slice(0, 3).map((alert) => (_jsx("div", { className: `p-3 border rounded-lg ${!alert.read ? 'bg-blue-50 border-blue-200' : 'bg-white'}`, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("div", { className: `w-8 h-8 ${alert.bgColor} rounded-full flex items-center justify-center`, children: _jsx(alert.icon, { className: `w-4 h-4 ${alert.color}` }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-2 mb-1", children: [_jsx("h3", { className: "font-medium text-sm", children: alert.title }), !alert.read && (_jsx("div", { className: "w-2 h-2 bg-blue-600 rounded-full" }))] }), _jsx("p", { className: "text-xs text-gray-600 mb-1", children: alert.message }), _jsx("p", { className: "text-xs text-gray-500", children: alert.time })] })] }), !alert.read && (_jsx(Button, { variant: "ghost", size: "sm", onClick: () => markAsRead(alert.id), children: _jsx(CheckCircle, { className: "w-4 h-4" }) }))] }) }, alert.id))) }), _jsxs("div", { className: "border-t pt-4", children: [_jsx("h4", { className: "font-medium text-sm mb-3", children: "Notification Settings" }), _jsx("div", { className: "space-y-3", children: Object.entries(notifications).map(([key, enabled]) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm capitalize", children: key.replace('_', ' ') }), _jsx(Switch, { checked: enabled, onCheckedChange: () => handleNotificationToggle(key) })] }, key))) })] })] })] }) }));
}
export default function Dashboard() {
    const { t } = useLanguage();
    const { toast } = useToast();
    const { userProfile } = useAuth();
    const [, setLocation] = useLocation();
    const [showBalance, setShowBalance] = useState(true);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [showNotifications] = useState(false);
    const [userData, setUserData] = useState(null);
    const queryClient = useQueryClient();
    // Track user presence for real-time online/offline status
    usePresence(userProfile?.id ? (typeof userProfile.id === 'number' ? userProfile.id : parseInt(userProfile.id)) : undefined, userProfile?.fullName || userProfile?.email);
    useEffect(() => {
        const fetchUserData = async () => {
            if (!userProfile?.id) {
                return;
            }
            try {
                const { authenticatedFetch } = await import('@/lib/queryClient');
                const response = await authenticatedFetch(`/api/users/supabase/${userProfile.id}`, {
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUserData(data);
                }
            }
            catch (error) {
                console.error('Error fetching user data:', error);
            }
        };
        fetchUserData();
        // Refresh every 10 seconds for real-time updates
        const interval = setInterval(fetchUserData, 10000);
        return () => clearInterval(interval);
    }, [userProfile]);
    useEffect(() => {
        const handleToggleChat = () => setIsChatOpen(!isChatOpen);
        window.addEventListener('toggleLiveChat', handleToggleChat);
        return () => window.removeEventListener('toggleLiveChat', handleToggleChat);
    }, [isChatOpen]);
    const toggleBalance = () => setShowBalance(!showBalance);
    // Fetch real account data from API
    const [accounts, setAccounts] = useState([]);
    useEffect(() => {
        const fetchAccounts = async () => {
            if (!userProfile?.id) {
                return;
            }
            try {
                const { authenticatedFetch } = await import('@/lib/queryClient');
                const userResponse = await authenticatedFetch(`/api/users/supabase/${userProfile.id}`);
                if (!userResponse.ok)
                    return;
                const user = await userResponse.json();
                const response = await authenticatedFetch(`/api/accounts?userId=${user.id}&t=${Date.now()}`, {
                    headers: {
                        'Cache-Control': 'no-cache'
                    }
                });
                if (response.ok) {
                    const accountsData = await response.json();
                    if (Array.isArray(accountsData) && accountsData.length > 0) {
                        const formattedAccounts = accountsData.map((account) => ({
                            type: account.accountType ? account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1) : 'Account',
                            number: account.accountNumber ? `****${account.accountNumber.slice(-4)}` : '****0000',
                            balance: account.balance ? parseFloat(account.balance.toString()) : 0,
                            icon: account.accountType === 'checking' ? Wallet :
                                account.accountType === 'savings' ? Building2 : TrendingUp,
                            id: account.id || 0
                        }));
                        setAccounts(formattedAccounts);
                    }
                }
            }
            catch (error) {
                // Silently handle fetch errors
            }
        };
        fetchAccounts();
        // Refresh accounts every 15 seconds
        const interval = setInterval(fetchAccounts, 15000);
        return () => clearInterval(interval);
    }, [userProfile]);
    // Real-time subscription for transactions and admin changes
    useEffect(() => {
        import('@/lib/supabase').then(({ supabase }) => {
            // Subscribe to transaction changes
            const transactionChannel = supabase
                .channel('transaction_realtime_changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (payload) => {
                console.log('Transaction change detected:', payload);
                // Refetch user data and accounts to update balances
                queryClient.invalidateQueries({ queryKey: ['/api/user'] });
                queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
                queryClient.invalidateQueries({ queryKey: ['/api/transactions/recent'] });
            })
                .subscribe();
            // Subscribe to account balance changes
            const accountChannel = supabase
                .channel('account_balance_changes')
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bank_accounts' }, (payload) => {
                console.log('Account balance updated by admin:', payload);
                queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
                queryClient.invalidateQueries({ queryKey: ['/api/user'] });
            })
                .subscribe();
            return () => {
                transactionChannel.unsubscribe();
                accountChannel.unsubscribe();
            };
        });
    }, [queryClient]);
    const profileMenuItems = [
        {
            category: "ACCOUNT MANAGEMENT",
            items: [
                { icon: UserCircle, label: "Profile Settings", href: "/profile-settings" },
                { icon: Shield, label: "Security Settings", href: "/security-settings" },
                { icon: Settings, label: "Account Preferences", href: "/account-preferences" },
                { icon: Check, label: "Verification Center", href: "/verification" }
            ]
        },
        {
            category: "BANKING SERVICES",
            items: [
                { icon: CreditCard, label: "Credit Cards", href: "/credit-cards" },
                { icon: ArrowUpRight, label: "Transaction History", href: "/transaction-history" },
                { icon: Download, label: "Statements & Reports", href: "/statements-reports" },
                { icon: Building2, label: "Banking Services", href: "/banking-services" },
                { icon: RotateCcw, label: "Transfer Funds", href: "/transfer-funds" }
            ]
        },
        {
            category: "INVESTMENT & WEALTH",
            items: [
                { icon: TrendingUp, label: "Investment Portfolio", href: "/investment" },
                { icon: Building2, label: "Wealth Management", href: "/wealth-management" },
                { icon: TrendingUp, label: "Investment Trading", href: "/investment-trading" },
                { icon: Building2, label: "Business Banking", href: "/business-banking" }
            ]
        },
        {
            category: "DIGITAL SERVICES",
            items: [
                { icon: CreditCard, label: "Digital Wallet", href: "/digital-wallet" },
                { icon: UserCircle, label: "Mobile Pay", href: "/mobile-pay" },
                { icon: ArrowUpRight, label: "International Transfer", href: "/international-transfer" }
            ]
        },
        {
            category: "SUPPORT & HELP",
            items: [
                { icon: HelpCircle, label: "Support Center", href: "/support-center" },
                { icon: UserCircle, label: "Customer Support", href: "/customer-support" },
                { icon: Shield, label: "Security Center", href: "/security-center" },
                { icon: Building2, label: "Find Branches", href: "/find-branches" },
                { icon: LogOut, label: "Sign Out", href: "/login" }
            ]
        }
    ];
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 pb-20", children: [_jsxs("div", { className: "bg-white px-4 py-3 shadow-sm relative", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("img", { src: "/world-bank-logo.jpeg", alt: "World Bank Logo", className: "w-8 h-8 object-contain", onError: (e) => {
                                            const target = e.target;
                                            target.src = "https://upload.wikimedia.org/wikipedia/en/thumb/8/80/World_Bank_Group_logo.svg/1200px-World_Bank_Group_logo.svg.png";
                                        } }), _jsxs("div", { children: [_jsx("div", { className: "text-gray-900 font-semibold text-sm", children: "WORLD BANK" }), _jsx("div", { className: "text-xs text-gray-500", children: "International Banking" })] })] }), _jsx("div", { className: "flex items-center space-x-3", children: _jsxs("div", { className: "relative", children: [_jsx("button", { onClick: () => setShowProfileMenu(!showProfileMenu), className: "flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors", children: _jsx(Avatar, { size: 40 }) }), showProfileMenu && (_jsxs("div", { className: "absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50", children: [_jsx("div", { className: "p-4 border-b border-gray-100", children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(Avatar, { size: 64 }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-semibold text-gray-900", children: "Liu Wei" }), _jsx("div", { className: "text-sm text-gray-600", children: "Marine Engineer" }), _jsx("div", { className: "text-sm text-gray-600", children: "bankmanagerworld5@gmail.com" }), _jsx("div", { className: "flex items-center space-x-2 mt-1", children: _jsxs(Badge, { variant: "default", className: "text-xs bg-green-100 text-green-800 flex items-center space-x-1", children: [_jsx(Check, { className: "w-3 h-3" }), _jsx("span", { children: "Verified Account" })] }) })] })] }) }), _jsx("div", { className: "max-h-64 overflow-y-auto", children: profileMenuItems.map((section, sectionIndex) => (_jsxs("div", { className: "mb-4", children: [_jsx("div", { className: "px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide", children: section.category }), section.items.map((item, itemIndex) => (_jsx(Link, { href: item.href, children: _jsxs("div", { onClick: () => setShowProfileMenu(false), className: "w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors cursor-pointer", children: [_jsx(item.icon, { className: "w-5 h-5 text-gray-500" }), _jsx("span", { className: "text-sm text-gray-700", children: item.label })] }) }, itemIndex)))] }, sectionIndex))) }), _jsxs("div", { className: "p-4 border-t border-gray-100 bg-gray-50", children: [_jsxs("div", { className: "text-xs text-gray-500", children: ["Account ID: ", userProfile?.accountId || t('loading')] }), _jsxs("div", { className: "text-xs text-gray-500", children: ["Last Login: ", userProfile?.lastLogin ? new Date(userProfile.lastLogin).toLocaleDateString() : t('loading')] })] })] }))] }) })] }), _jsx("div", { className: "mt-4 pt-4 border-t border-gray-100", children: _jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-lg font-semibold text-gray-900", children: ["Welcome, ", userProfile?.fullName || 'Valued Customer'] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Account Number: ", userProfile?.accountNumber || '••••-••••-••••-••••'] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Account ID: ", userProfile?.accountId || 'WB-••••-••••'] }), _jsx("p", { className: "text-sm text-gray-600", children: userProfile?.profession || 'Account Holder' }), _jsxs("div", { className: "flex items-center space-x-2 mt-1", children: [_jsxs(Badge, { variant: "default", className: "text-xs bg-green-100 text-green-800 flex items-center space-x-1", children: [_jsx(Check, { className: "w-3 h-3" }), _jsx("span", { children: "Verified Account" })] }), _jsx(Badge, { variant: "outline", className: "text-xs bg-blue-50 text-blue-600 border-blue-200", children: t('online') }), _jsx(Badge, { variant: "outline", className: "text-xs bg-orange-50 text-orange-600 border-orange-200", children: t('authenticated') })] })] }), _jsx(Avatar, { size: 80 })] }) }) })] }), showProfileMenu && (_jsx("div", { className: "fixed inset-0 z-40", onClick: () => {
                    setShowProfileMenu(false);
                } })), _jsx("div", { className: "p-4", children: _jsx(Card, { className: "bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white shadow-2xl border-0", children: _jsxs(CardContent, { className: "p-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-blue-100 text-sm", children: t('total_balance') }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("h2", { className: "text-2xl font-bold", children: showBalance ? `$${userProfile?.balance?.toLocaleString() || "0.00"}` : "****" }), _jsx("button", { onClick: toggleBalance, children: showBalance ? (_jsx(EyeOff, { className: "w-5 h-5 text-blue-100" })) : (_jsx(Eye, { className: "w-5 h-5 text-blue-100" })) })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-blue-100 text-sm", children: t('account') }), _jsx("p", { className: "text-sm font-medium", children: "****1234" })] })] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "flex items-center space-x-1", children: [_jsx(ArrowUpRight, { className: "w-4 h-4 text-green-300" }), _jsx("span", { className: "text-sm", children: "+2.5%" })] }), _jsx("span", { className: "text-blue-100 text-sm", children: "vs last month" })] })] }) }) }), _jsxs("div", { className: "px-4 mb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: t('my_accounts') }), _jsx("div", { className: "space-y-3", children: accounts.map((account, index) => (_jsx(Card, { className: "wb-card", children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center", children: _jsx(account.icon, { className: "w-6 h-6 text-blue-600" }) }), _jsxs("div", { children: [_jsxs("h4", { className: "font-semibold text-gray-900", children: [account.type, " Account"] }), _jsx("p", { className: "text-sm text-gray-500", children: account.number })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "font-semibold text-lg", children: showBalance ? `$${account.balance.toLocaleString()}` : "****" }), _jsx("p", { className: "text-xs text-gray-500", children: "Available" })] })] }) }) }, index))) })] }), _jsxs("div", { className: "px-4 mb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Quick Actions" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(Link, { href: "/transfer", children: _jsx("div", { className: "p-6 bg-gradient-to-br from-white to-blue-50 rounded-2xl border-2 border-blue-100 hover:border-blue-400 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105", children: _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg", children: _jsx(Globe, { className: "w-7 h-7 text-white" }) }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-gray-900 text-lg", children: "International Transfer" }), _jsx("p", { className: "text-sm text-gray-600", children: "Send money worldwide" })] })] }) }) }), _jsx(Link, { href: "/receive", children: _jsx("div", { className: "p-6 bg-gradient-to-br from-white to-green-50 rounded-2xl border-2 border-green-100 hover:border-green-400 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105", children: _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "w-14 h-14 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg", children: _jsx(ArrowDownRight, { className: "w-7 h-7 text-white" }) }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-gray-900 text-lg", children: "Receive" }), _jsx("p", { className: "text-sm text-gray-600", children: "Request money" })] })] }) }) }), _jsx(Link, { href: "/add-money", children: _jsx("div", { className: "p-6 bg-gradient-to-br from-white to-purple-50 rounded-2xl border-2 border-purple-100 hover:border-purple-400 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105", children: _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "w-14 h-14 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg", children: _jsx(Plus, { className: "w-7 h-7 text-white" }) }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-gray-900 text-lg", children: "Add Money" }), _jsx("p", { className: "text-sm text-gray-600", children: "Fund account" })] })] }) }) }), _jsx("div", { onClick: () => setIsChatOpen(true), className: "p-4 bg-white rounded-lg border hover:border-green-500 hover:shadow-md transition-all cursor-pointer", children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("div", { className: "w-12 h-12 bg-green-100 rounded-full flex items-center justify-center relative", children: [_jsx(Send, { className: "w-6 h-6 text-green-600" }), _jsx("div", { className: "absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900", children: "Live Chat" }), _jsx("p", { className: "text-sm text-gray-600", children: "Customer support" })] })] }) }), _jsx(Link, { href: "/alerts", children: _jsx("div", { className: "p-4 bg-white rounded-lg border hover:border-orange-500 hover:shadow-md transition-all cursor-pointer", children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("div", { className: "w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center relative", children: [_jsx(Bell, { className: "w-6 h-6 text-orange-600" }), _jsx("div", { className: "absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-xs text-white font-bold", children: "3" }) })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900", children: "Banking Alerts" }), _jsx("p", { className: "text-sm text-gray-600", children: "3 new notifications" })] })] }) }) }), _jsx("div", { onClick: () => toast({ title: 'Account Statement', description: 'Generating account statement...' }), className: "p-4 bg-white rounded-lg border hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer", children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center", children: _jsx(Download, { className: "w-6 h-6 text-indigo-600" }) }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900", children: "Statements" }), _jsx("p", { className: "text-sm text-gray-600", children: "Download reports" })] })] }) }), _jsx("div", { onClick: () => toast({ title: 'Currency Exchange', description: 'USD 1.00 = CNY 7.24, EUR 1.00 = CNY 7.85' }), className: "p-4 bg-white rounded-lg border hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer", children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center", children: _jsx(RotateCcw, { className: "w-6 h-6 text-emerald-600" }) }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900", children: "Exchange" }), _jsx("p", { className: "text-sm text-gray-600", children: "Currency rates" })] })] }) }), _jsx("div", { onClick: () => setLocation('/investment'), className: "p-4 bg-white rounded-lg border hover:border-amber-500 hover:shadow-md transition-all cursor-pointer", children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center", children: _jsx(TrendingUp, { className: "w-6 h-6 text-amber-600" }) }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900", children: "Investments" }), _jsx("p", { className: "text-sm text-gray-600", children: "Portfolio view" })] })] }) })] })] }), _jsx("div", { className: "px-4", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: "Recent Transactions" }) }), _jsx(CardContent, { children: (() => {
                                const [recentTransactions, setRecentTransactions] = useState([]);
                                useEffect(() => {
                                    const fetchRecentTransactions = async () => {
                                        try {
                                            const { authenticatedFetch } = await import('@/lib/queryClient');
                                            const response = await authenticatedFetch('/api/accounts/1/transactions');
                                            if (response.ok) {
                                                const data = await response.json();
                                                setRecentTransactions(data.slice(0, 5));
                                            }
                                        }
                                        catch (error) {
                                            // Silently handle fetch errors
                                        }
                                    };
                                    fetchRecentTransactions();
                                    // Refresh every 30 seconds
                                    const interval = setInterval(fetchRecentTransactions, 30000);
                                    return () => clearInterval(interval);
                                }, []);
                                return (_jsx("div", { className: "space-y-4", children: recentTransactions.length > 0 ? (recentTransactions.map((tx) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: `w-10 h-10 ${tx.type === 'credit' ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center`, children: tx.type === 'credit' ? (_jsx(ArrowDownRight, { className: "w-5 h-5 text-green-600" })) : (_jsx(ArrowUpRight, { className: "w-5 h-5 text-red-600" })) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: tx.description }), _jsx("p", { className: "text-sm text-gray-500", children: new Date(tx.date || tx.created_at).toLocaleDateString() })] })] }), _jsxs("span", { className: `font-medium ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`, children: [tx.type === 'credit' ? '+' : '-', "$", parseFloat(tx.amount).toFixed(2)] })] }, tx.id)))) : (_jsx("div", { className: "text-center py-4 text-gray-500", children: "No recent transactions" })) }));
                            })() })] }) }), _jsx(BottomNavigation, {}), _jsx(LiveChat, { isOpen: isChatOpen, onClose: () => setIsChatOpen(false) })] }));
}
