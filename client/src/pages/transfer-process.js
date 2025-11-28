import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Clock, ArrowLeft, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
export default function TransferProcess({ transferData, onBack, onComplete }) {
    const { t } = useLanguage();
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(1); // 1: PIN, 2: Processing, 3: Pending
    const [pin, setPin] = useState("");
    const [showPin, setShowPin] = useState(false);
    const [pinError, setPinError] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [transactionId, setTransactionId] = useState("");
    const handlePinSubmit = async () => {
        // Verify PIN with backend
        try {
            const { authenticatedFetch } = await import('@/lib/queryClient');
            const verifyResponse = await authenticatedFetch('/api/verify-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            });
            if (!verifyResponse.ok) {
                console.error('PIN verification failed:', await verifyResponse.text());
                setPinError(t('invalid_pin_try_again'));
                toast({
                    title: 'Invalid PIN',
                    description: 'The PIN you entered is incorrect. Please try again.',
                    variant: 'destructive',
                });
                return;
            }
        }
        catch (error) {
            console.error('PIN verification error:', error);
            setPinError(t('invalid_pin_try_again'));
            toast({
                title: 'Verification failed',
                description: 'Unable to verify PIN. Please check your connection.',
                variant: 'destructive',
            });
            return;
        }
        setPinError("");
        setCurrentStep(2);
        setIsProcessing(true);
        // Generate transaction ID
        const txId = `WB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        setTransactionId(txId);
        try {
            const { authenticatedFetch } = await import('@/lib/queryClient');
            // Submit transfer for admin approval
            const response = await authenticatedFetch('/api/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...transferData,
                    transactionId: txId,
                    status: 'pending_approval'
                }),
            });
            if (response.ok) {
                // Processing complete, move to pending
                setTimeout(() => {
                    setIsProcessing(false);
                    setCurrentStep(3); // Move to pending status
                }, 2000);
            }
            else {
                const errorText = await response.text();
                console.error('Transfer submission failed:', errorText);
                throw new Error(errorText || 'Transfer submission failed');
            }
        }
        catch (error) {
            console.error('Transfer error:', error);
            setPinError(t('transfer_failed_try_again'));
            toast({
                title: 'Transfer failed',
                description: error instanceof Error ? error.message : 'Unable to process transfer. Please try again.',
                variant: 'destructive',
            });
            setIsProcessing(false);
            setCurrentStep(1);
        }
    };
    // Step 1: PIN Verification
    if (currentStep === 1) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center", children: _jsxs(Card, { className: "w-full max-w-md", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx("div", { className: "mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4", children: _jsx(Shield, { className: "w-8 h-8 text-blue-600" }) }), _jsx(CardTitle, { className: "text-xl font-semibold", children: t('verify_transfer_pin') }), _jsx("p", { className: "text-sm text-gray-600 mt-2", children: t('enter_4_digit_pin_to_authorize') })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "pin", children: t('transfer_pin') }), _jsxs("div", { className: "relative", children: [_jsx(Input, { id: "pin", type: showPin ? "text" : "password", value: pin, onChange: (e) => {
                                                    setPin(e.target.value);
                                                    setPinError("");
                                                }, maxLength: 4, placeholder: "\u2022\u2022\u2022\u2022", className: "text-center text-lg tracking-widest" }), _jsx("button", { type: "button", onClick: () => setShowPin(!showPin), className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600", children: showPin ? _jsx(EyeOff, { className: "w-4 h-4" }) : _jsx(Eye, { className: "w-4 h-4" }) })] }), pinError && (_jsxs("p", { className: "text-sm text-red-600 flex items-center", children: [_jsx(AlertCircle, { className: "w-4 h-4 mr-1" }), pinError] }))] }), _jsxs("div", { className: "flex space-x-3", children: [_jsxs(Button, { variant: "outline", onClick: onBack, className: "flex-1", children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }), t('back')] }), _jsx(Button, { onClick: handlePinSubmit, className: "flex-1", disabled: pin.length !== 4, children: t('verify_and_continue') })] })] })] }) }));
    }
    // Step 2: Processing
    if (currentStep === 2) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center", children: _jsxs(Card, { className: "w-full max-w-md", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx("div", { className: "mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4", children: _jsx(Clock, { className: "w-8 h-8 text-orange-600 animate-pulse" }) }), _jsx(CardTitle, { className: "text-xl font-semibold", children: t('processing_transfer') }), _jsx("p", { className: "text-sm text-gray-600 mt-2", children: t('processing_your_transfer_request') })] }), _jsx(CardContent, { className: "space-y-6", children: _jsxs("div", { className: "text-center", children: [_jsxs("div", { className: "text-lg font-medium text-gray-900 mb-2", children: [t('transaction_id'), ": ", transactionId] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-blue-600 h-2 rounded-full animate-pulse", style: { width: '75%' } }) }), _jsx("p", { className: "text-sm text-gray-500 mt-2", children: t('please_wait_processing') })] }) })] }) }));
    }
    // Step 3: Pending Admin Approval
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center", children: _jsxs(Card, { className: "w-full max-w-md", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx("div", { className: "mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4", children: _jsx(Clock, { className: "w-8 h-8 text-yellow-600" }) }), _jsx(CardTitle, { className: "text-xl font-semibold", children: t('transfer_pending') }), _jsx("p", { className: "text-sm text-gray-600 mt-2", children: t('transfer_submitted_for_review') })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsx("div", { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4", children: _jsxs("div", { className: "flex items-start", children: [_jsx(Clock, { className: "w-5 h-5 text-yellow-600 mr-3 mt-0.5" }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-yellow-800", children: t('awaiting_processing') }), _jsxs("p", { className: "text-sm text-yellow-700 mt-1", children: [t('transfer_id'), ": ", transactionId] }), _jsxs("p", { className: "text-sm text-yellow-700", children: [t('amount'), ": ", transferData?.currency, transferData?.amount] }), _jsxs("p", { className: "text-sm text-yellow-700", children: [t('recipient'), ": ", transferData?.recipientName] }), _jsxs("p", { className: "text-sm text-yellow-700", children: [t('bank'), ": ", transferData?.bankName] }), _jsx("p", { className: "text-sm text-yellow-700 mt-2", children: t('admin_will_review_shortly') })] })] }) }), _jsx("div", { className: "text-center", children: _jsx(Button, { onClick: onComplete, className: "w-full", children: t('return_to_dashboard') }) })] })] }) }));
}
