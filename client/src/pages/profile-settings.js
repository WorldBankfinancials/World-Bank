import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Shield, MapPin, Check, Eye, Lock } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
export default function ProfileSettings() {
    const [, setLocation] = useLocation();
    const { t } = useLanguage();
    const [displayUser, setDisplayUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        async function fetchUserProfile() {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (!authUser) {
                    setLocation('/login');
                    return;
                }
                const { data: bankUser, error } = await supabase
                    .from('bank_users')
                    .select('*')
                    .eq('supabase_user_id', authUser.id)
                    .single();
                if (error)
                    throw error;
                setDisplayUser(bankUser);
            }
            catch (error) {
                console.error('Error fetching profile:', error);
            }
            finally {
                setLoading(false);
            }
        }
        fetchUserProfile();
    }, [setLocation]);
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsx("div", { className: "text-gray-600", children: "Loading profile..." }) }));
    }
    if (!displayUser) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsx("div", { className: "text-gray-600", children: "User not found" }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(Header, { user: displayUser }), _jsxs("div", { className: "px-4 py-6 pb-20", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Profile Settings" }), _jsx("p", { className: "text-gray-600 mt-1", children: "View your profile information and account details" })] }), _jsxs(Card, { className: "mb-6", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(User, { className: "w-5 h-5 mr-2" }), "Profile Information"] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [displayUser?.avatarUrl ? (_jsx("img", { src: displayUser?.avatarUrl, alt: "Profile", className: "w-20 h-20 rounded-full object-cover border-4 border-blue-200" })) : (_jsxs("div", { style: {
                                                        width: '80px',
                                                        height: '80px',
                                                        borderRadius: '50%',
                                                        background: 'linear-gradient(135deg, #3B82F6, #1E40AF)',
                                                        border: '4px solid #DBEAFE',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        fontSize: '24px',
                                                        fontWeight: 'bold',
                                                        position: 'relative'
                                                    }, children: [displayUser?.fullName?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U', _jsx("div", { style: {
                                                                position: 'absolute',
                                                                bottom: '2px',
                                                                right: '2px',
                                                                width: '16px',
                                                                height: '16px',
                                                                backgroundColor: '#10B981',
                                                                borderRadius: '50%',
                                                                border: '2px solid white'
                                                            } })] })), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: displayUser?.fullName || 'User' }), _jsx("p", { className: "text-gray-600", children: displayUser?.profession || 'Customer' }), _jsxs(Badge, { className: "bg-green-100 text-green-800 mt-1", children: [_jsx(Check, { className: "w-3 h-3 mr-1" }), displayUser?.isVerified ? t('verified_account') : 'Account'] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-500", children: t('full_name') }), _jsx("p", { className: "text-gray-900 font-medium", children: displayUser?.fullName || 'Not provided' })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-500", children: t('email_address') }), _jsx("p", { className: "text-gray-900", children: displayUser?.email || 'Not provided' })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-500", children: t('phone') }), _jsx("p", { className: "text-gray-900", children: displayUser?.phone || 'Not provided' })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-500", children: t('profession') }), _jsx("p", { className: "text-gray-900", children: displayUser?.profession || 'Not provided' })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-500", children: t('nationality') }), _jsx("p", { className: "text-gray-900", children: displayUser?.nationality || displayUser?.country || 'Not provided' })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-500", children: t('annual_income') }), _jsx("p", { className: "text-gray-900", children: displayUser?.annualIncome || 'Not provided' })] })] }), _jsx("div", { className: "pt-4 border-t", children: _jsx("div", { className: "flex items-center space-x-2", children: _jsxs(Badge, { className: "bg-blue-100 text-blue-800", children: [_jsx(Shield, { className: "w-3 h-3 mr-1" }), "Secure Profile"] }) }) })] }) })] }), _jsxs(Card, { className: "mb-6", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(Shield, { className: "w-5 h-5 mr-2" }), "Account Details"] }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-500", children: "Account Number" }), _jsx("p", { className: "text-gray-900 font-mono", children: displayUser?.accountNumber || 'Not assigned' })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-500", children: "Account ID" }), _jsx("p", { className: "text-gray-900 font-mono", children: displayUser?.accountId || 'Not assigned' })] })] }) }) })] }), _jsxs(Card, { className: "mb-6", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(MapPin, { className: "w-5 h-5 mr-2" }), "Address Information"] }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-500", children: "Address" }), _jsx("p", { className: "text-gray-900", children: displayUser?.address || 'Not provided' })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-500", children: "City" }), _jsx("p", { className: "text-gray-900", children: displayUser?.city || 'Not provided' })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-500", children: "Country" }), _jsx("p", { className: "text-gray-900", children: displayUser?.country || 'Not provided' })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-500", children: "Postal Code" }), _jsx("p", { className: "text-gray-900", children: displayUser?.postalCode || 'Not provided' })] })] }) }) })] }), _jsxs(Card, { className: "mb-6", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(Lock, { className: "w-5 h-5 mr-2" }), "Security Settings"] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: "Transfer PIN Settings" }), _jsx("p", { className: "text-sm text-gray-500", children: "Contact customer support to request PIN changes" })] }), _jsx(Badge, { className: "bg-gray-100 text-gray-600", children: "Admin Only" })] }), _jsx("div", { className: "pt-4 border-t", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: "Two-Factor Authentication" }), _jsx("p", { className: "text-sm text-gray-500", children: "Add an extra layer of security" })] }), _jsx(Badge, { className: "bg-green-100 text-green-800", children: "Enabled" })] }) }), _jsx("div", { className: "border-t pt-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: "Session Security" }), _jsx("p", { className: "text-sm text-gray-500", children: "Automatic logout and session management" })] }), _jsx(Badge, { className: "bg-blue-100 text-blue-800", children: "Active" })] }) })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Account Actions" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-3", children: [_jsxs(Button, { variant: "outline", className: "w-full", onClick: () => setLocation('/verification'), children: [_jsx(Eye, { className: "w-4 h-4 mr-2" }), "Verification Center"] }), _jsxs("div", { className: "pt-4 border-t", children: [_jsx("p", { className: "text-sm text-gray-500 mb-2", children: "Need to update your profile information? Contact our customer support team for assistance." }), _jsx(Button, { variant: "outline", className: "w-full", children: "Contact Support" })] })] }) })] })] }), _jsx(BottomNavigation, {})] }));
}
