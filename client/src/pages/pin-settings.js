import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Lock, Shield, Eye, EyeOff, ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
export default function PinSettings() {
    const [, setLocation] = useLocation();
    const navigate = (path) => setLocation(path);
    const { t } = useLanguage();
    const { user } = useAuth();
    const { toast } = useToast();
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [showCurrentPin, setShowCurrentPin] = useState(false);
    const [showNewPin, setShowNewPin] = useState(false);
    const [showConfirmPin, setShowConfirmPin] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const validatePin = (pin) => {
        if (pin.length !== 4) {
            return t('pin_must_be_4_digits');
        }
        if (!/^\d+$/.test(pin)) {
            return t('pin_must_be_numeric');
        }
        if (/^(\d)\1{3}$/.test(pin)) {
            return t('pin_cannot_be_repeated');
        }
        if (['1234', '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999'].includes(pin)) {
            return t('pin_too_simple');
        }
        return '';
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        // Validation
        if (!currentPin || !newPin || !confirmPin) {
            setError(t('all_fields_required'));
            return;
        }
        const pinError = validatePin(newPin);
        if (pinError) {
            setError(pinError);
            return;
        }
        if (newPin !== confirmPin) {
            setError(t('pins_do_not_match'));
            return;
        }
        if (currentPin === newPin) {
            setError(t('new_pin_must_be_different'));
            return;
        }
        setShowConfirmDialog(true);
    };
    const confirmPinChange = async () => {
        setIsLoading(true);
        setShowConfirmDialog(false);
        try {
            const { authenticatedFetch } = await import('@/lib/queryClient');
            const response = await authenticatedFetch('/api/user/change-pin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPin,
                    newPin,
                }),
            });
            const data = await response.json();
            if (response.ok) {
                setSuccess(t('pin_changed_successfully'));
                toast({
                    title: 'PIN changed',
                    description: 'Your transfer PIN has been updated successfully.',
                });
                setCurrentPin('');
                setNewPin('');
                setConfirmPin('');
                setTimeout(() => {
                    navigate('/profile-settings');
                }, 2000);
            }
            else {
                console.error('PIN change failed:', data);
                setError(data.message || t('pin_change_failed'));
                toast({
                    title: 'PIN change failed',
                    description: data.message || 'Unable to change PIN. Please try again.',
                    variant: 'destructive',
                });
            }
        }
        catch (error) {
            console.error('PIN change error:', error);
            setError(t('network_error'));
            toast({
                title: 'Network error',
                description: 'Unable to connect to the server. Please check your connection.',
                variant: 'destructive',
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    const getPinStrength = (pin) => {
        if (pin.length < 4)
            return { level: 0, text: t('pin_too_short') };
        const hasRepeated = /^(\d)\1{3}$/.test(pin);
        const isSequential = ['0123', '1234', '2345', '3456', '4567', '5678', '6789', '9876', '8765', '7654', '6543', '5432', '4321', '3210'].includes(pin);
        const isCommon = ['1234', '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999'].includes(pin);
        if (hasRepeated || isCommon) {
            return { level: 1, text: t('pin_weak'), color: 'text-red-500' };
        }
        if (isSequential) {
            return { level: 2, text: t('pin_fair'), color: 'text-yellow-500' };
        }
        return { level: 3, text: t('pin_strong'), color: 'text-green-500' };
    };
    const pinStrength = getPinStrength(newPin);
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(Header, { user: user }), _jsxs("div", { className: "container mx-auto px-4 py-8 max-w-md", children: [_jsxs("div", { className: "flex items-center mb-6", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => navigate('/profile-settings'), className: "mr-2", children: _jsx(ArrowLeft, { className: "w-4 h-4" }) }), _jsx("h1", { className: "text-2xl font-bold", children: t('change_transfer_pin') })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center", children: [_jsx(Shield, { className: "w-5 h-5 mr-2 text-blue-600" }), t('security_settings')] }), _jsx(CardDescription, { children: t('pin_security_description') })] }), _jsxs(CardContent, { children: [error && (_jsxs(Alert, { className: "mb-6 border-red-200 bg-red-50", children: [_jsx(AlertTriangle, { className: "w-4 h-4 text-red-600" }), _jsx(AlertDescription, { className: "text-red-700", children: error })] })), success && (_jsxs(Alert, { className: "mb-6 border-green-200 bg-green-50", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-green-600" }), _jsx(AlertDescription, { className: "text-green-700", children: success })] })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "currentPin", children: t('current_pin') }), _jsxs("div", { className: "relative", children: [_jsx(Input, { id: "currentPin", type: showCurrentPin ? "text" : "password", value: currentPin, onChange: (e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4)), placeholder: t('enter_current_pin'), maxLength: 4, className: "pr-10" }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", className: "absolute right-0 top-0 h-full px-3", onClick: () => setShowCurrentPin(!showCurrentPin), children: showCurrentPin ? _jsx(EyeOff, { className: "w-4 h-4" }) : _jsx(Eye, { className: "w-4 h-4" }) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "newPin", children: t('new_pin') }), _jsxs("div", { className: "relative", children: [_jsx(Input, { id: "newPin", type: showNewPin ? "text" : "password", value: newPin, onChange: (e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4)), placeholder: t('enter_new_pin'), maxLength: 4, className: "pr-10" }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", className: "absolute right-0 top-0 h-full px-3", onClick: () => setShowNewPin(!showNewPin), children: showNewPin ? _jsx(EyeOff, { className: "w-4 h-4" }) : _jsx(Eye, { className: "w-4 h-4" }) })] }), newPin && (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "flex space-x-1", children: [1, 2, 3].map((level) => (_jsx("div", { className: `h-1 w-8 rounded ${level <= pinStrength.level
                                                                        ? pinStrength.level === 1
                                                                            ? 'bg-red-500'
                                                                            : pinStrength.level === 2
                                                                                ? 'bg-yellow-500'
                                                                                : 'bg-green-500'
                                                                        : 'bg-gray-200'}` }, level))) }), _jsx("span", { className: `text-sm ${pinStrength.color}`, children: pinStrength.text })] }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "confirmPin", children: t('confirm_new_pin') }), _jsxs("div", { className: "relative", children: [_jsx(Input, { id: "confirmPin", type: showConfirmPin ? "text" : "password", value: confirmPin, onChange: (e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4)), placeholder: t('confirm_new_pin'), maxLength: 4, className: "pr-10" }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", className: "absolute right-0 top-0 h-full px-3", onClick: () => setShowConfirmPin(!showConfirmPin), children: showConfirmPin ? _jsx(EyeOff, { className: "w-4 h-4" }) : _jsx(Eye, { className: "w-4 h-4" }) })] }), confirmPin && newPin && confirmPin !== newPin && (_jsx("p", { className: "text-sm text-red-500", children: t('pins_do_not_match') }))] }), _jsxs("div", { className: "bg-blue-50 p-4 rounded-lg", children: [_jsx("h3", { className: "font-medium text-blue-900 mb-2", children: t('pin_security_tips') }), _jsxs("ul", { className: "text-sm text-blue-700 space-y-1", children: [_jsxs("li", { children: ["\u2022 ", t('pin_tip_1')] }), _jsxs("li", { children: ["\u2022 ", t('pin_tip_2')] }), _jsxs("li", { children: ["\u2022 ", t('pin_tip_3')] }), _jsxs("li", { children: ["\u2022 ", t('pin_tip_4')] })] })] }), _jsxs("div", { className: "flex space-x-3", children: [_jsx(Button, { type: "button", variant: "outline", className: "flex-1", onClick: () => navigate('/profile-settings'), children: t('cancel') }), _jsx(Button, { type: "submit", className: "flex-1", disabled: isLoading || !currentPin || !newPin || !confirmPin || newPin !== confirmPin, children: isLoading ? t('changing_pin') : t('change_pin') })] })] })] })] })] }), _jsx(Dialog, { open: showConfirmDialog, onOpenChange: setShowConfirmDialog, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center", children: [_jsx(Lock, { className: "w-5 h-5 mr-2 text-blue-600" }), t('confirm_pin_change')] }), _jsx(DialogDescription, { children: t('pin_change_confirmation_message') })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setShowConfirmDialog(false), disabled: isLoading, children: t('cancel') }), _jsx(Button, { onClick: confirmPinChange, disabled: isLoading, className: "bg-blue-600 hover:bg-blue-700", children: isLoading ? t('changing_pin') : t('confirm_change') })] })] }) })] }));
}
