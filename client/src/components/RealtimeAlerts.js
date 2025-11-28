import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Bell, Check, AlertCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { realtimeAlerts } from '@/lib/supabase-realtime';
export default function RealtimeAlerts() {
    const { user } = useAuth();
    const [alerts, setAlerts] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    useEffect(() => {
        if (!user)
            return;
        // Load existing alerts
        const loadAlerts = async () => {
            try {
                const existingAlerts = await realtimeAlerts.getAlerts(user.id);
                setAlerts(existingAlerts);
                setUnreadCount(existingAlerts.filter(alert => !alert.isRead).length);
            }
            catch (error) {
                console.error('Failed to load alerts:', error);
            }
        };
        loadAlerts();
        // Subscribe to new alerts
        realtimeAlerts.subscribe((newAlert) => {
            if (newAlert.userId === user.id) {
                setAlerts(prev => [newAlert, ...prev]);
                setUnreadCount(prev => prev + 1);
                // Show browser notification if permission granted
                if (Notification.permission === 'granted') {
                    new Notification(`World Bank: ${newAlert.title}`, {
                        body: newAlert.message,
                        icon: '/favicon.ico'
                    });
                }
            }
        });
        return () => {
            realtimeAlerts.unsubscribe();
        };
    }, [user]);
    const getAlertIcon = (type) => {
        switch (type) {
            case 'success':
                return _jsx(CheckCircle, { className: "w-4 h-4 text-green-600" });
            case 'warning':
                return _jsx(AlertTriangle, { className: "w-4 h-4 text-yellow-600" });
            case 'error':
                return _jsx(AlertCircle, { className: "w-4 h-4 text-red-600" });
            default:
                return _jsx(Info, { className: "w-4 h-4 text-blue-600" });
        }
    };
    const markAllAsRead = () => {
        setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })));
        setUnreadCount(0);
    };
    return (_jsxs("div", { className: "relative", children: [_jsxs(Button, { variant: "ghost", size: "sm", onClick: () => setIsOpen(!isOpen), className: "relative p-2 hover:bg-gray-100 rounded-full", children: [_jsx(Bell, { className: "w-5 h-5 text-gray-600" }), unreadCount > 0 && (_jsx(Badge, { variant: "destructive", className: "absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs", children: unreadCount > 9 ? '9+' : unreadCount }))] }), isOpen && (_jsxs("div", { className: "absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-gray-100", children: [_jsx("h3", { className: "font-semibold text-gray-800", children: "Notifications" }), unreadCount > 0 && (_jsxs(Button, { variant: "ghost", size: "sm", onClick: markAllAsRead, className: "text-xs text-blue-600 hover:text-blue-700", children: [_jsx(Check, { className: "w-3 h-3 mr-1" }), "Mark all read"] }))] }), _jsx("div", { className: "max-h-64 overflow-y-auto", children: alerts.length === 0 ? (_jsx("div", { className: "p-4 text-center text-gray-500 text-sm", children: "No notifications yet" })) : (alerts.map((alert) => (_jsx("div", { className: `p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!alert.isRead ? 'bg-blue-50' : ''}`, children: _jsxs("div", { className: "flex items-start space-x-3", children: [getAlertIcon(alert.type), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h4", { className: `text-sm font-medium text-gray-800 ${!alert.isRead ? 'font-semibold' : ''}`, children: alert.title }), _jsx("p", { className: "text-xs text-gray-600 mt-1 line-clamp-2", children: alert.message }), _jsx("p", { className: "text-xs text-gray-400 mt-2", children: alert.timestamp.toLocaleString() })] }), !alert.isRead && (_jsx("div", { className: "w-2 h-2 bg-blue-600 rounded-full mt-2" }))] }) }, alert.id)))) }), alerts.length > 0 && (_jsx("div", { className: "p-3 border-t border-gray-100 bg-gray-50", children: _jsx(Button, { variant: "ghost", size: "sm", className: "w-full text-xs text-gray-600 hover:text-gray-800", onClick: () => setIsOpen(false), children: "Close notifications" }) }))] })), isOpen && (_jsx("div", { className: "fixed inset-0 z-40", onClick: () => setIsOpen(false) }))] }));
}
