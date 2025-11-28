import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { QrCode, Share, Copy, ArrowDownRight, Link, CheckCircle, Download, Users, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
export default function Receive() {
    const { t } = useLanguage();
    const { toast } = useToast();
    const { data: user, isLoading } = useQuery({
        queryKey: ['/api/user'],
    });
    const [requestAmount, setRequestAmount] = useState("");
    const [message, setMessage] = useState("");
    const [showQR, setShowQR] = useState(false);
    const [copied, setCopied] = useState(false);
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsx("div", { className: "text-gray-600", children: t('loading') }) }));
    }
    const accountDetails = {
        name: user?.fullName || "Account Holder",
        accountNumber: user?.accountNumber || t('loading'),
        accountId: user?.accountId || t('loading'),
        bankName: "World Bank Group",
        swiftCode: "WBGLUS33"
    };
    const shareLink = `https://worldbank.app/pay/LW-${Date.now()}`;
    const [pendingRequests, setPendingRequests] = useState([]);
    useEffect(() => {
        async function fetchRequests() {
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
                    const { data: messages } = await supabase
                        .from('messages')
                        .select('*')
                        .eq('recipient_id', authUser.id)
                        .eq('message_type', 'payment_request')
                        .order('created_at', { ascending: false })
                        .limit(5);
                    setPendingRequests(messages?.map(m => ({
                        from: m.sender_name,
                        amount: m.metadata?.amount || '$0.00',
                        time: new Date(m.created_at).toLocaleDateString(),
                        status: m.is_read ? 'completed' : 'pending'
                    })) || []);
                }
            }
            catch (error) {
                console.error('Error fetching requests:', error);
            }
        }
        fetchRequests();
    }, []);
    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    const handleCopyDetails = (text) => {
        navigator.clipboard.writeText(text);
        // Copied to clipboard notification
    };
    const handleRequestMoney = () => {
        if (!requestAmount) {
            return;
        }
        setRequestAmount("");
        setMessage("");
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(Header, {}), _jsxs("div", { className: "px-4 py-6 pb-20", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold text-gray-900", children: "Receive Money" }), _jsx("p", { className: "text-sm text-gray-600", children: "Request payments easily" })] }), _jsxs(Button, { onClick: () => setShowQR(!showQR), className: "bg-blue-600 text-white", children: [_jsx(QrCode, { className: "w-4 h-4 mr-1" }), "QR Code"] })] }), showQR && (_jsxs(Card, { className: "mb-6", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "QR Code Payment" }) }), _jsxs(CardContent, { className: "text-center", children: [_jsx("div", { className: "w-48 h-48 bg-gray-100 mx-auto mb-4 rounded-lg flex items-center justify-center", children: _jsx(QrCode, { className: "w-32 h-32 text-gray-400" }) }), _jsx("p", { className: "text-sm text-gray-600 mb-4", children: "Scan this QR code to send money to Mr. Liu Wei" }), _jsxs("div", { className: "flex space-x-2 justify-center", children: [_jsxs(Button, { variant: "outline", onClick: () => console.log("QR code download"), children: [_jsx(Download, { className: "w-4 h-4 mr-1" }), "Download"] }), _jsxs(Button, { variant: "outline", onClick: () => toast({ title: 'QR Code Shared', description: 'Your QR code has been shared successfully.' }), children: [_jsx(Share, { className: "w-4 h-4 mr-1" }), "Share"] })] })] })] })), _jsxs(Card, { className: "mb-6", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Request Payment" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx("div", { children: _jsx(Input, { type: "number", placeholder: "Enter amount", value: requestAmount, onChange: (e) => setRequestAmount(e.target.value), className: "text-lg" }) }), _jsx("div", { children: _jsx(Input, { placeholder: "Message (optional)", value: message, onChange: (e) => setMessage(e.target.value) }) }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs(Button, { onClick: handleRequestMoney, className: "bg-blue-600 text-white", children: [_jsx(Users, { className: "w-4 h-4 mr-1" }), "Request"] }), _jsxs(Button, { onClick: handleCopyLink, variant: "outline", children: [copied ? _jsx(CheckCircle, { className: "w-4 h-4 mr-1" }) : _jsx(Link, { className: "w-4 h-4 mr-1" }), copied ? "Copied!" : "Copy Link"] })] })] })] }), _jsxs(Card, { className: "mb-6", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "My Account Details" }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { className: "flex justify-between items-center p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Account Name" }), _jsx("p", { className: "font-medium", children: accountDetails.name })] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => handleCopyDetails(accountDetails.name), children: _jsx(Copy, { className: "w-4 h-4" }) })] }), _jsxs("div", { className: "flex justify-between items-center p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Account Number" }), _jsx("p", { className: "font-medium", children: accountDetails.accountNumber })] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => handleCopyDetails(accountDetails.accountNumber), children: _jsx(Copy, { className: "w-4 h-4" }) })] }), _jsxs("div", { className: "flex justify-between items-center p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Account ID" }), _jsx("p", { className: "font-medium", children: accountDetails.accountId })] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => handleCopyDetails(accountDetails.accountId), children: _jsx(Copy, { className: "w-4 h-4" }) })] }), _jsxs("div", { className: "flex justify-between items-center p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "SWIFT Code" }), _jsx("p", { className: "font-medium", children: accountDetails.swiftCode })] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => handleCopyDetails(accountDetails.swiftCode), children: _jsx(Copy, { className: "w-4 h-4" }) })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Payment Requests" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: pendingRequests && Array.isArray(pendingRequests) && pendingRequests.length > 0 ? pendingRequests.map((request, index) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center", children: _jsx(ArrowDownRight, { className: "w-5 h-5 text-blue-600" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-sm", children: request.from }), _jsx("p", { className: "text-xs text-gray-500", children: request.time })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "font-medium", children: request.amount }), _jsx(Badge, { className: request.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800', children: request.status })] })] }, index))) : (_jsxs("div", { className: "text-center py-8 text-gray-500", children: [_jsx(Wallet, { className: "w-12 h-12 mx-auto mb-4 text-gray-300" }), _jsx("p", { children: "No payment requests available" })] })) }) })] })] }), _jsx(BottomNavigation, {})] }));
}
