import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Lock, Eye, EyeOff, Shield, Smartphone, CreditCard, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { BankLogo } from "@/components/BankLogo";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LiveChat from "@/components/LiveChat";
export default function Login() {
    const [, setLocation] = useLocation();
    const { signIn } = useAuth();
    const { toast } = useToast();
    const { t, language, setLanguage } = useLanguage();
    const [loading, setLoading] = useState(false);
    // Check for pending approval status from URL params
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('status') === 'pending') {
            toast({
                title: "Registration Pending Approval",
                description: "Your registration is being reviewed by our customer support team. You'll receive an email once approved.",
                duration: 8000,
            });
        }
    }, [toast]);
    const [showPassword, setShowPassword] = useState(false);
    const [showPinVerification, setShowPinVerification] = useState(false);
    const [loginPin, setLoginPin] = useState("");
    const [pinError, setPinError] = useState("");
    const [loginType, setLoginType] = useState('email');
    const [loginData, setLoginData] = useState({
        email: "",
        mobile: "",
        idNumber: "",
        password: "",
    });
    const [showLiveChat, setShowLiveChat] = useState(false);
    // Fetch user data to get current PIN when PIN verification is shown
    useQuery({
        queryKey: ['/api/user'],
        enabled: showPinVerification, // Only fetch when PIN verification is needed
    });
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // For now, only support email login (mobile/ID require backend mapping)
            if (loginType !== 'email') {
                toast({
                    title: t('login_failed'),
                    description: 'Only email login is currently supported',
                    variant: "destructive"
                });
                setLoading(false);
                return;
            }
            const result = await signIn(loginData.email, loginData.password);
            if (result.error) {
                let errorMessage = result.error;
                // Provide specific error messages
                if (result.error.includes('Invalid login credentials')) {
                    errorMessage = 'Invalid email or password. Please check your credentials and try again.';
                }
                else if (result.error.includes('Email not confirmed')) {
                    errorMessage = 'Please verify your email address before logging in.';
                }
                else if (result.error.includes('not found')) {
                    errorMessage = 'Account not found. Please register first or contact support.';
                }
                console.log('🔔 Showing login error toast:', errorMessage);
                toast({
                    title: t('login_failed') || 'Login Failed',
                    description: errorMessage,
                    variant: "destructive"
                });
                setLoading(false);
                return;
            }
            // Show PIN verification
            setShowPinVerification(true);
            setLoading(false);
        }
        catch (error) {
            console.error("Login error:", error);
            toast({
                title: t('login_failed'),
                description: t('unexpected_error'),
                variant: "destructive"
            });
            setLoading(false);
        }
    };
    const handlePinVerification = async () => {
        if (loginPin.length !== 4) {
            setPinError('PIN must be 4 digits');
            return;
        }
        try {
            const identifier = loginData.email;
            const response = await fetch('/api/verify-pin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: identifier,
                    pin: loginPin
                }),
            });
            if (!response.ok) {
                setPinError('Invalid PIN or verification failed');
                setLoginPin("");
                return;
            }
            const result = await response.json();
            if (result.success && result.verified) {
                setShowPinVerification(false);
                setLoginPin("");
                setPinError("");
                toast({
                    title: 'Login Successful',
                    description: 'Welcome back to World Bank',
                });
                setLocation("/dashboard");
            }
            else {
                setPinError('Invalid PIN');
                setLoginPin("");
            }
        }
        catch (error) {
            console.error("PIN verification error:", error);
            setPinError('Verification failed. Please try again.');
            setLoginPin("");
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col", children: [_jsx("div", { className: "flex-1 flex items-center justify-center p-4", children: _jsxs("div", { className: "w-full max-w-md relative", children: [_jsx("div", { className: "flex justify-end mb-6", children: _jsx("div", { className: "w-32", children: _jsxs(Select, { value: language, onValueChange: (value) => setLanguage(value), children: [_jsx(SelectTrigger, { className: "bg-white/80 backdrop-blur-sm border-white/50", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "en", children: "English" }), _jsx(SelectItem, { value: "zh", children: "\u4E2D\u6587" })] })] }) }) }), _jsxs("div", { className: "text-center mb-8", children: [_jsx("div", { className: "flex justify-center mb-6", children: _jsx("div", { className: "relative", children: _jsx(BankLogo, { className: "w-20 h-20" }) }) }), _jsxs("div", { className: "space-y-3", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 tracking-tight", children: "WORLD BANK" }), _jsx("p", { className: "text-gray-600 text-base", children: "International Digital Banking" })] })] }), _jsxs(Card, { className: "wb-login-card shadow-2xl border-0 bg-white/95 backdrop-blur-sm", children: [_jsx(CardHeader, { className: "space-y-3 pb-6 pt-8", children: _jsxs("div", { className: "text-center", children: [_jsx(CardTitle, { className: "text-2xl font-semibold text-gray-900 mb-2", children: "Sign In" }), _jsx("p", { className: "text-gray-600 text-sm", children: "Access your account" })] }) }), _jsxs(CardContent, { className: "space-y-6 px-8 pb-8", children: [_jsxs(Tabs, { value: loginType, onValueChange: (value) => setLoginType(value), className: "w-full", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg", children: [_jsxs(TabsTrigger, { value: "email", className: "flex items-center space-x-2 text-xs", children: [_jsx(Mail, { className: "w-4 h-4" }), _jsx("span", { children: "Email" })] }), _jsxs(TabsTrigger, { value: "mobile", className: "flex items-center space-x-2 text-xs", children: [_jsx(Smartphone, { className: "w-4 h-4" }), _jsx("span", { children: "Mobile" })] }), _jsxs(TabsTrigger, { value: "id", className: "flex items-center space-x-2 text-xs", children: [_jsx(CreditCard, { className: "w-4 h-4" }), _jsx("span", { children: "Account ID" })] })] }), _jsxs("form", { onSubmit: handleLogin, className: "space-y-5 mt-6", children: [_jsx(TabsContent, { value: "email", className: "space-y-4 mt-4", children: _jsxs("div", { className: "space-y-3", children: [_jsx(Label, { htmlFor: "email", className: "text-sm font-semibold text-gray-700", children: "User ID or Email" }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "absolute left-4 top-4 text-gray-500 font-medium text-base", children: "@/" }), _jsx(Input, { id: "email", type: "email", value: loginData.email, onChange: (e) => setLoginData(prev => ({ ...prev, email: e.target.value })), className: "wb-input pl-12 h-14 text-base", placeholder: "Enter email address", required: loginType === 'email' })] })] }) }), _jsx(TabsContent, { value: "mobile", className: "space-y-4 mt-4", children: _jsxs("div", { className: "space-y-3", children: [_jsx(Label, { htmlFor: "mobile", className: "text-sm font-semibold text-gray-700", children: "Mobile Number" }), _jsxs("div", { className: "relative", children: [_jsx(Smartphone, { className: "absolute left-4 top-4 h-5 w-5 text-gray-400" }), _jsx(Input, { id: "mobile", type: "tel", value: loginData.mobile, onChange: (e) => setLoginData(prev => ({ ...prev, mobile: e.target.value })), className: "wb-input pl-12 h-14 text-base", placeholder: "Enter mobile number", required: loginType === 'mobile' })] })] }) }), _jsx(TabsContent, { value: "id", className: "space-y-4 mt-4", children: _jsxs("div", { className: "space-y-3", children: [_jsx(Label, { htmlFor: "idNumber", className: "text-sm font-semibold text-gray-700", children: "Account ID" }), _jsxs("div", { className: "relative", children: [_jsx(CreditCard, { className: "absolute left-4 top-4 h-5 w-5 text-gray-400" }), _jsx(Input, { id: "idNumber", type: "text", value: loginData.idNumber, onChange: (e) => setLoginData(prev => ({ ...prev, idNumber: e.target.value })), className: "wb-input pl-12 h-14 text-base", placeholder: "Enter account ID (e.g. WB-2025-8912)", required: loginType === 'id' })] })] }) }), _jsxs("div", { className: "space-y-3", children: [_jsx(Label, { htmlFor: "password", className: "text-sm font-semibold text-gray-700", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-4 top-4 h-5 w-5 text-gray-400" }), _jsx(Input, { id: "password", type: showPassword ? "text" : "password", value: loginData.password, onChange: (e) => setLoginData(prev => ({ ...prev, password: e.target.value })), className: "wb-input pl-12 pr-12 h-14 text-base", placeholder: "Enter your password", required: true }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors", children: showPassword ? _jsx(EyeOff, { className: "h-5 w-5" }) : _jsx(Eye, { className: "h-5 w-5" }) })] })] }), _jsx("div", { className: "pt-2", children: _jsx(Button, { type: "submit", className: "wb-button-primary w-full h-14 text-base font-semibold", disabled: loading, children: loading ? (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" }), _jsx("span", { children: "Signing In..." })] })) : (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Shield, { className: "w-5 h-5" }), _jsx("span", { children: "Sign In" })] })) }) })] })] }), _jsx("div", { className: "text-center pt-4 border-t border-gray-100", children: _jsxs("p", { className: "text-sm text-gray-600", children: ["New customer?", " ", _jsx("button", { onClick: () => setLocation("/register-multi"), className: "text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-all", children: "Create Account" })] }) }), _jsx("div", { className: "text-center pt-2", children: _jsx("button", { onClick: () => setLocation("/about"), className: "text-gray-500 hover:text-gray-700 text-sm underline transition-colors", children: "About World Bank" }) })] })] }), _jsxs("div", { className: "text-center mt-8 space-y-4", children: [_jsxs("div", { className: "flex justify-center space-x-6 text-gray-500 text-sm", children: [_jsx("button", { onClick: () => setShowLiveChat(true), className: "hover:text-blue-600 transition-colors", children: "Support" }), _jsx("span", { className: "text-gray-300", children: "|" }), _jsx("button", { onClick: () => window.open('https://worldbank.org/security', '_blank'), className: "hover:text-blue-600 transition-colors", children: "Security" })] }), _jsx("div", { className: "text-gray-500 text-xs", children: _jsx("p", { children: "\u00A9 2025 World Bank Group. All rights reserved." }) })] })] }) }), _jsx(Dialog, { open: showPinVerification, onOpenChange: setShowPinVerification, children: _jsxs(DialogContent, { className: "wb-modal sm:max-w-md", children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { className: "flex items-center gap-2", children: [_jsx(Shield, { className: "w-5 h-5 text-blue-600" }), t('pin_verification_required')] }) }), _jsxs("div", { className: "space-y-4", children: [_jsx("p", { className: "text-sm text-gray-600", children: t('enter_pin_complete_login') }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "pin", children: t('security_pin') }), _jsx(Input, { id: "pin", type: "password", value: loginPin, onChange: (e) => {
                                                setPinError("");
                                                setLoginPin(e.target.value);
                                            }, maxLength: 4, className: "wb-input text-center text-lg tracking-widest", placeholder: "\u2022\u2022\u2022\u2022", onKeyPress: (e) => {
                                                if (e.key === 'Enter' && loginPin.length === 4) {
                                                    handlePinVerification();
                                                }
                                            } }), pinError && (_jsxs(Alert, { variant: "destructive", children: [_jsx(AlertCircle, { className: "h-4 w-4" }), _jsx(AlertDescription, { children: pinError })] }))] }), _jsxs("div", { className: "flex space-x-3", children: [_jsx(Button, { variant: "outline", className: "flex-1 wb-btn-outline", onClick: () => {
                                                setShowPinVerification(false);
                                                setLoginPin("");
                                                setPinError("");
                                            }, children: t('cancel') }), _jsx(Button, { className: "flex-1 wb-btn-primary", onClick: handlePinVerification, disabled: loginPin.length !== 4, children: t('verify_pin') })] })] })] }) }), _jsx(LiveChat, { isOpen: showLiveChat, onClose: () => setShowLiveChat(false) })] }));
}
