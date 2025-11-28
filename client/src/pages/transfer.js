import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { COUNTRIES } from "@/data/countries";
import { Send, Globe, Building, Smartphone, Users, Clock, Shield } from "lucide-react";
export default function Transfer() {
    const { t } = useLanguage();
    const { userProfile } = useAuth();
    // Fetch user data with proper email parameter
    const { data: user, isLoading } = useQuery({
        queryKey: ['/api/user', userProfile?.email],
        queryFn: async () => {
            if (!userProfile?.email)
                return null;
            const { authenticatedFetch } = await import('@/lib/queryClient');
            const response = await authenticatedFetch(`/api/user?email=${encodeURIComponent(userProfile.email)}`);
            if (!response.ok)
                throw new Error('Failed to fetch user');
            return response.json();
        },
        enabled: !!userProfile?.email
    });
    const [amount, setAmount] = useState("");
    const [transferType, setTransferType] = useState("international");
    const [isProcessing, setIsProcessing] = useState(false);
    const [showPinVerification, setShowPinVerification] = useState(false);
    const [transferPin, setTransferPin] = useState("");
    const [pinError, setPinError] = useState("");
    const [showPendingStatus, setShowPendingStatus] = useState(false);
    const [transferReference, setTransferReference] = useState("");
    // International transfer details
    const [recipientDetails, setRecipientDetails] = useState({
        fullName: "",
        address: "",
        city: "",
        state: "",
        country: "",
        postalCode: "",
        phoneNumber: "",
        email: "",
        bankName: "",
        bankAddress: "",
        swiftCode: "",
        iban: "",
        accountNumber: "",
        routingNumber: "",
        purpose: "",
        relationship: ""
    });
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsx("div", { className: "text-gray-600", children: t('loading') }) }));
    }
    const quickTransferOptions = [
        { icon: Globe, label: "International Wire", description: "SWIFT transfers worldwide", action: () => setTransferType("international") },
        { icon: Building, label: "Cross-Border Bank", description: "Bank to bank transfers", action: () => setTransferType("bank") },
        { icon: Smartphone, label: "Global Mobile Money", description: "190+ countries coverage", action: () => setTransferType("mobile") },
        { icon: Send, label: "Express Transfer", description: "Fast international delivery", action: () => setTransferType("express") }
    ];
    const recentContacts = [
        { name: "John Smith", account: "****1234", lastAmount: "$500" },
        { name: "Sarah Wilson", account: "****5678", lastAmount: "$1,200" },
        { name: "Mike Chen", account: "****9012", lastAmount: "$750" }
    ];
    const handleTransfer = () => {
        if (!amount || !recipientDetails.fullName || !recipientDetails.accountNumber) {
            setPinError("Please fill in all required fields: amount, recipient name, and account number");
            return;
        }
        // Validate amount is positive number
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setPinError("Please enter a valid positive amount");
            return;
        }
        // Show PIN verification modal
        setShowPinVerification(true);
    };
    const verifyPinAndTransfer = async () => {
        if (!transferPin || transferPin.length !== 4) {
            setPinError("Please enter a 4-digit PIN");
            return;
        }
        // Validate PIN is numeric
        if (!/^\d{4}$/.test(transferPin)) {
            setPinError("PIN must be exactly 4 digits");
            return;
        }
        // Verify PIN with backend
        try {
            const { authenticatedFetch } = await import('@/lib/queryClient');
            const pinResponse = await authenticatedFetch('/api/verify-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: userProfile?.email || user?.email,
                    pin: transferPin
                })
            });
            const pinResult = await pinResponse.json();
            if (!pinResult.success) {
                setPinError("Invalid PIN");
                return;
            }
        }
        catch (error) {
            setPinError("PIN verification failed");
            return;
        }
        setPinError("");
        setIsProcessing(true);
        try {
            // Verify PIN and create transfer request
            const transferData = {
                amount: parseFloat(amount),
                recipientName: recipientDetails.fullName,
                recipientAccount: recipientDetails.accountNumber,
                recipientCountry: recipientDetails.country,
                bankName: recipientDetails.bankName,
                swiftCode: recipientDetails.swiftCode,
                transferPurpose: recipientDetails.purpose,
                transferPin: transferPin,
                userEmail: userProfile?.email || user?.email,
                status: "pending_approval",
                requiresApproval: parseFloat(amount) >= 10000 // Transfers over $10k require support team approval
            };
            const { authenticatedFetch } = await import('@/lib/queryClient');
            const response = await authenticatedFetch('/api/transfers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transferData)
            });
            if (response.ok) {
                const result = await response.json();
                setShowPinVerification(false);
                setTransferPin("");
                setTransferReference(result.transactionId || result.id || `WB-${Date.now()}`);
                // Show pending status instead of alert
                setShowPendingStatus(true);
                // Reset form
                setAmount("");
                setRecipientDetails({
                    fullName: "",
                    address: "",
                    city: "",
                    state: "",
                    country: "",
                    postalCode: "",
                    phoneNumber: "",
                    email: "",
                    bankName: "",
                    bankAddress: "",
                    swiftCode: "",
                    iban: "",
                    accountNumber: "",
                    routingNumber: "",
                    purpose: "",
                    relationship: ""
                });
            }
            else {
                const error = await response.json();
                setPinError(error.message || "Invalid PIN. Please verify your 4-digit transfer PIN.");
            }
        }
        catch (error) {
            setPinError("Network connection error. Check your internet and try again.");
        }
        finally {
            setIsProcessing(false);
        }
    };
    // Show pending status interface
    if (showPendingStatus) {
        return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(Header, { user: userProfile || undefined }), _jsx("div", { className: "px-4 py-6 pb-20", children: _jsx("div", { className: "max-w-md mx-auto", children: _jsx(Card, { className: "text-center", children: _jsxs(CardContent, { className: "pt-6", children: [_jsxs("div", { className: "mb-6", children: [_jsx("div", { className: "w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Clock, { className: "w-10 h-10 text-orange-600 animate-spin" }) }), _jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-2", children: "Transfer Processing" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Your international transfer is being processed securely through our banking network." })] }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-4 mb-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Reference Number" }), _jsx("span", { className: "font-mono text-sm font-medium", children: transferReference })] }), _jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Status" }), _jsx("span", { className: "text-sm font-medium text-orange-600", children: "Processing" })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Estimated Time" }), _jsx("span", { className: "text-sm font-medium", children: "1-3 business days" })] })] }), _jsxs("div", { className: "text-left space-y-3 mb-6", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-2 h-2 bg-green-500 rounded-full mr-3" }), _jsx("span", { className: "text-sm text-gray-700", children: "Transfer request verified" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-2 h-2 bg-orange-500 rounded-full mr-3 animate-pulse" }), _jsx("span", { className: "text-sm text-gray-700", children: "Compliance review in progress" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-2 h-2 bg-gray-300 rounded-full mr-3" }), _jsx("span", { className: "text-sm text-gray-500", children: "Processing to recipient bank" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-2 h-2 bg-gray-300 rounded-full mr-3" }), _jsx("span", { className: "text-sm text-gray-500", children: "Transfer completed" })] })] }), _jsxs("div", { className: "flex space-x-3", children: [_jsx(Button, { variant: "outline", className: "flex-1", onClick: () => setShowPendingStatus(false), children: "New Transfer" }), _jsx(Button, { className: "flex-1 bg-blue-600 hover:bg-blue-700 text-white", children: "Track Transfer" })] })] }) }) }) }), _jsx(BottomNavigation, {})] }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(Header, { user: userProfile || user }), _jsxs("div", { className: "px-4 py-6 pb-20", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold text-gray-900", children: "International Money Transfer" }), _jsx("p", { className: "text-sm text-gray-600", children: "Send money worldwide with complete recipient details" })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsxs(Badge, { className: "bg-green-100 text-green-800", children: [_jsx(Shield, { className: "w-3 h-3 mr-1" }), "Secure"] }), _jsxs(Badge, { className: "bg-blue-100 text-blue-800", children: [_jsx(Globe, { className: "w-3 h-3 mr-1" }), "190+ Countries"] })] })] }), _jsxs(Card, { className: "mb-6", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Transfer Options" }) }), _jsx(CardContent, { children: _jsx("div", { className: "grid grid-cols-2 gap-3", children: quickTransferOptions.map((option, index) => (_jsxs(Button, { variant: "outline", onClick: option.action, className: `h-20 flex flex-col items-center space-y-2 ${transferType === option.label.toLowerCase().replace(" ", "") ? 'border-blue-500 bg-blue-50' : ''}`, children: [_jsx(option.icon, { className: "w-6 h-6" }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-xs font-medium", children: option.label }), _jsx("div", { className: "text-xs text-gray-500", children: option.description })] })] }, index))) }) })] }), _jsxs(Card, { className: "mb-6", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "International Transfer Details" }) }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "bg-blue-50 p-4 rounded-lg", children: [_jsx(Label, { htmlFor: "amount", className: "text-lg font-semibold", children: "Transfer Amount (USD)" }), _jsx(Input, { id: "amount", type: "number", placeholder: "0.00", value: amount, onChange: (e) => setAmount(e.target.value), className: "text-2xl font-bold text-center mt-2" }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Exchange rate: 1 USD = 1.00 USD \u2022 Fee: $15.00" })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-lg mb-3 text-gray-800", children: "Recipient Information" }), _jsxs("div", { className: "grid grid-cols-1 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "fullName", children: "Full Name *" }), _jsx(Input, { id: "fullName", placeholder: "John Smith", value: recipientDetails.fullName, onChange: (e) => setRecipientDetails(prev => ({ ...prev, fullName: e.target.value })) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "country", children: "Country *" }), _jsxs(Select, { value: recipientDetails.country, onValueChange: (value) => setRecipientDetails(prev => ({ ...prev, country: value })), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select country" }) }), _jsx(SelectContent, { children: COUNTRIES.map(country => (_jsx(SelectItem, { value: country, children: country }, country))) })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "phoneNumber", children: "Phone Number" }), _jsx(Input, { id: "phoneNumber", placeholder: "+1 555 123 4567", value: recipientDetails.phoneNumber, onChange: (e) => setRecipientDetails(prev => ({ ...prev, phoneNumber: e.target.value })) })] })] })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-lg mb-3 text-gray-800", children: "Bank Information" }), _jsxs("div", { className: "grid grid-cols-1 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "bankName", children: "Bank Name" }), _jsx(Input, { id: "bankName", placeholder: "JPMorgan Chase Bank", value: recipientDetails.bankName, onChange: (e) => setRecipientDetails(prev => ({ ...prev, bankName: e.target.value })) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "bankAddress", children: "Bank Address" }), _jsx(Input, { id: "bankAddress", placeholder: "270 Park Avenue, New York, NY 10017", value: recipientDetails.bankAddress, onChange: (e) => setRecipientDetails(prev => ({ ...prev, bankAddress: e.target.value })) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "swiftCode", children: "SWIFT/BIC Code" }), _jsx(Input, { id: "swiftCode", placeholder: "CHASUS33", value: recipientDetails.swiftCode, onChange: (e) => setRecipientDetails(prev => ({ ...prev, swiftCode: e.target.value })) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "iban", children: "IBAN (if applicable)" }), _jsx(Input, { id: "iban", placeholder: "GB82 WEST 1234 5698 7654 32", value: recipientDetails.iban, onChange: (e) => setRecipientDetails(prev => ({ ...prev, iban: e.target.value })) })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "accountNumber", children: "Account Number" }), _jsx(Input, { id: "accountNumber", placeholder: "123456789", value: recipientDetails.accountNumber, onChange: (e) => setRecipientDetails(prev => ({ ...prev, accountNumber: e.target.value })) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "routingNumber", children: "Routing Number (US)" }), _jsx(Input, { id: "routingNumber", placeholder: "021000021", value: recipientDetails.routingNumber, onChange: (e) => setRecipientDetails(prev => ({ ...prev, routingNumber: e.target.value })) })] })] })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-lg mb-3 text-gray-800", children: "Transfer Purpose" }), _jsxs("div", { className: "grid grid-cols-1 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "purpose", children: "Purpose of Transfer" }), _jsxs(Select, { value: recipientDetails.purpose, onValueChange: (value) => setRecipientDetails(prev => ({ ...prev, purpose: value })), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select purpose" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "family_support", children: "Family Support" }), _jsx(SelectItem, { value: "education", children: "Education Expenses" }), _jsx(SelectItem, { value: "medical", children: "Medical Expenses" }), _jsx(SelectItem, { value: "business", children: "Business Payment" }), _jsx(SelectItem, { value: "investment", children: "Investment" }), _jsx(SelectItem, { value: "property", children: "Property Purchase" }), _jsx(SelectItem, { value: "gift", children: "Gift" }), _jsx(SelectItem, { value: "loan_repayment", children: "Loan Repayment" }), _jsx(SelectItem, { value: "other", children: "Other" })] })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "relationship", children: "Relationship to Recipient" }), _jsxs(Select, { value: recipientDetails.relationship, onValueChange: (value) => setRecipientDetails(prev => ({ ...prev, relationship: value })), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select relationship" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "family", children: "Family Member" }), _jsx(SelectItem, { value: "friend", children: "Friend" }), _jsx(SelectItem, { value: "business_partner", children: "Business Partner" }), _jsx(SelectItem, { value: "employee", children: "Employee" }), _jsx(SelectItem, { value: "service_provider", children: "Service Provider" }), _jsx(SelectItem, { value: "myself", children: "Myself" }), _jsx(SelectItem, { value: "other", children: "Other" })] })] })] })] })] }), _jsxs("div", { className: "bg-gray-50 p-4 rounded-lg", children: [_jsx("h3", { className: "font-semibold text-lg mb-3", children: "Transfer Summary" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Transfer Amount:" }), _jsxs("span", { className: "font-medium", children: ["$", amount || "0.00", " USD"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Transfer Fee:" }), _jsx("span", { className: "font-medium", children: "$15.00 USD" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Exchange Rate:" }), _jsx("span", { className: "font-medium", children: "1.0000" })] }), _jsxs("div", { className: "flex justify-between border-t pt-2 font-semibold", children: [_jsx("span", { children: "Total Debit:" }), _jsxs("span", { children: ["$", amount ? (parseFloat(amount) + 15).toFixed(2) : "15.00", " USD"] })] }), _jsxs("div", { className: "flex justify-between font-semibold text-green-600", children: [_jsx("span", { children: "Recipient Receives:" }), _jsxs("span", { children: ["$", amount || "0.00", " USD"] })] })] })] }), _jsx(Button, { onClick: handleTransfer, disabled: !amount || !recipientDetails.fullName || !recipientDetails.accountNumber || isProcessing, className: "w-full bg-blue-600 text-white h-12 hover:bg-blue-700", children: isProcessing ? (_jsxs(_Fragment, { children: [_jsx(Clock, { className: "w-4 h-4 mr-2 animate-spin" }), "Processing Transfer..."] })) : (_jsxs(_Fragment, { children: [_jsx(Globe, { className: "w-4 h-4 mr-2" }), "Send $", amount || "0.00", " Internationally"] })) }), showPinVerification && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg p-6 w-full max-w-md mx-4", children: [_jsxs("div", { className: "text-center mb-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "Enter Transfer PIN" }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Please enter your 4-digit PIN to authorize this $", amount, " transfer"] })] }), _jsxs("div", { className: "mb-4", children: [_jsx("input", { type: "password", value: transferPin, onChange: (e) => setTransferPin(e.target.value.replace(/\D/g, '').slice(0, 4)), className: "w-full text-center text-2xl tracking-widest p-4 border border-gray-300 rounded-lg", placeholder: "****", maxLength: 4, autoFocus: true }), pinError && (_jsx("p", { className: "text-red-600 text-sm mt-2 text-center", children: pinError }))] }), _jsxs("div", { className: "flex space-x-3", children: [_jsx(Button, { variant: "outline", onClick: () => {
                                                                setShowPinVerification(false);
                                                                setTransferPin("");
                                                                setPinError("");
                                                            }, className: "flex-1", disabled: isProcessing, children: "Cancel" }), _jsx(Button, { onClick: verifyPinAndTransfer, disabled: transferPin.length !== 4 || isProcessing, className: "flex-1 bg-blue-600 hover:bg-blue-700 text-white", children: isProcessing ? "Processing..." : "Confirm Transfer" })] })] }) }))] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Recent Contacts" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-3", children: recentContacts.map((contact, index) => (_jsxs("div", { className: "flex items-center justify-between p-3 border rounded-lg", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center", children: _jsx(Users, { className: "w-5 h-5 text-blue-600" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: contact.name }), _jsx("p", { className: "text-sm text-gray-600", children: contact.account })] })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "text-sm text-gray-500", children: ["Last: ", contact.lastAmount] }), _jsx(Button, { size: "sm", variant: "outline", onClick: () => setRecipientDetails(prev => ({ ...prev, fullName: contact.name })), children: "Select" })] })] }, index))) }) })] })] }), _jsx(BottomNavigation, {})] }));
}
