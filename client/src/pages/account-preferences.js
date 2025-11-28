import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import BottomNavigation from '../components/BottomNavigation';
import { Settings, Bell, Shield, Smartphone, Mail, MessageSquare, Eye, EyeOff, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
export default function AccountPreferences() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { toast } = useToast();
    const [preferences, setPreferences] = useState({
        notifications: {
            email: true,
            sms: true,
            push: true,
            marketing: false
        },
        privacy: {
            showBalance: true,
            shareData: false,
            twoFactorAuth: true
        },
        display: {
            currency: 'USD',
            language: 'en',
            theme: 'light'
        },
        security: {
            sessionTimeout: 30,
            biometric: true,
            autoLogout: true
        }
    });
    const handleSave = async () => {
        const { authenticatedFetch } = await import('@/lib/queryClient');
        try {
            const response = await authenticatedFetch('/api/user/preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(preferences)
            });
            if (response.ok) {
                // Save to localStorage as backup
                localStorage.setItem('user_preferences', JSON.stringify(preferences));
                toast({
                    title: 'Preferences Saved',
                    description: t('preferences_saved') || 'Preferences saved successfully.',
                });
            }
            else {
                toast({
                    title: 'Save Failed',
                    description: 'Failed to save preferences. Please try again.',
                    variant: 'destructive',
                });
            }
        }
        catch (error) {
            console.error('Error saving preferences:', error);
            toast({
                title: 'Error',
                description: 'Error saving preferences. Please try again.',
                variant: 'destructive',
            });
        }
    };
    const togglePreference = (category, key) => {
        setPreferences(prev => {
            if (category === 'notifications') {
                return {
                    ...prev,
                    notifications: {
                        ...prev.notifications,
                        [key]: !prev.notifications[key]
                    }
                };
            }
            else if (category === 'privacy') {
                return {
                    ...prev,
                    privacy: {
                        ...prev.privacy,
                        [key]: !prev.privacy[key]
                    }
                };
            }
            else if (category === 'security') {
                return {
                    ...prev,
                    security: {
                        ...prev.security,
                        [key]: !prev.security[key]
                    }
                };
            }
            return prev;
        });
    };
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100", children: [_jsx(Header, { user: user }), _jsx("main", { className: "pt-16 pb-20 px-4", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 mb-2", children: t('account_preferences') || 'Account Preferences' }), _jsx("p", { className: "text-gray-600", children: t('manage_account_settings') || 'Manage your account settings and preferences' })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-4", children: [_jsx(Bell, { className: "w-5 h-5 text-blue-600" }), _jsx("h2", { className: "text-lg font-semibold text-gray-900", children: t('notification_preferences') || 'Notification Preferences' })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(Mail, { className: "w-4 h-4 text-gray-400" }), _jsx("span", { className: "text-sm text-gray-700", children: t('email_notifications') || 'Email Notifications' })] }), _jsx("button", { onClick: () => togglePreference('notifications', 'email'), className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.notifications.email ? 'bg-blue-600' : 'bg-gray-200'}`, children: _jsx("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.notifications.email ? 'translate-x-6' : 'translate-x-1'}` }) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(MessageSquare, { className: "w-4 h-4 text-gray-400" }), _jsx("span", { className: "text-sm text-gray-700", children: t('sms_notifications') || 'SMS Notifications' })] }), _jsx("button", { onClick: () => togglePreference('notifications', 'sms'), className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.notifications.sms ? 'bg-blue-600' : 'bg-gray-200'}`, children: _jsx("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.notifications.sms ? 'translate-x-6' : 'translate-x-1'}` }) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(Smartphone, { className: "w-4 h-4 text-gray-400" }), _jsx("span", { className: "text-sm text-gray-700", children: t('push_notifications') || 'Push Notifications' })] }), _jsx("button", { onClick: () => togglePreference('notifications', 'push'), className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.notifications.push ? 'bg-blue-600' : 'bg-gray-200'}`, children: _jsx("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.notifications.push ? 'translate-x-6' : 'translate-x-1'}` }) })] })] })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-4", children: [_jsx(Shield, { className: "w-5 h-5 text-blue-600" }), _jsx("h2", { className: "text-lg font-semibold text-gray-900", children: t('privacy_settings') || 'Privacy Settings' })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [preferences.privacy.showBalance ? (_jsx(Eye, { className: "w-4 h-4 text-gray-400" })) : (_jsx(EyeOff, { className: "w-4 h-4 text-gray-400" })), _jsx("span", { className: "text-sm text-gray-700", children: t('show_balance') || 'Show Account Balance' })] }), _jsx("button", { onClick: () => togglePreference('privacy', 'showBalance'), className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.privacy.showBalance ? 'bg-blue-600' : 'bg-gray-200'}`, children: _jsx("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.privacy.showBalance ? 'translate-x-6' : 'translate-x-1'}` }) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(Shield, { className: "w-4 h-4 text-gray-400" }), _jsx("span", { className: "text-sm text-gray-700", children: t('two_factor_auth') || 'Two-Factor Authentication' })] }), _jsx("button", { onClick: () => togglePreference('privacy', 'twoFactorAuth'), className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.privacy.twoFactorAuth ? 'bg-blue-600' : 'bg-gray-200'}`, children: _jsx("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.privacy.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'}` }) })] })] })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-4", children: [_jsx(Settings, { className: "w-5 h-5 text-blue-600" }), _jsx("h2", { className: "text-lg font-semibold text-gray-900", children: t('display_preferences') || 'Display Preferences' })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: t('preferred_currency') || 'Preferred Currency' }), _jsxs("select", { value: preferences.display.currency, onChange: (e) => setPreferences(prev => ({
                                                                ...prev,
                                                                display: { ...prev.display, currency: e.target.value }
                                                            })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "USD", children: "USD - US Dollar" }), _jsx("option", { value: "EUR", children: "EUR - Euro" }), _jsx("option", { value: "GBP", children: "GBP - British Pound" }), _jsx("option", { value: "CNY", children: "CNY - Chinese Yuan" }), _jsx("option", { value: "JPY", children: "JPY - Japanese Yen" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: t('language') || 'Language' }), _jsxs("select", { value: preferences.display.language, onChange: (e) => setPreferences(prev => ({
                                                                ...prev,
                                                                display: { ...prev.display, language: e.target.value }
                                                            })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "en", children: "English" }), _jsx("option", { value: "zh", children: "\u4E2D\u6587 (Chinese)" }), _jsx("option", { value: "es", children: "Espa\u00F1ol" }), _jsx("option", { value: "fr", children: "Fran\u00E7ais" })] })] })] })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-4", children: [_jsx(Shield, { className: "w-5 h-5 text-blue-600" }), _jsx("h2", { className: "text-lg font-semibold text-gray-900", children: t('security_settings') || 'Security Settings' })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: t('session_timeout') || 'Session Timeout (minutes)' }), _jsxs("select", { value: preferences.security.sessionTimeout, onChange: (e) => setPreferences(prev => ({
                                                                ...prev,
                                                                security: { ...prev.security, sessionTimeout: parseInt(e.target.value) }
                                                            })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: 15, children: "15 minutes" }), _jsx("option", { value: 30, children: "30 minutes" }), _jsx("option", { value: 60, children: "1 hour" }), _jsx("option", { value: 120, children: "2 hours" })] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(Smartphone, { className: "w-4 h-4 text-gray-400" }), _jsx("span", { className: "text-sm text-gray-700", children: t('biometric_auth') || 'Biometric Authentication' })] }), _jsx("button", { onClick: () => togglePreference('security', 'biometric'), className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.security.biometric ? 'bg-blue-600' : 'bg-gray-200'}`, children: _jsx("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.security.biometric ? 'translate-x-6' : 'translate-x-1'}` }) })] })] })] })] }), _jsx("div", { className: "mt-8 flex justify-end", children: _jsxs("button", { onClick: handleSave, className: "flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: [_jsx(Save, { className: "w-4 h-4" }), _jsx("span", { children: t('save_preferences') || 'Save Preferences' })] }) })] }) }), _jsx(BottomNavigation, {})] }));
}
