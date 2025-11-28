import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Shield, Lock, Eye, Smartphone, Bell, Key, AlertTriangle, CheckCircle, Settings, FileText, Globe, Users, Activity, Fingerprint } from "lucide-react";
export default function SecurityCenter() {
    const { t } = useLanguage();
    const { data: user, isLoading } = useQuery({
        queryKey: ['/api/user'],
    });
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen bg-wb-gray flex items-center justify-center", children: _jsx("div", { className: "text-wb-dark", children: t('loading') }) }));
    }
    const securityFeatures = [
        {
            icon: Fingerprint,
            title: "Biometric Authentication",
            description: "Secure login with fingerprint and facial recognition",
            status: "active",
            enabled: true
        },
        {
            icon: Lock,
            title: "Two-Factor Authentication",
            description: "Add an extra layer of security to your account",
            status: "active",
            enabled: true
        },
        {
            icon: Bell,
            title: "Transaction Alerts",
            description: "Instant notifications for all account activities",
            status: "active",
            enabled: true
        },
        {
            icon: Eye,
            title: "Account Monitoring",
            description: "24/7 monitoring for suspicious activities",
            status: "active",
            enabled: true
        }
    ];
    // Backend API needed: /api/user/activity-log for real activity tracking
    const recentActivity = [];
    // Backend API needed: /api/user/trusted-devices for real device management
    const trustedDevices = [];
    return (_jsxs("div", { className: "min-h-screen bg-wb-gray", children: [_jsx(Header, { user: user }), _jsxs("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-3xl font-bold wb-dark mb-4", children: "Security Center" }), _jsx("p", { className: "text-wb-text", children: "Manage your account security settings and monitor account activity" })] }), _jsx(Card, { className: "mb-8 border-green-200 bg-green-50", children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "w-12 h-12 bg-green-100 rounded-full flex items-center justify-center", children: _jsx(Shield, { className: "w-6 h-6 text-green-600" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h2", { className: "text-xl font-bold text-green-800", children: "Your Account is Secure" }), _jsx("p", { className: "text-green-700", children: "All security features are active and your account is protected" })] }), _jsxs(Badge, { className: "bg-green-600 text-white", children: [_jsx(CheckCircle, { className: "w-4 h-4 mr-1" }), "Protected"] })] }) }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [_jsxs("div", { className: "lg:col-span-2", children: [_jsxs(Card, { className: "mb-8", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(Settings, { className: "w-5 h-5 mr-2" }), "Security Features"] }) }), _jsx(CardContent, { className: "space-y-6", children: securityFeatures.map((feature, index) => (_jsxs("div", { className: "flex items-center justify-between p-4 border rounded-lg", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: `w-10 h-10 rounded-full flex items-center justify-center ${feature.enabled ? 'bg-green-100' : 'bg-gray-100'}`, children: _jsx(feature.icon, { className: `w-5 h-5 ${feature.enabled ? 'text-green-600' : 'text-gray-400'}` }) }), _jsxs("div", { children: [_jsx("div", { className: "font-medium wb-dark", children: feature.title }), _jsx("div", { className: "text-sm text-wb-text", children: feature.description })] })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(Badge, { variant: feature.enabled ? "default" : "secondary", children: feature.enabled ? "Active" : "Inactive" }), _jsx(Switch, { checked: feature.enabled })] })] }, index))) })] }), _jsxs(Card, { className: "mb-8", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(Activity, { className: "w-5 h-5 mr-2" }), "Recent Security Activity"] }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: recentActivity.map((activity, index) => (_jsxs("div", { className: "flex items-center justify-between p-4 border rounded-lg", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: `w-10 h-10 rounded-full flex items-center justify-center ${activity.status === 'success' ? 'bg-green-100' :
                                                                            activity.status === 'blocked' ? 'bg-red-100' : 'bg-yellow-100'}`, children: activity.status === 'success' ? (_jsx(CheckCircle, { className: "w-5 h-5 text-green-600" })) : activity.status === 'blocked' ? (_jsx(AlertTriangle, { className: "w-5 h-5 text-red-600" })) : (_jsx(Eye, { className: "w-5 h-5 text-yellow-600" })) }), _jsxs("div", { children: [_jsx("div", { className: "font-medium wb-dark", children: activity.action }), _jsxs("div", { className: "text-sm text-wb-text", children: [activity.device, " \u2022 ", activity.location] })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: "text-sm text-wb-text", children: activity.time }), _jsx(Badge, { variant: activity.status === 'success' ? 'default' :
                                                                            activity.status === 'blocked' ? 'destructive' : 'secondary', children: activity.status })] })] }, index))) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Advanced Security Options" }) }), _jsx(CardContent, { className: "space-y-4", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(Button, { variant: "outline", className: "justify-start h-auto p-4", children: _jsxs("div", { className: "text-left", children: [_jsxs("div", { className: "flex items-center mb-1", children: [_jsx(Key, { className: "w-4 h-4 mr-2" }), "Change Password"] }), _jsx("div", { className: "text-sm text-wb-text", children: "Update your account password" })] }) }), _jsx(Button, { variant: "outline", className: "justify-start h-auto p-4", children: _jsxs("div", { className: "text-left", children: [_jsxs("div", { className: "flex items-center mb-1", children: [_jsx(FileText, { className: "w-4 h-4 mr-2" }), "Download Security Report"] }), _jsx("div", { className: "text-sm text-wb-text", children: "Get detailed security analysis" })] }) }), _jsx(Button, { variant: "outline", className: "justify-start h-auto p-4", children: _jsxs("div", { className: "text-left", children: [_jsxs("div", { className: "flex items-center mb-1", children: [_jsx(Globe, { className: "w-4 h-4 mr-2" }), "Manage Login Locations"] }), _jsx("div", { className: "text-sm text-wb-text", children: "Control where you can log in" })] }) }), _jsx(Button, { variant: "outline", className: "justify-start h-auto p-4", children: _jsxs("div", { className: "text-left", children: [_jsxs("div", { className: "flex items-center mb-1", children: [_jsx(Users, { className: "w-4 h-4 mr-2" }), "Account Recovery"] }), _jsx("div", { className: "text-sm text-wb-text", children: "Set up recovery options" })] }) })] }) })] })] }), _jsxs("div", { children: [_jsxs(Card, { className: "mb-6", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Security Score" }) }), _jsxs(CardContent, { className: "text-center", children: [_jsx("div", { className: "text-4xl font-bold text-green-600 mb-2", children: "95/100" }), _jsx("div", { className: "text-wb-text mb-4", children: "Excellent Security" }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-green-600 h-2 rounded-full", style: { width: '95%' } }) }), _jsx(Button, { variant: "outline", size: "sm", className: "mt-4", children: "Improve Score" })] })] }), _jsxs(Card, { className: "mb-6", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(Smartphone, { className: "w-5 h-5 mr-2" }), "Trusted Devices"] }) }), _jsxs(CardContent, { className: "space-y-3", children: [trustedDevices.map((device, index) => (_jsxs("div", { className: "p-3 border rounded-lg", children: [_jsxs("div", { className: "flex justify-between items-start mb-1", children: [_jsx("div", { className: "font-medium", children: device.name }), _jsx(Badge, { variant: "secondary", className: "text-xs", children: device.type })] }), _jsx("div", { className: "text-sm text-wb-text", children: device.lastUsed })] }, index))), _jsx(Button, { variant: "outline", size: "sm", className: "w-full", children: "Manage Devices" })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Security Tips" }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { className: "p-3 bg-blue-50 rounded-lg", children: [_jsx("div", { className: "font-medium text-blue-800 mb-1", children: "Enable 2FA" }), _jsx("div", { className: "text-sm text-blue-700", children: "Two-factor authentication adds an extra layer of security" })] }), _jsxs("div", { className: "p-3 bg-green-50 rounded-lg", children: [_jsx("div", { className: "font-medium text-green-800 mb-1", children: "Strong Passwords" }), _jsx("div", { className: "text-sm text-green-700", children: "Use unique, complex passwords for better protection" })] }), _jsxs("div", { className: "p-3 bg-yellow-50 rounded-lg", children: [_jsx("div", { className: "font-medium text-yellow-800 mb-1", children: "Regular Updates" }), _jsx("div", { className: "text-sm text-yellow-700", children: "Keep your devices and apps updated for security" })] })] })] })] })] })] }), _jsx(Footer, {}), "    "] }));
}
