import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useRealtimeAlerts } from "@/hooks/useRealtimeTransactions";
import { Bell, Mail, ArrowUpRight, Shield, CheckCircle, Clock, DollarSign, Settings, Filter, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
export default function Alerts() {
    const { t } = useLanguage();
    const { toast } = useToast();
    const { data: user, isLoading } = useQuery({
        queryKey: ['/api/user'],
    });
    // Enable real-time alerts updates
    const userId = user?.id ? (typeof user.id === 'number' ? user.id : parseInt(user.id)) : undefined;
    useRealtimeAlerts(userId, !!user);
    // Fetch real alerts from database
    const { data: alerts, isLoading: alertsLoading } = useQuery({
        queryKey: ['/api/alerts'],
        enabled: !!user,
    });
    const [notifications, setNotifications] = useState({
        transactions: true,
        security: true,
        marketing: false,
        statements: true,
        maintenance: true
    });
    const [activeTab, setActiveTab] = useState('all');
    // Mutation for marking alert as read
    const markAsReadMutation = useMutation({
        mutationFn: async (alertId) => {
            return apiRequest(`/api/alerts/${alertId}/read`, 'PATCH');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
        },
    });
    if (isLoading || alertsLoading) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsx("div", { className: "text-gray-600", children: t('loading') }) }));
    }
    const alertsList = alerts || [];
    const notificationSettings = [
        {
            key: "transactions",
            title: "Transaction Alerts",
            description: "Get notified about payments and transfers",
            icon: DollarSign
        },
        {
            key: "security",
            title: "Security Alerts",
            description: "Important security notifications",
            icon: Shield
        },
        {
            key: "statements",
            title: "Account Statements",
            description: "Monthly statements and reports",
            icon: Mail
        },
        {
            key: "maintenance",
            title: "System Updates",
            description: "Maintenance and system notifications",
            icon: Settings
        },
        {
            key: "marketing",
            title: "Promotional Offers",
            description: "Special offers and product updates",
            icon: Bell
        }
    ];
    const filteredAlerts = activeTab === 'all'
        ? alertsList
        : alertsList.filter((alert) => alert.alert_type === activeTab);
    const unreadCount = alertsList.filter((alert) => !alert.is_read).length;
    const handleNotificationToggle = (key) => {
        setNotifications(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };
    // Mutation for deleting alert
    const deleteAlertMutation = useMutation({
        mutationFn: async (alertId) => {
            return apiRequest(`/api/alerts/${alertId}`, 'DELETE');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
        },
    });
    const markAsRead = (alertId) => {
        markAsReadMutation.mutate(alertId);
    };
    const deleteAlert = (alertId) => {
        deleteAlertMutation.mutate(alertId);
    };
    // Helper function to get alert icon
    const getAlertIcon = (type) => {
        switch (type) {
            case 'transaction': return ArrowUpRight;
            case 'security': return Shield;
            case 'statement': return Mail;
            case 'maintenance': return Clock;
            default: return Bell;
        }
    };
    // Helper function to get alert styling
    const getAlertStyle = (type) => {
        switch (type) {
            case 'transaction':
                return { color: 'text-green-600', bgColor: 'bg-green-100' };
            case 'security':
                return { color: 'text-orange-600', bgColor: 'bg-orange-100' };
            case 'statement':
                return { color: 'text-blue-600', bgColor: 'bg-blue-100' };
            case 'maintenance':
                return { color: 'text-purple-600', bgColor: 'bg-purple-100' };
            default:
                return { color: 'text-gray-600', bgColor: 'bg-gray-100' };
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(Header, {}), _jsxs("div", { className: "px-4 py-6 pb-20", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold text-gray-900", children: "Alerts & Notifications" }), _jsxs("p", { className: "text-sm text-gray-600", children: [unreadCount, " unread notification", unreadCount !== 1 ? 's' : ''] })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => console.log("Filter options"), children: _jsx(Filter, { className: "w-4 h-4" }) }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => toast({ title: 'Settings', description: 'Alert settings opened.' }), children: _jsx(Settings, { className: "w-4 h-4" }) })] })] }), _jsx(Card, { className: "mb-6", children: _jsx(CardContent, { className: "pt-4", children: _jsx("div", { className: "flex space-x-2 overflow-x-auto", children: [
                                    { key: 'all', label: 'All', count: alertsList.length },
                                    { key: 'transaction', label: 'Transactions', count: alertsList.filter((a) => a.alert_type === 'transaction').length },
                                    { key: 'security', label: 'Security', count: alertsList.filter((a) => a.alert_type === 'security').length },
                                    { key: 'statement', label: 'Statements', count: alertsList.filter((a) => a.alert_type === 'statement').length }
                                ].map((tab) => (_jsxs(Button, { variant: activeTab === tab.key ? "default" : "outline", size: "sm", onClick: () => setActiveTab(tab.key), className: "whitespace-nowrap", "data-testid": `alert-tab-${tab.key}`, children: [tab.label, " (", tab.count, ")"] }, tab.key))) }) }) }), _jsxs(Card, { className: "mb-6", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Recent Alerts" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: filteredAlerts.length === 0 ? (_jsxs("div", { className: "text-center py-8 text-gray-500", children: [_jsx(Bell, { className: "w-12 h-12 mx-auto mb-3 opacity-50" }), _jsx("p", { children: "No alerts found" }), _jsx("p", { className: "text-sm", children: "You're all caught up!" })] })) : (filteredAlerts.map((alertItem) => {
                                        const IconComponent = getAlertIcon(alertItem.alert_type);
                                        const { color, bgColor } = getAlertStyle(alertItem.alert_type);
                                        const timeAgo = new Date(alertItem.created_at).toLocaleString();
                                        return (_jsx("div", { className: `p-4 border rounded-lg ${!alertItem.is_read ? 'bg-blue-50 border-blue-200' : 'bg-white'}`, "data-testid": `alert-item-${alertItem.id}`, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("div", { className: `w-10 h-10 ${bgColor} rounded-full flex items-center justify-center`, children: _jsx(IconComponent, { className: `w-5 h-5 ${color}` }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-2 mb-1", children: [_jsx("h3", { className: "font-medium text-sm", "data-testid": `alert-title-${alertItem.id}`, children: alertItem.title }), !alertItem.is_read && (_jsx("div", { className: "w-2 h-2 bg-blue-600 rounded-full" }))] }), _jsx("p", { className: "text-sm text-gray-600 mb-2", children: alertItem.message }), _jsx("p", { className: "text-xs text-gray-500", children: timeAgo })] })] }), _jsxs("div", { className: "flex items-center space-x-1", children: [!alertItem.is_read && (_jsx(Button, { variant: "ghost", size: "sm", onClick: () => markAsRead(alertItem.id), "data-testid": `alert-mark-read-${alertItem.id}`, children: _jsx(CheckCircle, { className: "w-4 h-4" }) })), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => deleteAlert(alertItem.id), "data-testid": `alert-delete-${alertItem.id}`, children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] }) }, alertItem.id));
                                    })) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Notification Preferences" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: notificationSettings.map((setting) => (_jsxs("div", { className: "flex items-center justify-between p-3 border rounded-lg", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center", children: _jsx(setting.icon, { className: "w-4 h-4 text-gray-600" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-sm", children: setting.title }), _jsx("p", { className: "text-xs text-gray-600", children: setting.description })] })] }), _jsx(Switch, { checked: notifications[setting.key], onCheckedChange: () => handleNotificationToggle(setting.key) })] }, setting.key))) }) })] })] }), _jsx(BottomNavigation, {})] }));
}
